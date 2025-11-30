# Fibonrose Trust

## AI-Powered Universal Professional Verification & Trust System

## Overview

The Fibonrose Trust is an AI-driven comprehensive verification and trust system designed to authenticate and match:

1. **Universal Professional Network**: Any professional, agent, interpreter, service provider, or role-based individual serving the deaf community
2. **Deaf Individuals**: Work experience, volunteering, community contributions, and professional capabilities across all domains
3. **Intelligent Matching**: AI-powered taxonomy system that categorizes, verifies, and matches professionals across unlimited service categories

This AI-enhanced verification system addresses critical gaps in professional verification while creating an intelligent ecosystem that learns and adapts to serve the deaf community's evolving needs.

## Unified Repository

This repository consolidates multiple Fibonrose projects into a single, maintainable codebase:

- **Frontend**: React-based UI with accessibility-first design
- **Backend**: Express.js REST API with TypeScript
- **Engine**: Trust scoring and verification algorithms
- **DeafFirst Integration**: Accessibility modules for the deaf community
- **PinkSync Integration**: Visual feedback and notification system

## Self-Managed Infrastructure

### Technology Stack

```yaml
Technology_Stack:
  Hosting: "Self-managed VPS with Nginx"
  CI/CD: "GitHub Actions"
  Database: "PostgreSQL (self-managed)"
  AI_Engine: "Local AI (self-hosted)"
  Backend: "Node.js/TypeScript + Express"
  Authentication: "Auth0 + DeafAUTH Integration"
  
AI_Components:
  Professional_Classification: "Local AI classification models"
  Trust_Scoring: "Fibonacci-based ensemble algorithms"
  Matching_Engine: "Semantic similarity matching"
  Accessibility_AI: "Sign language recognition & captioning"
```

### Infrastructure Benefits

- **Cost Reduction**: 60-80% reduction compared to cloud services
- **Data Privacy**: Full control over data storage and processing
- **Performance**: Reduced latency with local AI inference
- **Independence**: No vendor lock-in

For migration details, see [docs/MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md).

## Project Structure

```
FibonRoseTrust/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # UI components
│       ├── pages/          # Page components
│       └── hooks/          # Custom React hooks
├── server/                 # Express backend
│   ├── controllers/        # API controllers
│   ├── services/           # Business logic
│   │   ├── deaf-first-integration.ts
│   │   ├── pinksync-integration.ts
│   │   └── universal-webhook.ts
│   ├── routes.ts           # API routes
│   └── storage.ts          # Data storage
├── shared/                 # Shared types and schemas
├── test/                   # Test suites
│   ├── utils/              # Utility tests
│   ├── server/             # Server tests
│   └── components/         # Component tests
├── docs/                   # Documentation
└── .github/workflows/      # CI/CD pipelines
```

## Universal Professional Taxonomy System

### AI-Driven Category Classification
```typescript
interface ProfessionalTaxonomy {
  primary_category: string;
  sub_categories: string[];
  specializations: string[];
  skill_vectors: number[];
  competency_embeddings: number[];
  deaf_community_relevance_score: number;
}

// AI automatically classifies professionals into dynamic categories
const professionalCategories = {
  healthcare: {
    primary_providers: ['physicians', 'nurses', 'therapists', 'specialists'],
    support_services: ['medical_assistants', 'healthcare_coordinators', 'patient_advocates'],
    mental_health: ['counselors', 'psychologists', 'social_workers', 'peer_counselors'],
    emergency_services: ['emt_professionals', 'hospital_staff', 'urgent_care_providers']
  },
  
  legal_justice: {
    attorneys: ['family_law', 'criminal_defense', 'civil_rights', 'disability_law'],
    court_services: ['court_reporters', 'mediators', 'legal_assistants', 'paralegals'],
    advocacy: ['disability_advocates', 'legal_aid_workers', 'rights_organizers'],
    law_enforcement: ['police_officers', 'detectives', 'court_security', 'corrections']
  },
  
  financial_services: {
    advisors: ['financial_planners', 'investment_advisors', 'tax_professionals', 'accountants'],
    banking: ['loan_officers', 'bank_tellers', 'credit_counselors', 'mortgage_specialists'],
    insurance: ['insurance_agents', 'claims_adjusters']
  }
};
```

## Development

### Getting Started

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Testing

This project includes automated tests to ensure code quality and reliability. The test suite uses Vitest, a fast and modern testing framework.

#### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage
```

#### Test Coverage

The test suite covers:
- Fibonacci trust scoring utilities (29 tests)
- Storage operations (users, verifications, trust scores) (11 tests)
- DeafFirst integration module (25 tests)
- Utility functions (5 tests)

For detailed testing documentation, see [docs/TESTING.md](docs/TESTING.md).

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Automated testing on every push and pull request
   - Multi-version Node.js compatibility testing (18.x, 20.x)
   - Code coverage reporting
   - Type checking
   - Build verification

2. **Deployment Pipeline** (`.github/workflows/deploy.yml`)
   - Staging and production deployments
   - Manual deployment triggers
   - Rollback capability
   - Health checks

3. **Local AI Pipeline** (`.github/workflows/local-ai.yml`)
   - Daily AI model validation
   - Performance benchmarking
   - Model update management

## API Endpoints

### Core APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/:id` | GET | Get user by ID |
| `/api/verification-types` | GET | List verification types |
| `/api/user/:userId/verifications` | GET | Get user verifications |
| `/api/user/:userId/trust-score` | GET | Get user trust score |

### DeafFirst APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/:userId/accessibility-preferences` | GET/PATCH | Manage accessibility settings |
| `/api/sign-language/recognize` | POST | Sign language recognition |
| `/api/captions/process` | POST | Live caption processing |
| `/api/interpreters/search` | GET | Find interpreters |
| `/api/community/resources` | GET | Search community resources |

For complete API documentation, see [docs/REST_API_OVERVIEW.md](docs/REST_API_OVERVIEW.md).

## Documentation

- [Migration Guide](docs/MIGRATION_GUIDE.md) - Infrastructure migration instructions
- [Testing Guide](docs/TESTING.md) - Testing documentation
- [REST API Overview](docs/REST_API_OVERVIEW.md) - API documentation
- [DeafFirst Integration](docs/DEAFFIRST_INTEGRATION_SUMMARY.md) - Accessibility features

## License

MIT
