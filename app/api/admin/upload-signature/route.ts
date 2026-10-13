import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth-guard'
import { createUploadSignature, type UploadKind } from '@/lib/cloudinary'
import { hasCloudinaryConfig } from '@/lib/env'

/**
 * Issues a short-lived Cloudinary upload signature to the signed-in admin.
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
      { error: 'Cloudinary is not configured. Add the three CLOUDINARY_ variables.' },
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

  return NextResponse.json(createUploadSignature(kind), {
    headers: { 'cache-control': 'no-store' },
  })
}
