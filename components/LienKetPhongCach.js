import Link from "next/link";

// 2 CACH DAU TU cua web (04/11/2026): Dau tu theo xu huong (tin hieu MUA / BAN hang ngay - muc /lenh-mo) va Dau tu dai han (/dai-han). Moi trang 1 cau noi ro cach nay hop
// voi ai + link sang cach kia, de nguoi moi chon dung muc. Khop 2 phong cach cua Danh gia danh muc (lib/phongCachDauTu.js).
const PHONG_CACH = {
  xuHuong: {
    moTa: "Cách này mua khi hệ thống báo MUA, chốt lời từng phần và bán theo tín hiệu, nên cần xem mỗi ngày.",
    sang: { href: "/dai-han", nhan: "Muốn giữ lâu, ít theo dõi? Xem Đầu tư dài hạn →" },
  },
  daiHan: {
    moTa: null,
    sang: { href: "/lenh-mo", nhan: "Muốn mua bán theo tín hiệu hằng ngày? Xem Đầu tư theo xu hướng →" },
  },
};

export default function LienKetPhongCach({ loai, className = "" }) {
  const pc = PHONG_CACH[loai];
  if (!pc) return null;
  return (
    <p className={`text-sm ${className}`} style={{ color: "var(--mo)" }}>
      {pc.moTa && <>{pc.moTa} </>}
      <Link href={pc.sang.href} className="underline whitespace-nowrap" style={{ color: "var(--tim-chu)" }}>
        {pc.sang.nhan}
      </Link>
    </p>
  );
}

// Nhan nho phia tren tieu de trang, cho biet trang thuoc muc nao trong menu (vd "Bat day" cho 3 trang Checklist / Diem mua phuc hoi / Hoi sau giam dai).
export function NhanMuc({ chu }) {
  return (
    <p className="text-xs mb-1 uppercase tracking-wide" style={{ color: "var(--tim-chu)", fontFamily: "var(--font-chu)", fontWeight: 700 }}>
      {chu}
    </p>
  );
}

// Cac trang thuoc muc "Dau tu theo xu huong" (Lenh dang mo / Sap co lenh / Lenh da dong).
export function NhanMucXuHuong() {
  return <NhanMuc chu="Đầu tư theo xu hướng" />;
}
