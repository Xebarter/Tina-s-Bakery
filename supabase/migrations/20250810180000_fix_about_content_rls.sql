-- Enable RLS on about_content table
ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access to about_content
CREATE POLICY "Enable read access for all users" ON "public"."about_content"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert/update about_content
CREATE POLICY "Enable insert for authenticated users" ON "public"."about_content"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "public"."about_content"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
