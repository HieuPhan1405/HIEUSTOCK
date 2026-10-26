// RRG tinh o trinh duyet (lib/rrgTinh.js) phai gan voi RRG engine (tuan, n = 10) tu cung du lieu - chenh lech nho vi chi so ngay can bang lai moi ngay con chi so tuan can bang moi tuan.
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { tinhRRG, gocRRG, gopTuan } from "../../lib/rrgTinh.js";

const j = JSON.parse(readFileSync(new URL("../output/rrg_nganh.json", import.meta.url), "utf8"));
let lech = 0, n = 0, saiGoc = 0;
for (const k of j.ketQua) {
  const p = tinhRRG(j.chuoi.ngay, j.chuoi.nganh[k.nganh], j.chuoi.tb, { khung: "W", cuaSo: 10, duoi: 8 }).at(-1);
  lech = Math.max(lech, Math.abs(p.ratio - k.ratio));
  if (gocRRG(p.ratio, p.mom) !== k.goc) saiGoc++;
  n++;
}
console.log(`${n} nganh: lech RS-Ratio lon nhat ${lech.toFixed(2)}, sai goc ${saiGoc}`);
assert.ok(lech < 1.5, "RS-Ratio lech qua nhieu so voi engine");
assert.ok(saiGoc <= 3);
// gop tuan: ngay thu 6 va thu 2 tuan sau khac tuan; cuoi tuan lay phien cuoi
const g = gopTuan(["2026-10-12", "2026-10-13", "2026-10-16", "2026-10-19"], [1, 2, 3, 4]);
assert.deepEqual(g.ngay, ["2026-10-16", "2026-10-19"]);
assert.deepEqual(g.chuoi[0], [3, 4]);
// du lieu thieu -> mang rong
assert.deepEqual(tinhRRG(["2026-10-12"], [1], [1], { khung: "D", cuaSo: 10 }), []);
console.log("rrgTinh OK");
