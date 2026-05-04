# Cursor Handoff: The Flush Report

**Author:** Manus AI  
**Project:** The Flush Report / `flush-report`  
**Current checkpoint:** `a270dcf0`  
**Prepared:** 2026-05-03 HST

## Executive Summary

**The Flush Report** is a public-awareness media site about what happens after people treat toilets like trash cans. Its immediate purpose is to turn wastewater operator experience, municipal warnings, source-backed wastewater news, and field proof into a memorable public education brand. The current product is a **static React frontend MVP** that presents the mission, explains the cost of bad flushing, shows a live-news style ticker, routes users to a wastewater news page, and invites operators or community members to submit field proof for future publication.[1] [2]

The site’s practical goal is not to shame manufacturers or create legal exposure. The brand should keep blame centered on **consumer behavior, taxpayer costs, infrastructure stress, operator labor, landfill burden, and water-quality impact**. The tone can stay witty and blunt, but the strategic frame should remain sponsor-safe, worker-respectful, and public-service oriented.[3]

> The core message is simple: what disappears from a toilet does not disappear from the public system. Operators fight it, ratepayers fund it, and downstream water bears the consequences.

## Product Purpose, Audience, and Vision

The product vision is to make wastewater visible to everyday people. Most residents never see the wipes, rags, grease, plastics, and debris that collect in pumps, lift stations, treatment plants, and sewer lines. The Flush Report should close that visibility gap by presenting field footage and real news in a format people understand quickly: a broadcast-style public bulletin, a newsroom, and eventually a media operation with submissions, outreach, sponsorships, and automated monitoring.

| Product Dimension | Current Direction | Why It Matters |
| --- | --- | --- |
| **Audience** | Residents, wastewater operators, utilities, municipalities, environmental groups, public-works vendors, and sponsors. | The brand must be vivid enough for the public and credible enough for public-sector or infrastructure partners. |
| **Mission** | Raise awareness about preventable wastewater clogs, pump damage, system stress, and water-quality impacts. | The campaign needs a behavioral target: stop flushing trash, especially wipes and other non-flushable items. |
| **Voice** | Public-service newsroom with field-worker grit. Witty, direct, and memorable, but not reckless or cruel. | This keeps the brand shareable without undermining credibility. |
| **Near-term product** | Static promotional and educational frontend with a source-backed news page and submission CTA. | This is enough to validate the brand, collect interest, and prepare for real operations. |
| **Long-term product** | A monitored content and outreach system with backend intake, review queue, automated wastewater news tracking, sponsor inventory, and an operating agent. | This is the future phase where an agent can run and monitor content, outreach, reporting, and backend workflows. |

The original design exploration selected **Neo-Broadcast Brutalism**, then the interface evolved into a warmer **Coastal Public-Service News** system. That evolution matters. The current site still uses broadcast elements, lower-thirds, a ticker, big compressed headlines, and field-report language, but it now uses bright white editorial surfaces, ocean blues, sea-glass accents, and Hawaii/coastal public-service cues to feel more human, credible, and sponsor-safe.[3] [4]

## Current Implementation Status

The project is a Vite/React 19 frontend with Tailwind CSS 4, Wouter routing, shadcn-style UI primitives, lucide-react icons, Sonner toasts, and a placeholder Express server that is bundled by the default template but is not being used for application logic.[5] The current app is intentionally frontend-only. Do not assume that the upload form sends data, stores files, authenticates users, or creates records yet.[2]

| Area | Status | Notes for Cursor |
| --- | --- | --- |
| **Homepage** | Implemented in `client/src/pages/Home.tsx`. | Contains hero, fixed header, live clock, ticker, cost narrative, mission/vision cards, quick-access CTAs, field proof form, social/FRTV positioning, sponsor areas, and merch/sponsor lanes.[6] |
| **News route** | Implemented in `client/src/pages/News.tsx`. | `/news` displays a static source-backed wastewater newsroom with article cards for funding, legislation, utility warnings, and infrastructure stories.[7] |
| **Routing** | Implemented in `client/src/App.tsx`. | Active routes are `/`, `/news`, `/404`, and fallback NotFound.[8] |
| **Styling** | Implemented in `client/src/index.css`. | Global design tokens use Oswald, Barlow, and IBM Plex Mono; reusable component classes define ticker, coastal grid, news cards, feature pills, social emblems, and motion rules.[9] |
| **Metadata and fonts** | Implemented in `client/index.html`. | The HTML shell sets title/description/OG metadata, loads Google Fonts, and includes analytics placeholders for the hosting environment.[10] |
| **Validation** | Completed before this handoff. | `pnpm check` and `pnpm build` passed. Preview checks confirmed homepage CTA routing to `/news` and `/#upload-proof`.[2] |

## Current User-Facing Flows

