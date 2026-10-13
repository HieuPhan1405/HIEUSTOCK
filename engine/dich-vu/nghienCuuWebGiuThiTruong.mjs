// NGHIEN CUU (2026-10-13): luc MUA, thi truong chung co dang "ban nhieu hon mua" khong? So lenh web giu va lenh he thong giu (lenh_mua_chot dang mo) theo: do rong (so ma tang / giam), VN-Index, khoi ngoai rong, tai ngay mua.
// Chay: node engine/dich-vu/nghienCuuWebGiuThiTruong.mjs <lmc.json> <signals.json>   (lmc.json = /api/lenh-mua-chot-xem; signals.json = /api/signals, de lay danh sach ma)
import { readFileSync } from "node:fs";
const [lmcF, sigF] = process.argv.slice(2);
const L = JSON.parse(readFileSync(lmcF, "utf-8")).dong.filter((l) => l.trang_thai === "mo");
const ma = [...new Set(JSON.parse(readFileSync(sigF, "utf-8")).tinHieu.map((r) => r.ma))].filter((m) => m !== "VNINDEX");
const GOC = "https://www.cloudstock.id.vn";
const lay = async (u) => { for (let i = 0; i < 3; i++) { try { const r = await fetch(u, { signal: AbortSignal.timeout(30000) }); if (r.ok) return await r.json(); } catch {} await new Promise((r) => setTimeout(r, 500 * (i + 1))); } return null; };
const nenMa = {}; let k = 0;
await Promise.all(Array.from({ length: 12 }, async () => { while (k < ma.length) { const m = ma[k++]; const j = await lay(`${GOC}/api/gia-lich-su?ma=${m}&kt=D`); if (j?.nen) nenMa[m] = j.nen.slice(-90).map((b) => ({ t: b.t, c: b.c })); } }));
const vn = (await lay(`${GOC}/api/gia-lich-su?ma=VNINDEX&kt=D`))?.nen?.slice(-90).map((b) => ({ t: b.t, c: b.c })) ?? [];
console.log("ma co nen:", Object.keys(nenMa).length, "/", ma.length);
// Do rong theo ngay
const dsNgay = vn.map((b) => b.t); const rong = {};
for (let i = 1; i < dsNgay.length; i++) {
  const d = dsNgay[i], dp = dsNgay[i - 1]; let tang = 0, giam = 0, dung = 0;
  for (const m of Object.keys(nenMa)) { const a = nenMa[m].find((b) => b.t === d), b = nenMa[m].find((b) => b.t === dp); if (!a || !b) continue; if (a.c > b.c) tang++; else if (a.c < b.c) giam++; else dung++; }
  rong[d] = { tang, giam, dung, vniPct: (vn[i].c / vn[i - 1].c - 1) * 100 };
}
// Khoi ngoai theo ngay (chi cac ngay mua)
const ngayMua = [...new Set(L.map((l) => String(l.ngay_mua).slice(0, 10)))].filter((d) => d >= (dsNgay[1] || "0"));
const ngoai = {};
for (const d of ngayMua) { const j = await lay(`https://api-finfo.vndirect.com.vn/v4/foreigns?q=type:STOCK~tradingDate:${d}&size=2000&fields=code,floor,netVal`); if (j?.data?.length) ngoai[d] = j.data.filter((x) => x.floor === "HOSE").reduce((s, x) => s + x.netVal, 0) / 1e9; }
const row = (l) => { const d = String(l.ngay_mua).slice(0, 10); const r = rong[d]; return { ...l, d, r, ng: ngoai[d] }; };
const R = L.map(row).filter((x) => x.r);
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (v, n = 1) => (Number.isFinite(v) ? v.toFixed(n) : "-");
console.log("\nlenh co du lieu thi truong ngay mua:", R.length, "/", L.length, "(lenh mua truoc", dsNgay[1], "khong co du lieu ngay mua trong 90 phien gan nhat)");
for (const [ten, g] of [["WEB GIU", R.filter((x) => x.web_giu)], ["HE THONG GIU", R.filter((x) => !x.web_giu)]]) {
  const ty = g.map((x) => x.r.tang / Math.max(1, x.r.tang + x.r.giam));
  console.log(`\n${ten}: ${g.length} lenh | ngay mua: so ma tang / giam TB ${f(tb(g.map((x) => x.r.tang)), 0)} / ${f(tb(g.map((x) => x.r.giam)), 0)} | ty le tang/(tang+giam) TB ${f(tb(ty) * 100, 0)}% | VN-Index ngay mua TB ${f(tb(g.map((x) => x.r.vniPct)), 2)}% | khoi ngoai HOSE rong TB ${f(tb(g.filter((x) => x.ng != null).map((x) => x.ng)), 0)} ty (${g.filter((x) => x.ng != null).length} lenh)`);
  console.log(`   ngay mua co SO MA GIAM > TANG: ${g.filter((x) => x.r.giam > x.r.tang).length}/${g.length} | VN-Index giam: ${g.filter((x) => x.r.vniPct < 0).length}/${g.length} | khoi ngoai ban rong: ${g.filter((x) => x.ng != null && x.ng < 0).length}/${g.filter((x) => x.ng != null).length}`);
}
console.log("\nChi tiet lenh web giu: ma | ngay mua | tang/giam | VN-Index | khoi ngoai HOSE (ty)");
for (const x of R.filter((x) => x.web_giu)) console.log(`  ${x.ma.padEnd(5)} ${x.d} | ${x.r.tang}/${x.r.giam} | ${f(x.r.vniPct, 2)}% | ${f(x.ng, 0)}`);
console.log("\nBang ngay (cac ngay co lenh mua): ngay | tang/giam | VN-Index | khoi ngoai | so lenh web giu / he thong giu");
for (const d of [...new Set(R.map((x) => x.d))].sort()) { const r = rong[d]; console.log(`  ${d} | ${r.tang}/${r.giam} | ${f(r.vniPct, 2)}% | ${f(ngoai[d], 0)} | ${R.filter((x) => x.d === d && x.web_giu).length} / ${R.filter((x) => x.d === d && !x.web_giu).length}`); }
process.exit(0);
