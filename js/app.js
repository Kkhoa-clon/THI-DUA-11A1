import {
  CLASS_NAME,
  SCHOOL_YEAR,
  TEAM_BY_ID,
  MEMBER_BY_ID,
  resolveAuthCode,
  TEAMS,
  SUPABASE_ENABLED,
  TOTAL_WEEKS,
} from "./config.js";
import { gradeFor, formatPoints, RULE_BY_ID, RULES } from "./rules.js";
import {
  ScoreStore,
  weekLabel,
  weekRangeLabel,
  weekNumber,
  competitionWeekIds,
  defaultWeekId,
  weekIdForNumber,
  studiedThroughWeek,
  isStudiedWeek,
} from "./store.js";
import {
  FlagStore,
  FLAG_TYPES,
  FLAG_TYPE_BY_ID,
  todayISO,
} from "./flags.js";

const store = new ScoreStore();
const flagStore = new FlagStore();

/** Lá cờ đang "cầm" chờ đặt (draft, chưa ghi Supabase): { flagType, placedDate, note } */
let heldFlag = null;
/** Lọc bảng cờ hiện hành: { type, month } */
const flagFilter = { type: "", month: "" };
/** id cờ đang sửa trong modal (null = nhận cờ mới) */
let flagEditingId = null;
/** loại cờ đang chọn trong modal nhận/sửa */
let flagPickType = FLAG_TYPES[0]?.id || "";
/** @type {string | null} */
let activeTeamId = null;
/** @type {string | null} */
let openMemberId = null;
/** @type {"all" | "plus" | "minus"} */
let ruleFilter = "all";
/** @type {"teams" | "year" | "minus" | "plus"} */
let board = "teams";
/** @type {string | null} */
let profileMemberId = null;
/** @type {"all" | "plus" | "minus"} */
let profileKind = "all";
/** @type {"home" | "team" | "profile"} */
let returnView = "home";

const $ = (sel, root = document) => root.querySelector(sel);

function toast(msg, isError = false) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.toggle("error", isError);
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2800);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initials(name) {
  const parts = String(name).trim().split(/\s+/);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hideAllViews() {
  $("#view-home").classList.add("view-hidden");
  $("#view-team").classList.add("view-hidden");
  $("#view-profile").classList.add("view-hidden");
}

function syncModePill() {
  const pill = $("#mode-pill");
  if (store.mode === "live") {
    pill.dataset.mode = "live";
    pill.innerHTML = `<span class="status-dot"></span> Trực tuyến`;
  } else {
    pill.dataset.mode = "offline";
    pill.innerHTML = `<span class="status-dot"></span> Offline (máy này)`;
  }
}

function syncWeekUI() {
  const sel = $("#week-select");
  const ids = competitionWeekIds();
  const current = defaultWeekId();
  const through = studiedThroughWeek();

  sel.innerHTML = ids
    .map((id) => {
      const n = weekNumber(id);
      let tag = "";
      if (n === through) tag = " · hôm nay";
      else if (n > through) tag = " · chưa học";
      return `<option value="${id}">Tuần ${n}${tag}</option>`;
    })
    .join("");

  if (!ids.includes(store.weekId)) store.weekId = current;
  sel.value = store.weekId;

  const n = weekNumber(store.weekId);
  $("#week-range").textContent = weekRangeLabel(store.weekId);
  $("#week-prev").disabled = n <= 1;
  $("#week-next").disabled = n >= TOTAL_WEEKS;
  $("#btn-this-week").classList.toggle("view-hidden", store.weekId === current);
  $("#week-banner").innerHTML = `Lịch thật: <strong>Tuần ${through}/${TOTAL_WEEKS}</strong> · BXH năm tính Tuần 1→${through} · Tuần chưa học không cộng`;
}

function setBoard(next) {
  board = next;
  document.querySelectorAll(".board-tab").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.board === board);
  });
  showHome();
}

function renderHome() {
  syncWeekUI();
  const titles = {
    teams: "Bảng xếp hạng tổ",
    year: "Điểm cá nhân cả năm",
    minus: "Bảng vi phạm (tiền án)",
    plus: "Bảng điểm cộng",
    achievements: "Thành tích nổi bật",
  };
  const foots = {
    teams: "Bấm tổ → tổng kết tuần + thành viên",
    year: `Tổng điểm Tuần 1→${studiedThroughWeek()} · Bấm tên xem tiểu sử`,
    minus: "Nhiều điểm trừ nhất trước · Bấm tên xem tiểu sử",
    plus: "Nhiều điểm cộng nhất trước · Bấm tên xem tiểu sử",
    achievements: "Nhiều thành tích nhất trước · Bấm tên xem tiểu sử",
  };
  $("#board-title").textContent = titles[board];
  $("#board-foot").textContent = foots[board];

  // Bảng cờ chỉ thuộc tab "Thành tích cả năm"
  const flagBoard = $("#flag-board");
  if (flagBoard) flagBoard.classList.toggle("view-hidden", board !== "achievements");

  if (board === "teams") {
    $("#rank-hint").textContent = `Tuần ${weekNumber(store.weekId)} · ${weekRangeLabel(store.weekId)}${isStudiedWeek(store.weekId) ? "" : " · tuần chưa học"}`;
    renderTeamBoard();
  } else if (board === "year") {
    $("#rank-hint").textContent = `Đã học: Tuần 1 → ${studiedThroughWeek()}`;
    renderPersonBoard(store.yearRankings(), "year");
  } else if (board === "minus") {
    $("#rank-hint").textContent = `Chỉ Tuần 1 → ${studiedThroughWeek()}`;
    renderPersonBoard(store.violationRankings(), "minus");
  } else if (board === "plus") {
    $("#rank-hint").textContent = `Chỉ Tuần 1 → ${studiedThroughWeek()}`;
    renderPersonBoard(store.bonusRankings(), "plus");
  } else if (board === "achievements") {
    $("#rank-hint").textContent = `Chỉ Tuần 1 → ${studiedThroughWeek()}`;
    renderPersonBoard(store.achievementRankings(), "achievements");
    renderFlagBoard();
  }
}

