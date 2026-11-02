// DINH GIA ROI CHI MUA DUOI MOC DINH GIA (Hieu 03/11/2026: "hay la minh lam dinh gia, xong mua duoi moc dinh gia").
// Moi cuoi thang, voi moi ma, tinh TY LE r = GIA / GIA TRI HOP LY (r < 1 = dang re hon moc dinh gia) theo 4 cach (chi dung bao cao co hieu luc quy + 50 ngay, khong nhin truoc):
//   M1 TU LICH SU : PE hien tai / trung vi PE cua CHINH MA do 36 thang truoc (can >= 12 quan sat)           -> gia hop ly = LN/CP x PE trung vi cua ma
//   M2 THEO NGANH : PE / trung vi PE cac ma thanh khoan cung nganh (>= 5 ma)                                  -> gia hop ly = LN/CP x PE trung vi nganh
//   M3 GRAHAM     : (PE x PB) / 22,5                                                                         -> gia hop ly = can(22,5 x LN/CP x VCSH/CP)
//   M4 PB HOP LY  : PB / ((ROE - 5) / 7)  (PB hop ly = (ROE - g) / (k - g), k = 12%, g = 5%; ROE TTM)          -> thuong hop cho ngan hang
// PE = von hoa / LN sau thue TTM, PB = von hoa / VCSH; von hoa = gia dieu chinh x so CP hien tai (xap xi). Chi gom ma DANG niem yet.
// PHAN A: r co du doan loi suat? Nhom r <= 0,8 (re ro) / 0,8-1,2 (hop ly) / > 1,2 (dat), trung binh loi suat 12T (va 24T) cua tung thang roi lay TB cac thang; tach NGAN HANG (NH/CK/BH) va khong phai ngan hang vi PE/PB thap cua NH mang tinh cau truc.
// PHAN B: "cho gia ve duoi moc roi moi mua" - cuoi thang t, ma nao co r <= 1,0 (hoac 0,8) trong vong 12 thang tiep theo thi mua o phien sau cuoi thang do (lan dau), chua co thi bo (tien mat) hoac mua tran o thang 12; do gia tri tai t + 24 thang; so voi mua ngay luc t.
// Hai ro: TICH SAN RONG (von hoa >= 5.000 ty, ROE >= 12%, LN tang >= 5%, an toan tai chinh) va CHAT LUONG RONG HON (LN > 0, ROE >= 12%, von hoa >= 2.000 ty). Cac moc thang chong lan nhau - t-stat in ra la "naive".
// Chay: node engine/dich-vu/nghienCuuDinhGiaMuaDuoiMoc.mjs
import { docJson, tb, f } from "./backtestChung.mjs";
import { SO_CP_LUU_HANH } from "../../lib/soCoPhieuLuuHanh.js";

const nen = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const bctc = docJson("bctc_dai.json");
const nganh = docJson("nganh_map.json");
const ngay = vni.map((b) => b.t);
const N = ngay.length;
const idx = new Map(ngay.map((t, i) => [t, i]));
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
  const ln0 = q4 ? ttm(b, q4, 23003) : NaN;
  const tang = Number.isFinite(ln0) && ln0 > 0 && ln > 0 ? ln / ln0 - 1 : Number.isFinite(lq) && Number.isFinite(lq0) && lq >= lq0 ? 0.05 : -1;
  const o = { ln, vcsh, roe: (ln / vcsh) * 100, donBay: no / vcsh, tang, cfo: ttm(b, q, 32000), tsnh: gtv(b, q, 11000), nnh: gtv(b, q, 13100), tc: b.loai !== "pi" };
  cacheCB.set(key, o);
  return o;
}
const tb20 = (j, i) => { let s = 0; for (let k = i - 19; k <= i; k++) s += G[j][k]; return s / 20; };
const thanhKhoan = (j, i) => C[j][i] != null && C[j][i - 130] != null && tb20(j, i) >= 5e6;
const vonHoa = (j, i) => C[j][i] * 1000 * SO_CP_LUU_HANH[ma[j]];
const cuoiThang = [];
for (let i = 0; i < N; i++) if (i === N - 1 || ngay[i].slice(0, 7) !== ngay[i + 1].slice(0, 7)) cuoiThang.push(i);
const viTri = new Map(cuoiThang.map((i, p) => [i, p]));
const R = cuoiThang.filter((i) => ngay[i] >= "2022-01-01" && i + 2 < N);
const cuoiGia = (i0, h) => { const p = viTri.get(i0) + h; return p < cuoiThang.length ? Math.min(N - 1, cuoiThang[p] + 1) : null; };
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN; };

