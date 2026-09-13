import { supabaseServer } from '@/lib/supabase/server'
import type { AdminRow, Team } from '@/lib/supabase/database.types'

export type Viewer =
  | { kind: 'anon' }
  | { kind: 'admin'; userId: string; email: string; name: string; admin: AdminRow }
  | { kind: 'manager'; userId: string; email: string; name: string; teams: Team[] }
  | { kind: 'unknown'; userId: string; email: string; name: string }

/**
 * Who is looking at this page.
 *
 * An account can be an organiser or a team manager. `unknown` means they have
 * a Google session but nobody has given them a role yet — which is exactly
 * what a stranger who finds the site will see.
 */
export async function getViewer(retried = false): Promise<Viewer> {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { kind: 'anon' }

  const base = {
    userId: user.id,
    email: user.email,
    name: (user.user_metadata?.full_name as string | undefined) ?? user.email,
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (admin) return { kind: 'admin', ...base, admin }

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('manager_user_id', user.id)
    .eq('manager_status', 'active')

  if (teams && teams.length > 0) return { kind: 'manager', ...base, teams }

  // No role yet. An invite or a team may have been set up after this account
  // first signed in; claim it once, then look again.
  if (!retried) {
    const { data: claimed } = await supabase.rpc('claim_pending_access')
    const c = claimed as { admin?: boolean; teams?: number } | null
    if (c?.admin || (c?.teams ?? 0) > 0) return getViewer(true)
  }

  return { kind: 'unknown', ...base }
}

/** Where a signed-in account belongs. */
export function homeFor(viewer: Viewer): string {
  switch (viewer.kind) {
    case 'admin':   return '/admin'
    case 'manager': return '/team'
    case 'unknown': return '/no-access'
    default:        return '/login'
  }
}
