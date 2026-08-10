"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { getAnonymousId } from "../lib/anonymous-id";

export default function ConversationPage() {
  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "error">("idle");
  const [message, setMessage] = useState("버튼을 누르고 동화의 첫 장면을 말해보세요.");
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function start() {
    try {
      setStatus("connecting"); setMessage("마이크와 이야기 친구를 연결하고 있어요…");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const pc = new RTCPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      pc.ontrack = (event) => { if (audioRef.current) audioRef.current.srcObject = event.streams[0]; };
      const channel = pc.createDataChannel("oai-events");
      channel.onopen = () => channel.send(JSON.stringify({ type: "response.create", response: { instructions: "먼저 다정하게 인사하고, 어떤 동화를 함께 만들어 볼지 한국어로 짧게 물어보세요." } }));
      channel.onmessage = (event) => {
        const data = JSON.parse(event.data) as { type?: string; error?: { message?: string } };
        if (data.type === "error") setMessage(data.error?.message || "음성 대화 중 문제가 생겼어요.");
      };
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      const response = await fetch("/api/realtime/session", { method: "POST", headers: { "Content-Type": "application/sdp" }, body: offer.sdp });
      if (!response.ok) throw new Error(await response.text());
      await pc.setRemoteDescription({ type: "answer", sdp: await response.text() });
      peerRef.current = pc; streamRef.current = stream; setStatus("live"); setMessage("이야기 친구가 듣고 있어요. 편하게 말해주세요.");
      void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anonymousUserId: getAnonymousId(), eventType: "conversation_started" }) });
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setStatus("error"); setMessage(error instanceof Error ? error.message : "연결하지 못했어요. 마이크 권한을 확인해주세요.");
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((track) => track.stop()); peerRef.current?.close();
    streamRef.current = null; peerRef.current = null; setStatus("idle"); setMessage("대화가 끝났어요. 언제든 다시 이야기를 시작할 수 있어요.");
  }

  return <main className="room conversation-room">
    <nav className="room-nav"><Link href="/">← 이야기 방</Link><span>동화 대화</span></nav>
    <section className="voice-stage">
      <p className="eyebrow">목소리로 이어가는 동화</p><h1>우리 이야기,<br />어디서 시작할까요?</h1>
      <div className={`voice-orb ${status}`} aria-hidden="true"><span>☾</span><i /><i /></div>
      <p className="voice-status" aria-live="polite">{message}</p>
      {status === "live" ? <button className="primary stop" onClick={stop}>대화 끝내기</button> : <button className="primary" onClick={start} disabled={status === "connecting"}>{status === "connecting" ? "연결 중…" : "음성 동화 시작"}</button>}
      <p className="privacy-note">마이크 음성은 대화를 위해 실시간 전송되며, 원본 음성은 StoryDaddy 데이터베이스에 저장하지 않습니다.</p>
      <audio ref={audioRef} autoPlay />
    </section>
  </main>;
}
