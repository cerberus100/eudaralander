export async function GET() { 
  return Response.json({ 
    message: "✅ API is working! AWS SDK will use IAM role credentials",
    status: "Ready to use AWS services with IAM role authentication",
    config: {
      region: "us-east-1",
      authentication: "IAM Role (AmplifySSRLoggingRole)",
      services: ["DynamoDB", "S3", "SES"],
      bucket: process.env.S3_BUCKET_NAME,
      adminEmail: process.env.SEED_ADMIN_EMAIL
    }
  }); 
}
