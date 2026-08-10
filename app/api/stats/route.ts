import { env } from "cloudflare:workers";
import { ensureDatabase } from "../../../db/ensure";

type CountRow = { value: number };
type ThemeRow = { theme: string; value: number };

export async function GET() {
  try {
    await ensureDatabase();
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const [users, allStories, todayStories, voice, themes] = await Promise.all([
      env.DB.prepare("SELECT count(*) AS value FROM anonymous_users").first<CountRow>(),
      env.DB.prepare("SELECT count(*) AS value FROM stories").first<CountRow>(),
      env.DB.prepare("SELECT count(*) AS value FROM stories WHERE created_at >= ?").bind(start.getTime()).first<CountRow>(),
      env.DB.prepare("SELECT count(*) AS value FROM usage_events WHERE event_type = ?").bind("conversation_started").first<CountRow>(),
      env.DB.prepare("SELECT theme, count(*) AS value FROM usage_events WHERE theme IS NOT NULL GROUP BY theme ORDER BY value DESC LIMIT 5").all<ThemeRow>(),
    ]);
    return Response.json({
      users: users?.value ?? 0,
      stories: allStories?.value ?? 0,
      todayStories: todayStories?.value ?? 0,
      conversations: voice?.value ?? 0,
      themes: themes.results ?? [],
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ users: 0, stories: 0, todayStories: 0, conversations: 0, themes: [], initializing: true }, { headers: { "Cache-Control": "no-store" } });
  }
}
