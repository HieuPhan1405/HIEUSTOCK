// CHOT LOI TUNG PHAN (TP1 / TP2 / TP3) GHI THANH DONG "LENH DA DONG" NGAY LUC CHAM MOC - ham THUAN (khong dung DB), import tuong doi
// de test tay bang node (engine/test/chotLoiTungPhan.test.mjs). lib/lenhDaDong.js goi cac ham nay.
//
// KIEU MOI (moi vi the chua tung cham TP nao luc web bat dau theo doi, hoac da co dong TP1/TP2 tuong ung trong lenh_da_dong):
//   TP1 -> 1 dong (vong 5): chot 30% tai gia TP1, lai/lo = ty le gia CUA PHAN DO (gia TP1 / gia mua - 1).
//   TP2 -> 1 dong (vong 6): chot 30% tai gia TP2.
//   TP3 -> 1 dong (vong 1, ly_do TP3): CACH MOI (2026-09-25, ketThucTP3 = true) chot 40% tai gia TP3 = KET THUC LENH; CACH CU (mac dinh, lenh con phan chay)
//   chot 25% tai gia TP3 (kieu cu hon nua la 1 dong gop 85% - xem tinhChotTP3 trong lenhDaDong.js).
//   Dong lenh that su (BAN/cat lo/thoat Kijun...) -> chi dong PHAN CON LAI (70% / 40% neu moi cham TP1 / TP2; 15% neu da cham TP3 kieu cu - vong 3),
//   lai/lo = ty le gia cua phan con lai.
// KIEU CU (giu nguyen de khong tinh trung): vi the da cham TP1/TP2 TRUOC khi tinh nang nay chay ma chua co dong TP tuong ung - khi dong
//   van tinh gop co trong so TP1/TP2 vao 1 dong nhu truoc, va chot TP3 van la 1 dong gop 85%.
import { TY_LE_CHOT_KET_THUC, TY_LE_CHOT_CU } from "./tyLeChot.js";

export const VONG_TP = { 1: 5, 2: 6, 3: 1 }; // TP3 dung vong 1 giong kieu cu (dong "chot TP3")
// Ty le tung moc: PHAN_CHOT = cach CU (TP3 chi 25% vi con phan chay 15%) - dung khi phat hien lenh VAN DANG GIU sau khi cham TP; PHAN_CHOT_KET_THUC = cach MOI
// (TP3 40% va dong lenh) - dung khi engine/AFL bao lenh ket thuc o TP3.
const PHAN_CHOT = { 1: TY_LE_CHOT_CU.tp1, 2: TY_LE_CHOT_CU.tp2, 3: TY_LE_CHOT_CU.tp3 };
const PHAN_CHOT_KET_THUC = { 1: TY_LE_CHOT_KET_THUC.tp1, 2: TY_LE_CHOT_KET_THUC.tp2, 3: TY_LE_CHOT_KET_THUC.tp3 };

const dangGiu = (t) => t === "MUA" || t === "NAM GIU";
const duongSo = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const hangTP = (tp) => ({ TP1: 1, TP2: 2, TP3: 3 })[tp] ?? 0;

// daGhi: Set cac khoa "MA|yyyy-mm-dd|vong" (vong 5/6) da co trong lenh_da_dong (xem layTPDaGhi).
export const khoaTP = (ma, ngayMua, hang) => `${ma}|${ngayMua}|${VONG_TP[hang]}`;

// Tat ca moc TP1..TP(hang) cua vi the DA co dong tuong ung (hang <= 2; TP3 khong xet: dong TP3 co cach xu ly rieng).
function daCoDongDenHang(ma, ngayMua, hang, daGhi) {
  for (let k = 1; k <= Math.min(hang, 2); k++) if (!daGhi.has(khoaTP(ma, ngayMua, k))) return false;
  return true;
}

// Ban ghi cu (truoc upload) chua cham TP nao, hoac cac moc da cham deu da co dong -> theo doi kieu moi.
export function theoDoiKieuMoi(cu, daGhi) {
  let hang = hangTP(cu.tp_da_cham);
  if (hang === 0) return true;
  if (hang >= 3) {
    // Lenh CU da ghi dong TP3 (cach 30/30/25/15): giu kieu cu. Con lai TP3 chi la moc tham khao (cach 2 TP + giu den BAN): coi nhu moi cham TP2.
    if (daGhi.has(khoaTP(cu.ma, cu.ngay_mua_txt, 3))) return false;
    hang = 2;
  }
  return daCoDongDenHang(cu.ma, cu.ngay_mua_txt, hang, daGhi);
}

