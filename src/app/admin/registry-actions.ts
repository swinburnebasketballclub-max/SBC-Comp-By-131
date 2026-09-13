'use server'

import { revalidatePath } from 'next/cache'

import { getViewer } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { supabaseServer } from '@/lib/supabase/server'

export type ActionResult =
  | { ok: true; added?: number; updated?: number; count?: number }
  | { ok: false; code: string }

/** Every action here edits personal data or money, so super only. */
async function isSuper() {
  const viewer = await getViewer()
  return viewer.kind === 'admin' && viewer.admin.role === 'super'
}

function codeFrom(message: string): string {
  const known = [
    'FORBIDDEN', 'LAST_SUPER', 'MASISWA_QUOTA', 'STATE_QUOTA', 'ROSTER_FULL', 'COACH_QUOTA',
  ]
  return known.find((k) => message.includes(k)) ?? 'UNKNOWN'
}

// ------------------------------------------------------------- players --

/**
 * Organiser override for "new player". The registry cannot know about
 * someone who played under a different IC, or a guest who never did; this is
 * the escape hatch, and it survives later registry changes.
 */
export async function setNewPlayer(memberId: string, isNew: boolean): Promise<ActionResult> {
  if (!(await isSuper())) return { ok: false, code: 'FORBIDDEN' }
  const supabase = await supabaseServer()
  const { error } = await supabase
    .from('team_members')
    .update({ is_new_player: isNew, new_player_src: 'admin' })
    .eq('id', memberId)
  if (error) return { ok: false, code: codeFrom(error.message) }
  revalidatePath('/admin/players')
  revalidatePath('/admin')
  return { ok: true }
}

// ------------------------------------------------------- past players --

export type VeteranInput = { ic: string; name: string; seasons: string[]; note?: string }

export async function importVeterans(rows: VeteranInput[]): Promise<ActionResult> {
  if (!(await isSuper())) return { ok: false, code: 'FORBIDDEN' }
  if (rows.length === 0) return { ok: false, code: 'INVALID' }
  if (rows.length > 2000) return { ok: false, code: 'INVALID' }

  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc('upsert_veterans', { p_rows: rows })
  if (error) return { ok: false, code: codeFrom(error.message) }

  revalidatePath('/admin/veterans')
  revalidatePath('/admin/players')
  revalidatePath('/admin')
  const r = data?.[0]
  return { ok: true, added: r?.added ?? 0, updated: r?.updated ?? 0 }
}

export async function deleteVeteran(id: string): Promise<ActionResult> {
  if (!(await isSuper())) return { ok: false, code: 'FORBIDDEN' }
  const supabase = await supabaseServer()
  const { error } = await supabase.from('veteran_players').delete().eq('id', id)
  if (error) return { ok: false, code: codeFrom(error.message) }
  revalidatePath('/admin/veterans')
  revalidatePath('/admin/players')
  revalidatePath('/admin')
  return { ok: true }
}

export async function archiveSeason(competitionId: string): Promise<ActionResult> {
  if (!(await isSuper())) return { ok: false, code: 'FORBIDDEN' }
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc('archive_season', { p_competition: competitionId })
  if (error) return { ok: false, code: codeFrom(error.message) }
  revalidatePath('/admin/veterans')
  const r = data?.[0]
  return { ok: true, added: r?.added ?? 0, updated: r?.updated ?? 0 }
}

// ------------------------------------------------------ rules & terms --

export type RulesInput = {
  competitionId: string
  status: 'draft' | 'open' | 'closed' | 'locked' | 'running' | 'finished'
  name_en: string
  name_zh: string
  venue_en: string
  venue_zh: string
  starts_on: string
  ends_on: string
  registration_deadline: string
  max_teams: number
  roster_min: number
  roster_max: number
  max_coaches: number
  max_masiswa: number
  max_state: number
  deposit_cents: number
  bank_name: string
  bank_holder: string
  bank_account: string
  bank_whatsapp: string
  daily_start: string
  daily_end: string
  match_minutes: number
  courts: number
  min_colour_distance: number
  tiers: { id: string; amount_cents: number }[]
  terms: { body_en: string; body_zh: string }[]
}

const int = (n: unknown) => (Number.isFinite(Number(n)) ? Math.round(Number(n)) : NaN)

