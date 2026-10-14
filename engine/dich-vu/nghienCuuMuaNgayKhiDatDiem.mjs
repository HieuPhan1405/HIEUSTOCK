// NGHIEN CUU (2026-10-14): "mua luon khi dat diem" - bo cac cong phu (vung FVG, ADX >= 18, khoi luong ngay dau) va mua ngay khi diem >= nguong vao.
// Engine HIEN TAI (diem tuyen tinh). Mua mo cua phien sau, thoat theo luat he thong, phi 0,4% / vong. Moi bien the = bo / giu tung cong.
// Chay: node engine/dich-vu/nghienCuuMuaNgayKhiDatDiem.mjs
import { docJson, chayEngine } from "./backtestChung.mjs";
import { mo, tb, f } from "./nghienCuuLenh.mjs";
const cache = docJson("nen_dai.json"), vni = docJson("vnindex_dai.json");
const FVG_TAT = { cheDoFVG: "Luon TAT" }, ADX_TAT = { useADXGate: false }, KL_TAT = { tatCongKhoiLuongNgayDau: true };
const BT = [
  ["MAC DINH (FVG thong minh + ADX + khoi luong)", {}],
  ["Bo cong FVG", { ...FVG_TAT }],
  ["Bo cong ADX", { ...ADX_TAT }],
  ["Bo cong khoi luong ngay dau", { ...KL_TAT }],
  ["Bo FVG + ADX", { ...FVG_TAT, ...ADX_TAT }],
  ["Bo FVG + khoi luong", { ...FVG_TAT, ...KL_TAT }],
  ["MUA NGAY khi diem >= 1,25 (bo ca 3 cong)", { ...FVG_TAT, ...ADX_TAT, ...KL_TAT }],
  ["Mua ngay khi diem >= 1,75", { ...FVG_TAT, ...ADX_TAT, ...KL_TAT, entryTh: 1.75 }],
  ["Mua ngay khi diem >= 2,25", { ...FVG_TAT, ...ADX_TAT, ...KL_TAT, entryTh: 2.25 }],
  ["Mua ngay khi diem >= 2,75", { ...FVG_TAT, ...ADX_TAT, ...KL_TAT, entryTh: 2.75 }],
  ["Mua ngay khi diem >= 3,25", { ...FVG_TAT, ...ADX_TAT, ...KL_TAT, entryTh: 3.25 }],
];
function chay(ts) { const kq = chayEngine({ cache, vni, thamSoThem: ts }); const d = []; for (const t of kq.lenh) { if (![1, 2, 3].includes(t.loai) || t.iv + 3 >= t.n) continue; const E = t.open[t.iv + 1]; if (!(E > 0) || !(t.S < E)) continue; const r = mo(t, { E, vao: t.iv + 1, banTu: t.iv + 3, S: t.S }); if (r) d.push({ ma: t.ma, iv: t.iv, ngay: t.ngay, ret: r.ret }); } return d; }
const st = (g) => { const R = g.map((x) => x.ret), w = R.filter((v) => v > 0), l = R.filter((v) => v <= 0); return { n: g.length, tb: tb(R), th: (100 * w.length) / (R.length || 1), pf: -w.reduce((a, b) => a + b, 0) / l.reduce((a, b) => a + b, 0), tong: R.reduce((a, b) => a + b, 0) }; };
const fm = (s) => `n=${String(s.n).padStart(4)} TB ${f(s.tb).padStart(6)}% thang ${f(s.th, 0).padStart(2)}% PF ${f(s.pf)}`;
console.log("Bien the".padEnd(46), "| TOAN BO (tong %)".padEnd(50), "| tu 05/2022".padEnd(40), "| 2026");
for (const [ten, ts] of BT) { const ds = chay(ts), s = st(ds); console.log(ten.padEnd(46), "|", fm(s), `(${f(s.tong, 0)}%)`.padStart(9), "|", fm(st(ds.filter((x) => x.ngay >= "2022-05-01"))), "|", fm(st(ds.filter((x) => x.ngay >= "2026-01-01")))); }
process.exit(0);
