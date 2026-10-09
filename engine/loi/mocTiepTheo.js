// MOC TINH DIEM (+) SAP CHAM - "Ma theo doi" tren web (cot moc_gia/moc_loai/moc_cach_pct/diem_neu_vuot).
// Dich sat amibroker/7_Export_LenWeb.afl (khoi "MOC TINH DIEM (+) SAP CHAM"): gia dang o duoi 1 moc ma VUOT QUA se duoc cong
// diem Trend (may, duong can bang dai han):
//   May:  gia < day may -> moc = day may;  gia trong may -> moc = dinh may;  tren may -> khong co moc.
//   Can bang dai han: gia < CBBot -> moc = CBBot;  gia trong vung -> moc = CBTop;  tren vung -> khong co moc.
// Chon moc GAN NHAT phia tren gia (hoa thi uu tien may). Moi lan vuot 1 moc = TrendScore +1 => TotalScore +1.5 (diem uoc tinh,
// chua tinh cac thanh phan khac doi theo). CHI de tham khao, khong anh huong tin hieu.
// Khong co moc phia tren: gia = 0, cachPct = 0, loai = "" (giong AFL xuat 0 / "").
const hopLe = (x) => Number.isFinite(x);

export function tinhMocTiepTheo({ gia, cloudTop, cloudBot, cbTop, cbBot, totalScore }) {
  const diemNeuVuot = hopLe(totalScore) ? totalScore + 1.5 : null;
  const mocMay = hopLe(cloudTop) && hopLe(cloudBot) ? (gia < cloudBot ? cloudBot : gia <= cloudTop ? cloudTop : null) : null;
  const mocCb = hopLe(cbTop) && hopLe(cbBot) ? (gia < cbBot ? cbBot : gia <= cbTop ? cbTop : null) : null;
  const cach = (moc) => (moc != null && gia > 0 ? (moc / gia - 1) * 100 : null);
  const cachMay = cach(mocMay);
  const cachCb = cach(mocCb);
  if (cachMay == null && cachCb == null) return { gia: 0, loai: "", cachPct: 0, diemNeuVuot };
  const mayGanHon = cachMay != null && (cachCb == null || cachMay <= cachCb);
  return mayGanHon
    ? { gia: mocMay, loai: "MAY", cachPct: cachMay, diemNeuVuot }
    : { gia: mocCb, loai: "CAN BANG", cachPct: cachCb, diemNeuVuot };
}
