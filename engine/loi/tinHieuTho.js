// Port AFL dong 235-274: tin hieu MUA/BAN THO (TruocKhi AND voi cac cong loc rieng - xem
// engine/loi/cong.js) - trong tam la may trang thai DaMuaDotNay (tranh bao MUA lap lai nhieu
// lan lien tuc trong CUNG 1 dot diem tren nguong).
import { sum, ref } from "./mang.js";

// { totalScore, adx, inFVGZone, fvgDuLon, volumeGateNgayDau }
// thamSo: { entryTh=1.25, persistBars=1, useADXGate=true, adxGateLv=18, boQuaADXNeuDiemManh=2.0,
//           cheDoFVG="Thong minh"|"Luon BAT"|"Luon TAT", nguongDiemBreakout=1.0,
//           exitTh=1.5, soPhienBanXacNhan=3 }
export function tinhTinHieuTho(
  { totalScore, adx, inFVGZone, fvgDuLon, volumeGateNgayDau },
  {
    entryTh = 1.25,
    persistBars = 1,
    useADXGate = true,
    adxGateLv = 18,
    boQuaADXNeuDiemManh = 2.0,
    cheDoFVG = "Thong minh",
    nguongDiemBreakout = 1.0,
    exitTh = 1.5,
    soPhienBanXacNhan = 3,
  } = {}
) {
  const n = totalScore.length;
  const above = totalScore.map((v) => v >= entryTh);
  const consecutiveAbove = sum(above, persistBars).map((v) => v === persistBars);
  const aboveTruoc = ref(above, -1);
  const vuaVaoVungMua = above.map((v, i) => v && !aboveTruoc[i]);

  const adxGateOk = new Array(n).fill(true);
  if (useADXGate) {
    for (let i = 0; i < n; i++) adxGateOk[i] = (adx[i] != null && adx[i] >= adxGateLv) || Math.abs(totalScore[i]) >= boQuaADXNeuDiemManh;
  }

  const inFVGZoneH3 = inFVGZone.map((v, i) => v && fvgDuLon[i]);
  const breakoutManh = totalScore.map((v) => v >= entryTh + nguongDiemBreakout);
  const inFVGZoneOk = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    if (cheDoFVG === "Luon TAT") inFVGZoneOk[i] = true;
    else if (cheDoFVG === "Luon BAT") inFVGZoneOk[i] = inFVGZoneH3[i];
    else inFVGZoneOk[i] = (breakoutManh[i] && volumeGateNgayDau[i]) || inFVGZoneH3[i];
  }

  // May trang thai: 1 "dot" tren nguong chi duoc bao MUA (TurnedGreen) DUNG 1 LAN, ke ca neu con
  // duy tri tren nguong nhieu phien sau do lien tuc du dieu kien.
  const turnedGreen = new Array(n).fill(false);
  const daMuaDotNay = new Array(n).fill(false);
  for (let i = 1; i < n; i++) {
    if (!consecutiveAbove[i]) {
      daMuaDotNay[i] = false;
      continue;
    }
    const duDieuKienVolumeNgayDau = !vuaVaoVungMua[i] || volumeGateNgayDau[i];
    if (consecutiveAbove[i] && inFVGZoneOk[i] && adxGateOk[i] && duDieuKienVolumeNgayDau && daMuaDotNay[i - 1] === false) {
      turnedGreen[i] = true;
      daMuaDotNay[i] = true;
    } else {
      daMuaDotNay[i] = daMuaDotNay[i - 1];
    }
  }

  const zoneSell = totalScore.map((v) => v <= -exitTh);
  const zoneSellXacNhan = sum(zoneSell, soPhienBanXacNhan).map((v) => v === soPhienBanXacNhan);
  const zoneSellXacNhanTruoc = ref(zoneSellXacNhan, -1);
  const turnedPink = zoneSellXacNhan.map((v, i) => v && !zoneSellXacNhanTruoc[i]);

  return { above, consecutiveAbove, vuaVaoVungMua, adxGateOk, inFVGZoneOk, turnedGreen, turnedPink };
}
