// VI TRI CUA CHI SO SO VOI "VUNG GIA TRI" (Volume Profile) - ham thuan, dung chung cho web (the tren trang Thi truong) va nghien cuu.
// Cach tinh: ho so khoi luong theo muc gia cua SO_PHIEN phien gan nhat (nen ngay; lib/volumeProfile.js) -> POC, VAH, VAL (vung chua 70% khoi luong).
//   dong cua > VAH  -> "tren"  (thi truong dang duoc chap nhan o vung gia cao hon)
//   dong cua < VAL  -> "duoi"  (thi truong roi khoi vung giao dich chinh ve phia duoi)
//   con lai         -> "trong"
// Da kiem chung 2026-10-14 (engine/dich-vu/nghienCuuVPVni.mjs, ~4.470 lenh mua cua he thong 2014-2026, mua mo cua phien sau): lenh mo khi VN-Index "duoi" kem ro so voi
// phan con lai o ca 3 giai doan (<=2019, 2020-2022, 2023+). Chi la BOI CANH thi truong de tham khao, KHONG phai dieu kien mua / ban cua he thong.
import { tinhHoSoKhoiLuong } from "./volumeProfile.js";

export const SO_PHIEN_VUNG_GIA_TRI = 60;

// nen: [{ t, o, h, l, c, v }] nen NGAY tang dan (phan tu cuoi = phien gan nhat). Tra ve null neu khong du du lieu.
export function viTriTheoVungGiaTri(nen, soPhien = SO_PHIEN_VUNG_GIA_TRI) {
  if (!Array.isArray(nen) || nen.length < soPhien) return null;
  const cuaSo = nen.slice(-soPhien);
  const hs = tinhHoSoKhoiLuong(cuaSo, { soHang: 120 });
  if (!hs) return null;
  const cuoi = cuaSo[cuaSo.length - 1];
  const dong = cuoi.c;
  const viTri = dong > hs.vah ? "tren" : dong < hs.val ? "duoi" : "trong";
  return { viTri, dong, ngay: cuoi.t, poc: hs.poc, vah: hs.vah, val: hs.val, thap: hs.giaThap, cao: hs.giaCao, soPhien };
}
