import { translator } from '@/lib/i18n/server'

export const metadata = { title: 'Privacy' }

const COPY = {
  en: {
    title: 'Privacy',
    lede: 'What Swinburne Basketball Club collects when you register for a competition, who can see it, and when it is deleted.',
    sections: [
      {
        h: 'What we collect',
        p: 'To register you for a competition we collect your full name, IC number, phone number, student ID, course and year of study, your jersey number, jersey name and size, and a passport photo. Team managers and organisers sign in with Google; from that we receive only your email address and display name.',
      },
      {
        h: 'Why we collect it',
        p: 'Your IC number is how we check that the same person has not been registered by two teams. Your student ID is how we check you are an active Swinburne student, which the competition rules require. Your photo goes on the team sheet handed to the organisers and referees. Your jersey number, jersey name and size go to the jersey supplier — nothing else does.',
      },
      {
        h: 'Who can see it',
        p: 'Your own team manager can see your full details. Other teams cannot see you at all. Organisers can see every registered player. The public schedule shows team names, crests, times and venues only — never a player. Every time an organiser opens a player record it is written to an access log.',
      },
      {
        h: 'How long we keep it',
        p: 'IC numbers and passport photos are deleted 90 days after the competition ends. Your name and the fact that you played is kept so that future competitions can tell returning players from new ones, which is what the entry fee depends on.',
      },
      {
        h: 'Correcting or removing your details',
        p: 'Ask your team manager, or contact the club directly. Before the registration deadline a manager can edit or remove anyone on their roster. After the deadline the roster is locked and changes need the organiser.',
      },
      {
        h: 'Where it is stored',
        p: 'On Supabase (PostgreSQL and file storage) in the Asia-Pacific region, and served through Vercel. We do not sell or share your details with anyone outside the club and its competition officials.',
      },
      {
        h: 'Contact',
        p: 'Swinburne Basketball Club — President +6011-1419 3067, Vice President +6011-1060 9962.',
      },
    ],
  },
  zh: {
    title: '隐私权说明',
    lede: '你报名比赛时，Swinburne 篮球俱乐部会收集什么资料、谁看得到、以及什么时候删除。',
    sections: [
      {
        h: '我们收集什么',
        p: '为了替你完成报名，我们收集你的全名、IC 号码、电话、学生证号、课程与年级，还有球衣号码、球衣名字、尺码与一张护照照片。球队经理与主办用 Google 登入，我们从 Google 只会拿到你的电邮地址和显示名称。',
      },
      {
        h: '为什么要收',
        p: 'IC 号码是用来确认同一个人没有被两支球队重复报名。学生证号是用来确认你是在籍的 Swinburne 学生 —— 这是比赛规则要求的。照片会出现在交给主办与裁判的球队名单上。球衣号码、名字与尺码会交给球衣厂商，其他资料一概不会。',
      },
      {
        h: '谁看得到',
        p: '你自己球队的经理看得到你的完整资料。其他球队完全看不到你。主办看得到所有已报名的球员。公开赛程页只显示队名、队徽、时间与场地，不会出现任何球员。主办每一次查阅球员资料都会写入存取纪录。',
      },
      {
        h: '保留多久',
        p: 'IC 号码与护照照片会在比赛结束 90 天后删除。你的姓名与「曾参加过」这项纪录会保留，好让日后的比赛分得出老将与新球员 —— 报名费的级距是依这个算的。',
      },
      {
        h: '更正或删除你的资料',
        p: '找你的球队经理，或直接联络俱乐部。报名截止前，经理可以修改或移除名单上的任何人。截止之后名单会锁定，要改动须经主办同意。',
      },
      {
        h: '资料存在哪里',
        p: '存在 Supabase（PostgreSQL 与档案储存）的亚太区机房，网站由 Vercel 提供。我们不会把你的资料卖给任何人，也不会分享给俱乐部与赛事人员以外的对象。',
      },
      {
        h: '联络方式',
        p: 'Swinburne 篮球俱乐部 —— 主席 +6011-1419 3067，副主席 +6011-1060 9962。',
      },
    ],
  },
} as const

export default async function Privacy() {
  const tr = await translator()
  const copy = COPY[tr.locale]

  return (
    <article className="stack" style={{ paddingTop: 48, maxWidth: '68ch', gap: 26 }}>
      <div>
        <div className="eyebrow">SBC Hub</div>
        <h1 style={{ fontSize: 34, fontWeight: 800 }}>{copy.title}</h1>
        <p className="lede" style={{ marginTop: 12 }}>{copy.lede}</p>
      </div>

      {copy.sections.map((s) => (
        <section key={s.h} className="stack" style={{ gap: 8 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '0.03em' }}>{s.h}</h2>
          <p style={{ color: 'var(--text-2)' }}>{s.p}</p>
        </section>
      ))}
    </article>
  )
}
