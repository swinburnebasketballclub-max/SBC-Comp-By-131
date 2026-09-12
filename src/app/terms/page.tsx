import { pick } from '@/lib/i18n/dict'
import { translator } from '@/lib/i18n/server'
import { supabaseServer } from '@/lib/supabase/server'

export const metadata = { title: 'Terms and conditions' }

/**
 * The terms live in the database, one row per clause in both languages, so
 * the organiser can amend them without a deploy. English is the wording from
 * the original registration form and governs; Chinese is a reference
 * translation shown alongside.
 */
export default async function Terms() {
  const tr = await translator()
  const supabase = await supabaseServer()

  const { data: comp } = await supabase
    .from('competitions')
    .select('id, slug, season, name_en, name_zh')
    .order('starts_on', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: clauses } = comp
    ? await supabase
        .from('terms')
        .select('idx, body_en, body_zh')
        .eq('competition_id', comp.id)
        .order('idx')
    : { data: null }

  return (
    <article className="stack" style={{ paddingTop: 48, maxWidth: '72ch', gap: 24 }}>
      <div>
        <div className="eyebrow">{comp?.season ?? 'SBC'}</div>
        <h1 style={{ fontSize: 34, fontWeight: 800 }}>
          {tr.locale === 'zh' ? '比赛条款' : 'Terms and Conditions'}
        </h1>
        {comp && (
          <p className="lede" style={{ marginTop: 12 }}>{pick(comp, 'name', tr.locale)}</p>
        )}
      </div>

      {tr.locale === 'zh' && (
        <div className="note">
          中文为参考翻译，如有歧义，以英文版为准。
        </div>
      )}

      {clauses && clauses.length > 0 ? (
        <ol className="stack" style={{ gap: 16, paddingLeft: 22, margin: 0, color: 'var(--text-2)' }}>
          {clauses.map((c) => (
            <li key={c.idx}>
              <p>{tr.locale === 'zh' ? c.body_zh : c.body_en}</p>
              {tr.locale === 'zh' && (
                <p className="hint" style={{ marginTop: 4 }}>{c.body_en}</p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <div className="note">{tr('noCompetition')}</div>
      )}
    </article>
  )
}
