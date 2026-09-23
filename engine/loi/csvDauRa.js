// Dong CSV dau ra dung cac cot ma app/api/upload-signals/route.js mong doi (route doc theo TEN
// header, khong phu thuoc thu tu cot - nhung giu dung thu tu comment dau file route.js de de doi
// chieu bang mat voi CSV AmiBroker xuat). Moi hang dau vao la 1 object co dang tra ve boi
// engine/tinhTinHieuChoMa.js (tinhTinHieuChoMa()).
export const CAC_COT = [
  "ma", "tin", "diem", "trend", "mom", "dt", "adx", "gia", "doi", "rs_vni", "breadth_nganh",
  "kijun", "gg_top", "gg_bot", "dinh_52t", "stop_loss", "mat_than", "tp1", "tp2", "tp3",
  "gtgd_tb20", "fvg_ok", "so_phien_giu", "lai_lo_pct", "sanyaku", "kumo_twist", "ngay_bien_doi",
  "von_hoa", "gia_mua", "ngay_mua", "ban_bot", "san", "nganh", "tp_da_cham", "diem_rank",
  "diem_confidence", "khoi_luong_tb20", "giai_ngan", "gia_kich_hoat", "moc_kich_hoat",
  "moc_gia", "moc_loai", "moc_cach_pct", "diem_neu_vuot", "che_do_vao", "loai_vao",
  "cho_phien_sau", "mua_moi", "dang_giu_moi", "cat_moi", "gia_mua_moi", "stop_moi",
  "tp1_moi", "tp2_moi", "tp3_moi", "ngay_mua_moi", "ly_do_ban", "dang_bao_ve_lai", "stop_bao_ve",
  // MUA THEM GIUA CHUNG (vong doc lap voi mua_moi/vong 2, mo TRUOC khi cham du TP3) - bo sung 2026-09-23.
  "mua_giua", "dang_giu_giua", "cat_giua", "gia_mua_giua", "stop_giua",
  "tp1_giua", "tp2_giua", "tp3_giua", "ngay_mua_giua",
];

// true/false -> "1"/"0" (route.js soBool/boolTriState doc dung 2 gia tri nay). null/undefined ->
// "" (soFloat/soText/boolTriState deu doc "" thanh null - dung y nghia "chua biet"/"khong ap dung",
// KHAC voi false). So thuong -> chuoi so; NaN/Infinity -> "" (khong ghi gia tri vo nghia).
function giaTriCSV(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  return String(v);
}

export function xayDungCSV(dsHang) {
  const dong = [CAC_COT.join(",")];
  for (const h of dsHang) dong.push(CAC_COT.map((c) => giaTriCSV(h[c])).join(","));
  return dong.join("\n");
}
