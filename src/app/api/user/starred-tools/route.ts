import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user's starred tools using the ultra minimal schema
    const { data, error } = await supabase
      .from('user_documents')
      .select(`
        created_at,
        document_data,
        tools!inner (
          id,
          name,
          url,
          category,
          description,
          submitted_by,
          star_count,
          total_clicks,
          created_at,
          approved,
          active
        )
      `)
      .eq('user_id', user.id)
      .eq('document_type', 'interaction')
      .eq('document_data->>interaction_type', 'star')
      .eq('document_data->>target_type', 'tool')
      .eq('tools.active', true)
      .eq('tools.approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching starred tools:', error);
      return NextResponse.json(
        { error: 'Failed to fetch starred tools' },
        { status: 500 }
      );
    }

    // Transform the data to include starred_at timestamp
    const starredTools = data?.map(item => ({
      ...item.tools,
      starred_at: item.created_at
    })) || [];

    return NextResponse.json(starredTools);
  } catch (error) {
    console.error('Error in starred tools API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}