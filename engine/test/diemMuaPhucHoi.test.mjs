// Test tay cho engine/loi/diemMuaPhucHoi.js (diem B). Chay: node engine/test/diemMuaPhucHoi.test.mjs
import { tinhDiemMuaPhucHoi } from "../loi/diemMuaPhucHoi.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

// 100 nen: di ngang 100 (0..39), giam deu xuong 78 (40..59, ~22% tu dinh, day nen 59), hoi len 78 -> 88 (60..99). Tenkan / Kijun dung tay: duoi gia tu nen 70.
const n = 100;
const close = [];
for (let i = 0; i < n; i++) close.push(i < 40 ? 100 : i < 60 ? 100 - (i - 39) * 1.1 : 78 + (i - 59) * 0.25);
const high = close.map((c) => c + 0.5);
const low = close.map((c) => c - 0.5);
const volume = close.map(() => 1e6); // gtgd = gia x 1e6 / 1e6 ~ 80-100 ty
const atr = close.map(() => 2);
const tenkan = close.map((c, i) => (i < 70 ? c + 1 : c - 1));
const kijun = close.map((c, i) => (i < 70 ? c + 2 : c - 2));
const nul = close.map(() => null);

const { laB } = tinhDiemMuaPhucHoi({ high, low, close, volume, atr, tenkan, kijun, cloudTop: nul, cbTop: nul });
// `gan` chi tinh diem B trong 10 nen cuoi: cat chuoi o nen 75 (diem B cach 5 nen).
const cat = (a) => a.slice(0, 76);
const { gan } = tinhDiemMuaPhucHoi({ high: cat(high), low: cat(low), close: cat(close), volume: cat(volume), atr: cat(atr), tenkan: cat(tenkan), kijun: cat(kijun), cloudTop: cat(nul), cbTop: cat(nul) });
const iB = laB.findIndex(Boolean);
ok("co diem B", iB >= 70, `iB=${iB}`);
ok("chi 1 diem B moi nhip hoi (cach nhau >= 15 nen)", laB.filter(Boolean).length === 1);
ok("diem B la nen dau tien dong cua len tren Tenkan va Kijun", iB === 70, `iB=${iB}`);
ok("gan = diem B vua tim, cach 5 nen", gan && gan.i === iB && gan.gia === close[iB] && gan.cach === 5, JSON.stringify(gan));
ok("diem B cu hon 10 nen khong con la gan", tinhDiemMuaPhucHoi({ high, low, close, volume, atr, tenkan, kijun, cloudTop: nul, cbTop: nul }).gan === null);
ok("SL duoi gia vao toi thieu 3,5% va khong qua 6%", gan.sl <= gan.gia * (1 - 0.035) + 1e-9 && gan.sl >= gan.gia * (1 - 0.06) - 1e-9, `sl=${gan?.sl}`);
ok("day = day thap nhat 20 nen", Math.abs(gan.day - Math.min(...low.slice(iB - 19, iB + 1))) < 1e-9);

// Muc giam ngoai [20%, 30%): giam ~12% va giam ~35% deu KHONG co diem B (nghien cuu: 10-20% khong co loi the, >= 30% mat dan)
for (const [ten, day] of [["giam ~12%", 88], ["giam ~35%", 65]]) {
  const cl = [];
  for (let i = 0; i < n; i++) cl.push(i < 40 ? 100 : i < 60 ? 100 - (i - 39) * ((100 - day) / 20) : day + (i - 59) * 0.25);
  const r = tinhDiemMuaPhucHoi({ high: cl.map((x) => x + 0.5), low: cl.map((x) => x - 0.5), close: cl, volume, atr, tenkan: cl.map((x, i) => (i < 70 ? x + 1 : x - 1)), kijun: cl.map((x, i) => (i < 70 ? x + 2 : x - 2)), cloudTop: nul, cbTop: nul });
  ok(`${ten}: khong co diem B`, !r.laB.some(Boolean));
}
ok("KL deu nhau: KL quanh day = 1x", Math.abs(gan.klDay - 1) < 1e-9, `klDay=${gan?.klDay}`);
{
  // KL phien day (nen 59) gap 3 lan -> KL quanh day = 3x
  const vol = cat(volume).map((x, i) => (i === 59 ? 3e6 : x));
  const r = tinhDiemMuaPhucHoi({ high: cat(high), low: cat(low), close: cat(close), volume: vol, atr: cat(atr), tenkan: cat(tenkan), kijun: cat(kijun), cloudTop: cat(nul), cbTop: cat(nul) });
  ok("ban thao co KL o day: KL quanh day = 3x", r.gan && Math.abs(r.gan.klDay - 3) < 1e-9, `klDay=${r.gan?.klDay}`);
}
ok("gan.giam trong [20, 30)", gan.giam >= 20 && gan.giam < 30, `giam=${gan?.giam}`);

// Khong co boi canh giam: khong co diem B
const dichVuPhang = close.map(() => 100);
const phang = tinhDiemMuaPhucHoi({
  high: dichVuPhang.map((c) => c + 0.5), low: dichVuPhang.map((c) => c - 0.5), close: dichVuPhang, volume, atr,
  tenkan: dichVuPhang.map((c) => c - 1), kijun: dichVuPhang.map((c) => c - 2), cloudTop: nul, cbTop: nul,
});
ok("gia di ngang: khong co diem B", !phang.laB.some(Boolean) && phang.gan === null);

// GTGD thap (< 3 ty): khong co diem B
const mong = tinhDiemMuaPhucHoi({ high, low, close, volume: close.map(() => 1000), atr, tenkan, kijun, cloudTop: nul, cbTop: nul });
ok("thanh khoan thap: khong co diem B", !mong.laB.some(Boolean));

if (loi) {
  console.log(`\n${loi} loi`);
  process.exit(1);
}
console.log("\nTat ca dat");
