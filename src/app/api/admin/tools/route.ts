import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { isAdmin } from '@/lib/admin-utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || !isAdmin(user.email || '')) {
      return NextResponse.json(
        { error: 'Admin access required to create Jongu tools' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { name, url, description, icon, channel } = body;
    
    // Validate required fields
    if (!name || !url || !description) {
      return NextResponse.json(
        { error: 'Name, URL, and description are required' },
        { status: 400 }
      );
    }
    
    // Create Jongu tool data with special properties
    const toolData = {
      name,
      url,
      description,
      icon: icon || '🛠️',
      submitted_by: 'Jongu',           // Official Jongu branding
      creator_id: user.id,
      creator_link: 'https://jongu.com',
      creator_background: 'Official Jongu platform tools designed for wellness and personal growth.',
      is_active: 'true',              // Auto-approved
      is_featured: 'true',            // Auto-featured
      type: 'jongu_official',         // Special type for filtering
      category: 'jongu-tools',        // Special category
      features: ['AI assistance', 'Progress saving', 'Export'],
      pricing: { model: 'free' },
      stats: { views: 0, sessions: 0, stars: 0 }
    };

    // Generate clean slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Insert into tools table
    const { data, error } = await supabase
      .from('tools')
      .insert({
        slug,
        channel_slug: channel || 'wellness',
        tool_data: toolData
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating Jongu tool:', error);
      return NextResponse.json({ error: 'Failed to create tool' }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
    
  } catch (error) {
    console.error('Error in admin tools API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const adminClient = createAdminClient();
    
    // Get all tools from the tools table
    const { data: tools, error } = await adminClient
      .from('tools')
      .select('id, slug, tool_data, created_at, updated_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching tools:', error);
      return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
    }

    if (!tools) {
      return NextResponse.json([]);
    }
    
    // Map tools data to format expected by admin panel
    const formattedTools = tools.map(tool => {
      const toolData = tool.tool_data || {};
      return {
        id: tool.id,
        title: toolData.name || toolData.title || 'Untitled Tool',
        category: toolData.category || 'uncategorized',
        creator_name: toolData.creator_name || toolData.submitted_by || 'Unknown',
        avg_rating: parseFloat(toolData.avg_rating) || 0,
        total_ratings: parseInt(toolData.total_ratings) || 0,
        view_count: parseInt(toolData.stats?.views) || parseInt(toolData.view_count) || 0,
        thumbnail_url: toolData.thumbnail_url || null,
        approved: toolData.is_active === 'true' || toolData.is_active === true,
        created_at: tool.created_at
      };
    });
    
    return NextResponse.json(formattedTools);
  } catch (error) {
    console.error('Error in admin tools GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
