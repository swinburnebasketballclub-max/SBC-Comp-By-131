'use server'

import { revalidatePath } from 'next/cache'

import { supabaseServer } from '@/lib/supabase/server'
import { getViewer } from '@/lib/session'
import type { AdminRole } from '@/lib/supabase/database.types'

export type Result = { ok: true; message: string } | { ok: false; error: string }

/** Every action re-checks the role. A hidden button is not a permission. */
async function requireSuper() {
  const viewer = await getViewer()
  if (viewer.kind !== 'admin' || viewer.admin.role !== 'super') {
    throw new Error('FORBIDDEN')
  }
  return viewer
}

const CREST_COLOURS = [
  '#E2578C', '#2457C5', '#3FBE87', '#F07C1E', '#7B3FBF',
  '#4FC3E8', '#D62828', '#C6C7CB', '#152A4E', '#7A1F2B',
]

export async function createTeam(_prev: Result | null, form: FormData): Promise<Result> {
  await requireSuper()
  const supabase = await supabaseServer()

  const name = String(form.get('name') ?? '').trim()
  const managerName = String(form.get('manager_name') ?? '').trim()
  const managerEmail = String(form.get('manager_email') ?? '').trim().toLowerCase()
  const captainWa = String(form.get('captain_whatsapp') ?? '').trim()
  const competitionId = String(form.get('competition_id') ?? '')

  if (name.length < 2) return { ok: false, error: 'TEAM_NAME_TOO_SHORT' }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(managerEmail)) return { ok: false, error: 'EMAIL_INVALID' }

  // The competition cap is a club rule, not a database constraint, so it is
  // checked here — and again by the form, which hides itself when full.
  const { count } = await supabase
    .from('teams')
    .select('id', { count: 'exact', head: true })
    .eq('competition_id', competitionId)

  const { data: comp } = await supabase
    .from('competitions')
    .select('max_teams')
    .eq('id', competitionId)
    .single()

  if (comp && (count ?? 0) >= comp.max_teams) return { ok: false, error: 'COMPETITION_FULL' }

  const { error } = await supabase.from('teams').insert({
    competition_id: competitionId,
    name,
    manager_email: managerEmail,
    manager_name: managerName,
    captain_whatsapp: captainWa,
    crest_color: CREST_COLOURS[(count ?? 0) % CREST_COLOURS.length]!,
  })

  if (error) {
    if (error.message.includes('teams_name_uniq')) return { ok: false, error: 'TEAM_NAME_TAKEN' }
    if (error.message.includes('teams_manager_uniq')) return { ok: false, error: 'MANAGER_ALREADY_HAS_TEAM' }
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/teams')
  revalidatePath('/admin')
  return { ok: true, message: 'TEAM_CREATED' }
}

export async function changeManager(_prev: Result | null, form: FormData): Promise<Result> {
  await requireSuper()
  const supabase = await supabaseServer()

  const teamId = String(form.get('team_id') ?? '')
  const email = String(form.get('manager_email') ?? '').trim().toLowerCase()
  const name = String(form.get('manager_name') ?? '').trim()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: 'EMAIL_INVALID' }

  // Unbinding the old account is what actually removes their access; the
  // roster and everything attached to it stays exactly where it is.
  const { error } = await supabase
    .from('teams')
    .update({
      manager_email: email,
      manager_name: name,
      manager_user_id: null,
      manager_status: 'invited',
      invited_at: new Date().toISOString(),
    })
    .eq('id', teamId)

  if (error) {
    if (error.message.includes('teams_manager_uniq')) return { ok: false, error: 'MANAGER_ALREADY_HAS_TEAM' }
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/teams')
  return { ok: true, message: 'MANAGER_CHANGED' }
}

export async function setManagerStatus(teamId: string, disabled: boolean): Promise<Result> {
  await requireSuper()
  const supabase = await supabaseServer()

  const { data: team } = await supabase
    .from('teams')
    .select('manager_user_id')
    .eq('id', teamId)
    .single()

  const { error } = await supabase
    .from('teams')
    .update({
      manager_status: disabled ? 'disabled' : team?.manager_user_id ? 'active' : 'invited',
    })
    .eq('id', teamId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/teams')
  return { ok: true, message: disabled ? 'MANAGER_DISABLED' : 'MANAGER_ENABLED' }
}

/**
 * Locking is how T&C 9 — no changes after the deadline — is enforced.
 * Unlocking opens a 48 hour window that closes itself, so nobody has to
 * remember to lock it again.
 */
export async function setLock(teamId: string, lock: boolean): Promise<Result> {
  await requireSuper()
  const supabase = await supabaseServer()

  const patch = lock
    ? { locked_at: new Date().toISOString(), edit_window_until: null }
    : { edit_window_until: new Date(Date.now() + 48 * 3600 * 1000).toISOString() }

  const { error } = await supabase.from('teams').update(patch).eq('id', teamId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/teams')
  revalidatePath('/admin')
  return { ok: true, message: lock ? 'ROSTER_LOCKED' : 'EDIT_WINDOW_OPEN' }
}

export async function inviteAdmin(_prev: Result | null, form: FormData): Promise<Result> {
  await requireSuper()
  const supabase = await supabaseServer()

  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const name = String(form.get('full_name') ?? '').trim()
  const role = String(form.get('role') ?? 'finance') as AdminRole

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: 'EMAIL_INVALID' }
  if (!['super', 'finance', 'fixtures'].includes(role)) return { ok: false, error: 'ROLE_INVALID' }

  const { data: existing } = await supabase.from('admins').select('id').eq('email', email).maybeSingle()
  if (existing) return { ok: false, error: 'ALREADY_ADMIN' }

  const { error } = await supabase
    .from('admin_invites')
    .upsert({ email, full_name: name, role, claimed_at: null }, { onConflict: 'email' })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/teams')
  return { ok: true, message: 'ADMIN_INVITED' }
}

// ------------------------------------------------------ organiser accounts --
function adminError(message: string): Result {
  if (message.includes('LAST_SUPER')) return { ok: false, error: 'LAST_SUPER' }
  return { ok: false, error: message }
}

export async function setAdminRole(adminId: string, role: AdminRole): Promise<Result> {
  await requireSuper()
  if (!['super', 'finance', 'fixtures'].includes(role)) return { ok: false, error: 'ROLE_INVALID' }
  const supabase = await supabaseServer()
  const { error } = await supabase.from('admins').update({ role }).eq('id', adminId)
  if (error) return adminError(error.message)
  revalidatePath('/admin', 'layout')
  return { ok: true, message: 'ADMIN_ROLE_CHANGED' }
}

export async function removeAdmin(adminId: string): Promise<Result> {
  const viewer = await requireSuper()
  // Removing yourself by accident locks you out mid-competition.
  if (adminId === viewer.userId) return { ok: false, error: 'CANNOT_REMOVE_SELF' }
  const supabase = await supabaseServer()
  const { error } = await supabase.from('admins').delete().eq('id', adminId)
  if (error) return adminError(error.message)
  revalidatePath('/admin', 'layout')
  return { ok: true, message: 'ADMIN_REMOVED' }
}

export async function cancelInvite(email: string): Promise<Result> {
  await requireSuper()
  const supabase = await supabaseServer()
  const { error } = await supabase.from('admin_invites').delete().eq('email', email).is('claimed_at', null)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/teams')
  return { ok: true, message: 'INVITE_CANCELLED' }
}
