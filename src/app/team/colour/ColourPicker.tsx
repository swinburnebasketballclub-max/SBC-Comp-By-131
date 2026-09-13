'use client'

import { useState, useTransition } from 'react'

import { Upload } from '@/components/Upload'
import { errorText, type Strings } from '@/lib/i18n/dict'
import { colourDistance } from '@/lib/image'
import type { ColourStatus } from '@/lib/supabase/database.types'
import { claimColour, saveDesign } from '../actions'

const STANDARD = [
  { hex: '#D62828', en: 'Red', zh: '红' },
  { hex: '#2457C5', en: 'Royal Blue', zh: '宝蓝' },
  { hex: '#141418', en: 'Black', zh: '黑' },
  { hex: '#F2F2F4', en: 'White', zh: '白' },
  { hex: '#F07C1E', en: 'Orange', zh: '橙' },
  { hex: '#7B3FBF', en: 'Purple', zh: '紫' },
  { hex: '#7A1F2B', en: 'Maroon', zh: '酒红' },
  { hex: '#4FC3E8', en: 'Sky Blue', zh: '天蓝' },
  { hex: '#9A9BA3', en: 'Grey', zh: '灰' },
  { hex: '#152A4E', en: 'Navy', zh: '海军蓝' },
  { hex: '#2E8B57', en: 'Green', zh: '绿' },
  { hex: '#F2C230', en: 'Yellow', zh: '黄' },
]

type Taken = { hex: string; name: string; at: string }

type Props = {
  teamId: string
  competitionId: string
  paid: boolean
  minDistance: number
  taken: Taken[]
  mine: null | {
    hex: string
    name: string
    status: ColourStatus
    at: string
    designUrl: string | null
    designNote: string
  }
  editable: boolean
  locale: 'en' | 'zh'
  s: Strings
}

