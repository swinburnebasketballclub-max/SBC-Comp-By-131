'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'

import { getViewer } from '@/lib/session'
import { supabaseServer } from '@/lib/supabase/server'
import type { PlayerTier } from '@/lib/supabase/database.types'

export type ActionResult = { ok: true; id?: string } | { ok: false; code: string }

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']
const JERSEY_NAME = /^[A-Z0-9 .'-]{2,10}$/

/**
 * Confirms the caller manages this team. Row level security would refuse the
 * write anyway; checking first lets us return a sentence instead of a
 * Postgres error.
 */
async function ownTeam(teamId: string) {
  const viewer = await getViewer()
  if (viewer.kind !== 'manager' || !viewer.teams.some((t) => t.id === teamId)) return null
  return viewer
}

/** Turns a Postgres error into one of the codes the UI knows how to say. */
function codeFrom(message: string): string {
  const known = [
    'MASISWA_QUOTA', 'STATE_QUOTA', 'ROSTER_FULL', 'COACH_QUOTA', 'MANAGER_QUOTA',
    'ROSTER_LOCKED', 'PAYMENT_NOT_APPROVED', 'COLOUR_TOO_CLOSE',
  ]
  const hit = known.find((k) => message.includes(k))
  if (hit) return hit
  if (message.includes('tm_one_person_per_comp')) return 'IC_ALREADY_REGISTERED'
  if (message.includes('tm_jersey_no_uniq')) return 'JERSEY_NO_TAKEN'
  if (message.includes('tm_jersey_name_uniq')) return 'JERSEY_NAME_TAKEN'
  if (message.includes('jersey_colour_uniq')) return 'COLOUR_TAKEN'
  if (message.includes('violates check constraint')) return 'INVALID'
  return 'UNKNOWN'
}

function refresh() {
  revalidatePath('/team', 'layout')
}

// ------------------------------------------------------------------ setup --
export async function completeSetup(input: {
  teamId: string
  captainName: string
  captainWhatsapp: string
  logoPath: string | null
}): Promise<ActionResult> {
  if (!(await ownTeam(input.teamId))) return { ok: false, code: 'FORBIDDEN' }
  const supabase = await supabaseServer()

  const { error } = await supabase
    .from('teams')
    .update({
      captain_name: input.captainName.trim(),
      captain_whatsapp: input.captainWhatsapp.trim(),
      ...(input.logoPath ? { logo_path: input.logoPath } : {}),
      terms_accepted_at: new Date().toISOString(),
    })
    .eq('id', input.teamId)

  if (error) return { ok: false, code: codeFrom(error.message) }
  refresh()
  return { ok: true }
}

// ---------------------------------------------------------------- members --
export type MemberInput = {
  id?: string
  teamId: string
  competitionId: string
  fullName: string
  icNo: string
  phone: string
  studentId: string
  course: string
  studyYear: string
  tier: PlayerTier
  isManager: boolean
  isCoach: boolean
  isCaptain: boolean
  isPlayer: boolean
  isNewPlayer: boolean
  jerseyNo: number | null
  jerseyName: string
  jerseySize: string
  photoPath: string | null
}

export async function saveMember(input: MemberInput): Promise<ActionResult> {
  const viewer = await ownTeam(input.teamId)
  if (!viewer) return { ok: false, code: 'FORBIDDEN' }

  const jerseyName = input.jerseyName.trim().toUpperCase()
  const ic = input.icNo.replace(/\D/g, '')

  if (input.fullName.trim().length < 2 || ic.length < 6 || ic.length > 14) return { ok: false, code: 'INVALID' }
  if (input.isPlayer) {
    if (input.jerseyNo === null || input.jerseyNo < 0 || input.jerseyNo > 99) return { ok: false, code: 'INVALID' }
    if (!JERSEY_NAME.test(jerseyName) || !SIZES.includes(input.jerseySize)) return { ok: false, code: 'INVALID' }
  }

  const supabase = await supabaseServer()

  // One captain per team: naming a new one quietly stands the old one down.
  if (input.isCaptain) {
    await supabase
      .from('team_members')
      .update({ is_captain: false })
      .eq('team_id', input.teamId)
      .neq('id', input.id ?? '00000000-0000-0000-0000-000000000000')
  }

  const row = {
    team_id: input.teamId,
    competition_id: input.competitionId,
    full_name: input.fullName.trim(),
    ic_no: input.icNo.trim(),
    phone: input.phone.trim(),
    student_id: input.studentId.trim(),
    course: input.course.trim(),
    study_year: input.studyYear.trim(),
    tier: input.tier,
    is_manager: input.isManager,
    is_coach: input.isCoach,
    is_captain: input.isPlayer && input.isCaptain,
    is_player: input.isPlayer,
    is_new_player: input.isNewPlayer,
    jersey_no: input.isPlayer ? input.jerseyNo : null,
    jersey_name: input.isPlayer ? jerseyName : null,
    jersey_size: input.isPlayer ? input.jerseySize : null,
    ...(input.photoPath ? { photo_path: input.photoPath } : {}),
  }

  if (input.id) {
    const { error } = await supabase.from('team_members').update(row).eq('id', input.id).eq('team_id', input.teamId)
    if (error) return { ok: false, code: codeFrom(error.message) }
    refresh()
    return { ok: true, id: input.id }
  }

  // Added by the manager directly, so no confirmation step is needed.
  const { data, error } = await supabase
    .from('team_members')
    .insert({ ...row, status: 'active', confirmed_at: new Date().toISOString(), confirmed_by: viewer.userId })
    .select('id')
    .single()

  if (error) return { ok: false, code: codeFrom(error.message) }
  refresh()
  return { ok: true, id: data.id }
}

export async function removeMember(teamId: string, memberId: string): Promise<ActionResult> {
  if (!(await ownTeam(teamId))) return { ok: false, code: 'FORBIDDEN' }
  const supabase = await supabaseServer()
  const { error } = await supabase.from('team_members').delete().eq('id', memberId).eq('team_id', teamId)
  if (error) return { ok: false, code: codeFrom(error.message) }
  refresh()
  return { ok: true }
}

/**
 * A submission from a player link becomes part of the roster only here. The
 * quota trigger runs at this moment, so a fourth Masiswa player is refused
 * on confirmation even if the link let them submit.
 */
export async function decideSubmission(teamId: string, memberId: string, accept: boolean): Promise<ActionResult> {
  const viewer = await ownTeam(teamId)
  if (!viewer) return { ok: false, code: 'FORBIDDEN' }
  const supabase = await supabaseServer()

  const { error } = await supabase
    .from('team_members')
    .update(
      accept
        ? { status: 'active', confirmed_at: new Date().toISOString(), confirmed_by: viewer.userId }
        : { status: 'declined' },
    )
    .eq('id', memberId)
    .eq('team_id', teamId)
    .eq('status', 'pending')

  if (error) return { ok: false, code: codeFrom(error.message) }
  refresh()
  return { ok: true }
}

// ----------------------------------------------------------- invite links --
export async function createLink(teamId: string, kind: 'shared' | 'single', label: string): Promise<ActionResult> {
  const viewer = await ownTeam(teamId)
  if (!viewer) return { ok: false, code: 'FORBIDDEN' }
  const supabase = await supabaseServer()

  // 10 characters from [a-z0-9]: about 52 bits, not guessable.
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const token = Array.from(randomBytes(10), (b) => alphabet[b % alphabet.length]).join('')

  const { data, error } = await supabase
    .from('invite_links')
    .insert({
      team_id: teamId,
      token,
      kind,
      label: label.trim(),
      max_uses: kind === 'single' ? 1 : null,
      created_by: viewer.userId,
    })
    .select('id')
    .single()

  if (error) return { ok: false, code: codeFrom(error.message) }
  refresh()
  return { ok: true, id: data.id }
}

export async function revokeLink(teamId: string, linkId: string): Promise<ActionResult> {
  if (!(await ownTeam(teamId))) return { ok: false, code: 'FORBIDDEN' }
  const supabase = await supabaseServer()
  const { error } = await supabase
    .from('invite_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', linkId)
    .eq('team_id', teamId)
  if (error) return { ok: false, code: codeFrom(error.message) }
  refresh()
  return { ok: true }
}

// ---------------------------------------------------------------- payment --
export async function submitPayment(input: {
  teamId: string
  reference: string
  receiptPath: string | null
  refundBank: string
  refundHolder: string
  refundAccount: string
}): Promise<ActionResult> {
  if (!(await ownTeam(input.teamId))) return { ok: false, code: 'FORBIDDEN' }
  if (!input.reference.trim() || !input.receiptPath) return { ok: false, code: 'INVALID' }
  if (!input.refundBank || !input.refundHolder.trim() || !/^\d{6,20}$/.test(input.refundAccount.replace(/\s/g, ''))) {
    return { ok: false, code: 'INVALID' }
  }

  const supabase = await supabaseServer()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('payments')
    .update({
      reference_no: input.reference.trim(),
      receipt_path: input.receiptPath,
      refund_bank: input.refundBank,
      refund_holder: input.refundHolder.trim().toUpperCase(),
      refund_account: input.refundAccount.replace(/\s/g, ''),
      refund_saved_at: now,
      submitted_at: now,
      status: 'pending',
    })
    .eq('team_id', input.teamId)

  if (error) return { ok: false, code: codeFrom(error.message) }
  refresh()
  revalidatePath('/admin')
  return { ok: true }
}

// ----------------------------------------------------------------- colour --
export async function claimColour(input: {
  teamId: string
  competitionId: string
  hex: string
  nameEn: string
  nameZh: string
  isCustom: boolean
}): Promise<ActionResult> {
  if (!(await ownTeam(input.teamId))) return { ok: false, code: 'FORBIDDEN' }
  if (!/^#[0-9a-fA-F]{6}$/.test(input.hex) || input.nameEn.trim().length < 2) return { ok: false, code: 'INVALID' }

  const supabase = await supabaseServer()
  const { error } = await supabase.from('jersey_colours').insert({
    competition_id: input.competitionId,
    team_id: input.teamId,
    hex: input.hex.toUpperCase(),
    name_en: input.nameEn.trim(),
    name_zh: input.nameZh.trim(),
    is_custom: input.isCustom,
  })

  if (error) return { ok: false, code: codeFrom(error.message) }
  refresh()
  revalidatePath('/admin')
  return { ok: true }
}

export async function saveDesign(teamId: string, designPath: string | null, note: string): Promise<ActionResult> {
  if (!(await ownTeam(teamId))) return { ok: false, code: 'FORBIDDEN' }
  const supabase = await supabaseServer()
  const { error } = await supabase
    .from('jersey_colours')
    .update({ ...(designPath ? { design_path: designPath } : {}), design_note: note.trim() })
    .eq('team_id', teamId)
  if (error) return { ok: false, code: codeFrom(error.message) }
  refresh()
  return { ok: true }
}
