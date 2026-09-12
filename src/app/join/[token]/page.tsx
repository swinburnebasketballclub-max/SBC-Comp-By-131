import { translator } from '@/lib/i18n/server'
import { supabaseServer } from '@/lib/supabase/server'

export const metadata = { title: 'Player sign-up' }
export const dynamic = 'force-dynamic'

type Context =
  | { ok: false; reason: string }
  | {
      ok: true
      team: { name: string; crest: string; logo: string | null }
      competition: { name_en: string; name_zh: string; deadline: string }
      rules: { max_masiswa: number; max_state: number; roster_max: number }
      used: { masiswa: number; state: number; players: number }
      taken_numbers: number[]
      taken_jersey_names: string[]
      sizes: string[]
    }

const REASONS: Record<string, { en: string; zh: string }> = {
  NOT_FOUND:     { en: 'This link is not valid.', zh: '这条链接无效。' },
  REVOKED:       { en: 'This link has been cancelled by the team manager.', zh: '这条链接已被球队经理撤销。' },
  EXPIRED:       { en: 'This link has expired.', zh: '这条链接已过期。' },
  USED:          { en: 'This link has already been used.', zh: '这条链接已经被用过了。' },
  ROSTER_LOCKED: { en: 'This roster is locked — registration has closed.', zh: '这支球队的名单已锁定，报名已结束。' },
}

/**
 * The player's entry point. No sign-in: everything comes from one database
 * function that takes the token and returns only what the form needs.
 */
export default async function Join({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const tr = await translator()
  const supabase = await supabaseServer()

  const { data } = await supabase.rpc('invite_context', { p_token: token })
  const ctx = data as unknown as Context | null

  if (!ctx?.ok) {
    const reason = ctx?.reason ?? 'NOT_FOUND'
    const message = REASONS[reason] ?? REASONS.NOT_FOUND
    return (
      <div className="stack" style={{ paddingTop: 64, maxWidth: 460 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>
          {tr.locale === 'zh' ? '链接打不开' : 'Link not usable'}
        </h1>
        <div className="note crit">{message[tr.locale]}</div>
        <p className="hint">
          {tr.locale === 'zh'
            ? '请向你的球队经理要一条新的链接。'
            : 'Ask your team manager for a new link.'}
        </p>
      </div>
    )
  }

  return (
    <div className="stack" style={{ paddingTop: 40, maxWidth: 460 }}>
      <div>
        <div className="eyebrow">
          {tr.locale === 'zh' ? ctx.competition.name_zh : ctx.competition.name_en}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>
          {tr.locale === 'zh' ? `加入 ${ctx.team.name}` : `Join ${ctx.team.name}`}
        </h1>
      </div>

      <div className="note ok">
        {tr.locale === 'zh'
          ? `链接有效。目前队上 ${ctx.used.players} 名球员，Masiswa ${ctx.used.masiswa}／${ctx.rules.max_masiswa}。表单正在建置中。`
          : `Link is valid. ${ctx.used.players} players so far, Masiswa ${ctx.used.masiswa} of ${ctx.rules.max_masiswa}. The form is being built next.`}
      </div>
    </div>
  )
}
