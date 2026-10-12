// NGHIEN CUU NANG CAP RA LENH (2026-10-12) - doc het ket qua o DesktopPhan-Hieu-Stock-Nang-Cap-Ra-Lenh-v2.md. Chay: node engine/dich-vu/nghienCuuLenh_catLo.mjs | _dacTrung.mjs | _thoat.mjs
import { taiLenh, vaoMo, tb, f, boot } from "./nghienCuuLenh.mjs";
const { lenh } = taiLenh();
const swing5 = (t) => Math.min(...t.low.slice(Math.max(0, t.iv - 4), t.iv + 1)) * 0.995;
const D = [];
for (const t of lenh) {
  const i = t.iv; if (i < 80 || !t.vol) continue;
  const E = t.open[i + 1]; const S2 = swing5(t); if (!(S2 < E * 0.995)) continue;
  const r1 = vaoMo(t); const r2 = vaoMo(t, { S: S2 }); const r3 = vaoMo(t, { S: S2, moc: [] }); if (!r1 || !r2 || !r3) continue;
  const c = t.close, h = t.high, l = t.low, o = t.open, v = t.vol;
  const rng = h[i] - l[i] || 1e-9, atr = t.atr[i] || 1e-9;
  const avg = (arr, a, b) => { let s = 0, n = 0; for (let k = a; k <= b; k++) { if (Number.isFinite(arr[k])) { s += arr[k]; n++; } } return n ? s / n : NaN; };
  const hh = (a, b) => Math.max(...h.slice(a, b + 1)), ll = (a, b) => Math.min(...l.slice(a, b + 1));
  let up = 0, dn = 0; for (let k = i - 9; k <= i; k++) { if (c[k] >= c[k - 1]) up += v[k]; else dn += v[k]; }
  const prevLow20 = ll(i - 24, i - 5), recentLow = ll(i - 4, i);
  const sma200 = avg(c, i - 199, i), sma50 = t.sma50[i];
  const bodyTop = Math.max(o[i], c[i]), bodyBot = Math.min(o[i], c[i]);
  const dtr = {
    // ---- VSA / Wyckoff
    "VSA: khoi luong tuong doi nen tin hieu (RelVol)": t.relVol[i],
    "VSA: vi tri dong cua trong nen (CLV 0-1)": (c[i] - l[i]) / rng,
    "VSA: bien do nen / ATR": rng / atr,
    "VSA: khoi luong len / khoi luong xuong 10 phien": up / (dn || 1),
    "VSA: KL TB 5 phien / KL TB 20 phien": avg(v, i - 4, i) / (avg(v, i - 19, i) || 1),
    "VSA: can cung (RelVol TB 5 phien truoc nen tin hieu)": avg(t.relVol, i - 5, i - 1),
    "VSA: no luc/ket qua (RelVol / bien do nen-ATR)": (t.relVol[i] || 0) / (rng / atr || 1),
    "Wyckoff: Spring (day 5 phien pha day 20 phien truoc, dong cua tren day cu) 1/0": recentLow < prevLow20 && c[i] > prevLow20 ? 1 : 0,
    "Wyckoff: SOS (dong cua > dinh 20 phien truoc) 1/0": c[i] > hh(i - 20, i - 1) ? 1 : 0,
    "Wyckoff: SOS + RelVol > 1,5 1/0": c[i] > hh(i - 20, i - 1) && t.relVol[i] > 1.5 ? 1 : 0,
    "Wyckoff: khoang cach toi dinh 60 phien (%, am = dang duoi)": (c[i] / hh(i - 59, i) - 1) * 100,
    "Wyckoff: do dai nen tich luy (so nen trong +-4% quanh gia, 30 nen)": c.slice(i - 29, i + 1).filter((x) => Math.abs(x / c[i] - 1) <= 0.04).length,
    "Wyckoff: nen chat 20 phien (bien do 20 nen / gia %)": ((hh(i - 19, i) - ll(i - 19, i)) / c[i]) * 100,
    "Co cau: ATR hien tai / ATR TB 50 nen": atr / (avg(t.atr, i - 49, i) || 1),
    "Co cau: gia / SMA200 (%)": (c[i] / sma200 - 1) * 100,
    "Co cau: SMA50 tren SMA200 1/0": sma50 > sma200 ? 1 : 0,
    // ---- Mau hinh nen
    "Nen: than nen / bien do (0-1)": (bodyTop - bodyBot) / rng,
    "Nen: rau tren / bien do": (h[i] - bodyTop) / rng,
    "Nen: rau duoi / bien do (hammer)": (bodyBot - l[i]) / rng,
    "Nen: nen xanh (dong > mo) 1/0": c[i] > o[i] ? 1 : 0,
    "Nen: bullish engulfing 1/0": c[i - 1] < o[i - 1] && c[i] > o[i] && c[i] >= o[i - 1] && o[i] <= c[i - 1] ? 1 : 0,
    "Nen: inside bar 1/0": h[i] <= h[i - 1] && l[i] >= l[i - 1] ? 1 : 0,
    "Nen: so nen xanh trong 3 nen gan nhat": [0, 1, 2].filter((k) => c[i - k] > o[i - k]).length,
    "Nen: nen tin hieu cao hon dinh hom truoc 1/0": h[i] > h[i - 1] ? 1 : 0,
    // ---- Thoi diem vao
    "Vao: gap mo cua phien vao (%)": (o[i + 1] / c[i] - 1) * 100,
    "Vao: mo cua phien vao so voi dinh nen tin hieu (%)": (o[i + 1] / h[i] - 1) * 100,
    "Vao: tang 5 phien truoc": (c[i] / c[i - 5] - 1) * 100,
    "Vao: tang 20 phien truoc": (c[i] / c[i - 20] - 1) * 100,
  };
  D.push({ ngay: t.ngay, y1: r1.ret, y2: r2.ret / r2.rSize, y3: r3.ret / r3.rSize, r1, r2, r3, dtr, gap: (o[i + 1] / c[i] - 1) * 100 });
}
console.log("lenh co du dac trung:", D.length, "| TB ret (cat lo engine)", f(tb(D.map((d) => d.y1))), "| TB R-multiple (cat lo day 5 phien)", f(tb(D.map((d) => d.y2)), 3));

