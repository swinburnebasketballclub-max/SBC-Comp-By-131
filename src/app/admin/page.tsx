import Link from 'next/link'
import { redirect } from 'next/navigation'

import { activeCompetition, initials, teamSummaries } from '@/lib/competition'
import { day, daysUntil, money, stamp } from '@/lib/format'
import { pick, type Key } from '@/lib/i18n/dict'
import { translator } from '@/lib/i18n/server'
import { getViewer } from '@/lib/session'
import { supabaseServer } from '@/lib/supabase/server'
import { TeamTable, type Row } from './TeamTable'

export const metadata = { title: 'Overview' }
export const dynamic = 'force-dynamic'

const T_KEYS = [
  'teams', 'colManager', 'colPlayers', 'colMasiswa', 'colRules', 'colFee', 'colPayment', 'colColour', 'colLocked',
  'rulesPass', 'rulesFail', 'mgrActive', 'mgrInvited', 'mgrDisabled', 'lockedYes', 'lockedNo',
  'payNone', 'payPending', 'payApproved', 'payRejected',
  'colPending', 'colApproved', 'colRejected', 'colNotSet', 'colLockedOut', 'allNewTeam',
  'reviewPayment', 'reviewColour', 'entryFee', 'depositLabel', 'amountDue', 'reference', 'receipt',
  'openReceipt', 'noReceipt', 'refundAccount', 'notProvided', 'submittedAt', 'approve', 'returnIt',
  'returnReason', 'payApproveNote', 'nothingSubmitted', 'claimOrder', 'claimedAt', 'customColour',
  'design', 'openDesign', 'noDesign', 'confirmColour', 'returnColour', 'colourReturnNote', 'close', 'working', 'openRoster',
] as const satisfies readonly Key[]

/** Private files are reachable only through a short-lived signed link. */
const LINK_TTL = 60 * 30

export default async function Overview() {
  const viewer = await getViewer()
  if (viewer.kind !== 'admin') redirect('/no-access')

  const tr = await translator()
  const comp = await activeCompetition()

  if (!comp) {
    return (
      <>
        <header className="page-head"><h1>{tr('navOverview')}</h1></header>
        <div className="note">{tr('noCompetition')}</div>
      </>
    )
  }

  const teams = await teamSummaries(comp)
  const supabase = await supabaseServer()

  const role = viewer.admin.role
  const canReviewPayments = role === 'super' || role === 'finance'
  const canReviewColours = role === 'super'

  // Claim order is first come, first served across the whole competition.
  const claimOrder = teams
    .filter((t) => t.colour && t.colour.status !== 'rejected')
    .sort((a, b) => a.colour!.claimed_at.localeCompare(b.colour!.claimed_at))
    .map((t) => t.team.id)

  async function signed(bucket: string, path: string | null) {
    if (!path) return null
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, LINK_TTL)
    return data?.signedUrl ?? null
  }

  const rows: Row[] = await Promise.all(
    teams.map(async (t) => ({
      id: t.team.id,
      name: t.team.name,
      crest: t.team.crest_color,
      initials: initials(t.team.name),
      managerName: t.team.manager_name || t.team.manager_email,
      managerStatus: t.team.manager_status,
      players: t.players,
      masiswa: t.masiswa,
      maxMasiswa: comp.max_masiswa,
      breaches: t.breaches,
      locked: Boolean(t.team.locked_at),
      payment: t.payment && {
        status: t.payment.status,
        base: money(t.payment.base_cents),
        deposit: money(t.payment.deposit_cents),
        total: money(t.payment.total_cents ?? t.payment.base_cents + t.payment.deposit_cents),
        allNew: t.payment.tier_key === 'all_new',
        reference: t.payment.reference_no,
        receiptUrl: canReviewPayments ? await signed('receipts', t.payment.receipt_path) : null,
        submittedAt: stamp(t.payment.submitted_at),
        reviewedAt: stamp(t.payment.reviewed_at),
        rejectReason: t.payment.reject_reason,
        refundBank: t.payment.refund_bank,
        refundHolder: t.payment.refund_holder,
        refundAccount: t.payment.refund_account,
      },
      colour: t.colour && {
        status: t.colour.status,
        hex: t.colour.hex,
        name: tr.locale === 'zh' && t.colour.name_zh ? t.colour.name_zh : t.colour.name_en,
        isCustom: t.colour.is_custom,
        claimedAt: stamp(t.colour.claimed_at),
        order: claimOrder.indexOf(t.team.id) + 1,
        ofTotal: claimOrder.length,
        designUrl: canReviewColours ? await signed('jersey-designs', t.colour.design_path) : null,
        designNote: t.colour.design_note,
      },
    })),
  )

  const valid = teams.filter((t) => t.breaches.length === 0).length
  const awaiting = teams.filter((t) => t.payment?.status === 'pending').length
  const coloursPending = teams.filter((t) => t.colour?.status === 'pending').length
  const coloursOk = teams.filter((t) => t.colour?.status === 'approved').length
  const locked = teams.filter((t) => t.team.locked_at).length
  const left = daysUntil(comp.registration_deadline)

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">
          {comp.season} · {pick(comp, 'venue', tr.locale)} · {day(comp.starts_on)} – {day(comp.ends_on)}
        </div>
        <h1>{pick(comp, 'name', tr.locale)}</h1>
      </header>

      <div className="meta-strip">
        <div className="meta-cell">
          <div className="k">{tr('ovRegistered')}</div>
          <div className="v num">{teams.length} / {comp.max_teams}</div>
        </div>
        <div className="meta-cell">
          <div className="k">{tr('ovCompliant')}</div>
          <div className="v num">{valid} / {teams.length}</div>
        </div>
        <div className="meta-cell">
          <div className="k">{tr('ovAwaitingPay')}</div>
          <div className="v num" style={{ color: awaiting ? 'var(--warn)' : undefined }}>{awaiting}</div>
        </div>
        <div className="meta-cell">
          <div className="k">{tr('ovColoursSet')}</div>
          <div className="v num">
            {coloursOk} / {teams.length}
            {coloursPending > 0 && <small style={{ color: 'var(--warn)' }}>{coloursPending} {tr('colPending')}</small>}
          </div>
        </div>
        <div className="meta-cell">
          <div className="k">{tr('ovLocked')}</div>
          <div className="v num">{locked} / {teams.length}</div>
        </div>
        <div className="meta-cell">
          <div className="k">{tr('ovDaysLeft')}</div>
          <div className="v num" style={{ color: left <= 7 ? 'var(--pink)' : undefined }}>
            {left < 0 ? tr('ovClosed') : left}
            <small>{day(comp.registration_deadline)}</small>
          </div>
        </div>
      </div>

      <section className="panel">
        <div className="panel-h">
          <h2>{tr('teamStatus')}</h2>
          <div className="row" style={{ gap: 12 }}>
            {(canReviewPayments || canReviewColours) && teams.length > 0 && (
              <span className="hint">👉 {tr('clickToReview')}</span>
            )}
            {role === 'super' && <Link className="btn btn-sm" href="/admin/teams">{tr('navTeams')}</Link>}
          </div>
        </div>

        {teams.length === 0 ? (
          <div className="panel-b"><p className="hint">{tr('noTeamsYet')}</p></div>
        ) : (
          <TeamTable
            rows={rows}
            canReviewPayments={canReviewPayments}
            canReviewColours={canReviewColours}
            canOpenRoster={role === 'super'}
            locale={tr.locale}
            t={Object.fromEntries(T_KEYS.map((k) => [k, tr(k)]))}
          />
        )}
      </section>
    </>
  )
}
