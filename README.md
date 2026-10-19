# 11A1 · Điểm thi đua

App bảng điểm thi đua lớp **11A1**: xếp hạng tổ realtime, xem từng tổ / thành viên (lịch sử cộng–trừ minh bạch), tổ trưởng nhập mã rồi chỉ cần chọn tên + loại lỗi/cộng — hệ thống tự trừ/cộng theo nội quy.

Triển khai trên **GitHub Pages** (file tĩnh) + **Supabase** (miễn phí, realtime, setup gọn hơn Firebase).

## Tính năng

- Tuần chạy theo lịch thật (Tuần 1…35); **BXH năm chỉ tính tuần đã học** (vd hôm nay = Tuần 6 → tính T1→T6)
- **Tổ (tuần)** · **Cá nhân cả năm** · **Vi phạm** · **Điểm cộng**
- Vào tổ: thành viên xếp điểm cao → thấp; bấm tên xem lịch sử tuần
- Bấm tên trên BXH cá nhân/vi phạm/cộng → chi tiết: loại nào, tuần mấy, bao nhiêu lần
- Nút **TT**: tổ trưởng nhập mã → chọn tên + loại → hệ thống tự ± điểm

## Cấu trúc

```
index.html
css/styles.css
js/config.js      ← roster, mã tổ trưởng, Supabase URL + key
js/rules.js       ← catalog cộng/trừ
js/store.js       ← Supabase / offline
js/app.js
supabase.sql      ← chạy 1 lần trên Supabase
noi-quy.md
```

## 1. Điền danh sách lớp & mã

Mở [`js/config.js`](js/config.js):

1. Sửa `TEAMS` — tên tổ và thành viên (`id` phải duy nhất).
2. Đổi `LEADER_CODES` — mã tổ trưởng; `ADMIN_CODE` (mặc định `khoa`) — toàn quyền mọi tổ/mọi tuần.
3. Tổ trưởng **chỉ ghi/xoá tuần hiện tại**; tuần đã qua bị khoá (chỉ admin sửa được).
4. `COMPETITION_START` — thứ Hai của **Tuần 1**. App có sẵn **Tuần 1 → 35**.

## 2. Supabase (để nhiều máy cùng xem/ghi)

1. Đăng ký / đăng nhập [supabase.com](https://supabase.com) → **New project** (chọn Free).
2. Vào **SQL Editor** → New query → dán toàn bộ [`supabase.sql`](supabase.sql) → **Run**.
   - **Bắt buộc để nút Xoá hoạt động:** chạy [`supabase-enable-delete.sql`](supabase-enable-delete.sql) (hoặc cả `supabase.sql`). Nếu chưa chạy, xoá sẽ báo lỗi và tổng kết vẫn còn bản ghi.
3. **Project Settings → API**:
   - Copy **Project URL** → dán vào `SUPABASE_URL` trong `js/config.js`
   - Copy **anon public** key → dán vào `SUPABASE_ANON_KEY`
4. Xong.

Nếu dòng realtime báo lỗi “already member”, bỏ qua.

## 3. Chạy thử local

```bash
npx --yes serve .
```

Mở URL hiện ra. Chưa điền Supabase → chế độ **offline** (localStorage, chỉ máy đó).

## 4. Deploy GitHub Pages

1. Đẩy **toàn bộ** file lên GitHub (`git add .` rồi commit + push).
2. **Settings → Pages → Source**: branch `main`, folder `/ (root)`.
3. Mở đúng link có dấu `/` cuối: `https://<user>.github.io/<repo>/`
4. Nếu giao diện “đơ”: **Ctrl+F5** (xoá cache). App không cần CDN — gọi Supabase REST trực tiếp.

## Cách dùng hàng ngày

| Ai | Làm gì |
|----|--------|
| Cả lớp | Mở link → xem BXH → bấm tổ → bấm tên xem lịch sử |
| Tổ trưởng | Nút **TT** → nhập mã → chọn thành viên + loại → **Xác nhận** |
| Bạn (admin) | Đổi roster/mã trong `config.js`, commit & push |

## Lưu ý bảo mật

Mã tổ trưởng nằm trong `config.js` (DevTools có thể thấy) — đủ dùng nội bộ lớp. RLS trên Supabase: ai cũng đọc; chỉ được **thêm** event hợp lệ; không sửa/xoá.

## Tuỳ chỉnh sau

- Tự động −50 khi vi phạm 2 lỗi giống nhau liên tiếp 2 tuần
- Form BCS ghi điểm phong trào cá nhân
- Xoá / hoàn tác event (cần policy admin riêng)
