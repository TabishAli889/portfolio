import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth-guard'
import { createUploadConfig, type UploadKind } from '@/lib/cloudinary'
import { hasCloudinaryConfig } from '@/lib/env'

/**
 * Issues the admin's Cloudinary upload credentials: either a short-lived
 * signature, or an unsigned upload preset when one is configured.
 *
 * The session is re-checked here even though proxy.ts already guards
 * /api/admin/* - route handlers must never rely on proxy alone.
 */
export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasCloudinaryConfig()) {
    return NextResponse.json(
      {
        error:
          'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME plus either ' +
          'CLOUDINARY_UPLOAD_PRESET (unsigned) or CLOUDINARY_API_KEY and ' +
          'CLOUDINARY_API_SECRET (signed).',
      },
      { status: 503 },
    )
  }

  let kind: UploadKind = 'image'
  try {
    const body = (await request.json()) as { kind?: string }
    if (body.kind === 'pdf' || body.kind === 'image') kind = body.kind
  } catch {
    // Empty or malformed body: fall back to an image signature.
  }

  return NextResponse.json(createUploadConfig(kind), {
    headers: { 'cache-control': 'no-store' },
  })
}
