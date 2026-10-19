import {
  SUPABASE_ENABLED,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  TEAMS,
  COMPETITION_START,
  TOTAL_WEEKS,
} from "./config.js";
import { BASE_POINTS, RULE_BY_ID } from "./rules.js";

const SESSION_KEY = "a1-leader-team";
const LOCAL_KEY = "a1-events-v1";
const POLL_MS = 2500;

/** Monday (local) YYYY-MM-DD for the week containing `date` */
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

export function weekLabel(weekId, { withRange = false } = {}) {
  const n = weekNumber(weekId);
  const isCurrent = weekId === weekIdFromDate();
  let label = `Tuần ${n}`;
  if (n >= 1 && n <= TOTAL_WEEKS && isCurrent) label += " · hôm nay";
  if (withRange) label += ` (${weekRangeLabel(weekId)})`;
  return label;
}

/** Tuần 1 → Tuần TOTAL_WEEKS (luôn đủ, để trống sẵn). */
export function competitionWeekIds() {
  const ids = [];
  for (let n = 1; n <= TOTAL_WEEKS; n++) {
    ids.push(weekIdForNumber(n));
  }
  return ids;
}

/** Tuần mặc định: hôm nay nếu trong 1–35, không thì Tuần 1 */
export function defaultWeekId() {
  const today = weekIdFromDate();
  const n = weekNumber(today);
  if (n >= 1 && n <= TOTAL_WEEKS) return today;
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
    /** @type {ScoreEvent[]} */
    this.events = [];
    this.weekId = defaultWeekId();
    this.mode = SUPABASE_ENABLED ? "live" : "offline";
    /** @type {null | (() => void)} */
    this._unsub = null;
    /** @type {Set<(events: ScoreEvent[]) => void>} */
    this._listeners = new Set();
  }

  getLeaderTeamId() {
    return sessionStorage.getItem(SESSION_KEY);
  }

  setLeaderTeamId(teamId) {
    if (teamId) sessionStorage.setItem(SESSION_KEY, teamId);
    else sessionStorage.removeItem(SESSION_KEY);
  }

  subscribe(fn) {
    this._listeners.add(fn);
    fn(this.events);
    return () => this._listeners.delete(fn);
  }

  _emit() {
    for (const fn of this._listeners) fn(this.events);
  }

  setWeek(weekId) {
    this.weekId = weekId;
    return this.refresh();
  }

  async init() {
    await this.refresh();
  }

  async _fetchWeek() {
    const url =
      `${SUPABASE_URL}/rest/v1/events` +
      `?week_id=eq.${encodeURIComponent(this.weekId)}` +
      `&select=*` +
      `&order=created_at.desc`;

    const res = await fetchWithTimeout(url, {
      headers: supabaseHeaders({ Accept: "application/json" }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Supabase ${res.status}: ${text.slice(0, 120)}`);
    }

    const data = await res.json();
    this.events = (data || []).map(rowToEvent);
    this._emit();
  }

  async refresh() {
    if (this._unsub) {
      this._unsub();
      this._unsub = null;
    }

    if (this.mode === "live") {
      await this._fetchWeek();

      const tick = () => {
        this._fetchWeek().catch((err) => console.warn("poll", err));
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
    const all = bag[this.weekId] || [];
    this.events = [...all].sort((a, b) => b.createdAt - a.createdAt);
    this._emit();
  }

  /**
   * @param {{ memberId: string, ruleId: string, note?: string }} payload
   */
  async addEvent(payload) {
    const leaderTeam = this.getLeaderTeamId();
    if (!leaderTeam) throw new Error("Chưa đăng nhập tổ trưởng.");

    const member = TEAMS.flatMap((t) =>
      t.members.map((m) => ({ ...m, teamId: t.id }))
    ).find((m) => m.id === payload.memberId);

    if (!member) throw new Error("Không tìm thấy thành viên.");
    if (member.teamId !== leaderTeam) {
      throw new Error("Chỉ được ghi điểm cho tổ của bạn.");
    }

    const rule = RULE_BY_ID[payload.ruleId];
    if (!rule) throw new Error("Loại điểm không hợp lệ.");

    const createdAt = Date.now();
    const note = String(payload.note || "").slice(0, 200);

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
      byTeamId: leaderTeam,
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
      await this._fetchWeek();
      return saved ? rowToEvent(saved) : event;
    }

    const bag = loadLocal();
    if (!bag[this.weekId]) bag[this.weekId] = [];
    bag[this.weekId].unshift(event);
    saveLocal(bag);
    this.events = bag[this.weekId];
    this._emit();
    return event;
  }

  eventsForMember(memberId) {
    return this.events.filter((e) => e.memberId === memberId);
  }

  memberPoints(memberId) {
    const delta = this.eventsForMember(memberId).reduce((s, e) => s + e.points, 0);
    return BASE_POINTS + delta;
  }

  teamPoints(teamId) {
    const team = TEAMS.find((t) => t.id === teamId);
    if (!team) return 0;
    return team.members.reduce((s, m) => s + this.memberPoints(m.id), 0);
  }

  rankings() {
    return TEAMS.map((t) => ({
      team: t,
      points: this.teamPoints(t.id),
      avg: t.members.length
        ? Math.round((this.teamPoints(t.id) / t.members.length) * 10) / 10
        : 0,
    })).sort((a, b) => b.points - a.points || a.team.name.localeCompare(b.team.name, "vi"));
  }
}
