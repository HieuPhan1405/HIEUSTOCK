// Liet ke lenh BI BO / DUOC GIU khi loc "vi tri trong bien do 120 phien >= NGUONG" (mac dinh 0,8) tu mot ngay (mac dinh 2026-01-01). HT (30/30 + BAN) thuc te (mua mo cua phien sau, ban tu T+2), phi 0,4%.
// Doi bang bien moi truong: TU=2026-01-01 NGUONG=0.8 CACH=HT|KIJ D5=1 (them dieu kien d5 VN-Index 5 phien > D5 %). Chay: node engine/dich-vu/lietKeLenhBiBoViTri120.mjs
import { docJson, chayEngine, tb, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";
const TU = process.env.TU ?? "2026-01-01", NG = Number(process.env.NGUONG ?? 0.8), CACH = process.env.CACH === "KIJ" ? "KIJ" : "HT";
const cfg = CACH === "KIJ" ? { moc: [], baoVe: false, theoSell: false, tk: "kijun" } : { moc: HAI_TP, baoVe: true, theoSell: true };
const vniD = docJson("vnindex_dai.json"), chiSo = new Map(vniD.map((b, i) => [b.t, i])), D5 = process.env.D5 != null ? Number(process.env.D5) : null;
const { lenh } = chayEngine({ cache: docJson("nen_dai.json"), vni: vniD });
const D = [];
for (const t of lenh.filter((x) => x.loai === 1 && x.ngay >= TU && x.iv >= 120)) {
  const r = mp(t, { ...cfg, vao: t.iv + 1, banTu: t.iv + 3 });
  if (!r) continue;
  let mn = Infinity, mx = -Infinity;
  for (let k = t.iv - 119; k <= t.iv; k++) { mn = Math.min(mn, t.low[k]); mx = Math.max(mx, t.high[k]); }
  const i = chiSo.get(t.ngay), d5 = i >= 5 ? (vniD[i].c / vniD[i - 5].c - 1) * 100 : null;
  if (D5 != null && !(d5 > D5)) continue;
  D.push({ ngay: t.ngay, ma: t.ma, ret: r.ret, phien: r.phien, pos: (t.close[t.iv] - mn) / (mx - mn), d5 });
}
const giu = D.filter((x) => x.pos >= NG), bo = D.filter((x) => x.pos < NG);
const sum = (a) => a.reduce((s, x) => s + x.ret, 0);
console.log(`Tu ${TU}, cach ra ${CACH}, giu pos >= ${NG}: tong ${D.length} lenh | GIU ${giu.length}: lai TB ${f(tb(giu.map((x) => x.ret)))}%, tong ${f(sum(giu), 0)} | BO ${bo.length}: lai TB ${f(tb(bo.map((x) => x.ret)))}%, thang ${f(100 * bo.filter((x) => x.ret > 0).length / bo.length, 0)}%, tong ${f(sum(bo), 0)}`);
const dong = (x) => `${x.ngay} ${x.ma.padEnd(4)} pos ${f(x.pos, 2)} d5 ${f(x.d5, 1)}% lai ${f(x.ret).padStart(6)}% (${f(x.phien, 0)} phien)`;
const sap = [...bo].sort((a, b) => b.ret - a.ret);
console.log("\nLENH LAI NHAT BI BO:"); sap.slice(0, 15).forEach((x) => console.log("  " + dong(x)));
console.log("\nLENH LO NHIEU NHAT BI BO:"); sap.slice(-15).reverse().forEach((x) => console.log("  " + dong(x)));
console.log("\nCAC LENH DUOC GIU:"); [...giu].sort((a, b) => b.ret - a.ret).forEach((x) => console.log("  " + dong(x)));
const kh = [[-Infinity, -10], [-10, -5], [-5, 0], [0, 5], [5, 10], [10, Infinity]];
console.log("\nPhan bo lai/lo (bi bo | duoc giu):");
for (const [lo, hi] of kh) console.log(`  ${lo === -Infinity ? "lo > 10%" : hi === Infinity ? "lai >= 10%" : `${lo}..${hi}%`}`.padEnd(14), String(bo.filter((x) => x.ret >= lo && x.ret < hi).length).padStart(4), "|", String(giu.filter((x) => x.ret >= lo && x.ret < hi).length).padStart(3));
