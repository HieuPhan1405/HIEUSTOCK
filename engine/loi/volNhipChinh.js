// VOL NHIP CHINH TRUOC PHIEN TIN HIEU (2026-10-19, backtest engine/dich-vu/backtestGopHaiLuat.mjs): "chinh vol be = chinh de len, chinh vol lon = mat xu huong".
// Nhip chinh tai nen i = tu DINH cao nhat soNen nen truoc (i - soNen .. i - 1) toi truoc nen i; vol = relVol (KL / TB20) TRUNG BINH cac phien do (khong tinh nen i).
// Neu dinh la nen i - 1 (chua chinh) thi lay relVol cua nen i - 1. Thieu du lieu (i < soNen + 2) -> null. KHONG nhin truoc tuong lai.
// Dung cho luat VAO: bo lenh Mua thuong khi vol nhip chinh >= nguong (mac dinh 1,2). Phai KHOP backtestGopHaiLuat.mjs nhipChinh(t, 20) va AFL (VolChinhTruoc).
export function tinhVolNhipChinhTruoc({ high, relVol }, { soNen = 20 } = {}) {
  const n = high.length;
  const kq = new Array(n).fill(null);
  for (let i = soNen + 2; i < n; i++) {
    let dIdx = i - 1;
    for (let j = i - 1; j >= i - soNen; j--) if (high[j] > high[dIdx]) dIdx = j;
    if (dIdx >= i - 1) {
      kq[i] = relVol[i - 1];
      continue;
    }
    let tong = 0;
    let dem = 0;
    for (let j = dIdx + 1; j <= i - 1; j++) {
      tong += relVol[j];
      dem++;
    }
    kq[i] = tong / dem;
  }
  return kq;
}
