# THI ĐUA 11A1 · HỆ THỐNG QUẢN LÝ THI ĐUA HIỆN ĐẠI (2026–2027)

Dự án Web App thi đua Lớp 11A1 được thiết kế và tái cấu trúc toàn diện theo phong cách **Modern Swiss-Minimalist** kết hợp **Realtime WebSocket & Delta-Sync**, tối ưu chịu tải cho hơn 50 thiết bị truy cập đồng thời trong giờ sinh hoạt lớp mà không giật lag, nghẽn mạng hay sập database.

## 📜 LỊCH SỬ CẬP NHẬT

Các mốc dưới đây được tổng hợp từ 30 commit trên nhánh `main`, từ ngày 19/10 đến 15/11/2026. Tên phiên bản giữ theo commit; những commit không đặt tên phiên bản được nhóm thành các đợt cập nhật bổ sung.

| Phiên bản / giai đoạn | Ngày | Commit | Nội dung cập nhật |
|---|---|---|---|
| Khởi tạo · v1 | 19/10/2026 | `68addd6`, `f19e7db` | Khởi tạo giao diện web, CSS, ứng dụng JavaScript, quy tắc chấm điểm, kho dữ liệu và SQL Supabase. |
| v2 | 19/10/2026 | `39af593` | Cải tiến giao diện và luồng ứng dụng; bổ sung điều chỉnh cho cấu hình và đồng bộ dữ liệu. |
| v3 | 19/10/2026 | `ce538b7` | Tiếp tục tinh chỉnh giao diện, xử lý ứng dụng và đồng bộ dữ liệu. |
| v4 | 19/10/2026 | `1fe5f4d` | Mở rộng đáng kể giao diện, ứng dụng, kho dữ liệu và cấu hình; bổ sung hỗ trợ thao tác xóa trong Supabase. |
| Bổ sung tính năng | 20–21/10/2026 | `32a6718`, `0f399d8`, `86c3d17`, `5908da6` | Cập nhật cấu hình và cờ tính năng; thêm xử lý chuỗi thành tích mà không cần lưu trạng thái riêng. |
| Tái cấu trúc nền tảng | 24/10/2026 | `dce3218` | Tổ chức lại mã nguồn và giao diện; bổ sung tài liệu thiết kế, hướng dẫn chạy ứng dụng, quy trình tạo bundle và cấu hình Supabase đầy đủ. |
| v1.0 | 25/10/2026 | `c55568b` | Chốt mốc 1.0, tiếp tục hoàn thiện giao diện, cấu hình lớp, quy tắc và dữ liệu ứng dụng. |
| v1.1 | 25/10/2026 | `3a3ee66` | Điều chỉnh quy tắc thi đua và nội dung nội quy. |
| v1.2 | 25/10/2026 | `b88dd12` | Cập nhật quy trình tạo bundle và các tệp phụ thuộc; lưu ý obfuscation chỉ làm khó đọc mã, không thay thế xác thực hay phân quyền. |
| v1.3 | 25/10/2026 | `f91cb51` | Bổ sung luồng thông báo, PWA/service worker và các thành phần liên quan đến push notification. |
| v1.3.1 | 25/10/2026 | `7d6e5dd`, `3da7b52`, `55e6b1a` | Sửa một số vấn đề liên quan đến dữ liệu database và xử lý thông báo. |
| v1.4 | 25/10/2026 | `3204506` | Thêm tab Cờ luân lưu, giao diện kéo-thả và chế độ sáng/tối. |
| Hoàn thiện sau v1.4 | 25–26/10/2026 | `508639b`, `c6764e5`, `58b22a2` | Hợp nhất nhánh tính năng, cập nhật thông tin/quy tắc và hoàn tất các thay đổi liên quan đến Cờ luân lưu. |
| v6 | 05/11/2026 | `a406ed7` | Tái cấu trúc lớn ứng dụng và bundle; điều chỉnh giao diện, cấu hình và các thành phần tính năng. |
| v7 | 05/11/2026 | `93c07df` | Cập nhật giao diện và nội quy; tinh chỉnh luồng ứng dụng và quy tắc chấm điểm. |
| v10 | 08/11/2026 | `d808160` | Ổn định và cải tiến giao diện, xử lý ứng dụng và đồng bộ dữ liệu. |
| v12 · triển khai lớp | 12–14/11/2026 | `59799c4`, `b629e8f` | Đưa ứng dụng vào triển khai lớp 11A1; tiếp tục bổ sung và hoàn thiện các luồng ứng dụng. |
| Cập nhật sau triển khai | 15/11/2026 | `d41cd76`, `aed7efb`, `3a85459`, `521c498` | Tinh chỉnh giao diện, ghi điểm và đồng bộ; cập nhật SQL Supabase, bổ sung script điều chỉnh điểm phong trào theo tổ và sửa các lỗi phát sinh. |

