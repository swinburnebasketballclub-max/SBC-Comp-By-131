-- ============================================================================
-- SBC Hub · 0004 seed — SBC 26'S2 5x5 Closed Competition
-- Safe to re-run.
-- ============================================================================

-- The founding super admin. This Google account becomes a super admin the
-- first time it signs in; every other admin is added from the UI afterwards.
insert into admin_invites (email, role, full_name)
values ('hiikwangyuan@gmail.com', 'super', 'Hii Kwang Yuan')
on conflict (email) do nothing;

-- ---------------------------------------------------------- competition ----
insert into competitions (
  slug, name_en, name_zh, season,
  venue_en, venue_zh,
  starts_on, ends_on, registration_deadline, status,
  max_teams, roster_min, roster_max, max_coaches, max_managers, max_masiswa, max_state,
  deposit_cents, daily_start, daily_end, match_minutes, courts, min_colour_distance,
  bank_name, bank_holder, bank_account, bank_whatsapp
) values (
  '26s2',
  'SBC 26''S2 5x5 Swinburne Basketball Competition',
  'SBC 26''S2 5x5 斯威本篮球赛',
  '26S2',
  'Swinburne Multi-Purpose Hall (MPH)',
  '斯威本多用途礼堂（MPH）',
  '2026-10-26', '2026-11-01', '2026-10-10', 'draft',
  8, 8, 12, 1, 1, 3, 1,
  10000, '18:00', '23:00', 75, 1, 60,
  'RYT BANK', 'WONG YI REN', '8726001296', '+601133697609'
)
on conflict (slug) do nothing;

-- ------------------------------------------------------------ fee tiers ----
-- masiswa_count = -1 is the "every player is new" tier and outranks the rest.
insert into fee_tiers (competition_id, key, masiswa_count, label_en, label_zh, amount_cents, sort)
select c.id, v.key, v.cnt, v.en, v.zh, v.cents, v.sort
  from competitions c,
       (values
         ('all_new',   -1, 'All new players (first SBC 5x5)', '全队皆首次参加 SBC 5x5', 12000, 0),
         ('masiswa_3',  3, 'Team with 3 Masiswa players',     '含 3 名 Masiswa 球员',    38800, 1),
         ('masiswa_2',  2, 'Team with 2 Masiswa players',     '含 2 名 Masiswa 球员',    30000, 2),
         ('masiswa_1',  1, 'Team with 1 Masiswa player',      '含 1 名 Masiswa 球员',    22000, 3),
         ('masiswa_0',  0, 'Team with no Masiswa player',     '无 Masiswa 球员',         22000, 4)
       ) as v(key, cnt, en, zh, cents, sort)
 where c.slug = '26s2'
on conflict (competition_id, key) do update
  set amount_cents = excluded.amount_cents,
      label_en     = excluded.label_en,
      label_zh     = excluded.label_zh;

-- ------------------------------------------- terms & conditions (14 items) --
-- English is the original wording from the registration form and must not be
-- edited; Chinese is a reference translation shown alongside it.
insert into terms (competition_id, idx, body_en, body_zh)
select c.id, v.idx, v.en, v.zh
  from competitions c,
       (values
(1,  'Only eligible participants are allowed according to SBC rules.',
     '只有符合 SBC 规定资格的参赛者才能参加。'),
(2,  'Obey & Respect Our Referees, Table officials, Crew and Organizer (SBC).',
     '服从并尊重裁判、记录台人员、工作人员与主办方（SBC）。'),
(3,  'Each team may register up to 12 players, 1 head coach and 1 team manager.',
     '每队最多可注册 12 名球员、1 名主教练、1 名球队经理。'),
(4,  'Each team may only have a maximum 3 Masiswa / equivalent standard players (including university & district representatives e.g. SUKSAR).',
     '每队最多只能有 3 名 Masiswa／同等水平球员（包括大学与县代表，例如 SUKSAR）。'),
(5,  'Among these 3 MASISWA players, only 1 may be a State/National player.',
     '这 3 名 Masiswa 球员当中，只能有 1 名是州／国家级球员。'),
(6,  'Only open to active Swinburne students (no alumni allowed).',
     '仅开放给在籍的 Swinburne 学生（不接受校友）。'),
(7,  'Each team may reserve only one primary jersey colour.',
     '每队只能预订一个主球衣颜色。'),
(8,  'Jersey colour cannot be repeated and is based on first come, first served after full registration and payment are completed.',
     '球衣颜色不可重复，在完成整份报名与付款之后，依先到先得的顺序预订。'),
(9,  'No changes will be accepted after the registration deadline.',
     '报名截止日之后，不接受任何更改。'),
(10, 'The organizer reserves the right to reject or disqualify any registration that does not follow the rules and regulations.',
     '主办方保留拒绝或取消任何不符合规则与规定之报名的权利。'),
(11, 'Dunking is allowed during the game, however hanging or pulling on the rim will result in a RM50 fine and a technical foul due to concerns regarding the longevity of the rim. If the rim is damaged due to dunking, the player will take full responsibility for the damage and must bear 100% of the repair costs.',
     '比赛中允许灌篮，但吊篮框或拉扯篮框将被罚款 RM50 并判技术犯规，因为这会影响篮框寿命。若因灌篮导致篮框损坏，该球员须负全责并承担 100% 的维修费用。'),
(12, 'Unsportsmanlike behaviour will be tolerated with 1 warning however an RM50 fine will be imposed starting from the 2nd incident and for every subsequent incident (team accumulation throughout the entire competition).',
     '非运动道德行为可获 1 次警告，但自第 2 次起，每次将罚款 RM50（整届比赛以球队累计计算）。'),
(13, 'SBC reserves the right to suspend, ban or restrict any individual(s) from participating in SBC''s future competitions if he/she violates the rules and regulations / causes any unforeseen consequences during the tournament period.',
     '若任何人违反规则与规定，或在赛事期间造成任何不可预见的后果，SBC 保留暂停、禁止或限制其参加 SBC 日后赛事的权利。'),
(14, 'SBC reserves the right to alter the conditions in anyway it deems fit from time to time.',
     'SBC 保留随时以其认为合适的方式更改条款的权利。')
       ) as v(idx, en, zh)
 where c.slug = '26s2'
on conflict (competition_id, idx) do update
  set body_en = excluded.body_en,
      body_zh = excluded.body_zh;
