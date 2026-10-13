// NGHIEN CUU (2026-10-14): FRVP dung quy trinh "Buoc 1 xac dinh xu huong 1D theo HH-HL, buoc 2 ve Fixed Range tu day nhip tang den hien tai".
// Khac ban nghienCuuFRVP.mjs: ban kia neo vao pivot low gan nhat bat ke cau truc; day chi xet lenh khi cau truc la TANG (HH-HL) va neo vao DAY BAT DAU nhip tang gan nhat.
// Pivot (khong nhin truoc): pivot high / low = cao nhat / thap nhat trong +-K nen, chi dung khi da du K nen xac nhan (j + K <= iv).
//   Cau truc TANG : dinh pivot gan nhat > dinh truoc do VA day pivot gan nhat > day truoc do (HH + HL).  GIAM: LH + LL.  Con lai: DI NGANG / CHUA RO.
//   Neo FR (tang): day pivot NGAY TRUOC dinh pivot gan nhat (= noi bat dau nhip tang hien tai), ve toi nen tin hieu. Neu nhip qua ngan (<10 nen) thi lay day pivot truoc nua.
// Khoi luong theo muc gia: xap xi tu nen ngay (chia deu KL moi nen tren [thap, cao], 1 bin = 0,5% gia) - KHONG phai du lieu khop lenh that.
// Quy tac vi tri: A = dong cua trong [VAL*0,99 .. POC*1,03] (pullback ve vung ho tro) | C = dong cua > VAH (tinh den hom qua) & KL tuong doi >= 1,5 & E <= VAH*1,04 (breakout) | D = muc can KL (POC/VAH/HVN) gan nhat phia tren cach E.
// Chay: node engine/dich-vu/nghienCuuFRVPTrend.mjs
import { taiLenh, mo, tb, f, boot } from "./nghienCuuLenh.mjs";

const BIN = 0.005;

function pivots(t, iv, K) {
  const H = [], L = [];
  for (let j = Math.max(K, iv - 260); j + K <= iv; j++) {
    let ph = true, pl = true;
    for (let k = j - K; k <= j + K; k++) { if (k === j) continue; if (t.high[k] >= t.high[j]) ph = false; if (t.low[k] <= t.low[j]) pl = false; if (!ph && !pl) break; }
    if (ph) H.push(j);
    if (pl) L.push(j);
  }
  return { H, L };
}
function cauTruc(t, iv, K) {
  const { H, L } = pivots(t, iv, K);
  if (H.length < 2 || L.length < 2) return null;
  const h2 = H[H.length - 1], h1 = H[H.length - 2], l2 = L[L.length - 1], l1 = L[L.length - 2];
  const tang = t.high[h2] > t.high[h1] && t.low[l2] > t.low[l1];
  const giam = t.high[h2] < t.high[h1] && t.low[l2] < t.low[l1];
  // Day bat dau nhip tang hien tai = day pivot nam TRUOC dinh pivot gan nhat
  let neo = null;
  for (let i = L.length - 1; i >= 0; i--) if (L[i] < h2 && h2 - L[i] >= 10) { neo = L[i]; break; }
  return { loai: tang ? "TANG" : giam ? "GIAM" : "NGANG", neo, h2, l2 };
}
function frvp(t, tu, den) {
  let lo = Infinity, hi = -Infinity;
  for (let j = tu; j <= den; j++) { lo = Math.min(lo, t.low[j]); hi = Math.max(hi, t.high[j]); }
  if (!(lo > 0) || !(hi > lo)) return null;
  const nBin = Math.max(8, Math.ceil(Math.log(hi / lo) / Math.log(1 + BIN)) + 1);
  const bin = (g) => Math.min(nBin - 1, Math.max(0, Math.floor(Math.log(g / lo) / Math.log(1 + BIN))));
  const gia = (x) => lo * (1 + BIN) ** (x + 0.5);
  const kl = new Array(nBin).fill(0);
  for (let j = tu; j <= den; j++) { const v = t.vol[j]; if (!(v > 0)) continue; const a = bin(t.low[j]), b = bin(t.high[j]); for (let x = a; x <= b; x++) kl[x] += v / (b - a + 1); }
  const tong = kl.reduce((x, y) => x + y, 0); if (!(tong > 0)) return null;
  let poc = 0; for (let x = 1; x < nBin; x++) if (kl[x] > kl[poc]) poc = x;
  let a = poc, b = poc, s = kl[poc];
  while (s < 0.7 * tong && (a > 0 || b < nBin - 1)) { const l = a > 0 ? kl[a - 1] : -1, r = b < nBin - 1 ? kl[b + 1] : -1; if (l >= r) { a--; s += kl[a]; } else { b++; s += kl[b]; } }
  const tbBin = tong / nBin; const hvn = [];
  for (let x = 1; x < nBin - 1; x++) if (kl[x] >= kl[x - 1] && kl[x] >= kl[x + 1] && kl[x] >= 1.5 * tbBin) hvn.push(gia(x));
  return { poc: gia(poc), vah: gia(b), val: gia(a), hvn };
}

