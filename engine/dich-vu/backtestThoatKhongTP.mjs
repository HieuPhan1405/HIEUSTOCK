// BACKTEST CAC CACH RA KHONG DUNG TP1/TP2 TAI DIEM MUA HE THONG (Hieu 27/10/2026: "thu ko dung TP1 2 xem, test them"). Lenh Mua thuong (loai 1) cua engine, nen_dai.json (~2018 -> 21/10/2026), phi 0,4%/vong.
// Chi con cat lo S cua engine + cach ra duoi day (khong chot loi tung phan o TP). "Thung" = DONG CUA duoi duong, CHI tinh sau khi gia tung dong cua tren duong do ke tu luc mua (dung chung voi backtestThoatTenkanKijunHeThong.mjs).
// 2 quy uoc gia vao: LY TUONG (mua dung gia engine E luc tin hieu, ban tu phien sau) va THUC TE (mua mo cua phien sau, ban tu chieu T+2).
// Cach ra: BAN = chi tin hieu BAN cua engine; TEN / KIJ / MA20 / MA50 / CLD = ban het khi dong cua thung duong (Tenkan / Kijun / SMA20 / SMA50 / day may); TK = Tenkan ban 1/2 (hoac 1/3), Kijun ban not; "2n" = can 2 nen dong cua lien tiep duoi duong;
//   TKX = Tenkan cat xuong duoi Kijun ban het; ATRk = dong cua <= dinh dong cua - k x ATR14 ban het; HV8/HV12 = nhu TK1/2 nhung khi dinh cao >= +8% / +12% so voi gia vao thi cat lo doi ve gia vao (hoa von).
// Chay: node engine/dich-vu/backtestThoatKhongTP.mjs [nen_dai.json]
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf, CHI_PHI } from "./backtestChung.mjs";

