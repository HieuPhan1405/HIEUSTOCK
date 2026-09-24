import { Lock, Clock } from "lucide-react";
import TaiKhoanNut from "@/components/TaiKhoanNut";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const VANG = "#FBBF24";

// Chan hien thi TOAN BO 1 trang - 2 truong hop:
//  - CHUA dang ky/dang nhap (mac dinh): render truoc khi trang goi ham lay du lieu (khong fetch
//    du lieu nhay cam neu chua co phien dang nhap hop le), hien nut dang ky/dang nhap.
//  - choDuyet=true: DA dang nhap nhung tai khoan chua duoc admin duyet (da_duyet=false) - khac han
//    truong hop tren, KHONG hien nut dang ky nua (da co tai khoan roi), chi bao dang cho duyet.
export default function KhoaTrangNoiDung({ tieuDe, moTa, choDuyet = false }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="max-w-md mx-auto rounded-2xl border p-8 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: choDuyet ? "rgba(251,191,36,0.16)" : "rgba(108,92,231,0.16)" }}
        >
          {choDuyet ? <Clock size={22} color={VANG} strokeWidth={2} /> : <Lock size={22} color="#6C5CE7" strokeWidth={2} />}
        </div>
        <p className="text-lg mb-2" style={{ color: TEXT, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
          {choDuyet ? "Tài khoản đang chờ duyệt" : tieuDe}
        </p>
        <p className="text-sm mb-6" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
          {choDuyet ? "Tài khoản của bạn đã đăng ký thành công, đang chờ quản trị viên duyệt trước khi dùng được tính năng này. Vui lòng quay lại sau." : moTa}
        </p>
        {!choDuyet && (
          <div className="flex justify-center">
            <TaiKhoanNut nhan="Đăng ký / Đăng nhập để xem" />
          </div>
        )}
      </div>
    </div>
  );
}
