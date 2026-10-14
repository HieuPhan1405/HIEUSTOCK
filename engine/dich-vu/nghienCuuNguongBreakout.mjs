// NGHIEN CUU (2026-10-14): nguong DOT PHA (nguongDiemBreakout) - diem >= entryTh (1,25) + nguong nay VA khoi luong ngay dau dat thi bo qua cong vung FVG va mua ngay.
// Mac dinh 1,0 (tuc diem >= 2,25). Thu cac muc khac tren engine HIEN TAI (diem tuyen tinh RSI / MFI +-10). Mua mo cua phien sau, thoat theo luat he thong, phi 0,4% / vong.
// Chay: node engine/dich-vu/nghienCuuNguongBreakout.mjs
import { docJson, chayEngine } from "./backtestChung.mjs";
import { mo, tb, f } from "./nghienCuuLenh.mjs";
const cache = docJson("nen_dai.json"), vni = docJson("vnindex_dai.json");
const BT = [["0,25 (diem >= 1,5)", 0.25], ["0,5 (>= 1,75)", 0.5], ["0,75 (>= 2,0)", 0.75], ["1,0 (>= 2,25) - MAC DINH", 1.0], ["1,25 (>= 2,5)", 1.25], ["1,5 (>= 2,75)", 1.5], ["2,0 (>= 3,25)", 2.0], ["3,0 (>= 4,25)", 3.0], ["TAT dot pha (khong bao gio)", 99]];
function chay(ts) { const kq = chayEngine({ cache, vni, thamSoThem: ts }); const d = []; for (const t of kq.lenh) { if (![1, 2, 3].includes(t.loai) || t.iv + 3 >= t.n) continue; const E = t.open[t.iv + 1]; if (!(E > 0) || !(t.S < E)) continue; const r = mo(t, { E, vao: t.iv + 1, banTu: t.iv + 3, S: t.S }); if (r) d.push({ ma: t.ma, iv: t.iv, ngay: t.ngay, ret: r.ret }); } return d; }
const st = (g) => { const R = g.map((x) => x.ret), w = R.filter((v) => v > 0), l = R.filter((v) => v <= 0); return { n: g.length, tb: tb(R), th: (100 * w.length) / (R.length || 1), pf: -w.reduce((a, b) => a + b, 0) / l.reduce((a, b) => a + b, 0) }; };
const fm = (s) => `n=${String(s.n).padStart(4)} TB ${f(s.tb).padStart(6)}% thang ${f(s.th, 0).padStart(2)}% PF ${f(s.pf)}`;
let goc = null; const kq = [];
for (const [ten, v] of BT) { const ds = chay({ nguongDiemBreakout: v }); kq.push([ten, v, ds]); if (v === 1.0) goc = ds; }
const onDinh = (g, d) => { const m = new Map(); for (const x of d) { if (!m.has(x.ma)) m.set(x.ma, []); m.get(x.ma).push(x.iv); } let c = 0, l = 0, k = 0; for (const x of g) { const a = m.get(x.ma) || []; if (a.includes(x.iv)) c++; else if (a.some((y) => Math.abs(y - x.iv) <= 3)) l++; else k++; } return `${f(100 * c / g.length, 0)}% / ${f(100 * l / g.length, 0)}% / ${f(100 * k / g.length, 0)}%`; };
console.log("Nguong dot pha".padEnd(30), "| TOAN BO".padEnd(45), "| truoc 05/2022".padEnd(40), "| tu 05/2022".padEnd(40), "| 2026".padEnd(40), "| on dinh vs 1,0 (cung / lech / mat)");
for (const [ten, , ds] of kq) console.log(ten.padEnd(30), "|", fm(st(ds)), "|", fm(st(ds.filter((x) => x.ngay < "2022-05-01"))), "|", fm(st(ds.filter((x) => x.ngay >= "2022-05-01"))), "|", fm(st(ds.filter((x) => x.ngay >= "2026-01-01"))), "|", ds === goc ? "-" : onDinh(goc, ds));
process.exit(0);
