import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { nanoid } from 'nanoid';

// Initialize DynamoDB client
const dynamodb = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const {
      fullName,
      email,
      phone,
      npi,
      licenseNumber,
      states,
      specialties,
      documents,
      flags,
      consent
    } = body;

    if (!fullName || !email || !phone || !npi || !licenseNumber || !states?.length || !specialties?.length || !consent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate NPI format
    if (!/^\d{10}$/.test(npi)) {
      return NextResponse.json(
        { error: 'NPI must be exactly 10 digits' },
        { status: 400 }
      );
    }

    // Validate states array
    if (!Array.isArray(states) || states.length === 0) {
      return NextResponse.json(
        { error: 'At least one state license is required' },
        { status: 400 }
      );
    }

    // Validate specialties array
    if (!Array.isArray(specialties) || specialties.length === 0) {
      return NextResponse.json(
        { error: 'At least one specialty is required' },
        { status: 400 }
      );
    }

    // Validate license requirements
    if (!Array.isArray(licenseNumber) || licenseNumber.length === 0) {
      return NextResponse.json(
        { error: 'At least one license is required' },
        { status: 400 }
      );
    }

    // Generate application ID
    const appId = nanoid();

    // Create clinician application record
    const appItem = {
      pk: { S: `APP#${appId}` },
      sk: { S: 'META' },
      status: { S: 'SUBMITTED' },
      identity: {
        M: {
          fullName: { S: fullName },
          email: { S: email },
          phone: { S: phone },
          npi: { S: npi },
        }
      },
      licenses: {
        L: licenseNumber.map((license: any) => ({
          M: {
            state: { S: license.state },
            licenseNumber: { S: license.licenseNumber },
            expirationDate: { S: license.expirationDate },
            ...(license.docKey && { docKey: { S: license.docKey } }),
          }
        }))
      },
      documents: {
        M: {
          ...(documents?.malpracticeKey && { malpracticeKey: { S: documents.malpracticeKey } }),
          ...(documents?.deaKey && { deaKey: { S: documents.deaKey } }),
          ...(documents?.extras && documents.extras.length > 0 && { extras: { SS: documents.extras } }),
        }
      },
      flags: {
        M: {
          pecosEnrolled: { BOOL: flags?.pecosEnrolled || false },
          ...(flags?.dea && {
            dea: {
              M: {
                number: { S: flags.dea.number },
                state: { S: flags.dea.state },
              }
            }
          }),
          modalities: { SS: flags?.modalities || [] },
          specialties: { SS: specialties },
        }
      },
      derived: {
        M: {
          allowedStates: { SS: states },
        }
      },
      createdAt: { S: new Date().toISOString() },
      updatedAt: { S: new Date().toISOString() },
    };

    // Write to DynamoDB
    const command = new PutItemCommand({
      TableName: 'tele_clinician_apps',
      Item: appItem,
    });

    await dynamodb.send(command);

    // Write audit entry
    const auditCommand = new PutItemCommand({
      TableName: 'tele_audit',
      Item: {
        pk: { S: `AUDIT#${nanoid()}` },
        sk: { S: `TS#${new Date().toISOString()}` },
        actorUserId: { S: 'SYSTEM' },
        actorRole: { S: 'SYSTEM' },
        action: { S: 'CLINICIAN_APPLICATION_SUBMITTED' },
        target: { S: 'CLINICIAN_APP' },
        metadata: {
          M: {
            appId: { S: appId },
            clinicianName: { S: fullName },
            clinicianEmail: { S: email },
          }
        },
        createdAt: { S: new Date().toISOString() },
      },
    });

    await dynamodb.send(auditCommand);

    // In development, log the application
    if (process.env.NODE_ENV === 'development') {
      console.log('Clinician application submitted:', { appId, fullName, email });
    } else {
      // In production, send SES email confirmation
      // TODO: Implement SES email sending
    }

    // Return success with application ID
    return NextResponse.json({
      appId: appId,
    });

  } catch (error) {
    console.error('Clinician application error:', error);
    return NextResponse.json(
      { error: 'Failed to submit clinician application' },
      { status: 500 }
    );
  }
}
