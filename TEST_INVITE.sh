#!/bin/bash

API_URL="http://localhost:3001"

echo "Testing Invite Collaborator Endpoint"
echo "===================================="
echo ""

# Test 1: Health check
echo "1. Testing health endpoint..."
curl -s "$API_URL/health" | head -20
echo ""
echo ""

# Test 2: Try to create invitation (will fail without auth, but we can see if endpoint exists)
echo "2. Testing /invitations endpoint (should return 401 Unauthorized, not 404)..."
curl -s -X POST "$API_URL/invitations" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
echo ""
echo ""

# Test 3: Try with a fake token
FAKE_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0In0.invalid"
echo "3. Testing /invitations endpoint with fake JWT (should return 401 or 400, not 404)..."
curl -s -X POST "$API_URL/invitations" \
  -H "Authorization: Bearer $FAKE_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
echo ""
echo ""

echo "If you see HTTP Status: 404 for any of these, the endpoint is not registered."
echo "If you see HTTP Status: 401 or 503, the server is working correctly!"
