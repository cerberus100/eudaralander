// Email notification system for admin alerts and user communications
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.EUDAURA_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.EUDAURA_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.EUDAURA_AWS_SECRET_ACCESS_KEY || '',
  },
});

// Helper function to send email via SES
async function sendEmail(to: string, subject: string, htmlBody: string, textBody: string) {
  const fromEmail = process.env.EUDAURA_FROM_EMAIL || 'noreply@eudaura.com';
  
  try {
    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const result = await sesClient.send(command);
    console.log('✅ Email sent successfully:', result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error('❌ Failed to send email via SES:', error);
    // Fallback to console logging in case SES fails
    console.log('📧 EMAIL FALLBACK (SES failed):');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${textBody}`);
    return { success: false, error };
  }
}

interface AdminNotificationData {
  clinicianName: string;
  email: string;
  npi: string;
  states: string[];
  specialties: string[];
  appId: string;
  submittedAt: string;
}

interface ClinicianApprovalData {
  fullName: string;
  email: string;
  appId: string;
}

interface ClinicianDenialData {
  fullName: string;
  email: string;
  appId: string;
  reason?: string;
}

/**
 * Send email notification to admin when new clinician application is submitted
 */
export async function sendAdminNotification(data: AdminNotificationData) {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@eudaura.com';
  const marketingSiteUrl = process.env.SITE_URL || 'https://main.d28ow29ha3x2t5.amplifyapp.com';
  
  try {
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 ADMIN NOTIFICATION EMAIL:');
      console.log('═══════════════════════════════════════');
      console.log(`To: ${adminEmail}`);
      console.log(`Subject: New Clinician Application - ${data.clinicianName}`);
      console.log('');
      console.log('Body:');
      console.log(`A new clinician has applied to join Eudaura:`);
      console.log('');
      console.log(`Name: ${data.clinicianName}`);
      console.log(`Email: ${data.email}`);
      console.log(`NPI: ${data.npi}`);
      console.log(`Licensed States: ${data.states.join(', ')}`);
      console.log(`Specialties: ${data.specialties.join(', ')}`);
      console.log(`Submitted: ${new Date(data.submittedAt).toLocaleString()}`);
      console.log('');
      console.log(`Review and approve/deny at:`);
      console.log(`${marketingSiteUrl}/admin/approvals`);
      console.log('');
      console.log(`Application ID: ${data.appId}`);
      console.log('═══════════════════════════════════════');
      return { success: true };
    }

    // In production, send via SES or your email service
    const emailPayload = {
      to: adminEmail,
      subject: `🏥 New Clinician Application - ${data.clinicianName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #556B4F; color: white; padding: 20px; text-align: center;">
            <h1>New Clinician Application</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>A new clinician has applied to join the Eudaura network:</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #556B4F;">Applicant Details</h3>
              <p><strong>Name:</strong> ${data.clinicianName}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>NPI:</strong> ${data.npi}</p>
              <p><strong>Licensed States:</strong> ${data.states.join(', ')}</p>
              <p><strong>Specialties:</strong> ${data.specialties.join(', ')}</p>
              <p><strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleString()}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${marketingSiteUrl}/admin/approvals" 
                 style="background: #556B4F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Review Application →
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Application ID: ${data.appId}<br>
              Please review the application and approve or deny within 2-3 business days.
            </p>
          </div>
        </div>
      `,
      text: `
New Clinician Application - ${data.clinicianName}

A new clinician has applied to join Eudaura:

Name: ${data.clinicianName}
Email: ${data.email}
NPI: ${data.npi}
Licensed States: ${data.states.join(', ')}
Specialties: ${data.specialties.join(', ')}
Submitted: ${new Date(data.submittedAt).toLocaleString()}

Review and approve/deny at: ${marketingSiteUrl}/admin/approvals

Application ID: ${data.appId}
      `
    };

    // Send via SES
    return await sendEmail(
      emailPayload.to,
      emailPayload.subject,
      emailPayload.html,
      emailPayload.text
    );
    
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    return { success: false, error };
  }
}

/**
 * Send approval notification to clinician
 */
export async function sendClinicianApprovalEmail(data: ClinicianApprovalData) {
  const mainAppUrl = process.env.MAIN_APP_URL || 'https://app.eudaura.com';
  
  try {
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 CLINICIAN APPROVAL EMAIL:');
      console.log('═══════════════════════════════════════');
      console.log(`To: ${data.email}`);
      console.log(`Subject: You're Approved to Join Eudaura!`);
      console.log('');
      console.log(`Dear ${data.fullName},`);
      console.log('');
      console.log('Congratulations! Your application to join the Eudaura network has been approved.');
      console.log('');
      console.log('Next steps:');
      console.log('1. Click the link below to set up your account');
      console.log('2. Set your password and complete your profile');
      console.log('3. Start seeing patients on the platform');
      console.log('');
      console.log(`Setup Link: ${mainAppUrl}/onboarding/clinician?appId=${data.appId}`);
      console.log('');
      console.log('Welcome to the team!');
      console.log('The Eudaura Team');
      console.log('═══════════════════════════════════════');
      return { success: true };
    }

    // Send via SES
    const emailPayload = {
      to: data.email,
      subject: `🎉 You're Approved to Join Eudaura!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #556B4F; color: white; padding: 20px; text-align: center;">
            <h1>🎉 Application Approved!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Dear ${data.fullName},</p>
            
            <p>Congratulations! Your application to join the Eudaura network has been <strong>approved</strong>.</p>
            
            <div style="background: #f0f9f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #556B4F;">Next Steps:</h3>
              <ol>
                <li>Click the setup link below to create your account</li>
                <li>Set your password and complete your profile</li>
                <li>Start seeing patients on the platform</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.MAIN_APP_URL || 'https://app.eudaura.com'}/onboarding/clinician?appId=${data.appId}" 
                 style="background: #556B4F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Set Up Your Account →
              </a>
            </div>
            
            <p>Welcome to the Eudaura team!</p>
            <p>The Eudaura Team</p>
          </div>
        </div>
      `,
      text: `Dear ${data.fullName},

Congratulations! Your application to join the Eudaura network has been approved.

Next Steps:
1. Click the setup link below to create your account
2. Set your password and complete your profile  
3. Start seeing patients on the platform

Setup Link: ${process.env.MAIN_APP_URL || 'https://app.eudaura.com'}/onboarding/clinician?appId=${data.appId}

Welcome to the Eudaura team!
The Eudaura Team`
    };

    return await sendEmail(
      emailPayload.to,
      emailPayload.subject,
      emailPayload.html,
      emailPayload.text
    );
    
  } catch (error) {
    console.error('Failed to send clinician approval email:', error);
    return { success: false, error };
  }
}

