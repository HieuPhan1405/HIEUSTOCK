import { Clock3, TriangleAlert } from "lucide-react";
import { kiemTraDuLieuCu } from "@/lib/phienGiaoDich";

const MUTED = "#8B8B99";
const VANG = "#FBBF24";

// Nhan "Du lieu cap nhat luc ..." - du lieu do chu web day len sau moi phien (khong real-time) nen
// phai noi ro cho nguoi xem. Chua co du lieu cua phien gan nhat da dong cua (tinh theo ngay lam viec - cuoi tuan khong canh bao nham) thi canh bao.
// luc: chuoi/Date thoi diem cap nhat gan nhat (max cap_nhat_luc), null neu chua co.
export default function NhanCapNhat({ luc, className = "" }) {
  if (!luc) return null;
  const thoiDiem = new Date(luc);
  const { cu, phienMongDoi } = kiemTraDuLieuCu(luc);
  const chuoi = thoiDiem.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
  const Icon = cu ? TriangleAlert : Clock3;
  return (
    <p className={`flex flex-wrap items-center gap-1.5 text-[11px] ${className}`} style={{ color: cu ? VANG : MUTED, fontFamily: "'Inter', sans-serif" }}>
      <Icon size={12} aria-hidden="true" />
      Dữ liệu cập nhật lúc <b>{chuoi}</b> (cập nhật sau mỗi phiên, không phải thời gian thực)
      {cu && <span> — chưa có dữ liệu phiên {phienMongDoi.split("-").reverse().slice(0, 2).join("/")}, hệ thống chưa cập nhật.</span>}
    </p>
  );
}
