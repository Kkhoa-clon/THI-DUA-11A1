-- Chạy NGAY trong Supabase → SQL Editor → Run
-- Bật xoá hẳn event (admin / tổ trưởng). Không chạy thì nút Xoá không có tác dụng.

drop policy if exists "events_delete_all" on public.events;

create policy "events_delete_all"
  on public.events for delete
  using (true);
