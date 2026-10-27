// BACKTEST DO NHAY CUA GIA VAO (Hieu 27/10/2026: "kho mua o gia mo cua lam"). Lenh Mua thuong, tin hieu dong cua ngay T, mua phien T+1 (iv+1), ban tu chieu T+3 (banTu iv+3).
// Cac mo hinh gia vao: mo cua (co so) | mo cua + truot 0,5 / 1 / 2% (khop xau hon) | TB OHLC phien T+1 (~ VWAP, vao suot phien) | DONG CUA T+1 (ATC) | mo cua nhung BO NEU gap len > 2% / > 1% so voi dong cua T (khong duoi gia).
// Moi mo hinh chay voi/khong bo loc VN-Index 5 phien > 1% (d5 tai dong cua T), 2 cach ra: HT (30/30 + BAN) va T40 (40/40 + Tenkan 1/2 + Kijun not). Phi 0,4%. Gia vao E co dinh; muc TP/cat lo giu nguyen tuyet doi (TP engine).
// Chay: node engine/dich-vu/backtestGiaVaoThucTe.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
const chiSo = new Map(vni.map((b, i) => [b.t, i]));
const vc = vni.map((b) => b.c);
for (const t of lenh) { const i = chiSo.get(t.ngay); t.d5 = i != null && i >= 5 ? (vc[i] / vc[i - 5] - 1) * 100 : null; }

const gap = (t) => (t.open[t.iv + 1] / t.close[t.iv] - 1) * 100;
const vaoMoCua = (s) => (t) => ({ vao: t.iv + 1, banTu: t.iv + 3, E: t.open[t.iv + 1] * (1 + s / 100) });
const MH = [
  ["Mo cua T+1 (co so)", vaoMoCua(0)],
  ["Mo cua + truot 0,5%", vaoMoCua(0.5)],
  ["Mo cua + truot 1%", vaoMoCua(1)],
  ["Mo cua + truot 2%", vaoMoCua(2)],
  ["TB OHLC T+1 (~VWAP)", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3, E: (t.open[t.iv + 1] + t.high[t.iv + 1] + t.low[t.iv + 1] + t.close[t.iv + 1]) / 4 })],
  ["DONG CUA T+1 (ATC)", (t) => ({ vao: t.iv + 2, banTu: t.iv + 3, E: t.close[t.iv + 1] })],
  ["Mo cua, BO neu gap > +2%", (t) => (gap(t) > 2 ? null : vaoMoCua(0)(t))],
  ["Mo cua, BO neu gap > +1%", (t) => (gap(t) > 1 ? null : vaoMoCua(0)(t))],
];
const CACH = [
  ["HT  (30/30 + BAN)", { moc: HAI_TP, baoVe: true, theoSell: true }],
  ["T40 (40/40 + Tenkan 1/2 + Kijun not)", { moc: [{ w: 0.4, i: 0 }, { w: 0.4, i: 1 }], baoVe: true, theoSell: true, tk: "nua" }],
];
const SO_LAN = 20;
for (const [tenCach, cfgCach] of CACH) {
  for (const [tenLoc, loc] of [["KHONG loc d5", () => true], ["Loc d5 > 1%", (t) => t.d5 != null && t.d5 > 1]]) {
    console.log(`\n=========== cach ra ${tenCach} | ${tenLoc} ===========`);
    console.log("Mo hinh gia vao".padEnd(28), "n".padStart(5), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "| giai doan (<2019, 19-22.4, 22.5+)".padStart(40), "| 2026 (n, lai)", "| DM K=10 / K=20");
    for (const [ten, cv] of MH) {
      const ds = [], kqs = [];
      for (const t of lenh) {
        if (!loc(t)) continue;
        const c = cv(t);
        if (!c) continue;
        const r = mp(t, { ...cfgCach, ...c });
        if (!r) continue;
        ds.push(t); kqs.push(r);
      }
      const k = thongKe(kqs);
      const ky = [[], [], []];
      ds.forEach((t, i) => ky[kyOf(t.ngay)].push(kqs[i].ret));
      const r26 = ds.map((t, i) => (t.ngay >= "2026-01-01" ? kqs[i].ret : null)).filter((x) => x != null);
      const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {}), d20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, {});
      console.log(ten.padEnd(28), String(k.n).padStart(5), f(k.tb).padStart(7), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), "|", ky.map((a) => (a.length ? f(tb(a)) : "-").padStart(7)).join(" "), "|", `${String(r26.length).padStart(3)} ${f(tb(r26)).padStart(6)}`, `| ${f(d10.cagr, 1).padStart(5)}%/${f(d10.sut, 0).padStart(2)}% ${f(d20.cagr, 1).padStart(5)}%/${f(d20.sut, 0)}%`);
    }
  }
}
