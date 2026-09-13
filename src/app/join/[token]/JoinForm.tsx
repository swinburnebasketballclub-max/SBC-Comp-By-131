'use client'

import { useState } from 'react'

import { errorText, fill, type Strings } from '@/lib/i18n/dict'
import { shrinkImage } from '@/lib/image'
import { supabaseBrowser } from '@/lib/supabase/client'
import type { PlayerTier } from '@/lib/supabase/database.types'

export type JoinContext = {
  team: { name: string; crest: string; logo: string | null }
  competition: { name_en: string; name_zh: string; deadline: string }
  rules: { max_masiswa: number; max_state: number; roster_max: number }
  used: { masiswa: number; state: number; players: number }
  taken_numbers: number[]
  taken_jersey_names: string[]
  sizes: string[]
}

type Props = {
  token: string
  ctx: JoinContext
  logoUrl: string | null
  title: string
  competition: string
  deadline: string
  s: Strings
}

const initialsOf = (name: string) =>
  name.split(/\s+/).filter((w) => /^[A-Za-z0-9]/.test(w)).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('')

export function JoinForm({ token, ctx, logoUrl, title, competition, deadline, s }: Props) {
  const [fullName, setFullName] = useState('')
  const [ic, setIc] = useState('')
  const [phone, setPhone] = useState('')
  const [studentId, setStudentId] = useState('')
  const [course, setCourse] = useState('')
  const [year, setYear] = useState('')
  const [jerseyNo, setJerseyNo] = useState('')
  const [jerseyName, setJerseyName] = useState('')
  const [size, setSize] = useState('')
  const [tier, setTier] = useState<PlayerTier>('none')
  const [isNew, setIsNew] = useState(true)
  const [agree, setAgree] = useState(false)

  const [photo, setPhoto] = useState<{ path: string; preview: string } | null>(null)
  const [photoState, setPhotoState] = useState<'idle' | 'uploading' | 'failed' | 'unavailable'>('idle')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // Live checks against what the team already holds.
  const no = jerseyNo === '' ? null : Number(jerseyNo)
  const noTaken = no !== null && ctx.taken_numbers.includes(no)
  const upName = jerseyName.trim().toUpperCase()
  const nameTaken = upName !== '' && ctx.taken_jersey_names.includes(upName)
  const nameShape = upName === '' || /^[A-Z0-9 .'-]{2,10}$/.test(upName)
  const icDigits = ic.replace(/\D/g, '')
  const icShape = ic === '' || (icDigits.length >= 6 && icDigits.length <= 14)

  const quotaFull = ctx.used.masiswa >= ctx.rules.max_masiswa
  const stateFull = ctx.used.state >= ctx.rules.max_state
  const tierBlocked = (tier === 'masiswa' && quotaFull) || (tier === 'state' && (quotaFull || stateFull))

  const photoOk = Boolean(photo) || photoState === 'unavailable'
  const ready =
    fullName.trim().length >= 2 && icDigits.length >= 6 && icShape &&
    phone.trim() && studentId.trim() && course.trim() && year &&
    no !== null && !noTaken && upName && nameShape && !nameTaken && size &&
    !tierBlocked && photoOk && agree

  async function pickPhoto(file: File) {
    setPhotoState('uploading')
    try {
      const blob = await shrinkImage(file, 800)
      const body = new FormData()
      body.set('token', token)
      body.set('file', new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
      const res = await fetch('/api/join/photo', { method: 'POST', body })
      const json = (await res.json()) as { ok: boolean; path?: string; error?: string }
      if (json.error === 'PHOTO_UNAVAILABLE') return setPhotoState('unavailable')
      if (!json.ok || !json.path) throw new Error(json.error)
      setPhoto({ path: json.path, preview: URL.createObjectURL(blob) })
      setPhotoState('idle')
    } catch {
      setPhotoState('failed')
    }
  }

  async function submit() {
    setSending(true)
    setError(null)
    const { data, error: rpcError } = await supabaseBrowser().rpc('submit_player', {
      p_token: token,
      p: {
        full_name: fullName.trim(),
        ic_no: ic.trim(),
        phone: phone.trim(),
        student_id: studentId.trim(),
        course: course.trim(),
        study_year: year,
        jersey_no: no,
        jersey_name: upName,
        jersey_size: size,
        tier,
        is_new_player: isNew,
        photo_path: photo?.path ?? null,
      },
    })
    setSending(false)

    const result = data as { ok: boolean; error?: string } | null
    if (rpcError || !result?.ok) return setError(errorText(result?.error ?? 'UNKNOWN', s))
    setDone(true)
    window.scrollTo({ top: 0 })
  }

  const hero = (
    <div className="join-hero">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="sheet-logo" src={logoUrl} alt="" />
      ) : (
        <span className="sheet-logo" style={{ background: ctx.team.crest }}>{initialsOf(ctx.team.name)}</span>
      )}
      <div>
        <div className="eyebrow" style={{ marginBottom: 3 }}>{competition}</div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>{title}</h1>
      </div>
    </div>
  )

  if (done) {
    return (
      <div className="join stack" style={{ gap: 18 }}>
        {hero}
        <div style={{ fontSize: 52, textAlign: 'center' }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center' }}>{s.joinDoneTitle}</h2>
        <p className="lede" style={{ textAlign: 'center', margin: '0 auto' }}>
          {fill(s.joinDoneBody, { team: ctx.team.name })}
        </p>
        <div className="note">#{no} {upName} · {size}</div>
      </div>
    )
  }

  return (
    <div className="join stack" style={{ gap: 16, paddingBottom: 40 }}>
      {hero}
      <div className="note">{s.joinLede} · {s.deadline} {deadline}</div>

      <div className="sect">{s.sectAbout}</div>
      <label className="field">
        <span>{s.fFullName} <span className="req">*</span></span>
        <input className="inp" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </label>
      <label className="field">
        <span>{s.fIC} <span className="req">*</span></span>
        <input className={`inp num ${!icShape ? 'bad' : ''}`} inputMode="numeric" value={ic} onChange={(e) => setIc(e.target.value)} placeholder="030415-13-1234" />
      </label>
      <div className="form-grid">
        <label className="field">
          <span>{s.fPhone} <span className="req">*</span></span>
          <input className="inp num" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+6012-345 6789" />
        </label>
        <label className="field">
          <span>{s.fStudentId} <span className="req">*</span></span>
          <input className="inp num" inputMode="numeric" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
        </label>
        <label className="field">
          <span>{s.fCourse} <span className="req">*</span></span>
          <input className="inp" value={course} onChange={(e) => setCourse(e.target.value)} />
        </label>
        <label className="field">
          <span>{s.fYear} <span className="req">*</span></span>
          <select className="inp" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">—</option>
            {['Foundation', '1', '2', '3', '4'].map((y) => <option key={y}>{y}</option>)}
          </select>
        </label>
      </div>

      <div className="sect">{s.sectJersey}</div>
      <div className="form-grid">
        <label className="field">
          <span>{s.fJerseyNo} <span className="req">*</span></span>
          <input
            className={`inp num ${noTaken ? 'bad' : no !== null ? 'good' : ''}`}
            inputMode="numeric"
            maxLength={2}
            value={jerseyNo}
            onChange={(e) => setJerseyNo(e.target.value.replace(/\D/g, ''))}
          />
          {noTaken ? (
            <span className="hint bad">#{no} {s.takenNo}</span>
          ) : no !== null ? (
            <span className="hint good">#{no} {s.numberOk}</span>
          ) : null}
        </label>
        <label className="field">
          <span>{s.fJerseyName} <span className="req">*</span></span>
          <input
            className={`inp num ${nameTaken || !nameShape ? 'bad' : upName ? 'good' : ''}`}
            maxLength={10}
            value={jerseyName}
            onChange={(e) => setJerseyName(e.target.value.toUpperCase())}
          />
          {nameTaken && <span className="hint bad">“{upName}” {s.takenName}</span>}
          {!nameShape && <span className="hint bad">{s.nameRule}</span>}
        </label>
      </div>
      <div className="field">
        <span>{s.fSize} <span className="req">*</span></span>
        <div className="sizes">
          {ctx.sizes.map((z) => (
            <button key={z} type="button" className="size" aria-pressed={size === z} onClick={() => setSize(z)}>{z}</button>
          ))}
        </div>
      </div>

      <div className="sect">{s.fTier}</div>
      <label className="field">
        <span>{s.fTier}</span>
        <select className={`inp ${tierBlocked ? 'bad' : ''}`} value={tier} onChange={(e) => setTier(e.target.value as PlayerTier)}>
          <option value="none">{s.tierNone}</option>
          <option value="masiswa">{s.tierMasiswa}</option>
          <option value="state">{s.tierState}</option>
        </select>
        <span className={`hint ${tierBlocked ? 'bad' : ''}`}>
          {tierBlocked ? s.quotaFull : fill(s.joinQuota, { used: ctx.used.masiswa, max: ctx.rules.max_masiswa })}
        </span>
      </label>
      <label className="check">
        <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
        <span>{s.fNewPlayer}<span className="hint" style={{ display: 'block' }}>{s.fNewPlayerHint}</span></span>
      </label>

      <div className="sect">{s.fPhoto}</div>
      <div className="upload upload-portrait">
        <label className="upload-box" htmlFor="photo">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.preview} alt="" />
          ) : (
            <span className="upload-plus">{photoState === 'uploading' ? '…' : '＋'}</span>
          )}
        </label>
        <div className="stack" style={{ gap: 5 }}>
          <label htmlFor="photo" className="btn btn-sm" style={{ alignSelf: 'flex-start' }}>
            {photoState === 'uploading' ? s.uploading : photo ? s.replaceFile : s.chooseFile}
          </label>
          <span className="hint">{s.photoHint}</span>
          {photoState === 'failed' && <span className="hint bad">{s.photoFailed}</span>}
          {photoState === 'unavailable' && <span className="hint" style={{ color: 'var(--warn)' }}>{s.photoUnavailable}</span>}
        </div>
        <input
          id="photo"
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void pickPhoto(f)
            e.target.value = ''
          }}
        />
      </div>

      <label className="check" style={{ marginTop: 6 }}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>{s.joinAgree} <a href="/terms" target="_blank">{s.terms}</a></span>
      </label>

      {error && <div className="note crit">{error}</div>}

      <button className="btn btn-primary" style={{ justifyContent: 'center', padding: '12px' }} disabled={!ready || sending} onClick={submit}>
        {sending ? s.working : s.joinSubmit}
      </button>
    </div>
  )
}
