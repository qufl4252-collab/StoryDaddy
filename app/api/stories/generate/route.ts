import { getDb } from "../../../../db";
import { anonymousUsers, stories, usageEvents } from "../../../../db/schema";
import { ensureDatabase } from "../../../../db/ensure";

type Story = { title: string; theme: string; pages: string[] };

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  return key;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { anonymousUserId?: string; theme?: string; age?: string; mood?: string };
    if (!body.anonymousUserId) return Response.json({ error: "사용자 정보가 없습니다." }, { status: 400 });

    const theme = body.theme?.trim() || "오늘의 새로운 모험";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `당신은 잠들기 전 아빠가 아이에게 읽어주는 따뜻한 한국어 동화 작가입니다.\n주제: ${theme}\n대상 연령: ${body.age || "4~7세"}\n분위기: ${body.mood || "포근하고 신비롭게"}\n서로 자연스럽게 이어지는 10쪽 동화를 만드세요. 각 페이지는 반드시 짧은 1~2문장이고, 무섭거나 폭력적인 표현 없이 희망적인 결말로 끝냅니다.` }] }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: {
          type: "object", additionalProperties: false, required: ["title", "theme", "pages"],
          properties: { title: { type: "string" }, theme: { type: "string" }, pages: { type: "array", minItems: 10, maxItems: 10, items: { type: "string" } } },
        } },
      }),
    });
    if (!response.ok) throw new Error(`Gemini ${response.status}: ${await response.text()}`);
    const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const raw = result.candidates?.[0]?.content?.parts?.map((item) => item.text || "").join("") || "";
    const story = JSON.parse(raw) as Story;
    if (!story.title || !Array.isArray(story.pages) || story.pages.length < 2) throw new Error("잘못된 동화 형식");

    await ensureDatabase();
    const db = getDb();
    const now = new Date();
    await db.insert(anonymousUsers).values({ id: body.anonymousUserId, createdAt: now, lastSeenAt: now })
      .onConflictDoUpdate({ target: anonymousUsers.id, set: { lastSeenAt: now } });
    await db.insert(stories).values({ id: crypto.randomUUID(), anonymousUserId: body.anonymousUserId, feature: "writer", title: story.title, theme: story.theme || theme, contentJson: JSON.stringify(story.pages), createdAt: now });
    await db.insert(usageEvents).values({ id: crypto.randomUUID(), anonymousUserId: body.anonymousUserId, eventType: "writer_generated", theme: story.theme || theme, createdAt: now });
    return Response.json({ story });
  } catch (error) {
    console.error("Gemini story generation failed", error);
    const message = error instanceof Error && error.message.includes("GEMINI_API_KEY") ? "AI 서버 연결이 아직 설정되지 않았습니다." : "동화를 만드는 중 문제가 생겼어요. 잠시 뒤 다시 해주세요.";
    return Response.json({ error: message }, { status: 500 });
  }
}
