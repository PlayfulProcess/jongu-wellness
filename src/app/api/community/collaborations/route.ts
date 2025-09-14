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
    // Generate a valid UUID v4 format ID for collaboration requests
    // This avoids NULL user_id issues while maintaining traceability
    const generateUUID = () => {
      const hex = '0123456789abcdef';
      let uuid = '';
      for (let i = 0; i < 36; i++) {
        if (i === 8 || i === 13 || i === 18 || i === 23) {
          uuid += '-';
        } else if (i === 14) {
          uuid += '4'; // Version 4 UUID
        } else if (i === 19) {
          uuid += hex[(Math.random() * 4) | 8]; // Variant bits
        } else {
          uuid += hex[Math.floor(Math.random() * 16)];
        }
      }
      return uuid;
    };
    
    const collaborationUserId = generateUUID();
    
    const { data, error } = await adminClient
      .from('user_documents')
      .insert({
        user_id: collaborationUserId, // Use generated UUID-like ID
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