const TU = "2022-05-01";
const train = D.filter((d) => d.ngay < TU), test = D.filter((d) => d.ngay >= TU);
const keys = Object.keys(D[0].dtr).filter((k) => !k.startsWith("Co cau: SMA50") && !k.startsWith("Wyckoff: SOS (") && !k.startsWith("Nen: nen xanh") && !k.startsWith("Nen: nen tin hieu cao"));
// 1) Chon dac trung + huong CHI TU TRAIN (theo R-multiple cua cat lo day 5 phien), khong nhin TEST
const luat = [];
for (const k of keys) {
  const tv = train.map((d) => d.dtr[k]).filter(Number.isFinite).sort((a, b) => a - b); if (tv.length < 300) continue;
  const med = tv[Math.floor(tv.length / 2)];
  const bin = (x) => x > med ? 1 : 0;
  const a = [[], []]; train.forEach((d) => { const x = d.dtr[k]; if (Number.isFinite(x)) a[bin(x)].push(d.y2); });
  if (a[0].length < 100 || a[1].length < 100) continue;
  luat.push({ k, med, huong: tb(a[1]) > tb(a[0]) ? 1 : 0, d: Math.abs(tb(a[1]) - tb(a[0])) });
}
luat.sort((x, y) => y.d - x.d);
const TOP = luat.slice(0, 10);
console.log("MUOI QUY TAC CHON CHI TU TRAIN (huong tot = " + "CAO/THAP so voi trung vi):");
TOP.forEach((x) => console.log("  ", x.k.padEnd(78), x.huong ? "CAO tot" : "THAP tot", " trung vi train =", f(x.med, 4), " |chenh R| train", f(x.d, 3)));
const diem = (d) => TOP.reduce((s, x) => { const v = d.dtr[x.k]; return s + (Number.isFinite(v) && (v > x.med ? 1 : 0) === x.huong ? 1 : 0); }, 0);
for (const [ten, ds] of [["TRAIN (truoc 2022.5)", train], ["TEST (tu 2022.5) - sach", test]]) {
  console.log(`
=== DIEM CHAT LUONG VAO LENH (0-10) — ${ten} ===`);
  console.log("Diem".padEnd(8), "n".padStart(5), "TB lai% (cat lo engine)", "thang%", "TB R (cat lo day 5)", "thang% (day 5)");
  for (const [a, b] of [[0, 3], [4, 5], [6, 7], [8, 10]]) {
    const g = ds.filter((d) => { const sc = diem(d); return sc >= a && sc <= b; }); if (!g.length) continue;
    console.log(`${a}-${b}`.padEnd(8), String(g.length).padStart(5), f(tb(g.map((d) => d.y1))).padStart(14), f(g.filter((d) => d.y1 > 0).length / g.length * 100, 1).padStart(14), f(tb(g.map((d) => d.y2)), 3).padStart(14), f(g.filter((d) => d.r2.ret > 0).length / g.length * 100, 1).padStart(12));
  }
}
const hi = test.filter((d) => diem(d) >= 7), lo2 = test.filter((d) => diem(d) <= 5);
const [lo, hiC] = boot(hi.map((d) => d.y2), lo2.map((d) => d.y2));
console.log(`
TEST: diem >= 7 (${hi.length} lenh) vs diem <= 5 (${lo2.length} lenh): chenh TB R = ${f(tb(hi.map((d) => d.y2)) - tb(lo2.map((d) => d.y2)), 3)} [95% CI ${f(lo, 3)} .. ${f(hiC, 3)}]`);
const [lo3, hi3] = boot(hi.map((d) => d.y1), lo2.map((d) => d.y1));
console.log(`TEST: cung nhom, chenh TB lai/lenh (cat lo engine) = ${f(tb(hi.map((d) => d.y1)) - tb(lo2.map((d) => d.y1)))} [95% CI ${f(lo3)} .. ${f(hi3)}]`);
console.log("Theo nam (TEST): nam | n(diem>=7) TB R | n(diem<=5) TB R");
for (const y of [2022, 2023, 2024, 2025, 2026]) { const a = test.filter((d) => +d.ngay.slice(0, 4) === y); const h = a.filter((d) => diem(d) >= 7), l2 = a.filter((d) => diem(d) <= 5); console.log(`  ${y} | ${String(h.length).padStart(4)} ${f(tb(h.map((d) => d.y2)), 3).padStart(7)} | ${String(l2.length).padStart(4)} ${f(tb(l2.map((d) => d.y2)), 3).padStart(7)}`); }

