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

    // Get the allowed states from licenses
    const licenses = app.licenses?.L || [];
    const allowedStates = licenses.map((license: any) => license.M?.state?.S).filter(Boolean);

    // Update application status to APPROVED
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
        ':status': { S: 'APPROVED' },
        ':updatedAt': { S: new Date().toISOString() },
      },
    });

    await dynamodb.send(updateCommand);

    // Create user record
    const userId = nanoid();
    const userItem = {
      pk: { S: `USER#${userId}` },
      sk: { S: 'PROFILE' },
      role: { S: 'CLINICIAN' },
      clinicianState: { S: 'INVITED' },
      allowedStates: { SS: allowedStates },
      profile: {
        M: {
          fullName: app.identity?.M?.fullName,
          email: app.identity?.M?.email,
          phone: app.identity?.M?.phone,
          npi: app.identity?.M?.npi,
        }
      },
      createdAt: { S: new Date().toISOString() },
      updatedAt: { S: new Date().toISOString() },
    };

    const putCommand = new PutItemCommand({
      TableName: 'tele_users',
      Item: userItem,
    });

    await dynamodb.send(putCommand);

    // Write audit entry
    const auditCommand = new PutItemCommand({
      TableName: 'tele_audit',
      Item: {
        pk: { S: `AUDIT#${nanoid()}` },
        sk: { S: `TS#${new Date().toISOString()}` },
        actorUserId: { S: 'ADMIN' },
        actorRole: { S: 'ADMIN' },
        action: { S: 'CLINICIAN_APPLICATION_APPROVED' },
        target: { S: 'CLINICIAN_APP' },
        metadata: {
          M: {
            appId: { S: appId },
            userId: { S: userId },
            clinicianName: app.identity?.M?.fullName,
            clinicianEmail: app.identity?.M?.email,
            allowedStates: { SS: allowedStates },
          }
        },
        createdAt: { S: new Date().toISOString() },
      },
    });

    await dynamodb.send(auditCommand);

    // In production, send invitation email with magic link
    // TODO: Implement SES email with magic link

    return NextResponse.json({
      success: true,
      userId: userId,
      allowedStates: allowedStates,
    });

  } catch (error) {
    console.error('Clinician approval error:', error);
    return NextResponse.json(
      { error: 'Failed to approve clinician application' },
      { status: 500 }
    );
  }
}
