// BACKTEST "CU THUNG TENKAN LA CAT, KHONG CAN BIET DA CHAM TP NAO" (Hieu 27/10/2026). Lenh Mua thuong cua engine, KHONG TP1/TP2: ban het khi gia thung Tenkan (cat lo S van con). Cac bien the:
//  TEN-A  dong cua < Tenkan, chi tinh sau khi gia tung dong cua tren Tenkan ke tu luc mua (cach cu "TEN")
//  TEN-B  dong cua < Tenkan, tinh NGAY (khong can tung len tren Tenkan) - dung "cu thung la cat"
//  TEN-C  nhu A + ban theo tin hieu BAN cua he thong      TEN-D  2 phien dong cua lien tiep < Tenkan      TEN-E  cham Tenkan TRONG PHIEN (thap nhat < Tenkan, tung dong cua tren) ban o Tenkan/mo cua neu gap
//  TEN-F  nhu E nhung tinh ngay (khong can tung len)       KIJ (thung Kijun ban het) va HT (30/30 + BAN) de doi chieu. Moi bien the chay co / khong loc d5 VN-Index (dong cua T) > 1%.
// Quy uoc THUC TE (mua mo cua phien sau, ban tu chieu T+2) va LY TUONG; phi 0,4%. Chay: node engine/dich-vu/backtestThungTenkanCatHet.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa } = chayEngine({ cache, vni });
const chiSo = new Map(vni.map((b, i) => [b.t, i]));
const vc = vni.map((b) => b.c);
const lenh = tatCa.filter((t) => t.loai === 1);
for (const t of lenh) { const i = chiSo.get(t.ngay); t.d5 = i != null && i >= 5 ? (vc[i] / vc[i - 5] - 1) * 100 : null; }
const K0 = { moc: [], baoVe: false, theoSell: false };
const CACH = [
  ["HT  (30/30 + BAN) doi chieu", { moc: HAI_TP, baoVe: true, theoSell: true }],
  ["KIJ thung Kijun ban het", { ...K0, tk: "kijun" }],
  ["TEN-A dong cua<Tenkan (tung len tren)", { ...K0, tk: "tenkan" }],
  ["TEN-B dong cua<Tenkan, tinh NGAY", { ...K0, tk: "tenkan", tkKhongCanLen: true }],
  ["TEN-C = A + tin hieu BAN", { ...K0, theoSell: true, tk: "tenkan" }],
  ["TEN-D 2 phien dong cua<Tenkan lien tiep", { ...K0, tk: "tenkan2" }],
  ["TEN-E cham Tenkan trong phien (tung len)", { ...K0, tk: "tenkanCham" }],
  ["TEN-F cham Tenkan trong phien, tinh NGAY", { ...K0, tk: "tenkanCham", tkKhongCanLen: true }],
];
const QUY_UOC = [["THUC TE", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })], ["LY TUONG", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })]];
const SO_LAN = 20;
for (const [tenQU, cvao] of QUY_UOC) {
  for (const [tenLoc, loc] of [["KHONG loc", () => true], ["Loc d5 > 1%", (t) => t.d5 != null && t.d5 > 1]]) {
    console.log(`\n=========== ${tenQU} | ${tenLoc} ===========`);
    console.log("Cach ra".padEnd(42), "n".padStart(5), "lai TB".padStart(7), "trung vi".padStart(8), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "| giai doan (<2019, 19-22.4, 22.5+) | 2026 (n, lai) | DM K=10 / K=20");
    for (const [ten, cfg] of CACH) {
      const ds = [], kqs = [];
      for (const t of lenh) { if (!loc(t)) continue; const r = mp(t, { ...cfg, ...cvao(t) }); if (r) { ds.push(t); kqs.push(r); } }
      const k = thongKe(kqs);
      const ky = [[], [], []];
      ds.forEach((t, i) => ky[kyOf(t.ngay)].push(kqs[i].ret));
      const r26 = ds.map((t, i) => (t.ngay >= "2026-01-01" ? kqs[i].ret : null)).filter((x) => x != null);
      const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {}), d20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, {});
      console.log(ten.padEnd(42), String(k.n).padStart(5), f(k.tb).padStart(7), f(k.md ?? NaN).padStart(8), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), "|", ky.map((a) => (a.length ? f(tb(a)) : "-").padStart(7)).join(" "), "|", `${String(r26.length).padStart(3)} ${f(tb(r26)).padStart(6)}`, `| ${f(d10.cagr, 1).padStart(5)}%/${f(d10.sut, 0).padStart(2)}% ${f(d20.cagr, 1).padStart(5)}%/${f(d20.sut, 0)}%`);
    }
  }
}
