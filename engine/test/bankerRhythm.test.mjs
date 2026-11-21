// Test tay cho lib/bankerRhythm.js. Chay: node engine/test/bankerRhythm.test.mjs
import { bankerRhythm, BKR_KHOI_DAU } from "../../lib/bankerRhythm.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => a != null && b != null && Math.abs(a - b) < e;

const n = 150;
const c = Array.from({ length: n }, (_, i) => 100 + Math.sin(i / 6) * 10 + i * 0.05);
const o = c.map((v, i) => (i ? c[i - 1] : v));
const h = c.map((v) => v + 1);
const l = c.map((v) => v - 1);
const b = bankerRhythm(o, h, l, c);

ok("do dai bang dau vao, nhung nen khoi dau null", b.rauTren.length === n && b.rauTren.slice(0, BKR_KHOI_DAU).every((v) => v === null) && b.rauTren[BKR_KHOI_DAU] != null);
ok("2 rau doi xung: rauDuoi = 38 * 0,01 - rauTren", b.rauTren.slice(BKR_KHOI_DAU).every((v, i) => gan(b.rauDuoi[i + BKR_KHOI_DAU], 0.38 - v, 1e-9)));
ok("rau tren gan 0..~38 khi chuoi dao dong", b.rauTren.slice(BKR_KHOI_DAU).every((v) => v > -20 && v < 60), JSON.stringify([Math.min(...b.rauTren.slice(BKR_KHOI_DAU)), Math.max(...b.rauTren.slice(BKR_KHOI_DAU))]));
// gia tang deu: gia dong cua luon gan dinh bien do 15 phien -> rau tach ra (lon); giam deu -> thu vao (nho)
const tang = Array.from({ length: 80 }, (_, i) => 100 + i);
const giam = Array.from({ length: 80 }, (_, i) => 200 - i);
const bt = bankerRhythm(tang, tang.map((v) => v + 0.5), tang.map((v) => v - 0.5), tang);
const bg = bankerRhythm(giam, giam.map((v) => v + 0.5), giam.map((v) => v - 0.5), giam);
ok("gia tang deu: rau tach ra (rau tren lon hon luc gia giam deu)", bt.rauTren[79] > bg.rauTren[79] + 10, `${bt.rauTren[79]} vs ${bg.rauTren[79]}`);
ok("BridgeT trong khoang hop ly [-30, 130]", b.bridge.slice(BKR_KHOI_DAU).every((v) => v > -30 && v < 130));
ok("buyA chi nhan 0 hoac 30", b.buyA.every((v) => v === 0 || v === 30));
ok("buyB la boolean, chi o noi trend vuot 5 tu duoi", b.buyB.every((v, i) => !v || (b.trend[i] >= 5 && b.trend[i - 1] < 5)));
ok("khong co NaN trong ket qua", [b.rauTren, b.rauDuoi, b.bridge, b.trend].every((a) => a.every((v) => v === null || Number.isFinite(v))));
const hang = new Array(80).fill(10);
const bh = bankerRhythm(hang, hang, hang, hang);
ok("gia hang so khong gay NaN", [bh.rauTren, bh.bridge, bh.trend].every((a) => a.every((v) => v === null || Number.isFinite(v))));

console.log(loi ? `\n${loi} LOI` : "\nTAT CA DAT");
process.exit(loi ? 1 : 0);
