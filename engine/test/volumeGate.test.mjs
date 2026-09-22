// Test tay cho engine/loi/volumeGate.js - 25 nen, khoi luong binh thuong 100 tat ca, rieng nen
// cuoi (24) dot bien 300 (gap 3 lan TB20) sau 1 phien tang binh thuong hom truoc, va co 1 phien
// giam gia o giua (18) lam moc so sanh Pocket Pivot.
import { tinhRelVol, tinhVolumeGateNgayDau } from "../loi/volumeGate.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => a != null && b != null && Math.abs(a - b) < e;

const n = 25;
const close = new Array(n).fill(50);
const volume = new Array(n).fill(100);
close[18] = 49; // 1 phien giam gia o giua (down-day) lam moc Pocket Pivot
volume[24] = 300; // dot bien khoi luong o nen cuoi cung

const relVol = tinhRelVol({ volume }, { doDaiTB: 20 });
ok("RelVol[24] = 300 / TB20(100) = 3.0", gan(relVol[24], 3.0), relVol[24]);
ok("RelVol[10] = 100/100 = 1.0 (chua co dot bien)", gan(relVol[10], 1.0), relVol[10]);

const gate = tinhVolumeGateNgayDau({ close, volume, relVol }, { volMinPctTB20: 50, volMinPctHomTruoc: 30, pocketPivotNhinLai: 10 });
ok("nen 24: dat ca 3 dieu kien (TB20, so hom truoc, Pocket Pivot) -> true", gate[24] === true);
ok("nen 10: khoi luong binh thuong -> khong dat dieu kien nao -> false", gate[10] === false);

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
