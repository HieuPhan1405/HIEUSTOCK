// TIM DIEU KIEN MUA TOT NHAT (Hieu 02/11/2026: "tim cho toi dieu kien de xay ra ke hoach mua co phieu tot nhat").
// Lenh Mua thuong cua engine; vao tai moc E + 0,6% (gia thuc te do tu web), ban tu T+2, cat lo toi da 6%, 30/30 + chay, phi 0,4%, lenh dang mo tinh gia cuoi.
// Moi dac trung lay o phien TRUOC ngay tin hieu (khong dung dong cua ngay tin hieu). HOC tren < 2024, KIEM TRA rieng tren >= 2024: chi tin dieu kien dung vung o ca hai.
// Buoc: (1) tung dieu kien don (nguong = phan vi 20/40/60/80% cua tap HOC), xep theo t-stat tren HOC, bao cao ket qua tren KIEM TRA; (2) ghep doi tu top don; (3) ke hoach danh muc K6 (CAGR / sut giam) HOC vs KIEM TRA.
// Chay: node engine/dich-vu/nghienCuuDieuKienMua.mjs
import { docJson, chayEngine, danhMucNhieuLan, danhMuc, tb, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";
import { tinhCanBang } from "../../lib/chiBaoKyThuat.js";

const TACH = "2024-01-01";
const vni = docJson("vnindex_dai.json");
const chiSo = new Map(vni.map((b, i) => [b.t, i]));
const vc = vni.map((b) => b.c);
const canBang = tinhCanBang(vni.map((b) => ({ t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v ?? 0 })));
const nganhMap = docJson("nganh_map.json");
const nenDai = docJson("nen_dai.json");
const homNay = vni.map((b) => b.t);
const chiSoNganh = new Map();
{
  const theo = new Map();
  for (const [ma, bars] of Object.entries(nenDai)) { const g = nganhMap[ma]; if (g) (theo.get(g) ?? theo.set(g, []).get(g)).push(new Map(bars.map((b) => [b.t, b.c]))); }
  for (const [g, maps] of theo) {
    if (maps.length < 5) continue;
    const idx = [100];
    for (let i = 1; i < homNay.length; i++) { let s = 0, n = 0; for (const m of maps) { const a = m.get(homNay[i - 1]), b = m.get(homNay[i]); if (a > 0 && b > 0) { s += b / a - 1; n++; } } idx.push(idx[i - 1] * (1 + (n >= 3 ? s / n : 0))); }
    chiSoNganh.set(g, idx);
  }
}
const rsN = (g, i) => { const x = chiSoNganh.get(g); return x && i >= 61 ? (x[i] / x[i - 60] - 1) * 100 - (vc[i] / vc[i - 60] - 1) * 100 : null; };
const rsi = (c, i, n = 14) => { let g = 0, l = 0; for (let k = i - n * 3; k <= i; k++) { if (k <= i - n * 3) continue; const d = c[k] - c[k - 1]; if (k <= i - n * 2) { if (d > 0) g += d; else l -= d; if (k === i - n * 2) { g /= n; l /= n; } } else { g = (g * (n - 1) + Math.max(d, 0)) / n; l = (l * (n - 1) + Math.max(-d, 0)) / n; } } return l === 0 ? 100 : 100 - 100 / (1 + g / l); };

const { lenh: tatCa } = chayEngine({ cache: nenDai, vni, giuLenhDangMo: true });
const HT = { moc: HAI_TP, baoVe: true, theoSell: true, danhGiaCuoi: true, catLoToiDaPct: 6 };
const ds = [], kq = [];
for (const t of tatCa.filter((x) => x.loai === 1 && x.iv >= 260)) {
  const j = chiSo.get(t.ngay);
  if (j == null || j < 70) continue;
  const i = t.iv - 1, c = t.close;
  const max = (a, from, to) => { let m = -Infinity; for (let k = from; k <= to; k++) m = Math.max(m, a[k]); return m; };
  const min = (a, from, to) => { let m = Infinity; for (let k = from; k <= to; k++) m = Math.min(m, a[k]); return m; };
  const mx120 = max(t.high, i - 119, i), mn120 = min(t.low, i - 119, i);
  let gt = 0; for (let k = i - 19; k <= i; k++) gt += (c[k] * t.vol[k]) / 1e6;
  const bot = canBang.bot[j - 1];
  t.f = {
    // thi truong (phien truoc)
    vni_d5: (vc[j - 1] / vc[j - 6] - 1) * 100,
    vni_d20: (vc[j - 1] / vc[j - 21] - 1) * 100,
    vni_vs_canbang: bot ? (vc[j - 1] / bot - 1) * 100 : null,
    // ma
    pos120: (c[i] - mn120) / (mx120 - mn120),
    cach_dinh250: (c[i] / max(t.high, i - 249, i) - 1) * 100,
    tang20: (c[i] / c[i - 20] - 1) * 100,
    tang60: (c[i] / c[i - 60] - 1) * 100,
    tren_kijun: (c[i] / t.kijun[i] - 1) * 100,
    tren_tenkan: (c[i] / t.tenkan[i] - 1) * 100,
    tren_sma50: (c[i] / t.sma50[i] - 1) * 100,
    atr_pct: (t.atr[i] / c[i]) * 100,
    rsi14: rsi(c, i),
    relvol: t.relVol[i],
    gtgd20: gt / 20,
    cach_moc: (t.E / c[i] - 1) * 100, // moc cao hon dong cua phien truoc bao nhieu (gan moc = it phai chay)
    cat_lo_pct: Math.min(6, ((t.E - t.S) / t.E) * 100),
    trend: t.trendScore[i], mom: t.momScore[i], dongtien: t.mfScore[i],
    rs_nganh60: nganhMap[t.ma] ? rsN(nganhMap[t.ma], j - 1) : null,
    rs_vni20: (c[i] / c[i - 20] - 1) * 100 - (vc[j - 1] / vc[j - 21] - 1) * 100,
  };
  const r = mp(t, { ...HT, E: Math.min(t.E * 1.006, t.high[t.iv]), vao: t.iv, banTu: t.iv + 2 });
  if (!r) continue;
  ds.push(t); kq.push(r);
}
const dsIdx = ds.map((t, i) => i).sort((a, b) => (ds[a].ngay < ds[b].ngay ? -1 : 1));
const HOC = dsIdx.filter((i) => ds[i].ngay < TACH), KT = dsIdx.filter((i) => ds[i].ngay >= TACH);
const ret = (i) => kq[i].ret;
const stat = (idx) => { const a = idx.map(ret), m = tb(a), sd = Math.sqrt(tb(a.map((x) => (x - m) ** 2))); return { n: a.length, m, t: a.length > 1 ? m / (sd / Math.sqrt(a.length)) : 0, thang: (a.filter((x) => x > 0).length / a.length) * 100 }; };
console.log(`Lenh: ${ds.length} (HOC ${HOC.length} < ${TACH}, KIEM TRA ${KT.length}); lai TB 1 lenh: HOC ${f(stat(HOC).m)}% | KIEM TRA ${f(stat(KT).m)}%`);

// ---- (1) dieu kien don
const TEN = Object.keys(ds[0].f);
const phanVi = (ten, p) => { const a = HOC.map((i) => ds[i].f[ten]).filter((x) => x != null && Number.isFinite(x)).sort((x, y) => x - y); return a[Math.floor(p * (a.length - 1))]; };
const dk = [];
for (const ten of TEN) for (const p of [0.2, 0.4, 0.6, 0.8]) { const th = phanVi(ten, p); for (const huong of [">=", "<="]) dk.push({ ten, th, huong, nhan: `${ten} ${huong} ${f(th, 2)} (p${p * 100})`, ok: (t) => { const v = t.f[ten]; return v != null && Number.isFinite(v) && (huong === ">=" ? v >= th : v <= th); } }); }
const danh = dk.map((d) => ({ d, h: stat(HOC.filter((i) => d.ok(ds[i]))), k: stat(KT.filter((i) => d.ok(ds[i]))) })).filter((x) => x.h.n >= 300 && x.k.n >= 80);
danh.sort((a, b) => b.h.t - a.h.t);
console.log(`\n(1) DIEU KIEN DON (${dk.length} dieu kien thu; xep theo t-stat tren HOC; can n_HOC>=300, n_KT>=80). Cot: HOC lai TB%/thang%/n | KIEM TRA lai TB%/thang%/n`);
const p1s = (s) => `${f(s.m).padStart(5)}/${f(s.thang, 0)}%/n${s.n}`;
for (const x of danh.slice(0, 18)) console.log(x.d.nhan.padEnd(38), p1s(x.h).padEnd(18), p1s(x.k));

// ---- (2) ghep doi tu top don (moi dac trung chi 1 lan)
const top = []; const da = new Set();
for (const x of danh) { if (da.has(x.d.ten)) continue; da.add(x.d.ten); top.push(x); if (top.length >= 10) break; }
const cap = [];
for (let a = 0; a < top.length; a++) for (let b = a + 1; b < top.length; b++) { const A = top[a].d, B = top[b].d; const ok = (t) => A.ok(t) && B.ok(t); const h = stat(HOC.filter((i) => ok(ds[i]))), k = stat(KT.filter((i) => ok(ds[i]))); if (h.n >= 200 && k.n >= 50) cap.push({ nhan: `${A.nhan}  &  ${B.nhan}`, ok, h, k }); }
cap.sort((x, y) => y.h.t - x.h.t);
console.log(`\n(2) GHEP DOI tu 10 dac trung manh nhat (${cap.length} cap; xep theo t-stat HOC; n_HOC>=200, n_KT>=50)`);
for (const x of cap.slice(0, 12)) console.log(x.nhan.slice(0, 92).padEnd(94), p1s(x.h).padEnd(18), p1s(x.k));

// ---- (3) ke hoach danh muc K6 cho vai bo dieu kien (HOC / KIEM TRA tach rieng)
const chay = (ok, K, idx) => { const kk = idx.map((i) => kq[i]), dd = idx.map((i) => ds[i]); return danhMucNhieuLan(kk, dd, K, 20, { loc: ok }); };
const CAC = [
  ["khong loc", () => true],
  ["d5>1% & pos120>=0,6 (kich ban truoc)", (t) => t.f.vni_d5 > 1 && t.f.pos120 >= 0.6],
  ...cap.slice(0, 3).map((x, k) => [`cap #${k + 1}: ${x.nhan.slice(0, 60)}`, x.ok]),
  ...top.slice(0, 3).map((x, k) => [`don #${k + 1}: ${x.d.nhan}`, x.d.ok]),
];
console.log("\n(3) KE HOACH DANH MUC toi da 6 ma: CAGR%/sut giam % (n lenh lay)");
for (const [m, ok] of CAC) { const a = chay(ok, 6, HOC), b = chay(ok, 6, KT); console.log(m.padEnd(70), `HOC ${f(a.cagr, 1)}%/${f(a.sut, 0)}% (n${f(a.lay, 0)}) | KIEM TRA ${f(b.cagr, 1)}%/${f(b.sut, 0)}% (n${f(b.lay, 0)})`); }

// ---- (4) on dinh theo tung nam cua d5&pos va cap #1 (lai TB 1 lenh)
console.log("\n(4) THEO NAM, lai TB 1 lenh% (n): khong loc | d5&pos | cap #1");
const nam = new Map();
for (const i of dsIdx) { const y = ds[i].ngay.slice(0, 4); if (!nam.has(y)) nam.set(y, { a: [], b: [], c: [] }); const o = nam.get(y); o.a.push(ret(i)); if (CAC[1][1](ds[i])) o.b.push(ret(i)); if (cap[0]?.ok(ds[i])) o.c.push(ret(i)); }
for (const [y, o] of [...nam].sort()) console.log(y, `${f(tb(o.a)).padStart(6)} (${o.a.length})`.padEnd(14), `${f(tb(o.b)).padStart(6)} (${o.b.length})`.padEnd(14), `${f(tb(o.c)).padStart(6)} (${o.c.length})`);

// ---- (5) HIEU SUAT TUNG NAM cua danh muc mau (toi da 6 ma; moi nam bat dau lai voi 100% tien mat, gom lenh VAO trong nam, ra lenh co the sang nam sau; TB 20 lan xao tron thu tu lenh cung ngay)
const BO_DE_XUAT = (t) => t.f.tren_sma50 <= 3 && t.f.rsi14 <= 59 && t.f.vni_d20 <= 5;
const PLAN5 = [["khong loc", () => true], ["d5&pos", CAC[1][1]], ["SMA50<=2%", (t) => t.f.tren_sma50 <= 2.03], ["bo de xuat", BO_DE_XUAT]];
const vniNam = (y) => { const a = homNay.filter((d) => d.startsWith(y)); if (!a.length) return null; const i0 = chiSo.get(a[0]) - 1, i1 = chiSo.get(a.at(-1)); return (vc[i1] / vc[Math.max(i0, 0)] - 1) * 100; };
console.log("\n(5) HIEU SUAT TUNG NAM (%/nam, sut giam toi da %, so lenh lay) - danh muc toi da 6 ma");
console.log("nam".padEnd(6), "VN-Index".padEnd(9), PLAN5.map(([m]) => m.padEnd(22)).join(""));
const tong = PLAN5.map(() => ({ boi: 1, nam: 0 }));
for (const y of [...new Set(dsIdx.map((i) => ds[i].ngay.slice(0, 4)))].sort()) {
  const idx = dsIdx.filter((i) => ds[i].ngay.startsWith(y));
  const dong = PLAN5.map(([, ok], k) => {
    let b = 0, sut = 0, lay = 0; const N = 20;
    for (let sd = 1; sd <= N; sd++) { const d = danhMuc(idx.map((i) => kq[i]), idx.map((i) => ds[i]), 6, sd, { loc: ok }); b += d.boi; sut += d.sut; lay += d.lay; }
    tong[k].boi *= b / N; tong[k].nam++;
    return `${f((b / N - 1) * 100, 1).padStart(6)}% /${f(sut / N, 0).padStart(2)}% (n${f(lay / N, 0)})`.padEnd(22);
  });
  console.log(y.padEnd(6), `${f(vniNam(y), 1)}%`.padEnd(9), dong.join(""));
}
console.log("tich luy".padEnd(16), PLAN5.map((_, k) => `x${f(tong[k].boi, 2)} (${f((Math.pow(tong[k].boi, 1 / tong[k].nam) - 1) * 100, 1)}%/nam)`.padEnd(22)).join(""));
{ const a = chiSo.get(homNay.find((d) => d >= "2014-01-01")), b = vc.length - 1; console.log("VN-Index tich luy cung ky:".padEnd(26), `x${f(vc[b] / vc[a], 2)}`); }

// ---- (6) TY TRONG KHAC NHAU (Hieu 02/11: "neu ty trong moi ma khac nhau thi sao"). Bo de xuat, toi da K ma; moi vi the toi da 1/K von (khong vay): trongSo w in (0,1] = ty le cua 1/K. Phan chua dung giu tien mat.
//  deu: w=1 | rui ro: rui ro moi lenh 0,5% von ~ w=min(1, 0,5xK/cat lo%) | bien dong: w=min(1, 2,5/ATR%) | nganh manh gap doi: w=1 neu RS nganh60>0 con lai 0,5 | K khac nhau: 3, 4, 6, 10 (chia deu).
console.log("\n(6) TY TRONG: bo de xuat (SMA50<=3% & RSI<=59 & VNI20<=5%) - CAGR%/sut giam% HOC | KIEM TRA | TOAN BO");
const KQ6 = (K, w) => {
  const run = (idx) => { const kk = idx.map((i) => kq[i]), dd = idx.map((i) => ds[i]); return danhMucNhieuLan(kk, dd, K, 20, { loc: BO_DE_XUAT, trongSo: w }); };
  const a = run(HOC), b = run(KT), c = run(dsIdx);
  return `HOC ${f(a.cagr, 1).padStart(5)}%/${f(a.sut, 0).padStart(2)}% | KT ${f(b.cagr, 1).padStart(5)}%/${f(b.sut, 0).padStart(2)}% | TB ${f(c.cagr, 1).padStart(5)}%/${f(c.sut, 0).padStart(2)}%`;
};
const rr = (K) => (t) => Math.min(1, (0.5 * K) / t.f.cat_lo_pct);
for (const [m, K, w] of [
  ["K6 chia deu 1/6", 6, () => 1],
  ["K6 theo rui ro 0,5%/lenh", 6, rr(6)],
  ["K6 theo bien dong (ATR)", 6, (t) => Math.min(1, 2.5 / t.f.atr_pct)],
  ["K6 nganh manh gap doi (1 vs 0,5)", 6, (t) => (t.f.rs_nganh60 > 0 ? 1 : 0.5)],
  ["K3 chia deu 1/3", 3, () => 1],
  ["K4 chia deu 1/4", 4, () => 1],
  ["K10 chia deu 1/10", 10, () => 1],
]) console.log(m.padEnd(36), KQ6(K, w));
