import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const { email, channel } = await request.json();
    
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const subscribedFrom = channel || 'wellness'; // Default to wellness if not provided

    // Check if already subscribed
    const { data: existing, error: checkError } = await adminClient
      .from('newsletter_subscribers')
      .select('email')
      .eq('email', cleanEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { 
      console.error('Database check error:', checkError);
      return NextResponse.json({ error: 'Database error occurred' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ error: 'This email is already subscribed!' }, { status: 409 });
    }

    // Insert new subscriber
    const { error } = await adminClient
      .from('newsletter_subscribers')
      .insert({
        email: cleanEmail,
        subscribed_from: subscribedFrom,
        subscribed: true
      });

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: 'Failed to subscribe. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully subscribed to newsletter!',
      data: { email: cleanEmail, channel: subscribedFrom }
    }, { status: 201 });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}