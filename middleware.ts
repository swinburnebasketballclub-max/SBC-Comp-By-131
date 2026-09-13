import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieToSet } from '@/lib/supabase/cookies'

/**
 * Refreshes the Supabase session cookie on every request, so a signed-in
 * manager or organiser is not logged out halfway through a roster.
 *
 * Refreshing a session is a convenience, not a gate — pages check who the
 * viewer is themselves. So if the environment is misconfigured, or Supabase
 * is briefly unreachable, this steps aside and lets the request through
 * rather than taking the privacy page and everything else down with it.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let response = NextResponse.next({ request })
  if (!url || !key) return response

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list: CookieToSet[]) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    })

    await supabase.auth.getUser()
  } catch (error) {
    console.error('[middleware] session refresh skipped:', error)
  }

  return response
}

export const config = {
  // The Supabase client libraries are not reliably edge-compatible: on Vercel
  // the edge build loaded fine and then failed on every invocation before any
  // of this code ran. The Node.js runtime has no such gaps.
  runtime: 'nodejs',
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.jpg|ryt-qr.jpg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
