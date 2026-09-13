import Link from 'next/link'
import { Suspense } from 'react'

import { initials } from '@/lib/competition'
import { day, money } from '@/lib/format'
import { strings } from '@/lib/i18n/dict'
import { translator } from '@/lib/i18n/server'
import { managerContext, photoUrls, publicUrl, teamLinks } from '@/lib/team'
import { InviteLinks } from './InviteLinks'
import { RosterSheet } from './RosterSheet'
import { Tour } from './Tour'

export const metadata = { title: 'Roster' }
export const dynamic = 'force-dynamic'

export default async function Roster() {
  const ctx = await managerContext()
  const tr = await translator()
  const s = strings(tr.locale)
  const { comp, team, members, payment } = ctx

  const [links, photos] = await Promise.all([teamLinks(team.id), photoUrls(members)])

  // Counted from confirmed members only — a submission waiting at the end of
  // the roster does not count until the manager accepts it.
  const active = members.filter((m) => m.status === 'active')
  const pending = members.filter((m) => m.status === 'pending')
  const players = active.filter((m) => m.is_player).length
  const masiswa = active.filter((m) => m.tier === 'masiswa' || m.tier === 'state').length
  const state = active.filter((m) => m.tier === 'state').length
  const coaches = active.filter((m) => m.is_coach).length
  const hasManager = active.some((m) => m.is_manager)

  const checks: { label: string; value: number; limit: string; ok: boolean }[] = [
    { label: s.playersHeading, value: players, limit: `${comp.roster_min}–${comp.roster_max}`, ok: players >= comp.roster_min && players <= comp.roster_max },
    { label: 'Masiswa', value: masiswa, limit: `≤ ${comp.max_masiswa}`, ok: masiswa <= comp.max_masiswa },
    { label: 'State', value: state, limit: `≤ ${comp.max_state}`, ok: state <= comp.max_state },
    { label: s.headCoach, value: coaches, limit: `≤ ${comp.max_coaches}`, ok: coaches <= comp.max_coaches },
    { label: s.teamManager, value: hasManager ? 1 : 0, limit: '1', ok: hasManager },
  ]
  const breaches = checks.filter((c) => !c.ok)

  return (
    <>
      <Suspense fallback={null}>
        <Tour s={s} />
      </Suspense>

      <header className="page-head">
        <div className="eyebrow">{comp.season} · {s.deadline} {day(comp.registration_deadline)}</div>
        <h1>{s.mNavRoster}</h1>
        <p className="lede" style={{ marginTop: 10 }}>{s.rosterLede}</p>
      </header>

      {pending.length > 0 && (
        <div className="note warn">
          <b>{pending.length}</b>&nbsp;{s.pendingWaiting}
        </div>
      )}

      <div className={`note ${breaches.length ? 'crit' : 'ok'}`}>
        <b>{breaches.length ? s.rosterBad : `✓ ${s.rosterOk}`}</b>
        {breaches.length > 0 && (
          <span>&nbsp;— {breaches.map((b) => `${b.label} ${b.value} (${s.limit} ${b.limit})`).join(' · ')}</span>
        )}
      </div>

      <InviteLinks
        teamId={team.id}
        teamName={team.name}
        season={comp.season}
        deadline={day(comp.registration_deadline)}
        links={links}
        editable={ctx.editable}
        s={s}
      />

      <div className="roster-grid">
        <RosterSheet
          teamId={team.id}
          competitionId={comp.id}
          teamName={team.name}
          logoUrl={publicUrl('team-logos', team.logo_path)}
          crest={team.crest_color}
          initials={initials(team.name)}
          captainWhatsapp={team.captain_whatsapp}
          season={comp.season}
          members={members}
          photos={photos}
          rosterMin={comp.roster_min}
          rosterMax={comp.roster_max}
          editable={ctx.editable}
          s={s}
        />

        <div className="stack">
          <section className="panel">
            <div className="panel-h"><h3>{s.checks}</h3></div>
            <div className="panel-b">
              {checks.map((c) => (
                <div key={c.label} className="quota-row">
                  <span>
                    <b style={{ fontSize: 13 }}>{c.label}</b>
                    <span className="sub" style={{ display: 'block' }}>{s.limit} {c.limit}</span>
                  </span>
                  <span className="row" style={{ gap: 8 }}>
                    <span className="big-num">{c.value}</span>
                    <span className={`tag ${c.ok ? 't-ok' : 't-crit'}`}>{c.ok ? 'OK' : '!'}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-h"><h3>{s.feeSoFar}</h3></div>
            <div className="panel-b stack" style={{ gap: 8 }}>
              {payment ? (
                <>
                  <span style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 800 }}>
                    {money(payment.total_cents ?? payment.base_cents + payment.deposit_cents)}
                  </span>
                  <span className="sub">
                    {money(payment.base_cents)} + {money(payment.deposit_cents)} {s.depositLabel}
                  </span>
                </>
              ) : (
                <span className="sub">{s.noPaymentYet}</span>
              )}
              <div><Link className="btn btn-sm" href="/team/fee">{s.goPay} →</Link></div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
