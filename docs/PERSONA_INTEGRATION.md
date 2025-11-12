# Persona Identity Verification Integration

## Overview

FibonroseTrust integrates with [Persona](https://withpersona.com) to provide identity verification services **for specific sensitive scenarios only**. Persona is NOT used for general authentication or normal app activities.

### When to Use Persona

Persona verification is **only required** for specific circumstances involving:
- **Professional Licenses**: Verifying professional certifications and licenses
- **Identity Documents**: Confirming government-issued IDs (driver's license, passport)
- **Certifications**: Validating professional or educational certifications
- **Specific Roles**: Certain roles requiring verified identity (interpreters, healthcare providers, etc.)

### Use Case Example

**Vocational Rehabilitation Scenario**: When a vocational rehabilitation agency needs verified documentation:
1. User authenticates with DeafAUTH (standard login)
2. System detects need for verified documents
3. FibonroseTrust initiates Persona verification workflow
4. User submits required documents through Persona
5. Verified documents are securely shared with vocational rehabilitation agency

**What Persona is NOT used for:**
- General login/authentication (use DeafAUTH)
- Normal app activities (developing, browsing, etc.)
- GitHub/Google authentication (handled separately)
- Regular user registration

## Architecture

```
DeafAUTH (Primary Authentication)
    ↓
FibonroseTrust Platform
    ↓
Persona (Only when identity verification needed)
    ↓
Verified Documents/Licenses
```

## Features

- **Identity Verification**: Verify user identities through government-issued IDs
- **Document Verification**: Scan and verify passports, driver's licenses, and other documents
- **Biometric Verification**: Selfie verification and liveness detection
- **License/Certification Verification**: Validate professional credentials
- **Webhook Integration**: Real-time status updates via webhooks
- **Custom Domain**: Branded experience at fibonrose.withpersona.com

## Prerequisites

### DeafAUTH Authentication

Users authenticate with DeafAUTH for general platform access. Persona is only invoked when specific verification is needed:

```typescript
// Step 1: User logs in with DeafAUTH (standard authentication)
const deafAuthResponse = await fetch('/api/deaf-auth/sessions?userId=123');
const { sessionId, token, expiresAt } = await deafAuthResponse.json();

// Step 2: When verification is needed, use token to initiate Persona
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

## Setup

### 1. Get Persona Credentials

1. Sign up for a Persona account at [withpersona.com](https://withpersona.com)
2. Navigate to the API Keys section in your dashboard
3. Create a new API key for your environment (sandbox or production)
4. Note your Template ID for the verification flow
5. (Optional) Configure custom domain: fibonrose.withpersona.com

### 2. Configure Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Persona Configuration
PERSONA_API_KEY=your_api_key_here
PERSONA_ENVIRONMENT=sandbox  # or 'production'
PERSONA_TEMPLATE_ID=your_template_id_here
PERSONA_WEBHOOK_SECRET=your_webhook_secret_here
PERSONA_CUSTOM_DOMAIN=fibonrose.withpersona.com  # Optional

# DeafAUTH Configuration
DEAFAUTH_API_URL=https://deafauth.pinksync.io/v1
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

## Conceptual Example: Vocational Rehabilitation

This example demonstrates how Persona verification works in a real-world scenario:

### Scenario
A deaf user needs to submit verified documentation to a vocational rehabilitation agency for employment services.

### Workflow

```typescript
// Step 1: User logs into FibonroseTrust with DeafAUTH (normal login)
const loginResponse = await fetch('/api/deaf-auth/sessions', {
  method: 'POST',
  body: JSON.stringify({ username, password })
});
const { token } = await loginResponse.json();

// Step 2: User requests to share verified documents with vocational rehab
// System detects that identity verification is needed
const needsVerification = await checkVerificationStatus(userId);

if (!needsVerification.hasVerifiedId || !needsVerification.hasVerifiedLicense) {
  // Step 3: Initiate Persona verification workflow
  const personaInquiry = await fetch('/api/v1/persona/inquiries', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId,
      verificationType: 'vocational_rehab',
      documentsNeeded: ['drivers_license', 'professional_certificate'],
      redirectUri: 'https://fibonrose.withpersona.com/verification-complete'
    })
  });
  
  // Step 4: User completes Persona verification (uploads ID, documents)
  // Persona webhook notifies FibonroseTrust of completion
}

