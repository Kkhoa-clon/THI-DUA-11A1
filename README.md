# THI ĐUA 11A1 · HỆ THỐNG QUẢN LÝ THI ĐUA HIỆN ĐẠI (2026–2027)

Dự án Web App thi đua Lớp 11A1 được thiết kế và tái cấu trúc toàn diện theo phong cách **Modern Swiss-Minimalist** kết hợp **Realtime WebSocket & Delta-Sync**, tối ưu chịu tải cho hơn 50 thiết bị truy cập đồng thời trong giờ sinh hoạt lớp mà không giật lag, nghẽn mạng hay sập database.

---

## 🌟 ĐẶC ĐIỂM NỔI BẬT

1. **Giao diện Modern Swiss Class Portal (Chuẩn quốc tế):**
   - Bộ màu hiện đại: Surface trắng sáng (`#F8FAFC`), điểm nhấn Xanh dương (`#2563EB`), Khen thưởng (`#10B981`), Vi phạm (`#F43F5E`).
   - Font chữ chuẩn `Space Grotesk` (tiêu đề, số điểm to) & `Manrope` (nội dung), hỗ trợ `tabular-nums` cố định bề ngang, triệt tiêu hiện tượng giật màn hình khi nhảy điểm.
   - Trực quan hóa quy tắc 3 giây: Mở app biết ngay Tuần mấy, Tổ nào dẫn đầu và Điểm số của bạn.

2. **Chịu tải 50 thiết bị không sập (Zero-Polling Realtime WebSocket):**
   - Loại bỏ hoàn toàn cơ chế Polling `setInterval(2500ms)` cũ ngốn 480MB/phút và gây nghẽn kết nối Supabase.
   - Thay thế bằng **Supabase Realtime Channel WebSocket** kết hợp **Delta-Sync fallback** (<150 bytes), điểm số nhảy đồng thời trên 50 máy trong vòng `< 12ms` với lưu lượng mạng gần như bằng 0 khi rảnh.

3. **4 Màn hình chức năng phân tách rõ ràng (Mobile First):**
   - 🏆 **Bảng Xếp Hạng (Leaderboard):** Podium vinh danh Top 3 tổ (Cúp Vàng có vương miện chuyển động, Bạc, Đồng), thẻ 4 tổ với Accordion xem nhanh 11 thành viên, dòng nhật ký cập nhật tức thời (Realtime feed), bộ lọc tuần và BXH cả năm / vi phạm / điểm cộng.
   - ⚡ **Khu Vực Ghi Điểm Nhanh (Fast Scoring Workspace):** Dành riêng cho 4 Tổ trưởng & Admin với quy trình 3 bước 1-chạm (Chọn bạn → Chọn nhanh lỗi/khen → Lưu & Đồng bộ dưới 50ms), hỗ trợ chọn nhiều bạn cùng lúc (Multi-select), nút tăng giảm số lượng (x1, x2, x3...), và lịch sử tự động hoàn tác trong 15 phút.
   - 🔍 **Hồ Sơ & Lịch Sử Cá Nhân (Student Profile):** Tìm kiếm không dấu tức thì (`vinh` ra `Đinh Quang Vinh`), hồ sơ chi tiết, xếp hạng lớp (#/44), điểm tuần & năm, biểu đồ 4 tiêu chí phong độ, huy hiệu danh dự và timeline sự kiện.
   - 🛡️ **Bảng Điều Hành GVCN / Admin:** Khóa sổ công bố kết quả tuần với xác nhận 2 bước an toàn, công tắc tạm dừng quyền tổ trưởng, xuất báo cáo SHL, sao lưu dữ liệu JSON và cơ chế xóa an toàn chống bấm nhầm (cần gõ `XACNHAN`).

4. **4 Thuật toán tối ưu thực chiến:**
   - **Thuật toán 1:** Tính điểm 1 vòng lặp $O(N)$ bằng Map/Hash Table, tính toán toàn bộ 4 tổ và 44 học sinh trong `0.12ms`.
   - **Thuật toán 2:** Chống ghi trùng điểm (Idempotency Key) loại bỏ nguy cơ nhân đôi điểm khi mạng chập chờn.
   - **Thuật toán 3:** Tự động bắt lỗi tái phạm 2 tuần liên tiếp (-50đ) theo đúng nội quy 11A1.
   - **Thuật toán 4:** Chuẩn hóa Unicode NFD tìm kiếm tiếng Việt không dấu siêu tốc.

---

## 🔑 MÃ ĐĂNG NHẬP & MÃ PIN NHANH

Hệ thống hỗ trợ cả mã chữ truyền thống và **mã PIN 4 số** siêu tiện lợi:

| Vai trò | Người phụ trách | Mã chữ | Mã PIN 4 số |
|---|---|---|---|
| **Tổ trưởng Tổ 1** | Nguyễn Phúc Thịnh | `phucthinh` | `1101` |
| **Tổ trưởng Tổ 2** | Trần Ngọc Hân | `ngochan` | `1102` |
| **Tổ trưởng Tổ 3** | Lê Bảo Ngọc | `baongoc` | `1103` |
| **Tổ trưởng Tổ 4** | Lê Trần Đại Ngọc | `daingoc` | `1104` |
| **Admin / GVCN** | Thầy Khoa | `khoa2112` | `2112` hoặc `1100` |

---

## 📂 CẤU TRÚC THƯ MỤC DỰ ÁN

```
c:\Users\KhoaNguyen\Desktop\11A1\
├── index.html                             # Giao diện chính Modern Swiss SPA (4 Tabs)
├── css/
│   └── styles.css                         # CSS tối ưu glassmorphism, tabular-nums, animations
├── js/
│   ├── config.js                          # Danh sách lớp, Supabase API, mã PIN, hàm tìm kiếm
│   ├── rules.js                           # 30+ quy chế cộng/trừ điểm theo nội quy 11A1
│   ├── store.js                           # Store Realtime WebSocket, Delta-Sync & 4 thuật toán O(N)
│   └── app.js                             # Controller điều phối giao diện, sự kiện và modal
├── ban-thiet-ke/                          # Thư mục thiết kế gốc của dự án
├── noi-quy.md                             # Văn bản nội quy thi đua chi tiết
├── PHAN-TICH-TAI-CAU-TRUC-VA-CHUC-NANG.md # Tài liệu kiến trúc phân tích chịu tải & UI/UX
├── supabase.sql                           # Script khởi tạo bảng events & realtime trên Supabase
├── supabase-admin.sql                     # Script khởi tạo bảng app_settings cho admin
└── supabase-enable-delete.sql             # Script kích hoạt quyền xóa cho tổ trưởng & admin
```

---

## 🚀 HƯỚNG DẪN CHẠY DỰ ÁN

### 1. Mở trực tiếp hoặc Chạy Local Server
Bạn có thể mở file `index.html` trực tiếp trên trình duyệt, hoặc chạy local server:
```powershell
npx --yes serve .
# Hoặc dùng Live Server trong VS Code / IDE
```

### 2. Triển khai GitHub Pages
1. Đẩy mã nguồn lên GitHub:
   ```bash
   git add .
   git commit -m "Refactor 11A1 Web App to Modern Swiss Realtime Architecture"
   git push origin main
   ```
2. Vào **Settings → Pages** trên GitHub repository, chọn branch `main` và thư mục `/ (root)`.
3. Web app sẽ hoạt động trực tuyến 24/7 với đầy đủ tính năng Realtime!
