import crypto from "node:crypto";
import webpush from "web-push";

const TOKEN_LIFETIME_SECONDS = 12 * 60 * 60;
const MAX_PUSH_BODY_BYTES = 2400;
const requestAttempts = new Map();

function json(res, status, value) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(value));
}

function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      const error = new Error("Nội dung yêu cầu không phải JSON hợp lệ.");
      error.status = 400;
      throw error;
    }
  }
  return {};
}

function withinRateLimit(req, scope, limit, windowMs) {
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const attempt = requestAttempts.get(key) || { count: 0, startedAt: now };
  if (now - attempt.startedAt > windowMs) {
    attempt.count = 0;
    attempt.startedAt = now;
  }
  attempt.count++;
  requestAttempts.set(key, attempt);
  if (requestAttempts.size > 5000) requestAttempts.delete(requestAttempts.keys().next().value);
  return attempt.count <= limit;
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}.`);
  return value;
}

function supabaseConfig() {
  const baseUrl = requiredEnv("SUPABASE_URL").replace(/\/+$/, "");
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  return { baseUrl, serviceKey };
}

async function supabaseRequest(path, options = {}) {
  const { baseUrl, serviceKey } = supabaseConfig();
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Supabase trả HTTP ${response.status}: ${detail}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function signToken(payload) {
  const secret = requiredEnv("PUSH_TOKEN_SECRET");
  if (secret.length < 32) throw new Error("PUSH_TOKEN_SECRET cần tối thiểu 32 ký tự.");
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(JSON.stringify(payload));
  const unsigned = `${header}.${body}`;
  const signature = crypto.createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

function verifyToken(token) {
  const secret = requiredEnv("PUSH_TOKEN_SECRET");
  const [header, payload, signature, extra] = String(token || "").split(".");
  if (!header || !payload || !signature || extra) return null;
  const unsigned = `${header}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(unsigned).digest();
  let actual;
  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (claims.iss !== "11a1-push" || claims.exp <= Date.now() / 1000) return null;
    return claims;
  } catch {
    return null;
  }
}

function constantTimeEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function resolvePushRole(code) {
  if (typeof code !== "string" || !code.trim()) return null;
  let adminCodes;
  try {
    adminCodes = JSON.parse(process.env.PUSH_ADMIN_CODES || "[]");
  } catch {
    throw new Error("PUSH_ADMIN_CODES phải là mảng JSON hợp lệ.");
  }
  if (Array.isArray(adminCodes) && adminCodes.some((expected) => {
    const accepted = Array.isArray(expected) ? expected : [expected];
    return accepted.some((value) => typeof value === "string" && constantTimeEqual(code, value));
  })) {
    return { role: "admin" };
  }
  let leaderCodes;
  try {
    leaderCodes = JSON.parse(process.env.PUSH_LEADER_CODES || "{}");
  } catch {
    throw new Error("PUSH_LEADER_CODES phải là JSON hợp lệ.");
  }
  for (const [teamId, expectedCode] of Object.entries(leaderCodes)) {
    const accepted = Array.isArray(expectedCode) ? expectedCode : [expectedCode];
    if (
      /^to[1-4]$/.test(teamId) &&
      accepted.some((value) => typeof value === "string" && constantTimeEqual(code, value))
    ) {
      return { role: "leader", teamId };
    }
  }
  return null;
}

function authenticatedRole(req) {
  const match = String(req.headers.authorization || "").match(/^Bearer (.+)$/i);
  return match ? verifyToken(match[1]) : null;
}

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .trim()
    .slice(0, maxLength);
}

function assertRole(claims, roles) {
  if (!claims || !roles.includes(claims.role)) {
    const error = new Error("Phiên gửi thông báo không hợp lệ hoặc đã hết hạn. Hãy đăng nhập lại.");
    error.status = 401;
    throw error;
  }
}

function configureWebPush() {
  webpush.setVapidDetails(
    requiredEnv("VAPID_SUBJECT"),
    requiredEnv("VAPID_PUBLIC_KEY"),
    requiredEnv("VAPID_PRIVATE_KEY")
  );
}

