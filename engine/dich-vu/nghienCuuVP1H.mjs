// NGHIEN CUU (2026-10-14): Volume Profile dung tu NEN 1 GIO (DNSE, tu 16/10/2023; taiDuLieu1H.mjs) thay cho ban xap xi tu nen ngay - va cac CACH DUNG chua thu:
//   P1  Do sai lech cua ban xap xi nen ngay so voi ban nen 1 gio (POC / VAH / VAL lech bao nhieu %)
//   P2  VI TRI vao lenh theo profile 1 gio (pullback A, breakout C, sat khang cu, tren / trong / duoi vung gia tri, POC dich chuyen, do hep vung gia tri)
//   P3  THOAT SOM khi gia "duoc chap nhan lai" duoi POC / VAL (breakout that bai) - cat cac lenh quay cup
//   P4  CAT LO dat theo cau truc khoi luong (duoi VAL / duoi muc KL gan nhat) thay cho cat lo hien tai
// Profile: cua so W = 60 phien truoc tin hieu (khong nhin truoc). Gia nen gio duoc chuan hoa tung ngay theo gia dong cua nen ngay (de khop gia dieu chinh).
// Vao lenh: mo cua phien sau, thoat theo luat he thong (mo()), da tru chi phi. P3 / P4 chay them tren TOAN BO lich su bang ban xap xi nen ngay (mau lon hon).
// Chay: node engine/dich-vu/nghienCuuVP1H.mjs
import { readFileSync } from "node:fs";
import { taiLenh, mo, tb, f, boot } from "./nghienCuuLenh.mjs";

const H1 = JSON.parse(readFileSync(new URL("../output/nen_1h.json", import.meta.url), "utf-8"));
const W = 60;
const ngayVN = (t) => new Date((t + 7 * 3600) * 1000).toISOString().slice(0, 10);

// Ho so khoi luong theo muc gia tu cac mang (cao, thap, KL) - KL moi nen chia deu tren [thap, cao].
function hoSo(hs, ls, vs, a, b, BIN) {
  let lo = Infinity, hi = -Infinity;
  for (let j = a; j <= b; j++) { if (!(vs[j] > 0)) continue; lo = Math.min(lo, ls[j]); hi = Math.max(hi, hs[j]); }
  if (!(lo > 0) || !(hi > lo)) return null;
  const nBin = Math.max(8, Math.ceil(Math.log(hi / lo) / Math.log(1 + BIN)) + 1);
  const bin = (g) => Math.min(nBin - 1, Math.max(0, Math.floor(Math.log(g / lo) / Math.log(1 + BIN))));
  const gia = (x) => lo * (1 + BIN) ** (x + 0.5);
  const kl = new Array(nBin).fill(0);
  for (let j = a; j <= b; j++) { const v = vs[j]; if (!(v > 0)) continue; const x1 = bin(ls[j]), x2 = bin(hs[j]); for (let x = x1; x <= x2; x++) kl[x] += v / (x2 - x1 + 1); }
  const tong = kl.reduce((x, y) => x + y, 0); if (!(tong > 0)) return null;
  // lam min 3 bin de POC / HVN khong nhay theo 1 bin le
  const m = kl.map((v, x) => (v + (kl[x - 1] ?? v) + (kl[x + 1] ?? v)) / 3);
  let poc = 0; for (let x = 1; x < nBin; x++) if (m[x] > m[poc]) poc = x;
  let p = poc, q = poc, s = kl[poc];
  while (s < 0.7 * tong && (p > 0 || q < nBin - 1)) { const l = p > 0 ? kl[p - 1] : -1, r = q < nBin - 1 ? kl[q + 1] : -1; if (l >= r) { p--; s += kl[p]; } else { q++; s += kl[q]; } }
  const tbBin = tong / nBin; const hvn = [];
  for (let x = 2; x < nBin - 2; x++) if (m[x] >= m[x - 1] && m[x] >= m[x + 1] && m[x] >= m[x - 2] && m[x] >= m[x + 2] && m[x] >= 1.4 * tbBin) hvn.push(gia(x));
  return { poc: gia(poc), vah: gia(q), val: gia(p), hvn, rongVA: (gia(q) / gia(p) - 1) * 100 };
}

