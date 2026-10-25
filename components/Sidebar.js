"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutGrid, Briefcase, ListFilter, TrendingDown, BookOpen, CandlestickChart, Wallet, Mail, Ellipsis } from "lucide-react";
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
  const [moTai, setMoTai] = useState(null); // duong dan luc mo ngan "Them" (doi trang thi tu dong)
  const MENU_CHINH = MENU.slice(0, 4);
  const MENU_PHU = MENU.slice(4);
  const dangTrongPhu = MENU_PHU.some((m) => dangMo?.href === m.href) || pathname === "/lien-he";

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
                  background: active ? "linear-gradient(90deg, rgba(108,92,231,0.24), rgba(108,92,231,0.05))" : undefined,
                  boxShadow: active ? "inset 3px 0 0 var(--tim-nhat)" : undefined,
                  color: active ? "var(--tim-chu)" : MUTED,
                  fontFamily: "var(--font-chu)",
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon size={18} strokeWidth={2} />
                {nhan}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-4 text-[11px] flex flex-col gap-2" style={{ color: MUTED, fontFamily: "var(--font-chu)", borderTop: `1px solid ${VIEN}` }}>
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

      {/* Mobile (<768px): THANH DIEU HUONG O DAY MAN HINH (than quen cua ung dung dien thoai, ngon cai bam toi): 4 muc chinh + "Them" mo ngan keo cac muc con lai */}
      {moTai === pathname && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMoTai(null)} role="presentation" style={{ background: "rgba(5,5,10,0.55)" }}>
          <div
            role="dialog"
            aria-label="Các mục khác"
            className="cs-ngan-keo absolute left-3 right-3 rounded-2xl border p-2"
            style={{ bottom: "calc(64px + env(safe-area-inset-bottom, 0px))", background: "var(--card)", borderColor: VIEN, boxShadow: "0 -12px 40px -12px rgba(108,92,231,0.45)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {MENU_PHU.map(({ href, nhan }) => {
              const active = dangMo?.href === href;
              const Icon = ICON[href];
              return (
                <Link key={href} href={href} onClick={() => setMoTai(null)} aria-current={active ? "page" : undefined} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm" style={{ color: active ? "var(--tim-chu)" : TEXT, background: active ? "rgba(108,92,231,0.18)" : undefined, fontFamily: "var(--font-chu)", fontWeight: active ? 700 : 500 }}>
                  <Icon size={19} strokeWidth={2} />
                  {nhan}
                </Link>
              );
            })}
            <Link href="/lien-he" onClick={() => setMoTai(null)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm" style={{ color: pathname === "/lien-he" ? "var(--tim-chu)" : TEXT, fontFamily: "var(--font-chu)" }}>
              <Mail size={19} strokeWidth={2} />
              Liên hệ
            </Link>
          </div>
        </div>
      )}
      <nav aria-label="Điều hướng chính" className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch" style={{ background: "color-mix(in srgb, var(--nen-sau) 97%, transparent)", borderTop: `1px solid ${VIEN}`, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {MENU_CHINH.map(({ href, nhanNgan }) => {
          const active = dangMo?.href === href;
          const Icon = ICON[href];
          return (
            <Link key={href} href={href} onClick={() => setMoTai(null)} aria-current={active ? "page" : undefined} className="cs-tab-day flex-1 flex flex-col items-center justify-center gap-1 pt-2 pb-1.5 text-[11px] min-h-[56px]" style={{ color: active ? "var(--tim-chu)" : MUTED, fontFamily: "var(--font-chu)", fontWeight: active ? 700 : 500 }}>
              <span className="cs-tab-bieu-tuong" data-active={active ? "1" : undefined}>
                <Icon size={21} strokeWidth={active ? 2.4 : 2} />
              </span>
              {nhanNgan}
            </Link>
          );
        })}
        <button type="button" onClick={() => setMoTai(moTai === pathname ? null : pathname)} aria-expanded={moTai === pathname} aria-haspopup="dialog" className="cs-tab-day flex-1 flex flex-col items-center justify-center gap-1 pt-2 pb-1.5 text-[11px] min-h-[56px]" style={{ color: dangTrongPhu || moTai === pathname ? "var(--tim-chu)" : MUTED, fontFamily: "var(--font-chu)", fontWeight: dangTrongPhu ? 700 : 500 }}>
          <span className="cs-tab-bieu-tuong" data-active={dangTrongPhu ? "1" : undefined}>
            <Ellipsis size={21} strokeWidth={2} />
          </span>
          Thêm
        </button>
      </nav>
    </>
  );
}
