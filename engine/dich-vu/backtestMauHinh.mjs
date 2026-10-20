// BACKTEST TY LE THANH CONG CUA CAC MAU HINH GIA NOI TIENG (Hieu 2026-10-21: "test thu thanh cong cua cac mau hinh noi tieng").
// Du lieu: nen_dai.json (~390 ma, ~11 nam, gia dieu chinh). Nhan dien NHAN QUA: dinh / day = pivot 4 nen moi ben, chi dung sau khi xac nhan (4 nen). Vao lenh tai DONG CUA nen pha vo duong co (neckline / bien) dau tien.
// Moi mau hinh co: dieu kien hinh dang, nen pha vo, muc tieu do tu mau hinh (do cao mau hinh), cat lo theo mau hinh.
//  Thanh cong CO DIEN = gia cham MUC TIEU truoc khi cham CAT LO trong <= 60 nen (tu nen sau pha vo). Doi chieu NGAU NHIEN = cat lo / (cat lo + muc tieu) (xac suat cua duong di khong xu huong).
//  Mau hinh TANG: mua ATC nen pha vo, ban tu T+2 (hang ve), cat lo / chot theo mau hinh, het 60 nen thi dong; phi 0,4%. Mau hinh GIAM: chi do xem gia co giam dung huong khong (co phieu VN khong ban khong duoc).
//  Them: lai TB 10 phien sau pha vo (theo huong mau hinh) so voi trung binh moi ngay (doi chieu thi truong), chia 3 giai doan: <2019 | 2019-2022.4 | 2022.5+.
//  Nhom NEN NHAT: nhan dien tren 1-3 nen (nhan chim, bua, sao mai, 3 linh trang, inside bar...), do lai 1 / 3 / 5 / 10 phien va ty le dung huong so voi doi chieu.
// Thanh khoan: GTGD TB20 >= 5 ty. Chi DOC cache. CACH CHAY: node engine/dich-vu/backtestMauHinh.mjs
import { docJson } from "./backtestChung.mjs";

const cache = docJson("nen_dai.json");
const CP = 0.4;
const NP = 4; // nen moi ben cua pivot
const kyOf = (d) => (d < "2019-01-01" ? 0 : d < "2022-05-01" ? 1 : 2);
const KQ = {}; // ten -> { dir, mau: [] }
const them = (ten, dir, rec) => { (KQ[ten] ||= { dir, mau: [] }).mau.push(rec); };
const base10 = { tong: 0, n: 0 }; // trung binh lai 10 phien tat ca ngay (doi chieu), moi 5 nen lay 1
const base10Ky = [{ s: 0, n: 0 }, { s: 0, n: 0 }, { s: 0, n: 0 }];
const CN = {}; // nen nhat: ten -> {dir, r:[[1,3,5,10]], ky}

