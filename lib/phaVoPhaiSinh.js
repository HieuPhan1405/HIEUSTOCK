// TIN HIEU PHA VO TRONG NGAY cho hop dong tuong lai VN30F1M - ham THUAN (dung duoc o may chu lan Node), test: engine/test/phaVoPhaiSinh.test.mjs.
// Logic giong HET ban kiem chung (engine/dich-vu/phaisinh_them3.py, phaisinh_orb.py) de con so tren web doi chieu duoc voi ket qua lich su:
//   PHA VO BIEN DONG (he so 0,3): dat 2 muc = gia mo cua +- he so x bien do phien truoc. Gia CHAM muc nao truoc thi vao theo huong do (khop tai muc, hoac gia mo cua
//     cua phut do neu nhay qua). Cat lo tai gia mo cua. Chi vao truoc 13:30. Chua bi cat lo thi dong luc 14:29.
//   KHOANG MO CUA 15 phut: dinh / day cua 15 phut dau. Nen 1 phut DONG CUA vuot dinh thi mua, duoi day thi ban khong (khop tai gia dong cua nen do).
//     Cat lo o bien doi dien. Chi vao truoc 13:30. Dong luc 14:29.
// Luoi thoi gian: phien lien tuc 09:00-11:30 (chi so phut 0..150) + 13:00-14:29 (151..240). Phien ATC 14:45 luu rieng, KHONG dung de vao / ra lenh.
// Day la cong cu thong ke ca nhan, khong phai khuyen nghi dau tu.

export const SO_PHUT = 241;
export const K_HET_GIO_VAO = 180; // 13:30 - chi vao lenh o cac phut co chi so < 180
export const K_CUOI = 240; // 14:29
export const HE_SO_BIEN_DONG = 0.3;
export const SO_PHUT_KHOANG = 15;

// Phi + thue 1 vong (mua + ban) cho 1 hop dong, tinh bang DIEM, theo bieu phi chinh thuc MBS (doc 14/10/2026): moi luot 3.000d MBS + 2.700d So + 2.550d bu tru,
// thue = gia x 100.000 x 17% x 0,1% / 2. Chua gom truot gia.
export function phiVong(gia) {
  return (2 * (3000 + 2700 + 2550)) / 100000 + 0.00017 * gia;
}

const GIO_VN = 7 * 3600;
// giay Unix -> { ngay: "yyyy-mm-dd" (gio Viet Nam), k: chi so phut trong phien lien tuc; -1 = ngoai phien; -2 = phien ATC (14:45) }
export function viTriPhut(giay) {
  const d = new Date((giay + GIO_VN) * 1000);
  const ngay = d.toISOString().slice(0, 10);
  const ph = d.getUTCHours() * 60 + d.getUTCMinutes();
  let k = -1;
  if (ph >= 540 && ph <= 690) k = ph - 540;
  else if (ph >= 780 && ph <= 869) k = 151 + ph - 780;
  else if (ph === 885) k = -2;
  return { ngay, k };
}
export function gioCuaPhut(k) {
  const ph = k <= 150 ? 540 + k : 780 + k - 151;
  return `${String(Math.floor(ph / 60)).padStart(2, "0")}:${String(ph % 60).padStart(2, "0")}`;
}

