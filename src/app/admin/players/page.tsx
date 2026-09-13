import { redirect } from 'next/navigation'

import { activeCompetition, initials, teamSummaries } from '@/lib/competition'
import { RANK_ORDER, rankOf } from '@/lib/format'
import { strings } from '@/lib/i18n/dict'
import { translator } from '@/lib/i18n/server'
import { getViewer } from '@/lib/session'
import { supabaseServer } from '@/lib/supabase/server'
import { PlayersBrowser, type TeamBlock } from './PlayersBrowser'

export const metadata = { title: 'Players' }
export const dynamic = 'force-dynamic'

export default async function PlayersPage({ searchParams }: { searchParams: Promise<{ team?: string }> }) {
  const viewer = await getViewer()
  if (viewer.kind !== 'admin' || viewer.admin.role !== 'super') redirect('/admin')

  const tr = await translator()
  const s = strings(tr.locale)
  const comp = await activeCompetition()
  if (!comp) {
    return (
      <>
        <header className="page-head"><h1>{s.navPlayers}</h1></header>
        <div className="note">{s.noCompetition}</div>
      </>
    )
  }

  const { team: focus } = await searchParams
  const teams = await teamSummaries(comp)
  const supabase = await supabaseServer()

  // One signed link per photo, fetched in a single call.
  const withPhoto = teams.flatMap((t) => t.members).filter((m) => m.photo_path && m.status !== 'declined')
  const photos: Record<string, string> = {}
  if (withPhoto.length > 0) {
    const { data } = await supabase.storage
      .from('photos')
      .createSignedUrls(withPhoto.map((m) => m.photo_path!), 60 * 30)
    data?.forEach((d, i) => {
      if (d.signedUrl) photos[withPhoto[i]!.id] = d.signedUrl
    })
  }

  const blocks: TeamBlock[] = teams.map((t) => ({
    id: t.team.id,
    name: t.team.name,
    crest: t.team.crest_color,
    initials: initials(t.team.name),
    manager: t.team.manager_name || t.team.manager_email,
    locked: Boolean(t.team.locked_at),
    players: t.players,
    breaches: t.breaches,
    members: t.members
      .filter((m) => m.status !== 'declined')
      .sort(
        (a, b) =>
          (a.status === 'pending' ? 1 : 0) - (b.status === 'pending' ? 1 : 0) ||
          RANK_ORDER[rankOf(a)] - RANK_ORDER[rankOf(b)] ||
          (a.jersey_no ?? 99) - (b.jersey_no ?? 99),
      )
      .map((m) => ({
        id: m.id,
        name: m.full_name,
        ic: m.ic_no,
        icNorm: m.ic_norm ?? '',
        phone: m.phone,
        studentId: m.student_id,
        course: m.course,
        year: m.study_year,
        jerseyNo: m.jersey_no,
        jerseyName: m.jersey_name,
        size: m.jersey_size,
        rank: rankOf(m),
        tier: m.tier,
        isPlayer: m.is_player,
        isNew: m.is_new_player,
        newSrc: m.new_player_src,
        pending: m.status === 'pending',
        photo: photos[m.id] ?? null,
      })),
  }))

  const people = blocks.reduce((n, b) => n + b.members.length, 0)

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">{comp.season} · {blocks.length} {s.teams} · {people}</div>
        <h1>{s.navPlayers}</h1>
        <p className="lede" style={{ marginTop: 10 }}>{s.plLede}</p>
      </header>

      {blocks.length === 0 ? (
        <div className="note">{s.noTeamsYet}</div>
      ) : (
        <PlayersBrowser teams={blocks} focus={focus ?? null} season={comp.season} s={s} />
      )}
    </>
  )
}
