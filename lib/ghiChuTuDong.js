// GHI CHU TU DONG cho Danh muc theo doi + CANH BAO BAN BOT khi dong cua duoi Tenkan (Hieu 29/10/2026) - ham THUAN, import tuong doi de test tay: engine/test/ghiChuTuDong.test.mjs.
// Dau vao: 1 dong tin hieu da gop cot chi bao ky thuat (cach_tenkan_pct, cach_kijun_pct, gia_so_may, cach_ma20/50/200_pct) + kijun, gg_top, gg_bot (duong can bang dai han), dinh_52t, stop_loss.
// Day la NHAN THONG TIN tren web: KHONG doi tin hieu MUA / BAN cua engine, khong gui thong bao.
import { soVN } from "./soVN.js";

const so = (v) => (v == null || v === "" ? NaN : Number(v));
const hopLe = (v) => Number.isFinite(v) && v > 0;

export const KC_HT_XA_TOI_DA_PCT = 10; // KC / HT cach gia hon muc nay thi khong ghi (qua xa, khong con y nghia canh bao)
export const KC_HT_GAN_PCT = 3; // KC / HT cach gia trong muc nay thi to dam (gia dang sat)

export const laDangGiu = (r) => r?.tin === "MUA" || r?.tin === "NAM GIU";
// Dang giu va gia dong cua (hom nay / lan quet gan nhat) nam duoi Tenkan -> canh bao Ban bot tren web.
export const duoiTenkanDangGiu = (r) => laDangGiu(r) && so(r?.cach_tenkan_pct) < 0;
// Canh bao Ban bot: chi ma DANG GIU, va tin hieu san co (ban_bot cua engine) HOAC duoi Tenkan.
export const coCanhBaoBanBot = (r) => laDangGiu(r) && (!!r?.ban_bot || duoiTenkanDangGiu(r));

// Cac muc gia tham chieu quanh gia hien tai: [{ ten, gia }]. Muc tinh tu "cach X %" thi gia_muc = gia / (1 + cach / 100).
export function cacMucThamChieu(r) {
  const gia = so(r?.gia);
  if (!hopLe(gia)) return [];
  const tuCach = (cach) => {
    const c = so(cach);
    return Number.isFinite(c) && c > -99 ? gia / (1 + c / 100) : NaN;
  };
  const ds = [
    ["Tenkan", tuCach(r.cach_tenkan_pct)],
    ["Kijun", so(r.kijun)],
    ["MA20", tuCach(r.cach_ma20_pct)],
    ["MA50", tuCach(r.cach_ma50_pct)],
    ["MA200", tuCach(r.cach_ma200_pct)],
    ["cân bằng dài hạn", so(r.gg_top)],
    ["cân bằng dài hạn", so(r.gg_bot)],
    ["đỉnh 52 tuần", so(r.dinh_52t)],
  ];
  return ds.filter(([, g]) => hopLe(g)).map(([ten, g]) => ({ ten, gia: g }));
}

const fmtGia = (v) => soVN(v, v >= 100 ? 1 : 2, true);
const fmtPct = (v) => `${v >= 0 ? "+" : "−"}${soVN(Math.abs(v), 1)}%`;

// Ghi chu: mang chip { khoa, nhan, mau, manh } da sap theo muc uu tien (canh bao truoc, KC / HT sau). manh = true khi can chu y ngay.
export function ghiChuTuDong(r) {
  const chip = [];
  const gia = so(r?.gia);
  if (!hopLe(gia)) return chip;
  const tenkan = so(r.cach_tenkan_pct);
  const kijun = so(r.cach_kijun_pct);
  if (Number.isFinite(tenkan) && tenkan < 0) chip.push({ khoa: "duoi_tenkan", nhan: "Dưới Tenkan", mau: "var(--cam)", manh: true });
  if (Number.isFinite(kijun) && kijun < 0) chip.push({ khoa: "duoi_kijun", nhan: "Dưới Kijun", mau: "var(--do)", manh: true });
  const may = so(r.gia_so_may);
  if (may === -1) chip.push({ khoa: "duoi_may", nhan: "Dưới mây", mau: "var(--do)", manh: true });
  else if (may === 0) chip.push({ khoa: "trong_may", nhan: "Trong mây", mau: "var(--vang)", manh: false });
  else if (may === 1) chip.push({ khoa: "tren_may", nhan: "Trên mây", mau: "var(--xanh)", manh: false });
  const sl = so(r.stop_loss);
  if (laDangGiu(r) && hopLe(sl) && gia <= sl * 1.03) chip.push({ khoa: "gan_cat_lo", nhan: `Sát mức cắt lỗ ${fmtGia(sl)}`, mau: "var(--do)", manh: true });

  const muc = cacMucThamChieu(r);
  const tren = muc.filter((m) => m.gia > gia).sort((a, b) => a.gia - b.gia)[0];
  const duoi = muc.filter((m) => m.gia <= gia).sort((a, b) => b.gia - a.gia)[0];
  if (tren) {
    const cach = (tren.gia / gia - 1) * 100;
    if (cach <= KC_HT_XA_TOI_DA_PCT) chip.push({ khoa: "khang_cu", nhan: `KC ${fmtGia(tren.gia)} (${tren.ten}, ${fmtPct(cach)})`, mau: "var(--cam)", manh: cach <= KC_HT_GAN_PCT });
  }
  if (duoi) {
    const cach = (duoi.gia / gia - 1) * 100;
    if (-cach <= KC_HT_XA_TOI_DA_PCT) chip.push({ khoa: "ho_tro", nhan: `HT ${fmtGia(duoi.gia)} (${duoi.ten}, ${fmtPct(cach)})`, mau: "var(--xanh)", manh: -cach <= KC_HT_GAN_PCT });
  }
  return chip;
}
