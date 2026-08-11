function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  return key;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: string; history?: string[] };
    if (!body.message?.trim()) return Response.json({ error: "말한 내용을 듣지 못했어요." }, { status: 400 });
    const context = (body.history || []).slice(-8).join("\n");
    const prompt = `당신은 아이와 아빠에게 한국어 동화를 들려주는 따뜻한 이야기 친구입니다. 사용자가 계속해 달라고 하면 앞 내용을 자연스럽게 이어가세요. 한 번에 3~5개의 짧은 문장으로 답하고 무섭거나 폭력적인 내용은 피하세요.\n이전 대화:\n${context}\n사용자: ${body.message}`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey()}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9, maxOutputTokens: 350 } }),
    });
    if (!response.ok) throw new Error(`Gemini ${response.status}: ${await response.text()}`);
    const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const reply = result.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    if (!reply) throw new Error("빈 응답");
    return Response.json({ reply });
  } catch (error) {
    console.error("Gemini conversation failed", error);
    return Response.json({ error: "이야기 친구가 잠시 쉬고 있어요. 다시 말해주세요." }, { status: 500 });
  }
}
