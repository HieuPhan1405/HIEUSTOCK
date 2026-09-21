"use client";

import { useState, useEffect, useCallback } from "react";
import { UserRound } from "lucide-react";
import ModalTaiKhoan from "@/components/ModalTaiKhoan";

const PRIMARY = "#6C5CE7";
const MUTED = "#8B8B99";

export default function TaiKhoanNut({ compact, nhan }) {
  const [nguoiDung, setNguoiDung] = useState(undefined); // undefined = dang tai, null = chua dang nhap
  const [moModal, setMoModal] = useState(false);

  const taiPhien = useCallback(() => {
    fetch("/api/nguoi-dung-hien-tai")
      .then((r) => r.json())
      .then((d) => setNguoiDung(d.nguoiDung || null))
      .catch(() => setNguoiDung(null));
  }, []);

  useEffect(() => {
    taiPhien();
  }, [taiPhien]);

  async function dangXuat() {
    await fetch("/api/dang-xuat", { method: "POST" });
    setNguoiDung(null);
  }

  if (nguoiDung === undefined) return null;

  if (nguoiDung) {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
        <span style={{ color: MUTED }} className={compact ? "hidden sm:inline" : ""}>
          Xin chào, {nguoiDung.ten || nguoiDung.sdt}
        </span>
        {nguoiDung.la_admin && (
          <span
            className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ background: "#22C55E", color: "#0B0B10" }}
          >
            ADMIN
          </span>
        )}
        <button onClick={dangXuat} style={{ color: PRIMARY }} className="font-medium">
          Đăng xuất
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setMoModal(true)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${compact ? "" : "w-full justify-center"}`}
        style={{ background: PRIMARY, color: "#FFFFFF", fontFamily: "'Inter', sans-serif" }}
      >
        <UserRound size={14} strokeWidth={2.5} />
        {compact && !nhan ? (
          <>
            <span className="hidden sm:inline">Đăng ký nhận tư vấn</span>
            <span className="sm:hidden">Đăng ký</span>
          </>
        ) : (
          nhan || "Đăng ký nhận tư vấn"
        )}
      </button>
      <ModalTaiKhoan open={moModal} onClose={() => setMoModal(false)} onThanhCong={setNguoiDung} />
    </>
  );
}
