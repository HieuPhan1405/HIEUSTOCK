"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Briefcase, ListFilter, Newspaper, Mail, TrendingDown, BookOpen, History } from "lucide-react";
import TaiKhoanNut from "@/components/TaiKhoanNut";

const MUC = [
  { href: "/", nhan: "Tổng quan thị trường", Icon: LayoutGrid },
  { href: "/bo-loc", nhan: "Bộ lọc cổ phiếu", Icon: ListFilter },
  { href: "/lenh-mo", nhan: "Sổ lệnh đang mở", Icon: Briefcase },
  { href: "/lenh-da-dong", nhan: "Lệnh đã đóng", Icon: History },
  { href: "/bat-day", nhan: "Checklist bắt đáy", Icon: TrendingDown },
  { href: "/thi-truong", nhan: "Thông tin thị trường", Icon: Newspaper },
  { href: "/huong-dan", nhan: "Hướng dẫn & nguyên tắc", Icon: BookOpen },
  { href: "/lien-he", nhan: "Liên hệ", Icon: Mail },
];

const BG = "#08080B";
const VIEN = "#26262F";
const PRIMARY = "#6C5CE7";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: sidebar doc co dinh ben trai (>=768px) */}
      <aside
        className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-60 md:z-20"
        style={{ background: BG, borderRight: `1px solid ${VIEN}` }}
      >
        <div className="px-6 py-6 flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: PRIMARY, color: "#FFFFFF", fontFamily: "'Inter', sans-serif", fontWeight: 800 }}
          >
            C
          </div>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: TEXT }} className="text-lg">
            CloudStock
          </span>
        </div>

        <div className="px-3 mb-2">
          <TaiKhoanNut />
        </div>

        <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
          {MUC.map(({ href, nhan, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                style={{
                  background: active ? "rgba(108,92,231,0.16)" : "transparent",
                  color: active ? PRIMARY : MUTED,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon size={18} strokeWidth={2} />
                {nhan}
              </Link>
            );
          })}
        </nav>

        <div
          className="px-6 py-4 text-[11px]"
          style={{ color: MUTED, fontFamily: "'JetBrains Mono', monospace", borderTop: `1px solid ${VIEN}` }}
        >
          Hệ thống hỗ trợ
          <br />
          đầu tư CloudStock
        </div>
      </aside>

      {/* Mobile: thanh ngang tren cung (<768px) */}
      <div className="md:hidden sticky top-0 z-20" style={{ background: BG, borderBottom: `1px solid ${VIEN}` }}>
        <div className="px-4 flex items-center gap-2 overflow-x-auto">
          <div
            className="w-6 h-6 rounded flex items-center justify-center shrink-0 my-2 mr-1"
            style={{ background: PRIMARY, color: "#FFFFFF", fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "12px" }}
          >
            C
          </div>
          {MUC.map(({ href, nhan, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 py-3 px-2 text-xs whitespace-nowrap border-b-2 transition-colors"
                style={{
                  borderColor: active ? PRIMARY : "transparent",
                  color: active ? TEXT : MUTED,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon size={14} />
                {nhan}
              </Link>
            );
          })}
          <div className="shrink-0 ml-1">
            <TaiKhoanNut compact />
          </div>
        </div>
      </div>
    </>
  );
}
