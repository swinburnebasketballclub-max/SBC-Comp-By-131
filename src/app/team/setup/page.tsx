import { redirect } from 'next/navigation'

import { strings } from '@/lib/i18n/dict'
import { translator } from '@/lib/i18n/server'
import { competitionTerms, managerContext, publicUrl } from '@/lib/team'
import { SetupForm } from './SetupForm'

export const metadata = { title: 'Set up your team' }
export const dynamic = 'force-dynamic'

export default async function Setup() {
  const ctx = await managerContext()
  if (ctx.team.terms_accepted_at) redirect('/team')

  const tr = await translator()
  const terms = await competitionTerms(ctx.comp.id)

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">{ctx.comp.season}</div>
        <h1>{tr('setupTitle')}</h1>
        <p className="lede" style={{ marginTop: 10 }}>{tr('setupLede')}</p>
      </header>
      <SetupForm
        teamId={ctx.team.id}
        teamName={ctx.team.name}
        captainName={ctx.team.captain_name}
        captainWhatsapp={ctx.team.captain_whatsapp}
        logoUrl={publicUrl('team-logos', ctx.team.logo_path)}
        terms={terms.map((t) => (tr.locale === 'zh' ? t.body_zh : t.body_en))}
        s={strings(tr.locale)}
      />
    </>
  )
}
