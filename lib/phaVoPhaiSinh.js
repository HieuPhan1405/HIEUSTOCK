// TIN HIEU PHA VO TRONG NGAY cho hop dong tuong lai VN30F1M - ham THUAN (dung duoc o may chu lan Node), test: engine/test/phaVoPhaiSinh.test.mjs.
// Logic giong HET ban kiem chung (engine/dich-vu/phaisinh_them3.py, phaisinh_orb.py) de con so tren web doi chieu duoc voi ket qua lich su:
//   PHA VO BIEN DONG (he so 0,3): dat 2 muc = gia mo cua +- he so x bien do phien truoc. Gia CHAM muc nao truoc thi vao theo huong do (khop tai muc, hoac gia mo cua
//     cua phut do neu nhay qua). Cat lo tai gia mo cua, NHUNG cach gia vao it nhat DIEM_CAT_LO_TOI_THIEU diem (06/11/2026). Chi vao truoc 13:30. Chua bi cat lo thi dong luc 14:29.
//     VAO LAI SAU CAT LO (08/11/2026): lenh dau bi cat lo ban dau -> cho gia cham lai 1 trong 2 muc (truoc 13:29), vao lenh thu 2; toi da 2 lenh / ngay, xem SO_LENH_TOI_DA_NGAY.
//   KHOANG MO CUA 15 phut: dinh / day cua 15 phut dau. Nen 1 phut DONG CUA vuot dinh thi mua, duoi day thi ban khong (khop tai gia dong cua nen do).
//     Cat lo o bien doi dien. Chi vao truoc 13:30. Dong luc 14:29.
// Luoi thoi gian: phien lien tuc 09:00-11:30 (chi so phut 0..150) + 13:00-14:29 (151..240). Phien ATC 14:45 luu rieng, KHONG dung de vao / ra lenh.
//   GIU QUA DEM (14/11/2026): lenh con giu den 14:29 + dong tien khung ngay cung chieu -> dong 9:30 phien sau (xem xetGiuQuaDem cuoi file).
// Day la cong cu thong ke ca nhan, khong phai khuyen nghi dau tu.
import { tinhDongTienBanker } from "./dongTienBanker.js";

export const SO_PHUT = 241;
export const K_HET_GIO_VAO = 180; // 13:30 - chi vao lenh o cac phut co chi so < 180
export const K_CUOI = 240; // 14:29
export const HE_SO_BIEN_DONG = 0.3;

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

// VUNG GIA TRI cua 1 phien (ho so khoi luong tu nen 1 phut): khoi luong moi phut rai deu tren cac bac gia 0,5 diem tu thap den cao cua phut do.
//   poc = bac co khoi luong lon nhat (lay giua bac); val / vah = bien duoi / tren cua vung chua tyLe (70%) khoi luong, mo rong dan tu POC ve phia co khoi luong lon hon.
// Giong HET ban kiem chung engine/dich-vu/phaisinh_vwap_poc.py. Chi la BOI CANH de theo doi, khong phai bo loc (xem ghi chu trong file do).
export function vungGiaTriPhien(p, { tyLe = 0.7 } = {}) {
  if (!p || p.kCuoi < 0) return null;
  let thap = Infinity, cao = -Infinity;
  for (let k = 0; k <= p.kCuoi; k++) {
    if (p.l[k] < thap) thap = p.l[k];
    if (p.h[k] > cao) cao = p.h[k];
  }
  const lo0 = Math.floor(thap * 2);
  const hs = new Array(Math.floor(cao * 2) - lo0 + 1).fill(0);
  for (let k = 0; k <= p.kCuoi; k++) {
    const i0 = Math.floor(p.l[k] * 2) - lo0, i1 = Math.floor(p.h[k] * 2) - lo0;
    const phan = (p.v[k] + 1e-9) / (i1 - i0 + 1);
    for (let i = i0; i <= i1; i++) hs[i] += phan;
  }
  let iPoc = 0, tong = 0;
  for (let i = 0; i < hs.length; i++) {
    tong += hs[i];
    if (hs[i] > hs[iPoc]) iPoc = i;
  }
  let lo = iPoc, hi = iPoc, s = hs[iPoc];
  while (s < tyLe * tong && (lo > 0 || hi < hs.length - 1)) {
    const duoi = lo > 0 ? hs[lo - 1] : -1, tren = hi < hs.length - 1 ? hs[hi + 1] : -1;
    if (duoi >= tren) s += hs[--lo];
    else s += hs[++hi];
  }
  return { poc: (iPoc + lo0) / 2 + 0.25, vah: (hi + lo0) / 2 + 0.5, val: (lo + lo0) / 2 };
}
// Vi tri cua 1 gia vao lenh so voi vung gia tri phien truoc: "trong" | "ra" (da o ngoai vung, lenh di RA xa vung) | "vao" (o ngoai vung, lenh huong VAO vung)
export function viTriVungGiaTri(gia, phia, vung) {
  if (!vung || gia == null || !phia) return null;
  if (gia >= vung.val && gia <= vung.vah) return "trong";
  return (phia > 0 && gia > vung.vah) || (phia < 0 && gia < vung.val) ? "ra" : "vao";
}

