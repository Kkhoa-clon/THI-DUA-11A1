/**
 * Controller chính 11A1 Thi Đua App — Kiến trúc Modern Swiss Minimalist
 * Điều phối 4 Màn hình: Bảng điểm, Ghi điểm nhanh, Hồ sơ cá nhân, Quản trị GVCN
 */

import {
  CLASS_NAME,
  SCHOOL_YEAR,
  TEAMS,
  TEAM_BY_ID,
  MEMBER_BY_ID,
  ADMIN_MEMBER_IDS,
  TOTAL_WEEKS,
  resolveAuthCode,
  toNonAccentVietnamese,
} from "./config.js";
import {
  RULES,
  RULE_BY_ID,
  QUICK_REWARDS,
  QUICK_PENALTIES,
  formatPoints,
  gradeFor,
} from "./rules.js";
import {
  ScoreStore,
  weekNumber,
  weekRangeLabel,
  weekIdForNumber,
  defaultWeekId,
  competitionWeekIds,
  studiedThroughWeek,
} from "./store.js";
import {
  authenticateNotificationSender,
  clearNotificationToken,
  disablePushNotifications,
  enablePushNotifications,
  getNotificationSubscription,
  sendPushNotification,
} from "./notifications.js";
import { FlagStore, FLAG_TYPES, FLAG_TYPE_BY_ID, todayISO } from "./flags.js";

// Khởi tạo Store trung tâm
const store = new ScoreStore();
// ——— START CỜ LUÂN LƯU ———
const flagStore = new FlagStore();
let flagsUnsub = null;
const flagsUI = { type: "", month: "", editingId: null, confirmId: null, dragging: false, pending: [], placing: new Set() };
// ——— END CỜ LUÂN LƯU ———

// Trạng thái cục bộ của giao diện
const state = {
  currentView: "leaderboard", // leaderboard | scoring | profile | admin
  currentBoard: "teams", // teams | year | minus | plus
  selectedStudentIds: new Set(),
  selectedRuleId: null,
  scoringMultiplier: 1,
  scoringTeamFilter: "my", // my | all | to1 | to2 | to3 | to4
  profileMemberId: "to1-05", // Mặc định Đinh Quang Vinh
  profileFilter: "all", // all | minus | plus
  sessionLog: [], // Các lượt chấm trong phiên làm việc
};

// DOM Helper
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Utility Toast
function showToast(msg, icon = "cloud_done", duration = 2400) {
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
  }, duration);
}

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
  const adminBadge = ADMIN_MEMBER_IDS.includes(member.id)
    ? `<span class="member-admin-badge" title="Admin lớp"><span class="material-symbols-outlined">admin_panel_settings</span><span>ADMIN</span></span>`
    : "";

  return `<span class="member-name-display">${adminBadge}<span class="${nameClass}">${member.name}</span></span>`;
}

async function refreshNotificationButton() {
  const button = $("#btn-notifications");
  const icon = $("#notifications-icon");
  if (!button || !icon) return;
  const supported = "Notification" in window && "serviceWorker" in navigator;
  let subscription = null;
  if (supported) {
    try {
      subscription = await getNotificationSubscription();
    } catch (error) {
      console.warn("Không đọc được subscription thông báo:", error);
    }
  }
  const permission = supported ? Notification.permission : "unsupported";
  const enabled = permission === "granted" && Boolean(subscription);
  icon.textContent = !supported
    ? "notifications_off"
    : enabled
      ? "notifications_active"
      : permission === "denied"
        ? "notifications_off"
        : "notifications";
  button.title = enabled ? "Tắt thông báo" : "Bật thông báo cập nhật";
  button.setAttribute("aria-label", button.title);
}

async function reportPushResult(action, details, successMessage) {
  try {
    const result = await sendPushNotification(action, details);
    const message = result.sent
      ? `${successMessage} (${result.sent} lượt gửi thành công)`
      : result.failed
        ? `Không gửi được đến ${result.failed} thiết bị.`
        : "Chưa có thiết bị nào đăng ký nhận thông báo.";
    showToast(message, result.sent ? "notifications_active" : "notifications_off");
    return result;
  } catch (error) {
    console.error("Không gửi được thông báo đẩy:", error);
    showToast(`Push lỗi: ${error.message}`, "notifications_off", 8000);
    return null;
  }
}

function getTopRankPayload(rankings) {
  return rankings
    .filter((entry) => entry.rank <= 3)
    .slice(0, 6)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      rank: entry.rank,
      score: entry.minusPoints ?? entry.plusPoints ?? entry.yearTotal ?? 0,
    }));
}

