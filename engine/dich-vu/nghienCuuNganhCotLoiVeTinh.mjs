// TEST BANG "NGANH CAU TRUC DAU TU DAI HAN" + MO HINH CORE & SATELLITE (Hieu 03/11/2026 dan bang: FPT; DGW MWG; POW PC1 REE; IDC KBC SZC; GMD HAH PVT; HPG;
// core 60-70% = Cong nghe (FPT) + Ngan hang, satellite 30-40% = Ban le (DGW MWG) hoac BDS khu cong nghiep).
// Danh sach ma do nguoi dung dua ra (CHON SAU, nhieu kha nang la ma da thang -> THIEN LECH NHIN LAI; chi test duoc "neu cam ro nay tu moc X thi sao", khong chung minh viec CHON ma la dung).
// Gia: nen_dai.json (gia dieu chinh), cam tu cuoi nam moc 2015..2025 den phien moi nhat, chi ma da niem yet (>= 250 phien) tai moc bat dau (chia deu, ma len san sau thi bo). Phi 0,2%/chieu cho phan can bang lai.
//   CORE = 20% FPT + 45% ngan hang (VCB BID CTG TCB MBB ACB VPB chia deu) = 65%;  SAT = 35% chia deu DGW MWG IDC KBC SZC (ban le + BDS KCN).
//   C&S nam = nhu tren, can bang lai ve ty trong moi 252 phien;  C&S giu = khong can bang lai.   TOAN BO = chia deu ca 17 ma trong bang (khong gom ngan hang).  VN-Index = doi chung.
// Them: kiem tra "luan diem tang truong" (LN TTM so voi nam truoc, tu BCTC 2021-09).
// Chay: node engine/dich-vu/nghienCuuNganhCotLoiVeTinh.mjs
import { docJson, tb, f } from "./backtestChung.mjs";

const nen = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const bctc = docJson("bctc_dai.json");
const ngay = vni.map((b) => b.t);
const N = ngay.length;
const idx = new Map(ngay.map((t, i) => [t, i]));
let iG = N - 1; while (iG > 0 && nen.FPT.at(-1).t < ngay[iG]) iG--;
const gia = (k) => { if (!nen[k]) return null; const a = new Array(N).fill(null); for (const b of nen[k]) { const i = idx.get(b.t); if (i != null) a[i] = b.c; } let last = null; for (let i = 0; i < N; i++) { if (a[i] != null) last = a[i]; else a[i] = last; } return a; };
const G = {};
const NGANH = {
  "Cong nghe": ["FPT"],
  "Ban le + phan phoi": ["DGW", "MWG"],
  "Dien - nang luong": ["POW", "PC1", "REE"],
  "BDS khu cong nghiep": ["IDC", "KBC", "SZC"],
  "Van tai bien + logistics": ["GMD", "HAH", "PVT"],
  "Thep": ["HPG"],
  "Ngan hang (7 ma lon)": ["VCB", "BID", "CTG", "TCB", "MBB", "ACB", "VPB"],
};
for (const ks of Object.values(NGANH)) for (const k of ks) G[k] = gia(k);
const tatCaBang = ["FPT", "DGW", "MWG", "POW", "PC1", "REE", "IDC", "KBC", "SZC", "GMD", "HAH", "PVT", "HPG"];
const BANK = NGANH["Ngan hang (7 ma lon)"];
const CAU_HINH = {
  "C&S nam (65% core / 35% sat), can bang lai": { w: { FPT: 0.2, ...Object.fromEntries(BANK.map((k) => [k, 0.45 / BANK.length])), ...Object.fromEntries(["DGW", "MWG", "IDC", "KBC", "SZC"].map((k) => [k, 0.35 / 5])) }, rebal: true },
  "C&S giu (khong can bang lai)": { w: null, rebal: false, tuyChon: "C&S nam (65% core / 35% sat), can bang lai" },
  "CORE rieng (FPT 30% + ngan hang 70%)": { w: { FPT: 0.3, ...Object.fromEntries(BANK.map((k) => [k, 0.7 / BANK.length])) }, rebal: true },
  "SAT rieng (DGW MWG IDC KBC SZC)": { w: Object.fromEntries(["DGW", "MWG", "IDC", "KBC", "SZC"].map((k) => [k, 0.2])), rebal: true },
  "TOAN BO 13 ma trong bang (khong NH), chia deu": { w: Object.fromEntries(tatCaBang.map((k) => [k, 1 / tatCaBang.length])), rebal: true },
};
for (const [ten, ks] of Object.entries(NGANH)) CAU_HINH[`Nganh: ${ten}`] = { w: Object.fromEntries(ks.map((k) => [k, 1 / ks.length])), rebal: true };

