-- Migration: Add preferences column to meal_plans table
-- This allows the regenerate-recipe API to use the same preferences as the original meal plan

-- Add preferences JSONB column to store all meal plan generation preferences
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_plans' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN preferences JSONB;
  END IF;
END $$;

-- Add comment describing the column
COMMENT ON COLUMN meal_plans.preferences IS 'Stores the full preferences object used to generate the meal plan (diet, proteinType, cuisineStyle, cookingTime, skillLevel, familyFriendly, excludedIngredients, preferredIngredients)';

-- Backfill existing meal plans with default preferences
UPDATE meal_plans
SET preferences = jsonb_build_object(
  'servings', COALESCE(servings, 4),
  'days', 7,
  'maxCostPerServing', 50,
  'diet', 'none',
  'proteinType', 'any',
  'familyFriendly', false,
  'cuisineStyle', 'mixed',
  'cookingTime', 'medium',
  'skillLevel', 'easy',
  'excludedIngredients', '',
  'preferredIngredients', ''
)
WHERE preferences IS NULL;
