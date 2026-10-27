// LIET KE LENH BI BO khi loc d5 VN-Index > 1% (Hieu 27/10/2026: "tu T6 den nay bo lenh nao lai lon ko"). Mac dinh tu 2026-06-01; doi bang TU=YYYY-MM-DD, nguong bang NGUONG=1.
// Cach ra T40 (40/40 engine + Tenkan 1/2 + Kijun not), quy uoc THUC TE (mua mo cua phien sau, ban tu T+2) va LY TUONG; phi 0,4%.
import { docJson, chayEngine, thongKe, tb, f } from "./backtestChung.mjs";
import { mp } from "./moPhongTK.mjs";

const TU = process.env.TU ?? "2026-06-01";
const NGUONG = Number(process.env.NGUONG ?? 1);
const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1 && t.ngay >= TU);
const chiSo = new Map(vni.map((b, i) => [b.t, i]));
const vc = vni.map((b) => b.c);
for (const t of lenh) { const i = chiSo.get(t.ngay); t.d5 = i != null && i >= 5 ? (vc[i] / vc[i - 5] - 1) * 100 : null; }
const T40 = { moc: [{ w: 0.4, i: 0 }, { w: 0.4, i: 1 }], baoVe: true, theoSell: true, tk: "nua" };
const QUY_UOC = [["THUC TE", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })], ["LY TUONG", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })]];
console.log(`Tu ${TU}: ${lenh.length} lenh Mua thuong; nguong d5 > ${NGUONG}%`);
for (const [ten, cv] of QUY_UOC) {
  const kq = lenh.map((t) => mp(t, { ...T40, ...cv(t) }));
  const giu = [], bo = [];
  lenh.forEach((t, i) => { if (!kq[i]) return; ((t.d5 != null && t.d5 > NGUONG) ? giu : bo).push({ t, k: kq[i] }); });
  const kg = thongKe(giu.map((x) => x.k)), kb = thongKe(bo.map((x) => x.k));
  console.log(`\n===== ${ten} (T40) =====`);
  console.log(`GIU: n ${kg.n}, lai TB ${f(kg.tb)}%, thang ${f(kg.thang, 0)}%, tong ${f(giu.reduce((s, x) => s + x.k.ret, 0), 0)} diem % | BO: n ${kb.n}, lai TB ${f(kb.tb)}%, thang ${f(kb.thang, 0)}%, tong ${f(bo.reduce((s, x) => s + x.k.ret, 0), 0)} diem %`);
  const sap = [...bo].sort((a, b) => b.k.ret - a.k.ret);
  console.log("  Lenh BI BO lai nhat:");
  for (const x of sap.slice(0, 15)) console.log(`   ${x.t.ngay} ${x.t.ma.padEnd(5)} d5 ${f(x.t.d5).padStart(5)}%  lai ${f(x.k.ret).padStart(6)}%  giu ${f(x.k.phien, 1)} phien`);
  console.log("  Lenh BI BO lo nhat:");
  for (const x of sap.slice(-8).reverse()) console.log(`   ${x.t.ngay} ${x.t.ma.padEnd(5)} d5 ${f(x.t.d5).padStart(5)}%  lai ${f(x.k.ret).padStart(6)}%`);
  const lonBo = bo.filter((x) => x.k.ret >= 10).length, lonGiu = giu.filter((x) => x.k.ret >= 10).length;
  console.log(`  So lenh lai >= +10%: bi bo ${lonBo}/${bo.length} (${f(100 * lonBo / bo.length, 0)}%), duoc giu ${lonGiu}/${giu.length} (${f(100 * lonGiu / giu.length, 0)}%)`);
  const theoThang = new Map();
  for (const x of [...giu.map((y) => ({ ...y, g: 1 })), ...bo.map((y) => ({ ...y, g: 0 }))]) {
    const th = x.t.ngay.slice(0, 7);
    const a = theoThang.get(th) ?? { giu: [], bo: [] };
    a[x.g ? "giu" : "bo"].push(x.k.ret);
    theoThang.set(th, a);
  }
  console.log("  Theo thang:  thang | giu n / lai TB | bo n / lai TB");
  for (const [th, a] of [...theoThang].sort()) console.log(`   ${th} | ${String(a.giu.length).padStart(3)} / ${a.giu.length ? f(tb(a.giu)).padStart(6) : "     -"} | ${String(a.bo.length).padStart(3)} / ${a.bo.length ? f(tb(a.bo)).padStart(6) : "     -"}`);
}
