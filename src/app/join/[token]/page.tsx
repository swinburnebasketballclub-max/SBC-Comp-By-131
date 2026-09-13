import { strings, fill } from '@/lib/i18n/dict'
import { translator } from '@/lib/i18n/server'
import { day } from '@/lib/format'
import { supabaseServer } from '@/lib/supabase/server'
import { JoinForm, type JoinContext } from './JoinForm'

export const metadata = { title: 'Player sign-up' }
export const dynamic = 'force-dynamic'

const REASONS: Record<string, { en: string; zh: string }> = {
  NOT_FOUND:     { en: 'This link is not valid.', zh: '这条链接无效。' },
  REVOKED:       { en: 'Your team manager cancelled this link.', zh: '这条链接已被球队经理撤销。' },
  EXPIRED:       { en: 'This link has expired.', zh: '这条链接已过期。' },
  USED:          { en: 'This link has already been used.', zh: '这条链接已经被用过了。' },
  ROSTER_LOCKED: { en: 'This roster is locked — registration has closed.', zh: '这支球队的名单已锁定，报名已结束。' },
}

/**
 * The player's entry point. No sign-in: one database function takes the
 * token and returns only what the form needs — no one else's details.
 */
export default async function Join({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const tr = await translator()
  const s = strings(tr.locale)
  const supabase = await supabaseServer()

  const { data } = await supabase.rpc('invite_context', { p_token: token })
  const ctx = data as unknown as ({ ok: false; reason: string } | (JoinContext & { ok: true })) | null

  if (!ctx?.ok) {
    const reason = (ctx && 'reason' in ctx && ctx.reason) || 'NOT_FOUND'
    return (
      <div className="join stack">
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>{tr.locale === 'zh' ? '链接打不开' : 'This link cannot be used'}</h1>
        <div className="note crit">{(REASONS[reason] ?? REASONS.NOT_FOUND!)[tr.locale]}</div>
        <p className="hint">{tr.locale === 'zh' ? '请向球队经理要一条新的链接。' : 'Ask your team manager for a new link.'}</p>
      </div>
    )
  }

  const logo = ctx.team.logo
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/team-logos/${ctx.team.logo}`
    : null

  return (
    <JoinForm
      token={token}
      ctx={ctx}
      logoUrl={logo}
      title={fill(s.joinTitle, { team: ctx.team.name })}
      competition={tr.locale === 'zh' ? ctx.competition.name_zh : ctx.competition.name_en}
      deadline={day(ctx.competition.deadline)}
      s={s}
    />
  )
}
