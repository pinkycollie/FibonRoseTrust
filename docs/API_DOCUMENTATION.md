# Professional Directory API Documentation

## Overview

The Professional Directory API enables deaf communities and organizations to access verified professional profiles through a RESTful interface. This API provides search, filtering, and profile management capabilities for professionals serving the deaf community.

**Base URL:** `/api/v1/professionals`  
**Authentication:** Auth0 (for profile management)  
**Public Access:** Directory search is publicly accessible

## Authentication

For endpoints requiring authentication, include the Auth0 access token in the Authorization header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Professional Roles

### Get All Professional Roles

Returns all available professional role categories.

**Endpoint:** `GET /roles`  
**Auth Required:** No

**Response:**
```json
[
  {
    "id": 1,
    "name": "insurance_agent",
    "displayName": "Insurance Agent",
    "category": "financial",
    "description": "Licensed insurance professional serving the deaf community",
    "requiredVerifications": [1, 2],
    "icon": "shield",
    "isActive": true
  },
  {
    "id": 2,
    "name": "interpreter",
    "displayName": "Sign Language Interpreter",
    "category": "communication",
    "description": "Certified ASL interpreter",
    "requiredVerifications": [1],
    "icon": "users",
    "isActive": true
  }
]
```

### Get Professional Role by ID

**Endpoint:** `GET /roles/:id`  
**Auth Required:** No

**Example Request:**
```bash
curl https://api.fibonrosetrust.com/api/v1/professionals/roles/1
```

**Example Response:**
```json
{
  "id": 1,
  "name": "insurance_agent",
  "displayName": "Insurance Agent",
  "category": "financial",
  "description": "Licensed insurance professional serving the deaf community",
  "requiredVerifications": [1, 2],
  "icon": "shield",
  "isActive": true
}
```

## Professional Directory (Public)

### Search Professional Directory

Search for verified professionals in the public directory. This endpoint is designed for deaf community members and organizations to find service providers.

**Endpoint:** `GET /directory`  
**Auth Required:** No

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| category | string | Filter by professional category (healthcare, legal, financial, etc.) | - |
| roleId | number | Filter by specific role ID | - |
| location | string | Filter by location (partial match) | - |
| aslFluent | boolean | Show only ASL fluent professionals | false |
| isVerified | boolean | Show only verified professionals | true |
| deafCommunityExperience | boolean | Show only those with deaf community experience | false |
| page | number | Page number for pagination | 1 |
| limit | number | Results per page (max 100) | 20 |

**Example Request:**
```bash
# Find ASL fluent healthcare providers in California
curl "https://api.fibonrosetrust.com/api/v1/professionals/directory?category=healthcare&location=California&aslFluent=true&page=1&limit=10"
```

**Example Response:**
```json
{
  "profiles": [
    {
      "id": 1,
      "userId": 5,
      "userName": "Dr. Sarah Johnson",
      "userAvatar": "https://example.com/avatars/sarah.jpg",
      "roleId": 5,
      "role": {
        "id": 5,
        "name": "healthcare_provider",
        "displayName": "Healthcare Provider",
        "category": "healthcare",
        "icon": "heart"
      },
      "isVerified": true,
      "verificationStatus": "VERIFIED",
      "bio": "Board-certified physician with 10+ years serving the deaf community",
      "yearsOfExperience": 12,
      "location": "San Francisco, California",
      "languages": ["English", "ASL"],
      "aslFluent": true,
      "deafCommunityExperience": true,
      "certifications": [
        {
          "name": "Board Certified Internal Medicine",
          "issuer": "ABIM",
          "year": 2013
        }
      ],
      "availability": "Monday-Friday, 9 AM - 5 PM",
      "contactPreferences": {
        "methods": ["email", "video_call"],
        "preferredTime": "business_hours"
      },
      "isPubliclyVisible": true,
      "badges": [
        {
          "id": 1,
          "badgeId": 1,
          "earnedAt": "2025-01-15T10:00:00Z",
          "badge": {
            "id": 1,
            "name": "identity_verified",
            "displayName": "Identity Verified",
            "icon": "✓",
            "color": "#10B981"
          }
        },
        {
          "id": 2,
          "badgeId": 2,
          "earnedAt": "2025-01-15T11:00:00Z",
          "badge": {
            "id": 2,
            "name": "asl_fluent",
            "displayName": "ASL Fluent",
            "icon": "🤟",
            "color": "#8B5CF6"
          }
        }
      ],
      "verifiedAt": "2025-01-15T12:00:00Z",
      "createdAt": "2025-01-10T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

## Professional Profiles

### Get User's Profiles

Get all professional profiles for a specific user.

**Endpoint:** `GET /profiles/user/:userId`  
**Auth Required:** Yes

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.fibonrosetrust.com/api/v1/professionals/profiles/user/5
```

