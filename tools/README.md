# FibonroseTrust Testing Tools

This directory contains tools for testing the FibonroseTrust platform API and webhook integrations.

## Available Tools

### 1. API Tester (`api-tester.ts`)

This tool automates testing of the FibonroseTrust API endpoints. It performs tests on all API categories and generates a detailed report in both JSON and HTML formats.

Features:
- Tests all major API endpoints
- Provides detailed test reports
- Supports customizable test suites
- Includes error handling and retry logic

### 2. Webhook Generator (`webhook-generator.ts`)

This tool simulates webhook events from various external systems to test the Universal Webhook Hub functionality.

Features:
- Generates realistic webhook payloads for different sources (blockchain, security, Xano, user)
- Interactive mode for manual testing
- Batch testing mode for automated testing
- Saves detailed delivery results

### 3. Test Runner (`run-tests.ts`)

A unified interface to run both the API tests and webhook generator from a single command.

## Running the Tests

### Prerequisites

Make sure you have the required dependencies installed:

```bash
npm install chalk axios
```

### Usage

#### Running All Tests

To use the unified test runner:

```bash
npx tsx tools/run-tests.ts
```

#### Running API Tests Only

```bash
npx tsx tools/api-tester.ts
```

#### Running Webhook Generator in Interactive Mode

```bash
npx tsx tools/webhook-generator.ts
```

#### Running Webhook Test Batch

```bash
npx tsx tools/webhook-generator.ts --batch
```

## Configuration

The testing tools are configured with sensible defaults but can be customized through environment variables:

### API Tester

- `API_BASE_URL`: Base URL for API requests (default: `http://localhost:5000/api`)
- `AUTH_TOKEN`: Optional authentication token for API requests

### Webhook Generator

- `WEBHOOK_URL`: Base URL for webhook endpoints (default: `http://localhost:5000/api/webhook`)

## Test Results

Test results are saved in the following locations:

- API Test Reports: `test-results/api-test-report-[timestamp].json` and `.html`
- Webhook Delivery Results: `test-results/webhooks/webhook-delivery-[timestamp].json`

## Available Test Suites

The API tester includes predefined test suites for:

1. Users API
2. Trust Scores API
3. Verifications API
4. NFTs API
5. Webhooks API
6. Security API
7. Integrations API

## Available Webhook Sources

The webhook generator supports events from:

1. Blockchain (transactions, NFT minting, wallet connections)
2. Security (verifications, risk assessments, suspicious activity)
3. Xano (record changes, workflow completions)
4. User (registration, login, profile updates, trust score changes)

## Extending the Tests

### Adding New API Tests

To add a new API test suite, extend the `ApiTester` class in `api-tester.ts`:

```typescript
async testNewFeatureApi() {
  return this.runTestSuite('New Feature API', [
    { method: 'GET', endpoint: '/new-feature/items' },
    { method: 'POST', endpoint: '/new-feature/items', data: { /* test data */ } }
  ]);
}

// Then update runAllTests() to include your new test suite
async runAllTests() {
  // existing tests...
  await this.testNewFeatureApi();
  // ...
}
```

### Adding New Webhook Types

To add new webhook event templates, update the `loadDefaultTemplates()` method in `WebhookTemplateRepository` class in `webhook-generator.ts`.