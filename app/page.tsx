import Link from "next/link";

export default function Home() {
  return (
    <main className="home">
      <div className="moon" aria-hidden="true" />
      <section className="welcome intro" aria-labelledby="site-title">
        <p className="eyebrow">아빠와 아이가 함께 만드는 이야기</p>
        <h1 id="site-title">동화나라 아이아빠</h1>
        <p className="status">포근한 이야기를 준비하고 있어요.</p>
      </section>

      <section className="feature-picker" aria-labelledby="feature-title">
        <p className="eyebrow">오늘은 어떤 이야기를 만나볼까요?</p>
        <h2 id="feature-title">이야기 방을 골라주세요</h2>
        <div className="feature-grid">
          <Link className="feature-card conversation" href="/conversation">
            <span className="feature-icon" aria-hidden="true">☾</span>
            <span className="feature-name">동화 대화</span>
            <span className="feature-description">
              목소리로 이야기를 만들고<br />끊김 없이 계속 이어가요
            </span>
            <span className="feature-action">이야기 시작하기</span>
          </Link>

          <Link className="feature-card writer" href="/writer">
            <span className="feature-icon" aria-hidden="true">✦</span>
            <span className="feature-name">동화 작가</span>
            <span className="feature-description">
              매일 새로운 주제의 동화를<br />책장처럼 넘겨 읽어요
            </span>
            <span className="feature-action">오늘의 동화 만나기</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
