import mongoose, { type Mongoose } from 'mongoose'
import { dbEnv } from './env'

/**
 * Cached connection for serverless.
 *
 * Every Vercel lambda invocation may reuse a warm container. Without caching,
 * each invocation would open a new pool and quickly exhaust the Atlas free-tier
 * connection limit (500). We stash both the connection and the in-flight
 * promise on `globalThis` so concurrent callers await the same handshake.
 */

type MongooseCache = {
  conn: Mongoose | null
  promise: Promise<Mongoose> | null
}

const globalForMongoose = globalThis as typeof globalThis & {
  _mongooseCache?: MongooseCache
}

const cache: MongooseCache = (globalForMongoose._mongooseCache ??= {
  conn: null,
  promise: null,
})

export async function connectToDatabase(): Promise<Mongoose> {
  if (cache.conn) return cache.conn

  if (!cache.promise) {
    const { uri } = dbEnv()

    // Fail fast rather than hanging a request for 30s on a paused cluster.
    cache.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        maxPoolSize: 10,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
      })
      .catch((error: unknown) => {
        // Clear the rejected promise so the next request can retry instead of
        // permanently caching the failure for the life of the container.
        cache.promise = null
        throw explain(error)
      })
  }

  cache.conn = await cache.promise
  return cache.conn
}

/**
 * Turns a server-selection failure into something actionable.
 *
 * The driver's own error is a ~40-line topology dump (`commonWireVersion: 0`,
 * every seed host listed as unknown) that says nothing about the cause. In
 * practice it is almost always one of three things, and none of them are code:
 * the Atlas IP access list, a paused free-tier cluster, or wrong credentials.
 *
 * This matters most during `next build`, where the prerender reads the
 * database: on Vercel the failure surfaced only as "Failed to collect page
 * data" with the dump above it, which points at the wrong layer entirely.
 */
function explain(error: unknown): unknown {
  const name = error instanceof Error ? error.name : ''
  if (!/ServerSelection|Timeout/i.test(name)) return error

  const wrapped = new Error(
    'Could not reach MongoDB. The connection string was accepted and the host ' +
      'resolved, but no server answered in time. Check, in this order:\n' +
      '  1. Atlas > Network Access: the IP access list must contain 0.0.0.0/0. ' +
      'Vercel builds and serverless functions do not have stable IPs, so an ' +
      'allowlist holding only your home IP fails in production while working \n' +
      '     locally.\n' +
      '  2. Atlas > Clusters: a free-tier (M0) cluster auto-pauses after 60 days ' +
      'idle and must be resumed by hand. /api/health plus the UptimeRobot setup ' +
      'in the README exist to stop that happening.\n' +
      '  3. The user, password and database name in MONGODB_URI. A password ' +
      'containing @ : / ? # or % must be percent-encoded.',
    { cause: error },
  )
  wrapped.name = 'MongoUnreachableError'
  return wrapped
}

/** Trivial round-trip used by GET /api/health to keep Atlas awake. */
export async function pingDatabase(): Promise<number> {
  const started = Date.now()
  const conn = await connectToDatabase()
  await conn.connection.db?.admin().command({ ping: 1 })
  return Date.now() - started
}
