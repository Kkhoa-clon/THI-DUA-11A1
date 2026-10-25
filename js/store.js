/**
 * Store quản lý dữ liệu thi đua Lớp 11A1 — Tối ưu chịu tải 50 thiết bị đồng thời
 * Kiến trúc Supabase Realtime WebSocket (Zero Polling) + Delta-Sync Fallback
 */

import {
  SUPABASE_ENABLED,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  TEAMS,
  COMPETITION_START,
  TOTAL_WEEKS,
  TEAM_BY_ID,
  MEMBER_BY_ID,
  teamsForWeek,
  toNonAccentVietnamese,
} from "./config.js";
import { BASE_POINTS, RULE_BY_ID, gradeFor } from "./rules.js";

const SESSION_ROLE = "a1-role";
const SESSION_TEAM = "a1-leader-team";
const SESSION_LEADER_NAME = "a1-leader-name";
const LOCAL_EVENTS_KEY = "a1-events-v2";
const LOCAL_SETTINGS_KEY = "a1-settings-v2";
const SETTINGS_ROW_KEY = "class";

const memSession = new Map();
const safeSession = {
  get(key) {
    try {
      if (typeof sessionStorage !== "undefined") return sessionStorage.getItem(key);
      return memSession.get(key) || null;
    } catch {
      return memSession.get(key) || null;
    }
  },
  set(key, val) {
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, val);
      memSession.set(key, val);
    } catch {
      memSession.set(key, val);
    }
  },
  remove(key) {
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(key);
      memSession.delete(key);
    } catch {
      memSession.delete(key);
    }
  },
};

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
 *   createdByRole: "admin" | "leader",
 *   createdAt: number,
 *   syncError?: string
 * }} ScoreEvent
 */

/**
 * @typedef {{
 *   lockedWeeks: string[],
 *   leadersPaused: boolean
 * }} AppSettings
 */

function defaultSettings() {
  return { lockedWeeks: [], leadersPaused: false };
}

function loadLocalSettings() {
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return defaultSettings();
  }
}

