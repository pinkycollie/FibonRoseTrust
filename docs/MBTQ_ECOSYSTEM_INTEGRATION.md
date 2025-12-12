# MBTQ Ecosystem Integration

## Overview

FibonRoseTrust is an integral part of the **MBTQ Universe** ecosystem, working in harmony with other specialized platforms to provide comprehensive services for the deaf and hard-of-hearing community.

## Ecosystem Components

### 1. **FibonRoseTrust** (This Platform)
- **Purpose**: AI-Powered Universal Professional Verification & Trust System
- **Core Features**:
  - Professional verification and trust scoring
  - NFT-based digital identity
  - Fibonacci-based progressive verification (Levels 1-21+)
  - Blockchain integration for decentralized trust
- **Domain**: `fibonrose.mbtquniverse.com`

### 2. **DeafAuth**
- **Purpose**: Authentication and user management for deaf community
- **Integration Points**:
  - Visual-first authentication flows
  - No phone verification alternatives
  - Sign language identity verification
  - Emergency contact systems with first responder integration
- **Domain**: `deafauth.pinksync.io`
- **Implementation**: See `server/services/deaf-first-integration.ts`

### 3. **PinkSync**
- **Purpose**: Accessibility and interface transformation platform
- **Integration Points**:
  - Visual feedback systems (icons, colors, vibrations)
  - High contrast and large text modes
  - Reduced motion support
  - Multi-platform optimization (Web, iOS, Android, Desktop)
- **Domain**: `api.pinksync.io`
- **Implementation**: See `server/services/pinksync-integration.ts`

### 4. **FibonRos**
- **Purpose**: Core trust and verification engine
- **Integration Points**:
  - Trust badge management
  - Verification workflows
  - Progressive trust levels
  - Community vouching system

## API Endpoints

### Cross-Platform Authentication
```bash
# DeafAuth Session Management
GET  /api/deaf-auth/sessions
POST /api/deaf-auth/login
POST /api/deaf-auth/register

# User Accessibility Preferences (PinkSync)
GET   /api/users/{userId}/accessibility-preferences
PATCH /api/users/{userId}/accessibility-preferences
```

### Trust & Verification (FibonRos)
```bash
# Trust Scores
GET  /api/trust-scores/{userId}
POST /api/trust-scores
PATCH /api/trust-scores/{id}

# Verifications
GET  /api/verifications
POST /api/verifications
```

### Accessibility Features (PinkSync)
```bash
# Device Interface Configuration
GET /api/pinksync/interface/{platform}

# Notifications with Visual Feedback
POST /api/pinksync/notifications

# User Preference Updates
PATCH /api/pinksync/users/{userId}/preferences
```

### DeafFirst MCP Modules
```bash
# Sign Language Recognition
POST /api/sign-language/recognize
GET  /api/sign-language/gestures/{language}

# Live Captioning
POST /api/captions/process
GET  /api/captions/export/{sessionId}

# Interpreter Services
GET  /api/interpreters/search
POST /api/interpreters/request-session

# Accessibility Tools
POST /api/accessibility/color-contrast
POST /api/accessibility/audit

# Communication Systems
POST /api/communication/create-session

# Community Resources
GET /api/community/resources
GET /api/community/support-groups
```

## Data Flow

### User Registration Flow
1. **DeafAuth** handles authentication (visual-first, no phone verification)
2. **PinkSync** configures accessibility preferences
3. **FibonRoseTrust** creates initial trust profile
4. **FibonRos** initiates Level 1 verification

### Trust Score Update Flow
1. User completes verification action
2. **FibonRoseTrust** calculates new Fibonacci-based trust score
3. **FibonRos** validates and stores verification
4. **PinkSync** sends visual notification to user
5. **DeafAuth** updates user permissions if needed

### Cross-Platform Notification Flow
1. Event occurs in **FibonRoseTrust**
2. **PinkSync** receives notification request
3. Visual feedback generated (icon + color + vibration)
4. Multi-platform delivery (Web push, iOS, Android)
5. **DeafAuth** logs notification delivery

