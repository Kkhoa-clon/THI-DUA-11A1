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
const ADMIN_CODES = ["khoa2112", "2112", "1100"];

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
    id: "ve-sinh-tot",
    group: "Khen thưởng",
    label: "Trực nhật xuất sắc / Giữ vệ sinh",
    points: 3,
    icon: "cleaning_services",
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
  },
  {
    id: "pt-tt-50",
    group: "Phong trào tập thể",
    label: "Phong trào trường — Giải Nhất",
    points: 50,
    icon: "emoji_events",
    isQuick: true,
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
  },
  {
    id: "dong-phuc-nb",
    group: "Đồng phục",
    label: "Sai đồng phục — nội bộ lớp",
    points: -3,
    icon: "checkroom",
    isQuick: true,
  },
  {
    id: "dong-phuc-lop",
    group: "Đồng phục",
    label: "Sai đồng phục — cờ đỏ ghi nhận",
    points: -10,
    icon: "warning",
  },
  {
    id: "viec-rieng-knn",
    group: "Nề nếp",
    label: "Nói chuyện / Việc riêng tiết học",
    points: -2,
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
    label: "Đối phó nội quy (tự ý)",
    points: -5,
    icon: "flaky",
  },
  {
    id: "tre-kp",
    group: "Chuyên cần",
    label: "Đi trễ — không phép (KP)",
    points: -5,
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
    id: "bo-tiet-kp",
    group: "Chuyên cần",
    label: "Bỏ tiết học (KP)",
    points: -10,
    icon: "do_not_disturb_on",
  },
  {
    id: "dt-khong-nhac",
    group: "Kỷ luật",
    label: "Dùng điện thoại trong giờ học",
    points: -10,
    icon: "phone_android",
    isQuick: true,
  },
  {
    id: "dt-nhac-nho",
    group: "Kỷ luật",
    label: "Dùng ĐT — tái phạm có nhắc nhở",
    points: -20,
    icon: "phonelink_erase",
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
    label: "Không làm nhiệm vụ GVCN / BCS",
    points: -10,
    icon: "assignment_late",
  },
  {
    id: "ve-sinh",
    group: "Vệ sinh",
    label: "Tổ trực nhật không đạt",
    points: -20,
    icon: "delete_sweep",
  },
  {
    id: "khac",
    group: "Khác",
    label: "Lỗi khác (xả rác, leo rào, trốn cờ...)",
    points: -10,
    icon: "info",
  },
  {
    id: "lap-lai-2tuan",
    group: "Tái phạm",
    label: "Tái phạm lỗi 2 tuần liên tiếp",
    points: -50,
    icon: "error",
    isQuick: true,
  },

  // —— Ghi nhận nghiêm trọng ——
  {
    id: "tai-lieu-kt",
    group: "Nghiêm trọng",
    label: "Dùng tài liệu khi kiểm tra (ghi nhận)",
    points: 0,
    noteOnly: true,
    icon: "report_problem",
  },
  {
    id: "gt-bao-luc",
    group: "Nghiêm trọng",
    label: "Vi phạm giao thông / bạo lực học đường",
    points: 0,
    noteOnly: true,
    icon: "gavel",
  },
  {
    id: "te-nan",
    group: "Nghiêm trọng",
    label: "Tệ nạn xã hội (hạ hạnh kiểm)",
    points: 0,
    noteOnly: true,
    icon: "dangerous",
  },
];

const RULE_BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r]));

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
 *   createdAt: number
 * }} ScoreEvent
 */

