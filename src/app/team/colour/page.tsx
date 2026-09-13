import { strings } from '@/lib/i18n/dict'
import { translator } from '@/lib/i18n/server'
import { stamp } from '@/lib/format'
import { managerContext } from '@/lib/team'
import { supabaseServer } from '@/lib/supabase/server'
import { ColourPicker } from './ColourPicker'

export const metadata = { title: 'Jersey colour' }
export const dynamic = 'force-dynamic'

export default async function Colour() {
  const ctx = await managerContext()
  const tr = await translator()
  const s = strings(tr.locale)
  const supabase = await supabaseServer()

  // Every team can see which colours are gone — that is what makes first
  // come, first served fair. Team names are not exposed, only the colours.
  const { data: claims } = await supabase
    .from('jersey_colours')
    .select('team_id, hex, name_en, name_zh, claimed_at, status')
    .eq('competition_id', ctx.comp.id)
    .neq('status', 'rejected')
    .order('claimed_at')

  const taken = (claims ?? [])
    .filter((c) => c.team_id !== ctx.team.id)
    .map((c) => ({
      hex: c.hex,
      name: tr.locale === 'zh' && c.name_zh ? c.name_zh : c.name_en,
      at: stamp(c.claimed_at),
    }))

  const designUrl = ctx.colour?.design_path
    ? (await supabase.storage.from('jersey-designs').createSignedUrl(ctx.colour.design_path, 1800)).data?.signedUrl ?? null
    : null

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">{ctx.comp.season}</div>
        <h1>{s.mNavColour}</h1>
        <p className="lede" style={{ marginTop: 10 }}>{s.colourLede}</p>
      </header>

      <ColourPicker
        teamId={ctx.team.id}
        competitionId={ctx.comp.id}
        paid={ctx.payment?.status === 'approved'}
        minDistance={Number(ctx.comp.min_colour_distance)}
        taken={taken}
        mine={
          ctx.colour && {
            hex: ctx.colour.hex,
            name: tr.locale === 'zh' && ctx.colour.name_zh ? ctx.colour.name_zh : ctx.colour.name_en,
            status: ctx.colour.status,
            at: stamp(ctx.colour.claimed_at),
            designUrl,
            designNote: ctx.colour.design_note,
          }
        }
        editable={ctx.editable}
        locale={tr.locale}
        s={s}
      />
    </>
  )
}