// Step 5: Once verified, documents can be securely shared
const shareResponse = await fetch('/api/vocational-rehab/share-documents', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    agencyId: vocationalRehabAgencyId,
    documentTypes: ['identity', 'certifications']
  })
});

// Vocational rehab receives verified documents quickly and securely
```

### Key Points
- User only goes through Persona when **specific verification is required**
- General platform usage (login, browsing, developing) uses **DeafAUTH only**
- Persona adds verified credential layer for sensitive scenarios
- Documents remain secure within FibonroseTrust until explicitly shared

## API Endpoints

### Create Inquiry

Create a new identity verification inquiry for a user.

**Endpoint:** `POST /api/v1/persona/inquiries`

**Authentication**: Requires DeafAUTH token

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

### Authentication with DeafAUTH

Before initiating identity verification with Persona, users must first authenticate with DeafAUTH:

```typescript
// Step 1: Authenticate with DeafAUTH
const deafAuthResponse = await fetch('/api/deaf-auth/sessions', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

const { sessionId, token } = await deafAuthResponse.json();

// Step 2: Create Persona inquiry with authenticated user
const personaResponse = await fetch('/api/v1/persona/inquiries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    userId: authenticatedUserId,
    redirectUri: 'https://fibonrose.withpersona.com/verification-complete'
  })
});
```

### Embed Persona Flow

FibonroseTrust supports multiple ways to integrate Persona verification:

#### Option 1: Embedded Client (Recommended)

Use Persona's embedded client for a seamless in-app experience:

```typescript
// React example with Persona embedded client
import React, { useEffect, useState } from 'react';
import { Client } from 'persona';

function EmbeddedVerificationFlow({ inquiryId, onComplete }) {
  const [client, setClient] = useState(null);

  useEffect(() => {
    // Initialize Persona embedded client
    const personaClient = new Client({
      inquiryId: inquiryId,
      environment: 'production', // or 'sandbox'
      onReady: () => console.log('Persona is ready'),
      onComplete: ({ inquiryId, status, fields }) => {
        console.log(`Completed inquiry ${inquiryId} with status ${status}`);
        onComplete(inquiryId, status);
      },
      onCancel: ({ inquiryId, sessionToken }) => {
        console.log(`Cancelled inquiry ${inquiryId}`);
      },
      onError: (error) => {
        console.error('Persona error:', error);
      }
    });

    personaClient.open();
    setClient(personaClient);

    return () => {
      if (personaClient) {
        personaClient.destroy();
      }
    };
  }, [inquiryId, onComplete]);

  return <div id="persona-container">Loading verification...</div>;
}
```

#### Option 2: Redirect Flow

Redirect users to Persona's hosted verification page:

```typescript
// React example with redirect
import React, { useEffect } from 'react';

function RedirectVerificationFlow({ sessionUrl }) {
  useEffect(() => {
    // Redirect to Persona hosted page
    window.location.href = sessionUrl;
  }, [sessionUrl]);

  return <div>Redirecting to verification...</div>;
}
```

#### Option 3: Custom Domain (fibonrose.withpersona.com)

Configure a custom domain for a branded experience:

1. **Setup in Persona Dashboard**:
   - Go to Settings → Custom Domain
   - Add domain: `fibonrose.withpersona.com`
   - Follow DNS configuration instructions

2. **Update redirect URIs**:
```typescript
const personaResponse = await fetch('/api/v1/persona/inquiries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${deafAuthToken}`
  },
  body: JSON.stringify({
    userId: authenticatedUserId,
    redirectUri: 'https://fibonrose.withpersona.com/verification-complete'
  })
});
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
