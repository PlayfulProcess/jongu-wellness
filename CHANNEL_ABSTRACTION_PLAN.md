# Channel Abstraction Plan

## Overview
Create a reusable channel system similar to the course viewer approach, where different channels (Wellness, Parents, Developers, etc.) can be created using the same page template with channel-specific data loaded from configuration or database.

## Approach: Similar to Course Viewer Pattern

### Course Viewer Pattern Recap
The course viewer uses:
- Single template page (`course-viewer.html`)
- URL parameter (`?course=vibe-coding-101`)
- MDX files for content (`courses/vibe-coding-101.mdx`)
- JavaScript to load and render content dynamically

### Channel System Pattern
We can adopt a similar approach:
- Single channel template (`/channel/[channelId]/page.tsx`)
- URL routing (e.g., `/channel/wellness`, `/channel/parents`)
- Channel configuration files or database
- Dynamic rendering based on channel data

## Implementation Options

### Option 1: File-Based Configuration (Simpler, like Course Viewer)

**Structure:**
```
/channels/
  wellness.json
  parents.json
  developers.json
```

**Channel Config Example (wellness.json):**
```json
{
  "id": "wellness",
  "name": "Wellness Channel",
  "slug": "wellness",
  "description": "Mental health & wellness tools",
  "heroImage": "/images/wellness-hero.jpg",
  "heroGradient": "from-purple-500 via-pink-500 to-rose-500",
  "tagline": "Evidence-Based Wellness Tools",
  "intro": "This channel brings together evidence-based wellness practices...",
  "infoBox": {
    "title": "What makes this different?",
    "points": [
      { "title": "Open Access", "description": "All tools are completely free..." },
      { "title": "Human-centered", "description": "Tools will still be valuable..." }
    ]
  },
  "defaultCategories": ["mindfulness", "anxiety", "gratitude"],
  "subdomain": "channels.recursive.eco",
  "mainUrl": "https://channels.recursive.eco"
}
```

**Routing:**
```
/channel/wellness → loads channels/wellness.json
/channel/parents → loads channels/parents.json
```

### Option 2: Database-Driven (More Flexible, Scalable)

**New Table: `channels`**
```sql
CREATE TABLE channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  hero_image_url TEXT,
  hero_gradient TEXT,
  tagline TEXT,
  intro_text TEXT,
  info_box JSONB,
  config JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link tools to channels
ALTER TABLE community_tools
ADD COLUMN channel_id UUID REFERENCES channels(id);
```

**Benefits:**
- No deployment needed to add new channels
- Admin UI can manage channels
- Dynamic channel creation
- Better for multi-channel scaling

### Option 3: Hybrid Approach (Recommended)

**Combine both:**
- Default channels defined in config files (wellness, parents, developers)
- Database for user-created or custom channels
- Fallback to config if not in database

## File Structure Changes

### Current Structure
```
/app/page.tsx (hardcoded for wellness)
```

### New Structure
```
/app/
  page.tsx (redirect to /channel/wellness or landing page)
  channel/
    [channelId]/
      page.tsx (dynamic channel page)
    ChannelPage.tsx (reusable component)
/config/
  channels/
    wellness.json
    parents.json
    developers.json
/components/
  channel/
    ChannelHero.tsx
    ChannelInfoBox.tsx
    ChannelToolGrid.tsx
```

## Component Abstraction

### 1. ChannelHero Component
**File:** `components/channel/ChannelHero.tsx`

**Props:**
```typescript
interface ChannelHeroProps {
  name: string;
  tagline: string;
  description: string;
  gradientClasses: string;
  imageUrl?: string;
}
```

### 2. ChannelInfoBox Component
**File:** `components/channel/ChannelInfoBox.tsx`

**Props:**
```typescript
interface InfoBoxPoint {
  title: string;
  description: string;
  link?: { url: string; text: string };
}

interface ChannelInfoBoxProps {
  title: string;
  points: InfoBoxPoint[];
}
```

### 3. ChannelToolGrid Component
**File:** `components/channel/ChannelToolGrid.tsx`

**Props:**
```typescript
interface ChannelToolGridProps {
  channelId: string;
  defaultHashtags?: string[];
}
```

### 4. Main ChannelPage Component
**File:** `app/channel/[channelId]/page.tsx`

```typescript
export default async function ChannelPage({
  params
}: {
  params: { channelId: string }
}) {
  // Load channel config
  const channelConfig = await loadChannelConfig(params.channelId);

  if (!channelConfig) {
    notFound();
  }

  return (
    <>
      <Header />
      <ChannelHero {...channelConfig.hero} />
      <ChannelInfoBox {...channelConfig.infoBox} />
      <ChannelToolGrid
        channelId={channelConfig.id}
        defaultHashtags={channelConfig.defaultHashtags}
      />
      <Footer />
    </>
  );
}
```

## URL Structure

