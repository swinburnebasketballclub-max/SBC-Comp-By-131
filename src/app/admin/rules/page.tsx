import { redirect } from 'next/navigation'

import { activeCompetition } from '@/lib/competition'
import { strings } from '@/lib/i18n/dict'
import { translator } from '@/lib/i18n/server'
import { getViewer } from '@/lib/session'
import { supabaseServer } from '@/lib/supabase/server'
import { RulesForm } from './RulesForm'

export const metadata = { title: 'Rules & terms' }
export const dynamic = 'force-dynamic'

export default async function RulesPage() {
  const viewer = await getViewer()
  if (viewer.kind !== 'admin' || viewer.admin.role !== 'super') redirect('/admin')

  const tr = await translator()
  const s = strings(tr.locale)
  const comp = await activeCompetition()
  if (!comp) {
    return (
      <>
        <header className="page-head"><h1>{s.navRules}</h1></header>
        <div className="note">{s.noCompetition}</div>
      </>
    )
  }

  const supabase = await supabaseServer()
  const [{ data: tiers }, { data: terms }, { data: teams }] = await Promise.all([
    supabase.from('fee_tiers').select('*').eq('competition_id', comp.id).order('sort'),
    supabase.from('terms').select('*').eq('competition_id', comp.id).order('idx'),
    supabase.from('teams').select('id, locked_at, edit_window_until').eq('competition_id', comp.id),
  ])

  const openTeams = (teams ?? []).filter((t) => !t.locked_at || t.edit_window_until).length

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">{comp.season}</div>
        <h1>{s.navRules}</h1>
        <p className="lede" style={{ marginTop: 10 }}>{s.rsLede}</p>
      </header>

      <RulesForm
        comp={comp}
        tiers={(tiers ?? []).map((t) => ({
          id: t.id,
          label: tr.locale === 'zh' ? t.label_zh : t.label_en,
          amount_cents: t.amount_cents,
        }))}
        terms={(terms ?? []).map((t) => ({ body_en: t.body_en, body_zh: t.body_zh }))}
        openTeams={openTeams}
        totalTeams={teams?.length ?? 0}
        s={s}
      />
    </>
  )
}
