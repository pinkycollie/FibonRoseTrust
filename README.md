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
- DEAF FIRST verification types and trust level calculations

For detailed testing documentation, see [docs/TESTING.md](docs/TESTING.md).

## Documentation

- [FibonroseTrust Bridge Integration Guide](docs/FIBONROSE_BRIDGE_INTEGRATION_GUIDE.md) - Complete guide for DEAF FIRST verification standards, interpreter verification, and deaf experience verification
- [DeafFirst Integration Summary](docs/DEAFFIRST_INTEGRATION_SUMMARY.md) - PinkSync and DeafFirst MCP module integration
- [NFT ID Journey](docs/NFT_ID_JOURNEY.md) - Technical overview of the NFT identity verification flow
- [REST API Overview](docs/REST_API_OVERVIEW.md) - API documentation and endpoints
- [Universal Webhook Hub](docs/UNIVERSAL_WEBHOOK_HUB.md) - Webhook system documentation

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:
- Automated testing on every push and pull request
- Multi-version Node.js compatibility testing (18.x, 20.x)
- Code coverage reporting
- Type checking
- Build verification

The CI/CD workflow is defined in `.github/workflows/ci.yml`.

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

## License

MIT
