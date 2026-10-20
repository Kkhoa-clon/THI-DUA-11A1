import {
  SUPABASE_ENABLED,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  ADMIN_CODE,
  FLAG_TYPES,
  FLAG_TYPE_BY_ID,
} from "./config.js";

/**
 * js/flags.js — lớp dữ liệu cho "Bảng cờ luân lưu" của cả lớp.
 * - Mô hình GIỐNG app: KHÔNG có Supabase Auth. Ghi bằng anon key (RLS cho anon, như bảng events).
 *   "Khóa" chỉ là chốt giao diện kiểm tra ADMIN_CODE (mã trong config.js) — cùng kiểu mã tổ trưởng.
 * - Offline (chưa cấu hình Supabase) → bảng vẫn hiện, lưu localStorage máy này.
 */

const UNLOCK_KEY = "a1-flag-unlock-v1"; // "1" = đã mở bằng ADMIN_CODE
const LOCAL_FLAGS_KEY = "a1-class-flags-v1";
const POLL_MS = 2500; // đồng bộ theo nhịp store.js

function todayISO() {
  // YYYY-MM-DD theo giờ địa phương (để mặc định "hôm nay" đúng cho input date)
  const d = new Date();
  const tzMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzMs).toISOString().slice(0, 10);
}

export { FLAG_TYPES, FLAG_TYPE_BY_ID, todayISO };

