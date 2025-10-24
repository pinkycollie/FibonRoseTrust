# Persona Identity Verification Integration

## Overview

FibonroseTrust integrates with [Persona](https://withpersona.com) to provide comprehensive identity verification services. Persona enables secure, compliant identity verification through document scanning, biometric checks, and continuous monitoring.

## Features

- **Identity Verification**: Verify user identities through government-issued IDs
- **Document Verification**: Scan and verify passports, driver's licenses, and other documents
- **Biometric Verification**: Selfie verification and liveness detection
- **Continuous Monitoring**: Ongoing verification and risk assessment
- **Webhook Integration**: Real-time status updates via webhooks

## Setup

### 1. Get Persona Credentials

1. Sign up for a Persona account at [withpersona.com](https://withpersona.com)
2. Navigate to the API Keys section in your dashboard
3. Create a new API key for your environment (sandbox or production)
4. Note your Template ID for the verification flow

### 2. Configure Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Persona Configuration
PERSONA_API_KEY=your_api_key_here
PERSONA_ENVIRONMENT=sandbox  # or 'production'
PERSONA_TEMPLATE_ID=your_template_id_here
PERSONA_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Initialize Persona Integration

The Persona integration is initialized automatically when the server starts. Add this to your `server/index.ts`:

```typescript
import { initPersona } from './services/persona-integration';

// Initialize Persona
initPersona({
  apiKey: process.env.PERSONA_API_KEY!,
  environment: process.env.PERSONA_ENVIRONMENT as 'sandbox' | 'production',
  templateId: process.env.PERSONA_TEMPLATE_ID
});
```

## API Endpoints

### Create Inquiry

Create a new identity verification inquiry for a user.

**Endpoint:** `POST /api/v1/persona/inquiries`

**Request Body:**
```json
{
  "userId": 1,
  "templateId": "tmpl_xxx" // optional, uses default if not provided
  "redirectUri": "https://yourdomain.com/verification-complete" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inquiry": {
      "id": "inq_xxx",
      "type": "inquiry",
      "attributes": {
        "status": "created",
        "reference_id": "user_1",
        "created_at": "2024-01-01T00:00:00Z"
      }
    },
    "verification": {
      "id": 123,
      "userId": 1,
      "status": "PENDING"
    },
    "sessionUrl": "https://withpersona.com/verify?inquiry-id=inq_xxx"
  }
}
```

### Get Inquiry Status

Retrieve the current status of an inquiry.

**Endpoint:** `GET /api/v1/persona/inquiries/:inquiryId`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "inq_xxx",
    "type": "inquiry",
    "attributes": {
      "status": "completed",
      "reference_id": "user_1",
      "created_at": "2024-01-01T00:00:00Z",
      "completed_at": "2024-01-01T00:05:00Z"
    }
  }
}
```

### List User Inquiries

Get all inquiries for a specific user.

**Endpoint:** `GET /api/v1/persona/users/:userId/inquiries`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "inq_xxx",
      "type": "inquiry",
      "attributes": {
        "status": "completed",
        "reference_id": "user_1"
      }
    }
  ]
}
```

### Test Connection

Test the connection to Persona API.

**Endpoint:** `GET /api/v1/persona/test-connection`

**Response:**
```json
{
  "success": true,
  "message": "Persona connection successful",
  "data": {
    // Account information
  }
}
```

## Webhook Integration

### Configure Webhook in Persona Dashboard

1. Go to your Persona dashboard
2. Navigate to Webhooks section
3. Add a new webhook with URL: `https://yourdomain.com/api/v1/persona/webhook`
4. Select events to subscribe to:
   - `inquiry.created`
   - `inquiry.completed`
   - `inquiry.approved`
   - `inquiry.failed`
   - `verification.created`
   - `verification.completed`
5. Save the webhook secret to your environment variables

### Webhook Endpoint

**Endpoint:** `POST /api/v1/persona/webhook`

**Headers:**
- `Persona-Signature`: HMAC signature for verification

**Webhook Payload:**
```json
{
  "type": "event",
  "id": "evt_xxx",
  "attributes": {
    "name": "inquiry.completed",
    "payload": {
      "data": {
        "id": "inq_xxx",
        "type": "inquiry",
        "attributes": {
          "status": "completed",
          "reference_id": "user_1"
        }
      }
    }
  }
}
```

The webhook automatically:
1. Verifies the signature
2. Updates the verification status in the database
3. Recalculates the user's trust score

## Client Integration

### Embed Persona Flow

Use the session URL returned from the create inquiry endpoint to embed Persona's verification flow:

```typescript
// React example
import React, { useEffect } from 'react';

function VerificationFlow({ sessionUrl }) {
  useEffect(() => {
    // Open Persona flow in modal or redirect
    window.location.href = sessionUrl;
    
    // Or use Persona's embedded client
    // See: https://docs.withpersona.com/docs/embedded-flow
  }, [sessionUrl]);

  return <div>Loading verification...</div>;
}
```

### Handle Completion

After verification is complete, Persona will redirect the user back to your `redirectUri` with status information:

```typescript
// Handle redirect
const urlParams = new URLSearchParams(window.location.search);
const inquiryId = urlParams.get('inquiry-id');
const status = urlParams.get('status');

// Fetch updated verification status
const response = await fetch(`/api/v1/persona/inquiries/${inquiryId}`);
const data = await response.json();
```

## Testing

### Sandbox Mode

When using `sandbox` environment, you can use Persona's test mode:

1. Use test credentials from Persona dashboard
2. Manual approval/decline via API:

```typescript
// Approve inquiry (sandbox only)
POST /api/v1/persona/inquiries/:inquiryId/approve

// Decline inquiry (sandbox only)
POST /api/v1/persona/inquiries/:inquiryId/decline
```

### Running Tests

```bash
# Run all tests including Persona integration
npm test

# Run only Persona tests
npm test persona-integration.test.ts
```

## Security Considerations

1. **API Key Security**: Never expose API keys in client-side code
2. **Webhook Verification**: Always verify webhook signatures
3. **HTTPS Only**: All Persona API calls must use HTTPS
4. **Data Retention**: Follow Persona's data retention policies
5. **Compliance**: Ensure GDPR/CCPA compliance when handling identity data

## Error Handling

All Persona API errors are caught and returned in a standardized format:

```json
{
  "success": false,
  "message": "Failed to create Persona inquiry",
  "error": "API Error: Invalid template ID"
}
```

Common error codes:
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (invalid API key)
- `404`: Resource not found
- `429`: Rate limit exceeded
- `500`: Server error

## Troubleshooting

### Connection Issues

If you're having trouble connecting to Persona:

1. Verify API key is correct and active
2. Check environment setting (sandbox vs production)
3. Test connection: `GET /api/v1/persona/test-connection`
4. Review Persona API logs in your dashboard

### Webhook Issues

If webhooks aren't working:

1. Verify webhook URL is publicly accessible
2. Check webhook secret is correctly configured
3. Test webhook signature verification
4. Review webhook delivery logs in Persona dashboard

## Additional Resources

- [Persona Documentation](https://docs.withpersona.com)
- [Persona API Reference](https://docs.withpersona.com/reference)
- [Persona Dashboard](https://withpersona.com/dashboard)
- [Integration Examples](https://github.com/persona-id/examples)

## Support

For issues specific to the FibonroseTrust Persona integration, please open an issue on GitHub.

For Persona-specific questions, contact [support@withpersona.com](mailto:support@withpersona.com).
