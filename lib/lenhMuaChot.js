// LENH MUA DA CHOT TRONG KHUNG GIO (2026-09-28) - ham THUAN, khong dung DB (import tuong doi de test tay: engine/test/lenhMuaChot.test.mjs). Ghi / doc DB: lib/lenhMuaChotDb.js.
// Tin hieu MUA / Mua moi hien TRONG khung gio vao lenh (lib/khungGioVaoLenh.js) = nguoi dung da mua that -> web ghi lai (lenh_mua_chot). Du lieu real-time tinh lai moi 10 giay
// nen tin hieu co the MAT trong phien (vd GMD 28/09: gia tut xuong duoi dinh may). Khi do he thong khong con giu lenh nhung nguoi dung van cam co phieu -> WEB TU GIU lenh:
//  - Chot 30% o TP1, 30% o TP2 (gia TP luc mua); sau TP2 muc cat lo doi ve gia mua (hoa von).
//  - Cat lo khi gia <= muc cat lo luc mua; BAN khi diem <= -1,5 du 3 phien lien (dung luat ban cua he thong: exitTh 1,5, 3 phien xac nhan).
//  - He thong quay lai giu DUNG lenh do (cung ngay mua) thi de he thong quan ly nhu thuong; he thong dong lenh do thi lenh da chot cung ket thuc.
// Ban / cat lo van theo khung gio (ghiLenhDaDong + doiSoatLenhDaDong). Lenh mua moi ngay khac cua cung ma la lenh RIENG (danh so (1), (2)).
import { lenhDangMo, ngayChuoi } from "./muaThemTinhToan.js";
import { TY_LE_CHOT } from "./tyLeChot.js";

export const NGUONG_DIEM_BAN = -1.5;
export const SO_PHIEN_XAC_NHAN_BAN = 3;
// XAC NHAN TIN HIEU TRUOC KHI CHOT (2026-10-09): tin hieu MUA / Mua giua chung moi xuat hien HOM NAY phai dung vung lien tuc it nhat SO_PHUT_XAC_NHAN_MUA phut (qua cac lan cap nhat) moi
// duoc ghi la "da mua that" - tin hieu thoang hien roi mat trong phien (nhap nhay) khong tao lenh web giu nua. Mat 1 lan cap nhat -> dem lai tu dau. Cach nhau > KHOANG_MAT_TOI_DA_PHUT
// giua 2 lan cap nhat (engine tat, nghi trua) cung coi la dut. Tin hieu cua phien truoc (ngay_mua < hom nay) da duoc xac nhan luc dong cua nen khong phai cho.
export const SO_PHUT_XAC_NHAN_MUA = 10;
export const KHOANG_MAT_TOI_DA_PHUT = 5;
// THOAT SOM LENH WEB GIU (2026-10-09): lenh web giu (tin hieu he thong da mat) ma sau SO_PHIEN_THOAT_SOM phien giao dich van chua cham TP1 va gia dang duoi gia mua -> dong o khung gio ke tiep
// (ly do THOAT_SOM), khong treo den khi cham cat lo xa hay diem thap 3 phien.
export const SO_PHIEN_THOAT_SOM = 2;

// Vong trong lenh_da_dong: lenh dau dong = 1 (chot TP1/TP2 = 5/6), lenh mua moi dong = 4 (chot TP1/TP2 = 7/8).
const VONG = { goc: { dong: 1, TP1: 5, TP2: 6 }, giua: { dong: 4, TP1: 7, TP2: 8 } };
const so = (v) => (v != null && Number.isFinite(Number(v)) ? Number(v) : null);

// So phien giao dich (T2-T6, chua tinh ngay le) tu sau ngay `tu` den het ngay `den` ("yyyy-mm-dd"): 09/10 (T6) -> 13/10 (T3) = 2.
export function soPhienGiaoDich(tu, den) {
  const a = Date.parse(tu + "T00:00:00Z");
  const b = Date.parse(den + "T00:00:00Z");
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  let dem = 0;
  for (let t = a + 86400e3; t <= b; t += 86400e3) {
    const thu = new Date(t).getUTCDay();
    if (thu !== 0 && thu !== 6) dem++;
  }
  return dem;
}

const khoaUngVien = (x) => `${x.ma}|${x.loai}|${x.ngay_mua}`;

