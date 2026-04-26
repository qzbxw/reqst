import { useEffect } from "react";
import Link from "next/link";
import { MarketingLayout, useReveal } from "../MarketingLayout";
import { useUI } from "../../UIProvider";
import { JsonLd } from "../../JsonLd";
import { PUBLIC_MARKETING_COPY, PUBLIC_PLAN_COPY } from "@/i18n";
import { planSEOEn } from "@/i18n/plans.en";
import { planSEORu } from "@/i18n/plans.ru";

export function PlanBusiness() {
  const { language } = useUI();
  const text = PUBLIC_PLAN_COPY[language];
  const marketing = PUBLIC_MARKETING_COPY[language];
  const product = text.business;
  const seoText = language === "en" ? planSEOEn.business : planSEORu.business;
  const reveal = useReveal();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": seoText.hero.badge,
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "499.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": seoText.faq.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  return (
    <MarketingLayout language={language}>
      <JsonLd schema={applicationSchema} />
      <JsonLd schema={faqSchema} />

      {/* Hero Section */}
      <header className="lend-hero lend-hero--centered lend-biz-hero" ref={reveal}>
        <div className="lend-hero-copy">
          <span className="lend-section-kicker lend-reveal--1">{seoText.hero.badge}</span>
          <h1 className="lend-reveal--2">{seoText.hero.title}</h1>
          <p className="lend-reveal--3">{seoText.hero.body}</p>

          <div className="lend-cta-row lend-reveal--4">
            <Link className="lend-primary" href="/app/auth">
              {marketing.activate}
            </Link>
            <Link className="lend-secondary" href="/app/auth">
              {text.auth}
            </Link>
          </div>
        </div>
      </header>

      {/* Deep Dive Section */}
      <section className="lend-stacked-section" ref={reveal}>
        <div className="lend-section-copy text-center max-w-3xl mx-auto lend-reveal--1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span className="lend-section-kicker">{text.compareTitle}</span>
          <h2 style={{ textAlign: 'center' }}>{seoText.deepDive.title}</h2>
          <p style={{ textAlign: 'center' }}>{text.compareSectionBody}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 lend-reveal--2">
          {seoText.deepDive.cards.map((feat, i) => (
            <article key={i} className={`lend-card lend-plan-feature-card lend-reveal--${2 + i}`}>
              <h3>{feat.title}</h3>
              <p>{feat.body}</p>
            </article>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 lend-reveal--3">
          {product.stats.map((stat, i) => (
            <article key={i} className={`lend-card lend-stat-card text-center flex flex-col items-center justify-center p-6 lend-reveal--${4 + i}`}>
              <span className="lend-stat-label mb-2">{stat.label}</span>
              <strong className="lend-stat-value text-2xl md:text-3xl">{stat.value}</strong>
            </article>
          ))}
        </div>
      </section>

      {/* Integration Flow */}
      <section className="lend-stacked-section lend-flow-section" ref={reveal}>
        <div className="lend-section-copy lend-reveal--1">
          <span className="lend-section-kicker">{text.flowTitle}</span>
          <h2>{marketing.seamlessFlow}</h2>
        </div>
        <div className="lend-flow-container">
          {product.flow.map((step, i) => (
            <article key={i} className={`lend-card lend-flow-card lend-reveal--${2 + i}`}>
              <div className="lend-flow-step-number">{i + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              {i < 2 && <div className="lend-flow-arrow">→</div>}
            </article>
          ))}
        </div>
      </section>

      {/* Technical Specs */}
      <section className="lend-stacked-section lend-specs-section" ref={reveal}>
        <div className="lend-card lend-reveal--1">
          <div className="lend-reveal--2">
            <span className="lend-section-kicker">Architecture</span>
            <h2>{seoText.technicalSpecs.title}</h2>
            <p>{seoText.technicalSpecs.description}</p>
          </div>
          <dl className="lend-specs-grid lend-reveal--3">
            {seoText.technicalSpecs.specs.map((spec, i) => (
              <div key={i} className="lend-spec-item">
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Security Architecture */}
      <section className="lend-stacked-section lend-security-section" ref={reveal}>
        <div className="lend-section-copy lend-reveal--1">
          <span className="lend-section-kicker">Security</span>
          <h2>{seoText.securityArchitecture.title}</h2>
          <p className="lend-security-body">{seoText.securityArchitecture.body}</p>
        </div>
      </section>

      {/* Ideal For Section */}
      <section className="lend-stacked-section lend-ideal-section" ref={reveal}>
         <div className="lend-card lend-reveal--1">
            <header className="lend-reveal--2">
              <span className="lend-section-kicker">Target Audience</span>
              <h2>{seoText.idealFor.title}</h2>
              <p>{seoText.idealFor.description}</p>
            </header>
            <ul className="lend-reveal--3 lend-ideal-list">
              {seoText.idealFor.points.map((point, i) => (
                <li key={i}>
                  <span className="lend-check-icon">✓</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
         </div>
      </section>

      {/* FAQ Section */}
      <section className="lend-stacked-section lend-faq-section" ref={reveal}>
        <header className="lend-section-copy lend-reveal--1">
          <span className="lend-section-kicker">FAQ</span>
          <h2>Frequently Asked Questions</h2>
        </header>
        <dl className="lend-faq-grid">
          {seoText.faq.map((item, i) => (
            <div key={i} className={`lend-card lend-reveal--${2 + i}`}>
              <dt><h3>{item.q}</h3></dt>
              <dd><p>{item.a}</p></dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Final CTA */}
      <footer className="lend-final lend-plan-final" ref={reveal}>
        <div className="lend-reveal--1">
          <span className="lend-section-kicker">{text.priceTitle}</span>
        </div>
        <div className="lend-reveal--2">
          <h2 className="lend-price-value">{product.priceLabel}</h2>
        </div>
        <div className="lend-reveal--3">
          <p className="lend-price-period">{product.period}</p>
          <p className="lend-price-subtitle">{text.priceSubtitle}</p>
        </div>

        <div className="lend-cta-row lend-reveal--4">
          <Link className="lend-primary lend-price-btn" href="/app/auth">
            {marketing.activateVerb} {product.badge}
          </Link>
        </div>
      </footer>
    </MarketingLayout>
  );
}