// thong tin 1 ma tai 1 cuoi thang (null neu khong dung duoc)
const cacheInfo = new Map();
function info(j, i0) {
  const key = j * 100000 + i0;
  if (cacheInfo.has(key)) return cacheInfo.get(key);
  let o = null;
  const q = quyHieuLuc(ngay[i0]);
  if (q && thanhKhoan(j, i0)) {
    const cb = coBan(j, q), von = vonHoa(j, i0);
    if (cb.ln > 0 && cb.vcsh > 0) o = { j, von, pe: von / cb.ln, pb: von / cb.vcsh, roe: cb.roe, tang: cb.tang, donBay: cb.donBay, cfo: cb.cfo, tsnh: cb.tsnh, nnh: cb.nnh, tc: cb.tc, nganh: nganh[ma[j]] ?? "?" };
  }
  cacheInfo.set(key, o);
  return o;
}
const cacheNganh = new Map();
function peNganh(i0) {
  if (cacheNganh.has(i0)) return cacheNganh.get(i0);
  const g = new Map();
  for (let j = 0; j < M; j++) { const o = info(j, i0); if (o && o.pe > 0 && o.pe < 100) { const a = g.get(o.nganh) ?? []; a.push(o.pe); g.set(o.nganh, a); } }
  const m = new Map();
  for (const [k, a] of g) if (a.length >= 5) m.set(k, med(a));
  cacheNganh.set(i0, m);
  return m;
}
function tyLe(j, i0, cach) {
  const o = info(j, i0);
  if (!o) return null;
  if (cach === "M2") { const m = peNganh(i0).get(o.nganh); return m > 0 ? o.pe / m : null; }
  if (cach === "M3") return (o.pe * o.pb) / 22.5;
  if (cach === "M4") return o.roe > 5 ? o.pb / ((o.roe - 5) / 7) : null;
  if (cach === "M1") {
    const p0 = viTri.get(i0), a = [];
    for (let p = Math.max(0, p0 - 36); p < p0; p++) { const x = info(j, cuoiThang[p]); if (x && x.pe < 100) a.push(x.pe); }
    return a.length >= 12 ? o.pe / med(a) : null;
  }
  return null;
}
const CACH = [["M1", "M1 tu lich su PE cua chinh ma"], ["M2", "M2 theo PE trung vi nganh"], ["M3", "M3 Graham (PE x PB / 22,5)"], ["M4", "M4 PB hop ly theo ROE"]];

const RO = {
  "TICH SAN RONG (von hoa >= 5.000 ty + loc tich san)": (o) => o.von >= 5e12 && o.roe >= 12 && o.tang >= 0.05 && (o.tc || (o.cfo > 0 && o.donBay <= 2.5 && o.tsnh / o.nnh >= 1)),
  "CHAT LUONG RONG HON (LN > 0, ROE >= 12%, von hoa >= 2.000 ty)": (o) => o.von >= 2e12 && o.roe >= 12,
};

