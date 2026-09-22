// Dang nhap DNSE LightSpeed API - CHI dung username/password tu BIEN MOI TRUONG do NGUOI DUNG
// tu set tren may cua ho (vd file .env.dnse.local, da nam trong .gitignore qua pattern ".env*").
// Claude/AI KHONG duoc nhap/thay mat khau nay trong bat ky truong hop nao - day la tai khoan
// giao dich CHUNG KHOAN THAT.
const DANG_NHAP_URL = "https://services.entrade.com.vn/dnse-auth-service/login";
const THONG_TIN_TK_URL = "https://services.entrade.com.vn/dnse-user-service/api/me";
const THOI_GIAN_SONG_TOKEN_MS = 8 * 60 * 60 * 1000; // token song 8 tieng (tai lieu DNSE)
const LAM_MOI_TRUOC_KHI_HET_HAN_MS = 30 * 60 * 1000; // chu dong dang nhap lai truoc 30 phut

async function dangNhap(username, password) {
  const res = await fetch(DANG_NHAP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Dang nhap DNSE that bai (HTTP ${res.status}). Kiem tra lai DNSE_USERNAME/DNSE_PASSWORD.`);
  const j = await res.json();
  if (!j.token) throw new Error("Dang nhap DNSE khong tra ve token - phan hoi bat thuong: " + JSON.stringify(j).slice(0, 200));
  return j.token;
}

async function layThongTinTaiKhoan(token) {
  const res = await fetch(THONG_TIN_TK_URL, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Lay thong tin tai khoan DNSE that bai (HTTP ${res.status}).`);
  const j = await res.json();
  if (!j.investorId) throw new Error("Phan hoi thong tin tai khoan thieu investorId: " + JSON.stringify(j).slice(0, 200));
  return j;
}

// Tra ve 1 "phien" tu quan ly viec dang nhap lai truoc khi token het han - goi damBaoDangNhap()
// truoc MOI LAN can dung token/investorId, khong tu luu ket qua o noi khac (tranh dung token cu
// da het han).
export function taoPhienDNSE({ username, password }) {
  if (!username || !password) {
    throw new Error("Thieu username/password DNSE - phai truyen tu bien moi truong (vd process.env.DNSE_USERNAME/DNSE_PASSWORD), khong duoc hardcode.");
  }
  let phien = null; // { token, investorId, hetHanLuc }
  let dangXuLy = null;

  async function thucHienDangNhap() {
    const token = await dangNhap(username, password);
    const thongTin = await layThongTinTaiKhoan(token);
    return { token, investorId: thongTin.investorId, ten: thongTin.name, hetHanLuc: Date.now() + THOI_GIAN_SONG_TOKEN_MS };
  }

  async function damBaoDangNhap() {
    if (phien && Date.now() < phien.hetHanLuc - LAM_MOI_TRUOC_KHI_HET_HAN_MS) return phien;
    if (dangXuLy) return dangXuLy;
    dangXuLy = thucHienDangNhap()
      .then((ketQua) => {
        phien = ketQua;
        dangXuLy = null;
        return phien;
      })
      .catch((loi) => {
        dangXuLy = null;
        throw loi;
      });
    return dangXuLy;
  }

  return { damBaoDangNhap };
}
