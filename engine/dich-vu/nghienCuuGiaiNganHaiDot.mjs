// GIAI NGAN 2 DOT: 1/2 o DIEM B (gia dong cua tren Tenkan va Kijun sau khi giam >= 15%, day 20 phien cach >= 3 phien - xem nghienCuuGiaiNganThepBds.mjs) neu B CO TRUOC tin hieu mua cua he thong, 1/2 con lai khi he thong bao MUA (Hieu 2026-10-21).
// So sanh voi MUA HET 100% o diem he thong (ATC ngay tin hieu). Quan ly lenh ap dung CHUNG gia bien thoat cua he thong (30% TP1 + 30% TP2 + 40% giu den BAN / cat lo / hoa von sau TP2; ban tu T+2 ke tu ngay mua he thong): moi dot tinh lai theo GIA VAO CUA DOT DO,
// phi 0,4% moi dot. Tinh tren cac lenh Mua thuong cua engine (4.4k lenh); "B co truoc" = B xuat hien trong W phien truoc tin hieu he thong (W = 10 / 20 / 40), lay B DAU TIEN trong cua so. CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuGiaiNganHaiDot.mjs
import { docJson, chayEngine, thongKe, tb, f, kyOf, TEN_KY } from "./backtestChung.mjs";
import { mo } from "./moBaoVeLai.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const CP = 0.4;

// B: chi so phien (dong cua tren Tenkan 9 va Kijun 17, boi canh da giam >= 15% tu dinh 20 phien trong 10 phien gan nhat, day 20 phien cach >= 3 phien), cach nhau >= 15 phien
const cacheB = {};
function laySoB(ma) {
  if (cacheB[ma]) return cacheB[ma];
  const b = cache[ma], n = b.length, c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v);
  const ds = []; let ult = -99;
  for (let i = 130; i < n; i++) {
    let gt = 0; for (let j = i - 19; j <= i; j++) gt += (c[j] * v[j]) / 1e6;
    if (gt / 20 < 3) continue;
    let ctx = false; for (let k = 0; k <= 10 && !ctx; k++) if (c[i - k] <= 0.85 * hh(h, i - k, 20)) ctx = true;
    if (!ctx) continue;
    const tk = (hh(h, i, 9) + ll(l, i, 9)) / 2, kj = (hh(h, i, 17) + ll(l, i, 17)) / 2;
    const day = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day) kDay = j;
    if (c[i] > tk && c[i] > kj && i - kDay >= 3 && i - ult >= 15) { ds.push(i); ult = i; }
  }
  return (cacheB[ma] = ds);
}

const { lenh } = chayEngine({ cache, vni });
const ds = lenh.filter((t) => t.loai === 1 && t.iv >= 130);
const nenMa = (t) => cache[t.ma];
const hang = ds.map((t) => {
  const r = mo(t, { atc: true });
  if (!r) return null;
  const E = t.close[t.iv];
  const thu = (r.ret + CP) / 100 + 1; // ty le gia thoat TB / gia vao he thong
  return { t, r, E, Pthoat: thu * E };
}).filter((x) => x);
console.log(`${hang.length} lenh Mua thuong (ATC + T+2, phi 0,4%/dot)\n`);

const ret = (Pthoat, Evao) => (Pthoat / Evao - 1) * 100 - CP;
const pf = (a) => { const w = a.filter((v) => v > 0).reduce((s, v) => s + v, 0), l = -a.filter((v) => v <= 0).reduce((s, v) => s + v, 0); return l ? w / l : NaN; };

