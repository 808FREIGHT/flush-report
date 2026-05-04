# The Flush Report — Cursor Handoff Supplement

**Author:** Manus AI  
**Project path (Manus):** `/home/ubuntu/flush-report`  
**Checkpoint represented:** `a270dcf0`  
**Prepared:** 2026-05-03 HST  

Read alongside [CURSOR_HANDOFF.md](./CURSOR_HANDOFF.md).

### Canonical local workspace (this machine)

The **only** maintained copy of this project on disk is:

**`/Users/unkoponski/Desktop/flush-report`**

Open **`The-Flush-Report.code-workspace`** in that directory, or use **File → Open Folder** on the path above, so Cursor’s index and AI context match this tree (not `808-freight-app` or other folders). A duplicate under `~/Downloads/flush-report` was **removed on 2026-05-03** after comparing file mtimes (Desktop had newer handoff edits). Unzip or export future Manus drops **into this folder** (or merge into it)—do not recreate a second working tree under Downloads.

---

## 1. Executive clarification

This supplement answers the ambiguity checklist from the extended handoff prompt. The most important conclusion: **The Flush Report is currently a static / front-end product** with a small Express static-server wrapper, **not** a working backend application. The homepage, `/news`, ticker, sponsor CTAs, submission copy, field-proof upload **prototype**, and wastewater news cards are implemented in React. **Not implemented:** secure media uploads, email routing, moderation, database persistence, CMS editing, analytics ownership, payments, admin tooling, outreach automation, and agent operations.

The Manus working tree was `/home/ubuntu/flush-report`. Dev preview used during validation (temporary, not durable production):

- `https://3000-i2bqnu09vvzozb7hzz5xf-24a8b143.us2.manus.computer/`
- News: `https://3000-i2bqnu09vvzozb7hzz5xf-24a8b143.us2.manus.computer/news`

Treat those as **Manus development preview URLs**, not stable production hostnames.

---

## 2. Hosting and deployment

| Item | Current answer | Concrete details |
| --- | --- | --- |
| **Known production site** | None confirmed from Manus session | No production publish step was performed by Manus. If you published later, confirm in Manus Management UI (domains). |
| **Known staging** | Manus dev preview only | URLs above; not portable. |
| **Platform during build** | Manus webdev sandbox | Local path in Manus: `/home/ubuntu/flush-report`; dev port **3000**; preview on `us2.manus.computer`. |
| **Git remote** | Manus-managed S3 Git | `origin` → `s3://vida-prod-gitrepo/webdev-git/310519663566513445/8gxBsDuKSTafKw4Eig6Cvn` |
| **Default branch** | `main` | Short commit / checkpoint: **a270dcf** |
| **CI/CD** | None in repo | No GitHub Actions, Vercel, Netlify, Railway, or custom CI identified. |

**Local continuation:** Node + **pnpm**. From project root: `pnpm install` → `pnpm check` → `pnpm build`.

- **Build:** `vite build` + bundles `server/index.ts` → `dist/index.js`; static frontend → **`dist/public`**.
- **Serve Node bundle:** `pnpm start` → `NODE_ENV=production node dist/index.js`; listens on `process.env.PORT` (default **3000**).

**Static-only hosts** (Netlify, Cloudflare Pages, S3 + CloudFront, Vercel static): deploy **`dist/public`** and configure **SPA fallback** to `index.html` for client routes (`/`, `/news`, etc.) — Wouter handles routing on the client.

**Node host:** `pnpm build` then `pnpm start`. Express only serves static files + SPA fallback; **no** API routes, uploads, OAuth, DB, or email in that server.

---

## 3. Environment variables and runtime placeholders

No DB URL, email secret, upload secret, payment secret, or CMS secret is **required** for v1 — those features are not implemented. Classify template / Manus scaffolding before leaving Manus hosting.

| Variable or placeholder | Where referenced | Active in v1? | Secret? | Recommended handling |
| --- | --- | --- | --- | --- |
| `%VITE_ANALYTICS_ENDPOINT%` | `client/index.html` | Partial (script tag) | No (public URL) | Remove until chosen, or set real analytics base URL. |
| `%VITE_ANALYTICS_WEBSITE_ID%` | `client/index.html` | Partial | Usually public | Remove or set real site ID. |
| `BUILT_IN_FORGE_API_URL` | `vite.config.ts` (dev storage proxy) | Manus dev asset proxy | Context-dependent | Outside Manus: **do not depend**; export or replace `/manus-storage` assets. |
| `BUILT_IN_FORGE_API_KEY` | `vite.config.ts` | Manus dev proxy | **Yes** | Do not copy for arbitrary local hosting; replace assets. |
| `VITE_FRONTEND_FORGE_API_KEY` | `client/src/components/Map.tsx` | Unused map scaffold | Manus-context | Ignore unless adding maps; consider removing unused Map. |
| `VITE_FRONTEND_FORGE_API_URL` | `Map.tsx` | Unused | No | Same. |
| `VITE_OAUTH_PORTAL_URL` | `client/src/const.ts` | Unused auth scaffold | No | Ignore or remove with unused login UI. |
| `VITE_APP_ID` | `client/src/const.ts` | Unused | No | Same. |
| `PORT` | `server/index.ts` | Only if using Node server | No | Set in host env; default 3000. |

