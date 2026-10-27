// RAP TAT CA LAI: tu lich su gia 1 mã (+ VNINDEX + breadth toan thi truong da tinh san) ra DUNG
// 1 dong du 62 truong nhu AmiBroker xuat (xem app/api/upload-signals/route.js). Day la buoc "lap
// rap", it rui ro hon cac module con (da test rieng) - nhung van phai dung THU TU AFL tinh toan.
//
// CHUA LAM (ro rang la display-only, KHONG anh huong tin hieu MUA/BAN - xem plan de biet ly do):
//   - ngay_bien_doi (Time Theory / Kihon Suchi - can toan bo pivot A/B/C rieng)
// ngay_bien_doi duoc dat false o day, KHONG doan mo hinh. (moc_gia/... "Ma theo doi" da port tu AFL - xem tinhMocTiepTheo.)
import { tinhIchimoku, tinhDuongCanBangDaiHan } from "./loi/ichimoku.js";
import { atr as tinhATR, adxHeThong, rsi as tinhRSI, mfi as tinhMFI } from "./loi/taChiBao.js";
import { tinhSanyaku } from "./loi/sanyaku.js";
import { tinhFVG, fvgDuLon as tinhFvgDuLonTuTy } from "./loi/fvg.js";
import { tinhMatThan } from "./loi/matThan.js";
import { tinhRelVol, tinhVolumeGateNgayDau } from "./loi/volumeGate.js";
import { tinhVolNhipChinhTruoc } from "./loi/volNhipChinh.js";
import { tinhDiem } from "./loi/diem.js";
import { tinhTinHieuTho } from "./loi/tinHieuTho.js";
import { tinhCheDoMocVaoLenh, tinhBaMocChotLoi, tinhMuaLai, tinhMuaMoiSauTP3, tinhMuaMuon, tinhMuaThemGiuaChung } from "./loi/vaoLenh.js";
import { chayMayTrangThai } from "./loi/mayTrangThai.js";
import { tinhChiTrongNamGanNhat, tinhThanhKhoanOk, tinhGiaToiThieuOk, tinhRSGateOk, tinhRSVoiVNIndex } from "./loi/cong.js";
import { tinhDiemRank, tinhDiemConfidence } from "./loi/diemRank.js";
import { breadthCuaMa } from "./loi/breadth.js";
import { tinhMocTiepTheo } from "./loi/mocTiepTheo.js";
import { phanLoaiVonHoa } from "./danh-sach/vonHoa.js";
import { nganhCuaMa } from "./danh-sach/nganh.js";
import { hhv, llv, sma, ref, valueWhen, barsSince, highestSince } from "./loi/mang.js";

