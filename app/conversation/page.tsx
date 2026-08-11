"use client";

import { useRef, useState } from "react";
import { getAnonymousId } from "../lib/anonymous-id";

type Recognition = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };

export default function ConversationPage() {
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking" | "error">("idle");
  const [message, setMessage] = useState("버튼을 누르고 동화의 첫 장면을 말해보세요.");
  const historyRef = useRef<string[]>([]); const recognitionRef = useRef<Recognition | null>(null);

  function listen() {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) { setStatus("error"); setMessage("이 브라우저는 음성인식을 지원하지 않아요. Chrome에서 이용해주세요."); return; }
    window.speechSynthesis.cancel(); const recognition = new SpeechRecognition(); recognition.lang = "ko-KR"; recognition.interimResults = false; recognition.continuous = false;
    recognition.onresult = async (event) => {
      const spoken = event.results[0]?.[0]?.transcript?.trim(); if (!spoken) return;
      setStatus("thinking"); setMessage(`“${spoken}” 다음 이야기를 만들고 있어요…`);
      try {
        const response = await fetch("/api/conversation/respond", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: spoken, history: historyRef.current }) });
        const data = await response.json() as { reply?: string; error?: string }; if (!response.ok || !data.reply) throw new Error(data.error);
        historyRef.current = [...historyRef.current, `사용자: ${spoken}`, `이야기 친구: ${data.reply}`].slice(-10);
        setMessage(data.reply); setStatus("speaking"); const utterance = new SpeechSynthesisUtterance(data.reply); utterance.lang = "ko-KR"; utterance.rate = 0.92; utterance.pitch = 1.05; utterance.onend = () => setStatus("idle"); window.speechSynthesis.speak(utterance);
      } catch (error) { setStatus("error"); setMessage(error instanceof Error && error.message ? error.message : "이야기를 잇지 못했어요. 다시 말해주세요."); }
    };
    recognition.onerror = () => { setStatus("error"); setMessage("목소리를 듣지 못했어요. 마이크 권한을 확인해주세요."); };
    recognition.onend = () => { recognitionRef.current = null; setStatus((current) => current === "listening" ? "idle" : current); };
    recognitionRef.current = recognition; recognition.start(); setStatus("listening"); setMessage("듣고 있어요… 동화의 시작이나 ‘계속 이야기해줘’라고 말해보세요.");
    if (!historyRef.current.length) void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anonymousUserId: getAnonymousId(), eventType: "conversation_started" }) });
  }

  function stop() { recognitionRef.current?.stop(); window.speechSynthesis.cancel(); setStatus("idle"); setMessage("대화를 멈췄어요. 버튼을 누르면 다시 이어갈 수 있어요."); }
  const active = status === "listening" || status === "thinking" || status === "speaking";
  return <main className="room conversation-room"><nav className="room-nav"><a href="/">← 이야기 방</a><span>동화 대화</span></nav><section className="voice-stage"><p className="eyebrow">Gemini와 목소리로 이어가는 동화</p><h1>우리 이야기,<br />어디서 시작할까요?</h1><div className={`voice-orb ${active ? "live" : status}`} aria-hidden="true"><span>☾</span><i /><i /></div><p className="voice-status" aria-live="polite">{message}</p>{active ? <button className="primary stop" onClick={stop}>멈추기</button> : <button className="primary" onClick={listen}>목소리로 이야기하기</button>}<p className="privacy-note">음성인식은 브라우저 기능을 이용하며 StoryDaddy 서버에는 원본 음성을 저장하지 않습니다.</p></section></main>;
}
