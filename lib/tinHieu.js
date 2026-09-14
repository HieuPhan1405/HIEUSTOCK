import { withDb, daoDamBangTinHieu } from "@/lib/db";

// vung_tham_gia KHONG con doc/ghi - tinh nang da bi bo trong ban FULL v16.
const CAC_COT = `ma, tin, diem, trend, mom, dt, adx, gia, doi, rs_vni, breadth_nganh,
                  kijun, gg_top, gg_bot, dinh_52t,
                  stop_loss, mat_than, tp1, tp2, tp3, gtgd_tb20, fvg_ok,
                  so_phien_giu, lai_lo_pct, sanyaku, kumo_twist, ngay_bien_doi, von_hoa,
                  gia_mua, ngay_mua, ban_bot,
                  cap_nhat_luc`;

// Dung chung cho: API /api/signals, trang Tong quan thi truong, trang Lenh
// dang mo, va trang chi tiet 1 ma - tranh lap SQL o nhieu noi.
// VNINDEX bi LOAI khoi day - no khong phai co phieu, chi duoc AFL xuat them
// de lay PTKT rieng cho chinh chi so (xem layChiSoVNIndex() ben duoi).
export async function layTatCaTinHieu() {
  return withDb(async (client) => {
    await daoDamBangTinHieu(client);
    const { rows } = await client.query(
      `SELECT ${CAC_COT} FROM tin_hieu WHERE ma != 'VNINDEX' ORDER BY diem DESC NULLS LAST`
    );
    return rows;
  });
}

// Rieng cho the PTKT VNINDEX o trang Tong quan - dung chung cong thuc
// Ichimoku/Giao Gam/diem so nhu tung co phieu, chi khac o cho ma = "VNINDEX".
export async function layChiSoVNIndex() {
  return layTinHieuTheoMa("VNINDEX");
}

export async function layTinHieuTheoMa(ma) {
  if (!ma) return null;
  return withDb(async (client) => {
    await daoDamBangTinHieu(client);
    const { rows } = await client.query(
      `SELECT ${CAC_COT} FROM tin_hieu WHERE ma = $1`,
      [ma.toUpperCase()]
    );
    return rows[0] || null;
  });
}
