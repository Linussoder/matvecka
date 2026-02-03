-- Content & Recipe Management Database Schema
-- Category 8: Recipe Quality Control, Content Calendar, Translation Manager

-- =====================================================
-- PART A: Recipe Quality Control Tables
-- =====================================================

-- A1: Recipe Review Queue
-- Tracks AI-generated recipes pending admin review
CREATE TABLE IF NOT EXISTS recipe_review_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_plan_recipe_id INTEGER,
  recipe_data JSONB NOT NULL,
  source TEXT DEFAULT 'ai_generated' CHECK (source IN ('ai_generated', 'user_submitted', 'imported')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  reviewer_notes TEXT,
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  flags JSONB DEFAULT '[]',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for recipe queue
CREATE INDEX IF NOT EXISTS idx_recipe_queue_status ON recipe_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_recipe_queue_source ON recipe_review_queue(source);
CREATE INDEX IF NOT EXISTS idx_recipe_queue_created ON recipe_review_queue(created_at DESC);

-- A2: Ingredient Substitutions
-- Manages alternative ingredients (e.g., milk -> oat milk)
CREATE TABLE IF NOT EXISTS ingredient_substitutions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_ingredient TEXT NOT NULL,
  substitute_ingredient TEXT NOT NULL,
  category TEXT CHECK (category IN ('dairy', 'meat', 'gluten', 'allergy', 'vegan', 'budget', 'seasonal')),
  substitution_ratio DECIMAL(5,2) DEFAULT 1.0,
  notes TEXT,
  nutrition_impact JSONB,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(original_ingredient, substitute_ingredient)
);

-- Indexes for substitutions
CREATE INDEX IF NOT EXISTS idx_substitutions_original ON ingredient_substitutions(original_ingredient);
CREATE INDEX IF NOT EXISTS idx_substitutions_category ON ingredient_substitutions(category);
CREATE INDEX IF NOT EXISTS idx_substitutions_active ON ingredient_substitutions(is_active);

-- A3: Recipe Seasons
-- Associates recipes with seasons/months for scheduling
CREATE TABLE IF NOT EXISTS recipe_seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_hash TEXT NOT NULL,
  recipe_name TEXT NOT NULL,
  recipe_data JSONB,
  seasons TEXT[] DEFAULT '{}',
  months INTEGER[] DEFAULT '{}',
  seasonal_tags TEXT[],
  availability_score INTEGER DEFAULT 50 CHECK (availability_score >= 0 AND availability_score <= 100),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_hash)
);

-- Indexes for seasons
CREATE INDEX IF NOT EXISTS idx_recipe_seasons_months ON recipe_seasons USING GIN(months);
CREATE INDEX IF NOT EXISTS idx_recipe_seasons_tags ON recipe_seasons USING GIN(seasonal_tags);
CREATE INDEX IF NOT EXISTS idx_recipe_seasons_featured ON recipe_seasons(is_featured);

-- A4: Nutrition Verification Log
-- Tracks nutrition recalculations and adjustments
CREATE TABLE IF NOT EXISTS nutrition_verification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_identifier TEXT NOT NULL,
  original_nutrition JSONB NOT NULL,
  calculated_nutrition JSONB NOT NULL,
  variance_percentage JSONB,
  verification_method TEXT CHECK (verification_method IN ('manual', 'ai_recalc', 'database_lookup')),
  is_approved BOOLEAN DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for verification log
CREATE INDEX IF NOT EXISTS idx_nutrition_log_recipe ON nutrition_verification_log(recipe_identifier);
CREATE INDEX IF NOT EXISTS idx_nutrition_log_approved ON nutrition_verification_log(is_approved);

-- =====================================================
-- PART B: Content Calendar Tables
-- =====================================================

-- B1: Content Calendar Events
-- Unified calendar for all content types
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('recipe_feature', 'campaign', 'blog', 'email', 'social', 'promotion')),
  description TEXT,
  content_data JSONB,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  end_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'cancelled')),
  target_audience JSONB,
  linked_content_ids UUID[],
  tags TEXT[],
  created_by TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for content calendar
CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_type ON content_calendar(content_type);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_content_calendar_tags ON content_calendar USING GIN(tags);

-- B2: Seasonal Campaigns
-- Manages seasonal/thematic marketing campaigns
CREATE TABLE IF NOT EXISTS seasonal_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  theme TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  banner_image_url TEXT,
  color_scheme JSONB,
  featured_recipes UUID[],
  promotion_codes TEXT[],
  metrics JSONB DEFAULT '{"views": 0, "conversions": 0, "revenue": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON seasonal_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON seasonal_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_theme ON seasonal_campaigns(theme);

-- B3: Blog Posts
-- Blog content management
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  featured_image_url TEXT,
  author TEXT,
  category TEXT CHECK (category IN ('tips', 'recipes', 'news', 'guides', 'announcements')),
  tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  seo_title TEXT,
  seo_description TEXT,
  read_time_minutes INTEGER,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for blog posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);

