import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const { submissionId } = await request.json();
    
    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
    }
    
    // Get the tool (submission) from tools table
    const { data: tool, error: fetchError } = await adminClient
      .from('tools')
      .select('*')
      .eq('id', submissionId)
      .single();
    
    if (fetchError || !tool) {
      console.error('Error fetching tool:', fetchError);
      return NextResponse.json({ error: 'Tool submission not found' }, { status: 404 });
    }
    
    // Update the tool_data to mark as reviewed but rejected
    const updatedToolData = {
      ...tool.tool_data,
      reviewed: 'true',
      is_active: 'false', // Reject the tool
      rejected_at: new Date().toISOString(),
      rejected_by: 'admin'
    };
    
    // Update the tool with rejected status
    const { data: updatedTool, error: updateError } = await adminClient
      .from('tools')
      .update({
        tool_data: updatedToolData
      })
      .eq('id', submissionId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating tool:', updateError);
      return NextResponse.json({ error: 'Failed to reject tool' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Tool rejected successfully',
      tool: updatedTool
    });
  } catch (error) {
    console.error('Error rejecting submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}