async function sendToSubscribers(title, body, url = "/") {
  configureWebPush();
  const subscriptions = await supabaseRequest(
    "push_subscriptions?select=endpoint,subscription"
  );
  const message = JSON.stringify({
    title: cleanText(title, 80) || "Thi đua 11A1",
    body: cleanText(body, 2800),
    url: cleanText(url, 300) || "/",
    tag: `11a1-${crypto.randomUUID()}`,
  });
  const results = await Promise.allSettled(
    subscriptions.map(async ({ endpoint, subscription }) => {
      try {
        await webpush.sendNotification(subscription, message, { TTL: 24 * 60 * 60 });
        return true;
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await supabaseRequest(
            `push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
            { method: "DELETE" }
          );
          return false;
        }
        throw error;
      }
    })
  );
  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length) {
    console.error("Có thiết bị không nhận được push:", failed.length);
  }
  return {
    sent: results.filter((result) => result.status === "fulfilled" && result.value).length,
    removed: results.filter((result) => result.status === "fulfilled" && !result.value).length,
    failed: failed.length,
  };
}

function chunkLines(lines) {
  const chunks = [];
  let current = [];
  let currentBytes = 0;
  for (const line of lines) {
    const lineBytes = Buffer.byteLength(line);
    const separatorBytes = current.length ? Buffer.byteLength(" • ") : 0;
    if (current.length && currentBytes + separatorBytes + lineBytes > MAX_PUSH_BODY_BYTES) {
      chunks.push(current);
      current = [];
      currentBytes = 0;
    }
    const nextSeparatorBytes = current.length ? Buffer.byteLength(" • ") : 0;
    current.push(line);
    currentBytes += nextSeparatorBytes + lineBytes;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

async function sendLinesToSubscribers(title, lines) {
  const chunks = chunkLines(lines);
  const results = await Promise.all(
    chunks.map((chunk, index) =>
      sendToSubscribers(
        chunks.length > 1 ? `${title} (${index + 1}/${chunks.length})` : title,
        chunk.join(" • ")
      )
    )
  );
  return results.reduce(
    (total, result) => ({
      sent: total.sent + result.sent,
      removed: total.removed + result.removed,
      failed: total.failed + result.failed,
    }),
    { sent: 0, removed: 0, failed: 0 }
  );
}

async function storeSubscription(subscription) {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    const error = new Error("Thông tin đăng ký thông báo không hợp lệ.");
    error.status = 400;
    throw error;
  }
  if (subscription.endpoint.length > 2048) {
    const error = new Error("Địa chỉ dịch vụ thông báo quá dài.");
    error.status = 400;
    throw error;
  }
  let endpoint;
  try {
    endpoint = new URL(subscription.endpoint);
  } catch {
    const error = new Error("Địa chỉ dịch vụ thông báo không hợp lệ.");
    error.status = 400;
    throw error;
  }
  const allowedPushHost =
    endpoint.protocol === "https:" &&
    (endpoint.hostname === "fcm.googleapis.com" ||
      endpoint.hostname === "web.push.apple.com" ||
      endpoint.hostname === "push.services.mozilla.com" ||
      endpoint.hostname.endsWith(".push.services.mozilla.com") ||
      endpoint.hostname.endsWith(".notify.windows.com"));
  if (!allowedPushHost) {
    const error = new Error("Nhà cung cấp thông báo đẩy không được hỗ trợ.");
    error.status = 400;
    throw error;
  }
  await supabaseRequest("push_subscriptions?on_conflict=endpoint", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      subscription,
      updated_at: new Date().toISOString(),
    }),
  });
}

async function removeSubscription(endpoint) {
  if (!endpoint || String(endpoint).length > 2048) {
    const error = new Error("Thiếu endpoint thông báo hợp lệ.");
    error.status = 400;
    throw error;
  }
  await supabaseRequest(`push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, {
    method: "DELETE",
  });
}

function normalizeRanks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row) => row && typeof row.id === "string" && Number.isInteger(row.rank))
    .filter((row) => row.rank >= 1 && row.rank <= 3)
    .slice(0, 6)
    .map((row) => ({
      id: cleanText(row.id, 60),
      name: cleanText(row.name, 80),
      rank: row.rank,
      score: Number.isFinite(Number(row.score)) ? Number(row.score) : 0,
    }));
}

async function notifyChangedRanking(board, label, rows) {
  const normalized = normalizeRanks(rows);
  const signature = JSON.stringify(normalized.map(({ id, rank }) => ({ id, rank })));
  const key = `ranking:${board}`;
  const previousRows = await supabaseRequest(
    `push_ranking_state?key=eq.${encodeURIComponent(key)}&select=signature`
  );
  const previous = previousRows[0]?.signature;
  const saveState = () =>
    supabaseRequest("push_ranking_state?on_conflict=key", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ key, signature, updated_at: new Date().toISOString() }),
    });
  if (!previous) {
    await saveState();
    return null;
  }
  if (previous === signature) return null;

  const lines = normalized.map((row) => `Hạng ${row.rank}: ${row.name} (${row.score}đ)`);
  const result = await sendLinesToSubscribers(`Thay đổi Top 3 • ${label}`, lines);
  if (!result.failed) await saveState();
  return result;
}

