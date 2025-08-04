import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendCollaborationNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    
    const {
      name,
      email,
      organization,
      expertise,
      collaboration_type,
      message
    } = body;
    
    // Validate required fields
    if (!name || !email || !expertise || !collaboration_type || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create provider signup entry
    const { data, error } = await adminClient
      .from('provider_signups')  // Note: underscore, not hyphen
      .insert({
        name,
        email,
        tool_comments: message || '',  // Using message as tool_comments
        willing_to_collaborate: true,  // They're filling out collaboration form, so true
        provider_type: 'mental_health'  // Default to mental_health for now
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating collaboration request:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({ 
        error: 'Failed to submit collaboration request',
        details: error.message 
      }, { status: 500 });
    }
    
    // Send email notification
    try {
      await sendCollaborationNotification({
        name,
        email,
        organization: organization || 'Not specified',
        expertise: expertise || 'Not specified',
        collaboration_type: collaboration_type || 'Not specified',
        message: message || 'No message provided',
        submitter_ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
    } catch (emailError) {
      console.error('Failed to send collaboration email notification:', emailError);
      // Don't fail the request if email fails - the submission was successful
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in collaborations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}