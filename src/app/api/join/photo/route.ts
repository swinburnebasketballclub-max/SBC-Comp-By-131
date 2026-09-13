import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const MAX_BYTES = 3 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * A player has no account, so storage policies cannot let them write. This
 * route checks the invite token first and only then writes the photo with the
 * service key — the one place in the app that needs it.
 */
export async function POST(request: Request) {
  let admin
  try {
    admin = supabaseAdmin()
  } catch {
    // The service key is not configured on this deployment.
    return NextResponse.json({ ok: false, error: 'PHOTO_UNAVAILABLE' }, { status: 503 })
  }

  const form = await request.formData().catch(() => null)
  const token = String(form?.get('token') ?? '')
  const file = form?.get('file')

  if (!/^[a-z0-9]{6,16}$/.test(token) || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'INVALID' }, { status: 400 })
  }
  if (!TYPES.includes(file.type) || file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'INVALID' }, { status: 400 })
  }

  const { data: link } = await admin
    .from('invite_links')
    .select('team_id, revoked_at, expires_at, max_uses, uses')
    .eq('token', token)
    .maybeSingle()

  const usable =
    link &&
    !link.revoked_at &&
    (!link.expires_at || new Date(link.expires_at) > new Date()) &&
    (link.max_uses === null || link.uses < link.max_uses)

  if (!usable) return NextResponse.json({ ok: false, error: 'LINK_INVALID' }, { status: 403 })

  // Stored under the team's folder so its manager can read it back.
  const path = `teams/${link.team_id}/members/${randomUUID()}.jpg`
  const { error } = await admin.storage
    .from('photos')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ ok: false, error: 'UNKNOWN' }, { status: 500 })
  return NextResponse.json({ ok: true, path })
}