// dsMoi: [{ ma, tin, tp_da_cham, ngay_mua (yyyy-mm-dd), so_phien_giu, tp1, tp2, tp3 }] cua lan upload nay; banGhiCuTheoMa: dong tin_hieu TRUOC khi ghi de
// (co ma, tin, tp_da_cham, ngay_mua_txt, gia_vao_web, gia_mua, vao_tp1-3, tp1-3). Chi xet ma DANG GIU vua nang muc TP cao nhat da cham (cung 1 lenh).
// Tra ve { dong: [dong lenh_da_dong tu moc TP1/TP2/TP3 kieu moi], tp3KieuCu: [{ ma, cu, m }] - moc TP3 cua vi the kieu cu, lenhDaDong.js tinh dong gop 85% }.
// hangToiDa = 2 (mac dinh, cach 2 TP + giu den BAN): CHI ghi dong TP1/TP2; TP3 la moc tham khao nen khong ghi. ketThucTP3 = true (cach "3 moc ket thuc o TP3", khi AFL bat
// KetThucTaiTP3): ghi ca TP3 voi 40% (thay vi 25% cach cu).
export function phatHienChotLoiTungPhan({ dsMoi, banGhiCuTheoMa, ngayBan, daGhi = new Set(), ketThucTP3 = false, hangToiDa = 2 }) {
  const phanChot = ketThucTP3 ? PHAN_CHOT_KET_THUC : PHAN_CHOT;
  const toiDa = ketThucTP3 ? 3 : hangToiDa;
  const dong = [];
  const tp3KieuCu = [];
  for (const m of dsMoi) {
    if (m.ma === "VNINDEX" || !dangGiu(m.tin)) continue;
    const hangMoi = hangTP(m.tp_da_cham);
    const cu = banGhiCuTheoMa[m.ma];
    if (!hangMoi || !cu || !m.ngay_mua || cu.ngay_mua_txt !== m.ngay_mua) continue;
    const hangCu = hangTP(cu.tp_da_cham);
    if (hangMoi <= hangCu) continue;
    const kieuMoi = theoDoiKieuMoi(cu, daGhi);
    const giaMua = duongSo(cu.gia_vao_web) ?? duongSo(cu.gia_mua);
    for (let k = hangCu + 1; k <= Math.min(hangMoi, toiDa); k++) {
      if (!kieuMoi) {
        if (k === 3) tp3KieuCu.push({ ma: m.ma, cu, m });
        continue;
      }
      const gia = duongSo(cu[`vao_tp${k}`]) ?? duongSo(cu[`tp${k}`]) ?? duongSo(m[`tp${k}`]);
      if (!(giaMua > 0) || !(gia > giaMua)) continue;
      dong.push({
        ma: m.ma,
        ngay_mua: m.ngay_mua,
        gia_mua: giaMua,
        ngay_ban: ngayBan,
        gia_ban: gia,
        lai_lo_pct: (gia / giaMua - 1) * 100,
        so_phien: m.so_phien_giu != null ? Number(m.so_phien_giu) : null,
        ly_do: `TP${k}`,
        da_cham_tp: `TP${k}`,
        phan_chot_pct: phanChot[k],
        vong: VONG_TP[k],
      });
    }
  }
  return { dong, tp3KieuCu };
}

// Khi vi the DONG that su (BAN/cat lo/thoat) va da cham TP1/TP2 (chua TP3) - vi the co dong TP tuong ung thi chi con PHAN CON LAI dong lan nay
// (lai/lo = ty le gia cua phan con lai, phan_chot_pct = 70 hoac 40). Tra null neu la kieu cu (khong co dong TP) -> lenhDaDong.js tinh gop nhu truoc.
export function tinhDongPhanConLai({ cu, giaMua, giaBan, daGhi = new Set() }) {
  let hang = hangTP(cu.tp_da_cham);
  if (hang > 2) {
    if (daGhi.has(khoaTP(cu.ma, cu.ngay_mua_txt, 3))) return null; // lenh cu da ghi dong TP3: phan con lai xu ly rieng (vong 3)
    hang = 2; // TP3 chi la moc tham khao: phan con lai van la 100% - 30% - 30%
  }
  if (hang < 1 || !daCoDongDenHang(cu.ma, cu.ngay_mua_txt, hang, daGhi)) return null;
  let conLai = 100;
  for (let k = 1; k <= hang; k++) conLai -= PHAN_CHOT[k];
  return { lai_lo_pct: (giaBan / giaMua - 1) * 100, phan_chot_pct: conLai };
}

// NAP BU (chay 1 lan cho cac vi the DANG GIU da cham TP1/TP2 truoc khi tinh nang chay, chua co dong TP): tu lich su gia tim ngay cham tung moc.
// u: { ma, tin, gia_mua, gia_vao_web, tp1, tp2, vao_tp1, vao_tp2, tp_da_cham, so_phien_giu, ngay_mua_txt }; nen: [{ t, h }] tang dan (hoac null);
// ngayChamTP: ham (nen, ngayMua, gia) -> { ngay, soPhien } | null; ngayMacDinh: ngay dung khi khong xac dinh duoc. Bo qua dong da co trong daGhi.
export function dongNapBuTP12(u, nen, ngayChamTP, ngayMacDinh, daGhi = new Set()) {
  const hang = Math.min(hangTP(u.tp_da_cham), 2);
  const giaMua = duongSo(u.gia_vao_web) ?? duongSo(u.gia_mua);
  const ra = [];
  for (let k = 1; k <= hang; k++) {
    if (daGhi.has(khoaTP(u.ma, u.ngay_mua_txt, k))) continue;
    const gia = duongSo(u[`vao_tp${k}`]) ?? duongSo(u[`tp${k}`]);
    if (!(giaMua > 0) || !(gia > giaMua)) continue;
    const cham = nen ? ngayChamTP(nen, u.ngay_mua_txt, gia) : null;
    ra.push({
      ma: u.ma,
      ngay_mua: u.ngay_mua_txt,
      gia_mua: giaMua,
      ngay_ban: cham?.ngay ?? ngayMacDinh,
      gia_ban: gia,
      lai_lo_pct: (gia / giaMua - 1) * 100,
      so_phien: cham?.soPhien ?? (u.so_phien_giu != null ? Number(u.so_phien_giu) : null),
      ly_do: `TP${k}`,
      da_cham_tp: `TP${k}`,
      phan_chot_pct: PHAN_CHOT[k],
      vong: VONG_TP[k],
      ngayTuLichSuGia: !!cham,
    });
  }
  return ra;
}
