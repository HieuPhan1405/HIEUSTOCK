// "CAN CHU Y HOM NAY" tren So lenh dang mo (04/11/2026) - ham THUAN, test tay: engine/test/canChuYLenh.test.mjs.
// Gom cac lenh dang mo can xu ly len DAU trang (kieu "viec can lam" cua app moi gioi) thay vi de nguoi dung tu soi bang: rui ro truoc, co hoi sau.
// Chi DOC lai trang thai he thong / web da tinh (Mat Than, vung cat lo, canh bao ban bot, MUA trong phien) - khong them quy tac moi.
// ds: cac lenh dang mo (lib/muaThemTinhToan.js lenhDangMo). tinhVung: tinhVungLenh (components/dungChung.js); banBot: coCanhBaoBanBot (lib/ghiChuTuDong.js) - truyen vao de ham thuan.

export const NHOM_CAN_CHU_Y = [
  { khoa: "matThan", nhan: "Cảnh báo Mắt Thần", viec: "Rủi ro đảo chiều — cân nhắc bán / giảm tỷ trọng", mau: "var(--do)" },
  { khoa: "catLo", nhan: "Giá trong vùng cắt lỗ", viec: "Theo dõi sát — thủng đáy vùng là cắt", mau: "var(--do)" },
  { khoa: "banBot", nhan: "Cảnh báo bán bớt", viec: "Điểm tụt / giá dưới Tenkan — cân nhắc giảm bớt", mau: "var(--cam)" },
  { khoa: "muaMoi", nhan: "Mua trong phiên", viec: "Lệnh mới — mua trong vùng mua, đã vượt vùng thì chờ hồi", mau: "var(--xanh)" },
];

// Lenh co dang trong vung / cham cat lo (bo qua muc cat lo da cach qua xa - chi con tham khao).
export function laGanCatLo(r, tinhVung) {
  const sl = tinhVung(r)?.sl;
  return !!sl && !sl.xa && (sl.trangThai === "cham" || sl.trangThai === "trong");
}

export function laCanChuY(r, { tinhVung, banBot }) {
  return !!r.mat_than || laGanCatLo(r, tinhVung) || !!banBot(r);
}

// Tra [{ ...NHOM, ds: [lenh] }] chi gom nhom co lenh, theo thu tu NHOM_CAN_CHU_Y. 1 lenh co the nam o nhieu nhom (vd vua Mat Than vua gan cat lo).
export function nhomCanChuY(ds, { tinhVung, banBot }) {
  const theoNhom = {
    matThan: ds.filter((r) => r.mat_than),
    catLo: ds.filter((r) => laGanCatLo(r, tinhVung)),
    banBot: ds.filter((r) => banBot(r)),
    muaMoi: ds.filter((r) => r.tin === "MUA" || (r.la_lenh_moi && r.mua_moi_hom_nay)),
  };
  return NHOM_CAN_CHU_Y.map((n) => ({ ...n, ds: theoNhom[n.khoa] })).filter((n) => n.ds.length > 0);
}
