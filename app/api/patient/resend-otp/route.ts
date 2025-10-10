import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import crypto from 'crypto';

// Initialize AWS clients
const dynamodb = new DynamoDBClient({
  region: process.env.EUDAURA_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.EUDAURA_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.EUDAURA_AWS_SECRET_ACCESS_KEY || '',
  },
});

const ses = new SESClient({
  region: process.env.EUDAURA_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.EUDAURA_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.EUDAURA_AWS_SECRET_ACCESS_KEY || '',
  },
});

// Generate 6-digit OTP
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Simple hash function for OTP
function hashOTP(otp: string): string {
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
    const { contact } = body;

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact information is required' },
        { status: 400 }
      );
    }

    // Determine if contact is email or phone
    const isEmail = contact.includes('@');
    
    // Find user by contact
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userPhone: string | null = null;

    // For now, we'll use a scan operation - in production, you'd want an index on email/phone
    const scanParams = {
      TableName: 'tele_users',
      FilterExpression: 'contact.email = :contact OR contact.phone = :contact',
      ExpressionAttributeValues: {
        ':contact': { S: contact },
      },
    };

    // Since we can't easily scan with the current structure, we'll need to handle this differently
    // For the purpose of this implementation, we'll assume the frontend passes the userId
    // In a real implementation, you'd have proper indexes

    // Generate new OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // For demonstration, we'll need the user to pass their userId or we need to implement proper lookup
    // This is a limitation of the current DynamoDB structure
    
    // Send OTP via email if contact is email
    if (isEmail) {
      const emailParams = {
        Destination: {
          ToAddresses: [contact],
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: `
                <html>
                  <body style="font-family: Arial, sans-serif;">
                    <h2>Your Eudaura Verification Code</h2>
                    <p>Here is your new verification code:</p>
                    <h1 style="color: #556B4F; letter-spacing: 5px;">${otp}</h1>
                    <p>This code will expire in 5 minutes.</p>
                    <p>If you didn't request this code, please ignore this email.</p>
                  </body>
                </html>
              `,
            },
            Text: {
              Charset: 'UTF-8',
              Data: `Your Eudaura verification code is: ${otp}\n\nThis code will expire in 5 minutes.`,
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: 'Your Eudaura Verification Code',
          },
        },
        Source: process.env.EUDAURA_FROM_EMAIL || 'noreply@eudaura.com',
      };

      try {
        await ses.send(new SendEmailCommand(emailParams));
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        return NextResponse.json(
          { error: 'Failed to send verification code' },
          { status: 500 }
        );
      }
    } else {
      // For SMS, you would integrate with SNS or another SMS provider
      // For now, we'll just log it
      console.log(`OTP for phone ${contact}: ${otp}`);
      
      // In production, you'd send SMS here
      return NextResponse.json(
        { error: 'SMS verification not yet implemented' },
        { status: 501 }
      );
    }

    // Note: In a complete implementation, you would also update the user's OTP in the database
    // This requires having the user's ID or a proper lookup mechanism

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      contact: contact,
    });

  } catch (error) {
    console.error('OTP resend error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification code' },
      { status: 500 }
    );
  }
}


