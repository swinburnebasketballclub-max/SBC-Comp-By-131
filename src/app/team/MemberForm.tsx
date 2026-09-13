'use client'

import { useState, useTransition } from 'react'

import { Upload } from '@/components/Upload'
import { errorText, type Strings } from '@/lib/i18n/dict'
import type { PlayerTier, TeamMember } from '@/lib/supabase/database.types'
import { saveMember } from './actions'

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const

export type FormMode = 'manager' | 'coach' | 'player'

type Props = {
  mode: FormMode
  member: TeamMember | null
  photoUrl: string | null
  teamId: string
  competitionId: string
  takenNumbers: number[]
  takenNames: string[]
  s: Strings
  onClose: () => void
}

/**
 * One form for the manager's own details, the coach, and any player the
 * manager adds by hand. Jersey fields appear only for someone who plays.
 */
export function MemberForm({
  mode, member, photoUrl, teamId, competitionId, takenNumbers, takenNames, s, onClose,
}: Props) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(member?.full_name ?? '')
  const [icNo, setIcNo] = useState(member?.ic_no ?? '')
  const [phone, setPhone] = useState(member?.phone ?? '')
  const [studentId, setStudentId] = useState(member?.student_id ?? '')
  const [course, setCourse] = useState(member?.course ?? '')
  const [studyYear, setStudyYear] = useState(member?.study_year ?? '')
  const [tier, setTier] = useState<PlayerTier>(member?.tier ?? 'none')
  const [isCaptain, setIsCaptain] = useState(member?.is_captain ?? false)
  const [isPlayer, setIsPlayer] = useState(member ? member.is_player : mode === 'player')
  const [isNew, setIsNew] = useState(member?.is_new_player ?? true)
  const [jerseyNo, setJerseyNo] = useState(member?.jersey_no?.toString() ?? '')
  const [jerseyName, setJerseyName] = useState(member?.jersey_name ?? '')
  const [size, setSize] = useState(member?.jersey_size ?? '')
  const [photoPath, setPhotoPath] = useState<string | null>(null)

  // A person's own number and name are not "taken" while editing them.
  const others = {
    numbers: takenNumbers.filter((n) => n !== member?.jersey_no),
    names: takenNames.filter((n) => n !== member?.jersey_name),
  }
  const no = jerseyNo === '' ? null : Number(jerseyNo)
  const noClash = no !== null && others.numbers.includes(no)
  const upName = jerseyName.trim().toUpperCase()
  const nameClash = upName !== '' && others.names.includes(upName)
  const nameShape = upName === '' || /^[A-Z0-9 .'-]{2,10}$/.test(upName)

  const title =
    mode === 'manager' ? s.teamManager : mode === 'coach' ? s.headCoach : member ? s.memberEdit : s.addPlayer

  function submit() {
    setError(null)
    start(async () => {
      const r = await saveMember({
        id: member?.id,
        teamId,
        competitionId,
        fullName,
        icNo,
        phone,
        studentId,
        course,
        studyYear,
        tier: isPlayer ? tier : 'none',
        isManager: mode === 'manager' || Boolean(member?.is_manager),
        isCoach: mode === 'coach' || Boolean(member?.is_coach),
        isCaptain,
        isPlayer,
        isNewPlayer: isNew,
        jerseyNo: isPlayer ? no : null,
        jerseyName: upName,
        jerseySize: size,
        photoPath,
      })
      if (!r.ok) return setError(errorText(r.code, s))
      onClose()
    })
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <h2 style={{ fontSize: 19, fontWeight: 800 }}>{title}</h2>
          <button className="btn btn-sm" onClick={onClose}>{s.close} ✕</button>
        </div>

        <div className="modal-b stack" style={{ gap: 14 }}>
          <div className="field">
            <span>{s.fPhoto}</span>
            <Upload
              bucket="photos"
              folder={`teams/${teamId}/members`}
              shape="portrait"
              maxEdge={700}
              label={s.chooseFile}
              replaceLabel={s.replaceFile}
              hint={s.photoHint}
              previewUrl={photoUrl}
              onUploaded={(path) => setPhotoPath(path)}
              failedText={s.photoFailed}
              uploadingText={s.uploading}
            />
          </div>

          <label className="field">
            <span>{s.fFullName} <span className="req">*</span></span>
            <input className="inp" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>

          <div className="form-grid">
            <label className="field">
              <span>{s.fIC} <span className="req">*</span></span>
              <input className="inp num" inputMode="numeric" value={icNo} onChange={(e) => setIcNo(e.target.value)} placeholder="030415-13-1234" />
            </label>
            <label className="field">
              <span>{s.fPhone}</span>
              <input className="inp num" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+6012-345 6789" />
            </label>
            <label className="field">
              <span>{s.fStudentId}</span>
              <input className="inp num" inputMode="numeric" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
            </label>
            <label className="field">
              <span>{s.fCourse}</span>
              <input className="inp" value={course} onChange={(e) => setCourse(e.target.value)} />
            </label>
            <label className="field">
              <span>{s.fYear}</span>
              <input className="inp" value={studyYear} onChange={(e) => setStudyYear(e.target.value)} placeholder="1 / 2 / Foundation" />
            </label>
          </div>

          {mode !== 'player' && (
            <label className="check">
              <input type="checkbox" checked={isPlayer} onChange={(e) => setIsPlayer(e.target.checked)} />
              <span>{s.fPlays}</span>
            </label>
          )}

          {isPlayer && (
            <>
              <div className="form-grid">
                <label className="field">
                  <span>{s.fJerseyNo} <span className="req">*</span></span>
                  <input
                    className={`inp num ${noClash ? 'bad' : no !== null ? 'good' : ''}`}
                    inputMode="numeric"
                    maxLength={2}
                    value={jerseyNo}
                    onChange={(e) => setJerseyNo(e.target.value.replace(/\D/g, ''))}
                  />
                  {noClash && <span className="hint bad">#{no} {s.takenNo}</span>}
                </label>
                <label className="field">
                  <span>{s.fJerseyName} <span className="req">*</span></span>
                  <input
                    className={`inp num ${nameClash || !nameShape ? 'bad' : upName ? 'good' : ''}`}
                    maxLength={10}
                    value={jerseyName}
                    onChange={(e) => setJerseyName(e.target.value.toUpperCase())}
                  />
                  {nameClash && <span className="hint bad">“{upName}” {s.takenName}</span>}
                  {!nameShape && <span className="hint bad">{s.nameRule}</span>}
                </label>
              </div>

              <div className="field">
                <span>{s.fSize} <span className="req">*</span></span>
                <div className="sizes">
                  {SIZES.map((z) => (
                    <button key={z} type="button" className="size" aria-pressed={size === z} onClick={() => setSize(z)}>
                      {z}
                    </button>
                  ))}
                </div>
              </div>

              <label className="field">
                <span>{s.fTier}</span>
                <select className="inp" value={tier} onChange={(e) => setTier(e.target.value as PlayerTier)}>
                  <option value="none">{s.tierNone}</option>
                  <option value="masiswa">{s.tierMasiswa}</option>
                  <option value="state">{s.tierState}</option>
                </select>
              </label>

              <label className="check">
                <input type="checkbox" checked={isCaptain} onChange={(e) => setIsCaptain(e.target.checked)} />
                <span>{s.fCaptain}</span>
              </label>

              <label className="check">
                <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
                <span>
                  {s.fNewPlayer}
                  <span className="hint" style={{ display: 'block' }}>{s.fNewPlayerHint}</span>
                </span>
              </label>
            </>
          )}

          {error && <div className="note crit">{error}</div>}
        </div>

        <div className="modal-f">
          <span />
          <button
            className="btn btn-primary"
            disabled={pending || noClash || nameClash || !nameShape}
            onClick={submit}
          >
            {pending ? s.working : member ? s.save : s.memberAdd}
          </button>
        </div>
      </div>
    </div>
  )
}
