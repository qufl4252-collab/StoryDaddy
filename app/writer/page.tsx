"use client";

import { FormEvent, TouchEvent, useRef, useState } from "react";
import { getAnonymousId } from "../lib/anonymous-id";

type Story = { title: string; theme: string; pages: string[] };

export default function WriterPage() {
  const [story, setStory] = useState<Story | null>(null); const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function previousPage() { setPage((current) => Math.max(0, current - 1)); }
  function nextPage() { if (story) setPage((current) => Math.min(story.pages.length - 1, current + 1)); }
  function onTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.changedTouches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }
  function onTouchEnd(event: TouchEvent<HTMLElement>) {
    const start = touchStart.current; const touch = event.changedTouches[0]; touchStart.current = null;
    if (!start || !touch) return;
    const deltaX = touch.clientX - start.x; const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return;
    if (deltaX < 0) nextPage(); else previousPage();
  }
  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setStory(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/stories/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anonymousUserId: getAnonymousId(), theme: form.get("theme"), age: form.get("age"), mood: form.get("mood"), length: form.get("length") }) });
      const result = await response.json() as { story?: Story; error?: string };
      if (!response.ok || !result.story) throw new Error(result.error || "동화를 만들지 못했어요.");
      setStory(result.story); setPage(0); touchStart.current = null;
    } catch (err) { setError(err instanceof Error ? err.message : "다시 시도해주세요."); } finally { setLoading(false); }
  }
  return <main className="room writer-room">
    <nav className="room-nav"><a href="/">← 이야기 방</a><span>동화 작가</span></nav>
    {!story ? <section className="writer-form-wrap"><p className="eyebrow">매일 새로운 한 권</p><h1>오늘은 어떤 세계로<br />떠나볼까요?</h1>
      <form className="writer-form" onSubmit={generate}>
        <label>동화 주제<input name="theme" placeholder="예: 달빛을 모으는 작은 여우" maxLength={100} /></label>
        <div className="form-row"><label>아이 나이<select name="age" defaultValue="4~7세"><option>태교</option><option>2~4세</option><option>4~7세</option><option>초등 저학년</option></select></label><label>분위기<select name="mood" defaultValue="포근하고 신비롭게"><option>포근하고 신비롭게</option><option>즐겁고 유쾌하게</option><option>잔잔하고 감동적으로</option><option>용감한 모험으로</option></select></label><label>동화 분량<select name="length" defaultValue="15"><option value="15">짧게 · 15페이지</option><option value="20">중간 · 20페이지</option><option value="30">길게 · 30페이지</option></select></label></div>
        <button className="primary" disabled={loading}>{loading ? "책장을 엮고 있어요…" : "오늘의 동화 만들기"}</button>{error && <p className="form-error">{error}</p>}
      </form></section> : <section className="storybook"><header><p>{story.theme}</p><h1>{story.title}</h1></header><article className="paper-page" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-live="polite"><span>{page + 1}</span><p>{story.pages[page]}</p><small>{page + 1} / {story.pages.length}</small></article><p className="swipe-hint">손가락으로 좌우로 밀어 책장을 넘겨보세요</p><div className="page-controls"><button onClick={previousPage} disabled={page === 0}>← 이전 장</button>{page === story.pages.length - 1 ? <button onClick={() => setStory(null)}>새 동화 만들기</button> : <button onClick={nextPage}>다음 장 →</button>}</div></section>}
  </main>;
}
