"use client";

export default function HeroSection({ onOpenTuneTaste }) {
  const handleExploreClick = (e) => {
    e.preventDefault();
    const showcase = document.getElementById("showcaseSection");
    if (showcase) {
      showcase.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="hero-section" id="home">
      <div className="container hero-container">
        <h1 className="hero-heading">
          Where Coffee <span className="hero-heading-gradient">Meets Music</span>
        </h1>

        <p className="hero-subtitle">
          Your coffee, your music, your little escape.
        </p>

        <div className="hero-cta-group">
          <a
            href="#showcaseSection"
            className="btn-hero-primary"
            id="btnExploreMusic"
            onClick={handleExploreClick}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <span>Explore Music</span>
          </a>
          <button
            type="button"
            className="btn-hero-secondary"
            id="btnTuneTasteHero"
            onClick={onOpenTuneTaste}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.28 19.64 10.59 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
            </svg>
            <span>Tune Your Taste</span>
          </button>
        </div>

        {/* Silent backward compatibility state hooks */}
        <span id="ribbonLang" style={{ display: "none" }}></span>
        <span id="ribbonMood" style={{ display: "none" }}></span>
        <span id="ribbonSingers" style={{ display: "none" }}></span>
        <span id="ribbonSeeds" style={{ display: "none" }}></span>
        <button id="btnEditRibbon" style={{ display: "none" }} aria-hidden="true"></button>
      </div>
    </section>
  );
}
