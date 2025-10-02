export async function GET() { 
  return Response.json({ 
    message: "✅ API is working! Using environment variables for AWS authentication",
    status: "Ready to use AWS services with environment variable authentication",
    config: {
      region: process.env.EUDAURA_AWS_REGION,
      authentication: "Environment Variables",
      services: ["DynamoDB", "S3", "SES"],
      bucket: process.env.S3_BUCKET_NAME,
      adminEmail: process.env.SEED_ADMIN_EMAIL,
      envStatus: {
        region: process.env.EUDAURA_AWS_REGION ? 'SET' : 'NOT_SET',
        accessKey: process.env.EUDAURA_AWS_ACCESS_KEY_ID ? 'SET' : 'NOT_SET',
        secretKey: process.env.EUDAURA_AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT_SET'
      }
    }
  }); 
}
