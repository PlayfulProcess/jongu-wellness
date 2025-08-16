-- Ensure tools table exists with correct structure for ultra minimal schema
-- This migration is idempotent and can be run multiple times

-- Create tools table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  channel_slug TEXT DEFAULT 'wellness',
  tool_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_tools_slug ON public.tools(slug);
CREATE INDEX IF NOT EXISTS idx_tools_channel ON public.tools(channel_slug);
CREATE INDEX IF NOT EXISTS idx_tools_category ON public.tools((tool_data->>'category'));
CREATE INDEX IF NOT EXISTS idx_tools_active ON public.tools((tool_data->>'is_active'));
CREATE INDEX IF NOT EXISTS idx_tools_featured ON public.tools((tool_data->>'is_featured'));

-- Enable RLS
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active tools" ON public.tools;
DROP POLICY IF EXISTS "Authenticated users can submit tools" ON public.tools;
DROP POLICY IF EXISTS "Users can update their own tools" ON public.tools;
DROP POLICY IF EXISTS "Users can delete their own tools" ON public.tools;

-- Create policies
CREATE POLICY "Anyone can view active tools" ON public.tools
  FOR SELECT
  USING (tool_data->>'is_active' = 'true');

CREATE POLICY "Authenticated users can submit tools" ON public.tools
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own tools" ON public.tools
  FOR UPDATE
  TO authenticated
  USING (tool_data->>'creator_id' = auth.uid()::text);

CREATE POLICY "Users can delete their own tools" ON public.tools
  FOR DELETE
  TO authenticated
  USING (tool_data->>'creator_id' = auth.uid()::text);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_tools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_tools_updated_at_trigger ON public.tools;
CREATE TRIGGER update_tools_updated_at_trigger
  BEFORE UPDATE ON public.tools
  FOR EACH ROW
  EXECUTE FUNCTION update_tools_updated_at();