// KICH BAN DUNG (khong nhin truoc tuong lai): moi lan B xuat hien -> mua 1/2 ngay luc do. Trong W phien sau:
//   - neu he thong bao MUA (lenh Mua thuong dau tien co iv trong (iB, iB+W]) -> mua not 1/2 o gia he thong; ca 2 dot ap dung gia bien thoat cua he thong;
//   - neu KHONG co tin hieu he thong -> ban 1/2 da mua o dong cua phien iB+W (het han), hoac cat lo som neu dong cua <= -stopPct so voi gia B (kieu "stop" - tuy chon).
// Doi chieu "chi he thong": chi mua khi he thong bao MUA (100% o gia he thong), tren CUNG cac lan B co tin hieu he thong theo sau. Von dung: dot co he thong = 1,0 von; dot khong = 0,5 von.
const lenhTheoMa = {};
for (const x of hang) (lenhTheoMa[x.t.ma] ||= []).push(x);
function chay(W, stopPct) {
  const ev = [];
  for (const ma of Object.keys(cache)) {
    const b = cache[ma]; if (!b || b.length < 300) continue;
    const c = b.map((x) => x.c), l = b.map((x) => x.l);
    let gt;
    for (const iB of laySoB(ma)) {
      if (iB + W >= b.length) continue;
      const E1 = c[iB];
      const sys = (lenhTheoMa[ma] || []).filter((x) => x.t.iv > iB && x.t.iv <= iB + W).sort((p, q) => p.t.iv - q.t.iv)[0];
      if (sys) {
        ev.push({ ky: b[iB].t < "2019-01-01" ? 0 : b[iB].t < "2022-05-01" ? 1 : 2, co: true, von: 1, pl: 0.5 * ret(sys.Pthoat, E1) + 0.5 * ret(sys.Pthoat, sys.E), pheSysOnly: ret(sys.Pthoat, sys.E), vonSys: 1, plB100: ret(sys.Pthoat, E1) });
      } else {
        let thoat = c[iB + W];
        if (stopPct) for (let j = iB + 2; j <= iB + W; j++) if (c[j] <= E1 * (1 - stopPct / 100)) { thoat = c[j]; break; }
        ev.push({ ky: b[iB].t < "2019-01-01" ? 0 : b[iB].t < "2022-05-01" ? 1 : 2, co: false, von: 0.5, pl: 0.5 * ret(thoat, E1), pheSysOnly: 0, vonSys: 0, plB100: ret(thoat, E1) });
      }
      void gt;
    }
  }
  return ev;
}
const TB = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
for (const [W, stop] of [[10, 0], [10, 7], [15, 0], [15, 7], [20, 0]]) {
  const ev = chay(W, stop);
  const co = ev.filter((e) => e.co), khong = ev.filter((e) => !e.co);
  const plP = ev.reduce((s, e) => s + e.pl, 0), vonP = ev.reduce((s, e) => s + e.von, 0);
  const plS = ev.reduce((s, e) => s + e.pheSysOnly, 0), vonS = ev.reduce((s, e) => s + e.vonSys, 0);
  console.log(`=== B xuat hien -> cho toi ${W} phien${stop ? `, cat lo som neu dong cua <= -${stop}% so voi gia B` : ", het han ban neu khong co tin hieu he thong"} | ${ev.length} lan B ===`);
  console.log(`  He thong bao MUA sau B: ${co.length} lan (${f((co.length / ev.length) * 100, 0)}%); khong bao: ${khong.length} lan`);
  console.log(`  Dot co he thong (1,0 von): 1/2 B + 1/2 he thong = ${f(TB(co.map((e) => e.pl)), 2)}%/lenh  | chi he thong ${f(TB(co.map((e) => e.pheSysOnly)), 2)}%  | 100% o B ${f(TB(co.map((e) => e.plB100)), 2)}%`);
  console.log(`  Dot KHONG co he thong (0,5 von, ban het han / cat lo): lai nua dot ${f(TB(khong.map((e) => e.plB100)), 2)}% (thang ${f((khong.filter((e) => e.plB100 > 0).length / khong.length) * 100, 0)}%, lo >= 5% ${f((khong.filter((e) => e.plB100 <= -5).length / khong.length) * 100, 0)}%)`);
  console.log(`  TONG hop moi ${ev.length} lan B: KE HOACH 1/2 B + 1/2 he thong: P&L ${f(plP, 0)} tren von ${f(vonP, 0)} => ${f((plP / vonP) * 100 / 100, 2)}% / 1 don vi von | CHI HE THONG (cung cac lan B): P&L ${f(plS, 0)} tren von ${f(vonS, 0)} => ${f(plS / vonS, 2)}% / don vi von`);
  console.log(`  theo giai doan (P&L / von, ke hoach vs chi he thong): ${[0, 1, 2].map((j) => { const z = ev.filter((e) => e.ky === j); return `${TEN_KY[j]}: ${f(z.reduce((s, e) => s + e.pl, 0) / z.reduce((s, e) => s + e.von, 0), 2)} vs ${f(z.reduce((s, e) => s + e.pheSysOnly, 0) / z.reduce((s, e) => s + e.vonSys, 0), 2)} (n ${z.length})`; }).join(" | ")}\n`);
}
void kyOf; void thongKe; void tb;
