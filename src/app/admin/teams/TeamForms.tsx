'use client'

import { useActionState, useState, useTransition } from 'react'

import {
  cancelInvite, changeManager, createTeam, inviteAdmin, removeAdmin, setAdminRole, setLock, setManagerStatus, type Result,
} from './actions'

/** Error codes the server actions return, in both languages. */
const MESSAGES: Record<string, { en: string; zh: string }> = {
  TEAM_CREATED:             { en: 'Team registered. The manager gets access as soon as they sign in.', zh: '球队已建立。经理一登入就会拿到权限。' },
  TEAM_NAME_TAKEN:          { en: 'A team with that name is already registered.', zh: '这个球队名称已经有人用了。' },
  TEAM_NAME_TOO_SHORT:      { en: 'Team name is too short.', zh: '球队名称太短。' },
  EMAIL_INVALID:            { en: 'That does not look like an email address.', zh: '这个不像是 email 地址。' },
  MANAGER_ALREADY_HAS_TEAM: { en: 'That account already manages a team in this competition.', zh: '这个帐号在本届已经带了一支球队。' },
  COMPETITION_FULL:         { en: 'The competition is full.', zh: '球队已额满。' },
  MANAGER_CHANGED:          { en: 'Manager changed. The old account lost access immediately; the roster is untouched.', zh: '经理已更换。旧帐号立刻失去权限，名单不受影响。' },
  MANAGER_DISABLED:         { en: 'Manager disabled.', zh: '经理帐号已停用。' },
  MANAGER_ENABLED:          { en: 'Manager re-enabled.', zh: '经理帐号已恢复。' },
  ROSTER_LOCKED:            { en: 'Roster locked.', zh: '名单已锁定。' },
  EDIT_WINDOW_OPEN:         { en: 'Open for 48 hours, then it locks itself again.', zh: '开放 48 小时，之后自动锁回去。' },
  ADMIN_INVITED:            { en: 'Invited. They become an organiser the next time they sign in — even if they have signed in before.', zh: '已邀请。对方下次登入就成为 Admin（以前登入过也没问题）。' },
  FORBIDDEN:                { en: 'Only a super organiser can do that.', zh: '只有超级管理员能做这件事。' },
  ADMIN_ROLE_CHANGED:       { en: 'Role changed.', zh: '权限已更改。' },
  ADMIN_REMOVED:            { en: 'Organiser removed. They lose access on their next page load.', zh: '已移除。对方下次载入页面就会失去权限。' },
  INVITE_CANCELLED:         { en: 'Invite cancelled.', zh: '邀请已取消。' },
  ALREADY_ADMIN:            { en: 'That account is already an organiser — change its role in the table instead.', zh: '这个帐号已经是 Admin 了，请直接在表格里改权限。' },
  LAST_SUPER:               { en: 'There must always be at least one super organiser.', zh: '至少要保留一位超级管理员。' },
  CANNOT_REMOVE_SELF:       { en: 'You cannot remove yourself. Ask another super organiser.', zh: '不能移除自己，请另一位超级管理员操作。' },
}

function say(code: string, locale: 'en' | 'zh') {
  return MESSAGES[code]?.[locale] ?? code
}

function Feedback({ state, locale }: { state: Result | null; locale: 'en' | 'zh' }) {
  if (!state) return null
  return (
    <div className={`note ${state.ok ? 'ok' : 'crit'}`}>
      {say(state.ok ? state.message : state.error, locale)}
    </div>
  )
}

type L = { locale: 'en' | 'zh'; labels: Record<string, string> }

// ---------------------------------------------------------------- new team --
export function NewTeamForm({ competitionId, full, locale, labels }: L & { competitionId: string; full: boolean }) {
  const [state, action, pending] = useActionState(createTeam, null)

  if (full) return <div className="note warn">{labels.teamsFull}</div>

  return (
    <form action={action} className="stack" style={{ gap: 14 }}>
      <input type="hidden" name="competition_id" value={competitionId} />
      <div className="form-grid">
        <label className="field">
          <span>{labels.fieldTeamName} <span className="req">*</span></span>
          <input className="inp" name="name" required maxLength={60} placeholder="Thunder Cats" />
        </label>
        <label className="field">
          <span>{labels.fieldManagerMail} <span className="req">*</span></span>
          <input className="inp" name="manager_email" type="email" required placeholder="manager@gmail.com" />
        </label>
        <label className="field">
          <span>{labels.fieldManagerName}</span>
          <input className="inp" name="manager_name" placeholder="Full name" />
        </label>
        <label className="field">
          <span>{labels.fieldCaptainWA}</span>
          <input className="inp" name="captain_whatsapp" placeholder="+6012-345 6789" />
        </label>
      </div>
      <Feedback state={state} locale={locale} />
      <div>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? labels.working : labels.createTeam}
        </button>
      </div>
    </form>
  )
}

