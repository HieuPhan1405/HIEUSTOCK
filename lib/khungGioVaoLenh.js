// Ham THUAN, KHONG dung DB - dung chung giua components/DongHoGiaoDich.js (dong ho chi tiet,
// co dem nguoc) va components/KhungGioContext.js (chi can 1 gia tri boolean cho SignalPill mo/sang).
// Doi khung gio: sua o day la ap dung ca 2 noi.
export const KHUNG_VAO_LENH = [
  { tu: 10 * 60 + 30, den: 11 * 60 + 30 },
  { tu: 14 * 60, den: 14 * 60 + 45 },
];

function layPhutVN(d) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const lay = (loai) => parts.find((p) => p.type === loai)?.value;
  return { thu: lay("weekday"), phut: (Number(lay("hour")) % 24) * 60 + Number(lay("minute")) };
}

// TIN HIEU CHI TU 9H15 (2026-10-03): 9:00-9:15 la phien khop lenh dinh ky mo cua (ATO) - gia/nen hom nay chua on dinh, tin hieu de nhay (bao MUA/BAN roi doi ngay khi vao phien lien tuc).
// Trong khoang nay engine KHONG tinh lai/upload va /api/upload-signals bo qua lan upload (khong doi tin hieu, khong dong bang gia mua, khong bao Zalo/chuong). Ngoai khoang nay khong doi gi.
export const GIO_MO_PHIEN_PHUT = 9 * 60; // 09:00
export const GIO_BAT_DAU_TIN_HIEU_PHUT = 9 * 60 + 15; // 09:15
export function dangTrongPhienDinhKyMoCua(d = new Date()) {
  const { thu, phut } = layPhutVN(d);
  if (thu === "Sat" || thu === "Sun") return false;
  return phut >= GIO_MO_PHIEN_PHUT && phut < GIO_BAT_DAU_TIN_HIEU_PHUT;
}

// Dang o trong 1 trong cac khung gio duoc phep vao lenh MUA (T2-T6, gio Viet Nam) hay khong.
export function dangTrongKhungVaoLenh(d = new Date()) {
  const { thu, phut } = layPhutVN(d);
  if (thu === "Sat" || thu === "Sun") return false;
  return KHUNG_VAO_LENH.some((k) => phut >= k.tu && phut < k.den);
}

// CHOT BAN THEO KHUNG GIO (2026-09-28): lenh BAN theo tin hieu va CAT LO chi "chot" trong khung gio vao lenh. Tin hieu xuat hien NGOAI khung = THEO DOI (cho),
// den gio MO cua khung ke tiep ma lenh van dong thi chot o gia lan cap nhat dau tien tu luc do (xem doiSoatLenhDaDong). Ban bot o TP1/TP2 (lenh cho san o gia TP) khong cho.
// ly_do cua lenh_da_dong: BAN / THOAT / THOAT_KIJUN = ban theo tin hieu; CAT_LO / BAO_VE_LAI (hoa von sau TP2) = cat lo.
const LY_DO_CHO_KHUNG = new Set(["BAN", "THOAT", "THOAT_KIJUN", "THOAT_SOM", "CAT_LO", "BAO_VE_LAI"]);
export const canChoKhung = (lyDo) => LY_DO_CHO_KHUNG.has(lyDo);

const LECH_VN = 7 * 3600e3; // gio Viet Nam = UTC+7, khong doi gio mua he

// Gio MO cua khung vao lenh gan nhat SAU thoi diem `luc` (bo T7, CN; chua tinh ngay le) - Date.
export function batDauKhungKeTiep(luc = new Date()) {
  const t = new Date(luc).getTime();
  const vn = new Date(t + LECH_VN);
  const nuaDem = Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()) - LECH_VN; // 00:00 gio VN cua ngay do
  for (let ngay = 0; ngay < 8; ngay++) {
    const goc = nuaDem + ngay * 86400e3;
    const thu = new Date(goc + LECH_VN).getUTCDay();
    if (thu === 0 || thu === 6) continue;
    for (const k of KHUNG_VAO_LENH) {
      const batDau = goc + k.tu * 60e3;
      if (batDau > t) return new Date(batDau);
    }
  }
  return null;
}

// Gio MO cua khung vao lenh DANG dien ra luc `luc` (Date) - null neu luc do ngoai khung.
export function batDauKhungHienTai(luc = new Date()) {
  const t = new Date(luc).getTime();
  const vn = new Date(t + LECH_VN);
  const phut = vn.getUTCHours() * 60 + vn.getUTCMinutes();
  const thu = vn.getUTCDay();
  if (thu === 0 || thu === 6) return null;
  const k = KHUNG_VAO_LENH.find((x) => phut >= x.tu && phut < x.den);
  if (!k) return null;
  return new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()) - LECH_VN + k.tu * 60e3);
}

