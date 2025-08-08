import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required to star tools' },
        { status: 401 }
      );
    }
    
    // Check if tool exists
    const { data: tool, error: toolError } = await supabase
      .from('tools')
      .select('id')
      .eq('id', id)
      .single();
      
    if (toolError || !tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }
    
    // Check if user has already starred this tool using user_documents
    const { data: existingStar, error: checkError } = await supabase
      .from('user_documents')
      .select('id')
      .eq('user_id', user.id)
      .eq('document_type', 'interaction')
      .eq('document_data->>target_id', id)
      .eq('document_data->>interaction_type', 'star')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing star:', checkError);
      return NextResponse.json({ error: 'Failed to check star status' }, { status: 500 });
    }
    
    if (existingStar) {
      return NextResponse.json({ 
        error: 'Tool already starred',
        isStarred: true
      }, { status: 409 });
    }
    
    // Add star using user_documents
    const { error: starError } = await supabase
      .from('user_documents')
      .insert({
        user_id: user.id,
        document_type: 'interaction',
        document_data: {
          target_type: 'tool',
          target_id: id,
          interaction_type: 'star',
          data: {}
        }
      });
    
    if (starError) {
      console.error('Error adding star:', starError);
      return NextResponse.json({ error: 'Failed to star tool' }, { status: 500 });
    }

    // Update star count in tool
    try {
      // Get current tool data
      const { data: currentTool, error: fetchError } = await supabase
        .from('tools')
        .select('tool_data')
        .eq('id', id)
        .single();

      if (!fetchError && currentTool) {
        const currentStarCount = parseInt(currentTool.tool_data?.stats?.stars || '0');
        const updatedToolData = {
          ...currentTool.tool_data,
          stats: {
            ...currentTool.tool_data?.stats,
            stars: (currentStarCount + 1).toString()
          }
        };

        await supabase
          .from('tools')
          .update({ tool_data: updatedToolData })
          .eq('id', id);
      }
    } catch (error) {
      console.error('Error updating star count:', error);
      // Don't fail the request if star count update fails
    }
    
    return NextResponse.json({ 
      success: true,
      isStarred: true,
      message: 'Tool starred successfully'
    });
  } catch (error) {
    console.error('Error in star API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required to unstar tools' },
        { status: 401 }
      );
    }
    
    // Remove star using user_documents
    // First, find the star record
    const { data: starRecords, error: findError } = await supabase
      .from('user_documents')
      .select('id, document_data')
      .eq('user_id', user.id)
      .eq('document_type', 'interaction');
    
    if (findError) {
      console.error('Error finding star record:', findError);
      return NextResponse.json({ error: 'Failed to find star record' }, { status: 500 });
    }
    
    // Find the specific star for this tool
    const starRecord = starRecords?.find(record => 
      record.document_data?.target_id === id && 
      record.document_data?.interaction_type === 'star'
    );
    
    if (!starRecord) {
      return NextResponse.json({ error: 'Star not found' }, { status: 404 });
    }
    
    // Delete the star record
    const { error: deleteError } = await supabase
      .from('user_documents')
      .delete()
      .eq('id', starRecord.id);
    
    if (deleteError) {
      console.error('Error removing star:', deleteError);
      return NextResponse.json({ error: 'Failed to unstar tool' }, { status: 500 });
    }

    // Update star count in tool
    try {
      // Get current tool data
      const { data: currentTool, error: fetchError } = await supabase
        .from('tools')
        .select('tool_data')
        .eq('id', id)
        .single();

      if (!fetchError && currentTool) {
        const currentStarCount = parseInt(currentTool.tool_data?.stats?.stars || '0');
        const updatedToolData = {
          ...currentTool.tool_data,
          stats: {
            ...currentTool.tool_data?.stats,
            stars: Math.max(0, currentStarCount - 1).toString() // Ensure it doesn't go negative
          }
        };

        await supabase
          .from('tools')
          .update({ tool_data: updatedToolData })
          .eq('id', id);
      }
    } catch (error) {
      console.error('Error updating star count:', error);
      // Don't fail the request if star count update fails
    }
    
    return NextResponse.json({ 
      success: true,
      isStarred: false,
      message: 'Tool unstarred successfully'
    });
  } catch (error) {
    console.error('Error in unstar API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET to check star status for authenticated user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ isStarred: false });
    }
    
    // Check if user has starred this tool using user_documents
    const { data: star, error: starError } = await supabase
      .from('user_documents')
      .select('id')
      .eq('user_id', user.id)
      .eq('document_type', 'interaction')
      .eq('document_data->>target_id', id)
      .eq('document_data->>interaction_type', 'star')
      .single();
    
    if (starError && starError.code !== 'PGRST116') {
      console.error('Error checking star status:', starError);
      return NextResponse.json({ error: 'Failed to check star status' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      isStarred: !!star,
      userId: user.id
    });
  } catch (error) {
    console.error('Error in star status API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}