**Example Response:**
```json
[
  {
    "id": 1,
    "userId": 5,
    "roleId": 5,
    "role": {
      "id": 5,
      "name": "healthcare_provider",
      "displayName": "Healthcare Provider"
    },
    "isVerified": true,
    "verificationStatus": "VERIFIED",
    "bio": "Board-certified physician with 10+ years serving the deaf community",
    "yearsOfExperience": 12,
    "location": "San Francisco, California",
    "languages": ["English", "ASL"],
    "aslFluent": true,
    "deafCommunityExperience": true,
    "badges": [
      {
        "id": 1,
        "badgeId": 1,
        "badge": {
          "displayName": "Identity Verified"
        }
      }
    ],
    "isPubliclyVisible": true,
    "verifiedAt": "2025-01-15T12:00:00Z"
  }
]
```

### Get Profile by ID

Get detailed information about a specific professional profile.

**Endpoint:** `GET /profiles/:id`  
**Auth Required:** No (for public profiles), Yes (for non-public profiles)

**Example Request:**
```bash
curl https://api.fibonrosetrust.com/api/v1/professionals/profiles/1
```

**Example Response:**
```json
{
  "id": 1,
  "userId": 5,
  "roleId": 5,
  "role": {
    "id": 5,
    "name": "healthcare_provider",
    "displayName": "Healthcare Provider",
    "category": "healthcare"
  },
  "user": {
    "name": "Dr. Sarah Johnson",
    "email": "sarah@example.com",
    "avatarUrl": "https://example.com/avatars/sarah.jpg"
  },
  "isVerified": true,
  "verificationStatus": "VERIFIED",
  "bio": "Board-certified physician with 10+ years serving the deaf community",
  "yearsOfExperience": 12,
  "location": "San Francisco, California",
  "languages": ["English", "ASL"],
  "aslFluent": true,
  "deafCommunityExperience": true,
  "certifications": [
    {
      "name": "Board Certified Internal Medicine",
      "issuer": "ABIM",
      "year": 2013
    }
  ],
  "availability": "Monday-Friday, 9 AM - 5 PM",
  "badges": [
    {
      "id": 1,
      "badgeId": 1,
      "badge": {
        "displayName": "Identity Verified",
        "icon": "✓",
        "color": "#10B981"
      },
      "earnedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "verificationSteps": [
    {
      "id": 1,
      "stepName": "Government ID Verification",
      "stepOrder": 1,
      "status": "COMPLETED",
      "completedAt": "2025-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "stepName": "Medical License Verification",
      "stepOrder": 2,
      "status": "COMPLETED",
      "completedAt": "2025-01-15T11:00:00Z"
    }
  ],
  "verifiedAt": "2025-01-15T12:00:00Z",
  "createdAt": "2025-01-10T08:00:00Z"
}
```

### Create Professional Profile

Create a new professional profile.

**Endpoint:** `POST /profiles`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "userId": 5,
  "roleId": 5,
  "bio": "Board-certified physician with 10+ years serving the deaf community",
  "yearsOfExperience": 12,
  "location": "San Francisco, California",
  "languages": ["English", "ASL"],
  "aslFluent": true,
  "deafCommunityExperience": true,
  "certifications": [
    {
      "name": "Board Certified Internal Medicine",
      "issuer": "ABIM",
      "year": 2013
    }
  ],
  "availability": "Monday-Friday, 9 AM - 5 PM",
  "contactPreferences": {
    "methods": ["email", "video_call"],
    "preferredTime": "business_hours"
  }
}
```

**Example Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 5,
    "roleId": 5,
    "bio": "Board-certified physician",
    "yearsOfExperience": 12,
    "location": "San Francisco, California",
    "aslFluent": true
  }' \
  https://api.fibonrosetrust.com/api/v1/professionals/profiles
```

**Example Response:**
```json
{
  "id": 1,
  "userId": 5,
  "roleId": 5,
  "isVerified": false,
  "verificationStatus": "PENDING",
  "bio": "Board-certified physician",
  "yearsOfExperience": 12,
  "location": "San Francisco, California",
  "aslFluent": true,
  "isPubliclyVisible": false,
  "createdAt": "2025-01-10T08:00:00Z",
  "updatedAt": "2025-01-10T08:00:00Z"
}
```

### Update Professional Profile

Update an existing professional profile.

