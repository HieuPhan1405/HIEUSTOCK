// Port AFL dong 44-46, 141-161: RelVol + 3 dieu kien Volume cho phien MUA DAU TIEN.
import { ref, hhv, sma, zip2 } from "./mang.js";

// { close, volume } -> RelVol = V / TB20 khoi luong CUA HOM QUA (khong tinh hom nay, tranh nhin truoc).
export function tinhRelVol({ volume }, { doDaiTB = 20 } = {}) {
  const avgVol20 = ref(sma(volume, doDaiTB), -1);
  return volume.map((v, i) => (avgVol20[i] != null && avgVol20[i] > 0 ? v / avgVol20[i] : 1));
}

// 3 dieu kien: (1) RelVol vuot nguong so TB20; (2) khoi luong hom nay vuot % so hom qua;
// (3) "Pocket Pivot": khoi luong hom nay vuot khoi luong CAO NHAT trong cac phien GIAM GIA gan day.
export function tinhVolumeGateNgayDau(
  { close, volume, relVol },
  { volMinPctTB20 = 50, volMinPctHomTruoc = 30, pocketPivotNhinLai = 10 } = {}
) {
  const n = close.length;
  const volDatTB20 = relVol.map((v) => v >= 1 + volMinPctTB20 / 100);

  const volTruoc = ref(volume, -1);
  const volDatHomTruoc = new Array(n).fill(false);
  for (let i = 0; i < n; i++) volDatHomTruoc[i] = volTruoc[i] != null && volTruoc[i] > 0 && volume[i] >= volTruoc[i] * (1 + volMinPctHomTruoc / 100);

  const closeTruoc = ref(close, -1);
  const volNgayGiam = new Array(n).fill(0);
  for (let i = 0; i < n; i++) volNgayGiam[i] = closeTruoc[i] != null && close[i] < closeTruoc[i] ? volume[i] : 0;
  const maxVolNgayGiam10 = ref(hhv(volNgayGiam, pocketPivotNhinLai), -1);
  const volDatPocketPivot = new Array(n).fill(false);
  for (let i = 0; i < n; i++) volDatPocketPivot[i] = maxVolNgayGiam10[i] != null && volume[i] > maxVolNgayGiam10[i];

  const ketQua = new Array(n).fill(false);
  for (let i = 0; i < n; i++) ketQua[i] = volDatTB20[i] && volDatHomTruoc[i] && volDatPocketPivot[i];
  return ketQua;
}