## Security & Privacy

### NegraRosa Security Framework
- OAuth2/OIDC integration via Auth0
- JWT token validation
- Role-based access control (RBAC)
- Implementation: `server/services/integrations/negrarosa-auth0.ts`

### Data Permissions
- Granular permission management
- User-controlled data sharing
- GDPR compliant
- Implementation: See `storage.ts` data permission methods

## Deployment Architecture

```yaml
Production_Infrastructure:
  Frontend: "Vite + React (Client-side rendering)"
  Backend: "Node.js/Express (REST API)"
  Database: "Neon PostgreSQL (Serverless)"
  Authentication: "Auth0 + DeafAuth Integration"
  Real_time: "WebSocket support for live updates"
  Blockchain: "Ethereum for NFT identity verification"
  
Ecosystem_Connectivity:
  DeafAuth: "OAuth2/OIDC + REST API"
  PinkSync: "REST API + WebSocket"
  FibonRos: "Direct integration (same codebase)"
  NegraRosa: "Auth0 security layer"
```

## Environment Variables

Essential environment variables for ecosystem integration:

```bash
# Database
DATABASE_URL=postgresql://...

# Auth0 (NegraRosa Security)
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_CALLBACK_URL=http://localhost:5000/callback

# PinkSync Integration
PINKSYNC_API_KEY=your_pinksync_api_key
PINKSYNC_API_URL=https://api.pinksync.io/v2

# DeafAuth Integration
DEAFAUTH_API_URL=https://deafauth.pinksync.io/v1
DEAFAUTH_API_KEY=your_deafauth_api_key

# Blockchain (for NFT Identity)
ETHEREUM_RPC_URL=your_ethereum_rpc
WALLET_PRIVATE_KEY=your_wallet_key

# Google Cloud (Optional)
GCP_PROJECT_ID=fibonrose-project
GCP_CREDENTIALS=path/to/credentials.json
```

## Development Setup

### Running with Full Ecosystem Integration

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev

# Run tests (including ecosystem integration tests)
npm test
```

### Testing Ecosystem Integration

The test suite includes integration tests for all ecosystem components:

```bash
# Run all tests
npm run test:run

# Run with coverage
npm run test:coverage

# Test specific integration
npm test -- server/services/pinksync-integration
npm test -- server/services/deaf-first-integration
```

## API Documentation

For detailed API documentation, see:
- [REST API Overview](./REST_API_OVERVIEW.md)
- [Universal Webhook Hub](./UNIVERSAL_WEBHOOK_HUB.md)
- [DeafFirst Integration](./DEAFFIRST_INTEGRATION_SUMMARY.md)
- [NFT Identity Journey](./NFT_ID_JOURNEY.md)

## Support & Resources

- **MBTQ Universe**: Main ecosystem hub
- **PinkSync Documentation**: https://pinksync.io/docs
- **DeafAuth Documentation**: https://deafauth.pinksync.io/docs
- **Community Support**: Available through ecosystem community resources API

## Version Compatibility

| Component      | Current Version | Compatible With        |
|---------------|-----------------|------------------------|
| FibonRoseTrust| 1.0.0           | -                      |
| DeafAuth      | v1              | FibonRoseTrust 1.x     |
| PinkSync      | v2              | FibonRoseTrust 1.x     |
| FibonRos      | Integrated      | Same version           |
| NegraRosa     | Auth0 Latest    | OAuth2/OIDC Standard   |

## Contributing

When contributing to FibonRoseTrust, consider ecosystem impact:
1. Maintain API compatibility with DeafAuth and PinkSync
2. Follow visual-first design principles
3. Test integration points thoroughly
4. Update ecosystem documentation
5. Coordinate breaking changes across platforms

## License

MIT License - See LICENSE file for details

---

**Last Updated**: 2025-12-12  
**Maintained By**: MBTQ Universe Team
