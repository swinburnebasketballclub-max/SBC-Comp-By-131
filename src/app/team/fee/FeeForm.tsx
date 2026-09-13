'use client'

import { useState, useTransition } from 'react'

import { Upload } from '@/components/Upload'
import { errorText, type Strings } from '@/lib/i18n/dict'
import type { PaymentStatus } from '@/lib/supabase/database.types'
import { submitPayment } from '../actions'

const BANKS = [
  'Maybank', 'CIMB Bank', 'Public Bank', 'RHB Bank', 'Hong Leong Bank', 'AmBank',
  'Bank Islam', 'Bank Rakyat', 'BSN', 'Alliance Bank', 'OCBC', 'UOB', 'Ryt Bank', 'GXBank',
]

type Props = {
  teamId: string
  teamName: string
  status: PaymentStatus
  rejectReason: string
  base: string
  deposit: string
  total: string
  tierLabel: string
  bank: { name: string; holder: string; account: string }
  qrUrl: string
  reference: string
  receiptUrl: string | null
  refund: { bank: string; holder: string; account: string }
  editable: boolean
  s: Strings
}

export function FeeForm(p: Props) {
  const { s } = p
  const locked = p.status === 'pending' || p.status === 'approved' || !p.editable

  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [reference, setReference] = useState(p.reference)
  const [receiptPath, setReceiptPath] = useState<string | null>(null)
  const [refundBank, setRefundBank] = useState(p.refund.bank)
  const [refundHolder, setRefundHolder] = useState(p.refund.holder)
  const [refundAccount, setRefundAccount] = useState(p.refund.account)

  function submit() {
    setError(null)
    start(async () => {
      const r = await submitPayment({
        teamId: p.teamId,
        reference,
        receiptPath,
        refundBank,
        refundHolder,
        refundAccount,
      })
      if (!r.ok) setError(errorText(r.code, s))
    })
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      {p.status === 'pending' && <div className="note warn">⏳ {s.payPendingNote}</div>}
      {p.status === 'approved' && <div className="note ok">✓ {s.payApprovedNote}</div>}
      {p.status === 'rejected' && (
        <div className="note crit">
          <span><b>{s.payRejectedNote}</b> {p.rejectReason}</span>
        </div>
      )}

      <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
        <section className="panel">
          <div className="panel-h"><h2>{s.amountDue}</h2></div>
          <div className="panel-b stack" style={{ gap: 2 }}>
            <div className="kv"><span className="k">{s.entryFee}{p.tierLabel ? ` · ${p.tierLabel}` : ''}</span><span className="v num">{p.base}</span></div>
            <div className="kv"><span className="k">{s.depositLabel}</span><span className="v num">{p.deposit}</span></div>
            <div className="kv total"><span className="k">{s.amountDue}</span><span className="v num">{p.total}</span></div>
            {p.status === 'none' && <p className="hint" style={{ marginTop: 10 }}>{s.feeChangesNote}</p>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-h"><h2>{s.payTo}</h2></div>
          <div className="panel-b row" style={{ gap: 16, alignItems: 'flex-start' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.qrUrl} alt="DuitNow QR" style={{ width: 170, borderRadius: 8, border: '1px solid var(--line)' }} />
            <div className="stack" style={{ gap: 2, flex: 1, minWidth: 190 }}>
              <div className="kv"><span className="k">{s.bankName}</span><span className="v">{p.bank.name}</span></div>
              <div className="kv"><span className="k">{s.bankHolder}</span><span className="v">{p.bank.holder}</span></div>
              <div className="kv">
                <span className="k">{s.bankAccount}</span>
                <span className="v num">
                  {p.bank.account}{' '}
                  <button
                    className="btn btn-sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(p.bank.account).catch(() => {})
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1500)
                    }}
                  >
                    {copied ? '✓' : s.copyUrl.split(' ')[0]}
                  </button>
                </span>
              </div>
              <p className="hint" style={{ marginTop: 8 }}>{s.scanQR}</p>
              <p className="hint">{s.transferNote} <b style={{ color: 'var(--pink)' }}>{p.teamName}</b></p>
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-h"><h2>{s.uploadReceipt}</h2></div>
        <div className="panel-b stack" style={{ gap: 14, maxWidth: 620 }}>
          <label className="field">
            <span>{s.reference} <span className="req">*</span></span>
            <input className="inp num" value={reference} disabled={locked} onChange={(e) => setReference(e.target.value)} />
          </label>

          <div className="field">
            <span>{s.receipt} <span className="req">*</span></span>
            {locked ? (
              p.receiptUrl ? (
                <a className="btn btn-sm" href={p.receiptUrl} target="_blank" rel="noreferrer" style={{ alignSelf: 'flex-start' }}>
                  {s.openReceipt} ↗
                </a>
              ) : (
                <span className="sub">{s.noReceipt}</span>
              )
            ) : (
              <Upload
                bucket="receipts"
                folder={`teams/${p.teamId}/receipts`}
                accept="image/*,application/pdf"
                shape="wide"
                maxEdge={1600}
                label={s.chooseFile}
                replaceLabel={s.replaceFile}
                onUploaded={(path) => setReceiptPath(path)}
                failedText={s.photoFailed}
                uploadingText={s.uploading}
              />
            )}
          </div>

          <div className="field" style={{ marginTop: 6 }}>
            <span>{s.refundAccount} <span className="req">*</span></span>
            <span className="hint">{s.refundHint}</span>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>{s.bankName}</span>
              <select className="inp" value={refundBank} disabled={locked} onChange={(e) => setRefundBank(e.target.value)}>
                <option value="">—</option>
                {BANKS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </label>
            <label className="field">
              <span>{s.bankHolder}</span>
              <input
                className="inp num"
                style={{ textTransform: 'uppercase' }}
                value={refundHolder}
                disabled={locked}
                onChange={(e) => setRefundHolder(e.target.value)}
              />
            </label>
            <label className="field">
              <span>{s.bankAccount}</span>
              <input
                className="inp num"
                inputMode="numeric"
                value={refundAccount}
                disabled={locked}
                onChange={(e) => setRefundAccount(e.target.value.replace(/[^\d\s]/g, ''))}
              />
            </label>
          </div>

          {error && <div className="note crit">{error}</div>}

          {!locked && (
            <div>
              <button
                className="btn btn-primary"
                onClick={submit}
                disabled={pending || !reference.trim() || !receiptPath || !refundBank || !refundHolder.trim() || !refundAccount.trim()}
              >
                {pending ? s.working : s.submitPayment}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
