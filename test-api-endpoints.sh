#!/bin/bash
echo "🧪 TESTING EUDAURA API ENDPOINTS..."
echo "==================================="

BASE_URL="https://main.d28ow29ha3x2t5.amplifyapp.com"

# Test patient registration endpoint
echo "1. Testing patient registration endpoint..."
curl -X POST "$BASE_URL/api/patient/provisional" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Patient",
    "dob": "1990-01-01",
    "email": "test@example.com",
    "phone": "+1234567890",
    "address": {
      "address1": "123 Test St",
      "city": "Test City",
      "state": "CA",
      "postalCode": "12345"
    },
    "insurance": {
      "hasInsurance": false
    },
    "preferredContact": "email",
    "consent": true
  }' \
  -w "\nStatus: %{http_code}\n\n" || echo "❌ Patient registration failed"

# Test clinician application endpoint
echo "2. Testing clinician application endpoint..."
curl -X POST "$BASE_URL/api/clinician/apply" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Dr. Test Clinician",
    "email": "clinician@example.com",
    "phone": "+1234567890",
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
  -w "\nStatus: %{http_code}\n\n" || echo "❌ Clinician application failed"

# Test basic API connectivity
echo "3. Testing basic API connectivity..."
curl -s "$BASE_URL/api/test" -w "\nStatus: %{http_code}\n" || echo "❌ API connectivity test failed"

echo "✅ API TESTING COMPLETE"
echo "Check the status codes above - 200/201 = working, 500 = AWS connectivity issues"
