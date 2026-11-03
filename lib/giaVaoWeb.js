// GIA MUA + STOP-LOSS + TP GHI NHAN LUC MA LAN DAU CHUYEN SANG MUA.
//
// Khi upload giua phien, "gia" tu AmiBroker la gia MOI NHAT nen moi lan upload
// lai gia mua (va Stop-loss/TP tinh tu no) se doi theo gia hien tai. Ham nay
// quyet dinh bo gia tri web se DONG BANG:
//  - Ma lan dau hien MUA (truoc do khong giu lenh)   -> ghi nhan gia + SL + TP1-3 luc do.
//  - Ma dang giu, da co ghi nhan, cung lan mua        -> giu nguyen ban ghi cu.
//  - Ma khong con giu (TRUNG LAP / BAN)               -> xoa ghi nhan.
//  - Ngay mua doi (ban roi mua lai giua 2 lan upload) -> coi la lenh moi.
//  - Ma dang NAM GIU nhung chua tung duoc ghi nhan (vd giu tu truoc khi co tinh
//    nang nay, hoac upload bo qua ngay MUA) -> khong co ban ghi, web dung so cua AFL.
//
// tinMoi: "MUA" | "NAM GIU" | ...; ngayMuaMoi: "yyyy-mm-dd" | null;
// giaTriMoi: { gia, stop_loss, tp1, tp2, tp3 } (so | null) cua lan upload nay;
// cheDoVao: "MOI" | "CU" | null - che do vao lenh cua AFL (cot che_do_vao). O che do
//   MOI AFL da tu dong bang gia vao (moc chuyen mua) + SL cau truc nen KHONG ghi nhan them;
// cu: dong DB truoc khi ghi de { tin, gia_mua (AFL lan truoc), gia_vao_web, thoi_diem_vao_web, vao_stop_loss,
//     vao_tp1, vao_tp2, vao_tp3, ngay_mua_txt } | undefined.
// Tra ve { gia, luc, stop_loss, tp1, tp2, tp3 } (tat ca null neu khong ghi nhan).
const TRONG = { gia: null, luc: null, stop_loss: null, tp1: null, tp2: null, tp3: null };

// SAU NGAY CHIA QUYEN (co tuc bang co phieu / thuong CP / tach CP): gia da dong bang la gia THO, trong khi gia mua cua AFL/engine (giaMuaMoi - gia vao cua chinh lenh, khong doi trong
// suot thoi gian giu) duoc dieu chinh. Neu giaMuaMoi lech > NGUONG_HE_SO_CHIA_QUYEN so voi gia_mua cua lan upload truoc (cu.gia_mua - cung nguon nen khong dinh troi gia trong phien)
// thi co dong quyen: nhan gia vao + Stop-loss + TP da dong bang voi he so do (vd TCB 29/10/2026 chia 100:50 -> x 2/3; truoc day lenh bi ghi "cat lo -33,49%" gia).
// Ngay vao lenh (ngayMuaMoi >= homNay) gia mua con dang bien dong nen khong dieu chinh; khong truyen homNay = giu hanh vi cu.
export const NGUONG_HE_SO_CHIA_QUYEN = 0.02;

export function heSoChiaQuyen({ giaMuaMoi, giaMuaCu, ngayMuaMoi, homNay }) {
  if (!homNay || !ngayMuaMoi || ngayMuaMoi >= homNay) return 1;
  const moi = Number(giaMuaMoi), cu = Number(giaMuaCu);
  if (!(moi > 0) || !(cu > 0)) return 1;
  const heSo = moi / cu;
  return Math.abs(heSo - 1) > NGUONG_HE_SO_CHIA_QUYEN ? heSo : 1;
}

const nhanGia = (v, heSo) => (v == null ? null : heSo === 1 ? v : Math.round(v * heSo * 100) / 100);

