import {
  SUPABASE_ENABLED,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  TEAMS,
} from "./config.js";
import { BASE_POINTS, RULE_BY_ID } from "./rules.js";

const SESSION_KEY = "a1-leader-team";
const LOCAL_KEY = "a1-events-v1";

/** Monday (local) YYYY-MM-DD for the week containing `date` */
export function weekIdFromDate(date = new Date()) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function weekLabel(weekId) {
  const start = new Date(weekId + "T12:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (x) =>
    `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

/** Recent week ids (newest first), including current */
export function recentWeekIds(count = 8) {
  const ids = [];
  const cur = weekIdFromDate();
  let d = new Date(cur + "T12:00:00");
  for (let i = 0; i < count; i++) {
    ids.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() - 7);
  }
  return ids;
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
    this.weekId = weekIdFromDate();
    this.mode = SUPABASE_ENABLED ? "live" : "offline";
    /** @type {null | (() => void)} */
    this._unsub = null;
    /** @type {Set<(events: ScoreEvent[]) => void>} */
    this._listeners = new Set();
    /** @type {import("@supabase/supabase-js").SupabaseClient | null} */
    this._client = null;
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
    if (this.mode === "live") {
      const { createClient } = await import(
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm"
      );
      this._client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    await this.refresh();
  }

  async _fetchWeek() {
    const { data, error } = await this._client
      .from("events")
      .select("*")
      .eq("week_id", this.weekId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    this.events = (data || []).map(rowToEvent);
    this._emit();
  }

  async refresh() {
    if (this._unsub) {
      this._unsub();
      this._unsub = null;
    }

    if (this.mode === "live" && this._client) {
      await this._fetchWeek();

      const channel = this._client
        .channel(`events-${this.weekId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "events",
            filter: `week_id=eq.${this.weekId}`,
          },
          () => {
            this._fetchWeek().catch(console.error);
          }
        )
        .subscribe();

      this._unsub = () => {
        this._client.removeChannel(channel);
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

    if (this.mode === "live" && this._client) {
      const { data, error } = await this._client
        .from("events")
        .insert({
          week_id: event.weekId,
          team_id: event.teamId,
          member_id: event.memberId,
          rule_id: event.ruleId,
          points: event.points,
          label: event.label,
          note: event.note,
          by_team_id: event.byTeamId,
          created_at: event.createdAt,
        })
        .select()
        .single();

      if (error) throw new Error(error.message || "Không ghi được điểm.");
      return rowToEvent(data);
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
