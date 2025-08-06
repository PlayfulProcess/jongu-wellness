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
    
    // Check if user has already starred this tool
    const { data: existingStar, error: checkError } = await supabase
      .from('tool_stars')
      .select('id')
      .eq('tool_id', id)
      .eq('user_id', user.id)
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
    
    // Add star
    const { error: starError } = await supabase
      .from('tool_stars')
      .insert({
        tool_id: id,
        user_id: user.id
      });
    
    if (starError) {
      console.error('Error adding star:', starError);
      return NextResponse.json({ error: 'Failed to star tool' }, { status: 500 });
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
    
    // Remove star
    const { error: deleteError } = await supabase
      .from('tool_stars')
      .delete()
      .eq('tool_id', id)
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error('Error removing star:', deleteError);
      return NextResponse.json({ error: 'Failed to unstar tool' }, { status: 500 });
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
    
    // Check if user has starred this tool
    const { data: star, error: starError } = await supabase
      .from('tool_stars')
      .select('id')
      .eq('tool_id', id)
      .eq('user_id', user.id)
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