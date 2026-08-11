import { env } from "cloudflare:workers";
import { ensureDatabase } from "../../../../db/ensure";

function wav(pcm: Uint8Array, sampleRate = 24000) {
  const buffer = new ArrayBuffer(44 + pcm.length);
  const view = new DataView(buffer);
  const write = (offset: number, value: string) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  write(0, "RIFF"); view.setUint32(4, 36 + pcm.length, true); write(8, "WAVE"); write(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); write(36, "data"); view.setUint32(40, pcm.length, true);
  new Uint8Array(buffer, 44).set(pcm); return buffer;
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json() as { text?: string };
    if (!text?.trim()) return Response.json({ error: "읽을 이야기가 없습니다." }, { status: 400 });
    if (!process.env.GEMINI_API_KEY) throw new Error("Gemini key unavailable");
    await ensureDatabase();
    const setting = await env.DB.prepare("SELECT value FROM app_settings WHERE key = 'tts_voice'").first<{ value: string }>();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `다음 한국어 동화를 포근하고 자연스럽게, 아이가 잠들기 좋은 차분한 속도로 읽어주세요. 이야기 본문:\n${text}` }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: setting?.value || "Sulafat" } } } },
      }),
    });
    if (!response.ok) throw new Error(`Gemini TTS ${response.status}: ${await response.text()}`);
    const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }> };
    const audio = result.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
    if (!audio?.data) throw new Error("No audio returned");
    const raw = Uint8Array.from(atob(audio.data), (char) => char.charCodeAt(0));
    return new Response(wav(raw), { headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Gemini TTS failed", error);
    return Response.json({ error: "Gemini 목소리를 준비하지 못했어요. 잠시 후 다시 말해주세요." }, { status: 500 });
  }
}