function renderTeamBoard() {
  const list = $("#rank-list");
  const ranks = store.rankings();
  const maxPts = Math.max(...ranks.map((r) => r.points), 1);

  list.innerHTML = ranks
    .map((r, i) => {
      const place = i + 1;
      const pct = Math.round((r.points / maxPts) * 100);
      return `
      <li>
        <button type="button" class="rank-item" data-place="${place}" data-team="${r.team.id}">
          <span class="rank-badge">${place}</span>
          <span class="rank-main">
            <div class="rank-name">${escapeHtml(r.team.name)}</div>
            <div class="rank-sub">${r.team.members.length} thành viên · TB ${r.avg}</div>
            <div class="rank-bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
          </span>
          <span class="rank-score">
            <strong>${r.points}</strong>
            <span>tổng tuần</span>
          </span>
        </button>
      </li>`;
    })
    .join("");

  list.querySelectorAll("[data-team]").forEach((btn) => {
    btn.addEventListener("click", () => showTeam(btn.dataset.team));
  });
}

function renderPersonBoard(rows, kind) {
  const list = $("#rank-list");
  if (!rows.length) {
    list.innerHTML = `<li class="empty-hint">Chưa có dữ liệu phù hợp trong các tuần đã học.</li>`;
    return;
  }

  list.innerHTML = rows
    .map((r, i) => {
      const place = i + 1;
      let scoreHtml = "";
      let sub = escapeHtml(r.teamName);
      if (kind === "year") {
        scoreHtml = `<strong>${r.yearTotal}</strong><span>tổng ${r.weeks} tuần · TB ${r.avg}</span>`;
        sub += ` · cộng ${formatPoints(r.plusPoints)} · trừ ${formatPoints(r.minusPoints)}`;
      } else if (kind === "minus") {
        scoreHtml = `<strong class="neg">${formatPoints(r.minusPoints)}</strong><span>${r.minusCount} lần vi phạm</span>`;
      } else if (kind === "achievements") {
        scoreHtml = `<strong class="pos">${formatPoints(r.achievementPoints)}</strong><span>${r.achievementCount} thành tích</span>`;
        sub += ` · phong trào tập thể`;
      } else {
        scoreHtml = `<strong class="pos">${formatPoints(r.plusPoints)}</strong><span>${r.plusCount} lần cộng</span>`;
      }
      return `
      <li>
        <button type="button" class="rank-item" data-place="${place}" data-person="${r.id}" data-kind="${kind}">
          <span class="rank-badge">${place}</span>
          <span class="rank-main">
            <div class="rank-name">${escapeHtml(r.name)}</div>
            <div class="rank-sub">${sub}</div>
          </span>
          <span class="rank-score">${scoreHtml}</span>
        </button>
      </li>`;
    })
    .join("");

  list.querySelectorAll("[data-person]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openProfile(btn.dataset.person, btn.dataset.kind === "year" ? "all" : btn.dataset.kind);
    });
  });
}

function eventRowHtml(e, { showWeek = false } = {}) {
  const cls = e.points > 0 ? "plus" : e.points < 0 ? "minus" : "zero";
  const when = new Date(e.createdAt).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const note = e.note ? ` · ${escapeHtml(e.note)}` : "";
  const weekBit = showWeek ? `Tuần ${weekNumber(e.weekId)} · ` : "";
  const canDel = store.canDeleteEvent(e);
  const delBtn = canDel
    ? `<button type="button" class="btn-del" data-del="${e.id}" title="Xoá ghi nhận nhầm">Xoá</button>`
    : "";
  return `
    <li class="event-item">
      <span class="event-delta ${cls}">${formatPoints(e.points)}</span>
      <span class="event-main">
        <div class="event-label">${escapeHtml(e.label)}</div>
        <div class="event-meta">${weekBit}${when}${note}</div>
      </span>
      ${delBtn}
    </li>`;
}

function bindDeleteButtons(root) {
  root.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      if (!confirm("Xoá hẳn ghi nhận này? Tổng kết / BXH / tiểu sử sẽ cập nhật theo — không lưu lại."))
        return;
      btn.disabled = true;
      try {
        await store.deleteEvent(btn.dataset.del);
        toast("Đã xoá hẳn — đã đồng bộ tổng kết.");
      } catch (err) {
        console.error(err);
        toast(err.message || "Không xoá được.", true);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function renderHistoryWeek(memberId) {
  const events = store.eventsForMember(memberId, { weekOnly: true });
  if (!events.length) {
    return `<p class="empty-hint">Chưa có ghi nhận tuần này.</p>`;
  }
  return `
    <h4>Lịch sử · ${weekLabel(store.weekId)}</h4>
    <ul class="event-list">
      ${events.map((e) => eventRowHtml(e)).join("")}
    </ul>
    <p class="history-actions">
      <button type="button" class="btn btn-ghost btn-sm" data-open-profile="${memberId}">Xem tiểu sử cả năm</button>
    </p>`;
}

function renderTeamSummary() {
  const sum = store.teamWeekSummary(activeTeamId);
  const violHtml = sum.violators.length
    ? `<ul class="mini-list">${sum.violators
        .map(
          (v) =>
            `<li><button type="button" class="linkish" data-open-profile="${v.id}">${escapeHtml(v.name)}</button> · ${formatPoints(v.points)} (${v.count} lần)</li>`
        )
        .join("")}</ul>`
    : `<p class="empty-mini">Không ai bị trừ tuần này.</p>`;

  const bonusHtml = sum.bonusers.length
    ? `<ul class="mini-list">${sum.bonusers
        .map(
          (v) =>
            `<li><button type="button" class="linkish" data-open-profile="${v.id}">${escapeHtml(v.name)}</button> · ${formatPoints(v.points)} (${v.count} lần)</li>`
        )
        .join("")}</ul>`
    : `<p class="empty-mini">Chưa có điểm cộng tuần này.</p>`;

  $("#team-summary").innerHTML = `
    <div class="panel-head">
      <div>
        <h2>Tổng kết tuần</h2>
        <p class="hint">${weekLabel(store.weekId, { withRange: true })}</p>
      </div>
    </div>
    <div class="summary-grid">
      <div class="summary-stat"><b>${sum.total}</b><span>điểm tổ</span></div>
      <div class="summary-stat"><b>${sum.base}</b><span>điểm gốc</span></div>
      <div class="summary-stat pos"><b>${formatPoints(sum.plusPoints)}</b><span>${sum.plusCount} lần cộng</span></div>
      <div class="summary-stat neg"><b>${formatPoints(sum.minusPoints)}</b><span>${sum.minusCount} lần trừ</span></div>
    </div>
    <div class="summary-cols">
      <div>
        <h3 class="summary-h neg-t">Ai bị trừ</h3>
        ${violHtml}
      </div>
      <div>
        <h3 class="summary-h pos-t">Ai được cộng</h3>
        ${bonusHtml}
      </div>
    </div>`;

  $("#team-summary").querySelectorAll("[data-open-profile]").forEach((btn) => {
    btn.addEventListener("click", () => openProfile(btn.dataset.openProfile, "all"));
  });
}

function renderTeamDetail() {
  const team = TEAM_BY_ID[activeTeamId];
  if (!team) return;

  $("#team-title").textContent = team.name;
  $("#team-meta").textContent = `${team.members.length} thành viên · ${weekLabel(store.weekId, { withRange: true })}`;
  $("#team-total").textContent = String(store.teamPoints(team.id));
  renderTeamSummary();

  const sorted = store.teamMembersSorted(team.id);
  const rows = sorted
    .map((m, i) => {
      const g = gradeFor(m.points);
      const open = openMemberId === m.id;
      const countHtml =
        m.eventCount > 0 ? `<span class="evt-count">${m.eventCount}</span>` : "";
      return `
      <tr class="${open ? "is-open" : ""}" data-member="${m.id}">
        <td class="place-cell">${i + 1}</td>
        <td>${escapeHtml(m.name)} ${countHtml}</td>
        <td class="pts">${m.points}</td>
        <td><span class="grade grade-${g.key}">${g.label}</span></td>
      </tr>
      <tr>
        <td colspan="4" style="padding:0;border:none">
          <div class="history ${open ? "is-visible" : ""}">
            ${open ? renderHistoryWeek(m.id) : ""}
          </div>
        </td>
      </tr>`;
    })
    .join("");

  $("#member-body").innerHTML = rows;

  $("#member-body").querySelectorAll("[data-member]").forEach((tr) => {
    tr.addEventListener("click", () => {
      const id = tr.dataset.member;
      openMemberId = openMemberId === id ? null : id;
      renderTeamDetail();
    });
  });

  const histRoot = $("#member-body");
  bindDeleteButtons(histRoot);
  histRoot.querySelectorAll("[data-open-profile]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openProfile(btn.dataset.openProfile, "all");
    });
  });
}

