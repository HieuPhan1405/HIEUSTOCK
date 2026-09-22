// Port AFL dong 163-170: TrendScore/MomScore/MFScore/TotalScore.
// LUU Y: neu 1 chi bao dau vao con null (chua du du lieu, vd may/duong can bang dai han o vai
// chuc nen dau tien), thanh phan diem tuong ung tra ve 0 (khong cong/tru) thay vi coi nhu qua
// nguong - JS coerce null thanh 0 khi so sanh (">"/"<") se cho ket qua SAI (vd "gia > null" luon
// dung), nen phai kiem tra null tuong minh truoc moi phep so sanh trong file nay.
export function tinhDiem({ close, cloudTop, cloudBot, cbTop, cbBot, tenkan, kijun, adx, diPlus, diMinus, rsi, mfi, relVol }) {
  const n = close.length;
  const trendScore = new Array(n).fill(null);
  const momScore = new Array(n).fill(null);
  const mfScore = new Array(n).fill(null);
  const totalScore = new Array(n).fill(null);

  for (let i = 0; i < n; i++) {
    const c = close[i];

    let phanMay = 0;
    if (cloudTop[i] != null && c > cloudTop[i]) phanMay = 1;
    else if (cloudBot[i] != null && c < cloudBot[i]) phanMay = -1;

    let phanCB = 0;
    if (cbTop[i] != null && c > cbTop[i]) phanCB = 1;
    else if (cbBot[i] != null && c < cbBot[i]) phanCB = -1;

    let phanTenkanKijun = -0.5;
    if (tenkan[i] != null && kijun[i] != null) phanTenkanKijun = tenkan[i] > kijun[i] ? 0.5 : -0.5;

    let phanADX = 0;
    if (adx[i] != null && adx[i] > 25 && diPlus[i] != null && diMinus[i] != null) phanADX = diPlus[i] > diMinus[i] ? 0.5 : -0.5;

    const trend = phanMay + phanCB + phanTenkanKijun + phanADX;
    trendScore[i] = trend;

    let mom = -0.5;
    if (rsi[i] != null) {
      if (rsi[i] > 70) mom = -0.5;
      else if (rsi[i] < 30) mom = 0.5;
      else mom = rsi[i] > 50 ? 0.5 : -0.5;
    }
    momScore[i] = mom;

    let mf = -0.5;
    if (mfi[i] != null) {
      if (mfi[i] > 80) mf = -0.5;
      else if (mfi[i] < 20) mf = 0.5;
      else mf = mfi[i] > 50 ? 0.5 : -0.5;
    }
    let phanRelVol = 0;
    if (relVol[i] != null) {
      if (relVol[i] > 1.5) phanRelVol = 0.5;
      else if (relVol[i] < 0.5) phanRelVol = -0.3;
    }
    mfScore[i] = mf + phanRelVol;

    totalScore[i] = trendScore[i] * 1.5 + mfScore[i] * 1.2 + momScore[i] * 1.0;
  }

  return { trendScore, momScore, mfScore, totalScore };
}
