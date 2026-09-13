'use client'

import { useMemo, useState, useTransition } from 'react'

import { errorText, fill, type Strings } from '@/lib/i18n/dict'
import { archiveSeason, deleteVeteran, importVeterans, type ActionResult, type VeteranInput } from '../registry-actions'

export type VetRow = {
  id: string
  ic: string
  name: string
  seasons: string[]
  note: string
  teamNow: string | null
}

const SEASON = /^\d{2}\s*S\s*\d$/i
const digits = (v: string) => v.replace(/\D/g, '')

/**
 * One line of a pasted sheet → a past player, or null.
 *
 * Column order is not trusted: the IC is whichever cell is mostly digits,
 * seasons are cells shaped like 25S1, and the name is the first other cell.
 * A header row has no IC and drops out on its own.
 */
function parseLine(line: string): VeteranInput | null {
  const cells = line.split(/\t|,|;/).map((c) => c.trim()).filter(Boolean)
  const icCell = cells.find((c) => /^[\d\s-]+$/.test(c) && digits(c).length >= 6 && digits(c).length <= 14)
  if (!icCell) return null
  const seasons = cells.filter((c) => SEASON.test(c)).map((c) => c.replace(/\s/g, '').toUpperCase())
  const name = cells.find((c) => c !== icCell && !SEASON.test(c) && /[A-Za-z一-鿿]/.test(c))
  if (!name || name.length < 2) return null
  return { ic: digits(icCell), name, seasons }
}

function Result({ r, s }: { r: ActionResult | null; s: Strings }) {
  if (!r) return null
  if (!r.ok) return <div className="note crit">{errorText(r.code, s)}</div>
  return <div className="note ok">{fill(s.vtImported, { added: r.added ?? 0, updated: r.updated ?? 0 })}</div>
}