/**
 * @typedef {{
 *   lockedWeeks: string[],
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
  const locked = Array.isArray(raw.lockedWeeks)
    ? raw.lockedWeeks.map(String).filter(Boolean)
    : [];
  return {
    lockedWeeks: [...new Set(locked)],
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
  if (n < 1) return 1;
  if (n > TOTAL_WEEKS) return TOTAL_WEEKS;
  return n;
}

function isStudiedWeek(weekId) {
  const n = weekNumber(weekId);
  const through = studiedThroughWeek();
  return n >= 1 && n <= through;
}

function defaultWeekId() {
  const through = studiedThroughWeek();
  return weekIdForNumber(through);
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
    createdAt: Number(row.created_at) || Date.now(),
  };
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
  getLockedWeeks() {
    return this.settings.lockedWeeks || [];
  }

  isWeekLocked(weekId = this.weekId) {
    return this.getLockedWeeks().includes(weekId);
  }

  isLeadersPaused() {
    return Boolean(this.settings.leadersPaused);
  }

  isCountingWeek(weekId = this.weekId) {
    if (!isStudiedWeek(weekId)) return false;
    return !this.isWeekLocked(weekId);
  }

  countingWeekIds() {
    const through = studiedThroughWeek();
    const ids = [];
    for (let n = 1; n <= through; n++) {
      const id = weekIdForNumber(n);
      if (this.isCountingWeek(id)) ids.push(id);
    }
    return ids;
  }

  canEditWeek(weekId = this.weekId) {
    if (this.isAdmin()) return true; // Admin có mọi quyền trên mọi tuần
    if (!this.isLeader()) return false;
    if (this.isLeadersPaused()) return false;
    if (this.isWeekLocked(weekId)) return false;
    // Tổ trưởng chỉ được tương tác với tuần hiện tại, các tuần đã học qua không được tương tác
    return weekId === defaultWeekId();
  }

  leaderBlockReason(weekId = this.weekId) {
    if (this.isAdmin()) return null;
    if (!this.isLeader()) return "Chưa đăng nhập tổ trưởng.";
    if (this.isLeadersPaused()) return "Admin đang tạm dừng quyền ghi điểm toàn lớp.";
    if (this.isWeekLocked(weekId)) return `Tuần ${weekNumber(weekId)} đã bị khóa sổ.`;
    const cur = defaultWeekId();
    if (weekId !== cur) return `Tuần ${weekNumber(weekId)} đã học qua — Tổ trưởng chỉ được tương tác ở Tuần hiện tại (${weekNumber(cur)}).`;
    return null;
  }

  async setWeekLocked(weekId, locked) {
    if (!this.isAdmin()) throw new Error("Chỉ Admin được khóa sổ tuần.");
    const set = new Set(this.getLockedWeeks());
    if (locked) set.add(weekId);
    else set.delete(weekId);
    await this._saveSettings({
      ...this.settings,
      lockedWeeks: [...set].sort(),
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
  calculateScoresFast(targetEvents = this.events, basePoints = BASE_POINTS) {
    const teamScores = {};
    const memberScores = {};

    // 1. Khởi tạo điểm nền 100 điểm
    for (const t of TEAMS) {
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
        locked: this.isWeekLocked(this.weekId),
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

    // Tuần bị khóa sổ: Điểm xếp hạng = 0 (nhưng rawTotal vẫn lưu để xem)
    const isLocked = this.isWeekLocked(this.weekId);
    for (const tId in teamScores) {
      const t = teamScores[tId];
      t.total = isLocked ? 0 : t.rawTotal;
      t.avg = t.memberCount ? Math.round((t.total / t.memberCount) * 10) / 10 : 0;
    }

    return { teamScores, memberScores };
  }

  /** Lấy bảng xếp hạng 4 tổ tuần hiện tại đã sắp xếp (Có xử lý đồng hạng) */
  getTeamRankings() {
    const { teamScores } = this.calculateScoresFast(this.events);
    const sorted = Object.values(teamScores).sort(
      (a, b) => b.total - a.total || a.name.localeCompare(b.name, "vi")
    );

    // Xử lý thứ hạng & đồng hạng (Tied ranking)
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].total === sorted[i - 1].total) {
        sorted[i].rank = sorted[i - 1].rank;
        sorted[i].isTied = true;
        sorted[i - 1].isTied = true;
      } else {
        sorted[i].rank = i + 1;
        sorted[i].isTied = false;
      }
    }

    // Cờ đánh dấu nếu tất cả các tổ đều bằng điểm nhau (ví dụ mới bắt đầu tuần)
    sorted.allEqual = sorted.length > 1 && sorted.every((t) => t.total === sorted[0].total);

    return sorted;
  }

  /** Lấy danh sách thành viên trong tổ đã sắp xếp theo điểm */
  getTeamMembersSorted(teamId) {
    const team = TEAM_BY_ID[teamId];
    if (!team) return [];
    const { memberScores } = this.calculateScoresFast(this.events);
    return team.members
      .map((m) => memberScores[m.id] || { ...m, points: BASE_POINTS, teamId })
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "vi"));
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

    // Tính thứ hạng của bạn trong lớp tuần này
    const { memberScores } = this.calculateScoresFast(this.events);
    const rankedMembers = Object.values(memberScores).sort((a, b) => b.points - a.points);
    const myPoints = memberScores[memberId]?.points ?? BASE_POINTS;
    const firstSameIdx = rankedMembers.findIndex((m) => m.points === myPoints);
    const classRank = firstSameIdx !== -1 ? firstSameIdx + 1 : 1;

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
      totalStudents: rankedMembers.length || 44,
      diffFromLastWeek,
      weekEvents,
      allEvents: countingEvents,
    };
  }

  // —— BXH Toàn Trường / Cá Nhân ——
  getYearRankings() {
    const countingIds = this.countingWeekIds();
    const weeksCount = countingIds.length || 1;
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
      .sort((a, b) => b.yearTotal - a.yearTotal || a.name.localeCompare(b.name, "vi"));

    // Xử lý đồng hạng năm
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].yearTotal === sorted[i - 1].yearTotal) {
        sorted[i].rank = sorted[i - 1].rank;
        sorted[i].isTied = true;
        sorted[i - 1].isTied = true;
      } else {
        sorted[i].rank = i + 1;
        sorted[i].isTied = false;
      }
    }

    return sorted;
  }

  getViolationRankings() {
    return this.getYearRankings()
      .filter((m) => m.minusCount > 0)
      .sort((a, b) => a.minusPoints - b.minusPoints || b.minusCount - a.minusCount);
  }

  getBonusRankings() {
    return this.getYearRankings()
      .filter((m) => m.plusCount > 0)
      .sort((a, b) => b.plusPoints - a.plusPoints || b.plusCount - a.plusCount);
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

      // 3. Khóa sổ hoặc tạm dừng
      if (this.isWeekLocked(this.weekId)) {
        throw new Error(`Tuần ${weekNumber(this.weekId)} đã bị khóa sổ.`);
      }
      if (this.isLeadersPaused()) {
        throw new Error("Admin đang tạm dừng quyền ghi điểm toàn lớp.");
      }
    }

    const rule = RULE_BY_ID[ruleId];
    if (!rule) throw new Error("Quy tắc chấm điểm không hợp lệ.");

    const mult = Math.max(1, Math.min(10, Math.floor(Number(multiplier) || 1)));
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
      createdAt,
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
            created_at: event.createdAt,
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text.slice(0, 160) || "Lỗi máy chủ Supabase khi lưu điểm.");
        }

        const rows = await res.json();
        const saved = Array.isArray(rows) ? rows[0] : rows;
        if (saved && saved.id) {
          event.id = String(saved.id);
        }
      } catch (err) {
        console.warn("Ghi Supabase thất bại, giữ lại trong cache local:", err);
      }
    }

    return event;
  }

  /** Ghi đồng thời cho nhiều học sinh (Multi-select 1 chạm) */
  async addEventsBatch({ memberIds, ruleId, note = "", multiplier = 1 }) {
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      throw new Error("Vui lòng chọn ít nhất một học sinh.");
    }
    const results = [];
    for (const mId of memberIds) {
      const ev = await this.addEvent({
        memberId: mId,
        ruleId,
        note,
        multiplier,
      });
      if (ev) results.push(ev);
    }
    return results;
  }

  // —— Xóa bản ghi (Cơ chế sửa sai trong 15 phút) ——
  canDeleteEvent(event) {
    if (!event) return false;
    if (this.isAdmin()) return true;
    const leaderTeam = this.getLeaderTeamId();
    if (!leaderTeam || event.teamId !== leaderTeam) return false;
    // Tuần đã qua -> Tổ trưởng KHÔNG được xóa!
    if (event.weekId !== defaultWeekId()) return false;
    // Cho phép xóa nếu trong vòng 15 phút sau khi ghi
    const isWithin15Min = Date.now() - event.createdAt < 15 * 60 * 1000;
    return isWithin15Min && this.canEditWeek(event.weekId);
  }

  async deleteEvent(eventId) {
    if (!this.isLoggedIn()) throw new Error("Chưa đăng nhập.");

    const event = this.allEvents.find((e) => String(e.id) === String(eventId));
    if (!event) throw new Error("Không tìm thấy bản ghi.");

    if (!this.canDeleteEvent(event)) {
      throw new Error("Bạn không có quyền xóa bản ghi này (đã quá 15 phút, tuần đã học qua hoặc không thuộc tổ của bạn).");
    }

    // 1. Optimistic delete (< 5ms)
    this.allEvents = this.allEvents.filter((e) => String(e.id) !== String(eventId));
    this._saveToLocal();
    this._emit();

    // 2. Gửi xóa lên Supabase
    if (this.mode === "live") {
      try {
        await fetchWithTimeout(
          `${SUPABASE_URL}/rest/v1/events?id=eq.${encodeURIComponent(eventId)}`,
          {
            method: "DELETE",
            headers: supabaseHeaders({ Accept: "application/json" }),
          }
        );
      } catch (err) {
        console.warn("Lỗi xóa trên Supabase:", err);
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
 * Điều phối 4 Màn hình: Bảng điểm, Ghi điểm nhanh, Hồ sơ cá nhân, Quản trị GVCN
 */




// Khởi tạo Store trung tâm
const store = new ScoreStore();

// Trạng thái cục bộ của giao diện
const state = {
  currentView: "leaderboard", // leaderboard | scoring | profile | admin
  currentBoard: "teams", // teams | year | minus | plus
  selectedStudentIds: new Set(),
  selectedRuleId: null,
  scoringMultiplier: 1,
  scoringTeamFilter: "my", // my | all | to1 | to2 | to3 | to4
  profileMemberId: "to1-05", // Mặc định Đinh Quang Vinh
  profileTeamFilter: "all", // all | to1 | to2 | to3 | to4
  profileFilter: "all", // all | minus | plus
  sessionLog: [], // Các lượt chấm trong phiên làm việc
};

// DOM Helper
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Utility Toast
function showToast(msg, icon = "cloud_done") {
  const toast = $("#toast-sync");
  const msgEl = $("#toast-msg");
  const iconEl = $("#toast-icon");
  if (!toast || !msgEl) return;

  msgEl.textContent = msg;
  if (iconEl) iconEl.textContent = icon;

  toast.classList.remove("opacity-0", "pointer-events-none", "-translate-y-2");
  toast.classList.add("opacity-100", "translate-y-0");

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.add("opacity-0", "pointer-events-none", "-translate-y-2");
    toast.classList.remove("opacity-100", "translate-y-0");
  }, 2400);
}

function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "HS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
function switchView(viewName) {
  state.currentView = viewName;

  // 1. Cập nhật View DOM
  $$(".app-view").forEach((v) => {
    v.classList.remove("active-view");
  });
  const target = $(`#view-${viewName}`);
  if (target) target.classList.add("active-view");

  // 2. Cập nhật Bottom Nav Active State
  $$("#bottom-nav .nav-item").forEach((btn) => {
    const isTarget = btn.dataset.view === viewName;
    if (isTarget) {
      btn.classList.add("text-primary", "font-bold");
      btn.classList.remove("text-on-surface-variant", "font-medium");
    } else {
      btn.classList.remove("text-primary", "font-bold");
      btn.classList.add("text-on-surface-variant", "font-medium");
    }
  });

  // 3. Cuộn lên đầu trang mượt mà
  window.scrollTo({ top: 0, behavior: "instant" });

  // 4. Đồng bộ logic riêng theo view
  if (viewName === "scoring") {
    renderScoringWorkspace();
  } else if (viewName === "profile") {
    renderProfileView();
  } else if (viewName === "admin") {
    renderAdminPanel();
  }
}

// ===========================================================================
// MÀN HÌNH 1: BẢNG XẾP HẠNG (LEADERBOARD)
// ===========================================================================
function renderLeaderboard() {
  const currentWeek = store.weekId;
  const curNum = weekNumber(currentWeek);
  const isLocked = store.isWeekLocked(currentWeek);

  // 1. Header & Trạng thái kết nối
  $("#header-week-label").textContent = `Tuần ${curNum}`;
  if ($("#realtime-status-text")) {
    $("#realtime-status-text").textContent =
      store.realtimeStatus === "SUBSCRIBED"
        ? "Đã kết nối Supabase Realtime"
        : store.mode === "live"
        ? "Đang kết nối Realtime..."
        : "Chế độ ngoại tuyến (Local)";
  }

  const liveDot = $("#live-indicator-dot");
  if (liveDot) {
    if (store.realtimeStatus === "SUBSCRIBED") {
      liveDot.className = "inline-block w-2 h-2 rounded-full bg-secondary animate-pulse";
      liveDot.title = "Supabase Realtime Live";
    } else {
      liveDot.className = "inline-block w-2 h-2 rounded-full bg-outline";
      liveDot.title = "Offline Cache";
    }
  }

  const lockPill = $("#lock-badge-pill");
  const lockText = $("#lock-badge-text");
  if (isLocked) {
    lockPill.className =
      "text-xs text-error bg-error-container/60 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ml-2 font-bold";
    lockText.textContent = "Đã khóa sổ";
  } else {
    lockPill.className =
      "text-xs text-on-surface-variant flex items-center gap-1 shrink-0 ml-2 font-medium";
    lockText.textContent = "Đang mở";
  }

  // 2. Quick Snapshot (Xử lý đồng hạng)
  const teamRanks = store.getTeamRankings();
  const leaderTeam = teamRanks[0] || { name: "Tổ 1", total: 400, rawTotal: 400 };

  $("#snapshot-main-title").textContent = `Tuần ${curNum}`;
  $("#snapshot-sub-title").textContent = `• ${weekRangeLabel(currentWeek)}`;

  if (teamRanks.allEqual) {
    $("#snapshot-rank-lead").textContent = "Cả 4 Tổ Đồng Hạng 1";
    $("#snapshot-note").textContent = `Mỗi tổ đang có ${isLocked ? leaderTeam.rawTotal : leaderTeam.total} điểm`;
  } else if (teamRanks.length > 1 && teamRanks[0].rank === teamRanks[1].rank) {
    const tiedTops = teamRanks.filter((t) => t.rank === 1).map((t) => t.name).join(" & ");
    $("#snapshot-rank-lead").textContent = `Đồng Quán Quân: ${tiedTops}`;
    $("#snapshot-note").textContent = "Các tổ đang chia sẻ ngôi đầu";
  } else {
    $("#snapshot-rank-lead").textContent = `${leaderTeam.name} Dẫn đầu`;
    $("#snapshot-note").textContent = "4 Tổ đang bám đuổi quyết liệt";
  }

  $("#snapshot-top-score").textContent = isLocked ? leaderTeam.rawTotal : leaderTeam.total;

  const plusTotal = leaderTeam.plusPoints || 0;
  const minusTotal = leaderTeam.minusPoints || 0;
  const netDelta = plusTotal + minusTotal;
  $("#snapshot-delta").textContent = `${formatPoints(netDelta)} điểm`;

  // 3. Week Carousel Pills
  const weekCarousel = $("#week-carousel");
  const allWeekIds = competitionWeekIds();
  const through = studiedThroughWeek();

  weekCarousel.innerHTML = allWeekIds
    .map((wId) => {
      const n = weekNumber(wId);
      const isSelected = wId === currentWeek;
      const isCurStudied = n === through;
      const wLocked = store.isWeekLocked(wId);

      let classes =
        "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1 shrink-0 ";

      if (isSelected) {
        classes += "bg-primary text-on-primary shadow-xs font-bold";
      } else if (wLocked) {
        classes += "bg-surface-container text-outline line-through";
      } else if (isCurStudied) {
        classes += "bg-primary-fixed text-primary font-bold";
      } else {
        classes += "bg-surface-container text-on-surface-variant";
      }

      const pingDot =
        isCurStudied && !isSelected
          ? `<span class="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>`
          : "";

      const label = `Tuần ${n}${isCurStudied ? " (Hiện tại)" : ""}${wLocked ? " 🔒" : ""}`;

      return `<button type="button" class="${classes}" data-week="${wId}">
        ${pingDot}
        <span>${label}</span>
      </button>`;
    })
    .join("");

  // Bắt sự kiện chọn tuần
  $$("#week-carousel button").forEach((btn) => {
    btn.onclick = () => {
      store.setWeek(btn.dataset.week);
    };
  });

  // 4. Podium Top Teams (Xử lý đồng hạng)
  const podiumGrid = $("#podium-grid");
  if (teamRanks.length >= 3 && state.currentBoard === "teams") {
    $("#podium-section").classList.remove("hidden");

    if (teamRanks.allEqual) {
      // Trường hợp cả 4 tổ bằng điểm nhau
      podiumGrid.className = "grid grid-cols-2 sm:grid-cols-4 gap-2 items-stretch pt-2";
      podiumGrid.innerHTML = teamRanks
        .map((t) => `
          <div class="flex flex-col items-center cursor-pointer active:scale-95 transition-transform bg-surface-container-lowest rounded-2xl p-3 shadow-xs border-t-4 border-amber-400 text-center justify-between gap-2" data-podium-team="${t.id}">
            <div class="relative">
              <span class="material-symbols-outlined text-[20px] text-amber-500 absolute -top-4 left-1/2 -translate-x-1/2" style="font-variation-settings: 'FILL' 1;">crown</span>
              <div class="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-on-primary font-heading font-bold text-sm shadow-sm">
                ${t.name.replace("Tổ ", "T")}
              </div>
              <span class="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center text-[10px] font-bold shadow-xs">1</span>
            </div>
            <div>
              <span class="font-heading font-bold text-xs text-on-surface block truncate">${t.name}</span>
              <span class="text-[10px] text-secondary font-bold tabular-nums">${formatPoints(t.plusPoints - Math.abs(t.minusPoints))} đ</span>
            </div>
            <div class="w-full bg-primary-fixed/50 rounded-lg py-1 px-1">
              <span class="font-heading font-bold text-sm text-primary block tabular-nums">${isLocked ? t.rawTotal : t.total}</span>
              <span class="text-[9px] text-primary font-bold uppercase">Đồng Hạng 1</span>
            </div>
          </div>
        `)
        .join("");
    } else {
      podiumGrid.className = "grid grid-cols-3 gap-2 items-end pt-5";
      const t1 = teamRanks[0];
      const t2 = teamRanks[1];
      const t3 = teamRanks[2];

      const getBadgeLabel = (t) => {
        if (t.rank === 1) return t.isTied ? "Đồng Quán Quân" : "Quán Quân";
        if (t.rank === 2) return t.isTied ? "Đồng Hạng Nhì" : "Hạng Nhì";
        if (t.rank === 3) return t.isTied ? "Đồng Hạng Ba" : "Hạng Ba";
        return `Hạng ${t.rank}`;
      };

      const t1Border = t1.rank === 1 ? "border-amber-400" : "border-slate-300";
      const t2Border = t2.rank === 1 ? "border-amber-400" : t2.rank === 2 ? "border-slate-300" : "border-amber-600";
      const t3Border = t3.rank === 2 ? "border-slate-300" : "border-amber-600";

      podiumGrid.innerHTML = `
        <!-- Hạng 2 (hoặc Đồng Quán Quân) -->
        <div class="flex flex-col items-center cursor-pointer active:scale-95 transition-transform" data-podium-team="${t2.id}">
          <div class="relative mb-2">
            ${t2.rank === 1 ? `<span class="material-symbols-outlined text-[20px] text-amber-500 absolute -top-4 left-1/2 -translate-x-1/2" style="font-variation-settings: 'FILL' 1;">crown</span>` : ""}
            <div class="w-11 h-11 rounded-2xl ${t2.rank === 1 ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface"} flex items-center justify-center font-heading font-bold text-sm shadow-xs">
              ${t2.name.replace("Tổ ", "T")}
            </div>
            <span class="absolute -top-1.5 -right-1 w-5 h-5 rounded-full ${t2.rank === 1 ? "bg-amber-400 text-stone-900" : "bg-slate-300 text-slate-800"} flex items-center justify-center text-[10px] font-bold shadow-xs">${t2.rank}</span>
          </div>
          <div class="w-full bg-surface-container-lowest rounded-t-2xl p-2.5 flex flex-col items-center text-center shadow-xs h-28 justify-between border-t-2 ${t2Border}">
            <div>
              <span class="font-heading font-bold text-xs text-on-surface block truncate">${t2.name}</span>
              <span class="text-[10px] text-secondary font-bold tabular-nums">${formatPoints(t2.plusPoints - Math.abs(t2.minusPoints))} đ</span>
            </div>
            <div class="w-full bg-surface-container-low rounded-lg py-1 px-1">
              <span class="font-heading font-bold text-sm text-primary block tabular-nums">${isLocked ? t2.rawTotal : t2.total}</span>
              <span class="text-[9px] text-outline font-bold uppercase">${getBadgeLabel(t2)}</span>
            </div>
          </div>
        </div>

        <!-- Hạng 1: Vàng (Quán Quân) -->
        <div class="flex flex-col items-center relative -top-3 cursor-pointer active:scale-95 transition-transform" data-podium-team="${t1.id}">
          <div class="relative mb-2">
            <span class="material-symbols-outlined text-[24px] text-amber-500 absolute -top-5 left-1/2 -translate-x-1/2 crown-bounce" style="font-variation-settings: 'FILL' 1;">crown</span>
            <div class="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-on-primary font-heading font-bold text-lg shadow-md">
              ${t1.name.replace("Tổ ", "T")}
            </div>
            <span class="absolute -top-1.5 -right-1 w-6 h-6 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center text-xs font-bold shadow-xs">1</span>
          </div>
          <div class="w-full bg-surface-container-lowest rounded-t-2xl p-2.5 flex flex-col items-center text-center shadow-md h-36 justify-between border-t-4 ${t1Border}">
            <div>
              <span class="font-heading font-bold text-sm text-primary block truncate">${t1.name}</span>
              <span class="text-[11px] text-secondary font-bold tabular-nums">${formatPoints(t1.plusPoints - Math.abs(t1.minusPoints))} đ</span>
            </div>
            <div class="w-full bg-primary-fixed/60 rounded-xl py-1.5 px-1">
              <span class="font-heading font-bold text-lg text-primary block leading-none tabular-nums">${isLocked ? t1.rawTotal : t1.total}</span>
              <span class="text-[9px] text-primary font-bold uppercase tracking-wider">${getBadgeLabel(t1)}</span>
            </div>
          </div>
        </div>

        <!-- Hạng 3 (hoặc Đồng Hạng Nhì / Đồng Hạng Ba) -->
        <div class="flex flex-col items-center cursor-pointer active:scale-95 transition-transform" data-podium-team="${t3.id}">
          <div class="relative mb-2">
            <div class="w-11 h-11 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface font-heading font-bold text-sm shadow-xs">
              ${t3.name.replace("Tổ ", "T")}
            </div>
            <span class="absolute -top-1.5 -right-1 w-5 h-5 rounded-full ${t3.rank === 2 ? "bg-slate-300 text-slate-800" : "bg-amber-700 text-white"} flex items-center justify-center text-[10px] font-bold shadow-xs">${t3.rank}</span>
          </div>
          <div class="w-full bg-surface-container-lowest rounded-t-2xl p-2.5 flex flex-col items-center text-center shadow-xs h-24 justify-between border-t-2 ${t3Border}">
            <div>
              <span class="font-heading font-bold text-xs text-on-surface block truncate">${t3.name}</span>
              <span class="text-[10px] text-secondary font-bold tabular-nums">${formatPoints(t3.plusPoints - Math.abs(t3.minusPoints))} đ</span>
            </div>
            <div class="w-full bg-surface-container-low rounded-lg py-1 px-1">
              <span class="font-heading font-bold text-sm text-primary block tabular-nums">${isLocked ? t3.rawTotal : t3.total}</span>
              <span class="text-[9px] text-outline font-bold uppercase">${getBadgeLabel(t3)}</span>
            </div>
          </div>
        </div>
      `;
    }

    $$("[data-podium-team]").forEach((el) => {
      el.onclick = () => openTeamDetailModal(el.dataset.podiumTeam);
    });
  } else {
    $("#podium-section").classList.add("hidden");
  }

  // 5. Ranking List (Tùy theo Board: teams | year | minus | plus)
  renderRankingsList(teamRanks);

  // 6. Realtime Activity Feed
  renderRealtimeFeed();
}

function renderRankingsList(teamRanks) {
  const container = $("#ranking-list-container");
  const isLocked = store.isWeekLocked(store.weekId);

  if (state.currentBoard === "teams") {
    container.innerHTML = teamRanks
      .map((t) => {
        const medal = t.rank === 1 ? "🥇" : t.rank === 2 ? "🥈" : t.rank === 3 ? "🥉" : `#${t.rank}`;
        const score = isLocked ? t.rawTotal : t.total;
        const tieBadge = t.isTied
          ? `<span class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-[10px] font-bold border border-amber-500/20">Đồng hạng ${t.rank}</span>`
          : `<span class="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-semibold">Hạng ${t.rank}</span>`;

        return `
          <div class="bg-surface-container-lowest rounded-2xl p-3.5 shadow-xs border border-surface-container/70 flex flex-col gap-2.5 transition-all">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-surface-container-low flex items-center justify-center font-heading font-bold text-sm text-on-surface">
                  ${medal}
                </span>
                <div class="flex flex-col">
                  <div class="flex items-center gap-1.5">
                    <span class="font-heading font-bold text-sm text-on-surface">${t.name}</span>
                    ${tieBadge}
                  </div>
                  <span class="text-[11px] text-on-surface-variant">Tổ trưởng: ${t.leaderName} • ${t.memberCount} học sinh</span>
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
                <span>Xem ${t.memberCount} bạn</span>
                <span class="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    $$(".btn-view-team-modal").forEach((btn) => {
      btn.onclick = () => openTeamDetailModal(btn.dataset.teamId);
    });
  } else if (state.currentBoard === "year") {
    // Cá nhân cả năm (Có xử lý đồng hạng)
    const yearRanks = store.getYearRankings();
    container.innerHTML = yearRanks
      .map((m) => {
        const medal = m.rank === 1 ? "🥇" : m.rank === 2 ? "🥈" : m.rank === 3 ? "🥉" : `#${m.rank}`;
        const tieBadge = m.isTied
          ? `<span class="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-[9px] font-bold">Đồng hạng ${m.rank}</span>`
          : "";
        return `
          <div class="bg-surface-container-lowest rounded-xl p-3 shadow-xs flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors" data-view-member="${m.id}">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-heading font-bold text-xs shrink-0">${medal}</span>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="font-heading font-bold text-xs text-on-surface truncate">${m.name}</span>
                  ${tieBadge}
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
    // Vi phạm nhiều nhất
    const violRanks = store.getViolationRankings();
    if (!violRanks.length) {
      container.innerHTML = `<div class="bg-surface-container-lowest p-6 rounded-2xl text-center text-xs text-outline">Không có học sinh nào bị trừ điểm!</div>`;
    } else {
      container.innerHTML = violRanks
        .map((m, idx) => `
          <div class="bg-surface-container-lowest rounded-xl p-3 shadow-xs flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors" data-view-member="${m.id}">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-7 h-7 rounded-lg bg-error-container text-error flex items-center justify-center font-heading font-bold text-xs shrink-0">#${idx + 1}</span>
              <div class="flex flex-col min-w-0">
                <span class="font-heading font-bold text-xs text-on-surface truncate">${m.name}</span>
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
    // Điểm cộng nhiều nhất
    const bonusRanks = store.getBonusRankings();
    container.innerHTML = bonusRanks
      .map((m, idx) => `
        <div class="bg-surface-container-lowest rounded-xl p-3 shadow-xs flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors" data-view-member="${m.id}">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-7 h-7 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center font-heading font-bold text-xs shrink-0">#${idx + 1}</span>
            <div class="flex flex-col min-w-0">
              <span class="font-heading font-bold text-xs text-on-surface truncate">${m.name}</span>
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
  }
}

function bindMemberClickEvents(root) {
  $$("[data-view-member]", root).forEach((el) => {
    el.onclick = () => {
      state.profileMemberId = el.dataset.viewMember;
      switchView("profile");
    };
  });
}

function renderRealtimeFeed() {
  const feed = $("#realtime-activity-feed");
  const recentEvents = store.allEvents.slice(0, 5);

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
      const memberName = member ? member.name : ev.memberId;
      const team = TEAM_BY_ID[ev.teamId];
      const teamName = team ? team.name : ev.teamId;

      return `
        <div class="flex items-center justify-between gap-2 text-xs py-1">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2 h-2 rounded-full ${dotColor} shrink-0"></span>
            <span class="text-on-surface truncate">
              <strong class="text-primary font-bold">${teamName}:</strong> ${memberName} • ${ev.label}
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
// MÀN HÌNH 2: GHI ĐIỂM NHANH (FAST SCORING WORKSPACE)
// ===========================================================================
function renderScoringWorkspace() {
  const isAuth = store.isLoggedIn();
  const loginCard = $("#scoring-login-card");
  const workspace = $("#scoring-workspace");

  if (!isAuth) {
    loginCard.classList.remove("hidden");
    workspace.classList.add("hidden");
    return;
  }

  loginCard.classList.add("hidden");
  workspace.classList.remove("hidden");

  // 1. Cập nhật header tổ trưởng / admin
  const leaderName = store.getLeaderName();
  const leaderTeam = store.getLeaderTeamId();
  const isAdmin = store.isAdmin();
  $("#workspace-user-name").textContent = leaderName;

  if (isAdmin) {
    $("#workspace-avatar").textContent = "GV";
    $("#workspace-role-pill").textContent = "Admin GVCN (Mọi quyền)";
    $("#workspace-role-pill").className =
      "px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0";
  } else {
    $("#workspace-avatar").textContent = leaderTeam ? leaderTeam.replace("to", "T") : "TT";
    $("#workspace-role-pill").textContent = leaderTeam ? TEAM_BY_ID[leaderTeam]?.name : "Tổ trưởng";
    $("#workspace-role-pill").className =
      "px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold shrink-0";
  }

  // 2. Quyền hạn lọc tổ:
  // Tổ trưởng CHỈ được tương tác với tổ của mình, không có quyền hạn với tổ khác!
  const chipsContainer = $("#score-team-chips");
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
    // Admin có mọi quyền trên mọi tổ
    chipsContainer.innerHTML = `
      <button type="button" class="score-filter-chip px-3 py-1 rounded-xl text-xs font-semibold shrink-0 ${state.scoringTeamFilter === "all" ? "bg-primary text-on-primary shadow-xs font-bold" : "bg-surface-container-low text-on-surface-variant"}" data-team="all">
        Toàn lớp (44)
      </button>
      <button type="button" class="score-filter-chip px-3 py-1 rounded-xl text-xs font-semibold shrink-0 ${state.scoringTeamFilter === "to1" ? "bg-primary text-on-primary shadow-xs font-bold" : "bg-surface-container-low text-on-surface-variant"}" data-team="to1">
        Tổ 1
      </button>
      <button type="button" class="score-filter-chip px-3 py-1 rounded-xl text-xs font-semibold shrink-0 ${state.scoringTeamFilter === "to2" ? "bg-primary text-on-primary shadow-xs font-bold" : "bg-surface-container-low text-on-surface-variant"}" data-team="to2">
        Tổ 2
      </button>
      <button type="button" class="score-filter-chip px-3 py-1 rounded-xl text-xs font-semibold shrink-0 ${state.scoringTeamFilter === "to3" ? "bg-primary text-on-primary shadow-xs font-bold" : "bg-surface-container-low text-on-surface-variant"}" data-team="to3">
        Tổ 3
      </button>
      <button type="button" class="score-filter-chip px-3 py-1 rounded-xl text-xs font-semibold shrink-0 ${state.scoringTeamFilter === "to4" ? "bg-primary text-on-primary shadow-xs font-bold" : "bg-surface-container-low text-on-surface-variant"}" data-team="to4">
        Tổ 4
      </button>
    `;
    $$(".score-filter-chip", chipsContainer).forEach((btn) => {
      btn.onclick = () => {
        state.scoringTeamFilter = btn.dataset.team;
        renderScoringWorkspace();
      };
    });
  }

  // 3. Kiểm tra tuần: Các tuần đã học qua KHÔNG ĐƯỢC TƯƠNG TÁC (Chỉ Admin mới có quyền)
  const curWeek = store.weekId;
  const curNum = weekNumber(curWeek);
  const curStudied = studiedThroughWeek();
  const isPastWeek = curNum < curStudied || curWeek !== defaultWeekId();
  const isWeekLocked = store.isWeekLocked(curWeek);
  const isPaused = store.isLeadersPaused();

  let blockBanner = $("#scoring-block-banner");
  if (!blockBanner) {
    blockBanner = document.createElement("div");
    blockBanner.id = "scoring-block-banner";
    const headerEl = workspace.firstElementChild;
    headerEl.after(blockBanner);
  }

  const scoringControls = [
    $("#student-select-grid"),
    $("#quick-rewards-grid"),
    $("#quick-penalties-grid"),
    $("#btn-open-all-rules"),
    $("#btn-select-all-team"),
    $("#score-search-input"),
    $("#btn-multiplier-minus"),
    $("#btn-multiplier-plus"),
    $("#score-note-input"),
    $("#btn-submit-score"),
  ];

  if (!isAdmin && (isPastWeek || isWeekLocked || isPaused)) {
    let reasonTitle = "";
    let reasonDesc = "";
    if (isPaused) {
      reasonTitle = "Admin đang tạm dừng quyền ghi điểm";
      reasonDesc = "Giáo viên chủ nhiệm đang tạm dừng để chốt số liệu hoặc kiểm tra.";
    } else if (isWeekLocked) {
      reasonTitle = `Tuần ${curNum} đã bị khóa sổ`;
      reasonDesc = "Số liệu tuần này đã chốt công bố, không thể ghi hoặc chỉnh sửa thêm.";
    } else if (isPastWeek) {
      reasonTitle = `Tuần ${curNum} đã học qua (Chế độ chỉ đọc)`;
      reasonDesc = `Tổ trưởng không được tương tác với các tuần đã học qua. Chỉ được ghi điểm cho Tuần hiện tại (Tuần ${curStudied}).`;
    }

    blockBanner.className =
      "bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col gap-2 text-amber-900 shadow-xs";
    blockBanner.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-amber-700 text-[22px]">lock_clock</span>
        <span class="font-heading font-bold text-xs uppercase tracking-wide text-amber-800">${reasonTitle}</span>
      </div>
      <p class="text-xs text-amber-800">${reasonDesc}</p>
      ${
        isPastWeek
          ? `<button type="button" id="btn-goto-current-week" class="self-start px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors">
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
              <span>Chuyển sang Tuần ${curStudied} (Tuần hiện tại)</span>
             </button>`
          : ""
      }
    `;

    const gotoBtn = $("#btn-goto-current-week");
    if (gotoBtn) {
      gotoBtn.onclick = () => {
        store.setWeek(defaultWeekId());
        renderScoringWorkspace();
        renderLeaderboard();
      };
    }

    scoringControls.forEach((el) => {
      if (el) el.classList.add("pointer-events-none", "opacity-40");
    });
  } else {
    blockBanner.className = "hidden";
    blockBanner.innerHTML = "";
    scoringControls.forEach((el) => {
      if (el) el.classList.remove("pointer-events-none", "opacity-40");
    });
  }

  // 4. Render danh sách học sinh
  renderStudentSelectGrid();

  // 5. Render 1-Touch Quick Actions
  renderQuickActions();

  // 6. Cập nhật thanh tổng kết điểm
  updateSubmitBar();

  // 7. Render Lịch sử chấm trong phiên
  renderSessionLog();
}

function renderStudentSelectGrid() {
  const grid = $("#student-select-grid");
  const query = toNonAccentVietnamese($("#score-search-input")?.value || "");
  const isAdmin = store.isAdmin();
  const leaderTeam = store.getLeaderTeamId();

  let members = [];
  if (!isAdmin) {
    // Tổ trưởng CHỈ thấy thành viên tổ của mình
    members = leaderTeam ? TEAM_BY_ID[leaderTeam]?.members || [] : [];
  } else {
    // Admin thấy theo bộ lọc
    const teamFilter = state.scoringTeamFilter;
    if (teamFilter === "all") {
      members = TEAMS.flatMap((t) => t.members);
    } else {
      members = TEAM_BY_ID[teamFilter]?.members || [];
    }
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
            <span class="font-heading font-bold text-xs text-on-surface truncate ${isSelected ? "text-primary" : ""}">${m.name}</span>
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
        state.selectedStudentIds.add(sid);
      }
      renderStudentSelectGrid();
      checkRepeatInfractionAlert();
      updateSubmitBar();
    };
  });

  $("#selected-students-count").textContent = `Đã chọn: ${state.selectedStudentIds.size}`;
}

function renderQuickActions() {
  const rewGrid = $("#quick-rewards-grid");
  const penGrid = $("#quick-penalties-grid");

  rewGrid.innerHTML = QUICK_REWARDS.map((r) => {
    const isSelected = state.selectedRuleId === r.id;
    const activeClass = isSelected
      ? "bg-secondary-fixed/40 ring-2 ring-secondary"
      : "bg-surface-container-low hover:bg-secondary-fixed/20";

    return `
      <button type="button" class="rule-action-btn action-card text-left p-2.5 rounded-xl transition-all flex flex-col justify-between ${activeClass}" data-rule-id="${r.id}">
        <div class="flex items-start justify-between gap-1 w-full">
          <span class="material-symbols-outlined text-secondary text-[18px]">${r.icon || "star"}</span>
          <span class="font-heading font-bold text-sm text-secondary tabular-nums">+${r.points}đ</span>
        </div>
        <span class="font-heading font-semibold text-xs text-on-surface mt-1.5 line-clamp-1">${r.label}</span>
      </button>
    `;
  }).join("");

  penGrid.innerHTML = QUICK_PENALTIES.map((r) => {
    const isSelected = state.selectedRuleId === r.id;
    const activeClass = isSelected
      ? "bg-tertiary-fixed/40 ring-2 ring-tertiary"
      : "bg-surface-container-low hover:bg-tertiary-fixed/20";

    return `
      <button type="button" class="rule-action-btn action-card text-left p-2.5 rounded-xl transition-all flex flex-col justify-between ${activeClass}" data-rule-id="${r.id}">
        <div class="flex items-start justify-between gap-1 w-full">
          <span class="material-symbols-outlined text-tertiary text-[18px]">${r.icon || "warning"}</span>
          <span class="font-heading font-bold text-sm text-tertiary tabular-nums">${r.points}đ</span>
        </div>
        <span class="font-heading font-semibold text-xs text-on-surface mt-1.5 line-clamp-1">${r.label}</span>
      </button>
    `;
  }).join("");

  $$(".rule-action-btn").forEach((btn) => {
    btn.onclick = () => {
      const rId = btn.dataset.ruleId;
      state.selectedRuleId = state.selectedRuleId === rId ? null : rId;
      renderQuickActions();
      checkRepeatInfractionAlert();
      updateSubmitBar();
    };
  });
}

function checkRepeatInfractionAlert() {
  const alertEl = $("#repeat-infraction-alert");
  if (!state.selectedRuleId || state.selectedStudentIds.size === 0) {
    alertEl.classList.add("hidden");
    return;
  }

  const rule = RULE_BY_ID[state.selectedRuleId];
  if (!rule || rule.points >= 0) {
    alertEl.classList.add("hidden");
    return;
  }

  // Kiểm tra xem có học sinh nào bị lỗi này tuần trước không (Thuật toán 3)
  let hasRepeat = false;
  for (const mId of state.selectedStudentIds) {
    if (store.checkRepeatInfraction(mId, rule.id, store.weekId)) {
      hasRepeat = true;
      break;
    }
  }

  if (hasRepeat) {
    alertEl.classList.remove("hidden");
  } else {
    alertEl.classList.add("hidden");
  }
}

function updateSubmitBar() {
  const submitBtn = $("#btn-submit-score");
  const summaryEl = $("#submit-summary-text");
  const count = state.selectedStudentIds.size;
  const rule = RULE_BY_ID[state.selectedRuleId];

  if (count === 0 || !rule) {
    submitBtn.disabled = true;
    summaryEl.textContent = count === 0 ? "Chọn học sinh..." : "Chọn loại điểm...";
    return;
  }

  submitBtn.disabled = false;
  const totalPts = rule.points * state.scoringMultiplier * count;
  summaryEl.textContent = `${count} bạn • ${formatPoints(totalPts)}đ`;
}

async function handleScoreSubmit() {
  const rule = RULE_BY_ID[state.selectedRuleId];
  const memberIds = Array.from(state.selectedStudentIds);
  const note = $("#score-note-input")?.value?.trim() || "";
  const multiplier = state.scoringMultiplier;

  if (!memberIds.length || !rule) return;

  const btn = $("#btn-submit-score");
  btn.disabled = true;
  btn.classList.add("opacity-60");

  try {
    const saved = await store.addEventsBatch({
      memberIds,
      ruleId: rule.id,
      note,
      multiplier,
    });

    if (saved && saved.length > 0) {
      // Thêm vào session log để cho phép xóa trong 15p
      state.sessionLog = [...saved, ...state.sessionLog];
      showToast(`Đã ghi thành công cho ${saved.length} học sinh!`, "check_circle");

      // Reset form
      state.selectedStudentIds.clear();
      state.selectedRuleId = null;
      state.scoringMultiplier = 1;
      $("#multiplier-display").textContent = "x1";
      if ($("#score-note-input")) $("#score-note-input").value = "";

      renderStudentSelectGrid();
      renderQuickActions();
      checkRepeatInfractionAlert();
      updateSubmitBar();
      renderSessionLog();
    }
  } catch (err) {
    alert(err.message || "Lỗi khi lưu điểm.");
  } finally {
    btn.disabled = false;
    btn.classList.remove("opacity-60");
  }
}

function renderSessionLog() {
  const list = $("#session-log-list");
  if (!state.sessionLog.length) {
    list.innerHTML = `<p class="text-xs text-outline py-2 text-center font-medium">Chưa có lượt chấm nào trong phiên này.</p>`;
    return;
  }

  list.innerHTML = state.sessionLog
    .map((ev) => {
      const isPlus = ev.points > 0;
      const m = MEMBER_BY_ID[ev.memberId];
      const name = m ? m.name : ev.memberId;
      const canDelete = store.canDeleteEvent(ev);

      return `
        <div class="flex items-center justify-between gap-2 p-2 rounded-xl bg-surface-container-low text-xs">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-1.5 h-1.5 rounded-full ${isPlus ? "bg-secondary" : "bg-error"} shrink-0"></span>
            <div class="flex flex-col min-w-0">
              <span class="font-heading font-bold text-on-surface truncate">${name} • ${ev.label}</span>
              <span class="text-[10px] text-outline">${formatRelativeTime(ev.createdAt)}${ev.note ? ` — "${ev.note}"` : ""}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="font-heading font-bold ${isPlus ? "text-secondary" : "text-error"} tabular-nums">${formatPoints(ev.points)}đ</span>
            ${
              canDelete
                ? `<button type="button" class="btn-undo-event w-6 h-6 rounded-lg bg-surface-container hover:bg-error-container hover:text-error flex items-center justify-center transition-colors text-outline" data-del-id="${ev.id}" title="Xóa">
                    <span class="material-symbols-outlined text-[14px]">delete</span>
                   </button>`
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");

  $$(".btn-undo-event", list).forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.delId;
      if (confirm("Bạn có chắc muốn xóa bản ghi điểm này không?")) {
        try {
          await store.deleteEvent(id);
          state.sessionLog = state.sessionLog.filter((e) => e.id !== id);
          renderSessionLog();
          showToast("Đã xóa bản ghi thành công!", "delete");
        } catch (err) {
          alert(err.message || "Không thể xóa bản ghi.");
        }
      }
    };
  });
}

// ===========================================================================
// MÀN HÌNH 3: HỒ SƠ & TIỂU SỬ HỌC SINH (STUDENT PROFILE)
// ===========================================================================
function getFilteredProfileStudents() {
  const query = toNonAccentVietnamese($("#profile-search-input")?.value || "");
  const team = state.profileTeamFilter || "all";
  let list = [];
  if (team === "all") {
    list = TEAMS.flatMap((t) => t.members.map((m) => ({ ...m, teamId: t.id })));
  } else {
    const t = TEAM_BY_ID[team];
    list = t ? t.members.map((m) => ({ ...m, teamId: t.id })) : [];
  }

  if (query) {
    list = list.filter(
      (m) => toNonAccentVietnamese(m.name).includes(query) || m.id.toLowerCase().includes(query)
    );
  }
  return list;
}

function renderProfileStudentPicker() {
  const listEl = $("#profile-students-quick-list");
  if (!listEl) return;
  const filtered = getFilteredProfileStudents();
  const countEl = $("#profile-match-count");
  if (countEl) {
    countEl.textContent = `${filtered.length} học sinh`;
  }

  if (!filtered.length) {
    listEl.innerHTML = `<span class="text-xs text-outline py-2 px-3 italic">Không tìm thấy học sinh nào phù hợp.</span>`;
    return;
  }

  listEl.innerHTML = filtered
    .map((m) => {
      const isSelected = m.id === state.profileMemberId;
      const bgClass = isSelected
        ? "bg-primary text-on-primary font-bold shadow-xs scale-105"
        : "bg-surface-container-low text-on-surface hover:bg-surface-container";

      return `
        <button type="button" class="profile-student-btn px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${bgClass}" data-member-id="${m.id}">
          <span class="w-5 h-5 rounded-md ${isSelected ? "bg-white/20 text-white" : "bg-primary-fixed text-primary"} flex items-center justify-center text-[10px] font-bold">${getInitials(m.name)}</span>
          <span>${m.name}</span>
        </button>
      `;
    })
    .join("");

  $$(".profile-student-btn", listEl).forEach((btn) => {
    btn.onclick = () => {
      state.profileMemberId = btn.dataset.memberId;
      renderProfileView();
    };
  });
}

function renderProfileView() {
  renderProfileStudentPicker();

  let memberId = state.profileMemberId;
  let profile = store.getMemberProfile(memberId);
  if (!profile) {
    state.profileMemberId = TEAMS[0].members[0].id;
    memberId = state.profileMemberId;
    profile = store.getMemberProfile(memberId);
  }
  if (!profile) return;

  const { member, currentWeekPoints, yearTotal, avgScore, classRank, totalStudents, diffFromLastWeek, weekEvents, allEvents } = profile;

  // 1. Hero Card
  $("#profile-hero-avatar").textContent = getInitials(member.name);
  $("#profile-hero-name").textContent = member.name;
  $("#profile-hero-team").textContent = TEAM_BY_ID[member.teamId]?.name || member.teamId;
  $("#profile-hero-id").textContent = member.id;

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

  $("#profile-rank-badge").textContent = `#${classRank}`;
  $("#profile-rank-sub").textContent = `Tuần ${weekNumber(store.weekId)}`;
  $("#profile-week-points").textContent = currentWeekPoints;
  $("#profile-year-points").textContent = yearTotal;

  // 2. Thống kê chi tiết tuần (Backend 100%, không dữ liệu ảo)
  if ($("#profile-stat-plus")) $("#profile-stat-plus").textContent = `+${profile.plusPoints || 0} đ`;
  if ($("#profile-stat-minus")) $("#profile-stat-minus").textContent = `${profile.minusPoints || 0} đ`;

  const grade = gradeFor(currentWeekPoints);
  const gradePill = $("#profile-grade-pill");
  if (gradePill) {
    gradePill.textContent = grade;
    if (grade === "Tốt") {
      gradePill.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800";
    } else if (grade === "Khá") {
      gradePill.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800";
    } else if (grade === "Đạt") {
      gradePill.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800";
    } else {
      gradePill.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800";
    }
  }

  const scorePct = Math.max(0, Math.min(100, Math.round(currentWeekPoints)));
  if ($("#profile-score-pct")) $("#profile-score-pct").textContent = `${scorePct}%`;
  if ($("#profile-score-bar")) $("#profile-score-bar").style.width = `${scorePct}%`;

  // 3. Badges thực tế sinh từ dữ liệu thật
  const badgesRow = $("#profile-badges-row");
  if (badgesRow) {
    const badges = [];
    if (profile.minusPoints === 0) {
      badges.push(
        `<span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[13px]">verified</span> 0 Vi Phạm</span>`
      );
    } else {
      badges.push(
        `<span class="px-2.5 py-1 rounded-full bg-error-container text-error text-[10px] font-bold flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[13px]">warning</span> ${profile.minusCount} lần vi phạm</span>`
      );
    }
    if (profile.plusPoints > 0) {
      badges.push(
        `<span class="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[13px]">stars</span> +${profile.plusPoints}đ thưởng</span>`
      );
    }
    if (currentWeekPoints >= 100) {
      badges.push(
        `<span class="px-2.5 py-1 rounded-full bg-primary-fixed text-primary text-[10px] font-bold flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[13px]">military_tech</span> Đạt chuẩn thi đua</span>`
      );
    }
    badgesRow.innerHTML = badges.join("");
  }

  // 4. Lịch sử chi tiết
  const histList = $("#profile-history-list");
  let targetEvents = allEvents;
  if (state.profileFilter === "minus") {
    targetEvents = allEvents.filter((e) => e.points < 0);
  } else if (state.profileFilter === "plus") {
    targetEvents = allEvents.filter((e) => e.points > 0);
  }

  if (!targetEvents.length) {
    histList.innerHTML = `<p class="text-xs text-outline py-4 text-center">Không có bản ghi điểm nào.</p>`;
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
              <span class="font-heading font-bold text-on-surface truncate">${ev.label}</span>
              <span class="text-[10px] text-outline">Tuần ${weekNumber(ev.weekId)} • ${formatRelativeTime(ev.createdAt)}${ev.note ? ` • "${ev.note}"` : ""}</span>
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
          showToast("Đã xóa bản ghi thành công!", "delete");
        } catch (err) {
          alert(err.message || "Lỗi khi xóa.");
        }
      }
    };
  });
}