// =============== PHAN A ===============
for (const [tenRo, dk] of Object.entries(RO)) {
  console.log(`\n################ PHAN A - ${tenRo} ################`);
  for (const H of [12, 24]) {
    for (const [loai, nhan] of [["tat ca", () => true], ["KHONG ngan hang", (o) => !o.tc], ["CHI ngan hang/CK/BH", (o) => o.tc]]) {
      console.log(`\n--- Giu ${H} thang | ${loai} ---`);
      console.log("Cach dinh gia".padEnd(34), "r<=0,8 (re)".padStart(18), "0,8-1,2".padStart(14), "r>1,2 (dat)".padStart(14), " re - dat".padStart(10), "t(naive)".padStart(9), "so ma/thang (re)");
      for (const [c, ten] of CACH) {
        const bk = { re: [], giua: [], dat: [] }, chenh = [], soMaRe = [];
        for (const i0 of R) {
          const e = cuoiGia(i0, H);
          if (e == null || e <= i0 + 1) continue;
          const g = { re: [], giua: [], dat: [] };
          for (let j = 0; j < M; j++) {
            const o = info(j, i0);
            if (!o || !dk(o) || !nhan(o)) continue;
            const r = tyLe(j, i0, c);
            if (r == null || !Number.isFinite(r)) continue;
            const x = C[j][e] / C[j][i0 + 1] - 1;
            (r <= 0.8 ? g.re : r <= 1.2 ? g.giua : g.dat).push(x);
          }
          for (const k of ["re", "giua", "dat"]) if (g[k].length >= 3) bk[k].push(tb(g[k]) * 100);
          if (g.re.length >= 3 && g.dat.length >= 3) { chenh.push((tb(g.re) - tb(g.dat)) * 100); soMaRe.push(g.re.length); }
        }
        const sd = (a) => { const m = tb(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
        const t = chenh.length > 2 && sd(chenh) > 0 ? tb(chenh) / (sd(chenh) / Math.sqrt(chenh.length)) : NaN;
        const cell = (a) => (a.length ? `${f(tb(a), 1)}% (${a.length}t)` : "-");
        console.log(ten.padEnd(34), cell(bk.re).padStart(18), cell(bk.giua).padStart(14), cell(bk.dat).padStart(14), (chenh.length ? f(tb(chenh), 1) : "-").padStart(10), f(t, 2).padStart(9), chenh.length ? f(tb(soMaRe), 1) : "-");
      }
    }
  }
}

// =============== PHAN B ===============
console.log("\n\n################ PHAN B - CHO GIA VE DUOI MOC DINH GIA ROI MOI MUA (ro TICH SAN RONG), giu den t + 24 thang, cho toi da 12 thang ################");
console.log("Gia tri cuoi / von, moi ma 1 don vi von; mua ngay = mua o phien sau cuoi thang t. 'bo' = khong mua neu 12 thang khong ve duoi moc (tien mat 0%); 'tran' = het 12 thang thi mua theo thi truong.");
const dkRo = RO["TICH SAN RONG (von hoa >= 5.000 ty + loc tich san)"];
for (const [loai, nhan] of [["tat ca", () => true], ["KHONG ngan hang", (o) => !o.tc]]) {
  console.log(`\n--- ${loai} ---`);
  console.log("Cach / moc".padEnd(40), "mua ngay x".padStart(11), "bo: x".padStart(8), "tran: x".padStart(9), "khop%".padStart(7), "ngay doi cho TB (thang)".padStart(24), "| lai ma khop: ngay -> cho");
  for (const [c, ten] of CACH) {
    for (const theta of [1.0, 0.8]) {
      const ngayA = [], boA = [], tranA = [];
      let tong = 0, khop = 0; const doi = [], kN = [], kC = [];
      for (const i0 of R) {
        const p0 = viTri.get(i0);
        if (p0 + 24 >= cuoiThang.length) continue;
        const e = cuoiGia(i0, 24);
        const ax = [], ab = [], at = [];
        for (let j = 0; j < M; j++) {
          const o = info(j, i0);
          if (!o || !dkRo(o) || !nhan(o)) continue;
          const now = C[j][e] / C[j][i0 + 1];
          let mua = null, u0 = null;
          for (let h = 0; h <= 12; h++) { const u = cuoiThang[p0 + h]; const r = tyLe(j, u, c); if (r != null && Number.isFinite(r) && r <= theta) { mua = C[j][u + 1]; u0 = h; break; } }
          if (tyLe(j, i0, c) == null) continue;
          tong++;
          ax.push(now);
          if (mua != null) { khop++; doi.push(u0); ab.push(C[j][e] / mua); at.push(C[j][e] / mua); kN.push(now); kC.push(C[j][e] / mua); }
          else { ab.push(1); at.push(C[j][e] / C[j][cuoiThang[p0 + 12] + 1]); }
        }
        if (ax.length >= 3) { ngayA.push(tb(ax)); boA.push(tb(ab)); tranA.push(tb(at)); }
      }
      if (!ngayA.length) { console.log(`${ten} (r <= ${theta})`.padEnd(40), "khong du du lieu"); continue; }
      console.log(`${ten} (r <= ${f(theta, 1)})`.padEnd(40), f(tb(ngayA), 3).padStart(11), f(tb(boA), 3).padStart(8), f(tb(tranA), 3).padStart(9), `${f((khop / Math.max(1, tong)) * 100, 0)}%`.padStart(7), f(tb(doi), 1).padStart(24), `| ${f((tb(kN) - 1) * 100, 1)}% -> ${f((tb(kC) - 1) * 100, 1)}%`);
    }
  }
}
