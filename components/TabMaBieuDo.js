"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

// TAB NHIEU MA tren dau trang Bieu do (10/11/2026, kieu FireAnt Charts): moi ma vua xem la 1 tab, bam de chuyen nhanh, x de dong, + de go ma moi (nhay vao o tim ma).
// Danh sach luu tren trinh duyet (localStorage "cs-tab-bieu-do", toi da 8 tab, ma moi nhat them vao cuoi). idOTim: id cua o nhap ma tren trang.
const KHOA = "cs-tab-bieu-do";
const TOI_DA = 8;
const SU_KIEN = "cs-tab-bieu-do";

function docTab() {
  try {
    const ds = JSON.parse(localStorage.getItem(KHOA) || "[]");
    return Array.isArray(ds) ? ds.filter((x) => typeof x === "string" && /^[A-Z0-9]{2,12}$/.test(x)).slice(-TOI_DA) : [];
  } catch {
    return [];
  }
}
function ghiTab(ds) {
  try {
    localStorage.setItem(KHOA, JSON.stringify(ds.slice(-TOI_DA)));
  } catch {}
  window.dispatchEvent(new Event(SU_KIEN));
}

export default function TabMaBieuDo({ ma, idOTim }) {
  const chuoi = useSyncExternalStore(
    (bao) => {
      window.addEventListener(SU_KIEN, bao);
      window.addEventListener("storage", bao);
      return () => {
        window.removeEventListener(SU_KIEN, bao);
        window.removeEventListener("storage", bao);
      };
    },
    () => JSON.stringify(docTab()),
    () => "[]"
  );
  const tab = JSON.parse(chuoi);
  const router = useRouter();

  // Ma dang xem chua co tab -> them vao cuoi (bo tab cu nhat neu qua 8).
  useEffect(() => {
    const ds = docTab();
    if (!ds.includes(ma)) ghiTab([...ds, ma]);
  }, [ma]);

  const dsHien = tab.includes(ma) ? tab : [...tab, ma];

  const dong = (x) => {
    const con = docTab().filter((y) => y !== x);
    ghiTab(con);
    if (x === ma) router.push(`/bieu-do?ma=${con[con.length - 1] ?? "VNINDEX"}`);
  };

  return (
    <div className="flex items-end gap-1 overflow-x-auto border-b mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ borderColor: "var(--vien)" }} role="tablist" aria-label="Các mã đang mở">
      {dsHien.map((x) => {
        const chon = x === ma;
        return (
          <div
            key={x}
            role="presentation"
            className="group shrink-0 flex items-center rounded-t-lg border border-b-0 -mb-px"
            style={{ borderColor: chon ? "var(--vien)" : "transparent", background: chon ? "var(--card)" : "transparent" }}
          >
            <Link
              href={`/bieu-do?ma=${x}`}
              role="tab"
              aria-selected={chon}
              className="pl-3 pr-1.5 py-1.5 text-xs"
              style={{ color: chon ? "var(--chu)" : "var(--mo)", fontFamily: "var(--font-chu)", fontWeight: chon ? 700 : 500 }}
            >
              {x}
            </Link>
            {dsHien.length > 1 && (
              <button
                type="button"
                onClick={() => dong(x)}
                aria-label={`Đóng tab ${x}`}
                className={`mr-1.5 w-4 h-4 rounded flex items-center justify-center hover:bg-[color:var(--hover-nhe)] ${chon ? "" : "opacity-0 group-hover:opacity-100 focus:opacity-100"}`}
                style={{ color: "var(--mo)" }}
              >
                <X size={11} aria-hidden="true" />
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => {
          const o = document.getElementById(idOTim);
          if (o) {
            o.focus();
            o.select?.();
          }
        }}
        title="Mở mã mới: gõ mã rồi Enter"
        aria-label="Mở mã mới"
        className="shrink-0 ml-1 mb-1 w-7 h-7 rounded-md flex items-center justify-center hover:bg-[color:var(--hover-nhe)]"
        style={{ color: "var(--mo)" }}
      >
        <Plus size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
