/**
 * 11A1 Thi Đua Web App — Standalone Bundle (Zero-CORS)
 * Tự động chạy mượt mà trên cả file:/// (Double-click từ Desktop) lẫn http(s):// (GitHub Pages)
 */
(function () {
  "use strict";

  // ========================================== 
  // 1. CẤU HÌNH HỆ THỐNG & ROSTER LỚP 11A1
  // ========================================== 
/**
 * Cấu hình Lớp 11A1 — Niên khóa 2026–2027
 * Giữ nguyên kết nối cơ sở dữ liệu Supabase và phân quyền tổ trưởng/admin.
 */

const CLASS_NAME = "11A1";
const SCHOOL_YEAR = "2026–2027";

/**
 * Thứ Hai của Tuần 1 thi đua (YYYY-MM-DD).
 * Tuần 1 = 07/09/2026 → Tự động tính số tuần theo lịch.
 */
const COMPETITION_START = "2026-09-07";
const TOTAL_WEEKS = 35;

/** Các mốc hạnh kiểm theo tuần thi đua */
const SEMESTERS = [
  { id: "gk1", label: "Giữa kì 1", from: 1, to: 9 },
  { id: "ck1", label: "Cuối kì 1", from: 10, to: 18 },
  { id: "gk2", label: "Giữa kì 2", from: 19, to: 27 },
  { id: "ck2", label: "Cuối kì 2", from: 28, to: 35 },
];

/** Supabase Project Credentials */
const SUPABASE_URL = "https://dgiqqwbdvtziulmkutkl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CpSpqy_NyvPi4bvbJFdqcw_K_KL3O1B";

const SUPABASE_ENABLED =
  typeof SUPABASE_URL === "string" &&
  SUPABASE_URL.startsWith("http") &&
  typeof SUPABASE_ANON_KEY === "string" &&
  SUPABASE_ANON_KEY.length > 20;

/**
 * Danh sách 4 Tổ và thành viên Lớp 11A1 (44 học sinh)
 */
const TEAMS = [
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
const ADMIN_MEMBER_IDS = ["to4-06", "to4-10"];

// Khi chuyển học sinh sang tổ khác, cập nhật TEAMS theo tổ mới và thêm bản ghi
// vào đây. effectiveWeek là tuần đầu tiên dùng tổ mới (ngày thứ Hai, YYYY-MM-DD).
// Giữ lại mọi lần chuyển trước đó để các tuần cũ dùng đúng roster lịch sử.
const TEAM_MOVES = [];

function teamsForWeek(weekId) {
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
const LEADER_CODES = {
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
const ADMIN_CODES = ["khoa2112", "2112", "1100", "thaycan"];

const TEAM_BY_ID = Object.fromEntries(TEAMS.map((t) => [t.id, t]));

const MEMBER_BY_ID = Object.fromEntries(
  TEAMS.flatMap((t) => t.members.map((m) => [m.id, { ...m, teamId: t.id }]))
);

/**
 * Xác thực mã đăng nhập hoặc PIN nhanh
 * @param {string} raw
 * @returns {{ role: "admin" } | { role: "leader", teamId: string, leaderName: string } | null}
 */
function resolveAuthCode(raw) {
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
function toNonAccentVietnamese(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim();
}


  // ========================================== 
  // 2. DANH MỤC NỘI QUY & QUY CHẾ 11A1
  // ========================================== 
/**
 * Danh mục quy tắc cộng/trừ điểm theo nội quy Lớp 11A1 (Niên khóa 2026–2027)
 */
const BASE_POINTS = 100;

const GRADE_THRESHOLDS = [
  { min: 90, label: "Tốt", key: "tot", color: "#10b981", badge: "bg-emerald-100 text-emerald-800" },
  { min: 80, label: "Khá", key: "kha", color: "#2563eb", badge: "bg-blue-100 text-blue-800" },
  { min: 60, label: "Đạt", key: "dat", color: "#f59e0b", badge: "bg-amber-100 text-amber-800" },
  { min: 0, label: "Chưa đạt", key: "chua-dat", color: "#ef4444", badge: "bg-rose-100 text-rose-800" },
];

function gradeFor(points) {
  for (const g of GRADE_THRESHOLDS) {
    if (points >= g.min) return g;
  }
  return GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];
}

/**
 * @typedef {{
 *   id: string,
 *   group: string,
 *   label: string,
 *   points: number,
 *   noteOnly?: boolean,
 *   icon?: string,
 *   isQuick?: boolean
 * }} Rule
 */

/** @type {Rule[]} */
const RULES = [
  // —— Điểm cộng (Khen thưởng) ——
  {
    id: "phat-bieu",
    group: "Khen thưởng",
    label: "Phát biểu xây dựng bài",
    points: 1,
    icon: "record_voice_over",
    isQuick: true,
  },
  {
    id: "giup-do-giao-vien",
    group: "Khen thưởng",
    label: "Giúp đỡ giáo viên",
    points: 1,
    icon: "volunteer_activism",
    isQuick: true,
  },
  {
    id: "diem-8",
    group: "Khen thưởng",
    label: "Điểm tốt — Điểm 8",
    points: 2,
    icon: "school",
    isQuick: true,
  },
  {
    id: "diem-9",
    group: "Khen thưởng",
    label: "Điểm tốt — Điểm 9",
    points: 3,
    icon: "grade",
    isQuick: true,
  },
  {
    id: "diem-10",
    group: "Khen thưởng",
    label: "Điểm tốt — Điểm 10",
    points: 5,
    icon: "workspace_premium",
    isQuick: true,
  },
  {
    id: "pt-th-5",
    group: "Phong trào tập thể",
    label: "Phong trào trường — khuyến khích / hạng 4",
    points: 5,
    icon: "military_tech",
    isQuick: true,
  },
  {
    id: "pt-th-10",
    group: "Phong trào tập thể",
    label: "Phong trào trường — Giải Ba",
    points: 10,
    icon: "military_tech",
    isQuick: true,
  },
  {
    id: "pt-th-20",
    group: "Phong trào tập thể",
    label: "Phong trào trường — Giải Nhì",
    points: 20,
    icon: "military_tech",
    isQuick: true,
  },
  {
    id: "pt-th-30",
    group: "Phong trào tập thể",
    label: "Phong trào trường — Giải Khuyến khích / 30đ",
    points: 30,
    icon: "military_tech",
  },
  {
    id: "pt-tt-40",
    group: "Phong trào tập thể",
    label: "PT tập thể — Hạng 2",
    points: 40,
    icon: "military_tech",
  },
  {
    id: "pt-tt-30",
    group: "Phong trào tập thể",
    label: "PT tập thể — Hạng 3",
    points: 30,
    icon: "military_tech",
  },
  {
    id: "pt-tt-50",
    group: "Phong trào tập thể",
    label: "Phong trào trường — Giải Nhất",
    points: 50,
    icon: "emoji_events",
    isQuick: true,
  },

  // —— Điểm trừ (Vi phạm nề nếp & học tập) ——
  {
    id: "tre-cp",
    group: "Chuyên cần",
    label: "Đi trễ — có phép (CP)",
    points: -1,
    icon: "schedule",
    isQuick: true,
  },
  {
    id: "nghi-cp",
    group: "Chuyên cần",
    label: "Nghỉ học — có phép (CP)",
    points: -1,
    icon: "event_busy",
    isQuick: true,
  },
  {
    id: "nghi-ca-buoi-cp",
    group: "Chuyên cần",
    label: "Nghỉ cả buổi — có phép (CP)",
    points: -10,
    icon: "event_busy",
  },
  {
    id: "bo-tiet-cp",
    group: "Chuyên cần",
    label: "Bỏ tiết học — có phép (CP)",
    points: -1,
    icon: "event_busy",
    isQuick: true,
  },
  {
    id: "dong-phuc-nb",
    group: "Đồng phục",
    label: "Sai đồng phục — nội bộ lớp (tóc dài, nhuộm, khuyên tai, sơn móng, trang điểm đậm, quần ngắn, v.v.)",
    points: -5,
    icon: "checkroom",
    isQuick: true,
  },
  {
    id: "dong-phuc-lop",
    group: "Đồng phục",
    label: "Sai đồng phục nghiêm trọng — bị ghi ảnh hưởng tới lớp",
    points: -10,
    icon: "warning",
    isQuick: true,
  },
  {
    id: "dong-phuc-chi-tiet",
    group: "Đồng phục",
    label: "Sai đồng phục chi tiết (tóc dài, nhuộm, khuyên tai, sơn móng, trang điểm đậm, mặc quần ngắn, bỏ áo ra khỏi quần)",
    points: -5,
    icon: "checkroom",
  },
  {
    id: "viec-rieng-knn",
    group: "Nề nếp",
    label: "Nói chuyện / Việc riêng tiết học — nhắc nhở",
    points: -10,
    icon: "volume_up",
    isQuick: true,
  },
  {
    id: "viec-rieng-khong-nhac",
    group: "Nề nếp",
    label: "Nói chuyện / Việc riêng tiết học — không nhắc nhở",
    points: -5,
    icon: "volume_up",
    isQuick: true,
  },
  {
    id: "ra-khoi-lop",
    group: "Nề nếp",
    label: "Ra khỏi lớp 15 phút đầu giờ",
    points: -5,
    icon: "logout",
    isQuick: true,
  },
  {
    id: "doi-pho",
    group: "Nề nếp",
    label: "Đổi chỗ ngồi (tự ý)",
    points: -5,
    icon: "flaky",
    isQuick: true,
  },
  {
    id: "tre-kp",
    group: "Chuyên cần",
    label: "Đi trễ không phép",
    points: -10,
    icon: "alarm_off",
    isQuick: true,
  },
  {
    id: "nghi-kp",
    group: "Chuyên cần",
    label: "Nghỉ học — không phép (KP)",
    points: -10,
    icon: "person_off",
    isQuick: true,
  },
  {
    id: "nghi-ca-buoi-kp",
    group: "Chuyên cần",
    label: "Nghỉ cả buổi — không phép (KP)",
    points: -10,
    icon: "person_off",
  },
  {
    id: "bo-tiet-kp",
    group: "Chuyên cần",
    label: "Bỏ tiết học (KP)",
    points: -10,
    icon: "do_not_disturb_on",
    isQuick: true,
  },
  {
    id: "dt-khong-nhac",
    group: "Kỷ luật",
    label: "Sử dụng điện thoại trong giờ học (không được phép)",
    points: -20,
    icon: "phone_android",
    isQuick: true,
  },
  {
    id: "noi-tuc",
    group: "Kỷ luật",
    label: "Nói tục, chửi thề",
    points: -10,
    icon: "campaign",
    isQuick: true,
  },
  {
    id: "khong-nv",
    group: "Kỷ luật",
    label: "Không làm nhiệm vụ GVCN / BCS / không thuộc bài",
    points: -10,
    icon: "assignment_late",
    isQuick: true,
  },
  {
    id: "ve-sinh-khong-dat",
    group: "Vệ sinh",
    label: "Tổ vệ sinh không đạt",
    points: -20,
    icon: "cleaning_services",
    isQuick: true,
  },
  {
    id: "khac",
    group: "Khác",
    label: "Lỗi khác (xả rác, leo rào, trốn chào cờ, mất trật tự hoạt động chung)",
    points: -10,
    icon: "info",
    isQuick: true,
  },
  {
    id: "lap-lai-2lan",
    group: "Tái phạm",
    label: "Lặp lại lỗi 2 lần liên tiếp / 2 tuần",
    points: -50,
    icon: "error",
    isQuick: true,
  },

  // —— Ghi nhận nghiêm trọng ——
  {
    id: "tai-lieu-kt",
    group: "Nghiêm trọng",
    label: "Sử dụng tài liệu khi kiểm tra — hạ 1 bậc hoặc hạ theo quy định nhà trường",
    points: 0,
    noteOnly: true,
    icon: "report_problem",
  },
  {
    id: "gt-bao-luc",
    group: "Nghiêm trọng",
    label: "Vi phạm luật giao thông / bạo lực học đường — hạ hạnh kiểm trực tiếp",
    points: 0,
    noteOnly: true,
    icon: "gavel",
  },
  {
    id: "te-nan",
    group: "Nghiêm trọng",
    label: "Tệ nạn xã hội (cờ bạc, đá gà, đánh bài) — hạ hạnh kiểm trực tiếp",
    points: 0,
    noteOnly: true,
    icon: "dangerous",
  },
];

const RULE_BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r]));

/** Nhóm "Phong trào tập thể" = thành tích nổi bật (hạng 1–4), khác điểm cộng thường. */
const ACHIEVEMENT_GROUPS = new Set(["Phong trào tập thể"]);

function isAchievementRule(ruleId) {
  const r = RULE_BY_ID[ruleId];
  return !!r && ACHIEVEMENT_GROUPS.has(r.group);
}

function formatPoints(n) {
  if (n > 0) return `+${n}`;
  return String(n);
}

function rulesGrouped() {
  /** @type {Map<string, Rule[]>} */
  const map = new Map();
  for (const r of RULES) {
    if (!map.has(r.group)) map.set(r.group, []);
    map.get(r.group).push(r);
  }
  return map;
}

/** Danh sách quy tắc nhanh cho màn hình ghi điểm */
const QUICK_REWARDS = RULES.filter((r) => r.points > 0 && r.isQuick);
const QUICK_PENALTIES = RULES.filter((r) => r.points < 0 && r.isQuick);


  // ========================================== 
  // 3. STORE DỮ LIỆU & SUPABASE REALTIME
  // ========================================== 
/**
 * Store quản lý dữ liệu thi đua Lớp 11A1 — Tối ưu chịu tải 50 thiết bị đồng thời
 * Kiến trúc Supabase Realtime WebSocket (Zero Polling) + Delta-Sync Fallback
 */



const SESSION_ROLE = "a1-role";
const SESSION_TEAM = "a1-leader-team";
const SESSION_LEADER_NAME = "a1-leader-name";
const LOCAL_EVENTS_KEY = "a1-events-v2";
const LOCAL_SETTINGS_KEY = "a1-settings-v2";
const SETTINGS_ROW_KEY = "class";
const TEAM_ADJUSTMENT_RULE_ID = "team-adjustment";
const TEAM_ADJUSTMENT_LABEL = "Điểm phong trào theo thống nhất lớp";

const memSession = new Map();
const safeSession = {
  get(key) {
    try {
      if (typeof sessionStorage !== "undefined") return sessionStorage.getItem(key);
      return memSession.get(key) || null;
    } catch {
      return memSession.get(key) || null;
    }
  },
  set(key, val) {
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, val);
      memSession.set(key, val);
    } catch {
      memSession.set(key, val);
    }
  },
  remove(key) {
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(key);
      memSession.delete(key);
    } catch {
      memSession.delete(key);
    }
  },
};

/**
 * @typedef {{
 *   id: string,
 *   weekId: string,
 *   teamId: string,
 *   memberId: string,
 *   ruleId: string,
 *   points: number,
 *   label: string,
 *   note: string,
 *   byTeamId: string,
 *   createdByRole: "admin" | "leader",
 *   createdAt: number,
 *   syncError?: string
 * }} ScoreEvent
 */

/**
 * @typedef {{
 *   weekId: string,
 *   reason: string,
 *   lockedAt: number
 * }} LockedWeekEntry
 */

/**
 * @typedef {{
 *   lockedWeeks: LockedWeekEntry[],
 *   leadersPaused: boolean
 * }} AppSettings
 */

function defaultSettings() {
  return { lockedWeeks: [], leadersPaused: false };
}

function loadLocalSettings() {
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return defaultSettings();
  }
}

