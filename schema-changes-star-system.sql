-- Migration to implement GitHub-like star system
-- Replace rating system with binary star system

-- 1. Create new table for tool stars (replacing tool_ratings)
CREATE TABLE IF NOT EXISTS public.tool_stars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tool_id, user_id)
);

-- 2. Update tools table schema - replace rating columns with star columns
ALTER TABLE public.tools 
  DROP COLUMN IF EXISTS rating,
  DROP COLUMN IF EXISTS rating_count,
  ADD COLUMN IF NOT EXISTS star_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Enable RLS on new table
ALTER TABLE public.tool_stars ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for tool_stars
CREATE POLICY "Users can view all tool stars" ON public.tool_stars
  FOR SELECT USING (true);

CREATE POLICY "Users can star tools when authenticated" ON public.tool_stars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unstar their own stars" ON public.tool_stars
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Create RLS policies for tools table (need to allow authenticated users to submit)
DROP POLICY IF EXISTS "Public can view active approved tools" ON public.tools;
DROP POLICY IF EXISTS "Admin can manage all tools" ON public.tools;

CREATE POLICY "Public can view active approved tools" ON public.tools
  FOR SELECT USING (active = true AND approved = true);

CREATE POLICY "Authenticated users can submit tools" ON public.tools
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tools" ON public.tools
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tools" ON public.tools
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all tools" ON public.tools
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 6. Add role column to profiles if it doesn't exist
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- 7. Function to update star count when stars are added/removed
CREATE OR REPLACE FUNCTION public.update_tool_star_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tools 
    SET star_count = star_count + 1
    WHERE id = NEW.tool_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tools 
    SET star_count = star_count - 1
    WHERE id = OLD.tool_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create triggers for star count updates
CREATE OR REPLACE TRIGGER update_star_count_on_insert
  AFTER INSERT ON public.tool_stars
  FOR EACH ROW EXECUTE FUNCTION public.update_tool_star_count();

CREATE OR REPLACE TRIGGER update_star_count_on_delete
  AFTER DELETE ON public.tool_stars
  FOR EACH ROW EXECUTE FUNCTION public.update_tool_star_count();

-- 9. Drop the old tool_ratings table (CAREFUL - this will delete existing data)
-- DROP TABLE IF EXISTS public.tool_ratings;

-- 10. Grant permissions
GRANT ALL ON public.tool_stars TO authenticated;
GRANT ALL ON public.tool_stars TO anon;

-- 11. Initialize star_count for existing tools (set to 0)
UPDATE public.tools SET star_count = 0 WHERE star_count IS NULL;

-- Note: Run this migration after backing up your existing rating data
-- if you want to preserve it or migrate it somehow.