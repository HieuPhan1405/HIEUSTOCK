// PHAN TICH RUI RO DANH MUC tu lich su gia (trang /danh-gia-danh-muc) - ham THUAN, test tay: engine/test/ruiRoDanhMuc.test.mjs.
// Dau vao: chuoi gia dong cua da canh theo lich phien VN-Index (cung do dai, null truoc ngay co gia), gia tri tung vi the (dong), GTGD binh quan 20 phien (dong/phien).
// Tinh: bien dong nam, beta, tuong quan, dong gop rui ro (risk contribution), he so da dang hoa (DR) va "so cuoc doc lap" ~ DR^2 (Choueifaty), sut giam toi da,
// VaR / CVaR 95% 1 phien (lich su), kich ban soc (theo beta + dot giam manh nhat cua VN-Index trong cua so), thanh khoan (so phien de ban het), ty trong can bang bien dong.
// Tat ca dua tren 1 nam du lieu QUA KHU voi TY TRONG HIEN TAI giu nguyen - khong phai du bao. Nguong cham diem la cach cham tu dat cua web.
// NANG CAP 04/11/2026 (kiem chung engine/dich-vu/nghienCuuDanhGiaDanhMucNangCao.mjs: 8.640 danh muc mo phong 3-10 ma, 2014-2026, ket qua 63 / 126 phien sau):
//   - BIEN DONG DU BAO = 1/2 do lech chuan 1 nam + 1/2 EWMA 0,97 (RiskMetrics): sai so du bao 63 phien toi nho hon mau 1 nam (RMSE log 0,327 vs 0,339, tuong quan hang 0,52 vs 0,47).
//   - VaR 95% = 1,645 x bien dong ngay du bao (VaR lich su 1 nam bi vuot 6,1% so phien thay vi 5%; cach chuan ~5,5%).
//   - DU BAO SUT GIAM 6 THANG: bang tra cuu theo bien dong du bao (DU_BAO_SUT_GIAM). Bien dong du bao la so do bao truoc sut giam manh nhat, ke ca trong cung 1 ngay.
//   - TY TRONG TOI UU: bien dong nho nhat tren ma tran hiep phuong sai co ve Ledoit-Wolf, tran moi ma = tran phong cach - tren CUNG cac ma, sut giam 6 thang TB 18,1-18,4% vs 21,2%
//     cua ty trong tuy y, loi nhuan khong thap hon, tot hon o ~73% truong hop (toiUuTyTrong).
//   - KHUNG HOANG THAT: danh muc hien tai qua 6 dot giam manh cua VN-Index 2015-2026 bang gia that tung ma (lib/kichBanKhungHoangDuLieu.js).
//   - DIEM: tru Da dang / Rui ro cham LIEN TUC; trong so moi o lib/phongCachDauTu.js (tuong quan voi sut giam 6 thang sau tang 0,28 -> 0,41 tren 2020-2026, chon tren 2014-2019).
import { DOT_KHUNG_HOANG, KHUNG_HOANG_THEO_MA } from "./kichBanKhungHoangDuLieu.js";

export const PHIEN_NAM = 250;
const LAMBDA_EWMA = 0.97;
const LAI_PHI_RUI_RO = 0.05; // %/nam ~ lai tien gui, dung cho Sharpe / Sortino
// bien dong du bao nam (%) -> sut giam toi da 126 phien sau (%, so duong): trung vi / 80% / 95% truong hop khong te hon; loi nhuan 6 thang 10% / 50% / 90%.
// Tu 8.640 danh muc mo phong 2014-2026 (nghienCuuDanhGiaDanhMucNangCao.mjs muc E); cot sut giam da lam don dieu (khong thap hon nhom bien dong thap hon).
export const DU_BAO_SUT_GIAM = [
  { den: 22, trungVi: 16.0, p80: 26.5, p95: 36.9, lai10: -17.6, lai50: 1.1, lai90: 26.6 },
  { den: 26, trungVi: 16.8, p80: 26.5, p95: 36.9, lai10: -18.1, lai50: 0.2, lai90: 32.8 },
  { den: 30, trungVi: 18.8, p80: 27.0, p95: 37.3, lai10: -20.0, lai50: 0.7, lai90: 43.1 },
  { den: 35, trungVi: 21.2, p80: 31.2, p95: 43.4, lai10: -24.2, lai50: 2.0, lai90: 44.5 },
  { den: 42, trungVi: 23.2, p80: 37.1, p95: 51.5, lai10: -29.5, lai50: 1.6, lai90: 45.8 },
  { den: Infinity, trungVi: 24.0, p80: 46.5, p95: 60.6, lai10: -33.9, lai50: 10.7, lai90: 48.7 },
];
// volPct = bien dong du bao nam (%) cua phan co phieu; donBay = co phieu / tai san rong (margin -> sut giam tai san rong ~ x don bay)
export function duBaoSutGiam(volPct, donBay = 1) {
  if (!(volPct > 0)) return null;
  const d = DU_BAO_SUT_GIAM.find((x) => volPct < x.den);
  const k = donBay > 1 ? donBay : 1;
  return { ...d, nav: k > 1 ? { trungVi: Math.min(100, d.trungVi * k), p80: Math.min(100, d.p80 * k), p95: Math.min(100, d.p95 * k) } : null };
}
const SO_PHIEN_TOI_THIEU = 120; // ma co it hon chua dua vao tinh rui ro (moi niem yet / thieu du lieu)
const TY_LE_BAN_MOI_PHIEN = 0.2; // gia dinh ban toi da 20% GTGD binh quan moi phien de khong dap gia
const p1 = (x) => x.toFixed(1).replace(".", ",");
const p0 = (x) => x.toFixed(0);

