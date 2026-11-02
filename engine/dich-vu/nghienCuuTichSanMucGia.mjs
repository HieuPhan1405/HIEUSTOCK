// TICH SAN vs MUC GIA VAO (Hieu 03/11/2026: "tich san vs muc gia ntn"): trong rổ tich san, mua o muc gia nao thi tot hon?
// Moi cuoi thang, lay cac ma dat bo loc tich san (nhu nghienCuuPhongCachDauTu.mjs phan 3; ban CHAT: von hoa >= 20.000 ty, ban RONG: >= 5.000 ty), mua o dong cua phien SAU, giu 6 / 12 thang.
// Doi chieu loi suat TUONG DOI trong cung thang (ma "re" vs "dat" cua cung 1 thang, nen loai bo anh huong thi truong chung) theo:
//   PE, PB, khoang cach toi dinh 252 phien, vi tri trong bien do 120 phien (pos120), gia / SMA50, dong luc 6 thang.
// Va ca RO tich san (chia deu) theo vi tri VN-Index so voi dinh 252 phien va theo tam ly < 20.
// Luu y: moc thang CHONG LAN (giu 6 / 12 thang), nen t-stat thuc te thap hon so in ra; chi gom ma DANG niem yet; von hoa tinh theo so CP hien tai.
// Chay: node engine/dich-vu/nghienCuuTichSanMucGia.mjs
import { docJson, tb, f } from "./backtestChung.mjs";
import { SO_CP_LUU_HANH } from "../../lib/soCoPhieuLuuHanh.js";
import { TAM_LY_LICH_SU } from "../../lib/tamLyLichSuDuLieu.js";

const nen = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const bctc = docJson("bctc_dai.json");
const ngay = vni.map((b) => b.t);
const N = ngay.length;
const idx = new Map(ngay.map((t, i) => [t, i]));
const tl = new Array(N).fill(null);
TAM_LY_LICH_SU.t.forEach((t, k) => { const i = idx.get(t); if (i != null) tl[i] = TAM_LY_LICH_SU.s[k]; });
const ma = [], C = [], G = [];
for (const [k, bars] of Object.entries(nen)) {
  if (bars.length < 300 || !SO_CP_LUU_HANH[k] || !bctc[k]) continue;
  const c = new Array(N).fill(null), g = new Array(N).fill(0);
  for (const b of bars) { const i = idx.get(b.t); if (i != null) { c[i] = b.c; g[i] = b.c * b.v; } }
  let last = null;
  for (let i = 0; i < N; i++) { if (c[i] != null) last = c[i]; else if (last != null) c[i] = last; }
  ma.push(k); C.push(c); G.push(g);
}
const M = ma.length;
const cong = (d, n) => new Date(Date.parse(d) + n * 86400e3).toISOString().slice(0, 10);
const qsAll = [...new Set(ma.flatMap((k) => Object.keys(bctc[k].q)))].sort();
const lui = (q, k) => qsAll[qsAll.indexOf(q) - k];
const gtv = (b, q, it) => b.q[q]?.[it];
const ttm = (b, q, it) => { let s = 0; for (let k = 0; k < 4; k++) { const x = gtv(b, lui(q, k), it); if (!Number.isFinite(x)) return NaN; s += x; } return s; };
const quyHieuLuc = (t) => { let q = null; for (const x of qsAll) { if (cong(x, 50) <= t) q = x; else break; } return q; };
const cacheCB = new Map();
function coBan(j, q) {
  const key = j + "|" + q;
  if (cacheCB.has(key)) return cacheCB.get(key);
  const b = bctc[ma[j]];
  const ln = ttm(b, q, 23003);
  const vcsh = (gtv(b, q, 14000) ?? NaN) + (gtv(b, q, 15000) ?? 0);
  const no = Number.isFinite(gtv(b, q, 13000)) ? gtv(b, q, 13000) : NaN;
  const lq = gtv(b, q, 23003), q4 = lui(q, 4), lq0 = q4 ? gtv(b, q4, 23003) : NaN;
  const o = { ln, vcsh, roe: (ln / vcsh) * 100, donBay: no / vcsh, quyKhongGiam: Number.isFinite(lq) && Number.isFinite(lq0) ? lq >= lq0 : null, cfo: ttm(b, q, 32000), tsnh: gtv(b, q, 11000), nnh: gtv(b, q, 13100) };
  cacheCB.set(key, o);
  return o;
}
const tb20 = (j, i) => { let s = 0; for (let k = i - 19; k <= i; k++) s += G[j][k]; return s / 20; };
const thanhKhoan = (j, i) => C[j][i] != null && C[j][i - 130] != null && tb20(j, i) >= 5e6;
const vonHoa = (j, i) => C[j][i] * 1000 * SO_CP_LUU_HANH[ma[j]];

