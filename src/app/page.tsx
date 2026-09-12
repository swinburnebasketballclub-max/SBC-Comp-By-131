import Link from 'next/link'
import { redirect } from 'next/navigation'

import { SignInButton } from '@/components/SignInButton'
import { translator } from '@/lib/i18n/server'
import { pick } from '@/lib/i18n/dict'
import { getViewer, homeFor } from '@/lib/session'
import { supabaseServer } from '@/lib/supabase/server'

export default async function Landing() {
  const viewer = await getViewer()
  if (viewer.kind !== 'anon') redirect(homeFor(viewer))

  const tr = await translator()
  const supabase = await supabaseServer()

  const { data: comp } = await supabase
    .from('competitions')
    .select('slug, season, name_en, name_zh, venue_en, venue_zh, starts_on, ends_on, registration_deadline, max_teams, status')
    .in('status', ['open', 'closed', 'locked', 'running', 'finished'])
    .order('starts_on', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="stack" style={{ paddingTop: 48, gap: 34 }}>
      <div>
        <div className="eyebrow">
          {comp ? `${comp.season} · ` : ''}Swinburne Basketball Club
        </div>
        <h1 style={{ fontSize: 'clamp(34px, 6vw, 56px)', fontWeight: 800 }}>
          {comp ? pick(comp, 'name', tr.locale) : tr('brand')}
        </h1>
        <p className="lede" style={{ marginTop: 14, fontSize: 16.5 }}>{tr('landingLede')}</p>
      </div>

      {comp && (
        <div className="meta-strip">
          <div className="meta-cell">
            <div className="k">{tr('venue')}</div>
            <div className="v">{pick(comp, 'venue', tr.locale)}</div>
          </div>
          <div className="meta-cell">
            <div className="k">{tr('dates')}</div>
            <div className="v num">
              {fmt(comp.starts_on)} – {fmt(comp.ends_on)}
            </div>
          </div>
          <div className="meta-cell">
            <div className="k">{tr('deadline')}</div>
            <div className="v num" style={{ color: 'var(--pink)' }}>{fmt(comp.registration_deadline)}</div>
          </div>
          <div className="meta-cell">
            <div className="k">{tr('teams')}</div>
            <div className="v num">{comp.max_teams}<small>first come, first served</small></div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <section className="panel">
          <div className="panel-h"><h2>{tr('roleManager')}</h2></div>
          <div className="panel-b stack" style={{ gap: 14 }}>
            <p className="hint" style={{ fontSize: 13.5 }}>{tr('landingManagers')}</p>
            <div><SignInButton label={tr('signIn')} /></div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-h"><h2>{tr('rolePlayer')}</h2></div>
          <div className="panel-b stack" style={{ gap: 14 }}>
            <p className="hint" style={{ fontSize: 13.5 }}>{tr('landingPlayers')}</p>
            {comp && (
              <div>
                <Link className="btn" href={`/fixtures/${comp.slug}`}>{tr('viewFixtures')}</Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {!comp && <div className="note">{tr('noCompetition')}</div>}
    </div>
  )
}

function fmt(date: string) {
  return new Date(`${date}T00:00:00+08:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Kuching',
  })
}
