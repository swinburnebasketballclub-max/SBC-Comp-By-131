const TZ = 'Asia/Kuching'

/** Money is stored in sen. RM 388.00 is 38800. */
export function money(cents: number): string {
  return `RM ${(cents / 100).toFixed(2)}`
}

/** A bare date column, e.g. 2026-10-10 → 10 Oct 2026. */
export function day(date: string | null, opts: Intl.DateTimeFormatOptions = {}): string {
  if (!date) return '—'
  return new Date(`${date}T00:00:00+08:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: TZ,
    ...opts,
  })
}

/** A timestamp, e.g. 12 Sep, 21:19. */
export function stamp(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  })
}

/** Days from today until a date; negative once it has passed. */
export function daysUntil(date: string): number {
  const target = new Date(`${date}T23:59:59+08:00`).getTime()
  return Math.ceil((target - Date.now()) / 86_400_000)
}

const RANK = ['manager', 'coach', 'captain', 'state', 'masiswa', 'player'] as const
export type MemberRank = (typeof RANK)[number]

/**
 * Where someone sits on the team sheet.
 *
 * The order the club has always used: manager, coach, captain, then State and
 * Masiswa players, then everyone else. A captain who is also Masiswa is
 * listed as captain but still counts against the Masiswa quota — the quota is
 * counted from `tier`, not from this.
 */
export function rankOf(m: {
  is_manager: boolean
  is_coach: boolean
  is_captain: boolean
  tier: 'none' | 'masiswa' | 'state'
}): MemberRank {
  if (m.is_manager) return 'manager'
  if (m.is_coach) return 'coach'
  if (m.is_captain) return 'captain'
  if (m.tier === 'state') return 'state'
  if (m.tier === 'masiswa') return 'masiswa'
  return 'player'
}

export const RANK_ORDER: Record<MemberRank, number> = {
  manager: 1, coach: 2, captain: 3, state: 4, masiswa: 5, player: 6,
}

/** Hide all but the last four digits, for anyone who is not an organiser. */
export function maskIC(ic: string): string {
  return ic.replace(/\d(?=\d{4})/g, '•')
}
