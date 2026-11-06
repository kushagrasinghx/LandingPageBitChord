'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Download,
  FileCode2,
  FileText,
  Info,
  Lightbulb,
  Menu,
  Search,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { LogoWordmark } from '@/components/ui/logo'
import { ISSUES_URL, REPO_URL } from '@/lib/github'
import styles from './docs-page.module.css'

/**
 * The addon developer guide.
 *
 * Laid out like a conventional reference: a slim sticky header, the section
 * list on the left, one readable column of prose, and an "On this page" rail
 * for the subheadings of whichever section is being read. Nothing decorative —
 * the code, the tables and the callouts carry the page.
 */

type NavItem = { id: string; label: string; group: string }

/** The addon-auth group: listed first and badged, because every addon needs it now. */
const AUTH_GROUP = 'Addon auth'

const navigation: NavItem[] = [
  { id: 'addon-auth', label: 'Why use it', group: AUTH_GROUP },
  { id: 'auth-setup', label: 'Set it up', group: AUTH_GROUP },
  { id: 'auth-frameworks', label: 'Framework recipes', group: AUTH_GROUP },
  { id: 'auth-media', label: 'Short-lived media URLs', group: AUTH_GROUP },
  { id: 'auth-rollout', label: 'Test and roll out', group: AUTH_GROUP },
  { id: 'auth-errors', label: 'Errors and claims', group: AUTH_GROUP },
  { id: 'auth-protocol', label: 'Protocol reference', group: AUTH_GROUP },
  { id: 'auth-faq', label: 'Auth FAQ', group: AUTH_GROUP },
  { id: 'introduction', label: 'Introduction', group: 'Overview' },
  { id: 'how-it-works', label: 'How addons work', group: 'Overview' },
  { id: 'quickstart', label: 'Quickstart', group: 'Build' },
  { id: 'manifest', label: 'Manifest', group: 'Build' },
  { id: 'search', label: 'Search endpoint', group: 'Build' },
  { id: 'stream', label: 'Stream endpoint', group: 'Build' },
  { id: 'quality', label: 'Quality negotiation', group: 'Playback' },
  { id: 'dolby-atmos', label: 'Dolby Atmos', group: 'Playback' },
  { id: 'downloads', label: 'Download permission', group: 'Playback' },
  { id: 'lossless-output', label: 'Lossless output gate', group: 'Playback' },
  { id: 'install-test', label: 'Install and test', group: 'Ship' },
  { id: 'production', label: 'Production checklist', group: 'Ship' },
  { id: 'troubleshooting', label: 'Troubleshooting', group: 'Reference' },
]

const manifestCode = `{
  "id": "dev.example.reference-addon",
  "name": "Reference Addon",
  "version": "1.0.0",
  "resources": ["search", "stream"],
  "bitchordAuth": true,
  "allowDownloads": 1,
  "checkValidLossless": 0,
  "settings": [
    {
      "key": "quality",
      "type": "select",
      "default": "lossless",
      "options": [
        { "label": "Lossless", "value": "lossless" },
        { "label": "High", "value": "high" },
        { "label": "Low", "value": "low" }
      ]
    }
  ]
}`

const searchCode = `GET /search?q=midnight&quality=lossless&atmos=auto

{
  "tracks": [
    {
      "id": "track_8f31",
      "title": "Midnight Signal",
      "artist": "Example Artist",
      "album": "Night Drive",
      "duration": 242,
      "artworkURL": "https://audio.example/art/8f31.jpg",
      "format": "flac",
      "audioQuality": "LOSSLESS"
    }
  ]
}`

const streamCode = `GET /stream/track_8f31?quality=lossless&atmos=auto

{
  "url": "https://audio.example/media/track_8f31.flac",
  "format": "flac",
  "quality": "Lossless · 24-bit / 96 kHz",
  "codec": "flac",
  "container": "flac",
  "manifest": "none",
  "encrypted": false,
  "sampleRate": 96000,
  "bitDepth": 24,
  "bitrate": 2800000
}`

const serverCode = `import { createBitChordAuth } from "./bitchord-addon-auth.mjs"

// Recommended: only the official BitChord app gets past this. See Addon auth.
const bitchord = createBitChordAuth({ hosts: ["audio.example"] })

const tracks = [
  {
    id: "track_8f31",
    title: "Midnight Signal",
    artist: "Example Artist",
    album: "Night Drive",
    duration: 242,
    artworkURL: "https://audio.example/art/8f31.jpg",
    format: "flac",
    audioQuality: "LOSSLESS"
  }
]

const MANIFEST = {
  id: "dev.example.reference-addon",
  name: "Reference Addon",
  version: "1.0.0",
  resources: ["search", "stream"],
  bitchordAuth: true
}

export async function handleRequest(request) {
  const url = new URL(request.url)

  if (url.pathname === "/manifest.json") {
    return json(MANIFEST) // stays public
  }

  const denied = await bitchord.guard(request) // 401 for anything but BitChord
  if (denied) return denied

  if (url.pathname === "/search") {
    const query = (url.searchParams.get("q") || "").toLowerCase()
    return json({
      tracks: tracks.filter((track) =>
        [track.title, track.artist, track.album]
          .join(" ").toLowerCase().includes(query)
      )
    })
  }

  if (url.pathname.startsWith("/stream/")) {
    const id = decodeURIComponent(url.pathname.slice(8))
    if (!tracks.some((track) => track.id === id)) {
      return new Response(null, { status: 404 })
    }
    return json({
      url: signedMediaUrl(id),
      codec: "flac",
      container: "flac",
      manifest: "none",
      encrypted: false,
      sampleRate: 96000,
      bitDepth: 24
    })
  }

  return new Response(null, { status: 404 })
}

function json(value) {
  return Response.json(value, {
    headers: { "Cache-Control": "no-store" }
  })
}

function signedMediaUrl(id) {
  // Sign and expire this in production: see Short-lived media URLs.
  return \`https://audio.example/media/\${encodeURIComponent(id)}.flac\`
}`

const dolbyCode = `// BitChord sends this only when Dolby is enabled and supported:
GET /search?q=midnight&quality=lossless&atmos=auto
GET /stream/dolby_8f31?quality=lossless&atmos=auto

// Search result for a distinct Dolby mix:
{
  "id": "dolby_8f31",
  "title": "Midnight Signal",
  "artist": "Example Artist",
  "album": "Night Drive",
  "duration": 242,
  "format": "dash",
  "audioModes": ["DOLBY_ATMOS"],
  "atmos": true
}

// Stream response:
{
  "url": "https://audio.example/media/dolby_8f31",
  "format": "dash",
  "quality": "Dolby Atmos",
  "codec": "eac3-joc",
  "container": "mp4",
  "manifest": "dash",
  "sampleRate": 48000,
  "audioMode": "DOLBY_ATMOS",
  "encrypted": false
}`

const qualityOptionsCode = `// manifest.json — a quality select, best option first:
{
  "id": "dev.example.hires-addon",
  "name": "Hi-Res Addon",
  "resources": ["search", "stream"],
  "settings": [
    {
      "key": "quality",
      "type": "select",
      "label": "Audio quality",
      "default": "max",
      "options": [
        { "value": "max", "label": "Max (best available)" },
        { "value": "hires", "label": "Hi-Res (up to 24-bit / 192 kHz FLAC)" },
        { "value": "lossless", "label": "CD (16-bit / 44.1 kHz FLAC)" },
        { "value": "high", "label": "AAC (320 kbps)" }
      ]
    }
  ]
}

// Settings → Sources shows "Max (best available)" under the addon's name.
// Nothing picked yet, so the first option is sent:
GET /search?q=midnight&quality=max
GET /stream/track_8f31?quality=max

// The listener taps it and picks "Hi-Res (up to 24-bit / 192 kHz FLAC)":
GET /search?q=midnight&quality=hires
GET /stream/track_8f31?quality=hires

// Other query parameters are left out here.`

const downloadsCode = `// manifest.json — stream in BitChord, but never be saved from it:
{
  "id": "dev.example.reference-addon",
  "name": "Reference Addon",
  "resources": ["search", "stream"],
  "allowDownloads": 0
}

// Listener taps Download on a track this addon would play:
//   1. Your addon is skipped for the download.
//   2. The next enabled source in the listener's order is asked
//      (another addon, then JioSaavn if enabled, then YouTube).
//   3. Playback is unaffected — /search and /stream keep working.`

const losslessOutputCode = `// manifest.json — only use this addon on a lossless-capable output:
{
  "id": "dev.example.hires-addon",
  "name": "Hi-Res Addon",
  "resources": ["search", "stream"],
  "checkValidLossless": 1
}

// Phone speaker, or Bluetooth on SBC / AAC / aptX:
//   no requests at all — not /manifest.json, not /search, not /stream.
//   Tracks resolve from the next source; Sources shows a warning.

// Wired, USB, HDMI, or Bluetooth on LDAC / LHDC / aptX Lossless:
GET /search?q=midnight&quality=lossless&atmos=auto
GET /stream/track_8f31?quality=lossless&atmos=auto`


const DISCORD_URL = 'https://discord.gg/pSafNTyKZx'

/** A heading id from its text, so subheadings can be linked and listed. */
function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children)
  }
  return ''
}

/* --------------------------------- syntax -------------------------------- */

/**
 * A small highlighter for the guide's samples: JSON, JavaScript and request
 * lines. Comments, keys, strings, literals, numbers, keywords and HTTP methods
 * — enough to read a sample at a glance, without a dependency.
 */
const TOKENS =
  /(\/\/.*$)|("(?:[^"\\\n]|\\.)*")(?=\s*:)|("(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(true|false|null)\b|\b(\d+(?:\.\d+)?)\b|\b(const|function|return|if|export|async|await|new)\b|^(GET|POST)(?= )/gm

const TOKEN_KINDS = ['comment', 'key', 'string', 'literal', 'number', 'keyword', 'method'] as const

function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const m of code.matchAll(TOKENS)) {
    const at = m.index ?? 0
    if (at > last) out.push(code.slice(last, at))
    const kind = TOKEN_KINDS[m.slice(1).findIndex((group) => group !== undefined)] ?? 'string'
    out.push(
      <span key={at} className={styles[`tk_${kind}`]}>
        {m[0]}
      </span>,
    )
    last = at + m[0].length
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}