// mo phong: w (ty trong muc tieu), tu iBD den iKT; tra { cagr, sut, nam: loi suat theo nam lich }
function mo(cfg, iBD, iKT) {
  const co = Object.keys(cfg.w).filter((k) => G[k] && G[k][iBD] != null && G[k][iBD - 250] != null);
  if (!co.length) return null;
  const tong = co.reduce((s, k) => s + cfg.w[k], 0);
  const muc = Object.fromEntries(co.map((k) => [k, cfg.w[k] / tong]));
  let gtri = Object.fromEntries(co.map((k) => [k, muc[k]]));
  let v = 1, dinh = 1, sut = 0;
  const curve = [1];
  for (let i = iBD + 1; i <= iKT; i++) {
    for (const k of co) if (G[k][i] != null && G[k][i - 1] != null) gtri[k] *= G[k][i] / G[k][i - 1];
    v = co.reduce((s, k) => s + gtri[k], 0);
    if (cfg.rebal && (i - iBD) % 252 === 0 && i < iKT) {
      const turnover = co.reduce((s, k) => s + Math.abs(gtri[k] / v - muc[k]), 0) / 2;
      v *= 1 - 0.004 * turnover;
      gtri = Object.fromEntries(co.map((k) => [k, v * muc[k]]));
    }
    dinh = Math.max(dinh, v); sut = Math.min(sut, v / dinh - 1);
    curve.push(v);
  }
  const nam = (iKT - iBD) / 252;
  return { cagr: (Math.pow(v, 1 / nam) - 1) * 100, sut: sut * 100, v, soMa: co.length, nam };
}
const iNam = (y) => { let i = -1; for (let k = 0; k < N; k++) if (ngay[k].startsWith(String(y)) && ngay[k + 1]?.startsWith(String(y + 1))) i = k; return i; }; // phien cuoi nam y
const MOC = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map((y) => ({ y, i: iNam(y) })).filter((m) => m.i > 260);
const vniCfg = (iBD, iKT) => { const v = vni[iKT].c / vni[iBD].c, nam = (iKT - iBD) / 252; return { cagr: (Math.pow(v, 1 / nam) - 1) * 100, sut: (() => { let d = iBD, pk = 0, m = 0; for (let i = iBD; i <= iKT; i++) { pk = Math.max(pk, vni[i].c); m = Math.min(m, vni[i].c / pk - 1); } return m * 100; })() }; };

