function apiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  return key;
}

export async function POST(request: Request) {
  try {
    const sdp = await request.text();
    if (!sdp) return new Response("SDP가 없습니다.", { status: 400 });
    const session = {
      type: "realtime",
      model: "gpt-realtime-2.1",
      instructions: "당신은 동화나라 아이아빠의 따뜻한 한국어 구연동화 친구입니다. 아이와 아빠의 말을 잘 듣고, 사용자가 계속해 달라고 하면 앞 이야기의 인물·사건·분위기를 기억해 자연스럽게 이어 주세요. 한 번에 3~5문장씩 또렷하고 포근하게 말하고, 아이가 참여할 수 있는 짧은 질문도 가끔 건네세요. 무섭거나 폭력적인 내용은 피하고 항상 안전하고 희망적인 방향으로 이끕니다.",
      audio: { output: { voice: "marin" } },
    };
    const form = new FormData();
    form.set("sdp", sdp);
    form.set("session", JSON.stringify(session));
    const upstream = await fetch("https://api.openai.com/v1/realtime/calls", { method: "POST", headers: { Authorization: `Bearer ${apiKey()}` }, body: form });
    return new Response(await upstream.text(), { status: upstream.status, headers: { "Content-Type": upstream.headers.get("Content-Type") || "application/sdp" } });
  } catch {
    return new Response("AI 음성 서버 연결이 아직 설정되지 않았습니다.", { status: 500 });
  }
}
