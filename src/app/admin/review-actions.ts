'use server'

import { revalidatePath } from 'next/cache'

import { getViewer } from '@/lib/session'
import { supabaseServer } from '@/lib/supabase/server'

export type ReviewResult = { ok: true; message: string } | { ok: false; error: string }

/**
 * Payments can be reviewed by super and finance organisers; colours only by
 * super. The overview hides the buttons for everyone else, but the check that
 * counts is this one.
 */
async function requireRole(allowed: ('super' | 'finance' | 'fixtures')[]) {
  const viewer = await getViewer()
  if (viewer.kind !== 'admin' || !allowed.includes(viewer.admin.role)) return null
  return viewer
}

export async function reviewPayment(
  teamId: string,
  decision: 'approve' | 'reject',
  reason = '',
): Promise<ReviewResult> {
  const viewer = await requireRole(['super', 'finance'])
  if (!viewer) return { ok: false, error: 'FORBIDDEN' }

  const supabase = await supabaseServer()

  const { data: payment } = await supabase
    .from('payments')
    .select('status')
    .eq('team_id', teamId)
    .maybeSingle()

  // Nothing to judge until a manager has actually sent a receipt.
  if (!payment || payment.status === 'none') return { ok: false, error: 'NOT_SUBMITTED' }
  if (decision === 'reject' && reason.trim().length < 3) return { ok: false, error: 'REASON_REQUIRED' }

  const { error } = await supabase
    .from('payments')
    .update({
      status: decision === 'approve' ? 'approved' : 'rejected',
      reject_reason: decision === 'approve' ? '' : reason.trim(),
      reviewed_at: new Date().toISOString(),
      reviewed_by: viewer.userId,
    })
    .eq('team_id', teamId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin')
  return { ok: true, message: decision === 'approve' ? 'PAYMENT_APPROVED' : 'PAYMENT_RETURNED' }
}

export async function reviewColour(
  teamId: string,
  decision: 'approve' | 'reject',
): Promise<ReviewResult> {
  const viewer = await requireRole(['super'])
  if (!viewer) return { ok: false, error: 'FORBIDDEN' }

  const supabase = await supabaseServer()

  if (decision === 'approve') {
    const { error } = await supabase
      .from('jersey_colours')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: viewer.userId })
      .eq('team_id', teamId)
    if (error) return { ok: false, error: error.message }
  } else {
    // A team holds at most one colour row. Removing it — rather than marking it
    // rejected — frees the colour for everyone else and lets this team claim
    // again, which a lingering rejected row would block.
    const { error } = await supabase.from('jersey_colours').delete().eq('team_id', teamId)
    if (error) return { ok: false, error: error.message }
  }

  revalidatePath('/admin')
  return { ok: true, message: decision === 'approve' ? 'COLOUR_CONFIRMED' : 'COLOUR_RETURNED' }
}
