// Chi bao ky thuat cho bieu do - cong thuc GIONG HET AFL (7/9), chay thuan tren mang nen, khong phu thuoc thu vien.
//   Tenkan/Kijun/Senkou = Ichimoku 9-17-33, may dich 26 phien; duong can bang dai han = (HHV+LLV)/2 cua 65 va 129 phien.
// bars: [{ h, l, c, ... }] tang dan theo thoi gian. Gia tri chua du du lieu la null.

export const THAM_SO_MAC_DINH = { tenkan: 9, kijun: 17, senkouB: 33, dichMay: 26, canBang1: 65, canBang2: 129 };

// (HHV(H,len) + LLV(L,len)) / 2 tai tung nen; null khi chua du len nen.
export function trungDiemCaoThap(bars, len) {
  const kq = new Array(bars.length).fill(null);
  for (let i = len - 1; i < bars.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - len + 1; j <= i; j++) {
      if (bars[j].h > hh) hh = bars[j].h;
      if (bars[j].l < ll) ll = bars[j].l;
    }
    kq[i] = (hh + ll) / 2;
  }
  return kq;
}

export function trungBinhDon(bars, len) {
  const kq = new Array(bars.length).fill(null);
  let tong = 0;
  for (let i = 0; i < bars.length; i++) {
    tong += bars[i].c;
    if (i >= len) tong -= bars[i - len].c;
    if (i >= len - 1) kq[i] = tong / len;
  }
  return kq;
}

// Tra ve:
//   tenkan[i], kijun[i]  : theo tung nen (khong dich)
//   spanA[j], spanB[j]   : vi tri ve j = nen i + dichMay, nen dai n + dichMay (phan cuoi la "may tuong lai")
//   chikou[j]            : gia dong cua nen j + dichMay, ve lui tai nen j (chi co khi j + dichMay < n)
export function tinhIchimoku(bars, tham = {}) {
  const t = { ...THAM_SO_MAC_DINH, ...tham };
  const n = bars.length;
  const tenkan = trungDiemCaoThap(bars, t.tenkan);
  const kijun = trungDiemCaoThap(bars, t.kijun);
  const senkouB = trungDiemCaoThap(bars, t.senkouB);
  const spanA = new Array(n + t.dichMay).fill(null);
  const spanB = new Array(n + t.dichMay).fill(null);
  for (let i = 0; i < n; i++) {
    if (tenkan[i] != null && kijun[i] != null) spanA[i + t.dichMay] = (tenkan[i] + kijun[i]) / 2;
    if (senkouB[i] != null) spanB[i + t.dichMay] = senkouB[i];
  }
  const chikou = new Array(n).fill(null);
  for (let j = 0; j + t.dichMay < n; j++) chikou[j] = bars[j + t.dichMay].c;
  return { tenkan, kijun, spanA, spanB, chikou };
}

// Duong can bang dai han 1 (65), 2 (129) va bien tren/duoi (CBTop/CBBot trong AFL).
export function tinhCanBang(bars, tham = {}) {
  const t = { ...THAM_SO_MAC_DINH, ...tham };
  const cb1 = trungDiemCaoThap(bars, t.canBang1);
  const cb2 = trungDiemCaoThap(bars, t.canBang2);
  const top = cb1.map((v, i) => (v != null && cb2[i] != null ? Math.max(v, cb2[i]) : null));
  const bot = cb1.map((v, i) => (v != null && cb2[i] != null ? Math.min(v, cb2[i]) : null));
  return { cb1, cb2, top, bot };
}
