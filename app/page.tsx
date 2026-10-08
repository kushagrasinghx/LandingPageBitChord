import { REPO_URL, getTelemetry, resolveDownload } from '@/lib/github'
import { getNewPageShelves } from '@/lib/apple-music'
import { getLrcRedLyrics } from '@/lib/lrc-red'
import { DEMO_TRACK, excerpt, placeholderLyrics } from '@/lib/lyrics-demo'
import { MIN_ANDROID, SITE_NAME, SITE_URL } from '@/lib/site'
import { Nav } from '@/components/site/nav'
import { MediaRow } from '@/components/site/media-row'
import { PhoneHero } from '@/components/site/phone-hero'
import { Integrations } from '@/components/site/integrations'
import { ReplaySection, replayCards } from '@/components/site/replay-section'
import { Footer } from '@/components/site/footer'
import { ClosingCta } from '@/components/site/closing-cta'

/**
 * Revalidate the whole page every 5 minutes so star counts and new releases
 * appear without a redeploy, while still serving static HTML to every visitor.
 */
export const revalidate = 300

export default async function Page() {
  // Telemetry feeds the download links and the structured data below.
  const [telemetry, shelves, song] = await Promise.all([
    getTelemetry(),
    getNewPageShelves(),
    getLrcRedLyrics(DEMO_TRACK.isrc),
  ])
  // Live lyrics from lrc.red; original placeholder lines if it is unreachable.
  const lyrics = song ? excerpt(song) : placeholderLyrics()

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
    <>
      {/* Emitted server-side so crawlers see it in the initial HTML. */}
      <script
        type="application/ld+json"
        // The payload is built from our own data above, not from user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify([siteSchema, appSchema]) }}
      />

      <Nav />

      <main id="main-content">
        <PhoneHero
          lyrics={lyrics}
          tag={telemetry.latest?.tag ?? null}
          download={download}
          stars={telemetry.repo?.stars ?? null}
          totalDownloads={telemetry.totalDownloads}
        />
        <Integrations />
        <ReplaySection cards={replayCards(shelves)} />
        <MediaRow title="Best New Songs" items={shelves.bestNewSongs} variant="tracks" eager />
        <MediaRow title="New This Week" items={shelves.newThisWeek} />
        <MediaRow title="Recent Releases" items={shelves.recentReleases} />
        <ClosingCta
          tag={telemetry.latest?.tag ?? null}
          download={download}
          stars={telemetry.repo?.stars ?? null}
        />
      </main>

      <Footer stars={telemetry.repo?.stars ?? null} />
    </>
  )
}
