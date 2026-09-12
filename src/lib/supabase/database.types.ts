// ===========================================================================
// Mirrors the live database. Keep in step with supabase/migrations.
//
// Row and Insert shapes are declared as standalone types and the Database map
// is composed from them. Writing `Update: Partial<Database[...]['Insert']>`
// inline makes the type refer to itself while it is still being defined, and
// TypeScript quietly resolves every query result to `never`.
// ===========================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ------------------------------------------------------------------ enums --
export type AdminRole = 'super' | 'finance' | 'fixtures'
export type ColourStatus = 'pending' | 'approved' | 'rejected'
export type CompStatus = 'draft' | 'open' | 'closed' | 'locked' | 'running' | 'finished'
export type InviteKind = 'shared' | 'single'
export type ManagerStatus = 'invited' | 'active' | 'disabled'
export type MemberStatus = 'pending' | 'active' | 'declined'
export type NewPlayerSrc = 'registry' | 'self' | 'admin'
export type PaymentStatus = 'none' | 'pending' | 'approved' | 'rejected'
export type PlayerTier = 'none' | 'masiswa' | 'state'
export type StageKind = 'round_robin' | 'group' | 'knockout'

// ----------------------------------------------------------------- admins --
export type AdminRow = {
  id: string
  email: string
  full_name: string
  role: AdminRole
  created_at: string
  created_by: string | null
}
export type AdminInsert = {
  id: string
  email: string
  full_name?: string
  role?: AdminRole
  created_at?: string
  created_by?: string | null
}

export type AdminInviteRow = {
  email: string
  role: AdminRole
  full_name: string
  invited_at: string
  invited_by: string | null
  claimed_at: string | null
}
export type AdminInviteInsert = {
  email: string
  role: AdminRole
  full_name?: string
  invited_at?: string
  invited_by?: string | null
  claimed_at?: string | null
}

// ----------------------------------------------------------- competitions --
export type CompetitionRow = {
  id: string
  slug: string
  name_en: string
  name_zh: string
  season: string
  venue_en: string
  venue_zh: string
  starts_on: string
  ends_on: string
  registration_deadline: string
  status: CompStatus
  max_teams: number
  roster_min: number
  roster_max: number
  max_coaches: number
  max_managers: number
  max_masiswa: number
  max_state: number
  deposit_cents: number
  daily_start: string
  daily_end: string
  match_minutes: number
  courts: number
  min_colour_distance: number
  bank_name: string
  bank_holder: string
  bank_account: string
  bank_whatsapp: string
  bank_qr_path: string | null
  purge_after_days: number
  created_at: string
  created_by: string | null
}
export type CompetitionInsert = {
  slug: string
  name_en: string
  name_zh: string
  season: string
  starts_on: string
  ends_on: string
  registration_deadline: string
  id?: string
  venue_en?: string
  venue_zh?: string
  status?: CompStatus
  max_teams?: number
  roster_min?: number
  roster_max?: number
  max_coaches?: number
  max_managers?: number
  max_masiswa?: number
  max_state?: number
  deposit_cents?: number
  daily_start?: string
  daily_end?: string
  match_minutes?: number
  courts?: number
  min_colour_distance?: number
  bank_name?: string
  bank_holder?: string
  bank_account?: string
  bank_whatsapp?: string
  bank_qr_path?: string | null
  purge_after_days?: number
  created_at?: string
  created_by?: string | null
}

export type FeeTierRow = {
  id: string
  competition_id: string
  key: string
  masiswa_count: number
  label_en: string
  label_zh: string
  amount_cents: number
  sort: number
}
export type FeeTierInsert = {
  competition_id: string
  key: string
  masiswa_count: number
  label_en: string
  label_zh: string
  amount_cents: number
  id?: string
  sort?: number
}

export type TermRow = {
  id: string
  competition_id: string
  idx: number
  body_en: string
  body_zh: string
}
export type TermInsert = {
  competition_id: string
  idx: number
  body_en: string
  body_zh: string
  id?: string
}

// ------------------------------------------------------ veteran registry --
export type VeteranRow = {
  id: string
  ic_norm: string
  full_name: string
  seasons: string[]
  note: string
  created_at: string
  created_by: string | null
}
export type VeteranInsert = {
  ic_norm: string
  full_name: string
  id?: string
  seasons?: string[]
  note?: string
  created_at?: string
  created_by?: string | null
}

