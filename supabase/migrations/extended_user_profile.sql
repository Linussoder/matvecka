-- Migration: Extended User Profile
-- Adds comprehensive user profile fields for personalized meal planning

-- Create user_profiles table if it doesn't exist (extends user_preferences)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Basic info
  full_name TEXT,
  phone_number TEXT,
  preferred_city TEXT DEFAULT 'Stockholm',

  -- Body & Health metrics
  weight_kg DECIMAL(5,2),
  height_cm INTEGER,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  activity_level TEXT DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  health_goal TEXT DEFAULT 'maintain' CHECK (health_goal IN ('lose_weight', 'maintain', 'gain_muscle')),

  -- Personal dietary restrictions (separate from family members)
  allergies TEXT[] DEFAULT '{}',
  intolerances TEXT[] DEFAULT '{}',
  diet_type TEXT DEFAULT 'none' CHECK (diet_type IN ('none', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'low_carb', 'gluten_free', 'dairy_free')),
  dislikes TEXT[] DEFAULT '{}',

  -- Kitchen & Cooking preferences
  kitchen_equipment TEXT[] DEFAULT '{}',
  cooking_skill TEXT DEFAULT 'beginner' CHECK (cooking_skill IN ('beginner', 'intermediate', 'advanced')),
  weekday_cooking_time INTEGER DEFAULT 30, -- minutes
  weekend_cooking_time INTEGER DEFAULT 60, -- minutes

  -- Meal planning defaults
  default_servings INTEGER DEFAULT 4,
  max_budget_per_serving INTEGER DEFAULT 50,

  -- Notification preferences
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  meal_prep_reminders BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT true,

  -- App preferences
  dark_mode BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'sv' CHECK (language IN ('sv', 'en')),
  units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (user_id = auth.uid());

-- Auto-update timestamps trigger
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_user_profiles_updated_at();

-- Function to calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor equation
CREATE OR REPLACE FUNCTION calculate_bmr(
  weight_kg DECIMAL,
  height_cm INTEGER,
  age_years INTEGER,
  gender TEXT
) RETURNS INTEGER AS $$
BEGIN
  IF weight_kg IS NULL OR height_cm IS NULL OR age_years IS NULL THEN
    RETURN NULL;
  END IF;

  IF gender = 'male' THEN
    -- BMR = (10 × weight in kg) + (6.25 × height in cm) – (5 × age in years) + 5
    RETURN ROUND((10 * weight_kg) + (6.25 * height_cm) - (5 * age_years) + 5);
  ELSE
    -- BMR = (10 × weight in kg) + (6.25 × height in cm) – (5 × age in years) – 161
    RETURN ROUND((10 * weight_kg) + (6.25 * height_cm) - (5 * age_years) - 161);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate TDEE (Total Daily Energy Expenditure)
CREATE OR REPLACE FUNCTION calculate_tdee(
  bmr INTEGER,
  activity_level TEXT
) RETURNS INTEGER AS $$
DECLARE
  multiplier DECIMAL;
BEGIN
  IF bmr IS NULL THEN
    RETURN NULL;
  END IF;

  multiplier := CASE activity_level
    WHEN 'sedentary' THEN 1.2
    WHEN 'light' THEN 1.375
    WHEN 'moderate' THEN 1.55
    WHEN 'active' THEN 1.725
    WHEN 'very_active' THEN 1.9
    ELSE 1.55 -- default to moderate
  END;

  RETURN ROUND(bmr * multiplier);
END;
$$ LANGUAGE plpgsql;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Comment on table
COMMENT ON TABLE user_profiles IS 'Extended user profile with body metrics, dietary preferences, cooking preferences, and app settings';