// Tat ca gia tri MAC DINH khop DUNG cac Param()/ParamToggle()/ParamList() hien tai trong
// amibroker/7_Export_LenWeb.afl (kem trang thai BAT/TAT hien dang chay production, khong phai
// mac dinh "goc" cua AFL - vd CheDoMoc/BatMuaLai/BatMuaMoi da duoc BAT theo cac lan chot truoc).
// SUA O DAY neu AmiBroker doi Param KHAC voi day - PHAI dong bo lai truoc Giai doan 5 (doi chieu).
const MAC_DINH = {
  entryTh: 1.25,
  exitTh: 1.5,
  persistBars: 1,
  useADXGate: true,
  adxGateLv: 18,
  boQuaADXNeuDiemManh: 2.0,
  cheDoFVG: "Thong minh",
  nguongDiemBreakout: 1.0,
  rsiTren: 70,
  rsiDuoi: 30,
  // DIEM BAC THANG CUNG nhu AFL (14/10/2026: da thu diem tuyen tinh +-10 cho RSI / MFI roi BO theo y Hieu; xem memory project-diem-tuyen-tinh-rsi-mfi).
  rsiVungDem: 0, // 0 = bac thang cung nhu AFL (14/10/2026 Hieu bo diem tuyen tinh +-10; muon bat lai: rsiVungDem 10 + rsiKieuDem "docTatCa" + mfiVungDem 10)
  rsiKieuDem: "docTatCa",
  mfiVungDem: 0,
  trongSoDiem: { trend: 1.5, mf: 1.2, mom: 1.0 }, // ti trong diem (AFL: Trend 1,5 / MF 1,2 / Mom 1,0)
  // NGUONG RSI QUA MUA THEO NHOM (14/10/2026, Hieu chot): bluechips VN30 va chi so 70, Midcap / Smallcap / ma khac 75 (midcap hay duoc keo manh hon, RSI > 70 chua phai dinh).
  // Backtest: gan nhu khong doi ket qua chung (nguong qua mua it quyet dinh lenh). AFL 7/8/9 CHUA doi theo. Dat null de dung chung rsiTren = 70.
  rsiTrenTheoNhom: { VN30: 70, ChiSo: 70, Midcap: 75, Smallcap: 75, Khac: 75 },
  tatCongKhoiLuongNgayDau: false, // chi nghien cuu: true = bo cong khoi luong ngay dau (AFL khong co)
  fvgLookback: 15,
  nguongDiemFVGMem: 0.6,
  soPhienBanXacNhan: 3,
  diemBoCongFVGPhienSau: null, // thu nghiem, mac dinh TAT (xem tinHieuTho.js)
  // 2026-10-20: noi cong KL ngay dau - chi con dk KL >= TB20 +20% (bo dk so hom truoc + Pocket Pivot). Backtest engine/dich-vu/backtestNoiKhoiLuong.mjs: lai khong doi, tin hieu hien som hon trong phien.
  volMinPctTB20: 20,
  dungVolHomTruoc: false,
  dungPocketPivot: false,
  volMinPctHomTruoc: 30,
  pocketPivotNhinLai: 10,
  atrMult: 2.2,
  hardStopPct: 6,
  soNamGanNhat: 12,
  nguongKLTB20ToiThieu: 100000,
  nguongGiaToiThieu: 10,
  choPhepMuaKhiRSAm: true,
  hanBoSungPhien: 5,
  cheDoMoc: true,
  slKieuMoc: true,
  slKieuDay: false,
  demSLtheoATR: 0.5,
  slToiThieuPct: 3.5,
  slChamLaCat: true,
  bvHoaVon: true, // KieuBaoVeLai = "Hoa von sau TP2" (index 1) - da BAT theo chot "Chot ca 2".
  bvRong: false,
  baoVeRongPct: 20,
  // MUA LAI tat tu 2026-09-27: backtest 11 nam (engine/dich-vu/backtestVaoThucTe.mjs) chi 73 lenh, lai TB ~0 (+0,16% mua ATC, -0,21% mua mo cua phien sau <= +1%) - khong them
  // loi the; he thong chi con Mua / Mua moi / Ban / Ban bot. Van bat lai duoc bang thamSo.batMuaLai = true (va Param "MUA LAI" trong AFL 7/9).
  batMuaLai: false,
  kieuHoTroMuaLai: "Kijun",
  diemToiThieuMuaLai: 0.75,
  hanMuaLaiPhien: 60,
  doChamHoTroPct: 1,
  muaLaiCaoToiDaPct: 0,
  soLanMuaLaiToiDa: 2,
  // 2 TP + PHAN CON LAI GIU DEN TIN HIEU BAN (2026-09-26, theo backtest engine/dich-vu/backtestHaiMocChayDenBan.mjs): TP1 chot 30%, TP2 chot 30%, 40% con lai giu cho toi khi
  // he thong bao BAN / cham Stop-loss / bao ve hoa von sau TP2 (bvHoaVon). TP3 chi la moc tham khao. Hai cong tac duoi day la CACH KHAC (mac dinh TAT): ketThucTaiTP3 = dong lenh
  // o TP3 (30/30/40, 2026-09-25); thoatKijunSauTP2 = sau TP2 ban not neu dong cua < Kijun. "Mua moi sau TP3" (vong 2, batMuaMoi) DA BO 27/09/2026 (AFL khoa cung Tat) - chi con de backtest / doc lenh cu.
  ketThucTaiTP3: false,
  thoatKijunSauTP2: false,
  // 2 LUAT GOP (2026-10-19, backtest engine/dich-vu/backtestGopHaiLuat.mjs, mac dinh TAT - chua bat production, cho chay song song theo doi):
  //  locVolChinhVao: bo lenh Mua THUONG khi vol nhip chinh truoc phien tin hieu (relVol TB tu dinh soNenDinhVolChinh nen toi hom truoc) >= volChinhNguongVao;
  //  thoatKijunVolChinh: sau TP1, dong cua < Kijun va vol TB nhip chinh (tu dinh toi hom nay) >= volChinhNguongThoat -> ban het; vol be thi giu, san trailing sanTrailPct% tu dinh (thay hoa von).
  // NGHIEN CUU (21/10/2026, backtestBoQuaMay.mjs, mac dinh TAT): boQuaMay = diem xu huong khong tinh vi tri gia so voi may Ichimoku; yeuCauGiaTenkanKijun = chi MUA khi dong cua > Tenkan va Tenkan > Kijun.
  boQuaMay: false,
  yeuCauGiaTenkanKijun: false,
  // NGHIEN CUU (27/10/2026, backtestMuaKhongCanMay.mjs, mac dinh TAT): yeuCauGiaTrenTenkanKijun = chi MUA khi dong cua > Tenkan VA dong cua > Kijun (khong can Tenkan > Kijun, khong can qua may).
  yeuCauGiaTrenTenkanKijun: false,
  locVolChinhVao: false,
  volChinhNguongVao: 1.2,
  soNenDinhVolChinh: 20,
  thoatKijunVolChinh: false,
  volChinhNguongThoat: 1.0,
  sanTrailPct: 25,
  batMuaMoi: false,
  kieuHoTroMuaMoi: "Kijun",
  diemToiThieuMuaMoi: 1.25,
  muaMoiCaoToiDaPct: 4,
  // 2 tin hieu MUA moi bo sung 2026-09-23 (xem plan). Bat that 2026-09-24 theo yeu cau
  // nguoi dung - tham so mac dinh ben duoi CHUA qua backtest rieng, tu dieu chinh sau khi
  // theo doi ket qua thuc te.
  batMuaMuon: true,
  hanPhienMuaMuon: 10,
  diemToiThieuMuaMuon: 0.75,
  muaMuonCaoToiDaPct: 2,
  batMuaThemGiuaChung: true,
  kieuHoTroMuaGiua: "Kijun",
  diemToiThieuMuaGiua: 1.25,
  muaGiuaCaoToiDaPct: 4,
};

const ngayVN = (isoNgay) => {
  if (!isoNgay) return null;
  const [y, m, d] = isoNgay.split("-");
  return `${Number(d)}/${Number(m)}/${y}`;
};

