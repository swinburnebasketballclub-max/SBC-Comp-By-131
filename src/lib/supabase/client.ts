'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

/** Supabase client for client components. Always subject to row level security. */
export function supabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
