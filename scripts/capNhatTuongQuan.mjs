// SINH lib/tuongQuanDuLieu.js + lib/tuongQuanMaTran.js: BETA, TUONG QUAN voi VN-Index, TUONG QUAN GIUA CAC MA va GIUA CAC NGANH, tu gia dong cua hang ngay (engine/output/nen_dai.json + vnindex_dai.json + nganh_map.json).
// Cua so 250 phien (1 nam) cho beta / tuong quan / bien dong; them beta 750 phien (3 nam, can >= 500 quan sat). Loi suat ngay don gian, cat o +-15% (gioi han gia UPCOM) de 1 diem loi du lieu khong lam lech ca ma.
//   BETA = cov(loi suat ma, loi suat VN-Index) / var(loi suat VN-Index); BETA GIAM = beta chi tinh cac ngay VN-Index giam; TUONG QUAN = he so Pearson cac ngay chung.
//   NGANH = loi suat ngay trung binh cong cac ma cung nganh (can >= 3 ma co gia ngay do). Ma tran giua cac ma: Pearson theo cap ngay chung (>= 150 ngay), luu int8 (x100) dang base64.
// Du lieu thay doi cham: chay lai sau moi vai tuan:   node scripts/capNhatTuongQuan.mjs
// Luu y: chi gom cac ma DANG niem yet (nen_dai) nen co thien lech nguoi song sot; beta la thong ke QUA KHU, khong chac con dung trong tuong lai.
import { readFileSync, writeFileSync } from "node:fs";
import { NGANH_NHAN } from "../lib/nganh.js";

const doc = (f) => JSON.parse(readFileSync(new URL(`../engine/output/${f}`, import.meta.url), "utf8"));
const nenDai = doc("nen_dai.json");
const vni = doc("vnindex_dai.json");
const nganhMap = doc("nganh_map.json");

const CUA_SO = 250, CUA_SO_DAI = 750, TOI_THIEU = 200, TOI_THIEU_DAI = 500, TOI_THIEU_CAP = 150, CAT = 0.15;
const r2 = (x) => (Number.isFinite(x) ? +x.toFixed(2) : null);
const tbc = (a) => a.reduce((s, x) => s + x, 0) / a.length;

// ngay cuoi chung = ngay moi nhat co gia cua cac ma (VN-Index co the moi hon vai ngay)
let ngayCuoi = "";
for (const bars of Object.values(nenDai)) if (bars.length && bars.at(-1).t > ngayCuoi) ngayCuoi = bars.at(-1).t;
const vniDen = vni.filter((b) => b.t <= ngayCuoi);
const dsNgay = vniDen.slice(-(CUA_SO_DAI + 1)).map((b) => b.t); // 751 ngay -> 750 loi suat
const chiSo = new Map(dsNgay.map((t, i) => [t, i]));
const rv = new Array(dsNgay.length).fill(null);
{
  const cv = new Map(vniDen.map((b) => [b.t, b.c]));
  for (let i = 1; i < dsNgay.length; i++) rv[i] = cv.get(dsNgay[i]) / cv.get(dsNgay[i - 1]) - 1;
}
const cat = (x) => Math.max(-CAT, Math.min(CAT, x));

// loi suat ngay theo ma (null khi thieu gia ngay do hoac ngay truoc do)
const LS = {};
for (const [ma, bars] of Object.entries(nenDai)) {
  const gia = new Map(bars.map((b) => [b.t, b.c]));
  const a = new Array(dsNgay.length).fill(null);
  for (let i = 1; i < dsNgay.length; i++) {
    const c1 = gia.get(dsNgay[i]), c0 = gia.get(dsNgay[i - 1]);
    if (c1 > 0 && c0 > 0) a[i] = cat(c1 / c0 - 1);
  }
  LS[ma] = a;
}

// THI TRUONG CHUNG (trung binh cong loi suat moi ma, can >= 50 ma): VN-Index bi Vingroup (VIC, VHM, VRE...) chi phoi nen beta so voi VN-Index cua da so ma < 1 (trung vi ~0,5); beta so voi thi truong chung (trung vi ~1) de hieu hon.
const rm = new Array(dsNgay.length).fill(null);
for (let i = 1; i < dsNgay.length; i++) { const v = Object.values(LS).map((a) => a[i]).filter((x) => x != null); if (v.length >= 50) rm[i] = v.reduce((q, x) => q + x, 0) / v.length; }