// ----------------------------------------------------------- row controls --
export function TeamRowActions({
  teamId, disabled, locked, locale, labels,
}: L & { teamId: string; disabled: boolean; locked: boolean }) {
  const [busy, start] = useTransition()
  const [msg, setMsg] = useState<Result | null>(null)
  const [editing, setEditing] = useState(false)

  function run(fn: () => Promise<Result>) {
    start(async () => setMsg(await fn()))
  }

  return (
    <div className="stack" style={{ gap: 8, alignItems: 'flex-end' }}>
      <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
        <button className="btn btn-sm" disabled={busy} onClick={() => setEditing((v) => !v)}>
          {labels.actChangeMgr}
        </button>
        <button className="btn btn-sm" disabled={busy} onClick={() => run(() => setManagerStatus(teamId, !disabled))}>
          {disabled ? labels.actEnable : labels.actDisable}
        </button>
        <button className="btn btn-sm" disabled={busy} onClick={() => run(() => setLock(teamId, !locked))}>
          {locked ? labels.actUnlock : labels.actLock}
        </button>
      </div>

      {editing && <ChangeManagerForm teamId={teamId} locale={locale} labels={labels} onDone={() => setEditing(false)} />}
      {msg && (
        <span className={`tag ${msg.ok ? 't-ok' : 't-crit'}`}>
          {say(msg.ok ? msg.message : msg.error, locale)}
        </span>
      )}
    </div>
  )
}

function ChangeManagerForm({
  teamId, locale, labels, onDone,
}: L & { teamId: string; onDone: () => void }) {
  const [state, action, pending] = useActionState(changeManager, null)
  if (state?.ok) queueMicrotask(onDone)

  return (
    <form action={action} className="stack" style={{ gap: 8, minWidth: 260 }}>
      <input type="hidden" name="team_id" value={teamId} />
      <input className="inp" name="manager_email" type="email" required placeholder="new-manager@gmail.com" />
      <input className="inp" name="manager_name" placeholder={labels.fieldManagerName} />
      <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
        <button type="button" className="btn btn-sm" onClick={onDone}>{labels.cancel}</button>
        <button className="btn btn-sm btn-primary" disabled={pending}>
          {pending ? labels.working : labels.save}
        </button>
      </div>
      <Feedback state={state} locale={locale} />
    </form>
  )
}

// -------------------------------------------------------------- new admin --
export function InviteAdminForm({ locale, labels }: L) {
  const [state, action, pending] = useActionState(inviteAdmin, null)

  return (
    <form action={action} className="stack" style={{ gap: 13 }}>
      <div className="form-grid">
        <label className="field">
          <span>{labels.fGoogleAccount} <span className="req">*</span></span>
          <input className="inp" name="email" type="email" required placeholder="officer@gmail.com" />
        </label>
        <label className="field">
          <span>{labels.fName}</span>
          <input className="inp" name="full_name" placeholder="Full name" />
        </label>
        <label className="field">
          <span>{labels.fRole}</span>
          <select className="inp" name="role" defaultValue="finance">
            <option value="super">{labels.roleSuper}</option>
            <option value="finance">{labels.roleFinance}</option>
            <option value="fixtures">{labels.roleFixtures}</option>
          </select>
        </label>
      </div>
      <Feedback state={state} locale={locale} />
      <div>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? labels.working : labels.inviteAdmin}
        </button>
      </div>
    </form>
  )
}

// ------------------------------------------------------- organiser rows --
type Role = 'super' | 'finance' | 'fixtures'

export function AdminRowActions({
  adminId, role, isYou, locale, labels,
}: L & { adminId: string; role: Role; isYou: boolean }) {
  const [busy, start] = useTransition()
  const [msg, setMsg] = useState<Result | null>(null)

  return (
    <div className="stack" style={{ gap: 6, alignItems: 'flex-end' }}>
      <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
        <select
          className="inp"
          style={{ width: 'auto', padding: '4px 8px', fontSize: 12.5 }}
          value={role}
          disabled={busy}
          onChange={(e) => start(async () => setMsg(await setAdminRole(adminId, e.target.value as Role)))}
        >
          <option value="super">{labels.roleSuper}</option>
          <option value="finance">{labels.roleFinance}</option>
          <option value="fixtures">{labels.roleFixtures}</option>
        </select>
        {!isYou && (
          <button
            className="btn btn-sm"
            disabled={busy}
            onClick={() => {
              if (confirm(labels.confirmRemoveAdmin)) start(async () => setMsg(await removeAdmin(adminId)))
            }}
          >
            {labels.remove}
          </button>
        )}
      </div>
      {msg && (
        <span className={`tag ${msg.ok ? 't-ok' : 't-crit'}`}>{say(msg.ok ? msg.message : msg.error, locale)}</span>
      )}
    </div>
  )
}

export function InviteRowActions({ email, locale, labels }: L & { email: string }) {
  const [busy, start] = useTransition()
  const [msg, setMsg] = useState<Result | null>(null)
  return (
    <div className="stack" style={{ gap: 6, alignItems: 'flex-end' }}>
      <button className="btn btn-sm" disabled={busy} onClick={() => start(async () => setMsg(await cancelInvite(email)))}>
        {labels.cancelInvite}
      </button>
      {msg && !msg.ok && <span className="tag t-crit">{say(msg.error, locale)}</span>}
    </div>
  )
}
