import { REPO_URL, getTelemetry, resolveDownload } from '@/lib/github'
import { MIN_ANDROID, SITE_NAME, SITE_URL } from '@/lib/site'
import { TelemetryProvider } from '@/components/telemetry-provider'
import { Backdrop } from '@/components/site/backdrop'
import { Nav } from '@/components/site/nav'
import { Hero } from '@/components/site/hero'
import { Metrics } from '@/components/site/metrics'
import { Features } from '@/components/site/features'
import { Changelog } from '@/components/site/changelog'
import { Install } from '@/components/site/install'
import { Footer } from '@/components/site/footer'

/**
 * Revalidate the whole page every 5 minutes so star counts and new releases
 * appear without a redeploy, while still serving static HTML to every visitor.
 */
export const revalidate = 300

export default async function Page() {
  // Fetched here, on the server, so the hero paints with the real tag and star
  // count on the first frame — no skeleton flash for the common case.
  const telemetry = await getTelemetry()

  const download = resolveDownload(telemetry.latest)

  /**
   * Structured data, built from the same telemetry the page renders.
   *
   * Derived rather than hard-coded so the version, release date and download
   * URL in the markup can never drift from the ones a crawler is told about —
   * a stale `softwareVersion` is worse than none, because it is a claim.
   *
   * No `aggregateRating`: there are no ratings to aggregate, and inventing one
   * is exactly the kind of thing that earns a structured-data penalty.
   */
  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'MultimediaApplication',
    applicationSubCategory: 'Music Player',
    operatingSystem: `Android ${MIN_ANDROID}+`,
    url: SITE_URL,
    description:
      'The open-source YouTube Music client for Android, with beat-matched Automix, character-synced lyrics, Discord Rich Presence and a monthly Replay.',
    license: `${REPO_URL}/blob/main/LICENSE`,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: {
      '@type': 'Person',
      name: 'kushagrasinghx',
      url: 'https://github.com/kushagrasinghx',
    },
    ...(telemetry.latest?.tag ? { softwareVersion: telemetry.latest.tag } : {}),
    ...(telemetry.latest?.publishedAt ? { datePublished: telemetry.latest.publishedAt } : {}),
    ...(download.isDirect ? { downloadUrl: download.url, installUrl: download.url } : {}),
    ...(telemetry.repo?.stars
      ? {
          interactionStatistic: {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/LikeAction',
            userInteractionCount: telemetry.repo.stars,
          },
        }
      : {}),
  }

  const siteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'en',
  }

  return (
    <TelemetryProvider initial={telemetry}>
      {/* Emitted server-side so crawlers see it in the initial HTML. */}
      <script
        type="application/ld+json"
        // The payload is built from our own data above, not from user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify([siteSchema, appSchema]) }}
      />

      <Backdrop />
      <Nav />

      <main>
        <Hero />
        <Metrics />
        <Features />
        <Changelog />
        <Install />
      </main>

      <Footer />
    </TelemetryProvider>
  )
}
