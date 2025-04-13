import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatarUrl: text("avatar_url"),
});

export const verificationTypes = pgTable("verification_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
});

export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  typeId: integer("type_id").notNull().references(() => verificationTypes.id),
  status: text("status").notNull(), // PENDING, VERIFIED, REJECTED
  verifiedBy: text("verified_by"), // Service that verified the user
  data: jsonb("data"), // Verification-specific data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
});

export const trustScores = pgTable("trust_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  score: integer("score").notNull().default(0),
  level: integer("level").notNull().default(0),
  maxScore: integer("max_score").notNull().default(0),
  verificationCount: integer("verification_count").notNull().default(0),
  positiveTransactions: integer("positive_transactions").notNull().default(0),
  totalTransactions: integer("total_transactions").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const dataPermissions = pgTable("data_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  permissionKey: text("permission_key").notNull(), // Type of data to share
  enabled: boolean("enabled").notNull().default(true),
});

// Webhook definitions
export const webhookSubscriptions = pgTable("webhook_subscriptions", {
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

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: serial("id").primaryKey(), 
  subscriptionId: integer("subscription_id").notNull().references(() => webhookSubscriptions.id),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull(), // 'success', 'failed', 'pending'
  statusCode: integer("status_code"),
  response: text("response"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  attempts: integer("attempts").notNull().default(0)
});

// Notion integration table
export const notionIntegrations = pgTable("notion_integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  accessToken: text("access_token").notNull(),
  workspaceId: text("workspace_id").notNull(),
  databaseId: text("database_id"),
  isActive: boolean("is_active").notNull().default(true),
  lastSynced: timestamp("last_synced"),
  settings: jsonb("settings").default({})
});

// Xano integration table
export const xanoIntegrations = pgTable("xano_integrations", {
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  avatarUrl: true,
});

export const insertVerificationTypeSchema = createInsertSchema(verificationTypes);
export const insertVerificationSchema = createInsertSchema(verifications).omit({ createdAt: true, verifiedAt: true });
export const insertTrustScoreSchema = createInsertSchema(trustScores).omit({ lastUpdated: true });
export const insertDataPermissionSchema = createInsertSchema(dataPermissions);

// Webhook schemas
export const insertWebhookSubscriptionSchema = createInsertSchema(webhookSubscriptions).omit({ 
  createdAt: true 
});

export const insertWebhookDeliverySchema = createInsertSchema(webhookDeliveries).omit({ 
  createdAt: true, 
  processedAt: true, 
  attempts: true 
});

export const insertNotionIntegrationSchema = createInsertSchema(notionIntegrations).omit({
  lastSynced: true
});

export const insertXanoIntegrationSchema = createInsertSchema(xanoIntegrations).omit({
  lastSynced: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type VerificationType = typeof verificationTypes.$inferSelect;
export type InsertVerificationType = z.infer<typeof insertVerificationTypeSchema>;
export type Verification = typeof verifications.$inferSelect;
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type TrustScore = typeof trustScores.$inferSelect;
export type InsertTrustScore = z.infer<typeof insertTrustScoreSchema>;
export type DataPermission = typeof dataPermissions.$inferSelect;
export type InsertDataPermission = z.infer<typeof insertDataPermissionSchema>;

// Webhook types
export type WebhookSubscription = typeof webhookSubscriptions.$inferSelect;
export type InsertWebhookSubscription = z.infer<typeof insertWebhookSubscriptionSchema>;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type InsertWebhookDelivery = z.infer<typeof insertWebhookDeliverySchema>;
export type NotionIntegration = typeof notionIntegrations.$inferSelect;
export type InsertNotionIntegration = z.infer<typeof insertNotionIntegrationSchema>;
export type XanoIntegration = typeof xanoIntegrations.$inferSelect;
export type InsertXanoIntegration = z.infer<typeof insertXanoIntegrationSchema>;

// Event types for webhook system
export const EventTypes = {
  // Generic event
  GENERIC: 'generic.event',
  
  // Verification events
  VERIFICATION_CREATED: 'verification.created',
  VERIFICATION_UPDATED: 'verification.updated',
  VERIFICATION_VERIFIED: 'verification.verified',
  VERIFICATION_REJECTED: 'verification.rejected',
  
  // User events
  TRUST_SCORE_UPDATED: 'trust_score.updated',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  
  // NFT events
  NFT_MINTED: 'nft.minted',
  NFT_TRANSFERRED: 'nft.transferred',
  
  // Xano integration events
  XANO_ANALYSIS_COMPLETED: 'xano.analysis.completed',
  XANO_DATA_SYNCED: 'xano.data.synced',
  XANO_AI_INSIGHT: 'xano.ai.insight'
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];