// nen: [[t (giay), o, h, l, c, v], ...] nen 1 phut. Tra ve Map ngay -> { ngay, o, h, l, c, v (mang 241 phan tu; phut chua co = null), kCuoi (phut cuoi co du lieu, -1 neu chua co), atc }.
// Phut trong (khong co giao dich) o GIUA phien duoc lap bang gia dong cua phut truoc; cac phut truoc phut dau tien co du lieu lay gia mo cua cua phut dau tien do.
export function tachPhien(nen) {
  const ra = new Map();
  for (const r of nen || []) {
    const [t, o, h, l, c, v] = r;
    if (!(c > 0)) continue;
    const { ngay, k } = viTriPhut(t);
    if (k === -1) continue;
    let p = ra.get(ngay);
    if (!p) {
      p = { ngay, o: new Array(SO_PHUT).fill(null), h: new Array(SO_PHUT).fill(null), l: new Array(SO_PHUT).fill(null), c: new Array(SO_PHUT).fill(null), v: new Array(SO_PHUT).fill(0), kCuoi: -1, atc: null };
      ra.set(ngay, p);
    }
    if (k === -2) {
      p.atc = c;
      continue;
    }
    p.o[k] = o;
    p.h[k] = h;
    p.l[k] = l;
    p.c[k] = c;
    p.v[k] = v || 0;
    if (k > p.kCuoi) p.kCuoi = k;
  }
  for (const p of ra.values()) {
    let dau = -1;
    for (let k = 0; k <= p.kCuoi; k++) if (p.c[k] != null) { dau = k; break; }
    if (dau < 0) continue;
    for (let k = 0; k < dau; k++) p.o[k] = p.h[k] = p.l[k] = p.c[k] = p.o[dau];
    let cuoi = p.c[dau];
    for (let k = dau; k <= p.kCuoi; k++) {
      if (p.c[k] == null) p.o[k] = p.h[k] = p.l[k] = p.c[k] = cuoi;
      else cuoi = p.c[k];
    }
  }
  return ra;
}

// Cao / thap / bien do cua 1 phien (chi phien lien tuc, khong tinh ATC) - dung lam "bien do phien truoc".
export function bienDoPhien(p) {
  if (!p || p.kCuoi < 0) return null;
  let cao = -Infinity, thap = Infinity;
  for (let k = 0; k <= p.kCuoi; k++) {
    if (p.h[k] > cao) cao = p.h[k];
    if (p.l[k] < thap) thap = p.l[k];
  }
  return { cao, thap, bienDo: cao - thap };
}

// Theo doi 1 lenh da vao tai (k, gia): tra ve { k, gia, lyDo } khi thoat, hoac null neu chua thoat (du lieu moi den kDen).
function theoDoi(p, phia, kVao, catLo, kDen) {
  for (let j = kVao + 1; j <= Math.min(kDen, K_CUOI); j++) {
    if (phia > 0 && p.l[j] <= catLo) return { k: j, gia: Math.min(p.o[j], catLo), lyDo: "catLo" };
    if (phia < 0 && p.h[j] >= catLo) return { k: j, gia: Math.max(p.o[j], catLo), lyDo: "catLo" };
  }
  return kDen >= K_CUOI ? { k: K_CUOI, gia: p.c[K_CUOI], lyDo: "cuoiPhien" } : null;
}
function ketQua(p, phia, vao, ra, kDen) {
  const giaHienTai = ra ? ra.gia : p.c[Math.min(kDen, p.kCuoi)];
  const diem = phia * (giaHienTai - vao.gia);
  return { phia, vao: { ...vao, gio: gioCuaPhut(vao.k) }, ra: ra ? { ...ra, gio: gioCuaPhut(ra.k) } : null, diem, phi: phiVong(vao.gia), diemSauPhi: diem - phiVong(vao.gia) };
}

