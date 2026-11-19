// CANH BAO GIA (20/11/2026, Hieu: "duong gia keo tha + canh bao"): duong ngang tren bieu do, keo len / xuong de doi gia; gia cham duong thi bao.
// Luu o localStorage cua trinh duyet nay (khong len may chu) -> CHI bao khi co 1 trang Bieu do dang mo (kiem tra moi ~1 phut trong phien qua /api/bang-gia).
// Moi canh bao: { id, ma, gia, huong: "len" (bao khi gia >= muc) | "xuong" (bao khi gia <= muc), tao: ms, daBao: bool, luc: ms luc bao }.
export const KHOA_CANH_BAO = "cs-canh-bao-gia";
export const SU_KIEN_CANH_BAO = "cs-canh-bao-doi";

export function docCanhBao() {
  try {
    const v = JSON.parse(localStorage.getItem(KHOA_CANH_BAO) || "[]");
    return Array.isArray(v) ? v.filter((x) => x && typeof x.ma === "string" && Number.isFinite(x.gia)) : [];
  } catch {
    return [];
  }
}

export function luuCanhBao(ds) {
  try {
    localStorage.setItem(KHOA_CANH_BAO, JSON.stringify(ds));
  } catch {
    /* che do an danh / chan luu tru: chi ton tai trong phien */
  }
  window.dispatchEvent(new CustomEvent(SU_KIEN_CANH_BAO));
}

let dem = 0;
export const taoCanhBao = (ma, gia, giaHienTai) => ({ id: `cb${Date.now().toString(36)}${(dem++).toString(36)}`, ma, gia, huong: giaHienTai != null && gia < giaHienTai ? "xuong" : "len", tao: Date.now(), daBao: false });

// Cac canh bao vua cham (gia: { MA: giaMoi }) -> tra ve danh sach moi (danh dau daBao) + nhung cai vua bao
export function kiemTraCanhBao(ds, gia) {
  const vuaBao = [];
  const moi = ds.map((c) => {
    const g = gia[c.ma];
    if (c.daBao || g == null || !Number.isFinite(g)) return c;
    if ((c.huong === "len" && g >= c.gia) || (c.huong === "xuong" && g <= c.gia)) {
      const x = { ...c, daBao: true, luc: Date.now(), giaKhiBao: g };
      vuaBao.push(x);
      return x;
    }
    return c;
  });
  return { moi, vuaBao };
}

// Thong bao he thong: service worker (dien thoai / tab nen) roi moi den new Notification. Tra ve true neu da gui.
export async function hienThongBaoGia(tieuDe, noiDung, url) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
  const tuyChon = { body: noiDung, icon: "/icon-192.png", badge: "/badge-96.png", tag: `canh-bao-${Date.now()}`, lang: "vi", vibrate: [200, 100, 200], data: { url } };
  try {
    if ("serviceWorker" in navigator) {
      if (!(await navigator.serviceWorker.getRegistration("/"))) await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(tieuDe, tuyChon);
      return true;
    }
  } catch {
    /* thu cach 2 */
  }
  try {
    new Notification(tieuDe, { body: noiDung, icon: "/icon-192.png" });
    return true;
  } catch {
    return false;
  }
}
