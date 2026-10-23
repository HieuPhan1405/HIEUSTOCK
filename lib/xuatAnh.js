// XUAT ANH (chia se cho khach): chup 1 khoi giao dien thanh anh PNG roi tai ve / sao chep / chia se. CHI chay o trinh duyet (dung html-to-image, nap khi bam nut de khong lam nang trang).
// Phan tu co data-khong-chup khong vao anh (nut bam...). Anh co chan trang ghi nguon + gio chup + canh bao khong phai khuyen nghi.
const CHU_THICH = "Không phải khuyến nghị đầu tư";

export function gioChupVN(d = new Date()) {
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}

// Them chan trang tam thoi vao cuoi `node` (go ra bang ham tra ve) - dung khi chup truc tiep trang dang xem.
function themChanTrang(node, tieuDe) {
  const el = document.createElement("div");
  el.setAttribute("data-chan-anh", "1");
  const cs = getComputedStyle(document.body);
  el.style.cssText = `display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:14px 24px;font-size:12px;color:${cs.color};opacity:.75;border-top:1px solid rgba(128,128,160,.35);font-family:${cs.fontFamily}`;
  el.innerHTML = `<span><b>CloudStock</b> · cloudstock.id.vn${tieuDe ? ` · ${tieuDe}` : ""}</span><span>Chụp lúc ${gioChupVN()} · ${CHU_THICH}</span>`;
  node.appendChild(el);
  return () => el.remove();
}

// node: phan tu DOM can chup. nen: mau nen (mac dinh = nen cua trang). chanTrang: them chan trang tam thoi (chup trang dang xem); the "the chia se" tu co chan trang rieng thi dat false.
export async function chupNode(node, { nen, chanTrang = true, tieuDe = "" } = {}) {
  const { toBlob } = await import("html-to-image");
  if (document.fonts?.ready) await document.fonts.ready;
  const go = chanTrang ? themChanTrang(node, tieuDe) : () => {};
  try {
    const rong = node.scrollWidth || node.clientWidth || 1;
    const cao = node.scrollHeight || node.clientHeight || 1;
    // gioi han canh anh ~14.000px de canvas khong vuot muc trinh duyet cho phep
    const tiLe = Math.max(0.5, Math.min(2, 14000 / cao, 14000 / rong));
    const blob = await toBlob(node, {
      pixelRatio: tiLe,
      cacheBust: true,
      backgroundColor: nen || getComputedStyle(document.body).backgroundColor || "#0b0b12",
      filter: (n) => !(n.dataset && n.dataset.khongChup !== undefined),
    });
    if (!blob) throw new Error("Không tạo được ảnh");
    return blob;
  } finally {
    go();
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
export async function saoChep(blob) {
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

export function coTheChiaSe(blob, tenFile) {
  try {
    return !!navigator.canShare && navigator.canShare({ files: [new File([blob], tenFile, { type: "image/png" })] });
  } catch {
    return false;
  }
}
export async function chiaSe(blob, tenFile, tieuDe) {
  await navigator.share({ files: [new File([blob], tenFile, { type: "image/png" })], title: tieuDe });
}