function getRankLabel(item) {
  return item.isTied ? `Đồng hạng ${item.rank}` : `Hạng ${item.rank}`;
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
  } else if (viewName === "flags") {
    // ——— CỜ LUÂN LƯU ———
    enterFlagsView();
  } else {
    exitFlagsView();
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

  // 2. Quick Snapshot
  const teamRanks = store.getTeamRankings();
  const leaderTeam = teamRanks[0] || { name: "Tổ 1", total: 400, rawTotal: 400 };

  $("#snapshot-main-title").textContent = `Tuần ${curNum}`;
  $("#snapshot-sub-title").textContent = `• ${weekRangeLabel(currentWeek)}`;

  const tiedLeaders = teamRanks.filter((team) => team.rank === 1);
  $("#snapshot-rank-lead").textContent =
    tiedLeaders.length > 1
      ? `Đồng hạng 1 • ${tiedLeaders.length} tổ`
      : `${leaderTeam.name} Dẫn đầu`;
  $("#snapshot-note").textContent =
    tiedLeaders.length > 1
      ? "Các tổ cùng điểm được đồng hạng; mỗi tổ hiển thị riêng"
      : "Nếu bằng điểm, giữ đồng hạng và xếp tên A–Z";

  $("#snapshot-top-score").textContent = isLocked ? leaderTeam.rawTotal : leaderTeam.total;

  const plusTotal = leaderTeam.plusPoints || 0;
  const minusTotal = leaderTeam.minusPoints || 0;
  const netDelta = plusTotal + minusTotal;
  $("#snapshot-delta").textContent = `${formatPoints(netDelta)} điểm`;

  // 3. Week selector: keeps every competition week reachable on mobile.
  const weekSelector = $("#week-selector");
  const allWeekIds = competitionWeekIds();
  const through = studiedThroughWeek();

  weekSelector.innerHTML = allWeekIds
    .map((wId) => {
      const n = weekNumber(wId);
      const isSelected = wId === currentWeek;
      const isCurStudied = n === through;
      const wLocked = store.isWeekLocked(wId);
      const suffix = [
        isCurStudied ? "Hiện tại" : "",
        wLocked ? "Đã khóa" : "",
      ].filter(Boolean).join(" • ");
      const label = `Tuần ${n}${suffix ? ` (${suffix})` : ""}`;

      return `<option value="${wId}" ${isSelected ? "selected" : ""}>${label}</option>`;
    })
    .join("");

  // 4. Podium chỉ dùng khi ba vị trí đầu không bị chia sẻ do đồng điểm.
  const podiumGrid = $("#podium-grid");
  const podiumHasTie = teamRanks.some(
    (team) =>
      team.rank <= 3 &&
      teamRanks.some((other) => other.id !== team.id && other.rank === team.rank)
  );
  if (teamRanks.length >= 3 && state.currentBoard === "teams" && !podiumHasTie) {
    $("#podium-section").classList.remove("hidden");

    podiumGrid.className = "grid grid-cols-3 gap-2 items-end pt-5";
    const t1 = teamRanks[0];
    const t2 = teamRanks[1];
    const t3 = teamRanks[2];

    const getBadgeLabel = (t) => {
      if (t.rank === 1) return "Quán Quân";
      if (t.rank === 2) return "Hạng Nhì";
      if (t.rank === 3) return "Hạng Ba";
      return `Hạng ${t.rank}`;
    };

    const t1Border = "border-amber-400";
    const t2Border = "border-slate-300";
    const t3Border = "border-amber-600";

    podiumGrid.innerHTML = `
        <!-- Hạng 2 -->
        <div class="flex flex-col items-center cursor-pointer active:scale-95 transition-transform" data-podium-team="${t2.id}">
          <div class="relative mb-2">
            <div class="w-11 h-11 rounded-2xl bg-surface-container-high text-on-surface flex items-center justify-center font-heading font-bold text-sm shadow-xs">
              ${t2.name.replace("Tổ ", "T")}
            </div>
            <span class="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center text-[10px] font-bold shadow-xs">${t2.rank}</span>
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

        <!-- Hạng 3 -->
        <div class="flex flex-col items-center cursor-pointer active:scale-95 transition-transform" data-podium-team="${t3.id}">
          <div class="relative mb-2">
            <div class="w-11 h-11 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface font-heading font-bold text-sm shadow-xs">
              ${t3.name.replace("Tổ ", "T")}
            </div>
            <span class="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">${t3.rank}</span>
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

    $$("[data-podium-team]").forEach((el) => {
      el.onclick = () => openTeamDetailModal(el.dataset.podiumTeam);
    });
  } else {
    $("#podium-section").classList.add("hidden");
  }

  // 5. Ranking List (Tùy theo Board: teams | year | minus | plus)
  renderRankingsList(teamRanks);

  // 6. Realtime Activity Feed
  $("#activity-feed-card")?.classList.toggle("hidden", state.currentBoard === "history");
  renderRealtimeFeed();
}

function renderRankingsList(teamRanks) {
  const container = $("#ranking-list-container");
  const isLocked = store.isWeekLocked(store.weekId);

  if (state.currentBoard === "teams") {
    container.innerHTML = teamRanks
      .map((t) => {
        const medal = getRankMedal(t.rank);
        const score = isLocked ? t.rawTotal : t.total;
        const rankBadge = `<span class="px-2 py-0.5 rounded-full ${t.isTied ? "bg-amber-500/10 text-amber-700" : "bg-surface-container text-on-surface-variant"} text-[10px] font-semibold">${getRankLabel(t)}</span>`;
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
                    ${rankBadge}
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
    // Cá nhân cả năm: bằng điểm được đồng hạng; tên chỉ quyết định thứ tự hiển thị.
    const yearRanks = store.getYearRankings();
    container.innerHTML = yearRanks
      .map((m) => {
        const medal = getRankMedal(m.rank);
        const rankBadge = `<span class="px-1.5 py-0.5 rounded-full ${m.isTied ? "bg-amber-500/10 text-amber-700" : "bg-surface-container text-on-surface-variant"} text-[9px] font-semibold">${getRankLabel(m)}</span>`;
        return `
          <div class="ranking-member-card rank-${Math.min(m.rank, 3)} bg-surface-container-lowest rounded-xl p-3 shadow-xs flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors" data-view-member="${m.id}">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-heading font-bold text-xs shrink-0">${medal}</span>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5">
                  ${renderMemberName(m, "font-heading font-bold text-xs text-on-surface truncate")}
                  ${rankBadge}
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
        .map((m) => `
          <div class="ranking-member-card ranking-member-violation bg-surface-container-lowest rounded-xl p-3 shadow-xs flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors" data-view-member="${m.id}">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-7 h-7 rounded-lg bg-error-container text-error flex items-center justify-center font-heading font-bold text-xs shrink-0">${getRankMedal(m.rank)}</span>
              <div class="flex flex-col min-w-0">
                ${renderMemberName(m, "font-heading font-bold text-xs text-on-surface truncate")}
                ${m.isTied ? `<span class="text-[9px] font-semibold text-amber-700">Đồng hạng ${m.rank}</span>` : ""}
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
      .map((m) => `
        <div class="ranking-member-card ranking-member-bonus bg-surface-container-lowest rounded-xl p-3 shadow-xs flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors" data-view-member="${m.id}">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-7 h-7 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center font-heading font-bold text-xs shrink-0">${getRankMedal(m.rank)}</span>
            <div class="flex flex-col min-w-0">
              ${renderMemberName(m, "font-heading font-bold text-xs text-on-surface truncate")}
              ${m.isTied ? `<span class="text-[9px] font-semibold text-amber-700">Đồng hạng ${m.rank}</span>` : ""}
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
  }
}

function renderViolationHistory(container) {
  const teams = store.getViolationHistoryByTeam();
  const teamSections = teams
    .map((team) => {
      const memberRows = team.members.length
        ? team.members
            .map(
              (member) => `
                <article class="history-member-card">
                  <div class="flex items-center justify-between gap-2">
                    <button type="button" class="history-member-link min-w-0 text-left" data-view-member="${member.id}">
                      ${renderMemberName(member, "font-heading font-bold text-xs text-error truncate")}
                    </button>
                    <span class="history-count shrink-0">${member.events.length} lượt • ${member.points}đ</span>
                  </div>
                  <details class="history-details">
                    <summary>Xem toàn bộ vi phạm</summary>
                    <ul class="mt-2 space-y-1.5">
                      ${member.events
                        .map(
                          (event) => `
                            <li class="flex items-start justify-between gap-2">
                              <span class="min-w-0">${escapeHtml(event.label)}${event.note ? `<span class="block text-[10px] text-on-surface-variant">${escapeHtml(event.note)}</span>` : ""}<span class="block text-[10px] text-outline">Tuần ${event.weekNumber}</span></span>
                              <span class="shrink-0 font-bold tabular-nums ${event.points < 0 ? "text-error" : "text-on-surface-variant"}">${formatPoints(event.points)}đ</span>
                            </li>
                          `
                        )
                        .join("")}
                    </ul>
                  </details>
                </article>
              `
            )
            .join("")
        : `<p class="rounded-xl bg-surface-container-low p-3 text-xs text-on-surface-variant">Chưa có lượt vi phạm được ghi nhận.</p>`;

      return `
        <section class="history-team-card">
          <header class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="history-team-icon material-symbols-outlined">groups</span>
              <h3 class="font-heading font-bold text-sm text-white">${team.name}</h3>
            </div>
            <span class="text-[10px] font-semibold text-white/85">${team.members.length} học sinh vi phạm • ${team.eventCount} lượt</span>
          </header>
          <div class="mt-2 space-y-2">${memberRows}</div>
        </section>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="history-backdrop">
      <div class="history-intro">
        <span class="material-symbols-outlined">history_edu</span>
        <div>
          <h2 class="font-heading font-bold text-base">Tiền Án Tiền Sự</h2>
          <p class="text-xs opacity-80">Toàn bộ lượt vi phạm, nhóm theo tổ tại thời điểm ghi nhận.</p>
        </div>
      </div>
      <div class="history-team-list">${teamSections}</div>
    </div>
  `;
  bindMemberClickEvents(container);
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
      const failedSyncs = saved.filter((event) => event.syncError);
      const syncedEvents = saved.filter((event) => !event.syncError);
      if (store.mode === "live" && syncedEvents.length) {
        void reportPushResult(
          "score",
          {
            events: syncedEvents.map((event) => ({
              name: MEMBER_BY_ID[event.memberId]?.name || event.memberId,
              label: event.label,
              points: event.points,
            })),
            rankings: {
              plus: getTopRankPayload(store.getBonusRankings()),
              minus: getTopRankPayload(store.getViolationRankings()),
            },
          },
          "Đã gửi thông báo cập nhật"
        );
      }
      if (failedSyncs.length) {
        showToast(`${failedSyncs.length} lượt chưa đồng bộ`, "cloud_off");
        alert(
          `Đã ghi ${saved.length} lượt vào bộ nhớ trên thiết bị, nhưng ${failedSyncs.length} lượt chưa đồng bộ lên Supabase.\n\n${failedSyncs[0].syncError}\n\nDữ liệu này chưa được chia sẻ với thiết bị khác.`
        );
      } else if (store.mode === "live") {
        showToast(`Đã ghi và đồng bộ cho ${saved.length} học sinh!`, "check_circle");
      } else {
        showToast(`Đã lưu trên thiết bị cho ${saved.length} học sinh (ngoại tuyến).`, "cloud_off");
      }

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
      const searchInput = $("#profile-search-input");
      if (searchInput) searchInput.value = "";
      $("#btn-clear-profile-search")?.classList.add("hidden");
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
  $("#profile-hero-avatar").textContent = getInitials(member.name);
  $("#profile-hero-name").innerHTML = renderMemberName(
    member,
    "font-heading font-bold text-base text-on-surface truncate"
  );
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
  $("#profile-rank-sub").textContent = `${isClassRankTied ? "Đồng hạng • " : ""}Tuần ${weekNumber(store.weekId)}`;
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
  const displayScore = (team) =>
    store.isWeekLocked(store.weekId) ? team.rawTotal : team.total;
  progressList.innerHTML = teamRanks
    .map((t) => {
      const score = displayScore(t);
      const pct = Math.min(100, Math.max(30, Math.round((score / 500) * 100)));
      return `
        <div class="flex flex-col gap-1 text-xs">
          <div class="flex items-center justify-between">
            <span class="font-heading font-bold text-on-surface">${t.name} • ${getRankLabel(t)}</span>
            <span class="font-heading font-bold text-primary tabular-nums">${score} đ</span>
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
  $("#team-modal-title").textContent = `Chi Tiết ${team.name} • Tuần ${weekNumber(store.weekId)}`;

  const membersList = $("#team-modal-members-list");
  const weekActivity = new Map(
    store
      .getTeamMemberWeekActivity(teamId)
      .map((member) => [member.id, member])
  );
  const sortedMembers = store.getTeamMembersSorted(teamId);

  membersList.innerHTML = sortedMembers
    .map((m) => {
      const medal = getRankMedal(m.rank);
      const activity = weekActivity.get(m.id);
      const activityDetails = activity?.violationGroups.length
        ? activity.violationGroups
            .map((group) => `${group.label}${group.count > 1 ? ` ×${group.count}` : ""}`)
            .join(" • ")
        : "Không có vi phạm tuần này";
      return `
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer" data-view-member="${m.id}">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-6 h-6 rounded-md bg-surface-container-high flex items-center justify-center font-heading font-bold text-xs shrink-0">${medal}</span>
            <div class="flex flex-col min-w-0">
              ${renderMemberName(m, "font-heading font-bold text-xs text-on-surface truncate")}
              ${m.isTied ? `<span class="text-[9px] font-semibold text-amber-700">Đồng hạng ${m.rank}</span>` : ""}
              <span class="text-[10px] ${activity?.violationCount ? "text-error" : "text-on-surface-variant"}">${activity?.violationCount || 0} lần vi phạm • ${activity?.bonusCount || 0} lần được cộng điểm</span>
              <span class="text-[10px] text-on-surface-variant">${activityDetails}</span>
            </div>
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

function closeTeamDetailModal() {
  const modal = $("#modal-team-detail");
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
        ? "bg-secondary-fixed text-on-secondary-fixed"
        : isZero
        ? "bg-surface-container-high text-on-surface-variant"
        : "bg-tertiary/15 text-tertiary";

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
        const isActive = b.dataset.board === state.currentBoard;
        b.classList.toggle("bg-surface-container-lowest", isActive);
        b.classList.toggle("text-primary", isActive);
        b.classList.toggle("shadow-xs", isActive);
        b.classList.toggle("text-on-surface-variant", !isActive);
      });
      renderLeaderboard();
    };
  });

  $("#week-selector").onchange = (event) => {
    store.setWeek(event.currentTarget.value);
  };

  // 3. User Avatar Top Right
  $("#btn-user-profile").onclick = () => {
    if (!store.isLoggedIn()) {
      switchView("scoring");
    } else {
      if (confirm(`Bạn đang đăng nhập với tư cách: ${store.getLeaderName()}.\nBạn có muốn đăng xuất không?`)) {
        store.logout();
        clearNotificationToken();
        switchView("leaderboard");
        showToast("Đã đăng xuất!", "logout");
      }
    }
  };

  $("#btn-notifications").onclick = async () => {
    try {
      const subscription = await getNotificationSubscription();
      if (subscription) {
        if (!confirm("Tắt thông báo đẩy trên thiết bị này?")) return;
        await disablePushNotifications();
        showToast("Đã tắt thông báo trên thiết bị này.", "notifications_off");
      } else {
        await enablePushNotifications();
        showToast("Đã bật thông báo cập nhật cho thiết bị này.", "notifications_active");
      }
      await refreshNotificationButton();
    } catch (error) {
      alert(error.message || "Không thể thay đổi cài đặt thông báo.");
    }
  };

  // 4. Scoring: Login
  const doLogin = async (code) => {
    const auth = resolveAuthCode(code);
    if (!auth) {
      alert("Mã hoặc PIN không chính xác! Vui lòng thử lại.");
      return;
    }
    try {
      await authenticateNotificationSender(code, auth.role, auth.teamId);
    } catch (error) {
      clearNotificationToken();
      console.error("Không xác thực được quyền gửi push:", error);
      showToast("Đăng nhập được; chưa xác thực được quyền gửi push.", "notifications_off");
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
    clearNotificationToken();
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
  $("#btn-close-team-modal").onclick = closeTeamDetailModal;

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
  $("#btn-admin-login").onclick = async () => {
    const pass = $("#admin-pass-input").value;
    const auth = resolveAuthCode(pass);
    if (auth && auth.role === "admin") {
      try {
        await authenticateNotificationSender(pass, "admin");
      } catch (error) {
        clearNotificationToken();
        console.error("Không xác thực được quyền gửi push:", error);
        showToast("Đăng nhập Admin được; chưa xác thực được quyền gửi push.", "notifications_off");
      }
      store.setAuth("admin");
      renderAdminPanel();
      showToast("Xác thực quyền Admin GVCN thành công!", "shield");
    } else {
      alert("Mật khẩu Admin không đúng!");
    }
  };

  $("#btn-admin-logout").onclick = () => {
    store.logout();
    clearNotificationToken();
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
      if (!isLocked) {
        void reportPushResult(
          "week-closed",
          { week: store.weekId },
          `Đã gửi thông báo chốt tuần ${weekNumber(store.weekId)}`
        );
      }
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

  $("#btn-send-custom-notification").onclick = async () => {
    const title = $("#custom-notification-title").value.trim();
    const message = $("#custom-notification-message").value.trim();
    if (!title || !message) {
      alert("Vui lòng nhập tiêu đề và nội dung thông báo.");
      return;
    }
    const result = await reportPushResult("custom", { title, message }, "Đã gửi thông báo tùy chỉnh");
    if (result) {
      $("#custom-notification-title").value = "";
      $("#custom-notification-message").value = "";
    }
  };

  $("#btn-send-current-infractions").onclick = async () => {
    const week = defaultWeekId();
    const teamOrder = new Map(TEAMS.map((team, index) => [team.id, index]));
    const weekEvents = store.allEvents
      .filter((event) => event.weekId === week && event.points < 0)
      .sort((a, b) =>
        (teamOrder.get(a.teamId) ?? Number.MAX_SAFE_INTEGER) -
          (teamOrder.get(b.teamId) ?? Number.MAX_SAFE_INTEGER) ||
        (MEMBER_BY_ID[a.memberId]?.name || "").localeCompare(
          MEMBER_BY_ID[b.memberId]?.name || "",
          "vi",
          { sensitivity: "base" }
        ) ||
        a.createdAt - b.createdAt
      );
    const entries = weekEvents
      .map((event) => ({
        team: TEAM_BY_ID[event.teamId]?.name || event.teamId,
        name: MEMBER_BY_ID[event.memberId]?.name || event.memberId,
        label: event.label,
        points: event.points,
      }));
    const confirmed = confirm(
      entries.length
        ? `Gửi danh sách ${entries.length} lượt vi phạm của Tuần ${weekNumber(week)} đến tất cả thiết bị đã đăng ký? Nội dung có thể hiện trên màn hình khóa.`
        : `Tuần ${weekNumber(week)} chưa có vi phạm. Gửi thông báo trạng thái này đến tất cả thiết bị?`
    );
    if (!confirmed) return;
    await reportPushResult(
      "infractions",
      { week, entries },
      `Đã gửi bảng vi phạm tuần ${weekNumber(week)}`
    );
  };

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
// ——— START CỜ LUÂN LƯU (tab 5 — chỉ giao diện, logic dùng FlagStore có sẵn) ———
// ===========================================================================
function flagsDateLabel(iso) {
  const p = String(iso || "").slice(0, 10).split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : String(iso || "");
}

function flagsMonthLabel(ym) {
  const p = String(ym || "").split("-");
  return p.length === 2 ? `Tháng ${Number(p[1])}/${p[0]}` : String(ym || "");
}

function setFlagsVisible(el, visible) {
  if (!el) return;
  el.classList.toggle("hidden", !visible);
  el.classList.toggle("flex", visible);
}

function enterFlagsView() {
  if (!flagsUnsub) {
    flagsUnsub = flagStore.subscribe(() => renderFlagsView());
    void flagStore.init();
  }
}

function exitFlagsView() {
  if (flagsUnsub) {
    flagsUnsub();
    flagsUnsub = null;
  }
  flagsCloseForm();
}

function renderFlagsStats() {
  const s = flagStore.stats();
  const totalEl = $("#flags-stat-total");
  if (totalEl) totalEl.textContent = String(s.total);
  const wrap = $("#flags-stat-pills");
  if (!wrap) return;
  wrap.innerHTML = "";
  for (const f of FLAG_TYPES) {
    const cell = document.createElement("div");
    cell.className = "bg-surface-container-low rounded-xl p-2.5 flex flex-col items-center gap-1";
    const img = document.createElement("img");
    img.src = f.image;
    img.alt = f.name;
    img.className = "w-8 h-8 object-contain rounded";
    img.onerror = () => { img.style.visibility = "hidden"; };
    const num = document.createElement("span");
    num.className = "font-heading text-lg font-bold text-on-surface tabular-nums leading-none";
    num.textContent = String(s.byType[f.id] ?? 0);
    const nm = document.createElement("span");
    nm.className = "text-[10px] text-on-surface-variant font-semibold";
    nm.textContent = f.name;
    cell.append(img, num, nm);
    wrap.appendChild(cell);
  }
}

function renderFlagsFilters() {
  const typeSel = $("#flag-filter-type");
  const monthSel = $("#flag-filter-month");
  if (!typeSel || !monthSel) return;
  if (typeSel.options.length <= 1) {
    for (const f of FLAG_TYPES) {
      const o = document.createElement("option");
      o.value = f.id;
      o.textContent = f.name;
      typeSel.appendChild(o);
    }
  }
  const prevMonth = flagsUI.month;
  monthSel.innerHTML = "";
  const all = document.createElement("option");
  all.value = "";
  all.textContent = "Tất cả tháng";
  monthSel.appendChild(all);
  for (const m of flagStore.months()) {
    const o = document.createElement("option");
    o.value = m;
    o.textContent = flagsMonthLabel(m);
    monthSel.appendChild(o);
  }
  typeSel.value = flagsUI.type;
  monthSel.value = flagsUI.month = monthSel.querySelector(`option[value="${CSS.escape(prevMonth)}"]`) ? prevMonth : "";
  setFlagsVisible($("#btn-flag-clear-filters"), Boolean(flagsUI.type || flagsUI.month));
}

function makeFlagRow(flag) {
  const type = FLAG_TYPE_BY_ID[flag.flag_type];
  const card = document.createElement("div");
  card.className = "bg-surface-container-lowest rounded-2xl p-3 shadow-xs flex flex-col items-center gap-1.5 text-center";

  const img = document.createElement("img");
  img.src = type?.image || "";
  img.alt = type?.name || flag.flag_type;
  img.className = "w-24 h-24 rounded-xl bg-surface-container object-contain p-1.5";
  img.onerror = () => { img.style.visibility = "hidden"; };
  card.appendChild(img);

  const name = document.createElement("span");
  name.className = "font-heading text-sm font-bold text-on-surface";
  name.textContent = type?.name || flag.flag_type;
  card.appendChild(name);

  const date = document.createElement("span");
  date.className = "text-[11px] font-semibold text-primary tabular-nums px-2 py-0.5 rounded-full bg-primary/15";
  date.textContent = flagsDateLabel(flag.placed_date);
  card.appendChild(date);

  if (flag.note) {
    const note = document.createElement("p");
    note.className = "text-[11px] text-on-surface-variant leading-tight w-full";
    note.style.display = "-webkit-box";
    note.style.setProperty("-webkit-box-orient", "vertical");
    note.style.setProperty("-webkit-line-clamp", "2");
    note.style.overflow = "hidden";
    note.textContent = flag.note; // textContent — không innerHTML với dữ liệu người dùng
    card.appendChild(note);
  }

  if (flagStore.isAuthenticated()) {
    const actions = document.createElement("div");
    actions.className = "flex items-center gap-1.5 w-full mt-0.5";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "flex-1 h-8 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-primary text-[11px] font-bold flex items-center justify-center gap-1 transition-colors";
    edit.innerHTML = '<span class="material-symbols-outlined text-[15px]">edit</span>Sửa';
    edit.onclick = () => flagsOpenEdit(flag.id);
    const del = document.createElement("button");
    del.type = "button";
    del.className = "flex-1 h-8 rounded-lg bg-surface-container-low hover:bg-error-container text-on-surface-variant hover:text-error text-[11px] font-bold flex items-center justify-center gap-1 transition-colors";
    del.innerHTML = '<span class="material-symbols-outlined text-[15px]">delete</span>Xóa';
    del.onclick = () => flagsAskDelete(flag.id);
    actions.append(edit, del);
    card.appendChild(actions);
  }
  return card;
}

function renderFlagsList() {
  const authed = flagStore.isAuthenticated();
  // Bảng thành tích LUÔN hiển thị (kể cả khi khóa). Khóa chỉ chặn đặt/sửa/xóa.
  setFlagsVisible($("#flags-login-card"), !authed);
  setFlagsVisible($("#flags-content"), true);
  setFlagsVisible($("#flag-place-zone"), authed);
  setFlagsVisible($("#btn-flag-signout"), flagStore.mode === "live" && authed);

  const icon = $("#flags-mode-icon");
  const badge = $("#flags-mode-badge");
  const badgeText = $("#flags-mode-badge-text");
  if (icon) icon.textContent = flagStore.mode === "live" ? "bolt" : "cloud_off";
  if (badge && badgeText) {
    if (flagStore.mode === "live") {
      badge.className = "text-[11px] text-secondary flex items-center gap-1 shrink-0 ml-2 font-bold px-2 py-0.5 rounded-full bg-secondary/15";
      badgeText.textContent = "Realtime";
    } else {
      badge.className = "text-[11px] text-on-surface-variant flex items-center gap-1 shrink-0 ml-2 font-bold px-2 py-0.5 rounded-full bg-surface-container";
      badgeText.textContent = "Offline · máy này";
    }
  }
  const badgeDot = badge?.querySelector("span:not(#flags-mode-badge-text)");
  if (badgeDot) badgeDot.className = `w-1.5 h-1.5 rounded-full ${flagStore.mode === "live" ? "bg-secondary" : "bg-outline"}`;

  if (flagStore.loading) {
    setFlagsVisible($("#flags-loading"), true);
    setFlagsVisible($("#flags-empty"), false);
    const list = $("#flags-list");
    if (list) list.innerHTML = "";
    const count = $("#flags-list-count");
    if (count) count.textContent = "";
    return;
  }
  setFlagsVisible($("#flags-loading"), false);

  if (flagsUI.dragging) return; // đang kéo cờ — giữ nguyên row, render lại khi thả xong

  const list = flagStore.filtered({ type: flagsUI.type, month: flagsUI.month });
  const wrap = $("#flags-list");
  if (wrap) {
    wrap.innerHTML = "";
    for (const f of list) wrap.appendChild(makeFlagRow(f));
  }
  const count = $("#flags-list-count");
  if (count) count.textContent = list.length ? `${list.length} cờ` : "";
  const emptyDesc = $("#flags-empty-desc");
  if (emptyDesc) {
    emptyDesc.textContent = flagsUI.type || flagsUI.month
      ? "Không có cờ khớp bộ lọc hiện tại."
      : "Mỗi lần lớp đạt thành tích, GVCN mở khóa rồi nhận cờ đặt lên bảng.";
  }
  setFlagsVisible($("#flags-empty"), list.length === 0);
}

function renderFlagsView() {
  if (state.currentView !== "flags") return;
  renderFlagsStats();
  renderFlagsTray();
  renderFlagsFilters();
  renderFlagsList();
}

function flagsSyncNoteCount() {
  const el = $("#flag-note-count");
  const note = $("#flag-form-note");
  if (el && note) el.textContent = `${note.value.length}/200`;
}

function flagsOpenAdd() {
  flagsUI.editingId = null;
  const title = $("#flag-form-title");
  if (title) title.innerHTML = '<span class="material-symbols-outlined text-[18px] text-primary">flag</span> Nhận cờ';
  const submit = $("#btn-flag-submit");
  if (submit) submit.textContent = "Thêm vào khay chờ";
  const typeSel = $("#flag-form-type");
  if (typeSel) typeSel.value = FLAG_TYPES[0]?.id || "";
  const dateEl = $("#flag-form-date");
  if (dateEl) dateEl.value = todayISO();
  const noteEl = $("#flag-form-note");
  if (noteEl) noteEl.value = "";
  flagsSyncNoteCount();
  setFlagsVisible($("#flag-form"), true);
}

function flagsOpenEdit(id) {
  const flag = flagStore.flags.find((f) => f.id === id);
  if (!flag) return;
  flagsUI.editingId = id;
  const title = $("#flag-form-title");
  if (title) title.innerHTML = '<span class="material-symbols-outlined text-[18px] text-primary">edit</span> Sửa cờ';
  const submit = $("#btn-flag-submit");
  if (submit) submit.textContent = "Lưu thay đổi";
  const typeSel = $("#flag-form-type");
  if (typeSel) typeSel.value = flag.flag_type;
  const dateEl = $("#flag-form-date");
  if (dateEl) dateEl.value = flag.placed_date;
  const noteEl = $("#flag-form-note");
  if (noteEl) noteEl.value = flag.note || "";
  flagsSyncNoteCount();
  setFlagsVisible($("#flag-form"), true);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function flagsCloseForm() {
  flagsUI.editingId = null;
  setFlagsVisible($("#flag-form"), false);
}

async function flagsSubmitForm() {
  const typeSel = $("#flag-form-type");
  const dateEl = $("#flag-form-date");
  const noteEl = $("#flag-form-note");
  const payload = {
    flagType: typeSel?.value || FLAG_TYPES[0]?.id,
    placedDate: dateEl?.value || todayISO(),
    note: String(noteEl?.value || "").slice(0, 200),
  };
  try {
    if (flagsUI.editingId) {
      await flagStore.updateFlag(flagsUI.editingId, { placedDate: payload.placedDate, note: payload.note });
      showToast("Đã cập nhật lá cờ.", "check_circle");
    } else {
      // Cờ mới tạo vào KHAY CHỜ — chỉ lên bảng khi bấm "Đặt lên bảng" hoặc kéo thả vào bảng
      flagsUI.pending.push({ pid: "p" + Date.now() + Math.random().toString(36).slice(2, 6), ...payload });
      flagsSavePending();
      renderFlagsTray();
      showToast("Đã thêm cờ vào khay chờ — kéo hoặc bấm Đặt lên bảng để hoàn tất.", "inbox");
    }
    flagsCloseForm();
  } catch (err) {
    showToast(err?.message || "Không lưu được.", "error"); // lỗi store nguyên văn qua toast
  }
}

function renderFlagsTray() {
  const tray = $("#flags-tray");
  const wrap = $("#flags-tray-list");
  if (!tray || !wrap) return;
  if (flagsUI.dragging) return; // đang kéo — giữ nguyên khay, render lại khi thả xong
  // Khóa bảng → ẩn khay chờ (chỉ người mở khóa mới đặt được cờ)
  if (!flagStore.isAuthenticated()) { setFlagsVisible(tray, false); return; }
  const count = $("#flags-tray-count");
  if (count) count.textContent = String(flagsUI.pending.length);
  wrap.innerHTML = "";
  for (const entry of flagsUI.pending) {
    const type = FLAG_TYPE_BY_ID[entry.flagType];
    const card = document.createElement("div");
    card.className = "shrink-0 w-[150px] bg-surface-container-low rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center flag-draggable";
    card.title = "Kéo nguyên lá cờ này thả vào bảng thành tích";

    const img = document.createElement("img");
    img.src = type?.image || "";
    img.alt = type?.name || entry.flagType;
    img.className = "w-[72px] h-[72px] rounded-xl bg-surface-container object-contain p-1.5 pointer-events-none";
    img.draggable = false;
    img.onerror = () => { img.style.visibility = "hidden"; };
    card.appendChild(img);

    const name = document.createElement("span");
    name.className = "font-heading text-xs font-bold text-on-surface";
    name.textContent = type?.name || entry.flagType;
    card.appendChild(name);

    const date = document.createElement("span");
    date.className = "text-[10px] font-semibold text-primary tabular-nums px-1.5 py-0.5 rounded-full bg-primary/15";
    date.textContent = flagsDateLabel(entry.placedDate);
    card.appendChild(date);

    if (entry.note) {
      const note = document.createElement("p");
      note.className = "text-[10px] text-on-surface-variant leading-tight";
      note.style.display = "-webkit-box";
      note.style.setProperty("-webkit-box-orient", "vertical");
      note.style.setProperty("-webkit-line-clamp", "2");
      note.style.overflow = "hidden";
      note.textContent = entry.note; // textContent — không innerHTML với dữ liệu người dùng
      card.appendChild(note);
    }

    const btnRow = document.createElement("div");
    btnRow.className = "flex items-center gap-1.5 w-full mt-0.5";
    const place = document.createElement("button");
    place.type = "button";
    place.className = "flex-1 h-8 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-[11px] font-bold active:scale-[0.97] transition-all flex items-center justify-center gap-1";
    place.innerHTML = '<span class="material-symbols-outlined text-[14px]">upload</span>Đặt lên bảng';
    place.onclick = () => void flagsPlacePending(entry.pid);
    const rm = document.createElement("button");
    rm.type = "button";
    rm.title = "Bỏ cờ khỏi khay";
    rm.className = "w-8 h-8 shrink-0 rounded-lg bg-surface-container hover:bg-error-container text-on-surface-variant hover:text-error flex items-center justify-center transition-colors";
    rm.innerHTML = '<span class="material-symbols-outlined text-[16px]">close</span>';
    rm.onclick = () => flagsRemovePending(entry.pid);
    btnRow.append(place, rm);
    card.appendChild(btnRow);
    makeFlagDraggable(card, entry);
    wrap.appendChild(card);
  }
  setFlagsVisible(tray, flagsUI.pending.length > 0);
}

function flagsRemovePending(pid) {
  flagsUI.pending = flagsUI.pending.filter((p) => p.pid !== pid);
  flagsSavePending();
  renderFlagsTray();
}

/* Khay chờ lưu vào localStorage — reload không mất cờ đang chờ */
const FLAGS_PENDING_KEY = "a1-flag-pending-v1";
function flagsSavePending() {
  try { localStorage.setItem(FLAGS_PENDING_KEY, JSON.stringify(flagsUI.pending)); } catch (e) {}
}
function flagsLoadPending() {
  try {
    const raw = JSON.parse(localStorage.getItem(FLAGS_PENDING_KEY) || "[]");
    if (Array.isArray(raw)) {
      flagsUI.pending = raw.filter((p) => p && p.pid && FLAG_TYPE_BY_ID[p.flagType] && p.placedDate);
    }
  } catch (e) {}
}

async function flagsPlacePending(pid) {
  const entry = flagsUI.pending.find((p) => p.pid === pid);
  if (!entry || flagsUI.placing.has(pid)) return;
  flagsUI.placing.add(pid);
  try {
    await flagStore.addFlag({ flagType: entry.flagType, placedDate: entry.placedDate, note: entry.note });
    flagsUI.pending = flagsUI.pending.filter((p) => p.pid !== pid);
    flagsSavePending();
    showToast("Đã đặt cờ lên bảng thành tích.", "flag");
  } catch (err) {
    showToast(err?.message || "Không lưu được.", "error"); // lỗi store nguyên văn qua toast
  } finally {
    flagsUI.placing.delete(pid);
    renderFlagsTray();
  }
}

function flagsAskDelete(id) {
  flagsUI.confirmId = id;
  const m = $("#modal-flag-confirm-delete");
  if (m) {
    m.classList.remove("hidden");
    m.classList.add("flex");
  }
}

function flagsCloseConfirm() {
  flagsUI.confirmId = null;
  const m = $("#modal-flag-confirm-delete");
  if (m) {
    m.classList.add("hidden");
    m.classList.remove("flex");
  }
}

async function flagsConfirmDelete() {
  const id = flagsUI.confirmId;
  flagsCloseConfirm();
  if (!id) return;
  try {
    await flagStore.deleteFlag(id);
    showToast("Đã xóa lá cờ.", "delete");
  } catch (err) {
    showToast(err?.message || "Không xóa được.", "error");
  }
}

function flagsTrySignIn() {
  const input = $("#flag-pass-input");
  try {
    flagStore.signIn(input?.value || "");
    if (input) input.value = "";
    showToast("Đã mở khóa bảng cờ.", "lock_open");
  } catch (err) {
    showToast(err?.message || "Mật khẩu không đúng.", "error");
  }
}

function flagsInitStaticSelects() {
  const typeSel = $("#flag-form-type");
  if (typeSel && !typeSel.options.length) {
    for (const f of FLAG_TYPES) {
      const o = document.createElement("option");
      o.value = f.id;
      o.textContent = f.name;
      typeSel.appendChild(o);
    }
  }
}

// ——— Kéo thả cờ TỪ KHAY CHỜ vào bảng thành tích (pointer events: chuột + cảm ứng) ———
function flagsRectHasPoint(r, x, y, pad) {
  return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
}

function makeFlagDraggable(el, entry) {
  el.addEventListener("dragstart", (e) => e.preventDefault());
  el.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return; // bấm nút Đặt/Xóa → không kéo
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const board = $("#flags-board-drop");
    if (!board || flagsUI.dragging) return;
    const startX = e.clientX, startY = e.clientY;
    const rect = el.getBoundingClientRect();
    let ghost = null, over = false, active = false;

    const endDrag = () => {
      flagsUI.dragging = false;
      document.body.classList.remove("flag-dragging");
      renderFlagsList();
      renderFlagsTray();
    };
    const flyBack = () => {
      board.classList.remove("drop-over");
      if (ghost) {
        // Buông ra ngoài bảng → lá cờ tự bay về đúng vị trí ban đầu
        ghost.style.transition = "transform .45s cubic-bezier(.3,1.35,.5,1)";
        ghost.style.transform = "translate(0px,0px) rotate(0deg) scale(1)";
        setTimeout(() => { ghost.remove(); endDrag(); }, 470);
      } else {
        el.style.opacity = "";
        endDrag();
      }
    };
    const onMove = (ev) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (!active) {
        if (Math.abs(dx) + Math.abs(dy) < 8) return; // chạm thường, không kéo
        active = true;
        flagsUI.dragging = true;
        ghost = el.cloneNode(true);
        ghost.classList.add("flag-ghost");
        ghost.style.left = rect.left + "px";
        ghost.style.top = rect.top + "px";
        ghost.style.width = rect.width + "px";
        ghost.style.height = rect.height + "px";
        document.body.appendChild(ghost);
        el.style.opacity = "0.25";
        document.body.classList.add("flag-dragging");
      }
      ev.preventDefault();
      over = flagsRectHasPoint(board.getBoundingClientRect(), ev.clientX, ev.clientY, 14);
      board.classList.toggle("drop-over", over);
      ghost.style.transition = "none";
      ghost.style.transform = `translate(${dx}px,${dy}px) rotate(6deg) scale(1.1)`;
    };
    const cleanupListeners = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onCancel);
    };
    const onUp = (ev) => {
      cleanupListeners();
      if (!active) { flagsUI.dragging = false; return; }
      if (!over) { flyBack(); return; }
      // Thả trúng bảng → cờ thu nhỏ bay vào giữa bảng + pulse + toast
      board.classList.remove("drop-over");
      const b = board.getBoundingClientRect();
      const tx = b.left + b.width / 2 - (rect.left + rect.width / 2);
      const ty = b.top + b.height / 2 - (rect.top + rect.height / 2);
      ghost.style.transition = "transform .3s ease-in, opacity .3s ease-in";
      ghost.style.transform = `translate(${tx}px,${ty}px) scale(.28)`;
      ghost.style.opacity = "0";
      board.classList.add("drop-landed");
      setTimeout(() => { board.classList.remove("drop-landed"); ghost.remove(); endDrag(); }, 480);
      void flagsPlacePending(entry.pid); // thả trúng bảng → lưu cờ thật qua FlagStore
    };
    const onCancel = () => {
      cleanupListeners();
      if (active) flyBack(); else flagsUI.dragging = false;
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onCancel);
  });
}

function wireFlagsEvents() {
  flagsLoadPending();
  flagsInitStaticSelects();
  const dateEl = $("#flag-form-date");
  if (dateEl) dateEl.value = todayISO();

  const loginBtn = $("#btn-flag-login");
  if (loginBtn) loginBtn.onclick = flagsTrySignIn;
  const passInput = $("#flag-pass-input");
  if (passInput) passInput.addEventListener("keydown", (e) => { if (e.key === "Enter") flagsTrySignIn(); });

  const signoutBtn = $("#btn-flag-signout");
  if (signoutBtn) signoutBtn.onclick = () => { flagStore.signOut(); flagsCloseForm(); };

  const toggleBtn = $("#btn-flag-toggle-form");
  if (toggleBtn) toggleBtn.onclick = () => {
    const form = $("#flag-form");
    const isOpen = form && !form.classList.contains("hidden");
    if (isOpen && !flagsUI.editingId) flagsCloseForm();
    else flagsOpenAdd();
  };
  const cancelBtn = $("#btn-flag-form-cancel");
  if (cancelBtn) cancelBtn.onclick = flagsCloseForm;
  const submitBtn = $("#btn-flag-submit");
  if (submitBtn) submitBtn.onclick = () => void flagsSubmitForm();
  const noteEl = $("#flag-form-note");
  if (noteEl) noteEl.addEventListener("input", flagsSyncNoteCount);

  const typeFilter = $("#flag-filter-type");
  if (typeFilter) typeFilter.addEventListener("change", () => { flagsUI.type = typeFilter.value; renderFlagsList(); renderFlagsFilters(); });
  const monthFilter = $("#flag-filter-month");
  if (monthFilter) monthFilter.addEventListener("change", () => { flagsUI.month = monthFilter.value; renderFlagsList(); renderFlagsFilters(); });
  const clearBtn = $("#btn-flag-clear-filters");
  if (clearBtn) clearBtn.onclick = () => { flagsUI.type = ""; flagsUI.month = ""; renderFlagsList(); renderFlagsFilters(); };

  const confirmDelete = $("#btn-flag-confirm-delete");
  if (confirmDelete) confirmDelete.onclick = () => void flagsConfirmDelete();
  const confirmCancel = $("#btn-flag-confirm-cancel");
  if (confirmCancel) confirmCancel.onclick = flagsCloseConfirm;
}
// ——— END CỜ LUÂN LƯU ———

// ===========================================================================
// KHỞI CHẠY ỨNG DỤNG (INITIALIZE)
// ===========================================================================
async function initApp() {
  setupEventListeners();
  wireFlagsEvents(); // CỜ LUÂN LƯU
  void refreshNotificationButton();

  // Đăng ký listener store
  store.subscribe(() => {
    const role = store.getRole();
    const rolePill = $("#header-user-role");
    if (role === "admin") rolePill.textContent = "Admin GVCN";
    else if (role === "leader") rolePill.textContent = store.getLeaderName();
    else rolePill.textContent = "Khách";

    renderLeaderboard();
    if (state.currentView === "scoring") renderScoringWorkspace();
    else if (state.currentView === "profile") renderProfileView();
    else if (state.currentView === "admin") renderAdminPanel();
    else if (state.currentView === "flags") renderFlagsView(); // CỜ LUÂN LƯU
  });

  // Tải dữ liệu và kích hoạt WebSocket
  await store.init();
}

window.addEventListener("DOMContentLoaded", initApp);
