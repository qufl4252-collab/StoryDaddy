import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const anonymousUsers = sqliteTable("anonymous_users", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }).notNull(),
});

export const stories = sqliteTable("stories", {
  id: text("id").primaryKey(),
  anonymousUserId: text("anonymous_user_id").notNull(),
  feature: text("feature", { enum: ["writer", "conversation"] }).notNull(),
  title: text("title").notNull(),
  theme: text("theme").notNull(),
  contentJson: text("content_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const usageEvents = sqliteTable("usage_events", {
  id: text("id").primaryKey(),
  anonymousUserId: text("anonymous_user_id").notNull(),
  eventType: text("event_type").notNull(),
  theme: text("theme"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
