import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

interface DatabaseTool {
  id: string;
  tool_data?: {
    name?: string;
    title?: string;
    url?: string;
    claude_url?: string;
    category?: string;
    description?: string;
    submitted_by?: string;
    creator_name?: string;
    is_active?: string;
    thumbnail_url?: string;
    stats?: {
      stars?: string;
      clicks?: string;
    };
    click_count?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'stars';
    
    let query = supabase
      .from('tools')
      .select('id, slug, channel_slug, tool_data, created_at, updated_at')
      .eq('tool_data->>is_active', 'true');
    
    // Apply category filter
    if (category && category !== 'all') {
      query = query.eq('tool_data->>category', category);
    }
    
    // Apply sorting
    switch (sort) {
      case 'stars':
        query = query.order('tool_data->stats->>stars', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('tool_data->stats->>stars', { ascending: false });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching tools:', error);
      return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
    }
    
    // Transform JSONB data to match frontend expectations
    const transformedTools = (data || []).map((tool: DatabaseTool) => ({
      id: tool.id,
      name: tool.tool_data?.name || '',
      title: tool.tool_data?.title || tool.tool_data?.name || '', // Add title field for compatibility
      url: tool.tool_data?.url || tool.tool_data?.claude_url || '#',
      category: tool.tool_data?.category || 'uncategorized',
      description: tool.tool_data?.description || '',
      submitted_by: tool.tool_data?.submitted_by || tool.tool_data?.creator_name || 'Anonymous',
      star_count: parseInt(tool.tool_data?.stats?.stars || '0'),
      thumbnail_url: tool.tool_data?.thumbnail_url || null, // Add thumbnail_url mapping
      total_clicks: parseInt(tool.tool_data?.stats?.clicks || tool.tool_data?.click_count || '0'), // Add clicks for ToolCard
      created_at: tool.created_at,
      approved: tool.tool_data?.is_active === 'true',
      active: tool.tool_data?.is_active === 'true'
    }));
    
    return NextResponse.json(transformedTools);
  } catch (error) {
    console.error('Error in tools API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required to submit tools' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    const {
      name,
      url,
      category,
      description,
      submitted_by
    } = body;
    
    // Validate required fields
    if (!name || !url || !category || !description || !submitted_by) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Insert new tool with JSONB structure
    const toolData = {
      name,
      url,
      category,
      description,
      submitted_by,
      creator_id: user.id,
      is_active: 'false', // Require approval for user-submitted tools
      is_featured: 'false',
      type: 'external',
      features: [],
      pricing: { model: 'free' },
      stats: { views: 0, sessions: 0, stars: 0 }
    };

    const { data, error } = await supabase
      .from('tools')
      .insert({
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        channel_slug: 'community',
        tool_data: toolData
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating tool:', error);
      return NextResponse.json({ error: 'Failed to create tool' }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in tools POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}