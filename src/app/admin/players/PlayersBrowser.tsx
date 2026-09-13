'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'

import { errorText, type Strings } from '@/lib/i18n/dict'
import { setNewPlayer } from '../registry-actions'

type Member = {
  id: string
  name: string
  ic: string
  icNorm: string
  phone: string
  studentId: string
  course: string
  year: string
  jerseyNo: number | null
  jerseyName: string | null
  size: string | null
  rank: 'manager' | 'coach' | 'captain' | 'state' | 'masiswa' | 'player'
  tier: 'none' | 'masiswa' | 'state'
  isPlayer: boolean
  isNew: boolean
  newSrc: 'registry' | 'self' | 'admin'
  pending: boolean
  photo: string | null
}

export type TeamBlock = {
  id: string
  name: string
  crest: string
  initials: string
  manager: string
  locked: boolean
  players: number
  breaches: string[]
  members: Member[]
}

const RANK_LABEL: Record<Member['rank'], string> = {
  manager: 'Manager', coach: 'Coach', captain: 'Captain', state: 'State', masiswa: 'Masiswa', player: 'Player',
}

const csvCell = (v: string | number | null) => {
  const text = v === null ? '' : String(v)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function PlayersBrowser({ teams, focus, season, s }: { teams: TeamBlock[]; focus: string | null; season: string; s: Strings }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Set<string>>(() => new Set(focus ? [focus] : teams.length <= 2 ? teams.map((t) => t.id) : []))
  const [busy, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (focus) document.getElementById(`team-${focus}`)?.scrollIntoView({ block: 'start' })
  }, [focus])

  const q = query.trim().toLowerCase()
  const qDigits = q.replace(/\D/g, '')
  const matches = (m: Member) =>
    !q ||
    m.name.toLowerCase().includes(q) ||
    m.studentId.toLowerCase().includes(q) ||
    (qDigits.length >= 3 && m.icNorm.includes(qDigits))

  const visible = useMemo(
    () => teams.map((t) => ({ ...t, shown: t.members.filter(matches) })).filter((t) => !q || t.shown.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teams, q],
  )
  const hits = visible.reduce((n, t) => n + t.shown.length, 0)

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function flipNew(m: Member) {
    setError(null)
    start(async () => {
      const r = await setNewPlayer(m.id, !m.isNew)
      if (!r.ok) setError(errorText(r.code, s))
    })
  }

  function download() {
    const header = ['Team', 'Role', 'Status', 'Full name', 'IC', 'Student ID', 'Course', 'Year', 'Phone', 'Jersey No', 'Jersey Name', 'Size', 'Tier', 'New player']
    const lines = teams.flatMap((t) =>
      t.members.map((m) =>
        [
          t.name, RANK_LABEL[m.rank], m.pending ? 'pending' : 'confirmed', m.name, m.ic, m.studentId, m.course, m.year,
          m.phone, m.jerseyNo === null ? '' : String(m.jerseyNo).padStart(2, '0'), m.jerseyName, m.size, m.tier,
          m.isNew ? 'yes' : 'no',
        ].map(csvCell).join(','),
      ),
    )
    const blob = new Blob(['﻿' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sbc-${season.toLowerCase()}-rosters.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const srcLabel = (m: Member) =>
    m.newSrc === 'registry' ? s.srcRegistry : m.newSrc === 'admin' ? s.srcAdmin : s.srcSelf

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row" style={{ flex: '1 1 280px' }}>
          <input
            className="inp"
            type="search"
            style={{ maxWidth: 340 }}
            placeholder={s.plSearch}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {q && <span className="hint num">{hits} {s.plMatches}</span>}
        </div>
        <div className="row">
          <button className="btn btn-sm" onClick={() => setOpen(new Set(teams.map((t) => t.id)))}>{s.plExpandAll}</button>
          <button className="btn btn-sm" onClick={() => setOpen(new Set())}>{s.plCollapseAll}</button>
          <button className="btn btn-sm btn-primary" onClick={download}>{s.plExportAll}</button>
        </div>
      </div>

      {error && <div className="note crit">{error}</div>}

      {visible.map((t) => {
        const expanded = Boolean(q) || open.has(t.id)
        return (
          <section key={t.id} id={`team-${t.id}`} className="panel" style={{ scrollMarginTop: 90 }}>
            <button
              className="panel-h team-toggle"
              aria-expanded={expanded}
              onClick={() => toggle(t.id)}
            >
              <span className="who">
                <span className="crest" style={{ background: t.crest }}>{t.initials}</span>
                <b>{t.name}</b>
                <span className="sub">{t.manager}</span>
              </span>
              <span className="row" style={{ gap: 8 }}>
                <span className="tag t-mute num">{t.players} {s.colPlayers}</span>
                {t.breaches.length > 0 ? (
                  <span className="tag t-crit" title={t.breaches.join(' · ')}>{s.rulesFail}</span>
                ) : (
                  <span className="tag t-ok">{s.rulesPass}</span>
                )}
                {t.locked && <span className="tag t-warn">{s.lockedYes}</span>}
                <span className="cell-arrow">{expanded ? '▾' : '▸'}</span>
              </span>
            </button>

            {expanded &&
              (t.shown.length === 0 ? (
                <div className="panel-b"><p className="hint">{s.plNoMembers}</p></div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{s.fFullName}</th>
                        <th>{s.fIC}</th>
                        <th>{s.fStudentId}</th>
                        <th>{s.fCourse}</th>
                        <th>{s.fPhone}</th>
                        <th>{s.fJerseyName}</th>
                        <th>{s.fSize}</th>
                        <th>{s.plNewSource}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.shown.map((m) => (
                        <tr key={m.id} style={m.pending ? { opacity: 0.6 } : undefined}>
                          <td className="num">
                            <span className="jno" style={{ fontSize: 20 }}>
                              {m.jerseyNo === null ? '—' : String(m.jerseyNo).padStart(2, '0')}
                            </span>
                          </td>
                          <td>
                            <div className="who">
                              {m.photo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img className="photo" style={{ width: 34, height: 43 }} src={m.photo} alt="" />
                              ) : (
                                <span className="photo" style={{ width: 34, height: 43, fontSize: 11 }}>
                                  {m.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')}
                                </span>
                              )}
                              <div>
                                <div className="pname">{m.name}</div>
                                <div className="badges" style={{ marginTop: 3 }}>
                                  <span className={`tag ${m.rank === 'manager' || m.rank === 'coach' ? 't-pink' : m.rank === 'captain' ? 't-warn' : 't-mute'}`}>
                                    {RANK_LABEL[m.rank]}
                                  </span>
                                  {m.tier !== 'none' && m.rank !== 'state' && m.rank !== 'masiswa' && (
                                    <span className="tag t-ok">{m.tier === 'state' ? 'State' : 'Masiswa'}</span>
                                  )}
                                  {!m.isPlayer && <span className="tag t-mute">non-playing</span>}
                                  {m.pending && <span className="tag t-warn">{s.statusPending}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="num" style={{ whiteSpace: 'nowrap' }}>{m.ic}</td>
                          <td className="num">{m.studentId || '—'}</td>
                          <td>
                            {m.course || '—'}
                            {m.year && <div className="sub">{m.year}</div>}
                          </td>
                          <td className="num" style={{ whiteSpace: 'nowrap' }}>{m.phone || '—'}</td>
                          <td className="num">{m.jerseyName ?? '—'}</td>
                          <td className="num">{m.size ?? '—'}</td>
                          <td>
                            <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                              <span className={`tag ${m.isNew ? 't-ok' : 't-mute'}`}>{m.isNew ? 'New' : 'Returning'}</span>
                              <button className="btn btn-sm" disabled={busy} onClick={() => flipNew(m)}>
                                {m.isNew ? s.markReturning : s.markNew}
                              </button>
                            </div>
                            <div className="sub">{srcLabel(m)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </section>
        )
      })}
    </div>
  )
}
