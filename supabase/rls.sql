-- BeyondBorders Admin Portal — V1 RLS Policies
-- Run AFTER migration.sql

-- Helper: is_super_admin() — security definer to avoid RLS recursion
create or replace function is_super_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid()
      and role = 'super_admin'
  );
end;
$$;

-- =====================================================================
-- PROFILES
-- =====================================================================
alter table profiles enable row level security;

-- Any authenticated user can read all profiles (for author display)
create policy "profiles_select" on profiles
  for select to authenticated
  using (true);

-- Users can update their own profile (except role)
create policy "profiles_update_own" on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Super admin can update any profile (including role changes)
create policy "profiles_update_super" on profiles
  for update to authenticated
  using (is_super_admin())
  with check (is_super_admin());

-- =====================================================================
-- COUNTRIES
-- =====================================================================
alter table countries enable row level security;

create policy "countries_select" on countries
  for select to authenticated
  using (true);

create policy "countries_insert" on countries
  for insert to authenticated
  with check (is_super_admin());

create policy "countries_update" on countries
  for update to authenticated
  using (is_super_admin())
  with check (is_super_admin());

create policy "countries_delete" on countries
  for delete to authenticated
  using (is_super_admin());

-- =====================================================================
-- CONTENT ITEMS
-- =====================================================================
alter table content_items enable row level security;

create policy "content_select" on content_items
  for select to authenticated
  using (true);

create policy "content_insert" on content_items
  for insert to authenticated
  with check (author_id = auth.uid());

create policy "content_update_own" on content_items
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "content_update_super" on content_items
  for update to authenticated
  using (is_super_admin())
  with check (is_super_admin());

create policy "content_delete_own" on content_items
  for delete to authenticated
  using (author_id = auth.uid());

create policy "content_delete_super" on content_items
  for delete to authenticated
  using (is_super_admin());

-- =====================================================================
-- COMMENTS
-- =====================================================================
alter table comments enable row level security;

create policy "comments_select" on comments
  for select to authenticated
  using (true);

create policy "comments_insert" on comments
  for insert to authenticated
  with check (author_id = auth.uid());

create policy "comments_update_own" on comments
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "comments_update_super" on comments
  for update to authenticated
  using (is_super_admin())
  with check (is_super_admin());

create policy "comments_delete_own" on comments
  for delete to authenticated
  using (author_id = auth.uid());

create policy "comments_delete_super" on comments
  for delete to authenticated
  using (is_super_admin());

-- =====================================================================
-- REACTIONS
-- =====================================================================
alter table reactions enable row level security;

create policy "reactions_select" on reactions
  for select to authenticated
  using (true);

create policy "reactions_insert" on reactions
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "reactions_delete_own" on reactions
  for delete to authenticated
  using (user_id = auth.uid());

create policy "reactions_delete_super" on reactions
  for delete to authenticated
  using (is_super_admin());

-- =====================================================================
-- MEDIA FILES
-- =====================================================================
alter table media_files enable row level security;

create policy "media_select" on media_files
  for select to authenticated
  using (true);

create policy "media_insert" on media_files
  for insert to authenticated
  with check (uploader_id = auth.uid());

create policy "media_delete_own" on media_files
  for delete to authenticated
  using (uploader_id = auth.uid());

create policy "media_delete_super" on media_files
  for delete to authenticated
  using (is_super_admin());

-- =====================================================================
-- NOTIFICATIONS
-- =====================================================================
alter table notifications enable row level security;

create policy "notifications_select_own" on notifications
  for select to authenticated
  using (recipient_id = auth.uid());

create policy "notifications_update_own" on notifications
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- =====================================================================
-- ACTIVITY LOGS
-- =====================================================================
alter table activity_logs enable row level security;

create policy "activity_select" on activity_logs
  for select to authenticated
  using (true);

-- Inserts via service role (admin client) only — no client insert policy
