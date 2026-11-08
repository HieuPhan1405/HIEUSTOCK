// Test tay cho lib/goiCot.js. Chay: node engine/test/goiCot.test.mjs
import { donCot, moCot } from "../../lib/goiCot.js";
let loi = 0;
const ok = (ten, dk, them = "") => { if (!dk) { loi++; console.log("SAI:", ten, them); } else console.log("ok:", ten); };
const ds = [
  { ma: "FPT", gia: 62.638149999999996, doi: -3.97, san: "HOSE", rsi14: null, dem: 7 },
  { ma: "HPG", gia: 25.3, nganh: "Thep", rsi14: 41.123456789 },
  { ma: "VIC" },
];
const g = donCot(ds);
ok("cot chi gom truong co gia tri", JSON.stringify(g.cot) === JSON.stringify(["ma", "gia", "doi", "san", "dem", "nganh", "rsi14"]), JSON.stringify(g.cot));
ok("lam tron 6 chu so co nghia", g.hang[0][1] === 62.6381 && g.hang[1][6] === 41.1235, JSON.stringify(g.hang));
ok("bo null cuoi dong", g.hang[2].length === 1 && g.hang[0].length === 5);
const m = moCot(g);
ok("mo lai dung doi tuong (bo null)", JSON.stringify(m[0]) === JSON.stringify({ ma: "FPT", gia: 62.6381, doi: -3.97, san: "HOSE", dem: 7 }) && JSON.stringify(m[2]) === '{"ma":"VIC"}' && m[1].nganh === "Thep");
ok("so nguyen, chuoi, true/false giu nguyen", JSON.stringify(moCot(donCot([{ a: 5, b: "x", c: true, d: false }]))) === '[{"a":5,"b":"x","c":true,"d":false}]');
ok("goi hong -> mang rong", moCot(null).length === 0 && moCot({}).length === 0);
console.log(loi ? `\n${loi} LOI` : "\nTat ca dat.");
process.exit(loi ? 1 : 0);
