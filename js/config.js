/**
 * Cấu hình Lớp 11A1 — Niên khóa 2026–2027
 * Giữ nguyên kết nối cơ sở dữ liệu Supabase và phân quyền tổ trưởng/admin.
 */

export const CLASS_NAME = "11A1";
export const SCHOOL_YEAR = "2026–2027";

/**
 * Thứ Hai của Tuần 1 thi đua (YYYY-MM-DD).
 * Tuần 1 = 07/09/2026 → Tự động tính số tuần theo lịch.
 */
export const COMPETITION_START = "2026-09-07";
export const TOTAL_WEEKS = 35;

/** Supabase Project Credentials */
export const SUPABASE_URL = "https://dgiqqwbdvtziulmkutkl.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_CpSpqy_NyvPi4bvbJFdqcw_K_KL3O1B";

export const SUPABASE_ENABLED =
  typeof SUPABASE_URL === "string" &&
  SUPABASE_URL.startsWith("http") &&
  typeof SUPABASE_ANON_KEY === "string" &&
  SUPABASE_ANON_KEY.length > 20;

/**
 * Danh sách 4 Tổ và thành viên Lớp 11A1 (44 học sinh)
 */
export const TEAMS = [
  {
    id: "to1",
    name: "Tổ 1",
    leaderName: "Nguyễn Phúc Thịnh",
    members: [
      { id: "to1-01", name: "Nguyễn Lâm Gia" },
      { id: "to1-02", name: "Nguyễn Đỗ Phúc Nguyên" },
      { id: "to1-03", name: "Nguyễn Phúc Thịnh" },
      { id: "to1-04", name: "Lê Minh Toàn A" },
      { id: "to1-05", name: "Đinh Quang Vinh" },
      { id: "to1-06", name: "Trần Anh Kiệt" },
      { id: "to1-07", name: "Lê Hoàng Phúc" },
      { id: "to1-08", name: "Phạm Gia Hưng" },
      { id: "to1-09", name: "Võ Minh Trí" },
      { id: "to1-10", name: "Hoàng Nhật Nam" },
      { id: "to1-11", name: "Đỗ Quốc Bảo" },
    ],
  },
  {
    id: "to2",
    name: "Tổ 2",
    leaderName: "Trần Ngọc Hân",
    members: [
      { id: "to2-01", name: "Trần Ngọc Hân" },
      { id: "to2-02", name: "Trần Minh Quang" },
      { id: "to2-03", name: "Lê Hoàng Nam" },
      { id: "to2-04", name: "Phạm Thảo Linh" },
      { id: "to2-05", name: "Nguyễn Bảo Long" },
      { id: "to2-06", name: "Đặng Thị Mai Anh" },
      { id: "to2-07", name: "Vũ Đức Anh" },
      { id: "to2-08", name: "Lê Hà Anh" },
      { id: "to2-09", name: "Nguyễn Gia Huy" },
      { id: "to2-10", name: "Phan Đình Trọng" },
      { id: "to2-11", name: "Bùi Tuyết Nhi" },
    ],
  },
  {
    id: "to3",
    name: "Tổ 3",
    leaderName: "Lê Bảo Ngọc",
    members: [
      { id: "to3-01", name: "Lê Bảo Ngọc" },
      { id: "to3-02", name: "Nguyễn Văn An" },
      { id: "to3-03", name: "Trương Hoàng Yến" },
      { id: "to3-04", name: "Lê Tuấn Kiệt" },
      { id: "to3-05", name: "Huỳnh Quốc Đạt" },
      { id: "to3-06", name: "Võ Thị Bích Trâm" },
      { id: "to3-07", name: "Dương Minh Khang" },
      { id: "to3-08", name: "Phạm Hải Đăng" },
      { id: "to3-09", name: "Ngô Kiến Huy" },
      { id: "to3-10", name: "Tạ Quang Bửu" },
      { id: "to3-11", name: "Lâm Mỹ Duyên" },
    ],
  },
  {
    id: "to4",
    name: "Tổ 4",
    leaderName: "Lê Trần Đại Ngọc",
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
      { id: "to4-11", name: "Văng Minh Thiện" },
    ],
  },
];

/**
 * =========================================================================
 * MÃ ĐĂNG NHẬP & PIN TỔ TRƯỞNG (BẢO MẬT NỘI BỘ - KHÔNG CÔNG KHAI TRÊN WEB)
 * =========================================================================
 * Bạn tự đọc và đổi mã đăng nhập / PIN 4 số tại đây:
 * - Tổ 1 (Nguyễn Phúc Thịnh):  "phucthinh"  hoặc PIN  "1101"
 * - Tổ 2 (Trần Ngọc Hân):      "ngochan"    hoặc PIN  "1102"
 * - Tổ 3 (Lê Bảo Ngọc):        "baongoc"    hoặc PIN  "1103"
 * - Tổ 4 (Lê Trần Đại Ngọc):   "daingoc"    hoặc PIN  "1104"
 */
export const LEADER_CODES = {
  to1: ["phucthinh", "1101"],
  to2: ["ngochan", "1102"],
  to3: ["baongoc", "1103"],
  to4: ["daingoc", "1104"],
};

/**
 * MẬT KHẨU ADMIN GVCN (QUẢN TRỊ VIÊN LỚP 11A1 - TOÀN QUYỀN)
 * - Mật khẩu:  "khoa2112"
 * - PIN nhanh: "2112" hoặc "1100"
 */
export const ADMIN_CODES = ["khoa2112", "2112", "1100"];

export const TEAM_BY_ID = Object.fromEntries(TEAMS.map((t) => [t.id, t]));

export const MEMBER_BY_ID = Object.fromEntries(
  TEAMS.flatMap((t) => t.members.map((m) => [m.id, { ...m, teamId: t.id }]))
);

/**
 * Xác thực mã đăng nhập hoặc PIN nhanh
 * @param {string} raw
 * @returns {{ role: "admin" } | { role: "leader", teamId: string, leaderName: string } | null}
 */
export function resolveAuthCode(raw) {
  const code = String(raw || "")
    .trim()
    .toLowerCase();
  if (!code) return null;

  if (ADMIN_CODES.map((c) => c.toLowerCase()).includes(code)) {
    return { role: "admin" };
  }

  for (const [teamId, list] of Object.entries(LEADER_CODES)) {
    const matched = list.some((c) => c.toLowerCase() === code);
    if (matched) {
      const leaderName = TEAM_BY_ID[teamId]?.leaderName || TEAM_BY_ID[teamId]?.name;
      return { role: "leader", teamId, leaderName };
    }
  }

  return null;
}

/**
 * Thuật toán 4: Chuẩn hóa tiếng Việt không dấu siêu tốc để tìm kiếm
 */
export function toNonAccentVietnamese(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim();
}
