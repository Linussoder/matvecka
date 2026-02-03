-- Social Media Posts and Connections
-- Run this migration to add the social_posts and social_connections tables

-- Social media account connections
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'twitter')),
  access_token TEXT,
  refresh_token TEXT,
  username TEXT,
  profile_url TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform)
);

-- Social posts for scheduling
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'twitter')),
  content TEXT,
  caption TEXT,
  hashtags TEXT[],
  image_url TEXT,
  video_url TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  external_post_id TEXT,
  error_message TEXT,
  metrics JSONB DEFAULT '{"likes": 0, "comments": 0, "shares": 0, "views": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_at);

-- Create index for social connections
CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON social_connections(platform);

-- Enable RLS
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for service role)
CREATE POLICY "service_role_social_posts" ON social_posts FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_social_connections" ON social_connections FOR ALL TO service_role USING (true);