The homepage quick-access section now uses three primary cards: **Top Wastewater News**, **Be Featured**, and **Merch**. The news card navigates to `/news`. The featured card navigates to `/#upload-proof` and scrolls to the report intake form. The merch card is still a general merch lane and should be treated as a future-commerce placeholder until real products, print-on-demand, or payment integration is selected.[2]

The news page is a static editorial board, not a live scraper. Its purpose is to show the format and give the brand a place to connect the homepage ticker, public wastewater stories, legislation, utility alerts, infrastructure failures, and later archived newsroom content. Current source notes include EPA sewer-overflow funding, Tijuana wastewater infrastructure upgrades, Tennessee decentralized wastewater legislation, the WIPPES Act update, and local wipe warnings from Lennox and Great Bend.[11]

| Flow | Current Behavior | Completion Gap |
| --- | --- | --- |
| **Read Top Wastewater News** | User clicks the homepage card and reaches `/news`. | Later: add filters, categories, archive, search, auto-refresh, and CMS/admin editing. |
| **Be Featured** | User clicks the homepage card or news-page CTA and reaches the upload-proof section. | Later: full-stack file upload, consent capture, spam prevention, moderation queue, publishing workflow. |
| **Submit report form** | Form is visual/static and currently shows frontend feedback only. | Later: backend route, object storage, database records, notifications, review states, legal release copy. |
| **Ticker** | Static curated links scroll across the top. | Later: daily news monitoring and source-verification agent that updates ticker and archive.[12] |
| **Sponsor/merch** | Sponsor-ready visual placements and merch lane exist. | Later: pricing, inventory, fulfillment, Stripe or external checkout, sponsor inquiry workflow. |

## Project Structure and Code Map

Cursor should treat `/home/ubuntu/flush-report` as the project root. The attached source zip excludes `node_modules`, `dist`, `.git`, and runtime logs; dependencies can be regenerated with `pnpm install`.

| Path | Purpose |
| --- | --- |
| `client/src/App.tsx` | App shell, providers, route map, and page registration. |
| `client/src/pages/Home.tsx` | Main landing page and most of the product’s current content. This is the largest business-facing file. |
| `client/src/pages/News.tsx` | Static wastewater newsroom route. |
| `client/src/pages/NotFound.tsx` | Fallback route. |
| `client/src/index.css` | Tailwind 4 theme, typography tokens, design system classes, ticker animation, card styles, and global base rules. |
| `client/index.html` | Metadata, font loading, analytics placeholders, React mount point. |
| `client/src/components/ui/*` | shadcn/Radix UI primitives already available for future UI. Use these before writing custom primitives. |
| `client/src/contexts/ThemeContext.tsx` | Static light-theme context by default. Can be extended later for switching. |
| `package.json` | Scripts, dependencies, and package manager settings. |
| `research_wastewater_news.md` | Source notes for the news page. |
| `ticker-source-notes.md` | Source notes and future automation idea for ticker stories. |
| `preview_validation_notes.md` | Live-preview validation notes for the latest CTA/news update. |
| `todo.md` | Working checklist, including handoff tasks. |

## Local Development Instructions for Cursor

After unzipping the source package, Cursor can run the app as a normal Vite project. The project uses `pnpm` and includes a lockfile.

```bash
pnpm install
pnpm dev
```

For validation before handoff or deployment, run the following commands.

```bash
pnpm check
pnpm build
```

The build script runs `vite build` and also bundles `server/index.ts` into `dist`. The server exists because of the template, but the current product should still be treated as a static frontend. If you add real uploads, agent operations, scraping, scheduled jobs, authentication, or storage, that becomes a later full-stack phase rather than a small frontend tweak.[5]

## Remaining Steps to Complete the Static MVP

The next developer should first finish the static brand/site layer before building backend automation. That saves cost and avoids overbuilding before the messaging is proven.

| Priority | Workstream | Recommended Completion Criteria |
| --- | --- | --- |
| **P0** | Content polish and legal/safety wording. | Refine submission consent, privacy language, moderation expectations, and field-safety disclaimers. Make clear that people should not film in unsafe or prohibited environments. |
| **P0** | Header/navigation clarity. | Add a visible **News** link to the header and ensure mobile navigation makes `/news`, `#upload-proof`, and sponsor/merch lanes discoverable. |
| **P0** | Static form truthfulness. | Either label the current upload form as “prototype / coming soon” or implement the backend before inviting real submissions. Do not imply files are being stored if they are not. |
| **P1** | News page expansion. | Add category chips, sorting, date grouping, an archive layout, and a simple editorial note explaining how stories are selected. |
| **P1** | Sponsor and merch readiness. | Replace placeholder sponsor/merch language with specific packages, inquiry CTA, and a lightweight media kit. |
| **P1** | Accessibility and QA. | Test keyboard navigation, contrast, mobile breakpoints, form labels, reduced motion, and long ticker behavior. |
| **P2** | SEO and sharing. | Add per-route metadata, social share images, structured content snippets, and a clearer homepage title/description if publishing publicly. |
| **P2** | Visual refinement. | Normalize any remaining “dark newsroom” comments or metadata where the site has shifted to coastal public-service news. Keep the broadcast personality but avoid visual inconsistency. |

