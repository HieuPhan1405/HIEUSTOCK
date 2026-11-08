// NGUOI DUNG HIEN TAI - phia TRINH DUYET (chi goi tu component client). Nhieu component tren cung 1 trang (nut tai khoan o thanh dau, nut dang ky trong trang, bang bo loc...)
// truoc day moi cai tu goi /api/nguoi-dung-hien-tai -> 2-3 lan goi trung moi lan mo trang. Ham nay dung chung 1 lan goi, nho ket qua 30 giay.
// Sau khi dang nhap / dang xuat trang deu tai lai (window.location.reload) nen bo nho tu mat; can doc lai ngay thi goi xoaNguoiDungDaNho().
let dangCho = null;
let luc = 0;
const NHO_MS = 30_000;

export function layNguoiDungTrinhDuyet() {
  if (dangCho && Date.now() - luc < NHO_MS) return dangCho;
  luc = Date.now();
  dangCho = fetch("/api/nguoi-dung-hien-tai")
    .then((r) => r.json())
    .then((d) => d.nguoiDung || null)
    .catch(() => {
      dangCho = null; // loi mang: lan sau thu lai
      return null;
    });
  return dangCho;
}

export function xoaNguoiDungDaNho() {
  dangCho = null;
  luc = 0;
}