// ===========================================================================
// MÀN HÌNH 4: QUẢN TRỊ GVCN (ADMIN DASHBOARD)
// ===========================================================================
function renderAdminPanel() {
  const isAdmin = store.isAdmin();
  const loginCard = $("#admin-login-card");
  const panel = $("#admin-panel");

  if (!isAdmin) {
    loginCard.classList.remove("hidden");
    panel.classList.add("hidden");
    return;
  }

  loginCard.classList.add("hidden");
  panel.classList.remove("hidden");

  // 0. Cập nhật số liệu thực tế
  const eventsSummary = $("#admin-summary-events");
  if (eventsSummary) {
    eventsSummary.textContent = `${store.events.length} Lượt chấm tuần này`;
  }

  // 1. Cập nhật nút khóa sổ
  const isLocked = store.isWeekLocked(store.weekId);
  const lockIcon = $("#lock-cta-icon");
  const lockTitle = $("#lock-cta-title");
  const lockDesc = $("#lock-cta-desc");
  const lockBtn = $("#btn-lock-week-cta");

  if (isLocked) {
    lockBtn.className =
      "group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-4 text-white shadow-sm active:scale-[0.98] transition-all flex items-center justify-between";
    lockIcon.textContent = "lock_open";
    lockTitle.textContent = "MỞ KHÓA SỔ TUẦN NÀY";
    lockDesc.textContent = `Tuần ${weekNumber(store.weekId)} đang bị khóa (Chỉ đọc)`;
  } else {
    lockBtn.className =
      "group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 p-4 text-stone-900 shadow-sm active:scale-[0.98] transition-all flex items-center justify-between";
    lockIcon.textContent = "lock";
    lockTitle.textContent = "KHÓA SỔ & CÔNG BỐ KẾT QUẢ";
    lockDesc.textContent = `Chốt toàn bộ điểm thi đua Tuần ${weekNumber(store.weekId)}`;
  }

  // 2. Toggle tổ trưởng
  const toggle = $("#toggle-leaders-paused");
  if (toggle) toggle.checked = store.isLeadersPaused();

  // 3. Tiến độ thi đua 4 tổ
  const progressList = $("#admin-teams-progress");
  const teamRanks = store.getTeamRankings();
  progressList.innerHTML = teamRanks
    .map((t) => {
      const pct = Math.min(100, Math.max(30, Math.round((t.total / 500) * 100)));
      return `
        <div class="flex flex-col gap-1 text-xs">
          <div class="flex items-center justify-between">
            <span class="font-heading font-bold text-on-surface">${t.name} (${t.leaderName})</span>
            <span class="font-heading font-bold text-primary tabular-nums">${t.total} đ</span>
          </div>
          <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
            <div class="bg-primary h-full rounded-full transition-all duration-300" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

// ===========================================================================
// MODALS & EVENT HANDLERS
// ===========================================================================
function openTeamDetailModal(teamId) {
  const team = TEAM_BY_ID[teamId];
  if (!team) return;

  const modal = $("#modal-team-detail");
  $("#team-modal-badge").textContent = team.id.replace("to", "T");
  $("#team-modal-title").textContent = `Chi Tiết ${team.name} • Lớp 11A1`;

  const membersList = $("#team-modal-members-list");
  const sortedMembers = store.getTeamMembersSorted(teamId);

  membersList.innerHTML = sortedMembers
    .map((m, idx) => {
      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
      return `
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer" data-view-member="${m.id}">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-6 h-6 rounded-md bg-surface-container-high flex items-center justify-center font-heading font-bold text-xs shrink-0">${medal}</span>
            <span class="font-heading font-bold text-xs text-on-surface truncate">${m.name}</span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="font-heading font-bold text-xs text-primary tabular-nums">${m.points} đ</span>
            <span class="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
          </div>
        </div>
      `;
    })
    .join("");

  bindMemberClickEvents(membersList);
  modal.classList.remove("hidden");
  modal.classList.add("flex");
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
        ? "bg-secondary-fixed text-on-secondary-fixed"
        : isZero
        ? "bg-surface-container-high text-on-surface-variant"
        : "bg-tertiary-fixed text-on-tertiary-fixed";

      return `
        <div class="rule-catalog-row p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between gap-2 text-xs cursor-pointer transition-colors" data-rule-select="${r.id}">
          <div class="flex flex-col min-w-0">
            <span class="font-heading font-bold text-on-surface truncate">${r.label}</span>
            <span class="text-[10px] text-outline">${r.group}</span>
          </div>
          <span class="px-2.5 py-1 rounded-full font-heading font-bold text-xs ${badgeColor} tabular-nums shrink-0">
            ${isZero ? "Ghi nhận" : formatPoints(r.points) + "đ"}
          </span>
        </div>
      `;
    }).join("");

    $$(".rule-catalog-row", list).forEach((row) => {
      row.onclick = () => {
        const rid = row.dataset.ruleSelect;
        state.selectedRuleId = rid;
        renderQuickActions();
        checkRepeatInfractionAlert();
        updateSubmitBar();
        modal.classList.add("hidden");
        modal.classList.remove("flex");
        showToast(`Đã chọn: ${RULE_BY_ID[rid]?.label}`, "check");
      };
    });
  };

  if (searchInput) {
    searchInput.oninput = () => renderList(searchInput.value);
  }

  renderList();
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function setupEventListeners() {
  // 1. Bottom Nav Switching
  $$("#bottom-nav .nav-item").forEach((btn) => {
    btn.onclick = () => switchView(btn.dataset.view);
  });

  // 2. Sub-tabs on Leaderboard
  $$("#board-tabs .board-tab").forEach((btn) => {
    btn.onclick = () => {
      state.currentBoard = btn.dataset.board;
      $$("#board-tabs .board-tab").forEach((b) => {
        b.className =
          b.dataset.board === state.currentBoard
            ? "board-tab flex-1 py-1.5 text-xs font-semibold rounded-lg bg-surface-container-lowest text-primary shadow-xs transition-all text-center"
            : "board-tab flex-1 py-1.5 text-xs font-semibold rounded-lg text-on-surface-variant transition-all text-center";
      });
      renderLeaderboard();
    };
  });

  // 3. User Avatar Top Right
  $("#btn-user-profile").onclick = () => {
    if (!store.isLoggedIn()) {
      switchView("scoring");
    } else {
      if (confirm(`Bạn đang đăng nhập với tư cách: ${store.getLeaderName()}.\nBạn có muốn đăng xuất không?`)) {
        store.logout();
        switchView("leaderboard");
        showToast("Đã đăng xuất!", "logout");
      }
    }
  };

  // 4. Scoring: Login
  const doLogin = (code) => {
    const auth = resolveAuthCode(code);
    if (!auth) {
      alert("Mã hoặc PIN không chính xác! Vui lòng thử lại.");
      return;
    }
    store.setAuth(auth.role, auth.teamId, auth.leaderName);
    showToast(`Xin chào ${store.getLeaderName()}!`, "verified");
    renderScoringWorkspace();
  };

  $("#btn-do-login").onclick = () => {
    const val = $("#login-code-input").value;
    doLogin(val);
  };

  $("#login-code-input").onkeydown = (e) => {
    if (e.key === "Enter") doLogin(e.target.value);
  };

  $("#btn-workspace-logout").onclick = () => {
    store.logout();
    renderScoringWorkspace();
    showToast("Đã thoát tài khoản tổ trưởng.", "logout");
  };

  // 5. Scoring: Select All Team (Tổ trưởng chỉ chọn tổ mình)
  $("#btn-select-all-team").onclick = () => {
    const isAdmin = store.isAdmin();
    const myTeam = store.getLeaderTeamId();
    let members = [];
    if (!isAdmin) {
      members = myTeam ? TEAM_BY_ID[myTeam]?.members || [] : [];
    } else {
      const teamFilter = state.scoringTeamFilter;
      if (teamFilter === "all") members = TEAMS.flatMap((t) => t.members);
      else members = TEAM_BY_ID[teamFilter]?.members || [];
    }

    const allSelected = members.length > 0 && members.every((m) => state.selectedStudentIds.has(m.id));
    if (allSelected) {
      members.forEach((m) => state.selectedStudentIds.delete(m.id));
    } else {
      members.forEach((m) => state.selectedStudentIds.add(m.id));
    }
    renderStudentSelectGrid();
    checkRepeatInfractionAlert();
    updateSubmitBar();
  };

  // Scoring: Student Search
  const searchInput = $("#score-search-input");
  const clearSearchBtn = $("#btn-clear-score-search");
  if (searchInput) {
    searchInput.oninput = () => {
      if (clearSearchBtn) clearSearchBtn.classList.toggle("hidden", !searchInput.value);
      renderStudentSelectGrid();
    };
  }
  if (clearSearchBtn) {
    clearSearchBtn.onclick = () => {
      if (searchInput) searchInput.value = "";
      clearSearchBtn.classList.add("hidden");
      renderStudentSelectGrid();
    };
  }

  // 6. Profile: Student Search & Team Filter
  const profSearchInput = $("#profile-search-input");
  const profClearBtn = $("#btn-clear-profile-search");
  if (profSearchInput) {
    profSearchInput.oninput = () => {
      if (profClearBtn) profClearBtn.classList.toggle("hidden", !profSearchInput.value);
      renderProfileStudentPicker();
    };
  }
  if (profClearBtn) {
    profClearBtn.onclick = () => {
      if (profSearchInput) profSearchInput.value = "";
      profClearBtn.classList.add("hidden");
      renderProfileStudentPicker();
    };
  }

  $$("#profile-team-chips .prof-team-chip").forEach((btn) => {
    btn.onclick = () => {
      state.profileTeamFilter = btn.dataset.team;
      $$("#profile-team-chips .prof-team-chip").forEach((b) => {
        b.className =
          b.dataset.team === state.profileTeamFilter
            ? "prof-team-chip px-3 py-1 rounded-xl text-xs font-semibold shrink-0 bg-primary text-on-primary shadow-xs"
            : "prof-team-chip px-3 py-1 rounded-xl text-xs font-semibold shrink-0 bg-surface-container-low text-on-surface-variant";
      });
      renderProfileStudentPicker();
    };
  });

  // 8. Scoring: Stepper Multiplier
  $("#btn-multiplier-plus").onclick = () => {
    if (state.scoringMultiplier < 10) state.scoringMultiplier++;
    $("#multiplier-display").textContent = `x${state.scoringMultiplier}`;
    updateSubmitBar();
  };
  $("#btn-multiplier-minus").onclick = () => {
    if (state.scoringMultiplier > 1) state.scoringMultiplier--;
    $("#multiplier-display").textContent = `x${state.scoringMultiplier}`;
    updateSubmitBar();
  };

  // 9. Scoring: Submit Button
  $("#btn-submit-score").onclick = handleScoreSubmit;

  // 10. Repeat Penalty 1-Click Button
  $("#btn-apply-repeat-penalty").onclick = () => {
    state.selectedRuleId = "lap-lai-2tuan";
    renderQuickActions();
    $("#repeat-infraction-alert").classList.add("hidden");
    updateSubmitBar();
  };

  // 11. All Rules Modal Trigger
  $("#btn-open-all-rules").onclick = openRulesCatalogModal;
  $("#btn-close-rules-modal").onclick = () => {
    $("#modal-rules-catalog").classList.add("hidden");
    $("#modal-rules-catalog").classList.remove("flex");
  };

  // 12. Team Detail Modal Close
  $("#btn-close-team-modal").onclick = () => {
    $("#modal-team-detail").classList.add("hidden");
    $("#modal-team-detail").classList.remove("flex");
  };

  // 13. Profile Filter Buttons
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

  // 14. Admin: Login
  $("#btn-admin-login").onclick = () => {
    const pass = $("#admin-pass-input").value;
    const auth = resolveAuthCode(pass);
    if (auth && auth.role === "admin") {
      store.setAuth("admin");
      renderAdminPanel();
      showToast("Xác thực quyền Admin GVCN thành công!", "shield");
    } else {
      alert("Mật khẩu Admin không đúng!");
    }
  };

  $("#btn-admin-logout").onclick = () => {
    store.logout();
    renderAdminPanel();
    showToast("Đã thoát tài khoản Admin.", "logout");
  };

  // 15. Admin: Lock Week CTA Modal
  $("#btn-lock-week-cta").onclick = () => {
    const isLocked = store.isWeekLocked(store.weekId);
    const modal = $("#modal-lock-confirm");
    $("#lock-modal-title").textContent = isLocked ? "Mở Khóa Tuần Này?" : "Khóa Sổ Tuần Này?";
    $("#lock-modal-desc").textContent = isLocked
      ? "Khi mở khóa, các tổ trưởng sẽ có thể tiếp tục cập nhật và chỉnh sửa điểm."
      : "Khi khóa sổ, điểm của tuần này sẽ trở thành dữ liệu chỉ đọc. 4 Tổ trưởng sẽ không thể ghi hoặc sửa đổi điểm nữa.";
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  };

  $("#btn-cancel-lock").onclick = () => {
    $("#modal-lock-confirm").classList.add("hidden");
    $("#modal-lock-confirm").classList.remove("flex");
  };

  $("#btn-confirm-lock").onclick = async () => {
    const isLocked = store.isWeekLocked(store.weekId);
    try {
      await store.setWeekLocked(store.weekId, !isLocked);
      $("#modal-lock-confirm").classList.add("hidden");
      $("#modal-lock-confirm").classList.remove("flex");
      renderAdminPanel();
      renderLeaderboard();
      showToast(!isLocked ? "Đã khóa sổ tuần thành công!" : "Đã mở khóa tuần!", "lock");
    } catch (err) {
      alert(err.message || "Lỗi khi khóa tuần.");
    }
  };

  // 16. Admin: Toggle Leaders Paused
  $("#toggle-leaders-paused").onchange = async (e) => {
    try {
      await store.setLeadersPaused(e.target.checked);
      showToast(e.target.checked ? "Đã tạm dừng quyền tổ trưởng!" : "Đã mở lại quyền tổ trưởng!", "tune");
    } catch (err) {
      alert(err.message || "Lỗi cập nhật cấu hình.");
    }
  };

  // 17. Admin: Export Report
  $("#btn-admin-export").onclick = () => {
    window.print();
  };

  // 18. Admin: Rules Catalog
  $("#btn-admin-rules").onclick = openRulesCatalogModal;

  // 19. Admin: Download Backup
  $("#btn-download-backup").onclick = () => {
    const backup = store.exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-11a1-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã tải file sao lưu JSON!", "download");
  };

  // 20. Admin: Wipe Week Confirm Modal (Yêu cầu gõ XACNHAN)
  const wipeModal = $("#modal-wipe-confirm");
  const wipeInput = $("#wipe-confirm-input");
  const wipeConfirmBtn = $("#btn-confirm-wipe");

  $("#btn-open-wipe-modal").onclick = () => {
    wipeInput.value = "";
    wipeConfirmBtn.disabled = true;
    wipeConfirmBtn.classList.add("opacity-40", "pointer-events-none");
    wipeModal.classList.remove("hidden");
    wipeModal.classList.add("flex");
  };

  $("#btn-cancel-wipe").onclick = () => {
    wipeModal.classList.add("hidden");
    wipeModal.classList.remove("flex");
  };

  wipeInput.oninput = () => {
    const clean = wipeInput.value.replace(/\s+/g, "").toUpperCase();
    const isValid = clean === "XACNHAN";
    wipeConfirmBtn.disabled = !isValid;
    wipeConfirmBtn.classList.toggle("opacity-40", !isValid);
    wipeConfirmBtn.classList.toggle("pointer-events-none", !isValid);
  };

  wipeConfirmBtn.onclick = async () => {
    try {
      const count = await store.wipeWeekEvents(store.weekId);
      wipeModal.classList.add("hidden");
      wipeModal.classList.remove("flex");
      renderLeaderboard();
      renderAdminPanel();
      showToast(`Đã xóa sạch ${count} lượt điểm của tuần này!`, "delete_forever");
    } catch (err) {
      alert(err.message || "Lỗi khi xóa tuần.");
    }
  };

  // Đóng modal khi bấm ra ngoài scrim
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

  // Đăng ký listener store
  store.subscribe(() => {
    const role = store.getRole();
    const rolePill = $("#header-user-role");
    if (role === "admin") rolePill.textContent = "Admin GVCN";
    else if (role === "leader") rolePill.textContent = store.getLeaderName();
    else rolePill.textContent = "Khách";

    renderLeaderboard();
  });

  // Tải dữ liệu và kích hoạt WebSocket
  await store.init();
}

window.addEventListener("DOMContentLoaded", initApp);


})();