// Canh 1 mang nen [{t, c}] theo mang ngay (tang dan): lay gia dong cua ngay do, ngay khong giao dich thi giu gia truoc (ffill); truoc nen dau tien = null.
export function canhTheoNgay(ngay, nen) {
  const m = new Map((nen || []).map((b) => [b.t, b.c]));
  let truoc = null;
  return ngay.map((t) => {
    const c = m.get(t);
    if (c > 0) truoc = c;
    return truoc;
  });
}

const tb = (a) => a.reduce((s, x) => s + x, 0) / a.length;
function cov(a, b, ma, mb) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb);
  return s / (a.length - 1);
}
// do lech chuan ngay EWMA (khoi tao bang 20 phien dau)
function ewmaSd(r, lam = LAMBDA_EWMA) {
  const k0 = Math.min(20, r.length);
  let v = r.slice(0, k0).reduce((s, x) => s + x * x, 0) / k0;
  for (let t = k0; t < r.length; t++) v = lam * v + (1 - lam) * r[t] * r[t];
  return Math.sqrt(v);
}
const duBaoSd = (r, sdMau) => (sdMau + ewmaSd(r)) / 2;

// MA TRAN HIEP PHUONG SAI CO VE (Ledoit & Wolf 2003, dich ve tuong quan khong doi): on dinh hon mau khi it phien / nhieu ma - dung cho toi uu ty trong.
export function covLedoitWolf(R) {
  const k = R.length;
  const T = R[0].length;
  const mu = R.map(tb);
  const X = R.map((r, i) => r.map((x) => x - mu[i]));
  const S = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => X[i].reduce((s, x, t) => s + x * X[j][t], 0) / T));
  const sd = S.map((r, i) => Math.sqrt(r[i]));
  let rb = 0;
  let dem = 0;
  for (let i = 0; i < k; i++)
    for (let j = i + 1; j < k; j++) {
      rb += sd[i] > 0 && sd[j] > 0 ? S[i][j] / (sd[i] * sd[j]) : 0;
      dem++;
    }
  rb = dem ? rb / dem : 0;
  const F = S.map((r, i) => r.map((x, j) => (i === j ? x : rb * sd[i] * sd[j])));
  let pi = 0;
  let rho = 0;
  let gam = 0;
  for (let i = 0; i < k; i++)
    for (let j = 0; j < k; j++) {
      let p = 0;
      for (let t = 0; t < T; t++) p += (X[i][t] * X[j][t] - S[i][j]) ** 2;
      p /= T;
      pi += p;
      gam += (F[i][j] - S[i][j]) ** 2;
      if (i === j) rho += p;
      else if (S[i][i] > 0 && S[j][j] > 0) {
        let a = 0;
        let b = 0;
        for (let t = 0; t < T; t++) {
          const xy = X[i][t] * X[j][t] - S[i][j];
          a += (X[i][t] ** 2 - S[i][i]) * xy;
          b += (X[j][t] ** 2 - S[j][j]) * xy;
        }
        rho += (rb / 2) * (Math.sqrt(S[j][j] / S[i][i]) * (a / T) + Math.sqrt(S[i][i] / S[j][j]) * (b / T));
      }
    }
  const d = gam > 0 ? Math.max(0, Math.min(1, (pi - rho) / gam / T)) : 1;
  return S.map((r, i) => r.map((x, j) => d * F[i][j] + (1 - d) * x));
}

// TY TRONG BIEN DONG NHO NHAT: khong ban khong, moi ma 0..tran, tong 1 (gradient chieu - du chinh xac cho <= 30 ma)
export function tyTrongBienDongNhoNhat(S, tran = 0.3) {
  const k = S.length;
  const cap = Math.max(tran, 1 / k + 1e-9);
  const chieu = (v) => {
    let lo = Math.min(...v) - cap - 1;
    let hi = Math.max(...v);
    for (let it = 0; it < 80; it++) {
      const m = (lo + hi) / 2;
      const s = v.reduce((a, x) => a + Math.min(cap, Math.max(0, x - m)), 0);
      if (s > 1) lo = m;
      else hi = m;
    }
    return v.map((x) => Math.min(cap, Math.max(0, x - (lo + hi) / 2)));
  };
  const vet = S.reduce((s, r, i) => s + r[i], 0);
  if (!(vet > 0)) return new Array(k).fill(1 / k);
  const buoc = 1 / vet; // <= 1 / tri rieng lon nhat -> hoi tu
  let w = new Array(k).fill(1 / k);
  for (let it = 0; it < 1500; it++) {
    const g = S.map((r) => r.reduce((s, x, j) => s + x * w[j], 0));
    w = chieu(w.map((x, i) => x - buoc * g[i]));
  }
  const s = w.reduce((a, x) => a + x, 0);
  return w.map((x) => x / s);
}
function sutGiamToiDa(chiSo) {
  let dinh = -Infinity;
  let dd = 0;
  let iDinh = 0;
  let tu = 0;
  let den = 0;
  chiSo.forEach((v, i) => {
    if (v > dinh) {
      dinh = v;
      iDinh = i;
    }
    const x = v / dinh - 1;
    if (x < dd) {
      dd = x;
      tu = iDinh;
      den = i;
    }
  });
  return { pct: dd * 100, tu, den };
}

