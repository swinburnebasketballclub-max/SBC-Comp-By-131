import { redirect } from 'next/navigation'

import { SignInButton } from '@/components/SignInButton'
import { translator } from '@/lib/i18n/server'
import { getViewer, homeFor } from '@/lib/session'

export const metadata = { title: 'Sign in' }

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const viewer = await getViewer()
  if (viewer.kind !== 'anon') redirect(homeFor(viewer))

  const tr = await translator()
  const { error, next } = await searchParams

  return (
    <div className="stack" style={{ paddingTop: 64, maxWidth: 460, gap: 22 }}>
      <div>
        <div className="eyebrow">{tr('brand')}</div>
        <h1 style={{ fontSize: 30, fontWeight: 800 }}>{tr('signIn')}</h1>
        <p className="lede" style={{ marginTop: 12 }}>{tr('landingManagers')}</p>
      </div>

      {error && (
        <div className="note crit">
          <strong>{tr('signInFailed')}</strong>
          <span className="num" style={{ fontSize: 12 }}>{error}</span>
        </div>
      )}

      <div>
        <SignInButton label={tr('signIn')} next={next} />
      </div>

      <p className="hint">{tr('landingPlayers')}</p>
    </div>
  )
}
