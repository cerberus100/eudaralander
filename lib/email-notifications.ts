// Email notification system for admin alerts and user communications

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
  const marketingSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://main.d28ow29ha3x2t5.amplifyapp.com';
  
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

    // TODO: Replace with your actual email service (SES, SendGrid, etc.)
    console.log('📧 Would send admin notification email:', emailPayload);
    
    return { success: true };
    
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

    // TODO: Replace with actual email service
    console.log('📧 Would send clinician approval email to:', data.email);
    
    return { success: true };
    
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

    // TODO: Replace with actual email service
    console.log('📧 Would send clinician denial email to:', data.email);
    
    return { success: true };
    
  } catch (error) {
    console.error('Failed to send clinician denial email:', error);
    return { success: false, error };
  }
}
