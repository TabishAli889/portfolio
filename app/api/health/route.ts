import { connection, NextResponse } from 'next/server'
import { pingDatabase } from '@/lib/mongodb'

/**
 * Keep-alive + liveness probe.
 *
 * The public pages are served from the cache, so on a quiet week MongoDB may
 * see no traffic at all and a free-tier Atlas cluster will auto-pause. Pointing
 * an uptime monitor at this route every 5 minutes keeps the cluster warm and
 * doubles as an alert if the database ever becomes unreachable. See the
 * UptimeRobot section of the README.
 *
 * `cacheComponents` forbids `export const dynamic`, so request-time execution
 * is marked with `connection()` instead. Without it the handler could be
 * prerendered at build time and the monitor would hit a cached response that
 * never touches the database - which would defeat the whole point.
 */
export async function GET() {
  await connection()
  const startedAt = Date.now()

  try {
    const latencyMs = await pingDatabase()

    return NextResponse.json(
      {
        status: 'ok',
        database: 'connected',
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      { headers: { 'cache-control': 'no-store' } },
    )
  } catch (error) {
    console.error('[health] database ping failed', error)

    return NextResponse.json(
      {
        status: 'error',
        database: 'unreachable',
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    )
  }
}
