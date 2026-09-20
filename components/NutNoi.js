"use client";

import { ArrowUp } from "lucide-react";

// Cac nut noi goc duoi ben phai, luon hien khi cuon: len dau trang, Facebook, Zalo (2 nut sau chi hien neu chu web da nhap kenh).
export default function NutNoi({ zalo, facebook }) {
  const lenDau = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const kieu = "w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105";

  return (
    <div className="fixed bottom-5 right-4 z-30 flex flex-col items-center gap-2.5">
      <button
        type="button"
        onClick={lenDau}
        aria-label="Lên đầu trang"
        className={`${kieu} cursor-pointer border`}
        style={{ background: "#15151F", borderColor: "#26262F", color: "#F5F5F7" }}
      >
        <ArrowUp size={18} aria-hidden="true" />
      </button>
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
  );
}
