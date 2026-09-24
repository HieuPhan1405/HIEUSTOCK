import Link from "next/link";
import {
  LayoutGrid,
  ListFilter,
  CandlestickChart,
  TrendingDown,
  Eye,
  History,
  Newspaper,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import TaiKhoanNut from "@/components/TaiKhoanNut";

export const metadata = {
  title: "Giới thiệu",
  description: "CloudStock — hệ thống hỗ trợ đầu tư chứng khoán: điểm hợp lưu, tín hiệu MUA/BÁN, dashboard thị trường, checklist bắt đáy, kiểm chứng backtest 12 năm trên VN100.",
};

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";
const XANH = "#22C55E";

const TINH_NANG = [
  {
    Icon: LayoutGrid,
    tieuDe: "Điểm hợp lưu & tín hiệu MUA/BÁN",
    mo: "Kết hợp Trend · Động lượng · Dòng tiền (Ichimoku + đường cân bằng dài hạn), tự động phát tín hiệu MUA/BÁN mỗi phiên — kiểm chứng backtest 12 năm trên VN100.",
  },
  {
    Icon: ShieldCheck,
    tieuDe: "Stop-loss cấu trúc & 3 mốc chốt lời",
    mo: "Cắt lỗ đặt theo cấu trúc giá (mây / đường cân bằng / Kijun), chốt lời từng phần theo tỷ lệ 30/30/25 — 15% cuối giữ lấy vị thế nếu giá còn tăng.",
  },
  {
    Icon: LayoutGrid,
    tieuDe: "Dashboard thị trường",
    mo: "Bản đồ nhiệt theo ngành, thanh khoản trong phiên, dòng tiền khối ngoại, tâm lý & độ rộng thị trường — nhìn toàn cảnh trong vài giây.",
  },
  {
    Icon: ListFilter,
    tieuDe: "Bộ lọc cổ phiếu đa tiêu chí",
    mo: "Lọc theo điểm hợp lưu, ngành, vốn hoá, xu hướng, tín hiệu... trên toàn bộ ~390 mã HOSE, HNX, UPCOM đang theo dõi.",
  },
  {
    Icon: TrendingDown,
    tieuDe: "Checklist dò bắt đáy",
    mo: "Chiết khấu sâu, quá bán, capitulation/phân kỳ, follow-through day — kèm lịch sử kết quả THẬT sau 5/10/20 phiên để tự đánh giá độ tin cậy.",
  },
  {
    Icon: CandlestickChart,
    tieuDe: "Biểu đồ kỹ thuật",
    mo: "Nến Nhật, Ichimoku, đường cân bằng dài hạn, MA — vẽ sẵn vùng mua/cắt lỗ/chốt lời cho mã đang có lệnh, cập nhật trong phiên.",
  },
  {
    Icon: History,
    tieuDe: "Nhật ký giao dịch & sổ lệnh",
    mo: "Theo dõi lệnh đang mở, lịch sử lệnh đã đóng, lãi/lỗ từng đợt — quy đổi ra số cụ thể trên 100 đơn vị vốn giả định để dễ so sánh.",
  },
  {
    Icon: Eye,
    tieuDe: "Cảnh báo Mắt Thần & bảo vệ lãi",
    mo: "Nhận diện sớm rủi ro đảo chiều, tự động dời Stop-loss lên cao hơn khi lệnh đã có lãi để bảo toàn thành quả.",
  },
];

function TheTinhNang({ Icon, tieuDe, mo }) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(108,92,231,0.15)" }}>
        <Icon size={20} color={PRIMARY} strokeWidth={2} aria-hidden="true" />
      </div>
      <h3 className="text-base mb-1.5" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        {tieuDe}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
        {mo}
      </p>
    </div>
  );
}

function TheSo({ so, nhan }) {
  return (
    <div className="text-center">
      <p className="text-2xl md:text-3xl" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: PRIMARY }}>
        {so}
      </p>
      <p className="text-xs mt-1" style={{ color: MUTED }}>
        {nhan}
      </p>
    </div>
  );
}

export default function TrangGioiThieu() {
  return (
    <div style={{ color: TEXT }}>
      {/* HERO */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: VIEN }}>
        <div aria-hidden="true" className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: PRIMARY }} />
        <div aria-hidden="true" className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: XANH }} />
        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: PRIMARY, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
            Hệ thống hỗ trợ đầu tư · quét toàn bộ thị trường
          </p>
          <h1 className="text-4xl md:text-5xl mb-5" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, lineHeight: 1.15 }}>
            Tổng quan thị trường,
            <br />
            đọc trong 5 giây.
          </h1>
          <p className="text-base md:text-lg mb-8 max-w-2xl mx-auto" style={{ color: MUTED }}>
            Điểm hợp lưu Trend · Động lượng · Dòng tiền, kiểm chứng backtest 12 năm trên VN100. Không phải khuyến nghị đầu tư — chỉ là công cụ đọc biểu đồ
            nhanh hơn.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold"
              style={{ background: PRIMARY, color: "#FFFFFF" }}
            >
              Vào Dashboard <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <TaiKhoanNut compact nhan="Đăng ký miễn phí" />
          </div>

          <div className="grid grid-cols-3 gap-6 mt-14 max-w-md mx-auto">
            <TheSo so="~390" nhan="mã theo dõi (HOSE, HNX, UPCOM)" />
            <TheSo so="12 năm" nhan="backtest trên VN100" />
            <TheSo so="Miễn phí" nhan="không thu phí sử dụng" />
          </div>
        </div>
      </div>

      {/* TINH NANG */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
            Công cụ cho mọi bước trong hành trình đầu tư
          </h2>
          <p className="text-sm" style={{ color: MUTED }}>
            Không phải khuyến nghị đầu tư — CloudStock chỉ tự động hoá việc đọc biểu đồ và theo dõi thị trường.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TINH_NANG.map((t) => (
            <TheTinhNang key={t.tieuDe} {...t} />
          ))}
        </div>
      </div>

      {/* CTA CUOI TRANG */}
      <div className="border-t" style={{ borderColor: VIEN }}>
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl mb-3" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
            Trải nghiệm ngay, không cần trả phí
          </h2>
          <p className="text-sm mb-7" style={{ color: MUTED }}>
            Đăng ký bằng số điện thoại để lưu danh mục cá nhân, xem đầy đủ lịch sử checklist bắt đáy và các tính năng dành riêng cho hội viên.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <TaiKhoanNut compact nhan="Đăng ký nhận tư vấn miễn phí" />
            <Link href="/huong-dan" className="text-sm" style={{ color: PRIMARY, fontFamily: "'JetBrains Mono', monospace" }}>
              Xem hướng dẫn & nguyên tắc →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
