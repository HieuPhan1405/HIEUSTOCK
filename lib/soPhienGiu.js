// SO PHIEN GIU cua lenh (ham THUAN, khong dung DB - import tuong doi de test tay bang node: engine/test/soPhienGiu.test.mjs).
//
// Lenh dau co san so_phien_giu do AFL xuat (barsSince(Buy): ngay mua = 0, phien sau = 1...). Lenh MUA MOI (dot sau) khong co cot rieng nen dem tu LICH PHIEN GIAO DICH
// (cac ngay co nen cua VNINDEX, tang dan - xem layLichPhien trong lib/lichSuGia.js): so phien SAU ngay mua, den phien moi nhat (lenh dang mo) hoac den ngay dong (lenh da dong) - cung cach dem.
// lich: ["yyyy-mm-dd", ...] tang dan. Tra ve null neu khong co lich hoac lich khong phu toi ngay mua (khong doan bua).
export function demSoPhien(lich, tu, den = null) {
  if (!Array.isArray(lich) || lich.length === 0 || !tu) return null;
  const t = String(tu).slice(0, 10);
  const d = den ? String(den).slice(0, 10) : lich[lich.length - 1];
  if (t < lich[0]) return null;
  let n = 0;
  for (const x of lich) if (x > t && x <= d) n++;
  return n;
}

// Bo sung so_phien cho cac dong lenh_da_dong dang thieu (vd lenh mua moi: luc dong khong biet so phien) tu ngay mua -> ngay dong.
export function boSungSoPhienDong(ds, lich) {
  if (!Array.isArray(lich) || lich.length === 0) return ds;
  return ds.map((x) => (x.so_phien != null ? x : { ...x, so_phien: demSoPhien(lich, x.ngay_mua, x.ngay_ban) }));
}
