// NGHIEN CUU (2026-10-14): nguong RSI qua mua RIENG theo nhom von hoa: Bluechips VN30 ~70-75, Midcap / Smallcap ~80-85 (gia thuyet: midcap bi keo manh khi RSI > 70 van tang tiep).
// Chi doi nguong "qua mua" (rsiTren); vach 30 va 50 giu nguyen. Thu voi diem TUYEN TINH +-10 (mac dinh hien tai) va voi BAC THANG cung. Mua mo cua phien sau, thoat theo luat he thong, phi 0,4% / vong.
// Chay: node engine/dich-vu/nghienCuuRsiTheoNhom.mjs
import { docJson, chayEngine } from "./backtestChung.mjs";
import { mo, tb, f } from "./nghienCuuLenh.mjs";
import { phanLoaiVonHoa } from "../danh-sach/vonHoa.js";
const cache = docJson("nen_dai.json"), vni = docJson("vnindex_dai.json");
const CUNG = { rsiVungDem: 0 }; // bac thang cung (AFL cu)
const BT = [
  ["GOC: 70 cho moi nhom (tuyen tinh)", {}],
  ["VN30 72, con lai 70", { rsiTrenTheoNhom: { VN30: 72 } }],
  ["VN30 75, con lai 70", { rsiTrenTheoNhom: { VN30: 75 } }],
  ["VN30 70, Midcap / Small 80", { rsiTrenTheoNhom: { Midcap: 80, Smallcap: 80 } }],
  ["VN30 70, Midcap / Small 85", { rsiTrenTheoNhom: { Midcap: 85, Smallcap: 85 } }],
  ["VN30 72, Midcap / Small 80", { rsiTrenTheoNhom: { VN30: 72, Midcap: 80, Smallcap: 80 } }],
  ["VN30 75, Midcap / Small 85", { rsiTrenTheoNhom: { VN30: 75, Midcap: 85, Smallcap: 85 } }],
  ["GOC bac thang cung 70", { ...CUNG }],
  ["Cung: VN30 72, Midcap / Small 80", { ...CUNG, rsiTrenTheoNhom: { VN30: 72, Midcap: 80, Smallcap: 80 } }],
  ["Cung: VN30 75, Midcap / Small 85", { ...CUNG, rsiTrenTheoNhom: { VN30: 75, Midcap: 85, Smallcap: 85 } }],
];
function chay(ts) { const kq = chayEngine({ cache, vni, thamSoThem: ts }); const d = []; for (const t of kq.lenh) { if (![1, 2, 3].includes(t.loai) || t.iv + 3 >= t.n) continue; const E = t.open[t.iv + 1]; if (!(E > 0) || !(t.S < E)) continue; const r = mo(t, { E, vao: t.iv + 1, banTu: t.iv + 3, S: t.S }); if (r) d.push({ ma: t.ma, iv: t.iv, ngay: t.ngay, ret: r.ret, nhom: phanLoaiVonHoa(t.ma) ?? "Khac" }); } return d; }
const st = (g) => { const R = g.map((x) => x.ret), w = R.filter((v) => v > 0), l = R.filter((v) => v <= 0); return { n: g.length, tb: tb(R), th: (100 * w.length) / (R.length || 1), pf: -w.reduce((a, b) => a + b, 0) / l.reduce((a, b) => a + b, 0) }; };
const fm = (s) => `n=${String(s.n).padStart(4)} TB ${f(s.tb).padStart(6)}% thang ${f(s.th, 0).padStart(2)}% PF ${f(s.pf)}`;
const out = [];
for (const [ten, ts] of BT) out.push([ten, chay(ts)]);
const hien = (tieuDe, loc) => { console.log(`\n--- ${tieuDe} ---`); const g0 = out[0][1].filter(loc); for (const [ten, ds] of out) { const g = ds.filter(loc); console.log(ten.padEnd(36), "|", fm(st(g)), "| tu 05/2022:", fm(st(g.filter((x) => x.ngay >= "2022-05-01"))), "| 2026:", fm(st(g.filter((x) => x.ngay >= "2026-01-01")))); } };
hien("TOAN BO", () => true); hien("RIENG VN30", (x) => x.nhom === "VN30"); hien("RIENG MIDCAP", (x) => x.nhom === "Midcap"); hien("RIENG SMALLCAP", (x) => x.nhom === "Smallcap");
const dem = {}; for (const x of out[0][1]) dem[x.nhom] = (dem[x.nhom] || 0) + 1; console.log("\nSo lenh goc theo nhom:", JSON.stringify(dem));
process.exit(0);
