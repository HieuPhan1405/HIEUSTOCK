// LOC KET HOP d5 VN-Index + VI TRI GIA TRONG BIEN DO 120 PHIEN, TU 2022 (Hieu 27/10/2026). Lenh Mua thuong, quy uoc THUC TE (mua mo cua phien sau, ban tu T+2), phi 0,4%; cach ra HT (30/30 + BAN) va KIJ (thung Kijun ban het).
// Luoi nguong: d5 (khong / >0% / >1% / >2%) x vi tri pos (khong / >=0,5 / 0,6 / 0,7 / 0,8 / 0,9). Theo nam cho vai to hop tieu bieu. Doi mac TU bang bien moi truong TU=YYYY-MM-DD (mac dinh 2022-01-01).
// LUU Y: cac nguong nay duoc chon khi da nhin toan bo du lieu nen day KHONG phai kiem tra ngoai mau (xem kiemTraNgoaiMauViTri120.mjs cho phan tach moc).
// Chay: node engine/dich-vu/locD5ViTri120Tu2022.mjs
import { docJson, chayEngine, danhMucNhieuLan, thongKe, tb, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const TU = process.env.TU ?? "2022-01-01";
const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa } = chayEngine({ cache, vni });
const chiSo = new Map(vni.map((b, i) => [b.t, i]));
const vc = vni.map((b) => b.c);
const CACH = { HT: { moc: HAI_TP, baoVe: true, theoSell: true }, KIJ: { moc: [], baoVe: false, theoSell: false, tk: "kijun" } };
const D = [];
for (const t of tatCa.filter((x) => x.loai === 1 && x.ngay >= TU)) {
  const i = chiSo.get(t.ngay);
  if (i == null || t.iv < 120) continue;
  const a = mp(t, { ...CACH.HT, vao: t.iv + 1, banTu: t.iv + 3 }), b = mp(t, { ...CACH.KIJ, vao: t.iv + 1, banTu: t.iv + 3 });
  if (!a || !b) continue;
  let mn = Infinity, mx = -Infinity;
  for (let k = t.iv - 119; k <= t.iv; k++) { mn = Math.min(mn, t.low[k]); mx = Math.max(mx, t.high[k]); }
  D.push({ t, ngay: t.ngay, nam: t.ngay.slice(0, 4), HT: a.ret, KIJ: b.ret, rHT: a, rKIJ: b, pos: mx > mn ? (t.close[t.iv] - mn) / (mx - mn) : null, d5: (vc[i] / (vc[i - 5] || vc[i]) - 1) * 100 });
}
const ok = D.filter((x) => x.pos != null);
const m = (a, c) => (a.length ? tb(a.map((x) => x[c])) : NaN);
const dm = (arr, c) => {
  if (arr.length < 20) return [{ cagr: NaN, sut: NaN }, { cagr: NaN, sut: NaN }];
  const kq = arr.map((x) => (c === "HT" ? x.rHT : x.rKIJ)), ds = arr.map((x) => x.t);
  return [10, 20].map((K) => danhMucNhieuLan(kq, ds, K, 20, {}));
};
console.log(`Tu ${TU}: ${ok.length} lenh | HT ${f(m(ok, "HT"))} | KIJ ${f(m(ok, "KIJ"))}`);
for (const c of ["HT", "KIJ"]) {
  console.log(`\n===== cach ra ${c} | luoi d5 x pos: n | lai TB | thang% | 2026 (n, lai) | DM K=10 =====`);
  for (const [tenD, fd] of [["khong loc d5", () => true], ["d5 > 0%", (x) => x.d5 > 0], ["d5 > 1%", (x) => x.d5 > 1], ["d5 > 2%", (x) => x.d5 > 2]]) {
    console.log(`  ${tenD}`);
    for (const th of [0, 0.5, 0.6, 0.7, 0.8, 0.9]) {
      const G = ok.filter((x) => fd(x) && x.pos >= th), G26 = G.filter((x) => x.ngay >= "2026-01-01");
      const d = dm(G, c);
      console.log(`     pos >= ${th.toFixed(1)}: n ${String(G.length).padStart(4)} | lai ${f(m(G, c)).padStart(6)} | thang ${f(100 * G.filter((x) => x[c] > 0).length / Math.max(G.length, 1), 0).padStart(2)}% | 2026 (${String(G26.length).padStart(3)}) ${f(m(G26, c)).padStart(6)} | DM K=10 ${f(d[0].cagr, 1).padStart(5)}%/${f(d[0].sut, 0).padStart(2)}% K=20 ${f(d[1].cagr, 1).padStart(5)}%/${f(d[1].sut, 0)}%`);
    }
  }
}
for (const [ten, fn] of [["d5 > 1% VA pos >= 0,6", (x) => x.d5 > 1 && x.pos >= 0.6], ["d5 > 1% VA pos >= 0,8", (x) => x.d5 > 1 && x.pos >= 0.8]]) {
  console.log(`\n===== THEO NAM: ${ten} (HT | KIJ), tat ca vs giu =====`);
  for (const nam of [...new Set(ok.map((x) => x.nam))].sort()) {
    const A = ok.filter((x) => x.nam === nam), G = A.filter(fn);
    console.log(`  ${nam}: tat ca ${String(A.length).padStart(4)} HT ${f(m(A, "HT")).padStart(6)} KIJ ${f(m(A, "KIJ")).padStart(6)} | giu ${String(G.length).padStart(4)} HT ${f(m(G, "HT")).padStart(6)} KIJ ${f(m(G, "KIJ")).padStart(6)} | tong HT giu ${f(G.reduce((s, x) => s + x.HT, 0), 0)}`);
  }
}
{
  const fn = (x) => x.d5 > 1 && x.pos >= 0.6;
  const G = ok.filter(fn), B = ok.filter((x) => !fn(x));
  const sap = [...B].sort((a, b) => b.HT - a.HT);
  console.log(`\n===== d5 > 1% VA pos >= 0,6: bi bo ${B.length}, giu ${G.length}. HT lenh BI BO lai nhat / lo nhat =====`);
  console.log("  " + sap.slice(0, 12).map((x) => `${x.ngay.slice(0, 7)} ${x.t.ma} ${f(x.HT, 0)}% (d5 ${f(x.d5, 1)}, pos ${f(x.pos, 2)})`).join(" | "));
  console.log("  " + sap.slice(-8).map((x) => `${x.ngay.slice(0, 7)} ${x.t.ma} ${f(x.HT, 0)}%`).join(" | "));
  const lon = (a) => a.filter((x) => x.HT >= 10).length;
  console.log(`  Lenh lai >= 10%: bi bo ${lon(B)}/${B.length} (${f(100 * lon(B) / B.length, 0)}%), duoc giu ${lon(G)}/${G.length} (${f(100 * lon(G) / G.length, 0)}%)`);
}
