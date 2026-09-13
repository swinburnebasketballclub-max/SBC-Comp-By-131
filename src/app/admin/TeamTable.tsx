'use client'

import { useEffect, useState, useTransition } from 'react'

import { reviewColour, reviewPayment, type ReviewResult } from './review-actions'

export type Row = {
  id: string
  name: string
  crest: string
  initials: string
  managerName: string
  managerStatus: 'invited' | 'active' | 'disabled'
  players: number
  masiswa: number
  maxMasiswa: number
  breaches: string[]
  locked: boolean
  payment: null | {
    status: 'none' | 'pending' | 'approved' | 'rejected'
    base: string
    deposit: string
    total: string
    allNew: boolean
    reference: string
    receiptUrl: string | null
    submittedAt: string
    reviewedAt: string
    rejectReason: string
    refundBank: string
    refundHolder: string
    refundAccount: string
  }
  colour: null | {
    status: 'pending' | 'approved' | 'rejected'
    hex: string
    name: string
    isCustom: boolean
    claimedAt: string
    order: number
    ofTotal: number
    designUrl: string | null
    designNote: string
  }
}

type Props = {
  rows: Row[]
  canReviewPayments: boolean
  canReviewColours: boolean
  locale: 'en' | 'zh'
  t: Record<string, string>
}

const MESSAGES: Record<string, { en: string; zh: string }> = {
  PAYMENT_APPROVED: { en: 'Payment approved — colour selection is now open for this team.', zh: '已批准 —— 这一队现在可以选球衣颜色了。' },
  PAYMENT_RETURNED: { en: 'Payment returned. The manager sees your reason.', zh: '已退回，经理会看到退回原因。' },
  COLOUR_CONFIRMED: { en: 'Colour confirmed.', zh: '颜色已确认。' },
  COLOUR_RETURNED:  { en: 'Colour returned and freed for other teams.', zh: '已退回，颜色释放给其他队。' },
  NOT_SUBMITTED:    { en: 'Nothing has been submitted to review.', zh: '还没有东西可以审核。' },
  REASON_REQUIRED:  { en: 'Give the manager a reason so they know what to fix.', zh: '请写退回原因，经理才知道要改什么。' },
  FORBIDDEN:        { en: 'Your organiser role cannot do this.', zh: '你的 Admin 权限不能做这件事。' },
}

