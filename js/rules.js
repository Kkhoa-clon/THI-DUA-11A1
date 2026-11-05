/**
 * Danh mục quy tắc cộng/trừ điểm theo nội quy Lớp 11A1 (Niên khóa 2026–2027)
 */
export const BASE_POINTS = 100;

export const GRADE_THRESHOLDS = [
  { min: 90, label: "Tốt", key: "tot", color: "#10b981", badge: "bg-emerald-100 text-emerald-800" },
  { min: 80, label: "Khá", key: "kha", color: "#2563eb", badge: "bg-blue-100 text-blue-800" },
  { min: 60, label: "Đạt", key: "dat", color: "#f59e0b", badge: "bg-amber-100 text-amber-800" },
  { min: 0, label: "Chưa đạt", key: "chua-dat", color: "#ef4444", badge: "bg-rose-100 text-rose-800" },
];

export function gradeFor(points) {
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
export const RULES = [
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

export const RULE_BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r]));

/** Nhóm "Phong trào tập thể" = thành tích nổi bật (hạng 1–4), khác điểm cộng thường. */
export const ACHIEVEMENT_GROUPS = new Set(["Phong trào tập thể"]);

export function isAchievementRule(ruleId) {
  const r = RULE_BY_ID[ruleId];
  return !!r && ACHIEVEMENT_GROUPS.has(r.group);
}

export function formatPoints(n) {
  if (n > 0) return `+${n}`;
  return String(n);
}

export function rulesGrouped() {
  /** @type {Map<string, Rule[]>} */
  const map = new Map();
  for (const r of RULES) {
    if (!map.has(r.group)) map.set(r.group, []);
    map.get(r.group).push(r);
  }
  return map;
}

/** Danh sách quy tắc nhanh cho màn hình ghi điểm */
export const QUICK_REWARDS = RULES.filter((r) => r.points > 0 && r.isQuick);
export const QUICK_PENALTIES = RULES.filter((r) => r.points < 0 && r.isQuick);