function showHome() {
  activeTeamId = null;
  openMemberId = null;
  profileMemberId = null;
  returnView = "home";
  hideAllViews();
  $("#view-home").classList.remove("view-hidden");
  $("#board-tabs").classList.remove("view-hidden");
  $("#search-box").classList.remove("view-hidden");
  renderHome();
}

function showTeam(teamId) {
  activeTeamId = teamId;
  openMemberId = null;
  profileMemberId = null;
  returnView = "team";
  board = "teams";
  document.querySelectorAll(".board-tab").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.board === "teams");
  });
  hideAllViews();
  $("#view-team").classList.remove("view-hidden");
  $("#board-tabs").classList.remove("view-hidden");
  $("#search-box").classList.remove("view-hidden");
  renderTeamDetail();
}

function openProfile(memberId, kind = "all") {
  if (activeTeamId) returnView = "team";
  else if (!profileMemberId) returnView = "home";
  profileMemberId = memberId;
  profileKind = ["plus", "minus", "achievements"].includes(kind) ? kind : "all";
  hideAllViews();
  $("#view-profile").classList.remove("view-hidden");
  $("#board-tabs").classList.add("view-hidden");
  renderProfile();
}

function closeProfile() {
  profileMemberId = null;
  if (returnView === "team" && activeTeamId) {
    hideAllViews();
    $("#view-team").classList.remove("view-hidden");
    $("#board-tabs").classList.remove("view-hidden");
    $("#search-box").classList.remove("view-hidden");
    renderTeamDetail();
  } else {
    showHome();
  }
}

function renderProfile() {
  if (!profileMemberId) return;
  const m = MEMBER_BY_ID[profileMemberId];
  if (!m) return;

  const kind = profileKind;
  const detail = store.memberDetail(profileMemberId, kind);
  const s = detail.stats;
  const teamName = TEAM_BY_ID[m.teamId]?.name || "";
  const weekPts = store.memberPoints(profileMemberId);

  $("#profile-avatar").textContent = initials(m.name);
  $("#profile-name").textContent = m.name;
  $("#profile-sub").textContent = `${teamName} · Tuần này ${weekPts}đ · Cả năm Tuần 1→${s.weeks}`;

  $("#profile-stats").innerHTML = `
    <div class="stat"><b>${s.yearTotal}</b><span>tổng ${s.weeks} tuần</span></div>
    <div class="stat"><b>${s.avg}</b><span>TB / tuần</span></div>
    <div class="stat pos"><b>${formatPoints(s.plusPoints)}</b><span>${s.plusCount} lần cộng</span></div>
    <div class="stat neg"><b>${formatPoints(s.minusPoints)}</b><span>${s.minusCount} lần trừ</span></div>
  `;

  document.querySelectorAll("#profile-filters .seg-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.dkind === kind);
  });

  let groupsHtml = "";
  if (!detail.groups.length) {
    groupsHtml = `<p class="empty-hint">Chưa có ghi nhận loại này.</p>`;
  } else {
    groupsHtml = `
      <h4 class="modal-h">Tổng hợp theo loại</h4>
      <ul class="group-list">
        ${detail.groups
          .map((g) => {
            const cls = g.points > 0 ? "plus" : g.points < 0 ? "minus" : "zero";
            const weeks = g.weeks.map((w) => `T${w}`).join(", ");
            return `
            <li class="group-item">
              <span class="event-delta ${cls}">${formatPoints(g.points)}</span>
              <span>
                <div class="event-label">${escapeHtml(g.label)}</div>
                <div class="event-meta">${g.count} lần · tuần: ${weeks || "—"}</div>
              </span>
            </li>`;
          })
          .join("")}
      </ul>`;
  }

  let eventsHtml = "";
  if (detail.events.length) {
    eventsHtml = `
      <h4 class="modal-h">Nhật ký điểm</h4>
      <ul class="event-list">
        ${detail.events.map((e) => eventRowHtml(e, { showWeek: true })).join("")}
      </ul>`;
  }

  let leaderHint = "";
  if (store.isAdmin()) {
    leaderHint = `<p class="leader-hint">Admin — có thể <b>Xoá</b> mọi ghi nhận (mọi tuần).</p>`;
  } else if (store.getLeaderTeamId() === m.teamId) {
    leaderHint = `<p class="leader-hint">Tổ trưởng — chỉ <b>Xoá</b> được ghi nhận của <b>tuần hiện tại</b>.</p>`;
  }

  $("#profile-body").innerHTML = leaderHint + groupsHtml + eventsHtml;
  bindDeleteButtons($("#profile-body"));
}

