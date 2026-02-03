-- Referral System Tables for Matvecka
-- Run this SQL in your Supabase SQL Editor

-- =====================================================
-- Referral Codes Table
-- Stores unique referral codes for each user
-- =====================================================
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(12) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(code)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);

-- =====================================================
-- Referrals Table
-- Tracks who referred whom
-- =====================================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code_id UUID REFERENCES referral_codes(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  referrer_rewarded BOOLEAN DEFAULT false,
  referred_rewarded BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id) -- Each user can only be referred once
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- =====================================================
-- Premium Credits Table
-- Stores bonus premium days (separate from Stripe subscription)
-- =====================================================
CREATE TABLE IF NOT EXISTS premium_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  days_amount INTEGER NOT NULL CHECK (days_amount > 0),
  source TEXT NOT NULL CHECK (source IN ('referral_bonus', 'referred_welcome', 'promo', 'admin')),
  source_reference_id UUID, -- Links to referral id or promo id
  expires_at TIMESTAMPTZ NOT NULL,
  consumed BOOLEAN DEFAULT false,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_premium_credits_user_id ON premium_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_credits_expires_at ON premium_credits(expires_at);
CREATE INDEX IF NOT EXISTS idx_premium_credits_active ON premium_credits(user_id, consumed, expires_at);

-- =====================================================
-- Referral Stats Table (Cached for performance)
-- =====================================================
CREATE TABLE IF NOT EXISTS referral_stats (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  total_invited INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  total_days_earned INTEGER DEFAULT 0,
  last_referral_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_stats ENABLE ROW LEVEL SECURITY;

-- Referral Codes: Users can view their own code
CREATE POLICY "Users can view own referral code"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Referral Codes: Service role can manage all
CREATE POLICY "Service role can manage referral codes"
  ON referral_codes FOR ALL
  USING (auth.role() = 'service_role');

-- Referrals: Users can view referrals they made
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Referrals: Service role can manage all
CREATE POLICY "Service role can manage referrals"
  ON referrals FOR ALL
  USING (auth.role() = 'service_role');

-- Premium Credits: Users can view their own credits
CREATE POLICY "Users can view own credits"
  ON premium_credits FOR SELECT
  USING (auth.uid() = user_id);

-- Premium Credits: Service role can manage all
CREATE POLICY "Service role can manage credits"
  ON premium_credits FOR ALL
  USING (auth.role() = 'service_role');

-- Referral Stats: Users can view their own stats
CREATE POLICY "Users can view own referral stats"
  ON referral_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Referral Stats: Service role can manage all
CREATE POLICY "Service role can manage referral stats"
  ON referral_stats FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- Helper Functions
-- =====================================================

-- Generate a unique referral code (8 characters, alphanumeric, no confusing chars)
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(12) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No 0, O, I, L, 1
  result VARCHAR(12) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get user's active premium credit days remaining
CREATE OR REPLACE FUNCTION get_premium_credit_days(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_days INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(
    GREATEST(0, CEIL(EXTRACT(EPOCH FROM (expires_at - NOW())) / 86400))::INTEGER
  ), 0)
  INTO total_days
  FROM premium_credits
  WHERE user_id = p_user_id
    AND consumed = false
    AND expires_at > NOW();

  RETURN total_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has active premium (subscription OR credits)
CREATE OR REPLACE FUNCTION has_premium_access(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_subscription BOOLEAN;
  has_credits BOOLEAN;
BEGIN
  -- Check Stripe subscription first
  SELECT EXISTS(
    SELECT 1 FROM user_subscriptions
    WHERE user_id = p_user_id
      AND plan = 'premium'
      AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL OR current_period_end > NOW())
  ) INTO has_subscription;

  IF has_subscription THEN
    RETURN true;
  END IF;

  -- Check premium credits
  SELECT EXISTS(
    SELECT 1 FROM premium_credits
    WHERE user_id = p_user_id
      AND consumed = false
      AND expires_at > NOW()
  ) INTO has_credits;

  RETURN has_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate referral statistics for a user
CREATE OR REPLACE FUNCTION calculate_referral_stats(p_user_id UUID)
RETURNS TABLE (
  total_invited INTEGER,
  total_converted INTEGER,
  total_days_earned INTEGER,
  last_referral_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_invited,
    COUNT(*) FILTER (WHERE r.status = 'completed')::INTEGER as total_converted,
    (COUNT(*) FILTER (WHERE r.status = 'completed') * 7)::INTEGER as total_days_earned,
    MAX(r.completed_at) as last_referral_at
  FROM referrals r
  WHERE r.referrer_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers
-- =====================================================

-- Update updated_at on referrals
CREATE TRIGGER referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Update updated_at on referral_stats
CREATE TRIGGER referral_stats_updated_at
  BEFORE UPDATE ON referral_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
