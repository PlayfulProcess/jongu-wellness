import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

interface DatabaseTool {
  id: string;
  tool_data?: {
    name?: string;
    title?: string;
    url?: string;
    claude_url?: string;
    category?: string | string[];  // Can be string or array for backward compatibility
    description?: string;
    submitted_by?: string;
    creator_name?: string;
    creator_link?: string;
    is_active?: string | boolean;
    thumbnail_url?: string;
    stats?: {
      stars?: string;
    };
    [key: string]: unknown;
  };
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const sort = searchParams.get('sort') || 'stars';

    // Get all tools - no server-side category filtering (done client-side)
    let query = supabase
      .from('tools')
      .select('id, slug, channel_slug, tool_data, created_at, updated_at');

    // Simple sorting by created_at for now
    if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tools:', error);
      return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
    }

    // Filter active tools only
    const filteredData = (data || []).filter((tool: DatabaseTool) =>
      tool.tool_data?.is_active === 'true' || tool.tool_data?.is_active === true
    );
    
    // Transform JSONB data to match frontend expectations
    const transformedTools = filteredData.map((tool: DatabaseTool) => {
      // Handle category as either string or array for backward compatibility
      let category: string[] = [];
      if (Array.isArray(tool.tool_data?.category)) {
        category = tool.tool_data.category;
      } else if (typeof tool.tool_data?.category === 'string') {
        category = [tool.tool_data.category];
      }

      return {
        id: tool.id,
        name: tool.tool_data?.name || '',
        title: tool.tool_data?.title || tool.tool_data?.name || '',
        url: tool.tool_data?.url || tool.tool_data?.claude_url || '#',
        category: category,  // Always return as array
        description: tool.tool_data?.description || '',
        submitted_by: tool.tool_data?.submitted_by || tool.tool_data?.creator_name || 'Anonymous',
        creator_link: tool.tool_data?.creator_link || null,
        star_count: parseInt(tool.tool_data?.stats?.stars || '0'),
        thumbnail_url: tool.tool_data?.thumbnail_url || null,
        created_at: tool.created_at,
        approved: tool.tool_data?.is_active === 'true',
        active: tool.tool_data?.is_active === 'true'
      };
    });
    
    // Sort by stars if requested
    if (sort === 'stars') {
      transformedTools.sort((a, b) => b.star_count - a.star_count);
    } else if (sort === 'newest') {
      transformedTools.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    
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
      submitted_by,
      creator_link,
      thumbnail_url
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
      creator_link: creator_link || null,
      thumbnail_url: thumbnail_url || null,
      creator_id: user.id,
      is_active: 'false', // Require approval for user-submitted tools
      is_featured: 'false',
      type: 'external',
      features: [],
      pricing: { model: 'free' },
      stats: { views: 0, sessions: 0, stars: 0 }
    };

    // Log the data being inserted for debugging
    const insertData = {
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      channel_slug: 'community',
      tool_data: toolData
    };
    
    console.log('Inserting tool with data:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
      .from('tools')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating tool:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: 'Failed to create tool',
        details: error.message || error
      }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in tools POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}