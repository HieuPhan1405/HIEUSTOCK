// BACKTEST DOI QUY MO VI THE THEO DONG LUC 5 PHIEN VN-INDEX (Hieu 27/10/2026: "test thu doi quy mo vi the theo d5").
// Vao MOI lenh Mua thuong nhu cu, nhung so von cua lenh = (von / K) x w(d5). w < 1 = vao it hon (phan von con lai de trong, khong dung cho lenh khac); w > 1 = vao nhieu hon (co the > 100% von khi du K vi the manh -> dong bay, ghi ro).
// d5 = % VN-Index 5 phien den dong cua ngay tin hieu. Danh muc: K = 10 / 20 vi the dong thoi, xao tron thu tu 20 lan (danhMucNhieuLan, tuyChon.trongSo). CAGR trong cung cua so thoi gian voi "Khong doi" nen so sanh duoc; them CAGR/sut de xem hieu qua tren rui ro.
// Quy mo thuc te: cung tap lenh, chi doi w -> khac "loc" o cho lenh yeu van vao (it hon) thay vi bo han. Luu y: ca w co dinh (khong loc) chiem tron von cho vi the yeu nen khong co hieu ung "dung von cho lenh khac".
// Chay: node engine/dich-vu/backtestQuyMoTheoDongLuc5Phien.mjs
import { docJson, chayEngine, danhMucNhieuLan, thongKe, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
const chiSo = new Map(vni.map((b, i) => [b.t, i]));
const vc = vni.map((b) => b.c);
for (const t of lenh) { const i = chiSo.get(t.ngay); t.d5 = i != null && i >= 5 ? (vc[i] / vc[i - 5] - 1) * 100 : null; }
const kep = (x, a, b) => Math.min(b, Math.max(a, x));
const lop = (yeu, ngVua, ng) => (t) => (t.d5 == null ? 1 : t.d5 > ng ? 1 : t.d5 > ngVua ? yeu.vua : yeu.yeu);
const SCHEMES = [
  ["Khong doi (w = 1)", () => 1],
  ["Loc han d5 > 1% (yeu = 0)", (t) => (t.d5 == null || t.d5 > 1 ? 1 : 0)],
  ["Loc han d5 > 0% (yeu = 0)", (t) => (t.d5 == null || t.d5 > 0 ? 1 : 0)],
  ["d5 <= 1%: w 0,25", (t) => (t.d5 == null || t.d5 > 1 ? 1 : 0.25)],
  ["d5 <= 1%: w 0,5", (t) => (t.d5 == null || t.d5 > 1 ? 1 : 0.5)],
  ["d5 <= 1%: w 0,75", (t) => (t.d5 == null || t.d5 > 1 ? 1 : 0.75)],
  ["d5 <= 0%: w 0,5", (t) => (t.d5 == null || t.d5 > 0 ? 1 : 0.5)],
  ["3 muc: d5>1 1 | 0..1 0,5 | <=0 0,25", lop({ vua: 0.5, yeu: 0.25 }, 0, 1)],
  ["3 muc: d5>1 1 | 0..1 0,6 | <=0 0,3", lop({ vua: 0.6, yeu: 0.3 }, 0, 1)],
  ["Doc lien tuc w = ker(0,5 + 0,25 d5; 0,25..1)", (t) => (t.d5 == null ? 1 : kep(0.5 + 0.25 * t.d5, 0.25, 1))],
  ["Doc lien tuc w = ker(0,4 + 0,3 d5; 0,2..1)", (t) => (t.d5 == null ? 1 : kep(0.4 + 0.3 * t.d5, 0.2, 1))],
  ["[DON BAY] d5>1: 1,5 | con lai 1 (toi da 150% von)", (t) => (t.d5 == null || t.d5 <= 1 ? 1 : 1.5)],
  ["[DON BAY] d5>1: 1,5 | con lai 0,5", (t) => (t.d5 == null ? 1 : t.d5 > 1 ? 1.5 : 0.5)],
];
const CACH = [
  ["HT  hien tai (30/30 + BAN)", { moc: HAI_TP, baoVe: true, theoSell: true }],
  ["T40 40/40 engine + Tenkan 1/2 + Kijun not", { moc: [{ w: 0.4, i: 0 }, { w: 0.4, i: 1 }], baoVe: true, theoSell: true, tk: "nua" }],
];
const QUY_UOC = [["THUC TE", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })], ["LY TUONG", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })]];
const TAP = [["Toan ky", () => true], ["Tu 2022.5", (t) => t.ngay >= "2022-05-01"], ["Rieng 2026", (t) => t.ngay >= "2026-01-01"]];
const SO_LAN = 20;
for (const [tenQU, cfgVao] of QUY_UOC) {
  for (const [tenCach, cfgCach] of CACH) {
    const kqAll = lenh.map((t) => mp(t, { ...cfgCach, ...cfgVao(t) }));
    for (const [tenTap, loc] of TAP) {
      const idx = lenh.map((_, i) => i).filter((i) => kqAll[i] && loc(lenh[i]));
      const ds = idx.map((i) => lenh[i]), kqs = idx.map((i) => kqAll[i]);
      console.log(`\n=========== ${tenQU} | ${tenCach} | ${tenTap} (${ds.length} lenh) ===========`);
      console.log("Quy mo".padEnd(50), "| DEM LENH K=10: CAGR sut | THEO VON K=10: CAGR sut CAGR/sut von dung | K=20: CAGR sut CAGR/sut | lai TB/lenh");
      for (const [ten, w] of SCHEMES) {
        const oA = { trongSo: w }, oB = { trongSo: w, choTheoVon: true };
        const a10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, oA);
        const b10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, oB), b20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, oB);
        let sw = 0, swr = 0;
        ds.forEach((t, i) => { const x = w(t); sw += x; swr += x * kqs[i].ret; });
        console.log(
          ten.padEnd(50), "|",
          (f(a10.cagr, 1) + "%").padStart(7), (f(a10.sut, 0) + "%").padStart(5), "|",
          (f(b10.cagr, 1) + "%").padStart(7), (f(b10.sut, 0) + "%").padStart(5), f(b10.sut > 0 ? b10.cagr / b10.sut : NaN, 2).padStart(8), (f(100 * sw / ds.length, 0) + "%").padStart(6), "|",
          (f(b20.cagr, 1) + "%").padStart(7), (f(b20.sut, 0) + "%").padStart(5), f(b20.sut > 0 ? b20.cagr / b20.sut : NaN, 2).padStart(8), "|",
          f(sw > 0 ? swr / sw : NaN).padStart(6),
        );
      }
    }
  }
}