// thong ke 2 chuoi (null = bo) tren khoang [tu, den)
function thongKe(x, y, tu, den, loc = () => true) {
  let n = 0, sx = 0, sy = 0;
  for (let i = tu; i < den; i++) if (x[i] != null && y[i] != null && loc(i)) { n++; sx += x[i]; sy += y[i]; }
  if (n < 3) return null;
  const mx = sx / n, my = sy / n;
  let cxy = 0, vx = 0, vy = 0;
  for (let i = tu; i < den; i++) if (x[i] != null && y[i] != null && loc(i)) { const a = x[i] - mx, b = y[i] - my; cxy += a * b; vx += a * a; vy += b * b; }
  return { n, beta: vy > 0 ? cxy / vy : null, r: vx > 0 && vy > 0 ? cxy / Math.sqrt(vx * vy) : null, dx: Math.sqrt(vx / (n - 1)) };
}
const T1 = dsNgay.length - CUA_SO, T3 = 1, DEN = dsNgay.length; // 1 nam: 250 ngay cuoi; 3 nam: toan bo 750 ngay

// ---- tung ma
const ma = {};
for (const [k, a] of Object.entries(LS)) {
  const s1 = thongKe(a, rv, T1, DEN);
  if (!s1 || s1.n < TOI_THIEU) continue;
  const sg = thongKe(a, rv, T1, DEN, (i) => rv[i] < 0);
  const s3 = thongKe(a, rv, T3, DEN);
  const stt = thongKe(a, rm, T1, DEN);
  const g = nganhMap[k];
  ma[k] = { beta: r2(s1.beta), betaGiam: sg && sg.n >= 40 ? r2(sg.beta) : null, tq: r2(s1.r), vol: +(s1.dx * Math.sqrt(250) * 100).toFixed(1), beta3n: s3 && s3.n >= TOI_THIEU_DAI ? r2(s3.beta) : null, betaTT: stt ? r2(stt.beta) : null, tqTT: stt ? r2(stt.r) : null, nganh: NGANH_NHAN[g] && g !== "Khac" ? NGANH_NHAN[g] : null, n: s1.n };
}
const dsMa = Object.keys(ma).sort();

// ---- ma tran giua cac ma (Pearson cap ngay chung)
const N = dsMa.length;
const tran = new Int8Array(N * N);
const R = Array.from({ length: N }, () => new Array(N).fill(null));
for (let i = 0; i < N; i++) {
  for (let j = i; j < N; j++) {
    let v = null;
    if (i === j) v = 1;
    else { const s = thongKe(LS[dsMa[i]], LS[dsMa[j]], T1, DEN); if (s && s.n >= TOI_THIEU_CAP) v = s.r; }
    R[i][j] = R[j][i] = v;
    const q = v == null ? -128 : Math.round(v * 100);
    tran[i * N + j] = q; tran[j * N + i] = q;
  }
}
const peers = {};
dsMa.forEach((k, i) => {
  peers[k] = R[i].map((v, j) => [dsMa[j], v]).filter(([m2, v]) => m2 !== k && v != null).sort((p, q) => q[1] - p[1]).slice(0, 5).map(([m2, v]) => [m2, r2(v)]);
});

// ---- nganh: loi suat ngay trung binh cong (>= 3 ma)
const theoNganh = new Map();
for (const k of dsMa) { const g = nganhMap[k]; if (g && g !== "Khac" && NGANH_NHAN[g]) { if (!theoNganh.has(g)) theoNganh.set(g, []); theoNganh.get(g).push(k); } }
const nganhLS = {};
for (const [g, ds] of [...theoNganh].sort()) {
  const a = new Array(dsNgay.length).fill(null);
  for (let i = 1; i < dsNgay.length; i++) { const v = ds.map((k) => LS[k][i]).filter((x) => x != null); if (v.length >= 3) a[i] = tbc(v); }
  nganhLS[g] = a;
}
const dsNganh = Object.keys(nganhLS);
const nganh = dsNganh.map((g) => {
  const s = thongKe(nganhLS[g], rv, T1, DEN), sg = thongKe(nganhLS[g], rv, T1, DEN, (i) => rv[i] < 0);
  const top = [...theoNganh.get(g)].sort((p, q) => (ma[q].beta ?? 0) - (ma[p].beta ?? 0));
  return { ten: NGANH_NHAN[g], soMa: theoNganh.get(g).length, beta: r2(s.beta), betaGiam: sg ? r2(sg.beta) : null, tq: r2(s.r), vol: +(s.dx * Math.sqrt(250) * 100).toFixed(1), maBetaCao: top.slice(0, 3) };
});
const tranNganh = dsNganh.map((g1) => dsNganh.map((g2) => (g1 === g2 ? 1 : r2(thongKe(nganhLS[g1], nganhLS[g2], T1, DEN).r))));

