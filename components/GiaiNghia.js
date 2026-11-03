"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { layGiaiThich } from "@/lib/noiDungMay";

const RONG = 300;
const LE = 12;

// THUAT NGU CO GIAI NGHIA: chu co gach cham; re chuot (may tinh), Tab toi (ban phim) hoac cham (dien thoai) hien hop giai nghia ngay canh, khong can mo Mây.
// Noi dung lay tu 1 cho duy nhat lib/noiDungMay.js (GIAI_THICH, cung loi giai thich cua Mây) hoac truyen thang noiDung. Khoa khong co giai thich -> chi hien chu.
// Hop dat o document.body (portal, vi tri fixed tinh tu cho chu): khong bi cat boi the cha overflow / transform, khong lam tran ngang man hinh dien thoai.
// Dong khi roi chuot, cuon trang, cham ra ngoai. Khong dat ben trong <a> (cham vao se mo lien ket).
export default function GiaiNghia({ khoa, noiDung = null, children, className = "" }) {
  const g = noiDung ? { noiDung } : layGiaiThich(khoa); // noiDung: loi giai nghia rieng cua cho do (khong co trong tu dien chung)
  const ref = useRef(null);
  const [viTri, setViTri] = useState(null); // { left, width, top | bottom } | null = dang dong
  const chamRef = useRef(false); // mo bang cham (dien thoai / but): khong dong khi roi chuot / mat focus gia lap, chi dong khi cham ra ngoai hoac cuon

  const mo = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(RONG, vw - 2 * LE);
    const left = Math.max(LE, Math.min(r.left, vw - width - LE));
    // sat day man hinh (con duoi 160px) ma phia tren con cho -> hien phia tren chu
    const lenTren = vh - r.bottom < 160 && r.top > 180;
    setViTri(lenTren ? { left, width, bottom: vh - r.top + 6 } : { left, width, top: r.bottom + 6 });
  };
  const dong = () => setViTri(null);

  useEffect(() => {
    if (!viTri) return undefined;
    const tat = () => setViTri(null);
    const chamNgoai = (e) => {
      if (!ref.current?.contains(e.target)) setViTri(null);
    };
    window.addEventListener("scroll", tat, { passive: true, capture: true });
    window.addEventListener("resize", tat);
    document.addEventListener("pointerdown", chamNgoai);
    return () => {
      window.removeEventListener("scroll", tat, { capture: true });
      window.removeEventListener("resize", tat);
      document.removeEventListener("pointerdown", chamNgoai);
    };
  }, [viTri]);

  if (!g) return <span className={className}>{children}</span>;
  return (
    <span
      ref={ref}
      tabIndex={0}
      role="button"
      aria-expanded={viTri != null}
      className={`cs-giai-nghia ${className}`}
      onPointerDown={(e) => {
        chamRef.current = e.pointerType !== "mouse";
      }}
      onMouseEnter={mo}
      onMouseLeave={() => !chamRef.current && dong()}
      onFocus={mo}
      onBlur={() => !chamRef.current && dong()}
      onClick={(e) => {
        // cham tren dien thoai: chi mo (khong dao trang thai - focus / mouseenter gia lap da mo truoc do)
        e.stopPropagation();
        mo();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") dong();
      }}
    >
      {children}
      {viTri &&
        createPortal(
          <span role="tooltip" className="cs-giai-nghia-hop" style={{ position: "fixed", ...viTri }}>
            {g.noiDung}
          </span>,
          document.body
        )}
    </span>
  );
}