/* ------------------------------- primitives ------------------------------ */

function CodeBlock({ code, label = 'JSON' }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeHeader}>
        <span>{label.toLowerCase()}</span>
        <button type="button" onClick={copy} aria-label="Copy code">
          {copied ? <Check className="size-4" aria-hidden /> : <Clipboard className="size-4" aria-hidden />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre>
        <code>{highlight(code)}</code>
      </pre>
    </div>
  )
}

function InlineCode({ children }: { children: ReactNode }) {
  return <code className={styles.inlineCode}>{children}</code>
}

/** Note / Warning / Tip, as most reference docs draw them. */
function Callout({
  title,
  children,
  tone = 'note',
}: {
  title: string
  children: ReactNode
  tone?: 'note' | 'warn' | 'success'
}) {
  const Icon = tone === 'warn' ? TriangleAlert : tone === 'success' ? Lightbulb : Info
  return (
    <aside className={`${styles.callout} ${styles[tone]}`}>
      <Icon className={styles.calloutIcon} aria-hidden />
      <div>
        <p className={styles.calloutTitle}>{title}</p>
        <div className={styles.calloutBody}>{children}</div>
      </div>
    </aside>
  )
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 id={`${id}-title`}>
        <a href={`#${id}`}>{title}</a>
      </h2>
      {children}
    </section>
  )
}

/** A subheading with an id, so it can be linked and listed in the rail. */
function H3({ children }: { children: ReactNode }) {
  const id = slug(textOf(children))
  return (
    <h3 id={id} data-toc>
      <a href={`#${id}`}>{children}</a>
    </h3>
  )
}

function RequirementBadge({ value }: { value: string }) {
  if (value === 'Yes') return <span className={`${styles.badge} ${styles.badgeRequired}`}>Required</span>
  if (value === 'Recommended') return <span className={styles.badge}>Recommended</span>
  return <span className={styles.optional}>{value === 'No' ? 'Optional' : value.replace(/^No · /, 'Optional · ')}</span>
}

