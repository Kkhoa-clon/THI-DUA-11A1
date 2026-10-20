# Hướng dẫn · Bảng cờ luân lưu (tab "Thành tích cả năm")

Tính năng mới trong tab **Thành tích cả năm**: khu vực **🚩 Bảng cờ luân lưu** của **cả lớp**
(không gắn với cá nhân/tổ nào). Quản trị viên mở khóa → nhận cờ → kéo thả cờ lên bảng → ghi ngày đặt.

Không dùng thư viện ngoài. **Không dùng Supabase Auth.** "Khóa" Bảng cờ chỉ là chốt giao diện
kiểm tra **mật khẩu `ADMIN_CODE`** (định nghĩa trong `js/config.js`, cùng kiểu mã tổ trưởng mà app đã dùng).
Ghi/đọc qua **REST** thuần với **anon key** — tái dùng đúng cách project đang gọi Supabase (fetch REST, polling).

> ⚠️ Vì mật khẩu nằm trong `js/config.js` (ai xem được JS đều thấy), đây là **"khóa mềm"** — chỉ chặn người
> tình cờ bấm nút, KHÔNG chống được người cố tình. Frontend **không** có service_role key. Muốn khóa chặt hơn
> thì sau này bật Supabase Auth + RLS `authenticated`.

---

## 1. Chạy SQL tạo bảng `class_flags`