const cuoiThang = [];
for (let i = 0; i < N; i++) if (i === N - 1 || ngay[i].slice(0, 7) !== ngay[i + 1].slice(0, 7)) cuoiThang.push(i);
const R = cuoiThang.filter((i) => ngay[i] >= "2022-01-01" && i + 2 < N);
const cuoiH = (i0, h) => { const p = cuoiThang.indexOf(i0) + h; return p < cuoiThang.length ? Math.min(N - 1, cuoiThang[p] + 1) : null; };
const retH = (j, i0, h) => { const e = cuoiH(i0, h); return e == null || e <= i0 + 1 ? null : C[j][e] / C[j][i0 + 1] - 1; };
const vniRet = (i0, h) => { const e = cuoiH(i0, h); return e == null ? null : vni[e].c / vni[i0 + 1].c - 1; };
const maxR = (j, i, n) => { let m = -Infinity; for (let k = i - n + 1; k <= i; k++) m = Math.max(m, C[j][k]); return m; };
const minR = (j, i, n) => { let m = Infinity; for (let k = i - n + 1; k <= i; k++) m = Math.min(m, C[j][k]); return m; };
const smaR = (j, i, n) => { let s = 0; for (let k = i - n + 1; k <= i; k++) s += C[j][k]; return s / n; };

