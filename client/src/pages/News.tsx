// Design philosophy reminder: Coastal Public-Service News for The Flush Report.
// This page should read like a concise wastewater newsroom: white editorial panels,
// ocean-blue civic accents, source-forward cards, and practical public-works context.

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Droplets,
  Factory,
  Landmark,
  Radio,
  ShieldAlert,
  Zap,
  Waves,
} from "lucide-react";
import { DailyNewsStory, fallbackDailyStories, loadDailyWastewaterStories } from "@/lib/dailyNews";
import { markTaxpayer } from "@/lib/markTaxpayer";

function iconForCategory(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("funding")) return Droplets;
  if (normalized.includes("infrastructure") || normalized.includes("crisis")) return Factory;
  if (normalized.includes("legislation") || normalized.includes("rule")) return Landmark;
  if (normalized.includes("labeling") || normalized.includes("do-not-flush")) return ShieldAlert;
  if (normalized.includes("warning")) return AlertTriangle;
  if (normalized.includes("overflow") || normalized.includes("clog")) return Waves;
  return Waves;
}

export default function News() {
  const [newsItems, setNewsItems] = useState<DailyNewsStory[]>(fallbackDailyStories);

  useEffect(() => {
    let active = true;

    loadDailyWastewaterStories().then((stories) => {
      if (!active) return;
      setNewsItems(stories);
    });

    return () => {
      active = false;
    };
  }, []);

  const updatedTodayLabel = useMemo(() => new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }), []);

  return (
    <main className="min-h-screen bg-white text-[#102a43] selection:bg-[#0b6fa4] selection:text-white dark:bg-[#111827] dark:text-[#e5edf7]">
      <header className="border-b border-[#cdeaf5] bg-white/95 px-4 py-5 shadow-[0_8px_30px_rgba(12,74,110,0.08)] sm:px-6 lg:px-8 dark:border-[#2b3950] dark:bg-[#0f172a]/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="inline-flex items-center gap-3 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#003b75] transition hover:text-[#102a43]">
            <ArrowLeft className="h-4 w-4" /> Back to The Flush Report
          </a>
          <div className="inline-flex items-center gap-3 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#526d82] dark:text-[#a6b7cc]">
            <span className="h-2.5 w-2.5 bg-[#2c5e9e]" /> Source-backed wastewater newsroom
          </div>
        </div>
      </header>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-5 border-b border-[#cdeaf5] pb-6 md:flex-row md:items-end">
            <div>
              <p className="live-flash-badge">
                <span className="live-flash-text">FLUSH REPORT LIVE</span>
                <Zap className="live-bolt" aria-hidden="true" />
              </p>
              <h2 className="headline-section mt-3">Legislation, catastrophes, public warnings, and infrastructure money.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#526d82]">
              The page is intentionally source-forward. Stories are scraped daily from wastewater-related reporting so the Flush Report stays current with real-world alerts, legislation, and infrastructure updates.
            </p>
            <p className="max-w-xl font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#64748b]">Daily scrape refresh: {updatedTodayLabel}</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {newsItems.map((item, index) => {
              const Icon = iconForCategory(item.category);
              return (
                <article key={item.url} className="wastewater-news-card group">
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {index === 0 ? <span className="lower-third">Most recent</span> : null}
                      <span className="lower-third">{item.category}</span>
                      {item.location ? <span className="location-chip">{item.location}</span> : null}
                    </div>
                    <Icon className="h-7 w-7 shrink-0 text-[#003b75] transition group-hover:scale-105" />
                  </div>
                  <h3 className="mt-8 font-display text-4xl font-black uppercase leading-none text-[#102a43]">{markTaxpayer(item.title)}</h3>
                  {item.summary ? <p className="mt-4 text-sm leading-6 text-[#526d82]">{markTaxpayer(item.summary)}</p> : null}
                  <div className="mt-7 flex flex-col gap-3 border-t border-[#d6eaf2] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#526d82]">
                      {item.source} · {item.date}
                    </span>
                    <a href={item.url} target="_blank" rel="noreferrer" className="article-read-button">
                      READ ARTICLE <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[#c7d8eb] bg-[#003b75] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="inline-flex h-16 w-16 items-center justify-center border border-white/20 bg-white/10">
            <Radio className="h-8 w-8 text-[#b8cce4]" />
          </div>
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#dbe6f3]">Know a story we should track?</p>
            <h2 className="mt-3 font-display text-5xl font-black uppercase leading-none tracking-[-0.04em]">Send the article, the local alert, or the field footage.</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/78">
              The Flush Report can turn wastewater news, utility warnings, pump repairs, and field proof into public education that helps people understand the real cost of treating toilets like trash cans.
            </p>
            <p className="mt-6 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-white/80">
              Story tips open soon.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
