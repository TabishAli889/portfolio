import 'server-only'
import { v2 as cloudinary } from 'cloudinary'
import { cloudinaryEnv } from './env'

/**
 * Cloudinary uploads use *signed direct uploads* rather than proxying the file
 * through a route handler.
 *
 * Why: a Vercel serverless function caps request bodies at 4.5 MB, and
 * proxying also burns function time and bandwidth on bytes we do not need to
 * see. Instead the browser asks this server for a short-lived signature, then
 * POSTs the file straight to Cloudinary. The API secret never leaves the
 * server, and the signature pins the folder and timestamp so it cannot be
 * reused to upload anywhere else.
 */

export type UploadSignature = {
  signature: string
  timestamp: number
  apiKey: string
  cloudName: string
  folder: string
}

/** Folders are fixed server-side so a signature cannot be aimed elsewhere. */
export const UPLOAD_FOLDERS = {
  image: 'portfolio/images',
  pdf: 'portfolio/documents',
} as const

export type UploadKind = keyof typeof UPLOAD_FOLDERS

export function createUploadSignature(kind: UploadKind): UploadSignature {
  const { cloudName, apiKey, apiSecret } = cloudinaryEnv()
  const timestamp = Math.round(Date.now() / 1000)
  const folder = UPLOAD_FOLDERS[kind]

  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret)

  return { signature, timestamp, apiKey, cloudName, folder }
}

/**
 * Builds a transformed delivery URL from a Cloudinary image URL: resized,
 * auto-format (AVIF/WebP where supported) and auto-quality. Non-Cloudinary
 * URLs pass through untouched so the admin can also paste an external image.
 */
export function cloudinaryImageUrl(
  url: string,
  { width, height, crop = 'fill' }: { width: number; height?: number; crop?: string },
): string {
  if (!url.includes('/upload/')) return url

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
