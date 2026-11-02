// TEST KE HOACH "TICH SAN" (Hieu 03/11/2026, theo phuong phap dau tu dai han: chon dn tot, chia von 5 lan mua, mua them khi gia chiet khau, chi ban khi dn xau di).
// Ro "tich san" = bo loc loc3 cua nghienCuuPhongCachDauTu.mjs (von hoa >= 20.000 ty, ROE >= 12%, LN tang, an toan tai chinh), 15 ma chia deu, bao cao co hieu luc quy + 50 ngay, phi 0,2%/chieu.
// 3 cau hoi:
//   1) Chia 5 lan mua (cach 1 / 2 thang) co hon dong von mot lan khong? Va "cho tam ly < 20 roi moi mua tiep (toi da 2 thang/lan)" co hon mua deu khong?
//   2) Quy tac ban: chi ban khi het dat bo loc (dn xau di) so voi KHONG BAN BAO GIO va so voi tai co cau hang thang theo top 15.
//   3) Doi chieu cung ke hoach tren VN-Index.
// Moi MOC BAT DAU (moi thang tu 2022-01) la 1 lan thu; do dai H = 12 / 24 thang; so sanh GIA TRI CUOI KY / tong von (tien mat khong sinh lai). Cac moc bat dau chong lan nhau nen so lan thu doc lap it hon so thang.
// Chay: node engine/dich-vu/nghienCuuKeHoachTichSan.mjs
import { docJson, tb, f } from "./backtestChung.mjs";
import { SO_CP_LUU_HANH } from "../../lib/soCoPhieuLuuHanh.js";
import { TAM_LY_LICH_SU } from "../../lib/tamLyLichSuDuLieu.js";

const nen = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const bctc = docJson("bctc_dai.json");
const ngay = vni.map((b) => b.t);
const N = ngay.length;
const idx = new Map(ngay.map((t, i) => [t, i]));
const tl = new Array(N).fill(null);
TAM_LY_LICH_SU.t.forEach((t, k) => { const i = idx.get(t); if (i != null) tl[i] = TAM_LY_LICH_SU.s[k]; });
const ma = [], C = [], G = [];
for (const [k, bars] of Object.entries(nen)) {
  if (bars.length < 260 || !SO_CP_LUU_HANH[k] || !bctc[k]) continue;
  const c = new Array(N).fill(null), g = new Array(N).fill(0);
  for (const b of bars) { const i = idx.get(b.t); if (i != null) { c[i] = b.c; g[i] = b.c * b.v; } }
  let last = null;
  for (let i = 0; i < N; i++) { if (c[i] != null) last = c[i]; else if (last != null) c[i] = last; }
  ma.push(k); C.push(c); G.push(g);
}
const M = ma.length;
const cong = (d, n) => new Date(Date.parse(d) + n * 86400e3).toISOString().slice(0, 10);
const qsAll = [...new Set(ma.flatMap((k) => Object.keys(bctc[k].q)))].sort();
const lui = (q, k) => qsAll[qsAll.indexOf(q) - k];
const gtv = (b, q, it) => b.q[q]?.[it];
const ttm = (b, q, it) => { let s = 0; for (let k = 0; k < 4; k++) { const x = gtv(b, lui(q, k), it); if (!Number.isFinite(x)) return NaN; s += x; } return s; };
const quyHieuLuc = (t) => { let q = null; for (const x of qsAll) { if (cong(x, 50) <= t) q = x; else break; } return q; };
const cacheCB = new Map();
function coBan(j, q) {
  const key = j + "|" + q;
  if (cacheCB.has(key)) return cacheCB.get(key);
  const b = bctc[ma[j]];
  const ln = ttm(b, q, 23003);
  const vcsh = (gtv(b, q, 14000) ?? NaN) + (gtv(b, q, 15000) ?? 0);
  const no = Number.isFinite(gtv(b, q, 13000)) ? gtv(b, q, 13000) : NaN;
  const lq = gtv(b, q, 23003), q4 = lui(q, 4), lq0 = q4 ? gtv(b, q4, 23003) : NaN;
  const o = { ln, roe: (ln / vcsh) * 100, donBay: no / vcsh, quyKhongGiam: Number.isFinite(lq) && Number.isFinite(lq0) ? lq >= lq0 : null, cfo: ttm(b, q, 32000), tsnh: gtv(b, q, 11000), nnh: gtv(b, q, 13100) };
  cacheCB.set(key, o);
  return o;
}
const tb20 = (j, i) => { let s = 0; for (let k = i - 19; k <= i; k++) s += G[j][k]; return s / 20; };
const thanhKhoan = (j, i) => C[j][i] != null && C[j][i - 130] != null && tb20(j, i) >= 5e6;
const vonHoa = (j, i) => C[j][i] * 1000 * SO_CP_LUU_HANH[ma[j]];