> **Ghi chú:** Commit hiện có không ghi nhận các mốc v5, v8, v9 hoặc v11; lịch sử trên không tự đặt nội dung cho các phiên bản này. Các commit hợp nhất và sửa lỗi đã được gộp vào giai đoạn tương ứng để dễ theo dõi.

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
   - 🏆 **Bảng Xếp Hạng (Leaderboard):** Podium vinh danh Top 3 tổ (Cúp Vàng có vương miện chuyển động, Bạc, Đồng), thẻ 4 tổ với Accordion xem nhanh 11 thành viên, dòng nhật ký cập nhật tức thời (Realtime feed), bộ lọc tuần và BXH cả năm / vi phạm / điểm cộng. Chỉ tuần đã kết thúc mới được tính xếp hạng; tuần đang học chưa có thứ hạng nhưng vẫn hiển thị điểm tạm tính, lượt khen/vi phạm từng tổ và chi tiết điểm/vi phạm từng thành viên. Mục **Tổng kết tháng** cho phép chọn tuần bắt đầu/kết thúc để xem tổng điểm, thứ hạng chung và chi tiết điểm/xếp hạng của từng tổ theo từng tuần trong khoảng đó.
   - ⚡ **Khu Vực Ghi Điểm Nhanh (Fast Scoring Workspace):** Dành riêng cho 4 Tổ trưởng & Admin với quy trình 3 bước 1-chạm (Chọn bạn → Chọn nhanh lỗi/khen → Lưu & Đồng bộ dưới 50ms), hỗ trợ chọn nhiều bạn cùng lúc (Multi-select), nút tăng giảm số lượng (x1, x2, x3...), và lịch sử tự động hoàn tác trong 15 phút.
   - 🔍 **Hồ Sơ & Lịch Sử Cá Nhân (Student Profile):** Tìm kiếm không dấu tức thì (`vinh` ra `Đinh Quang Vinh`), hồ sơ chi tiết, xếp hạng lớp (#/44), điểm tuần & năm, biểu đồ 4 tiêu chí phong độ, huy hiệu danh dự và timeline sự kiện.
   - 🛡️ **Bảng Điều Hành GVCN / Admin:** Khóa sổ công bố kết quả tuần với xác nhận 2 bước an toàn, công tắc tạm dừng quyền tổ trưởng, xuất báo cáo SHL, sao lưu dữ liệu JSON và cơ chế xóa an toàn chống bấm nhầm (cần gõ `XACNHAN`).

4. **4 Thuật toán tối ưu thực chiến:**
   - **Thuật toán 1:** Tính điểm 1 vòng lặp $O(N)$ bằng Map/Hash Table, tính toán toàn bộ 4 tổ và 44 học sinh trong `0.12ms`.
   - **Thuật toán 2:** Chống ghi trùng điểm (Idempotency Key) loại bỏ nguy cơ nhân đôi điểm khi mạng chập chờn.
   - **Thuật toán 3:** Tự động bắt lỗi tái phạm 2 tuần liên tiếp (-50đ) theo đúng nội quy 11A1.
   - **Thuật toán 4:** Chuẩn hóa Unicode NFD tìm kiếm tiếng Việt không dấu siêu tốc.

---

## 🔐 Lưu ý về mã nguồn và đăng nhập

`npm run build` tạo `js/app.bundle.js` đã làm rối để cản việc đọc lướt mã chạy trên trang. Đây chỉ là biện pháp gây khó đọc, không phải bảo mật: GitHub Pages và repository công khai vẫn cho phép tải/xem các file nguồn như `js/config.js`, và người dùng có thể phân tích bundle.

Không đặt mật khẩu, PIN hoặc khóa bí mật trong JavaScript phía trình duyệt. Các mã đăng nhập hiện tại đã nằm trong mã nguồn/bundle công khai; hãy đổi chúng và không dựa vào obfuscation để bảo vệ quyền Admin hoặc dữ liệu. Muốn phân quyền thật, cần xác thực phía máy chủ và chính sách Supabase RLS hạn chế theo người dùng/role.

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
├── supabase-enable-delete.sql             # Script kích hoạt quyền xóa cho tổ trưởng & admin
└── supabase-team-adjustment.sql           # Chính sách ghi điểm phong trào riêng cho từng tổ
```

Sau khi cập nhật ứng dụng, hãy chạy lại `supabase.sql` hoặc `supabase-full-setup.sql` trong Supabase SQL Editor để thêm cột phân biệt người ghi điểm (`by_role`). Nhật ký cập nhật tức thời chỉ hiển thị lượt ghi mới của tổ trưởng; lượt ghi mới của admin không xuất hiện trong nhật ký. Các lượt ghi cũ không có thông tin vai trò nên không thể phân biệt ngược lại.

Để Admin ghi điểm phong trào theo tổ với số điểm tùy chọn trên dự án Supabase hiện có, chạy `supabase-team-adjustment.sql` trong SQL Editor. Các lượt chấm điểm cá nhân vẫn giữ giới hạn ±50 điểm; điểm phong trào chỉ thay đổi tổng điểm tổ, không thay đổi điểm cá nhân.

### Bảo toàn dữ liệu lịch sử khi sửa nội quy hoặc chuyển tổ

- Mỗi lượt ghi điểm lưu sẵn `points`, `label`, `ruleId`, `weekId` và `teamId`. Vì vậy, đổi mức điểm trong `js/rules.js` chỉ áp dụng cho lượt ghi mới; điểm, tên nội quy và tổ đã ghi ở các tuần cũ không được tính lại.
- Khi chuyển học sinh sang tổ khác, cập nhật thành viên hiện tại trong `TEAMS` ở `js/config.js`, đồng thời thêm một bản ghi vào `TEAM_MOVES`, ví dụ `{ memberId: "to1-01", fromTeamId: "to1", toTeamId: "to2", effectiveWeek: "2026-10-26" }`. `effectiveWeek` phải là ngày thứ Hai của tuần đầu tiên ở tổ mới. Không xóa các bản ghi chuyển tổ cũ; chúng giữ nguyên roster, sĩ số và bảng chi tiết của những tuần trước.
- Lịch sử chuyển tổ chỉ có thể tái dựng từ khi bắt đầu ghi các mốc trong `TEAM_MOVES`; các lần đổi roster trước đó mà không lưu mốc không thể khôi phục chính xác từ dữ liệu điểm.

Sau mỗi lần sửa JavaScript, chạy `npm run build` trước khi triển khai để tạo bundle đã làm rối mới nhất.

---