// ------------------------------------------------------------ bulk paste --
export function BulkPaste({ s }: { s: Strings }) {
  const [text, setText] = useState('')
  const [checked, setChecked] = useState(false)
  const [result, setResult] = useState<ActionResult | null>(null)
  const [busy, start] = useTransition()

  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  const parsed = useMemo(() => lines.map(parseLine), [text]) // eslint-disable-line react-hooks/exhaustive-deps
  const good = parsed.filter((p): p is VeteranInput => p !== null)
  const bad = parsed.length - good.length

  return (
    <div className="stack" style={{ gap: 12 }}>
      <p className="hint">{s.vtBulkHint}</p>
      <textarea
        className="inp"
        rows={7}
        value={text}
        placeholder={'Tan Wei Ming\t010203-13-1234\t25S1\nLee Jia Hui\t020304-13-5678\t25S2'}
        onChange={(e) => {
          setText(e.target.value)
          setChecked(false)
          setResult(null)
        }}
      />

      {checked && lines.length > 0 && (
        <>
          <div className="row" style={{ gap: 8 }}>
            <span className="tag t-ok num">{good.length} {s.vtRowsOk}</span>
            {bad > 0 && <span className="tag t-crit num">{bad} {s.vtRowsBad}</span>}
          </div>
          {good.length > 0 && (
            <div className="tbl-wrap" style={{ maxHeight: 220, overflowY: 'auto' }}>
              <table>
                <tbody>
                  {good.slice(0, 50).map((g, i) => (
                    <tr key={i}>
                      <td>{g.name}</td>
                      <td className="num">{g.ic}</td>
                      <td className="num sub">{g.seasons.join(', ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Result r={result} s={s} />

      <div className="row">
        <button
          className="btn"
          onClick={() => {
            setResult(lines.length === 0 ? { ok: false, code: 'NOTHING' } : null)
            setChecked(lines.length > 0)
          }}
        >
          {s.vtPreview}
        </button>
        <button
          className="btn btn-primary"
          disabled={busy || !checked || good.length === 0}
          onClick={() =>
            start(async () => {
              const r = await importVeterans(good)
              setResult(r)
              if (r.ok) {
                setText('')
                setChecked(false)
              }
            })
          }
        >
          {busy ? s.working : `${s.vtImport}${checked ? ` (${good.length})` : ''}`}
        </button>
      </div>
    </div>
  )
}

// --------------------------------------------------------------- add one --
export function AddVeteran({ s }: { s: Strings }) {
  const [result, setResult] = useState<ActionResult | null>(null)
  const [busy, start] = useTransition()

  return (
    <form
      className="stack"
      style={{ gap: 12 }}
      onSubmit={(e) => {
        e.preventDefault()
        const form = e.currentTarget
        const f = new FormData(form)
        const ic = digits(String(f.get('ic') ?? ''))
        const name = String(f.get('name') ?? '').trim()
        if (ic.length < 6 || ic.length > 14) return setResult({ ok: false, code: 'IC_INVALID' })
        if (name.length < 2) return setResult({ ok: false, code: 'INVALID' })
        const seasons = String(f.get('seasons') ?? '')
          .split(/[,\s]+/)
          .map((x) => x.trim().toUpperCase())
          .filter(Boolean)
        start(async () => {
          const r = await importVeterans([{ ic, name, seasons, note: String(f.get('note') ?? '').trim() }])
          setResult(r)
          if (r.ok) form.reset()
        })
      }}
    >
      <label className="field">
        <span>{s.fFullName} <span className="req">*</span></span>
        <input className="inp" name="name" required />
      </label>
      <label className="field">
        <span>{s.fIC} <span className="req">*</span></span>
        <input className="inp num" name="ic" required inputMode="numeric" placeholder="010203-13-1234" />
      </label>
      <label className="field">
        <span>{s.vtSeasons}</span>
        <input className="inp num" name="seasons" placeholder="25S1, 25S2" />
        <span className="hint">{s.vtSeasonsHint}</span>
      </label>
      <label className="field">
        <span>{s.vtNote}</span>
        <input className="inp" name="note" />
      </label>
      <Result r={result} s={s} />
      <div>
        <button className="btn btn-primary" disabled={busy}>{busy ? s.working : s.save}</button>
      </div>
    </form>
  )
}

// ------------------------------------------------------------------ list --
export function VeteranList({ rows, s }: { rows: VetRow[]; s: Strings }) {
  const [query, setQuery] = useState('')
  const [busy, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const q = query.trim().toLowerCase()
  const shown = rows.filter(
    (r) =>
      !q ||
      r.name.toLowerCase().includes(q) ||
      (digits(q).length >= 3 && r.ic.includes(digits(q))) ||
      r.seasons.some((x) => x.toLowerCase() === q),
  )

  if (rows.length === 0) return <div className="panel-b"><p className="hint">{s.vtEmpty}</p></div>

  return (
    <>
      <div className="panel-b" style={{ paddingBottom: 12 }}>
        <input
          className="inp"
          type="search"
          style={{ maxWidth: 340 }}
          placeholder={s.plSearch}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {error && <div className="note crit" style={{ marginTop: 10 }}>{error}</div>}
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 560, overflowY: 'auto', borderTop: '1px solid var(--line-soft)' }}>
        <table>
          <thead>
            <tr>
              <th>{s.fFullName}</th>
              <th>{s.vtIcCol}</th>
              <th>{s.vtSeasons}</th>
              <th>{s.vtTeamNow}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.slice(0, 500).map((r) => (
              <tr key={r.id}>
                <td>
                  {r.name}
                  {r.note && <div className="sub">{r.note}</div>}
                </td>
                <td className="num">{r.ic}</td>
                <td className="num sub">{r.seasons.join(', ') || '—'}</td>
                <td>{r.teamNow ? <span className="tag t-pink">{r.teamNow}</span> : <span className="sub">—</span>}</td>
                <td className="right">
                  <button
                    className="btn btn-sm"
                    disabled={busy}
                    onClick={() => {
                      if (!confirm(`${s.vtDelete}: ${r.name}?`)) return
                      setError(null)
                      start(async () => {
                        const res = await deleteVeteran(r.id)
                        if (!res.ok) setError(errorText(res.code, s))
                      })
                    }}
                  >
                    {s.vtDelete}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// --------------------------------------------------------- end of season --
export function ArchiveSeason({ competitionId, label, disabled, s }: { competitionId: string; label: string; disabled: boolean; s: Strings }) {
  const [result, setResult] = useState<ActionResult | null>(null)
  const [busy, start] = useTransition()
  return (
    <div className="stack" style={{ gap: 10 }}>
      <Result r={result} s={s} />
      <div>
        <button
          className="btn"
          disabled={busy || disabled}
          onClick={() => {
            if (!confirm(label + '?')) return
            start(async () => setResult(await archiveSeason(competitionId)))
          }}
        >
          {busy ? s.working : label}
        </button>
      </div>
    </div>
  )
}
