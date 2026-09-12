/**
 * Every user-facing string, in both languages.
 *
 * English is the default because the competition is open to all Swinburne
 * students, not only Chinese speakers. The switch is in the header.
 */
export const LOCALES = ['en', 'zh'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_COOKIE = 'sbc_lang'

type Entry = { en: string; zh: string }

export const dict = {
  // --- shell ------------------------------------------------------------
  brand:            { en: 'SBC Hub',            zh: 'SBC Hub' },
  club:             { en: 'Swinburne Basketball Club', zh: 'Swinburne 篮球俱乐部' },
  signIn:           { en: 'Sign in with Google', zh: '用 Google 登入' },
  signOut:          { en: 'Sign out',            zh: '登出' },
  signedInAs:       { en: 'Signed in as',        zh: '目前登入' },
  language:         { en: 'Language',            zh: '语言' },
  loading:          { en: 'Loading…',            zh: '载入中…' },
  back:             { en: 'Back',                zh: '返回' },

  // --- roles ------------------------------------------------------------
  roleAdmin:        { en: 'Organiser',           zh: '主办' },
  roleManager:      { en: 'Team manager',        zh: '球队经理' },
  rolePlayer:       { en: 'Player',              zh: '球员' },

  // --- landing ----------------------------------------------------------
  landingLede: {
    en: 'Team registration and fixtures for the Swinburne Basketball Club closed competition.',
    zh: 'Swinburne 篮球俱乐部内部赛的球队报名与赛程系统。',
  },
  landingManagers: {
    en: 'Team managers sign in with the Google account the organiser registered.',
    zh: '球队经理请用主办登记的那个 Google 帐号登入。',
  },
  landingPlayers: {
    en: 'Players do not sign in. Your team manager sends you a link.',
    zh: '球员不用登入 —— 球队经理会发一条链接给你。',
  },
  viewFixtures:     { en: 'View fixtures',       zh: '查看赛程' },

  // --- access -----------------------------------------------------------
  noAccessTitle:    { en: 'No access yet',       zh: '还没有权限' },
  noAccessBody: {
    en: 'This Google account is not registered as an organiser or a team manager. If you are managing a team, ask the organiser to register this exact email address.',
    zh: '这个 Google 帐号还不是主办或球队经理。如果你要带队，请主办用这个email帮你开帐号。',
  },
  managerDisabled: {
    en: 'This manager account has been disabled. Contact the organiser.',
    zh: '这个经理帐号已被停用，请联络主办。',
  },
  signInFailed:     { en: 'Sign-in failed',      zh: '登入失败' },
  signInRetry:      { en: 'Try signing in again', zh: '重新登入' },

  // --- competition ------------------------------------------------------
  venue:            { en: 'Venue',               zh: '场地' },
  dates:            { en: 'Dates',               zh: '日期' },
  deadline:         { en: 'Registration closes', zh: '报名截止' },
  teams:            { en: 'Teams',               zh: '球队' },
  noCompetition:    { en: 'No competition is open yet.', zh: '目前没有开放中的比赛。' },
  fixturesPending: {
    en: 'The schedule has not been published yet. It goes up once every roster is locked.',
    zh: '赛程还没公布。所有球队名单锁定后就会放上来。',
  },

  // --- legal ------------------------------------------------------------
  privacy:          { en: 'Privacy',             zh: '隐私权' },
  terms:            { en: 'Terms',               zh: '条款' },
} satisfies Record<string, Entry>

export type Key = keyof typeof dict

export function t(key: Key, locale: Locale): string {
  return dict[key][locale]
}

/** Picks the right column from a row that stores both languages. */
export function pick<T extends Record<string, unknown>>(
  row: T,
  base: string,
  locale: Locale,
): string {
  return String(row[`${base}_${locale}`] ?? row[`${base}_en`] ?? '')
}
