// KHI NAO DUNG CONG CU NAO, CO NEN CHIA VON KHONG (Hieu 2026-10-21: "khi nao nen dung chuc nang nao thi tot hon, hay chia von, test xem").
// 5 LOAI DIEM VAO (tat ca tren ma GTGD TB20 >= 3 ty, vao MO CUA phien sau, phi 0,4%): CK = checklist do day (>= 5 diem, mo rong moi ma) | B20 = diem B giam 20-30% | B20KL = B20 co KL quanh day >= 2x | T4 = hoi sau giam dai (day sau cao hon + tren Tenkan/Kijun, giam dai) | SYS = tin hieu MUA thuong cua he thong.
// (1) THEO CHE DO THI TRUONG: "yeu" = VN-Index <= -7% so dinh 60 phien tai ngay tin hieu, "binh thuong" = con lai. In lai 10 / 20 phien theo loai x che do x giai doan (truoc / tu 2022-05).
// (2) DANH MUC CO GIOI HAN VI THE (K = 10, moi vi the = von / K, lai nhap goc, phi 0,2% moi chieu), QUY TAC THOAT CHUNG de so sanh cong bang: giu 15 phien, cat lo dong cua <= -8% (xet tu phien thu 3 vi T+2,5). Cac KE HOACH:
//   P1 chi SYS | P2 chi CK | P3 chi B20 | P4 chi B20KL | P5 chi T4 | P6 TAT CA cung 1 danh muc (uu tien: CK/B truoc, SYS sau, cung loai thi GTGD lon) |
//   P7 THEO CHE DO: thi truong yeu -> CK + B20 + B20KL, binh thuong -> SYS + T4 | P8 CHIA VON 50/50: nua von cho nhom SOM (CK + B20 + B20KL), nua von cho SYS (moi nua K = 5).
// Do: von cuoi, CAGR, sut toi da, so lenh, ty le thang, vi the TB, doi chieu mua giu VN-Index. Giai doan: 2017-01 den nay va tu 2022-05. LUU Y: chua gom ma da huy niem yet. CHI DOC cache. CACH CHAY: node engine/dich-vu/moPhongChiaVonTheoCongCu.mjs
import { docJson, chayEngine } from "./backtestChung.mjs";
import { tinhChecklistBatDayToanBo } from "../loi/checklistBatDay.js";
import { rsi } from "../loi/taChiBao.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const th = (a) => (a.length ? (a.filter((x) => x > 0).length / a.length) * 100 : NaN);
const CP = 0.4, PHI = 0.002, HOLD = 15, SL = 8;

const vIdx = new Map(vni.map((x, i) => [x.t, i]));
const vc = vni.map((x) => x.c);
const vSua = vni.map((_, i) => (i >= 59 ? (vc[i] / hh(vc, i, 60) - 1) * 100 : 0));
const yeu = (ngay) => { const j = vIdx.get(ngay); return j != null && vSua[j] <= -7; };

const SE = {};
for (const [ma, b] of Object.entries(cache)) {
  if (b.length < 300) continue;
  const c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v), o = b.map((x) => x.o), t = b.map((x) => x.t);
  let g = 0; const gt = c.map((x, i) => { g += (x * v[i]) / 1e6; if (i >= 20) g -= (c[i - 20] * v[i - 20]) / 1e6; return i >= 19 ? g / 20 : 0; });
  SE[ma] = { n: b.length, c, h, l, v, o, t, gt, idx: new Map(t.map((d, i) => [d, i])) };
}
const ev = []; // { loai, ma, i, t }
const them = (loai, ma, i) => { const s = SE[ma]; if (i + 1 >= s.n - 1) return; ev.push({ loai, ma, i, t: s.t[i], gt: s.gt[i] }); };

// B20, B20KL, T4
for (const [ma, s] of Object.entries(SE)) {
  const { n, c, h, l, v, gt } = s;
  let ultB = -99, ultT = -99;
  for (let i = 260; i < n - 2; i++) {
    if (gt[i] < 3) continue;
    const tk = (hh(h, i, 9) + ll(l, i, 9)) / 2, kj = (hh(h, i, 17) + ll(l, i, 17)) / 2;
    const tren = c[i] > tk && c[i] > kj; if (!tren) continue;
    // diem B
    let giam = 0; for (let k = 0; k <= 10; k++) giam = Math.max(giam, (1 - c[i - k] / hh(h, i - k, 20)) * 100);
    const day = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day) kDay = j;
    if (giam >= 20 && giam < 30 && i - kDay >= 3 && i - ultB >= 15) {
      ultB = i;
      let tb20 = 0; for (let j = kDay - 20; j < kDay; j++) tb20 += v[j]; tb20 /= 20;
      let vMax = 0; for (let j = kDay - 2; j <= Math.min(kDay + 2, i); j++) vMax = Math.max(vMax, v[j]);
      them("B20", ma, i); if (tb20 > 0 && vMax >= 2 * tb20) them("B20KL", ma, i);
    }
    // T4 hoi sau giam dai
    const d250 = hh(h, i, 250);
    if (c[i] <= 0.65 * d250 && ll(l, i, 30) > ll(l, i - 30, 30) && i - ultT >= 20) {
      let iP = i; for (let j = i - 249; j <= i; j++) if (h[j] === d250) iP = j;
      if (i - iP >= 100) { ultT = i; them("T4", ma, i); }
    }
  }
}
// checklist (moi ma)
for (const s of tinhChecklistBatDayToanBo(new Map(Object.entries(cache)), { namBatDauTheoDoi: 2014 })) {
  const se = SE[s.ma]; if (!se) continue; const i = se.idx.get(s.ngay); if (i == null || se.gt[i] < 3) continue;
  them("CK", s.ma, i);
}
// he thong
{
  const { lenh } = chayEngine({ cache, vni });
  for (const t of lenh) if (t.loai === 1 && SE[t.ma] && SE[t.ma].gt[t.iv] >= 3) them("SYS", t.ma, t.iv);
}
const LOAI = ["CK", "B20", "B20KL", "T4", "SYS"];

