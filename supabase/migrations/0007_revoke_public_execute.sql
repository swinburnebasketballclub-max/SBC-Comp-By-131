-- ============================================================================
-- SBC Hub · 0007 close the RPC surface properly
--
-- 0006 revoked EXECUTE from `anon` and `authenticated`, but Postgres grants
-- EXECUTE on every new function to the `PUBLIC` pseudo-role by default, and
-- both API roles inherit it from there. Revoking from PUBLIC is what actually
-- takes the functions off `/rest/v1/rpc/*`.
-- ============================================================================

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prokind = 'f'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    -- the server-side key still needs to reach everything
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;

-- Called from inside row level security policies, so the querying role must
-- keep EXECUTE or every policy on every table fails.
grant execute on function public.is_admin()                            to authenticated;
grant execute on function public.has_admin_role(variadic admin_role[]) to authenticated;
grant execute on function public.manages_team(uuid)                    to authenticated;
grant execute on function public.team_editable(uuid)                   to authenticated;
grant execute on function public.can_finance()                         to authenticated;
grant execute on function public.can_fixtures()                        to authenticated;
grant execute on function public.owns_storage_object(text)             to authenticated;

-- The three deliberate entry points: two for the player link, one for the
-- public fixtures page.
grant execute on function public.invite_context(text)       to anon, authenticated;
grant execute on function public.submit_player(text, jsonb) to anon, authenticated;
grant execute on function public.get_fixtures(text)         to anon, authenticated;

-- Stop future functions from being world-executable by default.
alter default privileges in schema public revoke execute on functions from public;