Analytics snippet is **Umami-style** (`…/umami` + `data-website-id`). No dashboard ownership or retention policy is in-repo. **Safe launch:** remove snippet **or** wire a deliberate analytics product.

---

## 4. Assets and broken-relative URL risks

Two asset families: **absolute CloudFront** URLs and **`/manus-storage/...`** paths. In dev, `vite.config.ts` proxies `/manus-storage/*` to a Manus/Forge presign flow (`BUILT_IN_FORGE_API_*`). **Outside Manus, `/manus-storage/ will break** unless files are rehosted and paths updated in `Home.tsx`.

| Asset reference | File | Role | Portability | Action |
| --- | --- | --- | --- | --- |
| `https://d2xsxph8kpxj0f.cloudfront.net/.../flush-report-hero-newsroom-....webp` | `Home.tsx` | Hero | Medium (external, account-scoped) | Rehost if production-critical / rights confirmed. |
| `/manus-storage/pasted_file_pK6UJ1_IMG_7636_908ebd35.jpg` | `Home.tsx` | Educational field visual | **High** off Manus | Export + owned static/CDN. |
| `https://d2xsxph8kpxj0f.cloudfront.net/.../flush-report-field-report-card-....webp` | `Home.tsx` | Field-report card | Medium | Rehost as needed. |
| `/manus-storage/puhi-bay-outfall-pipe_1776191e.jpg` | `Home.tsx` | Puhi Bay visual | **High** | Export + rehost. |
| `/manus-storage/pasted_file_qUBumC_IMG_7900_3c57ba90.jpg` | `Home.tsx` | Operator visual | **High** | Export + rehost. |
| Google Fonts (Barlow, IBM Plex Mono, Oswald) | `client/index.html` | Typography | Low (external dep) | Keep or self-host for stricter control. |

Notes: **ick-factor-image-selection-notes.md**, **pua-puhi-image-research.md**. No `.heic` referenced in React; convert originals to **webp/jpg** for production. Zip may **not** include binary exports of Manus storage — treat **asset export/rehosting as a launch blocker** off Manus.

---

## 5. Backend vs front-end-only truth

| Area | Implementation | Key files | Production note |
| --- | --- | --- | --- |
| Homepage | Full React page | `Home.tsx`, `index.css` | Static-preview ready. |
| News | Static cards + CTAs | `News.tsx`, `App.tsx` | No live feed. |
| Routing | Wouter `/`, `/news`, `/404` | `App.tsx` | Needs SPA fallback on static hosts. |
| Upload form | UI prototype; **toast only** | `Home.tsx` (`handlePrototypeSubmit`, `#upload-proof`) | **Not** real upload / persistence / release. |
| Email | `mailto:sponsor@flushreport.live` | `Home.tsx` | User’s mail client only. |
| Auth | Template unused | `const.ts`, `ManusDialog.tsx` | Not for Flush v1. |
| Admin / DB / payments | None | — | Not implemented. |
| File storage | Dev static refs only | `vite.config.ts`, `Home.tsx` | No user upload storage. |
| Moderation | Copy only | `Home.tsx` | Workflow not built. |
| News automation | Hard-coded + notes | `research_wastewater_news.md`, `ticker-source-notes.md`, pages | Not automated. |

Express in `dist/index.js`: **optional** for static hosts; serves `dist/public` + index fallback only.

---

## 6. Product and content source of truth

**Repo is the source of truth** — no CMS, Airtable, Notion, Sheet, cron, or webhook in codebase.

| Content | Source | Notes |
| --- | --- | --- |
| Ticker | `Home.tsx` + `ticker-source-notes.md` | Hard-coded; future model should carry URL, date, category, status, summary. |
| Feature cards | `Home.tsx` | Hard-coded. |
| News cards | `News.tsx` + `research_wastewater_news.md` | Manual curation (EPA, KPBS, Tennessee Lookout, CASA, Lennox, Great Bend, etc.). |
| Legal / submission | `Home.tsx` | **Draft** — legal review before real intake. |
| Sponsor / merch | `Home.tsx` | `mailto:` + placeholder lane. |
| Brand rationale | `ideas.md`, `review-notes.md`, `index.css` | Coastal public-service newsroom. |

Editorial process: **manual** research and array updates — no enforced cadence in code.

---

## 7. Brand, design, and legal notes

- **No Figma link**, brand ZIP, trademark memo, or formal legal review in repo.
- Typography: **Barlow** (UI/body), **Oswald** (display), **IBM Plex Mono** (labels / ticker / metadata).
- Vision: Hawaii-born, worker-led, sponsor-safe; avoid shock-only framing; emphasize prevention, consent, safety, sources.
- Before launch: strengthen submission consent; no real video intake without release/review; no implied municipal endorsement for sponsors.

