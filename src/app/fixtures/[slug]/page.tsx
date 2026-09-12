import { notFound } from 'next/navigation'

import { pick } from '@/lib/i18n/dict'
import { translator } from '@/lib/i18n/server'
import { supabaseServer } from '@/lib/supabase/server'

export const revalidate = 60

/**
 * Public schedule. No sign-in, and no player data — the database function
 * behind this returns times, venues, team names and crests only.
 */
export default async function Fixtures({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tr = await translator()
  const supabase = await supabaseServer()

  const { data: comp } = await supabase
    .from('competitions')
    .select('slug, season, name_en, name_zh, venue_en, venue_zh, starts_on, ends_on, status')
    .eq('slug', slug)
    .maybeSingle()

  if (!comp) notFound()

  const { data: fixtures } = await supabase.rpc('get_fixtures', { p_slug: slug })
  const byDay = groupByDay(fixtures ?? [])

  return (
    <div className="stack" style={{ paddingTop: 40, gap: 24 }}>
      <div>
        <div className="eyebrow">{comp.season} · {pick(comp, 'venue', tr.locale)}</div>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>{pick(comp, 'name', tr.locale)}</h1>
      </div>

      {byDay.length === 0 ? (
        <div className="note warn">{tr('fixturesPending')}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 14 }}>
          {byDay.map(([day, list]) => (
            <section key={day} className="panel">
              <div className="panel-h">
                <h2>{day}</h2>
                <span className="hint num">{list.length}</span>
              </div>
              <div>
                {list.map((m) => (
                  <div
                    key={m.match_id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '58px 1fr auto',
                      gap: 10,
                      alignItems: 'center',
                      padding: '9px 15px',
                      borderTop: '1px solid var(--line-soft)',
                      fontSize: 13.5,
                    }}
                  >
                    <span className="num hint">{time(m.scheduled_at)}</span>
                    <span>
                      <strong>{m.home_team ?? (tr.locale === 'zh' ? m.home_label_zh : m.home_label_en)}</strong>
                      <span className="hint num" style={{ margin: '0 7px' }}>vs</span>
                      <strong>{m.away_team ?? (tr.locale === 'zh' ? m.away_label_zh : m.away_label_en)}</strong>
                    </span>
                    <span className="tag t-mute">
                      {m.group_name ?? (tr.locale === 'zh' ? m.stage_zh : m.stage_en) ?? ''}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

type Fixture = {
  match_id: string
  scheduled_at: string | null
  group_name: string | null
  stage_en: string | null
  stage_zh: string | null
  home_team: string | null
  away_team: string | null
  home_label_en: string
  home_label_zh: string
  away_label_en: string
  away_label_zh: string
}

function groupByDay(rows: Fixture[]): [string, Fixture[]][] {
  const map = new Map<string, Fixture[]>()
  for (const row of rows) {
    const day = row.scheduled_at
      ? new Date(row.scheduled_at).toLocaleDateString('en-GB', {
          weekday: 'short', day: '2-digit', month: 'short', timeZone: 'Asia/Kuching',
        })
      : 'TBC'
    map.set(day, [...(map.get(day) ?? []), row])
  }
  return [...map.entries()]
}

function time(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuching',
  })
}