const cache = docJson(process.argv[2] || "nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, soMa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
console.log(`${lenh.length} lenh Mua thuong (${soMa} ma)`);

function mp(t, cfg) {
  const { S, tp, open, high, low, close, sell, n } = t;
  const { vao, banTu } = cfg;
  const E = cfg.E ?? open[vao];
  if (!(E > 0) || !(S < E) || vao >= n) return null;
  const duong = { tenkan: t.tenkan, kijun: t.kijun, sma20: t.sma20, sma50: t.sma50, cld: t.cloudBot };
  const lenLine = { tenkan: false, kijun: false, sma20: false, sma50: false, cld: false };
  const dem = { a: 0, b: 0 };
  let conLai = 1, thu = 0, phienW = 0, choBan = false, daHV = false, dinhClose = close[vao], dinhCaoHV = -Infinity, daNua = false;
  const ban = (w, g, i) => { w = Math.min(w, conLai); if (!(w > 0)) return; thu += w * (g / E); phienW += w * (i - t.iv); conLai -= w; }; // khong ban qua phan con lai (sua 27/10: truoc do Tenkan 1/2 truoc TP1 roi TP1/TP2 co the ban > 100%)
  const ketQua = () => ({ ret: (thu - 1) * 100 - CHI_PHI });
  const ketQua2 = (i) => ({ ret: (thu - 1) * 100 - CHI_PHI, phien: phienW, jThoat: i });
  const cap = (i) => { for (const k of Object.keys(lenLine)) if (duong[k][i] != null && close[i] > duong[k][i]) lenLine[k] = true; };
  const duoi = (k, i) => lenLine[k] && duong[k][i] != null && close[i] < duong[k][i];
  const coSell = (i) => cfg.sell && sell[i];
  for (let i = vao; i < n; i++) {
    if (i < banTu) {
      if (low[i] <= S || coSell(i)) choBan = true;
      dinhCaoHV = Math.max(dinhCaoHV, high[i]);
      dinhClose = Math.max(dinhClose, close[i]);
      cap(i);
      continue;
    }
    if (i === banTu && choBan) { ban(conLai, open[i], i); return ketQua2(i); }
    const daLoHV = cfg.hv && (i === banTu ? dinhCaoHV : Math.max(dinhCaoHV, high[i - 1])) >= E * (1 + cfg.hv / 100);
    if (daLoHV) daHV = true;
    let g = null;
    if (low[i] <= S) g = Math.min(open[i], S);
    else if (coSell(i)) g = close[i];
    else if (daHV && low[i] <= E) g = Math.min(open[i], E);
    if (g != null) { ban(conLai, g, i); return ketQua2(i); }
    dinhCaoHV = Math.max(dinhCaoHV, high[i]);
    // cac cach ra theo dong cua
    const soNen = cfg.soNen ?? 1;
    if (cfg.nua) {
      // Tenkan ban phan nua (f), Kijun ban not
      if (!daNua) {
        dem.a = duoi("tenkan", i) ? dem.a + 1 : 0;
        if (dem.a >= soNen) { ban(conLai * cfg.nua, close[i], i); daNua = true; dem.b = 0; }
      }
      dem.b = duoi("kijun", i) ? dem.b + 1 : 0;
      if (dem.b >= soNen) { ban(conLai, close[i], i); return ketQua2(i); }
    } else if (cfg.duong) {
      dem.a = duoi(cfg.duong, i) ? dem.a + 1 : 0;
      if (dem.a >= soNen) { ban(conLai, close[i], i); return ketQua2(i); }
    } else if (cfg.atr) {
      if (t.atr[i] > 0 && close[i] <= dinhClose - cfg.atr * t.atr[i]) { ban(conLai, close[i], i); return ketQua2(i); }
    } else if (cfg.tkx) {
      if (t.tenkan[i] != null && t.kijun[i] != null && t.tenkan[i] < t.kijun[i] && lenLine.tenkan) { ban(conLai, close[i], i); return ketQua2(i); }
    }
    dinhClose = Math.max(dinhClose, close[i]);
    cap(i);
  }
  return null;
}

const CACH = [
  { ten: "BAN   chi tin hieu BAN cua engine (cat lo S)", cfg: { sell: true } },
  { ten: "TEN   thung Tenkan ban het", cfg: { duong: "tenkan" } },
  { ten: "KIJ   thung Kijun ban het", cfg: { duong: "kijun" } },
  { ten: "TK1/2 Tenkan ban 1/2, Kijun ban not", cfg: { nua: 0.5 } },
  { ten: "TK1/3 Tenkan ban 1/3, Kijun ban not", cfg: { nua: 1 / 3 } },
  { ten: "TK1/2 2n  (can 2 nen dong lien tiep duoi duong)", cfg: { nua: 0.5, soNen: 2 } },
  { ten: "KIJ 2n    thung Kijun 2 nen ban het", cfg: { duong: "kijun", soNen: 2 } },
  { ten: "TKX   Tenkan cat xuong duoi Kijun ban het", cfg: { tkx: true } },
  { ten: "MA20  thung SMA20 ban het", cfg: { duong: "sma20" } },
  { ten: "MA50  thung SMA50 ban het", cfg: { duong: "sma50" } },
  { ten: "CLD   thung day may ban het", cfg: { duong: "cld" } },
  { ten: "ATR2  dong cua <= dinh - 2 ATR", cfg: { atr: 2 } },
  { ten: "ATR3  dong cua <= dinh - 3 ATR", cfg: { atr: 3 } },
  { ten: "ATR4  dong cua <= dinh - 4 ATR", cfg: { atr: 4 } },
  { ten: "TK1/2 + hoa von khi dinh >= +8%", cfg: { nua: 0.5, hv: 8 } },
  { ten: "TK1/2 + hoa von khi dinh >= +12%", cfg: { nua: 0.5, hv: 12 } },
  { ten: "KIJ + hoa von khi dinh >= +8%", cfg: { duong: "kijun", hv: 8 } },
];
const SO_LAN = 30;
const QUY_UOC = [
  ["THUC TE (mua mo cua phien sau, ban tu chieu T+2)", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })],
  ["LY TUONG (gia vao = E engine, ban tu phien sau)", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })],
];
const TAP = [
  ["Toan bo giai doan", () => true],
  ["Tu 2022.5", (t) => t.ngay >= "2022-05-01"],
  ["Rieng 2026", (t) => t.ngay >= "2026-01-01"],
];
for (const [tenQU, cfgVao] of QUY_UOC) {
  for (const [tenTap, loc] of TAP) {
    const ds = lenh.filter(loc);
    console.log(`\n=========== ${tenQU} | ${tenTap}: n = ${ds.length} ===========`);
    console.log("Cach ra (KHONG TP1/TP2)".padEnd(56), "lai TB".padStart(7), "trung vi".padStart(8), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "| DM K=10 lai/nam, sut | lai TB 3 giai doan (<2019, 2019-22.4, 22.5+)");
    for (const c of CACH) {
      const kqs = ds.map((t) => mp(t, { ...c.cfg, ...cfgVao(t) }));
      const ok = kqs.filter(Boolean);
      const k = thongKe(ok);
      const ky = [[], [], []];
      ds.forEach((t, i) => kqs[i] && ky[kyOf(t.ngay)].push(kqs[i].ret));
      const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {});
      console.log(c.ten.padEnd(56), f(k.tb).padStart(7), f(k.trungVi).padStart(8), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), `| ${f(d10.cagr, 1).padStart(6)}%/${f(d10.sut, 0).padStart(2)}% |`, ky.map((a) => (a.length ? f(tb(a)) : "-").padStart(5)).join(" "));
    }
  }
}
