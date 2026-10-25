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
    members: [
      { id: "to1-01", name: "Nguyễn Lâm Gia" },
      { id: "to1-02", name: "Nguyễn Đỗ Phúc Nguyên" },
      { id: "to1-03", name: "Đinh Quang Vinh" },
      { id: "to1-04", name: "Lê Minh Toàn A" },
      { id: "to1-05", name: "Lê Thị Diễm Thanh" },
      { id: "to1-06", name: "Huỳnh Thị Kiều An" },
      { id: "to1-07", name: "Chung Võ Ái Linh" },
      { id: "to1-08", name: "Đỗ Ngọc Yến Nhi" },
      { id: "to1-09", name: "Nguyễn Thị Yến Ngọc" },
      { id: "to1-10", name: "Huỳnh Gia Hào" },
      { id: "to1-11", name: "Nguyễn Phúc Thịnh" }

    ],
  },
  {
    id: "to2",
    name: "Tổ 2",
    members: [
      { id: "to2-01", name: "Nguyễn Thị Như Ý" },
      { id: "to2-02", name: "Phan Nguyễn Phương Vi" },
      { id: "to2-03", name: "Ngô Hoàng Yến" },
      { id: "to2-04", name: "Nguyễn Thị Ngọc Tú" },
      { id: "to2-05", name: "Phạm Thanh Huy" },
      { id: "to2-06", name: "Phạm Ngọc Hân" },
      { id: "to2-07", name: "Nguyễn Thanh Sang" },
      { id: "to2-08", name: "Nguyễn Thị Ngọc Kim" },
      { id: "to2-09", name: "Lê Minh Toàn B" },
      { id: "to2-10", name: "Nguyễn Phú Trọng" },
      { id: "to2-11", name: "Thái Huỳnh Hương" },

    ],
  },
  {
    id: "to3",
    name: "Tổ 3",
    members: [
      { id: "to3-01", name: "Phan Trịnh Công Thành" },
      { id: "to3-02", name: "Nguyễn Anh Hào" },
      { id: "to3-03", name: "Lê Minh Quân" },
      { id: "to3-04", name: "Nguyễn Xuân Trường" },
      { id: "to3-05", name: "Lâm Trần Chí Hiếu" },
      { id: "to3-06", name: "Nguyễn Phú Quý" },
      { id: "to3-07", name: "Phan Tố Tố" },
      { id: "to3-08", name: "Trần Bảo Ngọc" },
      { id: "to3-09", name: "Trương Thành Tỷ" },
      { id: "to3-10", name: "Đặng Khánh Hưng" },
      { id: "to3-11", name: "Phạm Chí Hào" }
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

// Các mã này chỉ tạo nhãn nhận diện trên giao diện, không cấp quyền hệ thống.
export const ADMIN_MEMBER_IDS = ["to4-06", "to4-10"];

// Khi chuyển học sinh sang tổ khác, cập nhật TEAMS theo tổ mới và thêm bản ghi
// vào đây. effectiveWeek là tuần đầu tiên dùng tổ mới (ngày thứ Hai, YYYY-MM-DD).
// Giữ lại mọi lần chuyển trước đó để các tuần cũ dùng đúng roster lịch sử.
export const TEAM_MOVES = [];

export function teamsForWeek(weekId) {
  const weekTeams = TEAMS.map((team) => ({
    ...team,
    members: team.members.map((member) => ({ ...member })),
  }));
  const teamById = new Map(weekTeams.map((team) => [team.id, team]));
  const moves = [...TEAM_MOVES].sort((a, b) =>
    b.effectiveWeek.localeCompare(a.effectiveWeek)
  );

  for (const move of moves) {
    const effectiveDate = new Date(`${move.effectiveWeek}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(move.effectiveWeek) ||
      Number.isNaN(effectiveDate.getTime()) ||
      effectiveDate.getUTCDay() !== 1 ||
      move.fromTeamId === move.toTeamId
    ) {
      throw new Error(`Mốc chuyển tổ không hợp lệ cho học sinh ${move.memberId}.`);
    }

    if (weekId >= move.effectiveWeek) continue;

    const source = teamById.get(move.toTeamId);
    const destination = teamById.get(move.fromTeamId);
    const memberIndex = source?.members.findIndex(
      (member) => member.id === move.memberId
    );
    if (!source || !destination || memberIndex === undefined || memberIndex < 0) {
      throw new Error(
        `Lịch sử chuyển tổ không hợp lệ cho học sinh ${move.memberId}.`
      );
    }

    const [member] = source.members.splice(memberIndex, 1);
    destination.members.push(member);
  }

  return weekTeams;
}

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
export const ADMIN_CODES = ["khoa2112", "2112", "1100", "thaycan"];

/** ——— BẢNG CỜ LUÂN LƯU (js/flags.js) ——— */
/** Mật khẩu mở khóa bảng cờ (flags.js so sánh giá trị này). */
export const ADMIN_CODE = "khoa2112";

/** 3 loại cờ — id khớp ràng buộc CHECK cột flag_type trong supabase-flags.sql. */
export const FLAG_TYPES = [
  { id: "co-1", name: "Cờ Nhất", image: "image/luanluu1.png" },
  { id: "co-2", name: "Cờ Nhì", image: "image/luanluu2.png" },
  { id: "co-3", name: "Cờ Ba", image: "image/luanluu3.png" },
];

export const FLAG_TYPE_BY_ID = Object.fromEntries(FLAG_TYPES.map((f) => [f.id, f]));

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
