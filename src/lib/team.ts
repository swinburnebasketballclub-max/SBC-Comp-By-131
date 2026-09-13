import { redirect } from 'next/navigation'

import { activeCompetition } from '@/lib/competition'
import { getViewer } from '@/lib/session'
import { supabaseServer } from '@/lib/supabase/server'
import type {
  Competition, InviteLink, JerseyColour, Payment, Team, TeamMember, Term,
} from '@/lib/supabase/database.types'

export type ManagerContext = {
  userId: string
  email: string
  comp: Competition
  team: Team
  members: TeamMember[]
  payment: Payment | null
  colour: JerseyColour | null
  editable: boolean
  editWindowUntil: string | null
}

/**
 * Loads the signed-in manager's team for the current competition, or sends
 * them where they belong. Every manager page starts here.
 */
export async function managerContext(): Promise<ManagerContext> {
  const viewer = await getViewer()
  if (viewer.kind === 'anon') redirect('/login?next=/team')
  if (viewer.kind === 'admin') redirect('/admin')
  if (viewer.kind !== 'manager') redirect('/no-access')

  const comp = await activeCompetition()
  if (!comp) redirect('/')

  const team = viewer.teams.find((t) => t.competition_id === comp.id)
  if (!team) redirect('/no-access')

  const supabase = await supabaseServer()
  const [{ data: members }, { data: payment }, { data: colour }] = await Promise.all([
    supabase.from('team_members').select('*').eq('team_id', team.id).neq('status', 'declined'),
    supabase.from('payments').select('*').eq('team_id', team.id).maybeSingle(),
    supabase.from('jersey_colours').select('*').eq('team_id', team.id).maybeSingle(),
  ])

  const windowOpen = team.edit_window_until && new Date(team.edit_window_until) > new Date()

  return {
    userId: viewer.userId,
    email: viewer.email,
    comp,
    team,
    members: members ?? [],
    payment: payment ?? null,
    colour: colour ?? null,
    editable: !team.locked_at || Boolean(windowOpen),
    editWindowUntil: windowOpen ? team.edit_window_until : null,
  }
}

export async function teamLinks(teamId: string): Promise<InviteLink[]> {
  const supabase = await supabaseServer()
  const { data } = await supabase
    .from('invite_links')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function competitionTerms(competitionId: string): Promise<Term[]> {
  const supabase = await supabaseServer()
  const { data } = await supabase.from('terms').select('*').eq('competition_id', competitionId).order('idx')
  return data ?? []
}

/** Signed links to private photos, so the roster can show faces. */
export async function photoUrls(members: TeamMember[]): Promise<Record<string, string>> {
  const paths = members.map((m) => m.photo_path).filter((p): p is string => Boolean(p))
  if (paths.length === 0) return {}

  const supabase = await supabaseServer()
  const { data } = await supabase.storage.from('photos').createSignedUrls(paths, 60 * 30)

  const byPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]))
  return Object.fromEntries(
    members
      .filter((m) => m.photo_path && byPath.get(m.photo_path))
      .map((m) => [m.id, byPath.get(m.photo_path!)!]),
  )
}

export function publicUrl(bucket: string, path: string | null): string | null {
  if (!path) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}