// CAT LO TOI THIEU (06/11/2026): ngay hom truoc bien do nho thi khoang cach vao -> mo cua chi 3-4 diem, nhieu lenh bi quet cat lo bang nhieu nen roi gia van chay dung huong.
// Cat lo ban dau = gia mo cua, hoac cach gia vao DIEM_CAT_LO_TOI_THIEU diem neu xa hon (mua: min(mo cua, vao - 7); ban khong: max(mo cua, vao + 7)). Chi doi cat lo, KHONG doi muc vao lenh.
// Kiem chung 2018-2026 (engine/dich-vu/phaisinh_catlo_toi_thieu.py, phi MBS + truot 0,4): 1.900 -> 2.134 diem (+12%), thang 50 -> 57%, sut -99 -> -91 diem; tot hon ca truoc va sau 07/2022. San 6-9 diem deu hon co so, 10 diem kem hon; nang muc vao hoac bo ngay bien do nho deu kem hon.
export const DIEM_CAT_LO_TOI_THIEU = 7;
export function catLoBanDau(giaMoCua, phia, giaVao) {
  return phia > 0 ? Math.min(giaMoCua, giaVao - DIEM_CAT_LO_TOI_THIEU) : Math.max(giaMoCua, giaVao + DIEM_CAT_LO_TOI_THIEU);
}

// CACH RA (05/11/2026): cat lo ban dau o gia mo cua; khi lai (theo gia cao nhat / thap nhat) dat DIEM_KICH_KHOA_LAI diem thi DOI cat lo len gia vao + DIEM_KHOA_LAI diem (mua; ban khong thi gia vao - 2), roi de chay den 14:29.
// Kiem chung 2018-2026 (engine/dich-vu, 05/11/2026): 26,4 / 17,9 %/nam (KP / KC), Sharpe 1,88 / 1,57, sut -9,1 / -5,6%, thang ~46 / 53% so voi cat lo co dinh 25,3 / 17,3, Sharpe 1,71 / 1,32. Moi nen: kiem tra cham cat lo TRUOC, roi moi cap nhat dinh lai va doi cat lo cho cac nen sau.
export const DIEM_KICH_KHOA_LAI = 7;
export const DIEM_KHOA_LAI = 2;
// Theo doi 1 lenh da vao tai (kVao, giaVao): tra ve { ra: { k, gia, lyDo: "catLo" | "khoaLai" | "cuoiPhien" } | null (chua thoat, du lieu moi den kDen), catLoHienTai, daKhoa }.
function theoDoi(p, phia, kVao, giaVao, catLo, kDen) {
  let stop = catLo;
  let daKhoa = false;
  let dinh = 0;
  for (let j = kVao + 1; j <= Math.min(kDen, K_CUOI); j++) {
    if (phia > 0 ? p.l[j] <= stop : p.h[j] >= stop) {
      const gia = phia > 0 ? Math.min(p.o[j], stop) : Math.max(p.o[j], stop);
      return { ra: { k: j, gia, lyDo: daKhoa ? "khoaLai" : "catLo" }, catLoHienTai: stop, daKhoa };
    }
    dinh = Math.max(dinh, phia > 0 ? p.h[j] - giaVao : giaVao - p.l[j]);
    if (!daKhoa && dinh >= DIEM_KICH_KHOA_LAI) {
      stop = giaVao + phia * DIEM_KHOA_LAI;
      daKhoa = true;
    }
  }
  return { ra: kDen >= K_CUOI ? { k: K_CUOI, gia: p.c[K_CUOI], lyDo: "cuoiPhien" } : null, catLoHienTai: stop, daKhoa };
}
function ketQua(p, phia, vao, ra, kDen) {
  const giaHienTai = ra ? ra.gia : p.c[Math.min(kDen, p.kCuoi)];
  const diem = phia * (giaHienTai - vao.gia);
  return { phia, vao: { ...vao, gio: gioCuaPhut(vao.k) }, ra: ra ? { ...ra, gio: gioCuaPhut(ra.k) } : null, diem, phi: phiVong(vao.gia), diemSauPhi: diem - phiVong(vao.gia) };
}

