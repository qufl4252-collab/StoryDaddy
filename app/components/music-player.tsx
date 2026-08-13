"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const tracks = Array.from(
  { length: 12 },
  (_, index) => `https://raw.githubusercontent.com/qufl4252-collab/StoryDaddy/main/public/music/dodam-${index + 1}.mp3`,
);
const fadeSeconds = 6;
const defaultMusicVolume = 50;

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState(defaultMusicVolume / 100);
  const [voiceVolume, setVoiceVolume] = useState(100);
  const playersRef = useRef<HTMLAudioElement[]>([]);
  const activeRef = useRef(0);
  const trackRef = useRef(0);
  const fadingRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const watchRef = useRef<() => void>(() => undefined);

  const ensurePlayers = useCallback(() => {
    if (!playersRef.current.length) {
      playersRef.current = [new Audio(tracks[0]), new Audio(tracks[1])];
      playersRef.current.forEach((audio) => {
        audio.preload = "auto";
      });
    }
    return playersRef.current;
  }, []);

  const crossfade = useCallback(async () => {
    fadingRef.current = true;
    const oldIndex = activeRef.current;
    const nextIndex = oldIndex ? 0 : 1;
    trackRef.current = (trackRef.current + 1) % tracks.length;
    const next = playersRef.current[nextIndex];
    const old = playersRef.current[oldIndex];
    next.src = tracks[trackRef.current];
    next.currentTime = 0;
    next.volume = 0;
    try {
      await next.play();
    } catch {
      fadingRef.current = false;
      return;
    }
    const started = performance.now();
    const fade = () => {
      const progress = Math.min((performance.now() - started) / (fadeSeconds * 1000), 1);
      old.volume = volume * (1 - progress);
      next.volume = volume * progress;
      if (progress < 1) requestAnimationFrame(fade);
      else {
        old.pause();
        old.currentTime = 0;
        activeRef.current = nextIndex;
        fadingRef.current = false;
      }
    };
    requestAnimationFrame(fade);
  }, [volume]);

  const watch = useCallback(() => {
    const current = playersRef.current[activeRef.current];
    if (current && Number.isFinite(current.duration) && current.duration - current.currentTime <= fadeSeconds && !fadingRef.current) {
      void crossfade();
    }
    if (!current?.paused) frameRef.current = requestAnimationFrame(() => watchRef.current());
  }, [crossfade]);
  useEffect(() => {
    watchRef.current = watch;
  }, [watch]);

  const startMusic = useCallback(async () => {
    const players = ensurePlayers();
    const active = players[activeRef.current];
    if (!active.paused) return true;
    if (!active.src) active.src = tracks[trackRef.current];
    active.volume = volume;
    try {
      await active.play();
      setPlaying(true);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => watchRef.current());
      return true;
    } catch {
      setPlaying(false);
      return false;
    }
  }, [ensurePlayers, volume]);

  useEffect(() => {
    const savedMusicValue = localStorage.getItem("dodam_music_volume");
    const savedVoiceValue = localStorage.getItem("dodam_voice_volume");
    const savedMusic = savedMusicValue === null ? Number.NaN : Number(savedMusicValue);
    const savedVoice = savedVoiceValue === null ? Number.NaN : Number(savedVoiceValue);
    const savedEnabled = localStorage.getItem("dodam_music_enabled");
    const shouldPlay = savedEnabled !== "false";
    queueMicrotask(() => {
      if (Number.isFinite(savedMusic) && savedMusic >= 0) setVolume(Math.min(savedMusic, 50) / 100);
      if (Number.isFinite(savedVoice) && savedVoice >= 0) setVoiceVolume(Math.min(savedVoice, 100));
      setEnabled(shouldPlay);
    });
    if (!shouldPlay) return;

    queueMicrotask(() => void startMusic());
    const resumeAfterUserGesture = () => void startMusic();
    window.addEventListener("pointerdown", resumeAfterUserGesture, { once: true, capture: true });
    window.addEventListener("keydown", resumeAfterUserGesture, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", resumeAfterUserGesture, { capture: true });
      window.removeEventListener("keydown", resumeAfterUserGesture, { capture: true });
    };
  }, [startMusic]);

  useEffect(() => {
    playersRef.current.forEach((audio, index) => {
      if (!fadingRef.current || index === activeRef.current) audio.volume = volume;
    });
  }, [volume]);

  useEffect(() => () => {
    playersRef.current.forEach((audio) => audio.pause());
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  async function toggle() {
    if (enabled && playing) {
      playersRef.current.forEach((audio) => audio.pause());
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      localStorage.setItem("dodam_music_enabled", "false");
      setEnabled(false);
      setPlaying(false);
      return;
    }
    localStorage.setItem("dodam_music_enabled", "true");
    setEnabled(true);
    await startMusic();
  }

  function changeMusic(value: number) {
    setVolume(value / 100);
    localStorage.setItem("dodam_music_volume", String(value));
  }

  function changeVoice(value: number) {
    setVoiceVolume(value);
    localStorage.setItem("dodam_voice_volume", String(value));
    window.dispatchEvent(new CustomEvent("dodam-voice-volume", { detail: value }));
  }

  return <div className="sound-settings">
    <button className="settings-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="음량 설정">⚙ 설정</button>
    {open && <section className="sound-panel">
      <strong>음량</strong>
      <label><span>배경음 <b>{Math.round(volume * 100)}%</b></span><input type="range" min="0" max="50" value={Math.round(volume * 100)} onChange={(event) => changeMusic(Number(event.target.value))} /></label>
      <label><span>동화 낭독 목소리 <b>{voiceVolume}%</b></span><input type="range" min="0" max="100" value={voiceVolume} onChange={(event) => changeVoice(Number(event.target.value))} /></label>
      <small>아기토끼가 읽어주는 AI 목소리 음량입니다. 마이크 입력 음량과는 무관합니다.</small>
      <button className="music-switch" type="button" onClick={() => void toggle()}>{enabled ? "♫ 배경음 끄기" : "♪ 배경음 켜기"}</button>
    </section>}
  </div>;
}
