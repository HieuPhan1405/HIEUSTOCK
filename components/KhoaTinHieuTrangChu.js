import Link from "next/link";
import { Lock, Clock } from "lucide-react";
import TaiKhoanNut from "@/components/TaiKhoanNut";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const PRIMARY = "#6C5CE7";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const CYAN = "var(--cyan)";
const sans = { fontFamily: "'Inter', sans-serif" };
const mono = { fontFamily: "'JetBrains Mono', monospace" };

// "Top cơ hội đáng chú ý" ở dạng LÀM MỜ cho khách chưa đăng nhập / chưa được duyệt (2026-10-13): khung 4 ô giống thật (Mua | Bán | Mua mới | Bán bớt) với DỮ LIỆU GIẢ cố định
// (không có mã thật, không có số thật - làm mờ bằng CSS nên người xem không thể lấy ra được thông tin gì) + khung mời đăng nhập ở giữa.
const O = [
  { tieuDe: "Mua", mau: XANH },
  { tieuDe: "Bán", mau: DO },
  { tieuDe: "Mua mới", mau: CYAN },
  { tieuDe: "Bán bớt", mau: VANG },
];
const DONG = [
  ["XXX", "00,00", "+0,00%"],
  ["XXX", "00,00", "-0,00%"],
  ["XXX", "00,00", "+0,00%"],
  ["XXX", "00,00", "+0,00%"],
];

function OGia({ tieuDe, mau }) {
  return (
    <div className="rounded-2xl border flex flex-col min-w-0" style={{ borderColor: VIEN, background: NEN_CARD, borderTop: `3px solid ${mau}` }}>
      <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--vien-nhe)" }}>
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-base" style={{ ...sans, fontWeight: 700, color: mau }}>
            {tieuDe}
          </h3>
          <span className="text-2xl" style={{ ...mono, fontWeight: 700, color: mau }}>
            00
          </span>
        </div>
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: MUTED }}>
          Tín hiệu mới trong phiên — dành cho thành viên
        </p>
      </div>
      <div className="px-2 py-1 flex-1">
        {DONG.map((d, i) => (
          <div key={i} className="grid grid-cols-[76px_1fr_auto] items-start gap-3 px-2 py-2.5 border-b last:border-b-0" style={{ borderColor: "var(--vien-nhe)" }}>
            <span style={{ ...sans, fontWeight: 700, fontSize: 15, color: TEXT }}>{d[0]}</span>
            <span className="text-xs" style={{ color: MUTED }}>
              Vùng mua 00,00 – 00,00 · cắt lỗ 00,00
            </span>
            <span className="text-right">
              <span style={{ color: TEXT }}>{d[1]}</span>
              <span className="block text-[11px]" style={{ color: d[2].startsWith("-") ? DO : XANH }}>
                {d[2]}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KhoaTinHieuTrangChu({ choDuyet = false }) {
  return (
    <section aria-label="Top cơ hội đáng chú ý (dành cho thành viên)" className="mb-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-lg" style={{ ...sans, fontWeight: 700 }}>
          Top cơ hội đáng chú ý
        </h2>
        <Link href="/huong-dan" className="text-xs" style={{ color: PRIMARY, ...mono }}>
          xem hướng dẫn →
        </Link>
      </div>
      <p className="text-xs mb-4" style={{ color: MUTED }}>
        Danh sách tín hiệu trong phiên dành cho thành viên đã đăng nhập.
      </p>

      <div className="relative">
        {/* Dữ liệu giả, làm mờ: không chứa thông tin thật nào. */}
        <div aria-hidden="true" className="grid gap-4 md:grid-cols-2 select-none pointer-events-none" style={{ filter: "blur(7px)", opacity: 0.9 }}>
          {O.map((o) => (
            <OGia key={o.tieuDe} {...o} />
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-2xl border p-6 text-center shadow-2xl"
            style={{ borderColor: "var(--vien-dam, var(--vien))", background: "color-mix(in srgb, var(--card) 88%, transparent)", backdropFilter: "blur(2px)" }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: choDuyet ? "rgba(251,191,36,0.16)" : "rgba(108,92,231,0.18)" }}
            >
              {choDuyet ? <Clock size={22} color={VANG} strokeWidth={2} /> : <Lock size={22} color={PRIMARY} strokeWidth={2} />}
            </div>
            <p className="text-lg mb-1" style={{ color: TEXT, ...sans, fontWeight: 700 }}>
              {choDuyet ? "Tài khoản đang chờ duyệt" : "Đăng nhập để xem tín hiệu hôm nay"}
            </p>
            <p className="text-sm mb-5" style={{ color: MUTED, ...sans }}>
              {choDuyet
                ? "Tài khoản của bạn đã đăng ký, đang chờ quản trị viên duyệt trước khi xem được tín hiệu."
                : "Mã MUA / BÁN, cảnh báo và cơ hội trong phiên dành cho thành viên. Phần tổng quan thị trường bên dưới vẫn xem tự do."}
            </p>
            {!choDuyet && (
              <div className="flex justify-center">
                <TaiKhoanNut nhan="Đăng ký / Đăng nhập để xem" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
