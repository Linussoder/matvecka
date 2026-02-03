-- Add source and source_url columns to recipe_favorites
-- This enables storing imported recipes (from URLs) and manually created recipes

-- Add new columns for source tracking
ALTER TABLE recipe_favorites
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Create index on source for filtering
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_source ON recipe_favorites(source);

-- Drop the old constraint that requires recipe_id or meal_plan_recipe_id
ALTER TABLE recipe_favorites DROP CONSTRAINT IF EXISTS must_have_recipe;

-- Add new constraint: must have recipe_id, meal_plan_recipe_id, OR recipe_data (for imported/created)
ALTER TABLE recipe_favorites ADD CONSTRAINT must_have_recipe_or_data
CHECK (recipe_id IS NOT NULL OR meal_plan_recipe_id IS NOT NULL OR recipe_data IS NOT NULL);

-- Comment explaining the source field
COMMENT ON COLUMN recipe_favorites.source IS 'Recipe source: null=favorited, imported=from URL, created=manually created';
COMMENT ON COLUMN recipe_favorites.source_url IS 'Original URL for imported recipes';
