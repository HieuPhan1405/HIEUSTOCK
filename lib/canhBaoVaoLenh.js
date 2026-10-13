// CANH BAO KHI VAO LENH (chi de THAM KHAO, khong chan lenh, khong anh huong tin hieu) - ham THUAN, import tuong doi de test tay: engine/test/canhBaoVaoLenh.test.mjs.
// Nghien cuu 13/10/2026 (4.258 lenh, 12 nam): lenh co cat lo qua sat gia vao hoac ATR/gia lon de bi quet cat lo som (engine thoi giu trong <=3 phien: ty le 23% / 33% so voi 14% / 13%).
// Nguong chi dat o day, KHONG hien so tren giao dien (luat noi dung: khong cong bo nguong).
export const NGUONG_CAT_LO_SAT_PCT = 4; // (gia vao - cat lo) / gia vao < 4%
export const NGUONG_ATR_MANH_PCT = 5; // ATR / gia >= 5%

const so = (v) => (v == null || v === "" ? NaN : Number(v));

// row: dong lenh mo (co gia_mua / stop_loss, tuy chon gia_vao_web / vao_stop_loss = gia + cat lo luc vao, tp_da_cham, atr_pct).
// Tra ve mang canh bao [{ khoa, nhan, moTa }] (rong neu khong co).
export function canhBaoVaoLenh(row) {
  if (!row) return [];
  const ds = [];
  const giaVao = so(row.gia_vao_web) > 0 ? so(row.gia_vao_web) : so(row.gia_mua);
  const stop = so(row.vao_stop_loss) > 0 ? so(row.vao_stop_loss) : so(row.stop_loss);
  const daDoiCatLo = row.tp_da_cham === "TP2" || row.tp_da_cham === "TP3"; // cat lo da keo ve gia vao -> khoang cach hien tai khong con y nghia
  if (giaVao > 0 && stop > 0 && stop < giaVao && !daDoiCatLo) {
    const cach = ((giaVao - stop) / giaVao) * 100;
    if (cach < NGUONG_CAT_LO_SAT_PCT) {
      ds.push({ khoa: "cat_lo_sat", nhan: "Vào sát cắt lỗ", moTa: "Mức cắt lỗ nằm rất sát giá vào nên lệnh dễ bị quét cắt lỗ sớm (theo thống kê lịch sử). Chỉ để tham khảo, không phải khuyến nghị." });
    }
  }
  if (so(row.atr_pct) >= NGUONG_ATR_MANH_PCT) {
    ds.push({ khoa: "bien_dong_manh", nhan: "Biến động mạnh", moTa: "Cổ phiếu có biên độ dao động lớn so với giá nên dễ bị quét cắt lỗ sớm (theo thống kê lịch sử). Chỉ để tham khảo, không phải khuyến nghị." });
  }
  return ds;
}
