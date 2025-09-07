-- Migration to add creator_link to tools table
-- This adds a creator_link field to the tool_data JSONB column

-- Update existing tools to have a creator_link field (set to null initially)
UPDATE tools 
SET tool_data = jsonb_set(
  tool_data,
  '{creator_link}',
  'null'::jsonb,
  true
)
WHERE tool_data IS NOT NULL;

-- Example of how to update specific tools with creator links:
-- UPDATE tools 
-- SET tool_data = jsonb_set(
--   tool_data,
--   '{creator_link}',
--   '"https://example.com/creator-profile"'::jsonb
-- )
-- WHERE (tool_data->>'creator_name') = 'Creator Name';

-- Note: You'll need to manually update each tool with the appropriate creator link
-- or have users provide this when submitting new tools