import 'server-only'

/**
 * Converts Mongoose lean documents into plain JSON-safe objects.
 *
 * Two reasons this is not optional:
 *  1. `use cache` requires serializable return values, and ObjectId / Buffer
 *     are not serializable.
 *  2. Anything handed to a Client Component must cross the RSC boundary.
 *
 * ObjectId becomes a string, Date becomes an ISO string, and `_id` is exposed
 * as `id` so UI code never touches Mongo-specific field names.
 */

type Plain = string | number | boolean | null | Plain[] | { [key: string]: Plain }

function isObjectIdLike(value: unknown): value is { toHexString: () => string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toHexString' in value &&
    typeof (value as { toHexString: unknown }).toHexString === 'function'
  )
}

function convert(value: unknown): Plain {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value.toISOString()
  if (isObjectIdLike(value)) return value.toHexString()
  if (Array.isArray(value)) return value.map(convert)

  const type = typeof value
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return value as Plain
  }

  if (type === 'object') {
    const out: Record<string, Plain> = {}
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      if (key === '__v') continue
      out[key === '_id' ? 'id' : key] = convert(raw)
    }
    return out
  }

  // Functions, symbols, bigint: drop rather than crash the cache write.
  return null
}

export function toPlain<T = Record<string, Plain>>(doc: unknown): T {
  return convert(doc) as T
}

export function toPlainList<T = Record<string, Plain>>(docs: unknown[]): T[] {
  return docs.map((doc) => convert(doc)) as T[]
}
