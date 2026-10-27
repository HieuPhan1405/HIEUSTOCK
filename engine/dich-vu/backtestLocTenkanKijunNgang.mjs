// BACKTEST LOC DIEM VAO: BO LENH KHI TENKAN / KIJUN NAM NGANG (Hieu 27/10/2026: "khi tenkan, kijun nam ngang thi ko vao").
// Do doc: |X[iv] / X[iv-k] - 1| <= eps (%) voi X = Tenkan hoac Kijun tai dong cua ngay tin hieu, k = 3 / 5 / 10 phien; "bang tuyet doi" = eps 0 (khong doi trong k phien).
// Bo loc = LOAI lenh co duong nam ngang: Tenkan ngang, Kijun ngang, CA HAI ngang, MOT TRONG HAI ngang. Kem bo loc nguoc "chi vao khi con ngang" va "ca hai doc len > eps" de doi chieu.
// 2 cach ra: HT (30/30 + BAN), T40 (40/40 engine + Tenkan 1/2 + Kijun not); 2 quy uoc: THUC TE / LY TUONG; phi 0,4%. Chi tin khi cung huong o ca 3 giai doan + 2026.
// Chay: node engine/dich-vu/backtestLocTenkanKijunNgang.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);

// do doc % cua duong a (mang) sau k phien tai chi so i; null neu thieu du lieu
const doc = (a, i, k) => (a && a[i] != null && a[i - k] != null && a[i - k] > 0 ? (a[i] / a[i - k] - 1) * 100 : null);
for (const t of lenh) for (const k of [3, 5, 10]) { t["tk" + k] = doc(t.tenkan, t.iv, k); t["kj" + k] = doc(t.kijun, t.iv, k); }
const coD = lenh.filter((t) => t.tk5 != null && t.kj5 != null);
console.log(`${lenh.length} lenh Mua thuong; du du lieu doc: ${coD.length}`);
const phanVi = (key) => { const a = coD.map((t) => Math.abs(t[key])).sort((x, y) => x - y); return [10, 25, 50, 75, 90].map((p) => `P${p}=${f(a[Math.floor((p / 100) * a.length)], 2)}`).join(" "); };
console.log("|do doc| Tenkan 5 phien (%):", phanVi("tk5"));
console.log("|do doc| Kijun 5 phien (%):", phanVi("kj5"));
console.log("Ty le Kijun KHONG DOI hoan toan 5 phien:", f(100 * coD.filter((t) => t.kj5 === 0).length / coD.length, 1) + "%", "| Tenkan:", f(100 * coD.filter((t) => t.tk5 === 0).length / coD.length, 1) + "%");

const ngang = (key, eps) => (t) => t[key] != null && Math.abs(t[key]) <= eps;
const LOC = [["Khong loc", () => true]];
for (const [k, epsList] of [[5, [0, 0.3, 0.5, 1, 2]], [3, [0, 0.5]], [10, [0.5, 1, 2]]]) {
  for (const eps of epsList) {
    const tkN = ngang("tk" + k, eps), kjN = ngang("kj" + k, eps);
    const nhan = `${k}p, <=${eps}%`;
    LOC.push([`[${nhan}] bo khi Tenkan ngang`, (t) => t["tk" + k] != null && !tkN(t)]);
    LOC.push([`[${nhan}] bo khi Kijun ngang`, (t) => t["kj" + k] != null && !kjN(t)]);
    LOC.push([`[${nhan}] bo khi CA HAI ngang`, (t) => t["tk" + k] != null && t["kj" + k] != null && !(tkN(t) && kjN(t))]);
    LOC.push([`[${nhan}] bo khi MOT TRONG HAI ngang`, (t) => t["tk" + k] != null && t["kj" + k] != null && !tkN(t) && !kjN(t)]);
  }
}
LOC.push(["-- NGUOC: chi vao khi NGANG (5p, <=0.5%) --", null]);
LOC.push(["[5p, <=0.5%] chi khi CA HAI ngang", (t) => t.tk5 != null && t.kj5 != null && Math.abs(t.tk5) <= 0.5 && Math.abs(t.kj5) <= 0.5]);
LOC.push(["[5p, <=0.5%] chi khi Kijun ngang", (t) => t.kj5 != null && Math.abs(t.kj5) <= 0.5]);
LOC.push(["-- DOC LEN --", null]);
LOC.push(["Tenkan 5p > +0.5%", (t) => t.tk5 != null && t.tk5 > 0.5]);
LOC.push(["Kijun 5p > +0.5%", (t) => t.kj5 != null && t.kj5 > 0.5]);
LOC.push(["Tenkan > +0.5% VA Kijun > 0% (5p)", (t) => t.tk5 != null && t.kj5 != null && t.tk5 > 0.5 && t.kj5 > 0]);
LOC.push(["Tenkan > +1% VA Kijun > +0.5% (5p)", (t) => t.tk5 != null && t.kj5 != null && t.tk5 > 1 && t.kj5 > 0.5]);

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
    console.log("Bo loc".padEnd(44), "giu".padStart(5), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "| loai: n".padStart(10), "lai TB".padStart(7), "| giu theo giai doan (<2019, 19-22.4, 22.5+)".padStart(46), "| 2026 (n, lai)", "| DM K=10 / K=20");
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
      console.log(ten.padEnd(44), String(kg.n).padStart(5), f(kg.tb).padStart(7), f(kg.thang, 0).padStart(7), f(kg.pf).padStart(5), "|", String(kl.n).padStart(6), f(kl.tb).padStart(7), "|", ky.map((a) => (a.length ? f(tb(a)) : "-").padStart(7)).join(" "), "|", `${String(r26.length).padStart(3)} ${f(tb(r26)).padStart(6)}`, `| ${f(d10.cagr, 1).padStart(5)}%/${f(d10.sut, 0).padStart(2)}% ${f(d20.cagr, 1).padStart(5)}%/${f(d20.sut, 0)}%`);
    }
  }
}
