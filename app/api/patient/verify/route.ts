import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { nanoid } from 'nanoid';

// Initialize DynamoDB client
const dynamodb = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Helper function to hash OTP (same as in provisional)
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
    const { contact, code } = await request.json();

    if (!contact || !code) {
      return NextResponse.json(
        { error: 'Contact and code are required' },
        { status: 400 }
      );
    }

    // Find user by contact (email or phone)
    const getCommand = new GetItemCommand({
      TableName: 'tele_users',
      Key: {
        pk: { S: `USER#${contact}` },
        sk: { S: 'PROFILE' },
      },
    });

    const result = await dynamodb.send(getCommand);

    if (!result.Item) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    const user = result.Item;

    // Check if user is in correct state
    if (user.patientState?.S !== 'PENDING_CONTACT_VERIFICATION') {
      return NextResponse.json(
        { error: 'User is not in verification state' },
        { status: 400 }
      );
    }

    // Check OTP
    const storedOtpHash = user.otp?.M?.hash?.S;
    const otpExpiresAt = user.otp?.M?.expiresAt?.S;

    if (!storedOtpHash || !otpExpiresAt) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (new Date() > new Date(otpExpiresAt)) {
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValidOtp = hashOTP(code) === storedOtpHash;

    if (!isValidOtp) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Update user state to provisioned
    const updateCommand = new UpdateItemCommand({
      TableName: 'tele_users',
      Key: {
        pk: { S: `USER#${contact}` },
        sk: { S: 'PROFILE' },
      },
      UpdateExpression: 'SET patientState = :state, updatedAt = :updatedAt REMOVE otp',
      ExpressionAttributeValues: {
        ':state': { S: 'PROVISIONED' },
        ':updatedAt': { S: new Date().toISOString() },
      },
    });

    await dynamodb.send(updateCommand);

    // Write audit entry
    const auditCommand = new PutItemCommand({
      TableName: 'tele_audit',
      Item: {
        pk: { S: `AUDIT#${nanoid()}` },
        sk: { S: `TS#${new Date().toISOString()}` },
        actorUserId: { S: user.pk.S.replace('USER#', '') },
        actorRole: { S: 'PATIENT' },
        action: { S: 'PATIENT_VERIFIED' },
        target: { S: 'USER' },
        metadata: {
          M: {
            contact: { S: contact },
          }
        },
        createdAt: { S: new Date().toISOString() },
      },
    });

    await dynamodb.send(auditCommand);

    // Return success with redirect to onboarding
    return NextResponse.json({
      success: true,
      next: '/onboarding/patient',
    });

  } catch (error) {
    console.error('Patient verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
