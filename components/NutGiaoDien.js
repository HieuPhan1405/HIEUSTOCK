"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

const KHOA_LUU = "cs-giao-dien";
const SU_KIEN = "cs-giao-dien";

// Che do dang dung = thuoc tinh data-theme tren <html> (script trong app/layout.js dat TRUOC khi ve trang de khong bi nhay mau; mac dinh "dark").
const docChedo = () => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

function dangKy(khiDoi) {
  window.addEventListener(SU_KIEN, khiDoi);
  const theoDoi = new MutationObserver(khiDoi);
  theoDoi.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => {
    window.removeEventListener(SU_KIEN, khiDoi);
    theoDoi.disconnect();
  };
}

// Nut doi che do SANG / TOI o thanh dau trang. Lua chon duoc nho o trinh duyet (localStorage); chua chon thi la TOI.
export default function NutGiaoDien({ className = "" }) {
  const cheDo = useSyncExternalStore(dangKy, docChedo, () => "dark");
  const dangSang = cheDo === "light";

  function doi() {
    const moi = dangSang ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", moi);
    try {
      localStorage.setItem(KHOA_LUU, moi);
    } catch {
      /* che do rieng tu: khong luu duoc thi van doi trong phien nay */
    }
    window.dispatchEvent(new Event(SU_KIEN));
  }

  const nhan = dangSang ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng";
  return (
    <button
      type="button"
      onClick={doi}
      aria-label={nhan}
      title={nhan}
      className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors hover:bg-[color:var(--hover-nhe)] ${className}`}
      style={{ borderColor: "var(--vien)", color: "var(--mo-2)" }}
    >
      {dangSang ? <Moon size={17} strokeWidth={2} aria-hidden="true" /> : <Sun size={17} strokeWidth={2} aria-hidden="true" />}
    </button>
  );
}
