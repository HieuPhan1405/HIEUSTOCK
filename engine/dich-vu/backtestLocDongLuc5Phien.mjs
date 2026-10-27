// BACKTEST LOC DIEM VAO THEO DONG LUC 5 PHIEN CUA VN-INDEX, NHIEU NGUONG (Hieu 27/10/2026). Tiep theo backtestLocDiemVaoThiTruong.mjs (VN-Index 5 phien > +1% tot nhat).
// d5 = % thay doi VN-Index 5 phien den dong cua ngay tin hieu (khong nhin truoc). 3 phan: (1) nguong duoi d5 > x, (2) KHOANG d5 (xem co don dieu / qua nong), (3) nguong chay 3 / 10 phien de doi chieu.
// 2 cach ra: HT (30/30 + BAN) va T40 (40/40 engine + Tenkan 1/2 + Kijun not); 2 quy uoc: THUC TE (mua mo cua phien sau, ban tu T+2) va LY TUONG. Phi 0,4%. Chi tin khi cung huong o ca 3 giai doan + 2026.
// Chay: node engine/dich-vu/backtestLocDongLuc5Phien.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
const chiSo = new Map(vni.map((b, i) => [b.t, i]));
const vc = vni.map((b) => b.c);
for (const t of lenh) {
  const i = chiSo.get(t.ngay);
  if (i != null && i >= 20) for (const k of [3, 5, 10]) t["d" + k] = (vc[i] / vc[i - k] - 1) * 100;
}
const coD = lenh.filter((t) => t.d5 != null);
console.log(`${lenh.length} lenh Mua thuong; co d5: ${coD.length}`);
const phanVi = [...coD.map((t) => t.d5)].sort((a, b) => a - b);
console.log("Phan vi d5 (%):", [10, 25, 50, 75, 90].map((p) => `P${p}=${f(phanVi[Math.floor((p / 100) * phanVi.length)])}`).join(" "));

const dua = (k, lo, hi) => (t) => t[k] != null && t[k] > lo && t[k] <= hi;
const LOC = [
  ["Khong loc", () => true],
  ...[-3, -2, -1, 0, 0.5, 1, 1.5, 2, 3, 4].map((x) => [`d5 > ${x}%`, dua("d5", x, Infinity)]),
  ["-- KHOANG d5 --", null],
  ...[[-Infinity, -3], [-3, -1], [-1, 0], [0, 1], [1, 2], [2, 3], [3, 5], [5, Infinity]].map(([a, b]) => [`d5 trong (${a}, ${b}]`, dua("d5", a, b)]),
  ["-- QUA NONG: d5 > 1% nhung <= tran --", null],
  ...[3, 4, 5].map((x) => [`1% < d5 <= ${x}%`, dua("d5", 1, x)]),
  ["-- DOI CHIEU CUA SO KHAC --", null],
  ...[0, 1, 2].map((x) => [`d3 > ${x}%`, dua("d3", x, Infinity)]),
  ...[0, 2, 4].map((x) => [`d10 > ${x}%`, dua("d10", x, Infinity)]),
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
    console.log("Bo loc".padEnd(30), "giu".padStart(5), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "| loai: n".padStart(10), "lai TB".padStart(7), "| giu theo giai doan (<2019, 19-22.4, 22.5+)".padStart(46), "| 2026 (n, lai)", "| DM K=10 / K=20");
    for (const [ten, fn] of LOC) {
      if (!fn) { console.log(`  ${ten}`); continue; }
      const giuIdx = [], loaiIdx = [];
      lenh.forEach((t, i) => { if (!kq[i]) return; (fn(t) ? giuIdx : loaiIdx).push(i); });
      const kg = thongKe(giuIdx.map((i) => kq[i])), kl = thongKe(loaiIdx.map((i) => kq[i]));
      const ky = [[], [], []];
      giuIdx.forEach((i) => ky[kyOf(lenh[i].ngay)].push(kq[i].ret));
      const r26 = giuIdx.filter((i) => lenh[i].ngay >= "2026-01-01").map((i) => kq[i].ret);
      const dsG = giuIdx.map((i) => lenh[i]), kqG = giuIdx.map((i) => kq[i]);
      const d10 = danhMucNhieuLan(kqG, dsG, 10, SO_LAN, {});
      const d20 = danhMucNhieuLan(kqG, dsG, 20, SO_LAN, {});
      console.log(ten.padEnd(30), String(kg.n).padStart(5), f(kg.tb).padStart(7), f(kg.thang, 0).padStart(7), f(kg.pf).padStart(5), "|", String(kl.n).padStart(6), f(kl.tb).padStart(7), "|", ky.map((a) => (a.length ? f(tb(a)) : "-").padStart(7)).join(" "), "|", `${String(r26.length).padStart(3)} ${f(tb(r26)).padStart(6)}`, `| ${f(d10.cagr, 1).padStart(5)}%/${f(d10.sut, 0).padStart(2)}% ${f(d20.cagr, 1).padStart(5)}%/${f(d20.sut, 0)}%`);
    }
  }
}
