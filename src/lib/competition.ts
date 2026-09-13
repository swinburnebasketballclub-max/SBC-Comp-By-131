import { supabaseServer } from '@/lib/supabase/server'
import type {
  Competition, JerseyColour, Payment, Team, TeamMember,
} from '@/lib/supabase/database.types'

/** The competition everything else hangs off — the most recent one. */
export async function activeCompetition(): Promise<Competition | null> {
  const supabase = await supabaseServer()
  const { data } = await supabase
    .from('competitions')
    .select('*')
    .order('starts_on', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

export type TeamSummary = {
  team: Team
  members: TeamMember[]
  payment: Payment | null
  colour: JerseyColour | null
  players: number
  coaches: number
  masiswa: number
  state: number
  breaches: string[]
}

/**
 * Everything the console needs about every team, in four queries.
 *
 * The counts and rule checks are recomputed here rather than read from a
 * cache, so the screen can never disagree with what the database would
 * accept. The database enforces the same limits on write; this is only so
 * the organiser can see a breach coming.
 */
export async function teamSummaries(competition: Competition): Promise<TeamSummary[]> {
  const supabase = await supabaseServer()

  const [{ data: teams }, { data: members }, { data: payments }, { data: colours }] =
    await Promise.all([
      supabase.from('teams').select('*').eq('competition_id', competition.id).order('created_at'),
      supabase.from('team_members').select('*').eq('competition_id', competition.id),
      supabase.from('payments').select('*'),
      supabase.from('jersey_colours').select('*').eq('competition_id', competition.id),
    ])

  return (teams ?? []).map((team) => {
    const mine = (members ?? []).filter((m) => m.team_id === team.id && m.status === 'active')
    const players = mine.filter((m) => m.is_player).length
    const coaches = mine.filter((m) => m.is_coach).length
    const masiswa = mine.filter((m) => m.tier === 'masiswa' || m.tier === 'state').length
    const state = mine.filter((m) => m.tier === 'state').length

    const breaches: string[] = []
    if (masiswa > competition.max_masiswa) breaches.push(`Masiswa ${masiswa}/${competition.max_masiswa}`)
    if (state > competition.max_state) breaches.push(`State ${state}/${competition.max_state}`)
    if (players > competition.roster_max) breaches.push(`Players ${players}/${competition.roster_max}`)
    if (players > 0 && players < competition.roster_min) breaches.push(`Players ${players}/${competition.roster_min} min`)
    if (coaches > competition.max_coaches) breaches.push(`Coaches ${coaches}/${competition.max_coaches}`)

    return {
      team,
      members: (members ?? []).filter((m) => m.team_id === team.id),
      payment: (payments ?? []).find((p) => p.team_id === team.id) ?? null,
      colour: (colours ?? []).find((c) => c.team_id === team.id) ?? null,
      players, coaches, masiswa, state, breaches,
    }
  })
}

/** Two initials for a team crest. */
export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter((w) => /^[A-Za-z0-9]/.test(w))
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || 'SB'
  )
}
