'use client'

import { useState, useTransition } from 'react'

import { errorText, fill, type Strings } from '@/lib/i18n/dict'
import type { Competition } from '@/lib/supabase/database.types'
import { lockAllRosters, saveRules, type RulesInput } from '../registry-actions'

type Tier = { id: string; label: string; amount_cents: number }
type Clause = { body_en: string; body_zh: string }

const STATUSES = ['draft', 'open', 'closed', 'locked', 'running', 'finished'] as const
const STATUS_KEY = {
  draft: 'stDraft', open: 'stOpen', closed: 'stClosed', locked: 'stLocked', running: 'stRunning', finished: 'stFinished',
} as const

const hhmm = (t: string) => t.slice(0, 5)
const rm = (cents: number) => String(cents / 100)
const toCents = (v: string) => Math.round(Number(v) * 100)

export function RulesForm({
  comp, tiers, terms, openTeams, totalTeams, s,
}: {
  comp: Competition
  tiers: Tier[]
  terms: Clause[]
  openTeams: number
  totalTeams: number
  s: Strings
}) {
  const [f, setF] = useState({
    status: comp.status,
    name_en: comp.name_en,
    name_zh: comp.name_zh,
    venue_en: comp.venue_en,
    venue_zh: comp.venue_zh,
    starts_on: comp.starts_on,
    ends_on: comp.ends_on,
    registration_deadline: comp.registration_deadline,
    max_teams: String(comp.max_teams),
    roster_min: String(comp.roster_min),
    roster_max: String(comp.roster_max),
    max_coaches: String(comp.max_coaches),
    max_masiswa: String(comp.max_masiswa),
    max_state: String(comp.max_state),
    deposit: rm(comp.deposit_cents),
    bank_name: comp.bank_name,
    bank_holder: comp.bank_holder,
    bank_account: comp.bank_account,
    bank_whatsapp: comp.bank_whatsapp,
    daily_start: hhmm(comp.daily_start),
    daily_end: hhmm(comp.daily_end),
    match_minutes: String(comp.match_minutes),
    courts: String(comp.courts),
    min_colour_distance: String(comp.min_colour_distance),
  })
  const [fees, setFees] = useState(tiers.map((t) => ({ ...t, amount: rm(t.amount_cents) })))
  const [clauses, setClauses] = useState<Clause[]>(terms)
  const [dirty, setDirty] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, start] = useTransition()
  const [locking, startLock] = useTransition()
  const [lockMsg, setLockMsg] = useState<string | null>(null)

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setF((prev) => ({ ...prev, [k]: e.target.value }))
    setDirty(true)
    setMsg(null)
  }

  const input = (k: keyof typeof f, label: string, type = 'text', extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="field">
      <span>{label}</span>
      <input className={`inp${type !== 'text' ? ' num' : ''}`} type={type} value={f[k]} onChange={set(k)} {...extra} />
    </label>
  )

  function editClause(i: number, patch: Partial<Clause>) {
    setClauses((prev) => prev.map((c, j) => (j === i ? { ...c, ...patch } : c)))
    setDirty(true)
    setMsg(null)
  }

  function moveClause(i: number, by: number) {
    setClauses((prev) => {
      const next = [...prev]
      const j = i + by
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j]!, next[i]!]
      return next
    })
    setDirty(true)
  }

  function save() {
    const payload: RulesInput = {
      competitionId: comp.id,
      status: f.status,
      name_en: f.name_en,
      name_zh: f.name_zh,
      venue_en: f.venue_en,
      venue_zh: f.venue_zh,
      starts_on: f.starts_on,
      ends_on: f.ends_on,
      registration_deadline: f.registration_deadline,
      max_teams: Number(f.max_teams),
      roster_min: Number(f.roster_min),
      roster_max: Number(f.roster_max),
      max_coaches: Number(f.max_coaches),
      max_masiswa: Number(f.max_masiswa),
      max_state: Number(f.max_state),
      deposit_cents: toCents(f.deposit),
      bank_name: f.bank_name,
      bank_holder: f.bank_holder,
      bank_account: f.bank_account,
      bank_whatsapp: f.bank_whatsapp,
      daily_start: f.daily_start,
      daily_end: f.daily_end,
      match_minutes: Number(f.match_minutes),
      courts: Number(f.courts),
      min_colour_distance: Number(f.min_colour_distance),
      tiers: fees.map((t) => ({ id: t.id, amount_cents: toCents(t.amount) })),
      terms: clauses,
    }
    start(async () => {
      const r = await saveRules(payload)
      if (r.ok) {
        setDirty(false)
        setMsg({ ok: true, text: s.rsSaved })
      } else {
        setMsg({ ok: false, text: errorText(r.code, s) })
      }
    })
  }

  return (
    <div className="stack">
      {/* ---------------------------------------------------- status & lock */}
      <section className="panel">
        <div className="panel-h"><h2>{s.rsStatusTitle}</h2></div>
        <div className="panel-b split">
          <div className="stack" style={{ gap: 10 }}>
            <select className="inp" value={f.status} onChange={set('status')} style={{ maxWidth: 260 }}>
              {STATUSES.map((st) => (
                <option key={st} value={st}>{s[STATUS_KEY[st]]}</option>
              ))}
            </select>
            <p className="hint">{s.rsStatusHint}</p>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            <div className="row">
              <button
                className="btn"
                disabled={locking || openTeams === 0}
                onClick={() => {
                  if (!confirm(s.lockAllConfirm)) return
                  startLock(async () => {
                    const r = await lockAllRosters(comp.id)
                    setLockMsg(r.ok ? fill(s.lockedN, { n: r.count ?? 0 }) : errorText(r.code, s))
                  })
                }}
              >
                🔒 {locking ? s.working : s.lockAll}
              </button>
              <span className="hint num">{totalTeams - openTeams} / {totalTeams} {s.lockedYes}</span>
            </div>
            <p className="hint">{s.lockAllHint}</p>
            {lockMsg && <div className="note ok">{lockMsg}</div>}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ competition */}
      <section className="panel">
        <div className="panel-h"><h2>{s.rsCompetition}</h2></div>
        <div className="panel-b form-grid">
          {input('name_en', s.rsNameEn)}
          {input('name_zh', s.rsNameZh)}
          {input('venue_en', s.rsVenueEn)}
          {input('venue_zh', s.rsVenueZh)}
          {input('registration_deadline', s.rsDeadline, 'date')}
          {input('starts_on', s.rsStarts, 'date')}
          {input('ends_on', s.rsEnds, 'date')}
        </div>
      </section>

      {/* ----------------------------------------------------------- limits */}
      <section className="panel">
        <div className="panel-h"><h2>{s.rsLimits}</h2></div>
        <div className="panel-b form-grid">
          {input('max_teams', s.rsMaxTeams, 'number', { min: 2, max: 64 })}
          {input('roster_min', s.rsRosterMin, 'number', { min: 1, max: 30 })}
          {input('roster_max', s.rsRosterMax, 'number', { min: 1, max: 30 })}
          {input('max_coaches', s.rsMaxCoaches, 'number', { min: 0, max: 5 })}
          {input('max_masiswa', s.rsMaxMasiswa, 'number', { min: 0, max: 30 })}
          {input('max_state', s.rsMaxState, 'number', { min: 0, max: 30 })}
        </div>
      </section>

      {/* ------------------------------------------------------------ money */}
      <section className="panel">
        <div className="panel-h"><h2>{s.rsMoney}</h2></div>
        <div className="panel-b stack" style={{ gap: 16 }}>
          <div className="form-grid">
            {fees.map((t, i) => (
              <label key={t.id} className="field">
                <span>{t.label} (RM)</span>
                <input
                  className="inp num"
                  type="number"
                  min={0}
                  step="1"
                  value={t.amount}
                  onChange={(e) => {
                    const v = e.target.value
                    setFees((prev) => prev.map((x, j) => (j === i ? { ...x, amount: v } : x)))
                    setDirty(true)
                    setMsg(null)
                  }}
                />
              </label>
            ))}
            {input('deposit', s.rsDeposit, 'number', { min: 0, step: '1' })}
          </div>
          <p className="hint">{s.rsFeeNote}</p>
          <div className="form-grid">
            {input('bank_name', s.bankName)}
            {input('bank_holder', s.bankHolder)}
            {input('bank_account', s.bankAccount)}
            {input('bank_whatsapp', s.rsWhatsapp)}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- fixtures & colour */}
      <section className="panel">
        <div className="panel-h"><h2>{s.rsFixtures}</h2></div>
        <div className="panel-b stack" style={{ gap: 14 }}>
          <div className="form-grid">
            {input('daily_start', s.rsDailyStart, 'time')}
            {input('daily_end', s.rsDailyEnd, 'time')}
            {input('match_minutes', s.rsMatchMinutes, 'number', { min: 20, max: 180 })}
            {input('courts', s.rsCourts, 'number', { min: 1, max: 4 })}
            {input('min_colour_distance', s.rsColourGap, 'number', { min: 0, max: 200 })}
          </div>
          <p className="hint">{s.rsColourGapHint}</p>
        </div>
      </section>

      {/* ------------------------------------------------------------ terms */}
      <section className="panel">
        <div className="panel-h">
          <h2>{s.rsTerms}</h2>
          <span className="hint num">{clauses.length}</span>
        </div>
        <div className="panel-b" style={{ paddingBottom: 0 }}><p className="hint">{s.rsTermsHint}</p></div>
        <div style={{ marginTop: 12 }}>
          {clauses.map((c, i) => (
            <div key={i} className="clause">
              <span className="clause-no num">{i + 1}</span>
              <textarea
                className="inp"
                rows={3}
                lang="en"
                value={c.body_en}
                placeholder="English"
                onChange={(e) => editClause(i, { body_en: e.target.value })}
              />
              <textarea
                className="inp"
                rows={3}
                lang="zh"
                value={c.body_zh}
                placeholder="中文"
                onChange={(e) => editClause(i, { body_zh: e.target.value })}
              />
              <div className="stack" style={{ gap: 4 }}>
                <button className="btn btn-sm" aria-label="Move up" disabled={i === 0} onClick={() => moveClause(i, -1)}>↑</button>
                <button className="btn btn-sm" aria-label="Move down" disabled={i === clauses.length - 1} onClick={() => moveClause(i, 1)}>↓</button>
                <button
                  className="btn btn-sm"
                  aria-label={s.remove}
                  onClick={() => {
                    if (!confirm(`${s.remove} #${i + 1}?`)) return
                    setClauses((prev) => prev.filter((_, j) => j !== i))
                    setDirty(true)
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="panel-b" style={{ borderTop: '1px solid var(--line-soft)' }}>
          <button
            className="btn btn-sm"
            onClick={() => {
              setClauses((prev) => [...prev, { body_en: '', body_zh: '' }])
              setDirty(true)
            }}
          >
            + {s.rsAddClause}
          </button>
        </div>
      </section>

      <div className="save-bar">
        {msg && <span className={`tag ${msg.ok ? 't-ok' : 't-crit'}`} style={{ whiteSpace: 'normal' }}>{msg.text}</span>}
        <button className="btn btn-primary" disabled={busy || !dirty} onClick={save}>
          {busy ? s.working : s.rsSaveAll}
        </button>
      </div>
    </div>
  )
}
