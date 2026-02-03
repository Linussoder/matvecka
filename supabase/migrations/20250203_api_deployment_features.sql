-- API Usage Monitoring & Deployment Features
-- Migration: 20250203_api_deployment_features.sql

-- =====================================================
-- API USAGE MONITORING
-- =====================================================

-- API Usage Logs - Individual API call tracking
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  response_time_ms INTEGER NOT NULL DEFAULT 0,
  status_code INTEGER NOT NULL DEFAULT 200,
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Usage Daily Stats - Aggregated statistics
CREATE TABLE IF NOT EXISTS api_usage_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  endpoint TEXT NOT NULL,
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_input_tokens INTEGER NOT NULL DEFAULT 0,
  total_output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (total_input_tokens + total_output_tokens) STORED,
  total_cost_usd DECIMAL(10, 4) NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, endpoint)
);

-- =====================================================
-- DEPLOYMENT TRACKING
-- =====================================================

-- Deployment Log - Track deployments
CREATE TABLE IF NOT EXISTS deployment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commit_sha TEXT NOT NULL,
  commit_message TEXT,
  branch TEXT NOT NULL DEFAULT 'main',
  environment TEXT NOT NULL DEFAULT 'production',
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  deployed_by TEXT,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('pending', 'building', 'success', 'failed', 'cancelled')),
  rollback_of UUID REFERENCES deployment_log(id),
  vercel_deployment_id TEXT,
  build_time_seconds INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- API Usage Logs indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_response_time ON api_usage_logs(response_time_ms DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);

-- API Usage Daily Stats indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_daily_stats_date ON api_usage_daily_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_daily_stats_endpoint ON api_usage_daily_stats(endpoint);

-- Deployment Log indexes
CREATE INDEX IF NOT EXISTS idx_deployment_log_deployed_at ON deployment_log(deployed_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployment_log_environment ON deployment_log(environment);
CREATE INDEX IF NOT EXISTS idx_deployment_log_status ON deployment_log(status);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_log ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for admin operations)
CREATE POLICY "Service role full access on api_usage_logs" ON api_usage_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access on api_usage_daily_stats" ON api_usage_daily_stats
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access on deployment_log" ON deployment_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to aggregate daily stats
CREATE OR REPLACE FUNCTION aggregate_api_usage_daily()
RETURNS void AS $$
BEGIN
  INSERT INTO api_usage_daily_stats (date, endpoint, total_requests, total_input_tokens, total_output_tokens, total_cost_usd, avg_response_time_ms, error_count)
  SELECT
    DATE(created_at) as date,
    endpoint,
    COUNT(*) as total_requests,
    SUM(input_tokens) as total_input_tokens,
    SUM(output_tokens) as total_output_tokens,
    SUM(cost_usd) as total_cost_usd,
    AVG(response_time_ms)::INTEGER as avg_response_time_ms,
    COUNT(*) FILTER (WHERE status_code >= 400) as error_count
  FROM api_usage_logs
  WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY DATE(created_at), endpoint
  ON CONFLICT (date, endpoint)
  DO UPDATE SET
    total_requests = EXCLUDED.total_requests,
    total_input_tokens = EXCLUDED.total_input_tokens,
    total_output_tokens = EXCLUDED.total_output_tokens,
    total_cost_usd = EXCLUDED.total_cost_usd,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    error_count = EXCLUDED.error_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
