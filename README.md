# 11A1 · Điểm thi đua

App bảng điểm thi đua lớp **11A1**: xếp hạng tổ realtime, xem từng tổ / thành viên (lịch sử cộng–trừ minh bạch), tổ trưởng nhập mã rồi chỉ cần chọn tên + loại lỗi/cộng — hệ thống tự trừ/cộng theo nội quy.

Triển khai trên **GitHub Pages** (file tĩnh) + **Supabase** (miễn phí, realtime, setup gọn hơn Firebase).

## Tính năng

- Bảng xếp hạng tổ theo tuần (mỗi bạn bắt đầu **100 điểm**)
- Chi tiết tổ → điểm & xếp loại (Tốt / Khá / Đạt / Chưa đạt) → lịch sử từng lần ghi
- Nút nhỏ **TT** (góc phải dưới): nhập mã tổ trưởng (vd `to4`) → ghi điểm tổ mình
- Catalog nội quy sẵn trong `js/rules.js` — không nhập tay số điểm

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
2. Đổi `LEADER_CODES` — mã bạn cấp cho từng tổ trưởng.
3. `COMPETITION_START` — thứ Hai của **Tuần 1** thi đua (vd `2026-10-19`). Hôm nay sẽ là Tuần 1, tuần sau Tuần 2… — không theo số tuần nhà trường.

## 2. Supabase (để nhiều máy cùng xem/ghi)

1. Đăng ký / đăng nhập [supabase.com](https://supabase.com) → **New project** (chọn Free).
2. Vào **SQL Editor** → New query → dán toàn bộ [`supabase.sql`](supabase.sql) → **Run**.
3. **Project Settings → API**:
   - Copy **Project URL** → dán vào `SUPABASE_URL` trong `js/config.js`
   - Copy **anon public** key → dán vào `SUPABASE_ANON_KEY`
4. Xong. Không cần tạo index thủ công, không cần file rules riêng.

Nếu dòng `alter publication ...` báo lỗi “already member”, bỏ qua — realtime đã bật.

## 3. Chạy thử local

```bash
npx --yes serve .
```

Mở URL hiện ra. Chưa điền Supabase → chế độ **offline** (localStorage, chỉ máy đó).

## 4. Deploy GitHub Pages

1. Đẩy repo lên GitHub.
2. **Settings → Pages → Source**: branch `main`, folder `/ (root)`.
3. Mở `https://<user>.github.io/<repo>/`.

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
