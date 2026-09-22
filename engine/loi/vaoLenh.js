// Port AFL dong 563-665: gia vao lenh tai MOC CHUYEN MUA + SL cau truc (CheDoMoc), 3 muc TP dung
// chung cho ca lenh goc/Mua lai/Mua them (TP1Vong/TP2Vong/TP3Vong), va tin hieu+SL cua MUA LAI +
// MUA MOI SAU TP3. CAC HAM O DAY CHUA AND VOI CONG CHUNG (ChiTrong12NamGanNhat, RSGateOk,
// ThanhKhoanKL_Ok, GiaToiThieuOk, BreadthOk15) - noi goi (assembly) phai tu AND them truoc khi
// dua vao engine/loi/mayTrangThai.js, giong dung thu tu AFL.
import { ref, hhv, valueWhen } from "./mang.js";

const KHONG_CO_MOC = 1e10;

// { close, open, high, low, atr, cloudTop, cbTop, cbBot, kijun, vuaVaoVungMua }
export function tinhCheDoMocVaoLenh(
  { close, open, high, low, atr, cloudTop, cbTop, cbBot, kijun, vuaVaoVungMua },
  { cheDoMoc = true, slKieuMoc = true, slKieuDay = false, demSLtheoATR = 0.3, slToiThieuPct = 2, hardStopPct = 6, atrMult = 2.2 } = {}
) {
  const n = close.length;
  const closeTruoc = ref(close, -1);
  const cloudTopTruoc = ref(cloudTop, -1);
  const cbTopTruoc = ref(cbTop, -1);

  const vuotMayBar = new Array(n).fill(false);
  const vuotCBBar = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    vuotMayBar[i] = cloudTop[i] != null && close[i] > cloudTop[i] && cloudTopTruoc[i] != null && closeTruoc[i] != null && closeTruoc[i] <= cloudTopTruoc[i];
    vuotCBBar[i] = cbTop[i] != null && close[i] > cbTop[i] && cbTopTruoc[i] != null && closeTruoc[i] != null && closeTruoc[i] <= cbTopTruoc[i];
  }

  const mucVuotBar = new Array(n);
  const loaiMocBar = new Array(n);
  const mocDatSLBar = new Array(n);
  for (let i = 0; i < n; i++) {
    if (vuotMayBar[i] && vuotCBBar[i]) {
      mucVuotBar[i] = Math.max(cloudTop[i], cbTop[i]);
      loaiMocBar[i] = 3;
      mocDatSLBar[i] = Math.min(cloudTop[i], cbTop[i]);
    } else if (vuotMayBar[i]) {
      mucVuotBar[i] = cloudTop[i];
      loaiMocBar[i] = 1;
      mocDatSLBar[i] = cloudTop[i];
    } else if (vuotCBBar[i]) {
      mucVuotBar[i] = cbTop[i];
      loaiMocBar[i] = 2;
      mocDatSLBar[i] = cbTop[i];
    } else {
      mucVuotBar[i] = close[i];
      loaiMocBar[i] = 0;
      mocDatSLBar[i] = KHONG_CO_MOC;
    }
  }
  const giaKichHoatBar = mucVuotBar.map((v, i) => Math.max(v, Math.min(open[i], close[i])));
  const mocDatSLTaiSwitch = valueWhen(vuaVaoVungMua, mocDatSLBar, 1);
  const dayNenTaiSwitch = valueWhen(vuaVaoVungMua, low, 1);

  const giaVaoBar = new Array(n);
  const stopVaoBar = new Array(n);
  for (let i = 0; i < n; i++) {
    giaVaoBar[i] = cheDoMoc && vuaVaoVungMua[i] ? giaKichHoatBar[i] : close[i];
    const baseSL = slKieuMoc ? mocDatSLTaiSwitch[i] : slKieuDay ? dayNenTaiSwitch[i] : kijun[i];
    const baseSLHopLe = baseSL != null && baseSL > 0 && baseSL < giaVaoBar[i];
    let slTheoATR6 = giaVaoBar[i] - Math.min(atr[i] * atrMult, giaVaoBar[i] * (hardStopPct / 100));
    if (cheDoMoc && baseSLHopLe) {
      let slCauTruc = Math.min(baseSL - demSLtheoATR * atr[i], giaVaoBar[i] * (1 - slToiThieuPct / 100));
      slCauTruc = Math.max(slCauTruc, giaVaoBar[i] * (1 - hardStopPct / 100));
      stopVaoBar[i] = slCauTruc;
    } else {
      stopVaoBar[i] = slTheoATR6;
    }
  }

  return { vuotMayBar, vuotCBBar, giaKichHoatBar, loaiMocBar, giaVaoBar, stopVaoBar };
}