// Tim lenh dau tien cham muc tu phut kTu tro di (toi da den phut K_HET_GIO_VAO - 1): tra ve { catLo, trangThai, ...ketQua, catLoHienTai, daKhoa, mucKich, mucKhoa } hoac null.
function timLenh(p, co, mo, kTu, den) {
  for (let k = Math.max(1, kTu); k <= Math.min(den, K_HET_GIO_VAO - 1); k++) {
    const phia = p.h[k] >= co.mucMua ? 1 : p.l[k] <= co.mucBan ? -1 : 0;
    if (!phia) continue;
    const vao = { k, gia: phia > 0 ? Math.max(p.o[k], co.mucMua) : Math.min(p.o[k], co.mucBan) };
    const catLo = catLoBanDau(mo, phia, vao.gia);
    const t = theoDoi(p, phia, k, vao.gia, catLo, den);
    return {
      catLo,
      trangThai: t.ra ? t.ra.lyDo : "dangGiu",
      ...ketQua(p, phia, vao, t.ra, den),
      catLoHienTai: t.catLoHienTai,
      daKhoa: t.daKhoa,
      mucKich: vao.gia + phia * DIEM_KICH_KHOA_LAI,
      mucKhoa: vao.gia + phia * DIEM_KHOA_LAI,
    };
  }
  return null;
}

// VAO LAI SAU CAT LO (08/11/2026): lenh dau bi CAT LO BAN DAU (khong phai thoat sau khi da doi cat lo) thi cho gia cham lai 1 trong 2 muc (mua / ban khong, CUNG muc cua buoi sang) tu phut ke tiep,
// van trong gio vao (truoc 13:29): vao lenh thu 2 voi cung luat cat lo / doi cat lo / dong 14:29. Toi da 2 lenh / ngay, moi luc chi giu 1 hop dong (ky quy khong doi).
// Kiem chung 2018-2026 (engine/dich-vu/phaisinh_vaolai.py + phaisinh_vaolai_ruiro.py, phi MBS + truot 0,4): 319 -> 351 / 242 -> 277 diem/nam (KP / KC), Sharpe 2,15 -> 2,31 / 1,55 -> 1,73, sut -84 -> -98 / -91 -> -95; tot hon 7/8 nam
// (khoang tin cay 90% cua chenh toan ky +13..+62 diem/nam, t ~2,05: o muc bien gioi, chua chac chan). Lenh thu hai ~20 lenh/nam, thang ~59%, 113/146 lenh la NGUOC chieu lenh dau. Vao lai sau MOI lan thoat (ca khoa lai) thi te hon nen khong lam.
export const SO_LENH_TOI_DA_NGAY = 2;