async function handleScoreUpdate(body, claims) {
  assertRole(claims, ["leader", "admin"]);
  const events = Array.isArray(body.events) ? body.events.slice(0, 30) : [];
  if (!events.length) {
    const error = new Error("Không có lượt cập nhật hợp lệ để thông báo.");
    error.status = 400;
    throw error;
  }
  const lines = events
    .map((event) => {
      const name = cleanText(event.name, 60);
      const label = cleanText(event.label, 80);
      const points = Number(event.points);
      if (!name || !label || !Number.isFinite(points) || points === 0) return null;
      return `${name}: ${label} (${points > 0 ? "+" : ""}${points}đ)`;
    })
    .filter(Boolean);
  if (!lines.length) {
    const error = new Error("Các lượt cập nhật thiếu tên, nội dung hoặc điểm hợp lệ.");
    error.status = 400;
    throw error;
  }
  const team = claims.role === "leader" ? `Tổ ${claims.teamId.slice(2)}` : "Admin";
  const displayedLines = lines.slice(0, 30);
  if (lines.length > displayedLines.length) {
    displayedLines.push(`Còn ${lines.length - displayedLines.length} lượt cập nhật khác`);
  }
  const scorePush = claims.role === "leader"
    ? sendLinesToSubscribers(`Cập nhật thi đua từ ${team}`, displayedLines)
    : Promise.resolve(null);
  const rankings = body.rankings || {};
  const [scoreResult, plusResult, minusResult] = await Promise.all([
    scorePush,
    notifyChangedRanking("plus", "Điểm cộng", rankings.plus),
    notifyChangedRanking("minus", "Vi phạm", rankings.minus),
  ]);
  return {
    sent: [scoreResult, plusResult, minusResult].reduce(
      (total, result) => total + (result?.sent || 0),
      0
    ),
    rankingNotifications: [plusResult, minusResult].filter(Boolean).length,
  };
}