// ket qua tung su kien theo quy tac thoat chung
for (const e of ev) {
  const s = SE[e.ma], E = s.o[e.i + 1], b0 = e.i + 1;
  let jt = Math.min(b0 + HOLD, s.n - 1), gia = s.c[jt];
  for (let j = b0 + 2; j <= Math.min(b0 + HOLD, s.n - 1); j++) if (s.c[j] <= E * (1 - SL / 100)) { jt = j; gia = s.c[j]; break; }
  e.E = E; e.jt = jt; e.gia = gia; e.tVao = s.t[b0]; e.tRa = s.t[jt]; e.ret = (gia / E - 1) * 100 - CP;
  e.r10 = s.c[b0 + 10] ? (s.c[b0 + 10] / E - 1) * 100 - CP : null; e.r20 = s.c[b0 + 20] ? (s.c[b0 + 20] / E - 1) * 100 - CP : null;
  e.yeu = yeu(e.t); e.ky = e.t < "2022-05-01" ? 0 : 1;
}

console.log("######## (1) LAI THEO LOAI x CHE DO THI TRUONG (yeu = VN-Index <= -7% so dinh 60 phien) ########");
const dong = (ten, a) => (a.length < 25
  ? console.log(`   ${ten.padEnd(30)} n=${String(a.length).padStart(5)} (it mau)`)
  : console.log(`   ${ten.padEnd(30)} n=${String(a.length).padStart(5)} | 10p ${f(tb(a.filter((x) => x.r10 != null).map((x) => x.r10)), 2).padStart(6)} [${f(th(a.filter((x) => x.r10 != null).map((x) => x.r10)), 0)}%] | 20p ${f(tb(a.filter((x) => x.r20 != null).map((x) => x.r20)), 2).padStart(6)} [${f(th(a.filter((x) => x.r20 != null).map((x) => x.r20)), 0)}%] | thoat chung (15p / cat lo -8%) ${f(tb(a.map((x) => x.ret)), 2).padStart(6)}`));
for (const [tk, loc] of [["truoc 2022-05 (tu 2017)", (x) => x.ky === 0 && x.t >= "2017-01-01"], ["tu 2022-05", (x) => x.ky === 1]]) {
  console.log(`\n== ${tk}`);
  for (const l of LOAI) { dong(`${l} | thi truong YEU`, ev.filter((x) => x.loai === l && loc(x) && x.yeu)); dong(`${l} | thi truong BINH THUONG`, ev.filter((x) => x.loai === l && loc(x) && !x.yeu)); }
}