// Loc ung vien chot mua theo luat xac nhan 10 phut. ungVien: tu ungVienChotMua (moi lan cap nhat, ke ca ngoai khung - de dem thoi gian tin hieu da dung vung);
// daTheoDoi: Map khoa -> { thay_dau, thay_cuoi } (ms) tu lan cap nhat truoc; ngay: phien hien tai "yyyy-mm-dd"; bayGioMs: thoi diem lan cap nhat nay.
// -> { duocChot: ung vien du dieu kien, theoDoiMoi: Map khoa -> { ...ung vien, thay_dau, thay_cuoi } cho cac ung vien CUA HOM NAY (thay cho toan bo bang theo doi cu) }.
export function xacNhanUngVien({ ungVien, daTheoDoi = new Map(), ngay, bayGioMs, soPhut = SO_PHUT_XAC_NHAN_MUA, khoangMatPhut = KHOANG_MAT_TOI_DA_PHUT }) {
  const duocChot = [];
  const theoDoiMoi = new Map();
  for (const x of ungVien) {
    if (x.ngay_mua !== ngay) {
      duocChot.push(x);
      continue;
    }
    const k = khoaUngVien(x);
    const cu = daTheoDoi.get(k);
    const lienTuc = cu && bayGioMs - cu.thay_cuoi <= khoangMatPhut * 60e3;
    const thayDau = lienTuc ? cu.thay_dau : bayGioMs;
    theoDoiMoi.set(k, { ...x, thay_dau: thayDau, thay_cuoi: bayGioMs });
    if (bayGioMs - thayDau >= soPhut * 60e3) duocChot.push(x);
  }
  return { duocChot, theoDoiMoi };
}

// Lenh can chot mua o lan cap nhat nay (goi khi DANG trong khung gio): MOI lenh he thong dang giu (lenh dau MUA / NAM GIU + lenh Mua moi) - tin hieu MUA hien ngoai khung
// (vd sau 14:45, he thong xac nhan cuoi phien) thi den khung sau van con giu moi chot. Lenh da chot roi thi bo qua (trung khoa). Lenh web giu khong tinh (da co ban ghi).
export function ungVienChotMua(tatCa) {
  return lenhDangMo(tatCa)
    // lenh_web === true: dong lenh WEB GIU (dongTuLenhWeb). Dong lenh he thong sao chep tu row co the mang theo MANG row.lenh_web (cac lenh web giu cua ma) - khong phai co "web giu", dung !l.lenh_web se bo sot lenh moi cua ma da co lenh web giu (loi GVR 07/10/2026).
    .filter((l) => l.lenh_web !== true && (l.la_lenh_moi ? l.loai_lenh_moi === "giua" : l.tin === "MUA" || l.tin === "NAM GIU"))
    .map((l) => ({
      ma: l.ma,
      loai: l.la_lenh_moi ? "giua" : "goc",
      ngay_mua: ngayChuoi(l.ngay_mua),
      gia_mua: so(l.gia_mua),
      gia_kich_hoat: so(l.gia_kich_hoat),
      stop_loss: so(l.stop_loss),
      tp1: so(l.tp1),
      tp2: so(l.tp2),
      tp3: so(l.tp3),
    }))
    .filter((x) => x.ngay_mua && x.gia_mua > 0);
}

// Gan MUC CAT LO + stop / TP luc mua vao dong cat lo / hoa von sap ghi (lenh_da_dong) - de lenh dang THEO DOI chi cat khi gia <= muc cat lo TRONG khung gio, va neu huy
// thi chuyen thanh lenh web giu voi dung stop / TP luc mua (xem lib/khungGioVaoLenh.js xuLyLenhTheoDoi). cu: dong tin_hieu TRUOC lan upload nay.
export function themMucCatLo(d, cu) {
  if (d.ly_do !== "CAT_LO" && d.ly_do !== "BAO_VE_LAI") return d;
  const c = cu ?? {};
  if (d.vong === 4) {
    const stopGoc = so(c.stop_giua) > 0 ? so(c.stop_giua) : null;
    return { ...d, muc_cat_lo: d.ly_do === "BAO_VE_LAI" ? (so(c.gia_mua_giua) ?? so(d.gia_mua)) : stopGoc, stop_goc: stopGoc, tp1_goc: so(c.tp1_giua), tp2_goc: so(c.tp2_giua), tp3_goc: so(c.tp3_giua) };
  }
  const duong = (v) => (so(v) > 0 ? so(v) : null);
  const stopGoc = duong(c.vao_stop_loss) ?? duong(c.stop_loss);
  return {
    ...d,
    muc_cat_lo: d.ly_do === "BAO_VE_LAI" ? (duong(c.stop_bao_ve) ?? duong(d.gia_mua)) : stopGoc,
    stop_goc: stopGoc,
    tp1_goc: duong(c.vao_tp1) ?? duong(c.tp1),
    tp2_goc: duong(c.vao_tp2) ?? duong(c.tp2),
    tp3_goc: duong(c.vao_tp3) ?? duong(c.tp3),
  };
}

// He thong (AFL / engine) dang giu DUNG lenh nay khong (cung loai, cung ngay mua).
export function heThongDangGiu(l, row) {
  if (!row) return false;
  if (l.loai === "giua") return row.dang_giu_giua === true && ngayChuoi(row.ngay_mua_giua) === l.ngay_mua;
  return (row.tin === "MUA" || row.tin === "NAM GIU") && ngayChuoi(row.ngay_mua) === l.ngay_mua;
}

