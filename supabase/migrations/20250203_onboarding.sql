-- Migration: Add onboarding tracking to user profiles
-- Tracks whether users have completed the welcome onboarding flow

-- Add onboarding columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS favorite_stores TEXT[] DEFAULT '{}';

-- Add flexitarian to diet_type check constraint
-- First drop the existing constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_diet_type_check;

-- Then recreate with the new value
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_diet_type_check
CHECK (diet_type IN ('none', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'low_carb', 'gluten_free', 'dairy_free', 'flexitarian'));

-- Create index for quickly finding users who haven't completed onboarding
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON user_profiles(onboarding_completed) WHERE onboarding_completed = false;

-- Comment
COMMENT ON COLUMN user_profiles.onboarding_completed IS 'Whether the user has completed the welcome onboarding wizard';
COMMENT ON COLUMN user_profiles.onboarding_completed_at IS 'Timestamp when onboarding was completed';
COMMENT ON COLUMN user_profiles.favorite_stores IS 'Array of store IDs the user prefers (ica, coop, citygross, willys)';
