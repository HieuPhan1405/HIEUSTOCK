// BACKTEST LENH MUA CO PHAN KY (Hieu 2026-10-21: "test cac lenh co diem mua phan ky h1, d1,... thi ko mua duoi khi vao song").
// Y tuong: neu luc vao lenh co RSI PHAN KY TANG gan day (day sau thap hon, RSI cao hon - lib/phanKyRSI.js, xac nhan sau 3 nen, KHONG nhin truoc) tren khung ngay / tuan / 1 gio thi dang mua GAN DAY NHIP chu khong duoi.
// So sanh lenh Mua thuong cua engine (mua ATC ngay tin hieu, ban tu T+2, 30% TP1 + 30% TP2 + 40% chay, phi 0,4%) CO phan ky vs KHONG phan ky; do them do "xa day" (gia vao cao hon day 10 nen bao nhieu %)
// va ty le lenh da vuot vung mua (dong cua > moc + 1%). Khung ngay / tuan: toan bo lenh (~4.000); khung 1 gio: chi lenh 10/2023 - 10/2026 (~1.700, nen_1h.json).
// CACH CHAY: node engine/dich-vu/backtestVaoPhanKy.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { docJson, chayEngine, moPhongThucTe, thongKe, tb, f, kyOf, TEN_KY } from "./backtestChung.mjs";
import { phanKyRSI, gopNenTuan } from "../../lib/phanKyRSI.js";
import { rsi } from "../../lib/chiBaoPhu.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const h1 = JSON.parse(readFileSync(fileURLToPath(new URL("../output/nen_1h.json", import.meta.url)), "utf-8"));
const { lenh: tatCa } = chayEngine({ cache, vni });
const ds = tatCa.filter((t) => t.loai === 1 && t.iv + 3 < t.n);
const ngayVN = (t) => new Date((t + 7 * 3600) * 1000).toISOString().slice(0, 10);

// ---- phan ky tang tung ma / khung (su kien xac nhan o chi so nen) ----
const cacheEv = {};
function evNgay(ma) {
  if (cacheEv["D" + ma]) return cacheEv["D" + ma];
  const bars = cache[ma].map((b) => ({ h: b.h, l: b.l, c: b.c }));
  const ev = phanKyRSI(bars, rsi(bars.map((b) => b.c), 14), { k: 3 }).filter((e) => e.loai === "tang");
  return (cacheEv["D" + ma] = ev);
}
function evTuan(ma) {
  if (cacheEv["W" + ma]) return cacheEv["W" + ma];
  const w = gopNenTuan(cache[ma].map((b) => ({ t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v })));
  const ev = phanKyRSI(w, rsi(w.map((b) => b.c), 14), { k: 3 }).filter((e) => e.loai === "tang");
  return (cacheEv["W" + ma] = { ev, w });
}
function evGio(ma) {
  if (cacheEv["H" + ma]) return cacheEv["H" + ma];
  const x = h1[ma];
  if (!x) return (cacheEv["H" + ma] = null);
  const bars = x.t.map((_, i) => ({ h: x.h[i], l: x.l[i], c: x.c[i] }));
  const ev = phanKyRSI(bars, rsi(bars.map((b) => b.c), 14), { k: 3 }).filter((e) => e.loai === "tang");
  const cuoiNgay = new Map(); // ngay -> chi so nen 1 gio cuoi cua ngay do
  x.t.forEach((tt, i) => cuoiNgay.set(ngayVN(tt), i));
  return (cacheEv["H" + ma] = { ev, cuoiNgay });
}
// co phan ky tang xac nhan trong `m` nen cuoi tinh den chi so `i` (gom ca i)
const trong = (ev, i, m) => ev.some((e) => e.xacNhan <= i && i - e.xacNhan < m);

