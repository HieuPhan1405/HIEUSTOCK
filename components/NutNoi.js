"use client";

import { useEffect, useState } from "react";
import { ArrowUp, MessageCircle, X } from "lucide-react";

// Cac nut noi goc duoi ben phai: len dau trang (chi hien khi da cuon xuong), Facebook, Zalo (2 nut sau chi hien neu chu web da nhap kenh).
// Dien thoai: Facebook + Zalo gom vao 1 nut "Lien he" (bam moi xoe ra) va nut nho hon de khong de len chu; may tinh van hien du.
export default function NutNoi({ zalo, facebook }) {
  const [daCuon, setDaCuon] = useState(false);
  const [xoe, setXoe] = useState(false);

  useEffect(() => {
    const kiem = () => setDaCuon(window.scrollY > 400);
    kiem();
    window.addEventListener("scroll", kiem, { passive: true });
    return () => window.removeEventListener("scroll", kiem);
  }, []);

  const lenDau = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const kieu = "w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105";
  const coKenh = Boolean(zalo || facebook);

  return (
    <div className="fixed bottom-4 right-3 md:bottom-5 md:right-4 z-30 flex flex-col items-center gap-2 md:gap-2.5">
      {daCuon && (
        <button
          type="button"
          onClick={lenDau}
          aria-label="Lên đầu trang"
          className={`${kieu} cursor-pointer border`}
          style={{ background: "rgba(21,21,31,0.92)", borderColor: "#26262F", color: "#F5F5F7" }}
        >
          <ArrowUp size={18} aria-hidden="true" />
        </button>
      )}
      <div className={`${xoe ? "flex" : "hidden"} md:flex flex-col items-center gap-2 md:gap-2.5`}>
        {facebook && (
          <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={kieu} style={{ background: "#1877F2", color: "#FFFFFF" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.1H7.5v3h2.8V21h3.2z" />
            </svg>
          </a>
        )}
        {zalo && (
          <a
            href={zalo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat Zalo"
            className={`${kieu} text-[11px]`}
            style={{ background: "#0068FF", color: "#FFFFFF", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
          >
            Zalo
          </a>
        )}
      </div>
      {coKenh && (
        <button
          type="button"
          onClick={() => setXoe((v) => !v)}
          aria-expanded={xoe}
          aria-label={xoe ? "Đóng liên hệ" : "Liên hệ qua Zalo / Facebook"}
          className={`${kieu} md:hidden cursor-pointer`}
          style={{ background: xoe ? "#26262F" : "#0068FF", color: "#FFFFFF" }}
        >
          {xoe ? <X size={18} aria-hidden="true" /> : <MessageCircle size={19} aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}
