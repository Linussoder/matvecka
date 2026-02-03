-- New Features Migration for Matvecka
-- Run this SQL in your Supabase SQL Editor
-- Includes: Recipe Scaling, Smart Pantry, Templates, Nutrition

-- =====================================================
-- Phase 1: Recipe Scaling
-- Add serving_multiplier to meal_plans for scaling
-- =====================================================

ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS serving_multiplier DECIMAL(3,2) DEFAULT 1.0;

-- =====================================================
-- Phase 2: Smart Pantry
-- Track ingredients users have at home
-- =====================================================

CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ingredient_name TEXT NOT NULL,
  quantity DECIMAL(10,2),
  unit TEXT,
  category TEXT CHECK (category IN ('dairy', 'meat', 'produce', 'grains', 'spices', 'frozen', 'canned', 'other')),
  expiry_date DATE,
  location TEXT DEFAULT 'pantry' CHECK (location IN ('pantry', 'fridge', 'freezer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for pantry
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expiry ON pantry_items(user_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_pantry_items_category ON pantry_items(user_id, category);

-- RLS for pantry
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own pantry" ON pantry_items;
CREATE POLICY "Users can manage own pantry"
  ON pantry_items FOR ALL
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER pantry_items_updated_at
  BEFORE UPDATE ON pantry_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Phase 3: Meal Plan Templates
-- Save and reuse meal plans
-- =====================================================

CREATE TABLE IF NOT EXISTS meal_plan_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  meals JSONB NOT NULL,
  preferences JSONB,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for templates
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON meal_plan_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_use_count ON meal_plan_templates(user_id, use_count DESC);

-- RLS for templates
ALTER TABLE meal_plan_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own templates" ON meal_plan_templates;
CREATE POLICY "Users can manage own templates"
  ON meal_plan_templates FOR ALL
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON meal_plan_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Phase 5: Nutrition Tracking
-- Weekly nutrition summaries
-- =====================================================

CREATE TABLE IF NOT EXISTS nutrition_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  daily_averages JSONB NOT NULL DEFAULT '{}',
  weekly_totals JSONB NOT NULL DEFAULT '{}',
  meal_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Indexes for nutrition
CREATE INDEX IF NOT EXISTS idx_nutrition_user_week ON nutrition_summaries(user_id, week_start);

-- RLS for nutrition
ALTER TABLE nutrition_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own nutrition" ON nutrition_summaries;
CREATE POLICY "Users can view own nutrition"
  ON nutrition_summaries FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- Helper function to calculate nutrition from meal plan
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_meal_plan_nutrition(p_meal_plan_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_calories INTEGER := 0;
  total_protein INTEGER := 0;
  total_carbs INTEGER := 0;
  total_fat INTEGER := 0;
  total_fiber INTEGER := 0;
  meal_count INTEGER := 0;
BEGIN
  SELECT
    COALESCE(SUM((recipe_data->'nutrition'->>'calories')::INTEGER), 0),
    COALESCE(SUM((recipe_data->'nutrition'->>'protein')::INTEGER), 0),
    COALESCE(SUM((recipe_data->'nutrition'->>'carbs')::INTEGER), 0),
    COALESCE(SUM((recipe_data->'nutrition'->>'fat')::INTEGER), 0),
    COALESCE(SUM((recipe_data->'nutrition'->>'fiber')::INTEGER), 0),
    COUNT(*)
  INTO total_calories, total_protein, total_carbs, total_fat, total_fiber, meal_count
  FROM meal_plan_recipes
  WHERE meal_plan_id = p_meal_plan_id;

  result := jsonb_build_object(
    'calories', total_calories,
    'protein', total_protein,
    'carbs', total_carbs,
    'fat', total_fat,
    'fiber', total_fiber,
    'meal_count', meal_count,
    'daily_average', jsonb_build_object(
      'calories', CASE WHEN meal_count > 0 THEN total_calories / meal_count ELSE 0 END,
      'protein', CASE WHEN meal_count > 0 THEN total_protein / meal_count ELSE 0 END,
      'carbs', CASE WHEN meal_count > 0 THEN total_carbs / meal_count ELSE 0 END,
      'fat', CASE WHEN meal_count > 0 THEN total_fat / meal_count ELSE 0 END,
      'fiber', CASE WHEN meal_count > 0 THEN total_fiber / meal_count ELSE 0 END
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Phase 6: Favorite Recipes
-- Save recipes from leftovers suggestions
-- =====================================================

CREATE TABLE IF NOT EXISTS favorite_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  prep_time TEXT,
  servings INTEGER,
  difficulty TEXT,
  ingredients JSONB,
  instructions JSONB,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for favorites
CREATE INDEX IF NOT EXISTS idx_favorite_recipes_user_id ON favorite_recipes(user_id);

-- RLS for favorites
ALTER TABLE favorite_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own favorites" ON favorite_recipes;
CREATE POLICY "Users can manage own favorites"
  ON favorite_recipes FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE pantry_items IS 'User pantry inventory for ingredient tracking';
COMMENT ON TABLE meal_plan_templates IS 'Saved meal plan templates for reuse';
COMMENT ON TABLE nutrition_summaries IS 'Weekly nutrition tracking summaries';
COMMENT ON TABLE favorite_recipes IS 'User saved favorite recipes';
COMMENT ON COLUMN meal_plans.serving_multiplier IS 'Multiplier for scaling shopping list quantities (default 1.0)';
