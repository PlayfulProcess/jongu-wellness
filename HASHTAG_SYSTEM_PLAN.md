# Hashtag System Implementation Plan (Simplified)

## Overview
Replace fixed categories with a flexible hashtag system where users can add custom tags. The most popular tags are calculated and displayed client-side. This approach minimizes database complexity and is perfect for small-scale use.

**IMPORTANT**: We're keeping the database column name as `category` to avoid unnecessary complexity. It will just store an array of hashtags (TEXT[]) instead of a single string (TEXT).

---

## Part 1: DATABASE CHANGES (You do this in Supabase)

### Step 1: Backup Current Data
Before making changes, run this query to see your current data:
```sql
SELECT id, name, category FROM community_tools;
```

### Step 2: Convert Column Type to Array
Execute these commands **in order** in the Supabase SQL Editor:

```sql
-- Step 2a: Convert existing single category values to array format
-- This changes the column type from TEXT to TEXT[]
ALTER TABLE community_tools
ALTER COLUMN category TYPE TEXT[] USING
  CASE
    WHEN category IS NULL OR category = '' THEN '{}'::TEXT[]
    ELSE ARRAY[category]
  END;

-- Step 2b: Set default value for new entries
ALTER TABLE community_tools
ALTER COLUMN category SET DEFAULT '{}';
```

### Step 3: Verify Migration
Check that data migrated correctly:
```sql
SELECT id, name, category FROM community_tools LIMIT 10;
```

You should see arrays like `{mindfulness}`, `{anxiety}`, etc.

### Step 4: Update RLS Policies (if needed)
If you have any policies that filter by `category`, you'll need to update them to work with arrays. Check existing policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'community_tools';
```

If any filter by `category`, update them to use array syntax. For example:
```sql
-- Change from: WHERE category = 'mindfulness'
-- To: WHERE 'mindfulness' = ANY(category)
```

### Step 5: Create Index for Performance
```sql
-- Create GIN index for array operations (improves filter performance)
CREATE INDEX idx_community_tools_category ON community_tools USING GIN (category);
```

**That's it for database changes!** ✅

---

## Part 2: FRONTEND CHANGES (Code implementation)

### Frontend Philosophy
- Fetch all tools to client
- Extract all unique hashtags from `category` array in JavaScript
- Count and sort by popularity client-side
- All filtering happens in browser
- No need for separate hashtags API endpoint
- Database field is `category` (array), UI calls them "hashtags"

### 1. Update SubmitToolModal Component
**File:** `src/components/modals/SubmitToolModal.tsx`

**Changes:**
- Remove category dropdown (`<select>`)
- Add hashtag input field with chips UI
- Allow multiple hashtags (comma or space separated)
- Validate: lowercase, no spaces, alphanumeric + hyphens only
- Limit to 5 hashtags per tool
- Display selected hashtags as removable chips
- Submit as `category` array to API

**UI Example:**
```tsx
// Input field
<input
  type="text"
  placeholder="Add hashtags: mindfulness, anxiety, gratitude"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addHashtag(e.currentTarget.value);
      e.currentTarget.value = '';
    }
  }}
/>

// Display chips
<div className="flex flex-wrap gap-2 mt-2">
  {category.map(tag => (
    <span key={tag} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
      #{tag}
      <button onClick={() => removeHashtag(tag)}>×</button>
    </span>
  ))}
