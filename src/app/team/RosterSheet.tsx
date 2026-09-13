'use client'

import { useState, useTransition } from 'react'

import { RANK_ORDER, rankOf } from '@/lib/format'
import { errorText, type Strings } from '@/lib/i18n/dict'
import type { TeamMember } from '@/lib/supabase/database.types'
import { decideSubmission, removeMember } from './actions'
import { MemberForm, type FormMode } from './MemberForm'

type Props = {
  teamId: string
  competitionId: string
  teamName: string
  logoUrl: string | null
  crest: string
  initials: string
  captainWhatsapp: string
  season: string
  members: TeamMember[]
  photos: Record<string, string>
  rosterMin: number
  rosterMax: number
  editable: boolean
  s: Strings
}

const initialsOf = (name: string) =>
  name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('')

export function RosterSheet(p: Props) {
  const { s } = p
  const [editing, setEditing] = useState<null | { mode: FormMode; member: TeamMember | null }>(null)
  const [busy, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const active = p.members.filter((m) => m.status === 'active')
  const pending = p.members.filter((m) => m.status === 'pending')

  const manager = active.find((m) => m.is_manager) ?? null
  const coach = active.find((m) => m.is_coach) ?? null
  const players = active
    .filter((m) => m.is_player && !m.is_manager && !m.is_coach)
    .sort((a, b) => RANK_ORDER[rankOf(a)] - RANK_ORDER[rankOf(b)] || (a.jersey_no ?? 99) - (b.jersey_no ?? 99))

  // The manager and coach count as players too when they play.
  const playingStaff = [manager, coach].filter((m): m is TeamMember => Boolean(m?.is_player))
  const playerCount = players.length + playingStaff.length
  const openSlots = Math.max(0, p.rosterMin - playerCount - pending.length)

  const everyone = [...active, ...pending]
  const takenNumbers = everyone.map((m) => m.jersey_no).filter((n): n is number => n !== null)
  const takenNames = everyone.map((m) => m.jersey_name).filter((n): n is string => Boolean(n))

  function act(fn: () => Promise<{ ok: boolean; code?: string }>) {
    setError(null)
    start(async () => {
      const r = await fn()
      if (!r.ok) setError(errorText(r.code, s))
    })
  }

  const face = (m: TeamMember) =>
    p.photos[m.id] ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img className="photo" src={p.photos[m.id]} alt="" />
    ) : (
      <span className="photo">{initialsOf(m.full_name)}</span>
    )

  const badges = (m: TeamMember) => (
    <div className="badges">
      {m.is_captain && <span className="tag t-warn">Captain</span>}
      {m.tier === 'state' && <span className="tag t-pink">State</span>}
      {m.tier === 'masiswa' && <span className="tag t-ok">Masiswa</span>}
      {m.is_new_player && <span className="tag t-mute">New</span>}
    </div>
  )

  const facts = (m: TeamMember) => (
    <dl className="facts">
      {m.is_player && (
        <>
          <dt>Jersey</dt>
          <dd>{m.jersey_name} · {m.jersey_size}</dd>
        </>
      )}
      <dt>IC</dt><dd>{m.ic_no}</dd>
      {m.phone && (<><dt>H/P</dt><dd>{m.phone}</dd></>)}
      {m.student_id && (<><dt>Stu ID</dt><dd>{m.student_id}</dd></>)}
      {m.course && (<><dt>Course</dt><dd>{m.course}{m.study_year ? ` · Y${m.study_year}` : ''}</dd></>)}
    </dl>
  )

  const staffCell = (m: TeamMember | null, mode: 'manager' | 'coach') => (
    <div className="staff-cell">
      {m ? face(m) : <span className="photo" style={{ borderStyle: 'dashed' }}>+</span>}
      <div className="stack" style={{ gap: 4, minWidth: 0, flex: 1 }}>
        <span className="role-label">{mode === 'manager' ? s.teamManager : s.headCoach}</span>
        {m ? (
          <>
            <span className="pname" style={{ fontSize: 15 }}>{m.full_name}</span>
            {m.is_player && (
              <span className="sub"><span style={{ color: 'var(--pink)' }}>{s.alsoPlays}</span> · #{m.jersey_no} · {m.jersey_size}</span>
            )}
            {facts(m)}
            {p.editable && (
              <div className="row" style={{ gap: 6, marginTop: 4 }}>
                <button className="btn btn-sm" onClick={() => setEditing({ mode, member: m })}>{s.edit}</button>
                {mode === 'coach' && (
                  <button
                    className="btn btn-sm"
                    disabled={busy}
                    onClick={() => confirm(s.removeConfirm) && act(() => removeMember(p.teamId, m.id))}
                  >
                    {s.remove}
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <span className="sub">{mode === 'manager' ? s.managerRequired : s.coachOptional}</span>
            {p.editable && (
              <div>
                <button
                  className={`btn btn-sm ${mode === 'manager' ? 'btn-primary' : ''}`}
                  onClick={() => setEditing({ mode, member: null })}
                >
                  {mode === 'manager' ? s.addMe : s.addCoach}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  return (
    <>
      {error && <div className="note crit">{error}</div>}

      <div className="sheet">
        <div className="sheet-top">
          <div className="row" style={{ gap: 14 }}>
            {p.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="sheet-logo" src={p.logoUrl} alt="" />
            ) : (
              <span className="sheet-logo" style={{ background: p.crest }}>{p.initials}</span>
            )}
            <div>
              <div className="sheet-name">{p.teamName}</div>
              <div className="sub num">SBC {p.season}{p.captainWhatsapp ? ` · ${s.fieldCaptainWA} ${p.captainWhatsapp}` : ''}</div>
            </div>
          </div>
          {p.editable && (
            <button className="btn btn-sm" onClick={() => setEditing({ mode: 'player', member: null })}>
              + {s.addPlayer}
            </button>
          )}
        </div>

        <div className="staff">
          {staffCell(manager, 'manager')}
          {staffCell(coach, 'coach')}
        </div>

        <div className="sect-bar">
          <span>{s.playersHeading}</span>
          <span className="num">
            {playerCount} / {p.rosterMax}
            {pending.length > 0 && ` · ${pending.length} ${s.awaitingConfirm}`}
          </span>
        </div>

        <div className="pgrid">
          {players.map((m) => (
            <div key={m.id} className="pcard">
              <div className="row" style={{ gap: 10, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                {face(m)}
                <div style={{ minWidth: 0 }}>
                  <div className="jno">{String(m.jersey_no ?? '—').padStart(2, '0')}</div>
                  <div className="pname">{m.full_name}</div>
                </div>
              </div>
              {badges(m)}
              {facts(m)}
              {p.editable && (
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-sm" onClick={() => setEditing({ mode: 'player', member: m })}>{s.edit}</button>
                  <button
                    className="btn btn-sm"
                    disabled={busy}
                    onClick={() => confirm(s.removeConfirm) && act(() => removeMember(p.teamId, m.id))}
                  >
                    {s.remove}
                  </button>
                </div>
              )}
            </div>
          ))}

          {pending.map((m) => (
            <div key={m.id} className="pcard pending">
              <span className="tag t-warn" style={{ alignSelf: 'flex-start' }}>{s.awaitingConfirm}</span>
              <div className="row" style={{ gap: 10, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                {face(m)}
                <div style={{ minWidth: 0 }}>
                  <div className="jno">{String(m.jersey_no ?? '—').padStart(2, '0')}</div>
                  <div className="pname">{m.full_name}</div>
                </div>
              </div>
              {badges(m)}
              {facts(m)}
              {p.editable && (
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => act(() => decideSubmission(p.teamId, m.id, true))}>
                    {s.confirmJoin}
                  </button>
                  <button className="btn btn-sm" disabled={busy} onClick={() => act(() => decideSubmission(p.teamId, m.id, false))}>
                    {s.declineJoin}
                  </button>
                </div>
              )}
            </div>
          ))}

          {Array.from({ length: openSlots }, (_, i) => (
            <div key={`slot-${i}`} className="pcard slot">
              <span style={{ fontSize: 22 }}>＋</span>
              <span>{s.emptySlot}</span>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <MemberForm
          mode={editing.mode}
          member={editing.member}
          photoUrl={editing.member ? p.photos[editing.member.id] ?? null : null}
          teamId={p.teamId}
          competitionId={p.competitionId}
          takenNumbers={takenNumbers}
          takenNames={takenNames}
          s={s}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
