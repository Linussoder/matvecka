-- Migration: Recipe and Meal Plan Sharing
-- Allows users to share recipes and meal plans via public links

-- Recipe shares table
CREATE TABLE IF NOT EXISTS recipe_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Share token (used in URL)
  share_token VARCHAR(12) UNIQUE NOT NULL,

  -- Who shared it
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Recipe data (denormalized for sharing)
  recipe_data JSONB NOT NULL,

  -- Optional reference to original source
  meal_plan_recipe_id UUID,
  favorite_id UUID,

  -- Share settings
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ, -- NULL = never expires

  -- Stats
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0, -- How many people saved it to favorites

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ
);

-- Meal plan shares table
CREATE TABLE IF NOT EXISTS meal_plan_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Share token (used in URL)
  share_token VARCHAR(12) UNIQUE NOT NULL,

  -- Who shared it
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Meal plan reference (TEXT to support different ID formats)
  meal_plan_id TEXT NOT NULL,

  -- Denormalized meal plan data for sharing
  meal_plan_data JSONB NOT NULL, -- Contains name, recipes, etc.

  -- Share settings
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  include_shopping_list BOOLEAN DEFAULT true,

  -- Stats
  view_count INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0, -- How many people copied the meal plan

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recipe_shares_token ON recipe_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_recipe_shares_user ON recipe_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_shares_active ON recipe_shares(is_active, expires_at);

CREATE INDEX IF NOT EXISTS idx_meal_plan_shares_token ON meal_plan_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_meal_plan_shares_user ON meal_plan_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_shares_meal_plan ON meal_plan_shares(meal_plan_id);

-- Enable RLS
ALTER TABLE recipe_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipe_shares
-- Anyone can read active shares (public links)
CREATE POLICY "Anyone can view active recipe shares" ON recipe_shares
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Users can manage their own shares
CREATE POLICY "Users can manage own recipe shares" ON recipe_shares
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for meal_plan_shares
CREATE POLICY "Anyone can view active meal plan shares" ON meal_plan_shares
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Users can manage own meal plan shares" ON meal_plan_shares
  FOR ALL USING (user_id = auth.uid());

-- Function to generate a unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghjkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create a recipe share
CREATE OR REPLACE FUNCTION create_recipe_share(
  p_user_id UUID,
  p_recipe_data JSONB,
  p_meal_plan_recipe_id UUID DEFAULT NULL,
  p_favorite_id UUID DEFAULT NULL,
  p_expires_days INTEGER DEFAULT NULL
) RETURNS TABLE (
  share_id UUID,
  share_token TEXT
) AS $$
DECLARE
  v_token TEXT;
  v_share_id UUID;
  v_expires TIMESTAMPTZ;
BEGIN
  -- Generate unique token
  LOOP
    v_token := generate_share_token();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM recipe_shares WHERE share_token = v_token);
  END LOOP;

  -- Calculate expiry
  IF p_expires_days IS NOT NULL THEN
    v_expires := NOW() + (p_expires_days || ' days')::INTERVAL;
  END IF;

  -- Create share
  INSERT INTO recipe_shares (
    share_token,
    user_id,
    recipe_data,
    meal_plan_recipe_id,
    favorite_id,
    expires_at
  )
  VALUES (
    v_token,
    p_user_id,
    p_recipe_data,
    p_meal_plan_recipe_id,
    p_favorite_id,
    v_expires
  )
  RETURNING id INTO v_share_id;

  RETURN QUERY SELECT v_share_id, v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a meal plan share
CREATE OR REPLACE FUNCTION create_meal_plan_share(
  p_user_id UUID,
  p_meal_plan_id UUID,
  p_meal_plan_data JSONB,
  p_include_shopping_list BOOLEAN DEFAULT true,
  p_expires_days INTEGER DEFAULT NULL
) RETURNS TABLE (
  share_id UUID,
  share_token TEXT
) AS $$
DECLARE
  v_token TEXT;
  v_share_id UUID;
  v_expires TIMESTAMPTZ;
BEGIN
  -- Generate unique token
  LOOP
    v_token := generate_share_token();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM meal_plan_shares WHERE share_token = v_token);
  END LOOP;

  -- Calculate expiry
  IF p_expires_days IS NOT NULL THEN
    v_expires := NOW() + (p_expires_days || ' days')::INTERVAL;
  END IF;

  -- Create share
  INSERT INTO meal_plan_shares (
    share_token,
    user_id,
    meal_plan_id,
    meal_plan_data,
    include_shopping_list,
    expires_at
  )
  VALUES (
    v_token,
    p_user_id,
    p_meal_plan_id,
    p_meal_plan_data,
    p_include_shopping_list,
    v_expires
  )
  RETURNING id INTO v_share_id;

  RETURN QUERY SELECT v_share_id, v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_share_view(
  p_share_token TEXT,
  p_share_type TEXT -- 'recipe' or 'meal_plan'
) RETURNS void AS $$
BEGIN
  IF p_share_type = 'recipe' THEN
    UPDATE recipe_shares
    SET view_count = view_count + 1, last_viewed_at = NOW()
    WHERE share_token = p_share_token;
  ELSIF p_share_type = 'meal_plan' THEN
    UPDATE meal_plan_shares
    SET view_count = view_count + 1, last_viewed_at = NOW()
    WHERE share_token = p_share_token;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE recipe_shares IS 'Shared recipes accessible via public links';
COMMENT ON TABLE meal_plan_shares IS 'Shared meal plans accessible via public links';