function pool(i0, gioiHanVon) {
  const q = quyHieuLuc(ngay[i0]);
  if (!q) return [];
  const kq = [];
  for (let j = 0; j < M; j++) {
    if (!thanhKhoan(j, i0) || i0 < 260) continue;
    const b = bctc[ma[j]], cb = coBan(j, q), von = vonHoa(j, i0);
    if (!(cb.ln > 0) || von < gioiHanVon || cb.roe < 12) continue;
    if (process.argv[2] === "pi" && b.loai !== "pi") continue; // bo ngan hang / chung khoan / bao hiem: PE, PB thap cua ho mang tinh cau truc
    const ln0 = lui(q, 4) ? ttm(b, lui(q, 4), 23003) : NaN;
    const tang = Number.isFinite(ln0) && ln0 > 0 ? cb.ln / ln0 - 1 : cb.quyKhongGiam ? 0.05 : -1;
    if (tang < 0.05) continue;
    if (b.loai === "pi" && (!(cb.cfo > 0) || cb.donBay > 2.5 || !(cb.tsnh / cb.nnh >= 1))) continue;
    const g = C[j][i0];
    const lo = minR(j, i0, 120), hi = maxR(j, i0, 120);
    kq.push({
      j, von,
      "PE (thap = re)": von / cb.ln,
      "PB (thap = re)": von / cb.vcsh,
      "Gia / dinh 252 phien (thap = da giam sau)": g / maxR(j, i0, 252),
      "Vi tri 120 phien (thap = gan day)": hi > lo ? (g - lo) / (hi - lo) : 0.5,
      "Gia / SMA50 (thap = duoi trung binh)": g / smaR(j, i0, 50),
      "Dong luc 6 thang (thap = yeu)": g / C[j][i0 - 126],
    });
  }
  return kq;
}
const DAC_TRUNG = ["PE (thap = re)", "PB (thap = re)", "Gia / dinh 252 phien (thap = da giam sau)", "Vi tri 120 phien (thap = gan day)", "Gia / SMA50 (thap = duoi trung binh)", "Dong luc 6 thang (thap = yeu)"];
const sd = (a) => { const m = tb(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };

for (const [tenRo, gioiHan] of [["CHAT (von hoa >= 20.000 ty)", 2e13], ["RONG (von hoa >= 5.000 ty)", 5e12]]) {
  console.log(`\n################ ROR TICH SAN ${tenRo} ################`);
  const dsThang = R.map((i0) => ({ i0, p: pool(i0, gioiHan) }));
  console.log("So ma dat bo loc TB moi thang:", f(tb(dsThang.map((x) => x.p.length)), 1), "| toi thieu", Math.min(...dsThang.map((x) => x.p.length)));
  for (const h of [6, 12]) {
    console.log(`\n--- Giu ${h} thang: nua "THAP" so voi nua "CAO" cua tung dac trung (cung thang), loi suat % ---`);
    console.log("Dac trung".padEnd(46), "n thang".padStart(8), "nua thap".padStart(9), "nua cao".padStart(8), "chenh".padStart(7), "thang thap>cao".padStart(15), "t(naive)".padStart(9), "| tam phan: thap / giua / cao");
    for (const dt of DAC_TRUNG) {
      const chenh = [], thapA = [], caoA = [], t1 = [], t2 = [], t3 = [];
      for (const { i0, p } of dsThang) {
        const co = p.map((x) => ({ x, r: retH(x.j, i0, h) })).filter((o) => o.r != null && Number.isFinite(o.x[dt]));
        if (co.length < 8) continue;
        co.sort((a, b) => a.x[dt] - b.x[dt]);
        const m = Math.floor(co.length / 2), k3 = Math.floor(co.length / 3);
        const thap = tb(co.slice(0, m).map((o) => o.r)), cao = tb(co.slice(co.length - m).map((o) => o.r));
        thapA.push(thap * 100); caoA.push(cao * 100); chenh.push((thap - cao) * 100);
        t1.push(tb(co.slice(0, k3).map((o) => o.r)) * 100); t2.push(tb(co.slice(k3, co.length - k3).map((o) => o.r)) * 100); t3.push(tb(co.slice(co.length - k3).map((o) => o.r)) * 100);
      }
      if (!chenh.length) { console.log(dt.padEnd(46), "khong du du lieu"); continue; }
      const t = sd(chenh) > 0 ? tb(chenh) / (sd(chenh) / Math.sqrt(chenh.length)) : NaN;
      console.log(dt.padEnd(46), String(chenh.length).padStart(8), f(tb(thapA), 1).padStart(9), f(tb(caoA), 1).padStart(8), f(tb(chenh), 1).padStart(7), `${chenh.filter((x) => x > 0).length}/${chenh.length}`.padStart(15), f(t, 2).padStart(9), `| ${f(tb(t1), 1)} / ${f(tb(t2), 1)} / ${f(tb(t3), 1)}`);
    }
  }
}

// ---- ro tich san (chat) theo boi canh thi truong luc mua ----
console.log("\n################ ROR TICH SAN (CHAT) THEO BOI CANH THI TRUONG LUC MUA ################");
const dinh252 = (i) => { let m = 0; for (let k = Math.max(0, i - 251); k <= i; k++) m = Math.max(m, vni[k].c); return m; };
const hoangLoan = (i0) => { for (let k = i0 - 9; k <= i0; k++) if (tl[k] != null && tl[k] < 20) return true; return false; };
const nhom = (ten, dk) => {
  for (const h of [6, 12]) {
    const tp = [], vn = [];
    for (const i0 of R) {
      if (!dk(i0)) continue;
      const p = pool(i0, 2e13).map((x) => retH(x.j, i0, h)).filter((r) => r != null);
      const v = vniRet(i0, h);
      if (p.length < 5 || v == null) continue;
      tp.push(tb(p) * 100); vn.push(v * 100);
    }
    console.log(ten.padEnd(48), `+${String(h).padStart(2)}T n=${String(tp.length).padStart(2)}: rổ ${f(tb(tp), 1).padStart(6)}% | VN-Index ${f(tb(vn), 1).padStart(6)}% | rổ hon ${tp.filter((x, k) => x > vn[k]).length}/${tp.length}`);
  }
};
nhom("Tat ca cac thang", () => true);
nhom("VN-Index cach dinh 252 phien < -15%", (i0) => vni[i0].c / dinh252(i0) - 1 < -0.15);
nhom("VN-Index cach dinh -15% .. -5%", (i0) => { const d = vni[i0].c / dinh252(i0) - 1; return d >= -0.15 && d < -0.05; });
nhom("VN-Index cach dinh > -5% (gan dinh)", (i0) => vni[i0].c / dinh252(i0) - 1 >= -0.05);
nhom("Hoang loan (tam ly < 20 trong 10 phien)", hoangLoan);
nhom("Khong hoang loan", (i0) => !hoangLoan(i0));
// hien tai
let iGia = N - 1;
while (iGia > 0 && nen.FPT.at(-1).t < ngay[iGia]) iGia--;
console.log(`\nHien tai (${ngay[iGia]}): VN-Index cach dinh 252 phien ${f((vni[iGia].c / dinh252(iGia) - 1) * 100, 1)}%, tam ly ${tl.filter((x) => x != null).at(-1)}`);
const nay = pool(iGia, 2e13);
console.log("Ro tich san hom nay (von hoa >= 20.000 ty):", nay.map((x) => `${ma[x.j]}(PE ${f(x["PE (thap = re)"], 1)}, ${f((x["Gia / dinh 252 phien (thap = da giam sau)"] - 1) * 100, 0)}% so dinh)`).join(" "));
