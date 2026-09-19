import { withDb, daoDamBangTinHieu } from "@/lib/db";
import { SO_CP_LUU_HANH } from "@/lib/soCoPhieuLuuHanh";

// vung_tham_gia KHONG con doc/ghi - tinh nang da bi bo trong ban FULL v16.
const CAC_COT = `ma, tin, diem, trend, mom, dt, adx, gia, doi, rs_vni, breadth_nganh,
                  kijun, gg_top, gg_bot, dinh_52t,
                  stop_loss, mat_than, tp1, tp2, tp3, gtgd_tb20, fvg_ok,
                  so_phien_giu, lai_lo_pct, sanyaku, kumo_twist, ngay_bien_doi, von_hoa,
                  gia_mua, ngay_mua, ban_bot, san, nganh, tp_da_cham,
                  diem_rank, diem_confidence, khoi_luong_tb20, giai_ngan,
                  gia_kich_hoat, moc_kich_hoat, moc_gia, moc_loai, moc_cach_pct, diem_neu_vuot,
                  gia_vao_web, thoi_diem_vao_web, vao_stop_loss, vao_tp1, vao_tp2, vao_tp3, che_do_vao,
                  cap_nhat_luc`;

// Bo sung cot tinh them cho moi dong:
// - Von hoa (ty dong) = gia (nghin dong) x so co phieu luu hanh / 1.000.000.
//   So co phieu la ban chup tinh (lib/soCoPhieuLuuHanh.js, cap nhat bang
//   scripts/capNhatSoCoPhieu.mjs) nen von hoa chay theo gia hien tai moi lan
//   upload. Ma chua co so co phieu -> null (bo loc von hoa se loai ma do ra).
// - GIA MUA GHI NHAN: neu web da ghi nhan gia luc ma lan dau chuyen sang MUA
//   (gia_vao_web, xem upload-signals) thi lay lam gia mua va tinh lai lai/lo
//   tu gia do - khong doi theo cac lan upload sau trong phien. Gia goc cua
//   AmiBroker van giu o gia_mua_amibroker. Chua co ban ghi thi dung gia_mua AFL.
function chuanHoaHang(row) {
  const soCP = SO_CP_LUU_HANH[row.ma];
  const ketQua = { ...row, von_hoa_ty: soCP && row.gia != null ? (row.gia * soCP) / 1e6 : null };
  const dangGiu = row.tin === "MUA" || row.tin === "NAM GIU";
  if (dangGiu && row.gia_vao_web > 0 && row.gia != null) {
    ketQua.gia_mua_amibroker = row.gia_mua;
    ketQua.gia_mua = row.gia_vao_web;
    ketQua.lai_lo_pct = (row.gia / row.gia_vao_web - 1) * 100;
    ketQua.gia_mua_ghi_nhan = true;
    // Stop-loss/TP cung dong bang tai luc do (neu co ban ghi) - khong troi theo gia moi nhat.
    if (row.vao_stop_loss != null && row.vao_tp1 != null) {
      ketQua.stop_loss_amibroker = row.stop_loss;
      ketQua.stop_loss = row.vao_stop_loss;
      ketQua.tp1 = row.vao_tp1;
      ketQua.tp2 = row.vao_tp2;
      ketQua.tp3 = row.vao_tp3;
      ketQua.sl_tp_ghi_nhan = true;
    }
  }
  return ketQua;
}

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
    return rows.map(chuanHoaHang);
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
    return rows[0] ? chuanHoaHang(rows[0]) : null;
  });
}
