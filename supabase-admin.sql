-- Chạy 1 lần trong Supabase → SQL Editor (sau supabase.sql)
-- Bảng cấu hình admin: khóa tuần, tạm dừng tổ trưởng, …

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

-- Dòng mặc định (an toàn nếu đã có)
insert into public.app_settings (key, value, updated_at)
values (
  'class',
  '{"lockedWeeks":[],"leadersPaused":false}'::jsonb,
  (extract(epoch from now()) * 1000)::bigint
)
on conflict (key) do nothing;

-- Bật Realtime cho app_settings để đồng bộ tức thì trạng thái khóa sổ / tạm dừng
do $$
begin
  alter publication supabase_realtime add table public.app_settings;
exception
  when duplicate_object then null;
  when others then null;
end $$;
