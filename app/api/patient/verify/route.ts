import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { nanoid } from 'nanoid';
import { syncPatientToMainApp } from '@/lib/sync-to-main-app';

// Initialize DynamoDB client
// Use default AWS credential chain with IAM role
const dynamodb = new DynamoDBClient({
  region: 'us-east-1',
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
        actorUserId: { S: user.pk?.S?.replace('USER#', '') || 'unknown' },
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

    // Sync patient data to main app
    const userId = user.pk?.S?.replace('USER#', '') || 'unknown';
    const patientData = {
      userId,
      email: user.contact?.M?.email?.S || contact,
      phone: user.contact?.M?.phone?.S,
      profile: {
        firstName: user.profile?.M?.firstName?.S || '',
        lastName: user.profile?.M?.lastName?.S || '',
        dob: user.profile?.M?.dob?.S || '',
        address: user.profile?.M?.address?.M,
        insurance: user.profile?.M?.insurance?.M,
        preferredContact: user.profile?.M?.preferredContact?.S || 'email',
      },
    };

    // Sync to main app (non-blocking)
    syncPatientToMainApp(patientData).catch((err) => {
      console.error('Failed to sync patient to main app:', err);
      // Continue anyway - admin can manually sync later
    });

    // Return success with redirect to main app
    const mainAppUrl = process.env.MAIN_APP_URL || 'https://app.eudaura.com';
    return NextResponse.json({
      success: true,
      next: `${mainAppUrl}/onboarding/patient?userId=${userId}`,
      message: 'Account verified! Redirecting to complete your profile...',
    });

  } catch (error) {
    console.error('Patient verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