/**
 * Send denial notification to clinician
 */
export async function sendClinicianDenialEmail(data: ClinicianDenialData) {
  try {
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 CLINICIAN DENIAL EMAIL:');
      console.log('═══════════════════════════════════════');
      console.log(`To: ${data.email}`);
      console.log(`Subject: Update on Your Eudaura Application`);
      console.log('');
      console.log(`Dear ${data.fullName},`);
      console.log('');
      console.log('Thank you for your interest in joining the Eudaura network.');
      console.log('');
      console.log('After careful review, we are unable to approve your application at this time.');
      console.log('');
      if (data.reason) {
        console.log(`Reason: ${data.reason}`);
        console.log('');
      }
      console.log('You may reapply in the future if your circumstances change.');
      console.log('');
      console.log('Thank you for your interest in Eudaura.');
      console.log('The Eudaura Team');
      console.log('═══════════════════════════════════════');
      return { success: true };
    }

    // Send via SES
    const emailPayload = {
      to: data.email,
      subject: `Update on Your Eudaura Application`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; color: #333; padding: 20px; text-align: center;">
            <h1>Application Update</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Dear ${data.fullName},</p>
            
            <p>Thank you for your interest in joining the Eudaura network.</p>
            
            <p>After careful review, we are unable to approve your application at this time.</p>
            
            ${data.reason ? `<div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Reason:</strong> ${data.reason}</p>
            </div>` : ''}
            
            <p>You may reapply in the future if your circumstances change or if you have additional credentials to provide.</p>
            
            <p>Thank you for your interest in Eudaura.</p>
            <p>The Eudaura Team</p>
          </div>
        </div>
      `,
      text: `Dear ${data.fullName},

Thank you for your interest in joining the Eudaura network.

After careful review, we are unable to approve your application at this time.

${data.reason ? `Reason: ${data.reason}` : ''}

You may reapply in the future if your circumstances change.

Thank you for your interest in Eudaura.
The Eudaura Team`
    };

    return await sendEmail(
      emailPayload.to,
      emailPayload.subject,
      emailPayload.html,
      emailPayload.text
    );
    
  } catch (error) {
    console.error('Failed to send clinician denial email:', error);
    return { success: false, error };
  }
}
