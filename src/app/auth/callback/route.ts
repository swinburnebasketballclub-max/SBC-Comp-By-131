import { NextResponse, type NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { getViewer, homeFor } from '@/lib/session'

/**
 * Where Google sends the visitor back to. Exchanges the one-time code for a
 * session, then drops them wherever their role belongs.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', url.origin))
  }

  const supabase = await supabaseServer()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    )
  }

  // Pick up any organiser invite or team registered to this email, including
  // ones created after the account first signed in.
  await supabase.rpc('claim_pending_access')

  // Only follow `next` when it is a path on this site.
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    return NextResponse.redirect(new URL(next, url.origin))
  }

  return NextResponse.redirect(new URL(homeFor(await getViewer()), url.origin))
}
