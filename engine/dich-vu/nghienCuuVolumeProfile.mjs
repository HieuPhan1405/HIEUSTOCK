// NGHIEN CUU (2026-10-14): Volume Profile (khoi luong theo muc gia) co giup loc / cham diem lenh khong?
// Du lieu chi co nen NGAY (khong co tick) -> xap xi: khoi luong moi nen chia DEU tren dai [thap, cao] cua nen do (don vi: 1 bin = 0,5% gia).
// Cua so: 120 nen truoc tin hieu (khong dung nen tuong lai). Vao lenh: mo cua phien sau (nhu he thong), thoat theo luat he thong (mo()).
// Dac trung:
//  - tren: ti trong khoi luong nam trong (E, E*1,08] tren tong khoi luong cua so  = "can cung phia tren" (vung ban cu bi ket)
//  - duoi: ti trong khoi luong nam trong [E*0,92, E] = "nen do phia duoi"
//  - poc: gia co khoi luong nhieu nhat so voi E (%), vaPoc tren/duoi
//  - trongVA: E nam trong vung gia tri 70% quanh POC
// Chay: node engine/dich-vu/nghienCuuVolumeProfile.mjs
import { taiLenh, mo, tb, f, boot } from "./nghienCuuLenh.mjs";

const BIN = 0.005, CUA_SO = 120;

function hoSo(t, iv) {
  const j0 = Math.max(0, iv - CUA_SO + 1);
  let lo = Infinity, hi = -Infinity;
  for (let j = j0; j <= iv; j++) { lo = Math.min(lo, t.low[j]); hi = Math.max(hi, t.high[j]); }
  if (!(lo > 0) || !(hi > lo)) return null;
  const g0 = lo, nBin = Math.max(10, Math.ceil(Math.log(hi / lo) / Math.log(1 + BIN)));
  const bin = (g) => Math.min(nBin - 1, Math.max(0, Math.floor(Math.log(g / g0) / Math.log(1 + BIN))));
  const kl = new Array(nBin).fill(0);
  for (let j = j0; j <= iv; j++) {
    const v = t.vol[j]; if (!(v > 0)) continue;
    const a = bin(t.low[j]), b = bin(t.high[j]), k = b - a + 1;
    for (let x = a; x <= b; x++) kl[x] += v / k;
  }
  const tong = kl.reduce((x, y) => x + y, 0); if (!(tong > 0)) return null;
  const gia = (x) => g0 * (1 + BIN) ** (x + 0.5);
  return { kl, tong, g0, nBin, bin, gia };
}
function dacTrung(t, iv, E) {
  const h = hoSo(t, iv); if (!h) return null;
  const { kl, tong, bin, gia, nBin } = h;
  const tong2 = (g1, g2) => { if (g2 < g1) return 0; const a = bin(Math.max(g1, h.g0)), b = bin(Math.max(g2, h.g0)); let s = 0; for (let x = a; x <= Math.min(b, nBin - 1); x++) s += kl[x]; return s; };
  const eb = bin(E);
  const tren = E * 1.08 <= h.g0 ? 0 : (g1 => { let s = 0; for (let x = eb + 1; x <= Math.min(bin(E * 1.08), nBin - 1); x++) s += kl[x]; return s / tong; })();
  let duoi = 0; for (let x = bin(E * 0.92); x <= eb; x++) duoi += kl[x]; duoi /= tong;
  let poc = 0; for (let x = 1; x < nBin; x++) if (kl[x] > kl[poc]) poc = x;
  // vung gia tri 70%: mo rong tu POC sang ben nao nhieu hon
  let lo = poc, hi = poc, s = kl[poc];
  while (s < 0.7 * tong && (lo > 0 || hi < nBin - 1)) {
    const l = lo > 0 ? kl[lo - 1] : -1, r = hi < nBin - 1 ? kl[hi + 1] : -1;
    if (l >= r) { lo--; s += kl[lo]; } else { hi++; s += kl[hi]; }
  }
  return { tren, duoi, pocPct: (gia(poc) / E - 1) * 100, trongVA: eb >= lo && eb <= hi, treVA: eb > hi, duoiVA: eb < lo };
}

const { lenh } = taiLenh();
const dong = [];
for (const t of lenh) {
  const E = t.open[t.iv + 1];
  if (!(E > 0) || t.iv < CUA_SO) continue;
  const r = mo(t, { E, vao: t.iv + 1, banTu: t.iv + 3, S: t.S }); if (!r) continue;
  const d = dacTrung(t, t.iv, E); if (!d) continue;
  dong.push({ ...d, ret: r.ret, nam: t.ngayArr[t.iv].slice(0, 4), stop: /STOP/.test(r.ly) });
}
console.log("so lenh co du lieu:", dong.length, "| TB ket qua", f(tb(dong.map((x) => x.ret))), "% | thang", f((dong.filter((x) => x.ret > 0).length / dong.length) * 100, 0), "%");

const dongKq = (ten, g) => console.log(`   ${ten.padEnd(44)} n=${String(g.length).padStart(4)} | TB ${f(tb(g.map((x) => x.ret))).padStart(6)}% | thang ${f((g.filter((x) => x.ret > 0).length / (g.length || 1)) * 100, 0).padStart(3)}% | cat lo ${f((g.filter((x) => x.stop).length / (g.length || 1)) * 100, 0).padStart(3)}%`);
const chia = (ten, khoa) => {
  const s = [...dong].sort((a, b) => a[khoa] - b[khoa]); const n = s.length;
  console.log(`\n-- ${ten} (chia 4 nhom, tu thap den cao) --`);
  const nhom = [0, 1, 2, 3].map((k) => s.slice(Math.floor((k * n) / 4), Math.floor(((k + 1) * n) / 4)));
  nhom.forEach((g, k) => dongKq(`Q${k + 1}: ${f(g[0][khoa], 3)} .. ${f(g[g.length - 1][khoa], 3)}`, g));
  const thap = [...nhom[0], ...nhom[1]], cao = [...nhom[2], ...nhom[3]];
  const [lo, hi] = boot(thap.map((x) => x.ret), cao.map((x) => x.ret));
  console.log(`   chenh (nua THAP - nua CAO) = ${f(tb(thap.map((x) => x.ret)) - tb(cao.map((x) => x.ret)))}%  [95% CI ${f(lo)} .. ${f(hi)}]`);
  // on dinh theo nam
  const nam = [...new Set(dong.map((x) => x.nam))].sort();
  const dau = nam.map((y) => { const g = dong.filter((x) => x.nam === y); if (g.length < 30) return null; const m = [...g].sort((a, b) => a[khoa] - b[khoa]); const h = Math.floor(m.length / 2); return `${y}:${f(tb(m.slice(0, h).map((x) => x.ret)) - tb(m.slice(h).map((x) => x.ret)), 2)}`; }).filter(Boolean);
  console.log("   chenh theo nam (thap - cao):", dau.join("  "));
};
chia("CAN CUNG PHIA TREN: khoi luong cu nam trong +0..8% so voi gia vao", "tren");
chia("NEN DO PHIA DUOI: khoi luong nam trong -8..0%", "duoi");
chia("POC so voi gia vao (%; am = POC nam duoi gia vao)", "pocPct");
console.log("\n-- Vi tri gia vao so voi vung gia tri 70% --");
dongKq("Trong vung gia tri", dong.filter((x) => x.trongVA));
dongKq("Tren vung gia tri (da vuot khoi luong chinh)", dong.filter((x) => x.treVA));
dongKq("Duoi vung gia tri", dong.filter((x) => x.duoiVA));
process.exit(0);