// { ngay, vni, gia: {MA: [close|null]}, giaTri: {MA: dong}, gtgd: {MA: dong/phien}, tienMat, no, nguongCB, nguongGC }
export function phanTichRuiRo({ ngay = [], vni = [], gia = {}, giaTri = {}, gtgd = {}, tienMat = 0, no = 0, nguongCB = 35, nguongGC = 30 } = {}) {
  const n = ngay.length;
  const tongGT = Object.values(giaTri).reduce((s, v) => s + (v > 0 ? v : 0), 0);
  if (n < SO_PHIEN_TOI_THIEU + 1 || !(tongGT > 0)) return null;
  const dauTien = (a) => a.findIndex((x) => x > 0);
  const lichSuNgan = [];
  const dsMa = [];
  for (const [ma, gt] of Object.entries(giaTri)) {
    if (!(gt > 0)) continue;
    const a = gia[ma];
    const i0 = Array.isArray(a) && a.length === n ? dauTien(a) : -1;
    if (i0 < 0 || n - 1 - i0 < SO_PHIEN_TOI_THIEU) lichSuNgan.push(ma);
    else dsMa.push(ma);
  }
  if (!dsMa.length) return { lichSuNgan, dsMa: [] };
  const batDau = Math.max(dauTien(vni), ...dsMa.map((ma) => dauTien(gia[ma])));
  const L = n - 1 - batDau; // so loi suat
  const ls = (a) => {
    const r = [];
    for (let t = batDau + 1; t < n; t++) r.push(a[t] / a[t - 1] - 1);
    return r;
  };
  const R = dsMa.map((ma) => ls(gia[ma]));
  const rv = ls(vni);
  const gtCo = dsMa.reduce((s, ma) => s + giaTri[ma], 0);
  const w = dsMa.map((ma) => giaTri[ma] / gtCo);
  const mu = R.map(tb);
  const muV = tb(rv);
  const k = dsMa.length;
  const S = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => (j < i ? 0 : cov(R[i], R[j], mu[i], mu[j]))));
  for (let i = 0; i < k; i++) for (let j = 0; j < i; j++) S[i][j] = S[j][i];
  const varV = cov(rv, rv, muV, muV);
  const sd = S.map((row, i) => Math.sqrt(row[i]));
  const Sw = S.map((row) => row.reduce((s, x, j) => s + x * w[j], 0));
  const varP = w.reduce((s, wi, i) => s + wi * Sw[i], 0);
  const sdP = Math.sqrt(varP);
  const beta = R.map((r, i) => cov(r, rv, mu[i], muV) / varV);
  const betaP = w.reduce((s, wi, i) => s + wi * beta[i], 0);
  const rc = w.map((wi, i) => (varP > 0 ? (wi * Sw[i]) / varP : 0));
  const dr = sdP > 0 ? w.reduce((s, wi, i) => s + wi * sd[i], 0) / sdP : 1;
  const tq = S.map((row, i) => row.map((x, j) => (sd[i] > 0 && sd[j] > 0 ? x / (sd[i] * sd[j]) : 0)));
  let tongTQ = 0;
  let soCap = 0;
  for (let i = 0; i < k; i++)
    for (let j = i + 1; j < k; j++) {
      tongTQ += tq[i][j];
      soCap++;
    }

  // chuoi danh muc (ty trong co dinh) va VN-Index, chuan 100
  const rp = rv.map((_, t) => R.reduce((s, r, i) => s + w[i] * r[t], 0));
  // BIEN DONG DU BAO (1/2 mau 1 nam + 1/2 EWMA 0,97) - danh muc, VN-Index, tung ma
  const sdPf = duBaoSd(rp, sdP);
  const sdVf = duBaoSd(rv, Math.sqrt(varV));
  const sdF = R.map((r, i) => duBaoSd(r, sd[i]));
  const chiSoP = [100];
  const chiSoV = [100];
  for (let t = 0; t < L; t++) {
    chiSoP.push(chiSoP[t] * (1 + rp[t]));
    chiSoV.push(chiSoV[t] * (1 + rv[t]));
  }
  const ngayCs = ngay.slice(batDau);
  const ddP = sutGiamToiDa(chiSoP);
  const ddV = sutGiamToiDa(chiSoV);
  const sx = [...rp].sort((a, b) => a - b);
  const iq = Math.max(0, Math.floor(0.05 * L) - 1);
  const var95LichSu = -sx[iq];
  // VaR 95% theo bien dong du bao (VaR lich su 1 nam bao thieu); CVaR = binh quan 5% phien te nhat, khong thap hon muc chuan 2,063 x bien dong
  const var95 = 1.645 * sdPf;
  const cvar95 = Math.max(-tb(sx.slice(0, iq + 1)), 2.063 * sdPf);
  // hieu qua dieu chinh rui ro (1 nam qua, ty trong hien tai)
  const rfNgay = LAI_PHI_RUI_RO / PHIEN_NAM;
  const muP = tb(rp);
  const amP = rp.map((x) => Math.min(0, x - rfNgay));
  const sdAm = Math.sqrt(amP.reduce((s, x) => s + x * x, 0) / amP.length);
  const nam0 = Math.sqrt(PHIEN_NAM);
  const ngayTang = rv.map((x, t) => (x > 0 ? t : -1)).filter((t) => t >= 0);
  const ngayGiam = rv.map((x, t) => (x < 0 ? t : -1)).filter((t) => t >= 0);
  const batGiu = (ds) => (ds.length ? tb(ds.map((t) => rp[t])) / tb(ds.map((t) => rv[t])) : null);
  const hieuQua = {
    sharpe: sdP > 0 ? ((muP - rfNgay) * PHIEN_NAM) / (sdP * nam0) : null,
    sharpeVni: varV > 0 ? ((muV - rfNgay) * PHIEN_NAM) / (Math.sqrt(varV) * nam0) : null,
    sortino: sdAm > 0 ? ((muP - rfNgay) * PHIEN_NAM) / (sdAm * nam0) : null,
    batTang: batGiu(ngayTang), // TB lai danh muc / TB lai VN-Index trong cac phien VN-Index tang (1 = di cung)
    batGiam: batGiu(ngayGiam), // nhu tren cho phien giam (< 1 = giam it hon thi truong)
    alpha: (muP - betaP * muV) * PHIEN_NAM * 100, // %/nam phan lai khong giai thich bang beta
  };
  // dot giam manh nhat cua VN-Index trong 20 phien -> danh muc trong cung dot
  let xau = null;
  for (let t = 20; t <= L; t++) {
    const v = chiSoV[t] / chiSoV[t - 20] - 1;
    if (!xau || v < xau.vni) xau = { vni: v, port: chiSoP[t] / chiSoP[t - 20] - 1, tu: ngayCs[t - 20], den: ngayCs[t] };
  }
  const iNgayXauV = rv.indexOf(Math.min(...rv));
  const lai = (cs, m) => (cs.length > m ? (cs[cs.length - 1] / cs[cs.length - 1 - m] - 1) * 100 : null);

  // von & margin: soc theo beta va theo dot giam that
  const nav = tongGT + tienMat - no;
  const kichBan = (ten, portPct, vniPct, ghiChu) => {
    const doiGT = (tongGT * portPct) / 100;
    const ts = tienMat + tongGT + doiGT;
    const tyLe = no > 0 && ts > 0 ? ((ts - no) / ts) * 100 : null;
    return { ten, vniPct, portPct, doiGiaTri: doiGT, navPct: nav > 0 ? (doiGT / nav) * 100 : null, tyLeKyQuy: tyLe, chamCB: tyLe != null && tyLe <= nguongCB, chamGC: tyLe != null && tyLe <= nguongGC, ghiChu };
  };
  const soc = [-5, -10, -20].map((s) => kichBan(`VN-Index ${s}%`, betaP * s, s, `ước theo beta ${betaP.toFixed(2).replace(".", ",")}`));
  if (xau) soc.push(kichBan(`Lặp lại đợt giảm mạnh nhất 1 năm qua`, xau.port * 100, xau.vni * 100, `${xau.tu.slice(8, 10)}/${xau.tu.slice(5, 7)} – ${xau.den.slice(8, 10)}/${xau.den.slice(5, 7)}/${xau.den.slice(0, 4)}, giá thật của các mã`));
  // KHUNG HOANG THAT: gia that tung ma giua dinh va day cua VN-Index; ma chua niem yet luc do -> beta x VN-Index (ma thieu lich su: beta 1)
  const betaTheoMa = Object.fromEntries(dsMa.map((ma, i) => [ma, beta[i]]));
  const ngayVN = (t) => t.split("-").reverse().join("/");
  const khungHoang = DOT_KHUNG_HOANG.map((d, k) => {
    let pct = 0;
    const uoc = [];
    for (const [ma, gt] of Object.entries(giaTri)) {
      if (!(gt > 0)) continue;
      const that = KHUNG_HOANG_THEO_MA[ma]?.[k];
      const x = that ?? (betaTheoMa[ma] ?? 1) * d.vni;
      if (that == null) uoc.push(ma);
      pct += (gt / tongGT) * x;
    }
    return { ...kichBan(d.ten, pct, d.vni, `${ngayVN(d.tu)} – ${ngayVN(d.den)}${uoc.length ? ` · ${uoc.slice(0, 3).join(", ")}${uoc.length > 3 ? "…" : ""} chưa niêm yết, ước theo beta` : ""}`), id: d.id, soMaUoc: uoc.length };
  });

  // thanh khoan
  const thanhKhoan = Object.entries(giaTri)
    .filter(([, gt]) => gt > 0)
    .map(([ma, gt]) => ({ ma, soPhien: gtgd[ma] > 0 ? gt / (TY_LE_BAN_MOI_PHIEN * gtgd[ma]) : null }));
  const gt1Phien = thanhKhoan.filter((x) => x.soPhien != null && x.soPhien <= 1).reduce((s, x) => s + giaTri[x.ma], 0);
  const coTK = thanhKhoan.filter((x) => x.soPhien != null);

  const nam = Math.sqrt(PHIEN_NAM);
  const volP = sdPf * nam * 100;
  return {
    dsMa, lichSuNgan, soPhien: L, tuNgay: ngayCs[0], denNgay: ngayCs[L], phuGiaTri: gtCo / tongGT,
    ma: dsMa.map((ma, i) => ({ ma, w: w[i], vol: sdF[i] * nam * 100, beta: beta[i], tqVni: sd[i] > 0 ? cov(R[i], rv, mu[i], muV) / (sd[i] * Math.sqrt(varV)) : 0, rc: rc[i], lai1Nam: (gia[ma][n - 1] / gia[ma][batDau] - 1) * 100 })),
    tuongQuan: tq, tqTrungBinh: soCap ? tongTQ / soCap : null,
    // volP / volV = bien dong DU BAO (nam, %); volP1Nam / volV1Nam = do lech chuan 1 nam qua
    volP, volV: sdVf * nam * 100, volP1Nam: sdP * nam * 100, volV1Nam: Math.sqrt(varV) * nam * 100, betaP, dr, soCuocDocLap: dr * dr,
    duBao: duBaoSutGiam(volP, nav > 0 ? tongGT / nav : 1),
    laiP: chiSoP[L] - 100, laiV: chiSoV[L] - 100, lai3ThangP: lai(chiSoP, 60), lai3ThangV: lai(chiSoV, 60), hieuQua,
    ddP: { pct: ddP.pct, tu: ngayCs[ddP.tu], den: ngayCs[ddP.den] }, ddV: ddV.pct,
    var95: var95 * 100, cvar95: cvar95 * 100, var95Dong: var95 * tongGT, var95LichSu: var95LichSu * 100, phienXauNhat: { pct: sx[0] * 100, ngay: ngayCs[rp.indexOf(sx[0]) + 1] },
    ngayXauNhatVni: { ngay: ngayCs[iNgayXauV + 1], vni: rv[iNgayXauV] * 100, port: rp[iNgayXauV] * 100 },
    chuoi: { ngay: ngayCs, danhMuc: chiSoP, vni: chiSoV }, kichBan: soc, khungHoang,
    thanhKhoan: { ds: thanhKhoan.sort((a, b) => (b.soPhien ?? 0) - (a.soPhien ?? 0)), tyLeBan1Phien: coTK.length ? gt1Phien / tongGT : null, lauNhat: coTK.length ? Math.max(...coTK.map((x) => x.soPhien)) : null },
    loiSuat: { R, rv }, // cho toiUuTyTrong
  };
}