export async function saveRules(input: RulesInput): Promise<ActionResult> {
  if (!(await isSuper())) return { ok: false, code: 'FORBIDDEN' }

  const nums = [
    input.max_teams, input.roster_min, input.roster_max, input.max_coaches,
    input.max_masiswa, input.max_state, input.deposit_cents, input.match_minutes, input.courts,
  ].map(int)
  if (nums.some((n) => Number.isNaN(n) || n < 0)) return { ok: false, code: 'RULES_NUMBER' }
  if (int(input.roster_max) < int(input.roster_min)) return { ok: false, code: 'RULES_ROSTER' }
  if (int(input.max_state) > int(input.max_masiswa)) return { ok: false, code: 'RULES_STATE' }
  if (!(input.starts_on <= input.ends_on && input.registration_deadline <= input.starts_on)) {
    return { ok: false, code: 'RULES_DATES' }
  }
  const terms = input.terms
    .map((t) => ({ body_en: t.body_en.trim(), body_zh: t.body_zh.trim() }))
    .filter((t) => t.body_en || t.body_zh)
  if (terms.some((t) => !t.body_en)) return { ok: false, code: 'RULES_TERM_EN' }

  const supabase = await supabaseServer()
  const { error } = await supabase
    .from('competitions')
    .update({
      status: input.status,
      name_en: input.name_en.trim(),
      name_zh: input.name_zh.trim(),
      venue_en: input.venue_en.trim(),
      venue_zh: input.venue_zh.trim(),
      starts_on: input.starts_on,
      ends_on: input.ends_on,
      registration_deadline: input.registration_deadline,
      max_teams: int(input.max_teams),
      roster_min: int(input.roster_min),
      roster_max: int(input.roster_max),
      max_coaches: int(input.max_coaches),
      max_masiswa: int(input.max_masiswa),
      max_state: int(input.max_state),
      deposit_cents: int(input.deposit_cents),
      bank_name: input.bank_name.trim(),
      bank_holder: input.bank_holder.trim(),
      bank_account: input.bank_account.trim(),
      bank_whatsapp: input.bank_whatsapp.trim(),
      daily_start: input.daily_start,
      daily_end: input.daily_end,
      match_minutes: int(input.match_minutes),
      courts: int(input.courts),
      min_colour_distance: Number(input.min_colour_distance),
    })
    .eq('id', input.competitionId)
  if (error) return { ok: false, code: codeFrom(error.message) }

  for (const tier of input.tiers) {
    const amount = int(tier.amount_cents)
    if (Number.isNaN(amount) || amount < 0) return { ok: false, code: 'RULES_NUMBER' }
    const { error: e } = await supabase
      .from('fee_tiers')
      .update({ amount_cents: amount })
      .eq('id', tier.id)
      .eq('competition_id', input.competitionId)
    if (e) return { ok: false, code: codeFrom(e.message) }
  }

  // Clauses are numbered by position. Write the new list over the old one
  // first, then trim the tail, so a failed save never leaves no terms at all.
  if (terms.length > 0) {
    const { error: upErr } = await supabase
      .from('terms')
      .upsert(
        terms.map((t, i) => ({ competition_id: input.competitionId, idx: i + 1, ...t })),
        { onConflict: 'competition_id,idx' },
      )
    if (upErr) return { ok: false, code: codeFrom(upErr.message) }
  }
  const { error: delErr } = await supabase
    .from('terms')
    .delete()
    .eq('competition_id', input.competitionId)
    .gt('idx', terms.length)
  if (delErr) return { ok: false, code: codeFrom(delErr.message) }

  // A changed fee or deposit reaches every team that has not paid yet.
  // Amounts already under review or approved are never moved.
  const { data: teams } = await supabase.from('teams').select('id').eq('competition_id', input.competitionId)
  const service = supabaseAdmin()
  await Promise.all((teams ?? []).map((t) => service.rpc('refresh_team_fee', { p_team: t.id })))

  revalidatePath('/', 'layout')
  return { ok: true }
}

/** Deadline day: every roster that is still open gets locked in one go. */
export async function lockAllRosters(competitionId: string): Promise<ActionResult> {
  if (!(await isSuper())) return { ok: false, code: 'FORBIDDEN' }
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from('teams')
    .update({ locked_at: new Date().toISOString(), edit_window_until: null })
    .eq('competition_id', competitionId)
    .or('locked_at.is.null,edit_window_until.not.is.null')
    .select('id')
  if (error) return { ok: false, code: codeFrom(error.message) }
  revalidatePath('/admin', 'layout')
  return { ok: true, count: data?.length ?? 0 }
}
