#!/bin/bash
echo "🔍 VERIFYING AWS SETUP FOR EUDAURA..."
echo "======================================"

# Check AWS credentials
echo "1. Checking AWS credentials..."
aws sts get-caller-identity

# Check DynamoDB tables
echo ""
echo "2. Checking DynamoDB tables..."
aws dynamodb list-tables --region us-east-1

# Check S3 bucket
echo ""
echo "3. Checking S3 bucket..."
aws s3api list-buckets --query 'Buckets[].Name' | grep eudaura-documents || echo "❌ S3 bucket 'eudaura-documents' not found"

# Test DynamoDB access
echo ""
echo "4. Testing DynamoDB access..."
aws dynamodb describe-table --table-name tele_users --region us-east-1 || echo "❌ Cannot access tele_users table"

# Test S3 access
echo ""
echo "5. Testing S3 access..."
aws s3api head-bucket --bucket eudaura-documents --region us-east-1 && echo "✅ S3 bucket accessible" || echo "❌ S3 bucket not accessible"

echo ""
echo "✅ VERIFICATION COMPLETE"
echo "If all checks pass, your AWS setup is ready for Amplify deployment!"