function FieldTable({
  rows,
  headers = ['Field', 'Required', 'Meaning'],
}: {
  rows: Array<[string, string, string]>
  headers?: [string, string, string]
}) {
  // Field references put the name in code and grade the requirement; the
  // outputs table is plain text with a yes / no.
  const reference = headers[0] === 'Field'
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            {headers.map((header) => <th key={header}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(([field, required, meaning]) => (
            <tr key={field}>
              <td className={styles.fieldCell}>{reference ? <InlineCode>{field}</InlineCode> : field}</td>
              <td className={styles.requiredCell}>
                {reference ? (
                  <RequirementBadge value={required} />
                ) : (
                  <span className={required === 'Yes' ? styles.yes : styles.no}>{required}</span>
                )}
              </td>
              <td>{meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** A plain table; the columns listed in `code` are set as inline code. */
function SimpleTable({ headers, rows, code = [] }: { headers: string[]; rows: string[][]; code?: number[] }) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join('|')}>
              {row.map((cell, i) => (
                <td key={i} className={code.includes(i) ? styles.fieldCell : undefined}>
                  {code.includes(i) ? <InlineCode>{cell}</InlineCode> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------- addon auth ------------------------------- */

const AUTH_ISSUER = 'https://bitchord-auth.kushagrasingh.in'
const AUTH_MIN_VERSION = '1.9.1'
const AI_BRIEF_URL = '/addon-auth/bitchord-addon-auth-for-ai.md'
const JS_VERIFIER_URL = '/addon-auth/bitchord-addon-auth.mjs'
const PY_VERIFIER_URL = '/addon-auth/bitchord_addon_auth.py'
/** The app's own words: the "Outdated addon" line in Sources, and what tapping it says. */
const OUTDATED_LABEL = 'Outdated addon'
const OUTDATED_MESSAGE =
  'This addon is out of date. It still works, but ask its developer to update it by following the latest BitChord addon docs.'

const authManifestCode = `{
  "id": "com.example.myaddon",
  "name": "My Addon",
  "version": "1.2.0",
  "resources": ["search", "stream"],
  "bitchordAuth": true
}`

const authExpressCode = `import express from "express"
import { createBitChordAuth } from "./bitchord-addon-auth.mjs"

const app = express()
const bitchord = createBitChordAuth({ hosts: ["myaddon.example.com"] })

app.get("/manifest.json", (req, res) => res.json(manifest)) // stays public
app.use(bitchord.express())                                  // everything below needs BitChord

app.get("/search", async (req, res) => { /* ... */ })
app.get("/stream/:id", async (req, res) => { /* ... */ })

// On success, req.bitchord holds the token's claims.`

const authFetchCode = `import { createBitChordAuth } from "./bitchord-addon-auth.mjs"

// Module scope, so the key cache is shared between requests.
const bitchord = createBitChordAuth({
  hosts: ["myaddon.example.com", "myaddon.me.workers.dev"]
})

export default {
  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname.endsWith("/manifest.json")) return Response.json(manifest)

    const denied = await bitchord.guard(request) // a 401/503 Response, or null
    if (denied) return denied

    // ... your /search and /stream handling
  }
}`

const authHonoCode = `import { Hono } from "hono"
import { createBitChordAuth } from "./bitchord-addon-auth.mjs"

const app = new Hono()
const bitchord = createBitChordAuth({ hosts: ["myaddon.example.com"] })

app.use("*", async (c, next) =>
  c.req.path.endsWith("/manifest.json")
    ? next()
    : (await bitchord.guard(c.req.raw)) ?? next()
)`

const authNextCode = `// lib/bitchord.js
import { createBitChordAuth } from "./bitchord-addon-auth.mjs"
export const bitchord = createBitChordAuth({ hosts: ["myaddon.example.com"] })

// app/search/route.js (do the same in every route except manifest.json)
import { bitchord } from "@/lib/bitchord"

export async function GET(request) {
  const denied = await bitchord.guard(request)
  if (denied) return denied
  // ...
}`

const authFastifyCode = `fastify.addHook("onRequest", async (req, reply) => {
  if (req.url.split("?")[0].endsWith("/manifest.json")) return
  const result = await bitchord.verifyRequest(req.raw)
  if (!result.ok) {
    const r = bitchord.rejection(result)
    return reply.code(r.status).headers(r.headers).send(r.body)
  }
  req.bitchord = result.claims
})`

const authFastapiCode = `from fastapi import Depends, FastAPI, Request
from fastapi.responses import Response
from bitchord_addon_auth import BitChordAuth

app = FastAPI()
bitchord = BitChordAuth(hosts=["myaddon.example.com"])

class Denied(Exception):
    def __init__(self, result): self.result = result

@app.exception_handler(Denied)
async def denied(_, exc: Denied):
    return Response(exc.result.body, status_code=exc.result.status, headers=exc.result.headers)

def require_bitchord(request: Request):
    result = bitchord.verify_headers(request.headers)
    if not result.ok:
        raise Denied(result)
    return result.claims

@app.get("/manifest.json")
def get_manifest(): return MANIFEST            # stays public

@app.get("/search")
def search(q: str, claims=Depends(require_bitchord)): ...

@app.get("/stream/{track_id}")
def stream(track_id: str, claims=Depends(require_bitchord)): ...`

const authFlaskCode = `from flask import Flask, request, Response, g
from bitchord_addon_auth import BitChordAuth

app = Flask(__name__)
bitchord = BitChordAuth(hosts=["myaddon.example.com"])

@app.before_request
def require_bitchord():
    if request.path.endswith("/manifest.json"):
        return None
    result = bitchord.verify_headers(request.headers)
    if not result.ok:
        return Response(result.body, status=result.status, headers=result.headers)
    g.bitchord = result.claims`

const authDjangoCode = `from django.http import HttpResponse
from bitchord_addon_auth import BitChordAuth

bitchord = BitChordAuth(hosts=["myaddon.example.com"])

class BitChordAuthMiddleware:
    def __init__(self, get_response): self.get_response = get_response

    def __call__(self, request):
        if request.path.endswith("/manifest.json"):
            return self.get_response(request)
        result = bitchord.verify_headers(request.headers)
        if not result.ok:
            response = HttpResponse(result.body, status=result.status)
            for key, value in result.headers.items(): response[key] = value
            return response
        request.bitchord = result.claims
        return self.get_response(request)`

const authMediaCode = `import crypto from "node:crypto"
const MEDIA_SECRET = process.env.MEDIA_SECRET // long random string, server-side only

// Return this from /stream instead of a permanent URL.
export function signedMediaUrl(id, ttlSeconds = 1800) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const sig = crypto.createHmac("sha256", MEDIA_SECRET).update(\`\${id}.\${exp}\`).digest("base64url")
  return \`https://myaddon.example.com/media/\${encodeURIComponent(id)}?exp=\${exp}&sig=\${sig}\`
}

// Check this on the media route. Do NOT require X-BitChord-* headers there.
export function mediaAllowed(id, exp, sig) {
  if (!/^\\d+$/.test(String(exp)) || Number(exp) < Date.now() / 1000) return false
  const want = crypto.createHmac("sha256", MEDIA_SECRET).update(\`\${id}.\${exp}\`).digest()
  const got = Buffer.from(String(sig ?? ""), "base64url")
  return got.length === want.length && crypto.timingSafeEqual(got, want)
}`

const authLogOnlyCode = `// Step 1 of the rollout: verify, log, but still serve.
app.use(async (req, res, next) => {
  if (req.path.endsWith("/manifest.json")) return next()
  const result = await bitchord.verifyRequest(req)
  if (!result.ok) console.log("bitchord-auth would refuse:", result.error)
  next()
})`

const authLogOnlyPyCode = `result = bitchord.verify_headers(request.headers)
if not result.ok:
    print("bitchord-auth would refuse:", result.error)
# ...serve the request anyway`

const authCurlCode = `# Manifest: public, and it declares the flag
curl -s https://myaddon.example.com/manifest.json

# Anything else without BitChord: refused with the BitChord challenge
curl -si "https://myaddon.example.com/search?q=test"
# HTTP/1.1 401
# www-authenticate: BitChord realm="bitchord-addons", error="missing", ...

curl -si https://myaddon.example.com/stream/anything     # 401 as well

# Forged headers are refused too
curl -si -H "X-BitChord-Token: x.y.z" -H "X-BitChord-Proof: v1.0.x" \\
  "https://myaddon.example.com/search?q=test"            # 401`

const authRejectionCode = `HTTP/1.1 401 Unauthorized
content-type: application/json
cache-control: no-store
www-authenticate: BitChord realm="bitchord-addons", error="expired", error_description="Token expired"

{ "error": "bitchord_auth", "code": "expired", "message": "Token expired" }`

const authHeadersCode = `GET /search?q=midnight&quality=lossless
X-BitChord-Token: eyJhbGciOiJFZERTQSIsImtpZCI6Ii4uLiJ9.eyJpc3MiOi...
X-BitChord-Proof: v1.1793895893081.MEUCIQ...  (86 base64url characters)`

const authProofCode = `// The bytes the device signs (UTF-8, \\n is a single line feed):
bitchord-addon-proof/v1\\n<host>\\n<unix-ms>\\n<base64url(SHA-256(token))>

// <host>    one of YOUR configured hostnames, never the request's Host header
// <unix-ms> the number from the proof header, within ±120 s of your clock
// signature ECDSA P-256 / SHA-256, raw r||s (64 bytes), base64url, no padding`

const authTokenCode = `// Header
{ "alg": "EdDSA", "kid": "h0nr3tdm5pQ", "typ": "JWT" }

// Payload
{
  "iss": "${AUTH_ISSUER}",
  "aud": "bitchord-addons",
  "sub": "Qm9…",          // install's key thumbprint, rotates hourly
  "iat": 1793895893,
  "exp": 1793899493,      // 1 hour
  "ver": 37,              // BitChord version code
  "sl": "tee",            // tee | strongbox
  "cnf": { "jwk": { "kty": "EC", "crv": "P-256", "x": "…", "y": "…" } }
}`

/** Several samples of the same thing, one per stack, behind a row of tabs. */
function CodeTabs({ tabs }: { tabs: Array<{ name: string; label: string; code: string }> }) {
  const [current, setCurrent] = useState(0)
  const tab = tabs[current]
  return (
    <div className={styles.codeTabs}>
      <div className={styles.codeTabList} role="tablist" aria-label="Framework">
        {tabs.map((t, i) => (
          <button
            key={t.name}
            type="button"
            role="tab"
            aria-selected={i === current}
            className={i === current ? styles.codeTabActive : ''}
            onClick={() => setCurrent(i)}
          >
            {t.name}
          </button>
        ))}
      </div>
      <CodeBlock key={tab.name} code={tab.code} label={tab.label} />
    </div>
  )
}

/** The three files an addon developer takes away from this page. */
function AuthDownloads() {
  const files = [
    {
      href: JS_VERIFIER_URL,
      icon: FileCode2,
      name: 'bitchord-addon-auth.mjs',
      copy: 'Verifier for Node, Workers, Deno, Bun, Next.js. No dependencies.',
    },
    {
      href: PY_VERIFIER_URL,
      icon: FileCode2,
      name: 'bitchord_addon_auth.py',
      copy: 'Verifier for Python 3.9+. Needs pip install cryptography.',
    },
    {
      href: AI_BRIEF_URL,
      icon: FileText,
      name: 'bitchord-addon-auth-for-ai.md',
      copy: 'This whole guide plus both verifiers, for Claude, Cursor, Copilot or ChatGPT.',
    },
  ]
  return (
    <div className={styles.downloadGrid}>
      {files.map(({ href, icon: Icon, name, copy }) => (
        <a key={href} href={href} download className={styles.downloadCard}>
          <span className={styles.downloadIcon}><Icon aria-hidden /></span>
          <span className={styles.downloadText}>
            <span className={styles.downloadName}>{name}</span>
            <span className={styles.downloadCopy}>{copy}</span>
          </span>
          <Download className={styles.downloadArrow} aria-hidden />
        </a>
      ))}
    </div>
  )
}

/* ---------------------------------- page --------------------------------- */

export function DocsPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('introduction')
  const [subheadings, setSubheadings] = useState<{ id: string; label: string }[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

  const matches = useMemo(() => {
    const value = query.trim().toLowerCase()
    return value ? navigation.filter((item) => item.label.toLowerCase().includes(value)) : []
  }, [query])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping = target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')

      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTyping) {
        event.preventDefault()
        event.stopPropagation()
        searchRef.current?.focus()
      }

      if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        setQuery('')
        searchRef.current?.blur()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [])

  useEffect(() => {
    let frame = 0
    const updateActiveSection = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const marker = Math.min(360, window.innerHeight * 0.42)
        const sections = navigation
          .map(({ id }) => document.getElementById(id))
          .filter((section): section is HTMLElement => Boolean(section))
          // Page order, not list order: the auth group is listed first but follows the intro.
          .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)

        const current = sections.reduce((selected, section) => {
          return section.getBoundingClientRect().top <= marker ? section : selected
        }, sections[0])

        if (current?.id) setActive(current.id)
      })
    }

    updateActiveSection()
    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
    }
  }, [])

  // The rail lists the subheadings of the section being read.
  useEffect(() => {
    const section = document.getElementById(active)
    const found = section ? [...section.querySelectorAll<HTMLElement>('h3[data-toc]')] : []
    setSubheadings(found.map((h) => ({ id: h.id, label: h.textContent ?? '' })))
  }, [active])

  const groups = [...new Set(navigation.map((item) => item.group))]
  const activeItem = navigation.find((item) => item.id === active)

  return (
    <div className={styles.docs}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="BitChord home">
            <LogoWordmark className={styles.logo} />
          </Link>
          <span className={styles.divider} aria-hidden />
          <Link href="/docs" className={styles.product}>
            Docs
          </Link>

          <div className={styles.searchWrap}>
            <Search className={styles.searchIcon} aria-hidden />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search docs"
              aria-label="Search documentation"
            />
            <kbd>/</kbd>
            {query && (
              <div className={styles.searchResults}>
                {matches.length ? matches.map((item) => (
                  <a key={item.id} href={`#${item.id}`} onClick={() => setQuery('')}>
                    <span>{item.label}</span>
                    <small>{item.group}</small>
                  </a>
                )) : <p>No section found</p>}
              </div>
            )}
          </div>

          <nav className={styles.headerLinks} aria-label="Site">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <Link href="/" className={styles.backLink}>
              <ArrowLeft className="size-4" aria-hidden />
              Back to site
            </Link>
          </nav>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle documentation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <div className={styles.shell}>
        <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
          <nav aria-label="Documentation">
            {groups.map((group) => (
              <div className={`${styles.navGroup} ${group === AUTH_GROUP ? styles.navGroupNew : ''}`} key={group}>
                <p>
                  {group}
                  {group === AUTH_GROUP && <span className={styles.navNewPill}>New</span>}
                </p>
                {navigation.filter((item) => item.group === group).map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    aria-current={active === item.id ? 'location' : undefined}
                    className={active === item.id ? styles.navActive : ''}
                    onClick={() => {
                      setActive(item.id)
                      setMobileOpen(false)
                    }}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {mobileOpen && <button className={styles.scrim} onClick={() => setMobileOpen(false)} aria-label="Close menu" />}

        <main id="main-content" className={styles.main}>
          <article className={styles.article}>
            <section id="introduction" className={styles.intro} aria-labelledby="introduction-title">
              <aside className={styles.authNotice} aria-label="New: addon auth">
                <p className={styles.authNoticeLabel}>
                  <span className={`${styles.badge} ${styles.badgeRequired}`}>New</span>
                  BitChord {AUTH_MIN_VERSION} · optional, recommended
                </p>
                <p className={styles.authNoticeTitle}>Lock your addon to the official BitChord app</p>
                <p className={styles.authNoticeBody}>
                  Other apps and forks can call your addon today. Declare <InlineCode>"bitchordAuth": true</InlineCode>{' '}
                  and check each request, and only the official BitChord app gets through. It’s optional: addons that
                  don’t adopt it keep working in BitChord, with a small “{OUTDATED_LABEL}” note in Sources. The change
                  takes about 15 minutes.
                </p>
                <div className={styles.authNoticeLinks}>
                  <a href="#addon-auth">
                    Set up addon auth <ArrowRight aria-hidden />
                  </a>
                  <a href={AI_BRIEF_URL} download>
                    <Download aria-hidden /> Download .md for AI
                  </a>
                </div>
              </aside>
              <p className={styles.eyebrow}>Addon protocol</p>
              <h1 id="introduction-title">Build an addon for BitChord</h1>
              <p className={styles.lede}>
                Connect your own audio catalogue to BitChord with three small JSON endpoints.
                Your server searches tracks, resolves a playable stream, and describes the audio accurately.
              </p>
              <ul className={styles.facts} aria-label="At a glance">
                <li><strong>3</strong> HTTP routes</li>
                <li><strong>JSON</strong> wire format</li>
                <li><strong>GET</strong> every request</li>
              </ul>

              <div className={styles.cardGrid}>
                {[
                  ['#quickstart', 'Quickstart', 'Expose three routes from any HTTPS server.'],
                  ['#manifest', 'Manifest', 'Declare your addon, its resources and switches.'],
                  ['#addon-auth', 'Addon auth', 'New: answer only the official BitChord app.'],
                ].map(([href, title, copy]) => (
                  <a key={href} href={href} className={styles.linkCard}>
                    <span className={styles.linkCardTitle}>
                      {title}
                      <ChevronRight className="size-4" aria-hidden />
                    </span>
                    <span className={styles.linkCardCopy}>{copy}</span>
                  </a>
                ))}
              </div>
            </section>

            <Callout title="The core idea" tone="success">
              BitChord never downloads or executes addon code. It calls your server over HTTP, reads JSON,
              and hands the returned media URL to its player.
            </Callout>

            {/* ------------------------- addon auth (new) ------------------------- */}

            <Section id="addon-auth" eyebrow="Addon auth · New" title="Lock your addon to BitChord">
              <p>
                From BitChord {AUTH_MIN_VERSION}, your addon can require proof that a request comes from the official
                BitChord Android app. The app attaches a hardware-backed proof to each request, and your server checks
                it. Forks of BitChord, other music apps, scripts, <InlineCode>curl</InlineCode> and browsers get{' '}
                <InlineCode>401</InlineCode>. It’s optional, and recommended for any addon you don’t want used
                outside BitChord.
              </p>
              <H3>What happens to addons that don’t adopt it</H3>
              <p>
                Nothing breaks. BitChord keeps searching, streaming and downloading from them exactly as before,
                without sending any credentials. If your manifest doesn’t declare{' '}
                <InlineCode>"bitchordAuth": true</InlineCode>, or there is no manifest at all, the addon’s row in
                Settings → Sources shows a small <strong>{OUTDATED_LABEL}</strong> line. Tapping it tells the listener:
              </p>
              <blockquote className={styles.appQuote}>{OUTDATED_MESSAGE}</blockquote>
              <p>
                Once you publish the updated manifest, the note goes away the next time BitChord reads it, within
                about 10 minutes of the listener using the addon. Nobody has to re-add the addon.
              </p>
              <H3>Why a User-Agent or client-name check isn’t enough</H3>
              <p>
                BitChord is open source, so anything the app sends (its name, its User-Agent, an API key) can be
                copied into a fork in a minute. That is exactly how forks and other apps have been using addons
                built for BitChord. The one thing a fork can’t copy is BitChord’s <strong>release signing key</strong>.
                Addon auth has Android itself vouch for it.
              </p>
              <div className={styles.flow} aria-label="Addon auth lifecycle">
                {[
                  ['01', 'Attest', 'Key made in phone hardware'],
                  ['02', 'Token', '1-hour token, bound to that key'],
                  ['03', 'Sign', 'Every request signed by the key'],
                  ['04', 'Verify', 'Your server checks, offline'],
                ].map(([step, title, detail]) => (
                  <div className={styles.flowItem} key={step}>
                    <span>{step}</span>
                    <strong>{title}</strong>
                    <code>{detail}</code>
                  </div>
                ))}
              </div>
              <ol className={styles.numberList}>
                <li><span>1</span><div><strong>The app makes a key inside the phone’s secure hardware.</strong><p>Android’s key attestation produces a certificate chain, signed by Google, that names the app’s package and signing certificate and says whether the phone’s OS is genuine and its bootloader locked.</p></div></li>
                <li><span>2</span><div><strong>BitChord’s auth service checks that proof.</strong><p>It accepts only the official, release-signed BitChord on a phone with a verified OS, and issues a 1-hour token bound to that hardware key. A fork can’t produce this proof without BitChord’s private signing key.</p></div></li>
                <li><span>3</span><div><strong>Every addon request carries the token and a fresh signature.</strong><p>The signature is made by the hardware key over your hostname, the time and the token. The key never leaves the phone, so a token copied off a real install is useless anywhere else.</p></div></li>
                <li><span>4</span><div><strong>Your server checks both, locally, in under a millisecond.</strong><p>It downloads BitChord’s public keys from <InlineCode>{AUTH_ISSUER}/.well-known/jwks.json</InlineCode> about once an hour. It never calls the auth service per request, and there’s nothing to register: no account, no API key.</p></div></li>
              </ol>
              <H3>Who gets refused</H3>
              <FieldTable
                headers={['Client', 'Works', 'Why']}
                rows={[
                  ['Official BitChord for Android', 'Yes', 'On an ordinary phone with a locked bootloader, as before.'],
                  ['Forks, rebuilds, modified APKs', 'No', 'Even if they keep the BitChord name, package or client string: they aren’t signed with BitChord’s key.'],
                  ['Other apps, scripts, curl, browsers', 'No', 'They can’t produce the hardware-backed proof.'],
                  ['Rooted phones, custom ROMs', 'No', 'BitChord only accepts phones with a locked bootloader and a verified, unmodified OS.'],
                  ['Emulators, phones without secure key storage', 'No', 'No hardware to hold the key.'],
                  ['BitChord desktop and web', 'No', 'They can’t prove they’re genuine. Once you enforce auth, they can’t use your addon.'],
                ]}
              />
              <Callout title="About 15 minutes of work" tone="success">
                One manifest field, one file to copy, and a few lines in your server. If you use an AI coding
                assistant, give it the <a href={AI_BRIEF_URL} download>Markdown for AI</a>: it has every step below
                plus the full verifier source.
              </Callout>
            </Section>

            <Section id="auth-setup" eyebrow="Addon auth" title="Set it up">
              <p>Five steps. Step 1 clears the “{OUTDATED_LABEL}” note; steps 2–4 are what keep other apps out, and step 5 protects your audio files.</p>
              <AuthDownloads />
              <div className={styles.steps}>
                <div>
                  <span>01</span>
                  <div>
                    <strong>Declare the flag in your manifest</strong>
                    <p>
                      Add <InlineCode>"bitchordAuth": true</InlineCode> to <InlineCode>manifest.json</InlineCode>.{' '}
                      <InlineCode>true</InlineCode>, <InlineCode>1</InlineCode> and the same values as strings are
                      accepted. <strong>Keep the manifest itself public</strong>: BitChord reads it without
                      credentials to learn that it has to authenticate.
                    </p>
                    <CodeBlock code={authManifestCode} />
                  </div>
                </div>
                <div>
                  <span>02</span>
                  <div>
                    <strong>Add the verifier file to your project</strong>
                    <p>
                      Download the file for your stack above and add it unchanged. Don’t rewrite it: it’s about
                      200 lines and it’s the reference implementation.
                    </p>
                    <p>
                      The verifier makes one outbound request: about once an hour it fetches BitChord’s public keys
                      from <InlineCode>{AUTH_ISSUER}/.well-known/jwks.json</InlineCode>. That address is built in, so
                      there’s nothing to configure, but if your server restricts outbound traffic, allow HTTPS to{' '}
                      <InlineCode>bitchord-auth.kushagrasingh.in</InlineCode>.
                    </p>
                    <SimpleTable
                      code={[1]}
                      headers={['Your stack', 'File', 'Needs']}
                      rows={[
                        ['Node 20+, Express, Fastify, Hono, Next.js, Cloudflare Workers, Deno, Bun, Vercel/Netlify edge', 'bitchord-addon-auth.mjs', 'Nothing. It uses WebCrypto only.'],
                        ['Python 3.9+: FastAPI, Flask, Django, anything', 'bitchord_addon_auth.py', 'pip install cryptography'],
                        ['Anything else: Go, Rust, PHP, Java…', 'Port it', 'An Ed25519 and ECDSA P-256 library. See Protocol reference.'],
                      ]}
                    />
                  </div>
                </div>
                <div>
                  <span>03</span>
                  <div>
                    <strong>Check every route except the manifest</strong>
                    <p>
                      Create one verifier per process, at module scope, and run it before search, stream and
                      anything else your addon serves. Send refusals with the helper it gives you, because
                      BitChord reads the <InlineCode>WWW-Authenticate</InlineCode> header to decide whether to
                      refresh its token. Recipes for each framework are in{' '}
                      <a href="#auth-frameworks">Framework recipes</a>.
                    </p>
                    <CodeBlock code={authExpressCode} label="JAVASCRIPT · EXPRESS" />
                  </div>
                </div>
                <div>
                  <span>04</span>
                  <div>
                    <strong>Set hosts to your public hostname(s)</strong>
                    <p>
                      The app signs each request for <strong>the hostname in the addon URL the listener pasted</strong>:
                      lowercase, no <InlineCode>https://</InlineCode>, no port, no path. The verifier deliberately
                      ignores the <InlineCode>Host</InlineCode> header and only trusts the hostnames you configure. If <InlineCode>hosts</InlineCode> is wrong, every request fails with{' '}
                      <InlineCode>invalid_proof</InlineCode>.
                    </p>
                    <SimpleTable
                      code={[0, 1]}
                      headers={['Listener pastes', 'hosts', 'Note']}
                      rows={[
                        ['https://myaddon.example.com/manifest.json', '["myaddon.example.com"]', 'The usual case.'],
                        ['https://myaddon.example.com:8443/abc123/manifest.json', '["myaddon.example.com"]', 'Port and path are dropped.'],
                        ['A custom domain and *.workers.dev both in use', 'List both', 'Same for *.onrender.com, *.vercel.app, *.pages.dev.'],
                      ]}
                    />
                  </div>
                </div>
                <div>
                  <span>05</span>
                  <div>
                    <strong>Make media URLs short-lived</strong>
                    <p>
                      Auth protects your JSON endpoints. The audio URL your <InlineCode>/stream</InlineCode> returns
                      is fetched by the player without BitChord’s headers, so a permanent URL can be shared. Sign it
                      and let it expire: see <a href="#auth-media">Short-lived media URLs</a>.
                    </p>
                  </div>
                </div>
              </div>
              <Callout title="Adding the flag without verifying" tone="warn">
                The flag on its own clears the “{OUTDATED_LABEL}” note, but it protects nothing: every fork and
                script still gets in. Ship steps 2–4 with it, even if you start in{' '}
                <a href="#auth-rollout">log-only mode</a>.
              </Callout>
            </Section>

            <Section id="auth-frameworks" eyebrow="Addon auth" title="Framework recipes">
              <p>
                The same three rules in every framework: one verifier at module scope, the manifest route stays
                public, and refusals go out through the helper so BitChord gets the status, the{' '}
                <InlineCode>WWW-Authenticate</InlineCode> header and the JSON body it expects.
              </p>
              <CodeTabs
                tabs={[
                  { name: 'Express', label: 'JAVASCRIPT', code: authExpressCode },
                  { name: 'Workers / Deno / Bun', label: 'JAVASCRIPT', code: authFetchCode },
                  { name: 'Hono', label: 'JAVASCRIPT', code: authHonoCode },
                  { name: 'Next.js', label: 'JAVASCRIPT', code: authNextCode },
                  { name: 'Fastify', label: 'JAVASCRIPT', code: authFastifyCode },
                  { name: 'FastAPI', label: 'PYTHON', code: authFastapiCode },
                  { name: 'Flask', label: 'PYTHON', code: authFlaskCode },
                  { name: 'Django', label: 'PYTHON', code: authDjangoCode },
                ]}
              />
              <H3>What the helpers give you</H3>
              <SimpleTable
                code={[0]}
                headers={['Helper', 'Where', 'What it does']}
                rows={[
                  ['express()', 'JS', 'Express/Connect middleware. Sends the refusal itself; sets req.bitchord on success.'],
                  ['guard(request)', 'JS', 'For Fetch-API handlers. Returns a 401/503 Response to send, or null when the request is allowed.'],
                  ['verifyRequest(req)', 'JS', 'Verifies a Fetch Request or a Node request. Returns { ok, claims } or { ok: false, status, error }.'],
                  ['rejection(result)', 'JS', 'The status, headers and body to send for a failed result, for any other framework.'],
                  ['verify_headers(headers)', 'Python', 'Works with Flask, Starlette/FastAPI and Django header objects, or a plain dict.'],
                  ['result.status / headers / body', 'Python', 'What to send back when result.ok is false.'],
                ]}
              />
              <p className={styles.detailNote}>
                In Python, <InlineCode>verify_headers</InlineCode> makes a blocking request about once an hour to
                refresh BitChord’s keys. That’s fine in FastAPI’s sync <InlineCode>def</InlineCode> routes and
                dependencies, which run in a thread pool. In an <InlineCode>async def</InlineCode> route, call it
                through <InlineCode>run_in_threadpool</InlineCode>.
              </p>
            </Section>

            <Section id="auth-media" eyebrow="Addon auth" title="Short-lived media URLs">
              <p>
                Auth protects <InlineCode>/search</InlineCode> and <InlineCode>/stream</InlineCode>. The media URL
                you return is then opened by the player directly, <strong>without</strong> the BitChord headers. If
                that URL never expires, anyone who gets hold of one can play it anywhere.
              </p>
              <ol className={styles.numberList}>
                <li><span>1</span><div><strong>Expire media URLs in 15–30 minutes.</strong><p>Never less than 5: BitChord caches a stream answer for 5 minutes, and a long track that is paused and resumed fetches the URL again.</p></div></li>
                <li><span>2</span><div><strong>Use your storage provider’s signed URLs.</strong><p>S3, R2, GCS and B2 can all pre-sign a URL with an expiry. Return that from <InlineCode>/stream</InlineCode>.</p></div></li>
                <li><span>3</span><div><strong>Or sign your own.</strong><p>If you proxy audio yourself, put an HMAC of the track id and expiry in the query string and check it on the media route.</p></div></li>
                <li><span>4</span><div><strong>Don’t require BitChord headers on the media route.</strong><p>The player doesn’t send them, so playback would fail.</p></div></li>
              </ol>
              <CodeBlock code={authMediaCode} label="JAVASCRIPT · NODE" />
            </Section>

            <Section id="auth-rollout" eyebrow="Addon auth" title="Test and roll out">
              <H3>Check it from a terminal</H3>
              <CodeBlock code={authCurlCode} label="SHELL" />
              <H3>Check it in BitChord</H3>
              <p>
                Add the addon in the official BitChord app (Settings → Sources → Add an addon) and play a track.
                The row must not show “{OUTDATED_LABEL}”, and search and playback must work. If BitChord is
                refused, its logs show <InlineCode>didn’t accept BitChord’s verification (&lt;code&gt;)</InlineCode>{' '}
                with one of the <a href="#auth-errors">error codes</a>.
              </p>
              <H3>Roll out without breaking anyone</H3>
              <div className={styles.steps}>
                {[
                  ['01', 'Ship the flag with log-only verification', 'BitChord sends credentials as soon as it sees the flag. Verify them and log failures, but keep serving every request.'],
                  ['02', 'Watch the logs for a few days', 'invalid_proof should be near zero; if it isn’t, hosts is wrong. missing is expected: that’s every client that isn’t BitChord.'],
                  ['03', 'Switch to blocking', 'Replace the log-only check with the recipe for your framework. From then on, only BitChord gets through.'],
                ].map(([number, title, copy]) => (
                  <div key={number}>
                    <span>{number}</span>
                    <div><strong>{title}</strong><p>{copy}</p></div>
                  </div>
                ))}
              </div>
              <CodeTabs
                tabs={[
                  { name: 'Express', label: 'JAVASCRIPT', code: authLogOnlyCode },
                  { name: 'Python', label: 'PYTHON', code: authLogOnlyPyCode },
                ]}
              />
              <Callout title="Log-only isn’t a place to stay" tone="warn">
                It keeps your addon working in BitChord, but it lets forks and scripts in too. Listeners on BitChord
                versions from before addon auth get <InlineCode>401</InlineCode> once you block; ask them to update.
              </Callout>
            </Section>

            <Section id="auth-errors" eyebrow="Addon auth" title="Errors and claims">
              <p>
                Every refusal is a <InlineCode>401</InlineCode> (or <InlineCode>503</InlineCode>) with a{' '}
                <InlineCode>WWW-Authenticate: BitChord</InlineCode> header and a JSON body. The helpers produce
                exactly this; BitChord reads the header to decide what to do next.
              </p>
              <CodeBlock code={authRejectionCode} label="HTTP" />
              <SimpleTable
                code={[0]}
                headers={['Code', 'Status', 'Meaning', 'What BitChord does']}
                rows={[
                  ['missing', '401', 'No BitChord credentials: a fork, script or browser, or BitChord before its first authenticated request.', 'Attaches credentials and retries.'],
                  ['expired', '401', 'The token is past its expiry.', 'Gets a new token and retries once.'],
                  ['invalid_token', '401', 'The token is malformed, tampered with, or not signed by BitChord (for example a fork running its own auth server).', 'Gets a new token and retries once.'],
                  ['invalid_proof', '401', 'The signature doesn’t match: hosts is wrong, or a token is being used without its hardware key.', 'Shows an error.'],
                  ['stale_proof', '401', 'The proof is more than 2 minutes old. Your server’s clock is wrong; the app corrects its own.', 'Shows an error.'],
                  ['unavailable', '503', 'Your server couldn’t download BitChord’s public keys the first time.', 'Treats it as a temporary outage.'],
                ]}
              />
              <H3>What you get on success</H3>
              <SimpleTable
                code={[0]}
                headers={['Claim', 'Meaning']}
                rows={[
                  ['sub', 'A random id for this install’s hardware key. It changes when the token refreshes, about hourly. Use it with the IP for rate limiting. It is not a user identity.'],
                  ['ver', 'BitChord’s version code, for example 37. Use it if you need a minimum app version.'],
                  ['exp', 'When the token expires, in Unix seconds.'],
                  ['sl', 'tee or strongbox: where the key is held.'],
                ]}
              />
              <p className={styles.detailNote}>
                No account, email, device id or IMEI is ever sent. Express puts these on{' '}
                <InlineCode>req.bitchord</InlineCode>; the other helpers return them as{' '}
                <InlineCode>result.claims</InlineCode>.
              </p>
            </Section>

            <Section id="auth-protocol" eyebrow="Addon auth" title="Protocol reference">
              <p>
                For porting the verifier to another language. Protocol version 1. The two reference verifiers are
                the authoritative implementation; when in doubt, match them.
              </p>
              <H3>Request headers</H3>
              <p>
                Sent only to addons that declare the flag (or answer with <InlineCode>WWW-Authenticate: BitChord</InlineCode>),
                and only over HTTPS.
              </p>
              <CodeBlock code={authHeadersCode} label="HTTP" />
              <H3>The token</H3>
              <p>
                A compact JWT signed with Ed25519 (<InlineCode>alg: EdDSA</InlineCode>, with a <InlineCode>kid</InlineCode>).
                The public keys are at <InlineCode>{AUTH_ISSUER}/.well-known/jwks.json</InlineCode>. Cache them for
                an hour, refetch early when a token names an unknown <InlineCode>kid</InlineCode> (at most every 5
                minutes), and answer <InlineCode>503 unavailable</InlineCode> if they were never loaded.
              </p>
              <CodeBlock code={authTokenCode} />
              <H3>The proof</H3>
              <CodeBlock code={authProofCode} label="TEXT" />
              <H3>Verification order</H3>
              <ol className={styles.numberList}>
                <li><span>1</span><div><strong>Both headers present.</strong><p>Otherwise <InlineCode>missing</InlineCode>.</p></div></li>
                <li><span>2</span><div><strong>Token signature.</strong><p>Three parts, <InlineCode>alg</InlineCode> is EdDSA, the <InlineCode>kid</InlineCode> is a known key, and the Ed25519 signature over <InlineCode>header.payload</InlineCode> verifies. Otherwise <InlineCode>invalid_token</InlineCode>.</p></div></li>
                <li><span>3</span><div><strong>Claims.</strong><p><InlineCode>iss</InlineCode> is {AUTH_ISSUER}; <InlineCode>aud</InlineCode> contains <InlineCode>bitchord-addons</InlineCode>; <InlineCode>iat</InlineCode> isn’t in the future and <InlineCode>exp</InlineCode> hasn’t passed, each with 60 s of skew (<InlineCode>expired</InlineCode> for the latter); <InlineCode>cnf.jwk</InlineCode> is an EC P-256 key.</p></div></li>
                <li><span>4</span><div><strong>Proof format and age.</strong><p>Matches <InlineCode>{'^v1\\.(\\d{10,16})\\.([A-Za-z0-9_-]{86})$'}</InlineCode> (else <InlineCode>invalid_proof</InlineCode>), and the time is within ±120 s (else <InlineCode>stale_proof</InlineCode>).</p></div></li>
                <li><span>5</span><div><strong>Proof signature.</strong><p>Verify the ECDSA signature with the <InlineCode>cnf.jwk</InlineCode> key for each configured host. Accept if any verifies, otherwise <InlineCode>invalid_proof</InlineCode>.</p></div></li>
              </ol>
            </Section>

            <Section id="auth-faq" eyebrow="Addon auth" title="Auth FAQ">
              <div className={styles.faq}>
                {[
                  ['Can a fork get past this?', 'No. The proof comes from Android’s secure hardware and names the app’s signing certificate, which only the official BitChord release has. Changing the code, renaming the app or copying headers from a real install doesn’t produce a valid proof.'],
                  ['Do I need to register my addon or get an API key?', 'No. Any addon can verify BitChord tokens. The manifest flag and the verifier are the whole integration.'],
                  ['Does BitChord send these headers to every addon?', 'No. Only to addons that declare bitchordAuth or answer with WWW-Authenticate: BitChord, and only over HTTPS. Each proof is tied to one hostname, so an addon can’t replay what it receives to another addon.'],
                  ['Does this slow my addon down?', 'No. Verification is local and takes well under a millisecond. The only network call is fetching BitChord’s public keys, about once an hour.'],
                  ['What if BitChord’s auth service is down?', 'Your addon keeps working for every phone that already has a token (they last an hour), because verification is local and the public keys are cached. Phones that need a new token wait and retry; BitChord treats it as a temporary outage, not a refusal.'],
                  ['My addon shows “Outdated addon” in BitChord.', 'Your manifest.json doesn’t declare "bitchordAuth": true, or BitChord found no manifest at the addon URL. The addon still works; the note only tells listeners it hasn’t adopted addon auth. Add the flag and protect your routes, and the note goes away the next time BitChord reads your manifest.'],
                  ['Every request fails with invalid_proof.', 'hosts doesn’t match the hostname in the addon URL listeners pasted. List every hostname your addon is reached at, without scheme, port or path.'],
                  ['Requests fail with stale_proof.', 'Your server’s clock is more than 2 minutes off. Turn on NTP time sync.'],
                  ['Rooted users are complaining.', 'BitChord only accepts phones with a locked bootloader and a verified, unmodified OS, so rooted phones and custom ROMs are refused. You can stay in log-only mode to let them in, but then other clients get in too.'],
                  ['Can BitChord desktop or web use my addon?', 'Not once you enforce auth. Only the Android app can produce the hardware-backed proof.'],
                ].map(([title, copy]) => (
                  <details key={title}>
                    <summary>{title}<ChevronRight /></summary>
                    <p>{copy}</p>
                  </details>
                ))}
              </div>
            </Section>

            <Section id="how-it-works" eyebrow="Overview" title="How addons work">
              <p>
                A listener adds either your root URL or its <InlineCode>manifest.json</InlineCode> URL.
                BitChord stores the normalized root, checks the manifest, then tries enabled addons in the
                order chosen by the listener. When one misses or is unavailable, resolution continues.
              </p>
              <div className={styles.flow} aria-label="Addon request lifecycle">
                {[
                  ['01', 'Discover', 'GET /manifest.json'],
                  ['02', 'Match', 'GET /search?q=…'],
                  ['03', 'Resolve', 'GET /stream/{id}'],
                  ['04', 'Play', 'Open returned URL'],
                ].map(([step, title, detail]) => (
                  <div className={styles.flowItem} key={step}>
                    <span>{step}</span>
                    <strong>{title}</strong>
                    <code>{detail}</code>
                  </div>
                ))}
              </div>
              <H3>What BitChord does with your answer</H3>
              <ul className={styles.checkList}>
                <li><CheckCircle2 />Matches title, artist, album, and duration to avoid the wrong recording.</li>
                <li><CheckCircle2 />Sends the listener’s pick from your quality options, or a lossless, high, or low tier.</li>
                <li><CheckCircle2 />Uses declared codec and transport metadata before guessing from a URL.</li>
                <li><CheckCircle2 />Caches manifests and searches for 10 minutes, streams for 5 minutes.</li>
                <li><CheckCircle2 />Attaches a hardware-backed proof to every request for addons that declare <InlineCode>bitchordAuth</InlineCode>, and marks the rest as outdated without blocking them. See <a href="#addon-auth">Addon auth</a>.</li>
              </ul>
            </Section>

            <Section id="quickstart" eyebrow="Build" title="Quickstart">
              <p>
                Expose three routes from any HTTPS server. The example below is deliberately runtime-neutral:
                connect <InlineCode>handleRequest</InlineCode> to the router you already use.
              </p>
              <div className={styles.fileTree}>
                <div><span>manifest.json</span><small>identity + capabilities</small></div>
                <div><span>GET /search</span><small>catalogue lookup</small></div>
                <div><span>GET /stream/:id</span><small>playable audio</small></div>
              </div>
              <CodeBlock code={serverCode} label="JAVASCRIPT" />
              <Callout title="Use absolute URLs">
                Artwork and media URLs must include their scheme and host. A relative media path is rejected
                before playback.
              </Callout>
            </Section>

            <Section id="manifest" eyebrow="Build" title="Manifest">
              <p>
                Serve the manifest at <InlineCode>GET /manifest.json</InlineCode>. BitChord needs a stable
                <InlineCode>id</InlineCode> and a searchable addon. Unknown fields are ignored, so the document
                can carry additional metadata for your own tooling.
              </p>
              <CodeBlock code={manifestCode} />
              <FieldTable rows={[
                ['id', 'Yes', 'Stable, unique addon identifier. An empty id is rejected.'],
                ['bitchordAuth', 'Recommended', 'Set true to accept only the official BitChord app (see Addon auth). Without it the addon still works, and Sources marks it as outdated.'],
                ['name', 'Recommended', 'Human-readable name shown in the source list.'],
                ['version', 'Recommended', 'Displayed with health information.'],
                ['resources', 'Recommended', 'Include search. Stream may be omitted only when rows carry streamURL.'],
                ['settings', 'No', 'A quality select becomes a picker in Sources. Other settings send their defaults as query parameters.'],
                ['allowDownloads', 'No · default 1', 'Set 0 to allow playback but not downloads. See Download permission.'],
                ['checkValidLossless', 'No · default 0', 'Set 1 to be used only on a lossless-capable output. See Lossless output gate.'],
              ]} />
              <Callout title="Only quality gets a picker" tone="warn">
                BitChord does not render a full addon settings screen. A <InlineCode>quality</InlineCode> select
                becomes a picker under your addon in Sources (see <a href="#quality-options">Quality options</a>).
                Every other setting sends its scalar default value.
              </Callout>
            </Section>

            <Section id="search" eyebrow="Build" title="Search endpoint">
              <p>
                Accept <InlineCode>GET /search?q=…</InlineCode> and return an object with a
                <InlineCode>tracks</InlineCode> array. Only rows with a non-empty id and title are considered.
                Return results in your preferred order; BitChord keeps it while evaluating recording matches.
              </p>
              <CodeBlock code={searchCode} />
              <FieldTable rows={[
                ['id', 'Yes', 'Opaque track id. It is safely encoded when used in the stream path.'],
                ['title', 'Yes', 'Track title used for matching.'],
                ['artist', 'Recommended', 'Primary artist used for matching.'],
                ['album', 'Recommended', 'Album improves match confidence.'],
                ['duration', 'Recommended', 'Length in seconds; decimals are accepted.'],
                ['artworkURL', 'No', 'Absolute artwork URL. albumArtworkURL is also accepted.'],
                ['format', 'Recommended', 'A short format hint such as flac, mp3, aac, or dash.'],
                ['audioQuality', 'Recommended', 'Free-text quality tier such as LOSSLESS or HIGH.'],
                ['streamURL', 'No', 'Direct fallback URL when the stream endpoint has no answer.'],
              ]} />
              <p className={styles.detailNote}>
                Search has no limit parameter. Keep responses focused and fast; BitChord trims what it uses.
              </p>
            </Section>

            <Section id="stream" eyebrow="Build" title="Stream endpoint">
              <p>
                Accept <InlineCode>GET /stream/{'{id}'}</InlineCode>. Return one openable rendition for the
                requested quality. A <InlineCode>404</InlineCode> means “not in this addon” and cleanly moves
                resolution onward.
              </p>
              <CodeBlock code={streamCode} />
              <FieldTable rows={[
                ['url', 'Yes', 'Absolute, directly playable media or manifest URL.'],
                ['codec', 'Recommended', 'Most reliable codec signal: flac, alac, mp3, aac, eac3-joc, and others.'],
                ['container', 'Recommended', 'Container when known.'],
                ['manifest', 'Recommended', 'none, hls, or dash. Declare it for extensionless manifest URLs.'],
                ['encrypted', 'Recommended', 'Use false. Protected renditions are refused.'],
                ['sampleRate', 'No', 'Sample rate in Hz; a kHz value below 1000 is also normalized.'],
                ['bitDepth', 'No', 'Integer sample bit depth.'],
                ['bitrate', 'No', 'Bits per second or kbps; BitChord normalizes either convention.'],
                ['error', 'No', 'Helpful explanation when no URL can be returned.'],
              ]} />
              <Callout title="Describe transport explicitly" tone="warn">
                If the URL points to an HLS or DASH manifest, set <InlineCode>manifest</InlineCode>. An
                extensionless manifest cannot be reliably identified from its URL.
              </Callout>
            </Section>

            <Section id="quality" eyebrow="Playback" title="Quality negotiation">
              <p>
                BitChord sends a <InlineCode>quality</InlineCode> parameter on both search and stream requests.
                If your manifest lists quality options, the value comes from that list. Otherwise it is one of
                the native tiers below.
              </p>
              <H3>Quality options</H3>
              <p>
                Declare a setting with <InlineCode>key: "quality"</InlineCode> and an{' '}
                <InlineCode>options</InlineCode> list, and BitChord shows the option in use under your addon’s
                name in Settings → Sources. Listeners tap it to pick another option. Whenever BitChord asks for its
                best audio, which covers playback and search, it sends their pick, or your first option when
                they haven’t picked one.
              </p>
              <CodeBlock code={qualityOptionsCode} label="JSON + HTTP" />
              <FieldTable
                headers={['Option field', 'Required', 'Meaning']}
                rows={[
                  ['value', 'Yes', 'Sent as quality=. A string or number. Options without one are skipped.'],
                  ['label', 'Recommended', 'What the listener reads in the picker. The value is shown when it is missing.'],
                ]}
              />
              <H3>Quality option rules that matter</H3>
              <ol className={styles.numberList}>
                <li><span>1</span><div><strong>List your best option first.</strong><p>With nothing picked, BitChord sends the first option. It doesn’t use <InlineCode>default</InlineCode> for this, and it doesn’t look for the word <InlineCode>lossless</InlineCode>, so the order you list the options in is what decides.</p></div></li>
                <li><span>2</span><div><strong>Offer at least two options.</strong><p>With a single option there is nothing to choose: BitChord sends it but shows no picker.</p></div></li>
                <li><span>3</span><div><strong>The pick is the listener’s.</strong><p>It is stored on their device for your addon, and the same value goes on search and stream requests. Remove an option and anyone who picked it moves to your first option.</p></div></li>
                <li><span>4</span><div><strong>Changes apply on the next manifest read.</strong><p>BitChord saves your options when the addon is added and updates them each time it reads your manifest. Manifests are cached for 10 minutes. Because the options are stored, the picker also works while your addon is unreachable or waiting on the lossless output gate, without contacting you.</p></div></li>
                <li><span>5</span><div><strong>Smaller requests are still matched by name.</strong><p>A download the listener keeps at High or Standard asks for <InlineCode>HIGH</InlineCode> or <InlineCode>LOW</InlineCode> instead, and their pick doesn’t apply. BitChord sends the option named like that tier: an exact name, then words such as <InlineCode>high</InlineCode>, <InlineCode>320</InlineCode> or <InlineCode>normal</InlineCode> for HIGH, and <InlineCode>low</InlineCode>, <InlineCode>96</InlineCode>, <InlineCode>128</InlineCode> or <InlineCode>min</InlineCode> for LOW. If nothing matches, the first option is sent, so name your smaller renditions that way.</p></div></li>
              </ol>
              <Callout title="Only the quality key">
                BitChord shows a picker for <InlineCode>quality</InlineCode> alone. <InlineCode>help</InlineCode>,{' '}
                <InlineCode>perNetwork</InlineCode> and other form fields are ignored, so there is one pick per
                addon for every connection. Every other setting sends its default.
              </Callout>
              <p className={styles.detailNote}>
                The picker needs BitChord 1.9.1 or later. Earlier versions show no picker and send the option
                whose name best matches the tier being asked for, so on those an option named{' '}
                <InlineCode>lossless</InlineCode> is sent ahead of one listed above it.
              </p>
              <H3>Without options</H3>
              <p>
                An addon that lists no quality options receives one of these tiers as the value.
              </p>
              <div className={styles.tierGrid}>
                <div><span>LOSSLESS</span><strong>Bit-exact request</strong><p>Prefer FLAC, ALAC, WAV, or another lossless codec.</p></div>
                <div><span>HIGH</span><strong>Best lossy request</strong><p>Return your best lossy rendition, commonly near 320 kbps.</p></div>
                <div><span>LOW</span><strong>Metered request</strong><p>Return a compact rendition, commonly 128 kbps or below.</p></div>
              </div>
              <H3>Do not overstate the stream</H3>
              <p>
                BitChord verifies quality using the codec it actually decodes. A lossless label on a lossy URL
                does not create a lossless badge. Accurate codec, sample-rate, bit-depth, and bitrate fields make
                selection and playback diagnostics reliable.
              </p>
            </Section>

            <Section id="dolby-atmos" eyebrow="Playback" title="Dolby Atmos">
              <p>
                Dolby support has two layers: selecting the immersive recording and describing its stream.
                Some catalogues expose Dolby as another rendition of one id; others return a separate track id.
                Your addon should support both shapes.
              </p>
              <div className={styles.propertyCard}>
                <div>
                  <span>Request behavior</span>
                  <p className={styles.propertyTitle}>Respond to <InlineCode>atmos=auto</InlineCode></p>
                  <p>
                    BitChord adds this hint only when the device has a compatible decoder and the listener has
                    Dolby enabled. “Auto” means prefer Dolby when available, otherwise return stereo.
                  </p>
                </div>
              </div>
              <CodeBlock code={dolbyCode} label="HTTP + JSON" />
              <H3>Dolby rules that matter</H3>
              <ol className={styles.numberList}>
                <li><span>1</span><div><strong>Mark separate rows.</strong><p>Use <InlineCode>atmos: true</InlineCode>, <InlineCode>audioMode</InlineCode>, or <InlineCode>audioModes</InlineCode>. This lets BitChord prefer the Dolby row even if its catalogue quality label says LOW.</p></div></li>
                <li><span>2</span><div><strong>Use a recognized codec.</strong><p>Return <InlineCode>eac3-joc</InlineCode> or a clear Dolby label. BitChord normalizes common underscore and hyphen spellings.</p></div></li>
                <li><span>3</span><div><strong>Return stereo when Dolby is absent.</strong><p>With <InlineCode>atmos=auto</InlineCode>, an ordinary track must still play. Do not turn “no Dolby mix” into an error.</p></div></li>
                <li><span>4</span><div><strong>Declare the transport.</strong><p>Dolby is often carried by DASH. Set <InlineCode>manifest: "dash"</InlineCode> even when the URL has no file extension.</p></div></li>
              </ol>
              <Callout title="Dolby is immersive, not lossless">
                BitChord treats E-AC-3 JOC as a premium immersive mix, but not as a bit-exact lossless stream.
                When Dolby is wanted, it is preferred as a mix rather than mislabelled as lossless.
              </Callout>
            </Section>

            <Section id="downloads" eyebrow="Playback" title="Download permission">
              <p>
                Listeners can save tracks for offline playback. By default an addon serves those downloads the
                same way it serves playback. Set <InlineCode>allowDownloads</InlineCode> to <InlineCode>0</InlineCode> in
                your manifest if your addon may be streamed but should never be the source of a saved file.
              </p>
              <div className={styles.propertyCard}>
                <div>
                  <span>Manifest switch</span>
                  <p className={styles.propertyTitle}><InlineCode>allowDownloads</InlineCode> · default <InlineCode>1</InlineCode></p>
                  <p>
                    With <InlineCode>0</InlineCode>, BitChord leaves your addon out of every download and asks the
                    next enabled source in the listener’s order instead. Playback is not affected. If the key is
                    missing, downloads are allowed.
                  </p>
                </div>
              </div>
              <CodeBlock code={downloadsCode} label="JSON + BEHAVIOUR" />
              <H3>Download rules that matter</H3>
              <ol className={styles.numberList}>
                <li><span>1</span><div><strong>Write it as a number or a boolean.</strong><p><InlineCode>1</InlineCode>/<InlineCode>0</InlineCode>, <InlineCode>true</InlineCode>/<InlineCode>false</InlineCode>, and the same values as strings are all accepted. Any other value is ignored and the default applies, so a typo never flips the setting the wrong way.</p></div></li>
                <li><span>2</span><div><strong>Expect no separate download request.</strong><p>A download uses the same <InlineCode>/search</InlineCode> and <InlineCode>/stream</InlineCode> calls as playback. With <InlineCode>0</InlineCode>, those calls are never made for a download, so you don’t need to detect downloads on your server.</p></div></li>
                <li><span>3</span><div><strong>Listeners see it.</strong><p>The addon’s row in Settings → Sources shows <em>Streaming only</em>. That tells the listener why a download came from another source.</p></div></li>
                <li><span>4</span><div><strong>Changes apply on the next manifest read.</strong><p>BitChord saves the value when the addon is added and updates it each time it reads your manifest. Manifests are cached for 10 minutes.</p></div></li>
              </ol>
              <Callout title="A policy, not DRM" tone="warn">
                <InlineCode>allowDownloads</InlineCode> is a promise BitChord keeps, not protection on your media. A
                stream URL can still be fetched by anything that has it. If files must not leave your server, rely on
                short-lived signed URLs and your own access control as well.
              </Callout>
            </Section>

            <Section id="lossless-output" eyebrow="Playback" title="Lossless output gate">
              <p>
                Some catalogues only want to serve listeners who will actually hear lossless audio. On BitChord
                for Android, set{' '}
                <InlineCode>checkValidLossless</InlineCode> to <InlineCode>1</InlineCode> and BitChord uses your addon only
                while the phone has a lossless-capable output connected. Otherwise your server isn’t contacted at all.
              </p>
              <div className={styles.propertyCard}>
                <div>
                  <span>Manifest switch</span>
                  <p className={styles.propertyTitle}><InlineCode>checkValidLossless</InlineCode> · default <InlineCode>0</InlineCode></p>
                  <p>
                    With <InlineCode>1</InlineCode>, BitChord checks the connected audio output before every request.
                    On the phone speaker or a lossy Bluetooth codec it sends nothing: no manifest, health check,
                    search or stream. If the key is missing, there is no check.
                  </p>
                </div>
              </div>
              <CodeBlock code={losslessOutputCode} label="JSON + HTTP" />
              <H3>Outputs that qualify</H3>
              <FieldTable
                headers={['Output', 'Qualifies', 'Notes']}
                rows={[
                  ['3.5mm headphones / headset', 'Yes', 'Wired headphones or a headset on the headphone jack.'],
                  ['USB-C audio', 'Yes', 'USB-C headphones, USB DACs and USB audio accessories.'],
                  ['Line out / aux', 'Yes', 'Analog or digital line out, and aux line.'],
                  ['HDMI, ARC, eARC', 'Yes', 'A TV, AV receiver or soundbar over HDMI.'],
                  ['Dock', 'Yes', 'Digital and analog audio docks.'],
                  ['Bluetooth · LDAC', 'Yes', 'Any LDAC quality mode: 990, 660, 330 kbps or adaptive.'],
                  ['Bluetooth · LHDC', 'Yes', 'LHDC V3, V4 and V5.'],
                  ['Bluetooth · aptX Lossless', 'Yes', 'When Android reports the codec as aptX Lossless.'],
                  ['Bluetooth · SBC, AAC, aptX, aptX HD, aptX Adaptive', 'No', 'Lossy codecs below CD bitrate.'],
                  ['LE Audio (LC3), Opus, hearing aids', 'No', 'Lossy codecs.'],
                  ['Phone speaker / earpiece, casting', 'No', 'The audio doesn’t reach a lossless path.'],
                ]}
              />
              <div className={styles.propertyCard}>
                <div>
                  <span>How Bluetooth is checked</span>
                  <p className={styles.propertyTitle}>BitChord reads the codec Android reports</p>
                  <p>
                    On Android 12 and later this needs the Nearby devices permission. If an addon is waiting and
                    BitChord can’t read the codec, Settings → Sources offers <em>Check Bluetooth codec</em> to grant
                    it. LHDC and aptX Lossless are named by Android 15+ and by phones whose maker reports vendor
                    codecs. Where Android doesn’t report the codec, BitChord treats it as unknown and doesn’t
                    count it.
                  </p>
                </div>
              </div>
              <H3>Lossless gate rules that matter</H3>
              <ol className={styles.numberList}>
                <li><span>1</span><div><strong>The first contact is the manifest.</strong><p>BitChord has to read your manifest once to learn the switch: when the listener tests or saves the addon. After that the value is stored on the device, so a gated addon is never contacted just to check whether it is still gated.</p></div></li>
                <li><span>2</span><div><strong>Nothing reaches you while no output qualifies.</strong><p>The addon is left out of playback, search and downloads, and every request path refuses before it opens a connection. That includes queued tracks that already name your addon. They resolve from the next source.</p></div></li>
                <li><span>3</span><div><strong>It resumes on its own.</strong><p>When the listener plugs in headphones or switches Bluetooth to LDAC/LHDC, the addon rejoins the source order immediately, with no restart. Its health check runs again on the Sources screen.</p></div></li>
                <li><span>4</span><div><strong>The listener is told why.</strong><p>The addon’s row in Settings → Sources says <em>Needs a lossless output</em>. If Bluetooth is connected, the row names the current codec so the listener knows what to change.</p></div></li>
                <li><span>5</span><div><strong>Turning it on for an existing addon.</strong><p>Devices that already have your addon learn the new value the next time they read your manifest (cached for 10 minutes). That read is the last request they make until a qualifying output is connected.</p></div></li>
              </ol>
              <Callout title="LDAC and LHDC are high-resolution, not bit-exact">
                Strictly, only a cable carries a bit-exact signal. LDAC and LHDC are high-bitrate lossy codecs. They
                qualify because they are the closest wireless option and what listeners expect a lossless addon to
                work with. If you need a strictly bit-exact path, say so in your addon’s own description.
              </Callout>
              <p className={styles.detailNote}>
                Both switches need BitChord 1.7.1 or later. <InlineCode>allowDownloads</InlineCode> is honoured
                by BitChord for Android and desktop; <InlineCode>checkValidLossless</InlineCode> by Android only,
                and the desktop app ignores it. Earlier versions ignore unknown manifest keys, so adding them is
                always safe.
              </p>
            </Section>

            <Section id="install-test" eyebrow="Ship" title="Install and test">
              <div className={styles.steps}>
                {[
                  ['01', 'Publish your server', 'Make the root and all three routes reachable over HTTPS. With addon auth, check every route but the manifest.'],
                  ['02', 'Add the URL', 'In BitChord, open Settings → Sources → Add an addon. Paste the root or manifest URL.'],
                  ['03', 'Run the health check', 'BitChord reads the manifest, notes whether it declares bitchordAuth, and verifies the addon is searchable.'],
                  ['04', 'Play representative tracks', 'Test direct audio, manifest-based audio, every quality tier, misses, and Dolby.'],
                ].map(([number, title, copy]) => (
                  <div key={number}>
                    <span>{number}</span>
                    <div><strong>{title}</strong><p>{copy}</p></div>
                  </div>
                ))}
              </div>
              <div className={styles.commandCard}>
                <p>Fast contract checks</p>
                <code>GET /manifest.json  →  200, "bitchordAuth": true</code>
                <code>GET /search?q=test without BitChord  →  401</code>
                <code>GET /search?q=test&amp;quality=LOSSLESS</code>
                <code>GET /stream/&lt;encoded-id&gt;?quality=LOSSLESS</code>
              </div>
            </Section>

            <Section id="production" eyebrow="Ship" title="Production checklist">
              <div className={styles.checkGrid}>
                {[
                  'bitchordAuth: true in the manifest',
                  'Every route but manifest.json verified',
                  'hosts lists every public hostname',
                  'Signed media URLs, 15–30 minute expiry',
                  'Stable addon and track ids',
                  'HTTPS on every returned URL',
                  'JSON content on all success responses',
                  'Search answers quickly',
                  'Stream URLs survive at least five minutes',
                  '404 for a missing track',
                  '429 includes Retry-After',
                  'No encrypted rendition unless requested',
                  'Accurate codec and transport fields',
                  'Logs never expose path-based tokens',
                  'Stereo fallback for Dolby auto mode',
                  'Representative duration metadata',
                  'Quality options listed best first',
                  'allowDownloads set deliberately',
                  'checkValidLossless only if you need it',
                ].map((item) => <div key={item}><Check />{item}</div>)}
              </div>
            </Section>

            <Section id="troubleshooting" eyebrow="Reference" title="Troubleshooting">
              <div className={styles.faq}>
                {[
                  ['“Outdated addon” under your addon in Sources', 'Your manifest doesn’t declare "bitchordAuth": true, or there’s no manifest at the addon URL. The addon still works. To clear it, follow Addon auth → Set it up; devices pick up the change the next time they read your manifest.'],
                  ['“didn’t accept BitChord’s verification (invalid_proof)”', 'The hosts you passed to the verifier don’t match the hostname in the addon URL. List every hostname, without scheme, port or path.'],
                  ['“That URL answered, but not with an addon manifest”', 'Return an object with a non-empty id from /manifest.json, or confirm the pasted URL resolves to your addon root.'],
                  ['The addon is healthy but returns no results', 'Check the q parameter, return a tracks array, and ensure each row has both id and title.'],
                  ['Audio fails on an extensionless URL', 'Declare manifest as hls or dash. For direct audio, provide codec and container.'],
                  ['A track falls back to another source', 'Return 404 only for a true miss. Check for an empty URL, an encrypted response, malformed URL, or unsupported Dolby stream.'],
                  ['Dolby always returns stereo', 'Read atmos=auto on both search and stream. If Dolby is a separate catalogue row, mark that row with atmos or audioModes.'],
                  ['Downloads come from another source', 'Your manifest has allowDownloads set to 0 (the row in Sources says Streaming only). Remove the key or set it to 1; devices pick the change up on their next manifest read.'],
                  ['The addon gets no requests at all', 'If checkValidLossless is 1, BitChord stays silent until a wired, USB, HDMI or LDAC/LHDC/aptX Lossless output is connected. The row in Sources says Needs a lossless output. On Bluetooth, grant Nearby devices so the codec can be read.'],
                  ['LDAC headphones are not accepted', 'Check that the phone is actually using LDAC (Developer options → Bluetooth audio codec) and that Nearby devices is allowed for BitChord. Without that permission the codec is unknown and does not count.'],
                  ['Listeners get a lower tier than your best', 'With nothing picked, BitChord sends your first quality option, not default and not the option named lossless. Move your best option to the top of options.'],
                  ['No quality picker appears under the addon', 'Declare a setting with key quality and at least two options that each have a value. Devices show it after their next manifest read; opening Settings → Sources triggers one.'],
                  ['The wrong recording is selected', 'Improve artist, album, and duration metadata. Avoid live, edit, remix, or instrumental variants unless the query asks for them.'],
                ].map(([title, copy]) => (
                  <details key={title}>
                    <summary>{title}<ChevronRight /></summary>
                    <p>{copy}</p>
                  </details>
                ))}
              </div>
            </Section>


            <footer className={styles.pageFooter}>
              <div>
                <p className={styles.pageFooterTitle}>Need help?</p>
                <p>Questions about the protocol, or something that does not behave as described here.</p>
              </div>
              <div className={styles.pageFooterLinks}>
                <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
                  Open an issue <ArrowUpRight className="size-4" aria-hidden />
                </a>
                <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                  Ask on Discord <ArrowUpRight className="size-4" aria-hidden />
                </a>
              </div>
            </footer>
          </article>
        </main>

        <aside className={styles.toc} aria-label="On this page">
          <p className={styles.tocTitle}>On this page</p>
          <a href={`#${active}`} className={styles.tocSection}>
            {activeItem?.label ?? 'Introduction'}
          </a>
          {subheadings.map((h) => (
            <a key={h.id} href={`#${h.id}`} className={styles.tocItem}>
              {h.label}
            </a>
          ))}
          <div className={styles.tocLinks}>
            <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
              Report an issue
            </a>
            <a href="#introduction">Back to top</a>
          </div>
        </aside>
      </div>
    </div>
  )
}
