// BANKER RHYTHM - chi bao AmiBroker pho bien o Viet Nam. Day la ban code CONG KHAI (nguoi dang noi la ban "giong", khong phai ban goc):
// kakata.vn/xin-chi-bao-giong-chi-bao-banker-rhythm.t4210.html (bai #4, "bkr"). Chi la chi bao HIEN THI / THAM KHAO:
//  - "2 rau" (b / bot1) CHI DO VI TRI CUA GIA TRONG BIEN DO 15 PHIEN (khong co khoi luong / dong tien that): rau tach ra = gia dong cua gan dinh bien do, thu vao = gan day.
//  - BridgeT = KDJ 10 phien lam muot 2 lan; Buy1 = trend cat len 5; Buy2 = mau gia 3-5 phien + VARA5 < 24 + gia mo < MA20.
// Kiem dinh: xem memory project_banker_rhythm (21/11/2026).
import { emaTdx } from "./homily.js";

const hhv = (a, n) => a.map((_, i) => {
  let m = -Infinity;
  for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j];
  return m;
});
const llv = (a, n) => a.map((_, i) => {
  let m = Infinity;
  for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j];
  return m;
});
const ma = (a, n) => a.map((_, i) => {
  if (i < n - 1) return null;
  let s = 0;
  for (let j = i - n + 1; j <= i; j++) s += a[j];
  return s / n;
});
const chia = (t, m) => (m > 0 || m < 0 ? t / m : 0);

export const BKR_KHOI_DAU = 30; // nhung nen dau chua on dinh: khong ve

// tra mang cung do dai dau vao:
//  rauTren (0..~38), rauDuoi (am), bridge (cot BridgeT, ve +/-), bridgeTang (bool), trend, buyB (Buy1 = trend cat len 5), buyA (Buy2: 30 hoac 0)
export function bankerRhythm(open, high, low, close, { bienDo = 15, bridge: chuKyBridge = 10, trend: chuKyTrend = 27 } = {}) {
  const n = close.length;
  const var2 = close.map((c, i) => (high[i] + low[i] + 2 * c) / 4);
  const llvVar2 = llv(var2, bienDo);
  const hhvLow = hhv(low, bienDo);
  const x = var2.map((v, i) => chia(v - llvVar2[i], hhvLow[i] - llvVar2[i]));
  const e = emaTdx(x, 2);
  const rauTren = e.map((v) => v * 38);
  const rauDuoi = e.map((v) => (-v + 0.01) * 38);
  // BridgeT
  const hh10 = hhv(high, chuKyBridge);
  const ll10 = llv(low, chuKyBridge);
  const var22 = close.map((c, i) => chia(c - ll10[i], hh10[i] - ll10[i]) * 100);
  const var33 = emaTdx(var22, chuKyBridge);
  const var44 = emaTdx(var33, chuKyBridge);
  const var66 = emaTdx(var33.map((v, i) => 3 * v - 2 * var44[i]), 5);
  const bridge = var66; // EMA(x, 1) = x
  const bridgeTang = bridge.map((v, i) => i > 0 && v > bridge[i - 1]);
  // trend + Buy1
  const hh27 = hhv(high, chuKyTrend);
  const ll27 = llv(low, chuKyTrend);
  const rsv27 = close.map((c, i) => chia(c - ll27[i], hh27[i] - ll27[i]) * 100);
  const t5 = emaTdx(rsv27, 5);
  const t53 = emaTdx(t5, 3);
  const t532 = emaTdx(t53, 2);
  const trend = t5.map((v, i) => 5 * v - 3 * t53[i] - t532[i]);
  const buyB = trend.map((v, i) => i > 0 && trend[i - 1] < 5 && v >= 5);
  // Buy2: VARA1 (mau gia, giu nguyen thu tu uu tien AND truoc OR nhu AFL) + VARA6
  const r = (k, i) => (i - k >= 0 ? close[i - k] : NaN);
  const vara1 = close.map((c, i) => {
    const c1 = r(1, i);
    const c2 = r(2, i);
    const c3 = r(3, i);
    const c4 = r(4, i);
    const c5 = r(5, i);
    const a = c >= c1 && c1 >= c2 && c1 <= c3 && c2 <= c3 && (c4 > c2 || (c4 <= c2 && c5 >= c3));
    const b = c >= c1 && c1 <= c2 && c >= c2 && (c3 > c1 || (c3 <= c1 && c4 >= c2));
    return a || b;
  });
  const lo5 = llv(low, 5);
  const hi5 = hhv(high, 5);
  const vara4 = emaTdx(close.map((c, i) => chia(c - lo5[i], hi5[i] - lo5[i]) * 100), 4);
  const vara5 = emaTdx(vara4.map((v, i) => 0.66699999 * (i > 0 ? vara4[i - 1] : v) + 0.333 * v), 2);
  const ma20 = ma(close, 20);
  const buyA = close.map((_, i) => (vara1[i] && vara5[i] < 24 && ma20[i] != null && open[i] < ma20[i] ? 30 : 0));
  const khoi = (a) => a.map((v, i) => (i < BKR_KHOI_DAU ? null : v));
  return { rauTren: khoi(rauTren), rauDuoi: khoi(rauDuoi), bridge: khoi(bridge), bridgeTang, trend: khoi(trend), buyB: buyB.map((v, i) => i >= BKR_KHOI_DAU && v), buyA: buyA.map((v, i) => (i >= BKR_KHOI_DAU ? v : 0)), n };
}