console.log(`Cam tu cuoi nam moc den ${ngay[iG]} (CAGR %/nam, [sut toi da %]; so ma co du lieu tai moc)`);
const tens = Object.keys(CAU_HINH).filter((t) => !t.startsWith("Nganh:"));
console.log("Moc".padEnd(7), tens.map((t) => t.split("(")[0].trim().slice(0, 14).padStart(15)).join(""), "VN-Index".padStart(14));
const tong = {};
for (const m of MOC) {
  const cols = tens.map((t) => {
    const c = CAU_HINH[t];
    const cf = c.w ? c : { ...CAU_HINH[c.tuyChon], rebal: false };
    const r = mo(cf, m.i, iG);
    (tong[t] ??= []).push({ y: m.y, ...(r ?? { cagr: NaN, sut: NaN }), v: vniCfg(m.i, iG) });
    return r ? `${f(r.cagr, 1)} [${f(r.sut, 0)}]`.padStart(15) : "-".padStart(15);
  });
  const v = vniCfg(m.i, iG);
  console.log(String(m.y).padEnd(7), cols.join(""), `${f(v.cagr, 1)} [${f(v.sut, 0)}]`.padStart(14));
}
console.log("\n--- TB cac moc: CAGR, so moc hon VN-Index, chenh CAGR TB so voi VN-Index, sut toi da TB ---");
for (const t of tens) {
  const a = tong[t].filter((x) => Number.isFinite(x.cagr));
  console.log(t.padEnd(52), "CAGR", f(tb(a.map((x) => x.cagr)), 1).padStart(5), "| hon VNI", `${a.filter((x) => x.cagr > x.v.cagr).length}/${a.length}`.padStart(6), "| chenh", f(tb(a.map((x) => x.cagr - x.v.cagr)), 1).padStart(5), "| sut TB", f(tb(a.map((x) => x.sut)), 0).padStart(4) + "% vs VNI", f(tb(a.map((x) => x.v.sut)), 0) + "%");
}
console.log("\n--- TUNG NGANH (chia deu, can bang lai nam; TB cac moc 2014..2025) ---");
for (const t of Object.keys(CAU_HINH).filter((t) => t.startsWith("Nganh:"))) {
  const a = MOC.map((m) => { const r = mo(CAU_HINH[t], m.i, iG); return r ? { ...r, v: vniCfg(m.i, iG) } : null; }).filter(Boolean);
  console.log(t.padEnd(36), "CAGR TB", f(tb(a.map((x) => x.cagr)), 1).padStart(5), "| hon VNI", `${a.filter((x) => x.cagr > x.v.cagr).length}/${a.length}`.padStart(6), "| sut TB", f(tb(a.map((x) => x.sut)), 0).padStart(4) + "%", "| tu 2022:", f(mo(CAU_HINH[t], iNam(2021), iG)?.cagr, 1) + "%/nam", "| tu cuoi 2025:", f((mo(CAU_HINH[t], iNam(2025), iG)?.v - 1) * 100, 0) + "%");
}
// loi suat theo nam lich cua C&S (can bang dau nam) vs VNI
console.log("\n--- Loi suat tung nam lich (C&S can bang lai ve ty trong DAU MOI NAM; ngan hang/FPT/sat rieng) ---");
const nam1 = (cfg, y) => { const a = iNam(y - 1), b = y === 2026 ? iG : iNam(y); return a > 260 ? mo({ ...cfg, rebal: false }, a, b) : null; };
console.log("Nam".padEnd(6), "C&S".padStart(7), "CORE".padStart(7), "SAT".padStart(7), "FPT".padStart(7), "NH 7".padStart(7), "VN-Index".padStart(9));
for (let y = 2016; y <= 2026; y++) {
  const a = iNam(y - 1), b = y === 2026 ? iG : iNam(y);
  const v = (vni[b].c / vni[a].c - 1) * 100;
  const cell = (t) => { const r = nam1(CAU_HINH[t], y); return r ? (f((r.v - 1) * 100, 0) + "%").padStart(7) : "-".padStart(7); };
  console.log(String(y).padEnd(6), cell("C&S nam (65% core / 35% sat), can bang lai"), cell("CORE rieng (FPT 30% + ngan hang 70%)"), cell("SAT rieng (DGW MWG IDC KBC SZC)"), cell("Nganh: Cong nghe"), cell("Nganh: Ngan hang (7 ma lon)"), (f(v, 0) + "%").padStart(9));
}

// ---------- luan diem tang truong: LN TTM CAGR tu BCTC ----------
console.log("\n--- Luan diem tang truong (BCTC): LNST TTM, nam gan nhat vs 2021-09 / 2022-09 (CAGR %), VCSH, ROE ---");
const qs = [...new Set(Object.values(bctc).flatMap((b) => Object.keys(b.q)))].sort();
const lui = (q, k) => qs[qs.indexOf(q) - k];
const ttm = (b, q, it) => { let s = 0; for (let k = 0; k < 4; k++) { const x = b.q[lui(q, k)]?.[it]; if (!Number.isFinite(x)) return NaN; s += x; } return s; };
const qCuoi = "2026-06-30"; // quy moi nhat co BCTC cua da so cac ma
for (const k of [...tatCaBang, ...BANK]) {
  const b = bctc[k]; if (!b) continue;
  const a1 = ttm(b, "2021-09-30", 23003), a2 = ttm(b, "2022-09-30", 23003), a3 = ttm(b, qCuoi, 23003);
  const g = (x, y, nm) => (x > 0 && y > 0 ? (Math.pow(y / x, 1 / nm) - 1) * 100 : NaN);
  const roe = a3 / ((b.q[qCuoi]?.[14000] ?? NaN) + (b.q[qCuoi]?.[15000] ?? 0)) * 100;
  console.log(k.padEnd(5), `LN TTM 2021-09 ${f(a1 / 1e9, 0).padStart(7)} ty | 2022-09 ${f(a2 / 1e9, 0).padStart(7)} ty | ${qCuoi} ${f(a3 / 1e9, 0).padStart(7)} ty | CAGR 2021.9-nay ${f(g(a1, a3, 4.75), 1).padStart(6)}%/nam | CAGR 2022.9-nay ${f(g(a2, a3, 3.75), 1).padStart(6)}%/nam | ROE ${f(roe, 1)}%`);
}
