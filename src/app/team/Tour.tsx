'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import type { Strings } from '@/lib/i18n/dict'
import { TOUR_KEY } from './TeamNav'

const STEPS = [
  ['tour1Title', 'tour1Body', '🏀'],
  ['tour2Title', 'tour2Body', '🔗'],
  ['tour3Title', 'tour3Body', '🚫'],
  ['tour4Title', 'tour4Body', '⚖️'],
  ['tour5Title', 'tour5Body', '🎨'],
] as const

/** Shown once after setup, and again whenever the manager asks for it. */
export function Tour({ s }: { s: Strings }) {
  const params = useSearchParams()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let seen = false
    try {
      seen = localStorage.getItem(TOUR_KEY) === '1'
    } catch {
      // private browsing — just show it
    }
    if (params.get('tour') === '1' || !seen) setOpen(true)
  }, [params])

  function close() {
    try {
      localStorage.setItem(TOUR_KEY, '1')
    } catch {
      // nothing to remember it in
    }
    setOpen(false)
    setStep(0)
    if (params.get('tour')) router.replace('/team')
  }

  if (!open) return null
  const [title, body, icon] = STEPS[step]!
  const last = step === STEPS.length - 1

  return (
    <div className="modal-scrim">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="tour-title">
        <div className="modal-h">
          <span className="eyebrow" style={{ margin: 0 }}>{step + 1} / {STEPS.length}</span>
          <button className="btn btn-sm" onClick={close}>{s.tourSkip}</button>
        </div>
        <div className="modal-b stack" style={{ gap: 14 }}>
          <div className="tour-art" aria-hidden>{icon}</div>
          <h2 id="tour-title" style={{ fontSize: 22, fontWeight: 800 }}>{s[title]}</h2>
          <p style={{ color: 'var(--text-2)', lineHeight: 1.75 }}>{s[body]}</p>
        </div>
        <div className="modal-f">
          <div className="dots">
            {STEPS.map((_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}
          </div>
          <div className="row" style={{ gap: 8 }}>
            {step > 0 && <button className="btn" onClick={() => setStep(step - 1)}>{s.tourBack}</button>}
            <button className="btn btn-primary" onClick={() => (last ? close() : setStep(step + 1))}>
              {last ? s.tourDone : s.tourNext}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
