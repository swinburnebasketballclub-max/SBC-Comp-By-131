import { redirect } from 'next/navigation'

import { translator } from '@/lib/i18n/server'
import { getViewer } from '@/lib/session'

export const metadata = { title: 'My team' }

export default async function TeamHome() {
  const viewer = await getViewer()
  if (viewer.kind === 'anon') redirect('/login?next=/team')
  if (viewer.kind !== 'manager') redirect('/no-access')

  const tr = await translator()

  return (
    <div className="stack" style={{ paddingTop: 40 }}>
      <div>
        <div className="eyebrow">{tr('roleManager')}</div>
        <h1 style={{ fontSize: 30, fontWeight: 800 }}>{viewer.teams[0]?.name}</h1>
      </div>
      <div className="note ok">
        <span>Signed in and recognised as a team manager. The roster screens are being built next.</span>
      </div>
    </div>
  )
}
