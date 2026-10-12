// NGHIEN CUU NANG CAP RA LENH (2026-10-12) - doc het ket qua o DesktopPhan-Hieu-Stock-Nang-Cap-Ra-Lenh-v2.md. Chay: node engine/dich-vu/nghienCuuLenh_catLo.mjs | _dacTrung.mjs | _thoat.mjs
import { taiLenh, vaoMo, mo, tb, f, q } from "./nghienCuuLenh.mjs";
const { lenh } = taiLenh();
const D = [];
for (const t of lenh) { const r = vaoMo(t); if (r) D.push({ t, r, ngay: t.ngay, nam: +t.ngay.slice(0, 4) }); }
console.log("lenh mo phong duoc:", D.length);
const GD = [["TOAN BO", "0000"], ["TU 2022.5", "2022-05-01"]];
for (const [ten, tu] of GD) {
  const ds = D.filter((d) => d.ngay >= tu);
  const thoat = {}; ds.forEach((d) => (thoat[d.r.ly] = (thoat[d.r.ly] || 0) + 1));
  console.log(`\n================ ${ten}: ${ds.length} lenh | TB ${f(tb(ds.map((d) => d.r.ret)))}% | thang ${f(ds.filter((d) => d.r.ret > 0).length / ds.length * 100, 1)}% ================`);
  console.log("Ly do thoat:", Object.entries(thoat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v} (${f(v / ds.length * 100, 0)}%)`).join(" | "));
  const stop = ds.filter((d) => d.r.ly.startsWith("STOP"));
  console.log(`\n-- LENH CAT LO (${stop.length}): TB ${f(tb(stop.map((d) => d.r.ret)))}% | khoang cach cat lo TB ${f(tb(stop.map((d) => d.r.rSize)))}% | gap thung cat lo (STOP_GAP): ${f(stop.filter((d) => d.r.ly === "STOP_GAP").length / stop.length * 100, 1)}%`);
  const ph = stop.map((d) => d.r.phien);
  console.log(`   Cat lo sau bao nhieu phien (tu phien vao): <=2: ${f(ph.filter((x) => x <= 2).length / ph.length * 100, 0)}% | 3-5: ${f(ph.filter((x) => x >= 3 && x <= 5).length / ph.length * 100, 0)}% | 6-10: ${f(ph.filter((x) => x >= 6 && x <= 10).length / ph.length * 100, 0)}% | >10: ${f(ph.filter((x) => x > 10).length / ph.length * 100, 0)}%`);
  // whipsaw: sau khi bi cat lo, gia co lay lai gia vao / dat TP1 trong 10 / 20 phien khong
  let beK = 0, tp1K = 0, tp1K20 = 0, hoi5 = 0, tong = 0;
  for (const d of stop) {
    const t = d.t, j = d.r.j, E = t.open[t.iv + 1]; if (j + 10 >= t.n) continue; tong++;
    const mh = (k) => Math.max(...t.high.slice(j + 1, Math.min(t.n, j + 1 + k)));
    if (mh(10) >= E) beK++;
    if (mh(10) >= t.tp[0]) tp1K++;
    if (mh(20) >= t.tp[0]) tp1K20++;
    if (mh(5) >= d.r.g * 1.05) hoi5++;
  }
  console.log(`   WHIPSAW sau khi bi cat lo (${tong} lenh): hoi ve lai gia vao trong 10 phien: ${f(beK / tong * 100, 1)}% | cham TP1 trong 10 phien: ${f(tp1K / tong * 100, 1)}% | trong 20 phien: ${f(tp1K20 / tong * 100, 1)}% | tang >5% tu gia cat lo trong 5 phien: ${f(hoi5 / tong * 100, 1)}%`);
  // MAE cua lenh thang vs thua (theo % khoang cach cat lo)
  const thang = ds.filter((d) => d.r.ret > 0 && !d.r.ly.startsWith("STOP"));
  const maeR = thang.map((d) => (d.r.mae / d.r.rSize) * 100);
  console.log(`\n-- MAE LENH THANG (${thang.length} lenh, % khoang cach cat lo da bi dap xuong truoc khi thang): trung vi ${f(q(maeR, 0.5), 0)}% | 75%: ${f(q(maeR, 0.75), 0)}% | 90%: ${f(q(maeR, 0.9), 0)}% | da cham >=70% cat lo roi van thang: ${f(maeR.filter((x) => x >= 70).length / maeR.length * 100, 0)}%`);
  // R-multiple cua nhom cat lo: bi gap / tre T+2
  const t2 = ds.filter((d) => d.r.ly.endsWith("_T2"));
  console.log(`   Bi cat lo/BAN muon do quy tac T+2 (ban mo cua phien T+2): ${t2.length} lenh (${f(t2.length / ds.length * 100, 1)}%), TB ${f(tb(t2.map((d) => d.r.ret)))}%`);
}
// ===== BIEN THE CAT LO (chuan hoa theo rui ro) =====
const ATR = (t) => (t.atr[t.iv] / t.close[t.iv]) * 100;
const bienThe = {
  "Hien tai (engine, toi da 6%)": (t) => t.S,
  "ATR x1.0": (t) => t.open[t.iv + 1] * (1 - Math.max(0.5, Math.min(12, 1.0 * ATR(t))) / 100),
  "ATR x1.5": (t) => t.open[t.iv + 1] * (1 - Math.max(0.5, Math.min(12, 1.5 * ATR(t))) / 100),
  "ATR x2.0": (t) => t.open[t.iv + 1] * (1 - Math.max(0.5, Math.min(12, 2.0 * ATR(t))) / 100),
  "ATR x2.5": (t) => t.open[t.iv + 1] * (1 - Math.max(0.5, Math.min(12, 2.5 * ATR(t))) / 100),
  "ATR x3.0": (t) => t.open[t.iv + 1] * (1 - Math.max(0.5, Math.min(14, 3.0 * ATR(t))) / 100),
  "Day 5 phien - 0,5%": (t) => Math.min(...t.low.slice(Math.max(0, t.iv - 4), t.iv + 1)) * 0.995,
  "Day 10 phien - 0,5%": (t) => Math.min(...t.low.slice(Math.max(0, t.iv - 9), t.iv + 1)) * 0.995,
  "Day 20 phien - 0,5%": (t) => Math.min(...t.low.slice(Math.max(0, t.iv - 19), t.iv + 1)) * 0.995,
  "Kijun - 0,5%": (t) => (t.kijun[t.iv] ?? 0) * 0.995,
  "Co dinh 4%": (t) => t.open[t.iv + 1] * 0.96,
  "Co dinh 8%": (t) => t.open[t.iv + 1] * 0.92,
  "Co dinh 10%": (t) => t.open[t.iv + 1] * 0.90,
};
console.log("\n\n=========== BIEN THE VI TRI CAT LO (TP giu nguyen cua engine) — R = khoang cach cat lo; 'lai moi 1% rui ro' = TB(lai / R%) ===========");
console.log("Cat lo".padEnd(30), "n", "  TB lai/lenh", "thang%", " R TB%", " lai/1%rui ro", "  lo>2R", " TB 2022.5+", " R-TB 2022.5+");
for (const [ten, fn] of Object.entries(bienThe)) {
  const kq = [];
  for (const t of lenh) { const E = t.open[t.iv + 1]; const S = fn(t); if (!(S > 0) || !(S < E * 0.995)) continue; const r = mo(t, { E, vao: t.iv + 1, banTu: t.iv + 3, S }); if (r) kq.push({ r, ngay: t.ngay }); }
  const R = (x) => x.r.ret / x.r.rSize;
  const g = kq.filter((x) => x.ngay >= "2022-05-01");
  console.log(ten.padEnd(30), String(kq.length).padStart(5), f(tb(kq.map((x) => x.r.ret))).padStart(8), f(kq.filter((x) => x.r.ret > 0).length / kq.length * 100, 1).padStart(8), f(tb(kq.map((x) => x.r.rSize))).padStart(7), f(tb(kq.map(R))).padStart(10), f(kq.filter((x) => R(x) < -2).length / kq.length * 100, 1).padStart(8), f(tb(g.map((x) => x.r.ret))).padStart(10), f(tb(g.map(R))).padStart(10));
}
process.exit(0);
