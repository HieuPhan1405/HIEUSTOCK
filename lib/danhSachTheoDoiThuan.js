// Phan THUAN cua nhieu danh sach theo doi (dung chung server + client, test tay: engine/test/danhSachTheoDoi.test.mjs).
// Danh sach "chinh" = bang tham_gia_ma cu (thong bao "chi ma dang theo doi", dem nguoi theo doi); cac danh sach khac do nguoi dung tu tao.
export const ID_CHINH = "chinh";
export const TEN_CHINH = "Danh sách chính";
export const GIOI_HAN = { soDanhSach: 20, soMa: 200, doDaiTen: 40 };

// Ma co phieu: chu hoa + so, 2-10 ky tu. Bo trung, bo ma sai.
export function chuanHoaMa(ds) {
  const mang = Array.isArray(ds) ? ds : [ds];
  const ra = [];
  for (const x of mang) {
    const ma = String(x ?? "").trim().toUpperCase();
    if (/^[A-Z0-9]{2,10}$/.test(ma) && !ra.includes(ma)) ra.push(ma);
  }
  return ra;
}

// Ten danh sach: bo khoang trang thua, cat toi da doDaiTen ky tu. Rong -> null.
export function chuanHoaTen(ten) {
  const s = String(ten ?? "").replace(/\s+/g, " ").trim().slice(0, GIOI_HAN.doDaiTen).trim();
  return s || null;
}

// id gui len tu client: "chinh" hoac so nguyen duong (chuoi so cung nhan).
export function chuanHoaId(id) {
  if (id === ID_CHINH) return ID_CHINH;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Cac danh sach (id) dang co ma nay - danhSach: [{ id, ma: [{ ma }] }].
export function dsChuaMa(danhSach, ma) {
  return (danhSach ?? []).filter((d) => d.ma.some((x) => x.ma === ma)).map((d) => d.id);
}

// Ten goi y cho danh sach tao tu ket qua Bo loc: "Lọc 04/11", trung thi them (2), (3)...
export function tenGoiY(dsTen, goc) {
  const daCo = new Set((dsTen ?? []).map((t) => t.toLowerCase()));
  if (!daCo.has(goc.toLowerCase())) return goc;
  for (let i = 2; i < 100; i++) {
    const t = `${goc} (${i})`;
    if (!daCo.has(t.toLowerCase())) return t;
  }
  return goc;
}
