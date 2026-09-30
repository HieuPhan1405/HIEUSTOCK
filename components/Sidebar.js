"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Briefcase, ListFilter, TrendingDown, BookOpen, CandlestickChart, Wallet, Mail } from "lucide-react";
import { MENU, mucDangMo } from "@/lib/menu";

const ICON = { "/": LayoutGrid, "/bo-loc": ListFilter, "/bieu-do": CandlestickChart, "/lenh-mo": Briefcase, "/danh-muc": Wallet, "/bat-day": TrendingDown, "/huong-dan": BookOpen };

const BG = "var(--nen-sau)";
const VIEN = "var(--vien)";
const PRIMARY = "#6C5CE7";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";

// MENU GON (7 muc - xem lib/menu.js): cac trang cung nhom (Thi truong: Tong quan / Dashboard / Tin tuc; So lenh: Dang mo / Da dong) gop 1 muc, trong trang co thanh tab
// (components/ThanhTabNhom.js). Lien he o cuoi thanh ben + chan trang.
export default function Sidebar() {
  const pathname = usePathname();
  const dangMo = mucDangMo(pathname);

  return (
    <>
      {/* Desktop: sidebar doc co dinh ben trai (>=768px) */}
      <aside
        className="hidden md:flex md:flex-col md:fixed md:top-14 md:bottom-0 md:left-0 md:w-60 md:z-20"
        style={{ background: BG, borderRight: `1px solid ${VIEN}` }}
      >
        <nav className="flex-1 px-3 py-2 flex flex-col gap-1 overflow-y-auto">
          {MENU.map(({ href, nhan }) => {
            const active = dangMo?.href === href;
            const Icon = ICON[href];
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-[color:var(--hover-nhe)]"
                style={{
                  background: active ? "rgba(108,92,231,0.16)" : undefined,
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

        <div className="px-6 py-4 text-[11px] flex flex-col gap-2" style={{ color: MUTED, fontFamily: "'JetBrains Mono', monospace", borderTop: `1px solid ${VIEN}` }}>
          <Link href="/lien-he" className="inline-flex items-center gap-1.5 hover:text-[color:var(--chu)]" style={{ color: pathname === "/lien-he" ? PRIMARY : MUTED }}>
            <Mail size={13} /> Liên hệ
          </Link>
          <span>
            Hệ thống hỗ trợ
            <br />
            đầu tư CloudStock
          </span>
        </div>
      </aside>

      {/* Mobile: thanh ngang tren cung (<768px) */}
      <div className="md:hidden sticky top-14 z-20" style={{ background: BG, borderBottom: `1px solid ${VIEN}` }}>
        <div className="px-4 flex items-center gap-2 overflow-x-auto">
          {MENU.map(({ href, nhanNgan }) => {
            const active = dangMo?.href === href;
            const Icon = ICON[href];
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-1.5 py-3 px-2 text-xs whitespace-nowrap border-b-2 transition-colors"
                style={{
                  borderColor: active ? PRIMARY : "transparent",
                  color: active ? TEXT : MUTED,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon size={14} />
                {nhanNgan}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
