import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { sendToolSubmissionNotification } from '@/lib/email';
import { isAdmin, isJonguReservedName } from '@/lib/admin-utils';

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
      title,
      claude_url,
      category,
      description,
      creator_name,
      creator_link,
      creator_background,
      thumbnail_url
    } = body;
    
    // Validate required fields
    if (!title || !claude_url || !category || !description || !creator_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Protect "Jongu" brand - only admins can use it
    const userEmail = user.email || '';
    const isUserAdmin = isAdmin(userEmail);
    
    console.log(`Debug - User email: ${userEmail}, Is admin: ${isUserAdmin}`);
    console.log(`Debug - Title contains Jongu: ${isJonguReservedName(title)}`);
    console.log(`Debug - Creator contains Jongu: ${isJonguReservedName(creator_name)}`);
    
    if (!isUserAdmin && (
        isJonguReservedName(title) || 
        isJonguReservedName(creator_name) ||
        isJonguReservedName(description)
      )) {
      return NextResponse.json(
        { error: 'The name "Jongu" is reserved for official tools. Please choose a different name.' },
        { status: 400 }
      );
    }
    
    // Get submitter IP for tracking
    const submitterIP = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
    
    // Create tool data for ultra minimal schema
    const toolData = {
      name: title,
      url: claude_url,
      category,
      description,
      submitted_by: creator_name,
      creator_id: user.id,
      creator_link: creator_link || null,
      creator_background: creator_background || null,
      thumbnail_url: thumbnail_url || null,
      submitter_ip: submitterIP,
      is_active: 'false', // Require admin approval
      is_featured: 'false',
      type: 'community',
      features: [],
      pricing: { model: 'free' },
      stats: { views: 0, sessions: 0, stars: 0 }
    };

    // Generate a unique slug
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const uniqueSlug = `${baseSlug}-${timestamp}`;
    
    // Insert directly into tools table with ultra minimal schema
    const { data, error } = await supabase
      .from('tools')
      .insert({
        slug: uniqueSlug,
        channel_slug: 'community',
        tool_data: toolData
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating submission:', error);
      console.error('Detailed error:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: 'Database error: ' + (error.message || 'Failed to submit tool'),
        details: error.details || null
      }, { status: 500 });
    }
    
    // Send email notification
    try {
      await sendToolSubmissionNotification({
        title,
        claude_url,
        category,
        description,
        creator_name,
        creator_link,
        creator_background,
        thumbnail_url,
        submitter_ip: submitterIP
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails - the submission was successful
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in submissions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}