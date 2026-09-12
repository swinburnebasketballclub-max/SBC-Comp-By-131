import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieToSet } from '@/lib/supabase/cookies'

/**
 * Refreshes the Supabase session cookie on every request, so a signed-in
 * manager or admin does not get logged out mid-registration.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list: CookieToSet[]) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.jpg|ryt-qr.jpg|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