</div>
```

**Validation function:**
```typescript
function normalizeHashtag(input: string): string | null {
  let tag = input.trim().toLowerCase();
  // Remove # if user added it
  tag = tag.replace(/^#/, '');
  // Only allow alphanumeric and hyphens
  if (!/^[a-z0-9-]+$/.test(tag)) return null;
  // Max 20 characters
  if (tag.length > 20) return null;
  return tag;
}
```

**Submit format:**
```typescript
// Send as array: ["mindfulness", "anxiety", "gratitude"]
const formData = {
  name: toolName,
  category: selectedHashtags, // array of strings (field name is 'category' in DB)
  // ... other fields
};
```

### 2. Rename CategoryFilter → HashtagFilter
**File:** `src/components/community/CategoryFilter.tsx` → `HashtagFilter.tsx`

**Changes:**
- Remove hardcoded category list with icons
- Accept `allTools` as prop
- Calculate popular hashtags client-side from `tool.category` array:
  ```typescript
  const hashtagCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    allTools.forEach(tool => {
      tool.category?.forEach(tag => {  // category is now an array
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .slice(0, 15); // Top 15
  }, [allTools]);
  ```
- Display as simple pill buttons (no icons)
- Keep "All" option to clear filter

**UI Example:**
```tsx
<div className="flex flex-wrap gap-2">
  <button
    onClick={() => onHashtagChange('all')}
    className={selectedHashtag === 'all' ? 'active' : ''}
  >
    All ({totalTools})
  </button>

  {hashtagCounts.map(([tag, count]) => (
    <button
      key={tag}
      onClick={() => onHashtagChange(tag)}
      className={selectedHashtag === tag ? 'active' : ''}
    >
      #{tag} ({count})
    </button>
  ))}
</div>
```

### 3. Update ToolGrid Component
**File:** `src/components/community/ToolGrid.tsx`

**Changes:**
- Change filter logic to use `tool.category.includes(selectedHashtag)` (category is now array)
- Display hashtags on each tool card as clickable chips
- Click handler to filter by that hashtag

**Filter logic:**
```typescript
const filteredTools = tools.filter(tool => {
  // Hashtag filter (category is array)
  if (selectedHashtag !== 'all' && !tool.category?.includes(selectedHashtag)) {
    return false;
  }

  // Search filter (check if query matches name, description, OR hashtags)
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    const matchesName = tool.name.toLowerCase().includes(query);
    const matchesDesc = tool.description?.toLowerCase().includes(query);
    const matchesHashtag = tool.category?.some(tag => tag.includes(query));

    if (!matchesName && !matchesDesc && !matchesHashtag) {
      return false;
    }
  }

  return true;
});
```

**Tool card display:**
```tsx
<div className="tool-card">
  <h3>{tool.name}</h3>
  <p>{tool.description}</p>

  {/* Display hashtags */}
  <div className="flex flex-wrap gap-1 mt-2">
    {tool.category?.map(tag => (
      <button
        key={tag}
        onClick={() => onHashtagClick(tag)}
        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
      >
        #{tag}
      </button>
    ))}
  </div>
</div>
```

### 4. Update Main Page Component
**File:** `src/app/page.tsx`

**Changes:**
- Rename `selectedCategory` → `selectedHashtag`
- Remove `categoryStats` (no longer needed, calculated in HashtagFilter)
- Update `fetchStats` to pass all tools to HashtagFilter

**State changes:**
```typescript
const [selectedHashtag, setSelectedHashtag] = useState('all');
const [allTools, setAllTools] = useState([]);
```

**Fetch function:**
```typescript
const fetchStats = async () => {
  try {
    const response = await fetch('/api/community/tools');
    const tools = await response.json();

    setAllTools(tools);
    setTotalTools(tools.length);

    // Calculate total stars
    const allStars = tools.reduce((sum, tool) => sum + (tool.star_count || 0), 0);
    setTotalStars(allStars);
  } catch (error) {
    console.error('Error fetching tools:', error);
  }
};
```

**Component updates:**
```tsx
<HashtagFilter
  selectedHashtag={selectedHashtag}
  onHashtagChange={setSelectedHashtag}
  allTools={allTools}
/>

<ToolGrid
  selectedHashtag={selectedHashtag}
  sortBy={sortBy}
  searchQuery={searchQuery}
  onToolStar={fetchStats}
/>
```

### 5. Update API Endpoint
**File:** `src/app/api/community/tools/route.ts`

**Changes:**
- Ensure SELECT query includes `category` field (now array)
- No filtering needed server-side (client handles it)
- Return category array in response

```typescript
const { data: tools, error } = await supabase
  .from('community_tools')
  .select('id, name, description, url, category, star_count, created_at')
  .order('created_at', { ascending: false });
```

### 6. Update Submit API Endpoint
**File:** `src/app/api/community/tools/submit/route.ts`

**Changes:**
- Accept `category` as array instead of string
- Validate array format
- Store as array in database

```typescript
const { name, description, url, category } = await request.json();

// Validate category is array with 1-5 items
if (!Array.isArray(category) || category.length === 0 || category.length > 5) {
  return NextResponse.json({ error: 'Invalid hashtags (1-5 required)' }, { status: 400 });
}

const { data, error } = await supabase
  .from('community_tools')
  .insert([
    {
      name,
      description,
      url,
      category, // Store as array
      // ... other fields
    }
  ]);
```

---

## Part 3: IMPLEMENTATION ORDER

### Phase 1: Database ✅ (You do this first)
1. Run database migration scripts in Supabase
2. Verify data migrated correctly (arrays visible)
3. Create index for performance

### Phase 2: Backend API
1. Update `/api/community/tools` route to return `category` as array
2. Update `/api/community/tools/submit` to accept `category` array
3. Add validation for array format and limits

### Phase 3: Frontend - Submit Form
1. Update `SubmitToolModal.tsx`
2. Add hashtag input with chips UI
3. Add validation and normalization
4. Test submitting tools with hashtags

### Phase 4: Frontend - Display & Filter
1. Rename `CategoryFilter.tsx` → `HashtagFilter.tsx`
2. Update to calculate popular hashtags client-side from `category` arrays
3. Update `ToolGrid.tsx` to filter by hashtag using array methods
4. Update tool cards to display hashtags from `category` array
5. Update `page.tsx` to use new component names

### Phase 5: Testing
1. Submit new tool with hashtags
2. Verify hashtags appear on cards
3. Click hashtag to filter
4. Search for hashtag terms
5. Test mobile responsiveness

### Phase 6: Cleanup
1. Remove old category dropdown code
2. Remove icon mappings and emojis
3. Update documentation

---

## Testing Checklist

- [ ] Database migration completed without errors
- [ ] Existing tools have `category` as arrays
- [ ] Can submit new tool with 1-5 hashtags
- [ ] Hashtag validation rejects invalid input
- [ ] Popular hashtags display correctly (top 15)
- [ ] Clicking filter button shows only matching tools
- [ ] Clicking hashtag on card filters to that tag
- [ ] Search matches hashtag terms
- [ ] Mobile layout works properly
- [ ] All tools display properly

---

## Benefits of This Simplified Approach

✅ **Minimal database changes** - Just type conversion, no rename
✅ **No extra tables** - Keep database simple
✅ **Client-side processing** - Easy to debug and iterate
✅ **No complex queries** - Just fetch all tools
✅ **Perfect for small scale** - Works great for handful of users
✅ **Easy rollback** - Can revert type if needed
✅ **Fast iteration** - Change filtering logic without DB migrations
✅ **No frontend complexity** - Column name stays `category`, UI calls them hashtags

---

## Potential Issues & Solutions

**Issue:** Users create duplicate hashtags with variations (e.g., "mindfulness" vs "mindful")
**Solution:** Normalize to lowercase, show suggestions as they type, could add admin merge feature later

**Issue:** Too many unique hashtags clutter the filter
**Solution:** Only show top 15 most popular, could add "Show more" button later

**Issue:** Performance with many tools
**Solution:** GIN index on category column handles this, client-side filtering is fast for 100s of tools

**Issue:** No autocomplete suggestions
**Solution:** Phase 2 enhancement - extract all existing hashtags and show as dropdown suggestions

---

## Code Cleanup After Implementation

Once hashtag system is implemented and tested, the following code can be safely removed:

### 1. Remove Hardcoded Categories Array
**File:** `src/components/community/CategoryFilter.tsx` (entire file deleted after creating HashtagFilter.tsx)

**Code to remove:**
```typescript
const categories = [
  { key: 'all', name: 'All Tools', emoji: '🌟' },
  { key: 'mindfulness', name: 'Mindfulness & Creativity', emoji: '🧘' },
  { key: 'distress-tolerance', name: 'Distress Tolerance', emoji: '🛡️' },
  { key: 'emotion-regulation', name: 'Emotion Regulation', emoji: '❤️' },
  { key: 'interpersonal-effectiveness', name: 'Interpersonal Effectiveness', emoji: '🤝' }
];
```

### 2. Remove Category Design/Icon Mappings
**File:** `src/components/community/ToolCard.tsx`

Remove the entire `getCategoryDesign()` function and all category icon/placeholder rendering code.

### 3. Update TypeScript Interfaces
**File:** `src/components/community/ToolCard.tsx`
**File:** `src/components/community/ToolGrid.tsx`

**Change from:**
```typescript
interface Tool {
  id: string;
  name: string;
  url: string;
  category: string;  // ← Change type
  description: string;
  // ...
}
```

**To:**
```typescript
interface Tool {
  id: string;
  name: string;
  url: string;
  category: string[];  // ← Now an array
  description: string;
  // ...
}
```

### 4. Remove Category Dropdown from Submit Form
**File:** `src/components/modals/SubmitToolModal.tsx`

Remove the entire `<select>` dropdown and hardcoded categories array. Replace with hashtag chip input.

### 5. Update Form State
**File:** `src/components/modals/SubmitToolModal.tsx`

Change `category: ''` to `category: []` in form state.

---

## Summary

- **Database**: `category` column changes from TEXT → TEXT[] (array)
- **API**: Returns and accepts `category` as array
- **Frontend**: Treats `category` array as hashtags, displays with # prefix
- **UI**: Filter buttons show popular hashtags from all tools' `category` arrays
- **Cleanup**: Remove hardcoded category lists, icons, and emoji mappings
