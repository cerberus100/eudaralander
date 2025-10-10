import { NextRequest, NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Initialize SES client
const ses = new SESClient({
  region: process.env.EUDAURA_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.EUDAURA_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.EUDAURA_AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { name, email, role, message } = body;

    if (!name || !email || !role || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['patient', 'clinician', 'other'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Send email notification to admin
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@eudaura.com';
    const fromEmail = process.env.EUDAURA_FROM_EMAIL || 'noreply@eudaura.com';

    const emailParams = {
      Destination: {
        ToAddresses: [adminEmail],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `
              <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #556B4F;">New Contact Form Submission</h2>
                  <hr style="border: 1px solid #e0e0e0;">
                  
                  <h3>Contact Details:</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0;"><strong>Name:</strong></td>
                      <td style="padding: 8px 0;">${name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>Email:</strong></td>
                      <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>Role:</strong></td>
                      <td style="padding: 8px 0;">${role.charAt(0).toUpperCase() + role.slice(1)}</td>
                    </tr>
                  </table>
                  
                  <h3>Message:</h3>
                  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 10px;">
                    <p style="white-space: pre-wrap; margin: 0;">${message}</p>
                  </div>
                  
                  <hr style="border: 1px solid #e0e0e0; margin-top: 30px;">
                  <p style="color: #666; font-size: 12px;">
                    This email was sent from the Eudaura contact form at ${new Date().toLocaleString()}.
                  </p>
                </body>
              </html>
            `,
          },
          Text: {
            Charset: 'UTF-8',
            Data: `New Contact Form Submission

Name: ${name}
Email: ${email}
Role: ${role}

Message:
${message}

---
This email was sent from the Eudaura contact form at ${new Date().toLocaleString()}.`,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: `[Eudaura Contact] New message from ${name} (${role})`,
        },
      },
      Source: fromEmail,
    };

    try {
      await ses.send(new SendEmailCommand(emailParams));
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails - we still want to acknowledge receipt
    }

    // Send confirmation email to the user
    const userEmailParams = {
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `
              <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #556B4F;">Thank you for contacting Eudaura</h2>
                  <p>Hi ${name},</p>
                  <p>We've received your message and appreciate you reaching out to us. Our team will review your inquiry and get back to you as soon as possible.</p>
                  
                  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Your message:</strong></p>
                    <p style="white-space: pre-wrap; margin: 10px 0 0 0;">${message}</p>
                  </div>
                  
                  <p>If you have any urgent matters, please don't hesitate to reach out to us directly at support@eudaura.com.</p>
                  
                  <p>Best regards,<br>The Eudaura Team</p>
                  
                  <hr style="border: 1px solid #e0e0e0; margin-top: 30px;">
                  <p style="color: #666; font-size: 12px;">
                    This is an automated response to confirm we received your message. Please do not reply to this email.
                  </p>
                </body>
              </html>
            `,
          },
          Text: {
            Charset: 'UTF-8',
            Data: `Thank you for contacting Eudaura

Hi ${name},

We've received your message and appreciate you reaching out to us. Our team will review your inquiry and get back to you as soon as possible.

Your message:
${message}

If you have any urgent matters, please don't hesitate to reach out to us directly at support@eudaura.com.

Best regards,
The Eudaura Team

---
This is an automated response to confirm we received your message. Please do not reply to this email.`,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Thank you for contacting Eudaura',
        },
      },
      Source: fromEmail,
    };

    try {
      await ses.send(new SendEmailCommand(userEmailParams));
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon!',
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}


