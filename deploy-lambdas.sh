#!/bin/bash

echo "🚀 DEPLOYING EUDAURA LAMBDA FUNCTIONS"
echo "======================================"

# Create deployment directory
mkdir -p lambda-deployments

# Function 1: Patient Provisional Signup
echo "📦 Creating patient-provisional Lambda package..."
cd lambda-functions/patient-provisional
npm install --production
zip -r ../../lambda-deployments/patient-provisional.zip .
cd ../..

# Deploy Lambda function
echo "🚀 Deleting existing Lambda function..."
aws lambda delete-function --function-name eudaura-patient-provisional --region us-east-1 2>/dev/null || true

echo "🚀 Creating patient-provisional Lambda function..."
aws lambda create-function \
  --function-name eudaura-patient-provisional \
  --runtime nodejs18.x \
  --role arn:aws:iam::337909762852:role/service-role/AmplifySSRLoggingRole-ed8e166f-54cf-4320-afe7-f85c476de081 \
  --handler lambda.handler \
  --zip-file fileb://lambda-deployments/patient-provisional.zip \
  --timeout 30 \
  --memory-size 256 \
  --region us-east-1

echo "✅ Patient provisional Lambda deployed!"

# Update function configuration to trigger new deployment
echo "📦 Updating patient-provisional Lambda code..."
aws lambda update-function-code \
  --function-name eudaura-patient-provisional \
  --zip-file fileb://lambda-deployments/patient-provisional.zip \
  --region us-east-1

echo "🎉 LAMBDA DEPLOYMENT COMPLETE!"
echo ""
echo "📋 Next Steps:"
echo "1. Create API Gateway endpoints pointing to Lambda functions"
echo "2. Update frontend to call Lambda endpoints instead of /api routes"
echo "3. Test end-to-end functionality"
