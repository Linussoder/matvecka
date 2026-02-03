-- Household Profiles System for Matvecka
-- Run this SQL in your Supabase SQL Editor
-- Enables family/household management with individual dietary profiles

-- =====================================================
-- Households Table
-- Each user can have one household they own
-- =====================================================
CREATE TABLE IF NOT EXISTS households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Mitt hushåll',
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_households_owner_id ON households(owner_id);

-- =====================================================
-- Family Members Table
-- Individual profiles within a household
-- =====================================================
CREATE TABLE IF NOT EXISTS family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,

  -- Basic info
  name TEXT NOT NULL,
  age_group TEXT NOT NULL CHECK (age_group IN ('toddler', 'child', 'teen', 'adult', 'senior')),

  -- Portion preferences
  -- toddler: 0.25, child: 0.5, teen: 0.75-1.0, adult: 1.0, senior: 0.75
  portion_size TEXT DEFAULT 'normal' CHECK (portion_size IN ('small', 'normal', 'large')),
  portion_multiplier DECIMAL(3,2) DEFAULT 1.0,

  -- Dietary restrictions stored as JSONB for flexibility
  -- Structure: {
  --   "allergies": ["nuts", "shellfish", "eggs", "milk", "wheat", "soy", "fish", "sesame"],
  --   "intolerances": ["lactose", "gluten", "fructose"],
  --   "diet_type": "none" | "vegetarian" | "vegan" | "pescatarian",
  --   "dislikes": ["mushrooms", "olives", "cilantro"]
  -- }
  dietary_restrictions JSONB DEFAULT '{"allergies": [], "intolerances": [], "diet_type": "none", "dislikes": []}',

  -- Display order in UI
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_family_members_household_id ON family_members(household_id);
CREATE INDEX IF NOT EXISTS idx_family_members_sort_order ON family_members(household_id, sort_order);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Households: Users can view and manage their own household
CREATE POLICY "Users can view own household"
  ON households FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own household"
  ON households FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own household"
  ON households FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own household"
  ON households FOR DELETE
  USING (auth.uid() = owner_id);

-- Service role can manage all households (for admin)
CREATE POLICY "Service role can manage households"
  ON households FOR ALL
  USING (auth.role() = 'service_role');

-- Family Members: Users can manage members in their household
CREATE POLICY "Users can view family members in own household"
  ON family_members FOR SELECT
  USING (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can create family members in own household"
  ON family_members FOR INSERT
  WITH CHECK (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can update family members in own household"
  ON family_members FOR UPDATE
  USING (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can delete family members in own household"
  ON family_members FOR DELETE
  USING (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  );

-- Service role can manage all family members (for admin)
CREATE POLICY "Service role can manage family members"
  ON family_members FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- Triggers for updated_at
-- =====================================================

-- Use existing update_updated_at function if it exists, otherwise create it
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get household with all family members
CREATE OR REPLACE FUNCTION get_household_with_members(p_user_id UUID)
RETURNS TABLE (
  household_id UUID,
  household_name TEXT,
  member_id UUID,
  member_name TEXT,
  age_group TEXT,
  portion_size TEXT,
  portion_multiplier DECIMAL,
  dietary_restrictions JSONB,
  sort_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id as household_id,
    h.name as household_name,
    fm.id as member_id,
    fm.name as member_name,
    fm.age_group,
    fm.portion_size,
    fm.portion_multiplier,
    fm.dietary_restrictions,
    fm.sort_order
  FROM households h
  LEFT JOIN family_members fm ON fm.household_id = h.id
  WHERE h.owner_id = p_user_id
  ORDER BY fm.sort_order ASC, fm.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate total portions for a household
CREATE OR REPLACE FUNCTION get_household_total_portions(p_household_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(portion_multiplier), 0)
  INTO total
  FROM family_members
  WHERE household_id = p_household_id;

  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get combined dietary restrictions for a household
-- Returns the union of all allergies, intolerances, and the strictest diet type
CREATE OR REPLACE FUNCTION get_combined_restrictions(p_household_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  all_allergies JSONB;
  all_intolerances JSONB;
  all_dislikes JSONB;
  strictest_diet TEXT;
BEGIN
  -- Aggregate all allergies (must avoid for everyone)
  SELECT COALESCE(jsonb_agg(DISTINCT allergy), '[]'::jsonb)
  INTO all_allergies
  FROM family_members fm,
       jsonb_array_elements_text(fm.dietary_restrictions->'allergies') AS allergy
  WHERE fm.household_id = p_household_id;

  -- Aggregate all intolerances
  SELECT COALESCE(jsonb_agg(DISTINCT intolerance), '[]'::jsonb)
  INTO all_intolerances
  FROM family_members fm,
       jsonb_array_elements_text(fm.dietary_restrictions->'intolerances') AS intolerance
  WHERE fm.household_id = p_household_id;

  -- Aggregate all dislikes (try to avoid)
  SELECT COALESCE(jsonb_agg(DISTINCT dislike), '[]'::jsonb)
  INTO all_dislikes
  FROM family_members fm,
       jsonb_array_elements_text(fm.dietary_restrictions->'dislikes') AS dislike
  WHERE fm.household_id = p_household_id;

  -- Find strictest diet (vegan > vegetarian > pescatarian > none)
  SELECT
    CASE
      WHEN EXISTS (SELECT 1 FROM family_members WHERE household_id = p_household_id AND dietary_restrictions->>'diet_type' = 'vegan') THEN 'vegan'
      WHEN EXISTS (SELECT 1 FROM family_members WHERE household_id = p_household_id AND dietary_restrictions->>'diet_type' = 'vegetarian') THEN 'vegetarian'
      WHEN EXISTS (SELECT 1 FROM family_members WHERE household_id = p_household_id AND dietary_restrictions->>'diet_type' = 'pescatarian') THEN 'pescatarian'
      ELSE 'none'
    END
  INTO strictest_diet;

  -- Build result object
  result := jsonb_build_object(
    'allergies', all_allergies,
    'intolerances', all_intolerances,
    'dislikes', all_dislikes,
    'diet_type', strictest_diet
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Default portion multipliers by age group
-- =====================================================
COMMENT ON TABLE family_members IS
'Family member profiles with dietary preferences.
Default portion multipliers by age_group:
- toddler (1-3 år): 0.25
- child (4-12 år): 0.5
- teen (13-17 år): 0.75
- adult (18+ år): 1.0
- senior (65+ år): 0.75

portion_size adjusts the multiplier:
- small: multiplier * 0.75
- normal: multiplier * 1.0
- large: multiplier * 1.25';