for (const t of ds) {
  const d = t.ngayArr[t.iv];
  t.pkD5 = trong(evNgay(t.ma), t.iv, 5);
  t.pkD10 = trong(evNgay(t.ma), t.iv, 10);
  const W = evTuan(t.ma);
  let iw = -1;
  for (let k = W.w.length - 1; k >= 0; k--) if (W.w[k].t <= d) { iw = k; break; }
  t.pkW4 = iw >= 0 && trong(W.ev, iw, 4);
  const G = evGio(t.ma);
  const ig = G && G.cuoiNgay.get(d);
  t.coGio = ig != null && d >= "2023-10-30";
  t.pkH10 = t.coGio && trong(G.ev, ig, 10);
  t.pkH20 = t.coGio && trong(G.ev, ig, 20);
  t.pkBatKy = t.pkD10 || t.pkW4 || t.pkH20;
  let day = Infinity;
  for (let j = Math.max(0, t.iv - 9); j <= t.iv; j++) day = Math.min(day, t.low[j]);
  t.xaDay = (t.close[t.iv] / day - 1) * 100;
  t.quaMoc = t.close[t.iv] > t.E * 1.01;
  t.r = moPhongThucTe(t, { E: t.close[t.iv], vao: t.iv, banTu: t.iv + 2 });
}
const rnd = (() => { let x = 987654; return () => ((x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296); })();
const boot = (a, b) => {
  if (a.length < 20 || b.length < 20) return "  (it mau)";
  const m = (arr) => { let s = 0; for (let i = 0; i < arr.length; i++) s += arr[Math.floor(rnd() * arr.length)]; return s / arr.length; };
  const d = [];
  for (let k = 0; k < 1500; k++) d.push(m(a) - m(b));
  d.sort((x, y) => x - y);
  return `  [${f(d[37])}; ${f(d[1462])}]`;
};
function bang(tieuDe, dsX, dieuKien) {
  console.log(`\n=== ${tieuDe}: ${dsX.length} lenh Mua thuong ===`);
  console.log(`${"Nhom".padEnd(50)} ${"n".padStart(5)} ${"%".padStart(4)} ${"laiTB".padStart(6)} ${"thang%".padStart(6)} ${"PF".padStart(5)} ${"xa day%".padStart(7)} ${"qua moc%".padStart(8)} | ${TEN_KY.map((k) => k.padStart(8)).join(" ")} | chenh voi nhom con lai [95%]`);
  for (const [ten, fn] of dieuKien) {
    const a = dsX.filter(fn), b = dsX.filter((t) => !fn(t));
    const ra = a.filter((t) => t.r != null).map((t) => t.r), rb = b.filter((t) => t.r != null).map((t) => t.r);
    const k = thongKe(ra.map((r) => ({ ret: r, phien: 1 })));
    const ky = [0, 1, 2].map((j) => f(tb(a.filter((t) => t.r != null && kyOf(t.ngay) === j).map((t) => t.r)), 2));
    console.log(`${ten.padEnd(50)} ${String(ra.length).padStart(5)} ${((a.length / dsX.length) * 100).toFixed(0).padStart(4)} ${f(k.tb).padStart(6)} ${f(k.thang, 0).padStart(6)} ${f(k.pf).padStart(5)} ${f(tb(a.map((t) => t.xaDay)), 1).padStart(7)} ${((a.filter((t) => t.quaMoc).length / Math.max(a.length, 1)) * 100).toFixed(0).padStart(8)} | ${ky.map((v) => v.padStart(8)).join(" ")} |${boot(ra, rb)}`);
  }
}
const tatCaR = ds.filter((t) => t.r != null);
bang("KHUNG NGAY + TUAN (toan bo lenh)", ds, [
  ["Co phan ky tang NGAY <= 5 phien", (t) => t.pkD5],
  ["Co phan ky tang NGAY <= 10 phien", (t) => t.pkD10],
  ["Co phan ky tang TUAN <= 4 tuan", (t) => t.pkW4],
  ["Co phan ky NGAY hoac TUAN", (t) => t.pkD10 || t.pkW4],
  ["Khong co phan ky ngay / tuan", (t) => !t.pkD10 && !t.pkW4],
  ["Gan day (xa day <= 5%) - khong duoi", (t) => t.xaDay <= 5],
  ["Xa day (> 12%) - duoi song", (t) => t.xaDay > 12],
  ["Da vuot vung mua (dong cua > moc +1%)", (t) => t.quaMoc],
  ["Phan ky ngay/tuan VA xa day <= 8%", (t) => (t.pkD10 || t.pkW4) && t.xaDay <= 8],
  ["Phan ky ngay/tuan VA con trong vung mua", (t) => (t.pkD10 || t.pkW4) && !t.quaMoc],
]);
const dsG = ds.filter((t) => t.coGio);
bang("KHUNG 1 GIO (lenh 10/2023 - 10/2026)", dsG, [
  ["Co phan ky tang 1H <= 10 nen (~2 phien)", (t) => t.pkH10],
  ["Co phan ky tang 1H <= 20 nen (~4 phien)", (t) => t.pkH20],
  ["Co phan ky ngay <= 10 phien", (t) => t.pkD10],
  ["Co phan ky BAT KY (1H / ngay / tuan)", (t) => t.pkBatKy],
  ["Khong co phan ky nao", (t) => !t.pkBatKy],
  ["Phan ky 1H VA ngay", (t) => t.pkH20 && t.pkD10],
  ["Phan ky BAT KY VA khong duoi (xa day <= 8%)", (t) => t.pkBatKy && t.xaDay <= 8],
  ["Khong duoi: xa day <= 5% (khong can phan ky)", (t) => t.xaDay <= 5],
]);
void tatCaR;
