export async function GET() { 
  return Response.json({ 
    message: "API is working!",
    env: {
      region: process.env.NEXT_PUBLIC_EUDAURA_AWS_REGION,
      accessKey: process.env.NEXT_PUBLIC_EUDAURA_AWS_ACCESS_KEY_ID ? 'SET' : 'NOT_SET',
      secretKey: process.env.NEXT_PUBLIC_EUDAURA_AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT_SET',
      bucket: process.env.S3_BUCKET_NAME,
      adminEmail: process.env.SEED_ADMIN_EMAIL
    }
  }); 
}
