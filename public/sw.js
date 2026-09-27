// SERVICE WORKER cua CloudStock - CHI de nhan thong bao ve may (Web Push), khong luu trang offline.
// May chu gui { title, body, url, tag } (lib/thongBao.js tomTatDay); bam vao thong bao -> mo dung trang (tab CloudStock dang mo thi chuyen sang tab do).

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {
    d = { body: e.data ? e.data.text() : "" };
  }
  e.waitUntil(
    self.registration.showNotification(d.title || "CloudStock", {
      body: d.body || "",
      icon: "/icon-192.png",
      badge: "/badge-96.png",
      tag: d.tag || undefined,
      data: { url: d.url || "/" },
      lang: "vi",
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const dich = new URL(e.notification.data?.url || "/", self.location.origin).href;
  e.waitUntil(
    (async () => {
      const cacTab = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const tab = cacTab.find((c) => new URL(c.url).origin === self.location.origin);
      if (tab) {
        await tab.focus();
        if (tab.url !== dich && "navigate" in tab) await tab.navigate(dich).catch(() => {});
        return;
      }
      await self.clients.openWindow(dich);
    })()
  );
});
