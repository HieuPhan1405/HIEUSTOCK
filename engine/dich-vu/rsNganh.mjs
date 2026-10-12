// RS NGANH hien tai: loi suat trung binh (bình quân các mã) 20 / 60 phien cua tung nganh so voi VN-Index, % mã trên SMA50. Chay: node engine/dich-vu/rsNganh.mjs
import { docJson } from "./backtestChung.mjs";
import { NGANH } from "../danh-sach/nganh.js";
const cache = docJson("nen_dai.json"), vni = docJson("vnindex_dai.json");
const ngay = vni.map((b) => b.t), D = ngay.length, chiSo = new Map(ngay.map((t, i) => [t, i]));
const gia = new Map();
for (const [ma, nen] of Object.entries(cache)) { const c = new Array(D).fill(NaN); for (const b of nen) { const i = chiSo.get(b.t); if (i != null) c[i] = b.c; } gia.set(ma, c); }
let i = D - 1; while (i > 0 && [...gia.values()].filter((c) => Number.isFinite(c[i])).length < 300) i--;
const ret = (c, k) => (c[i - k] > 0 ? (c[i] / c[i - k] - 1) * 100 : NaN);
const tb = (a) => { const v = a.filter(Number.isFinite); return v.length ? v.reduce((x, y) => x + y, 0) / v.length : NaN; };
const trungVi = (a) => { const v = a.filter(Number.isFinite).sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : NaN; };
const vc = vni.map((b) => b.c);
const v20 = ret(vc, 20), v60 = ret(vc, 60);
console.log("Ngay du lieu:", ngay[i], "| VN-Index 20 phien", v20.toFixed(1) + "%", "60 phien", v60.toFixed(1) + "%\n");
const rows = [];
for (const [ten, ds] of NGANH) {
  const cs = [...ds].map((m) => gia.get(m)).filter(Boolean);
  const sma = (c) => { let s = 0, n = 0; for (let k = 0; k < 50; k++) if (Number.isFinite(c[i - k])) { s += c[i - k]; n++; } return n >= 40 ? s / n : NaN; };
  const tren = cs.filter((c) => c[i] > sma(c)).length;
  rows.push({ ten, n: cs.length, r20: trungVi(cs.map((c) => ret(c, 20))), r60: trungVi(cs.map((c) => ret(c, 60))), tren: (tren / cs.length) * 100 });
}
rows.sort((a, b) => b.r20 - a.r20);
console.log("Nganh".padEnd(36), "so ma", " 20p(TV)", " 60p(TV)", " RS20", " RS60", " %>SMA50");
for (const r of rows) console.log(r.ten.padEnd(36), String(r.n).padStart(5), r.r20.toFixed(1).padStart(8), r.r60.toFixed(1).padStart(8), (r.r20 - v20).toFixed(1).padStart(6), (r.r60 - v60).toFixed(1).padStart(6), r.tren.toFixed(0).padStart(8));
process.exit(0);
