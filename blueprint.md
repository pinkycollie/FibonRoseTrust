### FibonRoseID concise implementation blueprint

A compact, actionable blueprint you can hand to engineers or paste into a GitHub agent: API surface, shared models, Fibonacci trust algorithm, verification lifecycle, security rules, event/webhook design, dashboard requirements, NFT migration path, and a ready PR prompt.

---

### API surface and routes

**Auth and session**
- `POST /auth/register` — create identity record or local token; returns `201` with `User` or `201` with minimal local id when zero‑custody.
- `POST /auth/login` — issue short‑lived Paseto v4 public access token; returns `200` with `AuthTokens`.
- `POST /auth/logout` — revoke session; returns `204`.

**Verification lifecycle**
- `POST /verifications` — submit verification request; body: `{ userId, type, payload }`; returns `202` with verification id.
- `GET /verifications/{id}` — fetch verification status and metadata; returns `200` with `IdentityVerification`.
- `GET /users/{userId}/verifications` — list verification history; returns `200` with array.

**Trust and policy**
- `GET /trust/{userId}` — returns `TrustScore` and level mapping; returns `200`.
- `POST /trust/recalculate/{userId}` — admin/internal trigger to recalc; returns `200`.
- `GET /capabilities/{userId}` — returns current sharing permissions and allowed attributes; returns `200`.

**Permission checks for NegraSecurity**
- `POST /check/permission` — body: `{ requester, userId, requestedAttributes }` → returns allow/deny and redacted payload if allowed; returns `200`.

**Admin / audit**
- `GET /audit/events` — paginated audit stream (access controlled).
- `POST /nft/verify` — internal hook for NFT attestation results.

---

### Shared data models

**IdentityVerification**
```ts
{
  id: number,
  userId: string,
  type: "BIOMETRIC" | "NFT" | "GOV_ID" | "RECOVERY",
  status: "PENDING" | "VERIFIED" | "REJECTED",
  data: object, // redacted for external callers
  createdAt: string, // ISO8601
  verifiedAt: string | null
}
```

**TrustScore**
```ts
{
  userId: string,
  score: number, // Fibonacci-based progressive score
  verificationCount: number,
  positiveTransactions: number,
  totalTransactions: number,
  lastUpdated: string // ISO8601
}
```

**AuthTokens**
```ts
{
  accessToken: string,
  refreshToken?: string,
  expiresIn: number
}
```

**ErrorResponse**
```ts
{
  code: string,
  message: string,
  details?: object
}
```

**CapabilityManifest**
```ts
{
  userId: string,
  capabilities: string[], // e.g., ["signLanguage:ASL","alerts:haptic_bus_stop"]
  scopeExpiresAt: string // ISO8601
}
```

---

### Fibonacci progressive trust scoring

**Principles**
- Score grows nonlinearly with distinct verified methods; early verifications give small gains, later ones larger marginal increases.
- Keep scores bounded and map to discrete policy levels for decisions.

**Algorithm sketch**
1. Let `n = verificationCount` (distinct verified methods).
2. Base Fibonacci value: compute \(F_n\) with \(F_1 = 1, F_2 = 2\), recurrence \(F_n = F_{n-1} + F_{n-2}\).
3. Transaction multiplier: \(m_{tx} = 1 + \frac{positiveTransactions}{totalTransactions + 1}\).
4. Recency decay: \(d = e^{-\lambda \cdot \Delta t}\) where \(\Delta t\) is time since last verification and \(\lambda\) is a tunable decay constant.
5. Raw score: \(\text{raw} = F_n \cdot m_{tx} \cdot d\).
6. Normalize and clamp to `[0, 100]` or map to levels (e.g., Level 1..5) for policy use.

**Notes**
- Use distinct verification types only (no double‑counting).
- Tune `λ` and normalization to match operational risk appetite.
- Persist only the `verificationCount`, `positiveTransactions`, `totalTransactions`, and `lastUpdated` if zero‑custody is required; compute score on demand.

---

### Verification lifecycle and events

**Flow**
1. **Submit** `POST /verifications` with minimal payload and consent token.
2. **Worker** validates evidence (biometric matcher, NFT attestation, OCR) in an isolated adapter.
3. **Record** verification result as `VERIFIED` or `REJECTED` (store only attestation refs if zero‑custody).
4. **Emit** `verification.completed` event to internal bus.
5. **Trust service** subscribes, recalculates `TrustScore`, emits `trust.updated`.
6. **NegraSecurity** calls `POST /check/permission` before sensitive ops.

**Events**
- `verification.requested`
- `verification.completed`
- `trust.updated`
- `permission.checked`

