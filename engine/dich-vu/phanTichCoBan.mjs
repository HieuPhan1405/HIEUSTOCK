// PHAN TICH CO BAN TUNG MA THEO QUY: diem Z (Altman), diem F (Piotroski), DuPont - tu engine/output/bctc.json (taiBaoCaoTaiChinh.mjs) -> engine/output/phan_tich_co_ban.json
// Moi chi so tinh tren 4 QUY GAN NHAT (TTM) tai cuoi quy t; so sanh voi TTM cung ky nam truoc (t-4 quy) cho diem F va DuPont.
//   Z2 (Altman 1995, thi truong moi noi, KHONG can gia thi truong): 6,56*X1 + 3,26*X2 + 6,72*X3 + 1,05*X4 + 3,25 ; X1=(TSNH-NoNH)/TS, X2=LNST chua PP/TS, X3=EBIT(TTM)/TS, X4=Von CSH/Tong no. >5,85 an toan, 4,15-5,85 xam, <4,15 nguy co.
//   Z goc (co gia thi truong): 1,2*X1 + 1,4*X2 + 3,3*X3 + 0,6*VonHoa/TongNo + 1,0*DTThuan(TTM)/TS : >2,99 an toan, 1,81-2,99 xam, <1,81 nguy co. Gia = dong cua cuoi quy (gia dieu chinh) x so CP luu hanh.
//   F (Piotroski 9 diem): ROA>0, CFO>0, ROA tang, CFO>LNST, don bay (No/TS) giam, tyle thanh toan hien hanh tang, khong phat hanh them CP, bien LN gop tang, vong quay TS tang (tat ca so voi cung ky nam truoc).
//   DuPont: ROE = Bien LNST x Vong quay TS x Don bay von (TTM); 5 buoc: ganh nang thue x gan nang lai vay x bien EBIT x vong quay x don bay.
// Z va F CHI hop le voi doanh nghiep phi tai chinh. Ngan hang / chung khoan / bao hiem: chi DuPont + "diem sinh loi" 0-5 (ROA>0, ROA tang, ROE>=10%, LNST TTM tang, khong phat hanh them CP).
// Chay: node engine/dich-vu/phanTichCoBan.mjs
import { readFileSync, writeFileSync } from "node:fs";

const doc = (f) => JSON.parse(readFileSync(new URL(`../output/${f}`, import.meta.url), "utf8"));
const bctc = doc("bctc.json");
const nganh = doc("nganh_map.json");
const nen = doc("nen_dai.json");
const sh = doc("free_float.json");
const QUY_2026 = ["2025-12-31", "2026-03-31", "2026-06-30", "2026-09-30"];
const dsQuy = [...new Set(Object.values(bctc).flatMap((x) => Object.keys(x.q)))].sort();
const lui = (q, k) => dsQuy[dsQuy.indexOf(q) - k];

const v = (b, q, it) => b.q[q]?.[it];
const ttm = (b, q, it) => {
  let s = 0;
  for (let k = 0; k < 4; k++) {
    const x = v(b, lui(q, k), it);
    if (!Number.isFinite(x)) return NaN;
    s += x;
  }
  return s;
};
const coPhieu = (ma, q) => {
  let kq = null;
  for (const x of sh[ma] ?? []) {
    if (x.d <= q) kq = x;
    else break;
  }
  return kq && Number(kq.sh) > 0 ? Number(kq.sh) : NaN;
};
const giaCuoiQuy = (ma, q) => {
  const ds = nen[ma];
  if (!ds) return NaN;
  let g = NaN;
  for (const x of ds) {
    if (x.t <= q) g = x.c;
    else break;
  }
  return g * 1000;
};
const r = (x, d = 2) => (Number.isFinite(x) ? +x.toFixed(d) : null);
const maDT = (b) => (b.loai === "nh" ? 421701 : b.loai === "ck" ? 21000 : 21001);

// chi so goc tai quy q (TTM + bang can doi)
function goc(b, q) {
  const TS = v(b, q, 12700);
  const VCSH = (v(b, q, 14000) ?? NaN) + (v(b, q, 15000) ?? 0);
  const No = Number.isFinite(v(b, q, 13000)) ? v(b, q, 13000) : TS - VCSH;
  const LNTT = ttm(b, q, 23800);
  const Lai = ttm(b, q, 22510);
  return {
    TS, VCSH, No, TSNH: v(b, q, 11000), NoNH: v(b, q, 13100),
    DT: ttm(b, q, maDT(b)), LNST: ttm(b, q, 23003), LNTT, EBIT: LNTT + (Number.isFinite(Lai) ? Lai : 0),
    LNgop: ttm(b, q, 23100), CFO: ttm(b, q, 32000), RE: v(b, q, 14200),
  };
}
function duPont(g) {
  return {
    roe: r((g.LNST / g.VCSH) * 100, 1), bienLN: r((g.LNST / g.DT) * 100, 1), vongQuay: r(g.DT / g.TS, 2), donBay: r(g.TS / g.VCSH, 2),
    gachThue: r(g.LNST / g.LNTT, 2), gachLai: r(g.LNTT / g.EBIT, 2), bienEBIT: r((g.EBIT / g.DT) * 100, 1), roa: r((g.LNST / g.TS) * 100, 2),
  };
}
// nhan to lam ROE thay doi nhieu nhat so voi cung ky nam truoc (theo log)
function nhanToChuDao(g, g0) {
  if (!(g.LNST > 0 && g0.LNST > 0 && g.DT > 0 && g0.DT > 0)) return null;
  const t = [["biên LN", g.LNST / g.DT, g0.LNST / g0.DT], ["vòng quay TS", g.DT / g.TS, g0.DT / g0.TS], ["đòn bẩy", g.TS / g.VCSH, g0.TS / g0.VCSH]];
  let best = null;
  for (const [ten, a, b0] of t) {
    const d = Math.log(a / b0);
    if (Number.isFinite(d) && (!best || Math.abs(d) > Math.abs(best.d))) best = { ten, d };
  }
  return best && Math.abs(best.d) > 0.03 ? `${best.ten} ${best.d > 0 ? "tăng" : "giảm"}` : null;
}

