// DIEM B CHO GIAO DICH NGAN (Hieu 2026-10-21: "toi muon trade ngan thi sao, diem B van ok chu"). Diem B giam 20-30% (dong cua <= 80% .. 70% dinh 20 phien trong 11 nen gan nhat, nhu engine/loi/diemMuaPhucHoi.js),
// mua MO CUA phien ke tiep (D), phi 0,4%, tuan thu T+2,5: khong ban duoc truoc cuoi phien D+2, nen cac muc ban chi xet tu D+2 tro di (gia dong cua D+2 la gia ban som nhat).
// Do: (1) lai neu ban dong cua phien D+h (h = 2, 3, 5, 10); (2) TY LE "ket khong the thoat" - low trong D..D+2 cham -5% / -7% ma chua ban duoc;
// (3) QUAN LY LENH ngan: M1 = SL dong cua <= -5% / TP cham +6% (high) / het han D+5; M2 = SL -7% / TP +10% / het han D+10; M3 = SL cau truc (Kijun - 0,5 ATR, 3,5-6%) / TP +8% / D+7. SL xet theo dong cua tu D+2, TP theo high tu D+2 (khop gia TP hoac mo cua neu gap len).
// Doi chieu: dai giam 15-20% va >= 30%, va co so (moi 5 phien moi ma cung dieu kien thanh khoan). Chia toan bo / tu 2022-05 / tu 2024-01. CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuDiemBGiaoDichNgan.mjs
import { docJson } from "./backtestChung.mjs";

const cache = docJson("nen_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const CP = 0.4;
const H = [2, 3, 5, 10];
const MG = [["B 15-20%", 15, 20], ["B 20-30% (hien tai)", 20, 30], ["B >= 30%", 30, 999]];

function atrW(h, l, c, i, n = 14) { let s = 0; for (let j = i - n + 1; j <= i; j++) s += Math.max(h[j] - l[j], Math.abs(h[j] - c[j - 1]), Math.abs(l[j] - c[j - 1])); return s / n; }
function quanLy(o, h, l, c, i, E, { sl, slTinh, tp, het }) {
  // i = nen B; D = i + 1 (mua mo cua); xet tu D + 2
  const D = i + 1; let gia = c[Math.min(D + het, c.length - 1)];
  for (let j = D + 2; j <= D + het && j < c.length; j++) {
    if (h[j] >= E * (1 + tp / 100)) { gia = Math.max(E * (1 + tp / 100), o[j] > E * (1 + tp / 100) ? o[j] : 0) || E * (1 + tp / 100); return { gia, lydo: "TP" }; }
    const slGia = slTinh != null ? slTinh : E * (1 - sl / 100);
    if (c[j] <= slGia) return { gia: c[j], lydo: "SL" };
  }
  return { gia, lydo: "het" };
}

const ev = Object.fromEntries(MG.map(([t]) => [t, []])); ev["CO SO"] = [];
for (const ma of Object.keys(cache)) {
  const b = cache[ma]; if (!b || b.length < 300) continue;
  const n = b.length, o = b.map((x) => x.o), c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v);
  let ult = -99;
  for (let i = 130; i < n - 14; i++) {
    let gt = 0; for (let j = i - 19; j <= i; j++) gt += (c[j] * v[j]) / 1e6; if (gt / 20 < 3) continue;
    const D = i + 1, E = o[D];
    const gom = (extra = {}) => {
      const r = { t: b[i].t, ky: b[i].t < "2022-05-01" ? 0 : b[i].t < "2024-01-01" ? 1 : 2, dau: Math.min(l[D], l[D + 1], l[D + 2]) / E - 1, ...extra };
      for (const x of H) r[`r${x}`] = (c[D + x] / E - 1) * 100 - CP;
      return r;
    };
    if (i % 5 === 0) ev["CO SO"].push(gom());
    let giam = 0; for (let k = 0; k <= 10; k++) giam = Math.max(giam, (1 - c[i - k] / hh(h, i - k, 20)) * 100);
    if (giam < 15) continue;
    const tk = (hh(h, i, 9) + ll(l, i, 9)) / 2, kj = (hh(h, i, 17) + ll(l, i, 17)) / 2;
    const day = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day) kDay = j;
    if (!(c[i] > tk && c[i] > kj && i - kDay >= 3 && i - ult >= 15)) continue;
    ult = i;
    const a = atrW(h, l, c, i); let slC = Math.min(kj - 0.5 * a, E * (1 - 0.035)); slC = Math.max(slC, E * (1 - 0.06));
    const nhom = MG.find(([, lo, hi]) => giam >= lo && giam < hi); if (!nhom) continue;
    const r = gom({
      M1: quanLy(o, h, l, c, i, E, { sl: 5, tp: 6, het: 5 }), M2: quanLy(o, h, l, c, i, E, { sl: 7, tp: 10, het: 10 }), M3: quanLy(o, h, l, c, i, E, { sl: 0, slTinh: slC, tp: 8, het: 7 }),
    });
    for (const m of ["M1", "M2", "M3"]) r[m].ret = (r[m].gia / E - 1) * 100 - CP;
    ev[nhom[0]].push(r);
  }
}
const th = (x) => (x.length ? (x.filter((y) => y > 0).length / x.length) * 100 : NaN);
const KY = [["toan bo", () => true], ["TU 2022-05", (x) => x.ky >= 1], ["TU 2024-01", (x) => x.ky === 2]];
for (const [tk, loc] of KY) {
  console.log(`\n######## ${tk} ########`);
  console.log("  (A) lai neu ban dong cua phien D+h (D = phien mua mo cua), % TB [thang%]; 'ket' = ty le low trong D..D+2 cham -5%");
  for (const ten of [...MG.map((m) => m[0]), "CO SO"]) {
    const a = ev[ten].filter(loc); if (a.length < 25) { console.log(`   ${ten.padEnd(22)} n=${a.length} (it mau)`); continue; }
    console.log(`   ${ten.padEnd(22)} n=${String(a.length).padStart(5)} | ${H.map((x) => `D+${x}: ${f(tb(a.map((r) => r[`r${x}`])), 2).padStart(5)} [${f(th(a.map((r) => r[`r${x}`])), 0)}%]`).join("  ")} | ket -5% ${f((a.filter((r) => r.dau <= -0.05).length / a.length) * 100, 0)}% (-7%: ${f((a.filter((r) => r.dau <= -0.07).length / a.length) * 100, 0)}%)`);
  }
  console.log("  (B) quan ly lenh ngan (chi diem B): lai TB / trung vi / thang% / ty le TP / ty le SL");
  for (const [ten] of MG) {
    const a = ev[ten].filter(loc); if (a.length < 25) continue;
    for (const m of ["M1", "M2", "M3"]) {
      const r = a.map((x) => x[m].ret);
      console.log(`   ${ten.padEnd(22)} ${m} | TB ${f(tb(r), 2).padStart(5)}% trung vi ${f(med(r), 2).padStart(5)}% thang ${f(th(r), 0)}% | TP ${f((a.filter((x) => x[m].lydo === "TP").length / a.length) * 100, 0)}% SL ${f((a.filter((x) => x[m].lydo === "SL").length / a.length) * 100, 0)}%`);
    }
  }
}
