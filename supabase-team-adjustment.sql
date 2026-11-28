-- Chạy một lần trong Supabase SQL Editor để bật điểm phong trào cá nhân.
-- Cho phép số thập phân và lưu người thực hiện từng lượt.

drop policy if exists "events_insert_valid" on public.events;
alter table public.events alter column points type numeric(20,2) using points::numeric(20,2);
alter table public.events add column if not exists created_by_name text not null default '';

drop policy if exists "events_update_all" on public.events;

create policy "events_insert_valid"
  on public.events for insert
  with check (
    by_team_id = team_id
    and char_length(note) <= 200
    and (
      (
        rule_id = 'team-adjustment'
        and by_role in ('admin', 'leader')
        and by_team_id = team_id
        and points <> 0
      )
      or (
        rule_id <> 'team-adjustment'
        and points >= -50
        and points <= 50
      )
    )
  );

create policy "events_update_all"
  on public.events for update
  using (true)
  with check (true);
