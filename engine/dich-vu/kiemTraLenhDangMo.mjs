// LENH CHUA DONG O CUOI DU LIEU BI BO KHOI MOI BACKTEST? (Hieu 27/10/2026: "lenh MSR 13/8/2026 co ma"). backtestChung.chayEngine mac dinh BO lenh co engine chua dong den het du lieu (jEng < 0), nen cac lenh thang dang chay (nhu MSR 13/8/2026) khong co trong ket qua,
// trong khi lenh thua cat lo nhanh thi co -> lech xuong ket qua gan day. Dung giuLenhDangMo = true + danhGiaCuoi (mp) de tinh theo gia dong cua cuoi du lieu.
// In: so lenh dang mo, lai chua chot (HT thuc te), MSR; ket qua nam 2025 / 2026 va tu 2022.5 CO / KHONG tinh lenh dang mo; co d5>1%, pos>=0,6/0,8.
// Chay: node engine/dich-vu/kiemTraLenhDangMo.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";
const vni = docJson("vnindex_dai.json");
const chiSo = new Map(vni.map((b, i) => [b.t, i])), vc = vni.map((b) => b.c);
const { lenh } = chayEngine({ cache: docJson("nen_dai.json"), vni, giuLenhDangMo: true });
const HT = { moc: HAI_TP, baoVe: true, theoSell: true }, KIJ = { moc: [], baoVe: false, theoSell: false, tk: "kijun" };
const ds = lenh.filter((t) => t.loai === 1 && t.iv >= 120);
for (const t of ds) {
  const i = chiSo.get(t.ngay);
  t.d5 = i != null && i >= 5 ? (vc[i] / vc[i - 5] - 1) * 100 : null;
  let mn = Infinity, mx = -Infinity;
  for (let k = t.iv - 119; k <= t.iv; k++) { mn = Math.min(mn, t.low[k]); mx = Math.max(mx, t.high[k]); }
  t.pos = (t.close[t.iv] - mn) / (mx - mn);
  t.rHT = mp(t, { ...HT, danhGiaCuoi: true, vao: t.iv + 1, banTu: t.iv + 3 });
  t.rKIJ = mp(t, { ...KIJ, danhGiaCuoi: true, vao: t.iv + 1, banTu: t.iv + 3 });
}
const mo = ds.filter((t) => t.dangMo && t.rHT);
console.log(`Tong ${ds.length} lenh Mua thuong (gom ${ds.filter((t) => t.dangMo).length} lenh engine CHUA DONG o cuoi du lieu). Lenh HT dang mo (tinh theo gia dong cua cuoi): ${mo.length}, lai TB ${f(tb(mo.map((t) => t.rHT.ret)))}%, lai > 10%: ${mo.filter((t) => t.rHT.ret > 10).length}, lo > 5%: ${mo.filter((t) => t.rHT.ret < -5).length}`);
console.log("Cac lenh dang mo lai nhat: " + [...mo].sort((a, b) => b.rHT.ret - a.rHT.ret).slice(0, 12).map((t) => `${t.ma} ${t.ngay.slice(5)} ${f(t.rHT.ret, 0)}%`).join(" | "));
console.log("Cac lenh dang mo lo nhat: " + [...mo].sort((a, b) => a.rHT.ret - b.rHT.ret).slice(0, 8).map((t) => `${t.ma} ${t.ngay.slice(5)} ${f(t.rHT.ret, 0)}%`).join(" | "));
const msr = ds.filter((t) => t.ma === "MSR" && t.ngay >= "2026-06-01");
console.log("MSR tu 6/2026: " + (msr.map((t) => `${t.ngay} ${t.dangMo ? "DANG MO" : "da dong"} HT ${t.rHT ? f(t.rHT.ret) + "%" : "-"} KIJ ${t.rKIJ ? f(t.rKIJ.ret) + "%" : "-"} pos ${f(t.pos, 2)} d5 ${f(t.d5, 1)}%`).join(" | ") || "khong co"));
for (const [tenC, key] of [["HT", "rHT"], ["KIJ", "rKIJ"]]) {
  console.log(`\n===== ${tenC} thuc te: KHONG tinh lenh dang mo | CO tinh (mark-to-market) =====`);
  console.log("Bo loc / giai doan".padEnd(34), "KHONG: n   lai TB | CO: n   lai TB | chenh");
  for (const [tenL, loc] of [["khong loc", () => true], ["d5>1%", (t) => t.d5 > 1], ["pos>=0,6", (t) => t.pos >= 0.6], ["pos>=0,8", (t) => t.pos >= 0.8], ["d5>1% va pos>=0,6", (t) => t.d5 > 1 && t.pos >= 0.6]]) {
    for (const [tenG, gd] of [["2025", (t) => t.ngay >= "2025-01-01" && t.ngay < "2026-01-01"], ["2026", (t) => t.ngay >= "2026-01-01"], ["tu 2022.5", (t) => t.ngay >= "2022-05-01"], ["toan ky", () => true]]) {
      const a = ds.filter((t) => loc(t) && gd(t) && t[key]);
      const kho = a.filter((t) => !t.dangMo);
      console.log(`${tenL} / ${tenG}`.padEnd(34), String(kho.length).padStart(6), f(tb(kho.map((t) => t[key].ret))).padStart(8), "|", String(a.length).padStart(6), f(tb(a.map((t) => t[key].ret))).padStart(8), "|", f(tb(a.map((t) => t[key].ret)) - tb(kho.map((t) => t[key].ret))).padStart(6));
    }
  }
}
// danh muc: 2026 va tu 2022.5 co / khong
for (const [ten, gd] of [["tu 2022.5", (t) => t.ngay >= "2022-05-01"], ["2026", (t) => t.ngay >= "2026-01-01"]]) {
  for (const [tenL, loc] of [["khong loc", () => true], ["d5>1%", (t) => t.d5 > 1]]) {
    const a = ds.filter((t) => loc(t) && gd(t) && t.rHT), kho = a.filter((t) => !t.dangMo);
    const d1 = danhMucNhieuLan(kho.map((t) => t.rHT), kho, 10, 20, {}), d2 = danhMucNhieuLan(a.map((t) => t.rHT), a, 10, 20, {});
    console.log(`DM K=10 HT ${ten} ${tenL}: khong tinh dang mo ${f(d1.cagr, 1)}%/${f(d1.sut, 0)}% -> co tinh ${f(d2.cagr, 1)}%/${f(d2.sut, 0)}%`);
  }
}
