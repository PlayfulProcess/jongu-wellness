import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';


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