for (const [ma, bars] of Object.entries(cache)) {
  const n = bars.length; if (n < 260) continue;
  const o = bars.map((b) => b.o), h = bars.map((b) => b.h), l = bars.map((b) => b.l), c = bars.map((b) => b.c), v = bars.map((b) => b.v), d = bars.map((b) => b.t);
  const gt = (i) => { let s = 0; for (let j = i - 19; j <= i; j++) s += (c[j] * v[j]) / 1e6; return s / 20; };
  // pivot
  const pH = [], pL = [];
  for (let p = NP; p < n - NP; p++) {
    let hh = true, ll = true;
    for (let k = 1; k <= NP; k++) { if (!(h[p] > h[p - k] && h[p] >= h[p + k])) hh = false; if (!(l[p] < l[p - k] && l[p] <= l[p + k])) ll = false; }
    if (hh) pH.push({ p, v: h[p], conf: p + NP }); if (ll) pL.push({ p, v: l[p], conf: p + NP });
  }
  let ih = 0, il = 0; const HH = [], LL = [];
  const ult = {};
  // ket qua 1 lenh
  function ketQua(t, dir, stop, tg) {
    const E = c[t];
    let thanhCong = null, ra = null, cho = false;
    for (let j = t + 1; j <= Math.min(n - 1, t + 60); j++) {
      if (dir > 0) {
        const cham = l[j] <= stop, dat = h[j] >= tg;
        if (thanhCong == null) { if (cham) thanhCong = false; else if (dat) thanhCong = true; }
        if (ra == null) {
          if (j === t + 2 && cho) ra = o[j];
          else if (j >= t + 2 && l[j] <= stop) ra = Math.min(o[j], stop);
          else if (j >= t + 2 && h[j] >= tg) ra = Math.max(o[j], tg);
          else if (j < t + 2 && l[j] <= stop) cho = true;
        }
      } else {
        const cham = h[j] >= stop, dat = l[j] <= tg;
        if (thanhCong == null) { if (cham) thanhCong = false; else if (dat) thanhCong = true; }
      }
      if (thanhCong != null && (ra != null || dir < 0)) break;
    }
    if (thanhCong == null) thanhCong = false;
    if (dir > 0 && ra == null) ra = c[Math.min(n - 1, t + 60)];
    return { thanhCong, ra: dir > 0 ? (ra / E - 1) * 100 - CP : null };
  }
  const nhan = (ten, dir, t, stop, tg) => {
    if (ult[ten] != null && t - ult[ten] < 15) return;
    if (!(stop > 0) || !(tg > 0)) return;
    const E = c[t], rs = dir > 0 ? (E - stop) / E : (stop - E) / E, rg = dir > 0 ? (tg - E) / E : (E - tg) / E;
    if (rs <= 0.005 || rg <= 0.005 || rs > 0.25) return;
    ult[ten] = t;
    const r = ketQua(t, dir, stop, tg);
    const r10 = t + 10 < n ? (c[t + 10] / E - 1) * 100 * dir : null;
    them(ten, dir, { ky: kyOf(d[t]), ok: r.thanhCong, ra: r.ra, r10, rs, rg });
  };
  // ---- CAC TIN HIEU NEN NHAT ----
  const co = (ten, dir, t) => {
    if (t + 10 >= n) return; if (ult["cn" + ten] != null && t - ult["cn" + ten] < 5) return; ult["cn" + ten] = t;
    const e = c[t]; (CN[ten] ||= { dir, r: [] }).r.push({ ky: kyOf(d[t]), x: [1, 3, 5, 10].map((k) => (c[t + k] / e - 1) * 100 * dir) });
  };
  for (let t = 62; t < n - 11; t++) {
    while (ih < pH.length && pH[ih].conf <= t) HH.push(pH[ih++]); while (il < pL.length && pL[il].conf <= t) LL.push(pL[il++]);
    if (t % 5 === 0 && t + 10 < n) { const x = (c[t + 10] / c[t] - 1) * 100 - CP; base10.tong += x; base10.n++; base10Ky[kyOf(d[t])].s += x; base10Ky[kyOf(d[t])].n++; }
    if (gt(t) < 5) continue;
    // ----- NEN NHAT -----
    const body = (i) => Math.abs(c[i] - o[i]), rng = (i) => h[i] - l[i];
    const xuong5 = c[t - 5] > c[t - 1] * 1.03, len5 = c[t - 5] < c[t - 1] * 0.97;
    if (xuong5 && c[t - 1] < o[t - 1] && c[t] > o[t] && c[t] >= o[t - 1] && o[t] <= c[t - 1] && body(t) > body(t - 1)) co("Nhan chim tang (sau giam)", 1, t);
    if (len5 && c[t - 1] > o[t - 1] && c[t] < o[t] && c[t] <= o[t - 1] && o[t] >= c[t - 1] && body(t) > body(t - 1)) co("Nhan chim giam (sau tang)", -1, t);
    if (xuong5 && rng(t) > 0 && (Math.min(o[t], c[t]) - l[t]) >= 2 * body(t) && (h[t] - Math.max(o[t], c[t])) <= 0.3 * rng(t) && body(t) > 0) co("Bua (hammer, sau giam)", 1, t);
    if (len5 && rng(t) > 0 && (h[t] - Math.max(o[t], c[t])) >= 2 * body(t) && (Math.min(o[t], c[t]) - l[t]) <= 0.3 * rng(t) && body(t) > 0) co("Sao bang (shooting star, sau tang)", -1, t);
    if (xuong5 && c[t - 2] < o[t - 2] && body(t - 2) > 0.6 * rng(t - 2) && body(t - 1) < 0.3 * rng(t - 1) && c[t] > o[t] && c[t] > (o[t - 2] + c[t - 2]) / 2) co("Sao mai (morning star)", 1, t);
    if (len5 && c[t - 2] > o[t - 2] && body(t - 2) > 0.6 * rng(t - 2) && body(t - 1) < 0.3 * rng(t - 1) && c[t] < o[t] && c[t] < (o[t - 2] + c[t - 2]) / 2) co("Sao hom (evening star)", -1, t);
    if (c[t] > o[t] && c[t - 1] > o[t - 1] && c[t - 2] > o[t - 2] && c[t] > c[t - 1] && c[t - 1] > c[t - 2] && o[t] > o[t - 1] && o[t - 1] > o[t - 2] && xuong5 === false && c[t - 3] < c[t - 2]) co("3 linh trang (three white soldiers)", 1, t);
    if (c[t] < o[t] && c[t - 1] < o[t - 1] && c[t - 2] < o[t - 2] && c[t] < c[t - 1] && c[t - 1] < c[t - 2] && c[t - 3] > c[t - 2]) co("3 qua den (three black crows)", -1, t);
    if (h[t - 1] < h[t - 2] && l[t - 1] > l[t - 2] && c[t] > h[t - 1]) co("Inside bar, dong cua vuot dinh", 1, t);
    if (h[t - 1] < h[t - 2] && l[t - 1] > l[t - 2] && c[t] < l[t - 1]) co("Inside bar, dong cua thung day", -1, t);
    if (o[t] > h[t - 1] * 1.03 && c[t] > o[t] && v[t] > 2 * (v[t - 1] + v[t - 2] + v[t - 3]) / 3) co("Gap tang >= 3% + khoi luong gap doi", 1, t);
    // ----- MAU HINH GIA -----
    const nH = HH.length, nL = LL.length; if (nH < 3 || nL < 3) continue;
    const H1 = HH[nH - 1], H2 = HH[nH - 2], H3 = HH[nH - 3], L1 = LL[nL - 1], L2 = LL[nL - 2], L3 = LL[nL - 3];
    const maxH = (a, b) => { let m = 0; for (let i = a; i <= b; i++) m = Math.max(m, h[i]); return m; }, minL = (a, b) => { let m = 1e18; for (let i = a; i <= b; i++) m = Math.min(m, l[i]); return m; };
    // Day doi (W): 2 day gan nhau, dinh o giua >= 8%
    {
      const a = L2, b = L1, dist = b.p - a.p;
      if (dist >= 10 && dist <= 60 && Math.abs(a.v - b.v) / a.v <= 0.03 && t - b.p <= 40) {
        const N = maxH(a.p, b.p), low = Math.min(a.v, b.v);
        if (N >= 1.08 * Math.max(a.v, b.v) && c[t] > N && c[t - 1] <= N && maxH(b.p, t - 1) <= N * 1.0001) nhan("Day doi (double bottom)", 1, t, low * 0.99, N + (N - low));
      }
    }
    // Dinh doi (M)
    {
      const a = H2, b = H1, dist = b.p - a.p;
      if (dist >= 10 && dist <= 60 && Math.abs(a.v - b.v) / a.v <= 0.03 && t - b.p <= 40) {
        const Vv = minL(a.p, b.p), top = Math.max(a.v, b.v);
        if (Vv <= top / 1.08 && c[t] < Vv && c[t - 1] >= Vv && minL(b.p, t - 1) >= Vv * 0.9999) nhan("Dinh doi (double top)", -1, t, top * 1.01, Vv - (top - Vv));
      }
    }
    // Vai dau vai nguoc (day: L3 L2 L1 voi L2 thap nhat)
    {
      if (L2.v < L3.v * 0.97 && L2.v < L1.v * 0.97 && Math.abs(L3.v - L1.v) / ((L3.v + L1.v) / 2) <= 0.08 && L1.p - L3.p <= 90 && t - L1.p <= 40) {
        const p1 = maxH(L3.p, L2.p), p2 = maxH(L2.p, L1.p), neck = (p1 + p2) / 2;
        if (Math.abs(p1 - p2) / neck <= 0.06 && c[t] > neck && c[t - 1] <= neck && maxH(L1.p, t - 1) <= neck * 1.001) nhan("Vai dau vai nguoc (inverse H&S)", 1, t, L1.v * 0.99, neck + (neck - L2.v));
      }
      if (H2.v > H3.v * 1.03 && H2.v > H1.v * 1.03 && Math.abs(H3.v - H1.v) / ((H3.v + H1.v) / 2) <= 0.08 && H1.p - H3.p <= 90 && t - H1.p <= 40) {
        const v1 = minL(H3.p, H2.p), v2 = minL(H2.p, H1.p), neck = (v1 + v2) / 2;
        if (Math.abs(v1 - v2) / neck <= 0.06 && c[t] < neck && c[t - 1] >= neck && minL(H1.p, t - 1) >= neck * 0.999) nhan("Vai dau vai (head & shoulders)", -1, t, H1.v * 1.01, neck - (H2.v - neck));
      }
    }
    // Tam giac (2 dinh + 2 day gan nhat trong 50 nen)
    {
      const a = H2, b = H1, x = L2, y = L1;
      if (b.p - a.p >= 6 && y.p - x.p >= 6 && Math.min(a.p, x.p) >= t - 50 && t - Math.max(b.p, y.p) <= 25) {
        const hgt = Math.max(a.v, b.v) - Math.min(x.v, y.v);
        const phang = (p, q) => Math.abs(p - q) / p <= 0.015;
        if (phang(a.v, b.v) && y.v > x.v * 1.03) { const top = Math.max(a.v, b.v); if (c[t] > top && c[t - 1] <= top) nhan("Tam giac tang (ascending triangle)", 1, t, y.v * 0.99, top + hgt); }
        else if (phang(x.v, y.v) && b.v < a.v * 0.97) { const sup = Math.min(x.v, y.v); if (c[t] < sup && c[t - 1] >= sup) nhan("Tam giac giam (descending triangle)", -1, t, b.v * 1.01, sup - hgt); }
        else if (b.v < a.v * 0.98 && y.v > x.v * 1.02) {
          const up = (tt) => a.v + ((b.v - a.v) * (tt - a.p)) / (b.p - a.p), lo = (tt) => x.v + ((y.v - x.v) * (tt - x.p)) / (y.p - x.p);
          if (up(t) > lo(t)) { if (c[t] > up(t) && c[t - 1] <= up(t - 1)) nhan("Tam giac can (symmetrical) pha len", 1, t, lo(t) * 0.99, c[t] + hgt); if (c[t] < lo(t) && c[t - 1] >= lo(t - 1)) nhan("Tam giac can (symmetrical) pha xuong", -1, t, up(t) * 1.01, c[t] - hgt); }
        }
        // Nem
        if (b.v < a.v * 0.97 && y.v < x.v * 0.97 && (a.v - b.v) / (b.p - a.p) > (x.v - y.v) / (y.p - x.p)) {
          const up = (tt) => a.v + ((b.v - a.v) * (tt - a.p)) / (b.p - a.p); if (c[t] > up(t) && c[t - 1] <= up(t - 1)) nhan("Nem giam (falling wedge) pha len", 1, t, y.v * 0.99, c[t] + (a.v - x.v));
        }
        if (b.v > a.v * 1.03 && y.v > x.v * 1.03 && (y.v - x.v) / (y.p - x.p) > (b.v - a.v) / (b.p - a.p)) {
          const lo = (tt) => x.v + ((y.v - x.v) * (tt - x.p)) / (y.p - x.p); if (c[t] < lo(t) && c[t - 1] >= lo(t - 1)) nhan("Nem tang (rising wedge) pha xuong", -1, t, b.v * 1.01, c[t] - (b.v - x.v));
        }
      }
    }
    // Co (bull flag): cot buom >= 15% trong <= 15 nen, nen chinh 5-20 nen
    for (let fl = 5; fl <= 20; fl += 5) {
      const s = t - fl; if (s < 20) break;
      const fh = maxH(s + 1, t - 1), fl_ = minL(s + 1, t - 1);
      let poleLo = 1e18; for (let i = s - 15; i < s; i++) poleLo = Math.min(poleLo, l[i]);
      const pole = c[s] - poleLo, polePct = pole / poleLo;
      if (polePct >= 0.15 && fh - fl_ <= 0.4 * pole && fl_ >= c[s] - 0.5 * pole && fh <= c[s] * 1.06 && c[t] > fh && c[t - 1] <= fh) { nhan("Co tang (bull flag)", 1, t, fl_ * 0.99, c[t] + pole); break; }
    }
    // Coc va tay cam
    {
      const R1 = HH.slice(-6).find((x) => t - x.p >= 40 && t - x.p <= 140);
      if (R1) {
        const R2 = HH[nH - 1];
        if (R2.p > R1.p + 30 && R2.v >= R1.v * 0.95 && R2.v <= R1.v * 1.05) {
          const bot = minL(R1.p, R2.p), pb = (() => { for (let i = R1.p; i <= R2.p; i++) if (l[i] === bot) return i; return R1.p; })();
          const depth = (R1.v - bot) / R1.v, sym = (pb - R1.p) / (R2.p - R1.p);
          if (depth >= 0.12 && depth <= 0.35 && sym >= 0.3 && sym <= 0.7 && t - R2.p >= 5 && t - R2.p <= 25) {
            const handle = minL(R2.p + 1, t - 1);
            if (handle >= R2.v * 0.88 && handle <= R2.v * 0.97 && c[t] > R2.v && c[t - 1] <= R2.v && maxH(R2.p + 1, t - 1) <= R2.v * 1.002) nhan("Coc va tay cam (cup & handle)", 1, t, handle * 0.99, R2.v + (R1.v - bot));
          }
        }
      }
    }
    // Hop di ngang (Darvas): 25 nen trong bien <= 8%, cham 2 dau >= 2 lan
    {
      const a = t - 25, top = maxH(a, t - 1), bot = minL(a, t - 1);
      if ((top - bot) / bot <= 0.08) {
        let tt = 0, tb = 0; for (let i = a; i < t; i++) { if (h[i] >= top * 0.985) tt++; if (l[i] <= bot * 1.015) tb++; }
        if (tt >= 2 && tb >= 2) { if (c[t] > top * 1.005 && c[t - 1] <= top * 1.005) nhan("Hop di ngang pha len (rectangle breakout)", 1, t, bot * 0.99, c[t] + (top - bot)); if (c[t] < bot * 0.995 && c[t - 1] >= bot * 0.995) nhan("Hop di ngang pha xuong (rectangle breakdown)", -1, t, top * 1.01, c[t] - (top - bot)); }
      }
    }
  }
}

