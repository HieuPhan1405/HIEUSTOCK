"use client";

// KHUNG NHUNG BAO CAO (22/11/2026): bao cao la 1 file HTML tinh tu chua CSS rieng (kho giay A4, phong Arial) nen nhung bang iframe cung goc (khong dung CSS cua web).
// Hai viec: (1) dong bo che do sang / toi cua web vao bao cao (data-theme tren <html> cua iframe), (2) tu chinh chieu cao iframe theo noi dung de khong co thanh cuon kep.
import { useCallback, useEffect, useRef, useState } from "react";

export default function KhungBaoCao({ src, tieuDe }) {
  const ref = useRef(null);
  const [cao, setCao] = useState(1400);

  const dongBo = useCallback(() => {
    const f = ref.current;
    try {
      const d = f?.contentDocument;
      if (!d?.documentElement) return;
      const che = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      d.documentElement.setAttribute("data-theme", che);
      const h = Math.ceil(Math.max(d.documentElement.scrollHeight, d.body?.scrollHeight || 0));
      if (h > 200) setCao((c) => (Math.abs(c - h) > 2 ? h : c));
    } catch {
      /* iframe chua san sang hoac khac goc: giu chieu cao cu */
    }
  }, []);

  useEffect(() => {
    const quanSat = new MutationObserver(dongBo);
    quanSat.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("resize", dongBo);
    const dinhKy = setInterval(dongBo, 1500); // phong khi font tai xong lam doi chieu cao
    return () => {
      quanSat.disconnect();
      window.removeEventListener("resize", dongBo);
      clearInterval(dinhKy);
    };
  }, [dongBo]);

  return <iframe ref={ref} src={src} title={tieuDe} onLoad={dongBo} loading="eager" className="w-full block rounded-xl border" style={{ height: cao, borderColor: "var(--vien)", background: "var(--card)" }} />;
}
