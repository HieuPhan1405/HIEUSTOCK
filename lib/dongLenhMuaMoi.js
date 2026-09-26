// LENH MUA MOI DA DONG (ham THUAN, khong dung DB - import tuong doi de test tay: engine/test/dongLenhMuaMoi.test.mjs). Duoc lib/lenhDaDong.js re-export.
import { TY_LE_CHOT } from "./tyLeChot.js";

const dangGiu = (t) => t === "MUA" || t === "NAM GIU";

// Muc TP da cham cua lenh mua moi -> bac chot tung phan (TP3 tinh nhu TP2: chi chot 30% o TP1 va 30% o TP2, TP3 la moc tham khao).
const bacTPMuaMoi = (v) => (v === "TP3" || v === "TP2" ? 2 : v === "TP1" ? 1 : 0);
// Phan vi the CON LAI cua lenh mua moi khi dong (sau khi da chot tung phan theo bac TP) - vd da cham TP2: con 40%.
const phanConLaiMuaMoi = (bac) => (bac >= 2 ? 100 - TY_LE_CHOT.tp1 - TY_LE_CHOT.tp2 : bac === 1 ? 100 - TY_LE_CHOT.tp1 : 100);
// Vong cua dong chot tung phan lenh MUA MOI (vong 4): 7 = TP1, 8 = TP2 (lenh dau dung 5/6).
export const VONG_TP_MUA_MOI = { 1: 7, 2: 8 };

// LENH MUA MOI CHOT GIONG LENH MUA (2026-09-27): 30% o TP1, 30% o TP2 rieng cua lenh mua moi, 40% con lai giu den tin hieu BAN / cat lo rieng / hoa von sau TP2.
// Ghi 1 dong cho moi moc da cham (vong 7 / 8, phan_chot_pct 30, gia ban = dung muc TP) - lenh dang giu (theo dong moi) hoac vua dong hom nay (theo dong cu).
// Ghi lai moi lan upload van an toan: UNIQUE (ma, ngay_mua, vong) + DO NOTHING giu dong ghi lan dau. dsMoi: [{ ma, dang_giu_giua, ngay_mua_giua, gia_mua_giua, tp1_giua,
// tp2_giua (gia da dong bang tren web), tp_da_cham_giua }].
export function phatHienChotLoiMuaMoi({ dsMoi, banGhiCuTheoMa, ngayBan }) {
  const ketQua = [];
  for (const m of dsMoi) {
    const cu = banGhiCuTheoMa[m.ma];
    const lenh =
      m.dang_giu_giua === true && m.ngay_mua_giua
        ? { ngay: m.ngay_mua_giua, giaMua: Number(m.gia_mua_giua), tp: [Number(m.tp1_giua), Number(m.tp2_giua)] }
        : cu?.dang_giu_giua === true && cu.ngay_mua_giua_txt
          ? { ngay: cu.ngay_mua_giua_txt, giaMua: Number(cu.gia_mua_giua), tp: [Number(cu.tp1_giua), Number(cu.tp2_giua)] }
          : null;
    if (!lenh || !(lenh.giaMua > 0)) continue;
    const cuCungLenh = cu && cu.ngay_mua_giua_txt === lenh.ngay ? cu.tp_da_cham_giua : null;
    const bac = Math.max(bacTPMuaMoi(m.tp_da_cham_giua), bacTPMuaMoi(cuCungLenh));
    for (let b = 1; b <= bac; b++) {
      const gia = lenh.tp[b - 1];
      if (!(gia > lenh.giaMua)) continue;
      ketQua.push({
        ma: m.ma,
        ngay_mua: lenh.ngay,
        gia_mua: lenh.giaMua,
        ngay_ban: ngayBan,
        gia_ban: gia,
        lai_lo_pct: (gia / lenh.giaMua - 1) * 100,
        so_phien: null,
        ly_do: `TP${b}`,
        da_cham_tp: `TP${b}`,
        phan_chot_pct: b === 1 ? TY_LE_CHOT.tp1 : TY_LE_CHOT.tp2,
        vong: VONG_TP_MUA_MOI[b],
      });
    }
  }
  return ketQua;
}

