// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
function calculateFibonacciLevel(verificationCount) {
  if (verificationCount <= 0) return 0;
  if (verificationCount === 1) return 1;
  if (verificationCount === 2) return 2;
  if (verificationCount <= 4) return 3;
  if (verificationCount <= 7) return 4;
  return Math.min(10, Math.floor(Math.log(verificationCount) / Math.log(1.5)) + 1);
}
function calculateFibonacciScore(verificationCount) {
  const fibonacci = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
  const level = calculateFibonacciLevel(verificationCount);
  return level < fibonacci.length ? fibonacci[level] : 3;
}
var MemStorage = class {
  users;
  verificationTypes;
  verifications;
  trustScores;
  dataPermissions;
  webhookSubscriptions;
  webhookDeliveries;
  notionIntegrations;
  xanoIntegrations;
  userId;
  verificationTypeId;
  verificationId;
  trustScoreId;
  dataPermissionId;
  webhookSubscriptionId;
  webhookDeliveryId;
  notionIntegrationId;
  xanoIntegrationId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.verificationTypes = /* @__PURE__ */ new Map();
    this.verifications = /* @__PURE__ */ new Map();
    this.trustScores = /* @__PURE__ */ new Map();
    this.dataPermissions = /* @__PURE__ */ new Map();
    this.webhookSubscriptions = /* @__PURE__ */ new Map();
    this.webhookDeliveries = /* @__PURE__ */ new Map();
    this.notionIntegrations = /* @__PURE__ */ new Map();
    this.xanoIntegrations = /* @__PURE__ */ new Map();
    this.userId = 1;
    this.verificationTypeId = 1;
    this.verificationId = 1;
    this.trustScoreId = 1;
    this.dataPermissionId = 1;
    this.webhookSubscriptionId = 1;
    this.webhookDeliveryId = 1;
    this.notionIntegrationId = 1;
    this.xanoIntegrationId = 1;
  }
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.userId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  // Verification type methods
  async getVerificationTypes() {
    return Array.from(this.verificationTypes.values());
  }
  async getVerificationType(id) {
    return this.verificationTypes.get(id);
  }
  async createVerificationType(type) {
    const id = this.verificationTypeId++;
    const verificationType = { ...type, id };
    this.verificationTypes.set(id, verificationType);
    return verificationType;
  }
  // Verification methods
  async getVerifications(userId) {
    return Array.from(this.verifications.values()).filter(
      (verification) => verification.userId === userId
    );
  }
  async getVerification(id) {
    return this.verifications.get(id);
  }
  async createVerification(verification) {
    const id = this.verificationId++;
    const createdAt = /* @__PURE__ */ new Date();
    const newVerification = {
      ...verification,
      id,
      createdAt,
      verifiedAt: null
    };
    this.verifications.set(id, newVerification);
    if (newVerification.status === "VERIFIED") {
      await this.updateTrustScore(newVerification.userId);
    }
    return newVerification;
  }
  async updateVerificationStatus(id, status, verifiedBy) {
    const verification = this.verifications.get(id);
    if (!verification) return void 0;
    const updatedVerification = {
      ...verification,
      status,
      verifiedBy: verifiedBy || verification.verifiedBy,
      verifiedAt: status === "VERIFIED" ? /* @__PURE__ */ new Date() : verification.verifiedAt
    };
    this.verifications.set(id, updatedVerification);
    if (status === "VERIFIED") {
      await this.updateTrustScore(verification.userId);
    }
    return updatedVerification;
  }
  // Trust score methods
  async getTrustScore(userId) {
    return Array.from(this.trustScores.values()).find(
      (score) => score.userId === userId
    );
  }
  async createTrustScore(trustScore) {
    const id = this.trustScoreId++;
    const lastUpdated = /* @__PURE__ */ new Date();
    const newTrustScore = { ...trustScore, id, lastUpdated };
    this.trustScores.set(id, newTrustScore);
    return newTrustScore;
  }
  async updateTrustScore(userId) {
    const userVerifications = Array.from(this.verifications.values()).filter(
      (verification) => verification.userId === userId && verification.status === "VERIFIED"
    );
    const verificationCount = userVerifications.length;
    const level = calculateFibonacciLevel(verificationCount);
    const score = calculateFibonacciScore(verificationCount);
    const maxScore = calculateFibonacciScore(level + 1);
    let trustScore = await this.getTrustScore(userId);
    if (!trustScore) {
      trustScore = await this.createTrustScore({
        userId,
        score,
        level,
        maxScore,
        verificationCount,
        positiveTransactions: 0,
        totalTransactions: 0
      });
    } else {
      const updatedTrustScore = {
        ...trustScore,
        score,
        level,
        maxScore,
        verificationCount,
        lastUpdated: /* @__PURE__ */ new Date()
      };
      this.trustScores.set(trustScore.id, updatedTrustScore);
      trustScore = updatedTrustScore;
    }
    return trustScore;
  }
  // Data permission methods
  async getDataPermissions(userId) {
    return Array.from(this.dataPermissions.values()).filter(
      (permission) => permission.userId === userId
    );
  }
  async getDataPermission(id) {
    return this.dataPermissions.get(id);
  }
  async createDataPermission(permission) {
    const id = this.dataPermissionId++;
    const newPermission = { ...permission, id };
    this.dataPermissions.set(id, newPermission);
    return newPermission;
  }
  async updateDataPermission(id, enabled) {
    const permission = this.dataPermissions.get(id);
    if (!permission) return void 0;
    const updatedPermission = {
      ...permission,
      enabled
    };
    this.dataPermissions.set(id, updatedPermission);
    return updatedPermission;
  }
  // Seed initial data
  async seedInitialData() {
    const defaultUser = await this.createUser({
      username: "jane.cooper",
      password: "password",
      name: "Jane Cooper",
      email: "jane@example.com",
      avatarUrl: "https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&s=aa3a807e1bbdfd4364d1f449eaa96d82"
    });
    const biometricType = await this.createVerificationType({
      name: "biometric",
      displayName: "Biometric Verification",
      description: "Verify your identity using biometric data",
      icon: "fingerprint"
    });
    const nftType = await this.createVerificationType({
      name: "nft",
      displayName: "NFT Authentication",
      description: "Authenticate using your NFT credentials",
      icon: "token"
    });
    const governmentIdType = await this.createVerificationType({
      name: "government_id",
      displayName: "Government ID",
      description: "Verify your identity using a government-issued ID",
      icon: "badge"
    });
    await this.createVerification({
      userId: defaultUser.id,
      typeId: biometricType.id,
      status: "VERIFIED",
      verifiedBy: "Biometric System",
      data: {}
    });
    await this.createVerification({
      userId: defaultUser.id,
      typeId: nftType.id,
      status: "VERIFIED",
      verifiedBy: "NFT Gateway",
      data: {}
    });
    await this.createVerification({
      userId: defaultUser.id,
      typeId: governmentIdType.id,
      status: "VERIFIED",
      verifiedBy: "NegraSecurity Authentication Service",
      data: {}
    });
    await this.createDataPermission({
      userId: defaultUser.id,
      permissionKey: "basic_profile",
      enabled: true
    });
    await this.createDataPermission({
      userId: defaultUser.id,
      permissionKey: "verification_status",
      enabled: true
    });
    await this.createDataPermission({
      userId: defaultUser.id,
      permissionKey: "trust_score_details",
      enabled: false
    });
    await this.createDataPermission({
      userId: defaultUser.id,
      permissionKey: "transaction_history",
      enabled: false
    });
    await this.createWebhookSubscription({
      name: "Verification Status Updates",
      url: "https://example.com/webhooks/fibontrust",
      secret: "whsec_" + Math.random().toString(36).substring(2, 15),
      events: ["verification.verified", "verification.rejected"],
      isActive: true,
      partnerId: 1,
      headers: { "X-Custom-Header": "FibonRoseTrust" }
    });
    await this.createNotionIntegration({
      userId: defaultUser.id,
      accessToken: "secret_notionToken123456",
      workspaceId: "workspace123",
      databaseId: "database456",
      isActive: true,
      settings: {
        syncVerifications: true,
        syncTrustScores: true
      }
    });
    await this.updateTrustScore(defaultUser.id);
  }
  // Webhook subscription methods
  async getWebhookSubscriptions() {
    return Array.from(this.webhookSubscriptions.values());
  }
  async getWebhookSubscription(id) {
    return this.webhookSubscriptions.get(id);
  }
  async createWebhookSubscription(subscription) {
    const id = this.webhookSubscriptionId++;
    const createdAt = /* @__PURE__ */ new Date();
    const newSubscription = {
      ...subscription,
      id,
      createdAt
    };
    this.webhookSubscriptions.set(id, newSubscription);
    return newSubscription;
  }
  async updateWebhookSubscription(id, updates) {
    const subscription = this.webhookSubscriptions.get(id);
    if (!subscription) return void 0;
    const updatedSubscription = {
      ...subscription,
      ...updates
    };
    this.webhookSubscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }
  async deleteWebhookSubscription(id) {
    return this.webhookSubscriptions.delete(id);
  }
  // Webhook delivery methods
  async getWebhookDeliveries(subscriptionId) {
    if (subscriptionId) {
      return Array.from(this.webhookDeliveries.values()).filter(
        (delivery) => delivery.subscriptionId === subscriptionId
      );
    }
    return Array.from(this.webhookDeliveries.values());
  }
  async getWebhookDelivery(id) {
    return this.webhookDeliveries.get(id);
  }
  async createWebhookDelivery(delivery) {
    const id = this.webhookDeliveryId++;
    const createdAt = /* @__PURE__ */ new Date();
    const newDelivery = {
      ...delivery,
      id,
      createdAt,
      attempts: 0,
      processedAt: null,
      statusCode: delivery.statusCode || null,
      response: delivery.response || null,
      errorMessage: delivery.errorMessage || null
    };
    this.webhookDeliveries.set(id, newDelivery);
    return newDelivery;
  }
  async updateWebhookDeliveryStatus(id, status, statusCode, response, errorMessage) {
    const delivery = this.webhookDeliveries.get(id);
    if (!delivery) return void 0;
    const updatedDelivery = {
      ...delivery,
      status,
      statusCode: statusCode || delivery.statusCode,
      response: response || delivery.response,
      errorMessage: errorMessage || delivery.errorMessage,
      processedAt: /* @__PURE__ */ new Date(),
      attempts: delivery.attempts + 1
    };
    this.webhookDeliveries.set(id, updatedDelivery);
    return updatedDelivery;
  }
  // Notion integration methods
  async getNotionIntegrations(userId) {
    return Array.from(this.notionIntegrations.values()).filter(
      (integration) => integration.userId === userId
    );
  }
  async getNotionIntegration(id) {
    return this.notionIntegrations.get(id);
  }
  async createNotionIntegration(integration) {
    const id = this.notionIntegrationId++;
    const newIntegration = { ...integration, id, lastSynced: null };
    this.notionIntegrations.set(id, newIntegration);
    return newIntegration;
  }
  async updateNotionIntegration(id, updates) {
    const integration = this.notionIntegrations.get(id);
    if (!integration) return void 0;
    const updatedIntegration = {
      ...integration,
      ...updates
    };
    this.notionIntegrations.set(id, updatedIntegration);
    return updatedIntegration;
  }
  async deleteNotionIntegration(id) {
    return this.notionIntegrations.delete(id);
  }
  // Xano integration methods
  async getXanoIntegrations(userId) {
    return Array.from(this.xanoIntegrations.values()).filter(
      (integration) => integration.userId === userId
    );
  }
  async getXanoIntegration(id) {
    return this.xanoIntegrations.get(id);
  }
  async createXanoIntegration(integration) {
    const id = this.xanoIntegrationId++;
    const newIntegration = {
      ...integration,
      id,
      lastSynced: null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.xanoIntegrations.set(id, newIntegration);
    return newIntegration;
  }
  async updateXanoIntegration(id, updates) {
    const integration = this.xanoIntegrations.get(id);
    if (!integration) return void 0;
    const updatedIntegration = {
      ...integration,
      ...updates
    };
    this.xanoIntegrations.set(id, updatedIntegration);
    return updatedIntegration;
  }
  async deleteXanoIntegration(id) {
    return this.xanoIntegrations.delete(id);
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatarUrl: text("avatar_url"),
  // Auth0 integration fields
  auth0Sub: text("auth0_sub").unique(),
  role: text("role").default("user"),
  emailVerified: boolean("email_verified").default(false),
  profilePictureUrl: text("profile_picture_url"),
  lastLogin: timestamp("last_login", { mode: "date" })
});
var verificationTypes = pgTable("verification_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull()
});
var verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  typeId: integer("type_id").notNull().references(() => verificationTypes.id),
  status: text("status").notNull(),
  // PENDING, VERIFIED, REJECTED
  verifiedBy: text("verified_by"),
  // Service that verified the user
  data: jsonb("data"),
  // Verification-specific data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at")
});
var trustScores = pgTable("trust_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  score: integer("score").notNull().default(0),
  level: integer("level").notNull().default(0),
  maxScore: integer("max_score").notNull().default(0),
  verificationCount: integer("verification_count").notNull().default(0),
  positiveTransactions: integer("positive_transactions").notNull().default(0),
  totalTransactions: integer("total_transactions").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow()
});
var dataPermissions = pgTable("data_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  permissionKey: text("permission_key").notNull(),
  // Type of data to share
  enabled: boolean("enabled").notNull().default(true)
});
var webhookSubscriptions = pgTable("webhook_subscriptions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  events: text("events").array().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  partnerId: integer("partner_id"),
  headers: jsonb("headers").default({})
});
var webhookDeliveries = pgTable("webhook_deliveries", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull().references(() => webhookSubscriptions.id),
  eventType: text("event_type").notNull(),
  source: text("source"),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull(),
  // 'PENDING', 'DELIVERED', 'FAILED', 'RECEIVED'
  statusCode: integer("status_code"),
  response: text("response"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  requestHeaders: text("request_headers"),
  requestPayload: text("request_payload"),
  responseBody: text("response_body"),
  processedAt: timestamp("processed_at"),
  attempts: integer("attempts").notNull().default(0)
});
var notionIntegrations = pgTable("notion_integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  accessToken: text("access_token").notNull(),
  workspaceId: text("workspace_id").notNull(),
  databaseId: text("database_id"),
  isActive: boolean("is_active").notNull().default(true),
  lastSynced: timestamp("last_synced"),
  settings: jsonb("settings").default({})
});
var xanoIntegrations = pgTable("xano_integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  apiKey: text("api_key").notNull(),
  baseUrl: text("base_url").notNull(),
  webhookSecret: text("webhook_secret"),
  isActive: boolean("is_active").notNull().default(true),
  lastSynced: timestamp("last_synced"),
  aiEnabled: boolean("ai_enabled").notNull().default(false),
  settings: jsonb("settings").default({})
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  avatarUrl: true,
  // Auth0 fields
  auth0Sub: true,
  role: true,
  emailVerified: true,
  profilePictureUrl: true,
  lastLogin: true
});
var insertVerificationTypeSchema = createInsertSchema(verificationTypes);
var insertVerificationSchema = createInsertSchema(verifications).omit({ createdAt: true, verifiedAt: true });
var insertTrustScoreSchema = createInsertSchema(trustScores).omit({ lastUpdated: true });
var insertDataPermissionSchema = createInsertSchema(dataPermissions);
var insertWebhookSubscriptionSchema = createInsertSchema(webhookSubscriptions).omit({
  createdAt: true
});
var insertWebhookDeliverySchema = createInsertSchema(webhookDeliveries).omit({
  createdAt: true,
  processedAt: true,
  attempts: true
});
var insertNotionIntegrationSchema = createInsertSchema(notionIntegrations).omit({
  lastSynced: true
});
var insertXanoIntegrationSchema = createInsertSchema(xanoIntegrations).omit({
  lastSynced: true
});
var EventTypes = {
  // Generic event
  GENERIC: "generic.event",
  // Identity Verification Layer events
  VERIFICATION_INITIATED: "verification.initiated",
  VERIFICATION_CREATED: "verification.created",
  VERIFICATION_UPDATED: "verification.updated",
  VERIFICATION_VERIFIED: "verification.verified",
  VERIFICATION_REJECTED: "verification.rejected",
  VERIFICATION_STEP_COMPLETED: "verification.step_completed",
  // Neural Network Processing events
  NEURAL_RISK_ASSESSMENT_STARTED: "neural.risk_assessment_started",
  NEURAL_RISK_ASSESSMENT_COMPLETED: "neural.risk_assessment_completed",
  NEURAL_ANOMALY_DETECTED: "neural.anomaly_detected",
  // Decentralized Database events
  DB_DATA_STORED: "db.data_stored",
  DB_DATA_UPDATED: "db.data_updated",
  DB_DATA_ACCESSED: "db.data_accessed",
  DB_DATA_DELETED: "db.data_deleted",
  // Credential Validation events
  CREDENTIAL_VALIDATION_STARTED: "credential.validation_started",
  CREDENTIAL_VALIDATION_COMPLETED: "credential.validation_completed",
  CREDENTIAL_ISSUED: "credential.issued",
  CREDENTIAL_REVOKED: "credential.revoked",
  // Access Rights Management events
  ACCESS_GRANTED: "access.granted",
  ACCESS_DENIED: "access.denied",
  ACCESS_REVOKED: "access.revoked",
  PERMISSION_LEVEL_CHANGED: "permission.level_changed",
  // User events
  TRUST_SCORE_UPDATED: "trust_score.updated",
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  // NFT & Blockchain events
  NFT_MINTED: "nft.minted",
  NFT_TRANSFERRED: "nft.transferred",
  WALLET_CONNECTED: "wallet.connected",
  WALLET_DISCONNECTED: "wallet.disconnected",
  // Civic Pass specific events
  CIVIC_PASS_VERIFIED: "civic.pass_verified",
  CIVIC_PASS_EXPIRED: "civic.pass_expired",
  CIVIC_PASS_REVOKED: "civic.pass_revoked",
  // NegraRosa Security Framework events
  SECURITY_WHY_SUBMITTED: "security.why_submitted",
  SECURITY_WHY_VERIFIED: "security.why_verified",
  SECURITY_RISK_ASSESSED: "security.risk_assessed",
  // Xano integration events
  XANO_ANALYSIS_COMPLETED: "xano.analysis.completed",
  XANO_DATA_SYNCED: "xano.data.synced",
  XANO_AI_INSIGHT: "xano.ai.insight",
  XANO_METADATA_UPDATED: "xano.metadata.updated",
  // PinkSync events
  PINKSYNC_WEBHOOK_RECEIVED: "pinksync.webhook_received",
  PINKSYNC_TRIGGER_ACTIVATED: "pinksync.trigger_activated"
};

