import { redirect } from 'next/navigation'

import { translator } from '@/lib/i18n/server'
import { getViewer } from '@/lib/session'

export const metadata = { title: 'Organiser' }

export default async function AdminHome() {
  const viewer = await getViewer()
  if (viewer.kind === 'anon') redirect('/login?next=/admin')
  if (viewer.kind !== 'admin') redirect('/no-access')

  const tr = await translator()

  return (
    <div className="stack" style={{ paddingTop: 40 }}>
      <div>
        <div className="eyebrow">{tr('roleAdmin')} · {viewer.admin.role}</div>
        <h1 style={{ fontSize: 30, fontWeight: 800 }}>{viewer.name}</h1>
      </div>
      <div className="note ok">
        <span>Signed in and recognised as an organiser. The console is being built next.</span>
      </div>
    </div>
  )
}
