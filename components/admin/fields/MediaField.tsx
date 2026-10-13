'use client'

import { useId, useRef, useState } from 'react'
import Image from 'next/image'
import { FileText, ImageOff, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Cloudinary upload with live preview.
 *
 * The file goes straight from the browser to Cloudinary using a signature this
 * app issues (see lib/cloudinary.ts for why we do not proxy the bytes). On
 * success the resulting secure_url is written into the form field.
 */

/**
 * Mirrors `UploadConfig` in lib/cloudinary.ts. Declared locally rather than
 * imported because that module is `server-only`.
 */
type UploadConfig =
  | {
      mode: 'signed'
      cloudName: string
      folder: string
      apiKey: string
      timestamp: number
      signature: string
    }
  | { mode: 'unsigned'; cloudName: string; preset: string }

const MAX_BYTES = { image: 8 * 1024 * 1024, pdf: 12 * 1024 * 1024 }

const ACCEPT = {
  image: 'image/png,image/jpeg,image/webp,image/avif,image/svg+xml',
  pdf: 'application/pdf',
}

export function MediaField({
  id,
  kind,
  value,
  onChange,
  disabled,
  describedBy,
}: {
  /** Applied to the URL input, so the form's <label for> resolves to it. */
  id?: string
  kind: 'image' | 'pdf'
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  describedBy?: string
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [brokenPreview, setBrokenPreview] = useState(false)

  async function upload(file: File) {
    if (file.size > MAX_BYTES[kind]) {
      toast.error(`That file is too large. Maximum ${Math.round(MAX_BYTES[kind] / 1024 / 1024)} MB.`)
      return
    }

    setUploading(true)
    try {
      const signatureResponse = await fetch('/api/admin/upload-signature', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind }),
      })

      if (!signatureResponse.ok) {
        const body = (await signatureResponse.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Could not start the upload.')
      }

      const config = (await signatureResponse.json()) as UploadConfig

      const body = new FormData()
      body.append('file', file)

      if (config.mode === 'unsigned') {
        // No API key and no signature: the preset authorises the upload and
        // decides the destination folder.
        body.append('upload_preset', config.preset)
      } else {
        body.append('api_key', config.apiKey)
        body.append('timestamp', String(config.timestamp))
        body.append('signature', config.signature)
        body.append('folder', config.folder)
      }

      // `auto` lets one endpoint handle both images and the resume PDF.
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`,
        { method: 'POST', body },
      )

      if (!uploadResponse.ok) {
        const detail = (await uploadResponse.json().catch(() => ({}))) as {
          error?: { message?: string }
        }
        const raw = detail.error?.message ?? ''

        /**
         * Cloudinary answers an API key that authenticates but lacks upload
         * rights with "Request forbidden due to missing permissions
         * (actions=[\"create\"])", which gives no clue where to look. Translate
         * it, because the fix is in the Cloudinary console, not in this code.
         */
        if (uploadResponse.status === 403 && /missing permissions/i.test(raw)) {
          throw new Error(
            'Cloudinary accepted the API key but will not let it upload. Two fixes: ' +
              'in the Cloudinary console under Settings > API Keys, use the original key pair ' +
              '(a newly generated key must be activated first) - or skip API keys entirely by ' +
              'creating an unsigned upload preset and setting CLOUDINARY_UPLOAD_PRESET. ' +
              'See the README section "Cloudinary upload fails".',
          )
        }

        // Unsigned mode: the preset name is wrong, or it is not set to Unsigned.
        if (/upload preset/i.test(raw)) {
          throw new Error(
            `Cloudinary could not use that upload preset: ${raw}. Check that ` +
              'CLOUDINARY_UPLOAD_PRESET matches the preset name exactly and that its ' +
              'signing mode is set to Unsigned.',
          )
        }

        throw new Error(raw || 'Cloudinary rejected the upload.')
      }

      const { secure_url: secureUrl } = (await uploadResponse.json()) as { secure_url: string }

      setBrokenPreview(false)
      onChange(secureUrl)
      toast.success(kind === 'pdf' ? 'PDF uploaded.' : 'Image uploaded.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-4">
        {/* Preview */}
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-ink-600 bg-ink-900">
          {value && kind === 'image' && !brokenPreview ? (
            <Image
              src={value}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
              onError={() => setBrokenPreview(true)}
              unoptimized={value.endsWith('.svg')}
            />
          ) : value && kind === 'pdf' ? (
            <div className="flex size-full items-center justify-center text-neon-cyan">
              <FileText className="size-8" aria-hidden />
            </div>
          ) : (
            <div className="flex size-full items-center justify-center text-fog-500">
              <ImageOff className="size-7" aria-hidden />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor={inputId}
              className={`btn btn-ghost !px-3.5 !py-2 !text-xs ${
                disabled || uploading ? 'pointer-events-none opacity-55' : ''
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Uploading
                </>
              ) : (
                <>
                  <Upload className="size-3.5" aria-hidden />
                  {value ? 'Replace' : 'Upload'}
                </>
              )}
            </label>

            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={ACCEPT[kind]}
              className="sr-only"
              disabled={disabled || uploading}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void upload(file)
              }}
            />

            {value && (
              <button
                type="button"
                className="btn btn-danger !px-3.5 !py-2 !text-xs"
                disabled={disabled || uploading}
                onClick={() => {
                  onChange('')
                  setBrokenPreview(false)
                }}
              >
                <Trash2 className="size-3.5" aria-hidden />
                Remove
              </button>
            )}
          </div>

          {/* The URL stays editable so an externally hosted asset can be pasted. */}
          <input
            id={id}
            type="url"
            value={value}
            onChange={(event) => {
              setBrokenPreview(false)
              onChange(event.target.value)
            }}
            disabled={disabled || uploading}
            placeholder={kind === 'pdf' ? 'https://.../resume.pdf' : 'https://.../image.jpg'}
            className="field !py-2 !text-xs"
            aria-describedby={describedBy}
          />

          {value && (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="inline-block truncate text-xs text-neon-cyan/80 hover:text-neon-cyan"
            >
              Open in a new tab
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
