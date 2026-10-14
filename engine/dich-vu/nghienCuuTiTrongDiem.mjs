// NGHIEN CUU (2026-10-14): ti trong 3 thanh phan cua diem tong (Trend x 1,5 + MF x 1,2 + Mom x 1,0). Thu cac to hop trong so, GIU NGUYEN TONG TRONG SO (3,7)
// de cac nguong vao 1,25 / bo qua FVG 2,25 / ban -1,5 van cung thang do. Engine hien tai (diem tuyen tinh). Mua mo cua phien sau, thoat theo luat he thong, phi 0,4% / vong.
// Chay: node engine/dich-vu/nghienCuuTiTrongDiem.mjs
import { docJson, chayEngine } from "./backtestChung.mjs";
import { mo, tb, f } from "./nghienCuuLenh.mjs";
const cache = docJson("nen_dai.json"), vni = docJson("vnindex_dai.json");
const T = 3.7, chuanHoa = (a, b, c) => { const s = a + b + c; return { trend: (a / s) * T, mf: (b / s) * T, mom: (c / s) * T }; };
const BT = [
  ["GOC  Trend 1,5 / MF 1,2 / Mom 1,0", { trend: 1.5, mf: 1.2, mom: 1.0 }],
  ["Deu nhau 1 / 1 / 1", chuanHoa(1, 1, 1)],
  ["Chi Trend (1 / 0 / 0)", chuanHoa(1, 0, 0)],
  ["Chi MF (0 / 1 / 0)", chuanHoa(0, 1, 0)],
  ["Chi Mom (0 / 0 / 1)", chuanHoa(0, 0, 1)],
  ["Bo Trend (0 / 1 / 1)", chuanHoa(0, 1, 1)],
  ["Bo MF (1 / 0 / 1)", chuanHoa(1, 0, 1)],
  ["Bo Mom (1 / 1 / 0)", chuanHoa(1, 1, 0)],
  ["Trend nang 2 / 1 / 1", chuanHoa(2, 1, 1)],
  ["Trend nang 3 / 1 / 1", chuanHoa(3, 1, 1)],
  ["Trend nhe 1 / 1,5 / 1,5", chuanHoa(1, 1.5, 1.5)],
  ["MF nang 1 / 2 / 1", chuanHoa(1, 2, 1)],
  ["Mom nang 1 / 1 / 2", chuanHoa(1, 1, 2)],
  ["Mom nhe 2 / 2 / 1", chuanHoa(2, 2, 1)],
  ["MF nhe 2 / 1 / 2", chuanHoa(2, 1, 2)],
];
function chay(ts) { const kq = chayEngine({ cache, vni, thamSoThem: ts }); const d = []; for (const t of kq.lenh) { if (![1, 2, 3].includes(t.loai) || t.iv + 3 >= t.n) continue; const E = t.open[t.iv + 1]; if (!(E > 0) || !(t.S < E)) continue; const r = mo(t, { E, vao: t.iv + 1, banTu: t.iv + 3, S: t.S }); if (r) d.push({ ma: t.ma, iv: t.iv, ngay: t.ngay, ret: r.ret }); } return d; }
const st = (g) => { const R = g.map((x) => x.ret), w = R.filter((v) => v > 0), l = R.filter((v) => v <= 0); return { n: g.length, tb: tb(R), th: (100 * w.length) / (R.length || 1), pf: -w.reduce((a, b) => a + b, 0) / l.reduce((a, b) => a + b, 0) }; };
const fm = (s) => `n=${String(s.n).padStart(4)} TB ${f(s.tb).padStart(6)}% thang ${f(s.th, 0).padStart(2)}% PF ${f(s.pf)}`;
let goc = null;
const onDinh = (g, d) => { const m = new Map(); for (const x of d) { if (!m.has(x.ma)) m.set(x.ma, []); m.get(x.ma).push(x.iv); } let c = 0; for (const x of g) if ((m.get(x.ma) || []).includes(x.iv)) c++; return `${f(100 * c / g.length, 0)}%`; };
console.log("Ti trong (da chuan hoa tong 3,7)".padEnd(40), "| TOAN BO".padEnd(40), "| truoc 05/2022".padEnd(38), "| tu 05/2022".padEnd(38), "| 2026".padEnd(38), "| cung ngay vs goc");
for (const [ten, w] of BT) { const ds = chay({ trongSoDiem: w }); if (!goc) goc = ds; console.log(`${ten}`.padEnd(40), "|", fm(st(ds)), "|", fm(st(ds.filter((x) => x.ngay < "2022-05-01"))), "|", fm(st(ds.filter((x) => x.ngay >= "2022-05-01"))), "|", fm(st(ds.filter((x) => x.ngay >= "2026-01-01"))), "|", ds === goc ? "-" : onDinh(goc, ds)); }
process.exit(0);