const cuoiThang = [];
for (let i = 0; i < N; i++) if (i === N - 1 || ngay[i].slice(0, 7) !== ngay[i + 1].slice(0, 7)) cuoiThang.push(i);
const R = cuoiThang.filter((i) => ngay[i] >= "2022-01-01" && i + 2 < N);
const hoangLoan = (i0) => { for (let k = i0 - 9; k <= i0; k++) if (tl[k] != null && tl[k] < 20) return true; return false; };

const memo = new Map();
function poolTichSan(i0) {
  if (memo.has(i0)) return memo.get(i0);
  const q = quyHieuLuc(ngay[i0]);
  const kq = [];
  if (q) {
    for (let j = 0; j < M; j++) {
      if (!thanhKhoan(j, i0)) continue;
      const b = bctc[ma[j]], cb = coBan(j, q), von = vonHoa(j, i0);
      if (!(cb.ln > 0) || von < 2e13 || cb.roe < 12) continue;
      const ln0 = lui(q, 4) ? ttm(b, lui(q, 4), 23003) : NaN;
      const tang = Number.isFinite(ln0) && ln0 > 0 ? cb.ln / ln0 - 1 : cb.quyKhongGiam ? 0.05 : -1;
      if (tang < 0.05) continue;
      if (b.loai === "pi" && (!(cb.cfo > 0) || cb.donBay > 2.5 || !(cb.tsnh / cb.nnh >= 1))) continue;
      kq.push({ j, s: von });
    }
    kq.sort((a, b) => b.s - a.s);
  }
  memo.set(i0, kq);
  return kq;
}

// chuoi loi suat thang cua danh muc 15 ma bat dau tu thang r0 (giu toi khi thoat theo quy tac)
function chay(r0, thoat, K = 15) {
  const hold = new Map();
  const rets = [];
  for (let r = r0; r + 1 < R.length; r++) {
    const i0 = R[r], i1 = R[r + 1];
    const P = poolTichSan(i0);
    const topK = new Set(P.slice(0, K).map((x) => x.j));
    const inPool = new Set(P.map((x) => x.j));
    let doi = 0;
    for (const j of [...hold.keys()]) if (thoat(j, { topK, inPool })) { hold.delete(j); doi++; }
    for (const x of P) { if (hold.size >= K) break; if (!hold.has(x.j)) { hold.set(x.j, 1); doi++; } }
    let tong = 0;
    for (const j of hold.keys()) tong += C[j][i1 + 1] / C[j][i0 + 1] - 1;
    rets.push(tong / K - (0.002 * doi) / K);
  }
  return rets;
}
const QUY_TAC = {
  "ban khi het dat bo loc (dn xau di)": (j, c) => !c.inPool.has(j),
  "KHONG BAN BAO GIO": () => false,
  "tai co cau hang thang theo top 15": (j, c) => !c.topK.has(j),
};
const vniRets = R.slice(0, -1).map((i0, r) => vni[R[r + 1] + 1].c / vni[i0 + 1].c - 1);