// Danh gia 1 lenh da chot (dang mo) o moi lan cap nhat.
//  l: dong lenh_mua_chot (ngay_mua / ngay_diem dang "yyyy-mm-dd"); row: dong tin hieu moi nhat cua ma (co gia, diem, tin, ngay_mua...);
//  daGhi: Set cac vong da co trong lenh_da_dong cua (ma, ngay_mua); ngay: phien hien tai "yyyy-mm-dd".
// -> { capNhat: truong cua lenh_mua_chot can ghi, dongMoi: cac dong lenh_da_dong can ghi (chot TP / dong lenh) }.
// trongKhung: dang trong khung gio vao lenh - cat lo / hoa von CHI khi gia <= muc cat lo TRONG khung (ngoai khung bo qua, lenh giu tiep).
export function danhGiaLenhMuaChot({ l, row, daGhi = new Set(), ngay, trongKhung = true }) {
  const v = VONG[l.loai] ?? VONG.goc;
  // He thong da tu dong lenh nay (dong thuong / phan con lai sau TP3 kieu cu) -> lenh da chot cung ket thuc.
  if (daGhi.has(v.dong) || (l.loai === "goc" && daGhi.has(3))) return { capNhat: { trang_thai: "dong", web_giu: false }, dongMoi: [] };
  if (heThongDangGiu(l, row)) return { capNhat: { web_giu: false, web_giu_tu: null }, dongMoi: [] };

  const gia = so(row?.gia);
  const giaMua = so(l.gia_mua);
  if (!(gia > 0) || !(giaMua > 0)) return { capNhat: { web_giu: true }, dongMoi: [] };

  const goc = { ma: l.ma, ngay_mua: l.ngay_mua, gia_mua: giaMua, ngay_ban: ngay, so_phien: null };
  const dongMoi = [];
  let daTP1 = l.tp_da_cham === "TP1" || l.tp_da_cham === "TP2" || daGhi.has(v.TP1);
  let daTP2 = l.tp_da_cham === "TP2" || daGhi.has(v.TP2);
  for (const [k, w] of [["TP1", TY_LE_CHOT.tp1], ["TP2", TY_LE_CHOT.tp2]]) {
    const tp = so(l[k.toLowerCase()]);
    if (!(tp > giaMua) || gia < tp) continue;
    if (!daGhi.has(v[k])) dongMoi.push({ ...goc, gia_ban: tp, lai_lo_pct: (tp / giaMua - 1) * 100, ly_do: k, da_cham_tp: k, phan_chot_pct: w, vong: v[k] });
    if (k === "TP1") daTP1 = true;
    else daTP1 = daTP2 = true;
  }
  const tpDaCham = daTP2 ? "TP2" : daTP1 ? "TP1" : null;
  const conLai = 100 - (daTP1 ? TY_LE_CHOT.tp1 : 0) - (daTP2 ? TY_LE_CHOT.tp2 : 0);

  // Dem phien DIEM THAP lien tiep: so_phien_diem_thap = so phien DA KET THUC (truoc ngay_diem) co diem cuoi phien <= -1,5; sang phien moi thi chot phien truoc.
  let soPhienTruoc = Number(l.so_phien_diem_thap) || 0;
  if (l.ngay_diem && l.ngay_diem !== ngay) soPhienTruoc = so(l.diem_cuoi) != null && so(l.diem_cuoi) <= NGUONG_DIEM_BAN ? soPhienTruoc + 1 : 0;
  const diem = so(row?.diem);
  const webGiuTu = l.web_giu_tu || ngay; // ngay dau tien he thong khong con giu lenh nay (web tu giu)
  const capNhat = { web_giu: true, web_giu_tu: webGiuTu, tp_da_cham: tpDaCham, so_phien_diem_thap: soPhienTruoc, ngay_diem: ngay, diem_cuoi: diem };

  const stop = daTP2 ? giaMua : so(l.stop_loss);
  let lyDo = null;
  if (stop > 0 && gia <= stop && trongKhung) lyDo = daTP2 ? "BAO_VE_LAI" : "CAT_LO";
  else if (diem != null && diem <= NGUONG_DIEM_BAN && soPhienTruoc + 1 >= SO_PHIEN_XAC_NHAN_BAN) lyDo = "BAN";
  else if (!daTP1 && gia < giaMua && soPhienGiaoDich(webGiuTu, ngay) >= SO_PHIEN_THOAT_SOM) lyDo = "THOAT_SOM";
  if (lyDo) {
    dongMoi.push({ ...goc, gia_ban: gia, lai_lo_pct: (gia / giaMua - 1) * 100, ly_do: lyDo, da_cham_tp: tpDaCham, phan_chot_pct: conLai, vong: v.dong });
    capNhat.trang_thai = "dong";
  }
  return { capNhat, dongMoi };
}
