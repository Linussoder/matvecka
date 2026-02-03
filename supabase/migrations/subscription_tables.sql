-- Subscription System Tables for Matvecka
-- Run this SQL in your Supabase SQL Editor

-- =====================================================
-- User Subscriptions Table
-- Stores Stripe subscription data for each user
-- =====================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'cancelled', 'past_due', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- =====================================================
-- Usage Tracking Table
-- Tracks feature usage per month for free tier limits
-- =====================================================
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL, -- First day of the month
  meal_plans_generated INTEGER DEFAULT 0,
  recipes_regenerated INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON usage_tracking(user_id, period_start);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- User Subscriptions: Users can only read their own subscription
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- User Subscriptions: Only service role can insert/update (via API)
CREATE POLICY "Service role can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Usage Tracking: Users can only read their own usage
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Usage Tracking: Only service role can insert/update (via API)
CREATE POLICY "Service role can manage usage"
  ON usage_tracking FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get current month's usage for a user
CREATE OR REPLACE FUNCTION get_current_usage(p_user_id UUID)
RETURNS TABLE (
  meal_plans_generated INTEGER,
  recipes_regenerated INTEGER,
  favorites_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(u.meal_plans_generated, 0),
    COALESCE(u.recipes_regenerated, 0),
    COALESCE(u.favorites_count, 0)
  FROM usage_tracking u
  WHERE u.user_id = p_user_id
    AND u.period_start = DATE_TRUNC('month', CURRENT_DATE)::DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment meal plan count
CREATE OR REPLACE FUNCTION increment_meal_plan_usage(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, period_start, meal_plans_generated)
  VALUES (p_user_id, DATE_TRUNC('month', CURRENT_DATE)::DATE, 1)
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET
    meal_plans_generated = usage_tracking.meal_plans_generated + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment recipe regeneration count
CREATE OR REPLACE FUNCTION increment_recipe_regen_usage(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, period_start, recipes_regenerated)
  VALUES (p_user_id, DATE_TRUNC('month', CURRENT_DATE)::DATE, 1)
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET
    recipes_regenerated = usage_tracking.recipes_regenerated + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is premium
CREATE OR REPLACE FUNCTION is_premium_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan TEXT;
  v_status TEXT;
  v_period_end TIMESTAMPTZ;
BEGIN
  SELECT plan, status, current_period_end
  INTO v_plan, v_status, v_period_end
  FROM user_subscriptions
  WHERE user_id = p_user_id;

  -- User is premium if:
  -- 1. Plan is 'premium' AND
  -- 2. Status is 'active' or 'trialing' AND
  -- 3. Current period hasn't ended
  RETURN v_plan = 'premium'
    AND v_status IN ('active', 'trialing')
    AND (v_period_end IS NULL OR v_period_end > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
