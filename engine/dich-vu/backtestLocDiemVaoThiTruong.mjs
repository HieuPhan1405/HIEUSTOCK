// BACKTEST LOC DIEM VAO CUA HE THONG THEO THI TRUONG (Hieu 27/10/2026): chi vao lenh Mua thuong khi VN-Index / do rong thi truong tot? Trang thai thi truong lay TAI NGAY TIN HIEU (dong cua) - khong nhin truoc.
// Lenh Mua thuong cua engine that (nen_dai.json ~2018 -> 21/10/2026), phi 0,4%. 2 cach ra: HT = hien tai (30% TP1 + 30% TP2 + con lai theo BAN) va T40 = 40% TP1 + 40% TP2 (engine), con lai Tenkan 1/2 + Kijun not (+ BAN, cat lo S) - cach tot nhat da tim;
// 2 quy uoc gia vao: THUC TE (mua mo cua phien sau, ban tu chieu T+2) va LY TUONG (gia engine E). Cac bo loc: VN-Index tren Kijun / Tenkan / may / SMA50 / SMA200, SMA50 tren SMA200, do rong (% ma tren SMA50 hoac Kijun) >= nguong, tang giam 5 / 20 phien, cach dinh 60 phien,
// va cac to hop. Chia them theo NHOM DO RONG de xem quan he co don dieu khong. Chi DOC cache. Luu y: thu nhieu bo loc -> thien lech chon loc; chi tin khi CUNG HUONG o ca 3 giai doan (<2019 | 2019-22.4 | 22.5+) va 2026.
// Chay: node engine/dich-vu/backtestLocDiemVaoThiTruong.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, soMa, thiTruong } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
const chiSo = new Map(vni.map((b, i) => [b.t, i]));
const vc = vni.map((b) => b.c);
for (const t of lenh) {
  t.tt = thiTruong(t.ngay);
  const i = chiSo.get(t.ngay);
  if (i != null && i >= 60) {
    t.d5 = (vc[i] / vc[i - 5] - 1) * 100;
    t.d20 = (vc[i] / vc[i - 20] - 1) * 100;
    t.dinh60 = (vc[i] / Math.max(...vc.slice(i - 59, i + 1)) - 1) * 100;
  }
}
console.log(`${lenh.length} lenh Mua thuong (${soMa} ma); co trang thai thi truong: ${lenh.filter((t) => t.tt).length}`);