// ------------------------------------------------------------------ teams --
export type TeamRow = {
  id: string
  competition_id: string
  name: string
  crest_color: string
  logo_path: string | null
  manager_user_id: string | null
  manager_email: string
  manager_name: string
  manager_status: ManagerStatus
  invited_at: string
  captain_name: string
  captain_whatsapp: string
  terms_accepted_at: string | null
  locked_at: string | null
  edit_window_until: string | null
  created_at: string
  created_by: string | null
}
export type TeamInsert = {
  competition_id: string
  name: string
  manager_email: string
  id?: string
  crest_color?: string
  logo_path?: string | null
  manager_user_id?: string | null
  manager_name?: string
  manager_status?: ManagerStatus
  invited_at?: string
  captain_name?: string
  captain_whatsapp?: string
  terms_accepted_at?: string | null
  locked_at?: string | null
  edit_window_until?: string | null
  created_at?: string
  created_by?: string | null
}

export type TeamMemberRow = {
  id: string
  team_id: string
  competition_id: string
  full_name: string
  ic_no: string
  ic_norm: string | null
  phone: string
  student_id: string
  course: string
  study_year: string
  jersey_no: number | null
  jersey_name: string | null
  jersey_size: string | null
  tier: PlayerTier
  is_manager: boolean
  is_coach: boolean
  is_captain: boolean
  is_player: boolean
  is_new_player: boolean
  new_player_src: NewPlayerSrc
  photo_path: string | null
  status: MemberStatus
  invite_link_id: string | null
  submitted_at: string
  confirmed_at: string | null
  confirmed_by: string | null
  created_at: string
  updated_at: string
}
export type TeamMemberInsert = {
  team_id: string
  competition_id: string
  full_name: string
  ic_no: string
  id?: string
  phone?: string
  student_id?: string
  course?: string
  study_year?: string
  jersey_no?: number | null
  jersey_name?: string | null
  jersey_size?: string | null
  tier?: PlayerTier
  is_manager?: boolean
  is_coach?: boolean
  is_captain?: boolean
  is_player?: boolean
  is_new_player?: boolean
  new_player_src?: NewPlayerSrc
  photo_path?: string | null
  status?: MemberStatus
  invite_link_id?: string | null
  submitted_at?: string
  confirmed_at?: string | null
  confirmed_by?: string | null
  created_at?: string
  updated_at?: string
}

export type InviteLinkRow = {
  id: string
  team_id: string
  token: string
  kind: InviteKind
  label: string
  max_uses: number | null
  uses: number
  expires_at: string | null
  revoked_at: string | null
  created_at: string
  created_by: string | null
}
export type InviteLinkInsert = {
  team_id: string
  token: string
  id?: string
  kind?: InviteKind
  label?: string
  max_uses?: number | null
  uses?: number
  expires_at?: string | null
  revoked_at?: string | null
  created_at?: string
  created_by?: string | null
}

// --------------------------------------------------------------- payments --
export type PaymentRow = {
  id: string
  team_id: string
  tier_key: string | null
  base_cents: number
  deposit_cents: number
  total_cents: number | null
  reference_no: string
  receipt_path: string | null
  status: PaymentStatus
  reject_reason: string
  refund_bank: string
  refund_holder: string
  refund_account: string
  refund_saved_at: string | null
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
}
export type PaymentInsert = {
  team_id: string
  id?: string
  tier_key?: string | null
  base_cents?: number
  deposit_cents?: number
  reference_no?: string
  receipt_path?: string | null
  status?: PaymentStatus
  reject_reason?: string
  refund_bank?: string
  refund_holder?: string
  refund_account?: string
  refund_saved_at?: string | null
  submitted_at?: string | null
  reviewed_at?: string | null
  reviewed_by?: string | null
}

// --------------------------------------------------------- jersey colours --
export type JerseyColourRow = {
  id: string
  competition_id: string
  team_id: string
  hex: string
  name_en: string
  name_zh: string
  is_custom: boolean
  design_path: string | null
  design_note: string
  claimed_at: string
  status: ColourStatus
  reviewed_at: string | null
  reviewed_by: string | null
}
export type JerseyColourInsert = {
  competition_id: string
  team_id: string
  hex: string
  name_en: string
  id?: string
  name_zh?: string
  is_custom?: boolean
  design_path?: string | null
  design_note?: string
  claimed_at?: string
  status?: ColourStatus
  reviewed_at?: string | null
  reviewed_by?: string | null
}

// --------------------------------------------------------------- fixtures --
export type StageRow = {
  id: string
  competition_id: string
  kind: StageKind
  name_en: string
  name_zh: string
  sort: number
}
export type StageInsert = {
  competition_id: string
  kind: StageKind
  name_en: string
  name_zh: string
  id?: string
  sort?: number
}

export type GroupRow = { id: string; stage_id: string; name: string; sort: number }
export type GroupInsert = { stage_id: string; name: string; id?: string; sort?: number }

export type GroupTeamRow = { group_id: string; team_id: string; seed: number }
export type GroupTeamInsert = { group_id: string; team_id: string; seed?: number }

