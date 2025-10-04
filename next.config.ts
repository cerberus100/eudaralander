import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000, // 1 year cache
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Enable compression
  compress: true,
  
  // Ensure environment variables are properly injected
  env: {
    EUDAURA_AWS_REGION: process.env.EUDAURA_AWS_REGION,
    EUDAURA_AWS_ACCESS_KEY_ID: process.env.EUDAURA_AWS_ACCESS_KEY_ID,
    EUDAURA_AWS_SECRET_ACCESS_KEY: process.env.EUDAURA_AWS_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
    EUDAURA_FROM_EMAIL: process.env.EUDAURA_FROM_EMAIL,
  },
};

export default nextConfig;
