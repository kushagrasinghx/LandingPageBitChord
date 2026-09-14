# BitChord — Landing Page

A production landing page for [BitChord](https://github.com/kushagrasinghx/BitChord), an open-source Android music client with Hi-Res lossless playback, beat-matched Automix and word-synced lyrics.

The page renders live repository telemetry — star counts, fork counts, release tags, APK sizes and download totals — pulled from the GitHub REST API on the server, so the numbers are real on first paint rather than filled in after hydration.

<p>
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-087EA4?logo=react&logoColor=white">
  <img alt="TypeScript 5.7" src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white">
  <img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white">
</p>

> [!NOTE]
> This is an unofficial, independent landing page. It is not affiliated with, endorsed by, or connected to YouTube, Google, Deezer or Telegram. Audio specifications shown in the player mockup are illustrative — actual bit depth and sample rate depend on the configured source.

---

## Contents

- [Stack](#stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Data flow](#data-flow)
- [Accessibility and motion](#accessibility-and-motion)
- [Deployment](#deployment)
- [License](#license)

---

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 15, App Router | React Server Components, ISR |
| UI | React 19 | Server components by default, client islands where needed |
| Language | TypeScript 5.7 | `strict` mode |
| Styling | Tailwind CSS v4 | CSS-first config via `@theme` in `app/globals.css` — there is no `tailwind.config.js` |
| Animation | Framer Motion 12 | Scroll reveals, springs, layout transitions |
| Icons | lucide-react | |
| Utilities | `clsx` + `tailwind-merge` | Combined in the `cn()` helper |

## Quick start

Requires **Node.js 20 or newer** (developed on 22.13.1).

```bash
git clone https://github.com/SHUBH-snippet/Landing_page_BitChord.git
```

```bash
cd Landing_page_BitChord && npm install
```

```bash
npm run dev
```

The dev server runs on **http://localhost:3100** (not the Next.js default of 3000 — the port is pinned in `package.json` and in `.claude/launch.json`).

No environment variables are required to run it. The GitHub API is queried unauthenticated by default.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GITHUB_TOKEN` | No | Raises the GitHub REST API rate limit from 60 requests/hour (unauthenticated, shared per IP) to 5,000/hour. Only needs public read scope. |

To set it locally, create `.env.local`:

```bash
GITHUB_TOKEN=ghp_your_token_here
```

The token is read only in `lib/github.ts`, which executes exclusively on the server, so it is never exposed to the browser. Without it the site still works — requests simply fall back to the unauthenticated limit, and if that limit is hit the affected values degrade to skeleton loaders instead of failing.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server with HMR on port 3100 |
| `npm run build` | Production build |
| `npm start` | Serve the production build on port 3100 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `next lint` — see note below |

> [!WARNING]
> `npm run lint` is wired up but no ESLint configuration is committed yet, so the first run will prompt you to choose a config. Also avoid running `npm run build` while `npm run dev` is active: both write to the same `.next` directory and the dev server's webpack runtime will break mid-session.

## Architecture

**Server-first data fetching.** All GitHub requests live in `lib/github.ts` and run on the server only — during the RSC render and inside the `/api/github` route handler. The browser never talks to `api.github.com` directly, which avoids a CORS preflight, keeps any token server-side, and means responses are cached once for all visitors rather than per visitor.

**Failure is a first-class state.** Every fetch resolves to `null` rather than throwing. Critically, `null` is kept distinct from `0`, so a rate-limited request renders a skeleton loader instead of confidently displaying "0 stars". A partial outage marks the payload `degraded` and the working half still renders.

**Incremental Static Regeneration.** Both `app/page.tsx` and the API route set `revalidate = 300`. Visitors are served static HTML while new releases and updated star counts appear within five minutes, with no redeploy. The API route additionally sets `stale-while-revalidate=1800` so a rate limit during revalidation serves a slightly stale copy instead of an error.

## Project structure

```
app/
  api/github/route.ts    Client-refresh endpoint; mirrors the RSC data source exactly
  globals.css            Tailwind v4 @theme tokens, custom @utility rules, keyframes
  layout.tsx             Fonts, metadata, skip link
  page.tsx               Server component: fetches telemetry, composes sections
components/
  site/                  Page sections — nav, hero, metrics, features,
                         changelog, install, terminal, footer, backdrop
  features/              Interactive cards for each feature section
  ui/                    Primitives — glass-card, magnetic-button, odometer,
                         live-metric, audio-canvas, phone-showcase, reveal,
                         skeleton, waveform-mark
  telemetry-provider.tsx Client context distributing GitHub data to islands
lib/
  github.ts              GitHub REST client, release parsing, formatters
  utils.ts               cn() class merger
```

## Data flow

```
app/page.tsx  ──(server)──►  lib/github.ts  ──►  api.github.com
      │                                            /repos/:slug
      │                                            /releases?per_page=100
      ▼
TelemetryProvider  ──(context)──►  client islands (metrics, hero, changelog…)
      │
      └──(only if the server payload is degraded)──►  /api/github  ──►  retry
```

The provider seeds its state from the server payload, so counters paint with real values on the first frame. It re-fetches from `/api/github` only when the server-side fetch itself failed — a visitor's own network may succeed where the server hit a rate limit — and it never downgrades good data with worse data.

Release notes are parsed in `lib/github.ts`: markdown bullets are extracted from each release body, inline formatting is stripped, and commit-level entries that only name internal Kotlin symbols are filtered out so the changelog reads as user-facing changes.

## Accessibility and motion

- `prefers-reduced-motion` is honoured in both CSS keyframes and JavaScript, via Framer Motion's `useReducedMotion`
- Canvas animation pauses when scrolled offscreen using `IntersectionObserver`, and device pixel ratio is capped at 2
- Pseudo-random visual values are derived deterministically rather than with `Math.random()`, avoiding server/client hydration mismatches
- A "Skip to content" link is the first focusable element; interactive controls carry explicit `aria-label`s, and skeleton loaders expose an accessible `Loading` label rather than reading as empty
- Download CTAs are labelled honestly — they fall back to "View Releases" / "Open Releases" instead of promising "Download APK" when a release ships no APK asset

## Deployment

Deploys as-is to any platform supporting Next.js 15 with ISR. On [Vercel](https://vercel.com/new), import the repository and accept the defaults; add `GITHUB_TOKEN` under project environment variables if you want the higher rate limit.

Jam links use the verified Android App Link shape `/invite/{code}`. Android
opens a six-character invite in the production app when it is installed. The
web fallback renders BitChord social-preview metadata, then sends a browser to
the BitChord GitHub repository when the app is not available. Keep
`public/.well-known/assetlinks.json` synchronized with the production package
name and signing-certificate fingerprint if either changes.

```bash
npm run build && npm start
```

Note that a static export (`output: 'export'`) is **not** supported here — the API route and ISR both need a Node.js runtime.

## License

No license file is committed to this repository yet, which means default copyright applies and others have no granted right to reuse the code. If you intend this to be open source, add a `LICENSE` file — MIT is the conventional choice for a landing page.

BitChord itself, the application this page describes, is licensed **GPL-3.0** — strong copyleft, meaning derivative works must ship their source under the same terms. That license covers [the app's repository](https://github.com/kushagrasinghx/BitChord), not this page.

## Credits

BitChord is built by [@kushagrasinghx](https://github.com/kushagrasinghx). This landing page is maintained by [@SHUBH-snippet](https://github.com/SHUBH-snippet).