Use a lightweight broker (Redis Streams, NATS) or signed webhooks for delivery.

---

### Security and privacy rules

**Tokens**
- Use **Paseto v4 public** for session tokens; claims: `iss`, `aud`, `iat`, `exp` (≤ 10 minutes), `cap`, `sid`. **No PII** in tokens.
- Private keys in secure keystore; public keys distributed to trusted services.

**Hashed endpoints and webhooks**
- Generate ephemeral webhook tokens via `HMAC(node_secret, url||nonce||exp)`.
- Tokens are TTL‑limited and single‑use where possible.

**Redaction and CI guards**
- Redaction middleware strips PII from all outgoing responses; fail requests if PII detected.
- CI static checks: disallow DB client imports in protected routes; fail PRs that import persistence in `/api/v1/*`.
- Integration tests: assert `content-type: application/json` and no PII in responses.

**Operational**
- Rate limit verification endpoints; require consent tokens for any data sharing.
- Audit every permission check and data access with non‑PII metadata.
- For Cloudflare: route API to `api.` subdomain and skip JS challenges on API paths.

---

### NFT integration and migration path

**Adapter pattern**
- Keep current NFT auth module as an adapter that emits `nft.attested` events.
- Store only attestation references and minimal metadata pointers; do not mirror full on‑chain data unless user consents.
- Provide `POST /nft/verify` for attestation callbacks; mark verification record on success.

**Migration**
- Start with simulated verification for development.
- Swap adapter to on‑chain verification (RPC or indexer) without changing core APIs.
- Add optional user opt‑in to persist on‑chain proofs or metadata.

---

### Dashboard and transparency controls

**User view**
- Trust timeline and next milestones.
- Verification history with redacted evidence summaries.
- Per‑attribute visibility toggles and consent logs.
- Share preview showing exactly what a third party would see.

**Admin view**
- Aggregate trust distribution, verification success rates, and audit logs.
- Tools to force recalc or revoke attestations.

**Visualization**
- Fibonacci progression visual (spiral or stepped bars) to show marginal gains and next verification impact.

---

### CI, testing, and acceptance criteria

**CI checks**
- Spectral/OpenAPI validation for external and internal specs.
- Static analysis to detect DB imports in protected routes.
- Tests that call endpoints and assert JSON responses and no PII.
- Security SCA for dependencies and Paseto key presence checks.

**Acceptance**
- Local docker-compose boots internal and external services.
- `POST /auth/register` returns `201` JSON (no HTML).
- `POST /verifications` returns `202` and emits `verification.completed`.
- `GET /trust/{userId}` returns normalized Fibonacci score and level.
- CI fails on any PII persistence or HTML API responses.

---

### Ready GitHub agent PR prompt

```text
Title: Scaffold FibonRoseID identity service v0.1.0

Tasks:
1) Create monorepo packages:
   - packages/fibonroseid-service (Node/TypeScript or Python/FastAPI)
   - packages/shared-schema (JSON Schema + TS/Pydantic models)
   - packages/verification-adapters (pluggable stubs: biometric, nft, gov_id)
   - docs/ (CommonMark)
   - openapi/external.yaml and openapi/internal.yaml
   - docker-compose.yml and .github/workflows/ci.yml

2) Implement endpoints:
   - Auth: /auth/register, /auth/login, /auth/logout
   - Verifications: /verifications, /verifications/{id}, /users/{userId}/verifications
   - Trust: /trust/{userId}, /trust/recalculate/{userId}
   - Permission check: /check/permission
   - NFT hook: /nft/verify

3) Shared models: implement IdentityVerification, TrustScore, AuthTokens, ErrorResponse, CapabilityManifest.

4) Security:
   - Paseto v4 public token stubs with env placeholders PASETO_PRIVATE_KEY and PASETO_PUBLIC_KEY.
   - HMAC webhook token generator with NODE_HMAC_SECRET.
   - Redaction middleware and CI static checks to prevent PII persistence.

5) Events: wire a simple Redis Streams or in-memory event bus for verification.completed and trust.updated.

6) Docs: CommonMark pages for overview, endpoints, security, and migration notes.

Acceptance criteria:
- Services run locally via docker-compose.
- OpenAPI renders at /docs and passes spectral.
- CI includes spectral, lint, unit tests, and PII persistence checks.

Label PR: fibonroseid-v0.1.0
```

---

### Recommendation and next step
Start by generating the **shared JSON Schema + OpenAPI external spec** and the **Paseto + HMAC security stubs**. That gives a safe contract for NegraSecurity to integrate against while verification adapters and dashboard UI are built in parallel.

If you want, I’ll produce the OpenAPI skeleton and the shared schema files next, ready to paste into your repo.
