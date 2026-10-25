// XUAT ANH (chia se cho khach): chup 1 khoi giao dien thanh anh roi tai ve / sao chep / chia se. CHI chay o trinh duyet (dung html-to-image, nap khi bam nut hoac khi re chuot vao nut de khong lam nang trang).
// Phan tu co data-khong-chup khong vao anh (nut bam...). Anh co chan trang ghi nguon + gio chup + canh bao khong phai khuyen nghi.
// Toi uu (26/10/2026): (1) dong bang MOI chuyen dong luc chup (class cs-dang-chup o globals.css) de anh khong dinh khung giua chung; (2) nhung phong 1 lan roi dung lai (nhanh hon, chu khong bi doi phong);
// (3) cho anh tai xong truoc khi chup (logo khong bi trong); (4) gioi han dien tich canvas theo thiet bi (iPhone ~16 trieu diem anh, vuot la anh trang); (5) Safari ve 2 luot (luot dau hay ra anh trang); (6) xuat PNG sac net hoac JPG nhe de gui Zalo.
const CHU_THICH = "Không phải khuyến nghị đầu tư";

export function gioChupVN(d = new Date()) {
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}

// Nap thu vien 1 lan (goi san khi re chuot / cham vao nut).
let thuVien = null;
export function napSanXuatAnh() {
  if (typeof window !== "undefined" && !thuVien) thuVien = import("html-to-image");
  return thuVien;
}

const laIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const laSafari = () => /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);

// Phong chu nhung vao anh: lay 1 lan cho ca phien lam viec.
let cssPhong = null;
function layCssPhong(node, lib) {
  if (!cssPhong) cssPhong = lib.getFontEmbedCSS(node).catch(() => "");
  return cssPhong;
}

// Cho 1 khung hinh ve xong, nhung khong cho qua ~120ms (tab bi an thi trinh duyet dung requestAnimationFrame - khong duoc treo cho toi luc nguoi dung quay lai).
export const khungHinh = () =>
  new Promise((r) => {
    const hen = setTimeout(r, 120);
    requestAnimationFrame(() => {
      clearTimeout(hen);
      r();
    });
  });

// Cho phong chu + moi <img> trong khoi tai xong.
async function doiTaiNguyen(node) {
  if (document.fonts?.ready) await document.fonts.ready;
  const anh = [...node.querySelectorAll("img")].filter((i) => !(i.complete && i.naturalWidth > 0));
  await Promise.all(anh.map((i) => (i.decode ? i.decode().catch(() => {}) : Promise.resolve())));
}

// Ti le diem anh / diem CSS: toi da `toiDa`, nhung tong dien tich canvas khong vuot muc thiet bi chiu duoc.
function tinhTiLe(rong, cao, toiDa) {
  const dienTichToiDa = laIOS() ? 16_000_000 : 64_000_000;
  const t = Math.min(toiDa, 14000 / cao, 14000 / rong, Math.sqrt(dienTichToiDa / (rong * cao)));
  return Math.max(0.4, Math.round(t * 100) / 100);
}

