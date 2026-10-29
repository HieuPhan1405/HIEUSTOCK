// Test tay: node engine/test/bangNhomChuDe.test.mjs
import { chiSoNhomTheoNgay } from "../../lib/bangNhomChuDe.js";
let loi = 0;
const dat = (ten, dk, them = "") => { if (dk) console.log("ok:", ten); else { console.log("SAI:", ten, them); loi++; } };
const gan = (a, b, e = 1e-9) => Math.abs(a - b) <= e;
// chi so nhom theo ngay
{
  const ngay = ["d1", "d2", "d3", "d4"];
  const b = {
    A: [{ t: "d1", c: 10 }, { t: "d2", c: 11 }, { t: "d3", c: 11 }, { t: "d4", c: 12.1 }], // +10%, 0, +10%
    B: [{ t: "d2", c: 20 }, { t: "d3", c: 18 }, { t: "d4", c: 18 }], // khong co d1: d2 chi co A; d3 -10%; d4 0
  };
  const ci = chiSoNhomTheoNgay(ngay, ["A", "B", "ZZ"], b);
  dat("chi so nhom: do dai bang so ngay, d1 = 100", ci.length === 4 && ci[0] === 100);
  dat("d2: chi A co du 2 ngay -> +10% = 110", gan(ci[1], 110, 1e-6), ci[1]);
  dat("d3: A 0%, B -10% -> trung binh -5% -> 104,5", gan(ci[2], 104.5, 1e-6), ci[2]);
  dat("d4: A +10%, B 0% -> +5% -> 109,725", gan(ci[3], 109.725, 1e-3), ci[3]);
  dat("khong ma nao co gia -> null", chiSoNhomTheoNgay(ngay, ["X"], {}) === null);
}
console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
