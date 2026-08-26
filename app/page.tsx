import { getTelemetry } from '@/lib/github'
import { TelemetryProvider } from '@/components/telemetry-provider'
import { Backdrop } from '@/components/site/backdrop'
import { Nav } from '@/components/site/nav'
import { Hero } from '@/components/site/hero'
import { Metrics } from '@/components/site/metrics'
import { Features } from '@/components/site/features'
import { Changelog } from '@/components/site/changelog'
import { Install } from '@/components/site/install'
import { Terminal } from '@/components/site/terminal'
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

  return (
    <TelemetryProvider initial={telemetry}>
      <Backdrop />
      <Nav />

      <main>
        <Hero />
        <Metrics />
        <Features />
        <Changelog />
        <Install />
        <Terminal />
      </main>

      <Footer />
    </TelemetryProvider>
  )
}
