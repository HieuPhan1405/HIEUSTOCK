// Port AFL dong 341-345, 503-524: cac "cong" (gate) AND chung vao Buy/MuaLaiTinHieu/MuaMoiTinHieu.
import { sma } from "./mang.js";

// ChiTrong12NamGanNhat - AFL dong 341-344: mac dinh gioi han 12 nam gan nhat (uoc tinh 250
// phien/nam), luon True neu thamSo.soNamGanNhat <= 0 (khong gioi han).
export function tinhChiTrongNamGanNhat(n, { soNamGanNhat = 12 } = {}) {
  if (soNamGanNhat <= 0) return new Array(n).fill(true);
  const soPhienUocTinh = soNamGanNhat * 250;
  const ketQua = new Array(n).fill(false);
  for (let i = 0; i < n; i++) ketQua[i] = i >= n - 1 - soPhienUocTinh;
  return ketQua;
}

// Cong khoi luong toi thieu - AFL dong 507-509.
export function tinhThanhKhoanOk(volume, { nguongKLTB20ToiThieu = 100000 } = {}) {
  const tb20 = sma(volume, 20);
  return tb20.map((v) => v != null && v >= nguongKLTB20ToiThieu);
}

// Cong gia toi thieu (tranh co phieu "tra") - AFL dong 515-516.
export function tinhGiaToiThieuOk(close, { nguongGiaToiThieu = 10 } = {}) {
  return close.map((v) => v >= nguongGiaToiThieu);
}

// RSGateOk - AFL dong 518-524: mac dinh (choPhepMuaKhiRSAm=true) LUON cho qua (van MUA nhung
// chi giai ngan 1 phan - xem may trang thai), chi chan han khi tat toggle nay.
export function tinhRSGateOk(rsvniOk, { choPhepMuaKhiRSAm = true } = {}) {
  return choPhepMuaKhiRSAm ? new Array(rsvniOk.length).fill(true) : rsvniOk;
}

// RS_SoVoiVNI - AFL dong 39-42: RS 20 phien cua ma SO VOI VNINDEX cung ky.
export function tinhRSVoiVNIndex(close, vniClose) {
  const n = close.length;
  const ketQua = new Array(n).fill(null);
  for (let i = 20; i < n; i++) {
    if (!(close[i - 20] > 0) || !(vniClose[i - 20] > 0)) continue;
    const doiMa = close[i] / close[i - 20] - 1;
    const doiVNI = vniClose[i] / vniClose[i - 20] - 1;
    ketQua[i] = (doiMa - doiVNI) * 100;
  }
  return ketQua;
}
