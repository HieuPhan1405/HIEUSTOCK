// BACKTEST CAC PHONG CACH DAU TU TREN WEB (Hieu 03/11/2026: "xu huong thi ko can test, test them tich san"). Chi doc cache, khong ghi gi ngoai man hinh.
// PHAN 1 - LUOT SONG (lib/phongCachDauTu.js: cat lo -7% so gia von, thung Kijun = Thoat, duoi Tenkan = Giam ty trong, BAN / cat lo he thong = Thoat):
//   vao theo cac lenh MUA THUONG (loai 1) cua he thong, mua o gia MO CUA phien sau tin hieu, ban duoc tu chieu T+2 (nhu backtestThoatTenkanKijunHeThong.mjs), phi 0,4%/vong.
//   HT = cach ra hien tai cua he thong (30% TP1 + 30% TP2, phan con lai theo tin hieu BAN) lam moc so sanh; LS* = cac quy tac cua phong cach Luot song.
// PHAN 2 - TANG TRUONG / DAI HAN / TICH SAN tren BCTC (bctc_dai.json, tu 2022-01): moi thang chon ma theo bo loc, mua dong cua phien SAU cuoi thang, giu toi da K ma chia deu,
//   ma thoat khi dat dieu kien "Thoat" cua phong cach (hoac, voi ban tai co cau, khi roi khoi top K). O trong = tien mat (0%). Phi 0,2%/chieu. Bao cao co hieu luc quy + 50 ngay.
//   Von hoa = gia x so CP HIEN TAI (xap xi), chi gom ma DANG niem yet (thien lech nguoi song sot) - xem canh bao khi doc ket qua.
//   Tang truong = LNST TTM tang >= 20% (neu chua du 8 quy thi dung LNST quy so cung ky) + ROE >= 10% + gia tren duong can bang dai han (gg_top); thoat khi LN TTM <= 0, hoac LN giam va gia duoi gg_bot, hoac lo 15% so gia von.
//   Dai han = bo loc "chat luong + gia re" (LN > 0, ROE >= 12%, PE <= 15, PB <= 3, don bay <= 3, CFO > 0); khong cat lo theo gia; thoat khi LN TTM <= 0 hoac LN TTM giam >= 30%. (Khong co du lieu co tuc theo thoi diem nen KHONG loc theo co tuc.)
//   Tich san = von hoa >= 20.000 ty, ROE >= 12%, LN tang >= 5%, CFO > 0, no / VCSH <= 2,5, thanh toan hien hanh >= 1 (phi tai chinh) - nhu nghienCuuTichSanChonMa.mjs phan 3.
// Chay: node engine/dich-vu/nghienCuuPhongCachDauTu.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf, TEN_KY, CHI_PHI } from "./backtestChung.mjs";
import { SO_CP_LUU_HANH } from "../../lib/soCoPhieuLuuHanh.js";
import { tinhCanBang } from "../../lib/chiBaoKyThuat.js";

const nen = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");

