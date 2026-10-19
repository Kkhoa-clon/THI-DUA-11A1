-- Chạy 1 lần trong Supabase → SQL Editor → New query → Run
-- Tạo bảng điểm + quyền đọc/ghi + realtime

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

-- Xoá policy cũ nếu chạy lại script
drop policy if exists "events_select_all" on public.events;
drop policy if exists "events_insert_valid" on public.events;

-- Ai cũng xem được (minh bạch)
create policy "events_select_all"
  on public.events for select
  using (true);

-- Ai cũng thêm được nếu payload hợp lệ; không cho sửa/xoá
create policy "events_insert_valid"
  on public.events for insert
  with check (
    by_team_id = team_id
    and points >= -50
    and points <= 50
    and char_length(note) <= 200
  );

-- Bật realtime cho bảng events
alter publication supabase_realtime add table public.events;
