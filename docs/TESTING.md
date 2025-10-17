# Testing Documentation

## Overview

This project uses **Vitest** as the testing framework, which is fully compatible with the Vite build tool already used in the project. The test suite includes unit tests for utilities and integration tests for server-side functionality.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test
```

### Run tests once (CI mode)
```bash
npm run test:run
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

## Test Structure

```
test/
├── setup.ts              # Test setup and global configuration
├── utils/                # Unit tests for utility functions
│   ├── fibonacci.test.ts # Tests for Fibonacci trust scoring
│   └── cn.test.ts        # Tests for className utility
└── server/               # Server-side integration tests
    └── storage.test.ts   # Tests for storage operations
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../path/to/module';

describe('MyModule', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expectedValue);
  });
});
```

### Testing Async Functions

```typescript
it('should handle async operations', async () => {
  const result = await myAsyncFunction();
  expect(result).toBeDefined();
});
```

### Using beforeEach for Setup

```typescript
import { beforeEach } from 'vitest';

describe('MyTests', () => {
  let testData;

  beforeEach(() => {
    testData = setupTestData();
  });

  it('should use test data', () => {
    expect(testData).toBeDefined();
  });
});
```

## CI/CD Integration

The project uses GitHub Actions for continuous integration. The workflow is defined in `.github/workflows/ci.yml` and runs:

- Type checking with TypeScript
- All test suites
- Code coverage reporting
- Build verification

### Workflow Triggers

The CI pipeline runs on:
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop` branches

### Test Matrix

Tests run on multiple Node.js versions:
- Node.js 18.x
- Node.js 20.x

## Coverage Reporting

Coverage reports are generated using Vitest's built-in coverage provider. Reports are uploaded to Codecov for tracking coverage trends over time.

To view coverage locally:
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory:
- `coverage/index.html` - HTML coverage report
- `coverage/coverage-final.json` - JSON coverage data
- `coverage/lcov.info` - LCOV format for external tools

## Best Practices

1. **Write tests for new features**: All new functionality should include corresponding tests
2. **Test edge cases**: Don't just test the happy path
3. **Keep tests isolated**: Each test should be independent
4. **Use descriptive names**: Test names should clearly describe what they test
5. **Mock external dependencies**: Use mocks for APIs, databases, etc.
6. **Aim for good coverage**: Target 80%+ code coverage for critical paths

## Current Test Coverage

The test suite currently covers:

- ✅ Fibonacci trust scoring utilities
- ✅ CSS class name merging utility
- ✅ User storage operations
- ✅ Verification type operations
- ✅ Verification status management
- ✅ Trust score calculations
- ✅ Data permission management

## Future Testing Plans

- [ ] Add React component tests using Testing Library
- [ ] Add API endpoint integration tests
- [ ] Add E2E tests for critical user flows
- [ ] Add performance benchmarks
- [ ] Increase coverage for service layer
- [ ] Add tests for webhook functionality

## Troubleshooting

### Tests failing locally but passing in CI
- Ensure dependencies are up to date: `npm ci`
- Check Node.js version matches CI environment
- Clear cache: `npm run test:run -- --no-cache`

### Coverage reports not generating
- Ensure `@vitest/coverage-v8` is installed
- Check vitest.config.ts for coverage configuration
- Run with `--coverage` flag explicitly

### Type errors in tests
- Ensure test files are included in tsconfig.json
- Check that test utilities are properly imported
- Verify TypeScript version compatibility

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
