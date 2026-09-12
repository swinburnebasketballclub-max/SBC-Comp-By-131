import type { CookieOptions } from '@supabase/ssr'

/** Shape @supabase/ssr hands to `setAll`. */
export type CookieToSet = { name: string; value: string; options: CookieOptions }
