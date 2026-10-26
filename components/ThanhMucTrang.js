"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// THANH MUC TRANG (dinh duoi thanh dau): chip nhay toi tung khoi cua trang dai (trang ma) va to sang khoi dang xem. Chi hien khoi CO trong trang (id ton tai).
const VIEN = "var(--vien)";
const PRIMARY = "#6C5CE7";

export default function ThanhMucTrang({ muc }) {
  // id cac khoi thuc su co trong trang (doc tu DOM; server tra rong de khop luc hydrate)
  const coChuoi = useSyncExternalStore(
    () => () => {},
    () => muc.filter((m) => document.getElementById(m.id)).map((m) => m.id).join(","),
    () => ""
  );
  const co = coChuoi ? coChuoi.split(",") : [];
  const [dang, setDang] = useState(null);
  useEffect(() => {
    const dsCo = muc.filter((m) => co.includes(m.id));
    if (!dsCo.length) return;
    const quanSat = new IntersectionObserver(
      (ds) => {
        const thay = ds.filter((d) => d.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (thay) setDang(thay.target.id);
      },
      { rootMargin: "-110px 0px -60% 0px" }
    );
    dsCo.forEach((m) => quanSat.observe(document.getElementById(m.id)));
    return () => quanSat.disconnect();
  }, [muc, coChuoi]); // eslint-disable-line react-hooks/exhaustive-deps
  if (co.length < 2) return null;
  const nhay = (id) => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  return (
    <nav className="sticky top-[57px] z-20 -mx-1 px-1 py-2 mb-4 flex gap-1.5 overflow-x-auto cs-ngan-keo backdrop-blur-xl" style={{ background: "color-mix(in srgb, var(--nen) 88%, transparent)", borderBottom: `1px solid ${VIEN}` }} aria-label="Các mục trong trang">
      {muc.filter((m) => co.includes(m.id)).map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => nhay(m.id)}
          aria-current={dang === m.id ? "true" : undefined}
          className="px-3 py-1 rounded-full text-xs border whitespace-nowrap"
          style={{ borderColor: dang === m.id ? PRIMARY : VIEN, color: dang === m.id ? "var(--chu)" : "var(--mo)", background: dang === m.id ? "var(--vien-nhe)" : "transparent", fontFamily: "var(--font-chu)", fontWeight: dang === m.id ? 700 : 500 }}
        >
          {m.nhan}
        </button>
      ))}
    </nav>
  );
}