// PHA VO BIEN DONG. p: 1 phien tu tachPhien; bienDoTruoc: bien do (diem) cua phien truoc; kDen: phut cuoi cung duoc dung (mac dinh = het du lieu dang co).
// trangThai: "chuaMoCua" | "cho" (chua cham muc nao, con trong gio vao) | "khongKhop" (het gio vao ma chua cham) | "dangGiu" | "catLo" | "cuoiPhien"
export function tinhBienDong(p, bienDoTruoc, { heSo = HE_SO_BIEN_DONG, kDen = null } = {}) {
  if (!p || p.kCuoi < 0 || !(bienDoTruoc > 0)) return { trangThai: "chuaMoCua" };
  const den = kDen == null ? p.kCuoi : Math.min(kDen, p.kCuoi);
  const mo = p.o[0];
  const co = { giaMoCua: mo, mucMua: mo + heSo * bienDoTruoc, mucBan: mo - heSo * bienDoTruoc, catLo: mo, heSo };
  for (let k = 1; k <= Math.min(den, K_HET_GIO_VAO - 1); k++) {
    const phia = p.h[k] >= co.mucMua ? 1 : p.l[k] <= co.mucBan ? -1 : 0;
    if (!phia) continue;
    const vao = { k, gia: phia > 0 ? Math.max(p.o[k], co.mucMua) : Math.min(p.o[k], co.mucBan) };
    const ra = theoDoi(p, phia, k, co.catLo, den);
    return { ...co, trangThai: ra ? ra.lyDo : "dangGiu", ...ketQua(p, phia, vao, ra, den) };
  }
  return { ...co, trangThai: den >= K_HET_GIO_VAO - 1 ? "khongKhop" : "cho" };
}

// KHOANG MO CUA. kXong: phut cuoi cung da DONG CUA XONG (nen dang chay chua duoc dung de ra tin hieu); mac dinh = het du lieu dang co.
// trangThai: "chuaMoCua" | "dangDo" (chua du soPhut dau) | "cho" | "khongKhop" | "dangGiu" | "catLo" | "cuoiPhien"
export function tinhKhoangMoCua(p, { soPhut = SO_PHUT_KHOANG, kXong = null, kDen = null } = {}) {
  if (!p || p.kCuoi < 0) return { trangThai: "chuaMoCua" };
  const xong = kXong == null ? p.kCuoi : Math.min(kXong, p.kCuoi);
  const den = kDen == null ? p.kCuoi : Math.min(kDen, p.kCuoi);
  let dinh = -Infinity, day = Infinity;
  for (let k = 0; k <= Math.min(soPhut - 1, p.kCuoi); k++) {
    if (p.h[k] > dinh) dinh = p.h[k];
    if (p.l[k] < day) day = p.l[k];
  }
  if (xong < soPhut - 1) return { trangThai: "dangDo", dinh, day, soPhut, giaMoCua: p.o[0] };
  const co = { giaMoCua: p.o[0], dinh, day, soPhut };
  for (let k = soPhut; k <= Math.min(xong, K_HET_GIO_VAO - 1); k++) {
    const phia = p.c[k] > dinh ? 1 : p.c[k] < day ? -1 : 0;
    if (!phia) continue;
    const catLo = phia > 0 ? day : dinh;
    const vao = { k, gia: p.c[k] };
    const ra = theoDoi(p, phia, k, catLo, den);
    return { ...co, catLo, trangThai: ra ? ra.lyDo : "dangGiu", ...ketQua(p, phia, vao, ra, den) };
  }
  return { ...co, trangThai: xong >= K_HET_GIO_VAO - 1 ? "khongKhop" : "cho" };
}

// Thu Nam tuan thu 3 cua thang chua "ngay" (yyyy-mm-dd) - ngay dao han hop dong (neu la ngay nghi thi dao han la phien lien truoc).
export function thuNamTuanBa(ngay) {
  const [y, m] = ngay.split("-").map(Number);
  let dem = 0;
  for (let d = 1; d <= 31; d++) {
    const x = new Date(Date.UTC(y, m - 1, d));
    if (x.getUTCMonth() !== m - 1) break;
    if (x.getUTCDay() === 4 && ++dem === 3) return x.toISOString().slice(0, 10);
  }
  return null;
}
// Hom nay co phai PHIEN DAU cua hop dong moi khong (phien truoc la phien cuoi <= thu Nam tuan 3). Ngay nay ban kiem chung BO QUA kieu pha vo bien dong
// vi bien do phien truoc la cua hop dong cu.
export function laPhienDauHopDong(ngayTruoc, ngay) {
  if (!ngayTruoc || !ngay) return false;
  const t3 = thuNamTuanBa(ngayTruoc);
  return !!t3 && ngayTruoc <= t3 && ngay > t3;
}
