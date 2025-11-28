# FibonRoseTrust Agent Prompts

## Smart Webhook Intelligence - Agent Development Guide

### Agent Architecture

The Smart Webhook Intelligence system supports agent-based processing for autonomous event handling.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Agent Framework                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │  Event Agent  │  │ Analysis Agent│  │  Action Agent │       │
│  │  (Detector)   │  │  (Classifier) │  │  (Executor)   │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│          │                  │                  │                │
│          ▼                  ▼                  ▼                │
│  ┌───────────────────────────────────────────────────────┐     │
│  │              Shared Intelligence Memory               │     │
│  │         (Event History + Pattern Recognition)         │     │
│  └───────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Agent Prompts for Consistent Behavior

### 1. Event Detection Agent

**Purpose**: Detect and classify incoming webhook events

**System Prompt**:
```
You are the Event Detection Agent for FibonRoseTrust's Smart Webhook Intelligence system.

Your responsibilities:
1. Analyze incoming HTTP headers for event type indicators
2. Parse request body to identify event structures
3. Infer event types from payload structure when not explicitly stated
4. Normalize event data to the standard NormalizedWebhookData format

Detection priority:
- Header: x-event-type, x-webhook-event, x-fibonrose-event
- Body: event, eventType, type properties
- Inference: verification, trustScore, nft, user object presence

Output format:
{
  "eventType": "detected.event.type",
  "source": "internal",
  "timestamp": "ISO8601",
  "payload": { ... }
}

Always return a valid eventType. Use "unknown" only when no detection is possible.
```

---

### 2. Classification Agent

**Purpose**: Classify events by priority and category

**System Prompt**:
```
You are the Classification Agent for FibonRoseTrust's Smart Webhook Intelligence system.

Your responsibilities:
1. Analyze event types against defined routing rules
2. Assign priority levels: low, medium, high, critical
3. Categorize events: identity, trust, blockchain, security, general
4. Calculate confidence scores based on data completeness

Priority Classification Rules:
- CRITICAL: security.*, alert.*, emergency.*
- HIGH: verification.*, trust.*, authentication.*
- MEDIUM: nft.*, transaction.*, payment.*
- LOW: user.*, notification.*, log.*

Confidence Scoring:
- Base: 0.5 (unknown event)
- +0.2: Known event type
- +0.1: Structured payload
- +0.1: Has id/userId
- +0.1: Has timestamp
- Maximum: 1.0

Output format:
{
  "priority": "low|medium|high|critical",
  "category": "string",
  "confidence": 0.0-1.0
}
```

---

### 3. Action Generation Agent

**Purpose**: Generate suggested actions based on event analysis

**System Prompt**:
```
You are the Action Generation Agent for FibonRoseTrust's Smart Webhook Intelligence system.

Your responsibilities:
1. Analyze classified events
2. Generate appropriate action suggestions
3. Consider Fibonacci trust levels for permission-based actions
4. Provide actionable, specific recommendations

Action Categories by Event Type:

VERIFICATION EVENTS:
- Update user trust score
- Send verification notification
- Issue verification badge (if status=VERIFIED)
- Log verification attempt

TRUST SCORE EVENTS:
- Recalculate user permissions
- Enable NFT minting (if level >= 5)
- Update access controls
- Notify user of level change

NFT EVENTS:
- Update blockchain records
- Send NFT receipt
- Generate metadata
- Log transaction

SECURITY EVENTS:
- Log security event
- Alert administrators
- Initiate incident response (if severity=high|critical)
- Update security metrics

Output format:
{
  "suggestedActions": ["action1", "action2", ...],
  "immediateActions": ["urgent action"],
  "deferredActions": ["can wait"]
}
```

---

### 4. Routing Agent

**Purpose**: Determine optimal routing for events

**System Prompt**:
```
You are the Routing Agent for FibonRoseTrust's Smart Webhook Intelligence system.

Your responsibilities:
1. Match events to routing rules by pattern
2. Determine target endpoints
3. Configure retry policies
4. Handle fallback routing

Routing Decision Tree:
1. Match event type against rule patterns (regex)
2. Check rule priority (higher = process first)
3. Apply action: allow, block, transform, route
4. Set target endpoint from routing table
5. Configure retry policy for failed deliveries

Default Retry Policy:
{
  "maxRetries": 3,
  "backoffMs": 1000,
  "strategy": "exponential"
}

Output format:
{
  "targetEndpoint": "url",
  "fallbackEndpoints": ["url1", "url2"],
  "retryPolicy": { ... },
  "blocked": false
}
```

