// MUA VU (Hieu 02/11/2026: "xem dau tu theo mua vu thu xem, cai bang nhiet"): bang nhiet loi suat thang x nam cua VN-Index (2013-2026) + do on dinh theo thang
// (chon thang theo nua dau, kiem tra nua sau) + lai TB lenh Mua thuong theo thang vao lenh (vao moc +0,6%, cat lo <= 6%, phi 0,4%).
// Chay: node engine/dich-vu/nghienCuuMuaVu.mjs
import { docJson, chayEngine, tb, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const vni = docJson("vnindex_dai.json");
const thang = new Map(); // "YYYY-MM" -> dong cua cuoi thang
for (const b of vni) thang.set(b.t.slice(0, 7), b.c);
const keys = [...thang.keys()].sort();
const ret = new Map();
for (let i = 1; i < keys.length; i++) ret.set(keys[i], (thang.get(keys[i]) / thang.get(keys[i - 1]) - 1) * 100);
const nam = [...new Set(keys.map((k) => k.slice(0, 4)))].filter((y) => keys.some((k) => k.startsWith(y) && ret.has(k)));
const TEN = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

console.log("=== BANG NHIET LOI SUAT THANG VN-INDEX (%) ===");
console.log("nam ".padEnd(6) + TEN.map((t) => t.padStart(6)).join("") + "   ca nam");
for (const y of nam) {
  const row = TEN.map((_, m) => { const k = `${y}-${String(m + 1).padStart(2, "0")}`; return ret.has(k) ? f(ret.get(k), 1).padStart(6) : "     ."; }).join("");
  const c0 = thang.get(`${+y - 1}-12`), c1 = [...Array(12).keys()].reverse().map((m) => thang.get(`${y}-${String(m + 1).padStart(2, "0")}`)).find((x) => x != null);
  console.log(y.padEnd(6) + row + "  " + (c0 && c1 ? f((c1 / c0 - 1) * 100, 1).padStart(7) : ""));
}
const theoThang = (loc) => TEN.map((_, m) => [...ret].filter(([k]) => +k.slice(5) === m + 1 && loc(k.slice(0, 4))).map(([, v]) => v));
const tom = (a) => ({ tb: tb(a), md: [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)], duong: a.filter((x) => x > 0).length, n: a.length });
const T = theoThang(() => true).map(tom);
console.log("TB".padEnd(6) + T.map((x) => f(x.tb, 1).padStart(6)).join(""));
console.log("trung vi".padEnd(8) + T.map((x) => f(x.md, 1).padStart(6)).join(""));
console.log("thang+".padEnd(6) + T.map((x) => `${x.duong}/${x.n}`.padStart(6)).join(""));

console.log("\n=== ON DINH: nua dau (2013-2019) vs nua sau (2020-2026) - TB loi suat thang % ===");
const A = theoThang((y) => y <= "2019").map(tom), B = theoThang((y) => y >= "2020").map(tom);
console.log("thang".padEnd(7), "nua dau".padStart(8), "nua sau".padStart(8), " cung dau?");
TEN.forEach((t, m) => console.log(t.padEnd(7), f(A[m].tb, 1).padStart(8), f(B[m].tb, 1).padStart(8), (A[m].tb > 0) === (B[m].tb > 0) ? " co" : " KHONG"));
const tuongQuan = (() => { const x = A.map((a) => a.tb), y = B.map((b) => b.tb), mx = tb(x), my = tb(y); const c = tb(x.map((v, i) => (v - mx) * (y[i] - my))); return c / Math.sqrt(tb(x.map((v) => (v - mx) ** 2)) * tb(y.map((v) => (v - my) ** 2))); })();
console.log(`tuong quan TB thang nua dau vs nua sau: ${f(tuongQuan, 2)} (1 = mua vu on dinh, 0 = ngau nhien)`);
// chon 6 thang tot nhat theo nua dau -> kiem tra nua sau
const top6 = A.map((a, m) => ({ m, v: a.tb })).sort((p, q) => q.v - p.v).slice(0, 6).map((p) => p.m);
const trongTop = (k) => top6.includes(+k.slice(5) - 1);
const chuoi = (loc) => { let v = 1; for (const [k, r] of [...ret].sort()) if (loc(k)) v *= 1 + r / 100; return v; };
const nSau = [...ret].filter(([k]) => k.slice(0, 4) >= "2020").length;
console.log(`6 thang tot nhat nua dau: ${top6.map((m) => TEN[m]).sort().join(", ")} -> nua sau: chi nam trong cac thang do ×${f(chuoi((k) => k >= "2020" && trongTop(k)), 2)} | nam ca nam ×${f(chuoi((k) => k >= "2020"), 2)} | 6 thang con lai ×${f(chuoi((k) => k >= "2020" && !trongTop(k)), 2)}`);

// ---- lenh Mua thuong theo thang vao lenh
console.log("\n=== LENH MUA THUONG THEO THANG VAO LENH (moc +0,6%, ban tu T+2, cat lo <= 6%, phi 0,4%) ===");
const { lenh } = chayEngine({ cache: docJson("nen_dai.json"), vni, giuLenhDangMo: true });
const HT = { moc: HAI_TP, baoVe: true, theoSell: true, danhGiaCuoi: true, catLoToiDaPct: 6 };
const kq = [];
for (const t of lenh.filter((x) => x.loai === 1 && x.iv >= 120)) { const r = mp(t, { ...HT, E: Math.min(t.E * 1.006, t.high[t.iv]), vao: t.iv, banTu: t.iv + 2 }); if (r) kq.push({ ngay: t.ngay, ret: r.ret }); }
const th = (loc) => TEN.map((_, m) => kq.filter((x) => +x.ngay.slice(5, 7) === m + 1 && loc(x.ngay.slice(0, 4))).map((x) => x.ret));
const L = th(() => true), L1 = th((y) => y <= "2019"), L2 = th((y) => y >= "2020");
console.log("thang".padEnd(7), "TB toan".padStart(8), "n".padStart(5), "nua dau".padStart(9), "nua sau".padStart(9), " cung dau?");
TEN.forEach((t, m) => console.log(t.padEnd(7), f(tb(L[m])).padStart(8), String(L[m].length).padStart(5), f(tb(L1[m])).padStart(9), f(tb(L2[m])).padStart(9), (tb(L1[m]) > 0) === (tb(L2[m]) > 0) ? " co" : " KHONG"));
const tqL = (() => { const x = L1.map((a) => tb(a)), y = L2.map((a) => tb(a)), mx = tb(x), my = tb(y); const c = tb(x.map((v, i) => (v - mx) * (y[i] - my))); return c / Math.sqrt(tb(x.map((v) => (v - mx) ** 2)) * tb(y.map((v) => (v - my) ** 2))); })();
console.log(`tuong quan lai TB lenh theo thang, nua dau vs nua sau: ${f(tqL, 2)}; lai TB moi lenh: ${f(tb(kq.map((x) => x.ret)))}% (n ${kq.length})`);