function renderSearchSuggest() {
  const q = $("#search-input").value;
  const box = $("#search-suggest");
  const rows = store.searchMembers(q);
  if (!q.trim()) {
    box.classList.add("view-hidden");
    box.innerHTML = "";
    return;
  }
  if (!rows.length) {
    box.classList.remove("view-hidden");
    box.innerHTML = `<li class="empty-hint">Không tìm thấy «${escapeHtml(q.trim())}»</li>`;
    return;
  }
  box.classList.remove("view-hidden");
  box.innerHTML = rows
    .slice(0, 8)
    .map(
      (m) => `
      <li>
        <button type="button" class="suggest-item" data-person="${m.id}">
          <span class="suggest-av">${initials(m.name)}</span>
          <span>
            <strong>${escapeHtml(m.name)}</strong>
            <small>${escapeHtml(m.teamName)} · năm ${m.yearTotal}đ · cộng ${formatPoints(m.plusPoints)} · trừ ${formatPoints(m.minusPoints)}</small>
          </span>
        </button>
      </li>`
    )
    .join("");

  box.querySelectorAll("[data-person]").forEach((btn) => {
    btn.addEventListener("click", () => {
      $("#search-input").value = "";
      box.classList.add("view-hidden");
      openProfile(btn.dataset.person, "all");
    });
  });
}

function fillRuleSelect() {
  const sel = $("#rule-select");
  const rules = RULES.filter((r) => {
    if (ruleFilter === "plus") return r.points > 0;
    if (ruleFilter === "minus") return r.points < 0 || r.noteOnly;
    return true;
  });
  const map = new Map();
  for (const r of rules) {
    if (!map.has(r.group)) map.set(r.group, []);
    map.get(r.group).push(r);
  }
  let html = `<option value="">— Chọn loại —</option>`;
  for (const [group, list] of map) {
    html += `<optgroup label="${escapeHtml(group)}">`;
    for (const r of list) {
      const pts = r.points === 0 && r.noteOnly ? "ghi nhận" : formatPoints(r.points);
      html += `<option value="${r.id}">${escapeHtml(r.label)} · ${pts}</option>`;
    }
    html += `</optgroup>`;
  }
  sel.innerHTML = html;
  updateRulePreview();
}

function fillMemberSelect() {
  const sel = $("#member-select");
  if (store.isAdmin()) {
    let html = `<option value="">— Chọn thành viên —</option>`;
    for (const t of TEAMS) {
      html += `<optgroup label="${escapeHtml(t.name)}">`;
      for (const m of store.teamMembersSorted(t.id)) {
        html += `<option value="${m.id}">${escapeHtml(m.name)} (${m.points}đ)</option>`;
      }
      html += `</optgroup>`;
    }
    sel.innerHTML = html;
    return;
  }

  const teamId = store.getLeaderTeamId();
  if (!teamId) {
    sel.innerHTML = `<option value="">—</option>`;
    return;
  }
  sel.innerHTML =
    `<option value="">— Chọn thành viên —</option>` +
    store
      .teamMembersSorted(teamId)
      .map((m) => `<option value="${m.id}">${escapeHtml(m.name)} (${m.points}đ)</option>`)
      .join("");
}

function updateRulePreview() {
  const rule = RULE_BY_ID[$("#rule-select").value];
  const prev = $("#rule-preview");
  if (!rule) {
    prev.textContent = "";
    prev.className = "preview";
    return;
  }
  if (rule.noteOnly && rule.points === 0) {
    prev.textContent = "Chỉ ghi nhận — không trừ/cộng số";
    prev.className = "preview";
    return;
  }
  prev.textContent = `Sẽ áp: ${formatPoints(rule.points)} điểm`;
  prev.className = `preview ${rule.points < 0 ? "minus" : ""}`;
}

function setLeaderPanelOpen(open) {
  $("#leader-panel").classList.toggle("view-hidden", !open);
}

function syncLeaderUI() {
  const role = store.getRole();
  const teamId = store.getLeaderTeamId();
  const fab = $("#leader-fab");
  const loggedIn = store.isLoggedIn();

  fab.dataset.active = loggedIn ? "true" : "false";
  fab.dataset.role = role || "";
  fab.textContent = store.isAdmin() ? "AD" : "TT";
  fab.title = store.isAdmin()
    ? "Admin — toàn quyền"
    : teamId
      ? `Đang ghi điểm: ${TEAM_BY_ID[teamId]?.name}`
      : "Tổ trưởng / Admin — nhập mã";

  const lock = $("#leader-lock-note");
  const formFields = ["#member-select", "#rule-select", "#note-input", "#btn-submit"];

  if (loggedIn) {
    $("#leader-login").classList.add("view-hidden");
    $("#leader-form").classList.remove("view-hidden");

    if (store.isAdmin()) {
      $("#leader-team-label").textContent = "Admin";
      $("#leader-form-sub").textContent =
        "Toàn quyền mọi tổ · mọi tuần. Chọn thành viên + loại → xác nhận.";
      lock.classList.add("view-hidden");
      formFields.forEach((s) => {
        const el = $(s);
        if (el) el.disabled = false;
      });
    } else {
      $("#leader-team-label").textContent = TEAM_BY_ID[teamId]?.name || teamId;
      $("#leader-form-sub").textContent =
        "Chỉ ghi được tuần hiện tại. Tuần đã qua khoá.";
      if (!store.canEditWeek()) {
        const n = weekNumber(store.weekId);
        const through = studiedThroughWeek();
        lock.textContent =
          n < through
            ? `Tuần ${n} đã qua — tổ trưởng không được tạo/xoá. Chỉ admin mới chỉnh được.`
            : `Tuần ${n} chưa tới lịch học — tổ trưởng chưa ghi điểm được.`;
        lock.classList.remove("view-hidden");
        formFields.forEach((s) => {
          const el = $(s);
          if (el) el.disabled = true;
        });
      } else {
        lock.classList.add("view-hidden");
        formFields.forEach((s) => {
          const el = $(s);
          if (el) el.disabled = false;
        });
      }
    }
    fillMemberSelect();
  } else {
    $("#leader-login").classList.remove("view-hidden");
    $("#leader-form").classList.add("view-hidden");
    lock.classList.add("view-hidden");
  }
}

function onStoreUpdate() {
  if (store.isLoggedIn()) {
    fillMemberSelect();
    syncLeaderUI();
  }
  if (profileMemberId) renderProfile();
  else if (activeTeamId) renderTeamDetail();
  else renderHome();
}

