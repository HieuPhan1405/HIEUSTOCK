// RSI KHUNG 1 GIO cho BO LOC (khong tham gia tin hieu MUA/BAN): RSI 14 tren nen 1 gio + RSI phan ky 1 gio (lib/phanKyRSI.js, k = 3) ma hoa nhu cot _cat_cach cua bo loc:
// phan ky TANG xac nhan k nen 1 gio truoc = +k, GIAM = -(k + 1), null neu khong co trong `SO_NEN_PK_H1` nen 1 gio cuoi (~12 phien).
// nen1h: [{ t, h, l, c }] tang dan theo thoi gian (nen cuoi co the dang chay do). Cot: rsi_h1, rsi_h1_pk_cach (lib/cotChiBaoKyThuat.js, COT_CHI_BAO_H1).
import { rsi } from "./taChiBao.js";
import { phanKyRSI } from "../../lib/phanKyRSI.js";

export const SO_NEN_PK_H1 = 60;
const SO_NEN_TOI_THIEU = 40;
const lam = (v, chuSo = 4) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10 ** chuSo) / 10 ** chuSo);

export function tinhRsiH1ChoMa(nen1h) {
  if (!Array.isArray(nen1h) || nen1h.length < SO_NEN_TOI_THIEU) return null;
  const close = nen1h.map((b) => b.c);
  const r = rsi({ close }, 14);
  const cuoi = r[r.length - 1];
  const ev = phanKyRSI(nen1h.map((b) => ({ h: b.h, l: b.l, c: b.c })), r, { k: 3 });
  const gan = ev[ev.length - 1];
  let pk = null;
  if (gan) {
    const cach = nen1h.length - 1 - gan.xacNhan;
    if (cach >= 0 && cach < SO_NEN_PK_H1) pk = gan.loai === "tang" ? cach : -(cach + 1);
  }
  return { rsi_h1: lam(cuoi), rsi_h1_pk_cach: pk };
}

// CSV rieng cho /api/upload-chi-bao (chi 2 cot nay + ma: route chi ghi cac cot co trong header nen KHONG xoa cac chi bao khac).
export function xayDungCsvRsiH1(ds) {
  const dong = ["ma,rsi_h1,rsi_h1_pk_cach"];
  for (const h of ds) dong.push([h.ma, h.rsi_h1 ?? "", h.rsi_h1_pk_cach ?? ""].join(","));
  return dong.join("\n");
}
