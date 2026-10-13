// NGHIEN CUU (2026-10-13): lenh co Sanyaku = 0 luc ra tin hieu (chi xet lenh MUA goc) co lenh lai lon khong? Vao mo cua phien sau, cat lo/TP/T+2 cua engine, phi 0,4%.
import { taiLenh, vaoMo, tb, f, boot } from "./nghienCuuLenh.mjs";
const { lenh } = taiLenh();
const rows = [];
for (const t of lenh) { const i = t.iv; if (i < 80 || i + 3 >= t.n) continue; const r = vaoMo(t); if (!r) continue; rows.push({ t, ma: t.ma, ngay: t.ngayArr[i], sy: t.sanyaku?.[i] ?? null, tr: t.trendScore?.[i], r }); }
console.log("lenh:", rows.length, "| gia tri Sanyaku:", JSON.stringify(rows.reduce((o, x) => ((o[x.sy] = (o[x.sy] || 0) + 1), o), {})));
const pf = (a) => { const g = a.filter((x) => x > 0).reduce((s, x) => s + x, 0), l = -a.filter((x) => x <= 0).reduce((s, x) => s + x, 0); return l > 0 ? g / l : NaN; };
const nhom = (x) => (x.sy >= 1 ? "Sanyaku >= 1" : "Sanyaku = 0");
for (const [ten, tu] of [["TOAN BO", "0000"], ["TU 2022.5", "2022-05-01"]]) {
  console.log(`\n=== ${ten} ===`);
  console.log("Nhom".padEnd(14), "lenh".padStart(5), "TB lai%".padStart(8), "thang%".padStart(7), "PF".padStart(5), ">=+10%".padStart(8), ">=+20%".padStart(8), ">=+30%".padStart(8), "lo<=-6%".padStart(8), "lai TB cua nhom thang".padStart(22), "lai max");
  for (const g of ["Sanyaku = 0", "Sanyaku >= 1"]) {
    const a = rows.filter((x) => x.ngay >= tu && nhom(x) === g); const R = a.map((x) => x.r.ret);
    const pc = (k) => (R.filter((x) => x >= k).length / R.length) * 100;
    const win = R.filter((x) => x > 0);
    console.log(g.padEnd(14), String(a.length).padStart(5), f(tb(R)).padStart(8), f((win.length / R.length) * 100, 1).padStart(7), f(pf(R)).padStart(5), (f(pc(10), 1) + "%").padStart(8), (f(pc(20), 1) + "%").padStart(8), (f(pc(30), 1) + "%").padStart(8), (f((R.filter((x) => x <= -6).length / R.length) * 100, 1) + "%").padStart(8), f(tb(win)).padStart(22), f(Math.max(...R)));
  }
}
// Danh sach lenh lai lon nhat cua nhom Sanyaku = 0
const s0 = rows.filter((x) => x.sy === 0 || x.sy == null || x.sy < 1).sort((a, b) => b.r.ret - a.r.ret);
console.log("\nTOP 15 lenh Sanyaku = 0 lai lon nhat (ngay tin hieu | mo cua phien sau -> thoat | so phien | ly do | diem trend):");
for (const x of s0.slice(0, 15)) console.log(`  ${x.ma.padEnd(5)} ${x.ngay} | lai ${f(x.r.ret, 1).padStart(6)}% | ${String(x.r.phien).padStart(3)} phien | ${x.r.ly.padEnd(8)} | trend ${x.tr}`);
// theo nam: ty le lenh lai >= 10% moi nhom
console.log("\nTheo nam: % lenh lai >= +10% | Sanyaku=0 (n) vs >=1 (n)");
for (const y of [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]) {
  const a = rows.filter((x) => +x.ngay.slice(0, 4) === y); const z = a.filter((x) => nhom(x) === "Sanyaku = 0"), o = a.filter((x) => nhom(x) !== "Sanyaku = 0");
  if (z.length < 10) continue;
  const p = (g) => f((g.filter((x) => x.r.ret >= 10).length / (g.length || 1)) * 100, 1) + "%";
  console.log(`  ${y}: ${p(z).padStart(6)} (${z.length}) vs ${p(o).padStart(6)} (${o.length}) | TB lai: ${f(tb(z.map((x) => x.r.ret)))} vs ${f(tb(o.map((x) => x.r.ret)))}`);
}
const z = rows.filter((x) => nhom(x) === "Sanyaku = 0").map((x) => x.r.ret), o = rows.filter((x) => nhom(x) !== "Sanyaku = 0").map((x) => x.r.ret);
const [lo, hi] = boot(z, o); console.log(`\nToan bo: TB lai (Sanyaku=0) - (>=1) = ${f(tb(z) - tb(o))} diem % [95% CI ${f(lo)} .. ${f(hi)}]`);
process.exit(0);
