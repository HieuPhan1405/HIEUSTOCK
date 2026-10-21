// DIEM B XUAT HIEN SAU DIEM MUA BINH THUONG CUA HE THONG (Hieu 2026-10-21: "co ma nao co diem B sau diem mua bth ko").
// Diem mua binh thuong = tin hieu MUA thuong (loai 1) cua engine (backtest, khong doc DB web). Diem B: giam >= 15% tu dinh 20 phien, dong cua tren Tenkan 9 + Kijun 17, day cach >= 3 phien, GTGD >= 3 ty, 1 lan / 15 phien.
// (A) Cac diem B trong 10 phien gan nhat co diem mua thuong TRUOC DO (trong 40 phien): ngay mua, gia mua, lenh con mo hay da dong, gia B so voi gia mua. (B) Thong ke tu 2022-05: diem B co / khong co diem mua thuong truoc trong 40 phien, lai 10 / 20 phien tu mo cua phien sau.
// CHI DOC cache. CACH CHAY: node engine/dich-vu/diemBSauDiemMuaThuong.mjs
import { docJson, chayEngine } from "./backtestChung.mjs";
const cache = docJson("nen_dai.json"), vni = docJson("vnindex_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const th = (a) => (a.length ? (a.filter((x) => x > 0).length / a.length) * 100 : NaN);
const { lenh } = chayEngine({ cache, vni });
const buy = {}; for (const t of lenh) if (t.loai === 1) (buy[t.ma] ||= []).push({ iv: t.iv, ngay: t.ngay, E: t.close[t.iv], jEng: t.jEng, S: t.S });
const ev = [];
for (const [ma, b] of Object.entries(cache)) {
  const n = b.length; if (n < 300) continue;
  const c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v), o = b.map((x) => x.o);
  let ult = -99;
  for (let i = 130; i < n; i++) {
    let gt = 0; for (let j = i - 19; j <= i; j++) gt += (c[j] * v[j]) / 1e6; if (gt / 20 < 3) continue;
    let giam = 0; for (let k = 0; k <= 10; k++) giam = Math.max(giam, (1 - c[i - k] / hh(h, i - k, 20)) * 100);
    if (giam < 15) continue;
    const tk = (hh(h, i, 9) + ll(l, i, 9)) / 2, kj = (hh(h, i, 17) + ll(l, i, 17)) / 2;
    if (!(c[i] > tk && c[i] > kj)) continue;
    const day = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day) kDay = j;
    if (i - kDay < 3 || i - ult < 15) continue;
    ult = i;
    const truoc = (buy[ma] ?? []).filter((x) => x.iv < i && x.iv >= i - 40).pop() ?? null;
    let tb20 = 0; for (let j = kDay - 20; j < kDay; j++) tb20 += v[j]; tb20 /= 20;
    let vMax = 0; for (let j = kDay - 2; j <= Math.min(kDay + 2, i); j++) vMax = Math.max(vMax, v[j]);
    const E2 = o[i + 1];
    ev.push({ ma, i, t: b[i].t, n, giaB: c[i], giam, kl: tb20 > 0 ? vMax / tb20 : 0, truoc, conMo: truoc ? i < truoc.jEng : false, hien: c[n - 1], r10: E2 && c[i + 11] ? (c[i + 11] / E2 - 1) * 100 - 0.4 : null, r20: E2 && c[i + 21] ? (c[i + 21] / E2 - 1) * 100 - 0.4 : null });
  }
}
console.log("######## (A) DIEM B TRONG 10 PHIEN GAN NHAT, CO DIEM MUA THUONG TRUOC DO (<= 40 phien) ########");
const gan = ev.filter((e) => e.i >= e.n - 10);
const co = gan.filter((e) => e.truoc).sort((a, b) => b.t.localeCompare(a.t));
console.log(`Tong ${gan.length} diem B gan day, ${co.length} ma co diem mua thuong truoc:`);
for (const e of co) console.log(`   ${e.ma.padEnd(5)} diem B ${e.t.slice(5)} gia ${f(e.giaB, 2)} (giam ${f(e.giam)}%, KL day ${f(e.kl)}x) | mua thuong ${e.truoc.ngay.slice(5)} gia ${f(e.truoc.E, 2)} (cach ${e.i - e.truoc.iv} phien) | lenh luc diem B: ${e.conMo ? "CON MO" : "DA DONG"} | B so voi gia mua ${f((e.giaB / e.truoc.E - 1) * 100)}% | hien ${f(e.hien, 2)} (${f((e.hien / e.truoc.E - 1) * 100)}% so voi gia mua)`);
console.log("\n######## (B) THONG KE TU 2022-05: diem B co / khong co diem mua thuong truoc trong 40 phien ########");
const dong = (ten, a) => console.log(`   ${ten.padEnd(52)} n=${String(a.length).padStart(5)} | 10p ${f(tb(a.map((x) => x.r10).filter((x) => x != null)), 2)} [${f(th(a.map((x) => x.r10).filter((x) => x != null)), 0)}%] | 20p ${f(tb(a.map((x) => x.r20).filter((x) => x != null)), 2)} [${f(th(a.map((x) => x.r20).filter((x) => x != null)), 0)}%]`);
const s = ev.filter((e) => e.t >= "2022-05-01");
for (const [ten, loc] of [["giam >= 15%", () => true], ["giam 20-30%", (e) => e.giam >= 20 && e.giam < 30]]) {
  console.log(` == ${ten}`);
  const a = s.filter(loc);
  dong("KHONG co diem mua thuong truoc", a.filter((e) => !e.truoc));
  dong("CO diem mua thuong truoc (bat ky)", a.filter((e) => e.truoc));
  dong("  - lenh con mo luc diem B", a.filter((e) => e.truoc && e.conMo));
  dong("  - lenh da dong luc diem B (cat lo / ban)", a.filter((e) => e.truoc && !e.conMo));
  dong("  - diem B THAP hon gia mua >= 5% (mua trung binh gia)", a.filter((e) => e.truoc && e.giaB <= e.truoc.E * 0.95));
}
const tong = s.length, coN = s.filter((e) => e.truoc).length;
console.log(`\nTi le diem B co diem mua thuong truoc trong 40 phien: ${f((coN / tong) * 100)}% (${coN}/${tong})`);
