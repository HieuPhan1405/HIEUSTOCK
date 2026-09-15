import { Lock } from "lucide-react";
import TaiKhoanNut from "@/components/TaiKhoanNut";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";

// Chan hien thi TOAN BO 1 trang cho nguoi CHUA dang ky/dang nhap - render
// truoc khi trang goi ham lay du lieu that (khong fetch du lieu nhay cam
// neu chua co phien dang nhap hop le).
export default function KhoaTrangNoiDung({ tieuDe, moTa }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="max-w-md mx-auto rounded-2xl border p-8 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(108,92,231,0.16)" }}
        >
          <Lock size={22} color="#6C5CE7" strokeWidth={2} />
        </div>
        <p className="text-lg mb-2" style={{ color: TEXT, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
          {tieuDe}
        </p>
        <p className="text-sm mb-6" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
          {moTa}
        </p>
        <div className="flex justify-center">
          <TaiKhoanNut nhan="Đăng ký / Đăng nhập để xem" />
        </div>
      </div>
    </div>
  );
}
