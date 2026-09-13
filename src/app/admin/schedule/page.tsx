import { translator } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const tr = await translator()
  return (
    <>
      <header className="page-head"><h1>{tr('navSchedule')}</h1></header>
      <div className="note">
        {tr.locale === 'zh' ? '这一页还在建置中。' : 'This screen is being built next.'}
      </div>
    </>
  )
}