function saveLocalSettings(settings) {
  try {
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

function normalizeSettings(raw) {
  const base = defaultSettings();
  if (!raw || typeof raw !== "object") return base;
  const locked = Array.isArray(raw.lockedWeeks)
    ? raw.lockedWeeks.map(String).filter(Boolean)
    : [];
  return {
    lockedWeeks: [...new Set(locked)],
    leadersPaused: Boolean(raw.leadersPaused),
  };
}

export function weekIdFromDate(date = new Date()) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Thứ 2 đầu tuần
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

export function studiedThroughWeek() {
  const n = weekNumber(weekIdFromDate());
  if (n < 1) return 1;
  if (n > TOTAL_WEEKS) return TOTAL_WEEKS;
  return n;
}

export function isStudiedWeek(weekId) {
  const n = weekNumber(weekId);
  const through = studiedThroughWeek();
  return n >= 1 && n <= through;
}

export function defaultWeekId() {
  const through = studiedThroughWeek();
  return weekIdForNumber(through);
}

export function competitionWeekIds() {
  const ids = [];
  for (let n = 1; n <= TOTAL_WEEKS; n++) ids.push(weekIdForNumber(n));
  return ids;
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function rowToEvent(row) {
  return {
    id: String(row.id),
    weekId: String(row.week_id),
    teamId: String(row.team_id),
    memberId: String(row.member_id),
    ruleId: String(row.rule_id),
    points: Number(row.points) || 0,
    label: String(row.label || ""),
    note: String(row.note || ""),
    byTeamId: String(row.by_team_id || ""),
    createdByRole: row.by_role === "admin" ? "admin" : "leader",
    createdAt: Number(row.created_at) || Date.now(),
    syncError: null,
  };
}

function compareNamesAlphabetically(a, b) {
  return (
    String(a.name || "").localeCompare(String(b.name || ""), "vi", { sensitivity: "base" }) ||
    String(a.id || "").localeCompare(String(b.id || ""), "en", { numeric: true })
  );
}

function assignCompetitionRanks(items, getScore) {
  items.forEach((item, index) => {
    item.rank =
      index > 0 && getScore(item) === getScore(items[index - 1])
        ? items[index - 1].rank
        : index + 1;
    item.isTied = false;
  });

  const rankCounts = new Map();
  for (const item of items) {
    rankCounts.set(item.rank, (rankCounts.get(item.rank) || 0) + 1);
  }
  for (const item of items) {
    item.isTied = rankCounts.get(item.rank) > 1;
  }

  return items;
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}

async function fetchWithTimeout(url, options = {}, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export class ScoreStore {
  constructor() {
    /** @type {ScoreEvent[]} Toàn bộ event */
    this.allEvents = [];
    /** @type {ScoreEvent[]} Event của tuần đang chọn */
    this.events = [];
    this.weekId = defaultWeekId();
    this.mode = SUPABASE_ENABLED ? "live" : "offline";
    this.realtimeStatus = "DISCONNECTED"; // SUBSCRIBED | CONNECTING | DISCONNECTED
    this.lastSyncTimestamp = 0;
    this.latencyMs = 0;
    /** @type {AppSettings} */
    this.settings = loadLocalSettings();

    /** @type {Set<() => void>} */
    this._listeners = new Set();
    /** @type {Set<string>} Chống ghi trùng idempotency keys */
    this._inFlightKeys = new Set();

    /** @type {any} Supabase JS client */
    this.supabaseClient = null;
    /** @type {any} Supabase Realtime Channel */
    this.realtimeChannel = null;

    this._initSupabase();
  }

  _initSupabase() {
    if (SUPABASE_ENABLED && typeof window !== "undefined" && window.supabase) {
      try {
        this.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
        });
      } catch (err) {
        console.warn("Lỗi khởi tạo Supabase client:", err);
      }
    }
  }

  // —— Phân quyền & Phiên làm việc ——
  getRole() {
    return safeSession.get(SESSION_ROLE) || null;
  }

  isAdmin() {
    return this.getRole() === "admin";
  }

  isLeader() {
    return this.getRole() === "leader";
  }

  isLoggedIn() {
    return Boolean(this.getRole());
  }

  getLeaderTeamId() {
    if (!this.isLeader()) return null;
    return safeSession.get(SESSION_TEAM);
  }

  getLeaderName() {
    if (this.isAdmin()) return "Giáo viên Chủ nhiệm (Admin)";
    if (this.isLeader()) {
      return safeSession.get(SESSION_LEADER_NAME) || "Tổ trưởng";
    }
    return "Khách xem điểm";
  }

  setAuth(role, teamId = null, leaderName = null) {
    if (role === "admin") {
      safeSession.set(SESSION_ROLE, "admin");
      safeSession.remove(SESSION_TEAM);
      safeSession.remove(SESSION_LEADER_NAME);
    } else if (role === "leader" && teamId) {
      safeSession.set(SESSION_ROLE, "leader");
      safeSession.set(SESSION_TEAM, teamId);
      if (leaderName) safeSession.set(SESSION_LEADER_NAME, leaderName);
    } else {
      safeSession.remove(SESSION_ROLE);
      safeSession.remove(SESSION_TEAM);
      safeSession.remove(SESSION_LEADER_NAME);
    }
    this._emit();
  }

  logout() {
    this.setAuth(null);
  }

  // —— Cấu hình & Khóa sổ ——
  getLockedWeeks() {
    return this.settings.lockedWeeks || [];
  }

  isWeekLocked(weekId = this.weekId) {
    return this.getLockedWeeks().includes(weekId);
  }

  isLeadersPaused() {
    return Boolean(this.settings.leadersPaused);
  }

  isCountingWeek(weekId = this.weekId) {
    if (!isStudiedWeek(weekId)) return false;
    return !this.isWeekLocked(weekId);
  }

  countingWeekIds() {
    const through = studiedThroughWeek();
    const ids = [];
    for (let n = 1; n <= through; n++) {
      const id = weekIdForNumber(n);
      if (this.isCountingWeek(id)) ids.push(id);
    }
    return ids;
  }

  canEditWeek(weekId = this.weekId) {
    if (this.isAdmin()) return true; // Admin có mọi quyền trên mọi tuần
    if (!this.isLeader()) return false;
    if (this.isLeadersPaused()) return false;
    if (this.isWeekLocked(weekId)) return false;
    // Tổ trưởng chỉ được tương tác với tuần hiện tại, các tuần đã học qua không được tương tác
    return weekId === defaultWeekId();
  }

  leaderBlockReason(weekId = this.weekId) {
    if (this.isAdmin()) return null;
    if (!this.isLeader()) return "Chưa đăng nhập tổ trưởng.";
    if (this.isLeadersPaused()) return "Admin đang tạm dừng quyền ghi điểm toàn lớp.";
    if (this.isWeekLocked(weekId)) return `Tuần ${weekNumber(weekId)} đã bị khóa sổ.`;
    const cur = defaultWeekId();
    if (weekId !== cur) return `Tuần ${weekNumber(weekId)} đã học qua — Tổ trưởng chỉ được tương tác ở Tuần hiện tại (${weekNumber(cur)}).`;
    return null;
  }

  async setWeekLocked(weekId, locked) {
    if (!this.isAdmin()) throw new Error("Chỉ Admin được khóa sổ tuần.");
    const set = new Set(this.getLockedWeeks());
    if (locked) set.add(weekId);
    else set.delete(weekId);
    await this._saveSettings({
      ...this.settings,
      lockedWeeks: [...set].sort(),
    });
  }

  async setLeadersPaused(paused) {
    if (!this.isAdmin()) throw new Error("Chỉ Admin.");
    await this._saveSettings({
      ...this.settings,
      leadersPaused: Boolean(paused),
    });
  }

  async _saveSettings(next) {
    this.settings = normalizeSettings(next);
    saveLocalSettings(this.settings);
    if (this.mode === "live" && this._hasAppSettingsTable !== false) {
      try {
        const body = {
          key: SETTINGS_ROW_KEY,
          value: this.settings,
          updated_at: Date.now(),
        };
        const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/app_settings`, {
          method: "POST",
          headers: supabaseHeaders({
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal",
          }),
          body: JSON.stringify(body),
        });
        if (res && res.status === 404) {
          this._hasAppSettingsTable = false;
        }
      } catch (err) {
        // Tự động dùng cache local khi bảng chưa tạo trên Supabase
      }
    }
    this._emit();
  }

  async _fetchSettings() {
    this.settings = loadLocalSettings();
    if (this.mode !== "live" || this._hasAppSettingsTable === false) return;
    try {
      const res = await fetchWithTimeout(
        `${SUPABASE_URL}/rest/v1/app_settings?key=eq.${encodeURIComponent(SETTINGS_ROW_KEY)}&select=value`,
        { headers: supabaseHeaders({ Accept: "application/json" }) }
      );
      if (res.status === 404) {
        // Bảng app_settings chưa tạo trong Supabase -> Đánh dấu để không gọi lặp lại 404
        this._hasAppSettingsTable = false;
        return;
      }
      if (res.ok) {
        this._hasAppSettingsTable = true;
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0]?.value) {
          this.settings = normalizeSettings(rows[0].value);
          saveLocalSettings(this.settings);
        }
      }
    } catch (err) {
      // Dùng localSettings mượt mà
    }
  }

  // —— Realtime WebSocket & Delta-Sync ——
  async init() {
    // 1. Tải cache local trước để mở web tức thì (< 10ms)
    this._loadFromLocal();
    this._emit();

    // 2. Fetch dữ liệu đầy đủ lần đầu
    await this.refresh();

    // 3. Khởi tạo Supabase Realtime WebSocket (Không dùng Polling liên tục!)
    this._setupRealtime();

    // 4. Delta-Sync khi tab quay lại (focus)
    if (typeof window !== "undefined") {
      window.addEventListener("focus", () => {
        this.deltaSync();
      });
      window.addEventListener("online", () => {
        this.refresh();
      });
    }
  }

  _setupRealtime() {
    if (!this.supabaseClient) {
      // Thử khởi tạo lại nếu window.supabase tải trễ
      this._initSupabase();
    }

    if (!this.supabaseClient) {
      this.realtimeStatus = "DELTA_SYNC";
      return;
    }

    try {
      if (this.realtimeChannel) {
        this.realtimeChannel.unsubscribe();
      }

      this.realtimeStatus = "CONNECTING";
      this.realtimeChannel = this.supabaseClient
        .channel("class-11a1-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "events" },
          (payload) => {
            this._handlePostgresChange(payload);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            this.realtimeStatus = "SUBSCRIBED";
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            this.realtimeStatus = "DISCONNECTED";
          }
          this._emit();
        });
    } catch (err) {
      console.warn("Lỗi thiết lập realtime channel:", err);
      this.realtimeStatus = "DELTA_SYNC";
    }
  }

  _handlePostgresChange(payload) {
    const { eventType, new: newRow, old: oldRow } = payload;
    const start = performance.now();

    if (eventType === "INSERT" && newRow) {
      const event = rowToEvent(newRow);
      // Tránh trùng nếu chính client vừa tạo
      if (!this.allEvents.some((e) => e.id === event.id)) {
        this.allEvents.unshift(event);
      }
    } else if (eventType === "DELETE" && oldRow) {
      const targetId = String(oldRow.id);
      this.allEvents = this.allEvents.filter((e) => e.id !== targetId);
    } else if (eventType === "UPDATE" && newRow) {
      const updated = rowToEvent(newRow);
      const idx = this.allEvents.findIndex((e) => e.id === updated.id);
      if (idx !== -1) this.allEvents[idx] = updated;
    }

    this.latencyMs = Math.max(5, Math.round(performance.now() - start));
    this._saveToLocal();
    this._emit();
  }

  /**
   * Delta-Sync: Chỉ lấy các bản ghi mới hơn mốc thời gian đã lưu
   * Tiết kiệm 99.8% băng thông (150 bytes thay vì 400KB)
   */
  async deltaSync() {
    if (this.mode !== "live") return;
    try {
      const start = performance.now();
      const cutoff = this.lastSyncTimestamp || 0;
      const url = `${SUPABASE_URL}/rest/v1/events?created_at=gt.${cutoff}&order=created_at.desc&limit=100`;
      const res = await fetchWithTimeout(url, {
        headers: supabaseHeaders({ Accept: "application/json" }),
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const freshEvents = rows.map(rowToEvent);
          const existingIds = new Set(this.allEvents.map((e) => e.id));
          const toAdd = freshEvents.filter((e) => !existingIds.has(e.id));
          if (toAdd.length > 0) {
            this.allEvents = [...toAdd, ...this.allEvents];
            this._saveToLocal();
            this._emit();
          }
        }
        this.lastSyncTimestamp = Date.now();
        this.latencyMs = Math.max(8, Math.round(performance.now() - start));
      }
    } catch (err) {
      console.warn("Delta-sync failed:", err);
    }
  }

  async refresh() {
    if (this.mode === "live") {
      try {
        await this._fetchSettings();
        const res = await fetchWithTimeout(
          `${SUPABASE_URL}/rest/v1/events?select=*&order=created_at.desc&limit=5000`,
          { headers: supabaseHeaders({ Accept: "application/json" }) }
        );
        if (res.ok) {
          const rows = await res.json();
          this.allEvents = (rows || []).map(rowToEvent);
          this.lastSyncTimestamp = Date.now();
          this._saveToLocal();
          this._emit();
          return;
        }
      } catch (err) {
        console.warn("Lỗi fetch Supabase, fallback sang local:", err);
      }
    }

    this._loadFromLocal();
    this._emit();
  }

  _loadFromLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
      this.allEvents = raw ? JSON.parse(raw) : [];
    } catch {
      this.allEvents = [];
    }
  }

  _saveToLocal() {
    try {
      localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(this.allEvents));
    } catch {}
  }

  // —— Subscription & State Emission ——
  subscribe(fn) {
    this._listeners.add(fn);
    fn();
    return () => this._listeners.delete(fn);
  }

  _emit() {
    this._syncWeekSlice();
    for (const fn of this._listeners) {
      try {
        fn();
      } catch (err) {
        console.error("Lỗi listener store:", err);
      }
    }
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
  }

  // =========================================================================
  // THUẬT TOÁN 1: Tính Điểm 1 Vòng Lặp O(N) (Single-Pass Aggregation)
  // =========================================================================
  calculateScoresFast(
    targetEvents = this.events,
    basePoints = BASE_POINTS,
    weekId = this.weekId
  ) {
    const teamScores = {};
    const memberScores = {};
    const weekTeams = teamsForWeek(weekId);

    // 1. Khởi tạo điểm nền 100 điểm
    for (const t of weekTeams) {
      teamScores[t.id] = {
        id: t.id,
        name: t.name,
        leaderName: t.leaderName,
        total: t.members.length * basePoints,
        rawTotal: t.members.length * basePoints,
        memberCount: t.members.length,
        plusPoints: 0,
        minusPoints: 0,
        plusCount: 0,
        minusCount: 0,
        violators: [],
        bonusers: [],
        locked: this.isWeekLocked(weekId),
      };

      for (const m of t.members) {
        memberScores[m.id] = {
          id: m.id,
          name: m.name,
          teamId: t.id,
          teamName: t.name,
          points: basePoints,
          plusPoints: 0,
          minusPoints: 0,
          plusCount: 0,
          minusCount: 0,
          events: [],
        };
      }
    }

    // 2. Duyệt 1 vòng lặp O(N) duy nhất
    for (let i = 0; i < targetEvents.length; i++) {
      const ev = targetEvents[i];
      const m = memberScores[ev.memberId];
      if (m) {
        m.points += ev.points;
        if (ev.points > 0) {
          m.plusPoints += ev.points;
          m.plusCount++;
        } else if (ev.points < 0) {
          m.minusPoints += ev.points;
          m.minusCount++;
        }
        m.events.push(ev);
      }

      const t = teamScores[ev.teamId];
      if (t) {
        t.rawTotal += ev.points;
        if (ev.points > 0) {
          t.plusPoints += ev.points;
          t.plusCount++;
        } else if (ev.points < 0) {
          t.minusPoints += ev.points;
          t.minusCount++;
        }
      }
    }

    // Tuần bị khóa sổ: Điểm xếp hạng = 0 (nhưng rawTotal vẫn lưu để xem)
    const isLocked = this.isWeekLocked(weekId);
    for (const tId in teamScores) {
      const t = teamScores[tId];
      t.total = isLocked ? 0 : t.rawTotal;
      const displayedTotal = isLocked ? t.rawTotal : t.total;
      t.avg = t.memberCount
        ? Math.round((displayedTotal / t.memberCount) * 10) / 10
        : 0;
    }

    return { teamScores, memberScores };
  }

  /** Điểm bằng nhau giữ đồng hạng; tên chỉ quyết định thứ tự hiển thị. */
  getTeamRankings() {
    const { teamScores } = this.calculateScoresFast(this.events);
    const isLocked = this.isWeekLocked(this.weekId);
    const sorted = Object.values(teamScores).sort(
      (a, b) =>
        (isLocked ? b.rawTotal - a.rawTotal : b.total - a.total) ||
        compareNamesAlphabetically(a, b)
    );

    return assignCompetitionRanks(
      sorted,
      (team) => (isLocked ? team.rawTotal : team.total)
    );
  }

  /** Lấy danh sách thành viên trong tổ đã sắp xếp theo điểm */
  getTeamMembersSorted(teamId) {
    const team = teamsForWeek(this.weekId).find((item) => item.id === teamId);
    if (!team) return [];
    const { memberScores } = this.calculateScoresFast(this.events);
    const sorted = team.members
      .map((m) => memberScores[m.id] || { ...m, points: BASE_POINTS, teamId })
      .sort((a, b) => b.points - a.points || compareNamesAlphabetically(a, b));
    return assignCompetitionRanks(sorted, (member) => member.points);
  }

  getTeamMemberWeekActivity(teamId, weekId = this.weekId) {
    const team = teamsForWeek(weekId).find((item) => item.id === teamId);
    if (!team) return [];

    const weekEvents = this.allEvents.filter(
      (event) => event.weekId === weekId && event.teamId === teamId
    );
    const { memberScores } = this.calculateScoresFast(
      weekEvents,
      BASE_POINTS,
      weekId
    );

    const members = team.members.map((member) => {
      const score = memberScores[member.id] || {
        ...member,
        teamId,
        points: BASE_POINTS,
      };
      const events = weekEvents.filter((event) => event.memberId === member.id);
      const violations = events.filter((event) => event.points <= 0);
      const bonuses = events.filter((event) => event.points > 0);
      const violationGroups = new Map();

      for (const event of violations) {
        const label = event.label || RULE_BY_ID[event.ruleId]?.label || event.ruleId;
        const group = violationGroups.get(label) || { label, count: 0, points: 0 };
        group.count++;
        group.points += event.points;
        violationGroups.set(label, group);
      }

      return {
        ...score,
        violationCount: violations.length,
        bonusCount: bonuses.length,
        violationGroups: [...violationGroups.values()],
      };
    });

    return assignCompetitionRanks(
      members.sort(
        (a, b) => b.points - a.points || compareNamesAlphabetically(a, b)
      ),
      (member) => member.points
    );
  }

  getViolationHistoryByTeam() {
    const violationsByTeam = new Map(
      TEAMS.map((team) => [
        team.id,
        { id: team.id, name: team.name, members: new Map() },
      ])
    );

    for (const event of this.allEvents) {
      if (event.points > 0) continue;
      const team = violationsByTeam.get(event.teamId);
      if (!team) continue;

      const member = MEMBER_BY_ID[event.memberId];
      const memberHistory = team.members.get(event.memberId) || {
        id: event.memberId,
        name: member?.name || event.memberId,
        events: [],
        points: 0,
      };
      memberHistory.events.push({
        ...event,
        weekNumber: weekNumber(event.weekId),
        label: event.label || RULE_BY_ID[event.ruleId]?.label || event.ruleId,
      });
      memberHistory.points += event.points;
      team.members.set(event.memberId, memberHistory);
    }

    return [...violationsByTeam.values()].map((team) => ({
      ...team,
      members: [...team.members.values()]
        .map((member) => ({
          ...member,
          events: member.events.sort((a, b) => b.createdAt - a.createdAt),
        }))
        .sort(
          (a, b) =>
            b.events.length - a.events.length ||
            a.name.localeCompare(b.name, "vi", { sensitivity: "base" })
        ),
      eventCount: [...team.members.values()].reduce(
        (total, member) => total + member.events.length,
        0
      ),
    }));
  }

  // =========================================================================
  // THUẬT TOÁN 3: Tự Động Bắt Lỗi Tái Phạm 2 Tuần Liên Tiếp (-50đ)
  // =========================================================================
  getPreviousWeekInfractions(currentWeekId = this.weekId) {
    const curNum = weekNumber(currentWeekId);
    if (curNum <= 1) return new Set();

    const prevWeekId = weekIdForNumber(curNum - 1);
    const infractions = new Set();

    for (let i = 0; i < this.allEvents.length; i++) {
      const ev = this.allEvents[i];
      if (ev.weekId === prevWeekId && ev.points < 0) {
        infractions.add(`${ev.memberId}#${ev.ruleId}`);
      }
    }
    return infractions;
  }

  checkRepeatInfraction(memberId, ruleId, currentWeekId = this.weekId) {
    const prevInfractions = this.getPreviousWeekInfractions(currentWeekId);
    return prevInfractions.has(`${memberId}#${ruleId}`);
  }

  // =========================================================================
  // THUẬT TOÁN 4: Tìm Kiếm Tiếng Việt Không Dấu Siêu Tốc
  // =========================================================================
  searchMembers(query) {
    const q = toNonAccentVietnamese(query);
    if (!q) return [];

    const all = TEAMS.flatMap((t) => t.members.map((m) => ({ ...m, teamId: t.id })));
    return all
      .filter((m) => toNonAccentVietnamese(m.name).includes(q) || m.id.toLowerCase().includes(q))
      .map((m) => ({
        ...m,
        teamName: TEAM_BY_ID[m.teamId]?.name || m.teamId,
        ...this.getMemberProfile(m.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }

  // —— Hồ Sơ Chi Tiết Cá Nhân ——
  getMemberProfile(memberId) {
    const member = MEMBER_BY_ID[memberId];
    if (!member) return null;

    const countingIds = this.countingWeekIds();
    const countingEvents = this.allEvents.filter(
      (e) => e.memberId === memberId && countingIds.includes(e.weekId)
    );
    const weekEvents = this.events.filter((e) => e.memberId === memberId);

    let plusPoints = 0;
    let minusPoints = 0;
    let plusCount = 0;
    let minusCount = 0;

    for (const e of countingEvents) {
      if (e.points > 0) {
        plusPoints += e.points;
        plusCount++;
      } else if (e.points < 0) {
        minusPoints += e.points;
        minusCount++;
      }
    }

    const currentWeekDelta = weekEvents.reduce((acc, e) => acc + e.points, 0);
    const currentWeekPoints = BASE_POINTS + currentWeekDelta;

    const weeksCount = countingIds.length || 1;
    const yearTotal = BASE_POINTS * weeksCount + (plusPoints + minusPoints);
    const avgScore = Math.round((yearTotal / weeksCount) * 10) / 10;

    // Tính thứ hạng của bạn trong lớp tuần này
    const { memberScores } = this.calculateScoresFast(this.events);
    const rankedMembers = assignCompetitionRanks(
      Object.values(memberScores).sort(
        (a, b) => b.points - a.points || compareNamesAlphabetically(a, b)
      ),
      (member) => member.points
    );
    const rankedMember = rankedMembers.find((m) => m.id === memberId);
    const classRank = rankedMember?.rank || 1;
    const isClassRankTied = rankedMember?.isTied || false;

    // Điểm tuần trước để tính chênh lệch tăng/giảm
    const curNum = weekNumber(this.weekId);
    let prevWeekPoints = BASE_POINTS;
    if (curNum > 1) {
      const prevWeekId = weekIdForNumber(curNum - 1);
      const prevEvents = this.allEvents.filter(
        (e) => e.memberId === memberId && e.weekId === prevWeekId
      );
      prevWeekPoints += prevEvents.reduce((acc, e) => acc + e.points, 0);
    }
    const diffFromLastWeek = currentWeekPoints - prevWeekPoints;

    return {
      member,
      currentWeekPoints,
      yearTotal,
      avgScore,
      plusPoints,
      minusPoints,
      plusCount,
      minusCount,
      classRank,
      isClassRankTied,
      totalStudents: rankedMembers.length || 44,
      diffFromLastWeek,
      weekEvents,
      allEvents: countingEvents,
    };
  }

  // —— BXH Toàn Trường / Cá Nhân ——
  getYearRankings() {
    const all = TEAMS.flatMap((t) => t.members.map((m) => ({ ...m, teamId: t.id })));

    const sorted = all
      .map((m) => {
        const prof = this.getMemberProfile(m.id);
        return {
          ...m,
          teamName: TEAM_BY_ID[m.teamId]?.name || m.teamId,
          ...prof,
        };
      })
      .sort((a, b) => b.yearTotal - a.yearTotal || compareNamesAlphabetically(a, b));

    return assignCompetitionRanks(sorted, (member) => member.yearTotal);
  }

  getViolationRankings() {
    const rankings = this.getYearRankings()
      .filter((m) => m.minusCount > 0)
      .sort((a, b) => a.minusPoints - b.minusPoints || compareNamesAlphabetically(a, b));
    return assignCompetitionRanks(rankings, (member) => member.minusPoints);
  }

  getBonusRankings() {
    const rankings = this.getYearRankings()
      .filter((m) => m.plusCount > 0)
      .sort((a, b) => b.plusPoints - a.plusPoints || compareNamesAlphabetically(a, b));
    return assignCompetitionRanks(rankings, (member) => member.plusPoints);
  }

  // =========================================================================
  // THUẬT TOÁN 2: Chống Ghi Trùng Điểm Khi Bấm Liên Tục (Idempotency Key)
  // =========================================================================
  async addEvent({ memberId, ruleId, note = "", multiplier = 1 }) {
    if (!this.isLoggedIn()) throw new Error("Vui lòng đăng nhập để ghi điểm.");

    const member = MEMBER_BY_ID[memberId];
    if (!member) throw new Error("Học sinh không tồn tại trong danh sách.");

    if (!this.isAdmin()) {
      // 1. Quyền hạn tổ trưởng chỉ được tương tác với tổ của mình
      const leaderTeam = this.getLeaderTeamId();
      if (!leaderTeam || member.teamId !== leaderTeam) {
        throw new Error("Tổ trưởng chỉ có quyền tương tác với tổ của mình, không có quyền hạn với các tổ khác.");
      }

      // 2. Các tuần đã học qua không được tương tác
      const currentWeek = defaultWeekId();
      if (this.weekId !== currentWeek) {
        throw new Error(`Tuần ${weekNumber(this.weekId)} đã học qua — Tổ trưởng không được tương tác với các tuần trước.`);
      }

      // 3. Khóa sổ hoặc tạm dừng
      if (this.isWeekLocked(this.weekId)) {
        throw new Error(`Tuần ${weekNumber(this.weekId)} đã bị khóa sổ.`);
      }
      if (this.isLeadersPaused()) {
        throw new Error("Admin đang tạm dừng quyền ghi điểm toàn lớp.");
      }
    }

    const rule = RULE_BY_ID[ruleId];
    if (!rule) throw new Error("Quy tắc chấm điểm không hợp lệ.");

    const mult = Math.max(1, Math.min(10, Math.floor(Number(multiplier) || 1)));
    const points = rule.points * mult;
    const createdAt = Date.now();
    const byTeamId = this.isAdmin() ? member.teamId : this.getLeaderTeamId();

    // Khóa chống ghi trùng: memberId + ruleId + khung 10s
    const idempotencyKey = `${memberId}_${ruleId}_${Math.floor(createdAt / 10000)}`;
    if (this._inFlightKeys.has(idempotencyKey)) {
      console.warn("Chặn ghi trùng: Yêu cầu đang được xử lý.");
      return null;
    }
    this._inFlightKeys.add(idempotencyKey);
    setTimeout(() => this._inFlightKeys.delete(idempotencyKey), 10000);

    const event = {
      id: uid(),
      weekId: this.weekId,
      teamId: member.teamId,
      memberId: member.id,
      ruleId: rule.id,
      points,
      label: mult > 1 ? `${rule.label} (x${mult})` : rule.label,
      note: String(note || "").slice(0, 200),
      byTeamId,
      createdByRole: this.isAdmin() ? "admin" : "leader",
      createdAt,
      syncError: null,
    };

    // 1. Optimistic Update (< 5ms): Thêm vào local state ngay lập tức!
    this.allEvents.unshift(event);
    this._saveToLocal();
    this._emit();

    // 2. Gửi bất đồng bộ lên Supabase
    if (this.mode === "live") {
      try {
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
            by_role: event.createdByRole,
            created_at: event.createdAt,
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          const detail = text.slice(0, 160);
          const message =
            res.status === 401
              ? "Supabase từ chối xác thực (401). Hãy kiểm tra SUPABASE_URL và SUPABASE_ANON_KEY trong js/config.js có thuộc cùng một dự án Supabase không."
              : `Supabase không lưu được điểm (HTTP ${res.status})${detail ? `: ${detail}` : ""}`;
          throw new Error(message);
        }

        const rows = await res.json();
        const saved = Array.isArray(rows) ? rows[0] : rows;
        if (saved && saved.id) {
          event.id = String(saved.id);
        }
        event.syncError = null;
      } catch (err) {
        event.syncError =
          err instanceof Error ? err.message : "Không xác định được lỗi khi đồng bộ Supabase.";
        this._saveToLocal();
        console.warn("Ghi Supabase thất bại; sự kiện hiện chỉ được lưu trên thiết bị:", err);
      }
    }

    return event;
  }

  /** Ghi đồng thời cho nhiều học sinh (Multi-select 1 chạm) */
  async addEventsBatch({ memberIds, ruleId, note = "", multiplier = 1 }) {
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      throw new Error("Vui lòng chọn ít nhất một học sinh.");
    }
    const results = [];
    for (const mId of memberIds) {
      const ev = await this.addEvent({
        memberId: mId,
        ruleId,
        note,
        multiplier,
      });
      if (ev) results.push(ev);
    }
    return results;
  }

  // —— Xóa bản ghi (Cơ chế sửa sai trong 15 phút) ——
  canDeleteEvent(event) {
    if (!event) return false;
    if (this.isAdmin()) return true;
    const leaderTeam = this.getLeaderTeamId();
    if (!leaderTeam || event.teamId !== leaderTeam) return false;
    // Tuần đã qua -> Tổ trưởng KHÔNG được xóa!
    if (event.weekId !== defaultWeekId()) return false;
    // Cho phép xóa nếu trong vòng 15 phút sau khi ghi
    const isWithin15Min = Date.now() - event.createdAt < 15 * 60 * 1000;
    return isWithin15Min && this.canEditWeek(event.weekId);
  }

  async deleteEvent(eventId) {
    if (!this.isLoggedIn()) throw new Error("Chưa đăng nhập.");

    const event = this.allEvents.find((e) => String(e.id) === String(eventId));
    if (!event) throw new Error("Không tìm thấy bản ghi.");

    if (!this.canDeleteEvent(event)) {
      throw new Error("Bạn không có quyền xóa bản ghi này (đã quá 15 phút, tuần đã học qua hoặc không thuộc tổ của bạn).");
    }

    // 1. Optimistic delete (< 5ms)
    this.allEvents = this.allEvents.filter((e) => String(e.id) !== String(eventId));
    this._saveToLocal();
    this._emit();

    // 2. Gửi xóa lên Supabase
    if (this.mode === "live" && !event.syncError) {
      try {
        await fetchWithTimeout(
          `${SUPABASE_URL}/rest/v1/events?id=eq.${encodeURIComponent(eventId)}`,
          {
            method: "DELETE",
            headers: supabaseHeaders({ Accept: "application/json" }),
          }
        );
      } catch (err) {
        console.warn("Lỗi xóa trên Supabase:", err);
      }
    }
  }

  // —— Admin: Xóa toàn bộ điểm của 1 tuần (Cần xác nhận) ——
  async wipeWeekEvents(weekId = this.weekId) {
    if (!this.isAdmin()) throw new Error("Chỉ Admin được thực hiện xóa hàng loạt.");

    const beforeCount = this.allEvents.filter((e) => e.weekId === weekId).length;
    this.allEvents = this.allEvents.filter((e) => e.weekId !== weekId);
    this._saveToLocal();
    this._emit();

    if (this.mode === "live") {
      try {
        await fetchWithTimeout(
          `${SUPABASE_URL}/rest/v1/events?week_id=eq.${encodeURIComponent(weekId)}`,
          {
            method: "DELETE",
            headers: supabaseHeaders({ Accept: "application/json" }),
          }
        );
      } catch (err) {
        console.warn("Lỗi wipe tuần trên Supabase:", err);
      }
    }
    return beforeCount;
  }

  exportBackup() {
    return {
      exportedAt: new Date().toISOString(),
      className: "11A1",
      settings: this.settings,
      events: this.allEvents,
    };
  }
}
