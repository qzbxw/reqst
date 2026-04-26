import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useUI } from "../lib/ui";
import { LANDING_COPY as COPY, BOT_URL } from "../i18n";

function useReveal() {
  const refs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          }
        });
      },
      { threshold: 0.1 }
    );
    refs.current.forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, []);
  return (el: HTMLElement | null) => {
    if (el && !refs.current.includes(el)) refs.current.push(el);
  };
}

export function LandingPage() {
  const { language, setLanguage } = useUI();
  const copy = COPY[language];
  const [openFaq, setOpenFaq] = useState(0);
  const reveal = useReveal();

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
  }, []);

  return (
    <main className="lend-page">
      <div className="lend-backdrop lend-backdrop--grid" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--left" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--right" />

      <div className="lend-shell">
        <header className="lend-topbar">
          <div className="lend-topbar-main">
            <Link className="lend-brand" to="/">
              <strong>reqst</strong>
            </Link>

            <div className="lend-topbar-actions">
              <div className="lend-language" role="group" aria-label="language switcher">
                <button type="button" className={language === "ru" ? "active" : ""} onClick={() => setLanguage("ru")}>RU</button>
                <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button>
              </div>
            </div>
          </div>
        </header>

        <section className="lend-hero" ref={reveal}>
          <div className="lend-hero-copy">
            <h1 className="lend-reveal--1">{copy.hero.title}</h1>
            <p className="lend-reveal--2">{copy.hero.body}</p>
            <p className="lend-hero-subcopy lend-reveal--2">{copy.hero.subcopy}</p>

            <div className="lend-cta-row lend-reveal--3">
              <Link className="lend-primary" to="/auth">
                {copy.hero.primary}
              </Link>
              <a className="lend-secondary" href={BOT_URL} target="_blank" rel="noreferrer">
                {copy.hero.secondary}
              </a>
            </div>

          </div>

          <aside className="lend-hero-side lend-reveal--3" aria-label={copy.heroPanel.title}>
            <div className="lend-hero-panel">
              <div className="lend-panel-heading">
                <h2>{copy.heroPanel.title}</h2>
                <p>{copy.heroPanel.body}</p>
              </div>

              <div className="lend-panel-actions">
                <Link className="lend-primary" to="/checkout/demo">
                  {copy.heroPanel.primary}
                </Link>
                <Link className="lend-secondary" to="/auth">
                  {copy.heroPanel.secondary}
                </Link>
              </div>
            </div>
          </aside>
        </section>

        <section id="overview" className="lend-split-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.overview.kicker}</span>
            <h2>{copy.overview.title}</h2>
            <p>{copy.overview.body}</p>
          </div>

          <div className="lend-overview-grid lend-reveal--2">
            {copy.overview.cards.map((card) => (
              <article key={card.title} className="lend-card lend-card--overview lend-spotlight-card" onMouseMove={handleMouseMove}>
                <div className="lend-card-spotlight" />
                <div className="lend-dogfood-glow" />
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="capabilities" className="lend-stacked-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.capabilities.kicker}</span>
            <h2>{copy.capabilities.title}</h2>
            <p>{copy.capabilities.body}</p>
          </div>

          <div className="lend-feature-grid lend-feature-grid--expanded lend-reveal--2">
            {copy.capabilities.items.map((feature, index) => (
              <article key={feature.title} className="lend-card lend-card--feature lend-spotlight-card" onMouseMove={handleMouseMove}>
                <div className="lend-card-spotlight" />
                <div className="lend-dogfood-glow" />
                <span>{feature.kicker}</span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-compare" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.compare.kicker}</span>
            <h2>{copy.compare.title}</h2>
            <p>{copy.compare.body}</p>
          </div>

          <div className="lend-compare-board lend-reveal--2">
            {copy.compare.rows.map((row) => (
              <article key={row.legacy} className="lend-compare-row">
                <div className="lend-compare-legacy">
                  <span>BEFORE REQST</span>
                  <p>{row.legacy}</p>
                </div>
                <div className="lend-compare-separator" />
                <div className="lend-compare-reqst">
                  <span>WITH REQST</span>
                  <p>{row.reqst}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="networks" className="lend-stacked-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.networks.kicker}</span>
            <h2>{copy.networks.title}</h2>
            <p>{copy.networks.body}</p>
          </div>

          <div className="lend-network-grid lend-reveal--2">
            {copy.networks.rails.map((rail) => (
              <article key={rail.title} className="lend-network-card lend-spotlight-card" onMouseMove={handleMouseMove}>
                <div className="lend-card-spotlight" />
                <div className="lend-dogfood-glow" />
                <div className="lend-network-badge">{rail.name}</div>
                <h3>{rail.title}</h3>
                <p>{rail.body}</p>
              </article>
            ))}
          </div>
        </section>
<section className="lend-stacked-section lend-dogfood-section" ref={reveal}>
  <div className="lend-section-copy lend-reveal--1">
    <span className="lend-section-kicker">{copy.dogfooding.kicker}</span>
    <h2>{copy.dogfooding.title}</h2>
  </div>

  <div className="lend-dogfood-grid lend-reveal--2">
    {copy.dogfooding.cards.map((card, idx) => (
      <div 
        key={card.title} 
        className="lend-dogfood-item lend-spotlight-card" 
        onMouseMove={handleMouseMove}
      >
        <div className="lend-card-spotlight" />
        <div className="lend-dogfood-glow" />
        <div className="lend-dogfood-content">
          <span className="lend-section-kicker">0{idx + 1}</span>
          <h3>{card.title}</h3>
          <p>{card.body}</p>
        </div>
      </div>
    ))}
  </div>
      </section>

      <section id="pricing" className="lend-stacked-section" ref={reveal}>
        <div className="lend-section-copy lend-reveal--1">
          <span className="lend-section-kicker">{copy.pricing.kicker}</span>
          <h2>{copy.pricing.title}</h2>
        </div>

        <div className="lend-pricing-grid lend-reveal--2">
          <div className="lend-pricing-card lend-pricing-card--pro lend-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="lend-card-spotlight" />
            <div className="lend-dogfood-glow" />
            <div className="lend-pricing-badge">{copy.pricing.pro.trial}</div>
            <h3>{copy.pricing.pro.name}</h3>
            <div className="lend-price">
              <span>$</span>
              {copy.pricing.pro.price}
              <span>/mo</span>
            </div>
            <ul>
              {copy.pricing.pro.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            <Link className="lend-primary" to="/auth">{copy.pricing.pro.cta}</Link>
          </div>

          <div className="lend-pricing-card lend-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="lend-card-spotlight" />
            <div className="lend-dogfood-glow" />
            <h3>{copy.pricing.api.name}</h3>
            <div className="lend-price">
              <span>$</span>{copy.pricing.api.price}<span>/mo</span>
            </div>
            <ul>
              {copy.pricing.api.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            <Link className="lend-secondary" to="/dev">{copy.pricing.api.cta}</Link>
          </div>

          <div className="lend-pricing-card lend-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="lend-card-spotlight" />
            <div className="lend-dogfood-glow" />
            <h3>{copy.pricing.enterprise.name}</h3>
            <div className="lend-price">
              {copy.pricing.enterprise.price}
            </div>
            <ul className={copy.pricing.enterprise.price === 'Custom' ? 'lend-pricing-card__list--custom-margin' : ''}>
              {copy.pricing.enterprise.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            <Link className="lend-secondary" to="/enterprise">{copy.pricing.enterprise.cta}</Link>
          </div>
        </div>
      </section>

      <section id="faq" className="lend-faq-section" ref={reveal}>
          <div className="lend-section-copy lend-faq-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.faq.kicker}</span>
            <h2>{copy.faq.title}</h2>
            <p>{copy.faq.body}</p>
          </div>

          <div className="lend-faq-stack lend-reveal--2">
            {copy.faq.items.map((item, index) => {
              const isOpen = index === openFaq;
              const answerId = `landing-faq-answer-${index}`;
              return (
                <article key={item.question} className={`lend-faq-item${isOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="lend-faq-trigger"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  >
                    <div className="lend-faq-trigger-copy">
                      <span className="lend-faq-kicker">Protocol Detail 0{index + 1}</span>
                      <span className="lend-faq-question-text">{item.question}</span>
                    </div>
                    <div className="lend-faq-icon">
                      <div className="lend-faq-icon-line" />
                      <div className="lend-faq-icon-line" />
                    </div>
                  </button>
                  <div
                    id={answerId}
                    className={`lend-faq-answer-wrapper${isOpen ? " is-open" : ""}`}
                    aria-hidden={!isOpen}
                  >
                    <div className="lend-faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="lend-final" ref={reveal}>
          <div className="lend-reveal--1">
            <span className="lend-section-kicker">{copy.final.kicker}</span>
            <h2>{copy.final.title}</h2>
            <p>{copy.final.body}</p>

            <div className="lend-cta-row">
              <Link className="lend-primary" to="/auth">
                {copy.final.primary}
              </Link>
              <div className="lend-inline-links">
                <Link className="lend-secondary" to="/dev">
                  {copy.footer.api}
                </Link>
                <Link className="lend-secondary" to="/enterprise">
                  {copy.footer.b2b}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="lend-footer">
          <div className="lend-footer-links">
            <Link to="/privacy">{copy.footer.privacy}</Link>
            <Link to="/terms">{copy.footer.terms}</Link>
            <Link to="/developers">Docs</Link>
            <Link to="/dev">{copy.footer.api}</Link>
            <Link to="/enterprise">{copy.footer.b2b}</Link>
            <Link to="/auth">{copy.footer.console}</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