// 3 muc chot loi dung chung (lenh goc + Mua lai + Mua them) - AFL dong 616-621 (= ChotLoi_TP1-3
// dong ~940, CUNG 1 cong thuc, chi khac ten bien giua 2 cho dung trong AFL).
export function tinhBaMocChotLoi({ high, giaVaoBar, cloudTop, cbTop }) {
  const n = high.length;
  const hhv60 = hhv(high, 60);
  const hhv252 = hhv(high, 252);
  const nGan = new Array(n);
  const nGiua = new Array(n);
  const nXa = new Array(n);
  for (let i = 0; i < n; i++) {
    nGan[i] = Math.max(hhv60[i] ?? -Infinity, giaVaoBar[i] * 1.05);
    nGiua[i] = Math.max(Math.max(cbTop[i] ?? -Infinity, cloudTop[i] ?? -Infinity), giaVaoBar[i] * 1.1);
    nXa[i] = Math.max(hhv252[i] ?? -Infinity, giaVaoBar[i] * 1.15);
  }
  const tp1 = new Array(n);
  const tp3 = new Array(n);
  const tp2 = new Array(n);
  for (let i = 0; i < n; i++) {
    tp1[i] = Math.min(Math.min(nGan[i], nGiua[i]), nXa[i]);
    tp3[i] = Math.max(Math.max(nGan[i], nGiua[i]), nXa[i]);
    tp2[i] = nGan[i] + nGiua[i] + nXa[i] - tp1[i] - tp3[i];
  }
  return { tp1Vong: tp1, tp2Vong: tp2, tp3Vong: tp3 };
}

// MUA LAI - AFL dong 623-641. CHUA and voi cong chung (xem chu thich dau file).
export function tinhMuaLai(
  { close, open, high, low, atr, totalScore, cloudTop, kijun, cbBot },
  { batMuaLai = true, kieuHoTro = "Kijun", diemToiThieu = 0.75, doChamHoTroPct = 1, demSLtheoATR = 0.3, slToiThieuPct = 2, hardStopPct = 6, atrMult = 2.2 } = {}
) {
  const n = close.length;
  const hoTro = kieuHoTro === "Kijun" ? kijun : cbBot;
  const closeTruoc = ref(close, -1);
  const tinHieu = new Array(n).fill(false);
  const stop = new Array(n);
  for (let i = 0; i < n; i++) {
    const ht = hoTro[i];
    tinHieu[i] =
      batMuaLai &&
      ht > 0 &&
      low[i] <= ht * (1 + doChamHoTroPct / 100) &&
      close[i] > ht &&
      close[i] > open[i] &&
      closeTruoc[i] != null &&
      close[i] > closeTruoc[i] &&
      totalScore[i] >= diemToiThieu &&
      cloudTop[i] != null &&
      close[i] > cloudTop[i];

    let slTho = Math.min(ht - demSLtheoATR * atr[i], ht * (1 - slToiThieuPct / 100));
    slTho = Math.max(slTho, ht * (1 - hardStopPct / 100));
    stop[i] = ht > 0 && ht < close[i] ? slTho : close[i] - Math.min(atr[i] * atrMult, close[i] * (hardStopPct / 100));
  }
  return { muaLaiTinHieu: tinHieu, stopMuaLaiBar: stop };
}

// MUA THEM SAU TP3 (vong 2) - AFL dong 651-665. CHUA and voi cong chung.
export function tinhMuaMoiSauTP3(
  { close, open, high, low, atr, totalScore, cloudTop, kijun, cbBot },
  {
    batMuaMoi = true,
    kieuHoTro = "Kijun",
    diemToiThieu = 1.25,
    caoToiDaPct = 4,
    doChamHoTroPct = 1,
    demSLtheoATR = 0.3,
    slToiThieuPct = 2,
    hardStopPct = 6,
    atrMult = 2.2,
  } = {}
) {
  const n = close.length;
  const hoTro = kieuHoTro === "Kijun" ? kijun : cbBot;
  const closeTruoc = ref(close, -1);
  const tinHieu = new Array(n).fill(false);
  const stop = new Array(n);
  for (let i = 0; i < n; i++) {
    const ht = hoTro[i];
    tinHieu[i] =
      batMuaMoi &&
      ht > 0 &&
      low[i] <= ht * (1 + doChamHoTroPct / 100) &&
      close[i] > ht &&
      close[i] <= ht * (1 + caoToiDaPct / 100) &&
      close[i] > open[i] &&
      closeTruoc[i] != null &&
      close[i] > closeTruoc[i] &&
      totalScore[i] >= diemToiThieu &&
      cloudTop[i] != null &&
      close[i] > cloudTop[i];

    let slTho = Math.min(ht - demSLtheoATR * atr[i], ht * (1 - slToiThieuPct / 100));
    slTho = Math.max(slTho, ht * (1 - hardStopPct / 100));
    stop[i] = ht > 0 && ht < close[i] ? slTho : close[i] - Math.min(atr[i] * atrMult, close[i] * (hardStopPct / 100));
  }
  return { muaMoiTinHieu: tinHieu, stopMuaMoiBar: stop };
}