### Primary Domain (recursive.eco)
```
https://www.recursive.eco/channel/wellness
https://www.recursive.eco/channel/parents
https://www.recursive.eco/channel/developers
```

### Subdomain Routing
```
https://channels.recursive.eco → /channel/wellness (default)
https://parents.recursive.eco → /channel/parents
https://developers.recursive.eco → /channel/developers
```

**Next.js Middleware for subdomain routing:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');

  if (hostname?.startsWith('parents.')) {
    return NextResponse.rewrite(new URL('/channel/parents', request.url));
  }
  if (hostname?.startsWith('developers.')) {
    return NextResponse.rewrite(new URL('/channel/developers', request.url));
  }
  if (hostname?.startsWith('channels.')) {
    return NextResponse.rewrite(new URL('/channel/wellness', request.url));
  }
}
```

## Data Fetching Strategy

### Config Loading Function
```typescript
// lib/channel-config.ts
export async function loadChannelConfig(channelId: string) {
  // Option 1: File-based
  try {
    const config = await import(`@/config/channels/${channelId}.json`);
    return config.default;
  } catch (error) {
    return null;
  }

  // Option 2: Database
  // const channel = await supabase
  //   .from('channels')
  //   .select('*')
  //   .eq('slug', channelId)
  //   .single();

  // return channel.data;
}
```

### Tools Filtering by Channel
```typescript
// Update API to filter by channel
/api/community/tools?channelId=wellness
```

## Migration Steps

### Phase 1: Extract Components
1. Create ChannelHero component from existing hero section
2. Create ChannelInfoBox component from info box
3. Create ChannelToolGrid component from tool grid
4. Test with current hardcoded data

### Phase 2: Create Config System
1. Create wellness.json with current content
2. Create parents.json with placeholder content
3. Create developers.json with placeholder content
4. Create config loader utility

### Phase 3: Implement Dynamic Routing
1. Create `/channel/[channelId]/page.tsx`
2. Implement channel loading logic
3. Test all routes work correctly
4. Add 404 handling for invalid channels

### Phase 4: Update Database
1. Add channel_id to community_tools
2. Migrate existing tools to wellness channel
3. Update APIs to filter by channel
4. Test data isolation between channels

### Phase 5: Polish & Launch
1. Add channel switcher to header
2. Update navigation to link to channels
3. Configure subdomain routing
4. Add channel management UI (optional)
5. Documentation for adding new channels

## Supabase Considerations

### Row Level Security (RLS)
```sql
-- Users can only see tools from active channels
CREATE POLICY "Users see tools from active channels"
ON community_tools
FOR SELECT
USING (
  channel_id IN (
    SELECT id FROM channels WHERE is_active = true
  )
);

-- Users can submit tools to active channels
CREATE POLICY "Users submit to active channels"
ON community_tools
FOR INSERT
WITH CHECK (
  channel_id IN (
    SELECT id FROM channels WHERE is_active = true
  )
);
```

### Indexes
```sql
CREATE INDEX idx_tools_channel ON community_tools(channel_id);
CREATE INDEX idx_channels_slug ON channels(slug);
CREATE INDEX idx_channels_active ON channels(is_active);
```

## Benefits of This Approach

1. **Scalability:** Easy to add new channels without code changes
2. **Maintainability:** DRY principle - single template for all channels
3. **Consistency:** All channels have the same structure and features
4. **Flexibility:** Each channel can have custom config while sharing code
5. **SEO:** Each channel gets its own URL and can be indexed separately
6. **Performance:** Can cache channel configs, lazy load tools per channel

## Example: Adding a New Channel

### Step 1: Create config file
```json
// config/channels/meditation.json
{
  "id": "meditation",
  "name": "Meditation Channel",
  "slug": "meditation",
  "tagline": "Guided Meditation Tools",
  "heroGradient": "from-blue-500 to-teal-500",
  // ... rest of config
}
```

### Step 2: That's it!
- Visit `/channel/meditation`
- Tools will automatically filter to this channel
- No code deployment needed

## Testing Checklist

- [ ] Can navigate to each channel via URL
- [ ] Each channel displays correct content
- [ ] Tools filter by channel correctly
- [ ] Subdomain routing works
- [ ] Invalid channels show 404
- [ ] SEO metadata updates per channel
- [ ] Mobile responsive for all channels
- [ ] Share URLs work correctly
- [ ] No data leakage between channels

## Future Enhancements

1. **Channel Admin Panel:**
   - Create/edit channels via UI
   - Upload hero images
   - Customize colors/gradients

2. **Channel Analytics:**
   - Track visits per channel
   - Popular tools per channel
   - User engagement metrics

3. **Cross-Channel Features:**
   - Discover other channels
   - Related tools from other channels
   - Unified search across channels

4. **Channel Permissions:**
   - Private channels
   - Channel moderators
   - Invite-only channels
