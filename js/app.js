import {
  CLASS_NAME,
  SCHOOL_YEAR,
  TEAM_BY_ID,
  MEMBER_BY_ID,
  resolveLeaderCode,
  SUPABASE_ENABLED,
} from "./config.js";
import {
  gradeFor,
  formatPoints,
  RULE_BY_ID,
  RULES,
} from "./rules.js";
import {
  ScoreStore,
  weekIdFromDate,
  weekLabel,
  weekRangeLabel,
  weekNumber,
  competitionWeekIds,
} from "./store.js";

const store = new ScoreStore();
/** @type {string | null} */
let activeTeamId = null;
/** @type {string | null} */
let openMemberId = null;
/** @type {"all" | "plus" | "minus"} */
let ruleFilter = "all";

const $ = (sel, root = document) => root.querySelector(sel);

function toast(msg, isError = false) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.toggle("error", isError);
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2800);
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
  const current = weekIdFromDate();

  sel.innerHTML = ids
    .map((id) => {
      const n = weekNumber(id);
      const tag = id === current ? " · tuần này" : "";
      return `<option value="${id}">Tuần ${n}${tag}</option>`;
    })
    .join("");

  if (!ids.includes(store.weekId)) {
    store.weekId = ids[0] || current;
  }
  sel.value = store.weekId;

  $("#week-range").textContent = weekRangeLabel(store.weekId);
  $("#rank-hint").textContent = `Đang xem ${weekLabel(store.weekId)} · ${weekRangeLabel(store.weekId)}`;
  $("#week-banner").innerHTML = `Mỗi bạn bắt đầu <strong>100 điểm</strong> · Đang xem <strong>${weekLabel(store.weekId)}</strong>`;

  const idx = ids.indexOf(store.weekId);
  $("#week-prev").disabled = idx < 0 || idx >= ids.length - 1;
  $("#week-next").disabled = idx <= 0;

  const btnThis = $("#btn-this-week");
  if (store.weekId !== current) {
    btnThis.classList.remove("view-hidden");
  } else {
    btnThis.classList.add("view-hidden");
  }
}

async function goWeek(weekId) {
  if (!weekId || weekId === store.weekId) return;
  await store.setWeek(weekId);
  syncWeekUI();
}

