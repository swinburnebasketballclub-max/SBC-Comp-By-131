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

  // --- admin nav --------------------------------------------------------
  navOverview:      { en: 'Overview',            zh: '比赛总览' },
  navTeams:         { en: 'Teams & managers',    zh: '球队与经理账号' },
  navPayments:      { en: 'Payments',            zh: '付款审核' },
  navColours:       { en: 'Jersey colours',      zh: '球衣颜色' },
  navPlayers:       { en: 'Players',             zh: '球员总表' },
  navVeterans:      { en: 'Past players',        zh: '历史球员' },
  navSchedule:      { en: 'Schedule',            zh: '赛程与赛制' },
  navRules:         { en: 'Rules & terms',       zh: '规则与条款' },

  // --- overview ---------------------------------------------------------
  ovRegistered:     { en: 'Registered',          zh: '球队' },
  ovCompliant:      { en: 'Rosters valid',       zh: '名单合规' },
  ovAwaitingPay:    { en: 'Payments to review',  zh: '待审付款' },
  ovColoursSet:     { en: 'Colours confirmed',   zh: '颜色已确认' },
  ovLocked:         { en: 'Rosters locked',      zh: '已锁定' },
  ovDaysLeft:       { en: 'Days to deadline',    zh: '距离截止' },
  ovClosed:         { en: 'closed',              zh: '已截止' },
  teamStatus:       { en: 'Team status',         zh: '球队状态' },
  colManager:       { en: 'Manager',             zh: '经理' },
  colPlayers:       { en: 'Players',             zh: '球员' },
  colMasiswa:       { en: 'Masiswa',             zh: 'Masiswa' },
  colRules:         { en: 'Rules',               zh: '规则' },
  colFee:           { en: 'Fee',                 zh: '应缴' },
  colPayment:       { en: 'Payment',             zh: '付款' },
  colColour:        { en: 'Colour',              zh: '球衣颜色' },
  colLocked:        { en: 'Locked',              zh: '锁定' },
  rulesPass:        { en: 'OK',                  zh: '通过' },
  rulesFail:        { en: 'breach',              zh: '不符' },
  noTeamsYet:       { en: 'No teams yet. Register one below.', zh: '还没有球队。到下面建立第一支。' },

  // --- statuses ---------------------------------------------------------
  payNone:          { en: 'Not submitted',       zh: '未提交' },
  payPending:       { en: 'Awaiting review',     zh: '待审核' },
  payApproved:      { en: 'Approved',            zh: '已批准' },
  payRejected:      { en: 'Returned',            zh: '已退回' },
  colPending:       { en: 'Awaiting review',     zh: '待审核' },
  colApproved:      { en: 'Confirmed',           zh: '已确认' },
  colRejected:      { en: 'Returned',            zh: '已退回' },
  colNotSet:        { en: 'Not chosen',          zh: '未选' },
  colLockedOut:     { en: 'Locked until paid',   zh: '未解锁' },
  mgrInvited:       { en: 'Invite pending',      zh: '邀请待接受' },
  mgrActive:        { en: 'Active',              zh: '已启用' },
  mgrDisabled:      { en: 'Disabled',            zh: '已停用' },
  lockedYes:        { en: 'Locked',              zh: '已锁定' },
  lockedNo:         { en: 'Editable',            zh: '可编辑' },

  // --- teams & managers -------------------------------------------------
  newTeam:          { en: 'Register a team',     zh: '建立新球队' },
  newTeamLede: {
    en: 'Managers cannot sign themselves up. You register the team and the Google account that will run it; that account gets access the moment it signs in.',
    zh: '经理不能自助注册。由你建立球队并指定管理它的 Google 帐号 —— 对方一登入就自动拿到权限。',
  },
  fieldTeamName:    { en: 'Team name',           zh: '球队名称' },
  fieldManagerName: { en: 'Manager name',        zh: '经理姓名' },
  fieldManagerMail: { en: 'Manager Google account', zh: '经理 Google 帐号' },
  fieldCaptainWA:   { en: 'Captain WhatsApp',    zh: '队长 WhatsApp' },
  createTeam:       { en: 'Register team',       zh: '建立球队' },
  managerAccounts:  { en: 'Manager accounts',    zh: '经理账号' },
  actChangeMgr:     { en: 'Change manager',      zh: '更换经理' },
  actDisable:       { en: 'Disable',             zh: '停用' },
  actEnable:        { en: 'Re-enable',           zh: '恢复' },
  actLock:          { en: 'Lock roster',         zh: '锁定名单' },
  actUnlock:        { en: 'Open for 48h',        zh: '开放 48 小时' },
  teamsFull:        { en: 'The competition is full.', zh: '球队已额满。' },
  copyLink:         { en: 'Copy sign-in link',   zh: '复制登入链接' },
  copied:           { en: 'Copied',              zh: '已复制' },

  // --- admin accounts ---------------------------------------------------
  adminAccounts:    { en: 'Organiser accounts',  zh: 'Admin 账号' },
  adminAccountsLede: {
    en: 'Super organisers can do everything. Finance only sees payments; Fixtures only sees the schedule.',
    zh: '超级管理员什么都能做。财务只看得到付款，赛务只看得到赛程。',
  },
  inviteAdmin:      { en: 'Invite organiser',    zh: '邀请 Admin' },
  roleSuper:        { en: 'Super',               zh: '超级管理员' },
  roleFinance:      { en: 'Finance',             zh: '财务' },
  roleFixtures:     { en: 'Fixtures',            zh: '赛务' },
  pendingInvite:    { en: 'Has not signed in yet', zh: '尚未登入' },

  // --- review drawers ---------------------------------------------------
  allNewTeam:       { en: 'All-new team',        zh: '全新球员队' },
  clickToReview:    { en: 'Click a payment or a colour to review it', zh: '点「付款」或「球衣颜色」即可审核' },
  reviewPayment:    { en: 'Review entry fee',    zh: '审核报名费' },
  reviewColour:     { en: 'Review jersey colour', zh: '审核球衣颜色' },
  entryFee:         { en: 'Entry fee',           zh: '报名费' },
  depositLabel:     { en: 'Deposit (refundable)', zh: '押金（可退）' },
  amountDue:        { en: 'Amount due',          zh: '应缴金额' },
  reference:        { en: 'Transfer reference',  zh: '转账参考号' },
  receipt:          { en: 'Receipt',             zh: '收据' },
  openReceipt:      { en: 'Open receipt',        zh: '打开收据' },
  noReceipt:        { en: 'No receipt uploaded', zh: '尚未上传收据' },
  refundAccount:    { en: 'Deposit refund account', zh: '退押金收款帐户' },
  notProvided:      { en: 'Not provided',        zh: '未提供' },
  submittedAt:      { en: 'Submitted',           zh: '提交时间' },
  reviewedAt:       { en: 'Reviewed',            zh: '审核时间' },
  approve:          { en: 'Approve',             zh: '批准' },
  returnIt:         { en: 'Return',              zh: '退回' },
  returnReason:     { en: 'Reason — the manager will see this', zh: '退回原因（经理看得到）' },
  payApproveNote: {
    en: 'Approving unlocks jersey colour selection for this team. Check the amount against the bank before you do.',
    zh: '批准后这一队才能选球衣颜色。批准前请先对照银行入帐金额。',
  },
  nothingSubmitted: { en: 'The manager has not submitted a payment yet.', zh: '经理还没提交付款。' },
  claimOrder:       { en: 'Claim order',         zh: '抢色顺序' },
  claimedAt:        { en: 'Claimed',             zh: '提交时间' },
  customColour:     { en: 'Custom colour',       zh: '自订色' },
  design:           { en: 'Jersey design',       zh: '设计稿' },
  openDesign:       { en: 'Open design',         zh: '打开设计稿' },
  noDesign:         { en: 'No design uploaded',  zh: '尚未上传设计稿' },
  confirmColour:    { en: 'Confirm colour',      zh: '确认颜色' },
  returnColour:     { en: 'Return for another choice', zh: '退回重选' },
  colourReturnNote: {
    en: 'Returning frees this colour for other teams and lets this team choose again.',
    zh: '退回后，这个颜色会释放给其他队，这一队可以重新选。',
  },
  close:            { en: 'Close',               zh: '关闭' },

  // --- generic ----------------------------------------------------------
  save:             { en: 'Save',                zh: '储存' },
  cancel:           { en: 'Cancel',              zh: '取消' },
  working:          { en: 'Working…',            zh: '处理中…' },
  required:         { en: 'required',            zh: '必填' },
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
