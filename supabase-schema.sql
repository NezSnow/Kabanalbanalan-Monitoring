-- ============================================================
-- KABANALBANALAN ATTENDANCE — Supabase Schema
-- Run this once in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. UUID extension (already enabled on most Supabase projects)
create extension if not exists "uuid-ossp";


-- ============================================================
-- TABLE: members
-- ============================================================
create table if not exists members (
  id             uuid        primary key default uuid_generate_v4(),
  name           text        not null,
  kampo_id       text        not null default 'shiloh_1',   -- ekklesia id
  kampo          text        not null default 'Shiloh 1',   -- ekklesia display name
  spiritual_name text        not null default '',
  gender         text        not null default 'male'
                             check (gender in ('male', 'female')),
  is_visitor     boolean     not null default false,
  img            text        not null default '',
  short          text        not null default '',
  created_at     timestamptz not null default now()
);

-- Add columns for existing projects
alter table members add column if not exists kampo_id text not null default 'shiloh_1';
alter table members add column if not exists kampo    text not null default 'Shiloh 1';

-- Row Level Security
alter table members enable row level security;

create policy "members: public read"
  on members for select using (true);

create policy "members: public insert"
  on members for insert with check (true);

create policy "members: public update"
  on members for update using (true);

create policy "members: public delete"
  on members for delete using (true);


-- ============================================================
-- TABLE: attendance
-- ============================================================
create table if not exists attendance (
  id           uuid        primary key default uuid_generate_v4(),
  date_iso     text        not null,               -- 'YYYY-MM-DD'
  kampo_id     text        not null default 'shiloh_1',   -- ekklesia id
  kampo        text        not null default 'Shiloh 1',   -- ekklesia display name
  join_type    text        not null
               check (join_type in ('Online', 'Face to Face', 'SVJ')),
  member_id    uuid        references members(id) on delete set null,
  member_name  text        not null,
  member_short text        not null default '',
  gender       text        not null default '',
  is_visitor   boolean     not null default false,
  img          text        not null default '',
  created_at   timestamptz not null default now()
);

-- Add columns for existing projects
alter table attendance add column if not exists kampo_id text not null default 'shiloh_1';
alter table attendance add column if not exists kampo    text not null default 'Shiloh 1';

-- Indexes
create index if not exists idx_attendance_date_iso       on attendance (date_iso);
create index if not exists idx_members_kampo_id          on members (kampo_id);
create index if not exists idx_attendance_kampo_id_date  on attendance (kampo_id, date_iso);
create index if not exists idx_members_kampo             on members (kampo);
create index if not exists idx_attendance_kampo_date     on attendance (kampo, date_iso);

-- Row Level Security
alter table attendance enable row level security;

create policy "attendance: public read"
  on attendance for select using (true);

create policy "attendance: public insert"
  on attendance for insert with check (true);


-- ============================================================
-- TABLE: app_users (signup + approval workflow)
-- ============================================================
create table if not exists app_users (
  id           uuid        primary key default uuid_generate_v4(),
  name         text        not null,
  email        text        not null unique,
  password     text        not null,
  kampo_id     text        not null default 'shiloh_1',   -- ekklesia id
  kampo        text        not null default 'Shiloh 1',   -- ekklesia display name
  status       text        not null default 'pending'
               check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now(),
  approved_at  timestamptz
);

create index if not exists idx_app_users_status   on app_users (status);
create index if not exists idx_app_users_kampo_id on app_users (kampo_id);

alter publication supabase_realtime add table app_users;

alter table app_users enable row level security;

create policy "app_users: public read"
  on app_users for select using (true);

create policy "app_users: public insert"
  on app_users for insert with check (true);

create policy "app_users: public update"
  on app_users for update using (true);


-- ============================================================
-- STORAGE BUCKET: member-photos  (optional)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', true)
on conflict (id) do nothing;

create policy "photos: public read"
  on storage.objects for select
  using (bucket_id = 'member-photos');

create policy "photos: public upload"
  on storage.objects for insert
  with check (bucket_id = 'member-photos');


-- ============================================================
-- DATA MIGRATION
-- Run this section ONCE in the Supabase SQL Editor to migrate
-- existing data to the new ekklesia structure.
-- ============================================================

-- 1. Clear all attendance records (fresh start as requested)
delete from attendance;

-- 2. Migrate members to new ekklesia ids
--    Shiloh      → Shiloh 1
update members set kampo_id = 'shiloh_1',  kampo = 'Shiloh 1'
  where kampo_id in ('shiloh') or lower(kampo) in ('shiloh');

--    Paquibato   → Salapawan
update members set kampo_id = 'salapawan', kampo = 'Salapawan'
  where kampo_id in ('paquibato') or lower(kampo) in ('paquibato district', 'paquibato');

--    Tagum       → Tagum City
update members set kampo_id = 'tagum_city', kampo = 'Tagum City'
  where kampo_id in ('tagum') or lower(kampo) in ('tagum city', 'tagum');

--    Monkayo     → Rizal
update members set kampo_id = 'rizal', kampo = 'Rizal'
  where kampo_id in ('monkayo') or lower(kampo) in ('monkayo');

-- 3. Migrate app_users the same way
update app_users set kampo_id = 'shiloh_1',  kampo = 'Shiloh 1'
  where kampo_id in ('shiloh') or lower(kampo) in ('shiloh');

update app_users set kampo_id = 'salapawan', kampo = 'Salapawan'
  where kampo_id in ('paquibato') or lower(kampo) in ('paquibato district', 'paquibato');

update app_users set kampo_id = 'tagum_city', kampo = 'Tagum City'
  where kampo_id in ('tagum') or lower(kampo) in ('tagum city', 'tagum');

update app_users set kampo_id = 'rizal', kampo = 'Rizal'
  where kampo_id in ('monkayo') or lower(kampo) in ('monkayo');

-- ============================================================
-- END OF MIGRATION
-- ============================================================
