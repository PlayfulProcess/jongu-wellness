import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'stars';
    
    let query = supabase
      .from('tools')
      .select('*')
      .eq('approved', true)
      .eq('active', true);
    
    // Apply category filter
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    // Apply sorting
    switch (sort) {
      case 'stars':
        query = query.order('star_count', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'popular':
        query = query.order('total_clicks', { ascending: false });
        break;
      default:
        query = query.order('star_count', { ascending: false });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching tools:', error);
      return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
    }
    
    
    return NextResponse.json(data || []);
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
    
    // Insert new tool
    const { data, error } = await supabase
      .from('tools')
      .insert({
        name,
        url,
        category,
        description,
        submitted_by,
        user_id: user.id,
        approved: false, // Require approval for user-submitted tools
        active: true,
        star_count: 0
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