// Chuan bi nen gio cua 1 ma: chuan hoa gia theo nen ngay, lap chi so ngay -> [dau, cuoi]
const kho = new Map();
function nenGio(t) {
  if (kho.has(t.ma)) return kho.get(t.ma);
  const x = H1[t.ma]; let kq = null;
  if (x) {
    const n = x.t.length, ngay = x.t.map(ngayVN), cuoi = new Map(), dau = new Map();
    ngay.forEach((d, i) => { if (!dau.has(d)) dau.set(d, i); cuoi.set(d, i); });
    const idx = new Map(t.ngayArr.map((d, i) => [d, i]));
    const h = new Float64Array(n), l = new Float64Array(n), v = new Float64Array(n);
    for (let i = 0; i < n; i++) { const j = idx.get(ngay[i]); const cc = x.c[cuoi.get(ngay[i])]; const k = j != null && cc > 0 ? t.close[j] / cc : 1; h[i] = x.h[i] * k; l[i] = x.l[i] * k; v[i] = x.v[i]; }
    kq = { ngay, dau, cuoi, h, l, v, ngayDau: ngay[0] };
  }
  kho.set(t.ma, kq); return kq;
}
function hoSoGio(t, iv) {
  const g = nenGio(t); if (!g) return null;
  const d0 = t.ngayArr[iv - W + 1], d1 = t.ngayArr[iv];
  if (!d0 || g.ngayDau > d0 || !g.cuoi.has(d1)) return null;
  let a = g.dau.get(d0); if (a == null) { for (let k = iv - W + 2; k <= iv && a == null; k++) a = g.dau.get(t.ngayArr[k]); }
  if (a == null) return null;
  return hoSo(g.h, g.l, g.v, a, g.cuoi.get(d1), 0.0025);
}
const hoSoNgay = (t, iv, w = W) => hoSo(t.high, t.low, t.vol, Math.max(0, iv - w + 1), iv, 0.005);

const pf = (g) => { const w = g.filter((x) => x.ret > 0).reduce((s, x) => s + x.ret, 0), l = -g.filter((x) => x.ret <= 0).reduce((s, x) => s + x.ret, 0); return l > 0 ? w / l : NaN; };
const hang = (ten, g, khoa = "ret") => { const r = g.map((x) => x[khoa]).filter((v) => v != null); console.log(`   ${ten.padEnd(54)} n=${String(r.length).padStart(4)} | TB ${f(tb(r)).padStart(6)}% | thang ${f((r.filter((v) => v > 0).length / (r.length || 1)) * 100, 0).padStart(3)}% | PF ${f(pf(r.map((v) => ({ ret: v })))).padStart(5)} | tong ${f(r.reduce((s, v) => s + v, 0), 0).padStart(6)}%`); };
const ky = (d, kieu) => (kieu === "quy" ? `${d.slice(0, 4)}Q${Math.ceil(Number(d.slice(5, 7)) / 3)}` : d.slice(0, 4));
const sosanh = (ten, giu, bo, kieu = "quy", khoa = "ret") => {
  const [lo, hi] = boot(giu.map((x) => x[khoa]), bo.map((x) => x[khoa]));
  const ks = [...new Set([...giu, ...bo].map((x) => ky(x.ngay, kieu)))].sort().filter((k) => giu.filter((x) => ky(x.ngay, kieu) === k).length >= 8 && bo.filter((x) => ky(x.ngay, kieu) === k).length >= 8);
  const tot = ks.filter((k) => tb(giu.filter((x) => ky(x.ngay, kieu) === k).map((x) => x[khoa])) > tb(bo.filter((x) => ky(x.ngay, kieu) === k).map((x) => x[khoa]))).length;
  console.log(`      -> ${ten}: chenh = ${f(tb(giu.map((x) => x[khoa])) - tb(bo.map((x) => x[khoa])))}% [95% CI ${f(lo)} .. ${f(hi)}] | ${kieu === "quy" ? "quy" : "nam"} tot hon: ${tot}/${ks.length}`);
};
// so sanh CAP (cung 1 lenh, 2 cach quan ly): chenh TB + CI bootstrap tren hieu so
const capDoi = (ten, g, khoaMoi, kieu = "nam") => {
  const d = g.filter((x) => x[khoaMoi] != null).map((x) => ({ d: x[khoaMoi] - x.ret, ngay: x.ngay }));
  let seed = 4242; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const bs = []; for (let k = 0; k < 2000; k++) { let s = 0; for (let i = 0; i < d.length; i++) s += d[Math.floor(rnd() * d.length)].d; bs.push(s / d.length); } bs.sort((a, b) => a - b);
  const ks = [...new Set(d.map((x) => ky(x.ngay, kieu)))].sort().filter((k) => d.filter((x) => ky(x.ngay, kieu) === k).length >= 15);
  const tot = ks.filter((k) => tb(d.filter((x) => ky(x.ngay, kieu) === k).map((x) => x.d)) > 0).length;
  console.log(`      -> ${ten}: moi - cu = ${f(tb(d.map((x) => x.d)), 3)}%/lenh [95% CI ${f(bs[50], 3)} .. ${f(bs[1949], 3)}] | so lenh thay doi: ${d.filter((x) => Math.abs(x.d) > 1e-9).length}/${d.length} | ${kieu === "quy" ? "quy" : "nam"} tot hon: ${tot}/${ks.length}`);
};

