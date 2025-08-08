# How to Add Best Possible Self Tool to Supabase

## Step 1: Access Your Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** or **Table Editor**

## Step 2: Insert into `tools` Table

### Option A: Using SQL Editor
Copy and paste this SQL query:

```sql
INSERT INTO public.tools (slug, channel_slug, tool_data) 
VALUES (
  'best-possible-self',
  'wellness', 
  '{
    "name": "Best Possible Self",
    "icon": "🌟",
    "type": "interactive",
    "url": "YOUR_VERCEL_URL_HERE",
    "category": "mindfulness",
    "description": "A guided visualization exercise to help you imagine and work towards your ideal future self. Based on positive psychology research, this tool helps clarify goals and increase motivation.",
    "submitted_by": "Jongu",
    "creator_name": "Jongu",
    "creator_id": null,
    "creator_link": "https://jongu.com",
    "creator_background": "Official Jongu platform tools designed for wellness and personal growth.",
    "is_active": "true",
    "is_featured": "true",
    "tagline": "Visualize your ideal future self",
    "features": ["AI assistance", "Progress saving", "Export"],
    "pricing": {"model": "free"},
    "stats": {"stars": "0", "views": "0", "sessions": "0"},
    "thumbnail_url": null,
    "ai_config": null
  }'::jsonb
);
```

### Option B: Using Table Editor
1. Go to **Table Editor** → **tools**
2. Click **Insert** → **Insert row**
3. Fill in these fields:

| Field | Value |
|-------|-------|
| `slug` | `best-possible-self` |
| `channel_slug` | `wellness` |
| `tool_data` | Copy the JSON object below |

**JSON for tool_data field:**
```json
{
  "name": "Best Possible Self",
  "icon": "🌟",
  "type": "interactive", 
  "url": "YOUR_VERCEL_URL_HERE",
  "category": "mindfulness",
  "description": "A guided visualization exercise to help you imagine and work towards your ideal future self. Based on positive psychology research, this tool helps clarify goals and increase motivation.",
  "submitted_by": "Jongu",
  "creator_name": "Jongu", 
  "creator_id": null,
  "creator_link": "https://jongu.com",
  "creator_background": "Official Jongu platform tools designed for wellness and personal growth.",
  "is_active": "true",
  "is_featured": "true",
  "tagline": "Visualize your ideal future self",
  "features": ["AI assistance", "Progress saving", "Export"],
  "pricing": {"model": "free"},
  "stats": {"stars": "0", "views": "0", "sessions": "0"},
  "thumbnail_url": null,
  "ai_config": null
}
```

## Step 3: Replace YOUR_VERCEL_URL_HERE
Replace `YOUR_VERCEL_URL_HERE` with your actual Vercel deployment URL for the Best Possible Self tool, for example:
- `https://your-bps-app.vercel.app`

## Step 4: Verify the Upload
1. Go to your wellness community page
2. Look for "Best Possible Self" in the tools grid
3. It should appear with a star icon (🌟) in the mindfulness category

## Available Categories
Choose from these categories for the `category` field:
- `mindfulness`
- `distress-tolerance`  
- `emotion-regulation`
- `interpersonal-effectiveness`
- `creativity`
- `productivity`
- `health`
- `relationships`

## Note
The tool will appear immediately since `is_active` is set to `"true"`. The `is_featured` flag will make it stand out in the community tools grid.