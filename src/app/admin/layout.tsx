import { redirect } from 'next/navigation'

import { translator } from '@/lib/i18n/server'
import { getViewer } from '@/lib/session'
import { AdminNav } from './AdminNav'

/**
 * Guards the whole console. `finance` and `fixtures` organisers see a
 * narrower menu; the pages themselves check again, because a menu that hides
 * a link is not a permission.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer()
  if (viewer.kind === 'anon') redirect('/login?next=/admin')
  if (viewer.kind !== 'admin') redirect('/no-access')

  const tr = await translator()
  const role = viewer.admin.role

  const items: { href: string; label: string }[] = []
  const push = (href: string, label: string) => items.push({ href, label })

  if (role === 'super') {
    push('/admin', tr('navOverview'))
    push('/admin/teams', tr('navTeams'))
    push('/admin/payments', tr('navPayments'))
    push('/admin/colours', tr('navColours'))
    push('/admin/players', tr('navPlayers'))
    push('/admin/veterans', tr('navVeterans'))
    push('/admin/schedule', tr('navSchedule'))
    push('/admin/rules', tr('navRules'))
  } else if (role === 'finance') {
    push('/admin', tr('navOverview'))
    push('/admin/payments', tr('navPayments'))
  } else {
    push('/admin', tr('navOverview'))
    push('/admin/schedule', tr('navSchedule'))
  }

  return (
    <div className="admin-shell">
      <aside className="admin-rail">
        <div className="admin-who">
          <strong>{viewer.name}</strong>
          <span className={`tag ${role === 'super' ? 't-pink' : 't-mute'}`}>
            {role === 'super' ? tr('roleSuper') : role === 'finance' ? tr('roleFinance') : tr('roleFixtures')}
          </span>
        </div>
        <AdminNav items={items} />
      </aside>
      <div className="admin-body">{children}</div>
    </div>
  )
}