const LOC = [
  ["Khong loc", () => true],
  ["VN-Index > Kijun", (t) => t.tt && t.tt.vni > t.tt.kijun],
  ["VN-Index > Tenkan", (t) => t.tt && t.tt.vni > t.tt.tenkan],
  ["VN-Index > dinh may", (t) => t.tt && t.tt.vni > t.tt.cloudTop],
  ["VN-Index > SMA50", (t) => t.tt && t.tt.vni > t.tt.sma50],
  ["VN-Index > SMA200", (t) => t.tt && t.tt.vni > t.tt.sma200],
  ["SMA50 > SMA200 (xu huong len)", (t) => t.tt && t.tt.sma50 > t.tt.sma200],
  ["Do rong (ma > SMA50) >= 40%", (t) => t.tt?.doRong50 != null && t.tt.doRong50 >= 40],
  ["Do rong (ma > SMA50) >= 50%", (t) => t.tt?.doRong50 != null && t.tt.doRong50 >= 50],
  ["Do rong (ma > SMA50) >= 60%", (t) => t.tt?.doRong50 != null && t.tt.doRong50 >= 60],
  ["Do rong (ma > Kijun) >= 50%", (t) => t.tt?.doRongKijun != null && t.tt.doRongKijun >= 50],
  ["VN-Index > Kijun VA do rong SMA50 >= 50%", (t) => t.tt && t.tt.vni > t.tt.kijun && t.tt.doRong50 != null && t.tt.doRong50 >= 50],
  ["VN-Index > SMA50 VA do rong SMA50 >= 40%", (t) => t.tt && t.tt.vni > t.tt.sma50 && t.tt.doRong50 != null && t.tt.doRong50 >= 40],
  ["VN-Index 5 phien > 0", (t) => t.d5 != null && t.d5 > 0],
  ["VN-Index 5 phien > +1%", (t) => t.d5 != null && t.d5 > 1],
  ["VN-Index 20 phien > 0", (t) => t.d20 != null && t.d20 > 0],
  ["VN-Index cach dinh 60 phien <= 5%", (t) => t.dinh60 != null && t.dinh60 >= -5],
  ["NGUOC: VN-Index 5 phien < -3% (ban thao)", (t) => t.d5 != null && t.d5 < -3],
  ["NGUOC: do rong SMA50 < 30% (thi truong yeu)", (t) => t.tt?.doRong50 != null && t.tt.doRong50 < 30],
  ["NGUOC: VN-Index < Kijun", (t) => t.tt && t.tt.vni < t.tt.kijun],
];
const CACH = [
  ["HT  hien tai (30/30 + BAN)", { moc: HAI_TP, baoVe: true, theoSell: true }],
  ["T40 40/40 engine + Tenkan 1/2 + Kijun not", { moc: [{ w: 0.4, i: 0 }, { w: 0.4, i: 1 }], baoVe: true, theoSell: true, tk: "nua" }],
];
const QUY_UOC = [["THUC TE", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })], ["LY TUONG", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })]];
const SO_LAN = 20;
for (const [tenQU, cfgVao] of QUY_UOC) {
  for (const [tenCach, cfgCach] of CACH) {
    const kq = lenh.map((t) => mp(t, { ...cfgCach, ...cfgVao(t) }));
    console.log(`\n=========== ${tenQU} | cach ra ${tenCach} ===========`);
    console.log("Bo loc".padEnd(46), "giu".padStart(5), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "| bi loai: n".padStart(13), "lai TB".padStart(7), "| lai TB giu theo giai doan (<2019, 19-22.4, 22.5+)".padStart(48), "| 2026 (n, lai)", "| DM K=10", "K=20");
    for (const [ten, fn] of LOC) {
      const giuIdx = [], loaiIdx = [];
      lenh.forEach((t, i) => { if (!kq[i]) return; (fn(t) ? giuIdx : loaiIdx).push(i); });
      const kg = thongKe(giuIdx.map((i) => kq[i])), kl = thongKe(loaiIdx.map((i) => kq[i]));
      const ky = [[], [], []];
      giuIdx.forEach((i) => ky[kyOf(lenh[i].ngay)].push(kq[i].ret));
      const r26 = giuIdx.filter((i) => lenh[i].ngay >= "2026-01-01").map((i) => kq[i].ret);
      const dsG = giuIdx.map((i) => lenh[i]), kqG = giuIdx.map((i) => kq[i]);
      const d10 = danhMucNhieuLan(kqG, dsG, 10, SO_LAN, {});
      const d20 = danhMucNhieuLan(kqG, dsG, 20, SO_LAN, {});
      console.log(ten.padEnd(46), String(kg.n).padStart(5), f(kg.tb).padStart(7), f(kg.thang, 0).padStart(7), f(kg.pf).padStart(5), "|", String(kl.n).padStart(9), f(kl.tb).padStart(7), "|", ky.map((a) => (a.length ? f(tb(a)) : "-").padStart(7)).join(" "), "|", `${String(r26.length).padStart(3)} ${f(tb(r26)).padStart(6)}`, `| ${f(d10.cagr, 1).padStart(5)}%/${f(d10.sut, 0).padStart(2)}% ${f(d20.cagr, 1).padStart(5)}%/${f(d20.sut, 0)}%`);
    }
    // theo nhom do rong
    console.log("\n  Theo nhom do rong (% ma > SMA50 tai ngay tin hieu):");
    for (const [ten, lo, hi] of [["< 20%", 0, 20], ["20-30%", 20, 30], ["30-40%", 30, 40], ["40-50%", 40, 50], ["50-60%", 50, 60], ["60-70%", 60, 70], [">= 70%", 70, 101]]) {
      const idx = [];
      lenh.forEach((t, i) => { if (kq[i] && t.tt?.doRong50 != null && t.tt.doRong50 >= lo && t.tt.doRong50 < hi) idx.push(i); });
      const k = thongKe(idx.map((i) => kq[i]));
      const k26 = idx.filter((i) => lenh[i].ngay >= "2026-01-01").map((i) => kq[i].ret);
      console.log(`   do rong ${ten.padEnd(8)} n ${String(k.n).padStart(5)}  lai TB ${f(k.tb).padStart(6)}  thang ${f(k.thang, 0).padStart(3)}%  PF ${f(k.pf).padStart(5)}  | 22.5+: ${f(tb(idx.filter((i) => lenh[i].ngay >= "2022-05-01").map((i) => kq[i].ret))).padStart(6)} | 2026 n ${k26.length}: ${f(tb(k26))}`);
    }
  }
}
