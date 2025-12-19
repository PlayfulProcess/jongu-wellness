import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const adminClient = createAdminClient();

    // Query tools table for community submissions (including Recursive.eco tools)
    const { data: tools, error } = await adminClient
      .from('tools')
      .select('id, slug, tool_data, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    if (!tools) {
      return NextResponse.json([]);
    }

    // Get unique creator IDs
    const creatorIds = tools
      .map(tool => tool.tool_data?.creator_id)
      .filter(Boolean);

    // Fetch user emails for all creator IDs
    const { data: users } = await adminClient.auth.admin.listUsers();
    const emailMap = new Map(
      users?.users.map(u => [u.id, u.email]) || []
    );

    // Map tools data to submissions format expected by admin panel
    const submissions = tools.map(tool => {
      const toolData = tool.tool_data || {};
      const creatorId = toolData.creator_id;
      return {
        id: tool.id,
        title: toolData.name || toolData.title || 'Untitled Tool',
        claude_url: toolData.url || toolData.claude_url || '',
        category: toolData.category || 'uncategorized',
        description: toolData.description || '',
        creator_name: toolData.creator_name || toolData.submitted_by || 'Unknown',
        creator_link: toolData.creator_link || '',
        creator_background: toolData.creator_background || '',
        thumbnail_url: toolData.thumbnail_url || '',
        submitter_ip: toolData.submitter_ip || '',
        submitter_email: creatorId ? emailMap.get(creatorId) || null : null,
        reviewed: toolData.reviewed === 'true' || toolData.reviewed === true,
        approved: toolData.is_active === 'true' || toolData.is_active === true,
        created_at: tool.created_at
      };
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error in submissions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}