// Them chan trang tam thoi vao cuoi `node` (go ra bang ham tra ve) - dung khi chup trang dang xem.
function themChanTrang(node, tieuDe) {
  const el = document.createElement("div");
  el.setAttribute("data-chan-anh", "1");
  const cs = getComputedStyle(document.body);
  el.style.cssText = `display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:16px 24px;font-size:12px;color:${cs.color};border-top:1px solid rgba(128,128,160,.35);font-family:${cs.fontFamily}`;
  el.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px"><span style="width:9px;height:9px;border-radius:50%;background:linear-gradient(135deg,#8B7CF6,#6C5CE7)"></span><b>CloudStock</b><span style="opacity:.7">cloudstock.id.vn${tieuDe ? ` · ${tieuDe}` : ""}</span></span><span style="opacity:.7">Chụp lúc ${gioChupVN()} · ${CHU_THICH}</span>`;
  node.appendChild(el);
  return () => el.remove();
}

// node: phan tu DOM can chup. nen: mau nen (mac dinh = nen cua trang). chanTrang: them chan trang tam thoi (chup trang dang xem); the "the chia se" tu co chan trang rieng thi dat false.
// dinhDang: "png" (sac net, mac dinh) | "jpeg" (nhe hon 3-5 lan, hop de gui Zalo / Messenger). tiLeToiDa: 2 cho trang dang xem, the chia se dung 3 (chu nho van ro khi phong to tren dien thoai).
// Tra ve Blob (them thuoc tinh rong/cao theo diem anh de hien thi thong tin).
export async function chupNode(node, { nen, chanTrang = true, tieuDe = "", dinhDang = "png", tiLeToiDa = 2 } = {}) {
  const lib = await napSanXuatAnh();
  const goc = document.documentElement;
  goc.classList.add("cs-dang-chup");
  const go = chanTrang ? themChanTrang(node, tieuDe) : () => {};
  try {
    await doiTaiNguyen(node);
    // 1-2 khung hinh cho trinh duyet ap dung viec dung chuyen dong va ve lai chan trang
    await khungHinh();
    await khungHinh();
    const rong = node.scrollWidth || node.clientWidth || 1;
    const cao = node.scrollHeight || node.clientHeight || 1;
    const tiLe = tinhTiLe(rong, cao, tiLeToiDa);
    const mauNen = nen || getComputedStyle(document.body).backgroundColor || "#0b0b12";
    const tuyChon = {
      pixelRatio: tiLe,
      cacheBust: false,
      fontEmbedCSS: await layCssPhong(node, lib),
      backgroundColor: mauNen,
      type: dinhDang === "jpeg" ? "image/jpeg" : "image/png",
      quality: 0.92,
      filter: (n) => !(n.dataset && n.dataset.khongChup !== undefined),
    };
    // Safari: luot ve dau tien thuong ra anh trang (anh / phong chua kip nap vao ban ve) -> ve nhap ti le thap truoc
    if (laSafari()) await lib.toBlob(node, { ...tuyChon, pixelRatio: 0.3 }).catch(() => null);
    let blob = await lib.toBlob(node, tuyChon);
    // anh rong / bi vo (thuong do canvas qua lon): thu lai 1 lan o ti le thap hon
    if (!blob || blob.size < 3000) blob = await lib.toBlob(node, { ...tuyChon, pixelRatio: Math.max(0.5, tiLe / 2) });
    if (!blob || blob.size < 3000) throw new Error("Không tạo được ảnh");
    blob.rong = Math.round(rong * tiLe);
    blob.cao = Math.round(cao * tiLe);
    return blob;
  } finally {
    go();
    goc.classList.remove("cs-dang-chup");
  }
}

export function taiXuong(blob, tenFile) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = tenFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const coTheSaoChep = () => typeof ClipboardItem !== "undefined" && !!navigator.clipboard?.write;
// Trinh duyet chi cho chep PNG vao bo nho tam: neu dang la JPG thi doi sang PNG truoc.
export async function saoChep(blob) {
  let png = blob;
  if (blob.type !== "image/png") {
    const bm = await createImageBitmap(blob);
    const c = document.createElement("canvas");
    c.width = bm.width;
    c.height = bm.height;
    c.getContext("2d").drawImage(bm, 0, 0);
    png = await new Promise((r) => c.toBlob(r, "image/png"));
  }
  await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
}

export function coTheChiaSe(blob, tenFile) {
  try {
    return !!navigator.canShare && navigator.canShare({ files: [new File([blob], tenFile, { type: blob.type || "image/png" })] });
  } catch {
    return false;
  }
}
export async function chiaSe(blob, tenFile, tieuDe) {
  await navigator.share({ files: [new File([blob], tenFile, { type: blob.type || "image/png" })], title: tieuDe });
}

export const dungLuong = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

// Doi anh PNG da chup sang JPG (khong ve lai trang, chi nen lai) - dung khi nguoi dung muon file nhe de gui Zalo.
export async function doiSangJpeg(blob, nen = "#0b0b12", chatLuong = 0.9) {
  const bm = await createImageBitmap(blob);
  const c = document.createElement("canvas");
  c.width = bm.width;
  c.height = bm.height;
  const g = c.getContext("2d");
  g.fillStyle = nen;
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(bm, 0, 0);
  const out = await new Promise((r) => c.toBlob(r, "image/jpeg", chatLuong));
  if (!out) throw new Error("Không đổi được sang JPG");
  out.rong = blob.rong;
  out.cao = blob.cao;
  return out;
}
