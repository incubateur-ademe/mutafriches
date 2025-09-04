import { pgTable, uuid, varchar, timestamp, boolean, text } from "drizzle-orm/pg-core";

// Table pour tracker les sessions utilisateur
export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: varchar("session_id", { length: 255 }).notNull().unique(),
  integratorName: varchar("integrator_name", { length: 255 }).notNull(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table pour tracker les actions des utilisateurs
export const userActions = pgTable("user_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  actionType: varchar("action_type", { length: 100 }).notNull(),
  actionData: text("action_data"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Table pour tracker les intégrateurs
export const integrators = pgTable("integrators", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  domain: varchar("domain", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
