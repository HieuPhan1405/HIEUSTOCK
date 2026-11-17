"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Search } from "lucide-react";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";

// O nhap ma cua trang Da khung (17/11/2026): Enter doi ma bang dieu huong mem (router.push) - KHONG tai lai trang, cac o bieu do giu nguyen bo khung va chi doi ma.
export default function OTimMaDaKhung({ ma }) {
  const router = useRouter();
  const oRef = useRef(null);
  const gui = (e) => {
    e.preventDefault();
    const m = String(oRef.current?.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    if (!m || m === ma) return;
    router.push(`/bieu-do/da-khung?ma=${m}`);
    oRef.current?.blur();
  };
  return (
    <form onSubmit={gui} className="relative w-36 shrink-0">
      <Search size={14} aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
      <input
        ref={oRef}
        name="ma"
        defaultValue={ma}
        key={ma}
        autoComplete="off"
        maxLength={12}
        placeholder="Nhập mã…"
        aria-label="Mã cổ phiếu hoặc chỉ số (Enter để xem)"
        className="w-full h-8 pl-8 pr-2 text-sm outline-none rounded-lg"
        style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "var(--font-chu)", fontWeight: 700, textTransform: "uppercase" }}
      />
    </form>
  );
}
