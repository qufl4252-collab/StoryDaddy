import { env } from "cloudflare:workers";
import { ensureDatabase } from "../../../../db/ensure";

export const VOICES = ["Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede", "Callirrhoe", "Autonoe", "Enceladus", "Iapetus", "Umbriel", "Algieba", "Despina", "Erinome", "Algenib", "Rasalgethi", "Laomedeia", "Achernar", "Alnilam", "Schedar", "Gacrux", "Pulcherrima", "Achird", "Zubenelgenubi", "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat"] as const;

export async function GET() {
  await ensureDatabase();
  const row = await env.DB.prepare("SELECT value FROM app_settings WHERE key = 'tts_voice'").first<{ value: string }>();
  return Response.json({ voice: row?.value || "Sulafat" }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!process.env.ADMIN_SETTINGS_TOKEN || request.headers.get("authorization") !== `Bearer ${process.env.ADMIN_SETTINGS_TOKEN}`) {
    return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
  }
  const { voice } = await request.json() as { voice?: string };
  if (!voice || !VOICES.includes(voice as typeof VOICES[number])) return Response.json({ error: "지원하지 않는 목소리입니다." }, { status: 400 });
  await ensureDatabase();
  await env.DB.prepare("INSERT INTO app_settings (key, value, updated_at) VALUES ('tts_voice', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").bind(voice, Date.now()).run();
  return Response.json({ voice });
}
