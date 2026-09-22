// Test tay cho engine/loi/fvg.js - 1 khoang trong gia ro rang, kiem tra dung ca 2 dieu kien
// "con trong vung" va "het hieu luc khi gia lap day".
import { tinhFVG, fvgDuLon } from "../loi/fvg.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

const high = [10, 10, 14, 13, 8, 9, 9, 9];
const low = [9, 9, 13, 12, 7, 8, 8, 8];
const close = [9.5, 9.5, 13.5, 12.5, 7.5, 8.5, 8.5, 8.5];
const atr = new Array(8).fill(1);

const { inFVGZone, doLonSoATR } = tinhFVG({ high, low, close, atr }, { fvgLookback: 15 });

ok("khong co gap o 2 nen dau", inFVGZone[0] === false && inFVGZone[1] === false);
ok("nen tao gap (i=2) nam trong vung", inFVGZone[2] === true);
ok("nen ke tiep (i=3, low=12 trong [10,13]) van trong vung", inFVGZone[3] === true);
ok("nen 4 (low=7 < gapBot=10) lam day gap -> KHONG con trong vung", inFVGZone[4] === false);
ok("cac nen sau do cung khong con trong vung (gap da het hieu luc)", inFVGZone[5] === false && inFVGZone[6] === false && inFVGZone[7] === false);
ok("do lon/ATR tai i=2,3 = (13-10)/1 = 3", doLonSoATR[2] === 3 && doLonSoATR[3] === 3);
ok("do lon/ATR = 0 o ngoai vung", doLonSoATR[0] === 0 && doLonSoATR[4] === 0);

const duLon = fvgDuLon(doLonSoATR, 0.6);
ok("FVGDuLon dung khi ty le >= 0.6", duLon[2] === true && duLon[3] === true && duLon[0] === false);

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
