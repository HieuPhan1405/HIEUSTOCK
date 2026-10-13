// Test tay cho engine/loi/topGia.js. Chay: node engine/test/topGia.test.mjs
import { tinhTiLeMua } from "../loi/topGia.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-6) => a != null && b != null && Math.abs(a - b) < e;

// Vi du that tu man hinh dat lenh ANV: mua 25.500 + 30.900 + 22.700 = 79.100; ban 1.200 + 4.300 + 4.000 = 9.500 -> 89,28% mua.
const anv = { bid: [{ price: 18.2, qtty: 25500 }, { price: 18.15, qtty: 30900 }, { price: 18.1, qtty: 22700 }], offer: [{ price: 18.25, qtty: 1200 }, { price: 18.35, qtty: 4300 }, { price: 18.4, qtty: 4000 }] };
const r = tinhTiLeMua(anv);
ok("tong mua 3 gia = 79.100, tong ban = 9.500", r.mua3 === 79100 && r.ban3 === 9500);
ok("ti le mua = 89,28% (khop man hinh app)", gan(r.tiLe, 89.2776, 1e-3), r.tiLe);
ok("chi lay 3 buoc gia dau", tinhTiLeMua({ bid: [{ qtty: 1 }, { qtty: 1 }, { qtty: 1 }, { qtty: 1000 }], offer: [{ qtty: 3 }] }).mua3 === 3);
ok("chi co ben mua -> 100%", tinhTiLeMua({ bid: [{ qtty: 10 }], offer: [] }).tiLe === 100);
ok("chi co ben ban -> 0%", tinhTiLeMua({ bid: [], offer: [{ qtty: 10 }] }).tiLe === 0);
ok("khong co lenh nao -> null", tinhTiLeMua({ bid: [], offer: [] }) === null);
ok("thieu truong / khong hop le -> null", tinhTiLeMua(null) === null && tinhTiLeMua({}) === null && tinhTiLeMua({ bid: "x", offer: [] }) === null);
ok("qtty chuoi / thieu van doc duoc", gan(tinhTiLeMua({ bid: [{ qtty: "30" }], offer: [{ qtty: "70" }, {}] }).tiLe, 30));

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
