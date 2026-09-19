// GIA MUA GHI NHAN LUC MA LAN DAU CHUYEN SANG MUA.
//
// Khi upload giua phien, "gia" tu AmiBroker la gia MOI NHAT nen moi lan upload
// lai gia mua se doi theo gia hien tai. Ham nay quyet dinh gia web se DONG BANG:
//  - Ma lan dau hien MUA (truoc do khong giu lenh)   -> ghi nhan gia luc do.
//  - Ma dang giu, da co ghi nhan, cung lan mua        -> giu nguyen gia + gio cu.
//  - Ma khong con giu (TRUNG LAP / BAN)               -> xoa ghi nhan.
//  - Ngay mua doi (ban roi mua lai giua 2 lan upload) -> coi la lenh moi.
//  - Ma dang NAM GIU nhung chua tung duoc ghi nhan (vd giu tu truoc khi co tinh
//    nang nay, hoac upload bo qua ngay MUA) -> null, web dung gia mua cua AFL.
//
// tinMoi: "MUA" | "NAM GIU" | ...; giaMoi: so | null; ngayMuaMoi: "yyyy-mm-dd" | null;
// cu: { tin, gia_vao_web, thoi_diem_vao_web, ngay_mua_txt } | undefined (dong DB truoc khi ghi de).
export function tinhGiaVaoWeb({ tinMoi, giaMoi, ngayMuaMoi, cu, bayGio }) {
  const dangGiu = (t) => t === "MUA" || t === "NAM GIU";
  if (!dangGiu(tinMoi)) return { gia: null, luc: null };

  const cuDangGiu = !!cu && dangGiu(cu.tin);
  // Thieu ngay o 1 trong 2 ben thi coi nhu cung lan mua (khong du co so de bao khac).
  const cungLanMua = cuDangGiu && (!cu.ngay_mua_txt || !ngayMuaMoi || cu.ngay_mua_txt === ngayMuaMoi);

  if (cungLanMua && cu.gia_vao_web != null) return { gia: cu.gia_vao_web, luc: cu.thoi_diem_vao_web };
  if (tinMoi === "MUA" && !cungLanMua && giaMoi != null) return { gia: giaMoi, luc: bayGio };
  return { gia: null, luc: null };
}
