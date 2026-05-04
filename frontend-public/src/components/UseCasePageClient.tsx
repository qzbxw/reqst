"use client";

import { useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Globe, 
  Cpu, 
  Workflow
} from "lucide-react";
import { MarketingLayout, useReveal } from "./marketing/MarketingLayout";
import { useUI } from "./UIProvider";
import { JsonLd } from "./JsonLd";
import { Locale } from "@/i18n";
import "./marketing/plans/plans.css";

type LinkCopy = {
  readonly kicker: string;
  readonly label: string;
  readonly body: string;
  readonly href: string;
};

type UseCaseCopy = {
  readonly name: string;
  readonly metadata: {
    readonly title: string;
    readonly description: string;
  };
  readonly kicker: string;
  readonly hero: {
    readonly title: string;
    readonly body: string;
  };
  readonly problem: {
    readonly kicker: string;
    readonly title: string;
    readonly body: string;
  };
  readonly solution: {
    readonly kicker: string;
    readonly title: string;
    readonly body: string;
  };
  readonly productPlan: {
    readonly kicker: string;
    readonly title: string;
    readonly body: string;
    readonly product: {
      readonly label: string;
      readonly title: string;
      readonly body: string;
      readonly href: string;
      readonly linkLabel: string;
    };
    readonly plan: {
      readonly label: string;
      readonly title: string;
      readonly body: string;
      readonly href: string;
      readonly linkLabel: string;
    };
  };
  readonly networks: {
    readonly kicker: string;
    readonly title: string;
    readonly body: string;
    readonly items: readonly {
      readonly name: string;
      readonly body: string;
    }[];
  };
  readonly flow: {
    readonly kicker: string;
    readonly title: string;
    readonly steps: readonly {
      readonly title: string;
      readonly body: string;
    }[];
  };
  readonly related: {
    readonly kicker: string;
    readonly title: string;
    readonly links: readonly LinkCopy[];
  };
  readonly cta: {
    readonly title: string;
    readonly body: string;
    readonly primary: {
      readonly label: string;
      readonly href: string;
    };
    readonly secondary: {
      readonly label: string;
      readonly href: string;
    };
  };
  readonly features: readonly string[];
  readonly seoLabel: string;
  readonly seo: string;
};

type Props = {
  usecase: string;
  locale: Locale;
  copy: UseCaseCopy;
};

function localizedHref(locale: Locale, path: string) {
  if (path.startsWith("/app/")) return path;
  return `/${locale}${path}`;
}

