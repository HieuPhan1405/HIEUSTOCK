// THONG BAO VE MAY - phan chay tren TRINH DUYET (chi goi tu component client): dang ky service worker (public/sw.js), xin quyen, dang ky nhan day va bao may chu.

export function hoTroDay() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// iPhone/iPad: chi nhan thong bao khi mo web tu bieu tuong tren Man hinh chinh (Safari thuong khong co PushManager).
export function laIOSChuaCaiDat() {
  if (typeof window === "undefined") return false;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const daCai = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
  return ios && !daCai;
}

export function quyenHienTai() {
  return typeof Notification === "undefined" ? "default" : Notification.permission;
}

// Khoa cong khai (base64url) -> Uint8Array cho pushManager.subscribe.
function khoaSangMang(chuoi) {
  const dem = "=".repeat((4 - (chuoi.length % 4)) % 4);
  const tho = window.atob((chuoi + dem).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(tho, (c) => c.charCodeAt(0));
}

async function goiMayChu(noiDung) {
  const res = await fetch("/api/thong-bao/day", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(noiDung) });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.loi || "Máy chủ báo lỗi.");
  return d;
}

export async function layDangKyHienTai() {
  if (!hoTroDay()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

// Bat thong bao tren trinh duyet nay (phai goi tu 1 lan bam nut - trinh duyet chi cho xin quyen khi nguoi dung bam).
export async function batDay(khoaCongKhai) {
  if (!hoTroDay()) throw new Error("Trình duyệt này chưa hỗ trợ thông báo về máy.");
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  const quyen = await Notification.requestPermission();
  if (quyen !== "granted") throw new Error(quyen === "denied" ? "Bạn đã chặn thông báo của web này." : "Chưa cho phép thông báo.");
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: khoaSangMang(khoaCongKhai) });
  await goiMayChu({ hanhDong: "bat", sub: sub.toJSON() });
  return sub;
}

export async function tatDay() {
  const sub = await layDangKyHienTai();
  if (!sub) return;
  await goiMayChu({ hanhDong: "tat", endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

// Trinh duyet da bat tu truoc -> gan lai cho tai khoan dang dang nhap (vd dang nhap lai sau khi het phien).
export async function dongBoDay() {
  const sub = await layDangKyHienTai();
  if (sub) await goiMayChu({ hanhDong: "bat", sub: sub.toJSON() }).catch(() => {});
  return sub;
}

export async function guiThu() {
  return goiMayChu({ hanhDong: "thu" });
}
