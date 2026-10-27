// BACKTEST CHOT LOI THEO % LAI (tiep theo backtestMauChotLoi.mjs: ban 1/2 ngay khi lai >= 5% cho ket qua tot nhat): cac "mau chot loi" theo bac thang % so voi gia vao, tai diem mua he thong (lenh Mua thuong, nen_dai.json), phi 0,4%.
// Moc % la lenh gioi han (khop khi gia cao nhat cham, gia khop = max(gia moc, mo cua neu mo cao hon) - quy uoc nhu TP engine). Phan con lai: Tenkan ban 1/2 + Kijun not (+ BAN, cat lo S, hoa von sau khi gia cham TP2 cua engine).
// KET HOP voi 2 TP cua engine: "+TP1/TP2" = giu 30% TP1 + 30% TP2 roi them bac thang %; con lai nhu tren.
// Chay: node engine/dich-vu/backtestChotLoiTheoPhanTram.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, soMa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
console.log(`${lenh.length} lenh Mua thuong (${soMa} ma)`);
const P = (...a) => a.map(([w, pct]) => ({ w, pct }));
const CACH = [
  ["TK3 hien tai: 30% TP1 + 30% TP2 (engine)", HAI_TP],
  ["KHONG TP: chi Tenkan 1/2 + Kijun not", []],
  ["50% o +5%", P([0.5, 5])],
  ["30% o +5%, 30% o +10%", P([0.3, 5], [0.3, 10])],
  ["40% o +5%, 40% o +10%", P([0.4, 5], [0.4, 10])],
  ["30% o +3%, 30% o +6%", P([0.3, 3], [0.3, 6])],
  ["30% o +8%, 30% o +15%", P([0.3, 8], [0.3, 15])],
  ["50% o +8%", P([0.5, 8])],
  ["50% o +3%", P([0.5, 3])],
  ["30% o +5%, 30% o +10%, 20% o +20%", P([0.3, 5], [0.3, 10], [0.2, 20])],
  ["+TP1/TP2 engine, them 50% phan con o +5%", [...HAI_TP]], // dac biet: xu ly rieng bang mau o duoi
];
const QUY_UOC = [
  ["THUC TE (mua mo cua phien sau, ban tu chieu T+2)", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })],
  ["LY TUONG (gia engine E, ban tu phien sau)", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })],
];
const TAP = [["Toan bo", () => true], ["Tu 2022.5", (t) => t.ngay >= "2022-05-01"], ["Rieng 2026", (t) => t.ngay >= "2026-01-01"]];
const SO_LAN = 20;
for (const [tenQU, cfgVao] of QUY_UOC) {
  for (const [tenTap, loc] of TAP) {
    const ds = lenh.filter(loc);
    console.log(`\n=========== ${tenQU} | ${tenTap}: n = ${ds.length} ===========`);
    console.log("Mau chot loi (phan con: Tenkan 1/2 + Kijun not + BAN)".padEnd(58), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "| DM K=10 lai/nam, sut | DM K=20");
    for (const [ten, moc] of CACH) {
      const dacBiet = ten.startsWith("+TP1/TP2");
      const cfg = (t) => ({ moc, baoVe: true, theoSell: true, tk: "nua", ...(dacBiet ? { mau: () => true, mauNguong: 5, mauTyLe: 0.5 } : {}), ...cfgVao(t) });
      const kqs = ds.map((t) => mp(t, cfg(t)));
      const k = thongKe(kqs.filter(Boolean));
      const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {});
      const d20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, {});
      console.log(ten.padEnd(58), f(k.tb).padStart(7), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), `| ${f(d10.cagr, 1).padStart(6)}%/${f(d10.sut, 0).padStart(2)}% | ${f(d20.cagr, 1).padStart(6)}%/${f(d20.sut, 0)}%`);
    }
  }
}