// gia tri cuoi ky / tong von cua ke hoach mua theo lich { t: ty le von mua dau thang t }
function giaTriCuoi(rets, lich, H) {
  let inv = 0, daBo = 0;
  for (let t = 0; t < H; t++) { const a = lich[t] ?? 0; inv += a; daBo += a; inv *= 1 + rets[t]; }
  return inv + (1 - daBo);
}
const lichDeu = (cach) => { const l = {}; for (let k = 0; k < 5; k++) l[k * cach] = 0.2; return l; };
// cho tam ly < 20 roi moi mua tiep: dot 1 ngay luc dau, dot k+1 o thang dau tien (sau dot truoc >= 1 thang) co tam ly < 20, toi da 2 thang sau dot truoc
function lichTamLy(r0) {
  const l = { 0: 0.2 };
  let truoc = 0;
  for (let k = 1; k < 5; k++) {
    let t = truoc + 1;
    while (t < truoc + 2 && !hoangLoan(R[r0 + t])) t++;
    l[t] = 0.2; truoc = t;
  }
  return l;
}
const sd = (a) => { const m = tb(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };

const soThang = R.length - 1;
for (const H of [12, 24]) {
  const batDau = []; // r0 co du H thang sau do
  for (let r0 = 0; r0 + H <= soThang; r0++) batDau.push(r0);
  console.log(`\n=========== H = ${H} thang | ${batDau.length} moc bat dau (${ngay[R[batDau[0]]]} -> ${ngay[R[batDau.at(-1)]]}) ===========`);
  const kqs = {};
  const them = (ten, v) => { (kqs[ten] ??= []).push(v); };
  for (const r0 of batDau) {
    const tichSan = chay(r0, QUY_TAC["ban khi het dat bo loc (dn xau di)"]);
    const vr = vniRets.slice(r0);
    const l1 = { 0: 1 };
    them("TS dong von 1 lan", giaTriCuoi(tichSan, l1, H));
    them("TS chia 5 lan, moi thang", giaTriCuoi(tichSan, lichDeu(1), H));
    them("TS chia 5 lan, 2 thang / lan", giaTriCuoi(tichSan, lichDeu(2), H));
    them("TS chia 5 lan, cho tam ly < 20 (tran 2 thang)", giaTriCuoi(tichSan, lichTamLy(r0), H));
    them("VN-Index dong von 1 lan", giaTriCuoi(vr, l1, H));
    them("VN-Index chia 5 lan, moi thang", giaTriCuoi(vr, lichDeu(1), H));
    them("VN-Index chia 5 lan, cho tam ly < 20", giaTriCuoi(vr, lichTamLy(r0), H));
    for (const [ten, thoat] of Object.entries(QUY_TAC)) them(`QT ${ten} (dong von 1 lan)`, giaTriCuoi(chay(r0, thoat), l1, H));
  }
  console.log("Cach".padEnd(56), "TB x".padStart(6), "do lech".padStart(8), "xau nhat".padStart(9), "tot nhat".padStart(9), "| so voi dong 1 lan cung tai san: TB %".padStart(40), "hon".padStart(7));
  const goc = { TS: kqs["TS dong von 1 lan"], VNI: kqs["VN-Index dong von 1 lan"] };
  for (const [ten, a] of Object.entries(kqs)) {
    const g = ten.startsWith("VN-Index") ? goc.VNI : goc.TS;
    const rel = a.map((x, k) => (x / g[k] - 1) * 100);
    const hon = a.filter((x, k) => x > g[k] + 1e-9).length;
    console.log(ten.padEnd(56), f(tb(a), 3).padStart(6), f(sd(a), 3).padStart(8), f(Math.min(...a), 2).padStart(9), f(Math.max(...a), 2).padStart(9), "|", (ten.includes("dong von 1 lan") ? "-" : f(tb(rel), 1) + "%").padStart(38), `${hon}/${a.length}`.padStart(7));
  }
}

// so lan "cho tam ly" co mua duoc dot sau trong thoi han khong
let tong = 0, tamLy = 0;
for (let r0 = 0; r0 + 12 <= soThang; r0++) { const l = lichTamLy(r0); tong += 4; tamLy += Object.keys(l).filter((t) => t !== "0").filter((t) => hoangLoan(R[r0 + Number(t)])).length; }
console.log(`\n(Trong ${tong} dot mua sau cua ke hoach cho tam ly, ${tamLy} dot (${f((tamLy / tong) * 100, 0)}%) mua dung luc tam ly < 20; con lai mua theo tran 2 thang.)`);
