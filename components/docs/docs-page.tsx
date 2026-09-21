'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clipboard,
  Code2,
  FileJson2,
  Headphones,
  Menu,
  Search,
  Server,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { LogoWordmark } from '@/components/ui/logo'
import styles from './docs-page.module.css'

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
  { id: 'install-test', label: 'Install and test', group: 'Ship' },
  { id: 'production', label: 'Production checklist', group: 'Ship' },
  { id: 'troubleshooting', label: 'Troubleshooting', group: 'Reference' },
]

const manifestCode = `{
  "id": "dev.example.reference-addon",
  "name": "Reference Addon",
  "version": "1.0.0",
  "resources": ["search", "stream"],
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
        <span>{label}</span>
        <button type="button" onClick={copy} aria-label="Copy code">
          {copied ? <Check className="size-3.5" /> : <Clipboard className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function InlineCode({ children }: { children: ReactNode }) {
  return <code className={styles.inlineCode}>{children}</code>
}

function Callout({
  title,
  children,
  tone = 'note',
}: {
  title: string
  children: ReactNode
  tone?: 'note' | 'warn' | 'success'
}) {
  const Icon = tone === 'warn' ? CircleAlert : tone === 'success' ? CheckCircle2 : Sparkles
  return (
    <aside className={`${styles.callout} ${styles[tone]}`}>
      <Icon className="size-4 shrink-0" aria-hidden />
      <div>
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
    </aside>
  )
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className={styles.section}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h2>
        <a href={`#${id}`}>{title}</a>
      </h2>
      {children}
    </section>
  )
}

function FieldTable({ rows }: { rows: Array<[string, string, string]> }) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Required</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([field, required, meaning]) => (
            <tr key={field}>
              <td><InlineCode>{field}</InlineCode></td>
              <td>{required}</td>
              <td>{meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DocsPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('introduction')
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

  const groups = [...new Set(navigation.map((item) => item.group))]

  return (
    <div className={styles.docs}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="BitChord home">
            <LogoWordmark className={styles.logo} />
          </Link>
          <span className={styles.divider} />
          <span className={styles.product}>Developer Docs</span>

          <div className={styles.searchWrap}>
            <Search className="size-4" aria-hidden />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the guide…"
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

          <Link href="/" className={styles.backLink}>
            <ArrowLeft className="size-3.5" />
            Back to site
          </Link>
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
                    className={active === item.id ? styles.navActive : ''}
                    onClick={() => {
                      setActive(item.id)
                      setMobileOpen(false)
                    }}
                  >
                    <span>{item.label}</span>
                    {active === item.id && <ChevronRight className="size-3" aria-hidden />}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {mobileOpen && <button className={styles.scrim} onClick={() => setMobileOpen(false)} aria-label="Close menu" />}

        <main id="main-content" className={styles.main}>
          <div className={styles.article}>
            <section id="introduction" className={styles.hero}>
              <div className={styles.heroPill}><Code2 className="size-3.5" /> Addon protocol</div>
              <h1>Build an addon for BitChord</h1>
              <p className={styles.lede}>
                Connect your own audio catalogue to BitChord with three small JSON endpoints.
                Your server searches tracks, resolves a playable stream, and describes the audio accurately.
              </p>
              <div className={styles.heroActions}>
                <a href="#quickstart" className={styles.primaryAction}>
                  Start building <ArrowRight className="size-4" />
                </a>
                <a href="#dolby-atmos" className={styles.secondaryAction}>
                  <Headphones className="size-4" /> Dolby Atmos
                </a>
              </div>
              <div className={styles.statGrid}>
                <div><Server /><strong>3</strong><span>HTTP routes</span></div>
                <div><FileJson2 /><strong>JSON</strong><span>Wire format</span></div>
                <div><Zap /><strong>GET</strong><span>Every request</span></div>
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
                ].map(([step, title, detail], index) => (
                  <div className={styles.flowItem} key={step}>
                    <span>{step}</span>
                    <strong>{title}</strong>
                    <code>{detail}</code>
                    {index < 3 && <ArrowRight aria-hidden />}
                  </div>
                ))}
              </div>
              <h3>What BitChord does with your answer</h3>
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
                <div><FileJson2 /><span>manifest.json</span><small>identity + capabilities</small></div>
                <div><Search /><span>GET /search</span><small>catalogue lookup</small></div>
                <div><Headphones /><span>GET /stream/:id</span><small>playable audio</small></div>
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
              <h3>Do not overstate the stream</h3>
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
              <div className={styles.dolbyCard}>
                <div className={styles.dolbyIcon}><Headphones /></div>
                <div>
                  <span>Request behavior</span>
                  <h3>Respond to <InlineCode>atmos=auto</InlineCode></h3>
                  <p>
                    BitChord adds this hint only when the device has a compatible decoder and the listener has
                    Dolby enabled. “Auto” means prefer Dolby when available, otherwise return stereo.
                  </p>
                </div>
              </div>
              <CodeBlock code={dolbyCode} label="HTTP + JSON" />
              <h3>Dolby rules that matter</h3>
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
                  ['The wrong recording is selected', 'Improve artist, album, and duration metadata. Avoid live, edit, remix, or instrumental variants unless the query asks for them.'],
                ].map(([title, copy]) => (
                  <details key={title}>
                    <summary>{title}<ChevronRight /></summary>
                    <p>{copy}</p>
                  </details>
                ))}
              </div>
            </Section>

            <div className={styles.finishCard}>
              <span>Ready to connect?</span>
              <h2>Ship the smallest honest contract.</h2>
              <p>Three routes, accurate metadata, graceful misses. BitChord handles the rest.</p>
              <a href="#quickstart">Review the quickstart <ArrowRight /></a>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