// ---- danh muc ----
const lich = vni.map((x) => x.t);
const BAT_DAU = "2017-01-01";
function moPhong(chon, Kmoi) {
  // chon: ham (e) -> ten gio (bucket) | null; Kmoi: { gio: K }
  const ds = ev.filter((e) => e.tVao >= BAT_DAU).map((e) => ({ e, gio: chon(e) })).filter((x) => x.gio != null);
  const rank = (loai) => ({ CK: 0, B20KL: 0, B20: 1, T4: 2, SYS: 3 })[loai];
  ds.sort((p, q) => (p.e.tVao < q.e.tVao ? -1 : p.e.tVao > q.e.tVao ? 1 : rank(p.e.loai) - rank(q.e.loai) || q.e.gt - p.e.gt));
  const theoNgay = new Map(); for (const x of ds) (theoNgay.get(x.e.tVao) ?? theoNgay.set(x.e.tVao, []).get(x.e.tVao)).push(x);
  const gios = Object.keys(Kmoi);
  const vonGio = Object.fromEntries(gios.map((g) => [g, 1 / gios.length]));
  const tien = { ...vonGio }; const vt = Object.fromEntries(gios.map((g) => [g, []])); const eq = []; const ret = [];
  for (const d of lich) {
    if (d < BAT_DAU) continue;
    for (const g of gios) vt[g] = vt[g].filter((p) => { if (p.tRa <= d) { tien[g] += p.so * p.gia * (1 - PHI); ret.push((p.gia * (1 - PHI)) / (p.E / (1 - PHI)) - 1); return false; } return true; });
    for (const x of theoNgay.get(d) ?? []) {
      const g = x.gio, e = x.e;
      if (vt[g].length >= Kmoi[g] || Object.values(vt).some((a) => a.some((p) => p.ma === e.ma))) continue;
      let gt = tien[g]; for (const p of vt[g]) { const s = SE[p.ma], i = s.idx.get(d); gt += p.so * (i != null ? s.c[i] : p.E); }
      const von = Math.min(tien[g], gt / Kmoi[g]); if (von < 0.5 * gt / Kmoi[g]) continue;
      tien[g] -= von; vt[g].push({ ma: e.ma, tRa: e.tRa, gia: e.gia, E: e.E, so: (von * (1 - PHI)) / e.E });
    }
    let tong = 0, np = 0;
    for (const g of gios) { tong += tien[g]; for (const p of vt[g]) { const s = SE[p.ma], i = s.idx.get(d); tong += p.so * (i != null ? s.c[i] : p.E); np++; } }
    eq.push({ d, v: tong, n: np });
  }
  return { eq, ret };
}
function tk(eq, tu) {
  const a = eq.filter((x) => x.d >= tu); if (a.length < 100) return null;
  const v0 = a[0].v, v1 = a[a.length - 1].v, nam = (new Date(a[a.length - 1].d) - new Date(a[0].d)) / (365.25 * 86400000);
  let pk = -Infinity, dd = 0; for (const x of a) { pk = Math.max(pk, x.v); dd = Math.min(dd, x.v / pk - 1); }
  return { tong: (v1 / v0 - 1) * 100, cagr: (Math.pow(v1 / v0, 1 / nam) - 1) * 100, dd: dd * 100, ptb: tb(a.map((x) => x.n)) };
}
const bh = (tu) => { const a = vni.filter((x) => x.t >= tu); let pk = -Infinity, dd = 0; for (const x of a) { pk = Math.max(pk, x.c); dd = Math.min(dd, x.c / pk - 1); } const nam = (new Date(a[a.length - 1].t) - new Date(a[0].t)) / (365.25 * 86400000); return { tong: (a[a.length - 1].c / a[0].c - 1) * 100, cagr: (Math.pow(a[a.length - 1].c / a[0].c, 1 / nam) - 1) * 100, dd: dd * 100 }; };
const SOM = new Set(["CK", "B20", "B20KL"]);
const KH = {
  "P1 chi SYS": [(e) => (e.loai === "SYS" ? "a" : null), { a: 10 }],
  "P2 chi CK": [(e) => (e.loai === "CK" ? "a" : null), { a: 10 }],
  "P3 chi B20": [(e) => (e.loai === "B20" ? "a" : null), { a: 10 }],
  "P4 chi B20 + KL": [(e) => (e.loai === "B20KL" ? "a" : null), { a: 10 }],
  "P5 chi T4 (hoi sau giam dai)": [(e) => (e.loai === "T4" ? "a" : null), { a: 10 }],
  "P6 TAT CA cung 1 danh muc": [() => "a", { a: 10 }],
  "P7 THEO CHE DO (yeu: CK+B; thuong: SYS+T4)": [(e) => ((e.yeu ? SOM.has(e.loai) : e.loai === "SYS" || e.loai === "T4") ? "a" : null), { a: 10 }],
  "P8 CHIA VON 50/50 (som | SYS)": [(e) => (SOM.has(e.loai) ? "som" : e.loai === "SYS" ? "sys" : null), { som: 5, sys: 5 }],
};
console.log(`\n######## (2) DANH MUC ${BAT_DAU} -> nay (thoat chung: giu ${HOLD} phien, cat lo -${SL}% xet tu phien 3; K = 10 vi the) ########`);
const ketQuaKH = {};
for (const [ten, [chon, K]] of Object.entries(KH)) ketQuaKH[ten] = moPhong(chon, K);
for (const tu of [BAT_DAU, "2022-05-01"]) {
  const b = bh(tu);
  console.log(`\n-- tu ${tu}: mua giu VN-Index tong ${f(b.tong, 0)}%, CAGR ${f(b.cagr)}%/nam, sut toi da ${f(b.dd, 0)}%`);
  for (const [ten, { eq, ret }] of Object.entries(ketQuaKH)) {
    const s = tk(eq, tu); if (!s) continue;
    console.log(`   ${ten.padEnd(44)} tong ${f(s.tong, 0).padStart(5)}% | CAGR ${f(s.cagr).padStart(5)}%/nam | sut toi da ${f(s.dd, 0).padStart(4)}% | vi the TB ${f(s.ptb).padStart(4)} | ${String(ret.length).padStart(4)} lenh thang ${f(th(ret), 0)}%`);
  }
}