// TY TRONG TOI UU THEO RUI RO tren CUNG cac ma dang cam (tru boQua - vd ma bi nhan "Thoat"): bien dong nho nhat, ma tran co ve Ledoit-Wolf, moi ma <= tran (tran phong cach).
// Kiem chung 2014-2026 (nghienCuuDanhGiaDanhMucNangCao.mjs muc D): so voi ty trong tuy y, sut giam 6 thang TB 18,1-18,4% vs 21,2%, loi nhuan 6,1% vs 5,5%, tot hon o ~73% truong hop.
// nguongDoi: chi goi y doi nhung ma lech >= 5 diem % (tranh mua ban vat, phi + thue ~0,4% / vong). Tra null khi < 2 ma.
export function toiUuTyTrong(rr, { tran = 0.3, boQua = [], nguongDoi = 0.05 } = {}) {
  if (!rr?.loiSuat || !rr.dsMa?.length) return null;
  const chiSo = rr.dsMa.map((ma, i) => i).filter((i) => !boQua.includes(rr.dsMa[i]));
  if (chiSo.length < 2) return null;
  const R = chiSo.map((i) => rr.loiSuat.R[i]);
  const ds = chiSo.map((i) => rr.dsMa[i]);
  const tong0 = chiSo.reduce((s, i) => s + rr.ma[i].w, 0);
  const w0 = chiSo.map((i) => rr.ma[i].w / tong0);
  const w1 = tyTrongBienDongNhoNhat(covLedoitWolf(R), tran);
  const mu = R.map(tb);
  const S = R.map((a, i) => R.map((b, j) => cov(a, b, mu[i], mu[j])));
  const sd = S.map((r, i) => Math.sqrt(r[i]));
  const do_ = (w) => {
    const v = w.reduce((s, wi, i) => s + wi * S[i].reduce((a, x, j) => a + x * w[j], 0), 0);
    const rp = R[0].map((_, t) => R.reduce((s, r, i) => s + w[i] * r[t], 0));
    const volP = duBaoSd(rp, Math.sqrt(v)) * Math.sqrt(PHIEN_NAM) * 100;
    const dr = v > 0 ? w.reduce((s, wi, i) => s + wi * sd[i], 0) / Math.sqrt(v) : 1;
    const rcMax = v > 0 ? Math.max(...w.map((wi, i) => (wi * S[i].reduce((a, x, j) => a + x * w[j], 0)) / v)) : null;
    return { volP, var95: (1.645 * volP) / Math.sqrt(PHIEN_NAM), soCuocDocLap: dr * dr, rcMax, duBao: duBaoSutGiam(volP), maxW: Math.max(...w) };
  };
  const ma = ds.map((m, i) => ({ ma: m, wHienTai: w0[i], wToiUu: w1[i], doi: w1[i] - w0[i], canDoi: Math.abs(w1[i] - w0[i]) >= nguongDoi }));
  return { ma: ma.sort((a, b) => b.wToiUu - a.wToiUu), truoc: do_(w0), sau: do_(w1), tran: Math.max(tran, 1 / ds.length), boQua: boQua.filter((m) => rr.dsMa.includes(m)), coThayDoi: ma.some((x) => x.canDoi) };
}

