-- Recipe Favorites System Database Schema
-- Run this in your Supabase SQL editor

-- Table for user's favorite recipes
CREATE TABLE IF NOT EXISTS recipe_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  times_made INTEGER DEFAULT 0,
  last_made_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure each user can only favorite a recipe once
  UNIQUE(user_id, recipe_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user_id ON recipe_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_recipe_id ON recipe_favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_created_at ON recipe_favorites(created_at);

-- Enable Row Level Security
ALTER TABLE recipe_favorites ENABLE ROW LEVEL SECURITY;

-- Users can only see their own favorites
CREATE POLICY "Users can view own favorites"
  ON recipe_favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own favorites
CREATE POLICY "Users can insert own favorites"
  ON recipe_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own favorites
CREATE POLICY "Users can update own favorites"
  ON recipe_favorites FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON recipe_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_recipe_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_recipe_favorites_updated_at ON recipe_favorites;
CREATE TRIGGER trigger_update_recipe_favorites_updated_at
  BEFORE UPDATE ON recipe_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_favorites_updated_at();
