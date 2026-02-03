-- Migration: Promo Code System
-- Allows admins to create discount codes for marketing campaigns

-- Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Code details
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,

  -- Discount type and value
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_days', 'trial_extension')),
  discount_value INTEGER NOT NULL, -- percentage (0-100), amount in kr, or days

  -- Usage limits
  max_uses INTEGER, -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,

  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  -- Targeting
  new_users_only BOOLEAN DEFAULT false,
  min_plan_months INTEGER DEFAULT 1, -- minimum subscription length to apply

  -- Stripe integration
  stripe_coupon_id TEXT, -- If synced with Stripe

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo code redemptions tracking
CREATE TABLE IF NOT EXISTS promo_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Redemption details
  discount_applied INTEGER NOT NULL, -- Actual discount applied
  discount_type TEXT NOT NULL,

  -- Related records
  subscription_id TEXT, -- Stripe subscription ID if applicable
  premium_credit_id UUID REFERENCES premium_credits(id), -- If free_days type

  -- Timestamps
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate redemptions per user per code
  UNIQUE(promo_code_id, user_id)
);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;

-- Promo codes policies (admin-only for management, public for validation)
CREATE POLICY "Anyone can read active promo codes" ON promo_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage promo codes" ON promo_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Redemptions policies
CREATE POLICY "Users can view own redemptions" ON promo_redemptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own redemptions" ON promo_redemptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON promo_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_code ON promo_redemptions(promo_code_id);

-- Function to validate a promo code
CREATE OR REPLACE FUNCTION validate_promo_code(
  p_code TEXT,
  p_user_id UUID
) RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT,
  promo_code_id UUID,
  discount_type TEXT,
  discount_value INTEGER,
  description TEXT
) AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_user_redemptions INTEGER;
  v_user_created_at TIMESTAMPTZ;
BEGIN
  -- Find the promo code
  SELECT * INTO v_promo FROM promo_codes
  WHERE UPPER(code) = UPPER(p_code) AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Ogiltig kampanjkod'::TEXT, NULL::UUID, NULL::TEXT, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;

  -- Check validity dates
  IF v_promo.valid_from > NOW() THEN
    RETURN QUERY SELECT false, 'Kampanjkoden är inte aktiv än'::TEXT, NULL::UUID, NULL::TEXT, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;

  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < NOW() THEN
    RETURN QUERY SELECT false, 'Kampanjkoden har gått ut'::TEXT, NULL::UUID, NULL::TEXT, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;

  -- Check max uses
  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN QUERY SELECT false, 'Kampanjkoden har nått maxgränsen'::TEXT, NULL::UUID, NULL::TEXT, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;

  -- Check user-specific limits
  IF p_user_id IS NOT NULL THEN
    -- Check per-user limit
    SELECT COUNT(*) INTO v_user_redemptions
    FROM promo_redemptions
    WHERE promo_code_id = v_promo.id AND user_id = p_user_id;

    IF v_user_redemptions >= v_promo.max_uses_per_user THEN
      RETURN QUERY SELECT false, 'Du har redan använt denna kampanjkod'::TEXT, NULL::UUID, NULL::TEXT, NULL::INTEGER, NULL::TEXT;
      RETURN;
    END IF;

    -- Check new users only
    IF v_promo.new_users_only THEN
      SELECT created_at INTO v_user_created_at FROM auth.users WHERE id = p_user_id;
      IF v_user_created_at < NOW() - INTERVAL '7 days' THEN
        RETURN QUERY SELECT false, 'Kampanjkoden gäller endast nya användare'::TEXT, NULL::UUID, NULL::TEXT, NULL::INTEGER, NULL::TEXT;
        RETURN;
      END IF;
    END IF;
  END IF;

  -- Code is valid
  RETURN QUERY SELECT
    true,
    NULL::TEXT,
    v_promo.id,
    v_promo.discount_type,
    v_promo.discount_value,
    v_promo.description;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to redeem a promo code
CREATE OR REPLACE FUNCTION redeem_promo_code(
  p_code TEXT,
  p_user_id UUID,
  p_subscription_id TEXT DEFAULT NULL
) RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  redemption_id UUID,
  discount_type TEXT,
  discount_value INTEGER,
  premium_credit_id UUID
) AS $$
DECLARE
  v_validation RECORD;
  v_promo promo_codes%ROWTYPE;
  v_redemption_id UUID;
  v_credit_id UUID;
BEGIN
  -- Validate first
  SELECT * INTO v_validation FROM validate_promo_code(p_code, p_user_id);

  IF NOT v_validation.is_valid THEN
    RETURN QUERY SELECT false, v_validation.error_message, NULL::UUID, NULL::TEXT, NULL::INTEGER, NULL::UUID;
    RETURN;
  END IF;

  -- Get promo details
  SELECT * INTO v_promo FROM promo_codes WHERE id = v_validation.promo_code_id;

  -- Handle free_days type - create premium credit
  IF v_promo.discount_type = 'free_days' THEN
    INSERT INTO premium_credits (user_id, days_amount, source, expires_at)
    VALUES (
      p_user_id,
      v_promo.discount_value,
      'promo',
      NOW() + INTERVAL '365 days'
    )
    RETURNING id INTO v_credit_id;
  END IF;

  -- Create redemption record
  INSERT INTO promo_redemptions (
    promo_code_id,
    user_id,
    discount_applied,
    discount_type,
    subscription_id,
    premium_credit_id
  )
  VALUES (
    v_promo.id,
    p_user_id,
    v_promo.discount_value,
    v_promo.discount_type,
    p_subscription_id,
    v_credit_id
  )
  RETURNING id INTO v_redemption_id;

  -- Increment usage count
  UPDATE promo_codes
  SET current_uses = current_uses + 1, updated_at = NOW()
  WHERE id = v_promo.id;

  RETURN QUERY SELECT
    true,
    NULL::TEXT,
    v_redemption_id,
    v_promo.discount_type,
    v_promo.discount_value,
    v_credit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update timestamps trigger
CREATE OR REPLACE FUNCTION update_promo_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON promo_codes;
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION update_promo_codes_updated_at();

-- Insert some example promo codes (optional - for testing)
-- INSERT INTO promo_codes (code, description, discount_type, discount_value, max_uses, valid_until)
-- VALUES
--   ('WELCOME10', '10% rabatt för nya användare', 'percentage', 10, 100, NOW() + INTERVAL '90 days'),
--   ('GRATIS7', '7 dagar gratis Premium', 'free_days', 7, 500, NOW() + INTERVAL '30 days'),
--   ('SOMMAR50', '50 kr rabatt', 'fixed_amount', 50, 200, '2025-08-31');

COMMENT ON TABLE promo_codes IS 'Marketing promo codes for discounts and free premium days';
COMMENT ON TABLE promo_redemptions IS 'Tracks which users have redeemed which promo codes';
