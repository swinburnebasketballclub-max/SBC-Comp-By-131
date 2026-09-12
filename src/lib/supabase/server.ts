import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'
import type { CookieToSet } from './cookies'

/**
 * Supabase client for server components, route handlers and server actions.
 * Carries the visitor's session, so every query is still filtered by row
 * level security — this is not a privileged client.
 */
export async function supabaseServer() {
  const store = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list: CookieToSet[]) => {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options))
          } catch {
            // Called from a server component, where cookies are read-only.
            // middleware.ts refreshes the session instead, so this is safe.
          }
        },
      },
    },
  )
}
