import { getDb } from "../../../db";
import { anonymousUsers, usageEvents } from "../../../db/schema";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { anonymousUserId?: string; eventType?: string; theme?: string };
    if (!body.anonymousUserId || !body.eventType) {
      return Response.json({ error: "필수 정보가 없습니다." }, { status: 400 });
    }
    const db = getDb();
    const now = new Date();
    await db.insert(anonymousUsers).values({ id: body.anonymousUserId, createdAt: now, lastSeenAt: now })
      .onConflictDoUpdate({ target: anonymousUsers.id, set: { lastSeenAt: now } });
    await db.insert(usageEvents).values({
      id: crypto.randomUUID(), anonymousUserId: body.anonymousUserId,
      eventType: body.eventType, theme: body.theme?.slice(0, 100) || null, createdAt: now,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "사용 기록을 저장하지 못했습니다." }, { status: 500 });
  }
}
