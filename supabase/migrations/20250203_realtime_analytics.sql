-- Real-Time Analytics Enhancement Tables
-- Session recordings, A/B testing, and realtime subscriptions

-- Session recordings for user replay
CREATE TABLE IF NOT EXISTS session_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  events JSONB NOT NULL DEFAULT '[]',
  page_url TEXT,
  user_agent TEXT,
  duration_seconds INTEGER,
  device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
  pages_visited INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B experiments
CREATE TABLE IF NOT EXISTS ab_experiments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  metric TEXT NOT NULL,
  variants JSONB NOT NULL DEFAULT '[{"id": "control", "name": "Control", "weight": 50}, {"id": "variant_b", "name": "Variant B", "weight": 50}]',
  traffic_percentage INTEGER DEFAULT 100 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  winner_variant TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User experiment assignments
CREATE TABLE IF NOT EXISTS ab_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL,
  converted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

-- Revenue metrics history (for tracking MRR over time)
CREATE TABLE IF NOT EXISTS revenue_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  mrr DECIMAL(12,2) DEFAULT 0,
  arr DECIMAL(12,2) DEFAULT 0,
  active_subscriptions INTEGER DEFAULT 0,
  monthly_subscriptions INTEGER DEFAULT 0,
  annual_subscriptions INTEGER DEFAULT 0,
  new_subscriptions INTEGER DEFAULT 0,
  churned_subscriptions INTEGER DEFAULT 0,
  churn_rate DECIMAL(5,2) DEFAULT 0,
  ltv DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohort data cache (pre-calculated for performance)
CREATE TABLE IF NOT EXISTS cohort_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cohort_month DATE NOT NULL,
  month_offset INTEGER NOT NULL,
  cohort_size INTEGER NOT NULL,
  retained_users INTEGER NOT NULL,
  retention_rate DECIMAL(5,2) NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_month, month_offset)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_recordings_session ON session_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_recordings_user ON session_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_session_recordings_date ON session_recordings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ab_experiments_status ON ab_experiments(status);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_name ON ab_experiments(name);

CREATE INDEX IF NOT EXISTS idx_ab_assignments_experiment ON ab_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_user ON ab_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_session ON ab_assignments(session_id);

CREATE INDEX IF NOT EXISTS idx_revenue_metrics_date ON revenue_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_cohort_data_month ON cohort_data(cohort_month DESC);

-- Unique constraints for A/B assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_ab_assignments_user_experiment
  ON ab_assignments(user_id, experiment_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ab_assignments_session_experiment
  ON ab_assignments(session_id, experiment_id) WHERE session_id IS NOT NULL AND user_id IS NULL;

-- Enable RLS
ALTER TABLE session_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role access)
CREATE POLICY "service_role_session_recordings" ON session_recordings FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_ab_experiments" ON ab_experiments FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_ab_assignments" ON ab_assignments FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_revenue_metrics" ON revenue_metrics FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_cohort_data" ON cohort_data FOR ALL TO service_role USING (true);

-- Enable Supabase Realtime for analytics_events and meal_plans
-- Note: Run this in Supabase Dashboard SQL Editor
-- ALTER PUBLICATION supabase_realtime ADD TABLE analytics_events;
-- ALTER PUBLICATION supabase_realtime ADD TABLE meal_plans;

-- Function to calculate daily revenue metrics
CREATE OR REPLACE FUNCTION calculate_daily_revenue()
RETURNS void AS $$
DECLARE
  today DATE := CURRENT_DATE;
  total_monthly INTEGER;
  total_annual INTEGER;
  total_active INTEGER;
  new_subs INTEGER;
  churned INTEGER;
  current_mrr DECIMAL(12,2);
BEGIN
  -- Count subscriptions by type
  SELECT
    COUNT(*) FILTER (WHERE plan = 'premium' AND status IN ('active', 'trialing')),
    COUNT(*) FILTER (WHERE plan = 'premium' AND status IN ('active', 'trialing') AND stripe_subscription_id NOT LIKE '%yearly%'),
    COUNT(*) FILTER (WHERE plan = 'premium' AND status IN ('active', 'trialing') AND stripe_subscription_id LIKE '%yearly%')
  INTO total_active, total_monthly, total_annual
  FROM user_subscriptions;

  -- Calculate MRR (monthly * 59 + annual * 499/12)
  current_mrr := (total_monthly * 59) + (total_annual * 499.0 / 12);

  -- Count new subscriptions today
  SELECT COUNT(*) INTO new_subs
  FROM user_subscriptions
  WHERE DATE(created_at) = today AND plan = 'premium';

  -- Count churned subscriptions today
  SELECT COUNT(*) INTO churned
  FROM user_subscriptions
  WHERE DATE(updated_at) = today AND status = 'cancelled';

  -- Insert or update today's metrics
  INSERT INTO revenue_metrics (date, mrr, arr, active_subscriptions, monthly_subscriptions, annual_subscriptions, new_subscriptions, churned_subscriptions, churn_rate, ltv)
  VALUES (
    today,
    current_mrr,
    current_mrr * 12,
    total_active,
    total_monthly,
    total_annual,
    new_subs,
    churned,
    CASE WHEN total_active > 0 THEN (churned::DECIMAL / total_active * 100) ELSE 0 END,
    CASE WHEN churned > 0 THEN (current_mrr / churned * 12) ELSE current_mrr * 12 END
  )
  ON CONFLICT (date) DO UPDATE SET
    mrr = EXCLUDED.mrr,
    arr = EXCLUDED.arr,
    active_subscriptions = EXCLUDED.active_subscriptions,
    monthly_subscriptions = EXCLUDED.monthly_subscriptions,
    annual_subscriptions = EXCLUDED.annual_subscriptions,
    new_subscriptions = EXCLUDED.new_subscriptions,
    churned_subscriptions = EXCLUDED.churned_subscriptions,
    churn_rate = EXCLUDED.churn_rate,
    ltv = EXCLUDED.ltv;
END;
$$ LANGUAGE plpgsql;