async function goWeek(weekId) {
  if (!weekId || weekId === store.weekId) return;
  await store.setWeek(weekId);
}

function showBootError(msg) {
  const el = $("#boot-error");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("view-hidden");
}

// ————————————————————————————————————————————————
//  BẢNG CỜ LUÂN LƯU (tab Thành tích cả năm)
// ————————————————————————————————————————————————

/** yyyy-mm-dd → dd/mm/yyyy (hiển thị cho người Việt) */
function formatDmy(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso || "");
}

/** thẻ <img> có fallback placeholder nếu thiếu ảnh (onerror đổi thành khối màu + chữ) */
function flagImageHtml(type) {
  const f = FLAG_TYPE_BY_ID[type];
  if (!f) return `<span class="flag-ph" data-name="?" aria-hidden="true">?</span>`;
  const esc = escapeHtml(f.name);
  return `<img class="flag-img" src="${escapeHtml(f.image)}" alt="${esc}"
    onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'flag-ph',dataset:{name:'${esc}'},textContent:'🚩'}))" />`;
}

/** Cờ đã mở khóa (offline coi như mở để dùng 1 máy; live cần phiên admin) */
function flagUnlocked() {
  return flagStore.isAuthenticated();
}

function syncFlagLockUI() {
  const unlocked = flagUnlocked();
  const lockBtn = $("#flag-lock-btn");
  const grabBtn = $("#flag-grab-btn");
  if (lockBtn) {
    lockBtn.textContent = unlocked ? "🔓 Mở khóa" : "🔒 Khóa";
    lockBtn.setAttribute("aria-pressed", unlocked ? "true" : "false");
    lockBtn.title = unlocked ? "Khóa lại / đăng xuất" : "Mở khóa để quản lý cờ";
  }
  if (grabBtn) grabBtn.classList.toggle("view-hidden", !unlocked);
  // thùng rác chỉ hiện khi mở khóa (kéo cờ trên bảng thả vào để xóa)
  const trash = $("#flag-trash");
  if (trash) trash.classList.toggle("view-hidden", !unlocked);
  const filters = $("#flag-filters");
  if (filters) filters.classList.toggle("view-hidden", false); // lọc luôn hiện khi có dữ liệu
  // khay cầm chỉ hiện khi mở khóa & có cờ đang cầm
  renderTray();
}

/** dropdown loại + dropdown tháng */
function buildFlagFilterOptions() {
  const typeSel = $("#flag-filter-type");
  if (typeSel && typeSel.options.length <= 1) {
    typeSel.innerHTML =
      `<option value="">Tất cả loại cờ</option>` +
      FLAG_TYPES.map((f) => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join("");
  }
  const monthSel = $("#flag-filter-month");
  if (monthSel) {
    const months = flagStore.months();
    const cur = flagFilter.month;
    monthSel.innerHTML =
      `<option value="">Tất cả tháng</option>` +
      months.map((mo) => {
        const [y, m] = mo.split("-");
        return `<option value="${mo}">Tháng ${m}/${y}</option>`;
      }).join("");
    monthSel.value = months.includes(cur) ? cur : "";
    flagFilter.month = monthSel.value;
  }
}

function renderFlagStats() {
  const { total, byType } = flagStore.stats();
  const chips = FLAG_TYPES.map(
    (f) => `<span class="flag-stat-chip">${flagImageHtml(f.id)}<b>${byType[f.id] || 0}</b> ${escapeHtml(f.name)}</span>`
  ).join("");
  $("#flag-stats").innerHTML =
    `<span class="flag-stat-chip flag-stat-total">Tổng <b>${total}</b> lá cờ</span>${chips}`;
}

function renderFlagGrid() {
  const grid = $("#flag-grid");
  const empty = $("#flag-empty");
  const unlocked = flagUnlocked();
  const rows = flagStore.filtered(flagFilter);

  if (!rows.length) {
    grid.innerHTML = "";
    empty.classList.remove("view-hidden");
    return;
  }
  empty.classList.add("view-hidden");
  grid.innerHTML = rows
    .map((f) => {
      const type = FLAG_TYPE_BY_ID[f.flag_type];
      const note = f.note ? escapeHtml(f.note) : "";
      const actions = unlocked
        ? `<div class="flag-item-actions">
             <button type="button" class="icon-btn flag-edit" data-edit="${f.id}" title="Sửa ngày/ghi chú" aria-label="Sửa cờ">✏️</button>
             <button type="button" class="icon-btn flag-del" data-del="${f.id}" title="Xóa cờ" aria-label="Xóa cờ">🗑️</button>
           </div>`
        : "";
      return `<li class="flag-item${note ? " has-note" : ""}" data-id="${f.id}" data-flag-drop-target="1">
        ${actions}
        <div class="flag-face">${flagImageHtml(f.flag_type)}</div>
        <div class="flag-cap"><span class="flag-cap-name">${escapeHtml(type?.name || f.flag_type)}</span>
          <span class="flag-cap-date">${formatDmy(f.placed_date)}</span></div>
        ${note ? `<div class="flag-note">${note}</div>` : ""}
      </li>`;
    })
    .join("");

  // gắn hành động sửa/xóa
  grid.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      openFlagFormModal(b.dataset.edit);
    })
  );
  grid.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = b.dataset.del;
      const f = flagStore.flags.find((x) => x.id === id);
      const label = FLAG_TYPE_BY_ID[f?.flag_type]?.name || "lá cờ này";
      if (!confirm(`Xóa ${label} (đặt ${formatDmy(f?.placed_date)}) khỏi bảng?`)) return;
      try {
        await flagStore.deleteFlag(id);
        toast("Đã xóa cờ.");
      } catch (err) {
        toast(err.message || "Không xóa được.", true);
      }
    })
  );

  // Kéo thả "recycle bin": mở khóa → kéo một lá cờ trên bảng thả vào thùng rác để xóa
  if (unlocked) {
    grid.querySelectorAll(".flag-item").forEach((li) => setupItemTrashDrag(li));
  }
}