function renderRanking() {
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
            <div class="rank-name">${r.team.name}</div>
            <div class="rank-sub">${r.team.members.length} thành viên · TB ${r.avg}</div>
            <div class="rank-bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
          </span>
          <span class="rank-score">
            <strong>${r.points}</strong>
            <span>tổng điểm</span>
          </span>
        </button>
      </li>`;
    })
    .join("");

  list.querySelectorAll("[data-team]").forEach((btn) => {
    btn.addEventListener("click", () => showTeam(btn.dataset.team));
  });
}

function renderHistory(memberId) {
  const events = store.eventsForMember(memberId);
  if (!events.length) {
    return `<p class="empty-hint">Chưa có ghi nhận nào trong ${weekLabel(store.weekId)}.</p>`;
  }
  return `
    <h4>Lịch sử · ${weekLabel(store.weekId)}</h4>
    <ul class="event-list">
      ${events
        .map((e) => {
          const cls =
            e.points > 0 ? "plus" : e.points < 0 ? "minus" : "zero";
          const when = new Date(e.createdAt).toLocaleString("vi-VN", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
          const by = TEAM_BY_ID[e.byTeamId]?.name || e.byTeamId;
          const note = e.note ? ` · ${escapeHtml(e.note)}` : "";
          return `
          <li class="event-item">
            <span class="event-delta ${cls}">${formatPoints(e.points)}</span>
            <span>
              <div class="event-label">${escapeHtml(e.label)}</div>
              <div class="event-meta">${when} · ${escapeHtml(by)}${note}</div>
            </span>
          </li>`;
        })
        .join("")}
    </ul>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTeamDetail() {
  const team = TEAM_BY_ID[activeTeamId];
  if (!team) return;

  $("#team-title").textContent = team.name;
  $("#team-meta").textContent = `${team.members.length} thành viên · ${weekLabel(store.weekId, { withRange: true })}`;
  $("#team-total").textContent = String(store.teamPoints(team.id));

  const rows = team.members
    .map((m) => {
      const pts = store.memberPoints(m.id);
      const g = gradeFor(pts);
      const open = openMemberId === m.id;
      const count = store.eventsForMember(m.id).length;
      const countHtml =
        count > 0
          ? `<span class="evt-count">${count}</span>`
          : "";
      return `
      <tr class="${open ? "is-open" : ""}" data-member="${m.id}">
        <td>${escapeHtml(m.name)} ${countHtml}</td>
        <td class="pts">${pts}</td>
        <td><span class="grade grade-${g.key}">${g.label}</span></td>
      </tr>
      <tr>
        <td colspan="3" style="padding:0;border:none">
          <div class="history ${open ? "is-visible" : ""}" data-history-for="${m.id}">
            ${open ? renderHistory(m.id) : ""}
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
}

function showHome() {
  activeTeamId = null;
  openMemberId = null;
  $("#view-home").classList.remove("view-hidden");
  $("#view-team").classList.add("view-hidden");
  renderRanking();
}

function showTeam(teamId) {
  activeTeamId = teamId;
  openMemberId = null;
  $("#view-home").classList.add("view-hidden");
  $("#view-team").classList.remove("view-hidden");
  renderTeamDetail();
}

function filteredRules() {
  return RULES.filter((r) => {
    if (ruleFilter === "plus") return r.points > 0;
    if (ruleFilter === "minus") return r.points < 0 || r.noteOnly;
    return true;
  });
}

function fillRuleSelect() {
  const sel = $("#rule-select");
  const rules = filteredRules();
  /** @type {Map<string, typeof RULES>} */
  const map = new Map();
  for (const r of rules) {
    if (!map.has(r.group)) map.set(r.group, []);
    map.get(r.group).push(r);
  }

  let html = `<option value="">— Chọn loại —</option>`;
  for (const [group, list] of map) {
    html += `<optgroup label="${escapeHtml(group)}">`;
    for (const r of list) {
      const pts =
        r.points === 0 && r.noteOnly
          ? "ghi nhận"
          : formatPoints(r.points);
      html += `<option value="${r.id}">${escapeHtml(r.label)} · ${pts}</option>`;
    }
    html += `</optgroup>`;
  }
  sel.innerHTML = html;
  updateRulePreview();
}

function fillMemberSelect() {
  const teamId = store.getLeaderTeamId();
  const sel = $("#member-select");
  if (!teamId) {
    sel.innerHTML = `<option value="">—</option>`;
    return;
  }
  const team = TEAM_BY_ID[teamId];
  sel.innerHTML =
    `<option value="">— Chọn thành viên —</option>` +
    team.members
      .map((m) => {
        const pts = store.memberPoints(m.id);
        return `<option value="${m.id}">${escapeHtml(m.name)} (${pts}đ)</option>`;
      })
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
  const teamId = store.getLeaderTeamId();
  const fab = $("#leader-fab");
  const login = $("#leader-login");
  const form = $("#leader-form");

  fab.dataset.active = teamId ? "true" : "false";
  fab.title = teamId
    ? `Đang ghi điểm: ${TEAM_BY_ID[teamId]?.name}`
    : "Tổ trưởng — nhập mã";

  if (teamId) {
    login.classList.add("view-hidden");
    form.classList.remove("view-hidden");
    $("#leader-team-label").textContent = TEAM_BY_ID[teamId]?.name || teamId;
    fillMemberSelect();
  } else {
    login.classList.remove("view-hidden");
    form.classList.add("view-hidden");
  }
}

function onStoreUpdate() {
  syncWeekUI();
  if (store.getLeaderTeamId()) fillMemberSelect();
  if (activeTeamId) renderTeamDetail();
  else renderRanking();
}

async function boot() {
  $("#brand-class").textContent = CLASS_NAME;
  $("#brand-year").textContent = `Thi đua năm học ${SCHOOL_YEAR}`;

  fillRuleSelect();
  syncModePill();
  syncLeaderUI();
  syncWeekUI();

  $("#week-select").addEventListener("change", async (e) => {
    await goWeek(e.target.value);
  });

  $("#week-prev").addEventListener("click", async () => {
    const ids = competitionWeekIds();
    const idx = ids.indexOf(store.weekId);
    if (idx >= 0 && idx < ids.length - 1) await goWeek(ids[idx + 1]);
  });

  $("#week-next").addEventListener("click", async () => {
    const ids = competitionWeekIds();
    const idx = ids.indexOf(store.weekId);
    if (idx > 0) await goWeek(ids[idx - 1]);
  });

  $("#btn-this-week").addEventListener("click", async () => {
    await goWeek(weekIdFromDate());
  });

  $("#btn-back").addEventListener("click", showHome);

  $("#leader-fab").addEventListener("click", (e) => {
    e.stopPropagation();
    const panel = $("#leader-panel");
    setLeaderPanelOpen(panel.classList.contains("view-hidden"));
  });

  document.addEventListener("click", (e) => {
    const dock = e.target.closest(".leader-dock");
    if (!dock) setLeaderPanelOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setLeaderPanelOpen(false);
  });

  $("#btn-login").addEventListener("click", () => {
    const code = $("#leader-code").value;
    const teamId = resolveLeaderCode(code);
    if (!teamId) {
      toast("Mã không đúng.", true);
      return;
    }
    store.setLeaderTeamId(teamId);
    $("#leader-code").value = "";
    syncLeaderUI();
    toast(`Xin chào ${TEAM_BY_ID[teamId].name}!`);
  });

  $("#leader-code").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#btn-login").click();
  });

  $("#btn-logout").addEventListener("click", () => {
    store.setLeaderTeamId(null);
    syncLeaderUI();
    toast("Đã thoát chế độ tổ trưởng.");
  });

  document.querySelectorAll(".seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      ruleFilter = btn.dataset.filter;
      document.querySelectorAll(".seg-btn").forEach((b) => {
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

  store.subscribe(onStoreUpdate);

  try {
    await store.init();
    syncModePill();
    syncWeekUI();
    if (!SUPABASE_ENABLED) {
      toast("Chưa cấu hình Supabase — đang dùng offline trên máy này.");
    }
  } catch (err) {
    console.error(err);
    toast(
      "Không kết nối được Supabase. Kiểm tra URL/key và đã chạy supabase.sql chưa.",
      true
    );
    store.mode = "offline";
    await store.refresh();
    syncModePill();
  }

  showHome();
}

boot();
