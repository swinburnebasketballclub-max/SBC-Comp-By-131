import Link from 'next/link'

import { activeCompetition, initials, teamSummaries } from '@/lib/competition'
import { day, daysUntil, money } from '@/lib/format'
import { pick } from '@/lib/i18n/dict'
import { translator } from '@/lib/i18n/server'

export const metadata = { title: 'Overview' }
export const dynamic = 'force-dynamic'

export default async function Overview() {
  const tr = await translator()
  const comp = await activeCompetition()

  if (!comp) {
    return (
      <>
        <header className="page-head"><h1>{tr('navOverview')}</h1></header>
        <div className="note">{tr('noCompetition')}</div>
      </>
    )
  }

  const teams = await teamSummaries(comp)
  const valid = teams.filter((t) => t.breaches.length === 0).length
  const awaiting = teams.filter((t) => t.payment?.status === 'pending').length
  const coloursOk = teams.filter((t) => t.colour?.status === 'approved').length
  const locked = teams.filter((t) => t.team.locked_at).length
  const left = daysUntil(comp.registration_deadline)

  const PAY_TAG = {
    none: ['t-mute', tr('payNone')],
    pending: ['t-warn', tr('payPending')],
    approved: ['t-ok', tr('payApproved')],
    rejected: ['t-crit', tr('payRejected')],
  } as const

  const COLOUR_TAG = {
    pending: ['t-warn', tr('colPending')],
    approved: ['t-ok', tr('colApproved')],
    rejected: ['t-crit', tr('colRejected')],
  } as const

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">
          {comp.season} · {pick(comp, 'venue', tr.locale)} · {day(comp.starts_on)} – {day(comp.ends_on)}
        </div>
        <h1>{pick(comp, 'name', tr.locale)}</h1>
      </header>

      <div className="meta-strip">
        <div className="meta-cell">
          <div className="k">{tr('ovRegistered')}</div>
          <div className="v num">{teams.length} / {comp.max_teams}</div>
        </div>
        <div className="meta-cell">
          <div className="k">{tr('ovCompliant')}</div>
          <div className="v num">{valid} / {teams.length}</div>
        </div>
        <div className="meta-cell">
          <div className="k">{tr('ovAwaitingPay')}</div>
          <div className="v num" style={{ color: awaiting ? 'var(--warn)' : undefined }}>{awaiting}</div>
        </div>
        <div className="meta-cell">
          <div className="k">{tr('ovColoursSet')}</div>
          <div className="v num">{coloursOk} / {teams.length}</div>
        </div>
        <div className="meta-cell">
          <div className="k">{tr('ovLocked')}</div>
          <div className="v num">{locked} / {teams.length}</div>
        </div>
        <div className="meta-cell">
          <div className="k">{tr('ovDaysLeft')}</div>
          <div className="v num" style={{ color: left <= 7 ? 'var(--pink)' : undefined }}>
            {left < 0 ? tr('ovClosed') : left}
            <small>{day(comp.registration_deadline)}</small>
          </div>
        </div>
      </div>

      <section className="panel">
        <div className="panel-h">
          <h2>{tr('teamStatus')}</h2>
          <Link className="btn btn-sm" href="/admin/teams">{tr('navTeams')}</Link>
        </div>

        {teams.length === 0 ? (
          <div className="panel-b"><p className="hint">{tr('noTeamsYet')}</p></div>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>{tr('teams')}</th>
                  <th>{tr('colManager')}</th>
                  <th className="right">{tr('colPlayers')}</th>
                  <th className="right">{tr('colMasiswa')}</th>
                  <th>{tr('colRules')}</th>
                  <th className="right">{tr('colFee')}</th>
                  <th>{tr('colPayment')}</th>
                  <th>{tr('colColour')}</th>
                  <th>{tr('colLocked')}</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => {
                  const pay = PAY_TAG[t.payment?.status ?? 'none']
                  const col = t.colour ? COLOUR_TAG[t.colour.status] : null
                  return (
                    <tr key={t.team.id}>
                      <td>
                        <span className="who">
                          <span className="crest" style={{ background: t.team.crest_color }}>
                            {initials(t.team.name)}
                          </span>
                          <b>{t.team.name}</b>
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-2)' }}>
                        {t.team.manager_name || t.team.manager_email}
                        <div className="sub">
                          {t.team.manager_status === 'active'
                            ? tr('mgrActive')
                            : t.team.manager_status === 'invited'
                              ? tr('mgrInvited')
                              : tr('mgrDisabled')}
                        </div>
                      </td>
                      <td className="right num">{t.players}</td>
                      <td className="right num" style={{ color: t.masiswa > comp.max_masiswa ? 'var(--crit)' : undefined }}>
                        {t.masiswa}
                      </td>
                      <td>
                        {t.breaches.length === 0 ? (
                          <span className="tag t-ok">{tr('rulesPass')}</span>
                        ) : (
                          <span className="tag t-crit" title={t.breaches.join(' · ')}>
                            {t.breaches.length} {tr('rulesFail')}
                          </span>
                        )}
                      </td>
                      <td className="right num">
                        {t.payment ? money(t.payment.total_cents ?? 0) : '—'}
                      </td>
                      <td><span className={`tag ${pay[0]}`}>{pay[1]}</span></td>
                      <td>
                        {t.colour && col ? (
                          <span className="who" style={{ gap: 6 }}>
                            <span className="swatch" style={{ background: t.colour.hex }} />
                            <span style={{ fontSize: 12.5 }}>{t.colour.name_en}</span>
                            <span className={`tag ${col[0]}`}>{col[1]}</span>
                          </span>
                        ) : (
                          <span className="sub">
                            {t.payment?.status === 'approved' ? tr('colNotSet') : tr('colLockedOut')}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`tag ${t.team.locked_at ? 't-ok' : 't-mute'}`}>
                          {t.team.locked_at ? tr('lockedYes') : tr('lockedNo')}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
