/**
 * Cấu hình lớp 11A1 — sửa roster, mã tổ trưởng và Supabase tại đây.
 *
 * Supabase (miễn phí): https://supabase.com → New project
 * → SQL Editor chạy file supabase.sql → Settings → API → copy URL + anon key.
 * Để trống → chế độ offline (localStorage, chỉ 1 máy).
 */

export const CLASS_NAME = "11A1";
export const SCHOOL_YEAR = "2026–2027";

/**
 * Thứ Hai của Tuần 1 thi đua (YYYY-MM-DD).
 * App luôn có sẵn Tuần 1 → Tuần TOTAL_WEEKS (để trống, tự cập nhật điểm).
 * Đổi COMPETITION_START 1 lần khi chốt lịch; không đổi giữa chừng kẻo lệch số tuần.
 */
/** Tuần 1 = 14/09/2026 → hôm nay (19/10/2026) = Tuần 6 — tự chạy theo lịch */
export const COMPETITION_START = "2026-09-14";
export const TOTAL_WEEKS = 35;

/** Project URL dạng https://xxxx.supabase.co */
export const SUPABASE_URL = "https://dgiqqwbdvtziulmkutkl.supabase.co";

/** anon / public key (an toàn để dùng trên frontend với RLS) */
export const SUPABASE_ANON_KEY = "sb_publishable_CpSpqy_NyvPi4bvbJFdqcw_K_KL3O1B";

export const SUPABASE_ENABLED =
  typeof SUPABASE_URL === "string" &&
  SUPABASE_URL.startsWith("http") &&
  typeof SUPABASE_ANON_KEY === "string" &&
  SUPABASE_ANON_KEY.length > 20;

/**
 * Tổ + thành viên (placeholder — thay bằng danh sách thật).
 * id thành viên phải duy nhất toàn lớp.
 */
export const TEAMS = [
  {
    id: "to1",
    name: "Tổ 1",
    members: [
      { id: "to1-01", name: "Nguyễn Lâm Gia" },
      { id: "to1-02", name: "Nguyễn Đỗ Phúc Nguyên" },
      { id: "to1-03", name: "" },
      { id: "to1-04", name: "Lê Minh Toàn A" },
      { id: "to1-05", name: "Đinh Quang Vinh" },
      { id: "to1-06", name: "" },
      { id: "to1-07", name: "" },
      { id: "to1-08", name: "" },
      { id: "to1-09", name: "" },
      { id: "to1-10", name: "" },
      { id: "to1-11", name: "" }
    ],
  },
  {
    id: "to2",
    name: "Tổ 2",
    members: [
      { id: "to2-01", name: "" },
      { id: "to2-02", name: "" },
      { id: "to2-03", name: "" },
      { id: "to2-04", name: "" },
      { id: "to2-05", name: "" },
      { id: "to2-06", name: "" },
      { id: "to2-07", name: "" },
      { id: "to2-08", name: "" },
      { id: "to2-09", name: "" },
      { id: "to2-10", name: "" },
      { id: "to2-11", name: "" }
    ],
  },
  {
    id: "to3",
    name: "Tổ 3",
    members: [
      { id: "to3-01", name: "" },
      { id: "to3-02", name: "" },
      { id: "to3-03", name: "" },
      { id: "to3-04", name: "" },
      { id: "to3-05", name: "" },
      { id: "to3-06", name: "" },
      { id: "to3-07", name: "" },
      { id: "to3-08", name: "" },
      { id: "to3-09", name: "" },
      { id: "to3-10", name: "" },
      { id: "to3-11", name: "" }
    ],
  },
  {
    id: "to4",
    name: "Tổ 4",
    members: [
      { id: "to4-01", name: "Lê Trần Đại Ngọc" },
      { id: "to4-02", name: "Nguyễn Thị Kim Khánh" },
      { id: "to4-03", name: "Nguyễn Lê Sang" },
      { id: "to4-04", name: "Trương Vĩnh Các" },
      { id: "to4-05", name: "Lê Hoàng Minh Huy" },
      { id: "to4-06", name: "Bùi Bảo Duy Tân" },
      { id: "to4-07", name: "Nguyễn Đăng Khoa" },
      { id: "to4-08", name: "Nguyễn Minh Mẩn" },
      { id: "to4-09", name: "Lê Hữu Khánh" },
      { id: "to4-10", name: "Đỗ Nguyễn Đăng Khoa" },
      { id: "to4-11", name: "Văng Minh Thiện" }
    ],
  },
];

/**
 * Mã tổ trưởng do bạn cấp (đổi bất cứ lúc nào).
 * Ví dụ: tổ 4 → "to4"
 */
export const LEADER_CODES = {
  to1: "phucthinh",
  to2: "ngochan",
  to3: "baongoc",
  to4: "daingoc",
};

/** Mật khẩu admin — toàn quyền (mọi tổ, mọi tuần). Đổi được tại đây.
 *  Cũng dùng để "mở khóa" Bảng cờ luân lưu (khóa mềm, xem note trong js/flags.js). */
export const ADMIN_CODE = "khoa2112";

/**
 * —— BẢNG CỜ LUÂN LƯU ——
 * 3 loại cờ khai báo tại ĐÂY (một chỗ duy nhất) để dễ đổi tên/ảnh.
 * id cũng chính là giá trị lưu vào cột flag_type trên Supabase,
 * và là ràng buộc CHECK trong supabase-flags.sql — đổi id thì đổi cả SQL.
 * Ảnh đặt tại  images/flags/<file>.  Chưa có ảnh → app tự hiện placeholder.
 */
export const FLAG_TYPES = [
  { id: "co-1", name: "Cờ Nhất", image: "images/flags/co-1.png" },
  { id: "co-2", name: "Cờ Nhì", image: "images/flags/co-2.png" },
  { id: "co-3", name: "Cờ Ba", image: "images/flags/co-3.png" },
];

export const FLAG_TYPE_BY_ID = Object.fromEntries(FLAG_TYPES.map((f) => [f.id, f]));

export const TEAM_BY_ID = Object.fromEntries(TEAMS.map((t) => [t.id, t]));

export const MEMBER_BY_ID = Object.fromEntries(
  TEAMS.flatMap((t) => t.members.map((m) => [m.id, { ...m, teamId: t.id }]))
);

/**
 * @returns {{ role: "admin" } | { role: "leader", teamId: string } | null}
 */
export function resolveAuthCode(raw) {
  const code = String(raw || "")
    .trim()
    .toLowerCase();
  if (!code) return null;
  if (code === String(ADMIN_CODE).toLowerCase()) return { role: "admin" };
  for (const [teamId, expected] of Object.entries(LEADER_CODES)) {
    if (expected.toLowerCase() === code) return { role: "leader", teamId };
  }
  return null;
}

/** @deprecated dùng resolveAuthCode */
export function resolveLeaderCode(raw) {
  const auth = resolveAuthCode(raw);
  return auth?.role === "leader" ? auth.teamId : null;
}
