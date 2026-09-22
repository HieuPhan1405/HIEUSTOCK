import { withDb, daoDamBangTinHieu } from "@/lib/db";
import { SO_CP_LUU_HANH } from "@/lib/soCoPhieuLuuHanh";
import { TEN_CONG_TY } from "@/lib/tenCongTy";

// vung_tham_gia KHONG con doc/ghi - tinh nang da bi bo trong ban FULL v16.
const CAC_COT = `ma, tin, diem, trend, mom, dt, adx, gia, doi, rs_vni, breadth_nganh,
                  kijun, gg_top, gg_bot, dinh_52t,
                  stop_loss, mat_than, tp1, tp2, tp3, gtgd_tb20, fvg_ok,
                  so_phien_giu, lai_lo_pct, sanyaku, kumo_twist, ngay_bien_doi, von_hoa,
                  gia_mua, ngay_mua, ban_bot, san, nganh, tp_da_cham,
                  diem_rank, diem_confidence, khoi_luong_tb20, giai_ngan,
                  gia_kich_hoat, moc_kich_hoat, moc_gia, moc_loai, moc_cach_pct, diem_neu_vuot,
                  gia_vao_web, thoi_diem_vao_web, vao_stop_loss, vao_tp1, vao_tp2, vao_tp3, che_do_vao, loai_vao, cho_phien_sau,
                  mua_moi, dang_giu_moi, cat_moi, gia_mua_moi, stop_moi, tp1_moi, tp2_moi, tp3_moi, ngay_mua_moi,
                  ly_do_ban, dang_bao_ve_lai, stop_bao_ve,
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
// Loai moc AFL xuat: "MAY", "GIA" hoac ten duong can bang dai han (dang xuat ban cu co
// ten khac) kem/khong kem "MAY+" - chuan hoa ve "CAN BANG" / "MAY+CAN BANG" de web chi
// can 1 bang nhan, khong phu thuoc AFL da Explore lai hay chua.
function chuanLoaiMoc(v) {
  if (v == null || v === "" || v === "MAY" || v === "GIA") return v ?? null;
  return v.includes("MAY") ? "MAY+CAN BANG" : "CAN BANG";
}

function chuanHoaHang(row) {
  const soCP = SO_CP_LUU_HANH[row.ma];
  const ten = TEN_CONG_TY[row.ma];
  const ketQua = {
    ...row,
    ten_cong_ty: ten ? ten[0] : null,
    ten_ngan: ten ? ten[1] : null,
    von_hoa_ty: soCP && row.gia != null ? (row.gia * soCP) / 1e6 : null,
    moc_loai: chuanLoaiMoc(row.moc_loai),
    moc_kich_hoat: chuanLoaiMoc(row.moc_kich_hoat),
  };
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
    // BAO VE LAI (hoa von sau TP2 / rong tu dinh sau TP1): AFL da doi Stop-loss noi bo len cao hon luc backtest -
    // web hien THI mac cao hon do lam Stop-loss hien tai (khong con y nghia neu van hien muc SL cu, thap hon).
    if (row.dang_bao_ve_lai && row.stop_bao_ve > 0 && row.stop_bao_ve > (ketQua.stop_loss ?? 0)) {
      ketQua.stop_loss_truoc_bao_ve = ketQua.stop_loss;
      ketQua.stop_loss = row.stop_bao_ve;
      ketQua.bao_ve_lai_kich_hoat = true;
    }
  }
  return ketQua;
}

// Dung chung cho: API /api/signals, trang Tong quan thi truong, trang Lenh
// dang mo, va trang chi tiet 1 ma - tranh lap SQL o nhieu noi.
// VNINDEX bi LOAI khoi day - no khong phai co phieu, chi duoc AFL xuat them
// de lay PTKT rieng cho chinh chi so (xem layChiSoVNIndex() ben duoi).
//
// TOC DO: du lieu chi doi khi co lan upload moi (sau moi phien) nen doc 1 lan CA BANG (ke ca VNINDEX) va nho 30 giay trong bo nho
// cua instance - moi trang (Tong quan, Bo loc, So lenh, Chi tiet ma, API) dung chung, khong con truy van DB lap lai moi request.
// Nhieu request cung luc khi chua co bo nho se gop thanh 1 truy van. Upload xoa bo nho ngay (xoaBoNhoTinHieu).
const HAN_BO_NHO_MS = 30_000;
let boNho = { luc: 0, hang: null, dangTai: null };
let theHe = 0; // tang moi lan xoa: truy van dang chay tu TRUOC lan xoa khong duoc ghi de bo nho

export function xoaBoNhoTinHieu() {
  theHe++;
  boNho = { luc: 0, hang: null, dangTai: null };
}

async function layBangTinHieu() {
  if (boNho.hang && Date.now() - boNho.luc < HAN_BO_NHO_MS) return boNho.hang;
  if (boNho.dangTai) return boNho.dangTai;
  const heLucBatDau = theHe;
  const dangTai = withDb(async (client) => {
    await daoDamBangTinHieu(client);
    const { rows } = await client.query(`SELECT ${CAC_COT} FROM tin_hieu ORDER BY diem DESC NULLS LAST`);
    return rows.map(chuanHoaHang);
  })
    .then((hang) => {
      if (theHe === heLucBatDau) boNho = { luc: Date.now(), hang, dangTai: null };
      return hang;
    })
    .catch((loi) => {
      if (theHe === heLucBatDau) boNho.dangTai = null;
      throw loi;
    });
  boNho.dangTai = dangTai;
  return dangTai;
}

export async function layTatCaTinHieu() {
  const hang = await layBangTinHieu();
  // Tra ban sao mang (slice) de trang nao sap xep tai cho cung khong lam hong bo nho dung chung.
  return hang.filter((r) => r.ma !== "VNINDEX");
}

// Rieng cho the PTKT VNINDEX o trang Tong quan - dung chung cong thuc
// Ichimoku/duong can bang dai han/diem so nhu tung co phieu, chi khac o cho ma = "VNINDEX".
export async function layChiSoVNIndex() {
  return layTinHieuTheoMa("VNINDEX");
}

export async function layTinHieuTheoMa(ma) {
  if (!ma) return null;
  const hang = await layBangTinHieu();
  const maHoa = ma.toUpperCase();
  return hang.find((r) => r.ma === maHoa) ?? null;
}
