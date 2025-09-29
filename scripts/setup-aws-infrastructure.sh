#!/bin/bash

# Eudaura AWS Infrastructure Setup Script
# This script creates all required AWS resources for the Eudaura platform
# Prerequisites: AWS CLI installed and configured with appropriate credentials

set -e  # Exit on error

echo "🚀 Starting Eudaura AWS Infrastructure Setup..."
echo ""

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
S3_BUCKET_NAME="${S3_BUCKET_NAME:-eudaura-documents}"
AMPLIFY_APP_ID="${AMPLIFY_APP_ID:-d28ow29ha3x2t5}"  # Replace with your Amplify App ID

echo "📋 Configuration:"
echo "   AWS Region: $AWS_REGION"
echo "   S3 Bucket: $S3_BUCKET_NAME"
echo "   Amplify App ID: $AMPLIFY_APP_ID"
echo ""

# 1. Create DynamoDB Tables
echo "📊 Creating DynamoDB Tables..."

# Table 1: tele_users
echo "   - Creating tele_users table..."
aws dynamodb create-table \
    --table-name tele_users \
    --attribute-definitions \
        AttributeName=pk,AttributeType=S \
        AttributeName=sk,AttributeType=S \
    --key-schema \
        AttributeName=pk,KeyType=HASH \
        AttributeName=sk,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION \
    --tags Key=Project,Value=Eudaura Key=Environment,Value=Production \
    2>/dev/null || echo "   ⚠️  Table tele_users already exists"

# Table 2: tele_clinician_apps
echo "   - Creating tele_clinician_apps table..."
aws dynamodb create-table \
    --table-name tele_clinician_apps \
    --attribute-definitions \
        AttributeName=pk,AttributeType=S \
        AttributeName=sk,AttributeType=S \
    --key-schema \
        AttributeName=pk,KeyType=HASH \
        AttributeName=sk,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION \
    --tags Key=Project,Value=Eudaura Key=Environment,Value=Production \
    2>/dev/null || echo "   ⚠️  Table tele_clinician_apps already exists"

# Table 3: tele_audit
echo "   - Creating tele_audit table..."
aws dynamodb create-table \
    --table-name tele_audit \
    --attribute-definitions \
        AttributeName=pk,AttributeType=S \
        AttributeName=sk,AttributeType=S \
    --key-schema \
        AttributeName=pk,KeyType=HASH \
        AttributeName=sk,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION \
    --tags Key=Project,Value=Eudaura Key=Environment,Value=Production \
    2>/dev/null || echo "   ⚠️  Table tele_audit already exists"

echo "✅ DynamoDB tables created successfully"
echo ""

# 2. Create S3 Bucket for Documents
echo "📁 Creating S3 Bucket for Documents..."

aws s3api create-bucket \
    --bucket $S3_BUCKET_NAME \
    --region $AWS_REGION \
    --acl private \
    2>/dev/null || echo "   ⚠️  Bucket $S3_BUCKET_NAME already exists"

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket $S3_BUCKET_NAME \
    --versioning-configuration Status=Enabled \
    --region $AWS_REGION

# Enable encryption
aws s3api put-bucket-encryption \
    --bucket $S3_BUCKET_NAME \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }' \
    --region $AWS_REGION

# Block all public access
aws s3api put-public-access-block \
    --bucket $S3_BUCKET_NAME \
    --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
    --region $AWS_REGION

# Add lifecycle policy for document retention (optional)
aws s3api put-bucket-lifecycle-configuration \
    --bucket $S3_BUCKET_NAME \
    --lifecycle-configuration '{
        "Rules": [{
            "Id": "DeleteOldDocuments",
            "Status": "Enabled",
            "Prefix": "clinician-documents/",
            "Expiration": {
                "Days": 2555
            },
            "NoncurrentVersionExpiration": {
                "NoncurrentDays": 90
            }
        }]
    }' \
    --region $AWS_REGION

echo "✅ S3 bucket created and configured"
echo ""

# 3. Create IAM Policy for Amplify
echo "🔐 Creating IAM Policy for Amplify..."

POLICY_DOCUMENT=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            "Resource": [
                "arn:aws:dynamodb:${AWS_REGION}:*:table/tele_users",
                "arn:aws:dynamodb:${AWS_REGION}:*:table/tele_clinician_apps",
                "arn:aws:dynamodb:${AWS_REGION}:*:table/tele_audit"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::${S3_BUCKET_NAME}/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::${S3_BUCKET_NAME}"
        }
    ]
}
EOF
)

