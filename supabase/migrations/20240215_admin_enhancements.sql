-- Admin Enhancements Database Tables
-- Run this migration to add tables for new admin features

-- User segments for targeting (MUST be created first as other tables reference it)
CREATE TABLE IF NOT EXISTS admin_segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '{}',
  user_count INTEGER DEFAULT 0,
  is_dynamic BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketing campaigns
CREATE TABLE IF NOT EXISTS admin_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'push', 'social', 'ad')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'sent', 'paused', 'completed')),
  target_segment UUID REFERENCES admin_segments(id) ON DELETE SET NULL,
  target_filters JSONB DEFAULT '{}',
  content JSONB NOT NULL DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  metrics JSONB DEFAULT '{"sent": 0, "opened": 0, "clicked": 0, "converted": 0}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated marketing assets (images, captions, etc)
CREATE TABLE IF NOT EXISTS admin_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES admin_campaigns(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'caption', 'hashtags', 'post')),
  platform TEXT CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'twitter', 'email', 'push')),
  content TEXT,
  url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events for real-time dashboard
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  session_id TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push notifications
CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES admin_campaigns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon_url TEXT,
  action_url TEXT,
  target_segment UUID REFERENCES admin_segments(id) ON DELETE SET NULL,
  target_all BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_segment UUID REFERENCES admin_segments(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price history for tracking
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID,
  product_name TEXT NOT NULL,
  store TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  unit TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  type TEXT CHECK (type IN ('welcome', 'newsletter', 'promotional', 'transactional', 'winback')),
  variables JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin AI chat history
CREATE TABLE IF NOT EXISTS admin_ai_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  sql_generated TEXT,
  result_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_name, store);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded ON price_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON admin_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_push_notifications_status ON push_notifications(status);

-- Enable RLS
ALTER TABLE admin_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_ai_chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for service role)
CREATE POLICY "service_role_admin_campaigns" ON admin_campaigns FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_admin_assets" ON admin_assets FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_admin_segments" ON admin_segments FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_analytics_events" ON analytics_events FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_push_notifications" ON push_notifications FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_push_subscriptions" ON push_subscriptions FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_feature_flags" ON feature_flags FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_price_history" ON price_history FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_email_templates" ON email_templates FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_admin_ai_chats" ON admin_ai_chats FOR ALL TO service_role USING (true);

-- Users can manage their own push subscriptions
CREATE POLICY "users_own_push_subscriptions" ON push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid());
