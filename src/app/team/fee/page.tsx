import { strings } from '@/lib/i18n/dict'
import { translator } from '@/lib/i18n/server'
import { money } from '@/lib/format'
import { managerContext } from '@/lib/team'
import { supabaseServer } from '@/lib/supabase/server'
import { FeeForm } from './FeeForm'

export const metadata = { title: 'Entry fee' }
export const dynamic = 'force-dynamic'

export default async function Fee() {
  const ctx = await managerContext()
  const tr = await translator()
  const s = strings(tr.locale)
  const { comp, team, payment } = ctx

  const supabase = await supabaseServer()
  const { data: tier } = payment?.tier_key
    ? await supabase
        .from('fee_tiers')
        .select('label_en, label_zh')
        .eq('competition_id', comp.id)
        .eq('key', payment.tier_key)
        .maybeSingle()
    : { data: null }

  const receiptUrl = payment?.receipt_path
    ? (await supabase.storage.from('receipts').createSignedUrl(payment.receipt_path, 1800)).data?.signedUrl ?? null
    : null

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">{comp.season}</div>
        <h1>{s.mNavFee}</h1>
        <p className="lede" style={{ marginTop: 10 }}>{s.feeLede}</p>
      </header>

      {!payment ? (
        <div className="note">{s.noPaymentYet}</div>
      ) : (
        <FeeForm
          teamId={team.id}
          teamName={team.name}
          status={payment.status}
          rejectReason={payment.reject_reason}
          base={money(payment.base_cents)}
          deposit={money(payment.deposit_cents)}
          total={money(payment.total_cents ?? payment.base_cents + payment.deposit_cents)}
          tierLabel={tier ? (tr.locale === 'zh' ? tier.label_zh : tier.label_en) : ''}
          bank={{ name: comp.bank_name, holder: comp.bank_holder, account: comp.bank_account }}
          qrUrl={comp.bank_qr_path ?? '/ryt-qr.jpg'}
          reference={payment.reference_no}
          receiptUrl={receiptUrl}
          refund={{ bank: payment.refund_bank, holder: payment.refund_holder, account: payment.refund_account }}
          editable={ctx.editable}
          s={s}
        />
      )}
    </>
  )
}
