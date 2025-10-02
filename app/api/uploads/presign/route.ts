import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client (in production, use environment variables)
const s3Client = new S3Client({
  region: process.env.EUDAURA_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.EUDAURA_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.EUDAURA_AWS_SECRET_ACCESS_KEY || '',
  },
});

// Allowed file types and their MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];


export async function POST(request: NextRequest) {
  try {
    const { filename, contentType } = await request.json();

    // Validate input
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json(
        { error: 'Filename is required and must be a string' },
        { status: 400 }
      );
    }

    if (!contentType || typeof contentType !== 'string') {
      return NextResponse.json(
        { error: 'Content type is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate content type
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `Content type ${contentType} not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate unique key with timestamp and random suffix
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const key = `clinician-documents/${timestamp}-${randomSuffix}-${filename}`;

    // Create S3 PutObject command
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'eudaura-documents',
      Key: key,
      ContentType: contentType,
      ACL: 'private', // Private ACL for security
    });

    // Generate presigned URL (expires in 10 minutes)
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 600, // 10 minutes
    });

    return NextResponse.json({
      url: signedUrl,
      key: key,
    });

  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