/** Cho phép kéo một lá cờ đã đặt trên bảng vào thùng rác để xóa. */
function setupItemTrashDrag(li) {
  const trash = $("#flag-trash");
  if (!trash) return;
  const id = li.dataset.id;
  if (!id) return;

  li.style.touchAction = "none"; // cho Pointer Events trên mobile
  li.style.cursor = "grab";

  let ghost = null;
  let dragging = false;

  const overTrash = (x, y) => {
    const r = trash.getBoundingClientRect();
    // nới thêm 12px cho dễ thả
    return x >= r.left - 12 && x <= r.right + 12 && y >= r.top - 12 && y <= r.bottom + 12;
  };

  const moveGhost = (x, y) => {
    if (ghost) {
      ghost.style.left = `${x - 40}px`;
      ghost.style.top = `${y - 30}px`;
    }
    trash.classList.toggle("flag-trash-hot", overTrash(x, y));
  };

  li.addEventListener("pointerdown", (e) => {
    // bấm vào nút sửa/xóa thì không kéo
    if (e.target.closest(".flag-item-actions")) return;
    e.preventDefault();
    dragging = true;
    li.classList.add("flag-dragging");
    trash.classList.remove("view-hidden"); // đảm bảo thùng rác đang hiện khi kéo
    ghost = li.cloneNode(true);
    ghost.removeAttribute("id");
    ghost.querySelectorAll("[data-edit],[data-del]").forEach((b) => b.remove());
    ghost.className = "flag-item flag-ghost";
    document.body.appendChild(ghost);
    moveGhost(e.clientX, e.clientY);
    li.setPointerCapture(e.pointerId);
  });

  li.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    moveGhost(e.clientX, e.clientY);
  });

  const end = async (e) => {
    if (!dragging) return;
    dragging = false;
    li.classList.remove("flag-dragging");
    trash.classList.remove("flag-trash-hot");
    if (ghost) {
      ghost.remove();
      ghost = null;
    }
    if (!overTrash(e.clientX, e.clientY)) return;
    const f = flagStore.flags.find((x) => x.id === id);
    const label = FLAG_TYPE_BY_ID[f?.flag_type]?.name || "lá cờ này";
    if (!confirm(`Xóa ${label} (đặt ${formatDmy(f?.placed_date)}) khỏi bảng?`)) return;
    try {
      await flagStore.deleteFlag(id);
      toast("Đã xóa cờ.");
    } catch (err) {
      toast(err.message || "Không xóa được.", true);
    }
  };
  li.addEventListener("pointerup", end);
  li.addEventListener("pointercancel", end);
}

function renderTray() {
  const tray = $("#flag-tray");
  const slot = $("#flag-tray-slot");
  if (!tray || !slot) return;
  if (!flagUnlocked() || !heldFlag) {
    tray.classList.add("view-hidden");
    slot.innerHTML = "";
    return;
  }
  tray.classList.remove("view-hidden");
  const type = FLAG_TYPE_BY_ID[heldFlag.flagType];
  slot.innerHTML = `<div class="flag-chip" id="flag-drag-chip" title="Kéo lên bảng để đặt">
      <div class="flag-face">${flagImageHtml(heldFlag.flagType)}</div>
      <div class="flag-cap"><span class="flag-cap-name">${escapeHtml(type?.name || heldFlag.flagType)}</span>
        <span class="flag-cap-date">${formatDmy(heldFlag.placedDate)}</span></div>
    </div>`;
  setupChipDrag();
}

function renderFlagBoard() {
  if (!$("#flag-board")) return;
  const loading = $("#flag-loading");
  if (loading) loading.classList.toggle("view-hidden", !flagStore.loading);
  syncFlagLockUI();
  buildFlagFilterOptions();
  renderFlagStats();
  renderFlagGrid();
  // hiện khối lọc chỉ khi có dữ liệu
  const hasData = flagStore.flags.length > 0;
  $("#flag-filters")?.classList.toggle("view-hidden", !hasData);
  $("#flag-clear-filters")?.classList.toggle(
    "view-hidden",
    !(flagFilter.type || flagFilter.month)
  );
}

// —— Modal đăng nhập admin (Supabase Auth) ——
function openFlagAuthModal() {
  const modal = $("#flag-auth-modal");
  modal.classList.remove("view-hidden");
  $("#flag-auth-error").classList.add("view-hidden");
  $("#flag-auth-pass").value = "";
  $("#flag-auth-pass").focus();
}
function closeFlagAuthModal() {
  $("#flag-auth-modal").classList.add("view-hidden");
}

// —— Modal nhận / sửa cờ ——
function buildFlagTypePick() {
  const pick = $("#flag-type-pick");
  pick.innerHTML = FLAG_TYPES.map(
    (f) => `<button type="button" class="flag-type-card${f.id === flagPickType ? " is-active" : ""}"
        role="radio" aria-checked="${f.id === flagPickType}" data-flagtype="${f.id}">
        <div class="flag-face">${flagImageHtml(f.id)}</div>
        <span>${escapeHtml(f.name)}</span>
      </button>`
  ).join("");
  pick.querySelectorAll("[data-flagtype]").forEach((b) =>
    b.addEventListener("click", () => {
      flagPickType = b.dataset.flagtype;
      pick.querySelectorAll(".flag-type-card").forEach((c) => {
        const on = c === b;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-checked", on ? "true" : "false");
      });
    })
  );
}

function syncDateLabel() {
  $("#flag-date-label").textContent = formatDmy($("#flag-date").value);
}

/**
 * @param {string|null} editId  null = nhận cờ mới; id = sửa cờ đã đặt
 */
function openFlagFormModal(editId = null) {
  flagEditingId = editId;
  const modal = $("#flag-form-modal");
  $("#flag-form-title").textContent = editId ? "Sửa cờ" : "Nhận cờ";
  $("#flag-form-submit").textContent = editId ? "Lưu" : "Xác nhận";
  $("#flag-form-error").classList.add("view-hidden");

  const existing = editId ? flagStore.flags.find((f) => f.id === editId) : null;
  flagPickType = existing?.flag_type || FLAG_TYPES[0]?.id || "";
  buildFlagTypePick();

  const dateEl = $("#flag-date");
  dateEl.value = existing?.placed_date || todayISO();
  syncDateLabel();
  $("#flag-note").value = existing?.note || "";

  modal.classList.remove("view-hidden");
  dateEl.focus();
}
function closeFlagFormModal() {
  $("#flag-form-modal").classList.add("view-hidden");
  flagEditingId = null;
}

