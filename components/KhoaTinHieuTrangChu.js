import { Lock, Clock } from "lucide-react";
import TaiKhoanNut from "@/components/TaiKhoanNut";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const VANG = "var(--vang)";

// Khung KHOA thay cho "Top co hoi dang chu y" (danh sach ma co tin hieu MUA / BAN / Mua moi / Ban bot) tren trang Tong quan.
// Khach chua dang nhap: nut Dang ky / Dang nhap. Da dang nhap nhung chua duoc duyet (choDuyet): chi bao dang cho duyet.
export default function KhoaTinHieuTrangChu({ choDuyet = false }) {
  return (
    <div className="rounded-2xl border p-6 mb-6 flex flex-col sm:flex-row items-center gap-5" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
        style={{ background: choDuyet ? "rgba(251,191,36,0.16)" : "rgba(108,92,231,0.16)" }}
      >
        {choDuyet ? <Clock size={22} color={VANG} strokeWidth={2} /> : <Lock size={22} color="#6C5CE7" strokeWidth={2} />}
      </div>
      <div className="flex-1 text-center sm:text-left">
        <p className="text-base mb-1" style={{ color: TEXT, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
          {choDuyet ? "Tài khoản đang chờ duyệt" : "Tín hiệu và cơ hội hôm nay dành cho thành viên"}
        </p>
        <p className="text-sm" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
          {choDuyet
            ? "Tài khoản của bạn đã đăng ký, đang chờ quản trị viên duyệt trước khi xem được tín hiệu."
            : "Đăng ký hoặc đăng nhập để xem danh sách mã có tín hiệu, cảnh báo và cơ hội trong phiên. Phần tổng quan thị trường bên dưới vẫn xem tự do."}
        </p>
      </div>
      {!choDuyet && <TaiKhoanNut nhan="Đăng ký / Đăng nhập để xem" />}
    </div>
  );
}