1. Vào [supabase.com](https://supabase.com) → chọn project của lớp.
2. **SQL Editor** → **New query**.
3. Dán toàn bộ nội dung file [`supabase-flags.sql`](supabase-flags.sql) → **Run**.

Bảng gồm: `id` (uuid), `flag_type` (chỉ nhận `co-1` / `co-2` / `co-3`), `placed_date` (date),
`note` (text, nullable), `created_at` (timestamptz). Row Level Security (giống bảng `events` của app):

- **SELECT**: `anon` + `authenticated` đọc được → cả lớp xem bảng cờ mà không cần đăng nhập.
- **INSERT / UPDATE / DELETE**: `anon` + `authenticated` ghi được, kèm ràng buộc giá trị
  (`flag_type` hợp lệ, `note` ≤ 200 ký tự). Việc "ai được ghi" do chốt `ADMIN_CODE` ở giao diện quyết định.

> Không cần tạo tài khoản nào trong Supabase Auth. Chỉ chạy file SQL là đủ.

---

## 2. Mật khẩu mở khóa

Mặc định `js/config.js` dùng:

```js
export const ADMIN_CODE = "khoa2112";
```

Đây là **một mã duy nhất** để mở Bảng cờ (nhập ở hộp thoại 🔒 Khóa, bước 4).
Muổi đổi mật khẩu: sửa giá trị `ADMIN_CODE` trong `js/config.js` rồi commit lại.
Không cần làm gì thêm trên Supabase.

---

## 3. Đặt ảnh cờ

1. Tạo thư mục (đã có sẵn): `images/flags/`
2. Đặt 3 ảnh vào đúng tên khai trong `js/config.js` → `FLAG_TYPES`:

   ```
   images/flags/co-1.png   → Cờ Nhất
   images/flags/co-2.png   → Cờ Nhì
   images/flags/co-3.png   → Cờ Ba
   ```

3. Muốn **đổi tên hiển thị / đường dẫn ảnh / thứ tự**: sửa `FLAG_TYPES` ở MỘT CHỖ duy nhất trong
   [`js/config.js`](js/config.js) (mục "—— BẢNG CỜ LUÂN LƯU ——").
   Nếu đổi **id** (`co-1`…), phải đổi cả giá trị `check (flag_type in (...))` trong `supabase-flags.sql` rồi chạy lại SQL.

> **Chưa có ảnh cũng chạy được**: app tự hiện placeholder (huy hiệu 🚩 nền sọc vàng).

---

## 4. Cách dùng / kiểm tra chức năng

**Chạy local:**

```bash
cd THI-DUA-11A1
npx --yes serve .
```

Mở URL (thường `http://localhost:3000`).

| Bước | Thao tác mong đợi |
|------|-------------------|
| 1 | Mở tab **Thành tích cả năm** → thấy khu vực **🚩 Bảng cờ luân lưu** (mặc định 🔒 Khóa) |
| 2 | Bấm **🔒 Khóa** → hộp thoại → nhập **mật khẩu** `ADMIN_CODE` (mặc định `khoa2112`, bước 2) → **Mở khóa** |
| 3 | Mật khẩu đúng → nút đổi thành **🔓 Mở khóa**, xuất hiện **+ Nhận cờ** |
| 4 | Bấm **+ Nhận cờ** → chọn 1 trong 3 loại cờ (ảnh + tên), chọn **Ngày đặt cờ** (mặc định hôm nay, hiển thị `dd/mm/yyyy`), ghi chú tùy chọn → **Xác nhận** |
| 5 | Lá cờ hiện ở khay **Cờ đang cầm** → **kéo** (chuột hoặc cảm ứng) thả vào bảng, hoặc bấm **Đặt lên bảng** |
| 6 | Thả thành công → cờ xuất hiện trên bảng kèm ngày, viền bảng sáng khi kéo tới, animation "cắm cờ" |
| 7 | Phía trên bảng: **thống kê** tổng + số lá mỗi loại. Có **bộ lọc** theo loại cờ và theo tháng. Sắp xếp: ngày mới nhất trước |
| 8 | Đang mở khóa → mỗi lá cờ có nút **✏️ sửa** (ngày/ghi chú) và **🗑️ xóa** (có xác nhận) |
| 9 | Bấm **🔓 Mở khóa** lần nữa → **khóa lại** (xóa trạng thái mở) |
| 10 | Tải lại trang → vẫn ở trạng thái **đã mở khóa** (cờ mở lưu trong `localStorage`) |

**Test trên điện thoại:** chạm–giữ con cờ ở khay rồi kéo lên bảng (Pointer Events + `touch-action:none`).

**Chế độ chỉ xem (read-only):** mở link bằng máy khác chưa nhập mật khẩu → chỉ **xem** cờ, không có nút Nhận/Đặt/Xóa/Sửa.

---

## 5. Xử lý lỗi thường gặp

| Thông báo | Nguyên nhân / cách sửa |
|-----------|------------------------|
| App đang **offline** (bảng vẫn hiện, lưu `localStorage`) | `js/config.js` chưa có `SUPABASE_URL`/`SUPABASE_ANON_KEY`. Offline luôn mở khóa, dùng trên 1 máy, không cần mật khẩu. |
| "Mật khẩu không đúng." | Nhập sai `ADMIN_CODE`. Kiểm tra giá trị `ADMIN_CODE` trong `js/config.js` (mặc định `khoa2112`). |
| "Cần mở khóa để đặt/sửa/xóa cờ." | Bảng đang 🔒 Khóa → bấm **🔒 Khóa**, nhập `ADMIN_CODE` rồi mới ghi. |
| "Không có quyền (RLS)…" / "Không lưu được: 401/403/404" | Chưa chạy `supabase-flags.sql`, hoặc policy chưa cho `anon` ghi → chạy lại file SQL. |
| "Chưa tải được bảng cờ" | Kiểm tra đã Run SQL + bật RLS; `Ctrl+F5` xoá cache. |

---

## 6. File đã thêm / sửa

**Mới:**
- `js/flags.js` — lớp dữ liệu + khóa mềm `ADMIN_CODE` cho cờ (ghi bằng anon key).
- `supabase-flags.sql` — tạo bảng + RLS (anon đọc/ghi, ràng buộc giá trị).
- `images/flags/` — thư mục ảnh cờ.
- `HUONG-DAN-BO-CO.md` — tài liệu này.

**Sửa (chỉ thêm, không đổi logic tab khác):**
- `js/config.js` — hằng số `FLAG_TYPES`, `FLAG_TYPE_BY_ID`.
- `js/app.js` — khu vực + kéo thả + modal trong tab Thành tích; gọi `flagStore.init()`.
- `index.html` — markup bảng cờ + 2 modal.
- `css/styles.css` — style khu vực cờ, dropzone, khay, animation, modal.
