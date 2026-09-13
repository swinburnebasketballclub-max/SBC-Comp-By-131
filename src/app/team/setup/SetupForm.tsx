'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { Upload } from '@/components/Upload'
import { errorText, type Strings } from '@/lib/i18n/dict'
import { completeSetup } from '../actions'

export function SetupForm({
  teamId, teamName, captainName, captainWhatsapp, logoUrl, terms, s,
}: {
  teamId: string
  teamName: string
  captainName: string
  captainWhatsapp: string
  logoUrl: string | null
  terms: string[]
  s: Strings
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [logoPath, setLogoPath] = useState<string | null>(null)
  const [capName, setCapName] = useState(captainName)
  const [capWa, setCapWa] = useState(captainWhatsapp)
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function submit() {
    if (!agree) return setError(s.mustAgree)
    setError(null)
    start(async () => {
      const r = await completeSetup({ teamId, captainName: capName, captainWhatsapp: capWa, logoPath })
      if (!r.ok) return setError(errorText(r.code, s))
      router.replace('/team?tour=1')
      router.refresh()
    })
  }

  return (
    <div className="stack" style={{ gap: 18, maxWidth: 680 }}>
      <section className="panel">
        <div className="panel-h"><h2>{teamName}</h2></div>
        <div className="panel-b stack" style={{ gap: 16 }}>
          <div className="field">
            <span>{s.teamLogo}</span>
            <Upload
              bucket="team-logos"
              folder={`teams/${teamId}/logo`}
              label={s.chooseFile}
              replaceLabel={s.replaceFile}
              hint={s.logoHint}
              previewUrl={logoUrl}
              maxEdge={600}
              onUploaded={(path) => setLogoPath(path)}
              failedText={s.photoFailed}
              uploadingText={s.uploading}
            />
          </div>
          <div className="form-grid">
            <label className="field">
              <span>{s.fCaptain}</span>
              <input className="inp" value={capName} onChange={(e) => setCapName(e.target.value)} />
            </label>
            <label className="field">
              <span>{s.fieldCaptainWA}</span>
              <input
                className="inp"
                inputMode="tel"
                value={capWa}
                onChange={(e) => setCapWa(e.target.value)}
                placeholder="+6012-345 6789"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-h"><h2>{s.terms}</h2></div>
        <div className="panel-b stack" style={{ gap: 14 }}>
          <ol className="terms-box">
            {terms.map((t, i) => <li key={i}>{t}</li>)}
          </ol>
          <label className="check">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>{s.agreeTerms}</span>
          </label>
        </div>
      </section>

      {error && <div className="note crit">{error}</div>}

      <div>
        <button className="btn btn-primary" onClick={submit} disabled={pending}>
          {pending ? s.working : s.startRoster}
        </button>
      </div>
    </div>
  )
}