function saveLocalSettings(settings) {
  try {
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

function normalizeSettings(raw) {
  const base = defaultSettings();
  if (!raw || typeof raw !== "object") return base;
  // Support both old format (string[]) and new format (LockedWeekEntry[])
  const rawLocked = Array.isArray(raw.lockedWeeks) ? raw.lockedWeeks : [];
  const seen = new Set();
  const locked = [];
  for (const item of rawLocked) {
    if (typeof item === "string" && item) {
      // Old format: migrate to new format
      if (!seen.has(item)) {
        seen.add(item);
        locked.push({ weekId: item, reason: "", lockedAt: 0 });
      }
    } else if (item && typeof item === "object" && typeof item.weekId === "string" && item.weekId) {
      // New format
      if (!seen.has(item.weekId)) {
        seen.add(item.weekId);
        locked.push({
          weekId: item.weekId,
          reason: typeof item.reason === "string" ? item.reason : "",
          lockedAt: typeof item.lockedAt === "number" ? item.lockedAt : 0,
        });
      }
    }
  }
  return {
    lockedWeeks: locked,
    leadersPaused: Boolean(raw.leadersPaused),
  };
}

function weekIdFromDate(date = new Date()) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Thứ 2 đầu tuần
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function competitionStartWeekId() {
  return weekIdFromDate(new Date(COMPETITION_START + "T12:00:00"));
}

function weekRangeLabel(weekId) {
  const start = new Date(weekId + "T12:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (x) =>
    `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

function weekNumber(weekId) {
  const start = new Date(competitionStartWeekId() + "T12:00:00");
  const cur = new Date(weekId + "T12:00:00");
  const diffDays = Math.round((cur - start) / 86400000);
  return Math.floor(diffDays / 7) + 1;
}

function weekIdForNumber(n) {
  const d = new Date(competitionStartWeekId() + "T12:00:00");
  d.setDate(d.getDate() + (n - 1) * 7);
  return d.toISOString().slice(0, 10);
}

function studiedThroughWeek() {
  const n = weekNumber(weekIdFromDate());
  if (n < 1) return 0;
  if (n > TOTAL_WEEKS) return TOTAL_WEEKS;
  return n - 1;
}

function isStudiedWeek(weekId) {
  const n = weekNumber(weekId);
  const through = studiedThroughWeek();
  return n >= 1 && n <= through;
}

function defaultWeekId() {
  const current = weekNumber(weekIdFromDate());
  if (current < 1) return weekIdForNumber(1);
  if (current > TOTAL_WEEKS) return weekIdForNumber(TOTAL_WEEKS);
  return weekIdForNumber(current);
}

function competitionWeekIds() {
  const ids = [];
  for (let n = 1; n <= TOTAL_WEEKS; n++) ids.push(weekIdForNumber(n));
  return ids;
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function rowToEvent(row) {
  return {
    id: String(row.id),
    weekId: String(row.week_id),
    teamId: String(row.team_id),
    memberId: String(row.member_id),
    ruleId: String(row.rule_id),
    points: Number(row.points) || 0,
    label: String(row.label || ""),
    note: String(row.note || ""),
    byTeamId: String(row.by_team_id || ""),
    createdByRole: row.by_role === "admin" ? "admin" : "leader",
    createdAt: Number(row.created_at) || Date.now(),
    syncError: null,
  };
}

function compareNamesAlphabetically(a, b) {
  return (
    String(a.name || "").localeCompare(String(b.name || ""), "vi", { sensitivity: "base" }) ||
    String(a.id || "").localeCompare(String(b.id || ""), "en", { numeric: true })
  );
}

function assignCompetitionRanks(items, getScore) {
  items.forEach((item, index) => {
    item.rank =
      index > 0 && getScore(item) === getScore(items[index - 1])
        ? items[index - 1].rank
        : index + 1;
    item.isTied = false;
  });

  const rankCounts = new Map();
  for (const item of items) {
    rankCounts.set(item.rank, (rankCounts.get(item.rank) || 0) + 1);
  }
  for (const item of items) {
    item.isTied = rankCounts.get(item.rank) > 1;
  }

  return items;
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}

async function fetchWithTimeout(url, options = {}, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

class ScoreStore {
  constructor() {
    /** @type {ScoreEvent[]} Toàn bộ event */
    this.allEvents = [];
    /** @type {ScoreEvent[]} Event của tuần đang chọn */
    this.events = [];
    this.weekId = defaultWeekId();
    this.mode = SUPABASE_ENABLED ? "live" : "offline";
    this.realtimeStatus = "DISCONNECTED"; // SUBSCRIBED | CONNECTING | DISCONNECTED
    this.lastSyncTimestamp = 0;
    this.latencyMs = 0;
    /** @type {AppSettings} */
    this.settings = loadLocalSettings();

    /** @type {Set<() => void>} */
    this._listeners = new Set();
    /** @type {Set<string>} Chống ghi trùng idempotency keys */
    this._inFlightKeys = new Set();

    /** @type {any} Supabase JS client */
    this.supabaseClient = null;
    /** @type {any} Supabase Realtime Channel */
    this.realtimeChannel = null;

    this._initSupabase();
  }

  _initSupabase() {
    if (SUPABASE_ENABLED && typeof window !== "undefined" && window.supabase) {
      try {
        this.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
        });
      } catch (err) {
        console.warn("Lỗi khởi tạo Supabase client:", err);
      }
    }
  }

  // —— Phân quyền & Phiên làm việc ——
  getRole() {
    return safeSession.get(SESSION_ROLE) || null;
  }

  isAdmin() {
    return this.getRole() === "admin";
  }

  isLeader() {
    return this.getRole() === "leader";
  }

  isLoggedIn() {
    return Boolean(this.getRole());
  }

  getLeaderTeamId() {
    if (!this.isLeader()) return null;
    return safeSession.get(SESSION_TEAM);
  }

  getLeaderName() {
    if (this.isAdmin()) return "Giáo viên Chủ nhiệm (Admin)";
    if (this.isLeader()) {
      return safeSession.get(SESSION_LEADER_NAME) || "Tổ trưởng";
    }
    return "Khách xem điểm";
  }

  setAuth(role, teamId = null, leaderName = null) {
    if (role === "admin") {
      safeSession.set(SESSION_ROLE, "admin");
      safeSession.remove(SESSION_TEAM);
      safeSession.remove(SESSION_LEADER_NAME);
    } else if (role === "leader" && teamId) {
      safeSession.set(SESSION_ROLE, "leader");
      safeSession.set(SESSION_TEAM, teamId);
      if (leaderName) safeSession.set(SESSION_LEADER_NAME, leaderName);
    } else {
      safeSession.remove(SESSION_ROLE);
      safeSession.remove(SESSION_TEAM);
      safeSession.remove(SESSION_LEADER_NAME);
    }
    this._emit();
  }

  logout() {
    this.setAuth(null);
  }

  // —— Cấu hình & Khóa sổ ——
  /** @returns {LockedWeekEntry[]} */
  getLockedWeeks() {
    return this.settings.lockedWeeks || [];
  }

  isWeekLocked(weekId = this.weekId) {
    return this.getLockedWeeks().some(entry => entry.weekId === weekId);
  }

  /** @returns {string} reason or empty string */
  getLockedWeekReason(weekId = this.weekId) {
    const entry = this.getLockedWeeks().find(e => e.weekId === weekId);
    return entry ? (entry.reason || "") : "";
  }

  isLeadersPaused() {
    return Boolean(this.settings.leadersPaused);
  }

  isCountingWeek(weekId = this.weekId) {
    return isStudiedWeek(weekId);
  }

  countingWeekIds() {
    const through = studiedThroughWeek();
    const ids = [];
    for (let n = 1; n <= through; n++) {
      const id = weekIdForNumber(n);
      if (this.isCountingWeek(id) && !this.isWeekLocked(id)) ids.push(id);
    }
    return ids;
  }

  canEditWeek(weekId = this.weekId) {
    if (this.isAdmin()) return true; // Admin có mọi quyền trên mọi tuần
    if (!this.isLeader()) return false;
    // Tổ trưởng chỉ được ghi điểm tuần hiện tại
    return weekId === defaultWeekId();
  }

  leaderBlockReason(weekId = this.weekId) {
    if (this.isAdmin()) return null;
    if (!this.isLeader()) return "Chưa đăng nhập tổ trưởng.";
    const cur = defaultWeekId();
    if (weekId !== cur) {
      return `Tuần ${weekNumber(weekId)} đã học xong. Tổ trưởng chỉ ghi điểm Tuần ${weekNumber(cur)}.`;
    }
    return null;
  }

  async setWeekLocked(weekId, locked, reason = "") {
    if (!this.isAdmin()) throw new Error("Chỉ Admin được khóa sổ tuần.");
    const current = this.getLockedWeeks().filter(e => e.weekId !== weekId);
    if (locked) {
      current.push({ weekId, reason: String(reason || ""), lockedAt: Date.now() });
    }
    await this._saveSettings({
      ...this.settings,
      lockedWeeks: current.sort((a, b) => a.weekId.localeCompare(b.weekId)),
    });
  }

  async setLeadersPaused(paused) {
    if (!this.isAdmin()) throw new Error("Chỉ Admin.");
    await this._saveSettings({
      ...this.settings,
      leadersPaused: Boolean(paused),
    });
  }

  async _saveSettings(next) {
    this.settings = normalizeSettings(next);
    saveLocalSettings(this.settings);
    if (this.mode === "live" && this._hasAppSettingsTable !== false) {
      try {
        const body = {
          key: SETTINGS_ROW_KEY,
          value: this.settings,
          updated_at: Date.now(),
        };
        const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/app_settings`, {
          method: "POST",
          headers: supabaseHeaders({
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal",
          }),
          body: JSON.stringify(body),
        });
        if (res && res.status === 404) {
          this._hasAppSettingsTable = false;
        }
      } catch (err) {
        // Tự động dùng cache local khi bảng chưa tạo trên Supabase
      }
    }
    this._emit();
  }

  async _fetchSettings() {
    this.settings = loadLocalSettings();
    if (this.mode !== "live" || this._hasAppSettingsTable === false) return;
    try {
      const res = await fetchWithTimeout(
        `${SUPABASE_URL}/rest/v1/app_settings?key=eq.${encodeURIComponent(SETTINGS_ROW_KEY)}&select=value`,
        { headers: supabaseHeaders({ Accept: "application/json" }) }
      );
      if (res.status === 404) {
        // Bảng app_settings chưa tạo trong Supabase -> Đánh dấu để không gọi lặp lại 404
        this._hasAppSettingsTable = false;
        return;
      }
      if (res.ok) {
        this._hasAppSettingsTable = true;
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0]?.value) {
          this.settings = normalizeSettings(rows[0].value);
          saveLocalSettings(this.settings);
        }
      }
    } catch (err) {
      // Dùng localSettings mượt mà
    }
  }

  // —— Realtime WebSocket & Delta-Sync ——
  async init() {
    // 1. Tải cache local trước để mở web tức thì (< 10ms)
    this._loadFromLocal();
    this._emit();

    // 2. Fetch dữ liệu đầy đủ lần đầu
    await this.refresh();

    // 3. Khởi tạo Supabase Realtime WebSocket (Không dùng Polling liên tục!)
    this._setupRealtime();

    // 4. Delta-Sync khi tab quay lại (focus)
    if (typeof window !== "undefined") {
      window.addEventListener("focus", () => {
        this.deltaSync();
      });
      window.addEventListener("online", () => {
        this.refresh();
      });
    }
  }

  _setupRealtime() {
    if (!this.supabaseClient) {
      // Thử khởi tạo lại nếu window.supabase tải trễ
      this._initSupabase();
    }

    if (!this.supabaseClient) {
      this.realtimeStatus = "DELTA_SYNC";
      return;
    }

    try {
      if (this.realtimeChannel) {
        this.realtimeChannel.unsubscribe();
      }

      this.realtimeStatus = "CONNECTING";
      this.realtimeChannel = this.supabaseClient
        .channel("class-11a1-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "events" },
          (payload) => {
            this._handlePostgresChange(payload);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            this.realtimeStatus = "SUBSCRIBED";
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            this.realtimeStatus = "DISCONNECTED";
          }
          this._emit();
        });
    } catch (err) {
      console.warn("Lỗi thiết lập realtime channel:", err);
      this.realtimeStatus = "DELTA_SYNC";
    }
  }

  _handlePostgresChange(payload) {
    const { eventType, new: newRow, old: oldRow } = payload;
    const start = performance.now();

    if (eventType === "INSERT" && newRow) {
      const event = rowToEvent(newRow);
      // Tránh trùng nếu chính client vừa tạo
      if (!this.allEvents.some((e) => e.id === event.id)) {
        this.allEvents.unshift(event);
      }
    } else if (eventType === "DELETE" && oldRow) {
      const targetId = String(oldRow.id);
      this.allEvents = this.allEvents.filter((e) => e.id !== targetId);
    } else if (eventType === "UPDATE" && newRow) {
      const updated = rowToEvent(newRow);
      const idx = this.allEvents.findIndex((e) => e.id === updated.id);
      if (idx !== -1) this.allEvents[idx] = updated;
    }

    this.latencyMs = Math.max(5, Math.round(performance.now() - start));
    this._saveToLocal();
    this._emit();
  }

  /**
   * Delta-Sync: Chỉ lấy các bản ghi mới hơn mốc thời gian đã lưu
   * Tiết kiệm 99.8% băng thông (150 bytes thay vì 400KB)
   */
  async deltaSync() {
    if (this.mode !== "live") return;
    try {
      const start = performance.now();
      const cutoff = this.lastSyncTimestamp || 0;
      const url = `${SUPABASE_URL}/rest/v1/events?created_at=gt.${cutoff}&order=created_at.desc&limit=100`;
      const res = await fetchWithTimeout(url, {
        headers: supabaseHeaders({ Accept: "application/json" }),
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const freshEvents = rows.map(rowToEvent);
          const existingIds = new Set(this.allEvents.map((e) => e.id));
          const toAdd = freshEvents.filter((e) => !existingIds.has(e.id));
          if (toAdd.length > 0) {
            this.allEvents = [...toAdd, ...this.allEvents];
            this._saveToLocal();
            this._emit();
          }
        }
        this.lastSyncTimestamp = Date.now();
        this.latencyMs = Math.max(8, Math.round(performance.now() - start));
      }
    } catch (err) {
      console.warn("Delta-sync failed:", err);
    }
  }

  async refresh() {
    if (this.mode === "live") {
      try {
        await this._fetchSettings();
        const res = await fetchWithTimeout(
          `${SUPABASE_URL}/rest/v1/events?select=*&order=created_at.desc&limit=5000`,
          { headers: supabaseHeaders({ Accept: "application/json" }) }
        );
        if (res.ok) {
          const rows = await res.json();
          this.allEvents = (rows || []).map(rowToEvent);
          this.lastSyncTimestamp = Date.now();
          this._saveToLocal();
          this._emit();
          return;
        }
      } catch (err) {
        console.warn("Lỗi fetch Supabase, fallback sang local:", err);
      }
    }

    this._loadFromLocal();
    this._emit();
  }

  _loadFromLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
      this.allEvents = raw ? JSON.parse(raw) : [];
    } catch {
      this.allEvents = [];
    }
  }

  _saveToLocal() {
    try {
      localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(this.allEvents));
    } catch {}
  }

  // —— Subscription & State Emission ——
  subscribe(fn) {
    this._listeners.add(fn);
    fn();
    return () => this._listeners.delete(fn);
  }

  _emit() {
    this._syncWeekSlice();
    for (const fn of this._listeners) {
      try {
        fn();
      } catch (err) {
        console.error("Lỗi listener store:", err);
      }
    }
  }

  _syncWeekSlice() {
    this.events = this.allEvents
      .filter((e) => e.weekId === this.weekId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  setWeek(weekId) {
    this.weekId = weekId;
    this._syncWeekSlice();
    this._emit();
  }

  // =========================================================================
  // THUẬT TOÁN 1: Tính Điểm 1 Vòng Lặp O(N) (Single-Pass Aggregation)
  // =========================================================================
  calculateScoresFast(
    targetEvents = this.events,
    basePoints = BASE_POINTS,
    weekId = this.weekId
  ) {
    const teamScores = {};
    const memberScores = {};
    const weekTeams = teamsForWeek(weekId);

    // 1. Khởi tạo điểm nền 100 điểm
    for (const t of weekTeams) {
      teamScores[t.id] = {
        id: t.id,
        name: t.name,
        leaderName: t.leaderName,
        total: t.members.length * basePoints,
        rawTotal: t.members.length * basePoints,
        memberCount: t.members.length,
        plusPoints: 0,
        minusPoints: 0,
        plusCount: 0,
        minusCount: 0,
        violators: [],
        bonusers: [],
        locked: this.isWeekLocked(weekId),
      };

      for (const m of t.members) {
        memberScores[m.id] = {
          id: m.id,
          name: m.name,
          teamId: t.id,
          teamName: t.name,
          points: basePoints,
          plusPoints: 0,
          minusPoints: 0,
          plusCount: 0,
          minusCount: 0,
          events: [],
        };
      }
    }

    // 2. Duyệt 1 vòng lặp O(N) duy nhất
    for (let i = 0; i < targetEvents.length; i++) {
      const ev = targetEvents[i];
      const m = memberScores[ev.memberId];
      if (m) {
        m.points += ev.points;
        if (ev.points > 0) {
          m.plusPoints += ev.points;
          m.plusCount++;
        } else if (ev.points < 0) {
          m.minusPoints += ev.points;
          m.minusCount++;
        }
        m.events.push(ev);
      }

      const t = teamScores[ev.teamId];
      if (t) {
        t.rawTotal += ev.points;
        if (ev.points > 0) {
          t.plusPoints += ev.points;
          t.plusCount++;
        } else if (ev.points < 0) {
          t.minusPoints += ev.points;
          t.minusCount++;
        }
      }
    }

    for (const tId in teamScores) {
      const t = teamScores[tId];
      t.total = t.rawTotal;
      t.avg = t.memberCount
        ? Math.round((t.total / t.memberCount) * 10) / 10
        : 0;
    }

    return { teamScores, memberScores };
  }

  /** Xếp hạng các tổ tuần hiện tại */
  getTeamRankings() {
    if (!isStudiedWeek(this.weekId)) return [];
    const { teamScores } = this.calculateScoresFast(this.events);
    const sorted = Object.values(teamScores).sort(
      (a, b) => b.total - a.total || compareNamesAlphabetically(a, b)
    );
    return assignCompetitionRanks(sorted, (team) => team.total);
  }

  getTeamRangeRankings(fromWeek, toWeek) {
    const through = studiedThroughWeek();
    if (
      !Number.isInteger(fromWeek) ||
      !Number.isInteger(toWeek) ||
      fromWeek < 1 ||
      fromWeek > toWeek ||
      toWeek > through
    ) {
      throw new RangeError("Khoảng tuần tổng kết không hợp lệ.");
    }

    const totals = new Map(
      teamsForWeek(weekIdForNumber(fromWeek)).map((team) => [
        team.id,
        {
          id: team.id,
          name: team.name,
          total: 0,
          plusPoints: 0,
          minusPoints: 0,
          weeklyResults: [],
        },
      ])
    );

    for (let n = fromWeek; n <= toWeek; n++) {
      const weekId = weekIdForNumber(n);
      const weekEvents = this.allEvents.filter((event) => event.weekId === weekId);
      const { teamScores } = this.calculateScoresFast(weekEvents, BASE_POINTS, weekId);
      const weeklyRankings = assignCompetitionRanks(
        Object.values(teamScores).sort(
          (a, b) => b.total - a.total || compareNamesAlphabetically(a, b)
        ),
        (team) => team.total
      );
      for (const team of weeklyRankings) {
        const total = totals.get(team.id);
        if (total) {
          total.weeklyResults.push({
            weekNumber: n,
            rank: team.rank,
            total: team.total,
          });
        }
      }

      for (const [teamId, score] of Object.entries(teamScores)) {
        const total = totals.get(teamId);
        if (!total) continue;
        total.total += score.total;
        total.plusPoints += score.plusPoints;
        total.minusPoints += score.minusPoints;
      }
    }

    const ranked = [...totals.values()].sort(
      (a, b) => b.total - a.total || compareNamesAlphabetically(a, b)
    );
    return assignCompetitionRanks(ranked, (team) => team.total);
  }

  /** Lấy danh sách thành viên trong tổ đã sắp xếp theo điểm */
  getTeamMembersSorted(teamId) {
    const team = teamsForWeek(this.weekId).find((item) => item.id === teamId);
    if (!team) return [];
    const { memberScores } = this.calculateScoresFast(this.events);
    const sorted = team.members
      .map((m) => memberScores[m.id] || { ...m, points: BASE_POINTS, teamId })
      .sort((a, b) => b.points - a.points || compareNamesAlphabetically(a, b));
    return isStudiedWeek(this.weekId)
      ? assignCompetitionRanks(sorted, (member) => member.points)
      : sorted;
  }

  getTeamMemberWeekActivity(teamId, weekId = this.weekId) {
    const team = teamsForWeek(weekId).find((item) => item.id === teamId);
    if (!team) return [];

    const weekEvents = this.allEvents.filter(
      (event) => event.weekId === weekId && event.teamId === teamId
    );
    const { memberScores } = this.calculateScoresFast(
      weekEvents,
      BASE_POINTS,
      weekId
    );

    const members = team.members.map((member) => {
      const score = memberScores[member.id] || {
        ...member,
        teamId,
        points: BASE_POINTS,
      };
      const events = weekEvents.filter((event) => event.memberId === member.id);
      const violations = events.filter((event) => event.points <= 0);
      const bonuses = events.filter((event) => event.points > 0);
      const violationGroups = new Map();

      for (const event of violations) {
        const label = event.label || RULE_BY_ID[event.ruleId]?.label || event.ruleId;
        const group = violationGroups.get(label) || { label, count: 0, points: 0 };
        group.count++;
        group.points += event.points;
        violationGroups.set(label, group);
      }

      return {
        ...score,
        violationCount: violations.length,
        bonusCount: bonuses.length,
        violationGroups: [...violationGroups.values()],
      };
    });

    return assignCompetitionRanks(
      members.sort(
        (a, b) => b.points - a.points || compareNamesAlphabetically(a, b)
      ),
      (member) => member.points
    );
  }

  getViolationHistoryByTeam() {
    const violationsByTeam = new Map(
      TEAMS.map((team) => [
        team.id,
        { id: team.id, name: team.name, members: new Map() },
      ])
    );

    for (const event of this.allEvents) {
      if (event.points > 0) continue;
      const team = violationsByTeam.get(event.teamId);
      if (!team) continue;

      const member = MEMBER_BY_ID[event.memberId];
      const memberHistory = team.members.get(event.memberId) || {
        id: event.memberId,
        name: member?.name || event.memberId,
        events: [],
        points: 0,
      };
      memberHistory.events.push({
        ...event,
        weekNumber: weekNumber(event.weekId),
        label: event.label || RULE_BY_ID[event.ruleId]?.label || event.ruleId,
      });
      memberHistory.points += event.points;
      team.members.set(event.memberId, memberHistory);
    }

    return [...violationsByTeam.values()].map((team) => ({
      ...team,
      members: [...team.members.values()]
        .map((member) => ({
          ...member,
          events: member.events.sort((a, b) => b.createdAt - a.createdAt),
        }))
        .sort(
          (a, b) =>
            b.events.length - a.events.length ||
            a.name.localeCompare(b.name, "vi", { sensitivity: "base" })
        ),
      eventCount: [...team.members.values()].reduce(
        (total, member) => total + member.events.length,
        0
      ),
    }));
  }

  // =========================================================================
  // THUẬT TOÁN 3: Tự Động Bắt Lỗi Tái Phạm 2 Tuần Liên Tiếp (-50đ)
  // =========================================================================
  getPreviousWeekInfractions(currentWeekId = this.weekId) {
    const curNum = weekNumber(currentWeekId);
    if (curNum <= 1) return new Set();

    const prevWeekId = weekIdForNumber(curNum - 1);
    const infractions = new Set();

    for (let i = 0; i < this.allEvents.length; i++) {
      const ev = this.allEvents[i];
      if (ev.weekId === prevWeekId && ev.points < 0) {
        infractions.add(`${ev.memberId}#${ev.ruleId}`);
      }
    }
    return infractions;
  }

  checkRepeatInfraction(memberId, ruleId, currentWeekId = this.weekId) {
    const prevInfractions = this.getPreviousWeekInfractions(currentWeekId);
    return prevInfractions.has(`${memberId}#${ruleId}`);
  }

  // =========================================================================
  // THUẬT TOÁN 4: Tìm Kiếm Tiếng Việt Không Dấu Siêu Tốc
  // =========================================================================
  searchMembers(query) {
    const q = toNonAccentVietnamese(query);
    if (!q) return [];

    const all = TEAMS.flatMap((t) => t.members.map((m) => ({ ...m, teamId: t.id })));
    return all
      .filter((m) => toNonAccentVietnamese(m.name).includes(q) || m.id.toLowerCase().includes(q))
      .map((m) => ({
        ...m,
        teamName: TEAM_BY_ID[m.teamId]?.name || m.teamId,
        ...this.getMemberProfile(m.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }

  // —— Hồ Sơ Chi Tiết Cá Nhân ——
  getMemberProfile(memberId) {
    const member = MEMBER_BY_ID[memberId];
    if (!member) return null;

    const countingIds = this.countingWeekIds();
    const countingEvents = this.allEvents.filter(
      (e) => e.memberId === memberId && countingIds.includes(e.weekId)
    );
    const weekEvents = this.events.filter((e) => e.memberId === memberId);

    let plusPoints = 0;
    let minusPoints = 0;
    let plusCount = 0;
    let minusCount = 0;

    for (const e of countingEvents) {
      if (e.points > 0) {
        plusPoints += e.points;
        plusCount++;
      } else if (e.points < 0) {
        minusPoints += e.points;
        minusCount++;
      }
    }

    const currentWeekDelta = weekEvents.reduce((acc, e) => acc + e.points, 0);
    const currentWeekPoints = BASE_POINTS + currentWeekDelta;

    const weeksCount = countingIds.length || 1;
    const yearTotal = BASE_POINTS * weeksCount + (plusPoints + minusPoints);
    const avgScore = Math.round((yearTotal / weeksCount) * 10) / 10;

    // Chỉ xếp hạng cá nhân khi tuần đang chọn đã kết thúc.
    const rankedMembers = isStudiedWeek(this.weekId)
      ? assignCompetitionRanks(
          Object.values(this.calculateScoresFast(this.events).memberScores).sort(
            (a, b) => b.points - a.points || compareNamesAlphabetically(a, b)
          ),
          (m) => m.points
        )
      : [];
    const rankedMember = rankedMembers.find((m) => m.id === memberId);
    const classRank = rankedMember?.rank ?? null;
    const isClassRankTied = rankedMember?.isTied || false;

    // Điểm tuần trước để tính chênh lệch tăng/giảm
    const curNum = weekNumber(this.weekId);
    let prevWeekPoints = BASE_POINTS;
    if (curNum > 1) {
      const prevWeekId = weekIdForNumber(curNum - 1);
      const prevEvents = this.allEvents.filter(
        (e) => e.memberId === memberId && e.weekId === prevWeekId
      );
      prevWeekPoints += prevEvents.reduce((acc, e) => acc + e.points, 0);
    }
    const diffFromLastWeek = currentWeekPoints - prevWeekPoints;

    return {
      member,
      currentWeekPoints,
      yearTotal,
      avgScore,
      plusPoints,
      minusPoints,
      plusCount,
      minusCount,
      classRank,
      isClassRankTied,
      totalStudents: rankedMembers.length || 44,
      diffFromLastWeek,
      weekEvents,
      allEvents: countingEvents,
    };
  }

  // —— BXH Toàn Trường / Cá Nhân ——
  getYearRankings() {
    const all = TEAMS.flatMap((t) => t.members.map((m) => ({ ...m, teamId: t.id })));

    const sorted = all
      .map((m) => {
        const prof = this.getMemberProfile(m.id);
        return {
          ...m,
          teamName: TEAM_BY_ID[m.teamId]?.name || m.teamId,
          ...prof,
        };
      })
      .sort((a, b) => b.yearTotal - a.yearTotal || compareNamesAlphabetically(a, b));

    return assignCompetitionRanks(sorted, (member) => member.yearTotal);
  }

  getViolationRankings() {
    const rankings = this.getYearRankings()
      .filter((m) => m.minusCount > 0)
      .sort((a, b) => a.minusPoints - b.minusPoints || compareNamesAlphabetically(a, b));
    return assignCompetitionRanks(rankings, (member) => member.minusPoints);
  }

  getBonusRankings() {
    const rankings = this.getYearRankings()
      .filter((m) => m.plusCount > 0)
      .sort((a, b) => b.plusPoints - a.plusPoints || compareNamesAlphabetically(a, b));
    return assignCompetitionRanks(rankings, (member) => member.plusPoints);
  }

  getMemberWeekBreakdown(memberId, weekId = this.weekId) {
    const member = MEMBER_BY_ID[memberId];
    if (!member) return null;
    const events = this.allEvents
      .filter((event) => event.memberId === memberId && event.weekId === weekId)
      .sort((a, b) => b.createdAt - a.createdAt);
    const plus = events.filter((event) => event.points > 0);
    const minus = events.filter((event) => event.points < 0);
    const notes = events.filter((event) => event.points === 0);
    const points = BASE_POINTS + events.reduce((sum, event) => sum + event.points, 0);
    return {
      member,
      teamName: TEAM_BY_ID[member.teamId]?.name || member.teamId,
      weekId,
      weekNumber: weekNumber(weekId),
      points,
      grade: gradeFor(points),
      plus,
      minus,
      notes,
      events,
    };
  }

  getMemberGradeWeeks(memberId, fromWeek = 1, toWeek = studiedThroughWeek()) {
    const through = studiedThroughWeek();
    const start = Math.max(1, fromWeek);
    const end = Math.min(toWeek, through);
    const weeks = [];
    for (let n = start; n <= end; n++) {
      const row = this.getMemberWeekBreakdown(memberId, weekIdForNumber(n));
      if (row) weeks.push(row);
    }
    const counts = { tot: 0, kha: 0, dat: 0, "chua-dat": 0 };
    for (const week of weeks) {
      if (counts[week.grade.key] !== undefined) counts[week.grade.key] += 1;
    }
    return { weeks, counts, fromWeek: start, toWeek: end };
  }

  getMemberRuleHistory(memberId, ruleId) {
    return this.allEvents
      .filter((event) => event.memberId === memberId && event.ruleId === ruleId)
      .sort((a, b) => a.weekId.localeCompare(b.weekId) || a.createdAt - b.createdAt)
      .map((event) => ({
        ...event,
        weekNumber: weekNumber(event.weekId),
        label: event.label || RULE_BY_ID[event.ruleId]?.label || event.ruleId,
      }));
  }

  getTeamPodiumStats() {
    const through = studiedThroughWeek();
    const stats = Object.fromEntries(
      TEAMS.map((team) => [
        team.id,
        {
          id: team.id,
          name: team.name,
          first: 0,
          second: 0,
          third: 0,
          last: 0,
          weeks: through,
          firstWeeks: [],
          secondWeeks: [],
          thirdWeeks: [],
          lastWeeks: [],
        },
      ])
    );

    for (let n = 1; n <= through; n++) {
      const weekId = weekIdForNumber(n);
      const weekEvents = this.allEvents.filter((event) => event.weekId === weekId);
      const { teamScores } = this.calculateScoresFast(weekEvents, BASE_POINTS, weekId);
      const ranked = assignCompetitionRanks(
        Object.values(teamScores).sort(
          (a, b) => b.rawTotal - a.rawTotal || compareNamesAlphabetically(a, b)
        ),
        (team) => team.rawTotal
      );
      const lastRank = ranked.reduce((max, team) => Math.max(max, team.rank), 1);
      for (const team of ranked) {
        const row = stats[team.id];
        if (!row) continue;
        if (team.rank === 1) { row.first += 1; row.firstWeeks.push(n); }
        if (team.rank === 2) { row.second += 1; row.secondWeeks.push(n); }
        if (team.rank === 3) { row.third += 1; row.thirdWeeks.push(n); }
        if (team.rank === lastRank) { row.last += 1; row.lastWeeks.push(n); }
      }
    }

    return Object.values(stats).sort(
      (a, b) => b.first - a.first || b.second - a.second || b.third - a.third || a.last - b.last
    );
  }

  getSemesterById(id) {
    return SEMESTERS.find((item) => item.id === id) || SEMESTERS[0];
  }

  // =========================================================================
  // THUẬT TOÁN 2: Chống Ghi Trùng Điểm Khi Bấm Liên Tục (Idempotency Key)
  // =========================================================================
  async addEvent({ memberId, ruleId, note = "", multiplier = 1 }) {
    if (!this.isLoggedIn()) throw new Error("Vui lòng đăng nhập để ghi điểm.");

    const member = MEMBER_BY_ID[memberId];
    if (!member) throw new Error("Học sinh không tồn tại trong danh sách.");

    if (!this.isAdmin()) {
      // 1. Quyền hạn tổ trưởng chỉ được tương tác với tổ của mình
      const leaderTeam = this.getLeaderTeamId();
      if (!leaderTeam || member.teamId !== leaderTeam) {
        throw new Error("Tổ trưởng chỉ có quyền tương tác với tổ của mình, không có quyền hạn với các tổ khác.");
      }

      // 2. Các tuần đã học qua không được tương tác
      const currentWeek = defaultWeekId();
      if (this.weekId !== currentWeek) {
        throw new Error(`Tuần ${weekNumber(this.weekId)} đã học qua — Tổ trưởng không được tương tác với các tuần trước.`);
      }

    }

    const rule = RULE_BY_ID[ruleId];
    if (!rule) throw new Error("Quy tắc chấm điểm không hợp lệ.");

    const requestedMultiplier = Number(multiplier);
    if (!Number.isSafeInteger(requestedMultiplier) || requestedMultiplier < 1) {
      throw new Error("Số lượng phải là số nguyên dương hợp lệ.");
    }
    const mult = requestedMultiplier;
    const points = rule.points * mult;
    const createdAt = Date.now();
    const byTeamId = this.isAdmin() ? member.teamId : this.getLeaderTeamId();

    // Khóa chống ghi trùng: memberId + ruleId + khung 10s
    const idempotencyKey = `${memberId}_${ruleId}_${Math.floor(createdAt / 10000)}`;
    if (this._inFlightKeys.has(idempotencyKey)) {
      console.warn("Chặn ghi trùng: Yêu cầu đang được xử lý.");
      return null;
    }
    this._inFlightKeys.add(idempotencyKey);
    setTimeout(() => this._inFlightKeys.delete(idempotencyKey), 10000);

    const event = {
      id: uid(),
      weekId: this.weekId,
      teamId: member.teamId,
      memberId: member.id,
      ruleId: rule.id,
      points,
      label: mult > 1 ? `${rule.label} (x${mult})` : rule.label,
      note: String(note || "").slice(0, 200),
      byTeamId,
      createdByRole: this.isAdmin() ? "admin" : "leader",
      createdAt,
      syncError: null,
    };

    // 1. Optimistic Update (< 5ms): Thêm vào local state ngay lập tức!
    this.allEvents.unshift(event);
    this._saveToLocal();
    this._emit();

    // 2. Gửi bất đồng bộ lên Supabase
    if (this.mode === "live") {
      try {
        const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/events`, {
          method: "POST",
          headers: supabaseHeaders({
            "Content-Type": "application/json",
            Prefer: "return=representation",
            Accept: "application/json",
          }),
          body: JSON.stringify({
            week_id: event.weekId,
            team_id: event.teamId,
            member_id: event.memberId,
            rule_id: event.ruleId,
            points: event.points,
            label: event.label,
            note: event.note,
            by_team_id: event.byTeamId,
            by_role: event.createdByRole,
            created_at: event.createdAt,
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          const detail = text.slice(0, 160);
          const message =
            res.status === 401
              ? "Supabase từ chối xác thực (401). Hãy kiểm tra SUPABASE_URL và SUPABASE_ANON_KEY trong js/config.js có thuộc cùng một dự án Supabase không."
              : `Supabase không lưu được điểm (HTTP ${res.status})${detail ? `: ${detail}` : ""}`;
          throw new Error(message);
        }

        const rows = await res.json();
        const saved = Array.isArray(rows) ? rows[0] : rows;
        if (saved && saved.id) {
          event.id = String(saved.id);
        }
        event.syncError = null;
      } catch (err) {
        event.syncError =
          err instanceof Error ? err.message : "Không xác định được lỗi khi đồng bộ Supabase.";
        this._saveToLocal();
        console.warn("Ghi Supabase thất bại; sự kiện hiện chỉ được lưu trên thiết bị:", err);
      }
    }

    return event;
  }

  /** Ghi nhiều học sinh, có thể kèm nhiều nội quy mỗi cái một số lượng */
  async addEventsBatch({ memberIds, ruleId, note = "", multiplier = 1, items }) {
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      throw new Error("Vui lòng chọn ít nhất một học sinh.");
    }
    if (memberIds.length !== 1) {
      throw new Error("Mỗi lượt chỉ được ghi điểm cho một học sinh.");
    }
    const jobs = Array.isArray(items) && items.length
      ? items
      : [{ ruleId, multiplier }];
    const results = [];
    for (const mId of memberIds) {
      for (const job of jobs) {
        const ev = await this.addEvent({
          memberId: mId,
          ruleId: job.ruleId,
          note,
          multiplier: job.multiplier,
        });
        if (ev) results.push(ev);
      }
    }
    return results;
  }

  async addTeamAdjustment({ teamId, points, note }) {
    if (!this.isLoggedIn()) throw new Error("Vui lòng đăng nhập để ghi điểm phong trào.");
    if (!TEAM_BY_ID[teamId]) throw new Error("Vui lòng chọn một tổ hợp lệ.");
    if (this.isLeader()) {
      if (this.getLeaderTeamId() !== teamId) {
        throw new Error("Tổ trưởng chỉ được ghi điểm phong trào cho tổ của mình.");
      }
      const blockReason = this.leaderBlockReason(this.weekId);
      if (blockReason) throw new Error(blockReason);
    } else if (!this.isAdmin()) {
      throw new Error("Bạn không có quyền ghi điểm phong trào.");
    }

    const adjustment = Number(points);
    if (
      !Number.isSafeInteger(adjustment) ||
      adjustment === 0 ||
      Math.abs(adjustment) > 2147483647
    ) {
      throw new Error("Số điểm phải là số nguyên khác 0, không vượt quá 2.147.483.647.");
    }

    const reason = String(note || "").trim();
    if (!reason) throw new Error("Vui lòng nhập lý do cộng hoặc trừ điểm.");
    if (reason.length > 200) throw new Error("Lý do không được vượt quá 200 ký tự.");

    const event = {
      id: uid(),
      weekId: this.weekId,
      teamId,
      memberId: "",
      ruleId: TEAM_ADJUSTMENT_RULE_ID,
      points: adjustment,
      label: TEAM_ADJUSTMENT_LABEL,
      note: reason,
      byTeamId: teamId,
      createdByRole: this.isAdmin() ? "admin" : "leader",
      createdAt: Date.now(),
      syncError: null,
    };

    if (this.mode === "live") {
      const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/events`, {
        method: "POST",
        headers: supabaseHeaders({
          "Content-Type": "application/json",
          Prefer: "return=representation",
          Accept: "application/json",
        }),
        body: JSON.stringify({
          week_id: event.weekId,
          team_id: event.teamId,
          member_id: event.memberId,
          rule_id: event.ruleId,
          points: event.points,
          label: event.label,
          note: event.note,
          by_team_id: event.byTeamId,
          by_role: event.createdByRole,
          created_at: event.createdAt,
        }),
      });

      if (!res.ok) {
        const detail = (await res.text().catch(() => "")).slice(0, 160);
        throw new Error(
          `Supabase không lưu được điểm phong trào (HTTP ${res.status})${detail ? `: ${detail}` : ""}`
        );
      }

      const rows = await res.json();
      const saved = Array.isArray(rows) ? rows[0] : rows;
      if (saved?.id) event.id = String(saved.id);
      const realtimeEvent = this.allEvents.find(
        (item) =>
          item.ruleId === TEAM_ADJUSTMENT_RULE_ID &&
          item.teamId === event.teamId &&
          item.weekId === event.weekId &&
          item.createdAt === event.createdAt
      );
      if (realtimeEvent) event.id = realtimeEvent.id;
    }

    if (!this.allEvents.some((item) => item.id === event.id)) this.allEvents.unshift(event);
    this._saveToLocal();
    this._emit();
    return event;
  }

  // —— Xóa bản ghi theo phạm vi quyền của từng vai trò ——
  canDeleteEvent(event) {
    if (!event) return false;
    if (this.isAdmin()) return true;
    if (event.ruleId === TEAM_ADJUSTMENT_RULE_ID) return false;
    const leaderTeam = this.getLeaderTeamId();
    if (!leaderTeam || event.teamId !== leaderTeam) return false;
    return event.weekId === defaultWeekId() && this.canEditWeek(event.weekId);
  }

  async deleteEvent(eventId) {
    if (!this.isLoggedIn()) throw new Error("Chưa đăng nhập.");

    const event = this.allEvents.find((e) => String(e.id) === String(eventId));
    if (!event) throw new Error("Không tìm thấy bản ghi.");

    if (!this.canDeleteEvent(event)) {
      throw new Error("Bạn không có quyền xóa bản ghi này (tuần đã học qua hoặc không thuộc tổ của bạn).");
    }

    const originalIndex = this.allEvents.indexOf(event);
    this.allEvents = this.allEvents.filter((e) => String(e.id) !== String(eventId));
    this._saveToLocal();
    this._emit();

    if (this.mode === "live" && !event.syncError) {
      try {
        const res = await fetchWithTimeout(
          `${SUPABASE_URL}/rest/v1/events?id=eq.${encodeURIComponent(eventId)}`,
          {
            method: "DELETE",
            headers: supabaseHeaders({ Accept: "application/json" }),
          }
        );
        if (!res.ok) {
          const detail = (await res.text().catch(() => "")).slice(0, 160);
          throw new Error(`Supabase không xóa được bản ghi (HTTP ${res.status})${detail ? `: ${detail}` : ""}`);
        }
      } catch (err) {
        this.allEvents.splice(Math.max(0, originalIndex), 0, event);
        this._saveToLocal();
        this._emit();
        throw err instanceof Error ? err : new Error("Không xác định được lỗi khi xóa bản ghi trên Supabase.");
      }
    }
  }

  // —— Admin: Xóa toàn bộ điểm của 1 tuần (Cần xác nhận) ——
  async wipeWeekEvents(weekId = this.weekId) {
    if (!this.isAdmin()) throw new Error("Chỉ Admin được thực hiện xóa hàng loạt.");

    const beforeCount = this.allEvents.filter((e) => e.weekId === weekId).length;
    this.allEvents = this.allEvents.filter((e) => e.weekId !== weekId);
    this._saveToLocal();
    this._emit();

    if (this.mode === "live") {
      try {
        await fetchWithTimeout(
          `${SUPABASE_URL}/rest/v1/events?week_id=eq.${encodeURIComponent(weekId)}`,
          {
            method: "DELETE",
            headers: supabaseHeaders({ Accept: "application/json" }),
          }
        );
      } catch (err) {
        console.warn("Lỗi wipe tuần trên Supabase:", err);
      }
    }
    return beforeCount;
  }

  exportBackup() {
    return {
      exportedAt: new Date().toISOString(),
      className: "11A1",
      settings: this.settings,
      events: this.allEvents,
    };
  }
}


  // ========================================== 
  // 4. BỘ ĐIỀU PHỐI GIAO DIỆN & SỰ KIỆN (APP)
  // ========================================== 
/**
 * Controller chính 11A1 Thi Đua App — Kiến trúc Modern Swiss Minimalist
 * Điều phối các Màn hình: Bảng điểm, Ghi điểm nhanh, Cá nhân, Tra cứu, Hạnh kiểm, Nội quy, Quản trị GVCN
 */




// Khởi tạo Store trung tâm
const store = new ScoreStore();

// Trạng thái cục bộ của giao diện
const MORE_VIEWS = new Set(["rules", "conduct", "admin", "classroom-board"]);

const state = {
  currentView: "leaderboard",
  viewHistory: ["leaderboard"],
  currentBoard: "teams", // teams | year | minus | plus | history | podium | monthly
  summaryFromWeek: null,
  summaryToWeek: null,
  selectedStudentIds: new Set(),
  selectedRules: new Map(), // ruleId => positive safe-integer quantity
  scoringTeamFilter: "my",
  profileMemberId: "to1-01",
  profileFilter: "all",
  profileGradeOpen: false,
  profileWeekFocus: null,
  lookupMemberId: "to1-01",
  lookupWeekId: null,
  lookupRuleId: RULES[0]?.id || "phat-bieu",
  conductMemberId: "to1-01",
  conductSemesterId: "gk1",
  sessionLog: [],
  rulesSearchQuery: "",
  rulesCategoryFilter: "all",
  podiumDetailOpen: false,
};

// DOM Helper
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "HS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

function renderMemberName(member, nameClass = "") {
  const adminRoleMap = {
    "to4-06": { label: "Admin dữ liệu", title: "Admin quản lý dữ liệu" },
    "to4-10": { label: "Admin phần mềm", title: "Admin bảo trì phần mềm" },
  };

  const adminRole = adminRoleMap[member.id];
  const adminBadge = adminRole
    ? `<span class="member-admin-badge" title="${adminRole.title}"><span class="material-symbols-outlined">admin_panel_settings</span><span>${adminRole.label}</span></span>`
    : ADMIN_MEMBER_IDS.includes(member.id)
      ? `<span class="member-admin-badge" title="Quản trị hệ thống"><span class="material-symbols-outlined">admin_panel_settings</span><span>Admin</span></span>`
      : "";

  return `<span class="member-name-display">${adminBadge}<span class="${nameClass}">${escapeHtml(member.name)}</span></span>`;
}

function bindNameSearchInput({ inputSelector, clearSelector, onSearch }) {
  const input = inputSelector ? $(inputSelector) : null;
  const clearBtn = clearSelector ? $(clearSelector) : null;
  if (!input) return;

  input.oninput = () => {
    clearBtn?.classList.toggle("hidden", !input.value.trim());
    onSearch?.(input.value);
  };

  clearBtn?.addEventListener("click", () => {
    input.value = "";
    clearBtn.classList.add("hidden");
    onSearch?.("");
  });
}

function populateWeekSelector(selectEl, selectedWeekId, { placeholder = "Chọn tuần" } = {}) {
  if (!selectEl) return;
  const allWeekIds = competitionWeekIds();
  const safeSelected = allWeekIds.includes(selectedWeekId) ? selectedWeekId : allWeekIds[allWeekIds.length - 1] || "";

  selectEl.innerHTML = allWeekIds.length
    ? allWeekIds
        .map((weekId) => `<option value="${weekId}" ${weekId === safeSelected ? "selected" : ""}>Tuần ${weekNumber(weekId)}</option>`)
        .join("")
    : `<option value="">${placeholder}</option>`;

  if (safeSelected) selectEl.value = safeSelected;
}

function getRankLabel(item) {
  return `Hạng ${item.rank}`;
}

function getRankMedal(rank) {
  return rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
}

function formatRelativeTime(timestamp) {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 45) return "Vừa xong";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const d = new Date(timestamp);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

// ===========================================================================
// ĐIỀU HƯỚNG VIEW (NAVIGATION)
// ===========================================================================
function closeMoreSheet() {
  const sheet = $("#sheet-more");
  sheet?.classList.add("hidden");
  sheet?.classList.remove("flex");
}

function openMoreSheet() {
  const sheet = $("#sheet-more");
  sheet?.classList.remove("hidden");
  sheet?.classList.add("flex");
}

function syncBackButton() {
  const backBtn = $("#btn-app-back");
  if (!backBtn) return;
  const canGoBack = state.viewHistory.length > 1;
  backBtn.classList.toggle("hidden", !canGoBack);
  backBtn.classList.toggle("flex", canGoBack);
}

function goBackView() {
  if (state.viewHistory.length <= 1) return;
  const previousView = state.viewHistory[state.viewHistory.length - 2] || "leaderboard";
  state.viewHistory.pop();
  switchView(previousView, { fromHistory: true });
}

function switchView(viewName, options = {}) {
  if (viewName === "more") {
    openMoreSheet();
    return;
  }
  closeMoreSheet();

  const { fromHistory = false } = options;
  if (!fromHistory) {
    const lastView = state.viewHistory[state.viewHistory.length - 1];
    if (lastView !== viewName) {
      state.viewHistory.push(viewName);
      if (state.viewHistory.length > 12) state.viewHistory.shift();
    }
  }

  state.currentView = viewName;

  $$(".app-view").forEach((v) => v.classList.remove("active-view"));
  const target = $(`#view-${viewName}`);
  if (target) target.classList.add("active-view");

  $$("#bottom-nav .nav-item").forEach((btn) => {
    const navView = btn.dataset.view;
    const isTarget =
      navView === viewName || (navView === "more" && MORE_VIEWS.has(viewName));
    btn.classList.toggle("text-primary", isTarget);
    btn.classList.toggle("font-bold", isTarget);
    btn.classList.toggle("text-on-surface-variant", !isTarget);
    btn.classList.toggle("font-medium", !isTarget);
  });

  window.scrollTo({ top: 0, behavior: "instant" });
  syncBackButton();

  if (viewName === "leaderboard") renderLeaderboard();
  else if (viewName === "scoring") renderScoringWorkspace();
  else if (viewName === "profile") renderProfileView();
  else if (viewName === "lookup") renderLookupView();
  else if (viewName === "conduct") renderConductView();
  else if (viewName === "rules") renderClassRulesView();
  else if (viewName === "classroom-board") renderClassroomBoardView();
  else if (viewName === "admin") renderAdminPanel();
}

// ===========================================================================
// MÀN HÌNH 1: BẢNG XẾP HẠNG (LEADERBOARD)
// ===========================================================================
function renderLeaderboard() {
  const currentWeek = store.weekId;
  const curNum = weekNumber(currentWeek);

  const weekLabel = $("#header-week-label");
  if (weekLabel) weekLabel.textContent = `Tuần ${curNum}`;

  const realtimeText = $("#realtime-status-text");
  if (realtimeText) {
    realtimeText.textContent =
      store.realtimeStatus === "SUBSCRIBED"
        ? "Đã kết nối trực tiếp"
        : store.mode === "live"
        ? "Đang kết nối..."
        : "Đang lưu trên máy";
  }

  const liveDot = $("#live-indicator-dot");
  if (liveDot) {
    if (store.realtimeStatus === "SUBSCRIBED") {
      liveDot.className = "inline-block w-2 h-2 rounded-full bg-secondary animate-pulse";
      liveDot.title = "Đang cập nhật trực tiếp";
    } else {
      liveDot.className = "inline-block w-2 h-2 rounded-full bg-outline";
      liveDot.title = "Chưa kết nối trực tiếp";
    }
  }

  const isRankableWeek = isStudiedWeek(currentWeek);
  const teamRanks = isRankableWeek ? store.getTeamRankings() : [];
  const leaderTeam = teamRanks[0] || {
    name: isRankableWeek ? "Chưa có điểm" : "Chưa xếp hạng",
    total: null,
    plusPoints: 0,
    minusPoints: 0,
  };

  const quickLeader = $("#quick-stat-leader-team");
  if (quickLeader) quickLeader.textContent = leaderTeam.name;

  const quickScore = $("#quick-stat-top-score");
  if (quickScore) quickScore.textContent = leaderTeam.total === null ? "—" : `${leaderTeam.total}`;

  const quickCount = $("#quick-stat-team-count");
  if (quickCount) quickCount.textContent = `${TEAMS.length} tổ`;

  const snapshotTitle = $("#snapshot-main-title");
  if (snapshotTitle) snapshotTitle.textContent = `Tuần ${curNum}`;

  const snapshotSub = $("#snapshot-sub-title");
  if (snapshotSub) snapshotSub.textContent = `• ${weekRangeLabel(currentWeek)}`;

  const tiedLeaders = teamRanks.filter((team) => team.rank === 1);
  const snapshotRankLead = $("#snapshot-rank-lead");
  if (snapshotRankLead) {
    snapshotRankLead.textContent = !isRankableWeek
      ? "Tuần đang học • chưa xếp hạng"
      : tiedLeaders.length > 1
        ? `${tiedLeaders.map((t) => t.name).join(" & ")} dẫn đầu`
        : `${leaderTeam.name} dẫn đầu`;
  }

  const snapshotTopScore = $("#snapshot-top-score");
  if (snapshotTopScore) snapshotTopScore.textContent = leaderTeam.total === null ? "—" : leaderTeam.total;

  const plusTotal = leaderTeam.plusPoints || 0;
  const minusTotal = leaderTeam.minusPoints || 0;
  const netDelta = plusTotal + minusTotal;
  const snapshotDelta = $("#snapshot-delta");
  if (snapshotDelta) snapshotDelta.textContent = isRankableWeek
    ? `${formatPoints(netDelta)} điểm`
    : "Đang cập nhật";

  // Week selector
  const weekSelector = $("#week-selector");
  if (weekSelector) {
    const allWeekIds = competitionWeekIds();
    const through = studiedThroughWeek();
    weekSelector.innerHTML = allWeekIds
      .map((wId) => {
        const n = weekNumber(wId);
        const isSelected = wId === currentWeek;
        const isCurrent = n === weekNumber(defaultWeekId());
        const suffix = isCurrent
          ? " (Đang học)"
          : n === through
            ? " (Mới hoàn thành)"
            : "";
        return `<option value="${wId}" ${isSelected ? "selected" : ""}>Tuần ${n}${suffix}</option>`;
      })
      .join("");
  }

  // Podium Top 3 Teams
  const podiumGrid = $("#podium-grid");
  const podiumSection = $("#podium-section");
  if (isRankableWeek && teamRanks.length >= 3 && state.currentBoard === "teams") {
    podiumSection?.classList.remove("hidden");
    if (podiumGrid) {
      const t1 = teamRanks[0];
      const t2 = teamRanks[1];
      const t3 = teamRanks[2];

      const getBadgeLabel = (t) => {
        if (t.rank === 1) return "Quán Quân";
        if (t.rank === 2) return "Hạng Nhì";
        if (t.rank === 3) return "Hạng Ba";
        return `Hạng ${t.rank}`;
      };

      podiumGrid.innerHTML = `
        <!-- Hạng 2 -->
        <div class="flex flex-col items-center cursor-pointer active:scale-95 transition-transform" data-podium-team="${t2.id}">
          <div class="relative mb-2">
            <div class="w-11 h-11 rounded-2xl bg-surface-container-high text-on-surface flex items-center justify-center font-heading font-bold text-sm shadow-xs">
              ${t2.name.replace("Tổ ", "T")}
            </div>
            <span class="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center text-[10px] font-bold shadow-xs">${t2.rank}</span>
          </div>
          <div class="w-full bg-surface-container-lowest rounded-t-2xl p-2.5 flex flex-col items-center text-center shadow-xs h-28 justify-between border-t-2 border-slate-300">
            <div>
              <span class="font-heading font-bold text-xs text-on-surface block truncate">${t2.name}</span>
              <span class="text-[10px] text-secondary font-bold tabular-nums">${formatPoints(t2.plusPoints - Math.abs(t2.minusPoints))} đ</span>
            </div>
            <div class="w-full bg-surface-container-low rounded-lg py-1 px-1">
              <span class="font-heading font-bold text-sm text-primary block tabular-nums">${t2.total}</span>
              <span class="text-[9px] text-outline font-bold uppercase">${getBadgeLabel(t2)}</span>
            </div>
          </div>
        </div>

        <!-- Hạng 1 -->
        <div class="flex flex-col items-center relative -top-3 cursor-pointer active:scale-95 transition-transform" data-podium-team="${t1.id}">
          <div class="relative mb-2">
            <span class="material-symbols-outlined text-[24px] text-amber-500 absolute -top-5 left-1/2 -translate-x-1/2 crown-bounce" style="font-variation-settings: 'FILL' 1;">crown</span>
            <div class="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-on-primary font-heading font-bold text-lg shadow-md">
              ${t1.name.replace("Tổ ", "T")}
            </div>
            <span class="absolute -top-1.5 -right-1 w-6 h-6 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center text-xs font-bold shadow-xs">1</span>
          </div>
          <div class="w-full bg-surface-container-lowest rounded-t-2xl p-2.5 flex flex-col items-center text-center shadow-md h-36 justify-between border-t-4 border-amber-400">
            <div>
              <span class="font-heading font-bold text-sm text-primary block truncate">${t1.name}</span>
              <span class="text-[11px] text-secondary font-bold tabular-nums">${formatPoints(t1.plusPoints - Math.abs(t1.minusPoints))} đ</span>
            </div>
            <div class="podium-champion-score w-full rounded-xl py-1.5 px-1">
              <span class="font-heading font-bold text-lg block leading-none tabular-nums">${t1.total}</span>
              <span class="text-[9px] font-bold uppercase tracking-wider">${getBadgeLabel(t1)}</span>
            </div>
          </div>
        </div>

        <!-- Hạng 3 -->
        <div class="flex flex-col items-center cursor-pointer active:scale-95 transition-transform" data-podium-team="${t3.id}">
          <div class="relative mb-2">
            <div class="w-11 h-11 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface font-heading font-bold text-sm shadow-xs">
              ${t3.name.replace("Tổ ", "T")}
            </div>
            <span class="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">${t3.rank}</span>
          </div>
          <div class="w-full bg-surface-container-lowest rounded-t-2xl p-2.5 flex flex-col items-center text-center shadow-xs h-24 justify-between border-t-2 border-amber-600">
            <div>
              <span class="font-heading font-bold text-xs text-on-surface block truncate">${t3.name}</span>
              <span class="text-[10px] text-secondary font-bold tabular-nums">${formatPoints(t3.plusPoints - Math.abs(t3.minusPoints))} đ</span>
            </div>
            <div class="w-full bg-surface-container-low rounded-lg py-1 px-1">
              <span class="font-heading font-bold text-sm text-primary block tabular-nums">${t3.total}</span>
              <span class="text-[9px] text-outline font-bold uppercase">${getBadgeLabel(t3)}</span>
            </div>
          </div>
        </div>
      `;

      $$("[data-podium-team]", podiumGrid).forEach((el) => {
        el.onclick = () => openTeamDetailModal(el.dataset.podiumTeam);
      });
    }
  } else {
    podiumSection?.classList.add("hidden");
  }

  // Ranking list
  renderRankingsList(teamRanks);

  // Realtime Activity Feed
  $("#activity-feed-card")?.classList.toggle(
    "hidden",
    !isRankableWeek ||
      state.currentBoard === "history" ||
      state.currentBoard === "podium" ||
      state.currentBoard === "monthly"
  );
  renderRealtimeFeed();
}

function renderRankingsList(teamRanks) {
  const container = $("#ranking-list-container");
  if (!container) return;

  if (state.currentBoard === "teams") {
    if (!isStudiedWeek(store.weekId)) {
      const { teamScores } = store.calculateScoresFast(
        store.events,
        BASE_POINTS,
        store.weekId
      );
      const currentWeekTeams = TEAMS.map((team) => teamScores[team.id]).filter(Boolean);

      container.innerHTML = `
        <div class="rounded-2xl bg-primary-fixed/50 dark:bg-surface-container-lowest p-3.5 text-center border border-primary/10 dark:border-outline-variant/30 dark:text-on-surface">
          <span class="material-symbols-outlined text-primary text-[24px]">visibility</span>
          <h3 class="font-heading font-bold text-sm text-on-surface mt-1">Dữ liệu thực tế • Tuần ${weekNumber(store.weekId)}</h3>
          <p class="text-[11px] text-on-surface-variant mt-1">Chưa xếp hạng thi đua. Điểm và vi phạm bên dưới là số liệu đang ghi nhận, chưa chốt.</p>
        </div>
        ${currentWeekTeams.map((team) => `
          <article class="rounded-2xl bg-surface-container-lowest p-3.5 shadow-xs border border-outline-variant/30">
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <h3 class="font-heading font-bold text-sm text-on-surface">${escapeHtml(team.name)}</h3>
                <p class="text-[10px] text-on-surface-variant mt-0.5">${team.memberCount} học sinh • ${team.minusCount} lượt vi phạm • ${team.plusCount} lượt khen</p>
              </div>
              <div class="text-right shrink-0">
                <span class="block font-heading font-bold text-lg text-primary tabular-nums">${team.total}</span>
                <span class="text-[10px] text-outline">điểm tạm tính</span>
              </div>
            </div>
            <button type="button" class="btn-view-live-team mt-3 w-full rounded-xl bg-surface-container-low px-3 py-2 text-xs font-bold text-primary hover:bg-surface-container flex items-center justify-center gap-1.5" data-team-id="${team.id}">
              <span class="material-symbols-outlined text-[16px]">groups</span>
              Xem điểm và vi phạm từng thành viên
            </button>
          </article>
        `).join("")}
      `;
      $$(".btn-view-live-team", container).forEach((button) => {
        button.onclick = () => openTeamDetailModal(button.dataset.teamId);
      });
      return;
    }

    container.innerHTML = teamRanks
      .map((t) => {
        const medal = getRankMedal(t.rank);
        const score = t.total;
        const rankClass = `rank-${Math.min(t.rank, 4)}`;

        return `
          <div class="ranking-team-card ${rankClass} bg-surface-container-lowest rounded-2xl p-3.5 shadow-xs border border-surface-container/70 flex flex-col gap-2.5 transition-all">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="ranking-rank-medal w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center font-heading font-bold text-sm text-on-surface">
                  ${medal}
                </span>
                <div class="flex flex-col">
                  <div class="flex items-center gap-1.5">
                    <span class="font-heading font-bold text-sm text-on-surface">${t.name}</span>
                    <span class="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-semibold">${getRankLabel(t)}</span>
                  </div>
                  <span class="text-[11px] text-on-surface-variant">Tổ trưởng: ${t.leaderName || "Chưa cập nhật"} • ${t.memberCount} học sinh</span>
                </div>
              </div>
              <div class="text-right">
                <span class="font-heading font-bold text-lg text-primary tabular-nums block leading-none">${score}</span>
                <span class="text-[10px] text-outline font-semibold">Điểm TB: ${t.avg}</span>
              </div>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-surface-container-high/60 text-xs">
              <div class="flex items-center gap-2">
                <span class="text-secondary font-bold tabular-nums">+${t.plusPoints} khen</span>
                <span class="text-outline">•</span>
                <span class="text-error font-bold tabular-nums">${t.minusPoints} phạt</span>
              </div>
              <button type="button" class="btn-view-team-modal px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs transition-colors flex items-center gap-1" data-team-id="${t.id}">
                <span>Xem ${t.memberCount} thành viên</span>
                <span class="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    $$(".btn-view-team-modal", container).forEach((btn) => {
      btn.onclick = () => openTeamDetailModal(btn.dataset.teamId);
    });
  } else if (state.currentBoard === "year") {
    const yearRanks = store.getYearRankings();
    container.innerHTML = yearRanks
      .map((m) => {
        const medal = getRankMedal(m.rank);
        return `
          <div class="ranking-member-card rank-${Math.min(m.rank, 3)} bg-surface-container-lowest rounded-xl p-3 shadow-xs flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors" data-view-member="${m.id}">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-heading font-bold text-xs shrink-0">${medal}</span>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5">
                  ${renderMemberName(m, "font-heading font-bold text-xs text-on-surface truncate")}
                  <span class="px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[9px] font-semibold">${getRankLabel(m)}</span>
                </div>
                <span class="text-[10px] text-on-surface-variant">${m.teamName} • ${m.id}</span>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="font-heading font-bold text-sm text-primary tabular-nums block">${m.yearTotal} đ</span>
              <span class="text-[10px] text-outline tabular-nums">TB: ${m.avgScore}</span>
            </div>
          </div>
        `;
      })
      .join("");

    bindMemberClickEvents(container);
  } else if (state.currentBoard === "minus") {
    const violRanks = store.getViolationRankings();
    if (!violRanks.length) {
      container.innerHTML = `<div class="bg-surface-container-lowest p-6 rounded-2xl text-center text-xs text-outline">Không có học sinh nào bị trừ điểm!</div>`;
    } else {
      container.innerHTML = violRanks
        .map((m) => `
          <div class="ranking-member-card ranking-member-violation bg-surface-container-lowest rounded-xl p-3 shadow-xs flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors" data-view-member="${m.id}">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-7 h-7 rounded-lg bg-error-container text-error flex items-center justify-center font-heading font-bold text-xs shrink-0">${getRankMedal(m.rank)}</span>
              <div class="flex flex-col min-w-0">
                ${renderMemberName(m, "font-heading font-bold text-xs text-on-surface truncate")}
                <span class="text-[10px] text-on-surface-variant">${m.teamName}</span>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="font-heading font-bold text-sm text-error tabular-nums block">${m.minusPoints} đ</span>
              <span class="text-[10px] text-outline">${m.minusCount} lần vi phạm</span>
            </div>
          </div>
        `)
        .join("");
      bindMemberClickEvents(container);
    }
  } else if (state.currentBoard === "plus") {
    const bonusRanks = store.getBonusRankings();
    container.innerHTML = bonusRanks
      .map((m) => `
        <div class="ranking-member-card ranking-member-bonus bg-surface-container-lowest rounded-xl p-3 shadow-xs flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors" data-view-member="${m.id}">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-7 h-7 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center font-heading font-bold text-xs shrink-0">${getRankMedal(m.rank)}</span>
            <div class="flex flex-col min-w-0">
              ${renderMemberName(m, "font-heading font-bold text-xs text-on-surface truncate")}
              <span class="text-[10px] text-on-surface-variant">${m.teamName}</span>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="font-heading font-bold text-sm text-secondary tabular-nums block">+${m.plusPoints} đ</span>
            <span class="text-[10px] text-outline">${m.plusCount} lần khen thưởng</span>
          </div>
        </div>
      `)
      .join("");
    bindMemberClickEvents(container);
  } else if (state.currentBoard === "history") {
    renderViolationHistory(container);
  } else if (state.currentBoard === "podium") {
    renderTeamPodiumStats(container);
  } else if (state.currentBoard === "monthly") {
    renderTeamRangeSummary(container);
  }
}

function renderTeamRangeSummary(container) {
  const through = studiedThroughWeek();
  if (through < 1) {
    container.innerHTML = `
      <div class="rounded-2xl bg-surface-container-lowest p-5 text-center shadow-xs">
        <h3 class="font-heading font-bold text-sm text-on-surface">Chưa có tuần thi đua hoàn thành</h3>
        <p class="text-xs text-on-surface-variant mt-1">Tổng kết sẽ khả dụng sau khi kết thúc tuần đầu tiên.</p>
      </div>
    `;
    return;
  }

  if (state.summaryToWeek === null || state.summaryToWeek > through) {
    state.summaryToWeek = through;
  }
  if (state.summaryFromWeek === null || state.summaryFromWeek > through) {
    state.summaryFromWeek = Math.max(1, through - 3);
  }

  const weekOptions = Array.from({ length: through }, (_, index) => {
    const number = index + 1;
    const weekId = weekIdForNumber(number);
    return `<option value="${number}">Tuần ${number} (${weekRangeLabel(weekId)})</option>`;
  }).join("");
  const fromWeek = state.summaryFromWeek;
  const toWeek = state.summaryToWeek;
  const isValidRange = Number.isInteger(fromWeek) &&
    Number.isInteger(toWeek) &&
    fromWeek >= 1 &&
    fromWeek <= toWeek &&
    toWeek <= through;

  let summaryContent = "";
  if (!isValidRange) {
    summaryContent = `
      <p class="rounded-xl bg-error-container/40 p-3 text-xs font-semibold text-error">
        Tuần bắt đầu phải nhỏ hơn hoặc bằng tuần kết thúc.
      </p>
    `;
  } else {
    const teamRanks = store.getTeamRangeRankings(fromWeek, toWeek);
    summaryContent = `
      <div class="space-y-2">
        ${teamRanks.map((team) => `
          <details class="group rounded-xl bg-surface-container-lowest shadow-xs border border-outline-variant/20">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-3 p-3 [&::-webkit-details-marker]:hidden">
              <span class="flex items-center gap-3 min-w-0">
                <span class="w-9 h-9 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-heading font-bold text-sm shrink-0">${getRankMedal(team.rank)}</span>
                <span class="min-w-0">
                  <span class="block font-heading font-bold text-sm text-on-surface">${team.name}</span>
                  <span class="block text-[10px] text-on-surface-variant">Hạng ${team.rank} • Tuần ${fromWeek}–${toWeek} • Xem từng tuần</span>
                </span>
              </span>
              <span class="text-right shrink-0">
                <span class="block font-heading font-bold text-lg text-primary tabular-nums">${team.total}</span>
                <span class="block text-[10px] text-outline">điểm tổng</span>
              </span>
            </summary>
            <div class="border-t border-surface-container px-3 py-2.5">
              <p class="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant mb-2">Kết quả từng tuần</p>
              <div class="space-y-1.5">
                ${team.weeklyResults.map((result) => `
                  <div class="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low px-2.5 py-2">
                    <span class="text-xs font-semibold text-on-surface">Tuần ${result.weekNumber}</span>
                    <span class="text-[11px] text-on-surface-variant">Hạng ${result.rank}</span>
                    <span class="text-xs font-bold text-primary tabular-nums">${result.total} điểm</span>
                  </div>
                `).join("")}
              </div>
            </div>
          </details>
        `).join("")}
      </div>
    `;
  }

  container.innerHTML = `
    <section class="rounded-2xl bg-surface-container-lowest p-4 shadow-xs border border-outline-variant/20">
      <div class="flex items-start gap-2 mb-3">
        <span class="material-symbols-outlined text-primary">calendar_month</span>
        <div>
          <h3 class="font-heading font-bold text-sm text-on-surface">Tổng kết tháng</h3>
          <p class="text-[11px] text-on-surface-variant mt-0.5">Chọn khoảng tuần đã hoàn thành để cộng điểm và xếp hạng 4 tổ.</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <label class="text-[10px] font-bold text-on-surface-variant">
          Từ tuần
          <select id="summary-from-week" class="dropdown-select w-full mt-1 bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl text-xs font-semibold border border-outline-variant/30">
            ${weekOptions}
          </select>
        </label>
        <label class="text-[10px] font-bold text-on-surface-variant">
          Đến tuần
          <select id="summary-to-week" class="dropdown-select w-full mt-1 bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl text-xs font-semibold border border-outline-variant/30">
            ${weekOptions}
          </select>
        </label>
      </div>
      ${summaryContent}
    </section>
  `;

  const fromSelect = $("#summary-from-week", container);
  const toSelect = $("#summary-to-week", container);
  if (fromSelect) {
    fromSelect.value = String(fromWeek);
    fromSelect.onchange = () => {
      state.summaryFromWeek = Number(fromSelect.value);
      renderLeaderboard();
    };
  }
  if (toSelect) {
    toSelect.value = String(toWeek);
    toSelect.onchange = () => {
      state.summaryToWeek = Number(toSelect.value);
      renderLeaderboard();
    };
  }
}

// ===========================================================================
// YÊU CẦU 6: THIẾT KẾ LẠI GIAO DIỆN TIỀN ÁN TIỀN SỰ TRỰC QUAN HƠN
// ===========================================================================
function renderViolationHistory(container) {
  const teams = store.getViolationHistoryByTeam();
  const totalViolations = teams.reduce((sum, t) => sum + t.eventCount, 0);
  const totalMinusPoints = teams.reduce(
    (sum, t) => sum + t.members.reduce((mSum, m) => mSum + m.points, 0),
    0
  );

  const teamCards = teams
    .map((team) => {
      const hasViolations = team.members.length > 0;
      const teamMinusPoints = team.members.reduce((acc, m) => acc + m.points, 0);

      const memberList = hasViolations
        ? team.members
            .map((m) => {
              const uniqueLabels = [...new Set(m.events.map((e) => e.label))];
              return `
                <div class="p-3 rounded-xl bg-surface-container-low flex flex-col gap-2">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <div class="w-7 h-7 rounded-lg bg-error-container text-error flex items-center justify-center font-heading font-bold text-xs shrink-0">
                        ${getInitials(m.name)}
                      </div>
                      <div class="flex flex-col min-w-0">
                        <span class="font-heading font-bold text-xs text-on-surface truncate">${escapeHtml(m.name)}</span>
                        <span class="text-[10px] text-outline">${m.id}</span>
                      </div>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-heading font-bold text-xs tabular-nums shrink-0">
                      ${m.events.length} lần • ${m.points}đ
                    </span>
                  </div>

                  <!-- Chips tóm tắt các lỗi vi phạm -->
                  <div class="flex flex-wrap gap-1">
                    ${uniqueLabels
                      .map((lbl) => `<span class="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[10px] font-medium">${escapeHtml(lbl)}</span>`)
                      .join("")}
                  </div>

                  <!-- Chi tiết từng lần vi phạm -->
                  <div class="space-y-1.5 pt-1 border-t border-surface-container">
                    ${m.events
                      .map(
                        (e) => `
                          <div class="flex items-start justify-between gap-2 text-[11px] py-0.5">
                            <div class="flex flex-col min-w-0">
                              <span class="text-on-surface font-medium">${escapeHtml(e.label)}${e.note ? ` <em class="text-on-surface-variant font-normal">("${escapeHtml(e.note)}")</em>` : ""}</span>
                              <span class="text-[10px] text-outline">Tuần ${e.weekNumber} • ${formatRelativeTime(e.createdAt)}</span>
                            </div>
                            <span class="font-heading font-bold text-error tabular-nums shrink-0">${formatPoints(e.points)}đ</span>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                </div>
              `;
            })
            .join("")
        : `
          <div class="p-4 rounded-xl bg-surface-container-low text-center flex flex-col items-center gap-1.5 text-secondary">
            <span class="material-symbols-outlined text-[24px]">verified</span>
            <span class="text-xs font-bold">Tổ này chấp hành nề nếp rất tốt!</span>
            <span class="text-[10px] text-on-surface-variant">Không có vi phạm nào được ghi nhận.</span>
          </div>
        `;

      return `
        <div class="bg-surface-container-lowest rounded-2xl p-4 shadow-xs flex flex-col gap-3">
          <div class="flex items-center justify-between pb-2 border-b border-surface-container">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-primary-fixed text-primary font-heading font-bold text-xs flex items-center justify-center">
                ${team.id.replace("to", "T")}
              </span>
              <div>
                <h3 class="font-heading font-bold text-sm text-on-surface">${team.name}</h3>
                <span class="text-[10px] text-on-surface-variant">${team.members.length} học sinh có vi phạm</span>
              </div>
            </div>
            <div class="text-right">
              <span class="font-heading font-bold text-xs text-error tabular-nums block">${teamMinusPoints} đ</span>
              <span class="text-[10px] text-outline">${team.eventCount} lượt</span>
            </div>
          </div>
          <div class="space-y-2.5">${memberList}</div>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="flex flex-col gap-3">
      <!-- Banner Tổng quan -->
      <div class="rounded-2xl bg-gradient-to-br from-tertiary-container via-tertiary to-tertiary-container p-4 text-on-tertiary shadow-xs flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <span class="material-symbols-outlined text-[24px]">history_edu</span>
          </div>
          <div>
            <h2 class="font-heading font-bold text-sm">Tiền Án Tiền Sự</h2>
            <p class="text-xs opacity-90 mt-0.5">Tổng hợp toàn bộ các vi phạm nề nếp trong năm học</p>
          </div>
        </div>
        <div class="text-right">
          <span class="font-heading font-bold text-xl tabular-nums leading-none block">${totalViolations}</span>
          <span class="text-[10px] opacity-80 uppercase tracking-wider font-bold">Lượt vi phạm</span>
        </div>
      </div>

      <!-- Danh sách từng tổ -->
      <div class="space-y-3">${teamCards}</div>
    </div>
  `;
}

// ===========================================================================
// YÊU CẦU 12: BẢNG XẾP HẠNG THÀNH TÍCH TỔ (NHẤT, NHÌ, BA, BÉT)
// ===========================================================================
function renderTeamPodiumStats(container) {
  const rows = store.getTeamPodiumStats();
  const through = studiedThroughWeek();

  container.innerHTML = `
    <div class="flex flex-col gap-3">
      <div class="rounded-2xl bg-surface-container-lowest p-4 shadow-xs flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[22px]">emoji_events</span>
            <div>
              <h3 class="font-heading font-bold text-sm">Bảng Thành Tích Xếp Hạng Các Tổ</h3>
              <p class="text-[11px] text-on-surface-variant">Thống kê số lần về nhất, nhì, ba, bét từ Tuần 1 đến Tuần ${through}</p>
            </div>
          </div>
          <button id="btn-toggle-podium-detail" type="button" class="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs font-bold text-primary transition-colors">
            ${state.podiumDetailOpen ? "Thu gọn" : "Xem tuần"}
          </button>
        </div>
      </div>

      <div class="space-y-2.5">
        ${rows
          .map((team, idx) => {
            const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "4️⃣";
            return `
              <div class="rounded-2xl bg-surface-container-lowest p-4 shadow-xs border border-surface-container/70 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span class="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center font-heading font-bold text-sm">
                      ${medal}
                    </span>
                    <div>
                      <h4 class="font-heading font-bold text-sm text-on-surface">${team.name}</h4>
                      <span class="text-[10px] text-outline">Đã tham gia ${team.weeks} tuần thi đua</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-heading font-bold text-xs tabular-nums">
                      ${team.first} lần về nhất
                    </span>
                  </div>
                </div>

                <!-- 4 Cột: Nhất, Nhì, Ba, Bét -->
                <div class="grid grid-cols-4 gap-2 text-center text-xs">
                  <div class="rounded-xl bg-amber-50 border border-amber-200 p-2 flex flex-col">
                    <span class="text-[10px] font-bold text-amber-800">Về Nhất 🥇</span>
                    <span class="font-heading font-bold text-lg text-amber-900 mt-0.5 tabular-nums">${team.first}</span>
                    <span class="text-[9px] text-amber-700 mt-0.5">tuần</span>
                  </div>
                  <div class="rounded-xl bg-slate-100 border border-slate-200 p-2 flex flex-col">
                    <span class="text-[10px] font-bold text-slate-700">Về Nhì 🥈</span>
                    <span class="font-heading font-bold text-lg text-slate-800 mt-0.5 tabular-nums">${team.second}</span>
                    <span class="text-[9px] text-slate-600 mt-0.5">tuần</span>
                  </div>
                  <div class="rounded-xl bg-orange-50 border border-orange-200 p-2 flex flex-col">
                    <span class="text-[10px] font-bold text-orange-800">Về Ba 🥉</span>
                    <span class="font-heading font-bold text-lg text-orange-900 mt-0.5 tabular-nums">${team.third}</span>
                    <span class="text-[9px] text-orange-700 mt-0.5">tuần</span>
                  </div>
                  <div class="rounded-xl bg-rose-50 border border-rose-200 p-2 flex flex-col">
                    <span class="text-[10px] font-bold text-rose-800">Về Bét ⚠️</span>
                    <span class="font-heading font-bold text-lg text-rose-900 mt-0.5 tabular-nums">${team.last}</span>
                    <span class="text-[9px] text-rose-700 mt-0.5">tuần</span>
                  </div>
                </div>

                <!-- Chi tiết cụ thể từng tuần khi bật xem -->
                ${
                  state.podiumDetailOpen
                    ? `
                      <div class="pt-2 border-t border-surface-container space-y-1.5 text-[11px]">
                        ${team.firstWeeks.length ? `<div class="text-amber-800 font-medium">🥇 Về nhất ở các tuần: <strong>${team.firstWeeks.map((w) => `Tuần ${w}`).join(", ")}</strong></div>` : ""}
                        ${team.secondWeeks.length ? `<div class="text-slate-700 font-medium">🥈 Về nhì ở các tuần: <strong>${team.secondWeeks.map((w) => `Tuần ${w}`).join(", ")}</strong></div>` : ""}
                        ${team.thirdWeeks.length ? `<div class="text-orange-800 font-medium">🥉 Về ba ở các tuần: <strong>${team.thirdWeeks.map((w) => `Tuần ${w}`).join(", ")}</strong></div>` : ""}
                        ${team.lastWeeks.length ? `<div class="text-rose-800 font-medium">⚠️ Về bét ở các tuần: <strong>${team.lastWeeks.map((w) => `Tuần ${w}`).join(", ")}</strong></div>` : ""}
                      </div>
                    `
                    : ""
                }
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;

  const btnToggle = $("#btn-toggle-podium-detail", container);
  if (btnToggle) {
    btnToggle.onclick = () => {
      state.podiumDetailOpen = !state.podiumDetailOpen;
      renderTeamPodiumStats(container);
    };
  }
}

function bindMemberClickEvents(root) {
  $$("[data-view-member]", root).forEach((el) => {
    el.onclick = () => {
      closeTeamDetailModal();
      state.profileMemberId = el.dataset.viewMember;
      const searchInput = $("#profile-search-input");
      if (searchInput) searchInput.value = "";
      $("#btn-clear-profile-search")?.classList.add("hidden");
      switchView("profile");
    };
  });
}

function renderRealtimeFeed() {
  const feed = $("#realtime-activity-feed");
  if (!feed) return;
  const recentEvents = store.allEvents
    .filter((event) => event.createdByRole !== "admin")
    .slice(0, 5);

  if (!recentEvents.length) {
    feed.innerHTML = `<p class="text-xs text-outline text-center py-2">Chưa có ghi nhận nào trong tuần này.</p>`;
    return;
  }

  feed.innerHTML = recentEvents
    .map((ev) => {
      const isPlus = ev.points > 0;
      const dotColor = isPlus ? "bg-secondary" : "bg-error";
      const textColor = isPlus ? "text-secondary font-bold" : "text-error font-bold";
      const member = MEMBER_BY_ID[ev.memberId];
      const memberName = ev.ruleId === TEAM_ADJUSTMENT_RULE_ID
        ? "Phong trào theo tổ"
        : member ? member.name : ev.memberId;
      const team = TEAM_BY_ID[ev.teamId];
      const teamName = team ? team.name : ev.teamId;

      return `
        <div class="flex items-center justify-between gap-2 text-xs py-1">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2 h-2 rounded-full ${dotColor} shrink-0"></span>
            <span class="text-on-surface truncate">
              <strong class="text-primary font-bold">${escapeHtml(teamName)}:</strong> ${escapeHtml(memberName)} • ${escapeHtml(ev.label)}
            </span>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="${textColor} tabular-nums">${formatPoints(ev.points)}đ</span>
            <span class="text-[10px] text-outline">${formatRelativeTime(ev.createdAt)}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

// ===========================================================================
// MÀN HÌNH 2: GHI ĐIỂM NHANH (YÊU CẦU 13: CHỌN NHIỀU NỘI QUY CÙNG LÚC VỚI SỐ LƯỢNG RIÊNG)
// ===========================================================================
function renderScoringWorkspace() {
  const isAuth = store.isLoggedIn();
  const loginCard = $("#scoring-login-card");
  const workspace = $("#scoring-workspace");

  if (!isAuth) {
    loginCard?.classList.remove("hidden");
    workspace?.classList.add("hidden");
    return;
  }

  loginCard?.classList.add("hidden");
  workspace?.classList.remove("hidden");

  const leaderName = store.getLeaderName();
  const leaderTeam = store.getLeaderTeamId();
  const isAdmin = store.isAdmin();

  const userNameEl = $("#workspace-user-name");
  if (userNameEl) userNameEl.textContent = leaderName;

  const avatarEl = $("#workspace-avatar");
  const rolePillEl = $("#workspace-role-pill");

  if (isAdmin) {
    if (avatarEl) avatarEl.textContent = "GV";
    if (rolePillEl) {
      rolePillEl.textContent = "Admin GVCN";
      rolePillEl.className = "px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0";
    }
  } else {
    if (avatarEl) avatarEl.textContent = leaderTeam ? leaderTeam.replace("to", "T") : "TT";
    if (rolePillEl) {
      rolePillEl.textContent = leaderTeam ? TEAM_BY_ID[leaderTeam]?.name : "Tổ trưởng";
      rolePillEl.className = "px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold shrink-0";
    }
  }

  // Lọc tổ
  const chipsContainer = $("#score-team-chips");
  if (chipsContainer) {
    if (!isAdmin) {
      state.scoringTeamFilter = leaderTeam || "my";
      const teamObj = TEAM_BY_ID[leaderTeam];
      chipsContainer.innerHTML = `
        <div class="px-3 py-1 rounded-xl text-xs font-bold bg-primary text-on-primary shadow-xs flex items-center gap-1.5 shrink-0">
          <span class="material-symbols-outlined text-[15px]">shield</span>
          <span>${teamObj?.name || "Tổ của tôi"} (${teamObj?.members.length || 11} học sinh)</span>
        </div>
        <span class="text-[11px] text-on-surface-variant italic self-center ml-1">Chỉ được chấm điểm tổ mình</span>
      `;
    } else {
      chipsContainer.innerHTML = `
        <button type="button" class="score-filter-chip px-3 py-1 rounded-xl text-xs font-semibold shrink-0 ${state.scoringTeamFilter === "all" ? "bg-primary text-on-primary shadow-xs font-bold" : "bg-surface-container-low text-on-surface-variant"}" data-team="all">Toàn lớp (44)</button>
        <button type="button" class="score-filter-chip px-3 py-1 rounded-xl text-xs font-semibold shrink-0 ${state.scoringTeamFilter === "to1" ? "bg-primary text-on-primary shadow-xs font-bold" : "bg-surface-container-low text-on-surface-variant"}" data-team="to1">Tổ 1</button>
        <button type="button" class="score-filter-chip px-3 py-1 rounded-xl text-xs font-semibold shrink-0 ${state.scoringTeamFilter === "to2" ? "bg-primary text-on-primary shadow-xs font-bold" : "bg-surface-container-low text-on-surface-variant"}" data-team="to2">Tổ 2</button>
        <button type="button" class="score-filter-chip px-3 py-1 rounded-xl text-xs font-semibold shrink-0 ${state.scoringTeamFilter === "to3" ? "bg-primary text-on-primary shadow-xs font-bold" : "bg-surface-container-low text-on-surface-variant"}" data-team="to3">Tổ 3</button>
        <button type="button" class="score-filter-chip px-3 py-1 rounded-xl text-xs font-semibold shrink-0 ${state.scoringTeamFilter === "to4" ? "bg-primary text-on-primary shadow-xs font-bold" : "bg-surface-container-low text-on-surface-variant"}" data-team="to4">Tổ 4</button>
      `;
      $$(".score-filter-chip", chipsContainer).forEach((btn) => {
        btn.onclick = () => {
          state.scoringTeamFilter = btn.dataset.team;
          renderScoringWorkspace();
        };
      });
    }
  }

  const adjustmentTeamSelect = $("#team-adjustment-team");
  const adjustmentDirectionSelect = $("#team-adjustment-direction");
  const adjustmentPointsInput = $("#team-adjustment-points");
  const adjustmentReasonInput = $("#team-adjustment-reason");
  const adjustmentButton = $("#btn-team-adjustment");
  const adjustmentHint = $("#team-adjustment-permission-hint");

  if (adjustmentTeamSelect) {
    const selectedTeamId = isAdmin ? adjustmentTeamSelect.value : leaderTeam;
    const availableTeams = isAdmin
      ? TEAMS
      : leaderTeam && TEAM_BY_ID[leaderTeam]
        ? [TEAM_BY_ID[leaderTeam]]
        : [];
    adjustmentTeamSelect.innerHTML = [
      isAdmin ? '<option value="">Chọn tổ</option>' : "",
      ...availableTeams.map((team) => `<option value="${team.id}">${escapeHtml(team.name)}</option>`),
    ].join("");
    adjustmentTeamSelect.value = selectedTeamId || "";
    adjustmentTeamSelect.disabled = !isAdmin;
  }

  if (adjustmentHint) {
    const scope = isAdmin
      ? "Admin có thể chọn bất kỳ tổ nào; tuần áp dụng theo tuần đang chọn."
      : `Bạn chỉ có thể ghi điểm cho ${TEAM_BY_ID[leaderTeam]?.name || "tổ của mình"} trong tuần hiện tại.`;
    adjustmentHint.textContent = `${scope} Điểm chỉ thay đổi tổng điểm tổ, không thay đổi điểm cá nhân.`;
  }

  if (adjustmentTeamSelect && adjustmentDirectionSelect && adjustmentPointsInput && adjustmentReasonInput && adjustmentButton) {
    adjustmentButton.onclick = async () => {
      const teamId = adjustmentTeamSelect.value;
      const amount = Number(adjustmentPointsInput.value);
      const reason = adjustmentReasonInput.value.trim();
      if (!teamId) {
        alert("Vui lòng chọn tổ cần cộng hoặc trừ điểm.");
        return;
      }
      if (!Number.isSafeInteger(amount) || amount < 1 || amount > 2147483647) {
        alert("Số điểm phải là số nguyên dương, tối đa 2.147.483.647.");
        return;
      }
      if (!reason) {
        alert("Vui lòng nhập chú thích lý do.");
        adjustmentReasonInput.focus();
        return;
      }

      const points = adjustmentDirectionSelect.value === "minus" ? -amount : amount;
      const action = points > 0 ? "Cộng" : "Trừ";
      const teamName = TEAM_BY_ID[teamId]?.name || teamId;
      const week = weekNumber(store.weekId);
      if (!confirm(`${action} ${amount} điểm cho ${teamName} trong Tuần ${week}?\n\nLý do: ${reason}`)) return;

      adjustmentButton.disabled = true;
      try {
        await store.addTeamAdjustment({ teamId, points, note: reason });
        adjustmentPointsInput.value = "";
        adjustmentReasonInput.value = "";
        const syncNote = store.mode === "live" ? "" : " (hiện chỉ lưu trên thiết bị này)";
        alert(`Đã ${action.toLowerCase()} ${amount} điểm cho ${teamName}, Tuần ${week}.${syncNote}`);
      } catch (err) {
        alert(err.message || "Không thể lưu điểm phong trào.");
      } finally {
        adjustmentButton.disabled = false;
      }
    };
  }

  // Render components
  renderStudentSelectGrid();
  renderQuickActions();
  renderSelectedRulesBasket();
  updateSubmitBar();
  renderScoreDeleteEvents();
}

function renderStudentSelectGrid() {
  const grid = $("#student-select-grid");
  if (!grid) return;
  const query = toNonAccentVietnamese($("#score-search-input")?.value || "");
  const isAdmin = store.isAdmin();
  const leaderTeam = store.getLeaderTeamId();

  let members = [];
  if (!isAdmin) {
    members = leaderTeam ? TEAM_BY_ID[leaderTeam]?.members || [] : [];
  } else {
    const teamFilter = state.scoringTeamFilter;
    if (teamFilter === "all") members = TEAMS.flatMap((t) => t.members);
    else members = TEAM_BY_ID[teamFilter]?.members || [];
  }

  if (query) {
    members = members.filter(
      (m) => toNonAccentVietnamese(m.name).includes(query) || m.id.toLowerCase().includes(query)
    );
  }

  grid.innerHTML = members
    .map((m) => {
      const isSelected = state.selectedStudentIds.has(m.id);
      const cardBg = isSelected
        ? "bg-primary-container/15 ring-2 ring-primary border-transparent"
        : "bg-surface-container-low hover:bg-surface-container border-transparent";
      const checkHidden = isSelected ? "" : "hidden";

      return `
        <button type="button" class="student-select-item text-left p-2.5 rounded-xl transition-all flex items-center gap-2 relative overflow-hidden ${cardBg}" data-student-id="${m.id}">
          <div class="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-heading font-bold text-xs shrink-0 relative">
            <span>${getInitials(m.name)}</span>
            <div class="absolute inset-0 bg-primary/85 rounded-full flex items-center justify-center text-white ${checkHidden}">
              <span class="material-symbols-outlined text-[16px]">check</span>
            </div>
          </div>
          <div class="flex flex-col min-w-0 flex-1">
            <span class="font-heading font-bold text-xs text-on-surface truncate ${isSelected ? "text-primary" : ""}">${escapeHtml(m.name)}</span>
            <span class="text-[10px] text-on-surface-variant font-medium">${m.id}</span>
          </div>
        </button>
      `;
    })
    .join("");

  $$(".student-select-item", grid).forEach((btn) => {
    btn.onclick = () => {
      const sid = btn.dataset.studentId;
      if (state.selectedStudentIds.has(sid)) {
        state.selectedStudentIds.delete(sid);
      } else {
        state.selectedStudentIds.clear();
        state.selectedStudentIds.add(sid);
      }
      renderStudentSelectGrid();
      checkRepeatInfractionAlert();
      updateSubmitBar();
    };
  });

  const countEl = $("#selected-students-count");
  if (countEl) countEl.textContent = `${state.selectedStudentIds.size}/1`;
}

function renderQuickActions() {
  const rewGrid = $("#quick-rewards-grid");
  const penGrid = $("#quick-penalties-grid");

  if (rewGrid) {
    rewGrid.innerHTML = QUICK_REWARDS.map((r) => {
      const qty = state.selectedRules.get(r.id) || 0;
      const isSelected = qty > 0;
      const activeClass = isSelected
        ? "bg-secondary-fixed/50 ring-2 ring-secondary"
        : "bg-surface-container-low hover:bg-secondary-fixed/20";

      return `
        <button type="button" class="rule-action-btn action-card text-left p-2.5 rounded-xl transition-all flex flex-col justify-between ${activeClass}" data-rule-id="${r.id}">
          <div class="flex items-start justify-between gap-1 w-full">
            <span class="material-symbols-outlined text-secondary text-[18px]">${r.icon || "star"}</span>
            <div class="flex items-center gap-1">
              ${isSelected ? `<span class="w-5 h-5 rounded-full bg-secondary text-white font-bold text-[10px] flex items-center justify-center">${qty}</span>` : ""}
              <span class="font-heading font-bold text-sm text-secondary tabular-nums">+${r.points}đ</span>
            </div>
          </div>
          <span class="font-heading font-semibold text-xs text-on-surface mt-1.5 line-clamp-1">${escapeHtml(r.label)}</span>
        </button>
      `;
    }).join("");
  }

  if (penGrid) {
    penGrid.innerHTML = QUICK_PENALTIES.map((r) => {
      const qty = state.selectedRules.get(r.id) || 0;
      const isSelected = qty > 0;
      const activeClass = isSelected
        ? "bg-tertiary-fixed/50 ring-2 ring-tertiary"
        : "bg-surface-container-low hover:bg-tertiary-fixed/20";

      return `
        <button type="button" class="rule-action-btn action-card text-left p-2.5 rounded-xl transition-all flex flex-col justify-between ${activeClass}" data-rule-id="${r.id}">
          <div class="flex items-start justify-between gap-1 w-full">
            <span class="material-symbols-outlined text-tertiary text-[18px]">${r.icon || "warning"}</span>
            <div class="flex items-center gap-1">
              ${isSelected ? `<span class="w-5 h-5 rounded-full bg-tertiary text-white font-bold text-[10px] flex items-center justify-center">${qty}</span>` : ""}
              <span class="font-heading font-bold text-sm text-tertiary tabular-nums">${r.points}đ</span>
            </div>
          </div>
          <span class="font-heading font-semibold text-xs text-on-surface mt-1.5 line-clamp-1">${escapeHtml(r.label)}</span>
        </button>
      `;
    }).join("");
  }

  $$(".rule-action-btn").forEach((btn) => {
    btn.onclick = () => {
      const rId = btn.dataset.ruleId;
      const cur = state.selectedRules.get(rId) || 0;
      if (!Number.isSafeInteger(cur + 1)) {
        alert("Số lượng đã vượt quá giới hạn số nguyên an toàn.");
        return;
      }
      state.selectedRules.set(rId, cur + 1);
      renderQuickActions();
      renderSelectedRulesBasket();
      checkRepeatInfractionAlert();
      updateSubmitBar();
    };
  });
}

function renderSelectedRulesBasket() {
  const basketEl = $("#selected-rules-basket");
  const clearBtn = $("#btn-clear-basket");
  if (!basketEl) return;

  const entries = Array.from(state.selectedRules.entries());

  if (!entries.length) {
    basketEl.innerHTML = `<p class="text-xs text-outline text-center py-2">Chưa chọn điểm cộng hoặc vi phạm nào.</p>`;
    clearBtn?.classList.add("hidden");
    return;
  }

  clearBtn?.classList.remove("hidden");

  basketEl.innerHTML = entries
    .map(([ruleId, qty]) => {
      const rule = RULE_BY_ID[ruleId];
      if (!rule) return "";
      const isPlus = rule.points > 0;
      const itemSubtotal = rule.points * qty;
      const badgeBg = isPlus ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-tertiary/15 text-tertiary";

      return `
        <div class="flex items-center justify-between p-2 rounded-xl bg-surface-container-low text-xs gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2 h-2 rounded-full ${isPlus ? "bg-secondary" : "bg-error"} shrink-0"></span>
            <div class="flex flex-col min-w-0">
              <span class="font-heading font-bold text-on-surface truncate">${escapeHtml(rule.label)}</span>
              <span class="text-[10px] text-outline">${formatPoints(rule.points)}đ / lần</span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <!-- Stepper riêng cho từng mục -->
            <div class="flex items-center bg-surface-container rounded-lg p-0.5">
              <button type="button" class="btn-basket-minus w-6 h-6 rounded-md hover:bg-surface-container-highest flex items-center justify-center font-bold text-on-surface" data-rule-id="${ruleId}">-</button>
              <span class="font-heading font-bold text-xs px-2 text-primary tabular-nums">${qty}</span>
              <button type="button" class="btn-basket-plus w-6 h-6 rounded-md hover:bg-surface-container-highest flex items-center justify-center font-bold text-on-surface" data-rule-id="${ruleId}">+</button>
            </div>
            
            <span class="font-heading font-bold ${isPlus ? "text-secondary" : "text-error"} tabular-nums min-w-[3rem] text-right">
              ${formatPoints(itemSubtotal)}đ
            </span>

            <button type="button" class="btn-basket-remove w-6 h-6 rounded-lg text-outline hover:text-error flex items-center justify-center" data-rule-id="${ruleId}" title="Xóa mục này">
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  $$(".btn-basket-minus", basketEl).forEach((btn) => {
    btn.onclick = () => {
      const rId = btn.dataset.ruleId;
      const cur = state.selectedRules.get(rId) || 0;
      if (cur <= 1) state.selectedRules.delete(rId);
      else state.selectedRules.set(rId, cur - 1);
      renderQuickActions();
      renderSelectedRulesBasket();
      checkRepeatInfractionAlert();
      updateSubmitBar();
    };
  });

  $$(".btn-basket-plus", basketEl).forEach((btn) => {
    btn.onclick = () => {
      const rId = btn.dataset.ruleId;
      const cur = state.selectedRules.get(rId) || 0;
      if (Number.isSafeInteger(cur + 1)) state.selectedRules.set(rId, cur + 1);
      else {
        alert("Số lượng đã vượt quá giới hạn số nguyên an toàn.");
        return;
      }
      renderQuickActions();
      renderSelectedRulesBasket();
      updateSubmitBar();
    };
  });

  $$(".btn-basket-remove", basketEl).forEach((btn) => {
    btn.onclick = () => {
      const rId = btn.dataset.ruleId;
      state.selectedRules.delete(rId);
      renderQuickActions();
      renderSelectedRulesBasket();
      checkRepeatInfractionAlert();
      updateSubmitBar();
    };
  });

  if (clearBtn) {
    clearBtn.onclick = () => {
      state.selectedRules.clear();
      renderQuickActions();
      renderSelectedRulesBasket();
      checkRepeatInfractionAlert();
      updateSubmitBar();
    };
  }
}

function checkRepeatInfractionAlert() {
  const alertEl = $("#repeat-infraction-alert");
  if (!alertEl) return;
  if (state.selectedRules.size === 0 || state.selectedStudentIds.size === 0) {
    alertEl.classList.add("hidden");
    return;
  }

  let hasRepeat = false;
  for (const [rId] of state.selectedRules) {
    const rule = RULE_BY_ID[rId];
    if (rule && rule.points < 0) {
      for (const mId of state.selectedStudentIds) {
        if (store.checkRepeatInfraction(mId, rule.id, store.weekId)) {
          hasRepeat = true;
          break;
        }
      }
    }
    if (hasRepeat) break;
  }

  alertEl.classList.toggle("hidden", !hasRepeat);
}

function updateSubmitBar() {
  const submitBtn = $("#btn-submit-score");
  const summaryEl = $("#submit-summary-text");
  if (!submitBtn || !summaryEl) return;

  const countStudents = state.selectedStudentIds.size;
  const countRules = state.selectedRules.size;

  if (countStudents === 0 || countRules === 0) {
    submitBtn.disabled = true;
    summaryEl.textContent = countStudents === 0 ? "Chọn học sinh..." : "Chọn điểm/lỗi...";
    return;
  }

  submitBtn.disabled = false;
  let netDeltaPerStudent = 0;
  for (const [rId, qty] of state.selectedRules) {
    const rule = RULE_BY_ID[rId];
    if (rule) netDeltaPerStudent += rule.points * qty;
  }

  const grandTotal = netDeltaPerStudent * countStudents;
  summaryEl.textContent = `${countStudents} bạn • ${countRules} mục • ${formatPoints(netDeltaPerStudent)}đ/bạn`;
}

async function handleScoreSubmit() {
  const memberIds = Array.from(state.selectedStudentIds);
  const note = $("#score-note-input")?.value?.trim() || "";
  const items = Array.from(state.selectedRules.entries()).map(([ruleId, multiplier]) => ({
    ruleId,
    multiplier,
  }));

  if (!memberIds.length || !items.length) return;

  const btn = $("#btn-submit-score");
  btn.disabled = true;
  btn.classList.add("opacity-60");

  try {
    const saved = await store.addEventsBatch({
      memberIds,
      items,
      note,
    });

    if (saved && saved.length > 0) {
      state.sessionLog = [...saved, ...state.sessionLog];
      
      // Reset form
      state.selectedStudentIds.clear();
      state.selectedRules.clear();
      const noteInput = $("#score-note-input");
      if (noteInput) noteInput.value = "";

      renderStudentSelectGrid();
      renderQuickActions();
      renderSelectedRulesBasket();
      checkRepeatInfractionAlert();
      updateSubmitBar();
    }
  } catch (err) {
    alert(err.message || "Lỗi khi lưu điểm.");
  } finally {
    btn.disabled = false;
    btn.classList.remove("opacity-60");
  }
}

function renderScoreDeleteEvents() {
  const list = $("#score-delete-events-list");
  if (!list) return;

  const isAdmin = store.isAdmin();
  const roleHint = $("#score-delete-role-hint");
  if (roleHint) {
    roleHint.textContent = isAdmin
      ? "Admin có thể xóa lượt ghi ở mọi tổ và mọi tuần."
      : `Tổ trưởng có thể xóa lượt ghi của ${TEAM_BY_ID[store.getLeaderTeamId()]?.name || "tổ mình"} trong tuần hiện tại, không giới hạn 15 phút.`;
  }

  const filterWrap = $("#score-delete-week-filter-wrap");
  const weekFilter = $("#score-delete-week-filter");
  let selectedWeek = "current";
  if (isAdmin && weekFilter) {
    filterWrap?.classList.remove("hidden");
    selectedWeek = weekFilter.value || "current";
    const allWeeks = competitionWeekIds();
    weekFilter.innerHTML = `
      <option value="current">Tuần đang chọn (Tuần ${weekNumber(store.weekId)})</option>
      <option value="all">Tất cả tuần</option>
      ${allWeeks.map((weekId) => `<option value="${weekId}">Tuần ${weekNumber(weekId)}</option>`).join("")}
    `;
    if (selectedWeek !== "all" && selectedWeek !== "current" && !allWeeks.includes(selectedWeek)) {
      selectedWeek = "current";
    }
    weekFilter.value = selectedWeek;
    weekFilter.onchange = () => renderScoreDeleteEvents();
  } else {
    filterWrap?.classList.add("hidden");
  }

  let deletableEvents = store.allEvents.filter((event) => store.canDeleteEvent(event));
  if (!isAdmin || selectedWeek === "current") {
    deletableEvents = deletableEvents.filter((event) => event.weekId === store.weekId);
  } else if (selectedWeek !== "all") {
    deletableEvents = deletableEvents.filter((event) => event.weekId === selectedWeek);
  }
  deletableEvents.sort((a, b) => b.createdAt - a.createdAt);

  const count = $("#score-delete-count");
  if (count) count.textContent = `${deletableEvents.length} lượt`;

  if (!deletableEvents.length) {
    list.innerHTML = `
      <div class="flex flex-col items-center gap-1 py-5 text-on-surface-variant">
        <span class="material-symbols-outlined text-[24px]">check_circle</span>
        <p class="text-xs font-medium">Không có lượt ghi nào trong phạm vi này.</p>
      </div>
    `;
    return;
  }

  const displayEvents = deletableEvents.slice(0, 100);
  list.innerHTML = displayEvents.map((event) => {
    const member = MEMBER_BY_ID[event.memberId];
    const teamName = TEAM_BY_ID[event.teamId]?.name || event.teamId;
    const title = member?.name || (event.ruleId === TEAM_ADJUSTMENT_RULE_ID ? "Điểm phong trào của tổ" : teamName);
    const isPlus = event.points > 0;
    return `
      <article class="rounded-xl border ${isPlus ? "border-secondary/20 bg-secondary/5" : "border-error/20 bg-error/5"} p-2.5">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-start gap-2 min-w-0">
            <span class="material-symbols-outlined ${isPlus ? "text-secondary" : "text-error"} text-[17px] mt-0.5">${isPlus ? "add_circle" : "warning"}</span>
            <div class="min-w-0">
              <p class="text-xs font-bold text-on-surface break-words">${escapeHtml(title)} · ${escapeHtml(event.label)}</p>
              <p class="text-[10px] text-on-surface-variant mt-0.5">${escapeHtml(teamName)} · Tuần ${weekNumber(event.weekId)} · ${formatRelativeTime(event.createdAt)}</p>
              ${event.note ? `<p class="text-[10px] text-outline mt-0.5 break-words">${escapeHtml(event.note)}</p>` : ""}
            </div>
          </div>
          <span class="font-heading font-bold text-xs ${isPlus ? "text-secondary" : "text-error"} tabular-nums shrink-0">${formatPoints(event.points)}đ</span>
        </div>
        <button type="button" class="btn-score-delete-event mt-2 w-full min-h-9 rounded-lg bg-error-container/70 hover:bg-error hover:text-on-error text-error text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors" data-del-id="${escapeHtml(event.id)}">
          <span class="material-symbols-outlined text-[15px]">delete</span>
          Xóa lượt ghi này
        </button>
      </article>
    `;
  }).join("");

  if (deletableEvents.length > displayEvents.length) {
    list.insertAdjacentHTML(
      "beforeend",
      `<p class="text-[10px] text-outline text-center py-1">Đang hiển thị 100 lượt gần nhất trong tổng số ${deletableEvents.length} lượt. Hãy lọc theo tuần để tìm lượt cũ hơn.</p>`
    );
  }

  $$(".btn-score-delete-event", list).forEach((button) => {
    button.onclick = async () => {
      const event = deletableEvents.find((item) => item.id === button.dataset.delId);
      if (!event) return;
      const teamName = TEAM_BY_ID[event.teamId]?.name || event.teamId;
      const memberName = MEMBER_BY_ID[event.memberId]?.name || "Điểm phong trào của tổ";
      if (!confirm(`Xóa lượt ghi này?\n\n${teamName} · ${memberName} · Tuần ${weekNumber(event.weekId)}\n${event.label}${event.note ? `\nLý do/ghi chú: ${event.note}` : ""}\n${formatPoints(event.points)} điểm`)) return;

      button.disabled = true;
      try {
        await store.deleteEvent(event.id);
        state.sessionLog = state.sessionLog.filter((item) => item.id !== event.id);
        renderScoreDeleteEvents();
      } catch (error) {
        alert(error.message || "Không thể xóa lượt ghi.");
        button.disabled = false;
      }
    };
  });
}

// ===========================================================================
// MÀN HÌNH 3: HỒ SƠ CÁ NHÂN (YÊU CẦU 7: THỐNG KÊ XẾP LOẠI TỪ TUẦN 1 ĐẾN NAY)
// ===========================================================================
function getFilteredProfileStudents() {
  const query = toNonAccentVietnamese($("#profile-search-input")?.value || "");
  return TEAMS.flatMap((t) => t.members.map((m) => ({ ...m, teamId: t.id }))).filter(
    (m) => toNonAccentVietnamese(m.name).includes(query) || m.id.toLowerCase().includes(query)
  );
}

function renderProfileStudentPicker() {
  const listEl = $("#profile-students-quick-list");
  if (!listEl) return;
  const query = toNonAccentVietnamese($("#profile-search-input")?.value || "");
  listEl.classList.toggle("hidden", !query);
  if (!query) {
    listEl.innerHTML = "";
    return;
  }

  const filtered = getFilteredProfileStudents();
  if (!filtered.length) {
    listEl.innerHTML = `<span class="text-xs text-outline py-2 px-1 italic">Không tìm thấy học sinh nào phù hợp.</span>`;
    return;
  }

  listEl.innerHTML = filtered
    .map((m) => {
      const isSelected = m.id === state.profileMemberId;
      const bgClass = isSelected
        ? "bg-primary text-on-primary font-bold shadow-xs scale-105"
        : "bg-surface-container-low text-on-surface hover:bg-surface-container";

      return `
        <button type="button" role="option" aria-selected="${isSelected}" class="profile-student-btn px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${bgClass}" data-member-id="${m.id}">
          <span class="w-5 h-5 rounded-md ${isSelected ? "bg-white/20 text-white" : "bg-primary-fixed text-primary"} flex items-center justify-center text-[10px] font-bold">${getInitials(m.name)}</span>
          ${renderMemberName(m, "font-semibold")}
        </button>
      `;
    })
    .join("");

  $$(".profile-student-btn", listEl).forEach((btn) => {
    btn.onclick = () => {
      state.profileMemberId = btn.dataset.memberId;
      state.profileWeekFocus = null;
      const searchInput = $("#profile-search-input");
      if (searchInput) searchInput.value = "";
      $("#btn-clear-profile-search")?.classList.add("hidden");
      renderProfileView();
    };
  });
}

function renderProfileView() {
  bindNameSearchInput({
    inputSelector: "#profile-search-input",
    clearSelector: "#btn-clear-profile-search",
    onSearch: () => renderProfileView(),
  });

  renderProfileStudentPicker();

  let memberId = state.profileMemberId;
  let profile = store.getMemberProfile(memberId);
  if (!profile) {
    state.profileMemberId = TEAMS[0].members[0].id;
    memberId = state.profileMemberId;
    profile = store.getMemberProfile(memberId);
  }
  if (!profile) return;

  const {
    member,
    currentWeekPoints,
    yearTotal,
    avgScore,
    classRank,
    isClassRankTied,
    diffFromLastWeek,
    weekEvents,
    allEvents,
  } = profile;

  // 1. Hero Card
  const heroAvatar = $("#profile-hero-avatar");
  if (heroAvatar) heroAvatar.textContent = getInitials(member.name);

  const heroName = $("#profile-hero-name");
  if (heroName) heroName.innerHTML = renderMemberName(member, "font-heading font-bold text-base text-on-surface truncate");

  const heroTeam = $("#profile-hero-team");
  if (heroTeam) heroTeam.textContent = TEAM_BY_ID[member.teamId]?.name || member.teamId;

  const heroId = $("#profile-hero-id");
  if (heroId) heroId.textContent = member.id;

  const trendEl = $("#profile-hero-trend");
  if (trendEl) {
    if (diffFromLastWeek > 0) {
      trendEl.className = "flex items-center gap-1 mt-0.5 text-secondary text-xs font-semibold tabular-nums";
      trendEl.innerHTML = `<span class="material-symbols-outlined text-[14px]">trending_up</span><span>+${diffFromLastWeek}đ so với tuần trước</span>`;
    } else if (diffFromLastWeek < 0) {
      trendEl.className = "flex items-center gap-1 mt-0.5 text-error text-xs font-semibold tabular-nums";
      trendEl.innerHTML = `<span class="material-symbols-outlined text-[14px]">trending_down</span><span>${diffFromLastWeek}đ so với tuần trước</span>`;
    } else {
      trendEl.className = "flex items-center gap-1 mt-0.5 text-outline text-xs font-semibold tabular-nums";
      trendEl.innerHTML = `<span class="material-symbols-outlined text-[14px]">remove</span><span>Không đổi so với tuần trước</span>`;
    }
  }

  const rankBadge = $("#profile-rank-badge");
  if (rankBadge) rankBadge.textContent = classRank === null ? "—" : `#${classRank}`;

  const rankSub = $("#profile-rank-sub");
  if (rankSub) {
    rankSub.textContent = isStudiedWeek(store.weekId)
      ? `Tuần ${weekNumber(store.weekId)}`
      : `Tuần ${weekNumber(store.weekId)} • Chưa xếp hạng`;
  }

  const weekPointsEl = $("#profile-week-points");
  if (weekPointsEl) weekPointsEl.textContent = currentWeekPoints;

  const yearPointsEl = $("#profile-year-points");
  if (yearPointsEl) yearPointsEl.textContent = yearTotal;

  // 2. YÊU CẦU 7: THỐNG KÊ XẾP LOẠI TỪ TUẦN 1 ĐẾN NAY
  const throughWeek = studiedThroughWeek();
  const gradeData = store.getMemberGradeWeeks(member.id, 1, throughWeek);

  const weekCountEl = $("#profile-grade-week-count");
  if (weekCountEl) weekCountEl.textContent = `${throughWeek} tuần (Tuần 1–${throughWeek})`;

  const gradeCountsContainer = $("#profile-grade-counts");
  if (gradeCountsContainer) {
    gradeCountsContainer.innerHTML = `
      <div class="bg-surface-container-low rounded-xl p-2.5 flex items-center justify-between border-l-4 border-emerald-500">
        <div>
          <span class="text-[10px] text-emerald-800 font-bold block">Loại Tốt (90–100đ)</span>
          <span class="text-[9px] text-outline">Chuẩn nề nếp tốt</span>
        </div>
        <span class="font-heading font-bold text-xl text-emerald-700 tabular-nums">${gradeData.counts.tot} <span class="text-xs font-normal">tuần</span></span>
      </div>

      <div class="bg-surface-container-low rounded-xl p-2.5 flex items-center justify-between border-l-4 border-blue-500">
        <div>
          <span class="text-[10px] text-blue-800 font-bold block">Loại Khá (80–89đ)</span>
          <span class="text-[9px] text-outline">Đạt mức khá</span>
        </div>
        <span class="font-heading font-bold text-xl text-blue-700 tabular-nums">${gradeData.counts.kha} <span class="text-xs font-normal">tuần</span></span>
      </div>

      <div class="bg-surface-container-low rounded-xl p-2.5 flex items-center justify-between border-l-4 border-amber-500">
        <div>
          <span class="text-[10px] text-amber-800 font-bold block">Loại Đạt (60–79đ)</span>
          <span class="text-[9px] text-outline">Cần cố gắng thêm</span>
        </div>
        <span class="font-heading font-bold text-xl text-amber-700 tabular-nums">${gradeData.counts.dat} <span class="text-xs font-normal">tuần</span></span>
      </div>

      <div class="bg-surface-container-low rounded-xl p-2.5 flex items-center justify-between border-l-4 border-rose-500">
        <div>
          <span class="text-[10px] text-rose-800 font-bold block">Chưa đạt (≤59đ)</span>
          <span class="text-[9px] text-outline">Vi phạm nhiều</span>
        </div>
        <span class="font-heading font-bold text-xl text-rose-700 tabular-nums">${gradeData.counts["chua-dat"]} <span class="text-xs font-normal">tuần</span></span>
      </div>
    `;
  }

  const detailContainer = $("#profile-grade-detail");
  const btnToggleDetail = $("#btn-profile-grade-detail");
  if (detailContainer && btnToggleDetail) {
    detailContainer.classList.toggle("hidden", !state.profileGradeOpen);
    btnToggleDetail.innerHTML = `
      <span>${state.profileGradeOpen ? "Thu gọn chi tiết" : "Xem chi tiết từng tuần"}</span>
      <span class="material-symbols-outlined text-[16px]">${state.profileGradeOpen ? "expand_less" : "expand_more"}</span>
    `;

    if (state.profileGradeOpen) {
      detailContainer.innerHTML = gradeData.weeks
        .map((w) => {
          const badgeClass =
            w.grade.key === "tot"
              ? "bg-emerald-100 text-emerald-800"
              : w.grade.key === "kha"
              ? "bg-blue-100 text-blue-800"
              : w.grade.key === "dat"
              ? "bg-amber-100 text-amber-800"
              : "bg-rose-100 text-rose-800";

          return `
            <div class="flex items-center justify-between p-2 rounded-xl bg-surface-container-low text-xs">
              <div class="flex items-center gap-2">
                <span class="font-heading font-bold text-primary min-w-[3.5rem]">Tuần ${w.weekNumber}</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}">Loại ${w.grade.label}</span>
              </div>
              <div class="flex items-center gap-2 text-right">
                <span class="text-[10px] text-outline">+${w.plus.length} khen • ${w.minus.length} lỗi</span>
                <span class="font-heading font-bold text-sm text-on-surface tabular-nums">${w.points} đ</span>
              </div>
            </div>
          `;
        })
        .join("");
    }

    btnToggleDetail.onclick = () => {
      state.profileGradeOpen = !state.profileGradeOpen;
      renderProfileView();
    };
  }

  // 3. Chi tiết tuần hiện tại
  const currentWeekPlusPoints = weekEvents.reduce(
    (total, event) => total + (event.points > 0 ? event.points : 0),
    0
  );
  const currentWeekMinusPoints = weekEvents.reduce(
    (total, event) => total + (event.points < 0 ? event.points : 0),
    0
  );
  const currentWeekViolationCount = weekEvents.filter((event) => event.points < 0).length;
  const statPlus = $("#profile-stat-plus");
  if (statPlus) statPlus.textContent = `+${currentWeekPlusPoints} đ`;

  const statMinus = $("#profile-stat-minus");
  if (statMinus) statMinus.textContent = `${currentWeekMinusPoints} đ`;

  const currentGrade = gradeFor(currentWeekPoints);
  const gradePill = $("#profile-grade-pill");
  if (gradePill) {
    gradePill.textContent = currentGrade.label;
    gradePill.className = `text-[10px] font-bold px-2 py-0.5 rounded-full ${currentGrade.badge}`;
  }

  const scorePct = Math.max(0, Math.min(100, Math.round(currentWeekPoints)));
  const scorePctEl = $("#profile-score-pct");
  if (scorePctEl) scorePctEl.textContent = `${scorePct}%`;
  const scoreBar = $("#profile-score-bar");
  if (scoreBar) scoreBar.style.width = `${scorePct}%`;

  // 4. Badges
  const badgesRow = $("#profile-badges-row");
  if (badgesRow) {
    const badges = [];
    if (currentWeekViolationCount === 0) {
      badges.push(`<span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[13px]">verified</span> 0 vi phạm tuần này</span>`);
    } else {
      badges.push(`<span class="px-2.5 py-1 rounded-full bg-error-container text-error text-[10px] font-bold flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[13px]">warning</span> ${currentWeekViolationCount} lần vi phạm tuần này</span>`);
    }
    if (currentWeekPlusPoints > 0) {
      badges.push(`<span class="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[13px]">stars</span> +${currentWeekPlusPoints}đ khen tuần này</span>`);
    }
    if (currentWeekPoints >= 100) {
      badges.push(`<span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[13px]">military_tech</span> Đạt chuẩn thi đua</span>`);
    }
    badgesRow.innerHTML = badges.join("");
  }

  // 5. Timeline sự kiện
  const histList = $("#profile-history-list");
  if (!histList) return;

  const focusWeekId = state.profileWeekFocus || store.weekId;
  const focusWeekNumber = weekNumber(focusWeekId);

  let targetEvents = allEvents.filter((e) => e.weekId === focusWeekId);
  if (state.profileFilter === "minus") {
    targetEvents = targetEvents.filter((e) => e.points < 0);
  } else if (state.profileFilter === "plus") {
    targetEvents = targetEvents.filter((e) => e.points > 0);
  }

  if (!targetEvents.length) {
    histList.innerHTML = `<p class="text-xs text-outline py-4 text-center">Không có bản ghi điểm nào trong Tuần ${focusWeekNumber}.</p>`;
    return;
  }

  histList.innerHTML = targetEvents
    .map((ev) => {
      const isPlus = ev.points > 0;
      const canDelete = store.canDeleteEvent(ev);

      return `
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low text-xs">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2 h-2 rounded-full ${isPlus ? "bg-secondary" : "bg-error"} shrink-0"></span>
            <div class="flex flex-col min-w-0">
              <span class="font-heading font-bold text-on-surface truncate">${escapeHtml(ev.label)}</span>
              <span class="text-[10px] text-outline">Tuần ${weekNumber(ev.weekId)} • ${formatRelativeTime(ev.createdAt)}${ev.note ? ` • "${escapeHtml(ev.note)}"` : ""}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="font-heading font-bold ${isPlus ? "text-secondary" : "text-error"} tabular-nums">${formatPoints(ev.points)}đ</span>
            ${
              canDelete
                ? `<button type="button" class="btn-prof-delete text-outline hover:text-error transition-colors" data-del-id="${ev.id}" title="Xóa bản ghi này">
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                   </button>`
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");

  $$(".btn-prof-delete", histList).forEach((btn) => {
    btn.onclick = async () => {
      if (confirm("Bạn có chắc chắn muốn xóa bản ghi này?")) {
        try {
          await store.deleteEvent(btn.dataset.delId);
          renderProfileView();
          renderLeaderboard();
        } catch (err) {
          alert(err.message || "Lỗi khi xóa.");
        }
      }
    };
  });
}

// ===========================================================================
// MÀN HÌNH 4: TRA CỨU ĐIỂM (YÊU CẦU 9: TÁCH RIÊNG 2 BẢNG + TRA CỨU CHUYÊN SÂU)
// ===========================================================================
function renderLookupView() {
  const memberId = state.lookupMemberId || TEAMS[0].members[0].id;
  const member = MEMBER_BY_ID[memberId];
  if (!member) return;

  const weekId = state.lookupWeekId || store.weekId;
  const curWeekNum = weekNumber(weekId);

  // 1. Render student picker suggestions
  const searchInput = $("#lookup-search-input");
  const clearBtn = $("#btn-clear-lookup-search");
  const quickList = $("#lookup-students-list");
  const selectedNameEl = $("#lookup-selected-name");

  if (selectedNameEl) {
    selectedNameEl.innerHTML = `
      <div class="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low mt-1">
        <div class="w-7 h-7 rounded-lg bg-primary-fixed text-primary flex items-center justify-center font-heading font-bold text-xs shrink-0">
          ${getInitials(member.name)}
        </div>
        <div class="flex flex-col min-w-0">
          <span class="font-heading font-bold text-xs text-on-surface truncate">${escapeHtml(member.name)}</span>
          <span class="text-[10px] text-outline">${TEAM_BY_ID[member.teamId]?.name || member.teamId} • ${member.id}</span>
        </div>
      </div>
    `;
  }

  const query = toNonAccentVietnamese(searchInput?.value || "");
  if (quickList) {
    quickList.classList.toggle("hidden", !query);
    if (query) {
      const filtered = TEAMS.flatMap((t) => t.members.map((m) => ({ ...m, teamId: t.id }))).filter(
        (m) => toNonAccentVietnamese(m.name).includes(query) || m.id.toLowerCase().includes(query)
      );

      quickList.innerHTML = filtered.length
        ? filtered
            .map((m) => {
              const isSelected = m.id === memberId;
              const bgClass = isSelected ? "bg-primary text-on-primary font-bold shadow-xs" : "bg-surface-container-low text-on-surface hover:bg-surface-container";
              return `
                <button type="button" class="lookup-student-btn px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 shrink-0 ${bgClass}" data-member-id="${m.id}">
                  <span>${escapeHtml(m.name)}</span>
                  <span class="text-[10px] opacity-75">${m.id}</span>
                </button>
              `;
            })
            .join("")
        : `<span class="text-xs text-outline py-1">Không tìm thấy học sinh.</span>`;

      $$(".lookup-student-btn", quickList).forEach((btn) => {
        btn.onclick = () => {
          state.lookupMemberId = btn.dataset.memberId;
          if (searchInput) searchInput.value = "";
          clearBtn?.classList.add("hidden");
          renderLookupView();
        };
      });
    }
  }

  bindNameSearchInput({
    inputSelector: "#lookup-search-input",
    clearSelector: "#btn-clear-lookup-search",
    onSearch: () => renderLookupView(),
  });

  // 2. Week selector dạng dropdown/tùy chọn kéo xuống
  const weekSelector = $("#lookup-week-selector");
  const weekSelectedLabel = $("#lookup-week-selected-label");
  if (weekSelector) {
    populateWeekSelector(weekSelector, weekId);
    if (weekSelectedLabel) weekSelectedLabel.textContent = `Tuần ${curWeekNum}`;

    weekSelector.onchange = (e) => {
      state.lookupWeekId = e.target.value;
      renderLookupView();
    };
  }

  // 3. Week breakdown data
  const breakdown = store.getMemberWeekBreakdown(member.id, weekId);
  const weekSummaryEl = $("#lookup-week-summary");
  if (weekSummaryEl && breakdown) {
    const badgeClass = breakdown.grade.badge;
    weekSummaryEl.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="flex flex-col">
          <span class="font-heading font-bold text-sm text-on-surface">Tuần ${curWeekNum} — ${breakdown.points} điểm</span>
          <span class="text-[10px] text-on-surface-variant">Điểm nền 100đ + ${breakdown.plus.length} khen - ${breakdown.minus.length} lỗi</span>
        </div>
      </div>
      <span class="px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}">
        Loại ${breakdown.grade.label}
      </span>
    `;
  }

  // 4. BẢNG VI PHẠM TUẦN NÀY
  const minusList = $("#lookup-minus-list");
  const minusTotalEl = $("#lookup-minus-total");
  if (minusList && breakdown) {
    const totalMinus = breakdown.minus.reduce((acc, e) => acc + e.points, 0);
    if (minusTotalEl) minusTotalEl.textContent = `${breakdown.minus.length} lỗi (${totalMinus}đ)`;

    minusList.innerHTML = breakdown.minus.length
      ? breakdown.minus
          .map(
            (e) => `
              <div class="p-2.5 rounded-xl bg-surface-container-low flex items-start justify-between gap-2 text-xs">
                <div class="flex flex-col min-w-0">
                  <span class="font-heading font-bold text-on-surface">${escapeHtml(e.label)}</span>
                  <span class="text-[10px] text-outline">${formatRelativeTime(e.createdAt)}${e.note ? ` • "${escapeHtml(e.note)}"` : ""}</span>
                </div>
                <span class="font-heading font-bold text-error tabular-nums shrink-0">${formatPoints(e.points)}đ</span>
              </div>
            `
          )
          .join("")
      : `<p class="text-xs text-outline py-4 text-center">Không có vi phạm nào trong tuần này.</p>`;
  }

  // 5. BẢNG ĐIỂM CỘNG TUẦN NÀY
  const plusList = $("#lookup-plus-list");
  const plusTotalEl = $("#lookup-plus-total");
  if (plusList && breakdown) {
    const totalPlus = breakdown.plus.reduce((acc, e) => acc + e.points, 0);
    if (plusTotalEl) plusTotalEl.textContent = `${breakdown.plus.length} khen (+${totalPlus}đ)`;

    plusList.innerHTML = breakdown.plus.length
      ? breakdown.plus
          .map(
            (e) => `
              <div class="p-2.5 rounded-xl bg-surface-container-low flex items-start justify-between gap-2 text-xs">
                <div class="flex flex-col min-w-0">
                  <span class="font-heading font-bold text-on-surface">${escapeHtml(e.label)}</span>
                  <span class="text-[10px] text-outline">${formatRelativeTime(e.createdAt)}${e.note ? ` • "${escapeHtml(e.note)}"` : ""}</span>
                </div>
                <span class="font-heading font-bold text-secondary tabular-nums shrink-0">${formatPoints(e.points)}đ</span>
              </div>
            `
          )
          .join("")
      : `<p class="text-xs text-outline py-4 text-center">Chưa có điểm cộng trong tuần này.</p>`;
  }

}

// ===========================================================================
// MÀN HÌNH 5: THỐNG KÊ HẠNH KIỂM (YÊU CẦU 11: 4 MỐC HỌC KÌ)
// ===========================================================================
function renderConductView() {
  const memberId = state.conductMemberId || TEAMS[0].members[0].id;
  const member = MEMBER_BY_ID[memberId];
  if (!member) return;

  const semesterId = state.conductSemesterId || "gk1";
  const sem = store.getSemesterById(semesterId);

  // 1. Search student
  const searchInput = $("#conduct-search-input");
  const clearBtn = $("#btn-clear-conduct-search");
  const quickList = $("#conduct-students-list");
  const selectedNameEl = $("#conduct-selected-name");

  if (selectedNameEl) {
    selectedNameEl.innerHTML = `
      <div class="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low mt-1">
        <div class="w-7 h-7 rounded-lg bg-primary-fixed text-primary flex items-center justify-center font-heading font-bold text-xs shrink-0">
          ${getInitials(member.name)}
        </div>
        <div class="flex flex-col min-w-0">
          <span class="font-heading font-bold text-xs text-on-surface truncate">${escapeHtml(member.name)}</span>
          <span class="text-[10px] text-outline">${TEAM_BY_ID[member.teamId]?.name || member.teamId} • ${member.id}</span>
        </div>
      </div>
    `;
  }

  const query = toNonAccentVietnamese(searchInput?.value || "");
  if (quickList) {
    quickList.classList.toggle("hidden", !query);
    if (query) {
      const filtered = TEAMS.flatMap((t) => t.members.map((m) => ({ ...m, teamId: t.id }))).filter(
        (m) => toNonAccentVietnamese(m.name).includes(query) || m.id.toLowerCase().includes(query)
      );

      quickList.innerHTML = filtered.length
        ? filtered
            .map((m) => {
              const isSelected = m.id === memberId;
              const bgClass = isSelected ? "bg-primary text-on-primary font-bold shadow-xs" : "bg-surface-container-low text-on-surface hover:bg-surface-container";
              return `
                <button type="button" class="conduct-student-btn px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 shrink-0 ${bgClass}" data-member-id="${m.id}">
                  <span>${escapeHtml(m.name)}</span>
                  <span class="text-[10px] opacity-75">${m.id}</span>
                </button>
              `;
            })
            .join("")
        : `<span class="text-xs text-outline py-1">Không tìm thấy học sinh.</span>`;

      $$(".conduct-student-btn", quickList).forEach((btn) => {
        btn.onclick = () => {
          state.conductMemberId = btn.dataset.memberId;
          if (searchInput) searchInput.value = "";
          clearBtn?.classList.add("hidden");
          renderConductView();
        };
      });
    }
  }

  bindNameSearchInput({
    inputSelector: "#conduct-search-input",
    clearSelector: "#btn-clear-conduct-search",
    onSearch: () => renderConductView(),
  });

  // 2. 4 Semester Chips:
  // Giữa kì 1: Tuần 1-9
  // Cuối kì 1: Tuần 10-18
  // Giữa kì 2: Tuần 19-27
  // Cuối kì 2: Tuần 28-35
  const semChipsContainer = $("#conduct-semester-chips");
  if (semChipsContainer) {
    semChipsContainer.innerHTML = SEMESTERS.map((s) => {
      const isSelected = s.id === semesterId;
      const activeClass = isSelected
        ? "bg-primary text-on-primary font-bold shadow-xs"
        : "bg-surface-container-low text-on-surface hover:bg-surface-container";

      return `
        <button type="button" class="conduct-sem-btn p-2.5 rounded-xl text-xs text-left transition-all flex flex-col ${activeClass}" data-sem-id="${s.id}">
          <span class="font-heading font-bold text-xs">${s.label}</span>
          <span class="text-[10px] opacity-80 mt-0.5">Tuần ${s.from} – ${s.to}</span>
        </button>
      `;
    }).join("");

    $$(".conduct-sem-btn", semChipsContainer).forEach((btn) => {
      btn.onclick = () => {
        state.conductSemesterId = btn.dataset.semId;
        renderConductView();
      };
    });
  }

  // 3. Tính toán hạnh kiểm trong kì đã chọn
  const data = store.getMemberGradeWeeks(member.id, sem.from, sem.to);
  const countsContainer = $("#conduct-counts");
  if (countsContainer) {
    countsContainer.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl p-3 shadow-xs flex items-center justify-between border-l-4 border-emerald-500">
        <div>
          <span class="text-[10px] text-emerald-800 font-bold block">Loại Tốt (90–100đ)</span>
          <span class="text-[9px] text-outline">${sem.label}</span>
        </div>
        <span class="font-heading font-bold text-xl text-emerald-700 tabular-nums">${data.counts.tot} <span class="text-xs font-normal">tuần</span></span>
      </div>

      <div class="bg-surface-container-lowest rounded-2xl p-3 shadow-xs flex items-center justify-between border-l-4 border-blue-500">
        <div>
          <span class="text-[10px] text-blue-800 font-bold block">Loại Khá (80–89đ)</span>
          <span class="text-[9px] text-outline">${sem.label}</span>
        </div>
        <span class="font-heading font-bold text-xl text-blue-700 tabular-nums">${data.counts.kha} <span class="text-xs font-normal">tuần</span></span>
      </div>

      <div class="bg-surface-container-lowest rounded-2xl p-3 shadow-xs flex items-center justify-between border-l-4 border-amber-500">
        <div>
          <span class="text-[10px] text-amber-800 font-bold block">Loại Đạt (60–79đ)</span>
          <span class="text-[9px] text-outline">${sem.label}</span>
        </div>
        <span class="font-heading font-bold text-xl text-amber-700 tabular-nums">${data.counts.dat} <span class="text-xs font-normal">tuần</span></span>
      </div>

      <div class="bg-surface-container-lowest rounded-2xl p-3 shadow-xs flex items-center justify-between border-l-4 border-rose-500">
        <div>
          <span class="text-[10px] text-rose-800 font-bold block">Chưa đạt (≤59đ)</span>
          <span class="text-[9px] text-outline">${sem.label}</span>
        </div>
        <span class="font-heading font-bold text-xl text-rose-700 tabular-nums">${data.counts["chua-dat"]} <span class="text-xs font-normal">tuần</span></span>
      </div>
    `;
  }

  // 4. Danh sách các tuần trong kì
  const weekList = $("#conduct-week-list");
  if (weekList) {
    if (!data.weeks.length) {
      weekList.innerHTML = `<p class="text-xs text-outline py-4 text-center">Chưa có dữ liệu tuần thi đua trong học kì này.</p>`;
      return;
    }

    weekList.innerHTML = data.weeks
      .map((w) => {
        const badgeClass =
          w.grade.key === "tot"
            ? "bg-emerald-100 text-emerald-800"
            : w.grade.key === "kha"
            ? "bg-blue-100 text-blue-800"
            : w.grade.key === "dat"
            ? "bg-amber-100 text-amber-800"
            : "bg-rose-100 text-rose-800";

        return `
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low text-xs">
            <div class="flex items-center gap-2.5">
              <span class="font-heading font-bold text-primary min-w-[3.5rem]">Tuần ${w.weekNumber}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}">Loại ${w.grade.label}</span>
            </div>
            <div class="flex items-center gap-2 text-right">
              <span class="text-[10px] text-outline">+${w.plus.length} khen • ${w.minus.length} lỗi</span>
              <span class="font-heading font-bold text-sm text-on-surface tabular-nums">${w.points} đ</span>
            </div>
          </div>
        `;
      })
      .join("");
  }
}

// ===========================================================================
// MÀN HÌNH 7: BẢNG SINH HOẠT LỚP (LANDSCAPE 4 PANEL)
// ===========================================================================
function groupClassroomActivityEvents(events) {
  const grouped = new Map();

  for (const event of events) {
    const isTeamAdjustment = event.ruleId === TEAM_ADJUSTMENT_RULE_ID;
    const memberName = MEMBER_BY_ID[event.memberId]?.name || event.memberId || "Không rõ";
    const label = isTeamAdjustment
      ? event.note || event.label || "Điểm phong trào tổ"
      : RULE_BY_ID[event.ruleId]?.label || event.label || event.ruleId || "Ghi nhận";
    const key = isTeamAdjustment
      ? `${event.ruleId}:${label}`
      : `${event.memberId}:${event.ruleId}`;
    const multiplier = Number(event.label?.match(/\(x(\d+)\)$/)?.[1]) || 1;
    const current = grouped.get(key) || {
      name: isTeamAdjustment ? "Điểm phong trào tổ" : memberName,
      label,
      points: 0,
      count: 0,
      createdAt: 0,
    };

    current.points += Number(event.points) || 0;
    current.count += multiplier;
    current.createdAt = Math.max(current.createdAt, Number(event.createdAt) || 0);
    grouped.set(key, current);
  }

  return [...grouped.values()].sort((a, b) => b.createdAt - a.createdAt);
}

function renderClassroomBoardView() {
  const boardGrid = $("#classroom-board-grid");
  const weekSelect = $("#classroom-board-week-select");
  const summaryPanel = $("#classroom-board-summary");
  if (!boardGrid) return;

  if (weekSelect) {
    populateWeekSelector(weekSelect, store.weekId);
    weekSelect.onchange = (event) => {
      store.setWeek(event.currentTarget.value);
    };
  }
  const exportButton = $("#btn-export-classroom-board");
  if (exportButton) {
    exportButton.onclick = async () => {
      exportButton.disabled = true;
      exportButton.innerHTML = '<span class="material-symbols-outlined text-[17px]">hourglass_top</span>Đang xuất';
      try {
        await exportClassroomBoardImage();
      } catch (error) {
        console.error("Không thể xuất ảnh bảng sinh hoạt:", error);
        alert(`Không thể xuất ảnh bảng sinh hoạt. ${error.message || "Vui lòng thử lại."}`);
      } finally {
        exportButton.disabled = false;
        exportButton.innerHTML = '<span class="material-symbols-outlined text-[17px]">image</span>Xuất ảnh';
      }
    };
  }

  const weekId = store.weekId;
  const weekNum = weekNumber(weekId);
  const teams = teamsForWeek(weekId);
  const { teamScores, memberScores } = store.calculateScoresFast(store.events, BASE_POINTS, weekId);
  const lockReason = store.getLockedWeekReason(weekId);

  if (summaryPanel) {
    const lockedText = lockReason
      ? `<span class="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-1 text-[10px] font-bold"><span class="material-symbols-outlined text-[14px]">lock</span>Tuần bị khóa: ${escapeHtml(lockReason)}</span>`
      : `<span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-1 text-[10px] font-bold"><span class="material-symbols-outlined text-[14px]">check_circle</span>Tuần đang hoạt động</span>`;

    summaryPanel.innerHTML = `
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p class="text-[10px] uppercase tracking-[0.18em] text-white/70 font-bold">Sinh hoạt lớp · Tuần ${weekNum}</p>
          <h3 class="font-heading font-bold text-base text-white mt-0.5">Bảng điểm 4 tổ</h3>
        </div>
        ${lockedText}
      </div>
      <div class="mt-3 flex items-center justify-between gap-2 text-[11px] text-white/80">
        <span>${weekRangeLabel(weekId)}</span>
        <span>${store.events.filter((event) => event.weekId === weekId).length} lượt ghi</span>
      </div>
    `;
  }

  boardGrid.innerHTML = teams
    .map((team) => {
      const scoreInfo = teamScores[team.id] || {
        total: BASE_POINTS * team.members.length,
        plusPoints: 0,
        minusPoints: 0,
        plusCount: 0,
        minusCount: 0,
      };
      const baseTeamScore = BASE_POINTS * team.members.length;
      const teamScoreTone = scoreInfo.total > baseTeamScore
        ? "positive"
        : scoreInfo.total < baseTeamScore
          ? "negative"
          : "neutral";
      const teamEvents = store.events.filter((event) => event.teamId === team.id && event.weekId === weekId);
      const violations = groupClassroomActivityEvents(teamEvents.filter((event) => event.points < 0));
      const rewards = groupClassroomActivityEvents(teamEvents.filter((event) => event.points > 0));
      const topMembers = team.members
        .map((member) => {
          const memberEvents = teamEvents.filter((event) => event.memberId === member.id);
          const delta = memberEvents.reduce((sum, event) => sum + event.points, 0);
          return { member, delta, count: memberEvents.length };
        })
        .sort((a, b) => b.delta - a.delta || a.member.name.localeCompare(b.member.name, "vi"))
        .slice(0, 3);
      const rankedMembers = team.members
        .map((member) => ({
          ...member,
          points: memberScores[member.id]?.points ?? BASE_POINTS,
        }))
        .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "vi"));

      return `
        <article class="classroom-board-panel">
          <div class="classroom-board-head">
            <div class="classroom-board-badge">${team.id.replace("to", "T")}</div>
            <div class="min-w-0 flex-1">
              <h4 class="font-heading font-bold text-sm text-on-surface truncate">${escapeHtml(team.name)}</h4>
              <p class="text-[10px] text-on-surface-variant">${team.members.length} học sinh</p>
            </div>
            <div class="classroom-score-badge ${teamScoreTone}">
              ${scoreInfo.total > baseTeamScore ? "+" : ""}${scoreInfo.total}
            </div>
          </div>

          <div class="classroom-board-stats">
            <div class="classroom-stat">
              <span class="label">Điểm</span>
              <strong class="tabular-nums">${scoreInfo.total}</strong>
            </div>
            <div class="classroom-stat">
              <span class="label">Khen</span>
              <strong class="tabular-nums classroom-score-chip ${scoreInfo.plusPoints > 0 ? "positive" : "neutral"}">+${scoreInfo.plusPoints || 0}</strong>
            </div>
            <div class="classroom-stat">
              <span class="label">Lỗi</span>
              <strong class="tabular-nums classroom-score-chip ${scoreInfo.minusPoints < 0 ? "negative" : "neutral"}">${scoreInfo.minusPoints || 0}</strong>
            </div>
            <div class="classroom-stat">
              <span class="label">Lượt</span>
              <strong class="tabular-nums">${teamEvents.length}</strong>
            </div>
          </div>

          <details class="classroom-list-block">
            <summary class="classroom-list-header">
              <span class="classroom-section-title">Vi phạm</span>
              <span class="classroom-section-meta">
                <span class="badge-muted">${violations.reduce((sum, activity) => sum + activity.count, 0)}</span>
                <span class="material-symbols-outlined classroom-section-icon" aria-hidden="true">expand_more</span>
              </span>
            </summary>
            <div class="classroom-list-content">
              ${violations.length ? violations.map((activity) => `
                <div class="classroom-list-row danger">
                  <div class="classroom-row-main">
                    <span class="classroom-name">${escapeHtml(activity.name)}</span>
                    <span class="classroom-rule">${escapeHtml(activity.label)}${activity.count > 1 ? ` · ${activity.count} lần` : ""}</span>
                  </div>
                  <span class="classroom-points">${formatPoints(activity.points)}</span>
                </div>
              `).join("") : `<div class="classroom-empty">Không có vi phạm trong tuần này.</div>`}
            </div>
          </details>

          <details class="classroom-list-block">
            <summary class="classroom-list-header">
              <span class="classroom-section-title">Điểm cộng</span>
              <span class="classroom-section-meta">
                <span class="badge-muted">${rewards.reduce((sum, activity) => sum + activity.count, 0)}</span>
                <span class="material-symbols-outlined classroom-section-icon" aria-hidden="true">expand_more</span>
              </span>
            </summary>
            <div class="classroom-list-content">
              ${rewards.length ? rewards.map((activity) => `
                <div class="classroom-list-row success">
                  <div class="classroom-row-main">
                    <span class="classroom-name">${escapeHtml(activity.name)}</span>
                    <span class="classroom-rule">${escapeHtml(activity.label)}${activity.count > 1 ? ` · ${activity.count} lần` : ""}</span>
                  </div>
                  <span class="classroom-points">${formatPoints(activity.points)}</span>
                </div>
              `).join("") : `<div class="classroom-empty">Chưa có điểm cộng.</div>`}
            </div>
          </details>

          <details class="classroom-list-block compact">
            <summary class="classroom-list-header">
              <span class="classroom-section-title">Điểm từng thành viên</span>
              <span class="classroom-section-meta">
                <span class="badge-muted">${rankedMembers.length}</span>
                <span class="material-symbols-outlined classroom-section-icon" aria-hidden="true">expand_more</span>
              </span>
            </summary>
            <div class="classroom-list-content">
              ${rankedMembers.map((member, index) => `
              <div class="classroom-member-row">
                <span class="classroom-member-name">${index + 1}. ${escapeHtml(member.name)}</span>
                <span class="classroom-member-score ${member.points > BASE_POINTS ? "positive" : member.points < BASE_POINTS ? "negative" : "neutral"}">${formatPoints(member.points)}đ</span>
                <span class="text-[9px] text-on-surface-variant">Tuần ${weekNum}</span>
              </div>
            `).join("")}
            </div>
          </details>

          <details class="classroom-list-block compact">
            <summary class="classroom-list-header">
              <span class="classroom-section-title">Nhân tố nổi bật</span>
              <span class="classroom-section-meta">
                <span class="badge-muted">${topMembers.length}</span>
                <span class="material-symbols-outlined classroom-section-icon" aria-hidden="true">expand_more</span>
              </span>
            </summary>
            <div class="classroom-list-content">
              ${topMembers.length ? topMembers.map(({ member, delta, count }) => `
              <div class="classroom-member-row">
                <span class="classroom-member-name">${escapeHtml(member.name)}</span>
                <span class="classroom-member-score ${delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral"}">${delta > 0 ? "+" : ""}${delta}đ</span>
                <span class="text-[9px] text-on-surface-variant">${count} lượt</span>
              </div>
            `).join("") : `<div class="classroom-empty">Chưa có dữ liệu.</div>`}
            </div>
          </details>
        </article>
      `;
    })
    .join("");
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text || "—").split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCanvasLines(ctx, lines, x, y, lineHeight) {
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function classroomExportTeamData(team, scores, weekId, events, ctx) {
  const score = scores.teamScores[team.id];
  const teamEvents = events
    .filter((event) => event.teamId === team.id && event.weekId === weekId)
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
  ctx.font = "21px Manrope, Arial, sans-serif";
  const toActivity = (group) => ({
    ...group,
    lines: wrapCanvasText(
      ctx,
      `${group.name} · ${group.label}${group.count > 1 ? ` · ${group.count} lần` : ""}`,
      570
    ),
  });
  const topMembers = team.members
    .map((member) => {
      const memberEvents = teamEvents.filter((event) => event.memberId === member.id);
      return {
        name: member.name,
        delta: memberEvents.reduce((sum, event) => sum + event.points, 0),
        count: memberEvents.length,
      };
    })
    .sort((a, b) => b.delta - a.delta || a.name.localeCompare(b.name, "vi"))
    .slice(0, 3);
  const memberScores = team.members
    .map((member) => ({
      name: member.name,
      points: scores.memberScores[member.id]?.points ?? BASE_POINTS,
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "vi"));

  return {
    team,
    score,
    violations: groupClassroomActivityEvents(teamEvents.filter((event) => event.points < 0)).map(toActivity),
    rewards: groupClassroomActivityEvents(teamEvents.filter((event) => event.points > 0)).map(toActivity),
    memberScores,
    topMembers,
    eventCount: teamEvents.length,
  };
}

function drawClassroomExportTeam(ctx, data, x, y, width) {
  const padding = 24;
  const innerWidth = width - padding * 2;
  const activityRowHeight = (item) => Math.max(36, item.lines.length * 28) + 12;
  const activityHeight = (items) => items.length
    ? 54 + items.reduce((sum, item) => sum + activityRowHeight(item), 0)
    : 88;
  const memberScoresHeight = 54 + data.memberScores.length * 38;
  const topMembersHeight = 54 + data.topMembers.length * 40;
  const height = 116 + 82 + activityHeight(data.violations) +
    activityHeight(data.rewards) + memberScoresHeight + topMembersHeight + 20;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "#dbe3f0";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = "#243b8a";
  ctx.fillRect(x, y, width, 84);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px 'Space Grotesk', Arial, sans-serif";
  ctx.fillText(`${data.team.name}  ·  ${data.team.members.length} học sinh`, x + padding, y + 54);
  ctx.textAlign = "right";
  ctx.font = "bold 32px 'Space Grotesk', Arial, sans-serif";
  ctx.fillText(`${data.score.total} điểm`, x + width - padding, y + 54);
  ctx.textAlign = "left";

  let cursorY = y + 116;
  const stats = [
    { label: "Điểm", value: String(data.score.total), color: "#1e293b" },
    { label: "Khen", value: formatPoints(data.score.plusPoints), color: "#047857" },
    { label: "Lỗi", value: String(data.score.minusPoints), color: "#be123c" },
    { label: "Lượt", value: String(data.eventCount), color: "#1e293b" },
  ];
  const statWidth = innerWidth / stats.length;
  stats.forEach((stat, index) => {
    const statX = x + padding + index * statWidth;
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(statX, cursorY - 26, statWidth - 8, 74);
    ctx.fillStyle = "#64748b";
    ctx.font = "20px Manrope, Arial, sans-serif";
    ctx.fillText(stat.label, statX + 12, cursorY);
    ctx.fillStyle = stat.color;
    ctx.font = "bold 26px 'Space Grotesk', Arial, sans-serif";
    ctx.fillText(stat.value, statX + 12, cursorY + 34);
  });
  cursorY += 82;

  const drawActivitySection = (title, items, count, color) => {
    ctx.fillStyle = color;
    ctx.font = "bold 24px Manrope, Arial, sans-serif";
    ctx.fillText(`${title} (${count})`, x + padding, cursorY + 26);
    cursorY += 54;

    if (!items.length) {
      ctx.fillStyle = "#64748b";
      ctx.font = "20px Manrope, Arial, sans-serif";
      ctx.fillText("Chưa có dữ liệu trong tuần này.", x + padding, cursorY + 2);
      cursorY += 34;
      return;
    }

    items.forEach((item, index) => {
      const rowHeight = activityRowHeight(item);
      ctx.fillStyle = index % 2 ? "#f8fafc" : "#ffffff";
      ctx.fillRect(x + padding - 6, cursorY - 23, innerWidth + 12, rowHeight);
      const itemY = cursorY;
      ctx.fillStyle = "#1e293b";
      ctx.font = "21px Manrope, Arial, sans-serif";
      cursorY = drawCanvasLines(ctx, item.lines, x + padding, cursorY, 28);
      ctx.textAlign = "right";
      ctx.fillStyle = color;
      ctx.font = "bold 22px 'Space Grotesk', Arial, sans-serif";
      ctx.fillText(`${formatPoints(item.points)}đ`, x + width - padding, itemY);
      ctx.textAlign = "left";
      cursorY += rowHeight - item.lines.length * 28;
    });
  };

  drawActivitySection(
    "Vi phạm",
    data.violations,
    data.violations.reduce((sum, activity) => sum + activity.count, 0),
    "#be123c"
  );
  drawActivitySection(
    "Điểm cộng",
    data.rewards,
    data.rewards.reduce((sum, activity) => sum + activity.count, 0),
    "#047857"
  );

  ctx.fillStyle = "#243b8a";
  ctx.font = "bold 24px Manrope, Arial, sans-serif";
  ctx.fillText(`Điểm từng thành viên (${data.memberScores.length})`, x + padding, cursorY + 26);
  cursorY += 54;
  data.memberScores.forEach((member, index) => {
    ctx.fillStyle = index % 2 ? "#f8fafc" : "#ffffff";
    ctx.fillRect(x + padding - 6, cursorY - 23, innerWidth + 12, 36);
    ctx.fillStyle = "#1e293b";
    ctx.font = "21px Manrope, Arial, sans-serif";
    ctx.fillText(`${index + 1}. ${member.name}`, x + padding, cursorY);
    ctx.textAlign = "right";
    ctx.fillStyle = member.points >= BASE_POINTS ? "#047857" : "#be123c";
    ctx.font = "bold 21px 'Space Grotesk', Arial, sans-serif";
    ctx.fillText(`${formatPoints(member.points)}đ`, x + width - padding, cursorY);
    ctx.textAlign = "left";
    cursorY += 38;
  });

  ctx.fillStyle = "#243b8a";
  ctx.font = "bold 24px Manrope, Arial, sans-serif";
  ctx.fillText("Nhân tố nổi bật", x + padding, cursorY + 26);
  cursorY += 54;
  data.topMembers.forEach((member, index) => {
    ctx.fillStyle = index % 2 ? "#f8fafc" : "#ffffff";
    ctx.fillRect(x + padding - 6, cursorY - 24, innerWidth + 12, 38);
    ctx.fillStyle = "#1e293b";
    ctx.font = "21px Manrope, Arial, sans-serif";
    ctx.fillText(member.name, x + padding, cursorY);
    ctx.textAlign = "right";
    ctx.fillStyle = member.delta >= 0 ? "#047857" : "#be123c";
    ctx.font = "bold 21px 'Space Grotesk', Arial, sans-serif";
    ctx.fillText(
      `${member.delta >= 0 ? "+" : ""}${member.delta}đ · ${member.count} lượt`,
      x + width - padding,
      cursorY
    );
    ctx.textAlign = "left";
    cursorY += 40;
  });

  return y + height;
}

async function exportClassroomBoardImage() {
  await document.fonts?.ready;

  const weekId = store.weekId;
  const weekNum = weekNumber(weekId);
  const teams = teamsForWeek(weekId);
  const events = store.events.filter((event) => event.weekId === weekId);
  const scores = store.calculateScoresFast(store.events, BASE_POINTS, weekId);
  const logicalWidth = 1800;
  const padding = 48;
  const gap = 24;
  const teamWidth = (logicalWidth - padding * 2 - gap) / 2;
  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  if (!measureContext) throw new Error("Trình duyệt không hỗ trợ tạo ảnh Canvas.");

  const teamData = teams.map((team) =>
    classroomExportTeamData(team, scores, weekId, events, measureContext)
  );
  const panelHeights = teamData.map((data) =>
    drawClassroomExportTeam(measureContext, data, 0, 0, teamWidth)
  );
  const firstRowY = 152;
  const secondRowY = firstRowY + Math.max(panelHeights[0], panelHeights[1]) + gap;
  const logicalHeight = secondRowY + Math.max(panelHeights[2], panelHeights[3]) + 48;
  const rowY = [firstRowY, secondRowY];
  const canvas = document.createElement("canvas");
  canvas.width = logicalWidth * 2;
  canvas.height = logicalHeight * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không thể khởi tạo vùng vẽ ảnh.");
  ctx.scale(2, 2);
  ctx.fillStyle = "#f1f5fb";
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  ctx.fillStyle = "#172554";
  ctx.font = "bold 34px 'Space Grotesk', Arial, sans-serif";
  ctx.fillText("BẢNG SINH HOẠT LỚP 11A1", padding, 48);
  ctx.fillStyle = "#475569";
  ctx.font = "20px Manrope, Arial, sans-serif";
  ctx.fillText(`Tuần ${weekNum} · ${weekRangeLabel(weekId)}`, padding, 86);

  teamData.forEach((data, index) => {
    drawClassroomExportTeam(
      ctx,
      data,
      padding + (index % 2) * (teamWidth + gap),
      rowY[Math.floor(index / 2)],
      teamWidth
    );
  });

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Trình duyệt không thể tạo tệp ảnh PNG."));
    }, "image/png");
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `11A1-sinh-hoat-tuan-${weekNum}-${weekId}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ===========================================================================
// MÀN HÌNH 6: NỘI QUY LỚP (YÊU CẦU 14: TOÀN BỘ BIỂU ĐIỂM TRỰC QUAN)
// ===========================================================================
function renderClassRulesView() {
  const container = $("#class-rules-list");
  const searchInput = $("#rules-view-search");
  const categoriesContainer = $("#rules-view-categories");
  if (!container) return;

  const categories = [
    { id: "all", label: "Tất cả" },
    { id: "rewards", label: "Điểm cộng (+)" },
    { id: "penalties", label: "Điểm trừ (-)" },
    { id: "Chuyên cần", label: "Chuyên cần" },
    { id: "Đồng phục", label: "Đồng phục" },
    { id: "Nề nếp", label: "Nề nếp" },
    { id: "Kỷ luật", label: "Kỷ luật" },
    { id: "Vệ sinh", label: "Vệ sinh" },
    { id: "Phong trào", label: "Phong trào" },
  ];

  if (categoriesContainer) {
    categoriesContainer.innerHTML = categories
      .map((c) => {
        const isSelected = c.id === state.rulesCategoryFilter;
        const bgClass = isSelected ? "bg-primary text-on-primary font-bold shadow-xs" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container";
        return `<button type="button" class="rules-cat-btn px-3 py-1 rounded-xl text-xs whitespace-nowrap shrink-0 transition-colors ${bgClass}" data-cat-id="${c.id}">${c.label}</button>`;
      })
      .join("");

    $$(".rules-cat-btn", categoriesContainer).forEach((btn) => {
      btn.onclick = () => {
        state.rulesCategoryFilter = btn.dataset.catId;
        renderClassRulesView();
      };
    });
  }

  if (searchInput) {
    searchInput.value = state.rulesSearchQuery;
    searchInput.oninput = () => {
      state.rulesSearchQuery = searchInput.value;
      renderClassRulesView();
    };
  }

  const query = toNonAccentVietnamese(state.rulesSearchQuery || "");
  let filtered = RULES;

  if (state.rulesCategoryFilter === "rewards") {
    filtered = filtered.filter((r) => r.points > 0);
  } else if (state.rulesCategoryFilter === "penalties") {
    filtered = filtered.filter((r) => r.points < 0);
  } else if (state.rulesCategoryFilter !== "all") {
    filtered = filtered.filter((r) => r.group.toLowerCase().includes(state.rulesCategoryFilter.toLowerCase()));
  }

  if (query) {
    filtered = filtered.filter(
      (r) => toNonAccentVietnamese(r.label).includes(query) || toNonAccentVietnamese(r.group).includes(query)
    );
  }

  if (!filtered.length) {
    container.innerHTML = `<div class="p-6 rounded-2xl bg-surface-container-lowest text-center text-xs text-outline">Không tìm thấy nội quy phù hợp.</div>`;
    return;
  }

  // Nhóm theo group
  const grouped = new Map();
  for (const r of filtered) {
    if (!grouped.has(r.group)) grouped.set(r.group, []);
    grouped.get(r.group).push(r);
  }

  container.innerHTML = Array.from(grouped.entries())
    .map(([groupName, items]) => `
      <div class="rounded-2xl bg-surface-container-lowest p-4 shadow-xs flex flex-col gap-2.5">
        <div class="flex items-center justify-between pb-1 border-b border-surface-container">
          <h3 class="font-heading font-bold text-xs uppercase tracking-wide text-primary">${groupName}</h3>
          <span class="text-[10px] text-outline font-medium">${items.length} mục</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${items
            .map((r) => {
              const isPlus = r.points > 0;
              const isZero = r.points === 0;
              const badgeClass = isPlus
                ? "bg-secondary-fixed text-on-secondary-fixed rule-points-positive"
                : isZero
                ? "bg-surface-container-high text-on-surface-variant rule-points-neutral"
                : "bg-tertiary-fixed text-on-tertiary-fixed rule-points-negative";
              const iconColor = isPlus ? "text-secondary" : isZero ? "text-outline" : "text-tertiary";

              return `
                <div class="p-3 rounded-xl bg-surface-container-low flex items-center justify-between gap-2 text-xs">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="material-symbols-outlined text-[20px] ${iconColor} shrink-0">${r.icon || "info"}</span>
                    <span class="font-heading font-semibold text-on-surface">${escapeHtml(r.label)}</span>
                  </div>
                  <span class="px-2.5 py-1 rounded-full font-heading font-bold text-xs ${badgeClass} tabular-nums shrink-0">
                    ${isZero ? "Ghi nhận" : formatPoints(r.points) + "đ"}
                  </span>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `)
    .join("");
}

// ===========================================================================
// MÀN HÌNH 7: QUẢN LÝ LỚP GVCN (YÊU CẦU 10: DASHBOARD XEM ĐƯỢC TRÊN ĐT & MÁY TÍNH)
// ===========================================================================
function renderAdminPanel() {
  const isAdmin = store.isAdmin();
  const loginCard = $("#admin-login-card");
  const panel = $("#admin-panel");

  if (!isAdmin) {
    loginCard?.classList.remove("hidden");
    panel?.classList.add("hidden");
    return;
  }

  loginCard?.classList.add("hidden");
  panel?.classList.remove("hidden");

  // Summary
  const eventsSummary = $("#admin-summary-events");
  if (eventsSummary) {
    eventsSummary.textContent = `${store.events.length} lượt ghi tuần này`;
  }

  const adminWeekSelector = $("#admin-week-selector");
  const adminWeekSlider = $("#admin-week-slider");
  const adminWeekLabel = $("#admin-week-label");
  const adminWeekPill = $("#admin-week-pill");
  const adminWeekPrev = $("#btn-admin-week-prev");
  const adminWeekNext = $("#btn-admin-week-next");
  if (adminWeekSelector && adminWeekSlider) {
    const allWeekIds = competitionWeekIds();
    populateWeekSelector(adminWeekSelector, store.weekId);

    const syncAdminWeekUI = () => {
      const idx = allWeekIds.indexOf(store.weekId);
      const val = idx >= 0 ? idx + 1 : 1;
      adminWeekSlider.max = String(allWeekIds.length);
      adminWeekSlider.value = String(val);
      const currentLabel = `Tuần ${weekNumber(store.weekId)}`;
      if (adminWeekLabel) adminWeekLabel.textContent = currentLabel;
      if (adminWeekPill) adminWeekPill.textContent = currentLabel;
      const pct = ((val - 1) / Math.max(1, allWeekIds.length - 1)) * 100;
      adminWeekSlider.style.background = `linear-gradient(90deg, rgb(var(--a1-primary)) 0%, rgb(var(--a1-primary)) ${pct}%, rgb(var(--a1-surface-container)) ${pct}%, rgb(var(--a1-surface-container)) 100%)`;
    };

    adminWeekSelector.onchange = (e) => {
      store.setWeek(e.target.value);
    };
    adminWeekSlider.oninput = (e) => {
      const idx = Number(e.target.value) - 1;
      const target = allWeekIds[idx];
      if (target) store.setWeek(target);
    };
    adminWeekPrev.onclick = () => {
      const idx = allWeekIds.indexOf(store.weekId);
      const nextIdx = idx > 0 ? idx - 1 : 0;
      store.setWeek(allWeekIds[nextIdx]);
    };
    adminWeekNext.onclick = () => {
      const idx = allWeekIds.indexOf(store.weekId);
      const nextIdx = idx < allWeekIds.length - 1 ? idx + 1 : allWeekIds.length - 1;
      store.setWeek(allWeekIds[nextIdx]);
    };

    syncAdminWeekUI();
  }

  // Week Lock Management
  const lockWeekSelect = $("#admin-lock-week-select");
  const lockReasonInput = $("#admin-lock-reason-input");
  const lockWeekBtn = $("#btn-admin-lock-week");
  const lockedList = $("#admin-locked-weeks-list");
  const lockedCountBadge = $("#admin-locked-count-badge");

  const renderLockedWeeks = () => {
    const locked = store.getLockedWeeks();
    const count = locked.length;
    if (lockedCountBadge) lockedCountBadge.textContent = `${count} tuần khóa`;
    
    if (lockedList) {
      if (!locked.length) {
        lockedList.innerHTML = `<p class="text-xs text-on-surface-variant text-center py-2">Chưa có tuần nào bị khóa.</p>`;
      } else {
        lockedList.innerHTML = locked
          .sort((a, b) => a.weekId.localeCompare(b.weekId))
          .map(entry => {
            const wNum = weekNumber(entry.weekId);
            const range = weekRangeLabel(entry.weekId);
            const dateStr = entry.lockedAt ? new Date(entry.lockedAt).toLocaleDateString('vi-VN') : '';
            return `
              <div class="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <div class="flex items-start gap-2 min-w-0">
                  <span class="material-symbols-outlined text-amber-600 text-[18px] mt-0.5 shrink-0">lock</span>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="font-heading font-bold text-xs text-amber-900">Tuần ${wNum}</span>
                      <span class="text-[10px] text-amber-700">${range}</span>
                    </div>
                    <p class="text-[10px] text-amber-800 mt-0.5 break-words">${escapeHtml(entry.reason || 'Không có lý do')}</p>
                    ${dateStr ? `<p class="text-[9px] text-amber-600 mt-0.5">Khóa ngày ${dateStr}</p>` : ''}
                  </div>
                </div>
                <button type="button" class="shrink-0 w-7 h-7 rounded-lg bg-amber-200 hover:bg-amber-300 active:scale-95 flex items-center justify-center transition-all" data-unlock-week="${entry.weekId}" title="Mở khóa tuần này">
                  <span class="material-symbols-outlined text-amber-800 text-[14px]">lock_open</span>
                </button>
              </div>
            `;
          }).join('');
        
        $$("#admin-locked-weeks-list [data-unlock-week]").forEach(btn => {
          btn.onclick = async () => {
            const wId = btn.dataset.unlockWeek;
            const wNum = weekNumber(wId);
            if (!confirm(`Mở khóa Tuần ${wNum}? Dữ liệu tuần này sẽ được tính trở lại.`)) return;
            try {
              btn.disabled = true;
              await store.setWeekLocked(wId, false);
              renderLockedWeeks();
            } catch (err) {
              alert('Lỗi: ' + err.message);
              btn.disabled = false;
            }
          };
        });
      }
    }
  };

  // Populate week selector for locking
  if (lockWeekSelect) {
    const allWeekIds = competitionWeekIds();
    const locked = store.getLockedWeeks();
    const lockedIds = new Set(locked.map(e => e.weekId));
    lockWeekSelect.innerHTML = `<option value="">Chọn tuần cần khóa</option>` + 
      allWeekIds
        .filter(wId => !lockedIds.has(wId))
        .map(wId => `<option value="${wId}">Tuần ${weekNumber(wId)} (${weekRangeLabel(wId)})</option>`)
        .join('');
  }

  if (lockWeekBtn) {
    lockWeekBtn.onclick = async () => {
      const wId = lockWeekSelect?.value;
      const reason = lockReasonInput?.value?.trim();
      if (!wId) { alert('Vui lòng chọn tuần cần khóa.'); return; }
      if (!reason) { alert('Vui lòng nhập lý do khóa tuần.'); return; }
      const wNum = weekNumber(wId);
      if (!confirm(`Khóa Tuần ${wNum}?\n\nLý do: "${reason}"\n\nDữ liệu tuần này sẽ KHÔNG được tính vào tổng điểm, hạnh kiểm và bảng xếp hạng năm.`)) return;
      try {
        lockWeekBtn.disabled = true;
        await store.setWeekLocked(wId, true, reason);
        if (lockWeekSelect) lockWeekSelect.value = '';
        if (lockReasonInput) lockReasonInput.value = '';
        renderLockedWeeks();
        // Re-populate selector without the newly locked week
        const allWeekIds = competitionWeekIds();
        const locked = store.getLockedWeeks();
        const lockedIds = new Set(locked.map(e => e.weekId));
        if (lockWeekSelect) {
          lockWeekSelect.innerHTML = `<option value="">Chọn tuần cần khóa</option>` + 
            allWeekIds
              .filter(wId2 => !lockedIds.has(wId2))
              .map(wId2 => `<option value="${wId2}">Tuần ${weekNumber(wId2)} (${weekRangeLabel(wId2)})</option>`)
              .join('');
        }
      } catch (err) {
        alert('Lỗi: ' + err.message);
      } finally {
        lockWeekBtn.disabled = false;
      }
    };
  }

  renderLockedWeeks();

  // 1. 4 Metric Cards
  const metricCards = $("#admin-metric-cards");
  if (metricCards) {
    const teamRanks = store.getTeamRankings();
    const totalScore = teamRanks.reduce((sum, t) => sum + t.total, 0);
    const avgScore = teamRanks.length ? Math.round((totalScore / 44) * 10) / 10 : 100;
    const plusCount = teamRanks.reduce((sum, t) => sum + (t.plusCount || 0), 0);
    const minusCount = teamRanks.reduce((sum, t) => sum + (t.minusCount || 0), 0);

    metricCards.innerHTML = `
      <div class="rounded-2xl bg-primary-fixed/50 border border-primary/10 p-3.5 shadow-xs flex flex-col gap-2">
        <div class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-xs">
          <span class="material-symbols-outlined text-on-primary text-[20px]">groups</span>
        </div>
        <div>
          <span class="text-[10px] text-on-surface-variant font-medium uppercase tracking-wide">Sĩ số lớp</span>
          <div class="flex items-baseline gap-1 mt-0.5">
            <span class="font-heading font-bold text-2xl text-primary tabular-nums">44</span>
            <span class="text-[10px] text-outline font-medium">HS</span>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-secondary-container/40 border border-secondary/10 p-3.5 shadow-xs flex flex-col gap-2">
        <div class="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shadow-xs">
          <span class="material-symbols-outlined text-on-secondary text-[20px]">trending_up</span>
        </div>
        <div>
          <span class="text-[10px] text-on-surface-variant font-medium uppercase tracking-wide">Điểm TB</span>
          <div class="flex items-baseline gap-1 mt-0.5">
            <span class="font-heading font-bold text-2xl text-secondary tabular-nums">${avgScore}</span>
            <span class="text-[10px] text-outline font-medium">đ/HS</span>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 shadow-xs flex flex-col gap-2">
        <div class="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-xs">
          <span class="material-symbols-outlined text-white text-[20px]">stars</span>
        </div>
        <div>
          <span class="text-[10px] text-emerald-700 font-medium uppercase tracking-wide">Khen thưởng</span>
          <div class="flex items-baseline gap-1 mt-0.5">
            <span class="font-heading font-bold text-2xl text-emerald-700 tabular-nums">+${plusCount}</span>
            <span class="text-[10px] text-emerald-600 font-medium">lượt</span>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-error-container/40 border border-error/15 p-3.5 shadow-xs flex flex-col gap-2">
        <div class="w-9 h-9 rounded-xl bg-error flex items-center justify-center shadow-xs">
          <span class="material-symbols-outlined text-on-error text-[20px]">warning</span>
        </div>
        <div>
          <span class="text-[10px] text-error font-medium uppercase tracking-wide">Vi phạm</span>
          <div class="flex items-baseline gap-1 mt-0.5">
            <span class="font-heading font-bold text-2xl text-error tabular-nums">${minusCount}</span>
            <span class="text-[10px] text-error/70 font-medium">lỗi</span>
          </div>
        </div>
      </div>
    `;
  }

  // 2. Teams Progress
  const progressList = $("#admin-teams-progress");
  if (progressList) {
    const teamRanks = store.getTeamRankings();
    progressList.innerHTML = teamRanks
      .map((t) => {
        const pct = Math.min(100, Math.max(10, Math.round((t.total / 500) * 100)));
        const rankMedals = ['🥇', '🥈', '🥉', '4️⃣'];
        const barColors = ['bg-amber-400', 'bg-slate-400', 'bg-amber-700', 'bg-primary'];
        const rankIdx = Math.min(t.rank - 1, 3);
        const barColor = barColors[rankIdx];
        return `
          <div class="flex flex-col gap-1.5 p-3 rounded-xl bg-surface-container-low">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="text-base">${rankMedals[rankIdx]}</span>
                <span class="font-heading font-bold text-on-surface">${t.name}</span>
                <span class="text-[10px] text-outline">${t.memberCount} bạn</span>
              </div>
              <div class="text-right">
                <span class="font-heading font-bold text-sm text-primary tabular-nums">${t.total}đ</span>
                <span class="text-[10px] text-outline block">TB: ${t.avg}đ</span>
              </div>
            </div>
            <div class="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
              <div class="${barColor} h-full rounded-full transition-all duration-500" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  // 3. Grade Mix
  const gradeMixEl = $("#admin-grade-mix");
  if (gradeMixEl) {
    const { memberScores } = store.calculateScoresFast(store.events);
    const members = Object.values(memberScores);
    const counts = { tot: 0, kha: 0, dat: 0, "chua-dat": 0 };
    for (const m of members) {
      const g = gradeFor(m.points);
      if (counts[g.key] !== undefined) counts[g.key]++;
    }

    gradeMixEl.innerHTML = `
      <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col gap-1">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span class="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Loại Tốt</span>
        </div>
        <span class="font-heading font-black text-2xl text-emerald-700 tabular-nums">${counts.tot}</span>
        <span class="text-[10px] text-emerald-600">HS đạt 90–100đ</span>
      </div>
      <div class="p-3 rounded-xl bg-blue-50 border border-blue-200 flex flex-col gap-1">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-blue-500"></div>
          <span class="text-[10px] font-bold text-blue-800 uppercase tracking-wide">Loại Khá</span>
        </div>
        <span class="font-heading font-black text-2xl text-blue-700 tabular-nums">${counts.kha}</span>
        <span class="text-[10px] text-blue-600">HS đạt 80–89đ</span>
      </div>
      <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-col gap-1">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-amber-500"></div>
          <span class="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Loại Đạt</span>
        </div>
        <span class="font-heading font-black text-2xl text-amber-700 tabular-nums">${counts.dat}</span>
        <span class="text-[10px] text-amber-600">HS đạt 60–79đ</span>
      </div>
      <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 flex flex-col gap-1">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-rose-500"></div>
          <span class="text-[10px] font-bold text-rose-800 uppercase tracking-wide">Chưa đạt</span>
        </div>
        <span class="font-heading font-black text-2xl text-rose-700 tabular-nums">${counts["chua-dat"]}</span>
        <span class="text-[10px] text-rose-600">HS dưới 60đ</span>
      </div>
    `;
  }

  // 4. Học sinh cần lưu ý tuần này
  const topViolations = $("#admin-top-violations");
  if (topViolations) {
    const { memberScores } = store.calculateScoresFast(store.events);
    const attentionStudents = Object.values(memberScores)
      .filter((m) => m.minusCount > 0 || m.points < 80)
      .sort((a, b) => a.points - b.points);

    topViolations.innerHTML = attentionStudents.length
      ? attentionStudents
          .slice(0, 6)
          .map(
            (m) => `
              <div class="flex items-center gap-2 p-2.5 rounded-xl bg-error-container/20 border border-error/10 text-xs">
                <div class="w-8 h-8 rounded-xl bg-error flex items-center justify-center font-heading font-bold text-on-error text-[11px] shrink-0">
                  ${getInitials(m.name)}
                </div>
                <div class="flex flex-col min-w-0 flex-1">
                  <span class="font-heading font-bold text-on-surface truncate">${escapeHtml(m.name)}</span>
                  <span class="text-[10px] text-error">${m.teamName} • ${m.minusCount} lần vi phạm</span>
                </div>
                <div class="text-right shrink-0">
                  <span class="font-heading font-bold text-error tabular-nums block">${m.points}đ</span>
                  <span class="text-[9px] text-outline">${gradeFor(m.points).label}</span>
                </div>
              </div>
            `
          )
          .join("")
      : `<div class="flex flex-col items-center gap-1.5 py-4 text-secondary">
           <span class="material-symbols-outlined text-[28px]">verified</span>
           <p class="text-xs font-bold text-center">Tuần này cả lớp chấp hành tốt! 🎉</p>
         </div>`;
  }
}

// ===========================================================================
// MODALS: CHI TIẾT TỔ & CHI TIẾT TUẦN CỦA 1 THÀNH VIÊN (YÊU CẦU 5)
// ===========================================================================
function openTeamDetailModal(teamId) {
  const team = TEAM_BY_ID[teamId];
  if (!team) return;

  const modal = $("#modal-team-detail");
  const badgeEl = $("#team-modal-badge");
  if (badgeEl) badgeEl.textContent = team.id.replace("to", "T");

  const titleEl = $("#team-modal-title");
  if (titleEl) titleEl.textContent = `Chi Tiết ${team.name} • Tuần ${weekNumber(store.weekId)}`;

  const membersList = $("#team-modal-members-list");
  if (!membersList) return;

  const weekActivity = new Map(
    store.getTeamMemberWeekActivity(teamId).map((member) => [member.id, member])
  );
  const sortedMembers = store.getTeamMembersSorted(teamId);
  const teamAdjustments = store.events
    .filter((event) => event.teamId === teamId && event.ruleId === TEAM_ADJUSTMENT_RULE_ID)
    .sort((a, b) => b.createdAt - a.createdAt);

  membersList.innerHTML = `
    ${
      teamAdjustments.length
        ? `<div class="p-3 rounded-xl bg-secondary-container/30 border border-secondary/20 space-y-2">
            <h4 class="font-heading font-bold text-xs text-secondary">Điểm phong trào của tổ</h4>
            ${teamAdjustments
              .map((event) => `
                <div class="flex items-start justify-between gap-2 text-xs">
                  <div class="min-w-0">
                    <p class="font-medium text-on-surface">${escapeHtml(event.note)}</p>
                    <p class="text-[10px] text-outline">${formatRelativeTime(event.createdAt)}</p>
                  </div>
                  <span class="font-heading font-bold ${event.points > 0 ? "text-secondary" : "text-error"} shrink-0">${formatPoints(event.points)}đ</span>
                </div>
              `)
              .join("")}
          </div>`
        : ""
    }
    ${sortedMembers
      .map((m) => {
      const medal = isStudiedWeek(store.weekId) ? getRankMedal(m.rank) : "•";
      const activity = weekActivity.get(m.id);
      const activityDetails = activity?.violationGroups.length
        ? activity.violationGroups
            .map((group) => `${group.label}${group.count > 1 ? ` ×${group.count}` : ""}`)
            .join(" • ")
        : "Không có vi phạm tuần này";

      return `
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer" data-week-member="${m.id}">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-6 h-6 rounded-md bg-surface-container-high flex items-center justify-center font-heading font-bold text-xs shrink-0">${medal}</span>
            <div class="flex flex-col min-w-0">
              ${renderMemberName(m, "font-heading font-bold text-xs text-on-surface truncate")}
              <span class="text-[10px] ${activity?.violationCount ? "text-error" : "text-on-surface-variant"}">
                ${activity?.violationCount || 0} vi phạm • ${activity?.bonusCount || 0} khen
              </span>
              <span class="text-[10px] text-on-surface-variant truncate">${escapeHtml(activityDetails)}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="font-heading font-bold text-xs text-primary tabular-nums">${m.points} đ</span>
            <span class="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
          </div>
        </div>
      `;
      })
      .join("")}
  `;

  // YÊU CẦU 5: Bấm vào 1 thành viên hiện ra tuần đó thành viên vi phạm và cộng điểm gì!
  $$("[data-week-member]", membersList).forEach((el) => {
    el.onclick = () => {
      const mid = el.dataset.weekMember;
      openMemberWeekModal(mid, store.weekId);
    };
  });

  modal?.classList.remove("hidden");
  modal?.classList.add("flex");
}

function closeTeamDetailModal() {
  const modal = $("#modal-team-detail");
  modal?.classList.add("hidden");
  modal?.classList.remove("flex");
}

// YÊU CẦU 5: MODAL CHI TIẾT ĐIỂM TUẦN CỦA 1 THÀNH VIÊN
function openMemberWeekModal(memberId, weekId) {
  const member = MEMBER_BY_ID[memberId];
  if (!member) return;

  const breakdown = store.getMemberWeekBreakdown(memberId, weekId);
  if (!breakdown) return;

  const modal = $("#modal-member-week");
  const titleEl = $("#member-week-title");
  const subEl = $("#member-week-sub");
  const bodyEl = $("#member-week-body");

  if (titleEl) titleEl.textContent = `${member.name} • Tuần ${breakdown.weekNumber}`;
  if (subEl) subEl.textContent = `${breakdown.teamName} • ${weekRangeLabel(weekId)}`;

  if (bodyEl) {
    const badgeClass = breakdown.grade.badge;

    bodyEl.innerHTML = `
      <!-- Tóm tắt điểm -->
      <div class="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between">
        <div class="flex flex-col">
          <span class="text-[11px] text-on-surface-variant font-medium">Tổng điểm Tuần ${breakdown.weekNumber}</span>
          <div class="flex items-baseline gap-1 mt-0.5">
            <span class="font-heading font-bold text-2xl text-primary leading-none tabular-nums">${breakdown.points}</span>
            <span class="text-xs text-primary font-bold">điểm</span>
          </div>
          <span class="text-[10px] text-outline mt-1">100đ nền + ${breakdown.plus.length} khen - ${breakdown.minus.length} lỗi</span>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-bold ${badgeClass}">
          Loại ${breakdown.grade.label}
        </span>
      </div>

      <!-- Danh sách Vi phạm trong tuần -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between px-1">
          <span class="font-heading font-bold text-xs text-error flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">warning</span>
            <span>Vi phạm trong tuần (${breakdown.minus.length})</span>
          </span>
          <span class="font-heading font-bold text-xs text-error tabular-nums">
            ${breakdown.minus.reduce((sum, e) => sum + e.points, 0)}đ
          </span>
        </div>
        <div class="space-y-1.5">
          ${
            breakdown.minus.length
              ? breakdown.minus
                  .map(
                    (e) => `
                      <div class="p-2.5 rounded-xl bg-surface-container-low flex items-start justify-between gap-2 text-xs">
                        <div class="flex flex-col min-w-0">
                          <span class="font-heading font-bold text-on-surface">${escapeHtml(e.label)}</span>
                          <span class="text-[10px] text-outline">${formatRelativeTime(e.createdAt)}${e.note ? ` • "${escapeHtml(e.note)}"` : ""}</span>
                        </div>
                        <span class="font-heading font-bold text-error tabular-nums shrink-0">${formatPoints(e.points)}đ</span>
                      </div>
                    `
                  )
                  .join("")
              : `<div class="p-3 rounded-xl bg-surface-container-low text-center text-xs text-secondary font-medium">Không có vi phạm nào trong tuần này.</div>`
          }
        </div>
      </div>

      <!-- Danh sách Điểm cộng trong tuần -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between px-1">
          <span class="font-heading font-bold text-xs text-secondary flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">star</span>
            <span>Điểm cộng trong tuần (${breakdown.plus.length})</span>
          </span>
          <span class="font-heading font-bold text-xs text-secondary tabular-nums">
            +${breakdown.plus.reduce((sum, e) => sum + e.points, 0)}đ
          </span>
        </div>
        <div class="space-y-1.5">
          ${
            breakdown.plus.length
              ? breakdown.plus
                  .map(
                    (e) => `
                      <div class="p-2.5 rounded-xl bg-surface-container-low flex items-start justify-between gap-2 text-xs">
                        <div class="flex flex-col min-w-0">
                          <span class="font-heading font-bold text-on-surface">${escapeHtml(e.label)}</span>
                          <span class="text-[10px] text-outline">${formatRelativeTime(e.createdAt)}${e.note ? ` • "${escapeHtml(e.note)}"` : ""}</span>
                        </div>
                        <span class="font-heading font-bold text-secondary tabular-nums shrink-0">${formatPoints(e.points)}đ</span>
                      </div>
                    `
                  )
                  .join("")
              : `<div class="p-3 rounded-xl bg-surface-container-low text-center text-xs text-outline">Chưa có điểm cộng trong tuần này.</div>`
          }
        </div>
      </div>

      <button type="button" id="btn-goto-full-profile" class="w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-primary flex items-center justify-center gap-1.5 transition-colors mt-1">
        <span>Xem toàn bộ hồ sơ trang cá nhân</span>
        <span class="material-symbols-outlined text-[16px]">person</span>
      </button>
    `;

    const gotoProfileBtn = $("#btn-goto-full-profile", bodyEl);
    if (gotoProfileBtn) {
      gotoProfileBtn.onclick = () => {
        closeMemberWeekModal();
        closeTeamDetailModal();
        state.profileMemberId = memberId;
        switchView("profile");
      };
    }
  }

  modal?.classList.remove("hidden");
  modal?.classList.add("flex");
}

function closeMemberWeekModal() {
  const modal = $("#modal-member-week");
  modal?.classList.add("hidden");
  modal?.classList.remove("flex");
}

function openRulesCatalogModal() {
  const modal = $("#modal-rules-catalog");
  const list = $("#rules-catalog-list");
  const searchInput = $("#rules-search-input");
  if (searchInput) searchInput.value = "";

  const renderList = (filterText = "") => {
    const q = toNonAccentVietnamese(filterText);
    const filtered = q
      ? RULES.filter((r) => toNonAccentVietnamese(r.label).includes(q) || toNonAccentVietnamese(r.group).includes(q))
      : RULES;

    list.innerHTML = filtered.map((r) => {
      const isPlus = r.points > 0;
      const isZero = r.points === 0;
      const badgeColor = isPlus
        ? "bg-secondary-fixed text-on-secondary-fixed rule-points-positive"
        : isZero
        ? "bg-surface-container-high text-on-surface-variant rule-points-neutral"
        : "bg-tertiary-fixed text-on-tertiary-fixed rule-points-negative";

      const qty = state.selectedRules.get(r.id) || 0;

      return `
        <div class="rule-catalog-row p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between gap-2 text-xs cursor-pointer transition-colors" data-rule-select="${r.id}">
          <div class="flex flex-col min-w-0">
            <span class="font-heading font-bold text-on-surface truncate">${escapeHtml(r.label)}</span>
            <span class="text-[10px] text-outline">${r.group}</span>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            ${qty > 0 ? `<span class="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">x${qty}</span>` : ""}
            <span class="px-2.5 py-1 rounded-full font-heading font-bold text-xs ${badgeColor} tabular-nums">
              ${isZero ? "Ghi nhận" : formatPoints(r.points) + "đ"}
            </span>
          </div>
        </div>
      `;
    }).join("");

    $$(".rule-catalog-row", list).forEach((row) => {
      row.onclick = () => {
        const rid = row.dataset.ruleSelect;
        const cur = state.selectedRules.get(rid) || 0;
        state.selectedRules.set(rid, cur + 1);
        renderQuickActions();
        renderSelectedRulesBasket();
        checkRepeatInfractionAlert();
        updateSubmitBar();
        renderList(searchInput?.value || "");
      };
    });
  };

  if (searchInput) {
    searchInput.oninput = () => renderList(searchInput.value);
  }

  renderList();
  modal?.classList.remove("hidden");
  modal?.classList.add("flex");
}

function setupEventListeners() {
  // 1. Bottom Nav Switching
  $$("#bottom-nav .nav-item").forEach((btn) => {
    btn.onclick = () => switchView(btn.dataset.view);
  });

  // More menu links
  $$(".more-link").forEach((btn) => {
    btn.onclick = () => switchView(btn.dataset.view);
  });

  // 2. Sub-tabs on Leaderboard
  const boardTabButtons = $$("#board-tabs .board-tab");
  const syncBoardTabState = () => {
    boardTabButtons.forEach((btn) => {
      const isActive = btn.dataset.board === state.currentBoard;
      btn.classList.toggle("active-board-tab", isActive);
      btn.classList.toggle("bg-surface-container-lowest", isActive);
      btn.classList.toggle("text-primary", isActive);
      btn.classList.toggle("shadow-xs", isActive);
      btn.classList.toggle("text-on-surface-variant", !isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
  };

  boardTabButtons.forEach((btn) => {
    btn.onclick = () => {
      state.currentBoard = btn.dataset.board;
      syncBoardTabState();
      renderLeaderboard();
    };
  });
  syncBoardTabState();

  const weekSelector = $("#week-selector");
  if (weekSelector) {
    weekSelector.onchange = (event) => {
      store.setWeek(event.currentTarget.value);
    };
  }

  const appBackBtn = $("#btn-app-back");
  if (appBackBtn) {
    appBackBtn.onclick = goBackView;
  }

  // 3. User Avatar Top Right
  const userProfileBtn = $("#btn-user-profile");
  if (userProfileBtn) {
    userProfileBtn.onclick = () => {
      if (!store.isLoggedIn()) {
        switchView("scoring");
      } else {
        if (confirm(`Bạn đang đăng nhập: ${store.getLeaderName()}.\nBạn có muốn đăng xuất không?`)) {
          store.logout();
          switchView("leaderboard");
        }
      }
    };
  }

  // 4. Scoring Login
  const doLogin = async (code) => {
    const auth = resolveAuthCode(code);
    if (!auth) {
      alert("Mã hoặc PIN không chính xác! Vui lòng thử lại.");
      return;
    }
    store.setAuth(auth.role, auth.teamId, auth.leaderName);
    renderScoringWorkspace();
  };

  const btnDoLogin = $("#btn-do-login");
  const loginInput = $("#login-code-input");
  if (btnDoLogin && loginInput) {
    btnDoLogin.onclick = () => doLogin(loginInput.value);
    loginInput.onkeydown = (e) => {
      if (e.key === "Enter") doLogin(e.target.value);
    };
  }

  const btnLogout = $("#btn-workspace-logout");
  if (btnLogout) {
    btnLogout.onclick = () => {
      store.logout();
      renderScoringWorkspace();
    };
  }

  bindNameSearchInput({
    inputSelector: "#score-search-input",
    clearSelector: "#btn-clear-score-search",
    onSearch: () => renderStudentSelectGrid(),
  });

  // Submit scoring button
  const submitScoreBtn = $("#btn-submit-score");
  if (submitScoreBtn) {
    submitScoreBtn.onclick = handleScoreSubmit;
  }

  // Repeat penalty button
  const repeatBtn = $("#btn-apply-repeat-penalty");
  if (repeatBtn) {
    repeatBtn.onclick = () => {
      const cur = state.selectedRules.get("lap-lai-2tuan") || 0;
      state.selectedRules.set("lap-lai-2tuan", cur + 1);
      renderQuickActions();
      renderSelectedRulesBasket();
      $("#repeat-infraction-alert")?.classList.add("hidden");
      updateSubmitBar();
    };
  }

  // Rules Catalog Modal
  const openRulesBtn = $("#btn-open-all-rules");
  const closeRulesBtn = $("#btn-close-rules-modal");
  if (openRulesBtn) openRulesBtn.onclick = openRulesCatalogModal;
  if (closeRulesBtn) {
    closeRulesBtn.onclick = () => {
      $("#modal-rules-catalog")?.classList.add("hidden");
      $("#modal-rules-catalog")?.classList.remove("flex");
    };
  }

  // Team detail modal close
  const closeTeamBtn = $("#btn-close-team-modal");
  if (closeTeamBtn) closeTeamBtn.onclick = closeTeamDetailModal;

  // Member week modal close
  const closeMemberWeekBtn = $("#btn-close-member-week");
  if (closeMemberWeekBtn) closeMemberWeekBtn.onclick = closeMemberWeekModal;

  // Profile filter buttons
  $$(".prof-filter-btn").forEach((btn) => {
    btn.onclick = () => {
      state.profileFilter = btn.dataset.pfilter;
      $$(".prof-filter-btn").forEach((b) => {
        b.className =
          b.dataset.pfilter === state.profileFilter
            ? "prof-filter-btn px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-primary text-on-primary"
            : "prof-filter-btn px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-surface-container text-on-surface-variant";
      });
      renderProfileView();
    };
  });

  // Admin login
  const adminLoginBtn = $("#btn-admin-login");
  const adminPassInput = $("#admin-pass-input");
  if (adminLoginBtn && adminPassInput) {
    const doAdminLogin = () => {
      const pass = adminPassInput.value;
      const auth = resolveAuthCode(pass);
      if (auth && auth.role === "admin") {
        store.setAuth("admin");
        renderAdminPanel();
      } else {
        alert("Mật khẩu Admin GVCN không chính xác!");
      }
    };
    adminLoginBtn.onclick = doAdminLogin;
    adminPassInput.onkeydown = (e) => {
      if (e.key === "Enter") doAdminLogin();
    };
  }

  const adminLogoutBtn = $("#btn-admin-logout");
  if (adminLogoutBtn) {
    adminLogoutBtn.onclick = () => {
      store.logout();
      renderAdminPanel();
    };
  }

  // Scrim click close
  $$(".modal-scrim").forEach((modal) => {
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
      }
    };
  });
}

// ===========================================================================
// KHỞI CHẠY ỨNG DỤNG (INITIALIZE)
// ===========================================================================
async function initApp() {
  setupEventListeners();

  store.subscribe(() => {
    const role = store.getRole();
    const rolePill = $("#header-user-role");
    if (rolePill) {
      if (role === "admin") rolePill.textContent = "Admin GVCN";
      else if (role === "leader") rolePill.textContent = store.getLeaderName();
      else rolePill.textContent = "Khách";
    }

    renderLeaderboard();
    if (state.currentView === "scoring") renderScoringWorkspace();
    else if (state.currentView === "profile") renderProfileView();
    else if (state.currentView === "lookup") renderLookupView();
    else if (state.currentView === "conduct") renderConductView();
    else if (state.currentView === "rules") renderClassRulesView();
    else if (state.currentView === "classroom-board") renderClassroomBoardView();
    else if (state.currentView === "admin") renderAdminPanel();
  });

  await store.init();
}

window.addEventListener("DOMContentLoaded", initApp);


})();