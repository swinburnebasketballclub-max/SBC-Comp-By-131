'use client'

import { useState, useTransition } from 'react'

import { errorText, fill, type Strings } from '@/lib/i18n/dict'
import type { InviteLink } from '@/lib/supabase/database.types'
import { createLink, revokeLink } from './actions'

type Props = {
  teamId: string
  teamName: string
  season: string
  deadline: string
  links: InviteLink[]
  editable: boolean
  s: Strings
}

export function InviteLinks({ teamId, teamName, season, deadline, links, editable, s }: Props) {
  const [busy, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [personalFor, setPersonalFor] = useState('')
  const [askName, setAskName] = useState(false)

  const urlOf = (l: InviteLink) => `${window.location.origin}/join/${l.token}`

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      window.prompt('', text)
    }
  }

  function make(kind: 'shared' | 'single', label = '') {
    setError(null)
    start(async () => {
      const r = await createLink(teamId, kind, label)
      if (!r.ok) setError(errorText(r.code, s))
      setAskName(false)
      setPersonalFor('')
    })
  }

  return (
    <section className="panel">
      <div className="panel-h">
        <h2>{s.linksTitle}</h2>
        {editable && (
          <div className="row" style={{ gap: 6 }}>
            <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => make('shared')}>
              + {s.newTeamLink}
            </button>
            <button className="btn btn-sm" disabled={busy} onClick={() => setAskName((v) => !v)}>
              + {s.newPersonalLink}
            </button>
          </div>
        )}
      </div>

      {askName && (
        <div className="panel-b row" style={{ borderBottom: '1px solid var(--line-soft)' }}>
          <input
            className="inp"
            style={{ maxWidth: 260 }}
            placeholder={s.personalFor}
            value={personalFor}
            onChange={(e) => setPersonalFor(e.target.value)}
            autoFocus
          />
          <button className="btn btn-sm btn-primary" disabled={busy || !personalFor.trim()} onClick={() => make('single', personalFor)}>
            {s.save}
          </button>
        </div>
      )}

      {error && <div className="panel-b"><div className="note crit">{error}</div></div>}

      {links.length === 0 ? (
        <div className="panel-b"><p className="hint">{s.noLinks}</p></div>
      ) : (
        links.map((l) => {
          const dead = Boolean(l.revoked_at)
          const spent = l.max_uses !== null && l.uses >= l.max_uses
          const status = dead
            ? ['t-mute', s.linkRevoked]
            : spent
              ? ['t-ok', s.linkSpent]
              : l.kind === 'shared'
                ? ['t-pink', s.linkOpen]
                : ['t-warn', s.linkWaiting]

          return (
            <div key={l.id} className={`link-row ${dead ? 'dead' : ''}`}>
              <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                <div className="row" style={{ gap: 8 }}>
                  <b style={{ fontFamily: 'var(--display)', fontSize: 14 }}>
                    {l.kind === 'shared' ? s.linkTeam : `${s.linkPersonal} · ${l.label}`}
                  </b>
                  <span className={`tag ${status[0]}`}>{status[1]}</span>
                  <span className="sub num">
                    {s.linkUsed} {l.uses}{l.max_uses !== null ? ` / ${l.max_uses}` : ''}
                  </span>
                </div>
                <span className="link-url">/join/{l.token}</span>
              </div>

              {!dead && (
                <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                  <button className="btn btn-sm" onClick={() => copy(urlOf(l), `u-${l.id}`)}>
                    {copied === `u-${l.id}` ? `✓ ${s.copied}` : s.copyUrl}
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() =>
                      copy(fill(s.inviteMsg, { team: teamName, season, url: urlOf(l), deadline }), `m-${l.id}`)
                    }
                  >
                    {copied === `m-${l.id}` ? `✓ ${s.copied}` : s.copyMessage}
                  </button>
                  {editable && (
                    <button className="btn btn-sm" disabled={busy} onClick={() => start(async () => { await revokeLink(teamId, l.id) })}>
                      {s.revoke}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}

      <div className="panel-b" style={{ borderTop: '1px solid var(--line-soft)' }}>
        <p className="hint">{s.linksLede}</p>
      </div>
    </section>
  )
}
