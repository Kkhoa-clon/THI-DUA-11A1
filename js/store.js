import {
  SUPABASE_ENABLED,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  TEAMS,
  COMPETITION_START,
  TOTAL_WEEKS,
  TEAM_BY_ID,
} from "./config.js";
import { BASE_POINTS, RULE_BY_ID } from "./rules.js";

const SESSION_ROLE = "a1-role"; // admin | leader
const SESSION_KEY = "a1-leader-team";
const LOCAL_KEY = "a1-events-v1";
const POLL_MS = 2500;

export function weekIdFromDate(date = new Date()) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function competitionStartWeekId() {
  return weekIdFromDate(new Date(COMPETITION_START + "T12:00:00"));
}

export function weekRangeLabel(weekId) {
  const start = new Date(weekId + "T12:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (x) =>
    `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

export function weekNumber(weekId) {
  const start = new Date(competitionStartWeekId() + "T12:00:00");
  const cur = new Date(weekId + "T12:00:00");
  const diffDays = Math.round((cur - start) / 86400000);
  return Math.floor(diffDays / 7) + 1;
}

export function weekIdForNumber(n) {
  const d = new Date(competitionStartWeekId() + "T12:00:00");
  d.setDate(d.getDate() + (n - 1) * 7);
  return d.toISOString().slice(0, 10);
}

/** Tuần đang học theo lịch thật (1…TOTAL_WEEKS), 0 nếu chưa tới Tuần 1 */
export function studiedThroughWeek() {
  const n = weekNumber(weekIdFromDate());
  if (n < 1) return 0;
  if (n > TOTAL_WEEKS) return TOTAL_WEEKS;
  return n;
}

export function isStudiedWeek(weekId) {
  const n = weekNumber(weekId);
  const through = studiedThroughWeek();
  return n >= 1 && n <= through;
}

export function weekLabel(weekId, { withRange = false } = {}) {
  const n = weekNumber(weekId);
  const through = studiedThroughWeek();
  let label = `Tuần ${n}`;
  if (n === through && n >= 1) label += " · hôm nay";
  else if (n > through && n <= TOTAL_WEEKS) label += " · chưa học";
  if (withRange) label += ` (${weekRangeLabel(weekId)})`;
  return label;
}

export function competitionWeekIds() {
  const ids = [];
  for (let n = 1; n <= TOTAL_WEEKS; n++) ids.push(weekIdForNumber(n));
  return ids;
}

export function studiedWeekIds() {
  const through = studiedThroughWeek();
  const ids = [];
  for (let n = 1; n <= through; n++) ids.push(weekIdForNumber(n));
  return ids;
}

export function defaultWeekId() {
  const through = studiedThroughWeek();
  if (through >= 1) return weekIdForNumber(through);
  return weekIdForNumber(1);
}

export function recentWeekIds() {
  return competitionWeekIds();
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocal(data) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function rowToEvent(row) {
  return {
    id: row.id,
    weekId: row.week_id,
    teamId: row.team_id,
    memberId: row.member_id,
    ruleId: row.rule_id,
    points: row.points,
    label: row.label,
    note: row.note || "",
    byTeamId: row.by_team_id,
    createdAt: Number(row.created_at),
  };
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}

async function fetchWithTimeout(url, options = {}, ms = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function allMembers() {
  return TEAMS.flatMap((t) => t.members.map((m) => ({ ...m, teamId: t.id })));
}

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

export class ScoreStore {
  constructor() {
    /** @type {ScoreEvent[]} mọi event đã tải */
    this.allEvents = [];
    /** @type {ScoreEvent[]} event tuần đang chọn (xem tổ) */
    this.events = [];
    this.weekId = defaultWeekId();
    this.mode = SUPABASE_ENABLED ? "live" : "offline";
    /** @type {null | (() => void)} */
    this._unsub = null;
    /** @type {Set<() => void>} */
    this._listeners = new Set();
  }

  /** @returns {"admin" | "leader" | null} */
  getRole() {
    const r = sessionStorage.getItem(SESSION_ROLE);
    return r === "admin" || r === "leader" ? r : null;
  }

  isAdmin() {
    return this.getRole() === "admin";
  }

  isLoggedIn() {
    return this.getRole() !== null;
  }

  getLeaderTeamId() {
    if (this.getRole() !== "leader") return null;
    return sessionStorage.getItem(SESSION_KEY);
  }

  /**
   * @param {"admin" | "leader" | null} role
   * @param {string | null} [teamId]
   */
  setAuth(role, teamId = null) {
    if (role === "admin") {
      sessionStorage.setItem(SESSION_ROLE, "admin");
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    if (role === "leader" && teamId) {
      sessionStorage.setItem(SESSION_ROLE, "leader");
      sessionStorage.setItem(SESSION_KEY, teamId);
      return;
    }
    sessionStorage.removeItem(SESSION_ROLE);
    sessionStorage.removeItem(SESSION_KEY);
  }

  /** @deprecated dùng setAuth */
  setLeaderTeamId(teamId) {
    if (teamId) this.setAuth("leader", teamId);
    else this.setAuth(null);
  }

  /**
   * Tổ trưởng chỉ được ghi/xoá tuần đang học (hôm nay).
   * Admin: mọi tuần.
   */
  canEditWeek(weekId = this.weekId) {
    if (this.isAdmin()) return true;
    if (this.getRole() !== "leader") return false;
    const n = weekNumber(weekId);
    const through = studiedThroughWeek();
    return through >= 1 && n === through;
  }

  canWriteScores() {
    return this.isAdmin() || (this.getRole() === "leader" && this.canEditWeek());
  }

  subscribe(fn) {
    this._listeners.add(fn);
    fn();
    return () => this._listeners.delete(fn);
  }

  _emit() {
    this._syncWeekSlice();
    for (const fn of this._listeners) fn();
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
    return Promise.resolve();
  }

  async init() {
    await this.refresh();
  }

  async _fetchAll() {
    // Lấy đủ event (limit cao) — lớp nhỏ
    const url =
      `${SUPABASE_URL}/rest/v1/events?select=*&order=created_at.desc&limit=5000`;

    const res = await fetchWithTimeout(url, {
      headers: supabaseHeaders({ Accept: "application/json" }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Supabase ${res.status}: ${text.slice(0, 120)}`);
    }

    const data = await res.json();
    this.allEvents = (data || []).map(rowToEvent);
    this._emit();
  }

  async refresh() {
    if (this._unsub) {
      this._unsub();
      this._unsub = null;
    }

    if (this.mode === "live") {
      await this._fetchAll();

      const tick = () => {
        this._fetchAll().catch((err) => console.warn("poll", err));
      };
      const id = setInterval(tick, POLL_MS);
      const onFocus = () => tick();
      window.addEventListener("focus", onFocus);
      this._unsub = () => {
        clearInterval(id);
        window.removeEventListener("focus", onFocus);
      };
      return;
    }

    const bag = loadLocal();
    /** @type {ScoreEvent[]} */
    const flat = [];
    for (const list of Object.values(bag)) {
      if (Array.isArray(list)) flat.push(...list);
    }
    this.allEvents = flat.sort((a, b) => b.createdAt - a.createdAt);
    this._emit();
  }

  /**
   * Event thuộc các tuần đã học (1 → tuần hiện tại). Tuần chưa học không tính.
   */
  studiedEvents() {
    return this.allEvents.filter((e) => isStudiedWeek(e.weekId));
  }

  eventsForMember(memberId, { weekOnly = false, studiedOnly = false } = {}) {
    let list = this.allEvents.filter((e) => e.memberId === memberId);
    if (weekOnly) list = list.filter((e) => e.weekId === this.weekId);
    if (studiedOnly) list = list.filter((e) => isStudiedWeek(e.weekId));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  /** Điểm tuần đang chọn */
  memberPoints(memberId) {
    const delta = this.eventsForMember(memberId, { weekOnly: true }).reduce(
      (s, e) => s + e.points,
      0
    );
    return BASE_POINTS + delta;
  }

  memberWeekPoints(memberId, weekId) {
    const delta = this.allEvents
      .filter((e) => e.memberId === memberId && e.weekId === weekId)
      .reduce((s, e) => s + e.points, 0);
    return BASE_POINTS + delta;
  }

  /**
   * Thống kê cá nhân trên các tuần đã học.
   */
  memberYearStats(memberId) {
    const through = studiedThroughWeek();
    const weeks = through;
    let plusPoints = 0;
    let minusPoints = 0;
    let plusCount = 0;
    let minusCount = 0;
    let noteCount = 0;
    let yearTotal = 0;

    for (let n = 1; n <= through; n++) {
      yearTotal += this.memberWeekPoints(memberId, weekIdForNumber(n));
    }

    for (const e of this.eventsForMember(memberId, { studiedOnly: true })) {
      if (e.points > 0) {
        plusPoints += e.points;
        plusCount += 1;
      } else if (e.points < 0) {
        minusPoints += e.points;
        minusCount += 1;
      } else {
        noteCount += 1;
      }
    }

    return {
      memberId,
      weeks,
      yearTotal,
      avg: weeks ? Math.round((yearTotal / weeks) * 10) / 10 : 0,
      plusPoints,
      minusPoints,
      plusCount,
      minusCount,
      noteCount,
      netDelta: plusPoints + minusPoints,
    };
  }

  /**
   * Chi tiết theo loại: all | plus | minus
   */
  memberDetail(memberId, kind = "all") {
    let events = this.eventsForMember(memberId, { studiedOnly: true });
    if (kind === "plus") events = events.filter((e) => e.points > 0);
    if (kind === "minus") events = events.filter((e) => e.points < 0 || e.points === 0);

    /** @type {Map<string, { ruleId: string, label: string, count: number, points: number, weeks: Set<number> }>} */
    const byRule = new Map();
    for (const e of events) {
      const key = e.ruleId || e.label;
      if (!byRule.has(key)) {
        byRule.set(key, {
          ruleId: e.ruleId,
          label: e.label,
          count: 0,
          points: 0,
          weeks: new Set(),
        });
      }
      const g = byRule.get(key);
      g.count += 1;
      g.points += e.points;
      g.weeks.add(weekNumber(e.weekId));
    }

    const groups = [...byRule.values()]
      .map((g) => ({
        ...g,
        weeks: [...g.weeks].sort((a, b) => a - b),
      }))
      .sort((a, b) => a.points - b.points || b.count - a.count);

    return { events, groups, stats: this.memberYearStats(memberId) };
  }

  teamPoints(teamId) {
    const team = TEAMS.find((t) => t.id === teamId);
    if (!team) return 0;
    return team.members.reduce((s, m) => s + this.memberPoints(m.id), 0);
  }

  /** BXH tổ theo tuần đang chọn */
  rankings() {
    return TEAMS.map((t) => ({
      team: t,
      points: this.teamPoints(t.id),
      avg: t.members.length
        ? Math.round((this.teamPoints(t.id) / t.members.length) * 10) / 10
        : 0,
    })).sort((a, b) => b.points - a.points || a.team.name.localeCompare(b.team.name, "vi"));
  }

  /** Thành viên tổ — điểm cao → thấp */
  teamMembersSorted(teamId) {
    const team = TEAMS.find((t) => t.id === teamId);
    if (!team) return [];
    return [...team.members]
      .map((m) => ({
        ...m,
        points: this.memberPoints(m.id),
        eventCount: this.eventsForMember(m.id, { weekOnly: true }).length,
      }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "vi"));
  }

  /** Tìm thành viên theo tên */
  searchMembers(query) {
    const q = String(query || "")
      .trim()
      .toLowerCase();
    if (!q) return [];
    return allMembers()
      .filter((m) => m.name.toLowerCase().includes(q))
      .map((m) => ({
        ...m,
        teamName: TEAM_BY_ID[m.teamId]?.name || m.teamId,
        ...this.memberYearStats(m.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }

  /** Tổng kết tổ trong tuần đang chọn */
  teamWeekSummary(teamId) {
    const team = TEAMS.find((t) => t.id === teamId);
    if (!team) {
      return {
        total: 0,
        base: 0,
        plusPoints: 0,
        minusPoints: 0,
        plusCount: 0,
        minusCount: 0,
        violators: [],
        bonusers: [],
      };
    }

    const weekEvents = this.allEvents.filter(
      (e) => e.teamId === teamId && e.weekId === this.weekId
    );

    let plusPoints = 0;
    let minusPoints = 0;
    let plusCount = 0;
    let minusCount = 0;
    /** @type {Map<string, { id: string, name: string, points: number, count: number }>} */
    const violMap = new Map();
    /** @type {Map<string, { id: string, name: string, points: number, count: number }>} */
    const bonusMap = new Map();

    for (const e of weekEvents) {
      const name =
        team.members.find((m) => m.id === e.memberId)?.name || e.memberId;
      if (e.points > 0) {
        plusPoints += e.points;
        plusCount += 1;
        if (!bonusMap.has(e.memberId)) {
          bonusMap.set(e.memberId, { id: e.memberId, name, points: 0, count: 0 });
        }
        const row = bonusMap.get(e.memberId);
        row.points += e.points;
        row.count += 1;
      } else if (e.points < 0) {
        minusPoints += e.points;
        minusCount += 1;
        if (!violMap.has(e.memberId)) {
          violMap.set(e.memberId, { id: e.memberId, name, points: 0, count: 0 });
        }
        const row = violMap.get(e.memberId);
        row.points += e.points;
        row.count += 1;
      }
    }

    return {
      total: this.teamPoints(teamId),
      base: BASE_POINTS * team.members.length,
      plusPoints,
      minusPoints,
      plusCount,
      minusCount,
      violators: [...violMap.values()].sort((a, b) => a.points - b.points),
      bonusers: [...bonusMap.values()].sort((a, b) => b.points - a.points),
    };
  }

  canDeleteEvent(event) {
    if (!event) return false;
    if (this.isAdmin()) return true;
    const leader = this.getLeaderTeamId();
    if (!leader || event.teamId !== leader) return false;
    return this.canEditWeek(event.weekId);
  }

  async deleteEvent(eventId) {
    if (!this.isLoggedIn()) throw new Error("Chưa đăng nhập.");

    const event = this.allEvents.find((e) => e.id === eventId);
    if (!event) throw new Error("Không tìm thấy ghi nhận.");

    if (this.isAdmin()) {
      // ok
    } else {
      const leader = this.getLeaderTeamId();
      if (!leader || event.teamId !== leader) {
        throw new Error("Chỉ xoá được điểm của tổ mình.");
      }
      if (!this.canEditWeek(event.weekId)) {
        throw new Error("Tuần đã qua — tổ trưởng không được xoá. Liên hệ admin.");
      }
    }

    if (this.mode === "live") {
      const res = await fetchWithTimeout(
        `${SUPABASE_URL}/rest/v1/events?id=eq.${encodeURIComponent(eventId)}`,
        {
          method: "DELETE",
          headers: supabaseHeaders({
            Accept: "application/json",
            Prefer: "return=representation",
          }),
        }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          text.slice(0, 160) ||
            "Không xoá được. Chạy supabase-enable-delete.sql trên Supabase."
        );
      }

      let rows = [];
      try {
        rows = await res.json();
      } catch {
        rows = [];
      }

      // RLS chặn xoá → HTTP 200 nhưng [] — bản ghi vẫn còn trên server
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error(
          "Chưa bật quyền xoá trên Supabase. Vào SQL Editor chạy file supabase-enable-delete.sql rồi thử lại."
        );
      }

      // Xoá hẳn local + đồng bộ lại mọi bảng tổng kết / BXH / tiểu sử
      this.allEvents = this.allEvents.filter((e) => String(e.id) !== String(eventId));
      this._emit();
      await this._fetchAll();
      return;
    }

    const bag = loadLocal();
    for (const key of Object.keys(bag)) {
      bag[key] = (bag[key] || []).filter((e) => String(e.id) !== String(eventId));
    }
    saveLocal(bag);
    this.allEvents = this.allEvents.filter((e) => String(e.id) !== String(eventId));
    this._emit();
  }

  /** BXH cá nhân cả năm (đã học) */
  yearRankings() {
    return allMembers()
      .map((m) => {
        const s = this.memberYearStats(m.id);
        return {
          ...m,
          teamName: TEAM_BY_ID[m.teamId]?.name || m.teamId,
          ...s,
        };
      })
      .sort((a, b) => b.yearTotal - a.yearTotal || a.name.localeCompare(b.name, "vi"));
  }

  /** BXH vi phạm — nhiều trừ nhất trước */
  violationRankings() {
    return allMembers()
      .map((m) => {
        const s = this.memberYearStats(m.id);
        return {
          ...m,
          teamName: TEAM_BY_ID[m.teamId]?.name || m.teamId,
          ...s,
        };
      })
      .filter((m) => m.minusCount > 0 || m.noteCount > 0)
      .sort(
        (a, b) =>
          a.minusPoints - b.minusPoints ||
          b.minusCount - a.minusCount ||
          a.name.localeCompare(b.name, "vi")
      );
  }

  /** BXH điểm cộng — nhiều cộng nhất trước */
  bonusRankings() {
    return allMembers()
      .map((m) => {
        const s = this.memberYearStats(m.id);
        return {
          ...m,
          teamName: TEAM_BY_ID[m.teamId]?.name || m.teamId,
          ...s,
        };
      })
      .filter((m) => m.plusCount > 0)
      .sort(
        (a, b) =>
          b.plusPoints - a.plusPoints ||
          b.plusCount - a.plusCount ||
          a.name.localeCompare(b.name, "vi")
      );
  }

  /**
   * @param {{ memberId: string, ruleId: string, note?: string }} payload
   */
  async addEvent(payload) {
    if (!this.isLoggedIn()) throw new Error("Chưa đăng nhập.");

    if (!this.canEditWeek(this.weekId)) {
      throw new Error(
        "Tuần đã qua / chưa tới — tổ trưởng chỉ ghi được tuần hiện tại. Admin không bị giới hạn."
      );
    }

    const member = allMembers().find((m) => m.id === payload.memberId);
    if (!member) throw new Error("Không tìm thấy thành viên.");

    if (!this.isAdmin()) {
      const leaderTeam = this.getLeaderTeamId();
      if (!leaderTeam || member.teamId !== leaderTeam) {
        throw new Error("Chỉ được ghi điểm cho tổ của bạn.");
      }
    }

    const rule = RULE_BY_ID[payload.ruleId];
    if (!rule) throw new Error("Loại điểm không hợp lệ.");

    const createdAt = Date.now();
    const note = String(payload.note || "").slice(0, 200);
    const byTeamId = this.isAdmin() ? member.teamId : this.getLeaderTeamId();

    /** @type {ScoreEvent} */
    const event = {
      id: uid(),
      weekId: this.weekId,
      teamId: member.teamId,
      memberId: member.id,
      ruleId: rule.id,
      points: rule.points,
      label: rule.label,
      note,
      byTeamId,
      createdAt,
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
          created_at: event.createdAt,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text.slice(0, 160) || "Không ghi được điểm.");
      }

      const rows = await res.json();
      const saved = Array.isArray(rows) ? rows[0] : rows;
      await this._fetchAll();
      return saved ? rowToEvent(saved) : event;
    }

    const bag = loadLocal();
    if (!bag[this.weekId]) bag[this.weekId] = [];
    bag[this.weekId].unshift(event);
    saveLocal(bag);
    this.allEvents = [
      event,
      ...this.allEvents.filter((e) => e.id !== event.id),
    ];
    this._emit();
    return event;
  }
}
