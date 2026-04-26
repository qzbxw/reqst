"use client";

import { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import { COPY } from "@/lib/copy";
import { MarketingLayout, useReveal } from "@/components/marketing/MarketingLayout";
import { JsonLd } from "@/components/JsonLd";

export default function Page(props: { params: Promise<{ locale: string }> }) {
  const params = use(props.params);
  const language = params.locale as "ru" | "en";
  const copy = COPY[language];
  const [openFaq, setOpenFaq] = useState(0);
  const [logStep, setLogStep] = useState(0);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const reveal = useReveal();

  const scenarios = useMemo(() => [
    { net: "TON", amount: "499.00", addr: "EQBK...z8X2", tx: "8f2a...c91d" },
    { net: "TRON", amount: "1250.00", addr: "TY9x...Pq1k", tx: "41db...0a2c" },
    { net: "SOL", amount: "15.50", addr: "9xPq...TY9x", tx: "c91d...8f2a" },
    { net: "BASE", amount: "0.25", addr: "0x41...db0a", tx: "0a2c...41db" }
  ], []);

  // Terminal Log Animation with randomization and fixed height stability
  useEffect(() => {
    const timer = setInterval(() => {
      setLogStep((prev) => {
        if (prev >= 5) {
          setScenarioIdx((s) => (s + 1) % scenarios.length);
          return 0;
        }
        return prev + 1;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [scenarios.length]);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Reqst",
    "url": "https://reqst.xyz",
    "logo": "https://reqst.xyz/logo.jpg",
    "sameAs": ["https://twitter.com/reqst_xyz", "https://github.com/reqst-xyz"]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": copy.faq.items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": { "@type": "Answer", "text": item.answer }
    }))
  };

  const current = scenarios[scenarioIdx];
  const logs = [
    { cmd: "POST /v1/invoices", data: `{ "amount": "${current.amount}", "net": "${current.net}" }`, color: "text-accent" },
    { cmd: "> Generating address...", data: current.addr, color: "text-white/40" },
    { cmd: "> Monitoring mempool...", data: `Searching for ${current.amount} ${current.net === 'TON' ? 'USDT' : current.net}...`, color: "text-yellow-500/60" },
    { cmd: "> Payment detected!", data: `TX: ${current.tx}`, color: "text-green-500" },
    { cmd: "> Confirming blocks...", data: "Status: 3/3 Confirmed", color: "text-green-500/80" },
    { cmd: "> Firing webhook...", data: "HTTP 200 OK", color: "text-accent" }
  ];

  return (
    <MarketingLayout language={language}>
      <JsonLd schema={organizationSchema} />
      <JsonLd schema={faqSchema} />

      {/* 1. MASSIVE HERO */}
      <section className="lend-hero--centered relative overflow-hidden" ref={reveal}>
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-gradient from-accent/20 via-transparent to-transparent blur-[120px] opacity-40 animate-pulse" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="lend-hero-copy">
            <h1 className="lend-reveal--1 !text-5xl md:!text-7xl lg:!text-8xl">
              {copy.hero.title.split(' ').map((word, i) => (
                <span key={i} className="inline-block mr-[0.2em] last:mr-0">
                  {word}
                </span>
              ))}
            </h1>
            
            <p className="lend-reveal--2 !text-lg md:!text-xl opacity-60">
              {copy.hero.body}
            </p>

            <div className="lend-reveal--3 flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
              <Link className="lend-primary px-10 py-5 text-lg min-w-[240px] rounded-2xl group/btn" href="/app/auth">
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {copy.hero.primary}
                  <span className="group-hover:translate-x-1 transition-transform duration-500 ease-out">→</span>
                </span>
              </Link>
              <Link className="lend-secondary px-10 py-5 text-lg min-w-[240px] rounded-2xl" href={`/${language}/docs`}>
                {copy.hero.secondary}
              </Link>
            </div>

            {/* Redesigned Architecture / Subcopy Preview */}
            <div className="lend-reveal--4 mt-32 relative group max-w-5xl mx-auto">
              {/* Background Ambient Glows */}
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-accent/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-40 transition-opacity duration-1000" />
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent/5 rounded-full blur-[100px] opacity-0 group-hover:opacity-30 transition-opacity duration-1000" />

              <div className="relative z-10 p-8 md:p-16 rounded-[3.5rem] bg-white/[0.01] border border-white/5 backdrop-blur-2xl transition-all duration-1000 group-hover:border-accent/20 group-hover:bg-white/[0.02] shadow-2xl overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--accent) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="inline-flex items-center gap-4 mb-10 px-6 py-2 rounded-full bg-accent/5 border border-accent/10">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="uppercase tracking-[0.4em] text-[10px] font-black text-accent/80">Infrastructure Model</span>
                  </div>

                  <h3 className="text-2xl md:text-4xl font-bold mb-8 tracking-tight text-center max-w-3xl leading-tight font-['Space_Grotesk'] text-white/90">
                    {copy.hero.subcopy}
                  </h3>

                  <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12" />
                  
                  {/* Badges as Micro-Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    {copy.hero.badges.map((badge: string, i: number) => (
                      <div 
                        key={badge} 
                        className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent/40 hover:bg-accent/5 transition-all duration-500 group/badge"
                        style={{ transitionDelay: `${i * 50}ms` }}
                      >
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center group-hover/badge:scale-110 group-hover/badge:border-accent/40 transition-all duration-500 shadow-lg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent/60 group-hover/badge:text-accent transition-colors">
                              {i === 0 && <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a2 2 0 0 0 0 4h15a1 1 0 0 0 1-1v-2" />}
                              {i === 1 && <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />}
                              {i === 2 && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />}
                              {i === 3 && <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />}
                            </svg>
                          </div>
                          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 group-hover/badge:text-white transition-colors text-center">
                            {badge}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BENTO GRID */}
      <section id="infrastructure" className="py-32" ref={reveal}>
        <div className="container mx-auto px-6">
          <div className="lend-reveal--1 mb-20 text-center lg:text-left">
            <span className="lend-section-kicker">{copy.bento.kicker}</span>
            <h2 className="text-4xl md:text-7xl font-bold tracking-tight mb-8">{copy.bento.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 lend-reveal--2">
            {copy.bento.items.map((item, idx) => {
              const gridClasses = {
                large: "md:col-span-4 md:row-span-2 min-h-[480px]",
                medium: "md:col-span-2 md:row-span-2 min-h-[480px]",
                small: "md:col-span-2 md:row-span-1 min-h-[240px]"
              }[item.size] || "md:col-span-2 md:row-span-1 min-h-[240px]";

              return (
                <Link 
                  key={item.id} 
                  href={`/${language}/products/${item.id}`}
                  className={`${gridClasses} lend-card lend-spotlight-card group p-10 flex flex-col justify-between transition-all duration-700 ease-in-out hover:scale-[1.02]`}
                >
                  <div className="lend-card-spotlight" />
                  <div className="lend-dogfood-glow" />
                  
                  <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-accent">
                      {item.id === 'api' && <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />}
                      {item.id === 'checkout' && <rect x="3" y="4" width="18" height="16" rx="2" />}
                      {item.id === 'direct' && <path d="M7 11l5 5 5-5M12 4v12" />}
                      {item.id === 'monitoring' && <path d="M22 12h-4l-3 9L9 3l-3 9H2" />}
                      {item.id === 'tg' && <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />}
                    </svg>
                  </div>
                  
                  <div className="relative z-10">
                    <span className="text-[10px] font-bold tracking-[0.3em] text-accent/60 mb-6 block uppercase">{item.kicker}</span>
                    <h3 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight group-hover:text-white transition-colors">{item.title}</h3>
                    <p className="opacity-40 text-base md:text-lg leading-relaxed max-w-[340px] group-hover:opacity-70 transition-opacity">{item.body}</p>
                  </div>

                  <div className="relative z-10 flex items-center gap-4 text-accent font-bold text-[10px] tracking-[0.2em] uppercase border-b border-accent/0 group-hover:border-accent/40 w-fit pb-2 transition-all">
                    Explore Technology
                    <span className="group-hover:translate-x-2 transition-transform duration-500">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. NETWORKS MARQUEE */}
      <section className="py-24 border-y border-white/5 overflow-hidden relative bg-white/[0.01]">
        <div className="absolute inset-0 bg-radial-gradient from-accent/5 via-transparent to-transparent opacity-30 pointer-events-none" />
        <div className="lend-marquee">
          <div className="lend-marquee-track">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-12 items-center">
                {copy.networks.list.map((net) => (
                  <Link 
                    key={`${i}-${net}`} 
                    href={`/${language}/networks/${net.toLowerCase()}`}
                    className="lend-marquee-item group transition-all duration-500 hover:text-accent hover:border-accent/30 hover:bg-accent/5"
                  >
                    <span className="font-bold">{net}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. REDESIGNED USE CASES (GRID) */}
      <section id="solutions" className="py-32" ref={reveal}>
        <div className="container mx-auto px-6">
          <div className="lend-reveal--1 mb-20 text-center lg:text-left">
            <span className="lend-section-kicker mx-auto lg:mx-0">{copy.useCases.kicker}</span>
            <h2 className="text-4xl md:text-7xl font-bold tracking-tight">{copy.useCases.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lend-reveal--2">
            {copy.useCases.tabs.map((uc, idx) => (
              <Link 
                key={uc.id} 
                href={`/${language}/use-cases/${uc.id}`}
                className="lend-card group relative p-10 md:p-14 transition-all duration-700 ease-in-out hover:scale-[1.02] hover:-translate-y-2"
              >
                <div className="lend-dogfood-glow" />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:border-accent/40 transition-all duration-500 shadow-2xl">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                      {uc.id === 'tg-shops' && (
                        <>
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z" />
                          <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                        </>
                      )}
                      {uc.id === 'saas' && (
                        <>
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                          <path d="M7 15h.01" />
                          <path d="M11 15h.01" />
                        </>
                      )}
                      {uc.id === 'digital' && (
                        <>
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </>
                      )}
                      {uc.id === 'communities' && (
                        <>
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </>
                      )}
                    </svg>
                  </div>

                  <span className="text-[10px] font-bold tracking-[0.4em] text-white/20 mb-6 block uppercase tracking-[0.4em]">Scenario 0{idx + 1}</span>
                  <h3 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight group-hover:text-accent transition-colors !font-['Space_Grotesk']">{uc.title}</h3>
                  <p className="text-lg md:text-2xl opacity-40 leading-relaxed mb-12 max-w-sm group-hover:opacity-60 transition-opacity">
                    {uc.body}
                  </p>

                  <div className="flex items-center gap-4 text-accent font-bold tracking-[0.2em] uppercase text-[10px] border-b border-accent/20 pb-2 w-fit group-hover:border-accent transition-all">
                    {uc.cta}
                    <span className="group-hover:translate-x-2 transition-transform duration-500">→</span>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                  <div className="text-[12rem] font-black italic select-none leading-none -mb-8 -mr-4 font-['Space_Grotesk']">
                    {idx + 1}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. VISUAL DIFF (COMPARE) */}
      <section className="py-32 overflow-hidden" ref={reveal}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center mb-20 text-center lend-reveal--1">
            <span className="lend-section-kicker">{copy.compare.kicker}</span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">{copy.compare.title}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center group">
            {/* Manual Workflow Card */}
            <div className="relative p-10 md:p-14 rounded-[3rem] bg-[#030303] border border-white/5 transition-all duration-700 ease-in-out group-hover:scale-[0.98] group-hover:opacity-50 group-hover:grayscale lg:-rotate-1 hover:rotate-0 lend-reveal--2 shadow-2xl">
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-red-500">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                  <line x1="12" y1="2" x2="12" y2="12" />
                </svg>
              </div>

              <span className="text-[10px] font-bold tracking-[0.4em] text-red-500/30 mb-10 block uppercase">Manual Workflow</span>
              <ul className="space-y-6">
                {copy.compare.rows.map((row, i) => (
                  <li key={row.legacy} className="flex items-start gap-5 group/item">
                    <span className="text-red-500/20 mt-1.5 flex-shrink-0 text-lg">✕</span>
                    <p className="text-lg md:text-xl text-white/20 italic leading-relaxed group-hover/item:text-white/40 transition-colors duration-500">{row.legacy}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reqst Protocol Card */}
            <div className="relative p-10 md:p-16 rounded-[3rem] bg-white/[0.02] border border-accent/20 backdrop-blur-3xl transition-all duration-700 ease-in-out scale-100 lg:scale-[1.02] group-hover:scale-[1.05] group-hover:-translate-y-2 group-hover:border-accent/50 lend-reveal--2 shadow-[0_0_60px_rgba(139,92,246,0.08)] group-hover:shadow-[0_0_100px_rgba(139,92,246,0.15)] overflow-hidden">
              {/* Background Radiant Glow */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/15 rounded-full blur-[120px] opacity-40 group-hover:opacity-70 transition-opacity duration-700" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/10 rounded-full blur-[120px] opacity-20 group-hover:opacity-50 transition-opacity duration-700" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.4em] text-accent block uppercase">Reqst Protocol</span>
                </div>

                <ul className="space-y-8">
                  {copy.compare.rows.map((row, i) => (
                    <li 
                      key={row.reqst} 
                      className="flex items-start gap-6 animate-in fade-in slide-in-from-right-8 duration-1000 fill-mode-both"
                      style={{ animationDelay: `${i * 150 + 300}ms` }}
                    >
                      <span className="text-accent mt-1 flex-shrink-0 text-xl drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]">✓</span>
                      <p className="text-lg md:text-2xl font-bold text-white/90 leading-tight tracking-tight">{row.reqst}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRICING */}
      <section id="pricing" className="py-32" ref={reveal}>
        <div className="container mx-auto px-6">
          <div className="lend-reveal--1 mb-20 text-center">
            <span className="lend-section-kicker justify-center">{copy.pricing.kicker}</span>
            <h2 className="text-4xl md:text-7xl font-bold tracking-tight">{copy.pricing.title}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lend-reveal--2">
            {["merchant", "developer", "business", "enterprise"].map((tier) => {
              const t = copy.pricing[tier as keyof typeof copy.pricing];
              const isPro = tier === "business" || tier === "enterprise";
              const isPopular = tier === "business";
              
              return (
                <div 
                  key={tier} 
                  className={`lend-pricing-card ${isPro ? 'lend-pricing-card--pro' : ''} ${isPopular ? 'is-popular' : ''} group`}
                >
                  <div className="lend-pricing-glow" />
                  {isPopular && (
                    <div className="lend-popular-badge">
                      <span className="relative z-10">{copy.pricing.popular || "Popular"}</span>
                      <div className="absolute inset-0 bg-accent blur-sm opacity-50" />
                    </div>
                  )}
                  
                  <div className="relative z-10 w-full flex flex-col h-full">
                    <h3 className="lend-tier-name">{t.name}</h3>
                    
                    <div className="lend-price-container">
                      <div className="flex items-baseline gap-1">
                        <span className="lend-price-symbol">{tier === "enterprise" ? "" : "$"}</span>
                        <span className={`lend-price-amount ${tier === "enterprise" ? "is-custom" : ""}`}>{t.price}</span>
                        {tier !== "enterprise" && <span className="lend-price-period">/mo</span>}
                      </div>
                    </div>

                    <div className="h-px w-full bg-white/5 my-8 group-hover:bg-accent/20 transition-colors" />

                    <ul className="lend-features-list">
                      {t.features.map((f: string) => (
                        <li key={f} className="lend-feature-item">
                          <svg className="lend-feature-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link 
                      className={`lend-pricing-button ${isPro ? 'is-pro' : ''} mt-auto`}
                      href={`/${language}/${tier === "merchant" ? "merchant" : tier === "developer" ? "dev" : tier}`}
                    >
                      <span>{t.cta}</span>
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section id="faq" className="py-32" ref={reveal}>
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="lend-reveal--1 mb-24 text-center">
            <span className="lend-section-kicker justify-center">{copy.faq.kicker}</span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{copy.faq.title}</h2>
          </div>

          <div className="lend-reveal--2 max-w-4xl mx-auto">
            <div className="grid gap-6">
              {copy.faq.items.map((item, index) => {
                const isOpen = index === openFaq;
                return (
                  <div
                    key={item.question}
                    className={`
                      relative group transition-all duration-700 rounded-[2rem] overflow-hidden
                      ${isOpen 
                        ? 'bg-white/[0.03] border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]' 
                        : 'bg-transparent border-white/[0.03] hover:bg-white/[0.01] hover:border-white/10'
                      }
                      border
                    `}
                  >
                    {/* Animated background glow for open item */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 transition-opacity duration-700 ${isOpen ? 'opacity-100' : ''}`} />
                    
                    <button
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      className="relative z-10 w-full flex justify-between items-center p-8 md:p-12 text-left group"
                    >
                      <div className="flex flex-col gap-2">
                        <span className={`text-[0.65rem] font-black uppercase tracking-[0.2em] transition-all duration-500 ${isOpen ? 'text-accent opacity-100 translate-x-0' : 'text-white/20 opacity-0 -translate-x-4'}`}>
                          Protocol Detail 0{index + 1}
                        </span>
                        <span className={`font-bold text-xl md:text-3xl transition-all duration-500 font-['Space_Grotesk'] tracking-tight ${isOpen ? "text-white" : "text-white/60 group-hover:text-white"}`}>
                          {item.question}
                        </span>
                      </div>
                      
                      <div className={`
                        relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 flex-shrink-0
                        ${isOpen 
                          ? "bg-accent text-black rotate-[135deg] shadow-[0_0_30px_rgba(139,92,246,0.4)]" 
                          : "bg-white/[0.03] text-white/40 group-hover:bg-white/10 group-hover:text-white"
                        }
                      `}>
                        <div className={`absolute w-6 h-[2px] bg-currentColor transition-transform duration-500 ${isOpen ? 'bg-black' : 'bg-white/40 group-hover:bg-white'}`} />
                        <div className={`absolute w-6 h-[2px] bg-currentColor transition-transform duration-500 rotate-90 ${isOpen ? 'bg-black' : 'bg-white/40 group-hover:bg-white'}`} />
                      </div>
                    </button>
                    
                    <div className={`relative z-10 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.2,1,0.3,1)] ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="px-8 md:px-12 pb-12">
                        <div className="w-12 h-1 bg-accent/30 rounded-full mb-8" />
                        <p className="text-lg md:text-2xl text-white/50 leading-relaxed font-medium font-['Space_Grotesk'] tracking-tight">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA */}
      <section className="py-64 relative overflow-hidden" ref={reveal}>
        {/* Massive Background Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30rem] font-black text-white/[0.01] select-none pointer-events-none whitespace-nowrap font-['Space_Grotesk'] tracking-tighter">
          REQST PROTOCOL
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-accent/10 rounded-full blur-[200px] opacity-30 pointer-events-none animate-pulse" />
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="lend-reveal--1 mb-20">
            <span className="lend-section-kicker justify-center">{copy.final.kicker}</span>
            <h2 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] max-w-6xl mx-auto font-['Space_Grotesk']">
              {copy.final.title}
            </h2>
          </div>

          <div className="lend-reveal--2 flex flex-col sm:flex-row justify-center gap-6">
            <Link className="lend-primary px-20 py-8 text-2xl rounded-2xl min-w-[320px] shadow-[0_20px_60px_rgba(139,92,246,0.3)]" href="/app/auth">
              {copy.final.primary}
            </Link>
            <Link className="lend-secondary px-20 py-8 text-2xl rounded-2xl min-w-[320px]" href={`/${language}/docs`}>
              {copy.final.secondary}
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