export function tinhGiaVaoWeb({ tinMoi, giaTriMoi, ngayMuaMoi, cu, bayGio, cheDoVao, giaMuaMoi, homNay }) {
  const dangGiu = (t) => t === "MUA" || t === "NAM GIU";
  if (!dangGiu(tinMoi) || cheDoVao === "MOI") return TRONG;

  const cuDangGiu = !!cu && dangGiu(cu.tin);
  // Thieu ngay o 1 trong 2 ben thi coi nhu cung lan mua (khong du co so de bao khac).
  const cungLanMua = cuDangGiu && (!cu.ngay_mua_txt || !ngayMuaMoi || cu.ngay_mua_txt === ngayMuaMoi);

  if (cungLanMua && cu.gia_vao_web != null) {
    const k = heSoChiaQuyen({ giaMuaMoi, giaMuaCu: cu.gia_mua, ngayMuaMoi, homNay });
    return {
      gia: nhanGia(cu.gia_vao_web, k),
      luc: cu.thoi_diem_vao_web,
      stop_loss: nhanGia(cu.vao_stop_loss ?? null, k),
      tp1: nhanGia(cu.vao_tp1 ?? null, k),
      tp2: nhanGia(cu.vao_tp2 ?? null, k),
      tp3: nhanGia(cu.vao_tp3 ?? null, k),
    };
  }
  if (tinMoi === "MUA" && !cungLanMua && giaTriMoi.gia != null) {
    return {
      gia: giaTriMoi.gia,
      luc: bayGio,
      stop_loss: giaTriMoi.stop_loss ?? null,
      tp1: giaTriMoi.tp1 ?? null,
      tp2: giaTriMoi.tp2 ?? null,
      tp3: giaTriMoi.tp3 ?? null,
    };
  }
  return TRONG;
}

// Dong bang gia/SL/TP luc vao 1 VI THE PHU (vong "Mua them sau TP3" hoac vong moi "Mua them giua
// chung") - TONG QUAT HOA logic truoc day viet tay RIENG cho vong 2 ngay trong route.js. Khac
// tinhGiaVaoWeb() o cho: khong can xet cheDoVao (vi the phu luon vao tai gia dong cua ngay vao
// lenh, AFL khong co "che do moc" rieng cho nhom nay), va "cung lan vao" dua theo ngay vao RIENG
// cua chinh vi the phu (khong phai ngay_mua cua lenh goc).
//
// dangGiuMoi: true|false|null (da qua boolTriState) - trang thai giu vi the phu LAN UPLOAD NAY;
// ngayMuaMoi: "yyyy-mm-dd"|null - ngay vao vi the phu lan upload nay (da qua soNgayVN);
// giaTriMoi: { gia, stop, tp1, tp2, tp3 } (so|null) - gia tri AFL/engine xuat RAW lan nay (da qua
//   parse so, vd ham duong() da co san trong route.js);
// cu: { dangGiu, gia, stop, tp1, tp2, tp3, ngayMuaTxt } | undefined - CAC GIA TRI DA DONG BANG
//   TRUOC DO cua CHINH vi the phu nay (doc tu dong DB cu, khong phai cua lenh goc).
// Tra ve { gia, stop, tp1, tp2, tp3 } (tat ca null neu khong giu).
const TRONG_THEM = { gia: null, stop: null, tp1: null, tp2: null, tp3: null };

//
// homNay: "yyyy-mm-dd"|undefined - ngay giao dich hom nay. Neu ngay vao vi the phu DA QUA (nen gia
//   vao cua engine/AFL la gia dong cua ngay do, khong doi nua) ma gia moi lech > 3% so voi gia da
//   dong bang thi gia da dong bang la gia THO truoc ngay chia co tuc/thuong co phieu (gia lich su
//   duoc dieu chinh) -> lay lai bo gia tri moi (vd HDB 09/10: 27,6 -> ~21,2 sau khi chia 25%+5%).
export const NGUONG_LECH_GIA_DIEU_CHINH = 0.03;

export function tinhGiaMuaThemWeb({ dangGiuMoi, ngayMuaMoi, giaTriMoi, cu, homNay }) {
  if (dangGiuMoi !== true) return TRONG_THEM;
  let giuNguyen = !!cu && cu.dangGiu === true && !!ngayMuaMoi && cu.ngayMuaTxt === ngayMuaMoi && Number(cu.gia) > 0;
  if (giuNguyen && homNay && ngayMuaMoi < homNay && Number(giaTriMoi?.gia) > 0) {
    const lech = Math.abs(Number(giaTriMoi.gia) / Number(cu.gia) - 1);
    if (lech > NGUONG_LECH_GIA_DIEU_CHINH) giuNguyen = false;
  }
  if (giuNguyen) {
    return { gia: cu.gia, stop: cu.stop ?? null, tp1: cu.tp1 ?? null, tp2: cu.tp2 ?? null, tp3: cu.tp3 ?? null };
  }
  return {
    gia: giaTriMoi.gia ?? null,
    stop: giaTriMoi.stop ?? null,
    tp1: giaTriMoi.tp1 ?? null,
    tp2: giaTriMoi.tp2 ?? null,
    tp3: giaTriMoi.tp3 ?? null,
  };
}
