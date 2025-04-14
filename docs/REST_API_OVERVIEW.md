# FibonroseTrust REST API System

## Overview

The FibonroseTrust REST API system provides a comprehensive set of endpoints for interacting with the FibonroseTrust Decentralized Identity Framework. This API follows RESTful design principles and provides consistent response formats, error handling, and authentication mechanisms.

## Base URL

```
https://api.fibonrosetrust.com/api
```

## API Versioning

The API uses versioning to ensure backward compatibility as new features are added. The current version is v1.

```
https://api.fibonrosetrust.com/api/v1
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "metadata": { ... }
}
```

- `success`: Boolean indicating if the request was successful
- `message`: A human-readable message describing the result
- `data`: The main response data (varies by endpoint)
- `metadata`: Additional information like pagination details

## Error Handling

Errors follow the same response format with `success: false`:

```json
{
  "success": false,
  "message": "Error description",
  "metadata": {
    "errorCode": "ERROR_CODE",
    "details": { ... }
  }
}
```

## Authentication

Most endpoints require authentication using JWT tokens or session cookies. Authenticated requests should include an `Authorization` header:

```
Authorization: Bearer <token>
```

## Trust Level Requirements

Some endpoints require a minimum Fibonacci trust level to access. These requirements are explicitly documented for each endpoint.

## API Categories

The API is organized into several logical categories:

### User Management

Endpoints for managing user profiles, authentication, and account settings.

Base URL: `/api/v1/users`

Key endpoints:
- `GET /users/{id}` - Get user by ID
- `GET /users/username/{username}` - Get user by username
- `POST /users` - Create new user
- `GET /users/me` - Get current user profile

### Trust Scores

Endpoints for managing Fibonacci-based trust scores.

Base URL: `/api/v1/trust-scores`

Key endpoints:
- `GET /trust-scores/user/{userId}` - Get trust score for user
- `POST /trust-scores/user/{userId}/update` - Update user's trust score
- `GET /trust-scores/levels` - Get all trust level definitions

### Verifications

Endpoints for managing identity verification processes.

Base URL: `/api/v1/verifications`

Key endpoints:
- `GET /verifications/types` - Get all verification types
- `GET /verifications/user/{userId}` - Get user's verifications
- `POST /verifications` - Create new verification request

### NFT Identity Cards

Endpoints for managing NFT-based digital identity cards.

Base URL: `/api/v1/nfts`

Key endpoints:
- `GET /nfts/{id}` - Get NFT details
- `POST /nfts/verification` - Create new NFT verification
- `GET /nfts/{id}/verify` - Verify NFT authenticity

### Webhooks

Endpoints for managing webhook subscriptions and deliveries.

Base URL: `/api/v1/webhooks`

Key endpoints:
- `GET /webhooks/subscriptions` - List webhook subscriptions
- `POST /webhooks/subscriptions` - Create webhook subscription
- `GET /webhooks/deliveries` - List webhook delivery history

### Security

Endpoints for NegraRosa security framework integration.

Base URL: `/api/v1/security`

Key endpoints:
- `POST /security/why-verification` - Perform WHY verification
- `POST /security/risk-assessment` - Perform risk assessment

### Integrations

Endpoints for third-party service integrations.

Base URL: `/api/v1/integrations`

Key endpoints:
- `GET /integrations/available` - List available integrations
- `POST /integrations/xano/configure` - Configure Xano integration

## Pagination

List endpoints support pagination with `page` and `limit` query parameters:

```
GET /api/v1/users?page=2&limit=10
```

Pagination metadata is included in the response:

```json
{
  "metadata": {
    "pagination": {
      "page": 2,
      "limit": 10,
      "totalItems": 45,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": true
    }
  }
}
```

## Rate Limiting

API requests are rate-limited based on IP address and API key:

- Anonymous requests: 60 requests per minute
- Authenticated requests: 1000 requests per minute

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1614556800
```

## Cross-Origin Resource Sharing (CORS)

The API supports CORS for cross-domain requests.