const { lenh } = taiLenh();
// khoang ngay thuc te cua 1 nhom lenh (lenh xep theo ma, khong theo ngay)
const khoang = (g) => { const d = g.map((x) => x.ngay).sort(); return `${d[0]} -> ${d[d.length - 1]}`; };

// ================= P1 + P2: profile 1 gio =================
const dong = []; const lech = { poc: [], vah: [], val: [] };
for (const t of lenh) {
  const iv = t.iv, E = t.open[iv + 1];
  if (!(E > 0) || iv < 130) continue;
  const fr = hoSoGio(t, iv); if (!fr) continue;
  const r = mo(t, { E, vao: iv + 1, banTu: iv + 3, S: t.S }); if (!r) continue;
  const fd = hoSoNgay(t, iv);
  if (fd) { lech.poc.push(Math.abs(fd.poc / fr.poc - 1) * 100); lech.vah.push(Math.abs(fd.vah / fr.vah - 1) * 100); lech.val.push(Math.abs(fd.val / fr.val - 1) * 100); }
  const c = t.close[iv];
  // VAH cua cua so tinh den HOM QUA (de biet hom nay co "vuot" khong)
  const g = nenGio(t); const dq = t.ngayArr[iv - 1]; let fh = null;
  if (g.cuoi.has(dq)) { let a = g.dau.get(t.ngayArr[iv - W]); if (a == null) a = g.dau.get(t.ngayArr[iv - W + 1]); if (a != null) fh = hoSo(g.h, g.l, g.v, a, g.cuoi.get(dq), 0.0025); }
  const can = [fr.poc, fr.vah, ...fr.hvn].filter((x) => x > E * 1.005);
  // POC dich chuyen: POC 20 phien gan nhat so voi POC 20 phien truoc do (ban nen gio)
  let pocLen = null;
  { const a1 = g.dau.get(t.ngayArr[iv - 19]), b1 = g.cuoi.get(t.ngayArr[iv]), a0 = g.dau.get(t.ngayArr[iv - 39]), b0 = g.cuoi.get(t.ngayArr[iv - 20]);
    if (a1 != null && b1 != null && a0 != null && b0 != null) { const p1 = hoSo(g.h, g.l, g.v, a1, b1, 0.0025), p0 = hoSo(g.h, g.l, g.v, a0, b0, 0.0025); if (p1 && p0) pocLen = (p1.poc / p0.poc - 1) * 100; } }
  dong.push({ ret: r.ret, ngay: t.ngayArr[iv], A: c >= fr.val * 0.99 && c <= fr.poc * 1.03, C: !!fh && c > fh.vah && (t.relVol[iv] ?? 0) >= 1.5 && E <= fh.vah * 1.04,
    dCan: can.length ? (Math.min(...can) / E - 1) * 100 : 99, viTri: E > fr.vah ? "tren" : E < fr.val ? "duoi" : "trong", pocPct: (fr.poc / E - 1) * 100, rongVA: fr.rongVA, pocLen });
}
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * s.length)]; };
console.log(`=== P1: BAN XAP XI NEN NGAY LECH BAO NHIEU SO VOI PROFILE NEN 1 GIO (cua so ${W} phien, ${lech.poc.length} lenh) ===`);
for (const k of ["poc", "vah", "val"]) console.log(`   ${k.toUpperCase()}: lech trung vi ${f(q(lech[k], 0.5))}% | 75% so lenh lech duoi ${f(q(lech[k], 0.75))}% | 90% duoi ${f(q(lech[k], 0.9))}% | lech > 3%: ${f((lech[k].filter((v) => v > 3).length / lech[k].length) * 100, 0)}% so lenh`);

