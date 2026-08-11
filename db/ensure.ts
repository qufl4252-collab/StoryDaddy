import { env } from "cloudflare:workers";

let ready: Promise<void> | null = null;

export function ensureDatabase() {
  if (ready) return ready;
  ready = (async () => {
    if (!env.DB) throw new Error("D1 binding DB is unavailable");
    const db = env.DB;
    await db.batch([
      db.prepare("CREATE TABLE IF NOT EXISTS anonymous_users (id TEXT PRIMARY KEY NOT NULL, created_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL)"),
      db.prepare("CREATE TABLE IF NOT EXISTS stories (id TEXT PRIMARY KEY NOT NULL, anonymous_user_id TEXT NOT NULL, feature TEXT NOT NULL, title TEXT NOT NULL, theme TEXT NOT NULL, content_json TEXT NOT NULL, created_at INTEGER NOT NULL)"),
      db.prepare("CREATE TABLE IF NOT EXISTS usage_events (id TEXT PRIMARY KEY NOT NULL, anonymous_user_id TEXT NOT NULL, event_type TEXT NOT NULL, theme TEXT, created_at INTEGER NOT NULL)"),
      db.prepare("CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL, updated_at INTEGER NOT NULL)"),
      db.prepare("INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('tts_voice', 'Sulafat', 0)"),
      db.prepare("CREATE INDEX IF NOT EXISTS stories_created_at_idx ON stories(created_at)"),
      db.prepare("CREATE INDEX IF NOT EXISTS events_type_idx ON usage_events(event_type)"),
    ]);
  })().catch((error) => { ready = null; throw error; });
  return ready;
}
