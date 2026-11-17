"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LineChart } from "lucide-react";
import { DS_CHON_CHI_SO } from "@/lib/chiSoNhom";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";

// Nut "Chỉ số" tren /bieu-do (17/11/2026): chon nhanh chi so thi truong, nhom co phieu (VN30, Midcap, Smallcap...), nganh tu tinh theo cach chia nganh CloudStock va 10 nganh HOSE.
export default function ChonChiSo({ ma }) {
  const [mo, setMo] = useState(false);
  const khungRef = useRef(null);

  useEffect(() => {
    if (!mo) return;
    const ngoai = (e) => {
      if (khungRef.current && !khungRef.current.contains(e.target)) setMo(false);
    };
    const phim = (e) => e.key === "Escape" && setMo(false);
    document.addEventListener("mousedown", ngoai);
    document.addEventListener("keydown", phim);
    return () => {
      document.removeEventListener("mousedown", ngoai);
      document.removeEventListener("keydown", phim);
    };
  }, [mo]);

  return (
    <div ref={khungRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setMo((v) => !v)}
        aria-expanded={mo}
        aria-haspopup="dialog"
        className="h-8 px-2.5 rounded-lg text-sm inline-flex items-center gap-1.5 cursor-pointer"
        style={{ background: NEN_CARD, border: `1px solid ${mo ? "var(--tim-chu)" : VIEN}`, color: TEXT, fontWeight: 600 }}
      >
        <LineChart size={14} aria-hidden="true" style={{ color: "var(--tim-chu)" }} />
        Chỉ số ngành / nhóm
        <ChevronDown size={14} aria-hidden="true" style={{ color: MUTED, transform: mo ? "rotate(180deg)" : undefined }} />
      </button>
      {mo && (
        <div
          role="dialog"
          aria-label="Chọn chỉ số"
          className="absolute left-0 top-10 z-40 w-[min(92vw,560px)] max-h-[70vh] overflow-y-auto rounded-xl p-3 shadow-2xl"
          style={{ background: NEN_CARD, border: `1px solid ${VIEN}` }}
        >
          {DS_CHON_CHI_SO.map((g) => (
            <div key={g.nhom} className="mb-3 last:mb-0">
              <p className="text-[11px] uppercase tracking-wide mb-1.5" style={{ color: MUTED, fontWeight: 600 }}>
                {g.nhom}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {g.muc.map((m) => (
                  <Link
                    key={m.ma}
                    href={`/bieu-do?ma=${m.ma}`}
                    onClick={() => setMo(false)}
                    title={m.moTa ? `${m.ma} · ${m.moTa}` : m.ma}
                    className="rounded-md px-2 py-1.5 text-[13px] leading-tight hover:bg-[color:var(--hover-nhe)]"
                    style={{ color: TEXT, background: m.ma === ma ? "rgba(108,92,231,0.22)" : undefined }}
                  >
                    <span style={{ fontWeight: 600 }}>{m.nhan}</span>
                    <span className="block text-[11px] truncate" style={{ color: MUTED }}>
                      {m.ma}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[11px] mt-2 leading-snug" style={{ color: MUTED }}>
            Ngành CloudStock: trung bình đều biến động giá các mã trong ngành theo cách chia ngành của web (gồm cả HNX, UPCoM), mốc 100. Ngành HOSE: chỉ số chính thức của sở, chỉ gồm mã sàn HOSE.
          </p>
        </div>
      )}
    </div>
  );
}
