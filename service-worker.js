self.addEventListener("push", (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    message = { body: event.data?.text() || "" };
  }

  event.waitUntil(
    self.registration.showNotification(message.title || "Thi đua 11A1", {
      body: message.body || "Có cập nhật mới.",
      icon: "/image/tien-an-tien-su.png",
      badge: "/image/tien-an-tien-su.png",
      tag: message.tag || "11a1-update",
      data: { url: message.url || "/" },
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url === target);
      return existing ? existing.focus() : self.clients.openWindow(target);
    })
  );
});