// RUI RO MO ("portfolio heat"): neu moi ma deu cham MOC THOAT gan nhat ben duoi gia hien tai thi mat bao nhieu so voi tai san rong.
// ds = [{ ma, gia, giaTri (dong), moc: [cac muc gia thoat ung vien, nghin dong] }]; moc >= gia = da cham (can xu ly ngay, khong tinh vao rui ro mo); khong co moc = khong ro.
// Quy tac pho bien cua nha giao dich chuyen nghiep: tong rui ro mo <= ~6-10% tai san rong (A. Elder) - KHONG phai ket qua backtest cua web.
export function tinhRuiRoMo(ds = [], nav = 0) {
  const hang = ds.map((x) => {
    const moc = (x.moc ?? []).filter((v) => Number(v) > 0);
    if (!(x.gia > 0) || !(x.giaTri > 0)) return null;
    if (!moc.length) return { ma: x.ma, trangThai: "khong_ro", giaTri: x.giaTri };
    if (moc.some((v) => v >= x.gia)) return { ma: x.ma, trangThai: "da_cham", giaTri: x.giaTri, moc: Math.max(...moc) };
    const m = Math.max(...moc);
    const cach = 1 - m / x.gia;
    return { ma: x.ma, trangThai: "mo", giaTri: x.giaTri, moc: m, cachPct: cach * 100, mat: x.giaTri * cach, navPct: nav > 0 ? ((x.giaTri * cach) / nav) * 100 : null };
  }).filter(Boolean);
  const mo = hang.filter((h) => h.trangThai === "mo");
  const tong = mo.reduce((s, h) => s + h.mat, 0);
  return {
    ds: hang.sort((a, b) => (b.mat ?? (b.trangThai === "da_cham" ? Infinity : -1)) - (a.mat ?? (a.trangThai === "da_cham" ? Infinity : -1))),
    tongMat: tong, navPct: nav > 0 ? (tong / nav) * 100 : null,
    daCham: hang.filter((h) => h.trangThai === "da_cham").map((h) => h.ma), khongRo: hang.filter((h) => h.trangThai === "khong_ro").map((h) => h.ma),
  };
}