// ---- phan bo beta (de giai thich "beta cao la gi")
const bs = dsMa.map((k) => ma[k].beta).filter((x) => x != null).sort((p, q) => p - q);
const phanVi = (p) => r2(bs[Math.min(bs.length - 1, Math.floor(p * bs.length))]);
const bt = dsMa.map((k) => ma[k].betaTT).filter((x) => x != null).sort((p, q) => p - q);
const pvTT = (p) => r2(bt[Math.min(bt.length - 1, Math.floor(p * bt.length))]);
const thongKeBeta = { trungVi: phanVi(0.5), p20: phanVi(0.2), p80: phanVi(0.8), tren1: bs.filter((x) => x > 1).length, tong: bs.length, ttTrungVi: pvTT(0.5), ttP20: pvTT(0.2), ttP80: pvTT(0.8), ttTren12: bt.filter((x) => x > 1.2).length, ttDuoi08: bt.filter((x) => x < 0.8).length };

const du = {
  capNhat: ngayCuoi,
  soPhien: CUA_SO,
  thongKeBeta,
  ma: Object.fromEntries(dsMa.map((k) => [k, [ma[k].beta, ma[k].betaGiam, ma[k].tq, ma[k].vol, ma[k].beta3n, ma[k].nganh, ma[k].betaTT, ma[k].tqTT]])),
  nganh,
  tranNganh,
  peers,
};
writeFileSync(
  new URL("../lib/tuongQuanDuLieu.js", import.meta.url),
  `// DU LIEU BETA / TUONG QUAN (trang /tuong-quan) - SINH TU DONG bang scripts/capNhatTuongQuan.mjs, KHONG sua tay.\n// ma[k] = [beta 1 nam so voi VN-Index, beta cac ngay VN-Index giam, tuong quan voi VN-Index, bien dong nam %, beta 3 nam (null neu < 500 phien), nganh, beta so voi thi truong chung, tuong quan voi thi truong chung]. nganh: beta / tuong quan / bien dong cua ngay trung binh cac ma cung nganh; tranNganh theo cung thu tu.\nexport const TUONG_QUAN = ${JSON.stringify(du)};\n`
);
writeFileSync(
  new URL("../lib/tuongQuanMaTran.js", import.meta.url),
  `// MA TRAN TUONG QUAN GIUA CAC MA (int8 x100, -128 = thieu du lieu, hang x cot theo thu tu ds) - SINH TU DONG bang scripts/capNhatTuongQuan.mjs, KHONG sua tay. Chi tai khi nguoi dung mo cong cu chon ma (import dong).\nexport const MA_TRAN = ${JSON.stringify({ ds: dsMa, b64: Buffer.from(tran.buffer).toString("base64") })};\n`
);
console.log(`Xong: ${N} ma, ${dsNganh.length} nganh, den ${ngayCuoi}. Beta trung vi ${thongKeBeta.trungVi}, P20 ${thongKeBeta.p20}, P80 ${thongKeBeta.p80}, beta VNI>1: ${thongKeBeta.tren1} ma | beta thi truong chung: trung vi ${thongKeBeta.ttTrungVi}, P20 ${thongKeBeta.ttP20}, P80 ${thongKeBeta.ttP80}, >1,2: ${thongKeBeta.ttTren12} ma, <0,8: ${thongKeBeta.ttDuoi08} ma.`);
console.log("Nganh beta cao nhat:", [...nganh].sort((p, q) => q.beta - p.beta).slice(0, 4).map((g) => `${g.ten} ${g.beta}`).join(" | "));
console.log("Nganh beta thap nhat:", [...nganh].sort((p, q) => p.beta - q.beta).slice(0, 4).map((g) => `${g.ten} ${g.beta}`).join(" | "));
console.log("Ma beta cao nhat:", dsMa.sort((p, q) => ma[q].beta - ma[p].beta).slice(0, 8).map((k) => `${k} ${ma[k].beta}`).join(" "));
