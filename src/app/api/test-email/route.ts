import { NextResponse } from 'next/server';
import { sendToolSubmissionNotification, sendCollaborationNotification } from '@/lib/email';

export async function GET() {
  try {
    console.log('🧪 Testing email notifications...');
    
    // Test tool submission notification
    const testTool = {
      title: "Test Mindfulness Tool",
      claude_url: "https://example.com/test-tool", 
      category: "mindfulness",
      description: "This is a test notification to verify that Resend email integration is working properly. The email service should send this to pp@playfulprocess.com with all the tool details formatted nicely.",
      creator_name: "Test Creator",
      creator_link: "https://testcreator.com",
      creator_background: "This is a test creator background to verify that all fields are properly displayed in the email template.",
      thumbnail_url: "https://via.placeholder.com/400x300/4f46e5/ffffff?text=Test+Tool",
      submitter_ip: "127.0.0.1"
    };

    console.log('📧 Sending test tool submission notification...');
    const toolResult = await sendToolSubmissionNotification(testTool);
    
    // Test collaboration notification  
    const testCollaboration = {
      name: "Jane Test User",
      email: "test@example.com",
      organization: "Test Organization Inc.",
      expertise: "UX Design, Mental Health Research, Community Building",
      collaboration_type: "Content Creation",
      message: "Hi! I'm interested in collaborating on creating wellness tools for the community. I have experience in UX design and mental health research. Would love to discuss potential partnerships.\n\nThis is a test message to verify the email formatting works properly with line breaks and longer content.",
      submitter_ip: "127.0.0.1"
    };

    console.log('🤝 Sending test collaboration notification...');
    const collabResult = await sendCollaborationNotification(testCollaboration);

    // Check results
    const results = {
      tool_notification: toolResult.success ? '✅ Sent' : `❌ Failed: ${toolResult.error}`,
      collaboration_notification: collabResult.success ? '✅ Sent' : `❌ Failed: ${collabResult.error}`,
      recipient: process.env.NOTIFICATION_EMAIL || 'pp@playfulprocess.com',
      resend_api_configured: !!process.env.RESEND_API_KEY
    };

    console.log('📊 Test Results:', results);

    return NextResponse.json({
      success: true,
      message: '🎉 Email test completed! Check your inbox at pp@playfulprocess.com',
      results,
      instructions: [
        '1. Check your email inbox for two test notifications',
        '2. Verify the email formatting and all data fields are displayed correctly', 
        '3. If emails didn\'t arrive, check your spam folder',
        '4. If still no emails, check server logs for error details'
      ]
    });

  } catch (error) {
    console.error('❌ Email test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      debug_info: {
        resend_api_key_exists: !!process.env.RESEND_API_KEY,
        notification_email: process.env.NOTIFICATION_EMAIL,
        error_details: error
      }
    }, { status: 500 });
  }
}