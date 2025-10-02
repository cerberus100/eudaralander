import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

// Initialize DynamoDB client
const dynamodb = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_EUDAURA_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_EUDAURA_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_EUDAURA_AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'SUBMITTED';

    // Scan for clinician applications with the specified status
    const scanCommand = new ScanCommand({
      TableName: 'tele_clinician_apps',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': { S: status },
      },
    });

    const result = await dynamodb.send(scanCommand);

    if (!result.Items) {
      return NextResponse.json([]);
    }

    // Transform the data for the frontend
    const applications = result.Items.map((item) => {
      const identity = item.identity?.M;
      const licenses = item.licenses?.L || [];
      const documents = item.documents?.M || {};
      const flags = item.flags?.M || {};

      return {
        appId: item.pk?.S?.replace('APP#', '') || '',
        fullName: identity?.fullName?.S || '',
        email: identity?.email?.S || '',
        phone: identity?.phone?.S || '',
        npi: identity?.npi?.S || '',
        states: licenses.map((license: { M?: { state?: { S?: string } } }) => license.M?.state?.S).filter((state): state is string => Boolean(state)),
        specialties: flags?.specialties?.SS || [],
        pecosEnrolled: flags?.pecosEnrolled?.BOOL || false,
        documents: {
          malpracticeKey: documents?.malpracticeKey?.S,
          deaKey: documents?.deaKey?.S,
          extras: documents?.extras?.SS || [],
        },
        createdAt: item.createdAt?.S || '',
      };
    });

    return NextResponse.json(applications);

  } catch (error) {
    console.error('Admin clinician apps fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clinician applications' },
      { status: 500 }
    );
  }
}

