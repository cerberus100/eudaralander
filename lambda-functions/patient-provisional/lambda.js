const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { nanoid } = require('nanoid');

// Initialize DynamoDB client with IAM role credentials
const dynamodb = new DynamoDBClient({
  region: 'us-east-1',
});

exports.handler = async (event, context) => {
  try {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // Parse the request body
    const body = JSON.parse(event.body);
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'dob', 'email', 'phone'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
          body: JSON.stringify({ error: `Missing required field: ${field}` }),
        };
      }
    }

    // Generate unique user ID and OTP
    const userId = nanoid();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Prepare DynamoDB item
    const item = {
      pk: { S: `USER#${userId}` },
      sk: { S: 'PROFILE' },
      role: { S: 'PATIENT' },
      patientState: { S: 'PENDING_CONTACT_VERIFICATION' },
      contact: {
        M: {
          email: { S: body.email },
          phone: { S: body.phone },
        }
      },
      profile: {
        M: {
          firstName: { S: body.firstName },
          lastName: { S: body.lastName },
          dob: { S: body.dob },
          address: body.address ? {
            M: {
              address1: { S: body.address.address1 },
              city: { S: body.address.city },
              state: { S: body.address.state },
              postalCode: { S: body.address.postalCode },
            }
          } : undefined,
          insurance: body.insurance ? {
            M: {
              hasInsurance: { BOOL: body.insurance.hasInsurance },
            }
          } : undefined,
          preferredContact: { S: body.preferredContact },
          consent: { BOOL: body.consent },
        }
      },
      otp: {
        M: {
          hash: { S: otpHash },
          expiresAt: { S: expiresAt.toISOString() },
        }
      },
      createdAt: { S: new Date().toISOString() },
      updatedAt: { S: new Date().toISOString() },
    };

    // Remove undefined fields
    Object.keys(item).forEach(key => {
      if (item[key] === undefined) {
        delete item[key];
      }
    });

    // Write to DynamoDB
    await dynamodb.send(new PutItemCommand({
      TableName: 'tele_users',
      Item: item,
    }));

    // Log OTP in development (remove in production)
    console.log(`OTP for ${body.email}: ${otp}`);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        requestId: userId,
        contact: body.email,
      }),
    };

  } catch (error) {
    console.error('Patient signup error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'Failed to create patient account' }),
    };
  }
};

// Helper function to hash OTP
function hashOTP(otp) {
  let hash = 0;
  for (let i = 0; i < otp.length; i++) {
    const char = otp.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString();
}