POLICY_ARN=$(aws iam create-policy \
    --policy-name EudauraAmplifyPolicy \
    --policy-document "$POLICY_DOCUMENT" \
    --region $AWS_REGION \
    --query 'Policy.Arn' \
    --output text 2>/dev/null || \
    aws iam list-policies \
        --query 'Policies[?PolicyName==`EudauraAmplifyPolicy`].Arn' \
        --output text)

echo "✅ IAM Policy created: $POLICY_ARN"
echo ""

# 4. Create IAM Role for Amplify
echo "👤 Creating IAM Role for Amplify..."

TRUST_POLICY=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "amplify.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF
)

ROLE_ARN=$(aws iam create-role \
    --role-name EudauraAmplifyRole \
    --assume-role-policy-document "$TRUST_POLICY" \
    --region $AWS_REGION \
    --query 'Role.Arn' \
    --output text 2>/dev/null || \
    aws iam get-role \
        --role-name EudauraAmplifyRole \
        --query 'Role.Arn' \
        --output text)

# Attach policy to role
aws iam attach-role-policy \
    --role-name EudauraAmplifyRole \
    --policy-arn $POLICY_ARN \
    --region $AWS_REGION 2>/dev/null || echo "   ⚠️  Policy already attached"

echo "✅ IAM Role created: $ROLE_ARN"
echo ""

# 5. Get AWS Account ID and Access Keys
echo "🔑 Getting AWS Account Information..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "   AWS Account ID: $ACCOUNT_ID"
echo ""

# 6. Set Environment Variables in Amplify (if Amplify CLI is configured)
echo "⚙️  Setting Amplify Environment Variables..."
echo ""
echo "Run these commands manually or add them in the Amplify Console:"
echo ""
echo "aws amplify update-app \\"
echo "    --app-id $AMPLIFY_APP_ID \\"
echo "    --region $AWS_REGION \\"
echo "    --environment-variables \\"
echo "        AWS_REGION=$AWS_REGION \\"
echo "        S3_BUCKET_NAME=$S3_BUCKET_NAME \\"
echo "        SEED_ADMIN_EMAIL=admin@eudaura.com"
echo ""

# Alternative: Create .env file for local development
echo "📝 Creating .env.local file for local development..."
cat > .env.local <<EOF
# AWS Configuration
AWS_REGION=$AWS_REGION
AWS_ACCESS_KEY_ID=<paste-your-access-key-here>
AWS_SECRET_ACCESS_KEY=<paste-your-secret-key-here>

# S3 Configuration
S3_BUCKET_NAME=$S3_BUCKET_NAME

# Admin Seeding
SEED_ADMIN_EMAIL=admin@eudaura.com

# Next.js
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
EOF

echo "✅ .env.local file created - Please add your AWS credentials"
echo ""

# 7. Wait for tables to be active
echo "⏳ Waiting for DynamoDB tables to become active..."
aws dynamodb wait table-exists --table-name tele_users --region $AWS_REGION
aws dynamodb wait table-exists --table-name tele_clinician_apps --region $AWS_REGION
aws dynamodb wait table-exists --table-name tele_audit --region $AWS_REGION
echo "✅ All tables are active"
echo ""

# 8. Summary
echo "🎉 Infrastructure Setup Complete!"
echo ""
echo "📋 Summary:"
echo "   ✅ DynamoDB Tables: tele_users, tele_clinician_apps, tele_audit"
echo "   ✅ S3 Bucket: $S3_BUCKET_NAME"
echo "   ✅ IAM Policy: EudauraAmplifyPolicy"
echo "   ✅ IAM Role: EudauraAmplifyRole"
echo ""
echo "📝 Next Steps:"
echo "   1. Update .env.local with your AWS credentials"
echo "   2. Set environment variables in AWS Amplify Console:"
echo "      - AWS_REGION=$AWS_REGION"
echo "      - S3_BUCKET_NAME=$S3_BUCKET_NAME"
echo "      - SEED_ADMIN_EMAIL=admin@eudaura.com"
echo "   3. Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to Amplify (from IAM user)"
echo "   4. Deploy your app to Amplify"
echo ""
echo "🔗 Useful Links:"
echo "   - DynamoDB Console: https://console.aws.amazon.com/dynamodb/home?region=$AWS_REGION"
echo "   - S3 Console: https://s3.console.aws.amazon.com/s3/buckets/$S3_BUCKET_NAME?region=$AWS_REGION"
echo "   - Amplify Console: https://console.aws.amazon.com/amplify/home?region=$AWS_REGION#/$AMPLIFY_APP_ID"
echo ""
echo "✨ Your Eudaura platform is ready to deploy!"
