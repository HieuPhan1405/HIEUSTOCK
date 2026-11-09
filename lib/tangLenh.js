// TANG LENH A / A+ / A++ cua tin hieu MUA thuong (chi de THAM KHAO: KHONG doi tin hieu MUA/BAN, KHONG chan lenh) - ham THUAN, test tay: engine/test/tangLenh.test.mjs.
// Dinh nghia lay tu nghien cuu 10/11/2026 (engine/dich-vu/nghienCuuLenhTotNhat.mjs, ~4.400 lenh Mua thuong 2014-2026, mua mo cua phien sau nua, T+2,5, HT, phi 0,4%):
//   "sao"  = gia o vung cao bien do 120 phien (pos >= 0,8) HOAC (pos >= 0,6 va VN-Index 5 phien > 1%)
//   A      = sao + phien sau xac nhan (dong cua phien sau > dong cua ngay tin hieu)
//   A+     = A + (suc manh so VN-Index 20 phien trong khoang 0..10 diem % HOAC khoi ngoai mua rong 20 phien)
//   A++    = A + suc manh 20 phien 0..10 diem % VA khoi ngoai mua rong 20 phien
// Ngay tin hieu moi hien: chua biet phien sau -> trangThai "cho" (tang DU KIEN). Phien sau dong cua cao hon -> "xacNhan"; thap hon / bang -> "khong" (khong con xep tang).
// Nguong chi dat o day, KHONG hien so tren giao dien (luat noi dung). Kiem chung ngoai mau tu 2022.5 (TEST) - xem THONG_KE_TANG.
export const THONG_KE_TANG = [
  { tang: "A", soLenh: 344, tyLeLai: 56, laiTB: 1.9 },
  { tang: "A+", soLenh: 248, tyLeLai: 58, laiTB: 2.3 },
  { tang: "A++", soLenh: 82, tyLeLai: 60, laiTB: 5.0 },
];

const so = (v) => (v == null || v === "" ? NaN : Number(v));
const tangSo = { A: 1, "A+": 2, "A++": 3 };

// nen: [{ t, c, h, l }] tang dan theo ngay; vni: [{ t, c }] tang dan; ngayTin: "YYYY-MM-DD" (ngay tin hieu MUA); ngoai: [{ ngay, rongTy }] tang dan (hoac null neu chua co).
// Tra ve null neu thieu so lieu (khong doan bua); nguoc lai { tang | null, trangThai: "cho" | "xacNhan" | "khong", sao, rsOk, ngoaiOk, diemSo }.
export function tinhTangLenh({ nen, vni, ngayTin, ngoai }) {
  if (!Array.isArray(nen) || !Array.isArray(vni) || !ngayTin || !Array.isArray(ngoai)) return null;
  const i = nen.findIndex((b) => b.t === ngayTin);
  const j = vni.findIndex((b) => b.t === ngayTin);
  if (i < 120 || j < 20) return null;
  let mn = Infinity, mx = -Infinity;
  for (let k = i - 119; k <= i; k++) {
    mn = Math.min(mn, so(nen[k].l));
    mx = Math.max(mx, so(nen[k].h));
  }
  const c = so(nen[i].c);
  if (!(mx > mn) || !(c > 0)) return null;
  const pos = (c - mn) / (mx - mn);
  const c5 = so(vni[j - 5].c), c20 = so(vni[j - 20].c), cv = so(vni[j].c), cm20 = so(nen[i - 20].c);
  if (!(c5 > 0) || !(c20 > 0) || !(cv > 0) || !(cm20 > 0)) return null;
  const d5 = (cv / c5 - 1) * 100;
  const sao = pos >= 0.8 || (pos >= 0.6 && d5 > 1);
  const rs20 = (c / cm20 - 1 - (cv / c20 - 1)) * 100;
  const rsOk = rs20 >= 0 && rs20 < 10;
  // Khoi ngoai: tong rong 20 phien den ngay tin hieu > 0 (can du 20 phien)
  const gan = ngoai.filter((x) => x?.ngay && x.ngay <= ngayTin);
  if (gan.length < 20) return null;
  const ngoaiOk = gan.slice(-20).reduce((s, x) => s + (Number(x.rongTy) || 0), 0) > 0;
  const xn = i + 1 < nen.length ? so(nen[i + 1].c) > c : null;
  const trangThai = xn == null ? "cho" : xn ? "xacNhan" : "khong";
  const tang = sao && trangThai !== "khong" ? (rsOk && ngoaiOk ? "A++" : rsOk || ngoaiOk ? "A+" : "A") : null;
  return { tang, trangThai, sao, rsOk, ngoaiOk, diemSo: tang ? tangSo[tang] : 0 };
}

export const MAU_TANG = { A: "var(--tim-nhat)", "A+": "var(--xanh-nhat)", "A++": "var(--xanh)" };

export function moTaTang(x) {
  if (!x?.tang) return null;
  const cho = x.trangThai === "cho";
  const goc = { A: "giá ở vùng cao của biên độ khoảng 6 tháng", "A+": "giá ở vùng cao của biên độ 6 tháng kèm sức mạnh hoặc dòng tiền ngoại ủng hộ", "A++": "giá ở vùng cao của biên độ 6 tháng, kèm cả sức mạnh vừa phải so với VN-Index lẫn khối ngoại mua ròng" }[x.tang];
  return `Tầng ${x.tang}: ${goc}${cho ? ". Đang chờ phiên sau xác nhận (đóng cửa phiên sau cao hơn phiên tín hiệu mới giữ tầng này)" : ", phiên sau đã xác nhận"}. Chỉ để tham khảo, không phải khuyến nghị.`;
}