const f = (x, dd = 1) => (Number.isFinite(x) ? x.toFixed(dd) : "-");
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const pf = (a) => { const w = a.filter((x) => x > 0).reduce((s, x) => s + x, 0), l = -a.filter((x) => x <= 0).reduce((s, x) => s + x, 0); return l ? w / l : NaN; };
console.log(`DOI CHUNG: lai TB 10 phien (moi ngay) sau phi = ${f(base10.tong / base10.n, 2)}% (${base10.n} mau) | theo giai doan: ${base10Ky.map((x) => f(x.s / x.n, 2)).join(" | ")}\n`);
console.log(`${"MAU HINH GIA".padEnd(54)} ${"n".padStart(5)} ${"TC%".padStart(5)} ${"NN%".padStart(5)} ${"chenh".padStart(6)} ${"cat%".padStart(5)} ${"tieu%".padStart(6)} | TC% 3 gd (<2019|19-22.4|22.5+) | ${"lai10(huong)".padStart(12)} ${"mua thuc te: TB".padStart(15)} ${"thang%".padStart(7)} ${"PF".padStart(5)}`);
for (const [ten, { dir, mau }] of Object.entries(KQ).sort((a, b) => a[0].localeCompare(b[0]))) {
  const tc = (m) => (m.length ? (m.filter((x) => x.ok).length / m.length) * 100 : NaN);
  const nn = (m) => tb(m.map((x) => x.rs / (x.rs + x.rg))) * 100;
  const ky = [0, 1, 2].map((k) => mau.filter((x) => x.ky === k));
  const rr = mau.filter((x) => x.ra != null).map((x) => x.ra);
  console.log(`${(dir > 0 ? "[TANG] " : "[GIAM] ") + ten}`.padEnd(54) + ` ${String(mau.length).padStart(5)} ${f(tc(mau)).padStart(5)} ${f(nn(mau)).padStart(5)} ${f(tc(mau) - nn(mau)).padStart(6)} ${f(tb(mau.map((x) => x.rs)) * 100).padStart(5)} ${f(tb(mau.map((x) => x.rg)) * 100).padStart(6)} | ${ky.map((m) => `${f(tc(m), 0)}(${m.length})`).join(" ").padEnd(28)} | ${f(tb(mau.filter((x) => x.r10 != null).map((x) => x.r10)), 2).padStart(12)} ${dir > 0 ? f(tb(rr), 2).padStart(15) : "".padStart(15)} ${dir > 0 ? f((rr.filter((x) => x > 0).length / rr.length) * 100, 0).padStart(7) : "".padStart(7)} ${dir > 0 ? f(pf(rr), 2).padStart(5) : ""}`);
}
console.log(`\n${"NEN NHAT".padEnd(46)} ${"n".padStart(6)} | lai theo huong sau 1 / 3 / 5 / 10 phien (%) | dung huong 5 phien % | 3 giai doan lai 10 phien`);
for (const [ten, { dir, r }] of Object.entries(CN).sort((a, b) => b[1].dir - a[1].dir || a[0].localeCompare(b[0]))) {
  const m = [0, 1, 2, 3].map((k) => tb(r.map((z) => z.x[k])));
  console.log(`${(dir > 0 ? "[TANG] " : "[GIAM] ") + ten}`.padEnd(46) + ` ${String(r.length).padStart(6)} | ${m.map((x) => f(x, 2).padStart(6)).join(" ")} | ${f((r.filter((z) => z.x[2] > 0).length / r.length) * 100, 0).padStart(5)} | ${[0, 1, 2].map((k) => f(tb(r.filter((z) => z.ky === k).map((z) => z.x[3])), 2)).join(" | ")}`);
}