// CAT LO PHAT HIEN TRONG KHUNG nhung CO THE da cham tu truoc khung: lan cap nhat truoc (lucTruoc) con o TRUOC gio mo khung hien tai va gia bay gio van TREN muc cat lo
// -> khong biet gia cham luc nao (vd engine khoi dong lai 10:31, gia cham 9:20 roi hoi) -> chua cat, treo THEO DOI (da thay trong khung) de ap luat "chi cat khi cham trong khung".
export function catLoCanChoKhung({ lyDo, gia, mucCatLo, lucTruoc, bayGio = new Date() }) {
  if (lyDo !== "CAT_LO" && lyDo !== "BAO_VE_LAI") return false;
  const batDau = batDauKhungHienTai(bayGio);
  if (!batDau || !(Number(mucCatLo) > 0) || !(Number(gia) > Number(mucCatLo))) return false;
  return !lucTruoc || new Date(lucTruoc).getTime() < batDau.getTime();
}

// Lenh ban ghi luc `taoLuc` (ngoai khung) da den luc chot chua: tu gio mo khung ke tiep tro di.
export function daDenLucChot(taoLuc, bayGio = new Date()) {
  const moc = batDauKhungKeTiep(taoLuc);
  return moc != null && new Date(bayGio).getTime() >= moc.getTime();
}

// Chu "chờ khung ..." cho lenh dang THEO DOI: "10:30" / "14:00" neu cung ngay voi bayGio, khac ngay thi "10:30 phiên sau".
export function nhanKhungKeTiep(taoLuc, bayGio = new Date()) {
  const moc = batDauKhungKeTiep(taoLuc);
  if (!moc) return "";
  const ngay = (d) => new Date(new Date(d).getTime() + LECH_VN).toISOString().slice(0, 10);
  const gio = new Date(moc.getTime() + LECH_VN).toISOString().slice(11, 16);
  return ngay(moc) === ngay(bayGio) ? gio : `${gio} phiên sau`;
}

// MUA DANG THEO DOI (chua chot mua): tin hieu MUA NGOAI khung gio -> THEO DOI; lenh he thong dang giu (NAM GIU) ma web chua chot mua (khong co lenh_mua_chot) va lan dau
// thay tin hieu MUA (muaTheoDoiTu - tin_hieu_xuat_hien.luc_hien) o ngoai khung, chua toi gio mo khung ke tiep -> van THEO DOI. Vao khung ma he thong con giu thi web chot mua.
export function muaDangTheoDoi({ tin, muaTheoDoiTu = null, daChotMua = false, trongKhung, bayGio = new Date() }) {
  if (daChotMua) return false; // da chot mua trong khung - khong con theo doi
  if (tin === "MUA") return !trongKhung;
  if (tin === "NAM GIU" && muaTheoDoiTu) return !trongKhung && !daDenLucChot(muaTheoDoiTu, bayGio);
  return false;
}

// XU LY 1 LENH BAN DANG THEO DOI (chot_luc NULL) o lan cap nhat nay -> "chot" | "cho" | "huy" (+ thayTrongKhung).
//  - Cat lo / hoa von (co muc_cat_lo): CHI cat khi gia <= muc cat lo TRONG khung gio. Trong khung ma gia van tren muc cat lo -> cho (ghi nhan da thay trong khung);
//    ra khoi khung ma da thay trong khung (chua cham) -> HUY lenh ban (gia chi thung muc cat lo ngoai khung roi hoi lai - nguoi dung khong ban), web giu lenh tiep.
//    Khong co lan cap nhat nao trong khung (vd chi day du lieu sau gio dong cua) thi khong biet gia trong khung -> tu gio mo khung ke tiep chot o gia luc do nhu ban thuong.
//  - Ban theo tin hieu: tu gio mo khung ke tiep chot o gia luc do (tin hieu quay lai nam giu thi doi soat da mo lai lenh truoc do).
// d: { ly_do, muc_cat_lo, thay_trong_khung, tao_luc }; gia: gia moi nhat.
export function xuLyLenhTheoDoi(d, gia, bayGio = new Date()) {
  const trong = dangTrongKhungVaoLenh(new Date(bayGio));
  const catLo = (d.ly_do === "CAT_LO" || d.ly_do === "BAO_VE_LAI") && Number(d.muc_cat_lo) > 0;
  if (catLo) {
    if (trong) return Number(gia) <= Number(d.muc_cat_lo) ? { ketQua: "chot" } : { ketQua: "cho", thayTrongKhung: true };
    if (d.thay_trong_khung) return { ketQua: "huy" };
  }
  return daDenLucChot(d.tao_luc, bayGio) ? { ketQua: "chot" } : { ketQua: "cho", thayTrongKhung: d.thay_trong_khung === true };
}

// Dang trong PHIEN GIAO DICH noi chung (9h-15h, T2-T6) hay khong - RONG HON dangTrongKhungVaoLenh
// (chi 2 khung hep de dat lenh MUA). Dung de quyet dinh co dang cho tu dong lam moi trang khong -
// ngoai khung nay tin hieu chac chan khong doi, khong can goi lai server lam gi.
export function dangTrongPhienGiaoDich(d = new Date()) {
  const { thu, phut } = layPhutVN(d);
  if (thu === "Sat" || thu === "Sun") return false;
  return phut >= 9 * 60 && phut < 15 * 60;
}
