import { AdminSkeleton } from '@/components/admin/AdminSkeleton'

/**
 * Segment-level Suspense boundary for every admin page.
 *
 * `loading.tsx` is what lets a page read the session at its top level without
 * blocking the prerender: Next.js wraps the page in this boundary, so the
 * request-time read streams in behind it instead of being required for the
 * static shell.
 */
export default function AdminLoading() {
  return <AdminSkeleton />
}
