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

/**
 * Two upload modes are supported.
 *
 * `signed` is the default and the better one: the browser gets a short-lived
 * signature and the API secret never leaves the server.
 *
 * `unsigned` exists because a signed upload depends on the API key carrying
 * Cloudinary's `create` permission, and that is not always within reach - a
 * newly generated key has to be activated, and some keys are issued with
 * restricted roles. Such a key authenticates happily and then fails every
 * upload with "Request forbidden due to missing permissions". An unsigned
 * upload preset bypasses API keys entirely, so it is the reliable escape
 * hatch. It is opt-in: set CLOUDINARY_UPLOAD_PRESET to switch.
 *
 * The trade-off is real and worth stating: an unsigned preset can be used by
 * anyone who learns the cloud name and preset name, so restrict the preset in
 * Cloudinary (folder, allowed formats, max file size) rather than leaving it
 * open.
 */
export type UploadConfig =
  | {
      mode: 'signed'
      cloudName: string
      folder: string
      apiKey: string
      timestamp: number
      signature: string
    }
  | {
      mode: 'unsigned'
      cloudName: string
      preset: string
    }

/** Folders are fixed server-side so a signature cannot be aimed elsewhere. */
export const UPLOAD_FOLDERS = {
  image: 'portfolio/images',
  pdf: 'portfolio/documents',
} as const

export type UploadKind = keyof typeof UPLOAD_FOLDERS

export function createUploadConfig(kind: UploadKind): UploadConfig {
  const { cloudName, apiKey, apiSecret, uploadPreset } = cloudinaryEnv()

  if (uploadPreset) {
    /**
     * No `folder` is sent in unsigned mode. Cloudinary restricts which
     * parameters an unsigned upload may carry, so the destination folder is
     * configured on the preset itself - which also means it cannot be
     * overridden by whoever calls the endpoint.
     */
    return { mode: 'unsigned', cloudName, preset: uploadPreset }
  }

  const timestamp = Math.round(Date.now() / 1000)
  const folder = UPLOAD_FOLDERS[kind]
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret)

  return { mode: 'signed', signature, timestamp, apiKey, cloudName, folder }
}
