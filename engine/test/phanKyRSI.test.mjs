// Test tay cho lib/phanKyRSI.js. Chay: node engine/test/phanKyRSI.test.mjs
import { phanKyRSI, gopNenTuan } from "../../lib/phanKyRSI.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

// Phan ky TANG: day 1 (i=5, gia 10, RSI 25), day 2 (i=15, gia 9, RSI 32)
const nen = [];
const rsiArr = [];
for (let i = 0; i < 25; i++) {
  let l = 12, rs = 50;
  if (i === 5) { l = 10; rs = 25; }
  else if (i === 15) { l = 9; rs = 32; }
  nen.push({ h: l + 1, l, c: l + 0.5 });
  rsiArr.push(rs);
}
const ev = phanKyRSI(nen, rsiArr, { k: 3 });
const tang = ev.filter((e) => e.loai === "tang");
ok("phat hien 1 phan ky tang", tang.length === 1, JSON.stringify(ev));
ok("day 1 = nen 5, day 2 = nen 15, xac nhan sau k = 3 nen", tang[0] && tang[0].i1 === 5 && tang[0].i2 === 15 && tang[0].xacNhan === 18);

// RSI khong cao hon -> khong co phan ky
const rsi2 = rsiArr.map((v, i) => (i === 15 ? 24 : v));
ok("RSI day sau thap hon -> khong phan ky tang", phanKyRSI(nen, rsi2, { k: 3 }).filter((e) => e.loai === "tang").length === 0);

// RSI day truoc cao hon nguong (rsiDay 40) -> khong tinh
const rsi3 = rsiArr.map((v, i) => (i === 5 ? 45 : i === 15 ? 50 : v));
ok("RSI day truoc > 40 -> khong tinh", phanKyRSI(nen, rsi3, { k: 3 }).filter((e) => e.loai === "tang").length === 0);

// Gop tuan: 2026-10-12 (thu hai) .. 2026-10-16 (thu sau) la 1 tuan; 2026-10-19 la tuan sau
const w = gopNenTuan([
  { t: "2026-10-12", o: 1, h: 3, l: 1, c: 2, v: 10 },
  { t: "2026-10-16", o: 2, h: 5, l: 2, c: 4, v: 20 },
  { t: "2026-10-19", o: 4, h: 6, l: 3, c: 5, v: 5 },
]);
ok("gop tuan: 2 tuan", w.length === 2);
ok("tuan 1: o=1 h=5 l=1 c=4 v=30, t = cuoi tuan", w[0].o === 1 && w[0].h === 5 && w[0].l === 1 && w[0].c === 4 && w[0].v === 30 && w[0].t === "2026-10-16");

console.log(loi ? `${loi} LOI` : "TAT CA DUNG");
process.exit(loi ? 1 : 0);
