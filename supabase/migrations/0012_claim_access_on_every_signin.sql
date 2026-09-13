-- ============================================================================
-- SBC Hub · 0012 grant pending access on every sign-in, not only the first
--
-- handle_new_user() runs once, when the auth account is created. Anyone who
-- signed in before being invited — an officer who looked around, saw "no
-- access" and then asked for it; a manager who signed in before their team
-- was registered — already had an account, so the trigger never fired again
-- and the invitation was never applied.
--
-- claim_pending_access() does the same work for the signed-in user and is
-- called on every sign-in and whenever an account has no role yet. It only
-- ever acts on rows addressed to the caller's own verified email.
--
-- Also: removing an organiser failed if they had created anything, because
-- every created_by / invited_by reference had no ON DELETE rule.
-- ============================================================================

create or replace function public.claim_pending_access()
returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare
  uid   uuid := auth.uid();
  mail  citext;
  inv   admin_invites%rowtype;
  bound int := 0;
  promoted boolean := false;
begin
  if uid is null then
    return jsonb_build_object('ok', false);
  end if;

  select email into mail from auth.users where id = uid;
  if mail is null then
    return jsonb_build_object('ok', false);
  end if;

  select * into inv from admin_invites where email = mail and claimed_at is null;
  if found then
    insert into admins (id, email, full_name, role)
    values (uid, mail, inv.full_name, inv.role)
    on conflict (id) do update set role = excluded.role;
    update admin_invites set claimed_at = now() where email = mail;
    promoted := true;
  end if;

  update teams
     set manager_user_id = uid,
         manager_status  = case when manager_status = 'invited' then 'active' else manager_status end
   where manager_email = mail
     and manager_user_id is null;
  get diagnostics bound = row_count;

  return jsonb_build_object('ok', true, 'admin', promoted, 'teams', bound);
end $$;

revoke all on function public.claim_pending_access() from public, anon;
grant execute on function public.claim_pending_access() to authenticated;

-- ------------------------------------------------- removable organisers ----
alter table admins          drop constraint if exists admins_created_by_fkey;
alter table admins          add  constraint admins_created_by_fkey
  foreign key (created_by) references admins (id) on delete set null;

alter table admin_invites   drop constraint if exists admin_invites_invited_by_fkey;
alter table admin_invites   add  constraint admin_invites_invited_by_fkey
  foreign key (invited_by) references admins (id) on delete set null;

alter table competitions    drop constraint if exists competitions_created_by_fkey;
alter table competitions    add  constraint competitions_created_by_fkey
  foreign key (created_by) references admins (id) on delete set null;

alter table teams           drop constraint if exists teams_created_by_fkey;
alter table teams           add  constraint teams_created_by_fkey
  foreign key (created_by) references admins (id) on delete set null;

alter table veteran_players drop constraint if exists veteran_players_created_by_fkey;
alter table veteran_players add  constraint veteran_players_created_by_fkey
  foreign key (created_by) references admins (id) on delete set null;

-- ----------------------------------------------- never lose the last super --
-- Removing or demoting the only super organiser would leave nobody able to
-- run the competition or add organisers back.
create or replace function public.guard_last_super() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'super'
     and (tg_op = 'DELETE' or new.role <> 'super')
     and (select count(*) from admins where role = 'super') <= 1 then
    raise exception 'LAST_SUPER' using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;

revoke all on function public.guard_last_super() from public, anon, authenticated;

drop trigger if exists admins_last_super on admins;
create trigger admins_last_super
  before update of role or delete on admins
  for each row execute function public.guard_last_super();
