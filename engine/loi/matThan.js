// Port AFL dong 210-233: "Mat Than" - canh bao PHU/tham khao (KHONG tu dong kich hoat Ban).
// Dinh pivot (cao nhat trong +-5 nen) nam TREN may; sau do gia hoi VE trong may (cham ca CloudTop
// va CloudBot) MA khong bat len lai qua Tenkan trong 5 nen ke tu luc hoi vao -> canh bao, CHI khi
// lan hoi vao may xay ra GAN CUOI du lieu (trong 5 nen cuoi) - tranh canh bao cho su kien da qua lau.
// { high, low, close, cloudTop, cloudBot, tenkan } (cung do dai) -> mang boolean.
export function tinhMatThan({ high, low, close, cloudTop, cloudBot, tenkan }) {
  const n = high.length;
  const canhBao = new Array(n).fill(false);

  for (let i = 5; i < n - 5; i++) {
    let laPivotCao = true;
    for (let k = 1; k <= 5; k++) {
      if (high[i] < high[i - k] || high[i] < high[i + k]) {
        laPivotCao = false;
        break;
      }
    }
    if (!laPivotCao || !(cloudTop[i] != null && high[i] > cloudTop[i])) continue;

    let vaoMayTai = -1;
    const gioiHanJ = Math.min(i + 26, n - 1);
    for (let j = i + 1; j <= gioiHanJ; j++) {
      if (low[j] <= cloudTop[i] && high[j] >= cloudBot[i]) {
        vaoMayTai = j;
        break;
      }
    }
    if (vaoMayTai <= 0 || n - 1 - vaoMayTai > 5) continue;

    let daBatLen = false;
    const gioiHanK = Math.min(vaoMayTai + 5, n - 1);
    for (let k = vaoMayTai; k <= gioiHanK; k++) {
      if (tenkan[k] != null && close[k] > tenkan[k]) {
        daBatLen = true;
        break;
      }
    }
    if (!daBatLen) {
      for (let k = vaoMayTai; k <= gioiHanK; k++) canhBao[k] = true;
    }
  }
  return canhBao;
}
