import { RANK_ORDER, rankOf } from '@/lib/format'
import { strings } from '@/lib/i18n/dict'
import { translator } from '@/lib/i18n/server'
import { managerContext } from '@/lib/team'
import { CopyBlock } from './CopyBlock'

export const metadata = { title: 'Export' }
export const dynamic = 'force-dynamic'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']

export default async function Export() {
  const ctx = await managerContext()
  const tr = await translator()
  const s = strings(tr.locale)

  // Only confirmed people who actually wear a jersey go to the supplier.
  const list = ctx.members
    .filter((m) => m.status === 'active' && m.is_player && m.jersey_no !== null)
    .sort((a, b) => RANK_ORDER[rankOf(a)] - RANK_ORDER[rankOf(b)] || a.jersey_no! - b.jersey_no!)

  const csv = ['Jersey No,Jersey Name,Size']
    .concat(list.map((m) => `${String(m.jersey_no).padStart(2, '0')},${m.jersey_name},${m.jersey_size}`))
    .join('\n')

  const tally = SIZES.map((z) => [z, list.filter((m) => m.jersey_size === z).length] as const).filter(([, n]) => n > 0)
  const slug = ctx.team.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">{ctx.comp.season}</div>
        <h1>{s.mNavExport}</h1>
        <p className="lede" style={{ marginTop: 10 }}>{s.exportLede}</p>
      </header>

      {list.length === 0 ? (
        <div className="note">{s.nothingToExport}</div>
      ) : (
        <div className="roster-grid">
          <section className="panel">
            <div className="panel-h">
              <h2 className="num" style={{ textTransform: 'none' }}>jersey-order-{slug}.csv</h2>
              <span className="hint num">{list.length}</span>
            </div>
            <div className="panel-b">
              <CopyBlock text={csv} filename={`jersey-order-${slug}.csv`} copyLabel={s.copyList} copiedLabel={s.copied} />
            </div>
          </section>

          <section className="panel">
            <div className="panel-h"><h3>{s.sizeTally}</h3></div>
            <div className="panel-b">
              {tally.map(([z, n]) => (
                <div key={z} className="quota-row">
                  <b className="num">{z}</b>
                  <span className="big-num">{n}</span>
                </div>
              ))}
              <div className="quota-row" style={{ borderTop: '1px solid var(--line)', marginTop: 4 }}>
                <b>{s.total}</b>
                <span className="big-num" style={{ color: 'var(--pink)' }}>{list.length}</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
