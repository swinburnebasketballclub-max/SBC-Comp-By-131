import { redirect } from 'next/navigation'

import { SignOutButton } from '@/components/SignOutButton'
import { translator } from '@/lib/i18n/server'
import { getViewer, homeFor } from '@/lib/session'

export const metadata = { title: 'No access' }

export default async function NoAccess() {
  const viewer = await getViewer()
  if (viewer.kind === 'anon') redirect('/login')
  if (viewer.kind !== 'unknown') redirect(homeFor(viewer))

  const tr = await translator()

  return (
    <div className="stack" style={{ paddingTop: 64, maxWidth: 560, gap: 20 }}>
      <div>
        <div className="eyebrow">{viewer.email}</div>
        <h1 style={{ fontSize: 30, fontWeight: 800 }}>{tr('noAccessTitle')}</h1>
        <p className="lede" style={{ marginTop: 12 }}>{tr('noAccessBody')}</p>
      </div>
      <div className="row">
        <SignOutButton label={tr('signOut')} />
      </div>
    </div>
  )
}