console.log(`\n=== P2: VI TRI VAO LENH THEO PROFILE NEN 1 GIO (${khoang(dong)}; so lenh ${dong.length}) ===`);
hang("Tat ca lenh (moc)", dong);
for (const [ten, fn] of [["A: pullback ve VAL..POC", (x) => x.A], ["C: breakout vuot VAH + KL", (x) => x.C], ["A hoac C", (x) => x.A || x.C], ["Gia vao TREN vung gia tri", (x) => x.viTri === "tren"], ["Gia vao TRONG vung gia tri", (x) => x.viTri === "trong"], ["Khang cu KL trong 1% phia tren", (x) => x.dCan < 1], ["Khang cu KL trong 2% phia tren", (x) => x.dCan < 2], ["Khong con muc KL nao phia tren", (x) => x.dCan >= 98], ["POC 20 phien DICH LEN > 2%", (x) => x.pocLen != null && x.pocLen > 2], ["POC 20 phien dich XUONG < -2%", (x) => x.pocLen != null && x.pocLen < -2]]) {
  hang(ten + " - CO", dong.filter(fn)); sosanh(ten, dong.filter(fn), dong.filter((x) => !fn(x)));
}
{ const s = [...dong].sort((a, b) => a.rongVA - b.rongVA), n = s.length; console.log("   -- Do rong vung gia tri (hep = tich luy chat) --"); [0, 1, 2, 3].forEach((k) => { const gq = s.slice(Math.floor((k * n) / 4), Math.floor(((k + 1) * n) / 4)); hang(`   Q${k + 1}: rong ${f(gq[0].rongVA, 1)}..${f(gq[gq.length - 1].rongVA, 1)}%`, gq); }); sosanh("nua HEP vs nua RONG", s.slice(0, Math.floor(n / 2)), s.slice(Math.floor(n / 2))); }