**Endpoint:** `PATCH /profiles/:id`  
**Auth Required:** Yes

**Request Body:** (partial update)
```json
{
  "bio": "Updated bio with more experience",
  "yearsOfExperience": 13,
  "availability": "Monday-Friday, 8 AM - 6 PM"
}
```

**Example Request:**
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"yearsOfExperience": 13}' \
  https://api.fibonrosetrust.com/api/v1/professionals/profiles/1
```

## Badges

### Get All Badges

Get list of all available badges.

**Endpoint:** `GET /badges`  
**Auth Required:** No

**Example Response:**
```json
[
  {
    "id": 1,
    "name": "identity_verified",
    "displayName": "Identity Verified",
    "description": "Government ID verified",
    "icon": "✓",
    "category": "verification",
    "criteria": {
      "requiredVerifications": ["government_id"]
    },
    "color": "#10B981"
  },
  {
    "id": 2,
    "name": "asl_fluent",
    "displayName": "ASL Fluent",
    "description": "Fluent in American Sign Language",
    "icon": "🤟",
    "category": "professional",
    "criteria": {
      "aslFluent": true
    },
    "color": "#8B5CF6"
  }
]
```

### Get User's Badges

Get all badges earned by a specific user.

**Endpoint:** `GET /badges/user/:userId`  
**Auth Required:** No (for public profiles)

**Example Response:**
```json
[
  {
    "id": 1,
    "userId": 5,
    "badgeId": 1,
    "earnedAt": "2025-01-15T10:00:00Z",
    "verifiedBy": "System",
    "badge": {
      "id": 1,
      "name": "identity_verified",
      "displayName": "Identity Verified",
      "icon": "✓",
      "color": "#10B981"
    }
  }
]
```

## Verification Steps

### Get Profile Verification Steps

Get all verification steps for a professional profile.

**Endpoint:** `GET /profiles/:profileId/steps`  
**Auth Required:** Yes

**Example Response:**
```json
[
  {
    "id": 1,
    "userId": 5,
    "profileId": 1,
    "stepName": "Government ID Verification",
    "stepOrder": 1,
    "status": "COMPLETED",
    "completedAt": "2025-01-15T10:30:00Z",
    "data": {
      "idType": "drivers_license",
      "state": "CA"
    },
    "notes": "Verified through third-party service"
  },
  {
    "id": 2,
    "userId": 5,
    "profileId": 1,
    "stepName": "Medical License Verification",
    "stepOrder": 2,
    "status": "IN_PROGRESS",
    "completedAt": null,
    "data": {},
    "notes": null
  }
]
```

### Update Verification Step

Update the status of a verification step.

**Endpoint:** `PATCH /steps/:id`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "status": "COMPLETED",
  "completedAt": "2025-01-15T11:00:00Z",
  "notes": "Successfully verified medical license"
}
```

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message description",
  "details": "Additional error details if available"
}
```

**Common Status Codes:**
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Rate Limiting

Public endpoints are rate-limited to prevent abuse:
- **Directory Search:** 100 requests per minute per IP
- **Profile Viewing:** 200 requests per minute per IP

Authenticated endpoints have higher limits based on user role.

## Webhooks

To receive real-time updates about profile verifications and badge awards, configure webhooks in your account settings.

**Available Events:**
- `profile.created`
- `profile.verified`
- `badge.earned`
- `step.completed`

## Example Integration: Finding a Verified Interpreter

```javascript
// 1. Search for ASL interpreters in New York
const response = await fetch(
  'https://api.fibonrosetrust.com/api/v1/professionals/directory?' +
  'category=communication&' +
  'roleId=2&' +
  'location=New York&' +
  'isVerified=true&' +
  'page=1&limit=10'
);

const { profiles, pagination } = await response.json();

// 2. Display results
profiles.forEach(profile => {
  console.log(`${profile.userName} - ${profile.role.displayName}`);
  console.log(`Location: ${profile.location}`);
  console.log(`ASL Fluent: ${profile.aslFluent ? 'Yes' : 'No'}`);
  console.log(`Badges: ${profile.badges.length}`);
  console.log('---');
});

// 3. Get detailed profile
const detailResponse = await fetch(
  `https://api.fibonrosetrust.com/api/v1/professionals/profiles/${profiles[0].id}`
);

const detailedProfile = await detailResponse.json();
console.log('Full profile:', detailedProfile);
```

## Support

For API support or to report issues:
- Email: fibonrose@mbtq.dev
- Documentation: https://docs.fibonrose.mbtq.dev
- GitHub Issues: https://github.com/fibonrosetrust/api-docs
