import 'server-only'

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Privileged client. Bypasses row level security entirely.
 *
 * Only for work the visitor cannot be trusted to do themselves but that the
 * server has already authorised — currently just storing a player's passport
 * photo after their invite token has been checked.
 *
 * Never import this into a client component.
 */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
