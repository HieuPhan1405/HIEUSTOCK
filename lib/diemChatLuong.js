// DIEM CHAT LUONG /100 cua tin hieu MUA (chi de THAM KHAO: KHONG chan lenh, KHONG doi tin hieu MUA/BAN, KHONG thay diem hop luu) - ham THUAN, test tay: engine/test/diemChatLuong.test.mjs.
// Cach tinh: PHAN TRAM XEP HANG cua "vi tri gia trong bien do 120 phien" (pos = (dong cua - thap nhat 120) / (cao nhat 120 - thap nhat 120)) so voi cac lan hien tin hieu MUA thuong cua he thong 2014-2026
// (~4.400 lan, engine/dich-vu/nghienCuuDiem100.mjs, 10/11/2026). Diem 80 = vi tri cao hon ~80% cac lan hien tin hieu; 100 = o dinh bien do.
// Kiem chung NGOAI MAU tung nam 2018-2026 (hoc cac nam truoc, du doan nam sau, tuong quan hang IC ~0,10; diem hop luu cu IC ~0,03): lai TB va ty le lenh lai TANG DEU theo diem (xem BANG_LICH_SU).
// Chi dung cho tin hieu MUA moi (row.tin === "MUA"): voi ma dang NAM GIU, vi_tri_120 la vi tri HIEN TAI, khong phai luc vao lenh. Mua moi / Mua muon: loc theo vi tri KHONG cuu duoc ket qua nen khong cham diem.
// Luat noi dung (nhu lib/nhanTinHieu.js): KHONG hien nguong vi tri tren giao dien; moi mo ta kem "chi de tham khao, ket qua qua khu khong dam bao tuong lai".

// Cac moc phan vi 0%,5%,...,100% cua pos tai ngay hien tin hieu MUA (21 gia tri, tang dan).
export const MOC_PHAN_VI_VI_TRI = [0.0485, 0.2652, 0.3137, 0.3552, 0.3928, 0.4338, 0.469, 0.5069, 0.5254, 0.5557, 0.5861, 0.6142, 0.6431, 0.6746, 0.7084, 0.7382, 0.7663, 0.7993, 0.8339, 0.8889, 1];

// Thong ke lich su theo khoang diem (ngoai mau 2018-2026, mua mo cua phien sau, ban tu T+2,5, chot 30/30 + theo tin hieu BAN, phi 0,4%). soLenh la so lenh ngoai mau; ket qua QUA KHU, khong dam bao tuong lai.
export const BANG_LICH_SU = [
  { tu: 0, den: 19, nhan: "Rất yếu", soLenh: 831, tyLeLai: 33, laiTB: -0.9 },
  { tu: 20, den: 39, nhan: "Yếu", soLenh: 830, tyLeLai: 36, laiTB: -0.3 },
  { tu: 40, den: 59, nhan: "Trung bình", soLenh: 777, tyLeLai: 38, laiTB: 0.1 },
  { tu: 60, den: 79, nhan: "Tốt", soLenh: 700, tyLeLai: 41, laiTB: 0.3 },
  { tu: 80, den: 100, nhan: "Rất tốt", soLenh: 689, tyLeLai: 54, laiTB: 2.8 },
];

const so = (v) => (v == null || v === "" ? NaN : Number(v));

// pos (0..1) -> diem nguyen 0..100 (noi suy tuyen tinh giua cac moc phan vi). null neu khong co so lieu.
export function diemChatLuong(viTri120) {
  const v = so(viTri120);
  if (!Number.isFinite(v)) return null;
  const k = MOC_PHAN_VI_VI_TRI;
  if (v <= k[0]) return 0;
  if (v >= k[k.length - 1]) return 100;
  let j = 0;
  while (j < k.length - 2 && v > k[j + 1]) j++;
  const rong = k[j + 1] - k[j];
  const t = rong > 0 ? (v - k[j]) / rong : 0;
  return Math.max(0, Math.min(100, Math.round(5 * (j + t))));
}

// diem -> { khoa, nhan, mau, moTa }
export function bacChatLuong(diem) {
  const d = so(diem);
  if (!Number.isFinite(d)) return null;
  if (d >= 80) return { khoa: "rat_tot", nhan: "Rất tốt", mau: "var(--xanh)" };
  if (d >= 60) return { khoa: "tot", nhan: "Tốt", mau: "var(--xanh-nhat)" };
  if (d >= 40) return { khoa: "trung_binh", nhan: "Trung bình", mau: "var(--mo)" };
  if (d >= 20) return { khoa: "yeu", nhan: "Yếu", mau: "var(--vang)" };
  return { khoa: "rat_yeu", nhan: "Rất yếu", mau: "var(--do)" };
}

// row: dong tin hieu. Chi cham cho tin hieu MUA moi. Tra ve { diem, bac, moTa } hoac null.
export function diemChatLuongCho(row) {
  if (!row || row.tin !== "MUA") return null;
  const diem = diemChatLuong(row.vi_tri_120);
  if (diem == null) return null;
  const bac = bacChatLuong(diem);
  return { diem, bac, moTa: `Điểm chất lượng ${diem}/100 (${bac.nhan.toLowerCase()}): đo mức độ cao của giá trong biên độ khoảng 6 tháng so với các tín hiệu MUA trước đây. Thống kê lịch sử cho thấy điểm càng cao thì tỷ lệ lệnh có lãi càng cao. Chỉ để tham khảo, kết quả quá khứ không đảm bảo tương lai, không phải khuyến nghị.` };
}

// Cau thong ke cho khung giai nghia (Mây / GiaiNghia). Chi so lieu lich su, kem canh bao.
export function cauThongKeLichSu() {
  return BANG_LICH_SU.map((b) => `${b.tu}–${b.den} (${b.nhan}): ${b.tyLeLai}% lệnh có lãi, lãi trung bình ${b.laiTB > 0 ? "+" : ""}${String(b.laiTB).replace(".", ",")}%/lệnh`).join("; ");
}