// =====================================================================================================
// PHAN 1: LUOT SONG
// =====================================================================================================
const { lenh: tatCa, soMa: soMaEngine } = chayEngine({ cache: nen, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
console.log(`PHAN 1 - LUOT SONG: ${lenh.length} lenh Mua thuong (${soMaEngine} ma), ${lenh[0]?.ngay} -> ${lenh.at(-1)?.ngay}`);

function mpLuot(t, cfg) {
  const { S, tp, open, high, low, close, sell, n, tenkan, kijun } = t;
  const vao = t.iv + 1;
  const banTu = t.iv + 3;
  const E = open[vao];
  if (!(E > 0) || !(S < E) || vao >= n) return null;
  const moc = (cfg.moc ?? []).map((m) => ({ w: m.w, gia: tp[m.i], xong: false }));
  let conLai = 1, thu = 0, phienW = 0, choBan = false, dinhTruoc = -Infinity, daTP2 = false, daNua = false;
  const ban = (w, g, i) => {
    w = Math.min(w, conLai);
    if (!(w > 0)) return;
    thu += w * (g / E);
    phienW += w * (i - t.iv);
    conLai -= w;
  };
  const ket = () => ({ ret: (thu - 1) * 100 - CHI_PHI, phien: phienW });
  // dieu kien cuoi phien i phai ban HET (khong tinh cat lo S cua he thong - xu ly rieng theo gia thap nhat)
  const thoatHet = (i) =>
    (cfg.theoSell && sell[i]) ||
    (cfg.catLoVon != null && close[i] <= E * (1 - cfg.catLoVon / 100)) ||
    (cfg.kijun && kijun[i] != null && close[i] < kijun[i]);
  for (let i = vao; i < n; i++) {
    if (i < banTu) {
      if (low[i] <= S || thoatHet(i)) choBan = true;
      dinhTruoc = Math.max(dinhTruoc, high[i]);
      continue;
    }
    if (i === banTu && choBan) {
      ban(conLai, open[i], i);
      return ket();
    }
    if (cfg.baoVe && (i === banTu ? dinhTruoc : high[i - 1]) >= tp[1]) daTP2 = true;
    const stopBV = daTP2 ? E : 0;
    for (const m of moc) if (!m.xong && open[i] >= m.gia) { ban(m.w, open[i], i); m.xong = true; }
    let g = null;
    if (low[i] <= S) g = Math.min(open[i], S);
    else if (thoatHet(i)) g = close[i];
    else if (stopBV > 0 && low[i] <= stopBV) g = Math.min(open[i], stopBV);
    if (g != null) {
      if (conLai > 1e-12) ban(conLai, g, i);
      return ket();
    }
    for (const m of moc) if (!m.xong && high[i] >= m.gia) { ban(m.w, m.gia, i); m.xong = true; }
    if (conLai <= 1e-12) return ket();
    if (cfg.tenkanNua && !daNua && tenkan[i] != null && close[i] < tenkan[i]) {
      ban(conLai * 0.5, close[i], i);
      daNua = true;
    }
  }
  return null;
}

const HAI_TP = [{ w: 0.3, i: 0 }, { w: 0.3, i: 1 }];
const CACH = [
  { ten: "HT   he thong hien tai: 30% TP1 + 30% TP2, con lai theo BAN", cfg: { moc: HAI_TP, baoVe: true, theoSell: true } },
  { ten: "LS1  Luot song: cat lo -7% von + thung Kijun + BAN (khong chot loi)", cfg: { moc: [], theoSell: true, catLoVon: 7, kijun: true } },
  { ten: "LS2  LS1 + giam 1/2 khi dong cua duoi Tenkan", cfg: { moc: [], theoSell: true, catLoVon: 7, kijun: true, tenkanNua: true } },
  { ten: "LS3  LS1 + chot 30% TP1 + 30% TP2 (nhu he thong)", cfg: { moc: HAI_TP, baoVe: true, theoSell: true, catLoVon: 7, kijun: true } },
  { ten: "LS4  LS2 + chot 30% TP1 + 30% TP2", cfg: { moc: HAI_TP, baoVe: true, theoSell: true, catLoVon: 7, kijun: true, tenkanNua: true } },
  { ten: "L5   chi cat lo -7% von + BAN (khong Kijun)", cfg: { moc: [], theoSell: true, catLoVon: 7 } },
  { ten: "L6   chi thung Kijun + BAN", cfg: { moc: [], theoSell: true, kijun: true } },
  { ten: "L7   HT + cat lo -7% von them vao", cfg: { moc: HAI_TP, baoVe: true, theoSell: true, catLoVon: 7 } },
];
const TAP = [
  ["Toan bo giai doan", () => true],
  ["Tu 2022.5", (t) => t.ngay >= "2022-05-01"],
  ["Rieng 2026", (t) => t.ngay >= "2026-01-01"],
];
for (const [tenTap, loc] of TAP) {
  const ds = lenh.filter(loc);
  console.log(`\n=========== ${tenTap}: n = ${ds.length} lenh ===========`);
  console.log("Cach ra".padEnd(62), "n".padStart(5), "lai TB".padStart(7), "trung vi".padStart(8), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "| lai TB <2019 | 2019-22.4 | 22.5+ | DM K=10 CAGR/sut");
  for (const c of CACH) {
    const kqs = ds.map((t) => mpLuot(t, c.cfg));
    const ok = kqs.filter(Boolean);
    const k = thongKe(ok);
    const ky = [[], [], []];
    ds.forEach((t, i) => kqs[i] && ky[kyOf(t.ngay)].push(kqs[i].ret));
    const d10 = danhMucNhieuLan(kqs, ds, 10, 30, {});
    console.log(c.ten.padEnd(62), String(ok.length).padStart(5), f(k.tb).padStart(7), f(k.trungVi).padStart(8), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), "|", ky.map((a) => `${f(tb(a)).padStart(5)}(${a.length})`).join(" "), `| ${f(d10.cagr, 1)}%/${f(d10.sut, 0)}%`);
  }
}
console.log(`(giai doan: ${TEN_KY.join(" | ")})`);

// =====================================================================================================
// PHAN 2: TANG TRUONG / DAI HAN / TICH SAN (BCTC)
// =====================================================================================================
const bctc = docJson("bctc_dai.json");
const nganh = docJson("nganh_map.json");
const ngay = vni.map((b) => b.t);
const N = ngay.length;
const idx = new Map(ngay.map((t, i) => [t, i]));
const ma = [], C = [], G = [], GT = [], GB = [];
for (const [k, bars] of Object.entries(nen)) {
  if (bars.length < 260 || !SO_CP_LUU_HANH[k] || !bctc[k]) continue;
  const c = new Array(N).fill(null), g = new Array(N).fill(0), gt0 = new Array(N).fill(null), gb0 = new Array(N).fill(null);
  const cbk = tinhCanBang(bars);
  bars.forEach((b, p) => {
    const i = idx.get(b.t);
    if (i == null) return;
    c[i] = b.c; g[i] = b.c * b.v; gt0[i] = cbk.top[p]; gb0[i] = cbk.bot[p];
  });
  let last = null;
  for (let i = 0; i < N; i++) { if (c[i] != null) last = c[i]; else if (last != null) c[i] = last; }
  ma.push(k); C.push(c); G.push(g); GT.push(gt0); GB.push(gb0);
}
const M = ma.length;
const cong = (d, n) => new Date(Date.parse(d) + n * 86400e3).toISOString().slice(0, 10);
const qsAll = [...new Set(ma.flatMap((k) => Object.keys(bctc[k].q)))].sort();
const lui = (q, k) => qsAll[qsAll.indexOf(q) - k];
const gtv = (b, q, it) => b.q[q]?.[it];
const ttm = (b, q, it) => {
  let s = 0;
  for (let k = 0; k < 4; k++) { const x = gtv(b, lui(q, k), it); if (!Number.isFinite(x)) return NaN; s += x; }
  return s;
};
const quyHieuLuc = (t) => { let q = null; for (const x of qsAll) { if (cong(x, 50) <= t) q = x; else break; } return q; };
const cacheCB = new Map();
function coBan(j, q) {
  const key = j + "|" + q;
  if (cacheCB.has(key)) return cacheCB.get(key);
  const b = bctc[ma[j]];
  const q4 = lui(q, 4);
  const ln = ttm(b, q, 23003);
  const vcsh = (gtv(b, q, 14000) ?? NaN) + (gtv(b, q, 15000) ?? 0);
  const no = Number.isFinite(gtv(b, q, 13000)) ? gtv(b, q, 13000) : NaN;
  const ln0 = q4 ? ttm(b, q4, 23003) : NaN;
  let lnYoY = Number.isFinite(ln0) && ln0 > 0 && ln > 0 ? ln / ln0 - 1 : NaN;
  const lq = gtv(b, q, 23003), lq0 = q4 ? gtv(b, q4, 23003) : NaN;
  if (!Number.isFinite(lnYoY) && Number.isFinite(lq) && Number.isFinite(lq0) && lq0 > 0) lnYoY = lq / lq0 - 1; // chua du 8 quy: dung LN quy so cung ky
  const o = {
    ln, vcsh, roe: (ln / vcsh) * 100, donBay: no / vcsh, lnYoY, loai: b.loai,
    quyKhongGiam: Number.isFinite(lq) && Number.isFinite(lq0) ? lq >= lq0 : null,
    cfo: ttm(b, q, 32000), tsnh: gtv(b, q, 11000), nnh: gtv(b, q, 13100),
  };
  cacheCB.set(key, o);
  return o;
}
const tb20 = (j, i) => { let s = 0; for (let k = i - 19; k <= i; k++) s += G[j][k]; return s / 20; };
const vonHoa = (j, i) => C[j][i] * 1000 * SO_CP_LUU_HANH[ma[j]];
const thanhKhoan = (j, i) => C[j][i] != null && C[j][i - 130] != null && tb20(j, i) >= 5e6;

const cuoiThang = [];
for (let i = 0; i < N; i++) if (i === N - 1 || ngay[i].slice(0, 7) !== ngay[i + 1].slice(0, 7)) cuoiThang.push(i);
const R = cuoiThang.filter((i) => ngay[i] >= "2022-01-01" && i + 2 < N);

// ---- bo loc chon ma (tra mang giam dan theo diem) ----
function poolTangTruong(i0) {
  const q = quyHieuLuc(ngay[i0]);
  if (!q) return [];
  const out = [];
  for (let j = 0; j < M; j++) {
    if (!thanhKhoan(j, i0) || vonHoa(j, i0) < 2e12) continue;
    const cb = coBan(j, q);
    if (!(cb.ln > 0) || !(cb.lnYoY >= 0.2) || !(cb.roe >= 10)) continue;
    if (!(GT[j][i0] > 0 && C[j][i0] > GT[j][i0])) continue;
    out.push({ j, s: Math.min(cb.lnYoY, 3) });
  }
  return out.sort((a, b) => b.s - a.s);
}
function poolDaiHan(i0) {
  const q = quyHieuLuc(ngay[i0]);
  if (!q) return [];
  const ds = [];
  for (let j = 0; j < M; j++) {
    if (!thanhKhoan(j, i0)) continue;
    const von = vonHoa(j, i0);
    const cb = coBan(j, q);
    if (!(cb.ln > 0) || von < 2e12 || cb.roe < 12) continue;
    const pe = von / cb.ln, pb = von / cb.vcsh;
    if (!(pe <= 15) || !(pb <= 3)) continue;
    if (cb.loai === "pi" && (!(cb.donBay <= 3) || !(cb.cfo > 0))) continue;
    ds.push({ j, pe, roe: cb.roe });
  }
  const a = [...ds].sort((x, y) => x.pe - y.pe), ra = new Map(a.map((x, r) => [x.j, r]));
  const b = [...ds].sort((x, y) => y.roe - x.roe), rb = new Map(b.map((x, r) => [x.j, r]));
  return ds.map((x) => ({ ...x, d: ra.get(x.j) + rb.get(x.j) })).sort((x, y) => x.d - y.d);
}
function poolTichSan(gioiHanVon = 2e13, toiDaNganh = Infinity) {
  return (i0) => {
    const q = quyHieuLuc(ngay[i0]);
    if (!q) return [];
    const kq = [];
    for (let j = 0; j < M; j++) {
      if (!thanhKhoan(j, i0)) continue;
      const b = bctc[ma[j]], cb = coBan(j, q), von = vonHoa(j, i0);
      if (!(cb.ln > 0) || von < gioiHanVon || cb.roe < 12) continue;
      const q4 = lui(q, 4);
      const ln0 = q4 ? ttm(b, q4, 23003) : NaN;
      const tang = Number.isFinite(ln0) && ln0 > 0 ? cb.ln / ln0 - 1 : cb.quyKhongGiam ? 0.05 : -1;
      if (tang < 0.05) continue;
      if (b.loai === "pi" && (!(cb.cfo > 0) || cb.donBay > 2.5 || !(cb.tsnh / cb.nnh >= 1))) continue;
      kq.push({ j, s: von });
    }
    kq.sort((a, b) => b.s - a.s);
    if (toiDaNganh === Infinity) return kq;
    const dem = new Map();
    return kq.filter((x) => { const g = nganh[ma[x.j]] ?? "?"; const c = dem.get(g) ?? 0; if (c >= toiDaNganh) return false; dem.set(g, c + 1); return true; });
  };
}
const poolLonNhat = (i0) => {
  const kq = [];
  for (let j = 0; j < M; j++) if (thanhKhoan(j, i0)) kq.push({ j, s: vonHoa(j, i0) });
  return kq.sort((a, b) => b.s - a.s);
};
const poolTatCa = (i0) => {
  const q = quyHieuLuc(ngay[i0]);
  if (!q) return [];
  const kq = [];
  for (let j = 0; j < M; j++) if (thanhKhoan(j, i0) && vonHoa(j, i0) >= 2e12 && coBan(j, q).ln > 0) kq.push({ j, s: 0 });
  return kq;
};

// ---- dieu kien thoat ----
const xuongCanBang = (j, i0) => GB[j][i0] != null && C[j][i0] < GB[j][i0];
const thoatTangTruong = (j, i0) => {
  const q = quyHieuLuc(ngay[i0]);
  const cb = coBan(j, q);
  return !(cb.ln > 0) || (cb.lnYoY < 0 && xuongCanBang(j, i0));
};
const thoatDaiHan = (j, i0) => {
  const q = quyHieuLuc(ngay[i0]);
  const cb = coBan(j, q);
  return !(cb.ln > 0) || cb.lnYoY <= -0.3;
};
const thoatKhongTrongTop = (j, i0, h, c) => !c.topK.has(j);
const thoatKhongDatLoc = (j, i0, h, c) => !c.inPool.has(j);

// ---- dong co danh muc theo thang ----
function chay({ K, pool, thoat, catLoVon = null }) {
  const hold = new Map();
  const rets = [];
  const dang = [];
  for (let r = 0; r + 1 < R.length; r++) {
    const i0 = R[r], i1 = R[r + 1];
    const P = pool(i0);
    const topK = new Set(P.slice(0, K).map((x) => x.j));
    const inPool = new Set(P.map((x) => x.j));
    let doi = 0;
    for (const [j, h] of [...hold]) if (thoat(j, i0, h, { topK, inPool })) { hold.delete(j); doi++; }
    for (const x of P) {
      if (hold.size >= K) break;
      if (!hold.has(x.j)) { hold.set(x.j, { px: C[x.j][i0 + 1] }); doi++; }
    }
    let tong = 0;
    for (const [j, h] of [...hold]) {
      const dau = C[j][i0 + 1];
      let cuoi = C[j][i1 + 1];
      if (catLoVon != null) {
        for (let i = i0 + 1; i <= i1 + 1; i++) if (C[j][i] <= h.px * (1 - catLoVon)) { cuoi = C[j][i]; hold.delete(j); doi++; break; }
      }
      tong += cuoi / dau - 1;
    }
    rets.push(tong / K - (0.002 * doi) / K);
    dang.push(hold.size);
  }
  return { rets, soMaTB: tb(dang) };
}

const duong = (a) => { const o = [1]; for (const x of a) o.push(o.at(-1) * (1 + x)); return o; };
const cagr = (a) => (Math.pow(duong(a).at(-1), 12 / a.length) - 1) * 100;
const sut = (a) => { let pk = 1, v = 1, m = 0; for (const x of a) { v *= 1 + x; pk = Math.max(pk, v); m = Math.min(m, v / pk - 1); } return m * 100; };
const sd = (a) => { const m = tb(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
const nam = [...new Set(R.slice(0, -1).map((i) => ngay[i].slice(0, 4)))];
const theoNam = (a) => nam.map((y) => { const q = R.slice(0, -1).map((i, k) => (ngay[i].startsWith(y) ? k : -1)).filter((k) => k >= 0); return (duong(q.map((k) => a[k])).at(-1) - 1) * 100; });

const vniThang = [];
const tatCaThang = [];
for (let r = 0; r + 1 < R.length; r++) {
  const i0 = R[r], i1 = R[r + 1];
  vniThang.push(vni[i1 + 1].c / vni[i0 + 1].c - 1);
  const p = poolTatCa(i0);
  tatCaThang.push(p.length ? tb(p.map((x) => C[x.j][i1 + 1] / C[x.j][i0 + 1] - 1)) : 0);
}
console.log(`\n\n=========== PHAN 2: ${ma.length} ma co BCTC, ${vniThang.length} thang (${ngay[R[0]]} -> ${ngay[R.at(-1)]}) ===========`);
console.log("Phong cach".padEnd(54), "CAGR".padStart(6), "sut".padStart(5), "ma TB".padStart(6), "thang>VNI".padStart(10), "t(vuot VNI)".padStart(12), "|", nam.join("  "));
const inHang = (ten, rets, soMaTB = null) => {
  const ex = rets.map((x, k) => x - vniThang[k]);
  const hon = ex.filter((x) => x > 0).length;
  const t = sd(ex) > 0 ? (tb(ex) / (sd(ex) / Math.sqrt(ex.length))).toFixed(2) : "-";
  console.log(ten.padEnd(54), f(cagr(rets), 1).padStart(6), f(sut(rets), 0).padStart(5), (soMaTB == null ? "-" : f(soMaTB, 1)).padStart(6), `${hon}/${ex.length}`.padStart(10), String(t).padStart(12), "|", theoNam(rets).map((x) => f(x, 0).padStart(4)).join(" "));
};
inHang("VN-Index (moc)", vniThang);
inHang("TB deu moi ma thanh khoan (LN>0, von >= 2.000 ty)", tatCaThang);

const KET = [];
const them = (ten, tuyChon) => { const r = chay(tuyChon); KET.push([ten, r]); inHang(ten, r.rets, r.soMaTB); };
console.log("--- TANG TRUONG (K = 15, thoat: LN <= 0 hoac LN giam & duoi gg_bot; lo 15% von) ---");
them("TT1  Tang truong day du (+ cat lo 15% von)", { K: 15, pool: poolTangTruong, thoat: thoatTangTruong, catLoVon: 0.15 });
them("TT2  Tang truong, khong cat lo gia", { K: 15, pool: poolTangTruong, thoat: thoatTangTruong });
them("TT3  Tang truong, tai co cau hang thang (top 15 LN tang)", { K: 15, pool: poolTangTruong, thoat: thoatKhongTrongTop });
console.log("--- DAI HAN (K = 15, khong cat lo gia) ---");
them("DH1  Dai han: giu toi khi LN <= 0 / giam >= 30%", { K: 15, pool: poolDaiHan, thoat: thoatDaiHan });
them("DH2  Dai han, tai co cau hang thang (top 15)", { K: 15, pool: poolDaiHan, thoat: thoatKhongTrongTop });
them("DH3  Dai han, giu toi khi het dat bo loc", { K: 15, pool: poolDaiHan, thoat: thoatKhongDatLoc });
console.log("--- TICH SAN (K = 15) ---");
them("TS1  Tich san, tai co cau hang thang (von hoa >= 20.000 ty)", { K: 15, pool: poolTichSan(2e13), thoat: thoatKhongTrongTop });
them("TS2  Tich san, giu toi khi het dat bo loc", { K: 15, pool: poolTichSan(2e13), thoat: thoatKhongDatLoc });
them("TS3  Tich san von hoa >= 10.000 ty, tai co cau", { K: 15, pool: poolTichSan(1e13), thoat: thoatKhongTrongTop });
them("TS4  Tich san toi da 3 ma / nganh, tai co cau", { K: 15, pool: poolTichSan(2e13, 3), thoat: thoatKhongTrongTop });
them("TS5  Tich san K = 8 (lon nhat), tai co cau", { K: 8, pool: poolTichSan(2e13), thoat: thoatKhongTrongTop });
console.log("--- DOI CHUNG: chi theo quy mo, khong loc chat luong ---");
them("DC1  15 ma von hoa lon nhat (khong loc), tai co cau", { K: 15, pool: poolLonNhat, thoat: thoatKhongTrongTop });
them("DC2  30 ma von hoa lon nhat, tai co cau", { K: 30, pool: poolLonNhat, thoat: thoatKhongTrongTop });

// ---- chia theo nua dau / nua sau de xem co on dinh khong ----
const chia = Math.floor(vniThang.length / 2);
console.log(`\n--- On dinh theo thoi gian: nua dau (${ngay[R[0]]} -> ${ngay[R[chia]]}) / nua sau (-> ${ngay[R.at(-1)]}); loi suat TB thang vuot VN-Index (diem %) ---`);
for (const [ten, r] of KET) {
  const ex = r.rets.map((x, k) => (x - vniThang[k]) * 100);
  console.log(ten.padEnd(54), "nua dau", f(tb(ex.slice(0, chia)), 2).padStart(6), "| nua sau", f(tb(ex.slice(chia)), 2).padStart(6));
}

// ---- danh sach hien tai (de doi chieu voi web) ----
let iGia = N - 1;
while (iGia > 0 && nen.FPT.at(-1).t < ngay[iGia]) iGia--;
const now = ngay[N - 1];
const hienTai = (ten, pool, K) => {
  const p = pool(iGia).slice(0, K);
  console.log(`${ten} (${pool(iGia).length} ma dat bo loc, gia den ${ngay[iGia]}, bao cao quy ${quyHieuLuc(now)}): ${p.map((x) => ma[x.j]).join(" ")}`);
};
console.log("\n--- Danh sach hien tai ---");
hienTai("Tang truong", poolTangTruong, 15);
hienTai("Dai han", poolDaiHan, 15);
hienTai("Tich san", poolTichSan(2e13), 15);
