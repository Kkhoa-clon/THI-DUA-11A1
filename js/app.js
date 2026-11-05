/**
 * Controller chính 11A1 Thi Đua App — Kiến trúc Modern Swiss Minimalist
 * Điều phối các Màn hình: Bảng điểm, Ghi điểm nhanh, Cá nhân, Tra cứu, Hạnh kiểm, Nội quy, Quản trị GVCN
 */

import {
  TEAMS,
  TEAM_BY_ID,
  MEMBER_BY_ID,
  ADMIN_MEMBER_IDS,
  SEMESTERS,
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
  rulesGrouped,
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

// Khởi tạo Store trung tâm
const store = new ScoreStore();

// Trạng thái cục bộ của giao diện
const MORE_VIEWS = new Set(["rules", "conduct", "admin"]);

const state = {
  currentView: "leaderboard",
  currentBoard: "teams", // teams | year | minus | plus | history | podium
  selectedStudentIds: new Set(),
  selectedRules: new Map(), // ruleId => quantity (1..10)
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

function switchView(viewName) {
  if (viewName === "more") {
    openMoreSheet();
    return;
  }
  closeMoreSheet();
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

  if (viewName === "leaderboard") renderLeaderboard();
  else if (viewName === "scoring") renderScoringWorkspace();
  else if (viewName === "profile") renderProfileView();
  else if (viewName === "lookup") renderLookupView();
  else if (viewName === "conduct") renderConductView();
  else if (viewName === "rules") renderClassRulesView();
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

  const teamRanks = store.getTeamRankings();
  const leaderTeam = teamRanks[0] || { name: "Tổ 1", total: 400, rawTotal: 400 };

  const quickLeader = $("#quick-stat-leader-team");
  if (quickLeader) quickLeader.textContent = leaderTeam.name;

  const quickScore = $("#quick-stat-top-score");
  if (quickScore) quickScore.textContent = `${leaderTeam.total}`;

  const quickCount = $("#quick-stat-team-count");
  if (quickCount) quickCount.textContent = `${teamRanks.length} tổ`;

  const snapshotTitle = $("#snapshot-main-title");
  if (snapshotTitle) snapshotTitle.textContent = `Tuần ${curNum}`;

  const snapshotSub = $("#snapshot-sub-title");
  if (snapshotSub) snapshotSub.textContent = `• ${weekRangeLabel(currentWeek)}`;

  const tiedLeaders = teamRanks.filter((team) => team.rank === 1);
  const snapshotRankLead = $("#snapshot-rank-lead");
  if (snapshotRankLead) {
    snapshotRankLead.textContent =
      tiedLeaders.length > 1
        ? `${tiedLeaders.map((t) => t.name).join(" & ")} dẫn đầu`
        : `${leaderTeam.name} dẫn đầu`;
  }

  const snapshotTopScore = $("#snapshot-top-score");
  if (snapshotTopScore) snapshotTopScore.textContent = leaderTeam.total;

  const plusTotal = leaderTeam.plusPoints || 0;
  const minusTotal = leaderTeam.minusPoints || 0;
  const netDelta = plusTotal + minusTotal;
  const snapshotDelta = $("#snapshot-delta");
  if (snapshotDelta) snapshotDelta.textContent = `${formatPoints(netDelta)} điểm`;

  // Week selector
  const weekSelector = $("#week-selector");
  if (weekSelector) {
    const allWeekIds = competitionWeekIds();
    const through = studiedThroughWeek();
    weekSelector.innerHTML = allWeekIds
      .map((wId) => {
        const n = weekNumber(wId);
        const isSelected = wId === currentWeek;
        const isCurStudied = n === through;
        const suffix = isCurStudied ? " (Hiện tại)" : "";
        return `<option value="${wId}" ${isSelected ? "selected" : ""}>Tuần ${n}${suffix}</option>`;
      })
      .join("");
  }

  // Podium Top 3 Teams
  const podiumGrid = $("#podium-grid");
  const podiumSection = $("#podium-section");
  if (teamRanks.length >= 3 && state.currentBoard === "teams") {
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
            <div class="w-full bg-primary-fixed/60 rounded-xl py-1.5 px-1">
              <span class="font-heading font-bold text-lg text-primary block leading-none tabular-nums">${t1.total}</span>
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
  $("#activity-feed-card")?.classList.toggle("hidden", state.currentBoard === "history" || state.currentBoard === "podium");
  renderRealtimeFeed();
}

function renderRankingsList(teamRanks) {
  const container = $("#ranking-list-container");
  if (!container) return;

  if (state.currentBoard === "teams") {
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
      const memberName = member ? member.name : ev.memberId;
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

  // Render components
  renderStudentSelectGrid();
  renderQuickActions();
  renderSelectedRulesBasket();
  updateSubmitBar();
  renderSessionLog();
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
        state.selectedStudentIds.add(sid);
      }
      renderStudentSelectGrid();
      checkRepeatInfractionAlert();
      updateSubmitBar();
    };
  });

  const countEl = $("#selected-students-count");
  if (countEl) countEl.textContent = `Đã chọn: ${state.selectedStudentIds.size}`;
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
      if (cur < 10) state.selectedRules.set(rId, cur + 1);
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
  if (!list) return;
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
              <span class="font-heading font-bold text-on-surface truncate">${escapeHtml(name)} • ${escapeHtml(ev.label)}</span>
              <span class="text-[10px] text-outline">${formatRelativeTime(ev.createdAt)}${ev.note ? ` — "${escapeHtml(ev.note)}"` : ""}</span>
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
        } catch (err) {
          alert(err.message || "Không thể xóa bản ghi.");
        }
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
  if (rankBadge) rankBadge.textContent = `#${classRank}`;

  const rankSub = $("#profile-rank-sub");
  if (rankSub) rankSub.textContent = `Tuần ${weekNumber(store.weekId)}`;

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
  const statPlus = $("#profile-stat-plus");
  if (statPlus) statPlus.textContent = `+${profile.plusPoints || 0} đ`;

  const statMinus = $("#profile-stat-minus");
  if (statMinus) statMinus.textContent = `${profile.minusPoints || 0} đ`;

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
    if (profile.minusPoints === 0) {
      badges.push(`<span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[13px]">verified</span> 0 Vi Phạm</span>`);
    } else {
      badges.push(`<span class="px-2.5 py-1 rounded-full bg-error-container text-error text-[10px] font-bold flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[13px]">warning</span> ${profile.minusCount} lần vi phạm</span>`);
    }
    if (profile.plusPoints > 0) {
      badges.push(`<span class="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[13px]">stars</span> +${profile.plusPoints}đ khen</span>`);
    }
    if (currentWeekPoints >= 100) {
      badges.push(`<span class="px-2.5 py-1 rounded-full bg-primary-fixed text-primary text-[10px] font-bold flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[13px]">military_tech</span> Đạt chuẩn thi đua</span>`);
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
    const allWeekIds = competitionWeekIds();
    weekSelector.innerHTML = allWeekIds
      .map((wId) => `<option value="${wId}" ${wId === weekId ? "selected" : ""}>Tuần ${weekNumber(wId)}</option>`)
      .join("");

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

  // 6. TRA CỨU CHUYÊN SÂU THEO NỘI QUY CỤ THỂ
  const ruleSelector = $("#lookup-rule-selector");
  const ruleWeeksList = $("#lookup-rule-weeks");
  if (ruleSelector) {
    const rewards = RULES.filter((r) => r.points > 0);
    const penalties = RULES.filter((r) => r.points < 0);
    const notes = RULES.filter((r) => r.points === 0);
    const allRules = [...rewards, ...penalties, ...notes];

    ruleSelector.innerHTML = allRules
      .map(
        (r) => `<option value="${r.id}" ${r.id === state.lookupRuleId ? "selected" : ""}>${r.points > 0 ? "+" : ""}${r.points}đ • ${r.label}</option>`
      )
      .join("");

    ruleSelector.onchange = (e) => {
      state.lookupRuleId = e.target.value;
      renderLookupDeepHistory();
    };
  }

  renderLookupDeepHistory();
}

