import { tinhDiemRank, tinhDiemConfidence } from "../loi/diemRank.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-6) => a != null && b != null && Math.abs(a - b) < e;

// ---- DiemRank: truong hop toi da (dat het ca 5 thanh phan) = 100 ----
{
  const kq = tinhDiemRank({
    sanyaku: [3],
    fvgDuLon: [true],
    inFVGZone: [true],
    adx: [40],
    breadthPctNganh: [60],
    rsVsVni: [5],
  });
  ok("DiemRank toi da (dat ca 5 thanh phan) = 100", gan(kq[0], 100), kq[0]);
}
{
  const kq = tinhDiemRank({
    sanyaku: [1],
    fvgDuLon: [false],
    inFVGZone: [false],
    adx: [20],
    breadthPctNganh: [30],
    rsVsVni: [-5],
  });
  // 8.333 + 0 + 10 + 10 + 10 = 38.333
  ok("DiemRank truong hop giua = 38.333", gan(kq[0], 38.333, 1e-3), kq[0]);
}

// ---- DiemConfidence: dong thuan 3/3 -> 60 diem; 1/3 -> 20 diem ----
{
  const kq = tinhDiemConfidence({
    trendScore: [1, 1],
    momScore: [1, 1],
    mfScore: [1, -1],
    totalScore: [1, 1], // khong cat moc 0 -> DiemBenVung = 0 ca 2 phien
  });
  ok("Dong thuan 3/3 -> DiemDongThuan = 60, DiemBenVung = 0", gan(kq[0], 60));
  ok("Dong thuan 1/3 (chi Trend=Mom) -> DiemDongThuan = 20", gan(kq[1], 20));
}
{
  // Cat moc 0 tai i=2, sau 9 phien nua (i=11) DiemBenVung = 9/10*40 = 36; sau 10 phien (i=12) bao hoa 40.
  const totalScore = [-1, -1, ...new Array(11).fill(2)];
  const trendScore = totalScore.map(() => 1);
  const momScore = totalScore.map(() => 1);
  const mfScore = totalScore.map(() => 1); // dong thuan hoan toan -> DiemDongThuan luon 60, chi xet DiemBenVung
  const kq = tinhDiemConfidence({ trendScore, momScore, mfScore, totalScore });
  ok("Cat moc dung phien 2 -> DiemBenVung = 0 tai do", gan(kq[2] - 60, 0));
  ok("9 phien sau khi cat moc -> DiemBenVung = 36", gan(kq[11] - 60, 36), kq[11] - 60);
  ok("10 phien sau -> DiemBenVung bao hoa 40", gan(kq[12] - 60, 40), kq[12] - 60);
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
