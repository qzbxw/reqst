"use client";

import { MarketingLayout, useReveal } from "./MarketingLayout";
import Link from "next/link";
import { PUBLIC_MARKETING_COPY } from "@/i18n";

export type NetworkInfo = {
  name: string;
  fullName: string;
  description: string;
  features: { title: string; body: string }[];
};

export function NetworkPageTemplate({
  language,
  network,
}: {
  language: "ru" | "en";
  network: NetworkInfo;
}) {
  const reveal = useReveal();
  const copy = PUBLIC_MARKETING_COPY[language];

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <MarketingLayout language={language}>
      <section className="lend-hero lend-hero--centered" ref={reveal}>
        <div className="lend-hero-copy">
          <span className="lend-section-kicker lend-reveal--1">
            {copy.networks.kicker}
          </span>
          <h1 className="lend-reveal--2">{network.fullName}</h1>
          <p className="lend-reveal--3">{network.description}</p>
          <div className="lend-cta-row lend-reveal--4">
            <Link className="lend-primary" href="/app/auth">
              {copy.accept} {network.name}
            </Link>
            <Link className="lend-secondary" href={`/${language}/docs/introduction`}>
              {copy.technicalDocs}
            </Link>
          </div>
        </div>
      </section>

      <section className="lend-stacked-section" ref={reveal}>
        <div className="lend-overview-grid lend-reveal--2">
          {network.features.map((feature, i) => (
            <article key={i} className="lend-card lend-spotlight-card" onMouseMove={handleMouseMove}>
              <div className="lend-card-spotlight" />
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
