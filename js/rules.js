/**
 * Catalog cộng/trừ điểm theo nội quy 11A1 (2026-2027).
 * Tổ trưởng chỉ chọn mục — hệ thống tự áp điểm, không nhập tay.
 */
export const BASE_POINTS = 100;

export const GRADE_THRESHOLDS = [
  { min: 90, label: "Tốt", key: "tot" },
  { min: 80, label: "Khá", key: "kha" },
  { min: 60, label: "Đạt", key: "dat" },
  { min: 0, label: "Chưa đạt", key: "chua-dat" },
];

export function gradeFor(points) {
  for (const g of GRADE_THRESHOLDS) {
    if (points >= g.min) return g;
  }
  return GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];
}

/** @typedef {{ id: string, group: string, label: string, points: number, noteOnly?: boolean }} Rule */

/** @type {Rule[]} */
export const RULES = [
  // —— Điểm trừ ——
  {
    id: "dong-phuc-nb",
    group: "Vi phạm đồng phục",
    label: "Đồng phục — nội bộ lớp",
    points: -5,
  },
  {
    id: "dong-phuc-lop",
    group: "Vi phạm đồng phục",
    label: "Đồng phục — ảnh hưởng tới lớp",
    points: -10,
  },
  {
    id: "nghi-cp",
    group: "Nghỉ học",
    label: "Nghỉ có phép (CP)",
    points: -1,
  },
  {
    id: "nghi-kp",
    group: "Nghỉ học",
    label: "Nghỉ không phép (KP)",
    points: -10,
  },
  {
    id: "tre-cp",
    group: "Đi trễ",
    label: "Đi trễ — có phép (CP)",
    points: -1,
  },
  {
    id: "tre-kp",
    group: "Đi trễ",
    label: "Đi trễ — không phép (KP)",
    points: -10,
  },
  {
    id: "bo-tiet-cp",
    group: "Bỏ tiết",
    label: "Bỏ tiết — có phép (CP)",
    points: -1,
  },
  {
    id: "bo-tiet-kp",
    group: "Bỏ tiết",
    label: "Bỏ tiết — không phép (KP)",
    points: -10,
  },
  {
    id: "ra-khoi-lop",
    group: "Ra khỏi lớp",
    label: "Ra khỏi lớp 15 phút đầu giờ (không nhiệm vụ)",
    points: -5,
  },
  {
    id: "dt-nhac-nho",
    group: "Điện thoại",
    label: "Dùng điện thoại — có nhắc nhở",
    points: -20,
  },
  {
    id: "dt-khong-nhac",
    group: "Điện thoại",
    label: "Dùng điện thoại — không nhắc nhở",
    points: -10,
  },
  {
    id: "viec-rieng-nn",
    group: "Việc riêng giờ học",
    label: "Việc riêng — có nhắc nhở",
    points: -10,
  },
  {
    id: "viec-rieng-knn",
    group: "Việc riêng giờ học",
    label: "Việc riêng — không nhắc nhở",
    points: -5,
  },
  {
    id: "noi-tuc",
    group: "Ngôn ngữ",
    label: "Nói tục, chửi thề",
    points: -10,
  },
  {
    id: "khong-nv",
    group: "Nhiệm vụ",
    label: "Không thực hiện nhiệm vụ GVCN / BCS giao",
    points: -10,
  },
  {
    id: "doi-pho",
    group: "Đối phó nội quy",
    label: "Đối phó nội quy (tự ý)",
    points: -5,
  },
  {
    id: "tai-lieu-kt",
    group: "Kiểm tra",
    label: "Sử dụng tài liệu khi kiểm tra (ghi nhận)",
    points: 0,
    noteOnly: true,
  },
  {
    id: "gt-bao-luc",
    group: "Nghiêm trọng",
    label: "Vi phạm giao thông / bạo lực học đường (ghi nhận)",
    points: 0,
    noteOnly: true,
  },
  {
    id: "ve-sinh",
    group: "Tổ vệ sinh",
    label: "Tổ vệ sinh không đạt",
    points: -20,
  },
  {
    id: "khac",
    group: "Khác",
    label: "Vấn đề khác (trốn chào cờ, leo rào, xả rác…)",
    points: -10,
  },
  {
    id: "te-nan",
    group: "Nghiêm trọng",
    label: "Tệ nạn xã hội (ghi nhận — hạ hạnh kiểm)",
    points: 0,
    noteOnly: true,
  },
  {
    id: "lap-lai-2tuan",
    group: "Lưu ý",
    label: "Vi phạm 2 lỗi giống nhau liên tiếp trong 2 tuần",
    points: -50,
  },

  // —— Điểm cộng ——
  {
    id: "phat-bieu",
    group: "Điểm cộng",
    label: "Phát biểu (+1 / lượt)",
    points: 1,
  },
  {
    id: "diem-8",
    group: "Điểm cộng",
    label: "Điểm tốt — 8",
    points: 2,
  },
  {
    id: "diem-9",
    group: "Điểm cộng",
    label: "Điểm tốt — 9",
    points: 3,
  },
  {
    id: "diem-10",
    group: "Điểm cộng",
    label: "Điểm tốt — 10",
    points: 5,
  },
  {
    id: "pt-tt-50",
    group: "Phong trào tập thể",
    label: "PT có thành tích — hạng 1",
    points: 50,
  },
  {
    id: "pt-tt-40",
    group: "Phong trào tập thể",
    label: "PT có thành tích — hạng 2",
    points: 40,
  },
  {
    id: "pt-tt-30",
    group: "Phong trào tập thể",
    label: "PT có thành tích — hạng 3",
    points: 30,
  },
  {
    id: "pt-tt-20",
    group: "Phong trào tập thể",
    label: "PT có thành tích — hạng 4",
    points: 20,
  },
  {
    id: "pt-th-30",
    group: "Phong trào tập thể",
    label: "PT thực hiện — hạng 1",
    points: 30,
  },
  {
    id: "pt-th-20",
    group: "Phong trào tập thể",
    label: "PT thực hiện — hạng 2",
    points: 20,
  },
  {
    id: "pt-th-10",
    group: "Phong trào tập thể",
    label: "PT thực hiện — hạng 3",
    points: 10,
  },
  {
    id: "pt-th-5",
    group: "Phong trào tập thể",
    label: "PT thực hiện — hạng 4",
    points: 5,
  },
];

export const RULE_BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r]));

export function formatPoints(n) {
  if (n > 0) return `+${n}`;
  return String(n);
}

/** Nhóm rules theo group để render select */
export function rulesGrouped() {
  /** @type {Map<string, Rule[]>} */
  const map = new Map();
  for (const r of RULES) {
    if (!map.has(r.group)) map.set(r.group, []);
    map.get(r.group).push(r);
  }
  return map;
}
