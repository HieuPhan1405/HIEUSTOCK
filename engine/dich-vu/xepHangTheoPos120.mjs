// "LOC CUNG" HAY "UU TIEN"? (Hieu 27/10/2026: "nhung vay bi mat lenh MSR a"). Loc cung pos >= nguong loai lenh nhu MSR 13/8/2026 (pos 0,32). Thay vao do: giu MOI lenh nhung (a) uu tien lenh pos cao khi nhieu lenh cung ngay tranh cho trong danh muc (xepHang),
// (b) von lenh theo pos (trongSo: pos >= 0,8 day du, 0,6-0,8 0,6, duoi 0,6 0,3; so cho tinh theo tong trong so). So voi khong uu tien va loc cung. HT thuc te, tu 1/5/2022 (va rieng 2026), co lenh dang mo, DM K=10 / K=20, 20 lan xao tron.
// Chay: node engine/dich-vu/xepHangTheoPos120.mjs
import { docJson, chayEngine, danhMucNhieuLan, tb, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";
const vni = docJson("vnindex_dai.json");
const chiSo = new Map(vni.map((b, i) => [b.t, i])), vc = vni.map((b) => b.c);
const { lenh } = chayEngine({ cache: docJson("nen_dai.json"), vni, giuLenhDangMo: true });
const HT = { moc: HAI_TP, baoVe: true, theoSell: true };
const D = lenh.filter((t) => t.loai === 1 && t.iv >= 120);
for (const t of D) {
  let mn = Infinity, mx = -Infinity;
  for (let k = t.iv - 119; k <= t.iv; k++) { mn = Math.min(mn, t.low[k]); mx = Math.max(mx, t.high[k]); }
  t.pos = (t.close[t.iv] - mn) / (mx - mn);
  const i = chiSo.get(t.ngay);
  t.d5 = i != null && i >= 5 ? (vc[i] / vc[i - 5] - 1) * 100 : null;
  t.r = mp(t, { ...HT, danhGiaCuoi: true, vao: t.iv + 1, banTu: t.iv + 3 });
}
const PHUONG_AN = [
  ["Khong uu tien (thu tu ngau nhien)", {}],
  ["Loc cung pos >= 0,6", { loc: (t) => t.pos >= 0.6 }],
  ["Loc cung pos >= 0,8", { loc: (t) => t.pos >= 0.8 }],
  ["UU TIEN theo pos (khong loai lenh nao)", { xepHang: (t) => t.pos }],
  ["UU TIEN theo pos + d5>1% truoc", { xepHang: (t) => t.pos + (t.d5 > 1 ? 1 : 0) }],
  ["Von theo pos (>=0,8: 1 | 0,6-0,8: 0,6 | <0,6: 0,3)", { trongSo: (t) => (t.pos >= 0.8 ? 1 : t.pos >= 0.6 ? 0.6 : 0.3), choTheoVon: true }],
  ["Uu tien theo pos + von theo pos", { xepHang: (t) => t.pos, trongSo: (t) => (t.pos >= 0.8 ? 1 : t.pos >= 0.6 ? 0.6 : 0.3), choTheoVon: true }],
];
for (const [ten, gd] of [["tu 1/5/2022", (t) => t.ngay >= "2022-05-01"], ["rieng 2026", (t) => t.ngay >= "2026-01-01"]]) {
  const ds = D.filter((t) => gd(t) && t.r), kq = ds.map((t) => t.r);
  console.log(`\n===== ${ten} (${ds.length} lenh, HT thuc te, co lenh dang mo) =====`);
  console.log("Phuong an".padEnd(56), "DM K=10: CAGR  sut  lay | K=20: CAGR  sut  lay");
  for (const [tenPA, o] of PHUONG_AN) {
    const a = danhMucNhieuLan(kq, ds, 10, 20, o), b = danhMucNhieuLan(kq, ds, 20, 20, o);
    console.log(tenPA.padEnd(56), `${f(a.cagr, 1).padStart(6)}% ${f(a.sut, 0).padStart(3)}% ${f(a.lay, 0).padStart(4)} | ${f(b.cagr, 1).padStart(6)}% ${f(b.sut, 0).padStart(3)}% ${f(b.lay, 0).padStart(4)}`);
  }
}
const msr = D.find((t) => t.ma === "MSR" && t.ngay === "2026-08-13");
console.log(`\nMSR 13/8/2026: pos ${f(msr.pos, 2)}, d5 ${f(msr.d5, 1)}%, HT ${f(msr.r.ret)}% (dang mo). Cung ngay co ${D.filter((t) => t.ngay === "2026-08-13").length} lenh Mua thuong.`);
