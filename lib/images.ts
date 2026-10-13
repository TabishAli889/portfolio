/**
 * Pure URL helpers for admin-supplied images.
 *
 * Deliberately NOT `server-only`: the admin's upload preview is a Client
 * Component and needs `isOptimizable` too.
 */

/** The only remote host `next/image` is allowed to optimise - see next.config.ts. */
export const CLOUDINARY_HOST = 'res.cloudinary.com'

/**
 * Whether `next/image` may run this URL through the optimiser.
 *
 * `next/image` throws if it is asked to optimise a host that is not listed in
 * `images.remotePatterns`. The admin is allowed to paste an arbitrary image URL
 * instead of uploading, so any host is possible - and we are not going to
 * allowlist the entire internet to make the optimiser happy. Anything that is
 * not Cloudinary is therefore rendered with `unoptimized`, which serves the
 * URL as-is and skips the host check entirely.
 *
 * SVGs are excluded as well: optimising them is pointless and Next recommends
 * passing them through untouched.
 */
export function isOptimizable(url: string): boolean {
  if (!url) return false

  // Local assets under /public are always fine.
  if (url.startsWith('/')) return !url.toLowerCase().endsWith('.svg')

  try {
    const parsed = new URL(url)
    if (parsed.hostname !== CLOUDINARY_HOST) return false
    return !parsed.pathname.toLowerCase().endsWith('.svg')
  } catch {
    return false
  }
}

/**
 * Builds a transformed Cloudinary delivery URL: resized, auto-format
 * (AVIF/WebP where supported) and auto-quality.
 *
 * A non-Cloudinary URL is returned untouched, so a pasted external image still
 * renders - just without the transformation.
 */
export function cloudinaryImageUrl(
  url: string,
  { width, height, crop = 'fill' }: { width: number; height?: number; crop?: string },
): string {
  if (!url.includes(`${CLOUDINARY_HOST}/`) || !url.includes('/upload/')) return url

  const transform = [
    'f_auto',
    'q_auto',
    `w_${width}`,
    height ? `h_${height}` : null,
    height ? `c_${crop}` : null,
    'dpr_auto',
  ]
    .filter(Boolean)
    .join(',')

  return url.replace('/upload/', `/upload/${transform}/`)
}