---

## 8. Accounts and integrations

No verified third-party ownership records in repo. Treat keys as **absent** until you supply them.

| Third party | Status | Notes |
| --- | --- | --- |
| Manus preview / Forge | Used in build | Not portable deployment. |
| CloudFront asset URLs | In code | Rights / longevity not documented in repo. |
| Google Fonts | In use | Public dependency. |
| Umami-like analytics | Placeholder | No real endpoint/ID confirmed. |
| Email | `sponsor@flushreport.live` mailto | Inbox ownership not in repo. |
| Stripe / social APIs / CMS | N/A | Not implemented. |

---

## 9. Repository, checkpoint, and zip

- Branch: **`main`**, checkpoint **a270dcf**.
- Prior export name pattern: `flush-report-cursor-handoff-a270dcf0.zip` (checkpoint + `CURSOR_HANDOFF.md`).
- This supplement adds **HANDOFF_SUPPLEMENT.md**; Manus also mentioned **handoff_screenshots/** — add those to your copy if your zip did not include them.
- Zip excludes `node_modules`, `dist`, `.git`, `.manus-logs`. Recreate with `pnpm install`.
- **Submodule:** none identified. **Patch:** `patches/wouter@3.7.1.patch` — route/introspection support; verify before upgrading Wouter.

---

## 10. Relationship to Pulse 46, Pumper Pro, and unrelated products

**No** shared credentials, repos, code paths, deploy pipelines, or infra links to Pulse 46, Pumper Pro, or other products were found **in this repo**. Only remote noted is the Manus S3 Git remote for this project. Anything else is outside this transcript and must be documented by the owner.

---

## 11. Visual walkthrough assets

Manus listed static screenshots under **handoff_screenshots/**:

- `home-desktop.png`
- `news-desktop.png`
- `home-mobile.png`

**No Loom** was created. Manual walkthrough: `/` → hero + ticker → “Top Wastewater News” → `/news` → “Send field proof” / “Be Featured” → `/#upload-proof` → prototype submit (toast only) → sponsor mailto CTAs.

If your archive lacks that folder, request it from Manus or capture fresh screenshots after `pnpm dev`.

---

## 12. Top five known issues (next fixes)

| # | Issue | Why it matters | Next step |
| --- | --- | --- | --- |
| 1 | `/manus-storage` URLs | Broken off Manus | Export/rehost; update `Home.tsx`. |
| 2 | Upload form looks real | Misleading users | Prototype labeling **or** full secure backend. |
| 3 | Analytics placeholders | Broken / odd HTML in prod | Remove or wire real provider. |
| 4 | Hard-coded news/ticker | Stales quickly | Content model + editorial workflow before public launch. |
| 5 | Legal / privacy / release | Sensitive footage risk | Legal review + moderation before real submissions. |

---

## 13. Recommended plan to completion

1. **Static launch hardening:** rehost images; remove or wire analytics; visible **News** nav; privacy/submission policy page (see P0 in main handoff).
2. **Submissions:** connect form only after object storage, DB, signed URLs, consent fields, moderation, email, rate limits are designed.
3. **Newsroom:** move arrays toward CMS/DB so updates do not require React edits.
4. **Later “agent” platform:** separate phase once content model, moderation, ownership, and publication rules are explicit; human approval for publish/outreach/PII/payments.

---

## 14. Exact files most likely to matter in Cursor

| File | Why |
| --- | --- |
| `client/src/pages/Home.tsx` | Main surface: ticker, CTAs, sponsor, upload prototype, merch. |
| `client/src/pages/News.tsx` | Static newsroom. |
| `client/src/App.tsx` | Routes, theme shell. |
| `client/src/index.css` | Design system, motion. |
| `client/index.html` | Meta, fonts, analytics placeholder. |
| `vite.config.ts` | Build, Manus plugins, `/manus-storage` proxy. |
| `server/index.ts` | Optional static Express. |
| `CURSOR_HANDOFF.md` | Product + roadmap. |
| `HANDOFF_SUPPLEMENT.md` | This file — technical ambiguity. |
| `research_wastewater_news.md`, `ticker-source-notes.md` | Source notes. |

---

## 15. Direct answer summary

The project is **not** a backend system today and has **no** Manus-confirmed **production** deployment from that session. It is a strong **static MVP** for a wastewater media/newsroom brand. **Blockers** for faithful local build and safe public launch: **asset portability**, **analytics cleanup**, **upload honesty or real backend**, and **legal/moderation** readiness. Next major Manus-sized phase: operations agent (monitoring, outreach, triage, approvals) — after the above is explicit.

---

## Note on `apply_flush_report_revision.py`

The script at repo root targets **`Path('/home/ubuntu/flush-report/...')`** and was used inside Manus to batch-edit `Home.tsx`. **Do not run it locally** unless you rewrite paths to your machine. Prefer normal Git/Cursor edits for the same text changes.
