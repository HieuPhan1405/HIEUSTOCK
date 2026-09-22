// Test tay cho engine/loi/diem.js - vai truong hop tinh tay theo dung cong thuc AFL dong 163-170.
import { tinhDiem } from "../loi/diem.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => a != null && b != null && Math.abs(a - b) < e;

// Nen 0: du du lieu, tat ca thanh phan cung chieu tang.
// Nen 1: thieu het du lieu (may/CB/ADX/RSI/MFI/RelVol deu null).
// Nen 2: ADX dung bang 25 (bien) -> KHONG > 25 -> phanADX = 0.
const dauVao = {
  close: [110, 50, 100],
  cloudTop: [100, null, 90],
  cloudBot: [90, null, 80],
  cbTop: [105, null, 90],
  cbBot: [95, null, 80],
  tenkan: [20, null, 20],
  kijun: [15, null, 15],
  adx: [30, null, 25],
  diPlus: [25, null, 25],
  diMinus: [20, null, 20],
  rsi: [75, null, 75],
  mfi: [85, null, 85],
  relVol: [2, null, 2],
};

const { trendScore, momScore, mfScore, totalScore } = tinhDiem(dauVao);

ok("nen 0: TrendScore = 1(may)+1(CB)+0.5(tenkan>kijun)+0.5(ADX>25,DI+>DI-) = 3.0", gan(trendScore[0], 3.0), trendScore[0]);
ok("nen 0: MomScore = RSI>70 -> -0.5", gan(momScore[0], -0.5), momScore[0]);
ok("nen 0: MFScore = (MFI>80 -> -0.5) + (RelVol>1.5 -> +0.5) = 0", gan(mfScore[0], 0), mfScore[0]);
ok("nen 0: TotalScore = 3.0*1.5 + 0*1.2 + (-0.5)*1.0 = 4.0", gan(totalScore[0], 4.0), totalScore[0]);

ok("nen 1: thieu du lieu -> TrendScore = 0+0-0.5+0 = -0.5", gan(trendScore[1], -0.5), trendScore[1]);
ok("nen 1: thieu du lieu -> MomScore mac dinh -0.5", gan(momScore[1], -0.5));
ok("nen 1: thieu du lieu -> MFScore mac dinh -0.5", gan(mfScore[1], -0.5));
ok("nen 1: TotalScore = -0.5*1.5 + -0.5*1.2 + -0.5*1.0 = -1.85", gan(totalScore[1], -1.85), totalScore[1]);

ok("nen 2: ADX dung bang 25 (khong > 25) -> phanADX = 0 -> TrendScore = 1+1+0.5+0 = 2.5", gan(trendScore[2], 2.5), trendScore[2]);

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
