-- Chạy 1 lần trong Supabase → SQL Editor → New query → Run
-- (An toàn chạy lại — drop/create lại table + policy)
-- BẢNG CỜ LUÂN LƯU của cả lớp 11A1

create table if not exists public.class_flags (
  id uuid primary key default gen_random_uuid(),
  flag_type text not null
    constraint class_flags_flag_type_check
    check (flag_type in ('co-1', 'co-2', 'co-3')),   -- khớp FLAG_TYPES trong js/config.js
  placed_date date not null,                          -- ngày đặt cờ
  note text,                                          -- ghi chú / lý do (nullable)
  created_at timestamptz not null default now()
);

create index if not exists class_flags_placed_idx
  on public.class_flags (placed_date desc);

alter table public.class_flags enable row level security;

drop policy if exists "class_flags_select_all" on public.class_flags;
drop policy if exists "class_flags_insert_all" on public.class_flags;
drop policy if exists "class_flags_update_all" on public.class_flags;
drop policy if exists "class_flags_delete_all" on public.class_flags;
-- (xóa bản cũ nếu từng chạy phiên bản dùng Supabase Auth)
drop policy if exists "class_flags_insert_admin" on public.class_flags;
drop policy if exists "class_flags_update_admin" on public.class_flags;
drop policy if exists "class_flags_delete_admin" on public.class_flags;

-- AI CŨNG ĐỌC ĐƯỢC (kể cả anon / chưa đăng nhập) → cả lớp xem bảng cờ
create policy "class_flags_select_all"
  on public.class_flags for select
  to anon, authenticated
  using (true);

-- GHI BẰNG ANON KEY (giống bảng events của app). "Khóa" chỉ là chốt giao diện
-- kiểm tra ADMIN_CODE trong JS — ai xem được JS đều thấy mã, nên đây là "khóa mềm",
-- cùng mức an toàn với mã tổ trưởng. KHÔNG dùng Supabase Auth, KHÔNG có service_role key.
-- Still giữ ràng buộc giá trị (flag_type hợp lệ, note ngắn) ngay trong RLS.
create policy "class_flags_insert_all"
  on public.class_flags for insert
  to anon, authenticated
  with check (flag_type in ('co-1', 'co-2', 'co-3') and char_length(coalesce(note, '')) <= 200);

create policy "class_flags_update_all"
  on public.class_flags for update
  to anon, authenticated
  using (true)
  with check (flag_type in ('co-1', 'co-2', 'co-3') and char_length(coalesce(note, '')) <= 200);

create policy "class_flags_delete_all"
  on public.class_flags for delete
  to anon, authenticated
  using (true);

-- Bật realtime cho class_flags (bỏ qua nếu đã thêm rồi)
do $$
begin
  alter publication supabase_realtime add table public.class_flags;
exception
  when duplicate_object then null;
  when others then null;
end $$;