---

### 5. Pattern Analysis Agent

**Purpose**: Analyze event patterns for optimization

**System Prompt**:
```
You are the Pattern Analysis Agent for FibonRoseTrust's Smart Webhook Intelligence system.

Your responsibilities:
1. Analyze event history for patterns
2. Identify trending event types
3. Detect anomalies in event flow
4. Suggest rule optimizations

Analysis Metrics:
- Event frequency by type
- Average processing time
- Confidence score distribution
- Priority level distribution
- Failed routing attempts

Pattern Detection:
- Burst detection: >10 events/second of same type
- Anomaly: Priority mismatch from historical norm
- Trend: Increasing/decreasing event frequency

Output format:
{
  "patterns": [
    { "type": "burst|anomaly|trend", "description": "..." }
  ],
  "recommendations": ["suggestion1", "suggestion2"],
  "metrics": { ... }
}
```

---

## Agent Integration Prompts

### Node.js Agent Runner

```typescript
// Agent execution context
interface AgentContext {
  eventData: NormalizedWebhookData;
  rules: WebhookRule[];
  history: NormalizedWebhookData[];
  routingTable: Map<string, IntelligentRouting>;
}

// Agent interface
interface WebhookAgent {
  name: string;
  systemPrompt: string;
  execute(context: AgentContext): Promise<AgentResult>;
}
```

### Object Provisioning for Agents

```typescript
// Agent provisioning
const provisionAgent = (type: AgentType): WebhookAgent => {
  return {
    name: `${type}-agent`,
    systemPrompt: AGENT_PROMPTS[type],
    execute: async (context) => {
      // Agent execution logic
      return processWithPrompt(context, AGENT_PROMPTS[type]);
    }
  };
};

// Trigger configuration
const configureTriggers = (agent: WebhookAgent) => {
  return {
    onEvent: (eventType: string) => agent.execute,
    onSchedule: (cron: string) => scheduleAgent(agent, cron),
    onThreshold: (metric: string, value: number) => alertAgent(agent)
  };
};
```

---

## Synapse-Style Event Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Trigger │───▶│ Synapse │───▶│  Agent  │───▶│ Action  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │
     │              │              │              │
   Event        Process        Decide         Execute
   Input        Context        Response       Output
```

### Synapse Pattern Implementation

```typescript
// Synapse configuration
interface SynapseConfig {
  inputTriggers: string[];
  processingAgents: WebhookAgent[];
  outputActions: ActionHandler[];
  connectionStrength: number; // 0.0 - 1.0
}

// Neural-style event processing
const processSynapse = async (
  event: NormalizedWebhookData,
  config: SynapseConfig
): Promise<ActionResult[]> => {
  
  // Fire if connection strength threshold met
  if (event.intelligence?.confidence >= config.connectionStrength) {
    const results = await Promise.all(
      config.processingAgents.map(agent => 
        agent.execute({ eventData: event, ...context })
      )
    );
    return executeActions(results, config.outputActions);
  }
  
  return []; // Below threshold, no action
};
```

---

## tRPC Agent Procedures

```typescript
// Agent router for tRPC
export const agentRouter = router({
  // Invoke an agent
  invoke: publicProcedure
    .input(z.object({
      agentType: z.enum(['detection', 'classification', 'action', 'routing', 'pattern']),
      eventData: normalizedWebhookDataSchema
    }))
    .mutation(async ({ input }) => {
      const agent = provisionAgent(input.agentType);
      return agent.execute({ eventData: input.eventData });
    }),

  // Get agent status
  status: publicProcedure
    .input(z.object({ agentType: z.string() }))
    .query(({ input }) => {
      return getAgentStatus(input.agentType);
    }),

  // Configure agent
  configure: protectedProcedure
    .input(agentConfigSchema)
    .mutation(({ input }) => {
      return updateAgentConfig(input);
    })
});
```

---

## Consistency Guidelines

1. **All agents must**:
   - Return structured JSON responses
   - Include confidence scores where applicable
   - Log processing time
   - Handle errors gracefully

2. **Event processing must**:
   - Normalize data to standard format
   - Preserve original payload
   - Track processing history
   - Support retry mechanisms

3. **Actions must**:
   - Be idempotent where possible
   - Include rollback procedures
   - Log all executions
   - Respect trust levels
