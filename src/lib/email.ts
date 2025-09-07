import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'pp@playfulprocess.com';

interface ToolSubmissionData {
  title: string;
  claude_url: string;
  category: string;
  description: string;
  creator_name: string;
  creator_link?: string;
  creator_background?: string;
  thumbnail_url?: string;
  submitter_ip: string;
}

interface CollaborationData {
  name: string;
  email: string;
  organization?: string;
  expertise: string;
  collaboration_type: string;
  message: string;
  submitter_ip: string;
}

export async function sendToolSubmissionNotification(data: ToolSubmissionData) {
  try {
    const { data: emailResult, error } = await resend.emails.send({
      from: 'Recursive.eco <noreply@playfulprocess.com>',
      to: [NOTIFICATION_EMAIL],
      subject: `New Tool Submission: ${data.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #1e40af; margin: 0 0 10px;">🛠️ New Tool Submission</h1>
            <p style="color: #64748b; margin: 0;">A new tool has been submitted to the community garden.</p>
          </div>
          
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #334155; margin: 0 0 15px; font-size: 18px;">Tool Details</h2>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569; display: inline-block; width: 120px;">Title:</strong>
              <span style="color: #1e293b;">${data.title}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569; display: inline-block; width: 120px;">URL:</strong>
              <a href="${data.claude_url}" style="color: #2563eb; text-decoration: none;">${data.claude_url}</a>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569; display: inline-block; width: 120px;">Category:</strong>
              <span style="color: #1e293b; background: #dbeafe; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${data.category}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569; display: inline-block; vertical-align: top; width: 120px;">Description:</strong>
              <span style="color: #1e293b; display: inline-block; width: calc(100% - 130px);">${data.description}</span>
            </div>
            
            ${data.thumbnail_url ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569; display: inline-block; width: 120px;">Thumbnail:</strong>
              <a href="${data.thumbnail_url}" style="color: #2563eb; text-decoration: none;">View Image</a>
            </div>
            ` : ''}
          </div>
          
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #334155; margin: 0 0 15px; font-size: 18px;">Creator Information</h2>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569; display: inline-block; width: 120px;">Name:</strong>
              <span style="color: #1e293b;">${data.creator_name}</span>
            </div>
            
            ${data.creator_link ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569; display: inline-block; width: 120px;">Website:</strong>
              <a href="${data.creator_link}" style="color: #2563eb; text-decoration: none;">${data.creator_link}</a>
            </div>
            ` : ''}
            
            ${data.creator_background ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569; display: inline-block; vertical-align: top; width: 120px;">Background:</strong>
              <span style="color: #1e293b; display: inline-block; width: calc(100% - 130px);">${data.creator_background}</span>
            </div>
            ` : ''}
          </div>
          
          <div style="background: #f1f5f9; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <h3 style="color: #475569; margin: 0 0 10px; font-size: 14px;">Submission Details</h3>
            <div style="font-size: 12px; color: #64748b;">
              <div>Submitted: ${new Date().toLocaleString()}</div>
              <div>IP Address: ${data.submitter_ip}</div>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px;">
            <p style="color: #64748b; font-size: 14px; margin-bottom: 15px;">Go to your admin panel to review and approve this submission.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Failed to send tool submission notification:', {
        error: error.message || error,
        recipient: NOTIFICATION_EMAIL,
        hasApiKey: !!process.env.RESEND_API_KEY
      });
      return { success: false, error };
    }

    console.log('✅ Tool submission notification sent successfully:', {
      emailId: emailResult?.id,
      recipient: NOTIFICATION_EMAIL,
      toolTitle: data.title
    });
    return { success: true, id: emailResult?.id };
  } catch (error) {
    console.error('Error sending tool submission notification:', error);
    return { success: false, error };
  }
}

export async function sendCollaborationNotification(data: CollaborationData) {
  try {
    const { data: emailResult, error } = await resend.emails.send({
      from: 'Recursive.eco <noreply@playfulprocess.com>',
      to: [NOTIFICATION_EMAIL],
      subject: `New Collaboration Request: ${data.collaboration_type}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #0369a1; margin: 0 0 10px;">🤝 New Collaboration Request</h1>
            <p style="color: #64748b; margin: 0;">Someone is interested in collaborating with you.</p>
          </div>
          
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #334155; margin: 0 0 15px; font-size: 18px;">Contact Information</h2>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569; display: inline-block; width: 120px;">Name:</strong>
              <span style="color: #1e293b;">${data.name}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569; display: inline-block; width: 120px;">Email:</strong>
              <a href="mailto:${data.email}" style="color: #2563eb; text-decoration: none;">${data.email}</a>
            </div>
            
            ${data.organization ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569; display: inline-block; width: 120px;">Organization:</strong>
              <span style="color: #1e293b;">${data.organization}</span>
            </div>
            ` : ''}
          </div>
          
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #334155; margin: 0 0 15px; font-size: 18px;">Collaboration Details</h2>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569; display: inline-block; width: 120px;">Type:</strong>
              <span style="color: #1e293b; background: #dcfce7; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${data.collaboration_type}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569; display: inline-block; vertical-align: top; width: 120px;">Expertise:</strong>
              <span style="color: #1e293b; display: inline-block; width: calc(100% - 130px);">${data.expertise}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569; display: inline-block; vertical-align: top; width: 120px;">Message:</strong>
              <div style="color: #1e293b; margin-top: 5px; padding: 15px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #3b82f6;">
                ${data.message.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>
          
          <div style="background: #f1f5f9; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <h3 style="color: #475569; margin: 0 0 10px; font-size: 14px;">Request Details</h3>
            <div style="font-size: 12px; color: #64748b;">
              <div>Submitted: ${new Date().toLocaleString()}</div>
              <div>IP Address: ${data.submitter_ip}</div>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px;">
            <a href="mailto:${data.email}" style="background: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 10px;">Reply to ${data.name}</a>
            <p style="color: #64748b; font-size: 14px; margin-top: 15px;">Check your admin panel to view all collaboration requests.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Failed to send collaboration notification:', {
        error: error.message || error,
        recipient: NOTIFICATION_EMAIL,
        hasApiKey: !!process.env.RESEND_API_KEY
      });
      return { success: false, error };
    }

    console.log('✅ Collaboration notification sent successfully:', {
      emailId: emailResult?.id,
      recipient: NOTIFICATION_EMAIL,
      collaboratorName: data.name
    });
    return { success: true, id: emailResult?.id };
  } catch (error) {
    console.error('Error sending collaboration notification:', error);
    return { success: false, error };
  }
}