export function UseCasePageClient({ usecase, locale, copy }: Props) {
  const reveal = useReveal();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [usecase]);

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `Reqst ${copy.name}`,
    applicationCategory: "PaymentApplication",
    operatingSystem: "Web",
    description: copy.metadata.description,
    featureList: copy.features,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "128",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <MarketingLayout language={locale}>
      <JsonLd schema={softwareSchema} />
      
      {/* Hero Section */}
      <header className="lend-hero lend-hero--centered" ref={reveal}>
        <div className="lend-hero-copy">
          <span className="lend-section-kicker font-bold uppercase tracking-widest lend-reveal--1">{copy.kicker}</span>
          <h1 className="text-4xl md:text-6xl font-extrabold mt-4 mb-6 tracking-tight lend-reveal--2">
            {copy.hero.title}
          </h1>
          <p className="text-xl opacity-70 max-w-2xl mx-auto leading-relaxed mb-10 font-medium lend-reveal--3">
            {copy.hero.body}
          </p>
          <div className="lend-cta-row lend-reveal--4">
            <Link href={copy.cta.primary.href} className="lend-primary">
              {copy.cta.primary.label}
            </Link>
            <Link href={localizedHref(locale, copy.cta.secondary.href)} className="lend-secondary">
              {copy.cta.secondary.label}
            </Link>
          </div>
        </div>
      </header>

      {/* Narrative Section (Problem/Solution) */}
      <section className="lend-stacked-section" ref={reveal}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article className="lend-card flex flex-col p-8 md:p-12 lend-reveal--1">
            <span className="text-xs font-bold text-red-400/80 uppercase tracking-widest mb-4 block">
              {copy.problem.kicker}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">{copy.problem.title}</h2>
            <p className="text-lg opacity-70 leading-relaxed font-medium">{copy.problem.body}</p>
          </article>
          
          <article className="lend-card flex flex-col p-8 md:p-12 border-blue-500/20 bg-blue-500/5 lend-reveal--2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 block">
              {copy.solution.kicker}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">{copy.solution.title}</h2>
            <p className="text-lg opacity-80 leading-relaxed font-medium">{copy.solution.body}</p>
          </article>
        </div>
      </section>

      {/* Product & Plan Recommendations */}
      <section className="lend-stacked-section" ref={reveal}>
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center mb-16">
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker font-bold">{copy.productPlan.kicker}</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">{copy.productPlan.title}</h2>
            <p className="text-lg opacity-70 font-medium">{copy.productPlan.body}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <article className="lend-card p-10 flex flex-col lend-reveal--2">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <Layers size={24} className="text-blue-400" />
            </div>
            <span className="text-xs font-bold opacity-40 uppercase tracking-widest mb-2 block">{copy.productPlan.product.label}</span>
            <h3 className="text-2xl font-bold mb-4">{copy.productPlan.product.title}</h3>
            <p className="opacity-70 leading-relaxed mb-8 flex-grow font-medium">{copy.productPlan.product.body}</p>
            <Link href={localizedHref(locale, copy.productPlan.product.href)} className="flex items-center gap-2 text-blue-400 font-bold hover:gap-3 transition-all group">
              {copy.productPlan.product.linkLabel}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </article>

          <article className="lend-card p-10 flex flex-col lend-reveal--3">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <ShieldCheck size={24} className="text-purple-400" />
            </div>
            <span className="text-xs font-bold opacity-40 uppercase tracking-widest mb-2 block">{copy.productPlan.plan.label}</span>
            <h3 className="text-2xl font-bold mb-4">{copy.productPlan.plan.title}</h3>
            <p className="opacity-70 leading-relaxed mb-8 flex-grow font-medium">{copy.productPlan.plan.body}</p>
            <Link href={localizedHref(locale, copy.productPlan.plan.href)} className="flex items-center gap-2 text-purple-400 font-bold hover:gap-3 transition-all group">
              {copy.productPlan.plan.linkLabel}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </article>
        </div>
      </section>

      {/* Network Support */}
      <section className="lend-stacked-section" ref={reveal}>
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center mb-16">
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker font-bold">{copy.networks.kicker}</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">{copy.networks.title}</h2>
            <p className="text-lg opacity-70 font-medium">{copy.networks.body}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {copy.networks.items.map((network, index) => (
            <article key={network.name} className={`lend-card p-8 lend-reveal--${index + 1}`}>
              <div className="flex items-center gap-3 mb-4">
                <Globe size={20} className="text-blue-400" />
                <strong className="text-lg font-bold">{network.name}</strong>
              </div>
              <p className="opacity-70 text-sm leading-relaxed font-medium">{network.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Flow Section (Horizontal) */}
      <section className="lend-stacked-section" ref={reveal}>
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center mb-16 md:mb-24">
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker font-bold">{copy.flow.kicker}</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">{copy.flow.title}</h2>
          </div>
        </div>

        <div className="relative lend-reveal--2">
          <div className="absolute top-8 left-0 w-full h-px bg-white/10 hidden md:block" />
          <div className={`grid grid-cols-1 gap-8 ${
            copy.flow.steps.length === 1 ? "md:grid-cols-1" :
            copy.flow.steps.length === 2 ? "md:grid-cols-2" :
            copy.flow.steps.length === 3 ? "md:grid-cols-3" :
            copy.flow.steps.length === 5 ? "md:grid-cols-5" :
            copy.flow.steps.length === 6 ? "md:grid-cols-6" :
            "md:grid-cols-4"
          }`}>
            {copy.flow.steps.map((step, index) => (
              <article key={step.title} className="relative group">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-bold mb-6 group-hover:border-blue-500/50 group-hover:bg-blue-500/5 transition-all relative z-10 mx-auto md:mx-0">
                  <span className="bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-3 text-center md:text-left">{step.title}</h3>
                <p className="text-sm opacity-60 leading-relaxed text-center md:text-left font-medium">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Related Section */}
      <section className="lend-stacked-section" ref={reveal}>
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center mb-16">
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker font-bold">{copy.related.kicker}</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">{copy.related.title}</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {copy.related.links.map((link, index) => (
            <Link key={link.href} href={localizedHref(locale, link.href)} className={`lend-card p-8 group hover:border-blue-500/30 transition-all lend-reveal--${index + 1}`}>
              <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-4 block group-hover:opacity-100 group-hover:text-blue-400 transition-all">
                {link.kicker}
              </span>
              <strong className="text-xl font-bold mb-3 block">{link.label}</strong>
              <p className="text-sm opacity-60 leading-relaxed font-medium">{link.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="lend-final" ref={reveal}>
        <span className="lend-section-kicker lend-reveal--1 font-bold uppercase tracking-widest">{copy.kicker}</span>
        <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6 tracking-tight lend-reveal--2 max-w-3xl mx-auto">
          {copy.cta.title}
        </h2>
        <p className="text-xl opacity-70 max-w-2xl mx-auto mb-12 leading-relaxed font-medium lend-reveal--3">
          {copy.cta.body}
        </p>
        <div className="lend-cta-row lend-reveal--4">
          <Link href={copy.cta.primary.href} className="lend-primary">
            {copy.cta.primary.label}
          </Link>
          <Link href={localizedHref(locale, copy.cta.secondary.href)} className="lend-secondary">
            {copy.cta.secondary.label}
          </Link>
        </div>
      </section>

      {/* Hidden SEO Text */}
      <div className="sr-only" aria-hidden="true">
        <section className="use-case-seo" aria-label={copy.seoLabel}>
          <p>{copy.seo}</p>
        </section>
      </div>
    </MarketingLayout>
  );
}