-- B4: Email Content Plans
-- Planning for email campaigns with content timeline
CREATE TABLE IF NOT EXISTS email_content_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  email_type TEXT CHECK (email_type IN ('newsletter', 'promotional', 'transactional', 'welcome', 'winback')),
  subject_line TEXT,
  preview_text TEXT,
  content_blocks JSONB,
  scheduled_date DATE,
  target_segment_id UUID,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'content_ready', 'scheduled', 'sent')),
  linked_campaign_id UUID REFERENCES seasonal_campaigns(id) ON DELETE SET NULL,
  a_b_variants JSONB,
  sent_at TIMESTAMPTZ,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for email plans
CREATE INDEX IF NOT EXISTS idx_email_plans_date ON email_content_plans(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_email_plans_status ON email_content_plans(status);
CREATE INDEX IF NOT EXISTS idx_email_plans_type ON email_content_plans(email_type);

-- =====================================================
-- PART C: Translation Manager Tables
-- =====================================================

-- C1: Supported Languages
CREATE TABLE IF NOT EXISTS supported_languages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  translation_progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default languages
INSERT INTO supported_languages (code, name, native_name, is_default, is_active) VALUES
  ('sv', 'Swedish', 'Svenska', true, true),
  ('en', 'English', 'English', false, false),
  ('no', 'Norwegian', 'Norsk', false, false),
  ('da', 'Danish', 'Dansk', false, false),
  ('fi', 'Finnish', 'Suomi', false, false)
ON CONFLICT (code) DO NOTHING;

-- C2: Translation Keys
-- Master list of translatable content
CREATE TABLE IF NOT EXISTS translation_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  context TEXT,
  category TEXT CHECK (category IN ('ui', 'recipe', 'email', 'blog', 'marketing', 'error')),
  default_value TEXT NOT NULL,
  max_length INTEGER,
  is_plural BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for translation keys
CREATE INDEX IF NOT EXISTS idx_translation_keys_category ON translation_keys(category);
CREATE INDEX IF NOT EXISTS idx_translation_keys_key ON translation_keys(key);

-- C3: Translations
-- Actual translated content
CREATE TABLE IF NOT EXISTS translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  translation_key_id UUID REFERENCES translation_keys(id) ON DELETE CASCADE NOT NULL,
  language_code TEXT REFERENCES supported_languages(code) ON DELETE CASCADE NOT NULL,
  translated_value TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected')),
  translator TEXT,
  reviewer TEXT,
  reviewed_at TIMESTAMPTZ,
  machine_translated BOOLEAN DEFAULT false,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(translation_key_id, language_code)
);

-- Indexes for translations
CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language_code);
CREATE INDEX IF NOT EXISTS idx_translations_status ON translations(status);

-- C4: Regional Content Variants
-- Region-specific content overrides
CREATE TABLE IF NOT EXISTS regional_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  region_code TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  override_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(region_code, content_type, content_id)
);

-- Indexes for regional content
CREATE INDEX IF NOT EXISTS idx_regional_content_region ON regional_content(region_code);
CREATE INDEX IF NOT EXISTS idx_regional_content_type ON regional_content(content_type);

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE recipe_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_verification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE supported_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role access for admin)
CREATE POLICY "service_role_recipe_queue" ON recipe_review_queue FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_substitutions" ON ingredient_substitutions FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_recipe_seasons" ON recipe_seasons FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_nutrition_log" ON nutrition_verification_log FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_content_calendar" ON content_calendar FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_campaigns" ON seasonal_campaigns FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_blog_posts" ON blog_posts FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_email_plans" ON email_content_plans FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_languages" ON supported_languages FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_translation_keys" ON translation_keys FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_translations" ON translations FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_regional" ON regional_content FOR ALL TO service_role USING (true);

-- Comments
COMMENT ON TABLE recipe_review_queue IS 'Queue for reviewing AI-generated and submitted recipes';
COMMENT ON TABLE ingredient_substitutions IS 'Ingredient substitution rules for dietary restrictions and preferences';
COMMENT ON TABLE recipe_seasons IS 'Seasonal associations for recipe scheduling';
COMMENT ON TABLE nutrition_verification_log IS 'Log of nutrition data verifications and corrections';
COMMENT ON TABLE content_calendar IS 'Unified content scheduling calendar';
COMMENT ON TABLE seasonal_campaigns IS 'Seasonal and thematic marketing campaigns';
COMMENT ON TABLE blog_posts IS 'Blog content management';
COMMENT ON TABLE email_content_plans IS 'Email campaign content planning';
COMMENT ON TABLE supported_languages IS 'Available languages for translation';
COMMENT ON TABLE translation_keys IS 'Master list of translatable content keys';
COMMENT ON TABLE translations IS 'Translated content values';
COMMENT ON TABLE regional_content IS 'Region-specific content overrides';
