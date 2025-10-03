import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { nanoid } from 'nanoid';

// Initialize DynamoDB client
const dynamodb = new DynamoDBClient({
  region: process.env.EUDAURA_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.EUDAURA_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.EUDAURA_AWS_SECRET_ACCESS_KEY || '',
  },
});

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.EUDAURA_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.EUDAURA_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.EUDAURA_AWS_SECRET_ACCESS_KEY || '',
  },
});

// Helper function to generate OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to hash OTP (simple hash for now)
function hashOTP(otp: string): string {
  // In production, use proper bcrypt
  let hash = 0;
  for (let i = 0; i < otp.length; i++) {
    const char = otp.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const {
      firstName,
      lastName,
      dob,
      email,
      phone,
      address,
      insurance,
      preferredContact,
      consent
    } = body;

    if (!firstName || !lastName || !dob || !email || !address?.address1 || !address?.city || !address?.state || !address?.postalCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (preferredContact === 'sms' && !phone) {
      return NextResponse.json(
        { error: 'Phone number required for SMS verification' },
        { status: 400 }
      );
    }

    if (insurance?.hasInsurance && !insurance.type) {
      return NextResponse.json(
        { error: 'Insurance type required when hasInsurance is true' },
        { status: 400 }
      );
    }

    // Validate insurance-specific fields
    if (insurance?.hasInsurance) {
      if (insurance.type === 'Medicare' && !insurance.medicare?.id) {
        return NextResponse.json(
          { error: 'Medicare ID required for Medicare insurance' },
          { status: 400 }
        );
      }
      if (insurance.type === 'Medicaid' && (!insurance.medicaid?.id || !insurance.medicaid?.state)) {
        return NextResponse.json(
          { error: 'Medicaid ID and state required for Medicaid insurance' },
          { status: 400 }
        );
      }
      if (insurance.type === 'Commercial' && (!insurance.commercial?.memberId || !insurance.commercial?.carrier)) {
        return NextResponse.json(
          { error: 'Member ID and carrier required for commercial insurance' },
          { status: 400 }
        );
      }
    }

    // Generate user ID and OTP
    const userId = nanoid();
    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    // Set OTP expiration (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Create user record
    const userItem = {
      pk: { S: `USER#${userId}` },
      sk: { S: 'PROFILE' },
      role: { S: 'PATIENT' },
      patientState: { S: 'PENDING_CONTACT_VERIFICATION' },
      contact: {
        M: {
          email: { S: email },
          ...(phone && { phone: { S: phone } }),
        }
      },
      profile: {
        M: {
          firstName: { S: firstName },
          lastName: { S: lastName },
          dob: { S: dob },
          address: {
            M: {
              address1: { S: address.address1 },
              ...(address.address2 && { address2: { S: address.address2 } }),
              city: { S: address.city },
              state: { S: address.state },
              postalCode: { S: address.postalCode },
            }
          },
          insurance: {
            M: {
              hasInsurance: { BOOL: insurance?.hasInsurance || false },
              ...(insurance?.hasInsurance && {
                type: { S: insurance.type },
                ...(insurance.type === 'Medicare' && {
                  medicare: {
                    M: {
                      type: { S: insurance.medicare?.type || '' },
                      id: { S: insurance.medicare?.id || '' },
                      ...(insurance.medicare?.advantageCarrier && { advantageCarrier: { S: insurance.medicare.advantageCarrier } }),
                      ...(insurance.medicare?.advantagePlanName && { advantagePlanName: { S: insurance.medicare.advantagePlanName } }),
                    }
                  }
                }),
                ...(insurance.type === 'Medicaid' && {
                  medicaid: {
                    M: {
                      state: { S: insurance.medicaid?.state || '' },
                      id: { S: insurance.medicaid?.id || '' },
                    }
                  }
                }),
                ...(insurance.type === 'Commercial' && {
                  commercial: {
                    M: {
                      carrier: { S: insurance.commercial?.carrier || '' },
                      ...(insurance.commercial?.planName && { planName: { S: insurance.commercial.planName } }),
                      memberId: { S: insurance.commercial?.memberId || '' },
                      ...(insurance.commercial?.groupId && { groupId: { S: insurance.commercial.groupId } }),
                    }
                  }
                }),
              })
            }
          },
          preferredContact: { S: preferredContact },
          consent: { BOOL: consent },
        }
      },
      otp: {
        M: {
          hash: { S: otpHash },
          expiresAt: { S: expiresAt },
        }
      },
      createdAt: { S: new Date().toISOString() },
      updatedAt: { S: new Date().toISOString() },
    };

    // Write to DynamoDB
    const command = new PutItemCommand({
      TableName: 'tele_users',
      Item: userItem,
    });

    await dynamodb.send(command);

    // Write audit entry
    const auditCommand = new PutItemCommand({
      TableName: 'tele_audit',
      Item: {
        pk: { S: `AUDIT#${nanoid()}` },
        sk: { S: `TS#${new Date().toISOString()}` },
        actorUserId: { S: userId },
        actorRole: { S: 'PATIENT' },
        action: { S: 'PATIENT_SIGNUP' },
        target: { S: 'USER' },
        metadata: {
          M: {
            userId: { S: userId },
            contact: { S: email },
          }
        },
        createdAt: { S: new Date().toISOString() },
      },
    });

    await dynamodb.send(auditCommand);

    // Send OTP via email
    try {
      const fromEmail = process.env.EUDAURA_FROM_EMAIL || 'noreply@eudaura.com';
      
      const emailCommand = new SendEmailCommand({
        Source: fromEmail,
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Subject: {
            Data: 'Your Eudaura Verification Code',
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: #556B4F; color: white; padding: 20px; text-align: center;">
                    <h1>Verification Code</h1>
                  </div>
                  <div style="padding: 20px;">
                    <p>Hi ${firstName},</p>
                    <p>Welcome to Eudaura! Please use this verification code to complete your account setup:</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #556B4F;">
                        ${otp}
                      </div>
                    </div>
                    <p>This code will expire in 5 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <p>Welcome to Eudaura!</p>
                  </div>
                </div>
              `,
              Charset: 'UTF-8',
            },
            Text: {
              Data: `Hi ${firstName},

Welcome to Eudaura! Please use this verification code to complete your account setup:

${otp}

This code will expire in 5 minutes.

If you didn't request this, please ignore this email.

Welcome to Eudaura!`,
              Charset: 'UTF-8',
            },
          },
        },
      });

      const emailResult = await sesClient.send(emailCommand);
      console.log('✅ OTP email sent successfully:', emailResult.MessageId);
      
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      // Log OTP to console as fallback
      console.log('📧 FALLBACK - OTP for', email, ':', otp);
    }

    // Return success with user ID for verification
    return NextResponse.json({
      requestId: userId,
      contact: email,
    });

  } catch (error) {
    console.error('Patient signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create patient account' },
      { status: 500 }
    );
  }
}