async function handleAdminAction(action, body, claims) {
  assertRole(claims, ["admin"]);
  if (action === "week-closed") {
    const week = cleanText(body.week, 12);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) {
      const error = new Error("Tuần chốt sổ không hợp lệ.");
      error.status = 400;
      throw error;
    }
    const result = await sendToSubscribers(
      "Admin đã chốt sổ tuần",
      `Kết quả thi đua tuần ${week} đã được chốt. Mở ứng dụng để xem bảng xếp hạng.`
    );
    return result;
  }
  if (action === "custom") {
    const title = cleanText(body.title, 80);
    const message = cleanText(body.message, 250);
    if (!title || !message) {
      const error = new Error("Vui lòng nhập cả tiêu đề và nội dung thông báo.");
      error.status = 400;
      throw error;
    }
    return sendToSubscribers(title, message);
  }
  if (action === "infractions") {
    const week = cleanText(body.week, 12);
    const allEntries = Array.isArray(body.entries) ? body.entries : [];
    const entries = allEntries.slice(0, 1000);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) {
      const error = new Error("Tuần gửi bảng vi phạm không hợp lệ.");
      error.status = 400;
      throw error;
    }
    const details = entries.map((entry) => {
      const team = cleanText(entry.team, 20);
      const name = cleanText(entry.name, 60);
      const label = cleanText(entry.label, 100);
      const points = Number(entry.points);
      if (!team || !name || !label || !Number.isFinite(points)) return "";
      return `${team} — ${name}: ${label} (${points}đ)`;
    }).filter(Boolean);
    if (allEntries.length > entries.length) {
      details.push(`Còn ${allEntries.length - entries.length} lượt không hiển thị do giới hạn kích thước.`);
    }
    return sendLinesToSubscribers(`Bảng vi phạm tuần ${week}`, details.length
      ? details
      : ["Tuần này chưa ghi nhận lượt vi phạm nào."]);
  }
  const error = new Error("Tác vụ thông báo không được hỗ trợ.");
  error.status = 400;
  throw error;
}

export default async function handler(req, res) {
  if (!allowedOrigin(req)) return json(res, 403, { error: "Origin không được phép." });
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(204).end();
  }
  if (req.method === "GET" && req.query?.action === "public-key") {
    try {
      return json(res, 200, { publicKey: requiredEnv("VAPID_PUBLIC_KEY") });
    } catch (error) {
      return json(res, 503, { error: error.message });
    }
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return json(res, 405, { error: "Phương thức không được hỗ trợ." });
  }

  try {
    const body = readBody(req);
    if (Buffer.byteLength(JSON.stringify(body)) > 1000000) {
      return json(res, 413, { error: "Yêu cầu vượt quá giới hạn kích thước." });
    }
    const action = String(body.action || "");
    if (action === "auth") {
      if (!withinRateLimit(req, "auth", 10, 10 * 60 * 1000)) {
        const error = new Error("Thử quá nhiều lần. Hãy đợi 10 phút rồi thử lại.");
        error.status = 429;
        throw error;
      }
      const auth = resolvePushRole(String(body.code || ""));
      if (!auth) return json(res, 401, { error: "Mã gửi thông báo không hợp lệ." });
      if (auth.role !== body.role || (auth.role === "leader" && auth.teamId !== body.teamId)) {
        return json(res, 403, { error: "Mã gửi thông báo không khớp với vai trò đang đăng nhập." });
      }
      const now = Math.floor(Date.now() / 1000);
      const token = signToken({ ...auth, iss: "11a1-push", iat: now, exp: now + TOKEN_LIFETIME_SECONDS });
      return json(res, 200, { token });
    }
    if (action === "subscribe") {
      if (!withinRateLimit(req, "subscribe", 30, 60 * 60 * 1000)) {
        const error = new Error("Đăng ký quá nhiều lần. Hãy thử lại sau.");
        error.status = 429;
        throw error;
      }
      await storeSubscription(body.subscription);
      return json(res, 200, { ok: true });
    }
    if (action === "unsubscribe") {
      if (!withinRateLimit(req, "unsubscribe", 60, 60 * 60 * 1000)) {
        const error = new Error("Thay đổi đăng ký quá nhiều lần. Hãy thử lại sau.");
        error.status = 429;
        throw error;
      }
      await removeSubscription(body.endpoint);
      return json(res, 200, { ok: true });
    }

    const claims = authenticatedRole(req);
    if (action === "score") return json(res, 200, await handleScoreUpdate(body, claims));
    return json(res, 200, await handleAdminAction(action, body, claims));
  } catch (error) {
    if (!error.status || error.status >= 500) {
      console.error("Notification API error:", error);
    }
    return json(res, error.status || 500, {
      error: error.status ? error.message : "Không thể xử lý thông báo. Kiểm tra cấu hình API và Supabase.",
    });
  }
}