/** Header anon (apikey + Bearer anon) — đọc và ghi như bảng events (RLS cho phép anon). */
function anonHeaders(extra = {}) {
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

function loadUnlock() {
  try {
    return localStorage.getItem(UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

function saveUnlock(unlocked) {
  if (unlocked) localStorage.setItem(UNLOCK_KEY, "1");
  else localStorage.removeItem(UNLOCK_KEY);
}

function loadLocalFlags() {
  try {
    const raw = localStorage.getItem(LOCAL_FLAGS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveLocalFlags(list) {
  localStorage.setItem(LOCAL_FLAGS_KEY, JSON.stringify(list));
}

function localUid() {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** @typedef {{ id:string, flag_type:string, placed_date:string, note?:string, created_at?:string }} ClassFlag */

export class FlagStore {
  constructor() {
    /** @type {ClassFlag[]} */
    this.flags = [];
    this.mode = SUPABASE_ENABLED ? "live" : "offline";
    /** đã mở khóa bằng ADMIN_CODE? (khóa mềm, giống mã tổ trưởng) */
    this.unlocked = loadUnlock();
    this.loading = false;
    this._unsub = null;
    /** @type {Set<() => void>} */
    this._listeners = new Set();
  }

  // ————————————————————————————— Khóa mềm (ADMIN_CODE) —————————————————————————————

  /** Offline luôn mở để dùng trên 1 máy; live cần nhập đúng ADMIN_CODE. */
  isAuthenticated() {
    if (this.mode === "offline") return true;
    return this.unlocked;
  }

  /**
   * Mở khóa bằng ADMIN_CODE (mã trong config.js). KHÔNG gọi Supabase Auth.
   * Sai mã → ném lỗi "Mật khẩu không đúng."
   */
  signIn(code) {
    const ok =
      String(code).trim().toLowerCase() === String(ADMIN_CODE).trim().toLowerCase();
    if (!ok) throw new Error("Mật khẩu không đúng.");
    this.unlocked = true;
    saveUnlock(true);
    this._emit();
    return true;
  }

  /** Khóa lại / xóa trạng thái mở. */
  signOut() {
    this.unlocked = false;
    saveUnlock(false);
    this._emit();
  }

  // ————————————————————————————— Data —————————————————————————————

  subscribe(fn) {
    this._listeners.add(fn);
    fn();
    return () => this._listeners.delete(fn);
  }

  _emit() {
    for (const fn of this._listeners) fn();
  }

  _sortFlags() {
    // mới nhất (placed_date) trước; hòa ngày → created_at desc
    this.flags.sort((a, b) => {
      const d = String(b.placed_date).localeCompare(String(a.placed_date));
      if (d !== 0) return d;
      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    });
  }

  async init() {
    await this.refresh();
  }

  async _fetchAll() {
    // Đọc công khai bằng anon key
    const url = `${SUPABASE_URL}/rest/v1/class_flags?select=*&order=placed_date.desc&limit=2000`;
    const res = await fetchWithTimeout(url, { headers: anonHeaders({ Accept: "application/json" }) });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      // 404/401 thường là chưa chạy SQL tạo bảng/policy
      throw new Error(`Supabase ${res.status}: ${txt.slice(0, 120)}`);
    }
    const data = await res.json();
    this.flags = (data || []).map((r) => ({
      id: r.id,
      flag_type: r.flag_type,
      placed_date: r.placed_date,
      note: r.note || "",
      created_at: r.created_at,
    }));
    this._sortFlags();
  }

  async refresh() {
    if (this._unsub) {
      this._unsub();
      this._unsub = null;
    }

    this.loading = true;
    this._emit();
    try {
      if (this.mode === "live") {
        await this._fetchAll();
        const tick = () => this._fetchAll().then(() => this._emit()).catch((e) => console.warn("flags poll", e));
        const id = setInterval(tick, POLL_MS);
        const onFocus = () => tick();
        window.addEventListener("focus", onFocus);
        this._unsub = () => {
          clearInterval(id);
          window.removeEventListener("focus", onFocus);
        };
      } else {
        this.flags = loadLocalFlags();
        this._sortFlags();
      }
    } finally {
      this.loading = false;
      this._emit();
    }
  }

  /** @returns {Promise<ClassFlag>} lá cờ vừa đặt */
  async addFlag({ flagType, placedDate, note = "" }) {
    if (!FLAG_TYPE_BY_ID[flagType]) throw new Error("Loại cờ không hợp lệ.");
    const placed = placedDate || todayISO();
    const cleanNote = String(note || "").slice(0, 200);

    if (this.mode === "live") {
      if (!this.isAuthenticated()) throw new Error("Cần mở khóa để đặt cờ.");
      const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/class_flags`, {
        method: "POST",
        headers: anonHeaders({
          "Content-Type": "application/json",
          Prefer: "return=representation",
        }),
        body: JSON.stringify({ flag_type: flagType, placed_date: placed, note: cleanNote }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        if (res.status === 401 || res.status === 403)
          throw new Error("Không có quyền (RLS) — kiểm tra lại chính sách bảng class_flags.");
        throw new Error(`Không lưu được: ${res.status} ${txt.slice(0, 120)}`);
      }
      const rows = await res.json();
      const row = rows[0];
      const flag = {
        id: row.id,
        flag_type: row.flag_type,
        placed_date: row.placed_date,
        note: row.note || "",
        created_at: row.created_at,
      };
      this.flags.push(flag);
      this._sortFlags();
      this._emit();
      return flag;
    }

    // offline
    const flag = {
      id: localUid(),
      flag_type: flagType,
      placed_date: placed,
      note: cleanNote,
      created_at: new Date().toISOString(),
    };
    this.flags.push(flag);
    this._sortFlags();
    saveLocalFlags(this.flags);
    this._emit();
    return flag;
  }

  /** @param {string} id  @param {{placedDate?:string, note?:string}} patch */
  async updateFlag(id, patch) {
    const target = this.flags.find((f) => f.id === id);
    if (!target) throw new Error("Không tìm thấy lá cờ.");

    if (this.mode === "live") {
      if (!this.isAuthenticated()) throw new Error("Cần mở khóa để sửa cờ.");
      const body = {};
      if (patch.placedDate) body.placed_date = patch.placedDate;
      if (patch.note !== undefined) body.note = String(patch.note).slice(0, 200);
      const res = await fetchWithTimeout(
        `${SUPABASE_URL}/rest/v1/class_flags?id=eq.${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: anonHeaders({
            "Content-Type": "application/json",
            Prefer: "return=representation",
          }),
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Không sửa được: ${res.status} ${txt.slice(0, 120)}`);
      }
      const rows = await res.json();
      if (rows[0]) Object.assign(target, rows[0], { note: rows[0].note || "" });
      this._sortFlags();
      this._emit();
      return target;
    }

    if (patch.placedDate) target.placed_date = patch.placedDate;
    if (patch.note !== undefined) target.note = String(patch.note).slice(0, 200);
    this._sortFlags();
    saveLocalFlags(this.flags);
    this._emit();
    return target;
  }

  async deleteFlag(id) {
    const target = this.flags.find((f) => f.id === id);
    if (!target) return;

    if (this.mode === "live") {
      if (!this.isAuthenticated()) throw new Error("Cần mở khóa để xóa cờ.");
      const res = await fetchWithTimeout(
        `${SUPABASE_URL}/rest/v1/class_flags?id=eq.${encodeURIComponent(id)}`,
        { method: "DELETE", headers: anonHeaders() }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Không xóa được: ${res.status} ${txt.slice(0, 120)}`);
      }
      this.flags = this.flags.filter((f) => f.id !== id);
      this._emit();
      return;
    }

    this.flags = this.flags.filter((f) => f.id !== id);
    saveLocalFlags(this.flags);
    this._emit();
  }

  // ————————————————————————————— Derived —————————————————————————————

  /** @returns {{ total:number, byType: Record<string, number> }} */
  stats() {
    const byType = {};
    for (const f of FLAG_TYPES) byType[f.id] = 0;
    for (const f of this.flags) if (byType[f.flag_type] != null) byType[f.flag_type] += 1;
    return { total: this.flags.length, byType };
  }

  /** Danh sách tháng (YYYY-MM) có cờ, mới nhất trước. */
  months() {
    const set = new Set(this.flags.map((f) => String(f.placed_date).slice(0, 7)));
    return [...set].filter(Boolean).sort().reverse();
  }

  /** Lọc theo loại + tháng (rỗng = tất cả). */
  filtered({ type = "", month = "" } = {}) {
    return this.flags.filter(
      (f) => (!type || f.flag_type === type) && (!month || String(f.placed_date).startsWith(month))
    );
  }
}
