// Test tay cho engine/loi/taChiBao.js - doi chieu voi vi du tinh tay tung buoc (khong co
// AmiBroker de doi chieu truc tiep trong giai doan nay, nen tu tinh bang cong thuc Wilder chuan
// tren 1 chuoi nho de kiem tra dung cong thuc/dung chi so, TRUOC KHI doi chieu that voi Explore
// o Giai doan 1 cua ke hoach). Chay: node engine/test/taChiBao.test.mjs
import { atr, rsi } from "../loi/taChiBao.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-3) => a != null && b != null && Math.abs(a - b) < e;

// ---- ATR(3), tinh tay bang phan so (xem chu thich trong dau file neu can doi chieu lai) ----
{
  const high = [10, 12, 11, 13, 14];
  const low = [8, 9, 9, 10, 11];
  const close = [9, 11, 10, 12, 13];
  const a = atr({ high, low, close }, 3);
  ok("ATR: 2 nen dau chua du du lieu -> null", a[0] == null && a[1] == null);
  ok("ATR[2] = trung binh cong 3 TR dau = 7/3", gan(a[2], 7 / 3), a[2]);
  ok("ATR[3] = ATR[2]*2/3 + TR[3]/3 = 23/9", gan(a[3], 23 / 9), a[3]);
  ok("ATR[4] = ATR[3]*2/3 + TR[4]/3 = 73/27", gan(a[4], 73 / 27), a[4]);
}

// ---- RSI(3), tinh tay tung buoc bang cong thuc Wilder ----
{
  const close = [10, 11, 10.5, 12, 11.5, 13];
  const r = rsi({ close }, 3);
  ok("RSI: chua du du lieu (chi so 0,1,2) -> null", r[0] == null && r[1] == null && r[2] == null);
  ok("RSI[3] = 100-100/(1+ (2.5/3)/(0.5/3)) = 500/6 = 83.333", gan(r[3], 500 / 6, 1e-2), r[3]);
  ok("RSI[4] xap xi 66.667 (tinh tay Wilder tung buoc)", gan(r[4], 66.667, 1e-2), r[4]);
  ok("RSI[5] xap xi 82.456 (tinh tay Wilder tung buoc)", gan(r[5], 82.456, 1e-2), r[5]);
}

// ---- RSI: chuoi tang deu mai -> RSI tien ve 100 (khong co loss nao) ----
{
  const close = Array.from({ length: 20 }, (_, i) => 100 + i);
  const r = rsi({ close }, 14);
  ok("RSI chuoi tang deu -> 100 (loss luon = 0)", gan(r[r.length - 1], 100, 1e-6), r[r.length - 1]);
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
