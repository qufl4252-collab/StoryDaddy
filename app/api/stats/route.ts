import { count, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { anonymousUsers, stories, usageEvents } from "../../../db/schema";
import { ensureDatabase } from "../../../db/ensure";

export async function GET() {
  try {
    await ensureDatabase();
    const db = getDb();
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const [[users], [allStories], [todayStories], [voice], themes] = await Promise.all([
      db.select({ value: count() }).from(anonymousUsers),
      db.select({ value: count() }).from(stories),
      db.select({ value: count() }).from(stories).where(sql`${stories.createdAt} >= ${start}`),
      db.select({ value: count() }).from(usageEvents).where(eq(usageEvents.eventType, "conversation_started")),
      db.select({ theme: usageEvents.theme, value: count() }).from(usageEvents).where(sql`${usageEvents.theme} is not null`).groupBy(usageEvents.theme).orderBy(desc(count())).limit(5),
    ]);
    return Response.json({ users: users.value, stories: allStories.value, todayStories: todayStories.value, conversations: voice.value, themes });
  } catch {
    return Response.json({ users: 0, stories: 0, todayStories: 0, conversations: 0, themes: [], initializing: true });
  }
}
