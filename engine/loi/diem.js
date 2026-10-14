// Port AFL dong 163-170: TrendScore/MomScore/MFScore/TotalScore.
// LUU Y: neu 1 chi bao dau vao con null (chua du du lieu, vd may/duong can bang dai han o vai
// chuc nen dau tien), thanh phan diem tuong ung tra ve 0 (khong cong/tru) thay vi coi nhu qua
// nguong - JS coerce null thanh 0 khi so sanh (">"/"<") se cho ket qua SAI (vd "gia > null" luon
// dung), nen phai kiem tra null tuong minh truoc moi phep so sanh trong file nay.
// DIEM DONG LUONG tu RSI. Mac dinh (rsiTren 70, rsiDuoi 30, khong vung dem) = AFL goc: RSI > 70 -> -0,5; < 30 -> +0,5; con lai > 50 -> +0,5, khac -> -0,5.
// Tuy chon NGHIEN CUU (khong dung production, chi de backtest - xem engine/dich-vu/nghienCuuVungDemRSI.mjs): vungDem > 0 lam ranh gioi tren / duoi mem:
//   kieu "trungTinh": RSI nam trong (nguong - vungDem, nguong + vungDem) -> diem 0 (khong cong / tru);
//   kieu "tre" (hysteresis): doi trang thai chi khi vuot nguong +- vungDem, o giua giu trang thai cua nen truoc.
// Ham bac thang MEM (cho nghien cuu): giaTri[k] ap dung cho x trong [nguong[k-1], nguong[k]); quanh moi nguong +- d thi noi tuyen tinh giua 2 gia tri ke nhau (d = 0 -> bac thang cung nhu AFL).
export function buocMem(x, nguong, giaTri, d) {
  if (d > 0) for (let k = 0; k < nguong.length; k++) {
    if (x > nguong[k] - d && x < nguong[k] + d) return giaTri[k] + ((x - (nguong[k] - d)) / (2 * d)) * (giaTri[k + 1] - giaTri[k]);
  }
  let k = 0; while (k < nguong.length && x >= nguong[k]) k++;
  return giaTri[k];
}
export function tinhMomTuRSI(rsi, { rsiTren = 70, rsiDuoi = 30, vungDem = 0, kieuDem = "cung" } = {}) {
  const n = rsi.length;
  const mom = new Array(n).fill(-0.5);
  let quaMua = false, quaBan = false;
  for (let i = 0; i < n; i++) {
    const r = rsi[i];
    if (r == null) { mom[i] = -0.5; continue; }
    const giua = r > 50 ? 0.5 : -0.5;
    if (kieuDem === "docTatCa") {
      // ca 3 vach (30 / 50 / 70) deu noi doc: <30 +0,5 | 30-50 -0,5 | 50-70 +0,5 | >70 -0,5
      mom[i] = buocMem(r, [rsiDuoi, 50, rsiTren], [0.5, -0.5, 0.5, -0.5], vungDem);
    } else if (kieuDem === "doc" && vungDem > 0) {
      // doc lien tuc: diem doi dan tu muc "binh thuong" (giua) sang -0,5 trong (rsiTren - vungDem, rsiTren + vungDem); tuong tu phia duoi quanh rsiDuoi (-> +0,5)
      let m = giua;
      if (r >= rsiTren + vungDem) m = -0.5;
      else if (r > rsiTren - vungDem) m = giua + ((r - (rsiTren - vungDem)) / (2 * vungDem)) * (-0.5 - giua);
      if (r <= rsiDuoi - vungDem) m = 0.5;
      else if (r < rsiDuoi + vungDem) m = 0.5 + ((r - (rsiDuoi - vungDem)) / (2 * vungDem)) * (giua - 0.5);
      mom[i] = m;
    } else if (kieuDem === "quaMua0") {
      mom[i] = r > rsiTren ? 0 : r < rsiDuoi ? 0.5 : giua; // qua mua chi mat diem cong (0), khong bi tru
    } else if (vungDem <= 0 || kieuDem === "cung") {
      mom[i] = r > rsiTren ? -0.5 : r < rsiDuoi ? 0.5 : giua;
    } else if (kieuDem === "trungTinh") {
      if (Math.abs(r - rsiTren) < vungDem || Math.abs(r - rsiDuoi) < vungDem) mom[i] = 0;
      else mom[i] = r >= rsiTren + vungDem ? -0.5 : r <= rsiDuoi - vungDem ? 0.5 : giua;
    } else {
      if (r > rsiTren + vungDem) quaMua = true;
      else if (r < rsiTren - vungDem) quaMua = false;
      if (r < rsiDuoi - vungDem) quaBan = true;
      else if (r > rsiDuoi + vungDem) quaBan = false;
      mom[i] = quaMua ? -0.5 : quaBan ? 0.5 : giua;
    }
  }
  return mom;
}

export function tinhDiem({ close, cloudTop, cloudBot, cbTop, cbBot, tenkan, kijun, adx, diPlus, diMinus, rsi, mfi, relVol, momCauHinh, mfiVungDem = 0 }) {
  const n = close.length;
  const trendScore = new Array(n).fill(null);
  const momScore = new Array(n).fill(null);
  const mfScore = new Array(n).fill(null);
  const totalScore = new Array(n).fill(null);
  const momTuRSI_ = tinhMomTuRSI(rsi, momCauHinh);

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

    momScore[i] = momTuRSI_[i];

    let mf = -0.5;
    if (mfi[i] != null) {
      if (mfiVungDem > 0) mf = buocMem(mfi[i], [20, 50, 80], [0.5, -0.5, 0.5, -0.5], mfiVungDem);
      else if (mfi[i] > 80) mf = -0.5;
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