// DIEM SUC KHOE 0-100 = cac tru: Da dang hoa (so cuoc doc lap, tap trung rui ro / nganh), Rui ro (bien dong so voi VN-Index, dem margin), Xu huong (ty trong gia tri o ma khoe),
// Thanh khoan, Doanh nghiep (tuy chon). Mac dinh 4 tru x 25; theo PHONG CACH (lib/phongCachDauTu.js) truyen trongSo (tong 100) + doanhNghiep (0..1, null = chua co BCTC -> 0,5).
// xuHuongDaiHan: xu huong = ty trong gia tri o ma TREN DUONG CAN BANG DAI HAN (thay vi tren Kijun + chua bao ban). tyLeThoat: ty trong ma bi gan nhan "Thoat" (thay cho canh bao nang).
// pb = ket qua danhGiaDanhMuc (lib/danhGiaDanhMuc.js), rr = phanTichRuiRo (co the null khi chua tai xong / thieu du lieu -> dung cach cham don gian cua pb).
// CACH CHAM 2 tru Da dang / Rui ro tu 04/11/2026 la LIEN TUC (kiem chung nghienCuuDanhGiaDanhMucNangCao.mjs muc F - xep dung sut giam 6 thang sau hon cach bac thang cu):
//   Da dang = 0,45 x (so cuoc doc lap - 1) / 2 (du diem tu 3) + 0,30 x (rui ro don 1 ma: 25% -> du, 75% -> 0) + 0,25 x (nganh lon nhat: 40% -> du, 90% -> 0; dang song nganh: 60% -> du, 100% -> 0)
//   Rui ro  = ty le bien dong du bao danh muc / VN-Index: 0,8 -> du diem, 1,8 -> 0; tru them khi dem margin mong / don bay cao.
export function chamDiemSucKhoe(pb, rr, { trongSo = null, doanhNghiep = null, xuHuongDaiHan = false, tyLeThoat = null } = {}) {
  if (!pb || pb.soMaCoGia === 0) return null;
  const kep = (x, a = 0, b = 25) => Math.max(a, Math.min(b, x));
  const nganhLon = pb.nganh?.find((g) => g.ten !== "Khác")?.tyTrong ?? 0;
  const phanNganh = pb.nganhDangSong ? kep(1 - (nganhLon - 0.6) / 0.4, 0, 1) : kep(1 - (nganhLon - 0.4) / 0.5, 0, 1);
  let daDang;
  if (rr?.dsMa?.length) {
    const rcMax = Math.max(...rr.ma.map((x) => x.rc));
    daDang = 25 * (0.45 * kep((rr.soCuocDocLap - 1) / 2, 0, 1) + 0.3 * kep(1 - (rcMax - 0.25) / 0.5, 0, 1) + 0.25 * phanNganh);
  } else daDang = (pb.chiTietDiem.daDang * 25) / 40 - (!pb.nganhDangSong && nganhLon > 0.6 ? 5 : 0);
  let ruiRo = 20;
  if (rr?.volV > 0) ruiRo = 25 * kep(1 - (rr.volP / rr.volV - 0.8) / 1.0, 0, 1);
  const m = pb.margin;
  if (m?.giamDenCanhBao != null) ruiRo -= m.giamDenCanhBao <= 10 ? 10 : m.giamDenCanhBao <= 20 ? 5 : 0;
  if (m?.donBay > 1.5) ruiRo -= 3;
  let xuHuong = (pb.chiTietDiem.kyThuat * 25) / 40;
  if (xuHuongDaiHan) {
    const co = (pb.hang ?? []).filter((h) => h.tyTrong != null);
    const tren = co.filter((h) => !(Number(h.r?.gg_bot) > 0) || h.gia >= Number(h.r.gg_bot)).reduce((s, h) => s + h.tyTrong, 0);
    xuHuong = 25 * tren;
  }
  let thanhKhoan = 20;
  if (rr?.thanhKhoan?.tyLeBan1Phien != null) thanhKhoan = 25 * rr.thanhKhoan.tyLeBan1Phien - (rr.thanhKhoan.lauNhat > 5 ? 5 : 0);
  const w = trongSo ?? { daDang: 25, ruiRo: 25, xuHuong: 25, thanhKhoan: 25 };
  const phan = { daDang: kep(daDang) / 25, ruiRo: kep(ruiRo) / 25, xuHuong: kep(xuHuong) / 25, thanhKhoan: kep(thanhKhoan) / 25 };
  if (w.doanhNghiep > 0) phan.doanhNghiep = doanhNghiep == null ? 0.5 : Math.max(0, Math.min(1, doanhNghiep));
  const tru = {};
  const toiDa = {};
  for (const k of Object.keys(phan)) {
    if (!(w[k] > 0)) continue;
    tru[k] = Math.round(phan[k] * w[k]);
    toiDa[k] = w[k];
  }
  let diem = Object.values(tru).reduce((s, x) => s + x, 0);
  // hon nua gia tri nam o ma co canh bao nang (BAN, cham / sat cat lo, duoi duong can bang dai han) - hoac theo phong cach: ma bi gan nhan "Thoat" -
  // thi diem toi da 64 (Trung binh): tranh 'Tot' khi danh muc dang co van de lon
  const tyLeNang = tyLeThoat ?? (pb.hang ?? []).filter((h) => h.tyTrong != null && h.nhanXet?.some((x) => x.muc === 0)).reduce((s, h) => s + h.tyTrong, 0);
  const gioiHan = tyLeNang > 0.5;
  if (gioiHan) diem = Math.min(diem, 64);
  const xepLoai = diem >= 85 ? "Xuất sắc" : diem >= 70 ? "Tốt" : diem >= 50 ? "Trung bình" : "Cần cải thiện";
  return { diem, xepLoai, tru, toiDa, dayDu: !!rr?.dsMa?.length, gioiHan, tyLeNang, thieuDN: w.doanhNghiep > 0 && doanhNghiep == null };
}

