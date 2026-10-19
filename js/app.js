import {
  CLASS_NAME,
  SCHOOL_YEAR,
  TEAMS,
  TEAM_BY_ID,
  MEMBER_BY_ID,
  resolveLeaderCode,
  SUPABASE_ENABLED,
} from "./config.js";
import {
  gradeFor,
  formatPoints,
  rulesGrouped,
  RULE_BY_ID,
} from "./rules.js";
import {
  ScoreStore,
  weekIdFromDate,
  weekLabel,
  recentWeekIds,
} from "./store.js";

const store = new ScoreStore();
/** @type {string | null} */
let activeTeamId = null;
/** @type {string | null} */
let openMemberId = null;

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

function fillWeekSelect() {
  const sel = $("#week-select");
  const ids = recentWeekIds(8);
  sel.innerHTML = ids
    .map((id) => {
      const cur = id === weekIdFromDate() ? " (tuần này)" : "";
      return `<option value="${id}">${weekLabel(id)}${cur}</option>`;
    })
    .join("");
  sel.value = store.weekId;
}

function renderRanking() {
  const list = $("#rank-list");
  const ranks = store.rankings();
  list.innerHTML = ranks
    .map((r, i) => {
      const place = i + 1;
      return `
      <li>
        <button type="button" class="rank-item" data-place="${place}" data-team="${r.team.id}">
          <span class="rank-badge">${place}</span>
          <span>
            <div class="rank-name">${r.team.name}</div>
            <div class="rank-sub">${r.team.members.length} thành viên · TB ${r.avg} điểm</div>
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
    return `<p class="empty-hint">Chưa có ghi nhận nào tuần này.</p>`;
  }
  return `
    <h4>Lịch sử tuần này</h4>
    <ul class="event-list">
      ${events
        .map((e) => {
          const cls =
            e.points > 0 ? "plus" : e.points < 0 ? "minus" : "zero";
          const when = new Date(e.createdAt).toLocaleString("vi-VN", {
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
              <div class="event-meta">${when} · ghi bởi ${escapeHtml(by)}${note}</div>
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
  $("#team-meta").textContent = `${team.members.length} thành viên · Tuần ${weekLabel(store.weekId)}`;
  $("#team-total").textContent = String(store.teamPoints(team.id));

  const rows = team.members
    .map((m) => {
      const pts = store.memberPoints(m.id);
      const g = gradeFor(pts);
      const open = openMemberId === m.id;
      return `
      <tr class="${open ? "is-open" : ""}" data-member="${m.id}">
        <td>${escapeHtml(m.name)}</td>
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

function fillRuleSelect() {
  const sel = $("#rule-select");
  const groups = rulesGrouped();
  let html = `<option value="">— Chọn loại —</option>`;
  for (const [group, rules] of groups) {
    html += `<optgroup label="${escapeHtml(group)}">`;
    for (const r of rules) {
      const pts =
        r.points === 0 && r.noteOnly
          ? "ghi nhận"
          : formatPoints(r.points) + " điểm";
      html += `<option value="${r.id}">${escapeHtml(r.label)} (${pts})</option>`;
    }
    html += `</optgroup>`;
  }
  sel.innerHTML = html;
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
      .map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`)
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
    prev.textContent = "Chỉ ghi nhận (không trừ/cộng số điểm)";
    prev.className = "preview";
    return;
  }
  prev.textContent = `Hệ thống sẽ áp: ${formatPoints(rule.points)} điểm`;
  prev.className = `preview ${rule.points < 0 ? "minus" : ""}`;
}

function syncLeaderUI() {
  const teamId = store.getLeaderTeamId();
  const fab = $("#leader-fab");
  const login = $("#leader-login");
  const form = $("#leader-form");
  const panel = $("#leader-panel");

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

  // Keep panel closed by default on load; don't force open
  if (!panel.dataset.ready) {
    panel.classList.add("view-hidden");
    panel.dataset.ready = "1";
  }
}

function onStoreUpdate() {
  if (activeTeamId) renderTeamDetail();
  else renderRanking();
}

async function boot() {
  $("#brand-class").textContent = CLASS_NAME;
  $("#brand-year").textContent = `Thi đua năm học ${SCHOOL_YEAR}`;

  fillWeekSelect();
  fillRuleSelect();
  syncModePill();
  syncLeaderUI();

  $("#week-select").addEventListener("change", async (e) => {
    await store.setWeek(e.target.value);
  });

  $("#btn-back").addEventListener("click", showHome);

  $("#leader-fab").addEventListener("click", () => {
    $("#leader-panel").classList.toggle("view-hidden");
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
      // Stay on member for quick consecutive entries
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
    if (!SUPABASE_ENABLED) {
      toast("Chưa cấu hình Supabase — đang dùng offline trên máy này.");
    }
  } catch (err) {
    console.error(err);
    toast(
      "Không kết nối được Supabase. Kiểm tra URL/key và đã chạy supabase.sql chưa.",
      true
    );
    // Fallback offline so UI still works
    store.mode = "offline";
    await store.refresh();
    syncModePill();
  }

  showHome();
}

boot();
