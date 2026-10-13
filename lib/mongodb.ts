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
      .catch((error) => {
        // Clear the rejected promise so the next request can retry instead of
        // permanently caching the failure for the life of the container.
        cache.promise = null
        throw error
      })
  }

  cache.conn = await cache.promise
  return cache.conn
}

/** Trivial round-trip used by GET /api/health to keep Atlas awake. */
export async function pingDatabase(): Promise<number> {
  const started = Date.now()
  const conn = await connectToDatabase()
  await conn.connection.db?.admin().command({ ping: 1 })
  return Date.now() - started
}
