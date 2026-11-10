"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { LayoutGrid, TrendingUp, Activity, ListFilter, TrendingDown, BookOpen, CandlestickChart, Wallet, Mail, Ellipsis, Sprout, ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { MENU, mucDangMo } from "@/lib/menu";

const ICON = { "/": LayoutGrid, "/bo-loc": ListFilter, "/bieu-do": CandlestickChart, "/lenh-mo": TrendingUp, "/danh-muc": Wallet, "/bat-day": TrendingDown, "/dai-han": Sprout, "/phai-sinh": Activity, "/huong-dan": BookOpen };

const BG = "var(--nen-sau)";
const VIEN = "var(--vien)";
const PRIMARY = "#6C5CE7";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";

// MENU GON (8 muc - xem lib/menu.js): cac trang cung nhom (Thi truong: Tong quan / Dashboard / Tin tuc; Dau tu theo xu huong: Lenh dang mo / Sap co lenh / Da dong) gop 1 muc, trong trang co thanh tab
// (components/ThanhTabNhom.js). Lien he o cuoi thanh ben + chan trang.
export default function Sidebar() {
  const pathname = usePathname();
  const dangMo = mucDangMo(pathname);
  const [moTai, setMoTai] = useState(null); // duong dan luc mo ngan "Them" (doi trang thi tu dong)
  const MENU_CHINH = MENU.slice(0, 4);
  const MENU_PHU = MENU.slice(4);
  const dangTrongPhu = MENU_PHU.some((m) => dangMo?.href === m.href) || pathname === "/lien-he";

  // THU GON / MO RONG thanh ben (10/11/2026, Hieu: "thu gon menu kieu dong mo"): nut o cuoi thanh ben -> chi con cot bieu tuong 64px, noi dung rong them.
  // Trang thai nam o thuoc tinh data-menu cua <html> (app/layout.js dat TRUOC khi ve trang tu localStorage "cs-menu" nen khong bi nhay), CSS o globals.css (.cs-thanh-ben / .cs-noi-dung).
  const gon = useSyncExternalStore(
    (bao) => {
      window.addEventListener("cs-menu", bao);
      return () => window.removeEventListener("cs-menu", bao);
    },
    () => document.documentElement.dataset.menu === "gon",
    () => false
  );
  const doiGon = () => {
    const moi = !gon;
    document.documentElement.dataset.menu = moi ? "gon" : "rong";
    try {
      localStorage.setItem("cs-menu", moi ? "gon" : "rong");
    } catch {}
    window.dispatchEvent(new Event("cs-menu"));
  };
  // Muc co trang con (tab) XO RA ngay trong menu: muc dang xem tu mo; bam mui ten de mo / dong muc khac. Khoa = href muc, gia tri true/false (chua bam = theo trang dang xem).
  const [xo, setXo] = useState({});
  const dangXo = (href) => xo[href] ?? dangMo?.href === href;

  return (
    <>
      {/* Desktop: sidebar doc co dinh ben trai (>=768px) */}
      <aside className="cs-thanh-ben hidden md:flex md:flex-col md:fixed md:top-14 md:bottom-0 md:left-0 md:z-20" style={{ background: BG, borderRight: `1px solid ${VIEN}` }}>
        <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden" aria-label="Menu chính">
          {MENU.map(({ href, nhan, nhom, tab }, i) => {
            const active = dangMo?.href === href;
            const Icon = ICON[href];
            // Tieu de nhom nho truoc muc dau tien cua moi nhom (Cong cu · Cach dau tu · Cua ban). Thu gon thi thanh 1 vach ngan.
            const dauNhom = nhom && nhom !== MENU[i - 1]?.nhom;
            const coCon = tab?.length > 1;
            const mo = coCon && dangXo(href);
            return (
              <div key={href} className="contents">
                {dauNhom && (
                  <>
                    <p className={`cs-chu-menu px-3 pb-1 text-[11px] whitespace-nowrap ${i === 0 ? "pt-1" : "pt-4"}`} style={{ color: "var(--mo-3)", fontFamily: "var(--font-chu)", fontWeight: 600 }}>
                      {nhom}
                    </p>
                    {i > 0 && <span className="cs-vach-menu mx-3 my-2 border-t" style={{ borderColor: VIEN }} aria-hidden="true" />}
                  </>
                )}
                <div className="relative flex items-center">
                  <Link
                    href={href}
                    title={nhan}
                    aria-current={active ? "page" : undefined}
                    className="cs-muc-menu flex-1 min-w-0 flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[color:var(--hover-nhe)]"
                    style={{
                      background: active ? "linear-gradient(90deg, rgba(108,92,231,0.24), rgba(108,92,231,0.05))" : undefined,
                      boxShadow: active ? "inset 3px 0 0 var(--tim-nhat)" : undefined,
                      color: active ? "var(--tim-chu)" : MUTED,
                      fontFamily: "var(--font-chu)",
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    <Icon size={18} strokeWidth={2} className="shrink-0" />
                    <span className="cs-chu-menu truncate">{nhan}</span>
                  </Link>
                  {coCon && (
                    <button
                      type="button"
                      onClick={() => setXo((x) => ({ ...x, [href]: !mo }))}
                      aria-expanded={mo}
                      aria-label={`${mo ? "Đóng" : "Mở"} các trang trong ${nhan}`}
                      className="cs-chu-menu absolute right-1 w-7 h-7 rounded-md flex items-center justify-center hover:bg-[color:var(--hover-nhe)]"
                      style={{ color: MUTED }}
                    >
                      <ChevronDown size={15} className="transition-transform" style={{ transform: mo ? "rotate(180deg)" : undefined }} aria-hidden="true" />
                    </button>
                  )}
                </div>
                {mo && (
                  <div className="cs-chu-menu ml-[22px] pl-3 mb-1 flex flex-col border-l" style={{ borderColor: VIEN }}>
                    {tab.map((t) => {
                      const chon = pathname === t.href || (t.href !== "/" && pathname.startsWith(`${t.href}/`));
                      return (
                        <Link
                          key={t.href}
                          href={t.href}
                          aria-current={chon ? "page" : undefined}
                          className="px-2.5 py-1.5 rounded-md text-[13px] whitespace-nowrap hover:bg-[color:var(--hover-nhe)]"
                          style={{ color: chon ? "var(--chu)" : MUTED, fontFamily: "var(--font-chu)", fontWeight: chon ? 600 : 500 }}
                        >
                          {t.nhan}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="px-3 py-3 flex flex-col gap-2 text-[11px]" style={{ color: MUTED, fontFamily: "var(--font-chu)", borderTop: `1px solid ${VIEN}` }}>
          <Link href="/lien-he" title="Liên hệ" className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-[color:var(--hover-nhe)]" style={{ color: pathname === "/lien-he" ? PRIMARY : MUTED }}>
            <Mail size={15} className="shrink-0" /> <span className="cs-chu-menu">Liên hệ</span>
          </Link>
          <button
            type="button"
            onClick={doiGon}
            aria-pressed={gon}
            title={gon ? "Mở rộng menu" : "Thu gọn menu"}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-[color:var(--hover-nhe)] text-left"
            style={{ color: MUTED }}
          >
            {gon ? <PanelLeftOpen size={15} className="shrink-0" aria-hidden="true" /> : <PanelLeftClose size={15} className="shrink-0" aria-hidden="true" />}
            <span className="cs-chu-menu">Thu gọn menu</span>
          </button>
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