/** Xác nhận modal cờ */
async function submitFlagForm() {
  const errEl = $("#flag-form-error");
  errEl.classList.add("view-hidden");
  const placedDate = $("#flag-date").value || todayISO();
  const note = $("#flag-note").value.trim();

  if (!flagPickType) {
    errEl.textContent = "Chọn loại cờ trước.";
    errEl.classList.remove("view-hidden");
    return;
  }

  const btn = $("#flag-form-submit");
  btn.disabled = true;
  try {
    if (flagEditingId) {
      // sửa bản ghi đã tồn tại → PATCH Supabase
      await flagStore.updateFlag(flagEditingId, { placedDate, note });
      toast("Đã cập nhật cờ.");
    } else {
      // nhận cờ mới → đặt vào khay "Cờ đang cầm" (chưa ghi, chờ kéo/đặt)
      heldFlag = { flagType: flagPickType, placedDate, note };
      toast("Đã nhận cờ — kéo lên bảng hoặc bấm Đặt lên bảng.");
    }
    closeFlagFormModal();
    renderFlagBoard();
  } catch (e) {
    errEl.textContent = e.message || "Không lưu được.";
    errEl.classList.remove("view-hidden");
  } finally {
    btn.disabled = false;
  }
}

/** Ghi lá cờ đang cầm lên bảng (INSERT Supabase). Kéo-thả và nút "Đặt lên bảng" dùng chung. */
async function placeHeldFlag() {
  if (!heldFlag) return;
  const draft = heldFlag;
  try {
    await flagStore.addFlag({
      flagType: draft.flagType,
      placedDate: draft.placedDate,
      note: draft.note,
    });
    heldFlag = null; // tiêu thụ con cờ sau khi lưu
    const name = FLAG_TYPE_BY_ID[draft.flagType]?.name || "Cờ";
    toast(`Đã cắm ${name} (${formatDmy(draft.placedDate)}).`, false);
    renderFlagBoard();
    animateNewestFlag();
  } catch (e) {
    toast(e.message || "Không đặt được cờ.", true);
  }
}

function cancelHeldFlag() {
  heldFlag = null;
  renderTray();
}

/** animation "cắm cờ" cho lá mới nhất */
function animateNewestFlag() {
  const first = $("#flag-grid .flag-item");
  if (first) {
    first.classList.add("flag-plant");
    setTimeout(() => first.classList.remove("flag-plant"), 600);
  }
}

// ————— Kéo thả bằng Pointer Events (chuột + cảm ứng) —————
function setupChipDrag() {
  const chip = $("#flag-drag-chip");
  const zone = $("#flag-dropzone");
  if (!chip || !zone) return;

  let ghost = null;
  let dragging = false;

  const overZone = (x, y) => {
    const r = zone.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  chip.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;
    chip.classList.add("flag-dragging");
    // ghost theo con trỏ
    ghost = chip.cloneNode(true);
    ghost.id = "flag-drag-ghost";
    ghost.className = "flag-chip flag-ghost";
    document.body.appendChild(ghost);
    moveGhost(e.clientX, e.clientY);
    chip.setPointerCapture(e.pointerId);
  });

  const moveGhost = (x, y) => {
    if (ghost) {
      ghost.style.left = `${x - 40}px`;
      ghost.style.top = `${y - 30}px`;
    }
    zone.classList.toggle("flag-drop-hot", overZone(x, y));
  };

  chip.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    moveGhost(e.clientX, e.clientY);
  });

  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    chip.classList.remove("flag-dragging");
    zone.classList.remove("flag-drop-hot");
    if (ghost) {
      ghost.remove();
      ghost = null;
    }
    // thả vào vùng bảng → đặt cờ
    if (overZone(e.clientX, e.clientY)) placeHeldFlag();
  };
  chip.addEventListener("pointerup", end);
  chip.addEventListener("pointercancel", end);
}

function wireFlagEvents() {
  // Nút khóa/mở khóa — "khóa mềm" bằng ADMIN_CODE (giống mã tổ trưởng của app).
  // Đây chỉ là chốt giao diện; ai xem được JS đều thấy mật khẩu → coi như lớp che cơ bản.
  $("#flag-lock-btn").addEventListener("click", () => {
    if (!flagUnlocked()) {
      openFlagAuthModal();
    } else {
      flagStore.signOut();
      cancelHeldFlag();
      syncFlagLockUI();
      renderFlagBoard();
      toast("Đã khóa.");
    }
  });

  $("#flag-grab-btn").addEventListener("click", () => openFlagFormModal(null));

  // Modal đăng nhập
  $("#flag-auth-cancel").addEventListener("click", closeFlagAuthModal);
  $("#flag-auth-submit").addEventListener("click", async () => {
    const pass = $("#flag-auth-pass").value;
    const errEl = $("#flag-auth-error");
    const btn = $("#flag-auth-submit");
    if (!pass) {
      errEl.textContent = "Nhập mật khẩu.";
      errEl.classList.remove("view-hidden");
      return;
    }
    btn.disabled = true;
    errEl.classList.add("view-hidden");
    try {
      await flagStore.signIn(pass);
      closeFlagAuthModal();
      toast("Đã mở khóa — xin chào quản trị!");
      renderFlagBoard();
    } catch (e) {
      errEl.textContent = e.message || "Đăng nhập thất bại.";
      errEl.classList.remove("view-hidden");
    } finally {
      btn.disabled = false;
    }
  });
  document.getElementById("flag-auth-pass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      $("#flag-auth-submit").click();
    }
  });

  // Modal nhận/sửa cờ
  $("#flag-form-cancel").addEventListener("click", closeFlagFormModal);
  $("#flag-form-submit").addEventListener("click", submitFlagForm);
  $("#flag-date").addEventListener("change", syncDateLabel);
  $("#flag-note").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitFlagForm();
    }
  });

  // Khay cầm: nút đặt/hủy + kéo đã gắn trong renderTray
  $("#flag-place-btn").addEventListener("click", placeHeldFlag);
  $("#flag-cancel-btn").addEventListener("click", cancelHeldFlag);

  // Bộ lọc
  $("#flag-filter-type").addEventListener("change", (e) => {
    flagFilter.type = e.target.value;
    renderFlagGrid();
    $("#flag-clear-filters")?.classList.toggle("view-hidden", !(flagFilter.type || flagFilter.month));
  });
  $("#flag-filter-month").addEventListener("change", (e) => {
    flagFilter.month = e.target.value;
    renderFlagGrid();
    $("#flag-clear-filters")?.classList.toggle("view-hidden", !(flagFilter.type || flagFilter.month));
  });
  $("#flag-clear-filters").addEventListener("click", () => {
    flagFilter.type = "";
    flagFilter.month = "";
    $("#flag-filter-type").value = "";
    $("#flag-filter-month").value = "";
    renderFlagGrid();
    $("#flag-clear-filters").classList.add("view-hidden");
  });

  // Đóng modal bằng Esc / click nền
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!$("#flag-auth-modal").classList.contains("view-hidden")) closeFlagAuthModal();
      if (!$("#flag-form-modal").classList.contains("view-hidden")) closeFlagFormModal();
    }
  });
  document.querySelectorAll(".modal-overlay").forEach((ov) =>
    ov.addEventListener("click", (e) => {
      if (e.target === ov) {
        if (ov.id === "flag-auth-modal") closeFlagAuthModal();
        if (ov.id === "flag-form-modal") closeFlagFormModal();
      }
    })
  );
}

