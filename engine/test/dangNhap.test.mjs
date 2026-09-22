// Test cho engine/dnse/dangNhap.js bang cach GIA LAP fetch (khong goi DNSE that, khong can tai
// khoan that) - chi kiem tra logic goi dung endpoint/xu ly loi/cache token, KHONG xac nhan DNSE
// that su hoat dong dung nhu the (viec do chi lam duoc voi tai khoan that, xem chayThuMqtt.mjs).
import { taoPhienDNSE } from "../dnse/dangNhap.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

// ---- Thieu username/password -> nem loi ngay, khong goi mang ----
{
  let daThu = false;
  try {
    taoPhienDNSE({ username: "", password: "" });
  } catch {
    daThu = true;
  }
  ok("Thieu username/password -> nem loi ngay khi tao phien", daThu);
}

// ---- Dang nhap thanh cong: goi dung endpoint, dung body, cache lai khong goi lai lan 2 ----
{
  const cacLoiGoi = [];
  globalThis.fetch = async (url, tuyChon) => {
    cacLoiGoi.push({ url, tuyChon });
    if (url.includes("dnse-auth-service/login")) {
      return { ok: true, json: async () => ({ token: "TOKEN_GIA_LAP" }) };
    }
    if (url.includes("dnse-user-service/api/me")) {
      return { ok: true, json: async () => ({ investorId: "INV123", name: "Nguoi Dung Test" }) };
    }
    throw new Error("URL khong mong doi: " + url);
  };

  const phien = taoPhienDNSE({ username: "0900000000", password: "matkhau" });
  const kq1 = await phien.damBaoDangNhap();
  ok("Tra ve dung token/investorId", kq1.token === "TOKEN_GIA_LAP" && kq1.investorId === "INV123");
  ok("Goi dung 2 endpoint (login + thong tin tai khoan)", cacLoiGoi.length === 2);
  ok("Body gui len dang nhap dung JSON co username/password", JSON.parse(cacLoiGoi[0].tuyChon.body).username === "0900000000");
  ok("Header Authorization dung Bearer token khi lay thong tin tai khoan", cacLoiGoi[1].tuyChon.headers.Authorization === "Bearer TOKEN_GIA_LAP");

  const kq2 = await phien.damBaoDangNhap();
  ok("Lan goi thu 2 (con han) KHONG goi lai mang - dung token da cache", cacLoiGoi.length === 2 && kq2.token === "TOKEN_GIA_LAP");
}

// ---- Dang nhap that bai (vd sai mat khau) -> loi ro rang ----
{
  globalThis.fetch = async () => ({ ok: false, status: 401, text: async () => "Unauthorized" });
  const phien = taoPhienDNSE({ username: "a", password: "sai" });
  let thongBaoLoi = null;
  try {
    await phien.damBaoDangNhap();
  } catch (e) {
    thongBaoLoi = e.message;
  }
  ok("Dang nhap sai -> loi ro rang co ma HTTP", thongBaoLoi != null && thongBaoLoi.includes("401"), thongBaoLoi);
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
