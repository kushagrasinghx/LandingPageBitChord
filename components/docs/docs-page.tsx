'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
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

const navigation: NavItem[] = [
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

const serverCode = `const tracks = [
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
  resources: ["search", "stream"]
}

export async function handleRequest(request) {
  const url = new URL(request.url)

  if (url.pathname === "/manifest.json") {
    return json(MANIFEST)
  }

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
              <div className={styles.navGroup} key={group}>
                <p>{group}</p>
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
                  ['#dolby-atmos', 'Dolby Atmos', 'Serve immersive mixes alongside stereo.'],
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
                <li><CheckCircle2 />Negotiates lossless, high, or low quality for the current request.</li>
                <li><CheckCircle2 />Uses declared codec and transport metadata before guessing from a URL.</li>
                <li><CheckCircle2 />Caches manifests and searches for 10 minutes, streams for 5 minutes.</li>
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
                ['name', 'Recommended', 'Human-readable name shown in the source list.'],
                ['version', 'Recommended', 'Displayed with health information.'],
                ['resources', 'Recommended', 'Include search. Stream may be omitted only when rows carry streamURL.'],
                ['settings', 'No', 'Defaults are forwarded as query parameters on search and stream requests.'],
                ['allowDownloads', 'No · default 1', 'Set 0 to allow playback but not downloads. See Download permission.'],
                ['checkValidLossless', 'No · default 0', 'Set 1 to be used only on a lossless-capable output. See Lossless output gate.'],
              ]} />
              <Callout title="Settings are defaults, not a form" tone="warn">
                BitChord does not render an addon settings screen. It forwards scalar default values. The
                requested <InlineCode>quality</InlineCode> overrides a manifest default of the same key.
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
                If your manifest lists options, it chooses the closest value by meaning; otherwise it sends one
                of the native tiers below.
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
                  ['01', 'Publish your server', 'Make the root and all three routes reachable over HTTPS.'],
                  ['02', 'Add the URL', 'In BitChord, open Settings → Sources → Add an addon. Paste the root or manifest URL.'],
                  ['03', 'Run the health check', 'BitChord reads the manifest and verifies the addon is searchable.'],
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
                <code>GET /manifest.json</code>
                <code>GET /search?q=test&amp;quality=LOSSLESS</code>
                <code>GET /stream/&lt;encoded-id&gt;?quality=LOSSLESS</code>
              </div>
            </Section>

            <Section id="production" eyebrow="Ship" title="Production checklist">
              <div className={styles.checkGrid}>
                {[
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
                  'allowDownloads set deliberately',
                  'checkValidLossless only if you need it',
                ].map((item) => <div key={item}><Check />{item}</div>)}
              </div>
            </Section>

            <Section id="troubleshooting" eyebrow="Reference" title="Troubleshooting">
              <div className={styles.faq}>
                {[
                  ['“That URL answered, but not with an addon manifest”', 'Return an object with a non-empty id from /manifest.json, or confirm the pasted URL resolves to your addon root.'],
                  ['The addon is healthy but returns no results', 'Check the q parameter, return a tracks array, and ensure each row has both id and title.'],
                  ['Audio fails on an extensionless URL', 'Declare manifest as hls or dash. For direct audio, provide codec and container.'],
                  ['A track falls back to another source', 'Return 404 only for a true miss. Check for an empty URL, an encrypted response, malformed URL, or unsupported Dolby stream.'],
                  ['Dolby always returns stereo', 'Read atmos=auto on both search and stream. If Dolby is a separate catalogue row, mark that row with atmos or audioModes.'],
                  ['Downloads come from another source', 'Your manifest has allowDownloads set to 0 (the row in Sources says Streaming only). Remove the key or set it to 1; devices pick the change up on their next manifest read.'],
                  ['The addon gets no requests at all', 'If checkValidLossless is 1, BitChord stays silent until a wired, USB, HDMI or LDAC/LHDC/aptX Lossless output is connected. The row in Sources says Needs a lossless output. On Bluetooth, grant Nearby devices so the codec can be read.'],
                  ['LDAC headphones are not accepted', 'Check that the phone is actually using LDAC (Developer options → Bluetooth audio codec) and that Nearby devices is allowed for BitChord. Without that permission the codec is unknown and does not count.'],
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