// ================= P3 + P4: quan ly lenh (thoat som / cat lo theo KL) =================
function quanLy(nguon, ten, kieu) {
  const ds = [];
  for (const t of lenh) {
    const iv = t.iv, E = t.open[iv + 1];
    if (!(E > 0) || iv < 130) continue;
    const fr = nguon === "gio" ? hoSoGio(t, iv) : hoSoNgay(t, iv); if (!fr) continue;
    const goc = { E, vao: iv + 1, banTu: iv + 3, S: t.S };
    const r = mo(t, goc); if (!r) continue;
    const row = { ret: r.ret, ngay: t.ngayArr[iv], mae: r.mae };
    // P3: thoat som khi dong cua < muc L trong N phien dau (chi ap dung khi luc vao gia dang TREN muc do it nhat 1%)
    for (const [khoa, L, N] of [["pocN5", fr.poc, 5], ["pocN10", fr.poc, 10], ["pocMoi", fr.poc, 9999], ["valN10", fr.val, 10], ["valMoi", fr.val, 9999], ["vahN5", fr.vah, 5], ["vahN10", fr.vah, 10]]) {
      if (!(E > L * 1.01)) { row[khoa] = r.ret; continue; }
      const sell2 = t.sell.slice(); for (let i = iv + 1; i <= Math.min(t.n - 1, iv + N); i++) if (t.close[i] < L) sell2[i] = true;
      const r2 = mo({ ...t, sell: sell2 }, goc); row[khoa] = r2 ? r2.ret : r.ret;
    }
    // P4: cat lo theo cau truc KL
    const ruiGoc = (E - t.S) / E;
    const duoi = [fr.val, fr.poc, ...fr.hvn].filter((x) => x < E * 0.98);
    const dat = (muc) => { if (muc == null) return null; const S2 = muc * 0.99; const k = (E - S2) / E; if (k < 0.03 || k > 0.1) return null; const r2 = mo(t, { ...goc, S: S2 }); return r2 ? r2.ret : null; };
    row.slGan = dat(duoi.length ? Math.max(...duoi) : null); // muc KL gan nhat phia duoi
    row.slVal = dat(fr.val < E * 0.98 ? fr.val : null);
    row.ruiGoc = ruiGoc * 100;
    ds.push(row);
  }
  console.log(`\n=== ${ten} (${ds.length} lenh, ${khoang(ds)}) ===`);
  hang("He thong hien tai (moc)", ds);
  console.log("   -- P3: THOAT SOM khi dong cua thung muc KL (ban o gia dong cua phien do, hoac mo cua T+2 neu chua ban duoc) --");
  for (const [khoa, nhan] of [["pocN5", "dong cua < POC trong 5 phien dau"], ["pocN10", "dong cua < POC trong 10 phien dau"], ["pocMoi", "dong cua < POC bat ky luc nao"], ["valN10", "dong cua < VAL trong 10 phien dau"], ["valMoi", "dong cua < VAL bat ky luc nao"], ["vahN5", "dong cua < VAH trong 5 phien dau"], ["vahN10", "dong cua < VAH trong 10 phien dau"]]) { hang(nhan, ds, khoa); capDoi(nhan, ds, khoa, kieu); }
  console.log("   -- P4: CAT LO theo cau truc KL (chi nhung lenh co muc phu hop cach gia vao 3..10%) --");
  for (const [khoa, nhan] of [["slGan", "cat lo duoi muc KL gan nhat (POC/VAL/HVN) 1%"], ["slVal", "cat lo duoi VAL 1%"]]) { const g = ds.filter((x) => x[khoa] != null); hang(`${nhan} - MOI`, g, khoa); hang(`${nhan} - CU (cung cac lenh do)`, g); capDoi(nhan, g, khoa, kieu); }
}
quanLy("gio", "P3 + P4 voi PROFILE NEN 1 GIO", "quy");
quanLy("ngay", "P3 + P4 voi PROFILE XAP XI NEN NGAY - TOAN BO LICH SU", "nam");

