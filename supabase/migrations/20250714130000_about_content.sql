-- Migration: Create about_content table for About section (single record)

CREATE TABLE IF NOT EXISTS about_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL, -- HTML or rich text
  images text[],
  last_modified timestamptz DEFAULT now() NOT NULL,
  updated_by uuid, -- admin user id
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Only one record should exist (enforced at app level)

-- Enable Row Level Security
ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;

-- Public can read
CREATE POLICY "Public can read about content" ON about_content
  FOR SELECT TO public USING (true);

-- Authenticated users (admins) can update
CREATE POLICY "Admin can update about content" ON about_content
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Authenticated users (admins) can insert (for initial setup)
CREATE POLICY "Admin can insert about content" ON about_content
  FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_about_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_about_content_updated_at
  BEFORE UPDATE ON about_content
  FOR EACH ROW
  EXECUTE FUNCTION update_about_content_updated_at(); 