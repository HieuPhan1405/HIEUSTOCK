"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { layGioiThieu, layGiaiThich } from "@/lib/noiDungMay";

const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const TIM = "#A78BFA";

// Hinh "Mây" (tam thoi ve bang SVG theo logo dam may - co hinh Mây that cua kenh TikTok thi thay vao day). Mat chop, nguoi nhun nhe (CSS trong globals.css, tat khi
// nguoi dung chon giam chuyen dong).
function HinhMay() {
  return (
    <svg viewBox="0 0 120 92" className="block w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id="mayNen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9D1FF" />
          <stop offset="1" stopColor="#8B7CF6" />
        </linearGradient>
      </defs>
      <g fill="url(#mayNen)">
        <circle cx="36" cy="52" r="24" />
        <circle cx="62" cy="36" r="29" />
        <circle cx="89" cy="54" r="22" />
        <rect x="28" y="52" width="72" height="28" rx="14" />
      </g>
      <ellipse className="may-mat" cx="52" cy="52" rx="4.6" ry="6.2" fill="#1B1640" />
      <ellipse className="may-mat" cx="74" cy="52" rx="4.6" ry="6.2" fill="#1B1640" />
      <circle cx="53.6" cy="49.6" r="1.6" fill="#FFFFFF" />
      <circle cx="75.6" cy="49.6" r="1.6" fill="#FFFFFF" />
      <circle cx="44" cy="62" r="4.2" fill="#FF8FB1" opacity="0.55" />
      <circle cx="82" cy="62" r="4.2" fill="#FF8FB1" opacity="0.55" />
      <path d="M56 63 Q63 70 70 63" stroke="#1B1640" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// NHAN VAT HUONG DAN "MÂY": nap o mep phai man hinh (lap lo), BAM VAO moi mo khung chi dan - khong tu bat len. Khi mo:
//  - khung chi dan gioi thieu trang dang xem + meo (lib/noiDungMay.js);
//  - cac cho danh dau data-may="<khoa>" hien vien cham tim; dua chuot / focus / cham vao cho nao thi Mây giai thich cho do (cham = khong mo lien ket, de doc giai thich);
//  - Esc hoac nut X de dong, Mây nap lai.
export default function MayHuongDan() {
  const duongDan = usePathname();
  const [mo, setMo] = useState(false);
  const [dangXem, setDangXem] = useState(null); // { khoa, ten, noiDung, duongDan }
  const khungRef = useRef(null);
  const gioiThieu = layGioiThieu(duongDan);
  // Giai thich chi con dung o trang da chon - sang trang khac thi quay ve loi gioi thieu trang.
  const xem = dangXem && dangXem.duongDan === duongDan ? dangXem : null;

  useEffect(() => {
    if (!mo) return undefined;
    let phanTu = null;
    const danhDau = (el) => {
      if (phanTu && phanTu !== el) phanTu.classList.remove("may-dang-xem");
      if (el) el.classList.add("may-dang-xem");
      phanTu = el;
    };
    const tim = (dich) => {
      const el = dich?.closest?.("[data-may]");
      if (!el || khungRef.current?.contains(el)) return null;
      const khoa = el.getAttribute("data-may");
      const g = layGiaiThich(khoa);
      return g ? { el, khoa, g } : null;
    };
    const hienGiaiThich = (e) => {
      const r = tim(e.target);
      if (!r) return false;
      danhDau(r.el);
      setDangXem((cu) => (cu?.khoa === r.khoa && cu.duongDan === window.location.pathname ? cu : { khoa: r.khoa, ...r.g, duongDan: window.location.pathname }));
      return true;
    };
    // Cham / bam vao cho co giai thich: chi giai thich, khong mo lien ket / khong bam nut (chay truoc moi xu ly khac vi dang ky o window, pha capture).
    const bam = (e) => {
      if (hienGiaiThich(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const phim = (e) => {
      if (e.key === "Escape") setMo(false);
    };
    document.body.classList.add("may-mo");
    document.addEventListener("mouseover", hienGiaiThich);
    document.addEventListener("focusin", hienGiaiThich);
    window.addEventListener("click", bam, true);
    document.addEventListener("keydown", phim);
    return () => {
      document.body.classList.remove("may-mo");
      document.removeEventListener("mouseover", hienGiaiThich);
      document.removeEventListener("focusin", hienGiaiThich);
      window.removeEventListener("click", bam, true);
      document.removeEventListener("keydown", phim);
      danhDau(null);
    };
  }, [mo]);

  return (
    <>
      <button
        type="button"
        onClick={() => setMo((v) => !v)}
        aria-expanded={mo}
        aria-label={mo ? "Đóng Mây hướng dẫn" : "Mở Mây hướng dẫn"}
        title={mo ? "Đóng Mây" : "Bấm để Mây hướng dẫn"}
        className={`may-nut fixed z-[60] ${mo ? "may-nut-mo" : ""}`}
      >
        <span className="may-nhun block">
          <HinhMay />
        </span>
      </button>

      {mo && (
        <div
          ref={khungRef}
          role="dialog"
          aria-label="Mây hướng dẫn"
          className="may-khung fixed z-[60] rounded-2xl border p-4 shadow-2xl"
          style={{ background: "#15151F", borderColor: "rgba(167,139,250,0.45)", color: TEXT, fontFamily: "'Inter', sans-serif" }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide" style={{ color: TIM, fontFamily: "'JetBrains Mono', monospace" }}>
                Mây hướng dẫn
              </p>
              <p className="text-base font-bold">{gioiThieu.ten}</p>
            </div>
            <button type="button" onClick={() => setMo(false)} aria-label="Đóng Mây hướng dẫn" className="p-1 rounded hover:bg-white/10">
              <X size={16} color={MUTED} />
            </button>
          </div>

          {xem && (
            <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.4)" }} aria-live="polite">
              <p className="text-xs font-bold" style={{ color: "#C9BEFF" }}>
                {xem.ten}
              </p>
              <p className="text-sm leading-relaxed mt-1">{xem.noiDung}</p>
            </div>
          )}

          <p className="text-sm leading-relaxed" style={{ color: "#D8D8E0" }}>
            {gioiThieu.gioiThieu}
          </p>
          {gioiThieu.meo.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {gioiThieu.meo.map((m) => (
                <li key={m} className="text-xs leading-relaxed flex gap-1.5" style={{ color: "#C4C4CF" }}>
                  <span style={{ color: TIM }}>•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          )}

          <p className="text-[11px] mt-4 leading-relaxed" style={{ color: MUTED }}>
            Đưa chuột (hoặc chạm) vào chữ có <span style={{ outline: `1px dashed ${TIM}`, outlineOffset: 2, borderRadius: 3 }}>viền chấm tím</span> để Mây giải thích. Bấm ✕ hoặc
            Esc để Mây nấp lại.
          </p>
          <Link href="/huong-dan" className="inline-block text-xs mt-2 underline" style={{ color: TIM }}>
            Xem Hướng dẫn đầy đủ →
          </Link>
        </div>
      )}
    </>
  );
}
