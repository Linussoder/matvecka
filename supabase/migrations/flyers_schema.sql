-- Flyers System Database Schema
-- Run this in your Supabase SQL editor

-- Table for tracking weeks (if not already exists)
CREATE TABLE IF NOT EXISTS weeks (
  id SERIAL PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for flyers (reklamblad)
CREATE TABLE IF NOT EXISTS flyers (
  id SERIAL PRIMARY KEY,
  week_id INTEGER REFERENCES weeks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  store TEXT NOT NULL, -- ICA, Coop, City Gross, Willys, Lidl
  valid_from DATE,
  valid_to DATE,
  status TEXT DEFAULT 'processing', -- processing, completed
  page_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for flyer pages
CREATE TABLE IF NOT EXISTS flyer_pages (
  id SERIAL PRIMARY KEY,
  flyer_id INTEGER REFERENCES flyers(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for product hotspots on flyer pages
CREATE TABLE IF NOT EXISTS flyer_hotspots (
  id SERIAL PRIMARY KEY,
  flyer_page_id INTEGER REFERENCES flyer_pages(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  x DECIMAL(5,2) NOT NULL, -- Position from left (0-100%)
  y DECIMAL(5,2) NOT NULL, -- Position from top (0-100%)
  width DECIMAL(5,2) NOT NULL, -- Width (0-100%)
  height DECIMAL(5,2) NOT NULL, -- Height (0-100%)
  confidence DECIMAL(3,2) DEFAULT 0.9, -- AI confidence score
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add source column to products table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'source'
  ) THEN
    ALTER TABLE products ADD COLUMN source TEXT DEFAULT 'manual';
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_flyers_week_id ON flyers(week_id);
CREATE INDEX IF NOT EXISTS idx_flyers_store ON flyers(store);
CREATE INDEX IF NOT EXISTS idx_flyer_pages_flyer_id ON flyer_pages(flyer_id);
CREATE INDEX IF NOT EXISTS idx_flyer_hotspots_page_id ON flyer_hotspots(flyer_page_id);
CREATE INDEX IF NOT EXISTS idx_flyer_hotspots_product_id ON flyer_hotspots(product_id);

-- Enable Row Level Security
ALTER TABLE flyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flyer_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE flyer_hotspots ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY IF NOT EXISTS "Allow public read access on flyers"
  ON flyers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow public read access on flyer_pages"
  ON flyer_pages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow public read access on flyer_hotspots"
  ON flyer_hotspots FOR SELECT
  TO anon
  USING (true);

-- Service role full access (for admin operations)
CREATE POLICY IF NOT EXISTS "Allow service role full access on flyers"
  ON flyers FOR ALL
  TO service_role
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow service role full access on flyer_pages"
  ON flyer_pages FOR ALL
  TO service_role
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow service role full access on flyer_hotspots"
  ON flyer_hotspots FOR ALL
  TO service_role
  USING (true);
