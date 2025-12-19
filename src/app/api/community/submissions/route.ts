import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { sendToolSubmissionNotification } from '@/lib/email';
import { isAdmin, isRecursiveEcoReservedName } from '@/lib/admin-utils';
import { isAllowedUrlForChannel } from '@/lib/url-validation';

/**
 * Extracts the document ID from a recursive.eco URL
 * @param url - URL in format: https://recursive.eco/view/{uuid} or https://dev.recursive.eco/view/{uuid}
 * @returns The UUID document ID or null if not found
 */
function extractDocIdFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/view\/([a-f0-9-]{36})/i);
    return match ? match[1] : null;
  } catch {
    return null;
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
      title,
      claude_url,
      category,
      description,
      creator_name,
      creator_link,
      creator_background,
      thumbnail_url,
      channel_slug
    } = body;
    
    // Validate required fields
    if (!title || !claude_url || !category || !description || !creator_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Channel-specific URL validation
    const urlValidation = isAllowedUrlForChannel(claude_url, channel_slug || 'wellness');
    if (!urlValidation.isValid) {
      return NextResponse.json(
        { error: urlValidation.error || 'URL not allowed for this channel' },
        { status: 400 }
      );
    }

    // Protect "Recursive.eco" brand - only admins can use it
    const userEmail = user.email || '';
    const isUserAdmin = isAdmin(userEmail);
    
    console.log(`Debug - User email: ${userEmail}, Is admin: ${isUserAdmin}`);
    console.log(`Debug - Title contains Recursive.eco: ${isRecursiveEcoReservedName(title)}`);
    console.log(`Debug - Creator contains Recursive.eco: ${isRecursiveEcoReservedName(creator_name)}`);
    
    if (!isUserAdmin && (
        isRecursiveEcoReservedName(title) || 
        isRecursiveEcoReservedName(creator_name) ||
        isRecursiveEcoReservedName(description)
      )) {
      return NextResponse.json(
        { error: 'The name "Recursive.eco" is reserved for official tools. Please choose a different name.' },
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

    // Generate a unique slug with better collision resistance
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random().toString(36).substring(2, 8); // Random alphanumeric
    const uniqueSlug = `${baseSlug}-${timestamp}-${randomSuffix}`;
    
    // Insert directly into tools table with ultra minimal schema
    const { data, error } = await supabase
      .from('tools')
      .insert({
        slug: uniqueSlug,
        channel_slug: channel_slug || 'wellness', // Use provided channel_slug or default to wellness
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

    // Sync submission data back to user_documents if URL is from recursive.eco
    const docId = extractDocIdFromUrl(claude_url);
    if (docId) {
      try {
        // First, fetch the existing document to preserve fields we don't want to overwrite
        const { data: existingDoc, error: fetchError } = await supabase
          .from('user_documents')
          .select('document_data')
          .eq('id', docId)
          .single();

        if (!fetchError && existingDoc) {
          // Merge new submission data with existing document_data
          const updatedDocumentData = {
            ...existingDoc.document_data,
            // Update with submission data
            title: title,
            description: description,
            creator_name: creator_name,
            creator_link: creator_link || existingDoc.document_data?.creator_link,
            thumbnail_url: thumbnail_url || existingDoc.document_data?.thumbnail_url,
            hashtags: category, // category in tools = hashtags in user_documents
          };

          // Update user_documents with the merged data
          const { error: updateError } = await supabase
            .from('user_documents')
            .update({
              document_data: updatedDocumentData,
              updated_at: new Date().toISOString()
            })
            .eq('id', docId);

          if (updateError) {
            console.error('Failed to sync submission to user_documents:', updateError);
            // Don't fail the request - submission was successful, sync is a bonus
          } else {
            console.log(`Successfully synced submission data to user_documents: ${docId}`);
          }
        }
      } catch (syncError) {
        console.error('Error syncing to user_documents:', syncError);
        // Don't fail the request - submission was successful, sync is a bonus
      }
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