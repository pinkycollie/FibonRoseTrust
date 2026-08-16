# FibonRoseTrust Build Context

## Smart Webhook Intelligence System - Internal Development Guide

### Architecture Overview

The Smart Webhook Intelligence system is a self-contained, internal webhook processing engine that replaces external third-party dependencies. It operates as a node-based event processing system with intelligent routing capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                  Smart Webhook Intelligence                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Ingress   │───▶│   Router    │───▶│  Processor  │     │
│  │   (Node)    │    │   (Node)    │    │   (Node)    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Trigger   │    │    Rules    │    │   Actions   │     │
│  │  Detection  │    │   Engine    │    │   Queue     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Event Ingress Node
- Receives incoming webhook payloads
- Normalizes headers and body content
- Detects event type from multiple sources

```typescript
// Event detection priority:
// 1. x-event-type header
// 2. x-webhook-event header
// 3. x-fibonrose-event header
// 4. body.event property
// 5. body.eventType property
// 6. Payload structure inference
```

#### 2. Intelligent Router Node
- Pattern-matching rule engine
- Priority-based rule evaluation
- Dynamic routing table management

```typescript
interface WebhookRule {
  id: string;
  name: string;
  pattern: RegExp | string;
  action: 'allow' | 'block' | 'transform' | 'route';
  priority: number;
  metadata?: Record<string, any>;
}
```

#### 3. Event Processor Node
- Intelligence analysis engine
- Confidence scoring
- Suggested actions generation

### Object Provisioning

Objects in the system follow a predictable lifecycle:

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Create  │───▶│ Validate │───▶│ Process  │───▶│  Store   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
     ▼               ▼               ▼               ▼
  WebhookRule   NormalizedData   Intelligence   EventHistory
```

### Trigger System

Triggers are event-driven activations based on pattern matching:

| Trigger Type | Pattern | Priority | Category |
|--------------|---------|----------|----------|
| `verify-events` | `/verification\./` | 100 | identity |
| `trust-events` | `/trust_score\./` | 90 | trust |
| `nft-events` | `/nft\./` | 80 | blockchain |
| `security-events` | `/security\./` | 95 | security |

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Type checking
npm run check

# Testing
npm run test
npm run test:run
npm run test:coverage

# Database operations
npm run db:push
```

### Environment Configuration

```env
# Internal system - no external API keys required
NODE_ENV=development|production

# Database
DATABASE_URL=your_database_url

# Optional: GCP Integration
GCP_PROJECT_ID=your_project_id
```

### TypeScript Integration

The system uses strict TypeScript with the following key interfaces:

```typescript
// Core event data structure
interface NormalizedWebhookData {
  eventType: string;
  source: string;
  timestamp: string;
  payload: Record<string, any>;
  intelligence?: WebhookIntelligence;
}

// Intelligence analysis result
interface WebhookIntelligence {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  suggestedActions: string[];
  confidence: number;
  processingTime: number;
}

// Routing configuration
interface IntelligentRouting {
  targetEndpoint: string;
  fallbackEndpoints: string[];
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
}
```

### tRPC Integration Points

While the core system uses Express routes, it's designed for potential tRPC migration:

```typescript
// Current: Express routes
app.post('/api/webhook/:source', async (req, res) => {
  const result = SmartWebhookIntelligence.processWebhook(headers, body);
  res.json(result);
});

// Future: tRPC procedure
export const webhookRouter = router({
  process: publicProcedure
    .input(z.object({
      headers: z.record(z.string()),
      body: z.any()
    }))
    .mutation(({ input }) => {
      return SmartWebhookIntelligence.processWebhook(input.headers, input.body);
    })
});
```

### Synapse Pattern (Event Flow)

The system follows a synapse-like pattern for event propagation:

```
Event → Receptor → Processor → Effector → Response
  │         │          │           │          │
  └─ Input  └─ Detect  └─ Analyze  └─ Act    └─ Output
```

1. **Receptor**: Event ingress detects and normalizes incoming data
2. **Processor**: Intelligence engine analyzes and classifies
3. **Effector**: Action queue triggers appropriate responses

### Testing Strategy

```typescript
// Unit tests for core functions
describe('SmartWebhookIntelligence', () => {
  it('should detect event type from headers', () => {
    const result = SmartWebhookIntelligence.processWebhook(
      { 'x-event-type': 'verification.created' },
      { userId: 1 }
    );
    expect(result.eventType).toBe('verification.created');
  });

  it('should calculate confidence score', () => {
    const result = SmartWebhookIntelligence.processWebhook({}, {
      id: 1,
      userId: 2,
      timestamp: new Date().toISOString()
    });
    expect(result.intelligence?.confidence).toBeGreaterThan(0.7);
  });
});
```

### Performance Considerations

- Event history capped at 1000 entries
- Rules sorted by priority for efficient matching
- Confidence calculation uses O(1) operations
- Signature verification uses timing-safe comparison

### Security

- HMAC-SHA256 signature generation and verification
- No external API dependencies
- Internal authentication only
- Trust-based data filtering based on Fibonacci levels
