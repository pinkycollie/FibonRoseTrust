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
