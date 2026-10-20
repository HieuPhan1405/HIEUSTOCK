// Test engine/loi/volNhipChinh.js - vol TB nhip chinh truoc phien tin hieu (luat VAO: bo lenh Mua thuong khi >= nguong).
import { tinhVolNhipChinhTruoc } from "../loi/volNhipChinh.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b) => Math.abs(a - b) < 1e-9;

// 30 nen: dinh cao nhat o nen 10 (high 120), nen 11-19 chinh xuong voi relVol 1.5; nen 20 la phien tin hieu
{
  const n = 30;
  const high = new Array(n).fill(100);
  const relVol = new Array(n).fill(1);
  high[10] = 120;
  for (let j = 11; j <= 19; j++) relVol[j] = 1.5;
  const v = tinhVolNhipChinhTruoc({ high, relVol }, { soNen: 20 });
  ok("thieu du lieu (i < soNen + 2) -> null", v[0] === null && v[21] === null);
  ok("nen 22: dinh nen 10 (trong 20 nen truoc), TB relVol nen 11..21", v[22] !== null);
  // nen 20: cua so 0..19, dinh nen 10, TB relVol nen 11..19 = 1.5 -> nhung i=20 < soNen+2=22 nen null; dung nen 22 voi relVol 11..21
  relVol[20] = 2.0; relVol[21] = 0.5;
  const w = tinhVolNhipChinhTruoc({ high, relVol }, { soNen: 20 });
  const mongDoi = (9 * 1.5 + 2.0 + 0.5) / 11;
  ok("nen 22: TB relVol cac phien 11..21 (khong tinh nen 22)", gan(w[22], mongDoi), `got ${w[22]} want ${mongDoi}`);
}

// dinh la nen ngay truoc (chua chinh) -> lay relVol cua nen do
{
  const n = 30;
  const high = new Array(n).fill(100);
  const relVol = new Array(n).fill(1);
  high[24] = 130; relVol[24] = 2.2;
  const v = tinhVolNhipChinhTruoc({ high, relVol }, { soNen: 20 });
  ok("dinh o nen i-1 -> relVol cua nen i-1", gan(v[25], 2.2));
}

// dinh nam ngoai cua so soNen nen khong duoc tinh
{
  const n = 40;
  const high = new Array(n).fill(100);
  const relVol = new Array(n).fill(1);
  high[2] = 200; relVol[2] = 9;
  high[20] = 101;
  for (let j = 21; j < 30; j++) relVol[j] = 3;
  const v = tinhVolNhipChinhTruoc({ high, relVol }, { soNen: 20 });
  // nen 30: cua so 10..29, dinh nen 20 (101), TB relVol 21..29 = 3
  ok("dinh ngoai cua so bi bo qua; TB nhip chinh tu dinh trong cua so", gan(v[30], 3), `got ${v[30]}`);
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
