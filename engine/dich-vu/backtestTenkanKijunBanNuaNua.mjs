// BACKTEST "THUNG TENKAN BAN NUA, THUNG KIJUN BAN NUA CUA PHAN CON LAI CHUA CHOT TP" (Hieu 27/10/2026). Lenh Mua thuong cua engine; moi lan thung (dong cua duoi duong, sau khi tung dong cua tren) ban 1/2 PHAN CON LAI luc do:
// thung Tenkan -> ban 1/2 phan con lai; thung Kijun -> ban tiep 1/2 phan con lai; phan cuoi (khoang 25% neu khong TP) cho tin hieu BAN / cat lo S / hoa von (chi khi co TP2). Cach ra trong mp: tk "nuaNua" (da sua loi ban > 100%).
//  N1 = TP1 30% + TP2 30% (engine) + thung Tenkan 1/2 + thung Kijun 1/2 (phan con)      N2 = KHONG TP, chi thung Tenkan 1/2 + thung Kijun 1/2 (phan con)     N3 = N2 nhung khong theo tin hieu BAN (phan cuoi chi cat lo S)
// Doi chieu: HT (30/30 + BAN), TK3 (30/30 + Tenkan 1/2 + Kijun ban not), KIJ (thung Kijun ban het). Co / khong loc d5 VN-Index (dong cua T) > 1%. Quy uoc THUC TE (mua mo cua phien sau, ban tu T+2) va LY TUONG; phi 0,4%.
// Chay: node engine/dich-vu/backtestTenkanKijunBanNuaNua.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa } = chayEngine({ cache, vni });
const chiSo = new Map(vni.map((b, i) => [b.t, i]));
const vc = vni.map((b) => b.c);
const lenh = tatCa.filter((t) => t.loai === 1);
for (const t of lenh) { const i = chiSo.get(t.ngay); t.d5 = i != null && i >= 5 ? (vc[i] / vc[i - 5] - 1) * 100 : null; }
const CACH = [
  ["HT  (30/30 + BAN) doi chieu", { moc: HAI_TP, baoVe: true, theoSell: true }],
  ["TK3 (30/30 + Tenkan 1/2 + Kijun not)", { moc: HAI_TP, baoVe: true, theoSell: true, tk: "nua" }],
  ["KIJ thung Kijun ban het", { moc: [], baoVe: false, theoSell: false, tk: "kijun" }],
  ["N1 30/30 + Tenkan 1/2 + Kijun 1/2 (con lai)", { moc: HAI_TP, baoVe: true, theoSell: true, tk: "nuaNua" }],
  ["N2 KHONG TP: Tenkan 1/2 + Kijun 1/2 + BAN", { moc: [], baoVe: false, theoSell: true, tk: "nuaNua" }],
  ["N3 KHONG TP: Tenkan 1/2 + Kijun 1/2, ko BAN", { moc: [], baoVe: false, theoSell: false, tk: "nuaNua" }],
];
const QUY_UOC = [["THUC TE", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })], ["LY TUONG", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })]];
const SO_LAN = 20;
for (const [tenQU, cvao] of QUY_UOC) {
  for (const [tenLoc, loc] of [["KHONG loc", () => true], ["Loc d5 > 1%", (t) => t.d5 != null && t.d5 > 1]]) {
    console.log(`\n=========== ${tenQU} | ${tenLoc} ===========`);
    console.log("Cach ra".padEnd(46), "n".padStart(5), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "| giai doan (<2019, 19-22.4, 22.5+) | 2026 (n, lai) | DM K=10 / K=20");
    for (const [ten, cfg] of CACH) {
      const ds = [], kqs = [];
      for (const t of lenh) { if (!loc(t)) continue; const r = mp(t, { ...cfg, ...cvao(t) }); if (r) { ds.push(t); kqs.push(r); } }
      const k = thongKe(kqs);
      const ky = [[], [], []];
      ds.forEach((t, i) => ky[kyOf(t.ngay)].push(kqs[i].ret));
      const r26 = ds.map((t, i) => (t.ngay >= "2026-01-01" ? kqs[i].ret : null)).filter((x) => x != null);
      const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {}), d20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, {});
      console.log(ten.padEnd(46), String(k.n).padStart(5), f(k.tb).padStart(7), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), "|", ky.map((a) => (a.length ? f(tb(a)) : "-").padStart(7)).join(" "), "|", `${String(r26.length).padStart(3)} ${f(tb(r26)).padStart(6)}`, `| ${f(d10.cagr, 1).padStart(5)}%/${f(d10.sut, 0).padStart(2)}% ${f(d20.cagr, 1).padStart(5)}%/${f(d20.sut, 0)}%`);
    }
  }
}