## Backend, Operations, and Agent Roadmap

When the user returns to build the operating agent, the product should move from static media site to **content operations system**. This phase should not be rushed inside the current frontend-only build.

| Phase | System Capability | What the Agent Should Eventually Do |
| --- | --- | --- |
| **1. Submission Backend** | Upload storage, database records, consent, spam protection, moderation states, notifications. | Monitor new submissions, flag missing consent, summarize footage metadata, assign review priority, and notify admins. |
| **2. News Monitoring** | Scheduled scraper/API workflow for wastewater news, legislation, public works alerts, spills, catastrophic failures, and utility warnings. | Search daily, verify source URLs, deduplicate stories, rank relevance, update top ticker stories, and archive older news.[12] |
| **3. Outreach CRM** | Contact database for utilities, operators, sponsors, municipal comms teams, nonprofits, and vendors. | Draft outreach, track responses, schedule follow-ups, and surface warm sponsor leads. |
| **4. Editorial Queue** | Review dashboard for field videos, captions, anonymization/redaction, publishing calendar, and platform-specific post drafts. | Convert approved submissions into FRTV clips, captions, web posts, and social snippets while preserving safety and privacy rules. |
| **5. Sponsorship and Commerce** | Sponsor packages, merch products, checkout, invoice tracking, analytics. | Monitor conversions, prepare sponsor reports, recommend placements, and detect stale inventory or broken campaigns. |
| **6. Monitoring and Reporting** | Analytics, uptime checks, content freshness checks, social performance, source-link health. | Run daily health reports, identify broken links, summarize traffic, and suggest next content priorities. |

The future agent should be designed as an operator, not just a chatbot. It should monitor inputs, verify sources, preserve receipts, produce reviewable drafts, ask for approval before public posting or outreach, and maintain a clear audit trail. Any actions involving publishing, outreach, payments, or personal information should require explicit human confirmation.

## Suggested Cursor Prompt to Continue

Use this prompt in Cursor after opening the project:

> You are continuing The Flush Report, a static React/Tailwind frontend for a wastewater public-awareness media brand. Read `CURSOR_HANDOFF.md`, `preview_validation_notes.md`, `research_wastewater_news.md`, `ticker-source-notes.md`, `client/src/App.tsx`, `client/src/pages/Home.tsx`, `client/src/pages/News.tsx`, and `client/src/index.css` before editing. Preserve the Coastal Public-Service News / broadcast editorial design direction. First complete the static MVP: add clearer News navigation, improve truth-in-submission wording, polish mobile and accessibility, and keep all changes frontend-only unless explicitly asked to build the backend. Validate with `pnpm check` and `pnpm build` before handing back.

## Important Guardrails

Do not add backend behavior casually. The upload form is the highest-risk area because it appears operational. If it remains static, label it clearly. If real submissions are required, implement proper file storage, database records, moderation, consent, security limits, and privacy handling.

Do not turn the brand into a manufacturer-shaming campaign. The most durable strategic position is consumer accountability plus public infrastructure education. The brand can be funny, sharp, and memorable, but it should stay grounded in public benefit and operator respect.

Do not store large images or media inside the project if continuing under the same hosting workflow. Current imagery is referenced through external/generated or managed storage URLs. If moving outside Manus, audit those URLs and decide whether to self-host, replace, or migrate the assets.

## Companion document

For hosting, deployment, environment variables, asset portability (`/manus-storage`), backend vs UI-only behavior, integrations, Git remote, Pulse 46 / cross-product isolation, launch blockers, and key files for ambiguity removal, read **[HANDOFF_SUPPLEMENT.md](./HANDOFF_SUPPLEMENT.md)** (Manus supplement, checkpoint `a270dcf0`).

## References

[1]: ./client/src/pages/Home.tsx "Homepage implementation"
[2]: ./preview_validation_notes.md "Preview validation notes"
[3]: ./ideas.md "Design brainstorm and selected direction"
[4]: ./review-notes.md "Coastal revision review notes"
[5]: ./package.json "Package manifest"
[6]: ./client/src/pages/Home.tsx "Home page source"
[7]: ./client/src/pages/News.tsx "News page source"
[8]: ./client/src/App.tsx "Application routes"
[9]: ./client/src/index.css "Global style system"
[10]: ./client/index.html "HTML shell and metadata"
[11]: ./research_wastewater_news.md "Wastewater news source notes"
[12]: ./ticker-source-notes.md "Ticker source notes and future automation reminder"
