"use client";

import { useEffect, useState } from "react";

type DashboardStats = { users: number; stories: number; todayStories: number; conversations: number; themes: Array<{ theme: string | null; value: number }>; initializing?: boolean };

async function loadStats(): Promise<DashboardStats> {
  try {
    const response = await fetch("https://storybook-dad-korea.jojojojo.chatgpt.site/api/stats", { cache: "no-store" });
    if (!response.ok) throw new Error("stats unavailable");
    return await response.json() as DashboardStats;
  } catch { return { users: 0, stories: 0, todayStories: 0, conversations: 0, themes: [], initializing: true }; }
}

const emptyStats: DashboardStats = { users: 0, stories: 0, todayStories: 0, conversations: 0, themes: [] };
const voices = [
  ["Sulafat", "술라파트 · 따뜻함"], ["Achird", "아키르드 · 친근함"], ["Achernar", "아케르나르 · 부드러움"], ["Vindemiatrix", "빈데미아트릭스 · 온화함"],
  ["Kore", "코레 · 또렷하고 단단함"], ["Aoede", "아오이데 · 산뜻함"], ["Puck", "퍽 · 경쾌함"], ["Leda", "레다 · 젊고 밝음"],
  ["Iapetus", "이아페투스 · 맑고 선명함"], ["Algieba", "알기에바 · 매끄러움"], ["Schedar", "셰다르 · 안정적임"], ["Gacrux", "가크룩스 · 성숙함"],
] as const;

export default function AdminHome() {
  const [data, setData] = useState<DashboardStats>(emptyStats);
  const [voice, setVoice] = useState("Sulafat");
  const [voiceStatus, setVoiceStatus] = useState("현재 설정을 불러오는 중입니다.");
  useEffect(() => { void loadStats().then(setData); void fetch("/api/voice").then((response) => response.json()).then((result: { voice?: string }) => { if (result.voice) setVoice(result.voice); setVoiceStatus("현재 모든 사용자에게 적용 중입니다."); }).catch(() => setVoiceStatus("목소리 설정을 불러오지 못했습니다.")); }, []);
  async function saveVoice() {
    setVoiceStatus("저장 중입니다…");
    const response = await fetch("/api/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ voice }) });
    setVoiceStatus(response.ok ? "저장되었습니다. 다음 낭독부터 적용됩니다." : "저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
  }
  const stats = [
    { label: "오늘 만든 동화", value: String(data.todayStories), change: "오늘 자정부터" },
    { label: "동화 대화", value: String(data.conversations), change: "누적 시작 횟수" },
    { label: "동화 작가", value: String(data.stories), change: "누적 완성 권수" },
    { label: "익명 이용 기기", value: String(data.users), change: "로그인 도입 전 집계" },
  ];
  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div>
          <p className="brand-mark">SD</p>
          <div className="brand-copy">
            <strong>StoryDaddy</strong>
            <span>관리자</span>
          </div>
        </div>
        <nav aria-label="관리자 메뉴">
          <a className="active" href="#overview">개요</a>
          <a href="#stories">이야기</a>
          <a href="#themes">주제</a>
          <a href="#users">사용자</a>
          <a href="#settings">API 설정</a>
        </nav>
        <p className="private-badge">● 소유자 전용</p>
      </aside>

      <section className="content" id="overview">
        <header className="topbar">
          <div>
            <p className="eyebrow">동화나라 아이아빠</p>
            <h1>좋은 저녁이에요, 관리자님</h1>
            <p>서비스가 들려주는 이야기의 흐름을 한눈에 살펴보세요.</p>
          </div>
          <a className="service-link" href="https://storybook-dad-korea.jojojojo.chatgpt.site">사용자 사이트 ↗</a>
        </header>

        <section className="stats-grid" aria-label="이용 현황">
          {stats.map((stat) => (
            <article className="stat-card" key={stat.label}>
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
              <span>{stat.change}</span>
            </article>
          ))}
        </section>

        <section className="dashboard-grid">
          <article className="panel activity-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">최근 7일</p>
                <h2>이야기 활동</h2>
              </div>
              <span className="muted-pill">실시간 집계</span>
            </div>
            <div className="empty-chart" aria-label="아직 집계된 활동이 없습니다">
              <div className="chart-lines" aria-hidden="true"><i /><i /><i /><i /></div>
              <p>{data.initializing ? "데이터베이스를 준비하고 있습니다." : `현재 누적 이야기 활동은 ${data.stories + data.conversations}회입니다.`}</p>
            </div>
          </article>

          <article className="panel api-panel" id="settings">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Google Gemini</p>
                <h2>API 연결</h2>
              </div>
              <span className="status-dot connected">서버 연결</span>
            </div>
            <div className="api-body">
              <div className="key-icon" aria-hidden="true">•••</div>
              <h3>서버 비밀값으로 보호 중</h3>
              <p>API 키는 화면과 데이터베이스에 노출하지 않고 사용자 서버에서만 Gemini 요청에 사용합니다.</p>
              <button type="button" disabled>연결됨</button>
              <small>키 값은 관리자 화면에서도 표시되지 않습니다.</small>
            </div>
            <div className="voice-settings">
              <label htmlFor="tts-voice">동화 대화 목소리</label>
              <select id="tts-voice" value={voice} onChange={(event) => setVoice(event.target.value)}>{voices.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
              <button type="button" onClick={() => void saveVoice()}>이 목소리로 저장</button>
              <small aria-live="polite">{voiceStatus}</small>
            </div>
          </article>

          <article className="panel topics-panel" id="themes">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">콘텐츠</p>
                <h2>많이 만난 주제</h2>
              </div>
            </div>
            <div className="theme-list">{data.themes.length ? data.themes.map((item) => <div key={item.theme}><span>{item.theme}</span><strong>{item.value}회</strong></div>) : <div><span>아직 사용된 주제가 없습니다.</span></div>}</div>
          </article>

          <article className="panel readiness-panel">
            <p className="eyebrow">준비 현황</p>
            <h2>서비스 체크리스트</h2>
            <ul>
              <li className="done"><span>✓</span> 사용자 사이트 공개</li>
              <li className="done"><span>✓</span> 관리자 사이트 보호</li>
              <li className="done"><span>✓</span> Gemini 무료 API 연결</li>
              <li className="done"><span>✓</span> 이야기 통계 저장</li>
            </ul>
          </article>
        </section>
      </section>
    </main>
  );
}
