import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { sendCollaborationNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          error: 'Authentication required to submit collaboration requests',
          requiresAuth: true 
        },
        { status: 401 }
      );
    }
    
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
    
    // Get submitter IP for tracking
    const submitterIP = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
    
    // Create collaboration request using ultra minimal schema
    const collaborationData = {
      type: 'collaboration_request',
      name,
      email,
      organization: organization || null,
      expertise,
      collaboration_type,
      message,
      submitter_ip: submitterIP,
      status: 'pending',
      submitted_at: new Date().toISOString()
    };

    // Insert into user_documents table as a collaboration request
    // Use the authenticated user's ID for the collaboration request
    const { data, error } = await supabase
      .from('user_documents')
      .insert({
        user_id: user.id, // Use authenticated user's ID
        document_type: 'transaction', // Use transaction type for business inquiries
        tool_slug: 'collaboration-request',
        is_public: false,
        document_data: collaborationData
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