// ================= P5: VOLUME PROFILE CUA VN-INDEX lam bo loc thi truong =================
// Y tuong dau gia: chi so dang giao dich TREN vung gia tri 60 phien = thi truong "chap nhan gia cao hon" (xu huong len); DUOI vung gia tri = phan phoi / xu huong xuong.
{
  const { vni } = taiLenh();
  const vt = { ngayArr: vni.map((b) => b.t), high: vni.map((b) => b.h), low: vni.map((b) => b.l), close: vni.map((b) => b.c), vol: vni.map((b) => b.v) };
  const idx = new Map(vt.ngayArr.map((d, i) => [d, i]));
  const nho = new Map();
  const viTriVni = (ngay, w) => {
    const k = ngay + "|" + w; if (nho.has(k)) return nho.get(k);
    const i = idx.get(ngay); let kq = null;
    if (i != null && i >= w) { const p = hoSo(vt.high, vt.low, vt.vol, i - w + 1, i, 0.0025); if (p) { const c = vt.close[i]; kq = { vt: c > p.vah ? "tren" : c < p.val ? "duoi" : "trong", trenPoc: c > p.poc }; } }
    nho.set(k, kq); return kq;
  };
  const ds = [];
  for (const t of lenh) {
    const iv = t.iv, E = t.open[iv + 1]; if (!(E > 0) || iv < 130) continue;
    const r = mo(t, { E, vao: iv + 1, banTu: iv + 3, S: t.S }); if (!r) continue;
    const a = viTriVni(t.ngayArr[iv], 60), b = viTriVni(t.ngayArr[iv], 120); if (!a || !b) continue;
    ds.push({ ret: r.ret, ngay: t.ngayArr[iv], v60: a.vt, p60: a.trenPoc, v120: b.vt, p120: b.trenPoc });
  }
  console.log(`\n=== P5: VOLUME PROFILE CUA VN-INDEX LAM BO LOC THI TRUONG (${ds.length} lenh, toan bo lich su) ===`);
  hang("Tat ca lenh (moc)", ds);
  for (const [w, kv, kp] of [[60, "v60", "p60"], [120, "v120", "p120"]]) {
    console.log(`   -- Cua so ${w} phien --`);
    for (const g of ["tren", "trong", "duoi"]) hang(`VN-Index ${g.toUpperCase()} vung gia tri`, ds.filter((x) => x[kv] === g));
    sosanh(`VN-Index TREN vung gia tri (${w}) so voi con lai`, ds.filter((x) => x[kv] === "tren"), ds.filter((x) => x[kv] !== "tren"), "nam");
    sosanh(`VN-Index KHONG duoi vung gia tri (${w}) so voi duoi`, ds.filter((x) => x[kv] !== "duoi"), ds.filter((x) => x[kv] === "duoi"), "nam");
    hang(`VN-Index tren POC ${w}`, ds.filter((x) => x[kp])); hang(`VN-Index duoi POC ${w}`, ds.filter((x) => !x[kp]));
    sosanh(`VN-Index tren POC (${w}) so voi duoi`, ds.filter((x) => x[kp]), ds.filter((x) => !x[kp]), "nam");
  }
  // --- P5b: kiem tra chat hon ---
  // (1) bootstrap THEO CUM THANG (cac lenh cung thang phu thuoc nhau vi chung 1 thi truong) thay cho bootstrap tung lenh
  const cumBoot = (giu, bo) => {
    const th = [...new Set([...giu, ...bo].map((x) => x.ngay.slice(0, 7)))];
    const G = new Map(th.map((m) => [m, [0, 0, 0, 0]])); for (const x of giu) { const a = G.get(x.ngay.slice(0, 7)); a[0] += x.ret; a[1]++; } for (const x of bo) { const a = G.get(x.ngay.slice(0, 7)); a[2] += x.ret; a[3]++; }
    let seed = 777; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const kq = []; for (let k = 0; k < 3000; k++) { let s1 = 0, n1 = 0, s2 = 0, n2 = 0; for (let i = 0; i < th.length; i++) { const a = G.get(th[Math.floor(rnd() * th.length)]); s1 += a[0]; n1 += a[1]; s2 += a[2]; n2 += a[3]; } if (n1 && n2) kq.push(s1 / n1 - s2 / n2); }
    kq.sort((a, b) => a - b); return [kq[Math.floor(kq.length * 0.025)], kq[Math.floor(kq.length * 0.975)]];
  };
  // (2) so voi bo loc don gian: VN-Index duoi duong trung binh 50 / 100 / 200 phien
  const sma = (w) => { const o = new Array(vt.close.length).fill(null); let s = 0; for (let i = 0; i < vt.close.length; i++) { s += vt.close[i]; if (i >= w) s -= vt.close[i - w]; if (i >= w - 1) o[i] = s / w; } return o; };
  const M = { 50: sma(50), 100: sma(100), 200: sma(200) };
  for (const x of ds) { const i = idx.get(x.ngay); for (const w of [50, 100, 200]) x["ma" + w] = M[w][i] != null && vt.close[i] < M[w][i]; }
  console.log("\n   -- P5b: so sanh cac bo loc thi truong (chenh = lenh khi KHONG vi pham - lenh khi vi pham; CI bootstrap theo CUM THANG) --");
  const boLoc = [["VN-Index duoi vung gia tri 60 phien (VAL)", (x) => x.v60 === "duoi"], ["VN-Index duoi vung gia tri 120 phien", (x) => x.v120 === "duoi"], ["VN-Index duoi POC 60", (x) => !x.p60], ["VN-Index duoi POC 120", (x) => !x.p120], ["VN-Index duoi MA50", (x) => x.ma50], ["VN-Index duoi MA100", (x) => x.ma100], ["VN-Index duoi MA200", (x) => x.ma200]];
  for (const [ten, fn] of boLoc) {
    const xau = ds.filter(fn), tot = ds.filter((x) => !fn(x)); const [lo, hi] = cumBoot(tot, xau);
    const nua = (a, b) => { const g1 = tot.filter((x) => x.ngay >= a && x.ngay < b), g2 = xau.filter((x) => x.ngay >= a && x.ngay < b); return `${f(tb(g1.map((x) => x.ret)) - tb(g2.map((x) => x.ret)))} (n vi pham ${g2.length})`; };
    console.log(`   ${ten.padEnd(42)} vi pham n=${String(xau.length).padStart(4)} TB ${f(tb(xau.map((x) => x.ret))).padStart(6)}% | con lai TB ${f(tb(tot.map((x) => x.ret))).padStart(6)}% | chenh ${f(tb(tot.map((x) => x.ret)) - tb(xau.map((x) => x.ret))).padStart(5)}% [CI cum ${f(lo)} .. ${f(hi)}] | <=2019: ${nua("2000", "2020")} | 2020-22: ${nua("2020", "2023")} | 2023+: ${nua("2023", "2099")}`);
  }
  // (3) VAL 60 co them gi so voi MA50 khong: xet rieng cac lenh khi VN-Index TREN MA50
  { const g = ds.filter((x) => !x.ma50); const a = g.filter((x) => x.v60 === "duoi"), b = g.filter((x) => x.v60 !== "duoi"); console.log(`   Khi VN-Index TREN MA50: duoi VAL60 n=${a.length} TB ${f(tb(a.map((x) => x.ret)))}% | khong duoi n=${b.length} TB ${f(tb(b.map((x) => x.ret)))}%`);
    const g2 = ds.filter((x) => x.ma50); const a2 = g2.filter((x) => x.v60 === "duoi"), b2 = g2.filter((x) => x.v60 !== "duoi"); console.log(`   Khi VN-Index DUOI MA50: duoi VAL60 n=${a2.length} TB ${f(tb(a2.map((x) => x.ret)))}% | khong duoi n=${b2.length} TB ${f(tb(b2.map((x) => x.ret)))}%`);
    console.log(`   Trung nhau: duoi VAL60 va duoi VAL120 cung luc: ${ds.filter((x) => x.v60 === "duoi" && x.v120 === "duoi").length} lenh; chi 60: ${ds.filter((x) => x.v60 === "duoi" && x.v120 !== "duoi").length}; chi 120: ${ds.filter((x) => x.v60 !== "duoi" && x.v120 === "duoi").length}`); }
  const nams = [...new Set(ds.map((x) => x.ngay.slice(0, 4)))].sort();
  console.log("   Theo nam, cua so 60 (TB %/lenh): nam | tren VA | trong VA | duoi VA");
  for (const y of nams) { const g = ds.filter((x) => x.ngay.startsWith(y)); const m = (k) => { const h = g.filter((x) => x.v60 === k); return `${f(tb(h.map((x) => x.ret))).padStart(6)} (n=${String(h.length).padStart(3)})`; }; console.log(`     ${y} | ${m("tren")} | ${m("trong")} | ${m("duoi")}`); }
}
process.exit(0);