/**
 * @param {object} dauVao
 * @param {string} dauVao.ma
 * @param {{t:string,o:number,h:number,l:number,c:number,v:number}[]} dauVao.nen - tang dan theo
 *   ngay (index 0 = cu nhat), CANG NHIEU LICH SU CANG TOT (toi thieu ~260 phien cho HHV(H,252)).
 * @param {number[]} dauVao.vniClose - dong cua VNINDEX, CUNG NGAY/CUNG DO DAI voi `nen`.
 * @param {string|null} dauVao.san - "HOSE"|"HNX"|"UPCOM"|null (tu API - xem loi/vndirectSanNganh.js).
 * @param {{theoNganh:Map,trungBinh:number}} dauVao.ketQuaBreadth - tu breadth.tinhTatCaBreadth(),
 *   tinh 1 LAN cho toan bo thi truong (khong tinh rieng duoc cho 1 ma).
 * @param {object} [dauVao.thamSo] - de ghi de MAC_DINH khi can (vd dang doi chieu 1 Param khac).
 */
export function tinhTinHieuChoMa({ ma, nen, vniClose, san, ketQuaBreadth, thamSo = {} }) {
  const p = { ...MAC_DINH, ...thamSo };
  const n = nen.length;
  const close = nen.map((b) => b.c);
  const open = nen.map((b) => b.o);
  const high = nen.map((b) => b.h);
  const low = nen.map((b) => b.l);
  const volume = nen.map((b) => b.v);
  const cuoi = n - 1;

  // ---- Phase 1: chi bao ----
  // kieuTenkanKijun / kieuMay / kieuCanBang: CHI NGHIEN CUU (mac dinh "donchian" = nhu AFL); "sma" | "ema" thay duong Ichimoku bang trung binh dong (xem loi/ichimoku.js).
  const { tenkan, kijun, cloudTop, cloudBot, senkouAGoc, senkouBGoc } = tinhIchimoku({ high, low, close }, { kieuTenkanKijun: p.kieuTenkanKijun ?? "donchian", kieuMay: p.kieuMay ?? "donchian" });
  const { cbTop, cbBot } = tinhDuongCanBangDaiHan({ high, low, close }, { kieu: p.kieuCanBang ?? "donchian" });
  const atrArr = tinhATR({ high, low, close });
  const { adx, diPlus, diMinus } = adxHeThong({ high, low, close });
  const rsiArr = tinhRSI({ close });
  const mfiArr = tinhMFI({ high, low, close, volume });
  const sanyaku = tinhSanyaku({ high, close, tenkan, kijun, cloudTop });
  const { inFVGZone, doLonSoATR } = tinhFVG({ high, low, close, atr: atrArr }, { fvgLookback: p.fvgLookback });
  const fvgDuLon = tinhFvgDuLonTuTy(doLonSoATR, p.nguongDiemFVGMem);
  const matThan = tinhMatThan({ high, low, close, cloudTop, cloudBot, tenkan });
  const relVol = tinhRelVol({ volume });
  const volumeGateNgayDau = tinhVolumeGateNgayDau(
    { close, volume, relVol },
    { volMinPctTB20: p.volMinPctTB20, volMinPctHomTruoc: p.volMinPctHomTruoc, pocketPivotNhinLai: p.pocketPivotNhinLai, dungVolHomTruoc: p.dungVolHomTruoc, dungPocketPivot: p.dungPocketPivot }
  );
  if (p.tatCongKhoiLuongNgayDau) volumeGateNgayDau.fill(true); // CHI NGHIEN CUU (mac dinh false): bo cong khoi luong ngay dau
  const { trendScore, momScore, mfScore, totalScore } = tinhDiem({
    close,
    cloudTop,
    cloudBot,
    cbTop,
    cbBot,
    tenkan,
    kijun,
    adx,
    diPlus,
    diMinus,
    rsi: rsiArr,
    mfi: mfiArr,
    relVol,
    momCauHinh: { rsiTren: p.rsiTrenTheoNhom?.[ma === "VNINDEX" ? "ChiSo" : phanLoaiVonHoa(ma) ?? "Khac"] ?? p.rsiTren, rsiDuoi: p.rsiDuoi, vungDem: p.rsiVungDem, kieuDem: p.rsiKieuDem },
    mfiVungDem: p.mfiVungDem,
    boQuaMay: p.boQuaMay,
    trongSo: p.trongSoDiem,
  });

  // ---- Cong + RS so voi VNINDEX ----
  const rsVsVni = tinhRSVoiVNIndex(close, vniClose);
  const rsVsVni60 = tinhRSVoiVNIndex(close, vniClose, 60); // chi de hien thi (xep hang RS nganh), khong tham gia tin hieu
  const rsvniOk = rsVsVni.map((v) => v != null && v > 0);
  const chiTrongNamGanNhat = tinhChiTrongNamGanNhat(n, { soNamGanNhat: p.soNamGanNhat });
  const thanhKhoanOk = tinhThanhKhoanOk(volume, { nguongKLTB20ToiThieu: p.nguongKLTB20ToiThieu });
  const giaToiThieuOk = tinhGiaToiThieuOk(close, { nguongGiaToiThieu: p.nguongGiaToiThieu });
  const rsGateOk = tinhRSGateOk(rsvniOk, { choPhepMuaKhiRSAm: p.choPhepMuaKhiRSAm });
  const congChung = new Array(n);
  for (let i = 0; i < n; i++) congChung[i] = chiTrongNamGanNhat[i] && rsGateOk[i] && thanhKhoanOk[i] && giaToiThieuOk[i];

  // ---- Tin hieu MUA/BAN tho ----
  const { vuaVaoVungMua, consecutiveAbove, adxGateOk, inFVGZoneOk, turnedGreen, turnedPink, dotKetThucBoLo } = tinhTinHieuTho(
    { totalScore, adx, inFVGZone, fvgDuLon, volumeGateNgayDau },
    {
      entryTh: p.entryTh,
      persistBars: p.persistBars,
      useADXGate: p.useADXGate,
      adxGateLv: p.adxGateLv,
      boQuaADXNeuDiemManh: p.boQuaADXNeuDiemManh,
      cheDoFVG: p.cheDoFVG,
      nguongDiemBreakout: p.nguongDiemBreakout,
      exitTh: p.exitTh,
      soPhienBanXacNhan: p.soPhienBanXacNhan,
      diemBoCongFVGPhienSau: p.diemBoCongFVGPhienSau,
    }
  );
  const buyTho = new Array(n);
  for (let i = 0; i < n; i++) buyTho[i] = turnedGreen[i] && congChung[i];

  // ---- Gia vao lenh tai moc chuyen mua + SL cau truc ----
  const { giaKichHoatBar, loaiMocBar, giaVaoBar, stopVaoBar } = tinhCheDoMocVaoLenh(
    { close, open, high, low, atr: atrArr, cloudTop, cbTop, cbBot, kijun, vuaVaoVungMua },
    { cheDoMoc: p.cheDoMoc, slKieuMoc: p.slKieuMoc, slKieuDay: p.slKieuDay, demSLtheoATR: p.demSLtheoATR, slToiThieuPct: p.slToiThieuPct, hardStopPct: p.hardStopPct, atrMult: p.atrMult }
  );
  const { tp1Vong, tp2Vong, tp3Vong } = tinhBaMocChotLoi({ high, giaVaoBar, cloudTop, cbTop });
  // Hoist len som (truoc day tinh SAU chayMayTrangThai) vi Mua Muon can gia tri nay LAM INPUT cho
  // may trang thai - gia kich hoat tai LAN VUA VAO VUNG MUA gan nhat (chua chac da Mua that su).
  const mocKichHoatTaiVuaVao = valueWhen(vuaVaoVungMua, giaKichHoatBar, 1);

  // ---- Mua lai / Mua them sau TP3 / Mua muon / Mua them giua chung (con cot cong chung truoc
  // khi dua vao may trang thai) ----
  const { muaLaiTinHieu: muaLaiTho, stopMuaLaiBar } = tinhMuaLai(
    { close, open, high, low, atr: atrArr, totalScore, cloudTop, kijun, cbBot },
    { batMuaLai: p.batMuaLai, kieuHoTro: p.kieuHoTroMuaLai, diemToiThieu: p.diemToiThieuMuaLai, doChamHoTroPct: p.doChamHoTroPct, demSLtheoATR: p.demSLtheoATR, slToiThieuPct: p.slToiThieuPct, hardStopPct: p.hardStopPct, atrMult: p.atrMult }
  );
  const { muaMoiTinHieu: muaMoiTho, stopMuaMoiBar } = tinhMuaMoiSauTP3(
    { close, open, high, low, atr: atrArr, totalScore, cloudTop, kijun, cbBot },
    { batMuaMoi: p.batMuaMoi, kieuHoTro: p.kieuHoTroMuaMoi, diemToiThieu: p.diemToiThieuMuaMoi, caoToiDaPct: p.muaMoiCaoToiDaPct, doChamHoTroPct: p.doChamHoTroPct, demSLtheoATR: p.demSLtheoATR, slToiThieuPct: p.slToiThieuPct, hardStopPct: p.hardStopPct, atrMult: p.atrMult }
  );
  const { muaMuonTinHieu: muaMuonTho, stopMuaMuonBar } = tinhMuaMuon(
    { close, open, atr: atrArr, totalScore, cloudTop, dotKetThucBoLo, giaKichHoatTaiVuaVao: mocKichHoatTaiVuaVao },
    { batMuaMuon: p.batMuaMuon, diemToiThieu: p.diemToiThieuMuaMuon, caoToiDaPct: p.muaMuonCaoToiDaPct, hanPhien: p.hanPhienMuaMuon, demSLtheoATR: p.demSLtheoATR, slToiThieuPct: p.slToiThieuPct, hardStopPct: p.hardStopPct, atrMult: p.atrMult }
  );
  const { muaThemGiuaChungTinHieu: muaGiuaTho, stopMuaThemGiuaChungBar } = tinhMuaThemGiuaChung(
    { close, open, high, low, atr: atrArr, totalScore, cloudTop, kijun, cbBot },
    { batMuaThemGiuaChung: p.batMuaThemGiuaChung, kieuHoTro: p.kieuHoTroMuaGiua, diemToiThieu: p.diemToiThieuMuaGiua, caoToiDaPct: p.muaGiuaCaoToiDaPct, doChamHoTroPct: p.doChamHoTroPct, demSLtheoATR: p.demSLtheoATR, slToiThieuPct: p.slToiThieuPct, hardStopPct: p.hardStopPct, atrMult: p.atrMult }
  );
  const muaLaiTinHieu = new Array(n);
  const muaMoiTinHieu = new Array(n);
  const muaMuonTinHieu = new Array(n);
  const muaThemGiuaChungTinHieu = new Array(n);
  for (let i = 0; i < n; i++) {
    muaLaiTinHieu[i] = muaLaiTho[i] && congChung[i];
    muaMoiTinHieu[i] = muaMoiTho[i] && congChung[i];
    muaMuonTinHieu[i] = muaMuonTho[i] && congChung[i];
    muaThemGiuaChungTinHieu[i] = muaGiuaTho[i] && congChung[i];
  }

  // ---- May trang thai chinh ----
  // SellTinHieu = TurnedPink AND BarsSince(buyTho da AND cong)>=2 - can buyTho HOAN CHINH
  // (da AND cong) truoc, tinh o day thay vi trong tinHieuTho.js (xem chu thich file do).
  const sellTinHieuArr = (() => {
    const soPhienTuBuy = barsSince(buyTho);
    return turnedPink.map((v, i) => v && soPhienTuBuy[i] >= 2);
  })();
  // Luat VAO: bo lenh Mua thuong khi vol nhip chinh >= nguong. CHI loc buy dua vao may trang thai - buyTho goc van dung cho SellTinHieu / dot bo lo (lenh bi bo coi nhu da qua dot, khong mua lai cung dot).
  const volChinhTruoc = p.locVolChinhVao ? tinhVolNhipChinhTruoc({ high, relVol }, { soNen: p.soNenDinhVolChinh }) : null;
  const buyLocVol = volChinhTruoc ? buyTho.map((b, i) => b && !(volChinhTruoc[i] != null && volChinhTruoc[i] >= p.volChinhNguongVao)) : buyTho;
  const buyLocTK = p.yeuCauGiaTenkanKijun ? buyLocVol.map((b, i) => b && tenkan[i] != null && kijun[i] != null && close[i] > tenkan[i] && tenkan[i] > kijun[i]) : buyLocVol;
  const buyVaoMayTrangThai = p.yeuCauGiaTrenTenkanKijun ? buyLocTK.map((b, i) => b && tenkan[i] != null && kijun[i] != null && close[i] > tenkan[i] && close[i] > kijun[i]) : buyLocTK;
  const kq = chayMayTrangThai({
    close,
    open,
    high,
    low,
    atr: atrArr,
    totalScore,
    relVol,
    buyTho: buyVaoMayTrangThai,
    sellTinHieu: sellTinHieuArr,
    rsvniOk,
    giaVaoBar,
    stopVaoBar,
    tp1Vong,
    tp2Vong,
    tp3Vong,
    stopMuaLaiBar,
    muaLaiTinHieu,
    stopMuaMoiBar,
    muaMoiTinHieu,
    dotKetThucBoLo,
    muaMuonTinHieu,
    stopMuaMuonBar,
    muaThemGiuaChungTinHieu,
    stopMuaThemGiuaChungBar,
    kijun,
    thamSo: {
      slChamLaCat: p.slChamLaCat,
      bvHoaVon: p.bvHoaVon,
      bvRong: p.bvRong,
      baoVeRongPct: p.baoVeRongPct,
      hanBoSungPhien: p.hanBoSungPhien,
      entryTh: p.entryTh,
      hanMuaLaiPhien: p.hanMuaLaiPhien,
      muaLaiCaoToiDaPct: p.muaLaiCaoToiDaPct,
      soLanMuaLaiToiDa: p.soLanMuaLaiToiDa,
      ketThucTaiTP3: p.ketThucTaiTP3,
      thoatKijunSauTP2: p.thoatKijunSauTP2,
      thoatKijunVolChinh: p.thoatKijunVolChinh,
      volChinhNguongThoat: p.volChinhNguongThoat,
      sanTrailPct: p.sanTrailPct,
    },
  });

  // ---- Rank/Confidence + breadth cua ma ----
  const breadthNganhMa = breadthCuaMa(ma, ketQuaBreadth);
  const diemRankArr = tinhDiemRank({
    sanyaku,
    fvgDuLon,
    inFVGZone,
    adx,
    breadthPctNganh: new Array(n).fill(breadthNganhMa), // Breadth chi co 1 gia tri "hom nay" (tinh tu du lieu MOI NHAT ca thi truong) - dung chung cho ca chuoi, chi LastValue duoc dung thuc te.
    rsVsVni,
  });
  const diemConfidenceArr = tinhDiemConfidence({ trendScore, momScore, mfScore, totalScore });

  // ---- Cac gia tri "TaiMua" (dong bang tai lan Buy gan nhat) - dung valueWhen 2 tang giong AFL ----
  // (mocKichHoatTaiVuaVao da tinh o tren, truoc chayMayTrangThai - Mua Muon can dung lam input)
  const loaiMocTaiVuaVao = valueWhen(vuaVaoVungMua, loaiMocBar, 1);
  const giaKichHoatTaiMua = valueWhen(kq.buy, mocKichHoatTaiVuaVao, 1);
  const loaiMocTaiMua = valueWhen(kq.buy, loaiMocTaiVuaVao, 1);
  const loaiVaoTaiMua = valueWhen(kq.buy, kq.loaiVaoLenh, 1);

  // ---- Gia mua/SL/TP xuat CSV (AFL dong 919-982, 1180-1193): GiaVaoLenh/StopLossPrice/
  // ChotLoi_TPx_TaiMua DEU la ValueWhen(Buy,X,1) - gia tri tai lan MUA GAN NHAT, giu nguyen MAI MAI
  // (KE CA sau khi da Ban), KHONG gate theo dang-giu-hay-khong. Doi chieu CSV that 2026-09-22 xac
  // nhan AmiBroker luon co gia tri cho cac cot nay du dang MUA/NAM GIU/BAN/TRUNG LAP - truoc day
  // engine gate nham theo dangGiuCuoi lam cac cot nay rong sai cho hau het ma (loi rap code, AFL
  // khong lam vay). stopTaiMua dung cong thuc ung voi CheDoMoc/BatMuaLai=true (MAC_DINH hien tai;
  // xem StopLossPrice = IIf(DungStopMoi, StopMoiTaiMua, ...) trong AFL).
  const giaMuaTaiMua = valueWhen(kq.buy, giaVaoBar, 1);
  const stopTaiMua = valueWhen(kq.buy, stopVaoBar, 1);
  const tp1TaiMua = valueWhen(kq.buy, tp1Vong, 1);
  const tp2TaiMua = valueWhen(kq.buy, tp2Vong, 1);
  const tp3TaiMua = valueWhen(kq.buy, tp3Vong, 1);
  const ngayMuaTaiMuaIso = valueWhen(kq.buy, nen.map((b) => b.t), 1);

  // ---- Cac gia tri "tung cham TP nao" DE HIEN THI (HighestSince TU LUC Buy - BAO GOM CHINH nen
  // Buy, KHAC voi daTP1Vong/2/3 NOI BO cua may trang thai von CHU DINH BO QUA nen vao lenh - day
  // la 2 duong tinh khac nhau CO CHU DICH trong chinh AFL goc, khong phai loi). ----
  // HANG CHI VE T+2,5 (2026-10-20): mua phien T thi toi chieu T+2 hang moi ve, nen CHI TINH dinh tu nen T+2 tro di (khong tinh nen mua va nen T+1 - truoc day web ghi
  // "chot TP1/TP2" ngay phien T+1 la khong ban duoc). Giong backtestChung moPhongThucTe (banTu = iv+2). Hai nen dau sau khi mua -> null.
  const dichPhai = (arr, k) => arr.map((_, i) => (i >= k ? arr[i - k] === true : false));
  const sauMuaItNhat2Nen = barsSince(kq.buy).map((b) => b >= 2);
  const dinhCaoNhatTuKhiMua = highestSince(dichPhai(kq.buy, 2), high).map((v, i) => (sauMuaItNhat2Nen[i] ? v : null));
  const chamTP1TuKhiMua = dinhCaoNhatTuKhiMua.map((v, i) => v != null && kq.tp1VaoVong[i] != null && v >= kq.tp1VaoVong[i]);
  const chamTP2TuKhiMua = dinhCaoNhatTuKhiMua.map((v, i) => v != null && kq.tp2VaoVong[i] != null && v >= kq.tp2VaoVong[i]);
  const chamTP3TuKhiMua = dinhCaoNhatTuKhiMua.map((v, i) => v != null && kq.tp3VaoVong[i] != null && v >= kq.tp3VaoVong[i]);
  const tpDaChamCuoi = chamTP3TuKhiMua[cuoi] ? "TP3" : chamTP2TuKhiMua[cuoi] ? "TP2" : chamTP1TuKhiMua[cuoi] ? "TP1" : "";
  // LENH MUA MOI da cham TP nao (dinh cao nhat cac phien SAU phien vao lenh mua moi, tinh ca hom nay - phien vao lenh mua o gia dong cua nen khong tinh dinh cua no) - web ghi
  // dong chot 30% TP1 / 30% TP2 cua lenh mua moi theo cot nay. Chi co gia tri khi lenh mua moi dang giu hoac vua dong hom nay. AFL 7: MucTPDaChamMuaGiua.
  // Cung quy tac T+2,5: chi tinh dinh tu nen T+2 sau phien vao lenh mua moi (phien vao lenh o gia dong cua).
  const sauGiuaItNhat2Nen = barsSince(kq.muaGiuaSuKien).map((b) => b >= 2);
  const dinhSauMuaGiua = highestSince(dichPhai(kq.muaGiuaSuKien, 2), high).map((v, i) => (sauGiuaItNhat2Nen[i] ? v : null));
  const conLenhGiua = kq.muaGiuaGiu[cuoi] === true || kq.muaGiuaCat[cuoi] > 0;
  const chamGiua = (tp) => conLenhGiua && tp > 0 && dinhSauMuaGiua[cuoi] != null && dinhSauMuaGiua[cuoi] >= tp;
  const tpDaChamGiuaCuoi = chamGiua(kq.muaGiuaTP3[cuoi]) ? "TP3" : chamGiua(kq.muaGiuaTP2[cuoi]) ? "TP2" : chamGiua(kq.muaGiuaTP1[cuoi]) ? "TP1" : "";

  // ---- Trang thai giai ngan (tham do 1 phan / bo sung) ----
  const soPhienTuVaoCuoi = cuoi - kq.viTriVaoTrongVongLap[cuoi];
  const giaiNganCuoi =
    kq.giuTrongVongLap[cuoi] !== 1
      ? ""
      : kq.boSungSuKien[cuoi] === 1
        ? "BO SUNG"
        : kq.thamDoTrongVongLap[cuoi] === 1
          ? (soPhienTuVaoCuoi <= p.hanBoSungPhien ? "MOT PHAN" : "GIU 1 PHAN")
          : "DU";

  // ---- Cac gia tri "hom nay" khac ----
  const dangGiuCuoi = kq.giuTrongVongLap[cuoi] === 1;
  const vuaMuaHomNay = kq.buy[cuoi] === true;
  const banHomNay = kq.sell[cuoi] === true;
  const dangGiuTuTruoc = dangGiuCuoi && !vuaMuaHomNay && !banHomNay;
  const zoneSellCuoi = totalScore[cuoi] <= -p.exitTh;
  const canhBaoBanBotCuoi = dangGiuCuoi && zoneSellCuoi && !banHomNay;
  // ChoPhienSau = ConsecutiveAbove AND VuaVaoVungMua AND NOT VolumeGateNgayDau AND InFVGZoneOk AND
  // ADXGateOk AND [cong chung] - AFL dong 1105-1109 (CHI hien thi/loc "Ma theo doi", khong doi
  // Mua/Ban that su).
  const choPhienSauCuoi = !!(
    consecutiveAbove[cuoi] &&
    vuaVaoVungMua[cuoi] &&
    !volumeGateNgayDau[cuoi] &&
    inFVGZoneOk[cuoi] &&
    adxGateOk[cuoi] &&
    congChung[cuoi]
  );
  const phanTramDoiCuoi = cuoi > 0 && close[cuoi - 1] > 0 ? (close[cuoi] / close[cuoi - 1] - 1) * 100 : null;
  // AFL: GiaTriGDTB20 = MA(C*V,20) / 1000000 (dong 1012) - don vi TRIEU dong/phien, khong phai dong tho.
  const gtgdTB20Tho = sma(
    close.map((c, i) => c * volume[i]),
    20
  )[cuoi];
  const gtgdTB20Cuoi = gtgdTB20Tho == null ? null : gtgdTB20Tho / 1e6;
  const khoiLuongTB20Cuoi = sma(volume, 20)[cuoi];
  const dinh52TCuoi = hhv(high, 252)[cuoi];
  // VI TRI GIA TRONG BIEN DO 120 PHIEN (0 = day, 1 = dinh): (dong cua - thap nhat 120) / (cao nhat 120 - thap nhat 120). Chi hien thi nhan thong tin, KHONG tham gia tin hieu (nghien cuu 27/10/2026).
  const dinh120 = hhv(high, 120)[cuoi], day120 = llv(low, 120)[cuoi];
  const viTri120 = dinh120 != null && day120 != null && dinh120 > day120 ? (close[cuoi] - day120) / (dinh120 - day120) : null;

  let kumoTwistCuoi = "";
  if (cuoi > 0 && senkouAGoc[cuoi] != null && senkouBGoc[cuoi] != null && senkouAGoc[cuoi - 1] != null && senkouBGoc[cuoi - 1] != null) {
    if (senkouAGoc[cuoi] > senkouBGoc[cuoi] && senkouAGoc[cuoi - 1] <= senkouBGoc[cuoi - 1]) kumoTwistCuoi = "TANG";
    else if (senkouAGoc[cuoi] < senkouBGoc[cuoi] && senkouAGoc[cuoi - 1] >= senkouBGoc[cuoi - 1]) kumoTwistCuoi = "GIAM";
  }

  const vonHoa = ma === "VNINDEX" ? "ChiSo" : phanLoaiVonHoa(ma) ?? "Khac";
  const tin = vuaMuaHomNay ? "MUA" : dangGiuTuTruoc ? "NAM GIU" : banHomNay ? "BAN" : "TRUNG LAP";

  // Chi thuc su duoc doc khi mua2Giu[cuoi] dung (xem ngay_mua_moi ben duoi) - luc do mua2Vi chac
  // chan la vi tri nen VAO LENH THAT, khong phai gia tri khoi tao 0 mac dinh.
  const ngayMuaMoiVT = nen[kq.mua2Vi[cuoi]]?.t ?? null;
  const ngayMuaGiuaVT = nen[kq.muaGiuaVi[cuoi]]?.t ?? null;
  const laiLoTaiMuaCuoi = giaMuaTaiMua[cuoi] > 0 ? (close[cuoi] / giaMuaTaiMua[cuoi] - 1) * 100 : 0;

  const mocTiep = tinhMocTiepTheo({ gia: close[cuoi], cloudTop: cloudTop[cuoi], cloudBot: cloudBot[cuoi], cbTop: cbTop[cuoi], cbBot: cbBot[cuoi], totalScore: totalScore[cuoi] });

  const hangCuoi = {
    ma,
    tin,
    diem: totalScore[cuoi],
    trend: trendScore[cuoi],
    mom: momScore[cuoi],
    dt: mfScore[cuoi],
    adx: adx[cuoi],
    gia: close[cuoi],
    doi: phanTramDoiCuoi,
    rs_vni: rsVsVni[cuoi],
    rs_vni_60: rsVsVni60[cuoi],
    atr_pct: close[cuoi] > 0 ? (atrArr[cuoi] / close[cuoi]) * 100 : null, // ATR/gia (%) - chi hien thi canh bao "bien dong manh" tren So lenh, khong tham gia tin hieu
    breadth_nganh: breadthNganhMa,
    kijun: kijun[cuoi],
    gg_top: cbTop[cuoi],
    gg_bot: cbBot[cuoi],
    dinh_52t: dinh52TCuoi,
    vi_tri_120: viTri120,
    stop_loss: stopTaiMua[cuoi],
    mat_than: matThan[cuoi],
    tp1: tp1TaiMua[cuoi],
    tp2: tp2TaiMua[cuoi],
    tp3: tp3TaiMua[cuoi],
    gtgd_tb20: gtgdTB20Cuoi,
    fvg_ok: fvgDuLon[cuoi],
    so_phien_giu: barsSince(kq.buy)[cuoi],
    lai_lo_pct: laiLoTaiMuaCuoi,
    sanyaku: sanyaku[cuoi],
    kumo_twist: kumoTwistCuoi,
    ngay_bien_doi: false, // TODO (display-only, xem chu thich dau file)
    von_hoa: vonHoa,
    gia_mua: giaMuaTaiMua[cuoi],
    ngay_mua: ngayVN(ngayMuaTaiMuaIso[cuoi]),
    ban_bot: canhBaoBanBotCuoi,
    san: ma === "VNINDEX" ? "HOSE" : san,
    nganh: ma === "VNINDEX" ? "ChiSo" : (nganhCuaMa(ma) ?? "Khac"),
    tp_da_cham: tpDaChamCuoi,
    diem_rank: diemRankArr[cuoi],
    diem_confidence: diemConfidenceArr[cuoi],
    khoi_luong_tb20: khoiLuongTB20Cuoi,
    giai_ngan: giaiNganCuoi,
    gia_kich_hoat: giaKichHoatTaiMua[cuoi] ?? null,
    moc_kich_hoat: loaiMocTaiMua[cuoi] === 3 ? "MAY+CAN BANG" : loaiMocTaiMua[cuoi] === 1 ? "MAY" : loaiMocTaiMua[cuoi] === 2 ? "CAN BANG" : "GIA",
    moc_gia: mocTiep.gia,
    moc_loai: mocTiep.loai,
    moc_cach_pct: mocTiep.cachPct,
    diem_neu_vuot: mocTiep.diemNeuVuot,
    che_do_vao: p.cheDoMoc ? "MOI" : "CU",
    loai_vao: loaiVaoTaiMua[cuoi] === 2 ? "MUA LAI" : loaiVaoTaiMua[cuoi] === 3 ? "MUA MUON" : "",
    cho_phien_sau: choPhienSauCuoi,
    mua_moi: kq.mua2SuKien[cuoi],
    dang_giu_moi: kq.mua2Giu[cuoi],
    cat_moi: kq.mua2Cat[cuoi] || null,
    gia_mua_moi: kq.mua2Giu[cuoi] ? kq.mua2Gia[cuoi] : null,
    stop_moi: kq.mua2Giu[cuoi] ? kq.mua2Stop[cuoi] : null,
    tp1_moi: kq.mua2Giu[cuoi] ? kq.mua2TP1[cuoi] : null,
    tp2_moi: kq.mua2Giu[cuoi] ? kq.mua2TP2[cuoi] : null,
    tp3_moi: kq.mua2Giu[cuoi] ? kq.mua2TP3[cuoi] : null,
    ngay_mua_moi: kq.mua2Giu[cuoi] ? ngayVN(ngayMuaMoiVT) : null,
    ly_do_ban: banHomNay ? kq.lyDoBanBar[cuoi] || null : null,
    dang_bao_ve_lai: dangGiuTuTruoc && kq.stopBaoVeMoiNen[cuoi] > 0,
    stop_bao_ve: dangGiuTuTruoc && kq.stopBaoVeMoiNen[cuoi] > 0 ? kq.stopBaoVeMoiNen[cuoi] : 0,
    // MUA THEM GIUA CHUNG (vong doc lap voi mua_moi/vong 2, mo TRUOC khi cham du TP3) - bo sung
    // 2026-09-23, cung khuon voi mua_moi/dang_giu_moi/... o tren.
    mua_giua: kq.muaGiuaSuKien[cuoi],
    dang_giu_giua: kq.muaGiuaGiu[cuoi],
    cat_giua: kq.muaGiuaCat[cuoi] || null,
    gia_mua_giua: kq.muaGiuaGiu[cuoi] ? kq.muaGiuaGia[cuoi] : null,
    stop_giua: kq.muaGiuaGiu[cuoi] ? kq.muaGiuaStop[cuoi] : null,
    tp1_giua: kq.muaGiuaGiu[cuoi] ? kq.muaGiuaTP1[cuoi] : null,
    tp2_giua: kq.muaGiuaGiu[cuoi] ? kq.muaGiuaTP2[cuoi] : null,
    tp3_giua: kq.muaGiuaGiu[cuoi] ? kq.muaGiuaTP3[cuoi] : null,
    ngay_mua_giua: kq.muaGiuaGiu[cuoi] ? ngayVN(ngayMuaGiuaVT) : null,
    tp_da_cham_giua: tpDaChamGiuaCuoi,
  };
  // CHI DE BACKTEST (mac dinh TAT, khong anh huong CSV/upload): thamSo.traChuoi = true tra them CA CHUOI theo tung nen de mo phong lai
  // cach quan ly lenh (vd kieu chot loi khac) tren dung cac lan vao lenh/tin hieu BAN cua engine - xem engine/dich-vu/backtestChotLoi.mjs.
  if (p.traChuoi) hangCuoi._chuoi = { nen, close, open, high, low, kijun, tenkan, atr: atrArr, totalScore, sellTinHieu: sellTinHieuArr, kq, diemRank: diemRankArr, diemConfidence: diemConfidenceArr, adx, rsVsVni, relVol, cloudTop, cloudBot, cbTop, cbBot, sanyaku, trendScore, momScore, mfScore };
  return hangCuoi;
}
