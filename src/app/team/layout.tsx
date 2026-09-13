import { managerContext } from '@/lib/team'
import { translator } from '@/lib/i18n/server'
import { stamp } from '@/lib/format'
import { initials } from '@/lib/competition'
import { publicUrl } from '@/lib/team'
import { TeamNav } from './TeamNav'

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const ctx = await managerContext()
  const tr = await translator()
  const logo = publicUrl('team-logos', ctx.team.logo_path)

  return (
    <div className="admin-shell">
      <aside className="admin-rail">
        <div className="admin-who">
          <span className="who">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="crest" style={{ objectFit: 'cover' }} />
            ) : (
              <span className="crest" style={{ background: ctx.team.crest_color }}>{initials(ctx.team.name)}</span>
            )}
            <strong>{ctx.team.name}</strong>
          </span>
          <span className="sub">{tr('roleManager')} · {ctx.comp.season}</span>
        </div>
        <TeamNav
          ready={Boolean(ctx.team.terms_accepted_at)}
          items={[
            { href: '/team', label: tr('mNavRoster') },
            { href: '/team/fee', label: tr('mNavFee') },
            { href: '/team/colour', label: tr('mNavColour') },
            { href: '/team/export', label: tr('mNavExport') },
          ]}
          replayLabel={tr('mReplayTour')}
        />
      </aside>
      <div className="admin-body">
        {!ctx.editable && <div className="note warn">🔒 {tr('mLockedBanner')}</div>}
        {ctx.editWindowUntil && (
          <div className="note ok">{tr('mWindowBanner')} {stamp(ctx.editWindowUntil)}</div>
        )}
        {children}
      </div>
    </div>
  )
}