export type MatchRow = {
  id: string
  competition_id: string
  stage_id: string | null
  group_id: string | null
  round: number
  ord: number
  home_team_id: string | null
  away_team_id: string | null
  home_label_en: string
  home_label_zh: string
  away_label_en: string
  away_label_zh: string
  scheduled_at: string | null
  court: number
  created_at: string
}
export type MatchInsert = {
  competition_id: string
  id?: string
  stage_id?: string | null
  group_id?: string | null
  round?: number
  ord?: number
  home_team_id?: string | null
  away_team_id?: string | null
  home_label_en?: string
  home_label_zh?: string
  away_label_en?: string
  away_label_zh?: string
  scheduled_at?: string | null
  court?: number
  created_at?: string
}

export type AuditRow = {
  id: number
  actor_id: string | null
  actor_email: string | null
  action: string
  entity: string
  entity_id: string | null
  before: Json | null
  after: Json | null
  at: string
}
export type AuditInsert = {
  action: string
  entity: string
  id?: number
  actor_id?: string | null
  actor_email?: string | null
  entity_id?: string | null
  before?: Json | null
  after?: Json | null
  at?: string
}

// ------------------------------------------------------- function returns --
export type FixtureRow = {
  match_id: string
  round: number
  ord: number
  scheduled_at: string | null
  court: number
  stage_en: string | null
  stage_zh: string | null
  group_name: string | null
  home_team: string | null
  home_crest: string | null
  home_logo: string | null
  away_team: string | null
  away_crest: string | null
  away_logo: string | null
  home_label_en: string
  home_label_zh: string
  away_label_en: string
  away_label_zh: string
}

export type RosterCounts = {
  players: number
  coaches: number
  managers: number
  masiswa: number
  state: number
  all_new: boolean
}

export type TeamFee = {
  tier_key: string
  base_cents: number
  deposit_cents: number
  total_cents: number
}

// -------------------------------------------------------------- the shape --
type Table<R, I> = { Row: R; Insert: I; Update: Partial<I>; Relationships: [] }

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.5' }
  public: {
    Tables: {
      admins: Table<AdminRow, AdminInsert>
      admin_invites: Table<AdminInviteRow, AdminInviteInsert>
      competitions: Table<CompetitionRow, CompetitionInsert>
      fee_tiers: Table<FeeTierRow, FeeTierInsert>
      terms: Table<TermRow, TermInsert>
      veteran_players: Table<VeteranRow, VeteranInsert>
      teams: Table<TeamRow, TeamInsert>
      team_members: Table<TeamMemberRow, TeamMemberInsert>
      invite_links: Table<InviteLinkRow, InviteLinkInsert>
      payments: Table<PaymentRow, PaymentInsert>
      jersey_colours: Table<JerseyColourRow, JerseyColourInsert>
      stages: Table<StageRow, StageInsert>
      groups: Table<GroupRow, GroupInsert>
      group_teams: Table<GroupTeamRow, GroupTeamInsert>
      matches: Table<MatchRow, MatchInsert>
      audit_log: Table<AuditRow, AuditInsert>
    }
    Views: { [_ in never]: never }
    Functions: {
      get_fixtures: { Args: { p_slug: string }; Returns: FixtureRow[] }
      invite_context: { Args: { p_token: string }; Returns: Json }
      submit_player: { Args: { p_token: string; p: Json }; Returns: Json }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      can_finance: { Args: Record<PropertyKey, never>; Returns: boolean }
      can_fixtures: { Args: Record<PropertyKey, never>; Returns: boolean }
      has_admin_role: { Args: { wanted: AdminRole[] }; Returns: boolean }
      manages_team: { Args: { p_team: string }; Returns: boolean }
      team_editable: { Args: { p_team: string }; Returns: boolean }
      owns_storage_object: { Args: { object_name: string }; Returns: boolean }
      roster_counts: { Args: { p_team: string }; Returns: RosterCounts[] }
      team_fee: { Args: { p_team: string }; Returns: TeamFee[] }
      refresh_team_fee: { Args: { p_team: string }; Returns: undefined }
      colour_distance: { Args: { a: string; b: string }; Returns: number }
      storage_team_id: { Args: { object_name: string }; Returns: string }
    }
    Enums: {
      admin_role: AdminRole
      colour_status: ColourStatus
      comp_status: CompStatus
      invite_kind: InviteKind
      manager_status: ManagerStatus
      member_status: MemberStatus
      new_player_src: NewPlayerSrc
      payment_status: PaymentStatus
      player_tier: PlayerTier
      stage_kind: StageKind
    }
    CompositeTypes: { [_ in never]: never }
  }
}

// Friendlier aliases used across the app.
export type Competition = CompetitionRow
export type Team = TeamRow
export type TeamMember = TeamMemberRow
export type Payment = PaymentRow
export type JerseyColour = JerseyColourRow
export type InviteLink = InviteLinkRow
export type FeeTier = FeeTierRow
export type Term = TermRow
export type VeteranPlayer = VeteranRow
