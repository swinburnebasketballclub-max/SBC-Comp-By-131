import { redirect } from 'next/navigation'

import { activeCompetition } from '@/lib/competition'
import { fill, strings } from '@/lib/i18n/dict'
import { translator } from '@/lib/i18n/server'
import { getViewer } from '@/lib/session'
import { supabaseServer } from '@/lib/supabase/server'
import { AddVeteran, ArchiveSeason, BulkPaste, VeteranList, type VetRow } from './VeteranForms'

export const metadata = { title: 'Past players' }
export const dynamic = 'force-dynamic'

export default async function VeteransPage() {
  const viewer = await getViewer()
  if (viewer.kind !== 'admin' || viewer.admin.role !== 'super') redirect('/admin')

  const tr = await translator()
  const s = strings(tr.locale)
  const comp = await activeCompetition()
  const supabase = await supabaseServer()

  const [{ data: vets }, { data: members }, { data: teams }] = await Promise.all([
    supabase.from('veteran_players').select('*').order('full_name').limit(5000),
    comp
      ? supabase.from('team_members').select('ic_norm, team_id, status, is_player').eq('competition_id', comp.id)
      : Promise.resolve({ data: [] as { ic_norm: string; team_id: string; status: string; is_player: boolean }[] }),
    comp
      ? supabase.from('teams').select('id, name').eq('competition_id', comp.id)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ])

  const teamName = new Map((teams ?? []).map((t) => [t.id, t.name]))
  const current = new Map(
    (members ?? []).filter((m) => m.status !== 'declined').map((m) => [m.ic_norm, teamName.get(m.team_id) ?? '']),
  )

  const rows: VetRow[] = (vets ?? []).map((v) => ({
    id: v.id,
    ic: v.ic_norm,
    name: v.full_name,
    seasons: v.seasons,
    note: v.note,
    teamNow: current.get(v.ic_norm) ?? null,
  }))
  const inComp = rows.filter((r) => r.teamNow !== null).length
  const archivable = (members ?? []).filter((m) => m.status === 'active' && m.is_player).length

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">SBC 5x5</div>
        <h1>{s.navVeterans}</h1>
        <p className="lede" style={{ marginTop: 10 }}>{s.vtLede}</p>
      </header>

      <div className="meta-strip">
        <div className="meta-cell">
          <div className="k">{s.vtCount}</div>
          <div className="v num">{rows.length}</div>
        </div>
        {comp && (
          <div className="meta-cell">
            <div className="k">{comp.season}</div>
            <div className="v num">{inComp}<small>{s.vtMatchesNow}</small></div>
          </div>
        )}
      </div>

      <div className="split">
        <section className="panel">
          <div className="panel-h"><h2>{s.vtBulk}</h2></div>
          <div className="panel-b"><BulkPaste s={s} /></div>
        </section>
        <section className="panel">
          <div className="panel-h"><h2>{s.vtAddOne}</h2></div>
          <div className="panel-b"><AddVeteran s={s} /></div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-h"><h2>{s.navVeterans}</h2><span className="hint num">{rows.length}</span></div>
        <VeteranList rows={rows} s={s} />
      </section>

      {comp && (
        <section className="panel">
          <div className="panel-h"><h2>{s.vtArchive}</h2></div>
          <div className="panel-b stack" style={{ gap: 12 }}>
            <p className="hint">{s.vtArchiveHint}</p>
            <ArchiveSeason
              competitionId={comp.id}
              label={fill(s.vtArchiveBtn, { n: archivable, season: comp.season })}
              disabled={archivable === 0}
              s={s}
            />
          </div>
        </section>
      )}
    </>
  )
}