const kq = {};
for (const [ma, b] of Object.entries(bctc)) {
  const out = { nganh: nganh[ma], loai: b.loai, q: {} };
  for (const q of QUY_2026) {
    if (!b.q[q] || !lui(q, 7) || !b.q[lui(q, 7)]) continue; // can du 8 quy de co TTM va TTM nam truoc
    const q0 = lui(q, 4);
    const g = goc(b, q);
    const g0 = goc(b, q0);
    if (![g.TS, g.VCSH, g.DT, g.LNST, g0.TS, g0.VCSH, g0.DT, g0.LNST].every(Number.isFinite) || g.VCSH <= 0 || g.TS <= 0) continue;
    const cp = coPhieu(ma, q);
    const cp0 = coPhieu(ma, q0);
    const roa = g.LNST / g.TS;
    const roa0 = g0.LNST / g0.TS;
    const dt = v(b, q, maDT(b)), dtCu = v(b, q0, maDT(b)), ln = v(b, q, 23003), lnCu = v(b, q0, 23003);
    const mot = {
      dtQuyYoY: Number.isFinite(dt) && dtCu > 0 ? r((dt / dtCu - 1) * 100, 0) : null,
      lnQuy: Number.isFinite(ln) ? r(ln / 1e9, 0) : null,
      lnQuyYoY: lnCu > 0 && Number.isFinite(ln) ? r((ln / lnCu - 1) * 100, 0) : null,
      lnTTMYoY: g0.LNST > 0 ? r((g.LNST / g0.LNST - 1) * 100, 0) : null,
      ...duPont(g),
      roe0: duPont(g0).roe,
      chuDao: nhanToChuDao(g, g0),
    };
    const khongPhatHanh = Number.isFinite(cp) && Number.isFinite(cp0) ? cp <= cp0 * 1.005 : null;
    if (b.loai === "pi") {
      const X1 = (g.TSNH - g.NoNH) / g.TS, X2 = g.RE / g.TS, X3 = g.EBIT / g.TS, X4 = g.VCSH / g.No;
      const z2 = 6.56 * X1 + 3.26 * X2 + 6.72 * X3 + 1.05 * X4 + 3.25;
      const von = giaCuoiQuy(ma, q) * cp;
      const zG = 1.2 * X1 + 1.4 * X2 + 3.3 * X3 + 0.6 * (von / g.No) + 1.0 * (g.DT / g.TS);
      const F = [
        ["ROA > 0", roa > 0],
        ["CFO > 0", g.CFO > 0],
        ["ROA tăng", roa > roa0],
        ["CFO > LNST", g.CFO > g.LNST],
        ["Đòn bẩy giảm", g.No / g.TS < g0.No / g0.TS],
        ["Thanh toán hiện hành tăng", g.TSNH / g.NoNH > g0.TSNH / g0.NoNH],
        ["Không phát hành thêm CP", khongPhatHanh],
        ["Biên LN gộp tăng", g.LNgop / g.DT > g0.LNgop / g0.DT],
        ["Vòng quay TS tăng", g.DT / g.TS > g0.DT / g0.TS],
      ];
      mot.z2 = r(z2, 2);
      mot.vungZ2 = z2 > 5.85 ? "an toàn" : z2 >= 4.15 ? "xám" : "nguy cơ";
      mot.z = Number.isFinite(zG) ? r(zG, 2) : null;
      mot.vungZ = !Number.isFinite(zG) ? null : zG > 2.99 ? "an toàn" : zG >= 1.81 ? "xám" : "nguy cơ";
      mot.f = F.filter((x) => x[1] === true).length;
      mot.fThieu = F.filter((x) => x[1] === null).length;
      mot.fChiTiet = F;
      mot.x = { x1: r(X1, 2), x2: r(X2, 2), x3: r(X3, 2), x4: r(X4, 2) };
      mot.cfoLNST = g.LNST > 0 ? r(g.CFO / g.LNST, 2) : null;
    } else {
      mot.sinhLoi = [roa > 0, roa > roa0, g.LNST / g.VCSH >= 0.1, g.LNST > g0.LNST, khongPhatHanh].filter((x) => x === true).length;
    }
    out.q[q] = mot;
  }
  kq[ma] = out;
}
writeFileSync(new URL("../output/phan_tich_co_ban.json", import.meta.url), JSON.stringify(kq));
const dem = {};
for (const o of Object.values(kq)) for (const q of Object.keys(o.q)) dem[q] = (dem[q] ?? 0) + 1;
console.log("so ma co du lieu theo quy:", dem);
const hai = Object.values(kq).filter((o) => o.loai === "pi" && o.q["2026-06-30"]);
const phanBo = (f) => {
  const m = {};
  for (const o of hai) { const k = f(o.q["2026-06-30"]); m[k] = (m[k] ?? 0) + 1; }
  return m;
};
console.log("Q2/2026 phi tai chinh:", hai.length, "ma | vung Z2:", phanBo((x) => x.vungZ2), "| vung Z goc:", phanBo((x) => x.vungZ), "| diem F:", Object.fromEntries(Object.entries(phanBo((x) => x.f)).sort()));
