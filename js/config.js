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
export const COMPETITION_START = "2026-10-19";
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
      { id: "to1-01", name: "Nguyễn Văn A" },
      { id: "to1-02", name: "Trần Thị B" },
      { id: "to1-03", name: "Lê Văn C" },
      { id: "to1-04", name: "Phạm Thị D" },
      { id: "to1-05", name: "Hoàng Văn E" },
    ],
  },
  {
    id: "to2",
    name: "Tổ 2",
    members: [
      { id: "to2-01", name: "Vũ Thị F" },
      { id: "to2-02", name: "Đặng Văn G" },
      { id: "to2-03", name: "Bùi Thị H" },
      { id: "to2-04", name: "Đỗ Văn I" },
      { id: "to2-05", name: "Ngô Thị K" },
    ],
  },
  {
    id: "to3",
    name: "Tổ 3",
    members: [
      { id: "to3-01", name: "Dương Văn L" },
      { id: "to3-02", name: "Lý Thị M" },
      { id: "to3-03", name: "Hồ Văn N" },
      { id: "to3-04", name: "Mai Thị O" },
      { id: "to3-05", name: "Tô Văn P" },
    ],
  },
  {
    id: "to4",
    name: "Tổ 4",
    members: [
      { id: "to4-01", name: "Cao Văn Q" },
      { id: "to4-02", name: "Phan Thị R" },
      { id: "to4-03", name: "Trịnh Văn S" },
      { id: "to4-04", name: "Lâm Thị T" },
      { id: "to4-05", name: "Huỳnh Văn U" },
    ],
  },
];

/**
 * Mã tổ trưởng do bạn cấp (đổi bất cứ lúc nào).
 * Ví dụ: tổ 4 → "to4"
 */
export const LEADER_CODES = {
  to1: "to1",
  to2: "to2",
  to3: "to3",
  to4: "to4",
};

export const TEAM_BY_ID = Object.fromEntries(TEAMS.map((t) => [t.id, t]));

export const MEMBER_BY_ID = Object.fromEntries(
  TEAMS.flatMap((t) => t.members.map((m) => [m.id, { ...m, teamId: t.id }]))
);

export function resolveLeaderCode(raw) {
  const code = String(raw || "")
    .trim()
    .toLowerCase();
  if (!code) return null;
  for (const [teamId, expected] of Object.entries(LEADER_CODES)) {
    if (expected.toLowerCase() === code) return teamId;
  }
  return null;
}
