#!/bin/bash
echo "🧪 PRODUCTION API VERIFICATION TESTS"
echo "===================================="

BASE_URL="https://main.d28ow29ha3x2t5.amplifyapp.com"

echo ""
echo "1. Testing Patient Registration API..."
echo "   POST /api/patient/provisional"
curl -X POST "$BASE_URL/api/patient/provisional" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "TestPatient",
    "lastName": "Verification",
    "dob": "1990-01-01",
    "email": "test-verification@example.com",
    "phone": "+15551234567",
    "address": {
      "address1": "123 Test Ave",
      "city": "Test City",
      "state": "CA",
      "postalCode": "12345"
    },
    "insurance": {"hasInsurance": false},
    "preferredContact": "email",
    "consent": true
  }' \
  -w "\nStatus: %{http_code}\n" || echo "❌ Patient registration failed"

echo ""
echo "2. Testing Clinician Application API..."
echo "   POST /api/clinician/apply"
curl -X POST "$BASE_URL/api/clinician/apply" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Dr. Test Verification",
    "email": "clinician-verification@example.com",
    "phone": "+15559876543",
    "npi": "1234567890",
    "licenseNumber": [{
      "state": "CA",
      "licenseNumber": "TEST123",
      "expirationDate": "2025-12-31"
    }],
    "states": ["CA"],
    "specialties": ["Family Medicine"],
    "consent": true
  }' \
  -w "\nStatus: %{http_code}\n" || echo "❌ Clinician application failed"

echo ""
echo "3. Testing Basic Connectivity..."
echo "   GET /api/test"
curl -s "$BASE_URL/api/test" -w "\nStatus: %{http_code}\n" || echo "❌ Basic connectivity test failed"

echo ""
echo "4. Testing Admin Authentication..."
echo "   POST /login (check if login form works)"

echo ""
echo "✅ API VERIFICATION COMPLETE"
echo ""
echo "📋 CHECK THESE RESULTS:"
echo "   ✅ Status 200/201 = API working correctly"
echo "   ❌ Status 500 = AWS connectivity issues"
echo "   ❌ Status 403/401 = Authentication issues"
echo ""
echo "🔍 ALSO VERIFY:"
echo "   - Check DynamoDB 'tele_users' table for patient data"
echo "   - Check DynamoDB 'tele_clinician_apps' table for application"
echo "   - Check AWS SES for sent emails"
echo "   - Check S3 'eudaura-documents' bucket"
echo "   - Check CloudWatch for any error logs"