export function TeamTable({ rows, canReviewPayments, canReviewColours, locale, t }: Props) {
  const [open, setOpen] = useState<null | { kind: 'payment' | 'colour'; id: string }>(null)
  const row = open ? rows.find((r) => r.id === open.id) ?? null : null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const payTag = (s: NonNullable<Row['payment']>['status'] | undefined) =>
    ({
      none: ['t-mute', t.payNone],
      pending: ['t-warn', t.payPending],
      approved: ['t-ok', t.payApproved],
      rejected: ['t-crit', t.payRejected],
    })[s ?? 'none'] as [string, string]

  const colTag = (s: NonNullable<Row['colour']>['status']) =>
    ({
      pending: ['t-warn', t.colPending],
      approved: ['t-ok', t.colApproved],
      rejected: ['t-crit', t.colRejected],
    })[s] as [string, string]

  return (
    <>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>{t.teams}</th>
              <th>{t.colManager}</th>
              <th className="right">{t.colPlayers}</th>
              <th className="right">{t.colMasiswa}</th>
              <th>{t.colRules}</th>
              <th className="right">{t.colFee}</th>
              <th>{t.colPayment}</th>
              <th>{t.colColour}</th>
              <th>{t.colLocked}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const [payCls, payLabel] = payTag(r.payment?.status)
              const payReviewable = canReviewPayments && r.payment && r.payment.status !== 'none'
              return (
                <tr key={r.id}>
                  <td>
                    <span className="who">
                      <span className="crest" style={{ background: r.crest }}>{r.initials}</span>
                      <b>{r.name}</b>
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>
                    {r.managerName}
                    <div className="sub">
                      {r.managerStatus === 'active' ? t.mgrActive : r.managerStatus === 'invited' ? t.mgrInvited : t.mgrDisabled}
                    </div>
                  </td>
                  <td className="right num">{r.players}</td>
                  <td className="right num" style={{ color: r.masiswa > r.maxMasiswa ? 'var(--crit)' : undefined }}>
                    {r.masiswa}
                  </td>
                  <td>
                    {r.breaches.length === 0 ? (
                      <span className="tag t-ok">{t.rulesPass}</span>
                    ) : (
                      <span className="tag t-crit" title={r.breaches.join(' · ')}>
                        {r.breaches.length} {t.rulesFail}
                      </span>
                    )}
                  </td>
                  <td className="right num">
                    {r.payment ? r.payment.total : '—'}
                    {r.payment?.allNew && <div className="sub">{t.allNewTeam}</div>}
                  </td>

                  <td>
                    {payReviewable ? (
                      <button className="cell-btn" onClick={() => setOpen({ kind: 'payment', id: r.id })}>
                        <span className={`tag ${payCls}`}>{payLabel}</span>
                        <span className="cell-arrow" aria-hidden>›</span>
                      </button>
                    ) : (
                      <span className={`tag ${payCls}`}>{payLabel}</span>
                    )}
                  </td>

                  <td>
                    {r.colour ? (
                      canReviewColours ? (
                        <button className="cell-btn" onClick={() => setOpen({ kind: 'colour', id: r.id })}>
                          <span className="swatch" style={{ background: r.colour.hex }} />
                          <span style={{ fontSize: 12.5 }}>{r.colour.name}</span>
                          <span className={`tag ${colTag(r.colour.status)[0]}`}>{colTag(r.colour.status)[1]}</span>
                          <span className="cell-arrow" aria-hidden>›</span>
                        </button>
                      ) : (
                        <span className="who" style={{ gap: 6 }}>
                          <span className="swatch" style={{ background: r.colour.hex }} />
                          <span style={{ fontSize: 12.5 }}>{r.colour.name}</span>
                          <span className={`tag ${colTag(r.colour.status)[0]}`}>{colTag(r.colour.status)[1]}</span>
                        </span>
                      )
                    ) : (
                      <span className="sub">
                        {r.payment?.status === 'approved' ? t.colNotSet : t.colLockedOut}
                      </span>
                    )}
                  </td>

                  <td>
                    <span className={`tag ${r.locked ? 't-ok' : 't-mute'}`}>
                      {r.locked ? t.lockedYes : t.lockedNo}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {row && open && (
        <Drawer onClose={() => setOpen(null)} title={open.kind === 'payment' ? t.reviewPayment : t.reviewColour} team={row} t={t}>
          {open.kind === 'payment' ? (
            <PaymentReview row={row} locale={locale} t={t} onDone={() => setOpen(null)} />
          ) : (
            <ColourReview row={row} locale={locale} t={t} onDone={() => setOpen(null)} />
          )}
        </Drawer>
      )}
    </>
  )
}

// ---------------------------------------------------------------- drawer --
function Drawer({
  title, team, t, onClose, children,
}: { title: string; team: Row; t: Record<string, string>; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <header className="drawer-h">
          <div>
            <div className="eyebrow">{title}</div>
            <div className="who">
              <span className="crest" style={{ background: team.crest }}>{team.initials}</span>
              <b style={{ fontSize: 18 }}>{team.name}</b>
            </div>
          </div>
          <button className="btn btn-sm" onClick={onClose}>{t.close} ✕</button>
        </header>
        <div className="drawer-b">{children}</div>
      </aside>
    </>
  )
}

function Line({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="kv">
      <span className="k">{k}</span>
      <span className={mono ? 'v num' : 'v'}>{v}</span>
    </div>
  )
}

function useReview(locale: 'en' | 'zh', onDone: () => void) {
  const [pending, start] = useTransition()
  const [result, setResult] = useState<ReviewResult | null>(null)

  function run(fn: () => Promise<ReviewResult>) {
    start(async () => {
      const r = await fn()
      setResult(r)
      if (r.ok) setTimeout(onDone, 1100)
    })
  }

  const message = result
    ? MESSAGES[result.ok ? result.message : result.error]?.[locale] ?? (result.ok ? result.message : result.error)
    : null

  return { pending, result, message, run }
}

// ------------------------------------------------------- payment review --
function PaymentReview({ row, locale, t, onDone }: { row: Row; locale: 'en' | 'zh'; t: Record<string, string>; onDone: () => void }) {
  const p = row.payment
  const [reason, setReason] = useState(p?.rejectReason ?? '')
  const { pending, result, message, run } = useReview(locale, onDone)

  if (!p || p.status === 'none') return <div className="note">{t.nothingSubmitted}</div>

  const [cls, label] = ({
    pending: ['t-warn', t.payPending],
    approved: ['t-ok', t.payApproved],
    rejected: ['t-crit', t.payRejected],
    none: ['t-mute', t.payNone],
  } as Record<string, [string, string]>)[p.status]!

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className={`tag ${cls}`}>{label}</span>
        <span className="sub">{t.submittedAt} {p.submittedAt}</span>
      </div>

      <section className="panel">
        <div className="panel-h"><h3>{t.amountDue}</h3></div>
        <div className="panel-b stack" style={{ gap: 2 }}>
          <Line k={p.allNew ? `${t.entryFee} · ${t.allNewTeam}` : `${t.entryFee} · ${row.masiswa} Masiswa`} v={p.base} mono />
          <Line k={t.depositLabel} v={p.deposit} mono />
          <div className="kv total"><span className="k">{t.amountDue}</span><span className="v num">{p.total}</span></div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-h"><h3>{t.receipt}</h3></div>
        <div className="panel-b stack" style={{ gap: 12 }}>
          <Line k={t.reference} v={p.reference || '—'} mono />
          {p.receiptUrl ? (
            <a className="receipt" href={p.receiptUrl} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.receiptUrl} alt={t.receipt} />
              <span className="btn btn-sm">{t.openReceipt} ↗</span>
            </a>
          ) : (
            <div className="note warn">{t.noReceipt}</div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-h"><h3>{t.refundAccount}</h3></div>
        <div className="panel-b stack" style={{ gap: 2 }}>
          {p.refundAccount ? (
            <>
              <Line k="Bank" v={p.refundBank} />
              <Line k="Holder" v={p.refundHolder} />
              <Line k="Account" v={p.refundAccount} mono />
            </>
          ) : (
            <p className="sub">{t.notProvided}</p>
          )}
        </div>
      </section>

      <div className="note">{t.payApproveNote}</div>

      <label className="field">
        <span>{t.returnReason}</span>
        <textarea
          className="inp"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={locale === 'zh' ? '例：金额少了 RM80，请补转差额后重新上传' : 'e.g. RM 80 short — transfer the difference and upload again'}
        />
      </label>

      {message && <div className={`note ${result?.ok ? 'ok' : 'crit'}`}>{message}</div>}

      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" disabled={pending} onClick={() => run(() => reviewPayment(row.id, 'reject', reason))}>
          {t.returnIt}
        </button>
        <button
          className="btn btn-primary"
          disabled={pending || p.status === 'approved'}
          onClick={() => run(() => reviewPayment(row.id, 'approve'))}
        >
          {pending ? t.working : t.approve}
        </button>
      </div>
    </div>
  )
}

// -------------------------------------------------------- colour review --
function ColourReview({ row, locale, t, onDone }: { row: Row; locale: 'en' | 'zh'; t: Record<string, string>; onDone: () => void }) {
  const c = row.colour
  const { pending, result, message, run } = useReview(locale, onDone)
  if (!c) return null

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="colour-hero">
        <span className="colour-big" style={{ background: c.hex }} />
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800 }}>{c.name}</div>
          <div className="num sub">{c.hex.toUpperCase()}{c.isCustom ? ` · ${t.customColour}` : ''}</div>
        </div>
      </div>

      <section className="panel">
        <div className="panel-b stack" style={{ gap: 2 }}>
          <Line k={t.claimOrder} v={<><b style={{ color: c.order === 1 ? 'var(--gold)' : undefined }}>#{c.order}</b> / {c.ofTotal}</>} mono />
          <Line k={t.claimedAt} v={c.claimedAt} mono />
        </div>
      </section>

      <section className="panel">
        <div className="panel-h"><h3>{t.design}</h3></div>
        <div className="panel-b stack" style={{ gap: 10 }}>
          {c.designUrl ? (
            <a className="receipt" href={c.designUrl} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.designUrl} alt={t.design} />
              <span className="btn btn-sm">{t.openDesign} ↗</span>
            </a>
          ) : (
            <p className="sub">{t.noDesign}</p>
          )}
          {c.designNote && <p style={{ color: 'var(--text-2)', fontSize: 13.5 }}>{c.designNote}</p>}
        </div>
      </section>

      <div className="note">{t.colourReturnNote}</div>

      {message && <div className={`note ${result?.ok ? 'ok' : 'crit'}`}>{message}</div>}

      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" disabled={pending} onClick={() => run(() => reviewColour(row.id, 'reject'))}>
          {t.returnColour}
        </button>
        <button
          className="btn btn-primary"
          disabled={pending || c.status === 'approved'}
          onClick={() => run(() => reviewColour(row.id, 'approve'))}
        >
          {pending ? t.working : t.confirmColour}
        </button>
      </div>
    </div>
  )
}
