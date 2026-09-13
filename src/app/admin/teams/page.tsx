import { redirect } from 'next/navigation'

import { activeCompetition, initials, teamSummaries } from '@/lib/competition'
import { stamp } from '@/lib/format'
import { type Key } from '@/lib/i18n/dict'
import { translator } from '@/lib/i18n/server'
import { getViewer } from '@/lib/session'
import { supabaseServer } from '@/lib/supabase/server'
import { AdminRowActions, InviteAdminForm, InviteRowActions, NewTeamForm, TeamRowActions } from './TeamForms'

export const metadata = { title: 'Teams & managers' }
export const dynamic = 'force-dynamic'

const LABEL_KEYS = [
  'fieldTeamName', 'fieldManagerName', 'fieldManagerMail', 'fieldCaptainWA',
  'createTeam', 'actChangeMgr', 'actDisable', 'actEnable', 'actLock', 'actUnlock',
  'teamsFull', 'inviteAdmin', 'roleSuper', 'roleFinance', 'roleFixtures',
  'save', 'cancel', 'working', 'colRules', 'fGoogleAccount', 'fName', 'fRole', 'remove', 'cancelInvite', 'confirmRemoveAdmin',
] as const satisfies readonly Key[]

export default async function TeamsPage() {
  const viewer = await getViewer()
  if (viewer.kind !== 'admin' || viewer.admin.role !== 'super') redirect('/admin')

  const tr = await translator()
  const comp = await activeCompetition()
  if (!comp) {
    return (
      <>
        <header className="page-head"><h1>{tr('navTeams')}</h1></header>
        <div className="note">{tr('noCompetition')}</div>
      </>
    )
  }

  const teams = await teamSummaries(comp)
  const supabase = await supabaseServer()
  const [{ data: admins }, { data: invites }] = await Promise.all([
    supabase.from('admins').select('*').order('created_at'),
    supabase.from('admin_invites').select('*').is('claimed_at', null),
  ])

  const labels = Object.fromEntries(LABEL_KEYS.map((k) => [k, tr(k)]))
  const pendingInvites = teams.filter((t) => t.team.manager_status === 'invited').length

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">{comp.season}</div>
        <h1>{tr('navTeams')}</h1>
        <p className="lede" style={{ marginTop: 10 }}>{tr('newTeamLede')}</p>
      </header>

      <section className="panel">
        <div className="panel-h">
          <h2>{tr('newTeam')}</h2>
          <span className="hint num">{teams.length} / {comp.max_teams}</span>
        </div>
        <div className="panel-b">
          <NewTeamForm
            competitionId={comp.id}
            full={teams.length >= comp.max_teams}
            locale={tr.locale}
            labels={labels}
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel-h">
          <h2>{tr('managerAccounts')}</h2>
          {pendingInvites > 0 && (
            <span className="tag t-warn">{pendingInvites} {tr('mgrInvited')}</span>
          )}
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
                  <th>{tr('signedInAs')}</th>
                  <th className="right" />
                </tr>
              </thead>
              <tbody>
                {teams.map(({ team }) => (
                  <tr key={team.id}>
                    <td>
                      <span className="who">
                        <span className="crest" style={{ background: team.crest_color }}>
                          {initials(team.name)}
                        </span>
                        <b>{team.name}</b>
                      </span>
                      <div className="sub">
                        {team.locked_at
                          ? `${tr('lockedYes')} · ${stamp(team.locked_at)}`
                          : team.edit_window_until
                            ? `${tr('actUnlock')} → ${stamp(team.edit_window_until)}`
                            : tr('lockedNo')}
                      </div>
                    </td>
                    <td>
                      {team.manager_name || '—'}
                      <div className="sub num">{team.manager_email}</div>
                    </td>
                    <td>
                      <span
                        className={`tag ${
                          team.manager_status === 'active'
                            ? 't-ok'
                            : team.manager_status === 'invited'
                              ? 't-warn'
                              : 't-crit'
                        }`}
                      >
                        {team.manager_status === 'active'
                          ? tr('mgrActive')
                          : team.manager_status === 'invited'
                            ? tr('mgrInvited')
                            : tr('mgrDisabled')}
                      </span>
                      <div className="sub">{stamp(team.invited_at)}</div>
                    </td>
                    <td className="right">
                      <TeamRowActions
                        teamId={team.id}
                        disabled={team.manager_status === 'disabled'}
                        locked={Boolean(team.locked_at)}
                        locale={tr.locale}
                        labels={labels}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-h">
          <h2>{tr('adminAccounts')}</h2>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>{tr('fName')}</th>
                <th>{tr('fGoogleAccount')}</th>
                <th>{tr('fRole')}</th>
              </tr>
            </thead>
            <tbody>
              {(admins ?? []).map((a) => (
                <tr key={a.id}>
                  <td>
                    <b>{a.full_name || '—'}</b>
                    {a.id === viewer.userId && <span className="tag t-pink" style={{ marginLeft: 8 }}>you</span>}
                    <div className="sub">{stamp(a.created_at)}</div>
                  </td>
                  <td className="num sub">{a.email}</td>
                  <td className="right">
                    <AdminRowActions
                      adminId={a.id}
                      role={a.role}
                      isYou={a.id === viewer.userId}
                      locale={tr.locale}
                      labels={labels}
                    />
                  </td>
                </tr>
              ))}
              {(invites ?? []).map((i) => (
                <tr key={i.email}>
                  <td>
                    <b style={{ opacity: 0.7 }}>{i.full_name || '—'}</b>
                    <div><span className="tag t-warn">{tr('pendingInvite')}</span></div>
                  </td>
                  <td className="num sub">{i.email}</td>
                  <td className="right">
                    <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                      <span className={`tag ${i.role === 'super' ? 't-pink' : 't-mute'}`}>
                        {i.role === 'super' ? tr('roleSuper') : i.role === 'finance' ? tr('roleFinance') : tr('roleFixtures')}
                      </span>
                      <InviteRowActions email={i.email} locale={tr.locale} labels={labels} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel-b" style={{ borderTop: '1px solid var(--line-soft)' }}>
          <p className="hint" style={{ marginBottom: 12 }}>{tr('adminAccountsLede')}</p>
          <InviteAdminForm locale={tr.locale} labels={labels} />
        </div>
      </section>
    </>
  )
}
