"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tabCuaTrang } from "@/lib/menu";

const VIEN = "#26262F";
const PRIMARY = "#6C5CE7";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";

// THANH TAB cua cac trang cung nhom trong menu (Thi truong: Tong quan / Dashboard / Tin tuc; So lenh: Dang mo / Da dong) - dat trong layout, chi hien o trang thuoc nhom.
export default function ThanhTabNhom() {
  const pathname = usePathname();
  const nhom = tabCuaTrang(pathname);
  if (!nhom) return null;
  return (
    <div className="border-b" style={{ borderColor: VIEN, background: "#0B0B10" }}>
      <nav className="max-w-6xl mx-auto px-6 flex gap-1 overflow-x-auto" aria-label="Các trang cùng nhóm">
        {nhom.tab.map((t) => {
          const chon = t.href === nhom.dangChon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={chon ? "page" : undefined}
              className="px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors hover:text-white"
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
