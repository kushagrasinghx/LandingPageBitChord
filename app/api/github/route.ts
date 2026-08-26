import { getTelemetry } from '@/lib/github'

/**
 * Client-refresh endpoint for live telemetry.
 *
 * The page already server-renders real numbers, so this exists purely so the
 * counters can re-sync without a reload. It mirrors the RSC data source exactly,
 * meaning a client refresh can never disagree with what was painted server-side.
 */
export const revalidate = 300

export async function GET() {
  const telemetry = await getTelemetry()

  return Response.json(telemetry, {
    headers: {
      // Serve stale copies while revalidating so a GitHub rate limit never turns
      // into a user-visible failure.
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
    },
  })
}
