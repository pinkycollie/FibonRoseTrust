# Fibonrose Trust

## AI-Powered Universal Professional Verification & Trust System

## Overview

The Fibonrose Trust is an AI-driven comprehensive verification and trust system designed to authenticate and match:

1. **Universal Professional Network**: Any professional, agent, interpreter, service provider, or role-based individual serving the deaf community
2. **Deaf Individuals**: Work experience, volunteering, community contributions, and professional capabilities across all domains
3. **Intelligent Matching**: AI-powered taxonomy system that categorizes, verifies, and matches professionals across unlimited service categories

This AI-enhanced verification system addresses critical gaps in professional verification while creating an intelligent ecosystem that learns and adapts to serve the deaf community's evolving needs.

## AI-Powered Architecture

### Backend Infrastructure
```yaml
Technology_Stack:
  Database: "Supabase (PostgreSQL + Real-time)"
  AI_Engine: "Custom ML Models + OpenAI Integration"
  Backend: "Node.js/TypeScript + Supabase Edge Functions"
  Authentication: "Supabase Auth + DeafAUTH Integration"
  Real_Time: "Supabase Realtime Subscriptions"
  AI_Services: "Vector Embeddings + Semantic Search"
  
AI_Components:
  Professional_Classification: "Multi-label classification model"
  Trust_Scoring: "Ensemble ML algorithms"
  Matching_Engine: "Vector similarity + collaborative filtering"
  Fraud_Detection: "Anomaly detection + pattern recognition"
  Quality_Prediction: "Performance forecasting models"
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
    insurance: ['insurance_agents', 'claims_adjust

## Development

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
- Fibonacci trust scoring utilities
- Storage operations (users, verifications, trust scores)
- Data permission management
- Utility functions
- API endpoints
- Persona integration

For detailed testing documentation, see [docs/TESTING.md](docs/TESTING.md).

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:
- Automated testing on every push and pull request
- Multi-version Node.js compatibility testing (18.x, 20.x)
- Code coverage reporting
- Type checking
- Build verification
- Separate workflows for dev, staging, and production environments

**Workflows:**
- `.github/workflows/ci.yml` - Main CI workflow for main and develop branches
- `.github/workflows/dev-deploy.yml` - Dev environment deployment

**Deployment Targets:**
- Backend: Google Cloud Run (Express/TypeScript)
- Frontend: Vercel (React/Vite)
- Database: Neon PostgreSQL

For detailed deployment documentation, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### Identity Verification with Persona

FibonroseTrust integrates with [Persona](https://withpersona.com) for **specific identity verification scenarios**:

**When Persona is Used:**
- Verifying professional licenses and certifications
- Validating identity documents (passports, driver's licenses)
- Specific roles requiring verified credentials (interpreters, healthcare providers)
- Scenarios like vocational rehabilitation requiring verified documentation

**What Persona is NOT used for:**
- General authentication (use DeafAUTH)
- Normal app activities (developing, browsing)
- GitHub/Google authentication

**Architecture**: Users authenticate with DeafAUTH for general access. Persona is only invoked when specific identity verification is required.

**Features:**
- Document verification (passports, driver's licenses, etc.)
- Biometric verification (selfies, liveness detection)
- License/certification validation
- Custom domain support (fibonrose.withpersona.com)

For detailed Persona integration documentation, see [docs/PERSONA_INTEGRATION.md](docs/PERSONA_INTEGRATION.md).

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

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fibonrose

# Persona Integration
PERSONA_API_KEY=your_api_key
PERSONA_ENVIRONMENT=sandbox
PERSONA_TEMPLATE_ID=your_template_id
PERSONA_WEBHOOK_SECRET=your_webhook_secret
```

## Documentation

- [Testing Guide](docs/TESTING.md) - Comprehensive testing documentation
- [Deployment Guide](docs/DEPLOYMENT.md) - Deployment to Cloud Run and Vercel
- [Persona Integration](docs/PERSONA_INTEGRATION.md) - Identity verification setup

## License

MIT
