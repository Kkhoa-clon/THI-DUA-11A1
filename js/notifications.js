const TOKEN_KEY = "a1-push-token";

function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearNotificationToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
}

async function apiRequest(payload, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch("/api/notifications", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `API thông báo trả HTTP ${response.status}.`);
  }
  return result;
}

export async function authenticateNotificationSender(code, role, teamId = null) {
  const result = await apiRequest({ action: "auth", code, role, teamId });
  try {
    sessionStorage.setItem(TOKEN_KEY, result.token);
  } catch {
    throw new Error("Trình duyệt không cho phép lưu phiên gửi thông báo.");
  }
}

export async function sendPushNotification(action, details = {}) {
  const token = getToken();
  if (!token) {
    throw new Error("Chưa xác thực dịch vụ thông báo. Hãy đăng xuất rồi đăng nhập lại.");
  }
  return apiRequest({ action, ...details }, token);
}

function decodeApplicationServerKey(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

async function getServiceWorker() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Trình duyệt này chưa hỗ trợ thông báo đẩy.");
  }
  if (!window.isSecureContext) {
    throw new Error("Thông báo chỉ hoạt động trên HTTPS hoặc localhost.");
  }
  return navigator.serviceWorker.register("/service-worker.js");
}

export async function getNotificationSubscription() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return null;
  const registration = await navigator.serviceWorker.getRegistration("/");
  return registration?.pushManager.getSubscription() || null;
}

export async function enablePushNotifications() {
  if (!("Notification" in window)) {
    throw new Error("Trình duyệt này không hỗ trợ thông báo.");
  }
  const keyResponse = await fetch("/api/notifications?action=public-key", { cache: "no-store" });
  const keyResult = await keyResponse.json().catch(() => ({}));
  if (!keyResponse.ok || !keyResult.publicKey) {
    throw new Error(keyResult.error || "Chưa cấu hình dịch vụ Web Push trên Vercel.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(permission === "denied"
      ? "Bạn đã chặn thông báo. Hãy bật quyền trong cài đặt trình duyệt."
      : "Bạn chưa cho phép thông báo.");
  }

  const registration = await getServiceWorker();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeApplicationServerKey(keyResult.publicKey),
    });
  }

  try {
    await apiRequest({ action: "subscribe", subscription: subscription.toJSON() });
  } catch (error) {
    try {
      await subscription.unsubscribe();
    } catch (cleanupError) {
      console.error("Không thể hủy subscription chưa lưu:", cleanupError);
    }
    throw error;
  }
  return subscription;
}

export async function disablePushNotifications() {
  const registration = await getServiceWorker();
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await apiRequest({ action: "unsubscribe", endpoint: subscription.endpoint });
  await subscription.unsubscribe();
}
