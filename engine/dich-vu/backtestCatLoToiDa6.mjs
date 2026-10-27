// CAT LO TOI DA 6% TINH TU GIA VAO THUC (Hieu 27/10/2026: "muc cat lo cua toi max 6%"). Cat lo cua engine S tinh tu gia moc E; khi mua o mo cua phien sau cao hon E thi khoang cach thuc > 6% (TB 6,3%, toi 20%).
// So sanh: (1) cat lo engine (S) nhu cu, (2) S' = max(S, gia vao thuc x 0,94). Cach ra HT; THUC TE (mua mo cua phien sau, ban tu T+2: trong luc chua duoc ban van co the gap qua cat lo) va LY TUONG; co/khong loc d5>1% va pos>=0,6/0,8; phi 0,4%.
// Chay: node engine/dich-vu/backtestCatLoToiDa6.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";
const vni = docJson("vnindex_dai.json");
const chiSo = new Map(vni.map((b, i) => [b.t, i])), vc = vni.map((b) => b.c);
const { lenh: tatCa } = chayEngine({ cache: docJson("nen_dai.json"), vni });
const lenh = tatCa.filter((t) => t.loai === 1 && t.iv >= 120);
for (const t of lenh) {
  const i = chiSo.get(t.ngay);
  t.d5 = i != null && i >= 5 ? (vc[i] / vc[i - 5] - 1) * 100 : null;
  let mn = Infinity, mx = -Infinity;
  for (let k = t.iv - 119; k <= t.iv; k++) { mn = Math.min(mn, t.low[k]); mx = Math.max(mx, t.high[k]); }
  t.pos = (t.close[t.iv] - mn) / (mx - mn);
}
const HT = { moc: HAI_TP, baoVe: true, theoSell: true };
const QUY_UOC = [["THUC TE", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })], ["LY TUONG", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })]];
const LOC = [["khong loc", () => true], ["d5>1%", (t) => t.d5 > 1], ["pos>=0,6", (t) => t.pos >= 0.6], ["pos>=0,8", (t) => t.pos >= 0.8], ["d5>1% va pos>=0,6", (t) => t.d5 > 1 && t.pos >= 0.6]];
for (const [tenQU, cvao] of QUY_UOC) {
  console.log(`\n=========== ${tenQU} | HT ===========`);
  console.log("Loc / cat lo".padEnd(38), "n".padStart(5), "lai TB".padStart(7), "thang%".padStart(7), "lo>6,5%".padStart(8), "lo>10%".padStart(7), "| 22.5+ | 2026 (n, lai) | DM K=10 / K=20");
  for (const [tenLoc, loc] of LOC) {
    for (const [tenCL, cl] of [["cat lo engine", {}], ["cat lo toi da 6% tu gia vao", { catLoToiDaPct: 6 }]]) {
      const ds = [], kqs = [];
      for (const t of lenh) { if (!loc(t)) continue; const r = mp(t, { ...HT, ...cl, ...cvao(t) }); if (r) { ds.push(t); kqs.push(r); } }
      const k = thongKe(kqs);
      const r22 = ds.map((t, i) => (kyOf(t.ngay) === 2 ? kqs[i].ret : null)).filter((x) => x != null), r26 = ds.map((t, i) => (t.ngay >= "2026-01-01" ? kqs[i].ret : null)).filter((x) => x != null);
      const d10 = danhMucNhieuLan(kqs, ds, 10, 20, {}), d20 = danhMucNhieuLan(kqs, ds, 20, 20, {});
      console.log(`${tenLoc} / ${tenCL}`.padEnd(38), String(k.n).padStart(5), f(k.tb).padStart(7), f(k.thang, 0).padStart(7), String(kqs.filter((r) => r.ret < -6.5).length).padStart(8), String(kqs.filter((r) => r.ret < -10).length).padStart(7), "|", f(tb(r22)).padStart(6), `| ${String(r26.length).padStart(3)} ${f(tb(r26)).padStart(6)} | ${f(d10.cagr, 1).padStart(5)}%/${f(d10.sut, 0).padStart(2)}% ${f(d20.cagr, 1).padStart(5)}%/${f(d20.sut, 0)}%`);
    }
  }
}