// LENH MUA THEM (vi the PHU, doc lap voi lenh goc) DONG LAI - TONG QUAT HOA cho ca vong 2 ("Mua
// them sau TP3") va vong moi ("Mua them giua chung", bo sung 2026-09-23) qua tham so cotTienTo
// ("moi" hoac "giua") + vong (2 hoac 4). Vi the phu co gia mua/Stop-loss/ngay mua RIENG, tach khoi
// lenh goc.
// dsMoi: [{ ma, tin, gia, [dang_giu_<to>], [cat_<to>] }] cua lan upload nay; banGhiCuTheoMa: dong
// DB TRUOC khi ghi de (co [dang_giu_<to>], [gia_mua_<to>], [stop_<to>], [ngay_mua_<to>_txt]). Chi
// xet ma lan truoc DANG giu vi the phu.
//  - Lenh goc bi Ban / thoat, hoac AFL bao cat_<to> > 0: dong (cat=1: cham Stop-loss rieng, khop
//    tai Stop-loss hoac gia thap hon; cat=2: dong THEO lenh goc).
//  - AFL het bao giu vi the phu ma khong co su kien dong: neu vao lenh HOM NAY thi coi la tin hieu
//    trong phien doi chieu -> khong ghi; neu vao tu truoc do thi ghi dong theo gia hien tai.
export function phatHienDongMuaThem({ dsMoi, banGhiCuTheoMa, ngayBan, vong, cotTienTo }) {
  const kDangGiu = `dang_giu_${cotTienTo}`;
  const kCat = `cat_${cotTienTo}`;
  const kGiaMua = `gia_mua_${cotTienTo}`;
  const kStop = `stop_${cotTienTo}`;
  const kNgayMuaTxt = `ngay_mua_${cotTienTo}_txt`;
  const ketQua = [];
  for (const m of dsMoi) {
    const cu = banGhiCuTheoMa[m.ma];
    if (!cu || cu[kDangGiu] !== true || !cu[kNgayMuaTxt] || !(Number(cu[kGiaMua]) > 0)) continue;
    const giaBan = Number(m.gia);
    if (!(giaBan > 0)) continue;
    const gocConGiu = dangGiu(m.tin);
    const catRieng = Number(m[kCat]) === 1;
    const catHoaVon = Number(m[kCat]) === 3; // da cham TP2 roi gia ve lai gia mua (Stop-loss phan con lai doi ve hoa von)
    const catTheoGoc = !gocConGiu || Number(m[kCat]) === 2;
    if (m[kDangGiu] === true && gocConGiu) continue; // van dang giu vi the phu
    let lyDo;
    if (catRieng) lyDo = "CAT_LO";
    else if (catHoaVon) lyDo = "BAO_VE_LAI";
    else if (catTheoGoc) lyDo = m.tin === "BAN" ? "BAN" : "THOAT";
    else if (cu[kNgayMuaTxt] >= ngayBan) continue; // vao lenh hom nay roi mat tin hieu: doi chieu trong phien, khong ghi
    else lyDo = "THOAT";
    const giaMua = Number(cu[kGiaMua]);
    const stop = Number(cu[kStop]);
    const giaThoat = catRieng && stop > 0 ? Math.min(stop, giaBan) : catHoaVon ? Math.min(giaMua, giaBan) : giaBan;
    // Lenh mua moi (giua) da chot tung phan o TP1/TP2 (dong vong 7/8) -> dong nay chi la PHAN CON LAI; lai/lo la ty le gia cua phan do. Lenh khong co cot muc TP (vd mua moi
    // sau TP3 - vong 2) van dong 100% nhu cu.
    const kTP = `tp_da_cham_${cotTienTo}`;
    const phanConLai = phanConLaiMuaMoi(Math.max(bacTPMuaMoi(m[kTP]), bacTPMuaMoi(cu[kTP])));
    ketQua.push({
      ma: m.ma,
      ngay_mua: cu[kNgayMuaTxt],
      gia_mua: giaMua,
      ngay_ban: ngayBan,
      gia_ban: giaThoat,
      lai_lo_pct: (giaThoat / giaMua - 1) * 100,
      so_phien: null,
      ly_do: lyDo,
      da_cham_tp: m[kTP] || cu[kTP] || null,
      phan_chot_pct: phanConLai,
      vong,
    });
  }
  return ketQua;
}
