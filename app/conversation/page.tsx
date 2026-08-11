"use client";

import { useMemo, useRef, useState } from "react";
import { getAnonymousId } from "../lib/anonymous-id";

type Recognition = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };

export default function ConversationPage() {
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking" | "error">("idle");
  const [message, setMessage] = useState("버튼을 누르고 동화의 첫 장면을 말해보세요.");
  const [storyText, setStoryText] = useState("");
  const [readingSentence, setReadingSentence] = useState(-1);
  const historyRef = useRef<string[]>([]); const recognitionRef = useRef<Recognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null); const sourceRef = useRef<AudioBufferSourceNode | null>(null); const animationRef = useRef<number | null>(null);
  const sentences = useMemo(() => storyText.match(/[^.!?。！？]+[.!?。！？]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [], [storyText]);

  function listen() {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) { setStatus("error"); setMessage("이 브라우저는 음성인식을 지원하지 않아요. Chrome에서 이용해주세요."); return; }
    sourceRef.current?.stop();
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = audioContextRef.current || new AudioContextClass(); audioContextRef.current = audioContext; void audioContext.resume();
    const recognition = new SpeechRecognition(); recognition.lang = "ko-KR"; recognition.interimResults = false; recognition.continuous = false;
    recognition.onresult = async (event) => {
      const spoken = event.results[0]?.[0]?.transcript?.trim(); if (!spoken) return;
      setStatus("thinking"); setStoryText(""); setReadingSentence(-1); setMessage("동화를 만들고 있어요. 잠시만 기다려주세요.");
      try {
        const response = await fetch("/api/conversation/respond", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: spoken, history: historyRef.current }) });
        const data = await response.json() as { reply?: string; error?: string }; if (!response.ok || !data.reply) throw new Error(data.error);
        historyRef.current = [...historyRef.current, `사용자: ${spoken}`, `아기토끼: ${data.reply}`].slice(-10);
        const speech = await fetch("/api/conversation/speak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: data.reply }) });
        if (!speech.ok) { const problem = await speech.json() as { error?: string }; throw new Error(problem.error); }
        const context = audioContextRef.current; if (!context) throw new Error("음성 재생을 준비하지 못했어요.");
        const audioBuffer = await context.decodeAudioData(await speech.arrayBuffer());
        const source = context.createBufferSource(); const voiceGain = context.createGain(); voiceGain.gain.value = Math.min(Math.max(Number(localStorage.getItem("dodam_voice_volume") ?? 100) / 100, 0), 1); source.buffer = audioBuffer; source.connect(voiceGain); voiceGain.connect(context.destination); sourceRef.current = source;
        const storySentences = data.reply.match(/[^.!?。！？]+[.!?。！？]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [data.reply];
        const weights = storySentences.map((sentence) => Math.max(sentence.replace(/\s/g, "").length, 1)); const totalWeight = weights.reduce((sum, value) => sum + value, 0);
        setStoryText(data.reply); setReadingSentence(0); setMessage(""); setStatus("speaking");
        const startedAt = context.currentTime;
        const updateHighlight = () => {
          const progress = Math.min((context.currentTime - startedAt) / audioBuffer.duration, 1); let accumulated = 0; let current = storySentences.length - 1;
          for (let index = 0; index < weights.length; index += 1) { accumulated += weights[index] / totalWeight; if (progress <= accumulated) { current = index; break; } }
          setReadingSentence(current); if (progress < 1) animationRef.current = requestAnimationFrame(updateHighlight);
        };
        source.onended = () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); animationRef.current = null; sourceRef.current = null; setReadingSentence(-1); setStatus("idle"); setMessage("동화를 다 읽었어요. 버튼을 누르면 다음 이야기를 이어갈 수 있어요."); };
        source.start(); animationRef.current = requestAnimationFrame(updateHighlight);
      } catch (error) { setStatus("error"); setMessage(error instanceof Error && error.message ? error.message : "이야기를 잇지 못했어요. 다시 말해주세요."); }
    };
    recognition.onerror = () => { setStatus("error"); setMessage("목소리를 듣지 못했어요. 마이크 권한을 확인해주세요."); };
    recognition.onend = () => { recognitionRef.current = null; setStatus((current) => current === "listening" ? "idle" : current); };
    recognitionRef.current = recognition; recognition.start(); setStatus("listening"); setMessage("듣고 있어요… 동화의 시작이나 ‘계속 이야기해줘’라고 말해보세요.");
    if (!historyRef.current.length) void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anonymousUserId: getAnonymousId(), eventType: "conversation_started" }) });
  }

  function stop() { recognitionRef.current?.stop(); sourceRef.current?.stop(); sourceRef.current = null; if (animationRef.current) cancelAnimationFrame(animationRef.current); animationRef.current = null; setReadingSentence(-1); setStatus("idle"); setMessage("대화를 멈췄어요. 버튼을 누르면 다시 이어갈 수 있어요."); }
  const active = status === "listening" || status === "thinking" || status === "speaking";
  return <main className="room conversation-room"><nav className="room-nav"><a href="/">← 이야기 방</a><span>동화 대화</span></nav><section className="voice-stage"><p className="eyebrow">이야기 친구 아기토끼와 이어가는 동화</p><h1>우리 이야기,<br />어디서 시작할까요?</h1><div className={`voice-orb ${active ? "live" : status}`} aria-label="이야기 친구 아기토끼"><span>🐰</span><i /><i /></div>{message && <p className="voice-status" aria-live="polite">{message}</p>}{storyText && <div className="spoken-story" aria-label="아기토끼가 들려주는 동화">{sentences.map((sentence, index) => <span className={index === readingSentence ? "reading" : ""} key={`${index}-${sentence}`}>{sentence}{" "}</span>)}</div>}{active ? <button className="primary stop" onClick={stop}>멈추기</button> : <button className="primary" onClick={listen}>아기토끼와 이야기하기</button>}<p className="privacy-note">음성인식은 브라우저 기능을 이용하고, 이야기 낭독은 자연스러운 AI 음성이 담당합니다. 원본 음성은 저장하지 않습니다.</p></section></main>;
}
