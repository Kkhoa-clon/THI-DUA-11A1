-- Chạy một lần trong Supabase SQL Editor để cho phép Admin và tổ trưởng ghi điểm
-- phong trào theo tổ. Ứng dụng giới hạn tổ trưởng vào tổ được gán theo PIN.
-- Các lượt ghi điểm cá nhân vẫn giới hạn ±50.

drop policy if exists "events_insert_valid" on public.events;

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
      )
      or (
        rule_id <> 'team-adjustment'
        and points >= -50
        and points <= 50
      )
    )
  );
