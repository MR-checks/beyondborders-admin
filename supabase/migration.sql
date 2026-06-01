-- BeyondBorders Admin Portal — V1 Schema Migration
-- Run this in the Supabase SQL Editor

-- ==============================================================================
-- ⚠️ IMPORTANT: If you already ran previous schema scripts and are getting
-- "relation already exists" errors, you can UNCOMMENT the following lines
-- to wipe the existing tables and start fresh. (THIS WILL DELETE EXISTING DATA).
-- ==============================================================================
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists handle_new_user cascade;
-- drop function if exists set_updated_at cascade;
-- drop table if exists activity_logs cascade;
-- drop table if exists notifications cascade;
-- drop table if exists media_files cascade;
-- drop table if exists reactions cascade;
-- drop table if exists comments cascade;
-- drop table if exists content_items cascade;
-- drop table if exists countries cascade;
-- drop table if exists profiles cascade;
-- ==============================================================================

-- Enable pgcrypto if not already enabled
create extension if not exists pgcrypto;

-- ENUMS ---------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin','admin','editor');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('visa_news','scholarship','work_opportunity','update','resource','visa_guide');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_status AS ENUM ('draft','published','scheduled','archived','pending_review');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE visa_kind AS ENUM ('study','work','tourist','medical');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- PROFILES (mirrors auth.users) --------------------------------------
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  avatar_url   text,
  role         user_role not null default 'admin',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- COUNTRIES (reference + columns laid for future AI recommendations) ---
create table countries (
  id               uuid primary key default gen_random_uuid(),
  name             text not null unique,
  iso_code         text,
  flag_emoji       text,
  region           text,
  cost_level       smallint,
  visa_difficulty  smallint,
  primary_language text,
  work_rights_note text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- CONTENT ITEMS (single backbone table; details JSONB per type) --------
create table content_items (
  id               uuid primary key default gen_random_uuid(),
  type             content_type not null,
  title            text not null,
  slug             text,
  body             jsonb,
  body_html        text,
  summary          text,
  country_id       uuid references countries(id) on delete set null,
  visa_type        visa_kind,
  tags             text[] not null default '{}',
  source_url       text,
  normalized_title text,
  details          jsonb not null default '{}',
  status           content_status not null default 'published',
  start_date       timestamptz,
  end_date         timestamptz,
  publish_at       timestamptz,
  notified_at      timestamptz,
  author_id        uuid not null references profiles(id) on delete cascade,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index on content_items (type);
create index on content_items (status);
create index on content_items (country_id);
create index on content_items (end_date);
create index on content_items using gin (tags);
create index on content_items using gin (details);
create index on content_items using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,'')));

-- COMMENTS -------------------------------------------------------------
create table comments (
  id              uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  author_id       uuid not null references profiles(id) on delete cascade,
  body            text not null,
  mentions        uuid[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on comments (content_item_id);

-- REACTIONS ------------------------------------------------------------
create table reactions (
  id              uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  emoji           text not null,
  created_at      timestamptz not null default now(),
  unique (content_item_id, user_id, emoji)
);
create index on reactions (content_item_id);

-- MEDIA FILES (metadata; bytes live in Supabase Storage) ---------------
create table media_files (
  id              uuid primary key default gen_random_uuid(),
  content_item_id uuid references content_items(id) on delete cascade,
  uploader_id     uuid not null references profiles(id) on delete cascade,
  storage_path    text not null,
  file_name       text not null,
  mime_type       text,
  size_bytes      bigint,
  created_at      timestamptz not null default now()
);

-- NOTIFICATIONS (laid for future mentions/expiry; minimal use in V1) ----
create table notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  type         text not null,
  payload      jsonb not null default '{}',
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index on notifications (recipient_id, read_at);

-- ACTIVITY LOGS --------------------------------------------------------
create table activity_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  meta        jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index on activity_logs (created_at desc);

-- updated_at trigger ---------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
create trigger t_profiles_updated  before update on profiles      for each row execute function set_updated_at();
create trigger t_content_updated   before update on content_items for each row execute function set_updated_at();
create trigger t_comments_updated  before update on comments      for each row execute function set_updated_at();
create trigger t_countries_updated before update on countries     for each row execute function set_updated_at();

-- auto-create profile when an auth user is created ---------------------
create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', new.email))
  on conflict (id) do nothing;
  return new;
end; $$ language plpgsql security definer;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
