// NGHIEN CUU (2026-10-13): co tin hieu cuoi phien T roi MUA O PHIEN SAU thi ket qua the nao? So cac cach vao lenh, cung cat lo/TP/T+2 cua engine.
// Chay: node engine/dich-vu/nghienCuuVaoLenhPhienSau.mjs
import { taiLenh, mo, tb, f, boot } from "./nghienCuuLenh.mjs";
const { lenh } = taiLenh();
const TU = "2022-05-01";

const cach = {
  "0. Mua DONG CUA phien tin hieu (khong thuc te: tin hieu chi biet sau khi dong cua)": (t) => ({ E: t.close[t.iv], vao: t.iv, banTu: t.iv + 2 }),
  "1. Mua MO CUA phien sau (ATO) - cach dang dung": (t) => ({ E: t.open[t.iv + 1], vao: t.iv + 1, banTu: t.iv + 3 }),
  "2. Mua DONG CUA phien sau (ATC)": (t) => ({ E: t.close[t.iv + 1], vao: t.iv + 1, banTu: t.iv + 3 }),
  "3. Mua gia TB phien sau (O+H+L+C)/4 ~ VWAP": (t) => { const i = t.iv + 1; return { E: (t.open[i] + t.high[i] + t.low[i] + t.close[i]) / 4, vao: i, banTu: i + 2 }; },
  "4. Mo cua phien sau, BO neu gap len > +1%": (t) => (t.open[t.iv + 1] / t.close[t.iv] - 1 > 0.01 ? null : { E: t.open[t.iv + 1], vao: t.iv + 1, banTu: t.iv + 3 }),
  "5. Chi mua DONG CUA phien sau neu dong cua > dong cua tin hieu (xac nhan)": (t) => (t.close[t.iv + 1] > t.close[t.iv] ? { E: t.close[t.iv + 1], vao: t.iv + 1, banTu: t.iv + 3 } : null),
  "6. Lenh cho gia = dong cua tin hieu -1% (hieu luc 3 phien)": (t) => cho(t, 0.01, 3),
  "7. Lenh cho gia = dong cua tin hieu -2% (hieu luc 3 phien)": (t) => cho(t, 0.02, 3),
  "8. Lenh cho gia = dong cua tin hieu -3% (hieu luc 5 phien)": (t) => cho(t, 0.03, 5),
};
function cho(t, pct, soPhien) {
  const L = t.close[t.iv] * (1 - pct);
  for (let j = t.iv + 1; j <= t.iv + soPhien && j < t.n; j++) {
    if (t.low[j] <= L) { const E = Math.min(t.open[j], L); return { E, vao: j, banTu: j + 2, khop: true }; }
  }
  return { khop: false };
}

function chay(ten, fn, tu) {
  const kq = []; let khong = 0, tong = 0, khopDuoc = 0;
  for (const t of lenh) {
    if (t.ngay < tu || t.iv + 8 >= t.n) continue;
    tong++;
    const p = fn(t);
    if (!p) { khong++; continue; }
    if (p.khop === false) { continue; }
    khopDuoc++;
    const r = mo(t, { E: p.E, vao: p.vao, banTu: p.banTu, S: t.S });
    if (r) kq.push(r);
  }
  return { kq, tong, khopDuoc };
}
const pf = (a) => { const g = a.filter((x) => x > 0).reduce((s, x) => s + x, 0), l = -a.filter((x) => x <= 0).reduce((s, x) => s + x, 0); return l > 0 ? g / l : NaN; };

for (const [ten, tu] of [["TOAN BO (2014 -> 2026.9)", "0000"], ["TU 2022.5", TU]]) {
  console.log(`\n=========== ${ten} ===========`);
  console.log("Cach vao".padEnd(86), "lenh", "khop%", "TB lai%/lenh", "thang%", "PF", "TB lai moi lenh co tin hieu*");
  const goc = chay("1", cach["1. Mua MO CUA phien sau (ATO) - cach dang dung"], tu);
  for (const [k, fn] of Object.entries(cach)) {
    const { kq, tong, khopDuoc } = chay(k, fn, tu);
    const r = kq.map((x) => x.ret);
    // *: lenh khong khop tinh la 0% (khong vao) - so sanh cong bang voi cach 1 tren cung so tin hieu
    const tren = (r.reduce((a, b) => a + b, 0)) / tong;
    console.log(k.padEnd(86), String(kq.length).padStart(5), f((khopDuoc / tong) * 100, 0).padStart(5), f(tb(r)).padStart(10), f((r.filter((x) => x > 0).length / r.length) * 100, 1).padStart(7), f(pf(r)).padStart(5), f(tren).padStart(10));
  }
  // do tre T+2: cach 1 nhung bi quet SL trong 2 phien dau (ban muon)
}
// Bootstrap: cach 1 so voi cach 0 (tu 2022.5)
{
  const a = chay("1", cach["1. Mua MO CUA phien sau (ATO) - cach dang dung"], TU).kq.map((x) => x.ret);
  const b = chay("0", cach["0. Mua DONG CUA phien tin hieu (khong thuc te: tin hieu chi biet sau khi dong cua)"], TU).kq.map((x) => x.ret);
  const [lo, hi] = boot(b, a);
  console.log(`\nTu 2022.5: chenh (mua dong cua tin hieu) - (mua mo cua phien sau) = ${f(tb(b) - tb(a))} diem % /lenh [95% CI ${f(lo)} .. ${f(hi)}]`);
}
// Gap phien sau: phan bo
{
  const g = lenh.filter((t) => t.iv + 2 < t.n).map((t) => (t.open[t.iv + 1] / t.close[t.iv] - 1) * 100);
  const q = (p) => { const s = [...g].sort((x, y) => x - y); return s[Math.floor(p * s.length)]; };
  console.log(`\nGap mo cua phien sau so voi dong cua tin hieu (${g.length} lenh): trung vi ${f(q(0.5))}% | 25% ${f(q(0.25))}% | 75% ${f(q(0.75))}% | 90% ${f(q(0.9))}% | >+1%: ${f((g.filter((x) => x > 1).length / g.length) * 100, 0)}% | >+3%: ${f((g.filter((x) => x > 3).length / g.length) * 100, 0)}%`);
}
process.exit(0);
