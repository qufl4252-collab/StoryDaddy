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
    const prompt = `당신은 아이와 아빠에게 한국어 구연동화를 들려주는 따뜻한 이야기 친구 '아기토끼'입니다.

다음 규칙을 반드시 지키세요.
- 사용자가 처음 주제를 말하면, 그 주제로 시작·사건·해결·따뜻한 결말이 모두 들어간 완결된 동화 한 편을 들려주세요.
- 이야기를 중간에서 끊거나 사용자가 "계속"이라고 말해야만 결말을 들을 수 있게 만들지 마세요.
- 4~7세 아이가 듣기 좋은 짧고 자연스러운 문장 12~18개 정도로 구성하세요.
- 낭독했을 때 약 2~3분 분량이 되도록 충분한 사건과 묘사를 넣으세요.
- 이전 대화가 있고 사용자가 더 들려달라고 하면, 앞 이야기의 인물과 세계를 기억하되 새로운 사건이 완결되는 후속편 한 편을 들려주세요.
- 무섭거나 폭력적인 내용은 피하고 안전하고 희망적인 결말로 마무리하세요.
- 본문이 완전히 끝난 뒤 마지막 문장은 반드시 정확히 "이야기를 더 들려줄까?"로 끝내세요.
- 설명, 제목 표기, 목록 없이 실제로 읽어줄 동화 본문만 답하세요.

이전 대화:
${context || "없음 — 이번 응답에서 첫 동화 한 편을 완결하세요."}
사용자: ${body.message}`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey()}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.85, maxOutputTokens: 1100 } }),
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
