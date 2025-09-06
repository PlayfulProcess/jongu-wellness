import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const adminClient = createAdminClient();
    
    // Get total tools
    const { count: totalTools } = await adminClient
      .from('tools')
      .select('*', { count: 'exact', head: true });
    
    // Get total submissions (community tools, non-Recursive.eco)
    const { count: totalSubmissions } = await adminClient
      .from('tools')
      .select('*', { count: 'exact', head: true })
      .not('tool_data->>submitted_by', 'eq', 'Recursive.eco');
    
    // Get pending submissions (community tools that haven't been reviewed)
    const { count: pendingSubmissions } = await adminClient
      .from('tools')
      .select('*', { count: 'exact', head: true })
      .not('tool_data->>submitted_by', 'eq', 'Recursive.eco')
      .not('tool_data->>reviewed', 'eq', 'true');
    
    // Get total collaborations from user_documents table
    const { count: totalCollaborations } = await adminClient
      .from('user_documents')
      .select('*', { count: 'exact', head: true })
      .eq('document_type', 'transaction')
      .eq('tool_slug', 'collaboration-request');
    
    const stats = {
      totalTools: totalTools || 0,
      totalSubmissions: totalSubmissions || 0,
      pendingSubmissions: pendingSubmissions || 0,
      totalCollaborations: totalCollaborations || 0
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}