// NHAN XET RUI RO kieu bao cao chuyen gia: { muc: 0 nang / 1 chu y / 2 tot, uuTien (nho = quan trong hon), tieuDe, noiDung }.
export function nhanXetRuiRo(rr, pb) {
  if (!rr?.dsMa?.length) return [];
  const o = [];
  const pc = (x) => `${p0(x * 100)}%`;
  const lechMax = [...rr.ma].sort((a, b) => b.rc - b.w - (a.rc - a.w))[0];
  if (rr.ma.length > 1 && lechMax.rc - lechMax.w > 0.08)
    o.push({ muc: lechMax.rc > 0.4 ? 0 : 1, uuTien: 2, tieuDe: "Rủi ro dồn vào một mã", noiDung: `${lechMax.ma} chiếm ${pc(lechMax.w)} vốn nhưng gánh ${pc(lechMax.rc)} rủi ro (biến động) của cả danh mục — mã này quyết định phần lớn việc danh mục lên hay xuống.` });
  if (rr.ma.length >= 3) {
    const sc = rr.soCuocDocLap;
    o.push({
      muc: sc < 1.4 ? 0 : sc < 1.7 ? 1 : 2,
      uuTien: 3,
      tieuDe: "Mức đa dạng hóa thật",
      noiDung: `${rr.ma.length} mã nhưng chỉ tương đương khoảng ${p1(sc)} khoản đầu tư độc lập${rr.tqTrungBinh != null ? ` (tương quan trung bình giữa các mã ${rr.tqTrungBinh.toFixed(2).replace(".", ",")})` : ""} — ${sc < 1.4 ? "các mã gần như đi cùng một chiều, thêm mã cùng kiểu không giảm được rủi ro" : sc < 1.7 ? "các mã khá giống nhau; muốn giảm rủi ro cần mã khác ngành, khác chu kỳ" : "mức tốt so với thị trường Việt Nam (các mã thường đi cùng chiều)"}.`,
    });
  }
  const navTL = pb?.taiSan?.nav > 0 ? pb.taiSan.coPhieu / pb.taiSan.nav : 1;
  o.push({
    muc: rr.betaP > 1.3 ? 1 : 2,
    uuTien: 4,
    tieuDe: "Độ nhạy với thị trường",
    noiDung: `Beta ${rr.betaP.toFixed(2).replace(".", ",")}: khi VN-Index giảm 10%, danh mục thường giảm khoảng ${p1(rr.betaP * 10)}%${navTL > 1.05 ? `, tài sản ròng giảm khoảng ${p1(rr.betaP * 10 * navTL)}% vì đang dùng margin` : ""}. Biến động năm ${p0(rr.volP)}% so với ${p0(rr.volV)}% của VN-Index.`,
  });
  o.push({
    muc: rr.var95 > 3 ? 1 : 2,
    uuTien: 5,
    tieuDe: "Một phiên xấu",
    noiDung: `Cứ khoảng 20 phiên sẽ có 1 phiên danh mục mất từ ${p1(rr.var95)}% trở lên (bình quân những phiên như vậy ${p1(rr.cvar95)}%); phiên tệ nhất 1 năm qua ${p1(Math.abs(rr.phienXauNhat.pct))}%.`,
  });
  const db = rr.duBao;
  if (db) {
    const nav = db.nav;
    o.push({
      muc: db.p80 >= 35 ? 0 : db.p80 >= 28 ? 1 : 2,
      uuTien: 2.5,
      tieuDe: "6 tháng tới có thể sụt bao nhiêu",
      noiDung: `Với biến động dự báo ${p0(rr.volP)}%/năm, các danh mục tương tự trên sàn Việt Nam 2014–2026 có sụt giảm tối đa trong 6 tháng sau: một nửa không quá ${p0(db.trungVi)}%, 4/5 không quá ${p0(db.p80)}%, 1/20 trường hợp tệ hơn ${p0(db.p95)}%${nav ? `; tính trên tài sản ròng (đang dùng margin) khoảng ${p0(nav.trungVi)}% / ${p0(nav.p80)}% / ${p0(nav.p95)}%` : ""}. Đây là phân bố thống kê, không phải dự đoán hướng đi của thị trường.`,
    });
  }
  const kh = (rr.khungHoang ?? []).filter((k) => Number.isFinite(k.portPct));
  if (kh.length) {
    const te = [...kh].sort((a, b) => a.portPct - b.portPct)[0];
    const coMargin = pb?.margin;
    o.push({
      muc: te.chamGC || te.chamCB ? 0 : te.portPct < -35 ? 1 : 2,
      uuTien: te.chamCB ? 1.5 : 6.5,
      tieuDe: "Nếu khủng hoảng cũ lặp lại",
      noiDung: `Tệ nhất là ${te.ten.toLowerCase()} (VN-Index ${p1(te.vniPct)}%): danh mục hiện tại ${p1(te.portPct)}%${te.navPct != null && coMargin ? `, tài sản ròng ${p1(te.navPct)}%, ký quỹ còn ${p0(te.tyLeKyQuy)}%${te.chamGC ? " — dưới ngưỡng xử lý, sẽ bị bán giải chấp" : te.chamCB ? " — bị gọi ký quỹ" : ""}` : ""}${te.soMaUoc ? ` (${te.soMaUoc} mã chưa niêm yết lúc đó, ước theo beta)` : ""}.`,
    });
  }
  const xau = rr.kichBan.find((k) => k.ten.startsWith("Lặp lại"));
  if (xau) {
    const coMargin = pb?.margin;
    o.push({
      muc: xau.chamGC ? 0 : xau.chamCB ? 0 : xau.portPct < -15 ? 1 : 2,
      uuTien: xau.chamCB ? 1 : 6,
      tieuDe: "Kiểm tra sức chịu đựng",
      noiDung: `Nếu lặp lại đợt giảm mạnh nhất của VN-Index trong 1 năm qua (${xau.ghiChu.split(",")[0]}, VN-Index ${p1(xau.vniPct)}%), danh mục hiện tại ${xau.portPct >= 0 ? "+" : ""}${p1(xau.portPct)}%${coMargin ? `, tỷ lệ ký quỹ còn ${p0(xau.tyLeKyQuy)}%${xau.chamGC ? " — DƯỚI ngưỡng xử lý, có thể bị bán giải chấp" : xau.chamCB ? " — chạm ngưỡng cảnh báo, sẽ bị gọi ký quỹ" : ""}` : ""}.`,
    });
  }
  const tk = rr.thanhKhoan;
  const kho = tk.ds.filter((x) => x.soPhien != null && x.soPhien > 3);
  if (kho.length)
    o.push({ muc: kho[0].soPhien > 10 ? 0 : 1, uuTien: 7, tieuDe: "Thanh khoản", noiDung: `${kho.slice(0, 3).map((x) => `${x.ma} cần ~${p0(x.soPhien)} phiên`).join(", ")} để bán hết nếu mỗi phiên chỉ bán 20% thanh khoản bình quân — khi thị trường xấu sẽ khó thoát nhanh.` });
  const tu = rr.toiUu;
  if (tu?.coThayDoi && tu.sau.volP < tu.truoc.volP - 1)
    o.push({
      muc: tu.truoc.volP - tu.sau.volP >= 4 ? 1 : 2,
      uuTien: 6.8,
      tieuDe: "Chia lại tỷ trọng để giảm rủi ro",
      noiDung: `Giữ nguyên các mã${tu.boQua.length ? ` (trừ ${tu.boQua.join(", ")} đang cần thoát)` : ""} nhưng chia lại tỷ trọng theo cách biến động nhỏ nhất (mỗi mã tối đa ${p0(tu.tran * 100)}%): biến động dự báo ${p0(tu.truoc.volP)}% → ${p0(tu.sau.volP)}%/năm, rủi ro dồn vào mã lớn nhất ${p0(tu.truoc.rcMax * 100)}% → ${p0(tu.sau.rcMax * 100)}%. Kiểm chứng 2014–2026: cách chia này giảm sụt giảm ở khoảng 3/4 trường hợp, lợi nhuận không thấp hơn. Chi tiết ở tab Rủi ro.`,
    });
  o.push({ muc: rr.laiP >= rr.laiV ? 2 : 1, uuTien: 8, tieuDe: "Nếu cầm 1 năm qua", noiDung: `Với tỷ trọng hiện tại, danh mục ${rr.laiP >= 0 ? "+" : ""}${p1(rr.laiP)}% so với VN-Index ${rr.laiV >= 0 ? "+" : ""}${p1(rr.laiV)}%; sụt giảm tối đa ${p1(Math.abs(rr.ddP.pct))}% (VN-Index ${p1(Math.abs(rr.ddV))}%). Kết quả quá khứ, không đảm bảo tương lai.` });
  return o.sort((a, b) => a.muc - b.muc || a.uuTien - b.uuTien);
}
