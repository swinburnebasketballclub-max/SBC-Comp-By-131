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
  fGoogleAccount:   { en: 'Google account',      zh: 'Google 帐号' },
  fName:            { en: 'Name',                zh: '姓名' },
  fRole:            { en: 'Role',                zh: '权限' },
  cancelInvite:     { en: 'Cancel invite',       zh: '取消邀请' },
  confirmRemoveAdmin: { en: 'Remove this organiser? They lose access immediately.', zh: '确定移除这位 Admin？对方会立刻失去权限。' },
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

  // --- manager: nav & shell ---------------------------------------------
  mNavRoster:       { en: 'Roster',              zh: '球队名单' },
  mNavFee:          { en: 'Entry fee',           zh: '报名费' },
  mNavColour:       { en: 'Jersey colour',       zh: '球衣颜色' },
  mNavExport:       { en: 'Export',              zh: '导出' },
  mReplayTour:      { en: 'Replay the tour',     zh: '重播使用教学' },
  mLockedBanner:    { en: 'This roster is locked by the organiser. You can view it but not change it.', zh: '名单已被主办锁定，只能查看，不能修改。' },
  mWindowBanner:    { en: 'The organiser has opened this roster for changes until', zh: '主办已开放修改，截止于' },

  // --- manager: setup ---------------------------------------------------
  setupTitle:       { en: 'Set up your team',    zh: '设定你的球队' },
  setupLede: {
    en: 'The organiser registered this team for you. Check the details, add your crest, and accept the competition terms — then you can start building the roster.',
    zh: '主办已经帮你建立了这支球队。确认资料、上传队徽、同意比赛条款，就可以开始填名单了。',
  },
  teamLogo:         { en: 'Team crest',          zh: '球队 Logo' },
  logoHint:         { en: 'Square PNG or JPG, at least 500 × 500. Used on the schedule and the public fixtures page.', zh: 'PNG 或 JPG，建议正方形、至少 500×500。会用在赛程与公开页面。' },
  chooseFile:       { en: 'Choose file',         zh: '选择档案' },
  replaceFile:      { en: 'Replace',             zh: '更换' },
  agreeTerms: {
    en: 'I have read and agree to the terms, and every player I register is an active Swinburne student.',
    zh: '我已阅读并同意以上条款，并确认我登记的球员皆为在籍 Swinburne 学生。',
  },
  startRoster:      { en: 'Save and continue',   zh: '储存并继续' },
  mustAgree:        { en: 'Tick the box to accept the terms.', zh: '请勾选同意条款。' },

  // --- manager: tour ----------------------------------------------------
  tour1Title:       { en: 'Welcome to SBC Hub',  zh: '欢迎使用 SBC Hub' },
  tour1Body:        { en: 'This replaces the Google Form, the Word roster and chasing people on WhatsApp. Registration is four steps: build the roster, pay, choose a jersey colour, then the organiser locks it.', zh: '这个系统取代了 Google 表单、Word 名单和 WhatsApp 催资料。报名只有四步：填名单 → 缴费 → 选球衣颜色 → 主办锁定。' },
  tour2Title:       { en: 'Stop collecting details by hand', zh: '不用再一个个去要资料' },
  tour2Body:        { en: 'Create a player link and paste it into your team group. Players fill in their own details and photo on their phone — no sign-in. Their submission appears at the end of your roster, and counts once you confirm it.', zh: '生成球员链接贴进群组，球员在手机上自己填资料、上传照片，不用登入。提交后会出现在名单最后，你按「确认」才算数。' },
  tour3Title:       { en: 'Duplicates are blocked for you', zh: '系统帮你挡掉重复' },
  tour3Body:        { en: 'Jersey numbers and names are unique within your team, and an IC can only be registered once in the whole competition. A player sees the problem as they type.', zh: '球衣号码和名字在队内不能重复，IC 在整个比赛只能登记一次。球员填的当下就会看到。' },
  tour4Title:       { en: 'Quotas and fees are worked out', zh: '名额和费用自动算' },
  tour4Body:        { en: 'At most 3 Masiswa players, of whom at most 1 State. The roster shows where you stand, and the entry fee follows from it — you never need the fee table.', zh: '最多 3 名 Masiswa，其中最多 1 名 State。名单会即时显示，报名费也依此自动算出，不用自己对费用表。' },
  tour5Title:       { en: 'Colours are first come, first served', zh: '球衣颜色先到先得' },
  tour5Body:        { en: 'Once the organiser approves your payment, the jersey colour page opens. Pick a standard colour or mix your own; colours too close to one already taken are refused.', zh: '主办批准缴费后，球衣颜色页面才会开放。可以选常用色或自己调，太接近别队的颜色会被挡下。' },
  tourNext:         { en: 'Next',                zh: '下一步' },
  tourBack:         { en: 'Back',                zh: '上一步' },
  tourSkip:         { en: 'Skip',                zh: '跳过' },
  tourDone:         { en: 'Start',               zh: '开始使用' },

  // --- manager: roster --------------------------------------------------
  rosterLede: {
    en: 'Laid out like the registration form and sorted manager, coach, captain, State, Masiswa, then everyone else. Submissions from player links wait at the end until you confirm them.',
    zh: '照报名表的版面排列，依「经理 → 教练 → 队长 → State → Masiswa → 一般球员」排序。透过链接提交的球员会在最后面等你确认。',
  },
  rosterOk:         { en: 'Roster meets the competition rules', zh: '名单符合比赛规则' },
  rosterBad:        { en: 'Roster breaks a rule', zh: '名单不符合规则' },
  pendingWaiting:   { en: 'waiting for you to confirm', zh: '位球员等你确认' },
  teamManager:      { en: 'Team manager',        zh: '球队经理' },
  headCoach:        { en: 'Head coach',          zh: '主教练' },
  playersHeading:   { en: 'Players',             zh: '球员' },
  notAssigned:      { en: 'Not added',           zh: '未指定' },
  coachOptional:    { en: 'Optional — at most one', zh: '可不填，最多一位' },
  managerRequired:  { en: 'Required — add your own details', zh: '必填 —— 请填你自己的资料' },
  alsoPlays:        { en: 'also plays',          zh: '兼球员' },
  addMe:            { en: 'Add my details',      zh: '填入我的资料' },
  addCoach:         { en: 'Add coach',           zh: '新增教练' },
  addPlayer:        { en: 'Add a player',        zh: '手动新增球员' },
  emptySlot:        { en: 'Open slot — send a player link', zh: '空位 —— 发链接给球员填' },
  edit:             { en: 'Edit',                zh: '编辑' },
  remove:           { en: 'Remove',              zh: '移除' },
  confirmJoin:      { en: 'Confirm',             zh: '确认加入' },
  declineJoin:      { en: 'Return',              zh: '退回' },
  awaitingConfirm:  { en: 'Awaiting confirmation', zh: '待确认' },
  checks:           { en: 'Rule check',          zh: '规则检查' },
  limit:            { en: 'limit',               zh: '上限' },
  feeSoFar:         { en: 'Entry fee',           zh: '应缴' },
  goPay:            { en: 'Go to payment',       zh: '前往缴费' },
  removeConfirm:    { en: 'Remove this person from the roster?', zh: '确定要把这个人从名单移除？' },

  // --- member form ------------------------------------------------------
  memberAdd:        { en: 'Add to roster',       zh: '加入名单' },
  memberEdit:       { en: 'Edit details',        zh: '编辑资料' },
  fFullName:        { en: 'Full name (as on IC)', zh: '姓名（同 IC）' },
  fIC:              { en: 'IC number',           zh: 'IC 号码' },
  fPhone:           { en: 'Phone (WhatsApp)',    zh: '电话（WhatsApp）' },
  fStudentId:       { en: 'Student ID',          zh: '学生证号' },
  fCourse:          { en: 'Course',              zh: '课程' },
  fYear:            { en: 'Year',                zh: '年级' },
  fJerseyNo:        { en: 'Jersey number',       zh: '球衣号码' },
  fJerseyName:      { en: 'Name on jersey',      zh: '球衣名字' },
  fSize:            { en: 'Jersey size',         zh: '球衣尺码' },
  fTier:            { en: 'Level',               zh: '球员水平' },
  tierNone:         { en: 'Regular player',      zh: '一般球员' },
  tierMasiswa:      { en: 'Masiswa / equivalent (incl. SUKSAR, university or district rep)', zh: 'Masiswa／同等水平（含 SUKSAR、大学／县代表）' },
  tierState:        { en: 'State / National player', zh: 'State／National 球员' },
  fCaptain:         { en: 'Team captain',        zh: '队长' },
  fPlays:           { en: 'Also plays (needs a jersey)', zh: '同时是球员（需要球衣）' },
  fNewPlayer:       { en: 'First time playing an SBC 5x5 tournament', zh: '第一次参加 SBC 5x5 比赛' },
  fNewPlayerHint:   { en: 'Checked against past rosters — a returning player is corrected automatically.', zh: '系统会比对历史名单，打过的会自动更正。' },
  fPhoto:           { en: 'Passport photo',      zh: '护照照片' },
  photoHint:        { en: 'Plain background, face forward, no cap.', zh: '白底、正面、不戴帽。' },
  takenNo:          { en: 'is already taken on this team', zh: '号已经有队友用了' },
  takenName:        { en: 'is already used on this team', zh: '已经有队友用了' },
  numberOk:         { en: 'available',           zh: '可用' },
  nameRule:         { en: '2–10 letters or digits', zh: '2–10 个英文字母或数字' },

  // --- invite links -----------------------------------------------------
  linksTitle:       { en: 'Player links',        zh: '球员填表链接' },
  linksLede: {
    en: 'A team link can be used by anyone you send it to. A personal link works once, so "used 0 / 1" tells you who has not filled it in.',
    zh: '全队链接谁拿到都能填。个人链接只能用一次 —— 看「已用 0 / 1」就知道谁还没交。',
  },
  newTeamLink:      { en: 'New team link',       zh: '生成全队链接' },
  newPersonalLink:  { en: 'New personal link',   zh: '生成个人链接' },
  personalFor:      { en: 'Who is this for?',    zh: '这条链接给谁？' },
  linkTeam:         { en: 'Team link',           zh: '全队共用' },
  linkPersonal:     { en: 'Personal',            zh: '个人' },
  linkUsed:         { en: 'used',                zh: '已用' },
  linkRevoked:      { en: 'Cancelled',           zh: '已撤销' },
  linkSpent:        { en: 'Used',                zh: '已使用' },
  linkOpen:         { en: 'Open',                zh: '开放中' },
  linkWaiting:      { en: 'Not filled yet',      zh: '还没填' },
  copyUrl:          { en: 'Copy link',           zh: '复制链接' },
  copyMessage:      { en: 'Copy WhatsApp message', zh: '复制邀请讯息' },
  revoke:           { en: 'Cancel link',         zh: '撤销' },
  noLinks:          { en: 'No links yet. Create one and paste it into your team group.', zh: '还没有链接。生成一条贴进球队群组。' },
  inviteMsg: {
    en: '[{team}] SBC {season} registration\nFill in your details here — no sign-in, works on your phone:\n{url}\n\nHave ready: IC number, phone, student ID, course and year, jersey number / name / size, and a passport photo.\nYou are registered once I confirm. Closes {deadline}.',
    zh: '【{team}】SBC {season} 报名\n请点这个链接填你的资料（不用登入，手机就能填）：\n{url}\n\n要准备：IC 号码、电话、学生证号、课程与年级、球衣号码／名字／尺码，还有一张护照照片。\n我这边确认了才算报名成功。截止 {deadline}。',
  },

  // --- fee --------------------------------------------------------------
  feeLede:          { en: 'Worked out from your roster. Transfer the amount, then upload the receipt for the organiser to check.', zh: '依你的名单自动算出。转帐后上传收据，主办核对后批准。' },
  feeTierLine:      { en: 'Tier',                zh: '级距' },
  feeChangesNote:   { en: 'If the roster changes before you submit — say, one more Masiswa player — this amount updates by itself.', zh: '送出之前名单有变动（例如多一个 Masiswa），金额会自动更新。' },
  payTo:            { en: 'Pay to',              zh: '转帐资料' },
  bankName:         { en: 'Bank',                zh: '银行' },
  bankHolder:       { en: 'Account holder',      zh: '户名' },
  bankAccount:      { en: 'Account number',      zh: '帐号' },
  scanQR:           { en: 'Scan with your banking app, or transfer to the account number.', zh: '用银行 App 扫 QR，或手动转到帐号。' },
  transferNote:     { en: 'Put your team name in the transfer reference.', zh: '转帐备注请写球队名称。' },
  uploadReceipt:    { en: 'Upload receipt',      zh: '上传收据' },
  refundHint:       { en: 'Your own account. The RM 100 deposit is refunded here after the competition if there are no fines.', zh: '请填你本人的户口。比赛结束后若无罚款，RM100 押金会退到这里。' },
  submitPayment:    { en: 'Submit for review',   zh: '提交审核' },
  payPendingNote:   { en: 'Submitted. The organiser will check it against the bank.', zh: '已提交，主办会对照银行入帐审核。' },
  payApprovedNote:  { en: 'Approved. Jersey colour selection is open.', zh: '已批准，可以去选球衣颜色了。' },
  payRejectedNote:  { en: 'Returned by the organiser:', zh: '主办退回，原因：' },
  noPaymentYet:     { en: 'Add at least one person to the roster and the fee will appear here.', zh: '名单至少加一个人，这里就会显示应缴金额。' },

  // --- colour -----------------------------------------------------------
  colourLede:       { en: 'One primary colour per team, unique across the competition, first come first served. The organiser confirms each choice.', zh: '每队一个主色，全赛事不可重复，先到先得。主办会逐一确认。' },
  colourLocked:     { en: 'Colour selection opens once the organiser approves your entry fee.', zh: '报名费经主办批准后，才能选球衣颜色。' },
  takenColours:     { en: 'Already claimed',     zh: '已被选走的颜色' },
  noTakenYet:       { en: 'No team has claimed a colour yet.', zh: '还没有球队选颜色。' },
  standardColours:  { en: 'Standard colours',    zh: '常用颜色' },
  mixColour:        { en: 'Mix your own',        zh: '自己调颜色' },
  colourName:       { en: 'Colour name',         zh: '颜色名称' },
  tooClose:         { en: 'Too close to a colour already claimed', zh: '跟已被选走的颜色太接近' },
  colourFine:       { en: 'Distinct from every claimed colour', zh: '跟已被选走的颜色都有明显差异' },
  claimColour:      { en: 'Claim this colour',   zh: '选这个颜色' },
  yourColour:       { en: 'Your colour',         zh: '你的颜色' },
  submitDesign:     { en: 'Jersey design',       zh: '提交衣服设计' },
  designHint:       { en: 'Optional. Lets the organiser see the kit before it goes to the supplier.', zh: '可选。交给厂商前先给主办过目。' },
  designNote:       { en: 'Notes for the organiser', zh: '给主办的备注' },
  saveDesign:       { en: 'Save design',         zh: '储存设计' },

  // --- export -----------------------------------------------------------
  exportLede:       { en: 'The jersey supplier needs number, name and size — nothing else leaves the club.', zh: '球衣厂商只需要号码、名字、尺码 —— 其他资料不会外流。' },
  copyList:         { en: 'Copy list',           zh: '复制清单' },
  sizeTally:        { en: 'Sizes',               zh: '尺码统计' },
  total:            { en: 'Total',               zh: '总计' },
  nothingToExport:  { en: 'No confirmed players with a jersey yet.', zh: '还没有已确认、有球衣的球员。' },

  // --- player join form -------------------------------------------------
  sectAbout:        { en: 'About you',           zh: '个人资料' },
  sectJersey:       { en: 'Jersey',              zh: '球衣' },
  joinTitle:        { en: 'Join {team}',         zh: '加入 {team}' },
  joinLede:         { en: 'Your team manager confirms this before you are registered. Only they and the organiser can see your details.', zh: '球队经理确认后才算正式报名。你的资料只有经理与主办看得到。' },
  joinAgree:        { en: 'My details are correct, I am an active Swinburne student, and I accept the competition terms.', zh: '我确认资料属实，我是在籍 Swinburne 学生，并同意比赛条款。' },
  joinSubmit:       { en: 'Send to my team manager', zh: '提交给球队经理' },
  joinDoneTitle:    { en: 'Sent',                zh: '已提交' },
  joinDoneBody:     { en: 'Your details are with {team}\'s manager. You are registered once they confirm.', zh: '你的资料已送到 {team} 的经理。经理确认后就算报名成功。' },
  joinQuota:        { en: 'This team already has {used} of {max} Masiswa-level players.', zh: '这支球队已有 {used}／{max} 名 Masiswa 等级球员。' },
  quotaFull:        { en: 'The team has no Masiswa places left — speak to your manager.', zh: '这队的 Masiswa 名额已满，请先跟经理确认。' },
  uploading:        { en: 'Uploading photo…',    zh: '上传照片中…' },
  photoUnavailable: { en: 'Photo upload is not switched on yet — send it now anyway; your manager can add the photo later.', zh: '照片上传功能还没开启 —— 可以先提交，之后经理再补上照片。' },
  photoFailed:      { en: 'The photo could not be uploaded. Try a smaller image.', zh: '照片上传失败，请换一张小一点的。' },

  // --- database error codes --------------------------------------------
  errJERSEY_NO_TAKEN:       { en: 'That jersey number is already taken on this team.', zh: '这个球衣号码已经有队友用了。' },
  errJERSEY_NAME_TAKEN:     { en: 'That jersey name is already used on this team.', zh: '这个球衣名字已经有队友用了。' },
  errIC_ALREADY_REGISTERED: { en: 'This IC is already registered in this competition — one person, one team.', zh: '这个 IC 已经在本届比赛登记过了 —— 一人只能报一队。' },
  errIC_INVALID:            { en: 'Check the IC number.', zh: '请检查 IC 号码。' },
  errMASISWA_QUOTA:         { en: 'That would put the team over its Masiswa limit.', zh: '这样会超出这队的 Masiswa 名额。' },
  errSTATE_QUOTA:           { en: 'The team already has its one State player.', zh: '这队已经有一名 State 球员了。' },
  errROSTER_FULL:           { en: 'The roster is full.', zh: '名单已满。' },
  errCOACH_QUOTA:           { en: 'A team can have only one head coach.', zh: '每队只能有一位主教练。' },
  errMANAGER_QUOTA:         { en: 'A team can have only one manager on the roster.', zh: '名单上只能有一位经理。' },
  errROSTER_LOCKED:         { en: 'The roster is locked.', zh: '名单已锁定。' },
  errLINK_INVALID:          { en: 'This link is no longer valid. Ask your manager for a new one.', zh: '这条链接已失效，请向经理要一条新的。' },
  errPAYMENT_NOT_APPROVED:  { en: 'Colour selection opens once the entry fee is approved.', zh: '报名费批准后才能选颜色。' },
  errCOLOUR_TOO_CLOSE:      { en: 'Too close to a colour another team has claimed.', zh: '跟别队已选的颜色太接近。' },
  errCOLOUR_TAKEN:          { en: 'Someone claimed that colour a moment ago.', zh: '这个颜色刚刚被别队选走了。' },
  errDUPLICATE:             { en: 'That duplicates someone already on the roster.', zh: '跟名单上的人重复了。' },
  errFORBIDDEN:             { en: 'You do not have access to this team.', zh: '你没有这支球队的权限。' },
  errINVALID:               { en: 'Some details are missing or not valid.', zh: '有资料没填或格式不对。' },
  errUNKNOWN:               { en: 'Something went wrong. Try again.', zh: '出了点问题，请再试一次。' },
  saved:                    { en: 'Saved',       zh: '已储存' },

  // --- admin: players registry ------------------------------------------
  plLede: {
    en: 'Every roster in the competition. Full IC numbers are shown to organisers only — do not screenshot this page into group chats.',
    zh: '全赛事所有名单。完整 IC 号码只有主办看得到 —— 请不要截图传到群组。',
  },
  plSearch:         { en: 'Search name, IC or student ID', zh: '搜寻姓名、IC 或学生证号' },
  plExpandAll:      { en: 'Expand all',          zh: '全部展开' },
  plCollapseAll:    { en: 'Collapse all',        zh: '全部收合' },
  plExportAll:      { en: 'Download all rosters (CSV)', zh: '下载全部名单（CSV）' },
  plNoMembers:      { en: 'No one on this roster yet.', zh: '这一队还没有人。' },
  plMatches:        { en: 'matches',             zh: '笔符合' },
  plRole:           { en: 'Role',                zh: '身分' },
  plStatus:         { en: 'Status',              zh: '状态' },
  plNewSource:      { en: 'New-player status',   zh: '新球员判定' },
  srcRegistry:      { en: 'past-player registry', zh: '历史资料库' },
  srcSelf:          { en: 'self-declared',       zh: '自填' },
  srcAdmin:         { en: 'set by organiser',    zh: '主办指定' },
  markNew:          { en: 'Mark as new',         zh: '标为新球员' },
  markReturning:    { en: 'Mark as returning',   zh: '标为老将' },
  statusActive:     { en: 'Confirmed',           zh: '已确认' },
  statusPending:    { en: 'Awaiting manager',    zh: '待经理确认' },
  openRoster:       { en: 'Open roster',         zh: '打开名单' },

  // --- admin: past players ---------------------------------------------
  vtLede: {
    en: 'Anyone who has played an SBC 5x5 tournament before. A team gets the all-new RM 120 fee only if none of its players are listed here, so fill this in before teams start paying.',
    zh: '以前打过 SBC 5x5 比赛的人。只有当一队的球员全都不在这份名单里，才会套用 RM120 全新球队价 —— 所以请在球队开始缴费前先填好。',
  },
  vtCount:          { en: 'past players on record', zh: '笔历史球员' },
  vtMatchesNow:     { en: 'of them are registered in this competition', zh: '位正在本届比赛报名' },
  vtAddOne:         { en: 'Add one',             zh: '单笔新增' },
  vtSeasons:        { en: 'Seasons played',      zh: '参加过的届数' },
  vtSeasonsHint:    { en: 'Comma-separated, e.g. 25S1, 25S2', zh: '用逗号分隔，例如 25S1, 25S2' },
  vtNote:           { en: 'Note',                zh: '备注' },
  vtBulk:           { en: 'Paste from a spreadsheet', zh: '从 Excel 整批贴上' },
  vtBulkHint: {
    en: 'One player per line: name, IC, season. Copy three columns straight out of Excel or Google Sheets — tabs or commas both work.',
    zh: '一行一位：姓名、IC、届数。直接从 Excel 或 Google Sheets 复制三栏贴上即可，Tab 或逗号分隔都可以。',
  },
  vtPreview:        { en: 'Check',               zh: '检查' },
  vtImport:         { en: 'Import',              zh: '汇入' },
  vtRowsOk:         { en: 'ready to import',     zh: '笔可以汇入' },
  vtRowsBad:        { en: 'lines skipped (no valid IC)', zh: '行略过（IC 格式不对）' },
  vtArchive:        { en: 'Save this season’s players', zh: '存入本届球员' },
  vtArchiveHint: {
    en: 'After the competition, add every confirmed player of this season to the registry, so next season knows who has played.',
    zh: '比赛结束后，把本届所有已确认的球员存进资料库，下一届就知道谁打过。',
  },
  vtArchiveBtn:     { en: 'Add {n} players from {season}', zh: '把 {season} 的 {n} 位球员存入' },
  vtImported:       { en: 'Saved: {added} added, {updated} updated.', zh: '完成：新增 {added} 笔、更新 {updated} 笔。' },
  vtDelete:         { en: 'Delete',              zh: '删除' },
  vtEmpty:          { en: 'No past players yet.', zh: '还没有历史球员资料。' },
  vtRegistered:     { en: 'In this competition', zh: '本届有报名' },

  // --- admin: rules & settings -----------------------------------------
  rsLede: {
    en: 'Everything here is stored in the database. Changing a limit or a fee takes effect for every team straight away — no redeploy.',
    zh: '这一页的内容都存在数据库。改名额或费用会立刻套用到所有球队，不需要重新部署。',
  },
  rsCompetition:    { en: 'Competition',         zh: '比赛资料' },
  rsStatusTitle:    { en: 'Registration status', zh: '报名状态' },
  rsStatusHint: {
    en: 'Draft is hidden from the public. Open accepts registrations. Locked means rosters are final and the schedule can be published.',
    zh: '草稿：公开页面看不到。开放：接受报名。锁定：名单定案，可以公布赛程。',
  },
  stDraft:          { en: 'Draft',               zh: '草稿' },
  stOpen:           { en: 'Open',                zh: '开放报名' },
  stClosed:         { en: 'Closed',              zh: '报名截止' },
  stLocked:         { en: 'Locked',              zh: '名单锁定' },
  stRunning:        { en: 'Running',             zh: '比赛进行中' },
  stFinished:       { en: 'Finished',            zh: '已结束' },
  lockAll:          { en: 'Lock every roster now', zh: '立即锁定全部名单' },
  lockAllHint:      { en: 'Enforces “no changes after the deadline”. You can still open a single team for 48 hours afterwards.', zh: '执行「截止后不接受更改」。之后仍可以单独开放某一队 48 小时。' },
  lockAllConfirm:   { en: 'Lock every team’s roster now?', zh: '确定要立即锁定所有球队名单？' },
  lockedN:          { en: '{n} rosters locked.', zh: '已锁定 {n} 队名单。' },
  rsNameEn:         { en: 'Name (English)',      zh: '名称（英文）' },
  rsNameZh:         { en: 'Name (Chinese)',      zh: '名称（中文）' },
  rsVenueEn:        { en: 'Venue (English)',     zh: '场地（英文）' },
  rsVenueZh:        { en: 'Venue (Chinese)',     zh: '场地（中文）' },
  rsStarts:         { en: 'First match day',     zh: '开赛日' },
  rsEnds:           { en: 'Last match day',      zh: '最后比赛日' },
  rsDeadline:       { en: 'Registration closes', zh: '报名截止' },
  rsLimits:         { en: 'Roster limits',       zh: '名额规则' },
  rsMaxTeams:       { en: 'Max teams',           zh: '最多球队' },
  rsRosterMin:      { en: 'Min players',         zh: '最少球员' },
  rsRosterMax:      { en: 'Max players',         zh: '最多球员' },
  rsMaxCoaches:     { en: 'Max head coaches',    zh: '最多主教练' },
  rsMaxMasiswa:     { en: 'Max Masiswa-level',   zh: '最多 Masiswa' },
  rsMaxState:       { en: '…of which State',     zh: '其中最多 State' },
  rsMoney:          { en: 'Fees and payee',      zh: '费用与收款' },
  rsDeposit:        { en: 'Deposit (RM)',        zh: '押金（RM）' },
  rsTier:           { en: 'Fee tier',            zh: '费用级距' },
  rsAmount:         { en: 'Amount (RM)',         zh: '金额（RM）' },
  rsWhatsapp:       { en: 'Receipts WhatsApp',   zh: '收据 WhatsApp' },
  rsFixtures:       { en: 'Match nights',        zh: '比赛时段' },
  rsDailyStart:     { en: 'First tip-off',       zh: '每晚开始' },
  rsDailyEnd:       { en: 'Hall closes',         zh: '场地关闭' },
  rsMatchMinutes:   { en: 'Minutes per match slot', zh: '每场时段（分钟）' },
  rsCourts:         { en: 'Courts',              zh: '场地数' },
  rsColourGap:      { en: 'Minimum colour difference', zh: '颜色最小差距' },
  rsColourGapHint:  { en: 'Higher keeps team colours further apart. 60 separates navy from royal blue.', zh: '数字越大，各队颜色要差越多。60 大约能分开海军蓝和宝蓝。' },
  rsTerms:          { en: 'Terms and conditions', zh: '比赛条款' },
  rsTermsHint:      { en: 'Managers accept these at setup and players accept them when submitting. English governs; Chinese is shown alongside.', zh: '经理设定球队时、球员提交时都要同意。以英文版为准，中文并列显示。' },
  rsAddClause:      { en: 'Add clause',          zh: '新增一条' },
  rsSaveAll:        { en: 'Save changes',        zh: '储存变更' },
  rsSaved:          { en: 'Saved. Every team sees the new rules now.', zh: '已储存，所有球队立刻套用。' },
  errLAST_SUPER:    { en: 'There must always be at least one super organiser.', zh: '至少要保留一位超级管理员。' },
  errRULES_NUMBER:  { en: 'Limits and amounts must be whole numbers, zero or more.', zh: '名额和金额要填 0 或以上的数字。' },
  errRULES_ROSTER:  { en: 'Max players cannot be lower than min players.', zh: '最多球员不能少于最少球员。' },
  errRULES_STATE:   { en: 'State players are counted inside the Masiswa limit, so that limit cannot be lower.', zh: 'State 球员算在 Masiswa 名额里，所以 State 上限不能比 Masiswa 高。' },
  errRULES_DATES:   { en: 'Registration must close on or before the first match day, and the last day cannot be before the first.', zh: '报名截止要在开赛日当天或之前，最后比赛日也不能早于开赛日。' },
  errRULES_TERM_EN: { en: 'Every clause needs its English text — the English version governs.', zh: '每一条都要有英文 —— 以英文版为准。' },
  vtIcCol:          { en: 'IC',                  zh: 'IC' },
  vtTeamNow:        { en: 'Team this season',    zh: '本届球队' },
  errNOTHING:       { en: 'Paste some rows first.', zh: '请先贴上资料。' },
  rsFeeNote:        { en: 'Teams that have not sent a receipt are re-priced when you save. Receipts under review or approved keep their amount.', zh: '储存后，还没上传收据的球队会用新价格重算；审核中或已批准的金额不会变。' },

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

/** Every string for one locale, for handing to a client component. */
export type Strings = Record<Key, string>

export function strings(locale: Locale): Strings {
  return Object.fromEntries(
    (Object.keys(dict) as Key[]).map((k) => [k, dict[k][locale]]),
  ) as Strings
}

/** `fill('Join {team}', { team: 'Thunder Cats' })` */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`))
}

/** Maps a database or action error code to a sentence. */
export function errorText(code: string | undefined, s: Strings): string {
  if (!code) return s.errUNKNOWN
  const key = `err${code}` as Key
  return key in dict ? s[key] : s.errUNKNOWN
}