function wireEvents() {
  $("#week-select").addEventListener("change", async (e) => {
    await goWeek(e.target.value);
  });
  $("#week-prev").addEventListener("click", async () => {
    const n = weekNumber(store.weekId);
    if (n > 1) await goWeek(weekIdForNumber(n - 1));
  });
  $("#week-next").addEventListener("click", async () => {
    const n = weekNumber(store.weekId);
    if (n < TOTAL_WEEKS) await goWeek(weekIdForNumber(n + 1));
  });
  $("#btn-this-week").addEventListener("click", async () => {
    await goWeek(defaultWeekId());
  });
  $("#btn-back").addEventListener("click", showHome);
  $("#btn-back-profile").addEventListener("click", closeProfile);

  document.querySelectorAll(".board-tab").forEach((btn) => {
    btn.addEventListener("click", () => setBoard(btn.dataset.board));
  });

  $("#search-input").addEventListener("input", renderSearchSuggest);
  $("#search-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const rows = store.searchMembers($("#search-input").value);
      if (rows.length === 1) {
        $("#search-input").value = "";
        $("#search-suggest").classList.add("view-hidden");
        openProfile(rows[0].id, "all");
      } else {
        renderSearchSuggest();
      }
    }
  });
  $("#search-btn").addEventListener("click", () => {
    const rows = store.searchMembers($("#search-input").value);
    if (rows.length === 1) {
      $("#search-input").value = "";
      $("#search-suggest").classList.add("view-hidden");
      openProfile(rows[0].id, "all");
    } else {
      renderSearchSuggest();
    }
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-box")) {
      $("#search-suggest").classList.add("view-hidden");
    }
  });

  document.querySelectorAll("#profile-filters .seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      profileKind = btn.dataset.dkind;
      renderProfile();
    });
  });

  $("#leader-fab").addEventListener("click", (e) => {
    e.stopPropagation();
    setLeaderPanelOpen($("#leader-panel").classList.contains("view-hidden"));
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".leader-dock")) setLeaderPanelOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (profileMemberId) closeProfile();
      setLeaderPanelOpen(false);
      $("#search-suggest").classList.add("view-hidden");
    }
  });

  $("#btn-login").addEventListener("click", () => {
    const auth = resolveAuthCode($("#leader-code").value);
    if (!auth) {
      toast("Mã không đúng.", true);
      return;
    }
    if (auth.role === "admin") {
      store.setAuth("admin");
      toast("Xin chào Admin — toàn quyền.");
    } else {
      store.setAuth("leader", auth.teamId);
      toast(`Xin chào ${TEAM_BY_ID[auth.teamId].name}!`);
    }
    $("#leader-code").value = "";
    syncLeaderUI();
    if (profileMemberId) renderProfile();
    if (activeTeamId) renderTeamDetail();
  });
  $("#leader-code").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#btn-login").click();
  });
  $("#btn-logout").addEventListener("click", () => {
    store.setAuth(null);
    syncLeaderUI();
    toast("Đã đăng xuất.");
    if (profileMemberId) renderProfile();
    if (activeTeamId) renderTeamDetail();
  });

  document.querySelectorAll(".seg-btn[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      ruleFilter = btn.dataset.filter;
      document.querySelectorAll(".seg-btn[data-filter]").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
      });
      fillRuleSelect();
    });
  });

  $("#rule-select").addEventListener("change", updateRulePreview);

  $("#btn-submit").addEventListener("click", async () => {
    const memberId = $("#member-select").value;
    const ruleId = $("#rule-select").value;
    const note = $("#note-input").value.trim();
    if (!memberId || !ruleId) {
      toast("Chọn thành viên và loại điểm.", true);
      return;
    }
    const btn = $("#btn-submit");
    btn.disabled = true;
    try {
      const ev = await store.addEvent({ memberId, ruleId, note });
      const name = MEMBER_BY_ID[memberId]?.name || memberId;
      toast(`${name}: ${formatPoints(ev.points)} — ${ev.label}`);
      $("#rule-select").value = "";
      $("#note-input").value = "";
      updateRulePreview();
      fillMemberSelect();
      $("#member-select").value = memberId;
    } catch (err) {
      console.error(err);
      toast(err.message || "Không ghi được điểm.", true);
    } finally {
      btn.disabled = false;
    }
  });
}

async function boot() {
  try {
    $("#brand-class").textContent = CLASS_NAME;
    $("#brand-year").textContent = `Thi đua năm học ${SCHOOL_YEAR}`;

    fillRuleSelect();
    syncModePill();
    syncLeaderUI();
    wireEvents();
    wireFlagEvents();
    store.subscribe(onStoreUpdate);
    // bảng cờ: tự render mỗi khi có dữ liệu mới (polling/sign in/out) — chỉ khi đang ở tab achievements
    flagStore.subscribe(() => {
      if (board === "achievements") renderFlagBoard();
    });
    showHome();

    try {
      await store.init();
      syncModePill();
      if (!SUPABASE_ENABLED) {
        toast("Chưa cấu hình Supabase — đang dùng offline trên máy này.");
      }
    } catch (err) {
      console.error(err);
      toast("Không kết nối được Supabase — tạm dùng offline.", true);
      store.mode = "offline";
      flagStore.mode = "offline";
      await store.refresh();
      syncModePill();
    }

    // bảng cờ tải riêng, không chặn phần còn lại của app
    try {
      await flagStore.init();
    } catch (err) {
      console.warn("flags init", err);
      if (flagStore.mode === "live") toast("Chưa tải được bảng cờ — kiểm tra SQL class_flags.", true);
    }
  } catch (err) {
    console.error(err);
    showBootError(
      "Không khởi động được app. Ctrl+F5 hoặc kiểm tra Console. " +
        (err && err.message ? err.message : String(err))
    );
  }
}

boot();