// ===== SO SANH TONG HOP (rui ro co dinh: moi lenh mat toi da 1R) =====
function tongHop(ds, y, ten) {
  const R = ds.map((d) => d[y]);
  const thang = R.filter((x) => x > 0), thua = R.filter((x) => x <= 0);
  const pf = thang.reduce((a, b) => a + b, 0) / Math.abs(thua.reduce((a, b) => a + b, 0) || 1);
  // rut von (theo R cong don, theo thu tu ngay)
  const ord = [...ds].sort((a, b) => (a.ngay < b.ngay ? -1 : 1)); let c = 0, dinh = 0, sut = 0; ord.forEach((d) => { c += d[y]; dinh = Math.max(dinh, c); sut = Math.max(sut, dinh - c); });
  const nam = (Date.parse(ord.at(-1).ngay) - Date.parse(ord[0].ngay)) / (365.25 * 86400e3);
  console.log(ten.padEnd(58), String(ds.length).padStart(5), f(tb(R), 3).padStart(7), f(thang.length / ds.length * 100, 1).padStart(7), f(pf).padStart(5), f(R.reduce((a, b) => a + b, 0) / nam, 1).padStart(8), f(sut, 1).padStart(8));
}
const diemQ = (d) => TOP.reduce((s2, x) => { const v = d.dtr[x.k]; return s2 + (Number.isFinite(v) && (v > x.med ? 1 : 0) === x.huong ? 1 : 0); }, 0);
for (const [ten, ds] of [["TRAIN (truoc 2022.5)", train], ["TEST (tu 2022.5)", test]]) {
  console.log("=== " + ten + " — R trung binh/lenh | thang% | PF | tong R moi nam | rut von toi da (R) ===");
  console.log("Cau hinh".padEnd(58), "lenh".padStart(5), "TB R".padStart(7), "thang%".padStart(7), "PF".padStart(5), "R/nam".padStart(8), "rutvon".padStart(8));
  const A = ds, A1 = ds.map((d) => ({ ...d, yy: d.y1 / (d.r1.rSize) * 1 }));
  const cauHinh = [
    ["A. Hien tai (cat lo engine, chot tung phan)", A.map((d) => ({ ...d, v: d.r1.ret / d.r1.rSize })), "v"],
    ["B. + cat lo day 5 phien (rui ro co dinh)", A.map((d) => ({ ...d, v: d.y2 })), "v"],
    ["C. B + khong chot tung phan (de loi chay)", A.map((d) => ({ ...d, v: d.y3 })), "v"],
    ["D. C + chi vao lenh co diem chat luong >= 6", A.filter((d) => diemQ(d) >= 6).map((d) => ({ ...d, v: d.y3 })), "v"],
    ["E. C + chi vao lenh co diem chat luong >= 8", A.filter((d) => diemQ(d) >= 8).map((d) => ({ ...d, v: d.y3 })), "v"],
    ["F. C + bo lenh gap mo cua > +1%", A.filter((d) => d.gap <= 1).map((d) => ({ ...d, v: d.y3 })), "v"],
    ["G. B + diem chat luong >= 6 (giu chot tung phan)", A.filter((d) => diemQ(d) >= 6).map((d) => ({ ...d, v: d.y2 })), "v"],
  ];
  for (const [t2, arr, y] of cauHinh) if (arr.length > 30) tongHop(arr, y, t2);
}
process.exit(0);
