const stats = [
  { label: "오늘 만든 동화", value: "0", change: "서비스 준비 중" },
  { label: "동화 대화", value: "0", change: "서비스 준비 중" },
  { label: "동화 작가", value: "0", change: "서비스 준비 중" },
  { label: "누적 이야기", value: "0", change: "데이터 연결 전" },
];

export default function AdminHome() {
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
              <span className="muted-pill">데이터 연결 전</span>
            </div>
            <div className="empty-chart" aria-label="아직 집계된 활동이 없습니다">
              <div className="chart-lines" aria-hidden="true"><i /><i /><i /><i /></div>
              <p>첫 이야기가 시작되면 이곳에 활동 그래프가 나타납니다.</p>
            </div>
          </article>

          <article className="panel api-panel" id="settings">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">OpenAI</p>
                <h2>API 연결</h2>
              </div>
              <span className="status-dot">미연결</span>
            </div>
            <div className="api-body">
              <div className="key-icon" aria-hidden="true">•••</div>
              <h3>서버 비밀키가 필요해요</h3>
              <p>API 키는 이 화면이나 데이터베이스에 저장하지 않고, 안전한 서버 비밀값으로만 연결합니다.</p>
              <button type="button" disabled>안전하게 연결하기</button>
              <small>OpenAI Developers 연결 후 활성화됩니다.</small>
            </div>
          </article>

          <article className="panel topics-panel" id="themes">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">콘텐츠</p>
                <h2>많이 만난 주제</h2>
              </div>
            </div>
            <div className="empty-list">
              <span aria-hidden="true">✦</span>
              <p>아직 사용된 주제가 없습니다.</p>
            </div>
          </article>

          <article className="panel readiness-panel">
            <p className="eyebrow">준비 현황</p>
            <h2>서비스 체크리스트</h2>
            <ul>
              <li className="done"><span>✓</span> 사용자 사이트 공개</li>
              <li className="done"><span>✓</span> 관리자 사이트 보호</li>
              <li><span>3</span> OpenAI API 연결</li>
              <li><span>4</span> 이야기 통계 저장</li>
            </ul>
          </article>
        </section>
      </section>
    </main>
  );
}
