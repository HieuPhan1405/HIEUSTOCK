// Test tay cho engine/loi/mang.js + engine/loi/ichimoku.js - trong tam kiem tra chieu dich
// SenkouA/B (de bi lam nguoc chieu neu doi dau -shift <-> +shift).
import { hhv, llv, ref } from "../loi/mang.js";
import { tinhIchimoku } from "../loi/ichimoku.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => a != null && b != null && Math.abs(a - b) < e;

// ---- hhv/llv/ref co ban ----
{
  const a = [5, 8, 3, 9, 2, 7];
  ok("hhv(a,3)[2] = max(5,8,3) = 8", gan(hhv(a, 3)[2], 8));
  ok("hhv(a,3)[5] = max(9,2,7) = 9", gan(hhv(a, 3)[5], 9));
  ok("llv(a,3)[2] = min(5,8,3) = 3", gan(llv(a, 3)[2], 3));
  ok("hhv/llv 2 nen dau chua du du lieu -> null", hhv(a, 3)[0] == null && hhv(a, 3)[1] == null);
  ok("ref(a,-1)[3] = gia tri 1 nen TRUOC = a[2] = 3", gan(ref(a, -1)[3], 3));
  ok("ref(a,-1)[0] = null (khong co nen truoc do)", ref(a, -1)[0] == null);
}

// ---- SenkouA/B phai la gia tri Tenkan/Kijun cua SHIFT phien TRUOC (dich ve tuong lai khi ve
// chart, nhung trong mang du lieu la Ref(X, -shift): gia tri tai nen i lay tu nen i-shift). ----
{
  // Tenkan/Kijun cung do dai (2) de de tinh tay; shift = 3.
  const high = [10, 12, 14, 16, 18, 20, 22];
  const low = [8, 9, 10, 11, 12, 13, 14];
  const { tenkan, senkouA, senkouAGoc } = tinhIchimoku({ high, low }, { tenkanLen: 2, kijunLen: 2, senkouBLen: 2, shift: 3 });
  // senkouAGoc[i] = (Tenkan[i]+Kijun[i])/2 = Tenkan[i] (Tenkan==Kijun vi cung tham so).
  ok("senkouAGoc == Tenkan khi Tenkan/Kijun cung do dai", gan(senkouAGoc[5], tenkan[5]));
  // senkouA[i] phai bang senkouAGoc[i-shift], TUC LA gia tri CU HON, khong phai moi hon.
  ok("senkouA[5] = senkouAGoc[5-3] = senkouAGoc[2] (dich VE QUA KHU trong mang, khong phai tuong lai)", gan(senkouA[5], senkouAGoc[2]));
  ok("senkouA[0..2] chua du du lieu (i-shift < 0) -> null", senkouA[0] == null && senkouA[1] == null && senkouA[2] == null);
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
