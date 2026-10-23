-- =========================================================================
-- FILE SQL TỔNG HỢP TOÀN BỘ DATABASE SUPABASE CHO LỚP 11A1
-- Cách chạy: Supabase Dashboard -> SQL Editor -> New Query -> Dán toàn bộ file này -> Bấm Run
-- (Chạy an toàn, không làm mất dữ liệu đã có)
-- =========================================================================

-- 1. BẢNG EVENTS (LƯU LỊCH SỬ CHẤM ĐIỂM)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  week_id text not null,
  team_id text not null,
  member_id text not null,
  rule_id text not null,
  points integer not null,
  label text not null,
  note text not null default '',
  by_team_id text not null,
  created_at bigint not null
);

create index if not exists events_week_created_idx
  on public.events (week_id, created_at desc);

alter table public.events enable row level security;

drop policy if exists "events_select_all" on public.events;
drop policy if exists "events_insert_valid" on public.events;
drop policy if exists "events_delete_all" on public.events;

create policy "events_select_all"
  on public.events for select
  using (true);

create policy "events_insert_valid"
  on public.events for insert
  with check (
    points >= -50
    and points <= 50
    and char_length(note) <= 200
  );

create policy "events_delete_all"
  on public.events for delete
  using (true);

-- 2. BẢNG APP_SETTINGS (CẤU HÌNH KHÓA TUẦN & TẠM DỪNG TỔ TRƯỞNG)
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

alter table public.app_settings enable row level security;

drop policy if exists "settings_select_all" on public.app_settings;
drop policy if exists "settings_upsert_all" on public.app_settings;

create policy "settings_select_all"
  on public.app_settings for select
  using (true);

create policy "settings_upsert_all"
  on public.app_settings for all
  using (true)
  with check (true);

-- Dòng cài đặt mặc định cho lớp 11A1
insert into public.app_settings (key, value, updated_at)
values (
  'class',
  '{"lockedWeeks":[],"leadersPaused":false}'::jsonb,
  (extract(epoch from now()) * 1000)::bigint
)
on conflict (key) do nothing;

-- 3. KÍCH HOẠT SUPABASE REALTIME CHO CẢ 2 BẢNG
do $$
begin
  alter publication supabase_realtime add table public.events;
exception
  when duplicate_object then null;
  when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.app_settings;
exception
  when duplicate_object then null;
  when others then null;
end $$;