export function ColourPicker({ teamId, competitionId, paid, minDistance, taken, mine, editable, locale, s }: Props) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [custom, setCustom] = useState('#E2578C')
  const [customName, setCustomName] = useState('')
  const [designPath, setDesignPath] = useState<string | null>(null)
  const [note, setNote] = useState(mine?.designNote ?? '')
  const [saved, setSaved] = useState(false)

  /** The closest already-claimed colour, if it is too close. */
  function clash(hex: string) {
    return taken
      .map((t) => ({ t, d: colourDistance(hex, t.hex) }))
      .filter((x) => x.d < minDistance)
      .sort((a, b) => a.d - b.d)[0]?.t
  }

  function claim(hex: string, nameEn: string, nameZh: string, isCustom: boolean) {
    setError(null)
    start(async () => {
      const r = await claimColour({ teamId, competitionId, hex, nameEn, nameZh, isCustom })
      if (!r.ok) setError(errorText(r.code, s))
    })
  }

  const canClaim = paid && editable && !mine
  const customClash = clash(custom)

  return (
    <div className="stack" style={{ gap: 18 }}>
      {!paid && !mine && <div className="note warn">🔒 {s.colourLocked}</div>}
      {error && <div className="note crit">{error}</div>}

      {mine && (
        <section className="panel">
          <div className="panel-h">
            <h2>{s.yourColour}</h2>
            <span className={`tag ${mine.status === 'approved' ? 't-ok' : 't-warn'}`}>
              {mine.status === 'approved' ? s.colApproved : s.colPending}
            </span>
          </div>
          <div className="panel-b colour-hero">
            <span className="colour-big" style={{ background: mine.hex }} />
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800 }}>{mine.name}</div>
              <div className="sub num">{mine.hex.toUpperCase()} · {s.claimedAt} {mine.at}</div>
            </div>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-h">
          <h2>{s.takenColours}</h2>
          <span className="hint num">{taken.length}</span>
        </div>
        <div className="panel-b row" style={{ gap: 8 }}>
          {taken.length === 0 ? (
            <span className="hint">{s.noTakenYet}</span>
          ) : (
            taken.map((t, i) => (
              <span key={`${t.hex}-${i}`} className="row" style={{ gap: 7, padding: '5px 10px', border: '1px solid var(--line)', borderRadius: 20, background: 'var(--panel-2)' }}>
                <span className="num sub">{i + 1}</span>
                <span className="swatch" style={{ background: t.hex }} />
                <b style={{ fontSize: 12.5 }}>{t.name}</b>
                <span className="sub num">{t.at}</span>
              </span>
            ))
          )}
        </div>
      </section>

      {!mine && (
        <>
          <section className="panel">
            <div className="panel-h"><h2>{s.standardColours}</h2></div>
            <div className="panel-b" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 9 }}>
              {STANDARD.map((c) => {
                const blocker = clash(c.hex)
                const disabled = !canClaim || Boolean(blocker) || pending
                return (
                  <button
                    key={c.hex}
                    type="button"
                    disabled={disabled}
                    onClick={() => claim(c.hex, c.en, c.zh, false)}
                    className="colour-tile"
                  >
                    <span className="colour-chip" style={{ background: c.hex, filter: blocker ? 'grayscale(.75) brightness(.5)' : undefined }} />
                    <b>{locale === 'zh' ? c.zh : c.en}</b>
                    <span className="sub">{blocker ? `✕ ${blocker.name}` : canClaim ? s.claimColour : '—'}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="panel">
            <div className="panel-h"><h2>{s.mixColour}</h2></div>
            <div className="panel-b row" style={{ gap: 18, alignItems: 'center' }}>
              <input
                type="color"
                value={custom}
                disabled={!canClaim}
                onChange={(e) => setCustom(e.target.value.toUpperCase())}
                style={{ width: 88, height: 88, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--panel-2)', padding: 4 }}
              />
              <div className="stack" style={{ gap: 10, flex: 1, minWidth: 220 }}>
                <div className="form-grid">
                  <label className="field">
                    <span>HEX</span>
                    <input
                      className="inp num"
                      value={custom}
                      disabled={!canClaim}
                      onChange={(e) => {
                        const v = e.target.value.toUpperCase()
                        if (/^#[0-9A-F]{0,6}$/.test(v)) setCustom(v)
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>{s.colourName} <span className="req">*</span></span>
                    <input className="inp" value={customName} disabled={!canClaim} onChange={(e) => setCustomName(e.target.value)} placeholder="Lime Green" />
                  </label>
                </div>
                {/^#[0-9A-F]{6}$/.test(custom) && (
                  <div className={`note ${customClash ? 'crit' : 'ok'}`}>
                    {customClash ? `${s.tooClose}: ${customClash.name}` : `✓ ${s.colourFine}`}
                  </div>
                )}
                <div>
                  <button
                    className="btn btn-primary"
                    disabled={!canClaim || pending || Boolean(customClash) || !/^#[0-9A-F]{6}$/.test(custom) || customName.trim().length < 2}
                    onClick={() => claim(custom, customName, customName, true)}
                  >
                    {pending ? s.working : s.claimColour}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {mine && (
        <section className="panel">
          <div className="panel-h"><h2>{s.submitDesign}</h2></div>
          <div className="panel-b stack" style={{ gap: 14, maxWidth: 620 }}>
            <p className="hint">{s.designHint}</p>
            {mine.status === 'pending' && editable ? (
              <>
                <Upload
                  bucket="jersey-designs"
                  folder={`teams/${teamId}/design`}
                  accept="image/*,application/pdf"
                  shape="wide"
                  maxEdge={1800}
                  label={s.chooseFile}
                  replaceLabel={s.replaceFile}
                  previewUrl={mine.designUrl}
                  onUploaded={(path) => setDesignPath(path)}
                  failedText={s.photoFailed}
                  uploadingText={s.uploading}
                />
                <label className="field">
                  <span>{s.designNote}</span>
                  <textarea className="inp" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
                </label>
                <div className="row">
                  <button
                    className="btn btn-primary"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const r = await saveDesign(teamId, designPath, note)
                        if (!r.ok) return setError(errorText(r.code, s))
                        setSaved(true)
                        setTimeout(() => setSaved(false), 1800)
                      })
                    }
                  >
                    {pending ? s.working : s.saveDesign}
                  </button>
                  {saved && <span className="tag t-ok">✓ {s.saved}</span>}
                </div>
              </>
            ) : (
              <>
                {mine.designUrl ? (
                  <a className="btn btn-sm" href={mine.designUrl} target="_blank" rel="noreferrer" style={{ alignSelf: 'flex-start' }}>
                    {s.openDesign} ↗
                  </a>
                ) : (
                  <span className="sub">{s.noDesign}</span>
                )}
                {mine.designNote && <p style={{ color: 'var(--text-2)' }}>{mine.designNote}</p>}
              </>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
