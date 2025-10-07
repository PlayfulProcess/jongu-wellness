# How to Upload Jongu Tools Directly in Supabase

## Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the **Table Editor** section
3. Select the `tools` table

## Step 2: Create a New Tool Entry
Click the **Insert** button or **+ Insert row** to add a new tool.

## Step 3: Fill in the Required Fields

### Field: `id`
- Leave this blank - it will auto-generate a UUID

### Field: `tool_data` (JSONB)
This is where all the tool information goes. Copy and paste this JSON template and modify the values:

```json
{
  "name": "Your Tool Name",
  "title": "Your Tool Title (can be same as name)",
  "claude_url": "https://your-tool-url.vercel.app",
  "category": "mindfulness",
  "description": "A brief description of what your tool does (max 222 characters recommended)",
  "creator_name": "Jongu",
  "creator_link": "https://jongu.com",
  "creator_background": "Official Jongu platform tools designed for wellness and personal growth.",
  "submitted_by": "Jongu",
  "is_active": "true",
  "is_jongu_tool": true,
  "thumbnail_url": null,
  "stats": {
    "stars": "0",
    "clicks": "0"
  }
}
```

### Category Options
Use one of these exact values for the `category` field:
- `mindfulness` - Mindfulness & Creativity
- `distress-tolerance` - Distress Tolerance  
- `emotion-regulation` - Emotion Regulation
- `interpersonal-effectiveness` - Interpersonal Effectiveness

### Field: `created_by`
- Enter the user UUID if you know it, or leave NULL

### Field: `created_at`
- Leave blank - will auto-populate with current timestamp

## Step 4: Save the Entry
Click **Save** or **Insert** to create the tool.

## Example Entry

Here's a complete example for the Best Possible Self tool:

```json
{
  "name": "Best Possible Self",
  "title": "Best Possible Self",
  "claude_url": "https://jongu-best-possible-self.vercel.app",
  "category": "mindfulness",
  "description": "A research-backed reflection practice from Berkeley's Greater Good Science Center that helps you envision your brightest future through guided journaling.",
  "creator_name": "Jongu",
  "creator_link": "https://jongu.com",
  "creator_background": "Official Jongu platform tools designed for wellness and personal growth.",
  "submitted_by": "Jongu",
  "is_active": "true",
  "is_jongu_tool": true,
  "thumbnail_url": null,
  "stats": {
    "stars": "0",
    "clicks": "0"
  }
}
```

## Verification
After saving:
1. Go to your Jongu Wellness site
2. Check that the tool appears in the correct category
3. Verify the tool link works when clicked
4. The tool should have the Jongu badge if `is_jongu_tool` is set to true

## Notes
- The `is_active` field must be set to `"true"` (as a string) for the tool to appear
- Star and click counts will update automatically as users interact with the tool
- You can add a thumbnail URL later if you have one hosted somewhere