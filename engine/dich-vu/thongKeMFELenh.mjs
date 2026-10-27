// MFE (muc lai lon nhat toi da trong luc giu) cua lenh Mua thuong he thong: lam co so chon moc chot loi THEO QUY LUAT (phan vi cua MFE) thay vi so co dinh.
// Vao mo cua phien sau tin hieu; theo doi den khi cham cat lo S (tinh trong ngay, tu phien vao) hoac toi da 20 phien; MFE = cao nhat / gia vao - 1. Chay: node engine/dich-vu/thongKeMFELenh.mjs
import { docJson, chayEngine, tb, f } from "./backtestChung.mjs";
const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
const kq = [];
for (const t of lenh) {
  const vao = t.iv + 1;
  const E = t.open[vao];
  if (!(E > 0) || !(t.S < E)) continue;
  let mfe = 0, jMfe = vao;
  for (let j = vao; j < Math.min(t.n, vao + 20); j++) {
    if (t.low[j] <= t.S && j > vao) break;
    if (t.high[j] > E * (1 + mfe)) { mfe = t.high[j] / E - 1; jMfe = j; }
    if (t.low[j] <= t.S) break;
  }
  kq.push({ t, E, mfe: mfe * 100, jMfe: jMfe - vao, r: (mfe * E) / (E - t.S), atr: (mfe * E) / t.atr[t.iv], ngay: t.ngay });
}
const pc = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * q))]; };
console.log(`${kq.length} lenh. MFE trong 20 phien (cao nhat / gia vao - 1), den khi cham cat lo:`);
for (const [ten, loc] of [["Toan bo", () => true], ["Tu 2022.5", (x) => x.ngay >= "2022-05-01"], ["Rieng 2026", (x) => x.ngay >= "2026-01-01"]]) {
  const a = kq.filter(loc);
  const m = a.map((x) => x.mfe);
  console.log(`\n${ten} (n ${a.length}): MFE trung vi ${f(pc(m, 0.5))}%, p25 ${f(pc(m, 0.25))}%, p75 ${f(pc(m, 0.75))}%, p90 ${f(pc(m, 0.9))}%; so phien den dinh trung vi ${pc(a.map((x) => x.jMfe), 0.5)}`);
  console.log("  ty le lenh cham duoc: " + [3, 5, 8, 10, 15, 20].map((p) => `+${p}%: ${f((m.filter((x) => x >= p).length / m.length) * 100, 0)}%`).join("  |  ") + "   |   " + [0.5, 1, 1.5, 2, 3].map((r) => `${r}R: ${f((a.filter((x) => x.r >= r).length / a.length) * 100, 0)}%`).join("  ") + "   |   " + [1, 1.5, 2, 3, 4].map((r) => `${r}ATR: ${f((a.filter((x) => x.atr >= r).length / a.length) * 100, 0)}%`).join("  "));
}