// PHA VO BIEN DONG. p: 1 phien tu tachPhien; bienDoTruoc: bien do (diem) cua phien truoc; kDen: phut cuoi cung duoc dung (mac dinh = het du lieu dang co).
// trangThai (lenh DAU): "chuaMoCua" | "cho" (chua cham muc nao, con trong gio vao) | "khongKhop" (het gio vao ma chua cham) | "dangGiu" | "catLo" | "khoaLai" (thoat khi cat lo da doi len) | "cuoiPhien"
// Khi lenh dau bi cat lo: "lenhHai" = lenh vao lai (cung cau truc) neu da co; "vaoLai" = "cho" (con gio vao, chua cham lai) | "khongKhop" (het gio vao); "trangThaiNgay" = trang thai tong hop ca ngay ("choVaoLai" khi dang cho).
export function tinhBienDong(p, bienDoTruoc, { heSo = HE_SO_BIEN_DONG, kDen = null } = {}) {
  if (!p || p.kCuoi < 0 || !(bienDoTruoc > 0)) return { trangThai: "chuaMoCua" };
  const den = kDen == null ? p.kCuoi : Math.min(kDen, p.kCuoi);
  const mo = p.o[0];
  const co = { giaMoCua: mo, mucMua: mo + heSo * bienDoTruoc, mucBan: mo - heSo * bienDoTruoc, catLoMua: catLoBanDau(mo, 1, mo + heSo * bienDoTruoc), catLoBan: catLoBanDau(mo, -1, mo - heSo * bienDoTruoc), heSo };
  const dau = timLenh(p, co, mo, 1, den);
  if (!dau) return { ...co, trangThai: den >= K_HET_GIO_VAO - 1 ? "khongKhop" : "cho" };
  const ra = { ...co, ...dau, trangThaiNgay: dau.trangThai };
  if (dau.trangThai === "catLo" && SO_LENH_TOI_DA_NGAY >= 2) {
    const hai = timLenh(p, co, mo, dau.ra.k + 1, den);
    if (hai) {
      ra.lenhHai = hai;
      ra.trangThaiNgay = hai.trangThai;
      ra.tongDiemSauPhi = dau.diemSauPhi + hai.diemSauPhi;
    } else {
      ra.vaoLai = dau.ra.k + 1 >= K_HET_GIO_VAO || den >= K_HET_GIO_VAO - 1 ? "khongKhop" : "cho";
      ra.trangThaiNgay = ra.vaoLai === "cho" ? "choVaoLai" : "catLo";
    }
  }
  if (ra.tongDiemSauPhi == null) ra.tongDiemSauPhi = dau.diemSauPhi;
  return ra;
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
// Ngay dao han (thu Nam tuan 3) - dung khi CHUA biet phien ke tiep (phien dang chay). Neu thu Nam tuan 3 la ngay nghi thi phien dao han la phien truoc do (truong hop hiem, khong bat duoc o day).
export function laNgayDaoHan(ngay) {
  return !!ngay && ngay === thuNamTuanBa(ngay);
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
// GIU QUA DEM THEO DONG TIEN KHUNG NGAY (14/11/2026): lenh pha vo (lenh cuoi trong ngay) CON GIU den 14:29 ma trang thai DONG TIEN khung ngay (Banker Fund Flow, lib/dongTienBanker.js:
// trend > bull/bear = len) CUNG chieu lenh -> KHONG dong 14:29, giu qua dem va dong luc 9:30 phien sau (K_RA_QUA_DEM). Khong giu neu hom nay la ngay dao han (phien sau la hop dong moi).
// Kiem chung 2018-2026 (engine/dich-vu/phaisinh_dongtien_dakhung.py, phi MBS + truot 0,4): 351 -> 435 / 279 -> 341 diem/nam (den 06/2022 / tu 07/2022), Sharpe 2,31 -> 2,64 / 1,74 -> 1,84,
// sut -95 -> -111, hon 7/8 nam, ~65 dem / nam TB +1,1 diem, dem xau nhat -27 diem (giu khi NGUOC chieu: xau nhat -153). t ~ 2,6 / 1,8: muc vua; loc gia tren / duoi MA20 ngay cho ket qua tuong tu.
// Dong tien tinh tren gia LIEN TUC: phien dau hop dong moi bo khoang nhay giua 2 hop dong (cong don chenh lech dong cua cu - mo cua moi) truoc khi tinh chi bao.
export const K_RA_QUA_DEM = 30; // 09:30 phien sau

// Nen NGAY tu cac phien 1 phut (tachPhien): mo cua 09:00, cao / thap phien lien tuc, dong cua 14:29 (giong ban kiem chung).
export function nenNgayTuPhien(P) {
  const ds = [...P.keys()].sort();
  const ra = [];
  for (const d of ds) {
    const p = P.get(d);
    if (!p || p.kCuoi < 0) continue;
    let h = -Infinity, l = Infinity;
    for (let k = 0; k <= p.kCuoi; k++) {
      if (p.h[k] > h) h = p.h[k];
      if (p.l[k] < l) l = p.l[k];
    }
    ra.push({ t: d, o: p.o[0], h, l, c: p.c[Math.min(K_CUOI, p.kCuoi)] });
  }
  return ra;
}
// nenNgay: [{ t: "yyyy-mm-dd", o, h, l, c }] tang dan -> Map(ngay -> 1 (dong tien len) | -1 (xuong)); ngay chua du du lieu khong co trong Map.
export function dongTienNgayLienTuc(nenNgay) {
  const o = [], h = [], l = [], c = [];
  let lech = 0;
  for (let i = 0; i < nenNgay.length; i++) {
    const b = nenNgay[i];
    if (i > 0 && laPhienDauHopDong(nenNgay[i - 1].t, b.t)) lech += nenNgay[i - 1].c - b.o;
    o.push(b.o + lech);
    h.push(b.h + lech);
    l.push(b.l + lech);
    c.push(b.c + lech);
  }
  const { trend, bb } = tinhDongTienBanker({ open: o, high: h, low: l, close: c });
  const ra = new Map();
  nenNgay.forEach((b, i) => {
    if (trend[i] != null && bb[i] != null) ra.set(b.t, trend[i] > bb[i] ? 1 : -1);
  });
  return ra;
}
// Lenh CUOI trong ngay (lenh vao lai neu co, khong thi lenh dau) cua ket qua tinhBienDong.
export function lenhCuoiNgay(bd) {
  if (!bd || !bd.phia) return null;
  return bd.lenhHai || bd;
}
// Xet giu qua dem cho ket qua tinhBienDong cua 1 phien. dongTien: 1 / -1 / null (trang thai dong tien ngay cua chinh phien do); daoHan: phien sau la hop dong moi.
// Tra ve { giu, lyDo: "cungChieu" | "nguocChieu" | "daoHan" | "daThoat" | "khongCoLenh" | "chuaCoDongTien", dongTien, phia?, dangGiu? (lenh chua toi 14:29 - ket luan con tam) }.
export function xetGiuQuaDem(bd, dongTien, { daoHan = false } = {}) {
  const x = lenhCuoiNgay(bd);
  const dt = dongTien ?? null;
  if (!x) return { giu: false, lyDo: "khongCoLenh", dongTien: dt };
  const chung = { dongTien: dt, phia: x.phia, dangGiu: x.trangThai === "dangGiu" };
  if (x.trangThai !== "dangGiu" && x.trangThai !== "cuoiPhien") return { giu: false, lyDo: "daThoat", ...chung };
  if (daoHan) return { giu: false, lyDo: "daoHan", ...chung };
  if (dt == null) return { giu: false, lyDo: "chuaCoDongTien", ...chung };
  if (dt !== x.phia) return { giu: false, lyDo: "nguocChieu", ...chung };
  return { giu: true, lyDo: "cungChieu", ...chung };
}
// Ket qua lenh x (da giu qua dem) khi dong o 9:30 phien sau pSau (tachPhien). null neu phien sau chua co du lieu. xong = false: chua toi 9:30, gia la gia hien tai (tam tinh).
// Khong them phi (van la 1 vong mua - ban). diemThem = phan lai / lo them so voi dong 14:29.
export function ketQuaQuaDem(x, pSau) {
  if (!x || !x.phia || !pSau || pSau.kCuoi < 0) return null;
  const k = Math.min(K_RA_QUA_DEM, pSau.kCuoi);
  const gia = pSau.c[k];
  const diem = x.phia * (gia - x.vao.gia);
  const phi = phiVong(x.vao.gia);
  const gia1429 = x.ra ? x.ra.gia : null;
  return { xong: pSau.kCuoi >= K_RA_QUA_DEM, ra: { k, gia, gio: gioCuaPhut(k) }, diem, phi, diemSauPhi: diem - phi, gia1429, diemThem: gia1429 == null ? null : x.phia * (gia - gia1429) };
}
