"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tabCuaTrang } from "@/lib/menu";

const VIEN = "var(--vien)";
const PRIMARY = "#6C5CE7";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";

// THANH TAB cua cac trang cung nhom trong menu (Thi truong: Tong quan / Dashboard / Tin tuc; So lenh: Dang mo / Da dong) - dat trong layout, chi hien o trang thuoc nhom.
export default function ThanhTabNhom() {
  const pathname = usePathname();
  const nhom = tabCuaTrang(pathname);
  if (!nhom) return null;
  return (
    <div className="border-b" style={{ borderColor: VIEN, background: "var(--nen)" }}>
      <nav className="max-w-6xl mx-auto px-6 flex gap-1 overflow-x-auto" aria-label="Các trang cùng nhóm">
        {nhom.tab.map((t) => {
          const chon = t.href === nhom.dangChon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={chon ? "page" : undefined}
              className="px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors hover:text-[color:var(--chu)]"
              style={{ borderColor: chon ? PRIMARY : "transparent", color: chon ? TEXT : MUTED, fontFamily: "'Inter', sans-serif", fontWeight: chon ? 600 : 500 }}
            >
              {t.nhan}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