const { lenh } = taiLenh();
const pf = (g) => { const w = g.filter((x) => x.ret > 0).reduce((s, x) => s + x.ret, 0), l = -g.filter((x) => x.ret <= 0).reduce((s, x) => s + x.ret, 0); return l > 0 ? w / l : NaN; };
const hang = (ten, g) => { const r = g.map((x) => x.ret); console.log(`   ${ten.padEnd(50)} n=${String(g.length).padStart(4)} | TB ${f(tb(r)).padStart(6)}% | thang ${f((g.filter((x) => x.ret > 0).length / (g.length || 1)) * 100, 0).padStart(3)}% | PF ${f(pf(g)).padStart(5)} | tong ${f(r.reduce((s, v) => s + v, 0), 0).padStart(6)}%`); };

for (const K of [3, 5, 8]) {
  const dong = [];
  for (const t of lenh) {
    const iv = t.iv, E = t.open[iv + 1];
    if (!(E > 0) || iv < 150) continue;
    const r = mo(t, { E, vao: iv + 1, banTu: iv + 3, S: t.S }); if (!r) continue;
    const ct = cauTruc(t, iv, K); if (!ct) continue;
    const row = { ret: r.ret, nam: t.ngayArr[iv].slice(0, 4), loai: ct.loai, co: false };
    if (ct.loai === "TANG" && ct.neo != null) {
      const fr = frvp(t, ct.neo, iv), fh = frvp(t, ct.neo, iv - 1);
      if (fr) {
        const c = t.close[iv];
        const can = [fr.poc, fr.vah, ...fr.hvn].filter((g) => g > E * 1.005);
        Object.assign(row, { co: true, A: c >= fr.val * 0.99 && c <= fr.poc * 1.03, C: !!fh && c > fh.vah && (t.relVol[iv] ?? 0) >= 1.5 && E <= fh.vah * 1.04, dCan: can.length ? (Math.min(...can) / E - 1) * 100 : 99, soNen: iv - ct.neo });
      }
    }
    dong.push(row);
  }
  console.log(`\n================ PIVOT K = ${K} nen (tong ${dong.length} lenh) ================`);
  for (const loai of ["TANG", "GIAM", "NGANG"]) hang(`Cau truc ${loai}`, dong.filter((x) => x.loai === loai));
  const tang = dong.filter((x) => x.co);
  console.log(`   (trong cau truc TANG co ve duoc FR: n=${tang.length}, do dai nhip TB ${f(tb(tang.map((x) => x.soNen)), 0)} nen)`);
  if (K !== 5) { for (const [ten, fn] of [["TANG & A", (x) => x.A], ["TANG & C", (x) => x.C], ["TANG & (A hoac C)", (x) => x.A || x.C]]) hang(ten, tang.filter(fn)); continue; }
  console.log("\n   --- Trong cau truc TANG (HH-HL), neo FR tu day nhip tang ---");
  hang("Tat ca lenh cau truc TANG (moc so sanh)", tang);
  const sosanh = (ten, giu, bo) => { const [lo, hi] = boot(giu.map((x) => x.ret), bo.map((x) => x.ret)); const nams = [...new Set(tang.map((x) => x.nam))].sort(); const du = nams.filter((y) => giu.filter((x) => x.nam === y).length >= 10 && bo.filter((x) => x.nam === y).length >= 10); const tot = du.filter((y) => tb(giu.filter((x) => x.nam === y).map((x) => x.ret)) > tb(bo.filter((x) => x.nam === y).map((x) => x.ret))).length; console.log(`      -> ${ten}: giu - bo = ${f(tb(giu.map((x) => x.ret)) - tb(bo.map((x) => x.ret)))}% [95% CI ${f(lo)} .. ${f(hi)}] | nam giu tot hon: ${tot}/${du.length}`); };
  for (const [ten, fn] of [["A: pullback ve VAL..POC", (x) => x.A], ["C: breakout vuot VAH + KL", (x) => x.C], ["A hoac C", (x) => x.A || x.C], ["A va C", (x) => x.A && x.C]]) { hang(ten + " - CO", tang.filter(fn)); hang(ten + " - KHONG", tang.filter((x) => !fn(x))); sosanh(ten, tang.filter(fn), tang.filter((x) => !fn(x))); }
  for (const X of [1, 2, 3]) { const giu = tang.filter((x) => x.dCan >= X), bo = tang.filter((x) => x.dCan < X); hang(`Bo lenh khi kháng cu KL < ${X}% (giu)`, giu); sosanh(`kháng cu < ${X}%`, giu, bo); }
  // So sanh voi lenh KHONG o cau truc tang: cau truc tang co tot hon bat ke FRVP khong?
  const khac = dong.filter((x) => x.loai !== "TANG");
  const [lo, hi] = boot(dong.filter((x) => x.loai === "TANG").map((x) => x.ret), khac.map((x) => x.ret));
  console.log(`\n   Cau truc TANG vs khong TANG (chua dung FRVP): chenh = ${f(tb(dong.filter((x) => x.loai === "TANG").map((x) => x.ret)) - tb(khac.map((x) => x.ret)))}% [CI ${f(lo)} .. ${f(hi)}]`);
}
// ---------- PHAN 2: HE THONG HIEN TAI + (cau truc TANG HH-HL) + (FRVP vi tri A hoac C), KHONG chon K: dat o it nhat 2/3 cach chon pivot (K=3,5,8) ----------
console.log("\n================ PHAN 2: HE THONG CU + CAU TRUC TANG + FRVP (A hoac C), DONG THUAN 2/3 CACH CHON PIVOT ================");
{
  const dong = [];
  for (const t of lenh) {
    const iv = t.iv, E = t.open[iv + 1];
    if (!(E > 0) || iv < 150) continue;
    const r = mo(t, { E, vao: iv + 1, banTu: iv + 3, S: t.S }); if (!r) continue;
    let dat = 0, datTang = 0, soK = 0;
    for (const K of [3, 5, 8]) {
      const ct = cauTruc(t, iv, K); if (!ct) continue; soK++;
      if (ct.loai !== "TANG") continue; datTang++;
      if (ct.neo == null) continue;
      const fr = frvp(t, ct.neo, iv), fh = frvp(t, ct.neo, iv - 1); if (!fr) continue;
      const c = t.close[iv];
      const A = c >= fr.val * 0.99 && c <= fr.poc * 1.03;
      const C = !!fh && c > fh.vah && (t.relVol[iv] ?? 0) >= 1.5 && E <= fh.vah * 1.04;
      if (A || C) dat++;
    }
    if (soK < 3) continue;
    dong.push({ ret: r.ret, nam: t.ngayArr[iv].slice(0, 4), ngay: t.ngayArr[iv], dat, datTang });
  }
  const mdd = (g) => { const s = [...g].sort((a, b) => (a.ngay < b.ngay ? -1 : 1)); let c = 0, pk = 0, dd = 0; for (const x of s) { c += x.ret; pk = Math.max(pk, c); dd = Math.max(dd, pk - c); } return dd; };
  const hang2 = (ten, g) => { hang(ten, g); };
  const nams = [...new Set(dong.map((x) => x.nam))].sort();
  const sosanh = (ten, giu, bo) => { const [lo, hi] = boot(giu.map((x) => x.ret), bo.map((x) => x.ret)); const du = nams.filter((y) => giu.filter((x) => x.nam === y).length >= 10 && bo.filter((x) => x.nam === y).length >= 10); const tot = du.filter((y) => tb(giu.filter((x) => x.nam === y).map((x) => x.ret)) > tb(bo.filter((x) => x.nam === y).map((x) => x.ret))).length; console.log(`      -> ${ten}: giu - bo = ${f(tb(giu.map((x) => x.ret)) - tb(bo.map((x) => x.ret)))}% [95% CI ${f(lo)} .. ${f(hi)}] | nam giu tot hon: ${tot}/${du.length}`); };
  hang2("HE THONG HIEN TAI (moc)", dong);
  for (const [ten, fn] of [["Cau truc TANG o >=2/3 cach pivot", (x) => x.datTang >= 2], ["Cau truc TANG + FRVP(A hoac C) o >=2/3 cach pivot", (x) => x.dat >= 2], ["Cau truc TANG + FRVP(A hoac C) o CA 3/3", (x) => x.dat >= 3]]) {
    const giu = dong.filter(fn), bo = dong.filter((x) => !fn(x));
    hang2(ten + " - GIU", giu); hang2(ten + " - BO", bo); sosanh(ten, giu, bo);
    console.log(`         sut toi da (cong don): giu ${f(mdd(giu), 0)}% | moc ${f(mdd(dong), 0)}%`);
    console.log("         theo nam (giu | moc):", nams.map((y) => { const g = giu.filter((x) => x.nam === y), m = dong.filter((x) => x.nam === y); return g.length >= 10 ? `${y}:${f(tb(g.map((x) => x.ret)), 1)}|${f(tb(m.map((x) => x.ret)), 1)}(n${g.length})` : null; }).filter(Boolean).join(" "));
  }
}
process.exit(0);