// server/routes.ts
import multer from "multer";
import fs4 from "fs";

// server/services/universal-webhook.ts
import axios from "axios";
import * as fs2 from "fs";
import * as path3 from "path";
import * as csv from "fast-csv";

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/services/universal-webhook.ts
import * as crypto from "crypto";
var UniversalWebhookManager = class {
  sourceHandlers = /* @__PURE__ */ new Map();
  constructor() {
    this.registerDefaultHandlers();
  }
  /**
   * Register default source handlers
   */
  registerDefaultHandlers() {
    this.sourceHandlers.set("notion", (headers, payload) => {
      const eventType = headers["x-notion-event-type"] || "unknown";
      return {
        source: "notion",
        eventType,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        payload
      };
    });
    this.sourceHandlers.set("xano", (headers, payload) => {
      return {
        source: "xano",
        eventType: payload.event_type || "data.updated",
        timestamp: payload.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
        payload
      };
    });
  }
  /**
   * Register a custom source handler
   * @param source Source identifier
   * @param handler Handler function
   */
  registerSourceHandler(source, handler) {
    this.sourceHandlers.set(source, handler);
    log(`Registered custom handler for source: ${source}`, "webhook");
  }
  /**
   * Process an incoming webhook from any source
   * @param source Source of the webhook
   * @param headers Request headers
   * @param payload Request body
   * @returns Processing result
   */
  async processIncomingWebhook(source, headers, payload) {
    try {
      log(`Processing incoming webhook from ${source}`, "webhook");
      const handler = this.sourceHandlers.get(source) || ((h, p) => ({
        source,
        eventType: "unknown",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        payload: p
      }));
      const normalizedData = handler(headers, payload);
      const delivery = await storage.createWebhookDelivery({
        subscriptionId: 1,
        // Default subscription ID
        eventType: normalizedData.eventType,
        status: "RECEIVED",
        payload,
        // Required field
        requestHeaders: JSON.stringify(headers),
        statusCode: null,
        response: null,
        errorMessage: null
      });
      return {
        success: true,
        data: {
          deliveryId: delivery.id,
          source,
          eventType: normalizedData.eventType,
          status: delivery.status
        }
      };
    } catch (error) {
      log(`Error processing webhook from ${source}: ${error instanceof Error ? error.message : String(error)}`, "webhook");
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  /**
   * Test a webhook by sending a test event
   * @param subscriptionId ID of the webhook subscription
   * @param eventType Type of event to test
   * @param payload Optional custom payload
   */
  async testWebhook(subscriptionId, eventType, payload = { test: true, timestamp: (/* @__PURE__ */ new Date()).toISOString() }) {
    const subscription = await storage.getWebhookSubscription(subscriptionId);
    if (!subscription) {
      throw new Error(`Webhook subscription ${subscriptionId} not found`);
    }
    const delivery = await storage.createWebhookDelivery({
      subscriptionId,
      eventType,
      status: "PENDING",
      payload: typeof payload === "string" ? JSON.parse(payload) : payload
    });
    await this.deliverWebhook(delivery.id, subscription, payload);
    return await storage.getWebhookDelivery(delivery.id);
  }
  /**
   * Deliver a webhook to its destination
   * @param deliveryId ID of the delivery record
   * @param subscription Webhook subscription
   * @param payload Payload to send
   */
  async deliverWebhook(deliveryId, subscription, payload) {
    try {
      log(`Delivering webhook ${deliveryId} to ${subscription.url}`, "webhook");
      const headers = {
        "Content-Type": "application/json",
        "User-Agent": "FibonroseTrust-Webhook/1.0",
        "X-FibonroseTrust-Delivery": deliveryId.toString(),
        "X-FibonroseTrust-Event": payload.eventType || "unknown"
      };
      if (subscription.secret) {
        headers["X-FibonroseTrust-Signature"] = this.generateSignature(
          JSON.stringify(payload),
          subscription.secret
        );
      }
      const response = await axios.post(subscription.url, payload, {
        headers,
        timeout: 1e4
        // 10 second timeout
      });
      await storage.updateWebhookDeliveryStatus(
        deliveryId,
        "DELIVERED",
        response.status,
        JSON.stringify(response.data)
      );
    } catch (error) {
      log(`Error delivering webhook ${deliveryId}: ${error instanceof Error ? error.message : String(error)}`, "webhook");
      await storage.updateWebhookDeliveryStatus(
        deliveryId,
        "FAILED",
        error instanceof axios.AxiosError ? error.response?.status || 0 : 0,
        "",
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  /**
   * Generate HMAC signature for webhook payload
   * @param payload Webhook payload
   * @param secret Webhook secret
   * @returns HMAC signature
   */
  generateSignature(payload, secret) {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    return hmac.digest("hex");
  }
  /**
   * Process an event from the identity framework event bus
   * This method is the key integration point between the event bus and webhook system
   * @param source Source of the event (e.g., 'identity_verification', 'neural_network')
   * @param eventType Type of event (from EventTypes enum)
   * @param payload Event data
   */
  async processEvent(source, eventType, payload) {
    log(`Processing event from ${source}: ${eventType}`, "webhook");
    try {
      const subscriptions = await storage.getWebhookSubscriptions();
      const matchingSubscriptions = subscriptions.filter(
        (sub) => sub.isActive && (sub.events.includes(eventType) || sub.events.includes("*"))
      );
      if (matchingSubscriptions.length === 0) {
        log(`No active subscriptions found for event ${eventType}`, "webhook");
        return;
      }
      for (const subscription of matchingSubscriptions) {
        try {
          const payloadJson = typeof payload === "string" ? payload : JSON.stringify(payload);
          const delivery = await storage.createWebhookDelivery({
            subscriptionId: subscription.id,
            eventType,
            status: "PENDING",
            payload: payloadJson
          });
          await storage.updateWebhookDeliveryStatus(
            delivery.id,
            "PENDING",
            void 0,
            void 0,
            void 0
          );
          let filteredPayload = payload;
          if (payload.userId) {
            filteredPayload = await this.applyTrustBasedFiltering(payload, subscription);
          }
          await this.deliverWebhook(delivery.id, subscription, {
            id: delivery.id,
            source,
            eventType,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            data: filteredPayload
          });
        } catch (error) {
          log(`Error processing webhook for subscription ${subscription.id}: ${error instanceof Error ? error.message : String(error)}`, "webhook");
        }
      }
    } catch (error) {
      log(`Error processing event ${eventType}: ${error instanceof Error ? error.message : String(error)}`, "webhook");
    }
  }
  /**
   * Apply trust-based filtering to webhook payload based on Fibonacci trust levels
   * @param payload Original payload
   * @param subscription Webhook subscription
   * @returns Filtered payload
   */
  async applyTrustBasedFiltering(payload, subscription) {
    if (!payload.userId) {
      return payload;
    }
    try {
      const trustScore = await storage.getTrustScore(payload.userId);
      if (!trustScore) {
        return this.filterSensitiveData(payload, 0);
      }
      return this.filterSensitiveData(payload, trustScore.level);
    } catch (error) {
      log(`Error applying trust-based filtering: ${error instanceof Error ? error.message : String(error)}`, "webhook");
      return this.filterSensitiveData(payload, 0);
    }
  }
  /**
   * Filter sensitive data based on trust level
   * @param payload Original payload
   * @param trustLevel Fibonacci trust level (0-21)
   * @returns Filtered payload
   */
  filterSensitiveData(payload, trustLevel) {
    const filteredPayload = { ...payload };
    if (trustLevel < 4) {
      delete filteredPayload.personalData;
      delete filteredPayload.biometricResults;
      delete filteredPayload.financialData;
      delete filteredPayload.securityDetails;
      delete filteredPayload.medicalInfo;
      delete filteredPayload.detailedHistory;
    } else if (trustLevel < 8) {
      if (filteredPayload.personalData) {
        const redactedPersonalData = { ...filteredPayload.personalData };
        if (redactedPersonalData.ssn) redactedPersonalData.ssn = "***-**-" + (redactedPersonalData.ssn.slice(-4) || "****");
        if (redactedPersonalData.dob) redactedPersonalData.dob = "****-**-**";
        if (redactedPersonalData.address) redactedPersonalData.address = "[REDACTED]";
        filteredPayload.personalData = redactedPersonalData;
      }
      delete filteredPayload.biometricResults;
      delete filteredPayload.financialData;
    } else if (trustLevel < 13) {
      if (filteredPayload.financialData) {
        const redactedFinancialData = { ...filteredPayload.financialData };
        if (redactedFinancialData.accountNumber) redactedFinancialData.accountNumber = "****" + (redactedFinancialData.accountNumber.slice(-4) || "****");
        filteredPayload.financialData = redactedFinancialData;
      }
    }
    return filteredPayload;
  }
  /**
   * Process a universal webhook
   * @param source Source of the webhook
   * @param payload Request body
   * @param headers Request headers
   * @returns Processing result
   */
  async processUniversalWebhook(source, payload, headers) {
    const subscriptions = await storage.getWebhookSubscriptions();
    let subscriptionId = 1;
    if (subscriptions.length > 0) {
      subscriptionId = subscriptions[0].id;
    }
    const delivery = await storage.createWebhookDelivery({
      subscriptionId,
      eventType: payload.eventType || "unknown",
      status: "RECEIVED",
      payload: typeof payload === "string" ? JSON.parse(payload) : payload
    });
    return delivery;
  }
  /**
   * Import webhook subscriptions from a CSV file
   * @param filepath Path to the CSV file
   * @returns Number of imported subscriptions
   */
  async importWebhooks(fileBuffer) {
    return new Promise((resolve, reject) => {
      const subscriptions = [];
      csv.parseString(fileBuffer.toString(), { headers: true }).on("error", (error) => reject(error)).on("data", (row) => subscriptions.push(row)).on("end", async () => {
        try {
          let importCount = 0;
          for (const sub of subscriptions) {
            try {
              await storage.createWebhookSubscription({
                name: sub.name || `Webhook ${importCount + 1}`,
                url: sub.url,
                events: sub.events.split(",").map((e) => e.trim()),
                isActive: sub.isActive === "true" || sub.active === "true",
                secret: sub.secret || "secret",
                partnerId: sub.partnerId ? parseInt(sub.partnerId) : null,
                headers: {}
              });
              importCount++;
            } catch (error) {
              log(`Error importing webhook subscription: ${error instanceof Error ? error.message : String(error)}`, "webhook");
            }
          }
          resolve(importCount);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  /**
   * Export webhook subscriptions to a CSV file
   * @param filter Optional filter
   * @returns Path to the exported file
   */
  async exportWebhooks(filter) {
    const subscriptions = await storage.getWebhookSubscriptions();
    const exportPath = path3.join("exports", `webhook-subscriptions-${Date.now()}.csv`);
    if (!fs2.existsSync("exports")) {
      fs2.mkdirSync("exports", { recursive: true });
    }
    return new Promise((resolve, reject) => {
      const csvStream = csv.format({ headers: true });
      const writeStream = fs2.createWriteStream(exportPath);
      writeStream.on("finish", () => resolve(exportPath));
      writeStream.on("error", reject);
      csvStream.pipe(writeStream);
      for (const sub of subscriptions) {
        csvStream.write({
          id: sub.id.toString(),
          name: sub.name,
          url: sub.url,
          events: sub.events.join(","),
          isActive: sub.isActive.toString(),
          partnerId: sub.partnerId?.toString() || "",
          secret: sub.secret || ""
        });
      }
      csvStream.end();
    });
  }
  /**
   * Import webhook subscriptions from a CSV file
   * @param filepath Path to the CSV file
   * @returns Number of imported subscriptions
   */
  async importSubscriptionsFromCsv(filepath) {
    const fileBuffer = await fs2.promises.readFile(filepath);
    return this.importWebhooks(fileBuffer);
  }
  /**
   * Export webhook data to a CSV file
   * @param filter Optional filter
   * @returns Path to the exported file
   */
  async exportWebhookDataToCsv(filter) {
    return this.exportWebhooks(filter);
  }
};
var universalWebhookManager = new UniversalWebhookManager();

// server/services/webhook.ts
var WebhookService = class {
  /**
   * Process an incoming webhook from any source
   * @param source The source of the webhook (e.g., 'xano', 'notion')
   * @param body Webhook request body
   * @param headers Webhook request headers
   * @returns The processed webhook delivery
   */
  static async processIncomingWebhook(source, body, headers) {
    try {
      log(`Processing incoming webhook from source: ${source}`, "webhook");
      return await universalWebhookManager.processUniversalWebhook(source, body, headers);
    } catch (error) {
      log(`Error processing webhook from ${source}: ${error instanceof Error ? error.message : "Unknown error"}`, "webhook");
      throw error;
    }
  }
  /**
   * Test a webhook by sending a test event
   * @param subscriptionId The ID of the webhook subscription
   * @param eventType The event type to test
   * @param payload The payload to send
   * @returns The delivery record
   */
  static async testWebhook(subscriptionId, eventType, payload) {
    try {
      log(`Testing webhook subscription ${subscriptionId} with event ${eventType}`, "webhook");
      return await universalWebhookManager.testWebhook(subscriptionId, eventType, payload);
    } catch (error) {
      log(`Error testing webhook ${subscriptionId}: ${error instanceof Error ? error.message : "Unknown error"}`, "webhook");
      throw error;
    }
  }
  /**
   * Import webhook subscriptions from a CSV file
   * @param fileBuffer The CSV file as a buffer
   * @returns Number of imported subscriptions
   */
  static async importWebhookSubscriptions(fileBuffer) {
    try {
      log("Importing webhook subscriptions from CSV", "webhook");
      return await universalWebhookManager.importWebhooks(fileBuffer);
    } catch (error) {
      log(`Error importing webhook subscriptions: ${error instanceof Error ? error.message : "Unknown error"}`, "webhook");
      throw error;
    }
  }
  /**
   * Export webhook subscriptions to a CSV file
   * @returns The path to the exported file
   */
  static async exportWebhookSubscriptions() {
    try {
      log("Exporting webhook subscriptions to CSV", "webhook");
      return await universalWebhookManager.exportWebhooks();
    } catch (error) {
      log(`Error exporting webhook subscriptions: ${error instanceof Error ? error.message : "Unknown error"}`, "webhook");
      throw error;
    }
  }
  /**
   * Deliver webhook notifications to all active subscriptions for a specific event type
   * @param eventType Event type to deliver
   * @param payload The payload to deliver
   * @returns The created delivery record
   */
  static async deliverToSubscriptions(eventType, payload) {
    try {
      log(`Delivering webhooks for event: ${eventType}`, "webhook");
      const subscriptions = await storage.getWebhookSubscriptions();
      const matchingSubscriptions = subscriptions.filter(
        (sub) => sub.isActive && sub.events.includes(eventType)
      );
      log(`Found ${matchingSubscriptions.length} subscriptions for event ${eventType}`, "webhook");
      const subscription = matchingSubscriptions[0];
      const subscriptionId = subscription?.id || 1;
      const delivery = await storage.createWebhookDelivery({
        subscriptionId,
        eventType,
        status: "PENDING",
        payload: typeof payload === "string" ? JSON.parse(payload) : payload
      });
      await storage.updateWebhookDeliveryStatus(
        delivery.id,
        "DELIVERED",
        200,
        JSON.stringify({ success: true })
      );
      return delivery;
    } catch (error) {
      log(`Error delivering webhooks for event ${eventType}: ${error instanceof Error ? error.message : "Unknown error"}`, "webhook");
      throw error;
    }
  }
};

// server/services/integrations/xano.ts
import axios2 from "axios";
var XanoIntegration = class {
  static apiKey = null;
  static baseUrl = "https://x8ki-letl-twmt.n7.xano.io/api:";
  /**
   * Set the API key for Xano API authentication
   * @param apiKey API key for Xano
   */
  static setApiKey(apiKey) {
    this.apiKey = apiKey;
    log("Xano API key set", "xano");
  }
  /**
   * Test the connection to Xano API
   * @returns Whether connection is successful
   */
  static async testConnection() {
    if (!this.apiKey) {
      log("Cannot test connection without API key", "xano");
      return false;
    }
    try {
      const response = await axios2.get(`${this.baseUrl}/v1/auth/test`, {
        headers: this.getHeaders()
      });
      return response.status === 200;
    } catch (error) {
      log(`Xano connection test failed: ${error instanceof Error ? error.message : String(error)}`, "xano");
      return false;
    }
  }
  /**
   * Get API metadata from Xano
   * @returns API metadata
   */
  static async getApiMetadata() {
    if (!this.apiKey) {
      throw new Error("API key not set");
    }
    try {
      const response = await axios2.get(`${this.baseUrl}/v1/meta`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      log(`Failed to get API metadata: ${error instanceof Error ? error.message : String(error)}`, "xano");
      throw error;
    }
  }
  /**
   * Get all tables from Xano database
   * @returns List of tables
   */
  static async getTables() {
    if (!this.apiKey) {
      throw new Error("API key not set");
    }
    try {
      const response = await axios2.get(`${this.baseUrl}/v1/tables`, {
        headers: this.getHeaders()
      });
      return response.data.tables || [];
    } catch (error) {
      log(`Failed to get tables: ${error instanceof Error ? error.message : String(error)}`, "xano");
      throw error;
    }
  }
  /**
   * Get table schema from Xano
   * @param tableId Table ID
   * @returns Table schema
   */
  static async getTableSchema(tableId) {
    if (!this.apiKey) {
      throw new Error("API key not set");
    }
    try {
      const response = await axios2.get(`${this.baseUrl}/v1/tables/${tableId}`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      log(`Failed to get table schema: ${error instanceof Error ? error.message : String(error)}`, "xano");
      throw error;
    }
  }
  /**
   * Process a webhook from Xano
   * @param headers Request headers
   * @param payload Request body
   * @returns Normalized webhook data
   */
  static processWebhook(headers, payload) {
    const xanoEvent = headers["x-xano-event"] || payload.event_type || "data.updated";
    const xanoHmac = headers["x-xano-hmac"];
    const xanoInstance = headers["x-xano-source"] || "x8ki-letl-twmt.n7.xano.io";
    const isPinkSync = payload.source === "pinksync" || payload.metadata && payload.metadata.source === "pinksync" || payload.data && payload.data.source === "pinksync" || headers["x-pinksync-signature"] !== void 0;
    let eventType = xanoEvent;
    let source = "xano";
    if (isPinkSync) {
      eventType = payload.event || payload.action || payload.event_type || "pinksync.event";
      source = "pinksync";
      log(`Processing PinkSync webhook via Xano: ${eventType}`, "pinksync");
    } else {
      log(`Processing Xano webhook: ${xanoEvent} from ${xanoInstance}`, "xano");
    }
    return {
      source,
      eventType,
      timestamp: payload.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
      sourceInstance: xanoInstance,
      payload: {
        ...payload,
        _meta: {
          instance: xanoInstance,
          eventType,
          hmacProvided: !!xanoHmac,
          isPinkSync
        }
      }
    };
  }
  /**
   * Get headers for Xano API requests
   * @returns Headers with API key
   */
  static getHeaders() {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`
    };
  }
};

// server/auth.ts
function requiresDeveloper(req, res, next) {
  next();
}
function setupAuth(app2) {
  console.log("Auth setup simplified for development");
}

// server/services/pinksync-integration.ts
var PinkSyncIntegration = class {
  baseUrl;
  deafAuthUrl;
  fibonRoseUrl;
  apiKey;
  constructor() {
    this.baseUrl = process.env.PINKSYNC_API_URL || "https://api.pinksync.io/v2";
    this.deafAuthUrl = process.env.DEAFAUTH_API_URL || "https://deafauth.pinksync.io/v1";
    this.fibonRoseUrl = process.env.FIBONROSE_API_URL || "https://fibonrose.mbtquniverse.com/v1";
    this.apiKey = process.env.PINKSYNC_API_KEY || "";
  }
  /**
   * Create visual feedback for deaf users
   */
  createVisualFeedback(type) {
    const feedbackMap = {
      success: {
        icon: "check-circle",
        color: "green",
        animation: "bounce",
        vibration: true
      },
      error: {
        icon: "x-circle",
        color: "red",
        animation: "shake",
        vibration: true
      },
      warning: {
        icon: "alert-triangle",
        color: "orange",
        animation: "pulse",
        vibration: true
      },
      info: {
        icon: "info",
        color: "blue",
        animation: "fade",
        vibration: false
      }
    };
    return feedbackMap[type];
  }
  /**
   * Authenticate user with DeafAuth
   */
  async authenticateWithDeafAuth(credentials) {
    try {
      const response = await fetch(`${this.deafAuthUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PinkSync-Key": this.apiKey
        },
        body: JSON.stringify(credentials)
      });
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("DeafAuth authentication error:", error);
      throw new Error("Failed to authenticate with DeafAuth");
    }
  }
  /**
   * Submit verification for trust badge
   */
  async submitVerification(submission) {
    try {
      const response = await fetch(`${this.fibonRoseUrl}/verification/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PinkSync-Key": this.apiKey
        },
        body: JSON.stringify(submission)
      });
      if (!response.ok) {
        throw new Error(`Verification submission failed: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Verification submission error:", error);
      throw new Error("Failed to submit verification");
    }
  }
  /**
   * Get user's trust badges
   */
  async getUserTrustBadges(userId) {
    try {
      const response = await fetch(`${this.fibonRoseUrl}/users/${userId}/badges`, {
        headers: {
          "X-PinkSync-Key": this.apiKey
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch badges: ${response.statusText}`);
      }
      const data = await response.json();
      return data.badges || [];
    } catch (error) {
      console.error("Error fetching trust badges:", error);
      return [];
    }
  }
  /**
   * Update user accessibility preferences
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/preferences`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-PinkSync-Key": this.apiKey
        },
        body: JSON.stringify(preferences)
      });
      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.statusText}`);
      }
      const data = await response.json();
      return data.preferences;
    } catch (error) {
      console.error("Error updating preferences:", error);
      throw new Error("Failed to update user preferences");
    }
  }
  /**
   * Send notification with visual feedback
   */
  async sendNotification(notification) {
    try {
      const visual_feedback = this.createVisualFeedback(notification.visual_feedback_type);
      const response = await fetch(`${this.baseUrl}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PinkSync-Key": this.apiKey
        },
        body: JSON.stringify({
          ...notification,
          visual_feedback
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to send notification: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw new Error("Failed to send notification");
    }
  }
  /**
   * Process video for ASL detection and accessibility
   */
  async processVideo(videoData) {
    try {
      const response = await fetch(`${this.baseUrl}/videos/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PinkSync-Key": this.apiKey
        },
        body: JSON.stringify(videoData)
      });
      if (!response.ok) {
        throw new Error(`Video upload failed: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Video processing error:", error);
      throw new Error("Failed to process video");
    }
  }
  /**
   * Get device interface configuration for accessibility
   */
  async getDeviceInterface(platform) {
    try {
      const response = await fetch(`${this.baseUrl}/interface/device/${platform}`, {
        headers: {
          "X-PinkSync-Key": this.apiKey
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to get interface config: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error getting device interface:", error);
      return {
        accessibility_features: ["high_contrast", "large_text", "visual_feedback"],
        ui_components: {},
        interaction_modes: ["touch", "gesture", "voice"]
      };
    }
  }
  /**
   * Track progress for deaf user onboarding
   */
  async updateTaskProgress(taskId, percentComplete, status) {
    try {
      const response = await fetch(`${this.baseUrl}/progress/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-PinkSync-Key": this.apiKey
        },
        body: JSON.stringify({
          percent_complete: percentComplete,
          status: status || "in_progress",
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to update progress: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error updating task progress:", error);
    }
  }
  /**
   * Generate PinkSync-compatible error response
   */
  createErrorResponse(code, message, details) {
    return {
      status: "error",
      code,
      message,
      details,
      visual_feedback: this.createVisualFeedback("error")
    };
  }
  /**
   * Generate PinkSync-compatible success response
   */
  createSuccessResponse(data, message) {
    return {
      status: "success",
      data,
      message,
      visual_feedback: this.createVisualFeedback("success")
    };
  }
};
var pinkSyncService = new PinkSyncIntegration();

// server/services/deaf-first-integration.ts
var DeafFirstIntegration = class {
  /**
   * Get user accessibility preferences
   */
  async getUserAccessibilityPreferences(userId) {
    return {
      userId,
      signLanguage: "asl",
      captionSettings: {
        fontSize: 16,
        fontFamily: "Arial",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
        position: "bottom"
      },
      visualAlerts: true,
      vibrationFeedback: true,
      highContrast: false,
      largeText: false,
      reducedMotion: false
    };
  }
  /**
   * Update user accessibility preferences
   */
  async updateAccessibilityPreferences(userId, preferences) {
    const current = await this.getUserAccessibilityPreferences(userId);
    const updated = { ...current, ...preferences };
    console.log(`Updated accessibility preferences for user ${userId}`);
    return updated;
  }
  /**
   * Process sign language recognition
   */
  async recognizeSignLanguage(videoData, language = "asl") {
    return {
      text: "Hello, how are you today?",
      confidence: 0.95,
      timestamps: [
        { start: 0, end: 1.2, word: "Hello" },
        { start: 1.5, end: 2.1, word: "how" },
        { start: 2.2, end: 2.6, word: "are" },
        { start: 2.7, end: 3, word: "you" },
        { start: 3.2, end: 4, word: "today" }
      ],
      gestureData: []
    };
  }
  /**
   * Get available sign language gesture library
   */
  async getGestureLibrary(language) {
    const gestureLibraries = {
      asl: [
        { gesture: "hello", description: "Greeting gesture", videoUrl: "/gestures/asl/hello.mp4" },
        { gesture: "thank_you", description: "Expression of gratitude", videoUrl: "/gestures/asl/thank_you.mp4" },
        { gesture: "please", description: "Polite request", videoUrl: "/gestures/asl/please.mp4" },
        { gesture: "help", description: "Request for assistance", videoUrl: "/gestures/asl/help.mp4" }
      ],
      bsl: [
        { gesture: "hello", description: "Greeting gesture", videoUrl: "/gestures/bsl/hello.mp4" },
        { gesture: "thank_you", description: "Expression of gratitude", videoUrl: "/gestures/bsl/thank_you.mp4" }
      ],
      isl: [
        { gesture: "hello", description: "Greeting gesture", videoUrl: "/gestures/isl/hello.mp4" },
        { gesture: "thank_you", description: "Expression of gratitude", videoUrl: "/gestures/isl/thank_you.mp4" }
      ]
    };
    return gestureLibraries[language] || [];
  }
  /**
   * Process live captioning
   */
  async processLiveCaptions(audioData, language = "en-US") {
    return [
      {
        id: "seg_1",
        startTime: 0,
        endTime: 3.5,
        text: "Welcome to the accessibility demonstration.",
        confidence: 0.98
      },
      {
        id: "seg_2",
        startTime: 4,
        endTime: 7.2,
        text: "This platform supports real-time captioning.",
        confidence: 0.96
      },
      {
        id: "seg_3",
        startTime: 8,
        endTime: 11.5,
        text: "All features are designed with deaf users in mind.",
        confidence: 0.94
      }
    ];
  }
  /**
   * Export captions in various formats
   */
  async exportCaptions(segments, format2) {
    switch (format2) {
      case "srt":
        return segments.map((seg, index) => {
          const startTime = this.formatSRTTime(seg.startTime);
          const endTime = this.formatSRTTime(seg.endTime);
          return `${index + 1}
${startTime} --> ${endTime}
${seg.text}
`;
        }).join("\n");
      case "vtt":
        const vttHeader = "WEBVTT\n\n";
        const vttContent = segments.map((seg) => {
          const startTime = this.formatVTTTime(seg.startTime);
          const endTime = this.formatVTTTime(seg.endTime);
          return `${startTime} --> ${endTime}
${seg.text}
`;
        }).join("\n");
        return vttHeader + vttContent;
      case "txt":
        return segments.map((seg) => seg.text).join(" ");
      default:
        return segments.map((seg) => seg.text).join(" ");
    }
  }
  /**
   * Find available interpreters
   */
  async findInterpreters(language, urgency = "normal") {
    return [
      { id: "int_1", name: "Sarah Johnson", language: "asl", rating: 4.9, available: true },
      { id: "int_2", name: "Michael Chen", language: "asl", rating: 4.8, available: true },
      { id: "int_3", name: "Emily Rodriguez", language: "asl", rating: 4.7, available: false }
    ].filter((interpreter) => interpreter.language === language);
  }
  /**
   * Request interpreter session
   */
  async requestInterpreterSession(language, urgency, duration) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Created interpreter session ${sessionId} for ${language}, duration: ${duration} minutes`);
    return sessionId;
  }
  /**
   * Check color contrast accessibility
   */
  async checkColorContrast(foreground, background) {
    const ratio = 7.5;
    return {
      ratio,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7
    };
  }
  /**
   * Perform accessibility audit
   */
  async performAccessibilityAudit(url) {
    return {
      score: 95,
      issues: [
        {
          type: "missing_alt_text",
          severity: "medium",
          description: "Image missing alternative text",
          element: "img.profile-picture",
          recommendation: "Add descriptive alt text for screen readers"
        }
      ],
      compliance: {
        wcag21aa: true,
        section508: true,
        ada: true
      }
    };
  }
  /**
   * Create communication session
   */
  async createCommunicationSession(mode, participants, features = []) {
    const sessionId = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Created communication session ${sessionId} with mode: ${mode}, participants: ${participants.length}, features: ${features.join(", ")}`);
    return sessionId;
  }
  /**
   * Search community resources
   */
  async searchCommunityResources(query, type) {
    const allResources = [
      {
        id: "res_1",
        title: "ASL Learning Resources",
        type: "educational",
        description: "Comprehensive ASL learning materials and video tutorials",
        url: "https://example.com/asl-resources",
        language: "asl",
        accessibilityLevel: "beginner"
      },
      {
        id: "res_2",
        title: "Deaf Community Support Group",
        type: "support_group",
        description: "Weekly online meetings for deaf community members",
        location: "Online",
        language: "asl",
        accessibilityLevel: "intermediate"
      },
      {
        id: "res_3",
        title: "Professional Interpreter Network",
        type: "interpreter",
        description: "Certified ASL interpreters for business and medical settings",
        url: "https://example.com/interpreters",
        language: "asl",
        accessibilityLevel: "advanced"
      }
    ];
    let filtered = allResources;
    if (type) {
      filtered = filtered.filter((resource) => resource.type === type);
    }
    if (query) {
      filtered = filtered.filter(
        (resource) => resource.title.toLowerCase().includes(query.toLowerCase()) || resource.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    return filtered;
  }
  /**
   * Find support groups
   */
  async findSupportGroups(location = "online", language = "asl") {
    return [
      {
        id: "group_1",
        name: "ASL Learners Circle",
        location: "online",
        language: "asl",
        schedule: "Wednesdays 7PM EST"
      },
      {
        id: "group_2",
        name: "Deaf Professionals Network",
        location: "online",
        language: "asl",
        schedule: "First Friday of each month"
      },
      {
        id: "group_3",
        name: "Parents of Deaf Children",
        location: "online",
        language: "asl",
        schedule: "Bi-weekly Saturdays"
      }
    ].filter(
      (group) => (location === "online" || group.location === location) && group.language === language
    );
  }
  /**
   * Create DeafAuth session
   */
  async createDeafAuthSession(userId) {
    const sessionId = `deaf_auth_${Date.now()}_${userId}`;
    const token = `token_${Math.random().toString(36).substr(2, 32)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString();
    return {
      sessionId,
      token,
      expiresAt
    };
  }
  // Helper methods
  formatSRTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor(seconds % 1 * 1e3);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${milliseconds.toString().padStart(3, "0")}`;
  }
  formatVTTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.padStart(6, "0")}`;
  }
};
var deafFirstService = new DeafFirstIntegration();

// server/services/integrations/negrarosa-auth0.ts
import axios3 from "axios";
var NegraRosaAuth0Integration = class {
  domain;
  clientId;
  clientSecret;
  apiToken = null;
  tokenExpiry = null;
  constructor() {
    this.domain = process.env.AUTH0_DOMAIN || "";
    this.clientId = process.env.AUTH0_CLIENT_ID || "";
    this.clientSecret = process.env.AUTH0_CLIENT_SECRET || "";
    if (!this.domain || !this.clientId || !this.clientSecret) {
      console.warn("NegraRosa Auth0 Integration: Missing Auth0 configuration");
    }
  }
  /**
   * Get Auth0 Management API token
   */
  async getApiToken() {
    if (this.apiToken && this.tokenExpiry && this.tokenExpiry > /* @__PURE__ */ new Date()) {
      return this.apiToken;
    }
    try {
      const response = await axios3.post(`https://${this.domain}/oauth/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        audience: `https://${this.domain}/api/v2/`,
        grant_type: "client_credentials"
      });
      const data = response.data;
      this.apiToken = data.access_token;
      const expiresInMs = (data.expires_in - 60) * 1e3;
      this.tokenExpiry = new Date(Date.now() + expiresInMs);
      return this.apiToken;
    } catch (error) {
      console.error("Failed to get Auth0 Management API token:", error);
      throw new Error("Failed to authenticate with Auth0 Management API");
    }
  }
  /**
   * Verify user identity through Auth0
   */
  async verifyUserIdentity(userId) {
    try {
      const user = await storage.getUser(userId);
      if (!user || !user.auth0Sub) {
        return false;
      }
      const token = await this.getApiToken();
      const response = await axios3.get(
        `https://${this.domain}/api/v2/users/${encodeURIComponent(user.auth0Sub)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const auth0User = response.data;
      if (auth0User.email_verified) {
        const verifications2 = await storage.getVerifications(userId);
        const emailVerification = verifications2.find((v) => v.typeId === 2);
        if (emailVerification && emailVerification.status !== "VERIFIED") {
          await storage.updateVerificationStatus(emailVerification.id, "VERIFIED", "auth0");
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error verifying user identity with Auth0:", error);
      return false;
    }
  }
  /**
   * Log security event to NegraRosa Security Framework
   */
  async logSecurityEvent(event) {
    try {
      const webhookSubscriptions2 = await storage.getWebhookSubscriptions();
      const securityWebhooks = webhookSubscriptions2.filter(
        (sub) => sub.events.includes("SECURITY_EVENT")
      );
      for (const webhook of securityWebhooks) {
        try {
          const response = await axios3.post(webhook.url, {
            event: "SECURITY_EVENT",
            data: event
          });
          await storage.createWebhookDelivery({
            subscriptionId: webhook.id,
            event: "SECURITY_EVENT",
            payload: JSON.stringify(event),
            status: "SUCCESS",
            statusCode: response.status,
            response: JSON.stringify(response.data),
            createdAt: /* @__PURE__ */ new Date()
          });
        } catch (error) {
          await storage.createWebhookDelivery({
            subscriptionId: webhook.id,
            event: "SECURITY_EVENT",
            payload: JSON.stringify(event),
            status: "FAILED",
            statusCode: error.response?.status || 0,
            errorMessage: error.message,
            createdAt: /* @__PURE__ */ new Date()
          });
        }
      }
    } catch (error) {
      console.error("Error logging security event:", error);
    }
  }
  /**
   * Evaluate user's security risk based on Auth0 profile and login patterns
   */
  async evaluateSecurityRisk(userId) {
    try {
      const user = await storage.getUser(userId);
      if (!user || !user.auth0Sub) {
        return 0.7;
      }
      const token = await this.getApiToken();
      const logsResponse = await axios3.get(
        `https://${this.domain}/api/v2/users/${encodeURIComponent(user.auth0Sub)}/logs`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const logs = logsResponse.data;
      let riskScore = 0.5;
      if (user.emailVerified) {
        riskScore -= 0.2;
      }
      const successfulLogins = logs.filter(
        (log2) => log2.type === "s" && log2.details?.type === "ss"
      );
      if (successfulLogins.length > 5) {
        riskScore -= 0.1;
      }
      const failedLogins = logs.filter(
        (log2) => log2.type === "f"
      );
      if (failedLogins.length > 0) {
        riskScore += 0.1 * Math.min(failedLogins.length, 5);
      }
      return Math.max(0, Math.min(1, riskScore));
    } catch (error) {
      console.error("Error evaluating security risk with Auth0:", error);
      return 0.5;
    }
  }
  /**
   * Middleware to check if user has developer role through Auth0
   */
  checkDeveloperAccess(req, res, next) {
    if (!req.oidc?.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const auth0User = req.oidc.user;
    if (req.user?.role === "developer" || req.user?.role === "admin") {
      return next();
    }
    const appMetadata = auth0User["https://your-namespace/app_metadata"] || {};
    const userRoles = appMetadata.roles || [];
    if (userRoles.includes("developer") || userRoles.includes("admin")) {
      if (req.user && req.user.id) {
      }
      return next();
    }
    return res.status(403).json({
      error: "Access denied",
      message: "You need developer permissions to access this resource"
    });
  }
};
var negraRosaAuth0 = new NegraRosaAuth0Integration();

// server/services/polyglot-router.ts
import axios4 from "axios";
var PolyglotRouter = class {
  services = /* @__PURE__ */ new Map();
  constructor() {
    this.initializeServices();
  }
  initializeServices() {
    this.services.set("express-main", {
      name: "Express Main Service",
      url: process.env.EXPRESS_SERVICE_URL || "http://localhost:5000",
      type: "express",
      healthEndpoint: "/api/health",
      capabilities: [
        "user-management",
        "trust-scoring",
        "verification",
        "nft",
        "webhooks",
        "security",
        "negrarosa-auth"
      ]
    });
    this.services.set("fastapi-accessibility", {
      name: "FastAPI Accessibility Service",
      url: process.env.FASTAPI_SERVICE_URL || "https://fastapi-accessibility-932492320872.us-west1.run.app",
      type: "fastapi",
      healthEndpoint: "/health",
      capabilities: [
        "asl-recognition",
        "live-captions",
        "accessibility-preferences",
        "deaf-first-features",
        "computer-vision",
        "why-verification"
      ]
    });
    this.services.set("django-admin", {
      name: "Django Admin Backend",
      url: process.env.DJANGO_SERVICE_URL || "https://django-admin-932492320872.us-west1.run.app",
      type: "python",
      healthEndpoint: "/health/",
      capabilities: [
        "admin-panel",
        "user-management",
        "data-modeling",
        "django-orm",
        "content-management",
        "django-forms"
      ]
    });
    this.services.set("fibonrose-trust", {
      name: "Fibonrose Trust Main",
      url: "https://fibonrose-trust-932492320872.us-west1.run.app",
      type: "express",
      healthEndpoint: "/health",
      capabilities: ["main-frontend", "user-interface"]
    });
    this.services.set("fibonroseai-pinksync", {
      name: "FibonroseAI PinkSync",
      url: "https://fibonroseai-pinksync-io-932492320872.us-west1.run.app",
      type: "python",
      healthEndpoint: "/health",
      capabilities: ["ai-verification", "pinksync-integration"]
    });
  }
  /**
   * Route request to appropriate service based on capability
   */
  async routeRequest(capability, path5, method, data, headers) {
    const service = this.findServiceByCapability(capability);
    if (!service) {
      throw new Error(`No service found for capability: ${capability}`);
    }
    try {
      const url = `${service.url}${path5}`;
      const config = {
        method,
        url,
        headers: {
          "Content-Type": "application/json",
          "X-Polyglot-Router": "true",
          "X-Source-Service": "express-main",
          ...headers
        },
        timeout: 3e4
      };
      if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
        config.data = data;
      }
      const response = await axios4(config);
      return {
        ...response.data,
        _routing: {
          service: service.name,
          type: service.type,
          capability,
          responseTime: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
    } catch (error) {
      console.error(`Polyglot routing failed for ${capability}:`, error.message);
      throw new Error(`Service ${service.name} unavailable: ${error.message}`);
    }
  }
  /**
   * Find service by capability
   */
  findServiceByCapability(capability) {
    for (const service of this.services.values()) {
      if (service.capabilities.includes(capability)) {
        return service;
      }
    }
    return null;
  }
  /**
   * Get all registered services
   */
  getServices() {
    const services = [];
    for (const service of this.services.values()) {
      services.push(service);
    }
    return services;
  }
  /**
   * Check health of all services
   */
  async checkServicesHealth() {
    const healthStatus = /* @__PURE__ */ new Map();
    const entries = Array.from(this.services.entries());
    for (const [key, service] of entries) {
      try {
        const response = await axios4.get(`${service.url}${service.healthEndpoint}`, {
          timeout: 5e3
        });
        healthStatus.set(key, response.status === 200);
      } catch (error) {
        healthStatus.set(key, false);
      }
    }
    return healthStatus;
  }
  /**
   * Route ASL recognition to FastAPI service
   */
  async routeASLRecognition(imageData, userId, sessionId, confidenceThreshold = 0.7, authHeaders) {
    return this.routeRequest(
      "asl-recognition",
      "/api/accessibility/asl/recognize",
      "POST",
      {
        image_data: imageData,
        user_id: userId,
        session_id: sessionId,
        confidence_threshold: confidenceThreshold
      },
      authHeaders
    );
  }
  /**
   * Route live captions to FastAPI service
   */
  async routeLiveCaptions(userId, audioFormat = "webm", languageCode = "en-US", authHeaders) {
    return this.routeRequest(
      "live-captions",
      "/api/accessibility/captions/start",
      "POST",
      {
        user_id: userId,
        audio_format: audioFormat,
        language_code: languageCode
      },
      authHeaders
    );
  }
  /**
   * Route accessibility preferences to FastAPI service
   */
  async routeAccessibilityPreferences(userId, preferences, authHeaders) {
    return this.routeRequest(
      "accessibility-preferences",
      "/api/accessibility/preferences",
      "POST",
      {
        user_id: userId,
        ...preferences
      },
      authHeaders
    );
  }
  /**
   * Route WHY verification to FastAPI service
   */
  async routeWHYVerification(userId, entityType, entityId, reason, authHeaders) {
    return this.routeRequest(
      "why-verification",
      "/api/security/why-verification",
      "POST",
      {
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        reason
      },
      authHeaders
    );
  }
  /**
   * Route Django admin operations with security controls
   */
  async routeDjangoAdmin(path5, method, data, authHeaders) {
    const allowedPaths = [
      "/admin/",
      "/admin/login/",
      "/admin/logout/",
      "/admin/auth/",
      "/admin/fibonrose/",
      "/admin/verification/",
      "/admin/users/"
    ];
    let djangoPath = path5;
    if (path5.startsWith("/admin/")) {
      djangoPath = path5;
    } else if (path5.startsWith("/api/django/admin/")) {
      djangoPath = path5.replace("/api/django/admin", "/admin");
    } else {
      throw new Error("Invalid Django admin path");
    }
    const isAllowed = allowedPaths.some(
      (allowedPath) => djangoPath.startsWith(allowedPath)
    );
    if (!isAllowed) {
      throw new Error(`Django admin path not allowed: ${djangoPath}`);
    }
    if (djangoPath.includes("..") || djangoPath.includes("//")) {
      throw new Error("Path traversal not allowed");
    }
    return this.routeRequest(
      "admin-panel",
      djangoPath,
      method,
      data,
      authHeaders
    );
  }
  /**
   * Route Django ORM operations with validation
   */
  async routeDjangoORM(modelName, operation, data, authHeaders) {
    const allowedModels = [
      "user",
      "verification",
      "trustscore",
      "nftcard",
      "webhook",
      "notification",
      "datapermission"
    ];
    const allowedOperations = [
      "list",
      "create",
      "update",
      "delete",
      "get",
      "filter"
    ];
    if (!allowedModels.includes(modelName.toLowerCase())) {
      throw new Error(`Model not allowed: ${modelName}`);
    }
    if (!allowedOperations.includes(operation.toLowerCase())) {
      throw new Error(`Operation not allowed: ${operation}`);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(modelName) || !/^[a-zA-Z0-9_]+$/.test(operation)) {
      throw new Error("Invalid model name or operation format");
    }
    return this.routeRequest(
      "django-orm",
      `/api/django/models/${modelName.toLowerCase()}/${operation.toLowerCase()}`,
      "POST",
      data,
      authHeaders
    );
  }
  /**
   * Get polyglot system status
   */
  async getSystemStatus() {
    const healthStatus = await this.checkServicesHealth();
    const services = this.getServices();
    const healthMap = /* @__PURE__ */ new Map();
    for (const [serviceId, isHealthy] of healthStatus.entries()) {
      healthMap.set(serviceId, isHealthy);
    }
    return {
      polyglot_system: "active",
      total_services: services.length,
      services: services.map((service) => {
        const serviceId = Array.from(this.services.keys()).find(
          (id) => this.services.get(id)?.name === service.name
        );
        return {
          name: service.name,
          type: service.type,
          url: service.url,
          capabilities: service.capabilities,
          healthy: serviceId ? healthMap.get(serviceId) || false : false,
          service_id: serviceId
        };
      }),
      negrarosa_integrated: true,
      deaf_first_optimized: true,
      architecture: "microservices",
      backend_technologies: ["express", "fastapi", "django", "python"],
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
};
var polyglotRouter = new PolyglotRouter();

// server/controllers/api/index.ts
import { Router as Router2 } from "express";

// server/controllers/api/v1/index.ts
import { Router } from "express";
var apiV1Router = Router();
apiV1Router.get("/", (req, res) => {
  res.json({
    version: "1.0.0",
    name: "FibonroseTrust API v1",
    endpoints: [
      "/users",
      "/verifications",
      "/trust-scores",
      "/nfts",
      "/webhooks",
      "/security",
      "/integrations"
    ],
    status: "Under active development",
    documentation: "/api/docs"
  });
});
var v1_default = apiV1Router;

// server/controllers/api/index.ts
import path4 from "path";
import fs3 from "fs";
var apiRouter = Router2();
var API_VERSION = "1.0.0";
var API_BASE_PATH = "/api";
apiRouter.use("/v1", v1_default);
apiRouter.get("/", (req, res) => {
  res.redirect("/api/v1");
});
apiRouter.get("/version", (req, res) => {
  res.json({
    version: API_VERSION,
    name: "FibonroseTrust API",
    description: "REST API for FibonroseTrust Decentralized Identity Framework",
    latestVersion: "v1",
    documentation: "/api/docs"
  });
});
apiRouter.get("/docs", (req, res) => {
  res.json({
    title: "FibonroseTrust API Documentation",
    description: "REST API for FibonroseTrust Decentralized Identity Framework",
    version: API_VERSION,
    baseUrl: API_BASE_PATH,
    endpoints: [
      {
        path: "/api/v1/users",
        description: "User management endpoints",
        documentation: "/api/docs/users"
      },
      {
        path: "/api/v1/verifications",
        description: "Verification management endpoints",
        documentation: "/api/docs/verifications"
      },
      {
        path: "/api/v1/trust-scores",
        description: "Trust score management endpoints",
        documentation: "/api/docs/trust-scores"
      },
      {
        path: "/api/v1/nfts",
        description: "NFT management endpoints",
        documentation: "/api/docs/nfts"
      },
      {
        path: "/api/v1/webhooks",
        description: "Webhook management endpoints",
        documentation: "/api/docs/webhooks"
      },
      {
        path: "/api/v1/security",
        description: "Security framework endpoints",
        documentation: "/api/docs/security"
      },
      {
        path: "/api/v1/integrations",
        description: "Third-party integration endpoints",
        documentation: "/api/docs/integrations"
      }
    ]
  });
});
apiRouter.get("/docs/:section", (req, res) => {
  const { section } = req.params;
  const docFile = path4.join(__dirname, "..", "..", "..", "docs", "api", `${section}.json`);
  try {
    if (fs3.existsSync(docFile)) {
      const documentation = JSON.parse(fs3.readFileSync(docFile, "utf8"));
      res.json(documentation);
    } else {
      res.status(404).json({
        error: "Documentation not found",
        message: `No documentation available for ${section}`
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Error loading documentation",
      message: "Documentation file could not be read"
    });
  }
});
var api_default = apiRouter;

// server/routes/deafauth.ts
import { Router as Router3 } from "express";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import jwt from "jsonwebtoken";
var router = Router3();
var sql = neon(process.env.DATABASE_URL);
var JWT_SECRET = process.env.JWT_SECRET || "your-default-secret";
var createSessionSchema = z.object({
  clientId: z.string().min(1),
  domain: z.enum(["healthcare", "legal", "finance"]),
  context: z.string().optional(),
  requiresHumanReview: z.boolean().optional().default(false)
});
var validateDeafIdentitySchema = z.object({
  deafStatus: z.enum(["deaf", "hard_of_hearing", "hearing"]),
  proofType: z.enum(["community", "medical", "self_attestation"]),
  details: z.record(z.any()),
  validatorId: z.string().optional(),
  expiresAt: z.string().optional()
});
var updateAccessibilitySchema = z.object({
  language: z.string().optional(),
  communication: z.string().optional(),
  needs: z.array(z.string()).optional()
});
var visualFeedback = {
  success: (options = {}) => ({
    icon: "check-circle",
    color: "green",
    animation: "pulse",
    vibration: false,
    ...options
  }),
  error: (options = {}) => ({
    icon: "alert-circle",
    color: "red",
    animation: "shake",
    vibration: true,
    ...options
  }),
  warning: (options = {}) => ({
    icon: "alert-triangle",
    color: "orange",
    animation: "pulse",
    vibration: true,
    ...options
  }),
  info: (options = {}) => ({
    icon: "info",
    color: "blue",
    animation: "fade",
    vibration: false,
    ...options
  })
};
function createApiResponse(status, data, feedback, errorCode, message) {
  if (status === "success") {
    return {
      status,
      data,
      visual_feedback: feedback || visualFeedback.success()
    };
  } else {
    return {
      status,
      code: errorCode || "error",
      message: message || "An error occurred",
      visual_feedback: feedback || visualFeedback.error()
    };
  }
}
async function authenticateRequest(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(
        createApiResponse(
          "error",
          void 0,
          visualFeedback.error({ icon: "lock", animation: "shake" }),
          "unauthorized",
          "Access token is missing or invalid"
        )
      );
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const currentTime = Math.floor(Date.now() / 1e3);
    if (decoded.exp && decoded.exp < currentTime) {
      return res.status(401).json(
        createApiResponse(
          "error",
          void 0,
          visualFeedback.error({ icon: "clock", color: "orange" }),
          "token_expired",
          "Access token has expired"
        )
      );
    }
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role || "user"
    };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json(
      createApiResponse(
        "error",
        void 0,
        visualFeedback.error({ icon: "alert-triangle" }),
        "invalid_token",
        "Invalid access token"
      )
    );
  }
}
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await sql`
      SELECT u.*, 
             array_agg(
               DISTINCT jsonb_build_object(
                 'id', v.id,
                 'deaf_status', v.deaf_status,
                 'proof_type', v.proof_type,
                 'validated_at', v.validated_at,
                 'validator_id', v.validator_id
               )
             ) FILTER (WHERE v.id IS NOT NULL) as validations
      FROM deaf_auth_users u
      LEFT JOIN deaf_validations v ON u.id = v.user_id AND v.is_active = true
      WHERE u.id = ${userId}
      GROUP BY u.id
    `;
    if (profile.length === 0) {
      return res.status(404).json(
        createApiResponse(
          "error",
          void 0,
          visualFeedback.warning({ icon: "search" }),
          "user_not_found",
          "User profile not found"
        )
      );
    }
    res.json(createApiResponse("success", profile[0]));
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json(
      createApiResponse(
        "error",
        void 0,
        visualFeedback.error(),
        "server_error",
        "Failed to fetch user profile"
      )
    );
  }
});
router.post("/validate", async (req, res) => {
  try {
    const validationResult = validateDeafIdentitySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(
        createApiResponse(
          "error",
          { errors: validationResult.error.errors },
          visualFeedback.warning(),
          "validation_error",
          "Invalid validation data"
        )
      );
    }
    const { deafStatus, proofType, details, validatorId, expiresAt } = validationResult.data;
    const userId = req.body.userId;
    const validation = await sql`
      INSERT INTO deaf_validations (
        user_id, deaf_status, proof_type, validation_details, 
        validator_id, expires_at
      )
      VALUES (
        ${userId}, ${deafStatus}, ${proofType}, ${JSON.stringify(details)}, 
        ${validatorId || null}, ${expiresAt || null}
      )
      RETURNING *
    `;
    await sql`
      UPDATE deaf_auth_users 
      SET 
        deaf_status = ${deafStatus},
        fibronrose_validated = true,
        deaf_validation_date = NOW(),
        reputation_score = reputation_score + 50
      WHERE id = ${userId}
    `;
    await sql`
      INSERT INTO fibonrose_logs (event_type, user_id, event_data, source)
      VALUES (
        'DEAF_VALIDATION', 
        ${userId}, 
        ${JSON.stringify({ status: deafStatus, validationType: proofType })}, 
        'DeafAUTH'
      )
    `;
    res.json(
      createApiResponse(
        "success",
        validation[0],
        visualFeedback.success({ icon: "check-circle", animation: "pulse" })
      )
    );
  } catch (error) {
    console.error("Error validating identity:", error);
    res.status(500).json(
      createApiResponse(
        "error",
        void 0,
        visualFeedback.error(),
        "validation_failed",
        "Failed to validate identity"
      )
    );
  }
});
router.put("/accessibility/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const validationResult = updateAccessibilitySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(
        createApiResponse(
          "error",
          { errors: validationResult.error.errors },
          visualFeedback.warning(),
          "validation_error",
          "Invalid accessibility data"
        )
      );
    }
    const { language, communication, needs } = validationResult.data;
    const isComplete = language && communication && language !== "unspecified" && communication !== "unspecified";
    const updated = await sql`
      UPDATE deaf_auth_users 
      SET 
        preferred_language = COALESCE(${language}, preferred_language),
        communication_preference = COALESCE(${communication}, communication_preference),
        accessibility_needs = COALESCE(${JSON.stringify(needs)}, accessibility_needs),
        profile_complete = ${isComplete}
      WHERE id = ${userId}
      RETURNING *
    `;
    if (updated.length === 0) {
      return res.status(404).json(
        createApiResponse(
          "error",
          void 0,
          visualFeedback.warning({ icon: "search" }),
          "user_not_found",
          "User not found"
        )
      );
    }
    await sql`
      INSERT INTO pinksync_queue (user_id, sync_type, preferences)
      VALUES (
        ${userId}, 
        'ACCESSIBILITY_UPDATE', 
        ${JSON.stringify(validationResult.data)}
      )
    `;
    res.json(
      createApiResponse(
        "success",
        updated[0],
        visualFeedback.success({ icon: "accessibility", animation: "pulse" })
      )
    );
  } catch (error) {
    console.error("Error updating accessibility:", error);
    res.status(500).json(
      createApiResponse(
        "error",
        void 0,
        visualFeedback.error(),
        "update_failed",
        "Failed to update accessibility preferences"
      )
    );
  }
});
router.post("/dao/grant/:userId", authenticateRequest, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await sql`
      SELECT * FROM deaf_auth_users WHERE id = ${userId}
    `;
    if (user.length === 0) {
      return res.status(404).json(
        createApiResponse(
          "error",
          void 0,
          visualFeedback.warning({ icon: "search" }),
          "user_not_found",
          "User not found"
        )
      );
    }
    if (!user[0].fibronrose_validated) {
      return res.status(400).json(
        createApiResponse(
          "error",
          void 0,
          visualFeedback.warning(),
          "not_validated",
          "User must be validated before DAO membership"
        )
      );
    }
    const updated = await sql`
      UPDATE deaf_auth_users 
      SET 
        dao_member = true,
        magician_permissions = array_append(magician_permissions, 'dao_voter')
      WHERE id = ${userId}
      RETURNING *
    `;
    await sql`
      INSERT INTO fibonrose_logs (event_type, user_id, event_data, source)
      VALUES (
        'DAO_MEMBERSHIP_GRANTED',
        ${userId},
        ${JSON.stringify({ timestamp: (/* @__PURE__ */ new Date()).toISOString() })},
        'DeafAUTH'
      )
    `;
    res.json(
      createApiResponse(
        "success",
        updated[0],
        visualFeedback.success({ icon: "users", animation: "pulse" })
      )
    );
  } catch (error) {
    console.error("Error granting DAO membership:", error);
    res.status(500).json(
      createApiResponse(
        "error",
        void 0,
        visualFeedback.error(),
        "grant_failed",
        "Failed to grant DAO membership"
      )
    );
  }
});
router.get("/sessions", authenticateRequest, async (req, res) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const sessions = await sql`
      SELECT DISTINCT ON (v_code) 
        v_code, session_id, status, created_at, domain, context
      FROM sessions 
      WHERE user_id = ${userId}
      ORDER BY v_code, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const totalResult = await sql`
      SELECT COUNT(DISTINCT v_code) as total
      FROM sessions
      WHERE user_id = ${userId}
    `;
    const total = totalResult[0]?.total || 0;
    res.json(
      createApiResponse("success", {
        sessions,
        total,
        page,
        pages: Math.ceil(total / limit)
      })
    );
  } catch (error) {
    console.error("Error retrieving sessions:", error);
    res.status(500).json(
      createApiResponse(
        "error",
        void 0,
        visualFeedback.error(),
        "server_error",
        "Failed to retrieve sessions"
      )
    );
  }
});
router.post("/vcode/create", authenticateRequest, async (req, res) => {
  try {
    const validationResult = createSessionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(
        createApiResponse(
          "error",
          { errors: validationResult.error.errors },
          visualFeedback.warning(),
          "validation_error",
          "Invalid session data"
        )
      );
    }
    const { clientId, domain, context, requiresHumanReview } = validationResult.data;
    const userId = req.user?.id;
    const vCode = `vc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const session = await sql`
      INSERT INTO sessions (
        user_id, client_id, v_code, domain, context, 
        requires_human_review, status
      )
      VALUES (
        ${userId}, ${clientId}, ${vCode}, ${domain}, ${context},
        ${requiresHumanReview}, 'pending'
      )
      RETURNING *
    `;
    res.json(
      createApiResponse(
        "success",
        session[0],
        visualFeedback.success({ icon: "video", animation: "pulse" })
      )
    );
  } catch (error) {
    console.error("Error creating vCode session:", error);
    res.status(500).json(
      createApiResponse(
        "error",
        void 0,
        visualFeedback.error(),
        "creation_failed",
        "Failed to create vCode session"
      )
    );
  }
});
var deafauth_default = router;

// server/routes.ts
var upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }
  // 10MB limit
});
async function registerRoutes(app2) {
  setupAuth(app2);
  await storage.seedInitialData();
  app2.use("/api", api_default);
  app2.use("/api/deafauth", deafauth_default);
  app2.get("/api/user/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  app2.get("/api/user/username/:username", async (req, res) => {
    const username = req.params.username;
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  app2.post("/api/user", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error });
    }
  });
  app2.get("/api/verification-types", async (_req, res) => {
    const types = await storage.getVerificationTypes();
    res.json(types);
  });
  app2.get("/api/verification-type/:id", async (req, res) => {
    const typeId = parseInt(req.params.id);
    const type = await storage.getVerificationType(typeId);
    if (!type) {
      return res.status(404).json({ message: "Verification type not found" });
    }
    res.json(type);
  });
  app2.post("/api/verification-type", async (req, res) => {
    try {
      const typeData = insertVerificationTypeSchema.parse(req.body);
      const type = await storage.createVerificationType(typeData);
      res.status(201).json(type);
    } catch (error) {
      res.status(400).json({ message: "Invalid verification type data", error });
    }
  });
  app2.get("/api/user/:userId/verifications", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const verifications2 = await storage.getVerifications(userId);
    res.json(verifications2);
  });
  app2.get("/api/verification/:id", async (req, res) => {
    const verificationId = parseInt(req.params.id);
    const verification = await storage.getVerification(verificationId);
    if (!verification) {
      return res.status(404).json({ message: "Verification not found" });
    }
    res.json(verification);
  });
  app2.post("/api/verification", async (req, res) => {
    try {
      const verificationData = insertVerificationSchema.parse(req.body);
      const verification = await storage.createVerification(verificationData);
      res.status(201).json(verification);
    } catch (error) {
      res.status(400).json({ message: "Invalid verification data", error });
    }
  });
  app2.patch("/api/verification/:id/status", async (req, res) => {
    const verificationId = parseInt(req.params.id);
    const { status, verifiedBy } = req.body;
    if (!status || !["PENDING", "VERIFIED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const verification = await storage.updateVerificationStatus(verificationId, status, verifiedBy);
    if (!verification) {
      return res.status(404).json({ message: "Verification not found" });
    }
    res.json(verification);
  });
  app2.get("/api/user/:userId/trust-score", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const trustScore = await storage.getTrustScore(userId);
    if (!trustScore) {
      return res.status(404).json({ message: "Trust score not found" });
    }
    res.json(trustScore);
  });
  app2.post("/api/user/:userId/trust-score/update", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const trustScore = await storage.updateTrustScore(userId);
    if (!trustScore) {
      return res.status(404).json({ message: "Trust score not found" });
    }
    res.json(trustScore);
  });
  app2.get("/api/user/:userId/data-permissions", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const permissions = await storage.getDataPermissions(userId);
    res.json(permissions);
  });
  app2.get("/api/data-permission/:id", async (req, res) => {
    const permissionId = parseInt(req.params.id);
    const permission = await storage.getDataPermission(permissionId);
    if (!permission) {
      return res.status(404).json({ message: "Data permission not found" });
    }
    res.json(permission);
  });
  app2.post("/api/data-permission", async (req, res) => {
    try {
      const permissionData = insertDataPermissionSchema.parse(req.body);
      const permission = await storage.createDataPermission(permissionData);
      res.status(201).json(permission);
    } catch (error) {
      res.status(400).json({ message: "Invalid data permission data", error });
    }
  });
  app2.patch("/api/data-permission/:id", async (req, res) => {
    const permissionId = parseInt(req.params.id);
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ message: "Invalid enabled value" });
    }
    const permission = await storage.updateDataPermission(permissionId, enabled);
    if (!permission) {
      return res.status(404).json({ message: "Data permission not found" });
    }
    res.json(permission);
  });
  app2.post("/api/nft-verification", async (req, res) => {
    const { userId, walletAddress, tokenId } = req.body;
    if (!userId || !walletAddress || !tokenId) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const types = await storage.getVerificationTypes();
    const nftType = types.find((type) => type.name === "nft");
    if (!nftType) {
      return res.status(404).json({ message: "NFT verification type not found" });
    }
    try {
      const verification = await storage.createVerification({
        userId,
        typeId: nftType.id,
        status: "VERIFIED",
        // Auto-verify for simulation
        verifiedBy: "NFT Gateway",
        data: { walletAddress, tokenId }
      });
      res.status(201).json(verification);
    } catch (error) {
      res.status(400).json({ message: "Invalid verification data", error });
    }
  });
  app2.get("/api/user/:userId/notion-integrations", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const integrations = await storage.getNotionIntegrations(userId);
    res.json(integrations);
  });
  app2.post("/api/notion-integration", async (req, res) => {
    try {
      const data = insertNotionIntegrationSchema.parse(req.body);
      const integration = await storage.createNotionIntegration(data);
      res.status(201).json(integration);
    } catch (error) {
      res.status(400).json({ message: "Invalid Notion integration data", error });
    }
  });
  app2.patch("/api/notion-integration/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const integration = await storage.getNotionIntegration(id);
    if (!integration) {
      return res.status(404).json({ message: "Notion integration not found" });
    }
    try {
      const updated = await storage.updateNotionIntegration(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Failed to update Notion integration", error });
    }
  });
  app2.delete("/api/notion-integration/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteNotionIntegration(id);
    if (!success) {
      return res.status(404).json({ message: "Notion integration not found" });
    }
    res.json({ success: true });
  });
  if (!fs4.existsSync("uploads")) {
    fs4.mkdirSync("uploads");
  }
  app2.post("/api/xano/test-connection", async (req, res) => {
    try {
      const { apiKey, baseUrl } = req.body;
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          message: "API key is required"
        });
      }
      XanoIntegration.setApiKey(apiKey);
      const connectionSuccess = await XanoIntegration.testConnection();
      if (connectionSuccess) {
        try {
          const metadata = await XanoIntegration.getApiMetadata();
          return res.status(200).json({
            success: true,
            message: "Successfully connected to Xano API",
            metadata
          });
        } catch (error) {
          return res.status(200).json({
            success: true,
            message: "Connected to Xano API, but metadata retrieval failed"
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Failed to connect to Xano with the provided API key"
        });
      }
    } catch (error) {
      console.error("Error testing Xano connection:", error);
      res.status(500).json({
        success: false,
        message: "Error testing Xano connection",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/api/web3/nft/mint", async (req, res) => {
    try {
      const { userId, walletAddress } = req.body;
      if (!userId || !walletAddress) {
        return res.status(400).json({
          success: false,
          message: "userId and walletAddress are required"
        });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      const nftData = {
        tokenId: `${userId}_${Date.now()}`,
        contractAddress: "0x742d35Cc6634C0532925a3b8D0F63F5C5E4c000B",
        network: "polygon",
        metadataUri: `https://storage.googleapis.com/fibonrose-nft-metadata/metadata/${userId}.json`,
        owner: walletAddress,
        mintedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.status(200).json({
        success: true,
        message: "NFT minting initiated",
        data: nftData
      });
    } catch (error) {
      console.error("Error minting NFT:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mint NFT"
      });
    }
  });
  app2.post("/api/web3/wallet/connect", async (req, res) => {
    try {
      const { walletAddress, signature } = req.body;
      if (!walletAddress || !signature) {
        return res.status(400).json({
          success: false,
          message: "walletAddress and signature are required"
        });
      }
      const walletData = {
        address: walletAddress,
        connected: true,
        connectedAt: (/* @__PURE__ */ new Date()).toISOString(),
        network: "polygon",
        verified: true
      };
      res.status(200).json({
        success: true,
        message: "Wallet connected successfully",
        data: walletData
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      res.status(500).json({
        success: false,
        message: "Failed to connect wallet"
      });
    }
  });
  app2.get("/api/web3/blockchain/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const transactions = [
        {
          hash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
          type: "Identity Verification",
          status: "confirmed",
          timestamp: "2024-01-15T10:30:00Z",
          gasUsed: "0.002",
          blockNumber: 18847291,
          from: address,
          to: "0x742d35Cc6634C0532925a3b8D0F63F5C5E4c000B"
        }
      ];
      res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch transactions"
      });
    }
  });
  app2.get("/api/gcp/status", async (req, res) => {
    try {
      const gcpStatus = {
        cloudFunctions: [
          {
            name: "blockchain-event-handler",
            status: "active",
            url: "https://us-central1-fibonrose-project.cloudfunctions.net/blockchain-events"
          },
          {
            name: "nft-metadata-generator",
            status: "active",
            url: "https://us-central1-fibonrose-project.cloudfunctions.net/nft-metadata"
          },
          {
            name: "trust-score-calculator",
            status: "active",
            url: "https://us-central1-fibonrose-project.cloudfunctions.net/trust-score"
          }
        ],
        pubsubTopics: [
          {
            name: "fibonrose-blockchain-events",
            status: "active"
          }
        ],
        storageBuckets: [
          {
            name: "fibonrose-nft-metadata",
            status: "accessible"
          }
        ],
        projectId: process.env.GCP_PROJECT_ID || "fibonrose-project"
      };
      res.status(200).json({
        success: true,
        data: gcpStatus
      });
    } catch (error) {
      console.error("Error fetching GCP status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch GCP status"
      });
    }
  });
  app2.post("/api/social/sync", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const user = await storage.getUser(userId);
      const trustScore = await storage.getTrustScore(userId);
      if (!user || !trustScore) {
        return res.status(404).json({ message: "User or trust score not found" });
      }
      const socialData = {
        userId: user.id,
        username: user.username,
        trustScore: trustScore.score,
        verificationLevel: trustScore.level,
        socialMediaOptimized: true,
        tiktokReady: trustScore.score >= 3,
        // Level 3+ ready for TikTok
        lastSync: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.status(200).json({
        success: true,
        message: "Social data synchronized for TikTok optimization",
        data: socialData
      });
    } catch (error) {
      console.error("Error syncing social data:", error);
      res.status(500).json({
        message: "Failed to sync social media data",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/social/share-content/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      const trustScore = await storage.getTrustScore(userId);
      if (!user || !trustScore) {
        return res.status(404).json({ message: "User data not found" });
      }
      const isDeaf = user.username === "jane.cooper";
      const deafPrefix = isDeaf ? "\u{1F91F}\u{1F3FD} Deaf & Verified! " : "";
      const deafHashtags = isDeaf ? ["#DeafCommunity", "#DeafPride", "#ASLFluent", "#AccessibilityMatters", "#InclusiveHiring", "#DeafTalent"] : [];
      const shareContent = {
        tiktokCaption: `${deafPrefix}\u2728 Just got Level ${trustScore.level} verified on FibonroseTrust! Trust Score: ${trustScore.score}/21+ \u{1F3AF} #Web3Identity #NFTVerification #TrustScore #FibonroseTrust #DigitalIdentity #Blockchain${deafHashtags.map((tag) => " " + tag).join("")}`,
        instagramCaption: `${deafPrefix}Level ${trustScore.level} verified! \u{1F510} Trust Score: ${trustScore.score}/21+ \u2B50 #Web3 #NFT #DigitalIdentity #Verification #Blockchain${deafHashtags.slice(0, 3).map((tag) => " " + tag).join("")}`,
        twitterCaption: `${deafPrefix}\u{1F389} Achieved Level ${trustScore.level} verification on @FibonroseTrust! Trust Score: ${trustScore.score}/21+ #Web3Identity #NFTVerification${deafHashtags.slice(0, 2).map((tag) => " " + tag).join("")}`,
        hashtagsOptimized: [
          "#Web3Identity",
          "#NFTVerification",
          "#TrustScore",
          "#FibonroseTrust",
          "#DigitalIdentity",
          "#Blockchain",
          "#IdentityNFT",
          "#Web3Verification",
          ...deafHashtags
        ]
      };
      res.status(200).json({
        success: true,
        data: shareContent
      });
    } catch (error) {
      console.error("Error generating share content:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate share content"
      });
    }
  });
  app2.get("/api/deaf/profile/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      const trustScore = await storage.getTrustScore(userId);
      if (!user || !trustScore) {
        return res.status(404).json({ message: "User not found" });
      }
      const deafProfile = {
        userId: user.id,
        username: user.username,
        name: user.name,
        isDeaf: user.username === "jane.cooper",
        aslFluency: "native",
        preferredCommunication: ["ASL", "Text", "Video Relay"],
        trustScore: trustScore.score,
        verificationLevel: trustScore.level,
        communityVouches: 12,
        companyEndorsements: 3,
        badges: ["ASL_FLUENT", "DEAF_COMMUNITY_LEADER", "ACCESSIBILITY_ADVOCATE", "EMERGENCY_VERIFIED"],
        emergencyContactMethod: "text",
        accessibilityFeatures: ["Visual Alerts", "Text-to-Speech", "Video Relay", "Live Captions"],
        profileCompleteness: 95
      };
      res.status(200).json({
        success: true,
        data: deafProfile
      });
    } catch (error) {
      console.error("Error fetching deaf profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch deaf profile"
      });
    }
  });
  app2.post("/api/deaf/community/vouch", async (req, res) => {
    try {
      const { voucherId, voucheeId, message, category } = req.body;
      if (!voucherId || !voucheeId || !message) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const vouch = {
        id: Date.now(),
        voucherId,
        voucheeId,
        message,
        category: category || "general",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        verified: true
      };
      res.status(201).json({
        success: true,
        message: "Community vouch recorded successfully",
        data: vouch
      });
    } catch (error) {
      console.error("Error recording community vouch:", error);
      res.status(500).json({
        success: false,
        message: "Failed to record community vouch"
      });
    }
  });
  app2.post("/api/deaf/emergency/register", async (req, res) => {
    try {
      const { userId, preferredMethod, emergencyContacts, medicalInfo } = req.body;
      if (!userId || !preferredMethod) {
        return res.status(400).json({ message: "User ID and preferred contact method required" });
      }
      const emergencyProfile = {
        userId,
        preferredMethod,
        // 'text', 'email', 'video', 'app'
        emergencyContacts: emergencyContacts || [],
        medicalInfo: medicalInfo || {},
        registeredAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "active",
        verified: true
      };
      res.status(201).json({
        success: true,
        message: "Emergency profile registered successfully",
        data: emergencyProfile
      });
    } catch (error) {
      console.error("Error registering emergency profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to register emergency profile"
      });
    }
  });
  app2.post("/api/deaf/company/hire", async (req, res) => {
    try {
      const { companyId, userId, jobTitle, requirements, accessibilityNeeds } = req.body;
      if (!companyId || !userId || !jobTitle) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const hiringRecord = {
        id: Date.now(),
        companyId,
        userId,
        jobTitle,
        requirements: requirements || [],
        accessibilityNeeds: accessibilityNeeds || [],
        status: "pending",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        specializations: ["deaf_customer_service", "asl_interpretation", "accessibility_consulting"]
      };
      res.status(201).json({
        success: true,
        message: "Hiring request submitted successfully",
        data: hiringRecord
      });
    } catch (error) {
      console.error("Error processing hiring request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process hiring request"
      });
    }
  });
  app2.get("/api/deaf/companies/hiring", async (req, res) => {
    try {
      const hiringCompanies = [
        {
          id: 1,
          name: "TechCorp Solutions",
          positions: ["Customer Support Specialist", "Accessibility Consultant"],
          deafFriendly: true,
          aslSupport: true,
          accessibilityFeatures: ["Video Relay", "Text-based Communication", "Visual Alerts"],
          trustLevel: 5
        },
        {
          id: 2,
          name: "AccessFirst Inc",
          positions: ["ASL Interpreter", "Deaf Services Coordinator"],
          deafFriendly: true,
          aslSupport: true,
          accessibilityFeatures: ["Full ASL Support", "Deaf Management", "Inclusive Environment"],
          trustLevel: 5
        },
        {
          id: 3,
          name: "CommunityBank",
          positions: ["Customer Service Representative", "Financial Advisor"],
          deafFriendly: true,
          aslSupport: false,
          accessibilityFeatures: ["Text Support", "Email Communication"],
          trustLevel: 3
        }
      ];
      res.status(200).json({
        success: true,
        data: hiringCompanies
      });
    } catch (error) {
      console.error("Error fetching hiring companies:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch hiring companies"
      });
    }
  });
  app2.post("/api/deaf/verification/visual-only", async (req, res) => {
    try {
      const { userId, documentType, imageData, videoData } = req.body;
      if (!userId || !documentType) {
        const errorResponse = pinkSyncService.createErrorResponse(
          "validation_error",
          "User ID and document type required",
          { fields: ["userId", "documentType"] }
        );
        return res.status(400).json(errorResponse);
      }
      const verificationSubmission = await pinkSyncService.submitVerification({
        user_id: userId.toString(),
        type: "deaf_creator",
        documents: [
          { type: documentType, data: imageData || videoData }
        ],
        notes: "Visual-only verification - no phone verification required"
      });
      const successResponse = pinkSyncService.createSuccessResponse(
        verificationSubmission,
        "Visual verification submitted successfully - no phone verification required"
      );
      res.status(201).json(successResponse);
    } catch (error) {
      console.error("Error processing visual verification:", error);
      const errorResponse = pinkSyncService.createErrorResponse(
        "server_error",
        "Failed to process visual verification"
      );
      res.status(500).json(errorResponse);
    }
  });
  app2.get("/api/pinksync/interface/:platform", async (req, res) => {
    try {
      const { platform } = req.params;
      const validPlatforms = ["web", "ios", "android", "desktop"];
      if (!validPlatforms.includes(platform)) {
        const errorResponse = pinkSyncService.createErrorResponse(
          "validation_error",
          "Invalid platform specified",
          { validPlatforms }
        );
        return res.status(400).json(errorResponse);
      }
      const interfaceConfig = await pinkSyncService.getDeviceInterface(platform);
      const successResponse = pinkSyncService.createSuccessResponse(interfaceConfig);
      res.status(200).json(successResponse);
    } catch (error) {
      console.error("Error getting interface config:", error);
      const errorResponse = pinkSyncService.createErrorResponse(
        "server_error",
        "Failed to get interface configuration"
      );
      res.status(500).json(errorResponse);
    }
  });
  app2.post("/api/pinksync/notifications", async (req, res) => {
    try {
      const { user_id, type, title, message, data, visual_feedback_type } = req.body;
      if (!user_id || !type || !title || !message) {
        const errorResponse = pinkSyncService.createErrorResponse(
          "validation_error",
          "Missing required notification fields",
          { required: ["user_id", "type", "title", "message"] }
        );
        return res.status(400).json(errorResponse);
      }
      const notification = await pinkSyncService.sendNotification({
        user_id,
        type,
        title,
        message,
        data,
        visual_feedback_type: visual_feedback_type || "info"
      });
      const successResponse = pinkSyncService.createSuccessResponse(
        notification,
        "Notification sent with visual feedback"
      );
      res.status(201).json(successResponse);
    } catch (error) {
      console.error("Error sending notification:", error);
      const errorResponse = pinkSyncService.createErrorResponse(
        "server_error",
        "Failed to send notification"
      );
      res.status(500).json(errorResponse);
    }
  });
  app2.patch("/api/pinksync/users/:userId/preferences", async (req, res) => {
    try {
      const { userId } = req.params;
      const preferences = req.body;
      const updatedPreferences = await pinkSyncService.updateUserPreferences(userId, preferences);
      const successResponse = pinkSyncService.createSuccessResponse(
        { preferences: updatedPreferences },
        "User preferences updated successfully"
      );
      res.status(200).json(successResponse);
    } catch (error) {
      console.error("Error updating preferences:", error);
      const errorResponse = pinkSyncService.createErrorResponse(
        "server_error",
        "Failed to update user preferences"
      );
      res.status(500).json(errorResponse);
    }
  });
  app2.get("/api/pinksync/users/:userId/badges", async (req, res) => {
    try {
      const { userId } = req.params;
      const badges = await pinkSyncService.getUserTrustBadges(userId);
      const successResponse = pinkSyncService.createSuccessResponse(
        { badges },
        "Trust badges retrieved successfully"
      );
      res.status(200).json(successResponse);
    } catch (error) {
      console.error("Error fetching badges:", error);
      const errorResponse = pinkSyncService.createErrorResponse(
        "server_error",
        "Failed to fetch trust badges"
      );
      res.status(500).json(errorResponse);
    }
  });
  app2.post("/api/pinksync/videos/upload", async (req, res) => {
    try {
      const { user_id, title, description, file_data, sign_language } = req.body;
      if (!user_id || !title || !file_data) {
        const errorResponse = pinkSyncService.createErrorResponse(
          "validation_error",
          "Missing required video fields",
          { required: ["user_id", "title", "file_data"] }
        );
        return res.status(400).json(errorResponse);
      }
      const videoResult = await pinkSyncService.processVideo({
        user_id,
        title,
        description,
        file_data,
        sign_language: sign_language || "asl"
      });
      const successResponse = pinkSyncService.createSuccessResponse(
        videoResult,
        "Video uploaded and processing started"
      );
      res.status(201).json(successResponse);
    } catch (error) {
      console.error("Error uploading video:", error);
      const errorResponse = pinkSyncService.createErrorResponse(
        "server_error",
        "Failed to upload video"
      );
      res.status(500).json(errorResponse);
    }
  });
  app2.patch("/api/pinksync/progress/tasks/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const { percent_complete, status } = req.body;
      if (typeof percent_complete !== "number" || percent_complete < 0 || percent_complete > 100) {
        const errorResponse = pinkSyncService.createErrorResponse(
          "validation_error",
          "percent_complete must be a number between 0 and 100"
        );
        return res.status(400).json(errorResponse);
      }
      await pinkSyncService.updateTaskProgress(taskId, percent_complete, status);
      const successResponse = pinkSyncService.createSuccessResponse(
        { task_id: taskId, percent_complete, status },
        "Task progress updated successfully"
      );
      res.status(200).json(successResponse);
    } catch (error) {
      console.error("Error updating task progress:", error);
      const errorResponse = pinkSyncService.createErrorResponse(
        "server_error",
        "Failed to update task progress"
      );
      res.status(500).json(errorResponse);
    }
  });
  app2.get("/api/users/:userId/accessibility-preferences", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const preferences = await deafFirstService.getUserAccessibilityPreferences(userId);
      res.status(200).json(preferences);
    } catch (error) {
      console.error("Error getting accessibility preferences:", error);
      res.status(500).json({ error: "Failed to get accessibility preferences" });
    }
  });
  app2.patch("/api/users/:userId/accessibility-preferences", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const updates = req.body;
      const updatedPreferences = await deafFirstService.updateAccessibilityPreferences(userId, updates);
      res.status(200).json(updatedPreferences);
    } catch (error) {
      console.error("Error updating accessibility preferences:", error);
      res.status(500).json({ error: "Failed to update accessibility preferences" });
    }
  });
  app2.get("/api/deaf-auth/sessions", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId) : 1;
      const session = await deafFirstService.createDeafAuthSession(userId);
      res.status(200).json(session);
    } catch (error) {
      console.error("Error creating deaf auth session:", error);
      res.status(500).json({ error: "Failed to create deaf auth session" });
    }
  });
  app2.post("/api/sign-language/recognize", async (req, res) => {
    try {
      const { videoData, language = "asl" } = req.body;
      if (!videoData) {
        return res.status(400).json({ error: "Video data is required" });
      }
      const result = await deafFirstService.recognizeSignLanguage(videoData, language);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error recognizing sign language:", error);
      res.status(500).json({ error: "Failed to recognize sign language" });
    }
  });
  app2.get("/api/sign-language/gestures/:language", async (req, res) => {
    try {
      const { language } = req.params;
      const gestures = await deafFirstService.getGestureLibrary(language);
      res.status(200).json(gestures);
    } catch (error) {
      console.error("Error getting gesture library:", error);
      res.status(500).json({ error: "Failed to get gesture library" });
    }
  });
  app2.post("/api/captions/process", async (req, res) => {
    try {
      const { audioData, language = "en-US" } = req.body;
      if (!audioData) {
        return res.status(400).json({ error: "Audio data is required" });
      }
      const segments = await deafFirstService.processLiveCaptions(audioData, language);
      res.status(200).json(segments);
    } catch (error) {
      console.error("Error processing captions:", error);
      res.status(500).json({ error: "Failed to process captions" });
    }
  });
  app2.post("/api/captions/export", async (req, res) => {
    try {
      const { segments, format: format2 = "srt" } = req.body;
      if (!segments || !Array.isArray(segments)) {
        return res.status(400).json({ error: "Segments array is required" });
      }
      const exportedContent = await deafFirstService.exportCaptions(segments, format2);
      res.status(200).json({ content: exportedContent, format: format2 });
    } catch (error) {
      console.error("Error exporting captions:", error);
      res.status(500).json({ error: "Failed to export captions" });
    }
  });
  app2.get("/api/interpreters/search", async (req, res) => {
    try {
      const { language = "asl", urgency = "normal" } = req.query;
      const interpreters = await deafFirstService.findInterpreters(language, urgency);
      res.status(200).json(interpreters);
    } catch (error) {
      console.error("Error finding interpreters:", error);
      res.status(500).json({ error: "Failed to find interpreters" });
    }
  });
  app2.post("/api/interpreters/request-session", async (req, res) => {
    try {
      const { language = "asl", urgency = "normal", duration = 30 } = req.body;
      const sessionId = await deafFirstService.requestInterpreterSession(language, urgency, duration);
      res.status(201).json({ sessionId, language, urgency, duration });
    } catch (error) {
      console.error("Error requesting interpreter session:", error);
      res.status(500).json({ error: "Failed to request interpreter session" });
    }
  });
  app2.post("/api/accessibility/color-contrast", async (req, res) => {
    try {
      const { foreground, background } = req.body;
      if (!foreground || !background) {
        return res.status(400).json({ error: "Foreground and background colors are required" });
      }
      const contrastResult = await deafFirstService.checkColorContrast(foreground, background);
      res.status(200).json(contrastResult);
    } catch (error) {
      console.error("Error checking color contrast:", error);
      res.status(500).json({ error: "Failed to check color contrast" });
    }
  });
  app2.post("/api/accessibility/audit", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required for audit" });
      }
      const auditReport = await deafFirstService.performAccessibilityAudit(url);
      res.status(200).json(auditReport);
    } catch (error) {
      console.error("Error performing accessibility audit:", error);
      res.status(500).json({ error: "Failed to perform accessibility audit" });
    }
  });
  app2.post("/api/communication/create-session", async (req, res) => {
    try {
      const { mode, participants = [], features = [] } = req.body;
      if (!mode) {
        return res.status(400).json({ error: "Communication mode is required" });
      }
      const sessionId = await deafFirstService.createCommunicationSession(mode, participants, features);
      res.status(201).json({ sessionId, mode, participants, features });
    } catch (error) {
      console.error("Error creating communication session:", error);
      res.status(500).json({ error: "Failed to create communication session" });
    }
  });
  app2.get("/api/community/resources", async (req, res) => {
    try {
      const { query, type } = req.query;
      const resources = await deafFirstService.searchCommunityResources(query, type);
      res.status(200).json(resources);
    } catch (error) {
      console.error("Error searching community resources:", error);
      res.status(500).json({ error: "Failed to search community resources" });
    }
  });
  app2.get("/api/community/support-groups", async (req, res) => {
    try {
      const { location = "online", language = "asl" } = req.query;
      const groups = await deafFirstService.findSupportGroups(location, language);
      res.status(200).json(groups);
    } catch (error) {
      console.error("Error finding support groups:", error);
      res.status(500).json({ error: "Failed to find support groups" });
    }
  });
  app2.post("/api/webhook/xano", async (req, res) => {
    try {
      const normalizedData = XanoIntegration.processWebhook(
        req.headers,
        req.body
      );
      console.log("Received Xano webhook:", {
        eventType: normalizedData.eventType,
        source: normalizedData.source,
        timestamp: normalizedData.timestamp
      });
      const delivery = await WebhookService.processIncomingWebhook(
        "xano",
        normalizedData.payload,
        req.headers
      );
      res.status(202).json({
        message: "Xano webhook processed",
        deliveryId: delivery.id,
        status: delivery.status
      });
    } catch (error) {
      console.error("Error processing Xano webhook:", error);
      res.status(500).json({
        message: "Failed to process Xano webhook",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/webhook/subscriptions", requiresDeveloper, async (_req, res) => {
    try {
      const subscriptions = await storage.getWebhookSubscriptions();
      res.status(200).json(subscriptions);
    } catch (error) {
      console.error("Error fetching webhook subscriptions:", error);
      res.status(500).json({
        message: "Failed to fetch webhook subscriptions",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/webhook/subscriptions/:id", requiresDeveloper, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid webhook subscription ID" });
      }
      const subscription = await storage.getWebhookSubscription(id);
      if (!subscription) {
        return res.status(404).json({ message: "Webhook subscription not found" });
      }
      res.status(200).json(subscription);
    } catch (error) {
      console.error("Error fetching webhook subscription:", error);
      res.status(500).json({
        message: "Failed to fetch webhook subscription",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/api/webhook/subscriptions", requiresDeveloper, async (req, res) => {
    try {
      const { name, url, events, secret, isActive } = req.body;
      if (!name || !url || !events || !Array.isArray(events)) {
        return res.status(400).json({ message: "Name, URL, and events are required" });
      }
      const newSubscription = await storage.createWebhookSubscription({
        name,
        url,
        events,
        secret: secret || "",
        isActive: isActive !== void 0 ? isActive : true,
        partnerId: null,
        headers: {}
      });
      res.status(201).json(newSubscription);
    } catch (error) {
      console.error("Error creating webhook subscription:", error);
      res.status(500).json({
        message: "Failed to create webhook subscription",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.patch("/api/webhook/subscriptions/:id", requiresDeveloper, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid webhook subscription ID" });
      }
      const subscription = await storage.getWebhookSubscription(id);
      if (!subscription) {
        return res.status(404).json({ message: "Webhook subscription not found" });
      }
      const updatedSubscription = await storage.updateWebhookSubscription(id, req.body);
      res.status(200).json(updatedSubscription);
    } catch (error) {
      console.error("Error updating webhook subscription:", error);
      res.status(500).json({
        message: "Failed to update webhook subscription",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.delete("/api/webhook/subscriptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid webhook subscription ID" });
      }
      const success = await storage.deleteWebhookSubscription(id);
      if (!success) {
        return res.status(404).json({ message: "Webhook subscription not found" });
      }
      res.status(200).json({ message: "Webhook subscription deleted" });
    } catch (error) {
      console.error("Error deleting webhook subscription:", error);
      res.status(500).json({
        message: "Failed to delete webhook subscription",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/api/webhook/subscriptions/:id/test", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid webhook subscription ID" });
      }
      const subscription = await storage.getWebhookSubscription(id);
      if (!subscription) {
        return res.status(404).json({ message: "Webhook subscription not found" });
      }
      const delivery = await universalWebhookManager.testWebhook(
        id,
        EventTypes.VERIFICATION_CREATED,
        {
          event: EventTypes.VERIFICATION_CREATED,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          data: {
            message: "This is a test event from FibonroseTrust",
            subscription: { id: subscription.id, name: subscription.name }
          }
        }
      );
      res.status(200).json({
        message: "Test event sent",
        deliveryId: delivery.id,
        status: delivery.status
      });
    } catch (error) {
      console.error("Error testing webhook:", error);
      res.status(500).json({
        message: "Failed to test webhook",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/webhook/deliveries", async (req, res) => {
    try {
      const subscriptionId = req.query.subscriptionId ? parseInt(req.query.subscriptionId) : void 0;
      const deliveries = await storage.getWebhookDeliveries(subscriptionId);
      res.status(200).json(deliveries);
    } catch (error) {
      console.error("Error fetching webhook deliveries:", error);
      res.status(500).json({
        message: "Failed to fetch webhook deliveries",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/webhook/deliveries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid webhook delivery ID" });
      }
      const delivery = await storage.getWebhookDelivery(id);
      if (!delivery) {
        return res.status(404).json({ message: "Webhook delivery not found" });
      }
      res.status(200).json(delivery);
    } catch (error) {
      console.error("Error fetching webhook delivery:", error);
      res.status(500).json({
        message: "Failed to fetch webhook delivery",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/api/webhook/import", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const file = req.file;
      const fileBuffer = file.buffer;
      const count = await universalWebhookManager.importWebhooks(fileBuffer);
      res.status(200).json({ message: "Webhooks imported", count });
    } catch (error) {
      console.error("Error importing webhooks:", error);
      res.status(500).json({
        message: "Failed to import webhooks",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/webhook/export", async (_req, res) => {
    try {
      const filePath = await universalWebhookManager.exportWebhooks();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=webhook-subscriptions-${Date.now()}.csv`);
      const fileStream = fs4.createReadStream(filePath);
      fileStream.pipe(res);
      fileStream.on("end", () => {
        fs4.unlinkSync(filePath);
      });
    } catch (error) {
      console.error("Error exporting webhooks:", error);
      res.status(500).json({
        message: "Failed to export webhooks",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/api/security/why-verification", async (req, res) => {
    const { userId, verificationType } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    try {
      const securityLevels = ["low", "standard", "enhanced", "maximum"];
      const randomLevel = securityLevels[Math.floor(Math.random() * securityLevels.length)];
      setTimeout(() => {
      }, 100);
      res.status(200).json({
        success: true,
        userId,
        verificationType: verificationType || "identity",
        securityLevel: randomLevel,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Error performing WHY verification:", error);
      res.status(500).json({
        success: false,
        message: "Failed to perform WHY verification",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/api/security/risk-assessment", async (req, res) => {
    const { userId, transactionType, metadata } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    try {
      const riskLevel = metadata?.trustScore > 5 ? "low" : "moderate";
      const maxTransactionAmount = metadata?.trustScore * 1e3;
      res.status(200).json({
        success: true,
        userId,
        riskLevel,
        transactionType: transactionType || "general",
        recommendations: [
          "Maintain regular verification updates",
          "Consider additional identity verification"
        ],
        limits: {
          maxTransactionAmount,
          dailyLimit: maxTransactionAmount * 3,
          monthlyLimit: maxTransactionAmount * 30
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Error performing risk assessment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to perform risk assessment",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/api/webhook/:source", async (req, res) => {
    const source = req.params.source;
    if (!source) {
      return res.status(400).json({ message: "Source parameter is required" });
    }
    try {
      const delivery = await universalWebhookManager.processUniversalWebhook(
        source,
        req.body,
        req.headers
      );
      res.status(202).json({
        message: "Webhook received",
        deliveryId: delivery.id,
        status: delivery.status
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process webhook", error });
    }
  });
  app2.get("/api/polyglot/status", async (req, res) => {
    try {
      const status = await polyglotRouter.getSystemStatus();
      res.json(status);
    } catch (error) {
      console.error("Error getting polyglot status:", error);
      res.status(500).json({ message: "Failed to get polyglot status", error });
    }
  });
  app2.post("/api/accessibility/asl/recognize", async (req, res) => {
    try {
      const { imageData, userId, sessionId, confidenceThreshold } = req.body;
      if (!imageData || !userId) {
        return res.status(400).json({ message: "imageData and userId are required" });
      }
      const authHeaders = req.headers.authorization ? { "Authorization": req.headers.authorization } : {};
      const result = await polyglotRouter.routeASLRecognition(
        imageData,
        userId,
        sessionId,
        confidenceThreshold,
        authHeaders
      );
      res.json(result);
    } catch (error) {
      console.error("Error in ASL recognition:", error);
      res.status(500).json({ message: "ASL recognition failed", error });
    }
  });
  app2.post("/api/accessibility/captions/start", async (req, res) => {
    try {
      const { userId, audioFormat, languageCode } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      const authHeaders = req.headers.authorization ? { "Authorization": req.headers.authorization } : {};
      const result = await polyglotRouter.routeLiveCaptions(userId, audioFormat, languageCode, authHeaders);
      res.json(result);
    } catch (error) {
      console.error("Error starting live captions:", error);
      res.status(500).json({ message: "Live captions failed", error });
    }
  });
  app2.post("/api/accessibility/preferences", async (req, res) => {
    try {
      const { userId, ...preferences } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      const authHeaders = req.headers.authorization ? { "Authorization": req.headers.authorization } : {};
      const result = await polyglotRouter.routeAccessibilityPreferences(userId, preferences, authHeaders);
      res.json(result);
    } catch (error) {
      console.error("Error updating accessibility preferences:", error);
      res.status(500).json({ message: "Accessibility preferences update failed", error });
    }
  });
  app2.post("/api/security/why-verification/polyglot", async (req, res) => {
    try {
      const { userId, entityType, entityId, reason } = req.body;
      if (!userId || !entityType || !entityId || !reason) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const authHeaders = req.headers.authorization ? { "Authorization": req.headers.authorization } : {};
      const result = await polyglotRouter.routeWHYVerification(userId, entityType, entityId, reason, authHeaders);
      res.json(result);
    } catch (error) {
      console.error("Error in WHY verification:", error);
      res.status(500).json({ message: "WHY verification failed", error });
    }
  });
  app2.get("/api/polyglot/health", async (req, res) => {
    try {
      const healthStatus = await polyglotRouter.checkServicesHealth();
      const healthMap = {};
      healthStatus.forEach((value, key) => {
        healthMap[key] = value;
      });
      res.json({
        polyglot_system: "active",
        services: healthMap,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        negrarosa_integrated: true,
        deaf_first_optimized: true
      });
    } catch (error) {
      console.error("Error checking service health:", error);
      res.status(500).json({ message: "Health check failed", error });
    }
  });
  app2.use("/api/django/admin/*", (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Admin access required - Bearer token needed",
        WHY: "Django admin panel requires authenticated admin access"
      });
    }
    next();
  });
  app2.all("/api/django/admin/*", async (req, res) => {
    try {
      const adminPath = req.path;
      const authHeaders = { "Authorization": req.headers.authorization };
      const securityContext = {
        ...authHeaders,
        "X-NegraRosa-Context": "admin-panel-access",
        "X-NegraRosa-WHY": "Accessing Django admin panel for system management"
      };
      const result = await polyglotRouter.routeDjangoAdmin(
        adminPath,
        req.method,
        req.body,
        securityContext
      );
      res.json(result);
    } catch (error) {
      console.error("Error routing to Django admin:", error);
      res.status(error.message?.includes("not allowed") ? 403 : 500).json({
        message: "Django admin access failed",
        WHY: "Security validation failed for admin panel access",
        error: error.message
      });
    }
  });
  app2.post("/api/django/models/:model/:operation", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          message: "Admin access required for Django ORM operations",
          WHY: "Database operations require authenticated admin access"
        });
      }
      const { model, operation } = req.params;
      const authHeaders = {
        "Authorization": req.headers.authorization,
        "X-NegraRosa-Context": "django-orm-operation",
        "X-NegraRosa-WHY": `Performing ${operation} operation on ${model} model`
      };
      const result = await polyglotRouter.routeDjangoORM(model, operation, req.body, authHeaders);
      res.json(result);
    } catch (error) {
      console.error("Error routing Django ORM operation:", error);
      res.status(error.message?.includes("not allowed") ? 403 : 500).json({
        message: "Django ORM operation failed",
        WHY: "Model operation security validation failed",
        error: error.message
      });
    }
  });
  app2.get("/api/polyglot/services", async (req, res) => {
    try {
      const services = polyglotRouter.getServices();
      res.json({
        total_services: services.length,
        services,
        architecture: "polyglot",
        supported_types: ["express", "fastapi", "nodejs", "python", "django"],
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Error getting services:", error);
      res.status(500).json({ message: "Failed to get services", error });
    }
  });
  app2.post("/api/security/verify-token", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Invalid authorization header" });
      }
      const token = authHeader.substring(7);
      try {
        const isValid = await negraRosaAuth0.verifyUserIdentity(1);
        if (isValid) {
          res.json({
            user_id: 1,
            username: "demo_user",
            email: "demo@fibonrose.com",
            verified: true,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        } else {
          res.status(401).json({ message: "Invalid token" });
        }
      } catch (error) {
        console.error("Token verification error:", error);
        res.status(401).json({ message: "Token verification failed" });
      }
    } catch (error) {
      console.error("Error in token verification:", error);
      res.status(500).json({ message: "Token verification service error", error });
    }
  });
  app2.get("/health", async (req, res) => {
    try {
      const users2 = await storage.getUser(1);
      res.json({
        status: "healthy",
        service: "express-main",
        database: users2 ? "connected" : "disconnected",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        version: "1.0.0",
        negrarosa_integrated: true,
        polyglot_enabled: true
      });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        service: "express-main",
        error: error instanceof Error ? error.message : String(error),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/middlewares/cors.ts
var corsMiddleware = (req, res, next) => {
  const allowedOrigins = [
    "https://fibonrose.mbtquniverse.com",
    "http://localhost:3000",
    "http://localhost:5000"
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  next();
};

// server/index.ts
var app = express2();
app.use(corsMiddleware);
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
