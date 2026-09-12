-- ============================================================================
-- SBC Hub · 0005 file storage
--
-- Four buckets. Only team logos are public — they appear on the fixtures page
-- that anyone can open. Passport photos, receipts and jersey designs are
-- private and reachable only through a signed URL.
--
-- Path convention for every bucket:  teams/<team_id>/<filename>
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos',         'photos',         false, 3145728,  array['image/jpeg','image/png','image/webp']),
  ('receipts',       'receipts',       false, 8388608,  array['image/jpeg','image/png','image/webp','application/pdf']),
  ('team-logos',     'team-logos',     true,  3145728,  array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('jersey-designs', 'jersey-designs', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Which team does this object belong to? teams/<team_id>/...
create or replace function public.storage_team_id(object_name text) returns uuid
language plpgsql immutable as $$
declare parts text[]; begin
  parts := string_to_array(object_name, '/');
  if array_length(parts,1) < 2 or parts[1] <> 'teams' then return null; end if;
  begin return parts[2]::uuid; exception when others then return null; end;
end $$;

create or replace function public.owns_storage_object(object_name text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or public.manages_team(public.storage_team_id(object_name));
$$;

-- ------------------------------------------------------------- policies ----
drop policy if exists sbc_storage_read   on storage.objects;
drop policy if exists sbc_storage_write  on storage.objects;
drop policy if exists sbc_storage_update on storage.objects;
drop policy if exists sbc_storage_delete on storage.objects;
drop policy if exists sbc_logos_public   on storage.objects;

-- anyone may read a team logo (public fixtures page)
create policy sbc_logos_public on storage.objects for select to anon, authenticated
  using (bucket_id = 'team-logos');

-- everything else: only that team's manager, or an admin
create policy sbc_storage_read on storage.objects for select to authenticated
  using (bucket_id in ('photos','receipts','jersey-designs')
         and public.owns_storage_object(name));

create policy sbc_storage_write on storage.objects for insert to authenticated
  with check (bucket_id in ('photos','receipts','jersey-designs','team-logos')
              and public.owns_storage_object(name));

create policy sbc_storage_update on storage.objects for update to authenticated
  using (bucket_id in ('photos','receipts','jersey-designs','team-logos')
         and public.owns_storage_object(name))
  with check (public.owns_storage_object(name));

create policy sbc_storage_delete on storage.objects for delete to authenticated
  using (bucket_id in ('photos','receipts','jersey-designs','team-logos')
         and public.owns_storage_object(name));

-- Players are not logged in, so their passport photo is never uploaded by the
-- browser directly. The player form posts it to our own server route, which
-- checks the invite token first and then writes with the service role key.
-- That is why there is no anonymous insert policy here.
