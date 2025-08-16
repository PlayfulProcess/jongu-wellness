import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const { toolId, approved } = await request.json();
    
    if (!toolId || typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Tool ID and approved status required' }, { status: 400 });
    }
    
    // Get the current tool data
    const { data: tool, error: fetchError } = await adminClient
      .from('tools')
      .select('*')
      .eq('id', toolId)
      .single();
    
    if (fetchError || !tool) {
      console.error('Error fetching tool:', fetchError);
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }
    
    // Update the tool_data with new approval status
    const updatedToolData = {
      ...tool.tool_data,
      is_active: approved.toString(), // Convert boolean to string for JSONB
      approved_at: approved ? new Date().toISOString() : null,
      approved_by: approved ? 'admin' : null
    };
    
    // Update the tool with new approval status
    const { data: updatedTool, error: updateError } = await adminClient
      .from('tools')
      .update({
        tool_data: updatedToolData
      })
      .eq('id', toolId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating tool status:', updateError);
      return NextResponse.json({ error: 'Failed to update tool status' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Tool ${approved ? 'approved' : 'hidden'} successfully`,
      tool: updatedTool
    });
  } catch (error) {
    console.error('Error toggling tool approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}