function renderLookupDeepHistory() {
  const memberId = state.lookupMemberId;
  const ruleId = state.lookupRuleId;
  const ruleWeeksList = $("#lookup-rule-weeks");
  if (!ruleWeeksList || !memberId || !ruleId) return;

  const history = store.getMemberRuleHistory(memberId, ruleId);
  const rule = RULE_BY_ID[ruleId];
  if (!rule) return;

  const totalPoints = history.reduce((sum, e) => sum + e.points, 0);

  if (!history.length) {
    ruleWeeksList.innerHTML = `
      <div class="p-4 rounded-xl bg-surface-container-low text-center text-xs text-outline">
        Học sinh chưa từng có lượt ghi nhận nội quy này trong năm học.
      </div>
    `;
    return;
  }

  ruleWeeksList.innerHTML = `
    <div class="p-2.5 rounded-xl bg-surface-container-low flex items-center justify-between text-xs mb-1">
      <span class="font-medium text-on-surface-variant">Tổng cộng: <strong>${history.length} lần</strong></span>
      <span class="font-heading font-bold ${rule.points > 0 ? "text-secondary" : "text-error"} tabular-nums">${formatPoints(totalPoints)}đ</span>
    </div>
    <div class="space-y-1.5">
      ${history
        .map(
          (e) => `
            <div class="p-2.5 rounded-xl bg-surface-container-low flex items-center justify-between gap-2 text-xs">
              <div class="flex items-center gap-2 min-w-0">
                <span class="px-2 py-0.5 rounded-md bg-surface-container font-heading font-bold text-[10px] text-primary shrink-0">Tuần ${e.weekNumber}</span>
                <span class="text-on-surface truncate">${e.note ? `"${escapeHtml(e.note)}"` : "Không có ghi chú"} • ${formatRelativeTime(e.createdAt)}</span>
              </div>
              <span class="font-heading font-bold ${e.points > 0 ? "text-secondary" : "text-error"} tabular-nums shrink-0">${formatPoints(e.points)}đ</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
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
                ? "bg-secondary-fixed text-on-secondary-fixed"
                : isZero
                ? "bg-surface-container-high text-on-surface-variant"
                : "bg-tertiary-fixed text-on-tertiary-fixed";
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
    adminWeekSelector.innerHTML = allWeekIds
      .map((wId) => `<option value="${wId}" ${wId === store.weekId ? "selected" : ""}>Tuần ${weekNumber(wId)}</option>`)
      .join("");

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

  // 4. Recent Events
  const recentList = $("#admin-recent-events");
  if (recentList) {
    const recent = store.allEvents.slice(0, 6);
    recentList.innerHTML = recent.length
      ? recent
          .map((e) => {
            const isPlus = e.points > 0;
            const m = MEMBER_BY_ID[e.memberId];
            const name = m ? m.name : e.memberId;
            return `
              <div class="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low text-xs">
                <div class="w-7 h-7 rounded-lg ${isPlus ? "bg-secondary-container" : "bg-error-container"} flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[14px] ${isPlus ? "text-on-secondary-container" : "text-error"}">${isPlus ? "star" : "warning"}</span>
                </div>
                <div class="flex flex-col min-w-0 flex-1">
                  <span class="font-heading font-bold text-on-surface truncate">${escapeHtml(name)}</span>
                  <span class="text-[10px] text-outline truncate">${escapeHtml(e.label)} • ${formatRelativeTime(e.createdAt)}</span>
                </div>
                <span class="font-heading font-bold ${isPlus ? "text-secondary" : "text-error"} tabular-nums shrink-0">${formatPoints(e.points)}đ</span>
              </div>
            `;
          })
          .join("")
      : `<p class="text-xs text-outline py-2 text-center">Chưa có lượt ghi nhận nào.</p>`;
  }

  // 5. Học sinh cần lưu ý tuần này
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
    .join("");

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
        ? "bg-secondary-fixed text-on-secondary-fixed"
        : isZero
        ? "bg-surface-container-high text-on-surface-variant"
        : "bg-tertiary-fixed text-on-tertiary-fixed";

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

  const weekSelector = $("#week-selector");
  if (weekSelector) {
    weekSelector.onchange = (event) => {
      store.setWeek(event.currentTarget.value);
    };
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

  // 5. Select All Team
  const btnSelectAll = $("#btn-select-all-team");
  if (btnSelectAll) {
    btnSelectAll.onclick = () => {
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
    else if (state.currentView === "admin") renderAdminPanel();
  });

  await store.init();
}

window.addEventListener("DOMContentLoaded", initApp);
