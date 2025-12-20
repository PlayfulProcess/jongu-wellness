import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/admin-utils';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: toolId } = await params;

    console.log('PUT /api/community/tools/[id] - Tool ID:', toolId);

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('User authenticated:', user?.email, 'Error:', authError);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required to update tools' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      title,
      claude_url,
      category,
      description,
      creator_name,
      creator_link,
      thumbnail_url,
      channel_slug
    } = body;

    // Validate required fields
    if (!title || !claude_url || !category || !description || !creator_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch the existing tool to verify ownership
    const { data: existingTool, error: fetchError } = await supabase
      .from('tools')
      .select('tool_data')
      .eq('id', toolId)
      .single();

    if (fetchError || !existingTool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator or an admin
    const userEmail = user.email || '';
    const isUserAdmin = isAdmin(userEmail);
    const isCreator = existingTool.tool_data?.creator_id === user.id;

    if (!isCreator && !isUserAdmin) {
      return NextResponse.json(
        { error: 'You can only edit your own submissions' },
        { status: 403 }
      );
    }

    // Update tool data
    const updatedToolData = {
      ...existingTool.tool_data,
      name: title,
      url: claude_url,
      category,
      description,
      submitted_by: creator_name,
      creator_link: creator_link || null,
      thumbnail_url: thumbnail_url || null,
    };

    // Update the tool in the database
    const { data, error } = await supabase
      .from('tools')
      .update({
        tool_data: updatedToolData,
        channel_slug: channel_slug || existingTool.tool_data?.channel_slug || 'wellness',
        updated_at: new Date().toISOString()
      })
      .eq('id', toolId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tool:', error);
      return NextResponse.json(
        { error: 'Database error: ' + (error.message || 'Failed to update tool') },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error in tool update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
