import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const { submissionId } = await request.json();
    
    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
    }
    
    // First, get the submission details
    const { data: submission, error: fetchError } = await adminClient
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();
    
    if (fetchError || !submission) {
      console.error('Error fetching submission:', fetchError);
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    
    // Create tool from submission
    const { data: tool, error: createError } = await adminClient
      .from('tools')
      .insert({
        title: submission.title,
        claude_url: submission.claude_url,
        category: submission.category,
        description: submission.description,
        creator_name: submission.creator_name,
        creator_link: submission.creator_link,
        creator_background: submission.creator_background,
        thumbnail_url: submission.thumbnail_url,
        avg_rating: 0,
        total_ratings: 0,
        view_count: 0,
        click_count: 0,
        approved: true
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating tool:', createError);
      return NextResponse.json({ error: 'Failed to create tool' }, { status: 500 });
    }
    
    // Mark submission as reviewed and approved
    const { error: updateError } = await adminClient
      .from('submissions')
      .update({
        reviewed: true,
        approved: true
      })
      .eq('id', submissionId);
    
    if (updateError) {
      console.error('Error updating submission:', updateError);
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
    }
    
    return NextResponse.json(tool);
  } catch (error) {
    console.error('Error approving submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}