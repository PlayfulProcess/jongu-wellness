# Hashtag System Implementation Plan

## Overview
Replace fixed categories with a flexible hashtag system where users can add custom tags and the most popular tags are displayed as filters.

## Database Changes

### 1. Update `community_tools` table
```sql
-- Add new column for hashtags (array of text)
ALTER TABLE community_tools
ADD COLUMN hashtags TEXT[] DEFAULT '{}';

-- Optional: Keep category for backward compatibility during migration
-- Or remove it entirely after migration
```

### 2. Create hashtags tracking table (optional but recommended)
```sql
CREATE TABLE tool_hashtags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hashtag TEXT NOT NULL,
  tool_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tool_hashtags_count ON tool_hashtags(tool_count DESC);
CREATE INDEX idx_tool_hashtags_name ON tool_hashtags(hashtag);
```

### 3. Migration script needed
```sql
-- Convert existing categories to hashtags
UPDATE community_tools
SET hashtags = ARRAY[category]
WHERE category IS NOT NULL;
```

## Frontend Changes

### 1. SubmitToolModal Component
**File:** `src/components/modals/SubmitToolModal.tsx`

**Changes needed:**
- Remove category dropdown
- Add hashtag input field (similar to tag input)
  - Allow multiple hashtags
  - Auto-suggest existing hashtags as user types
  - Validate hashtag format (no spaces, special chars, etc.)
  - Display selected hashtags as chips/badges
  - Limit to 3-5 hashtags per tool

**UI Design:**
```tsx
<input
  type="text"
  placeholder="Add hashtags (e.g., #mindfulness #anxiety)"
  // On enter or space, add hashtag
  // Show suggestions below input
/>
<div className="hashtag-chips">
  {/* Display selected hashtags as removable chips */}
</div>
```

### 2. CategoryFilter Component
**File:** `src/components/community/CategoryFilter.tsx`

**Rename to:** `HashtagFilter.tsx`

**Changes needed:**
- Fetch top N hashtags (e.g., top 10-15) from database
- Display as filter pills/buttons
- Remove hardcoded category list
- Remove icons (or keep generic icon for all hashtags)
- Add "All" option
- Sort by popularity (tool_count)

**Data fetching:**
```typescript
// Fetch popular hashtags
const popularHashtags = await fetch('/api/community/hashtags?limit=15');
```

### 3. ToolGrid Component
**File:** `src/components/community/ToolGrid.tsx`

**Changes needed:**
- Update filtering logic to filter by hashtags instead of category
- Display tool hashtags as clickable chips on each tool card
- When clicking a hashtag on a card, filter by that hashtag

### 4. Tool Card Display
- Show hashtags instead of category badge
- Make hashtags clickable to filter
- Design: Small blue/gray chips with # prefix

### 5. Stats Display
**File:** `src/components/community/StatsDisplay.tsx`

**Changes needed:**
- Update categoryStats to hashtagStats
- Show top 5 hashtags with counts

## API Changes

### 1. New endpoint: `/api/community/hashtags`
**Purpose:** Get popular hashtags

**Response:**
```json
[
  { "hashtag": "mindfulness", "count": 15 },
  { "hashtag": "anxiety", "count": 12 },
  { "hashtag": "gratitude", "count": 10 }
]
```

### 2. Update: `/api/community/tools`
**Changes:**
- Add hashtag filtering: `/api/community/tools?hashtag=mindfulness`
- Return hashtags array in tool objects
- Update search to include hashtag search

### 3. Update: `/api/community/tools/submit`
**Changes:**
- Accept hashtags array instead of category
- Validate hashtags format
- Update/create entries in tool_hashtags table

## UI/UX Considerations

### Hashtag Input UX
1. **Auto-complete:** Show suggestions as user types
2. **Validation:**
   - No spaces
   - Max length (e.g., 20 chars)
   - Alphanumeric + hyphens only
   - Auto-add # prefix if missing
3. **Limits:** Max 5 hashtags per tool
4. **Display:** Show as removable chips with X button

### Filter Display
1. **Popular first:** Show most-used hashtags
2. **Responsive:** Wrap hashtags on mobile
3. **Active state:** Highlight selected hashtag
4. **Clear filter:** Easy way to show all tools again

### Icon Considerations
- **Option 1:** Remove icons entirely (simpler, cleaner)
- **Option 2:** Keep a single generic tag icon for all hashtags
- **Option 3:** Let users optionally select from icon set
- **Recommendation:** Option 1 or 2 for simplicity

## Implementation Order

1. **Phase 1: Backend** ✅ Database schema changes
   - Add hashtags column
   - Create migration script
   - Update RLS policies if needed

2. **Phase 2: API** ✅ Update endpoints
   - Create /api/community/hashtags
   - Update /api/community/tools for filtering
   - Update submit endpoint

3. **Phase 3: Frontend - Submit**
   - Update SubmitToolModal with hashtag input
   - Add validation and chip UI

4. **Phase 4: Frontend - Display**
   - Update CategoryFilter → HashtagFilter
   - Update ToolGrid filtering logic
   - Update tool cards to show hashtags

5. **Phase 5: Migration**
   - Run migration script on existing data
   - Test thoroughly

6. **Phase 6: Cleanup**
   - Remove category column (optional)
   - Remove old icon assets
   - Update documentation

## Testing Checklist

- [ ] Can submit tool with hashtags
- [ ] Hashtag validation works
- [ ] Popular hashtags display correctly
- [ ] Filtering by hashtag works
- [ ] Clicking hashtag on card filters properly
- [ ] Search includes hashtag matching
- [ ] Stats display correct hashtag counts
- [ ] Mobile responsive design works
- [ ] Existing tools migrated properly

## Potential Issues & Solutions

**Issue:** Users might create duplicate hashtags with slight variations
**Solution:**
- Normalize hashtags (lowercase, trim)
- Show "suggested" hashtags prominently
- Maybe merge similar hashtags

**Issue:** Too many hashtags to display
**Solution:**
- Limit filter display to top 10-15
- Add "Show more" option
- Consider grouping related hashtags

**Issue:** No hashtags on old tools
**Solution:**
- Migration script handles this
- Admin can bulk-edit if needed
- Encourage users to add hashtags
