// Port AFL dong 472-493: DiemRank/DiemConfidence - CHI danh gia do "chac chan" cua tin hieu da
// co, KHONG dung de quyet dinh Mua/Ban (khong anh huong may trang thai).
function dau(x) {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
}

// { sanyaku, fvgDuLon, inFVGZone, adx, breadthPctNganh, rsVsVni, trendScore, momScore, mfScore,
//   totalScore } - tat ca la mang cung do dai. breadthPctNganh la mang % breadth CUA MA (da tra
// theo dung nganh no thuoc - xem engine/loi/breadth.js).
export function tinhDiemRank({ sanyaku, fvgDuLon, inFVGZone, adx, breadthPctNganh, rsVsVni }) {
  const n = sanyaku.length;
  const ketQua = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    const tuSanyaku = sanyaku[i] != null ? (sanyaku[i] / 3) * 25 : 0;
    const tuFVG = fvgDuLon[i] ? 20 : inFVGZone[i] ? 10 : 0;
    const tuADX = adx[i] != null ? Math.min(20, (adx[i] / 40) * 20) : 0;
    const tuBreadth = breadthPctNganh[i] != null ? Math.min(20, (breadthPctNganh[i] / 60) * 20) : 0;
    const tuRS = rsVsVni[i] == null ? 0 : rsVsVni[i] > 0 ? 15 : Math.max(0, 15 + rsVsVni[i]);
    ketQua[i] = tuSanyaku + tuFVG + tuADX + tuBreadth + tuRS;
  }
  return ketQua;
}

// { trendScore, momScore, mfScore, totalScore }
export function tinhDiemConfidence({ trendScore, momScore, mfScore, totalScore }) {
  const n = totalScore.length;
  const ketQua = new Array(n).fill(null);
  // BarsSince(Cross(TotalScore,0) OR Cross(0,TotalScore)): dem so phien tu lan CAT MOC 0 gan
  // nhat (ca 2 chieu). Infinity = chua tung cat moc trong toan bo lich su co san.
  let demTuLanCatMoc = Infinity;
  for (let i = 0; i < n; i++) {
    const dauTrend = dau(trendScore[i]);
    const dauMom = dau(momScore[i]);
    const dauDT = dau(mfScore[i]);
    const soThanhPhanDongThuan = (dauTrend === dauMom ? 1 : 0) + (dauTrend === dauDT ? 1 : 0) + (dauMom === dauDT ? 1 : 0);
    const diemDongThuan = (soThanhPhanDongThuan / 3) * 60;

    const catLenTuAm = i > 0 && totalScore[i] > 0 && totalScore[i - 1] <= 0;
    const catXuongTuDuong = i > 0 && totalScore[i] < 0 && totalScore[i - 1] >= 0;
    demTuLanCatMoc = catLenTuAm || catXuongTuDuong ? 0 : demTuLanCatMoc === Infinity ? Infinity : demTuLanCatMoc + 1;
    const diemBenVung = Math.min(40, ((demTuLanCatMoc === Infinity ? 0 : demTuLanCatMoc) / 10) * 40);

    ketQua[i] = diemDongThuan + diemBenVung;
  }
  return ketQua;
}
