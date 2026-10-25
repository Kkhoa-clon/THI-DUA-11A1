-- Chạy 1 lần trong Supabase → SQL Editor → New query → Run
-- (Có thể chạy lại an toàn — sẽ drop/create lại policy)

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
  by_role text not null default 'leader' check (by_role in ('admin', 'leader')),
  created_at bigint not null
);

alter table public.events
  add column if not exists by_role text not null default 'leader'
  check (by_role in ('admin', 'leader'));

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
    by_team_id = team_id
    and points >= -50
    and points <= 50
    and char_length(note) <= 200
  );

-- Cho phép xoá (app chỉ hiện nút xoá cho tổ trưởng đúng tổ)
create policy "events_delete_all"
  on public.events for delete
  using (true);

-- Bật realtime (nếu đã add rồi có thể báo lỗi — bỏ qua)
do $$
begin
  alter publication supabase_realtime add table public.events;
exception
  when duplicate_object then null;
  when others then null;
end $$;
