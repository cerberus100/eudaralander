import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { nanoid } from 'nanoid';
import { sendClinicianDenialEmail } from '@/lib/email-notifications';

// Initialize DynamoDB client
// Initialize DynamoDB client with environment variables
const dynamodb = new DynamoDBClient({
  region: process.env.EUDAURA_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.EUDAURA_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.EUDAURA_AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params;

    // Get the application details
    const getCommand = new GetItemCommand({
      TableName: 'tele_clinician_apps',
      Key: {
        pk: { S: `APP#${appId}` },
        sk: { S: 'META' },
      },
    });

    const result = await dynamodb.send(getCommand);

    if (!result.Item) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const app = result.Item;

    // Check if application is in SUBMITTED status
    if (app.status?.S !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Application is not in SUBMITTED status' },
        { status: 400 }
      );
    }

    // Update application status to DENIED
    const updateCommand = new UpdateItemCommand({
      TableName: 'tele_clinician_apps',
      Key: {
        pk: { S: `APP#${appId}` },
        sk: { S: 'META' },
      },
      UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':status': { S: 'DENIED' },
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
        actorUserId: { S: 'ADMIN' },
        actorRole: { S: 'ADMIN' },
        action: { S: 'CLINICIAN_APPLICATION_DENIED' },
        target: { S: 'CLINICIAN_APP' },
        metadata: {
          M: {
            appId: { S: appId },
            clinicianName: app.identity?.M?.fullName || { S: '' },
            clinicianEmail: app.identity?.M?.email || { S: '' },
          }
        },
        createdAt: { S: new Date().toISOString() },
      },
    });

    await dynamodb.send(auditCommand);

    // Send denial email to clinician
    await sendClinicianDenialEmail({
      fullName: app.identity?.M?.fullName?.S || '',
      email: app.identity?.M?.email?.S || '',
      appId: appId,
    });

    return NextResponse.json({
      success: true,
      message: 'Clinician application denied. Notification email sent.',
    });

  } catch (error) {
    console.error('Clinician denial error:', error);
    return NextResponse.json(
      { error: 'Failed to deny clinician application' },
      { status: 500 }
    );
  }
}

