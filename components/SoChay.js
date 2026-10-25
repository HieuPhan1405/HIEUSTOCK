"use client";

import { useLayoutEffect, useRef } from "react";
import { soVN, pctVN } from "@/lib/soVN";

// SO CHAY: so dem len tu gia tri thap toi gia tri that khi hien ra tren man hinh, va "chay" tu gia tri cu sang moi khi du lieu cap nhat.
// May chu van ve SAN gia tri cuoi (khong trong, khong nhay layout); chi sua noi dung chu o trinh duyet. Tat khi nguoi dung chon "giam chuyen dong".
// kieu: "so" (1.774,15) | "pct" (+0,77%). chuSo: so chu so thap phan.
export default function SoChay({ gia, chuSo = 0, kieu = "so", coDau = true, coDinh = true, hau = "", thoiGian = 900, className, style }) {
  const ref = useRef(null);
  const dangHien = useRef(null); // gia tri dang hien gan nhat (de lan cap nhat sau chay tu day)
  const raf = useRef(0);

  const dinhDang = (v) => (kieu === "pct" ? pctVN(v, chuSo, coDau) : soVN(v, chuSo, coDinh)) + hau;
  const chu = dinhDang(gia);

  useLayoutEffect(() => {
    const el = ref.current;
    const nut = el?.firstChild;
    const dich = Number(gia);
    if (!nut || gia == null || Number.isNaN(dich)) return;
    const chay = (tu, ms) => {
      cancelAnimationFrame(raf.current);
      const t0 = performance.now();
      const buoc = (t) => {
        const x = Math.min(1, (t - t0) / ms);
        const v = x >= 1 ? dich : tu + (dich - tu) * (1 - Math.pow(1 - x, 3));
        nut.nodeValue = dinhDang(v);
        dangHien.current = v;
        if (x < 1) raf.current = requestAnimationFrame(buoc);
      };
      raf.current = requestAnimationFrame(buoc);
    };
    const giamChuyenDong = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (giamChuyenDong) {
      dangHien.current = dich;
      return;
    }
    if (dangHien.current != null) {
      // cap nhat du lieu: chay tu gia tri dang hien sang gia tri moi (React vua ghi gia tri moi, dua ve gia tri cu truoc khi ve)
      if (dangHien.current !== dich) {
        nut.nodeValue = dinhDang(dangHien.current);
        chay(dangHien.current, 500);
      }
      return;
    }
    // lan dau: doi toi khi so nam trong man hinh roi moi dem (so o duoi man hinh khong bi dem luc chua ai thay)
    const bd = Math.abs(dich) >= 100 ? dich * 0.8 : 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        nut.nodeValue = dinhDang(bd);
        chay(bd, thoiGian);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gia, chuSo, kieu, coDau, coDinh, hau, thoiGian]);

  return (
    <span ref={ref} className={className} style={style}>
      {chu}
    </span>
  );
}
