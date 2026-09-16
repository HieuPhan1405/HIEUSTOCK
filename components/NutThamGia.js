"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";

// Nut "Tham gia" 1 ma - dung chung cho Bo loc (cong khai, co the CHUA dang
// nhap -> can moChuaDangNhap de bat modal dang ky) va So lenh mo (trang da
// khoa dang nhap tu truoc nen luon coi la da dang nhap, khong truyen
// coDangNhap = van mac dinh true).
export default function NutThamGia({ ma, soNguoiThamGia, daThamGia, coDangNhap = true, moChuaDangNhap, onDoiTrangThai }) {
  const [dangXuLy, setDangXuLy] = useState(false);

  async function bam(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!coDangNhap) {
      moChuaDangNhap?.();
      return;
    }
    if (dangXuLy) return;
    setDangXuLy(true);
    try {
      const res = await fetch("/api/tham-gia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ma }),
      });
      const d = await res.json();
      if (res.ok) onDoiTrangThai?.(ma, { daThamGia: d.daThamGia, soNguoiThamGia: d.soNguoiThamGia });
    } catch {
      /* bo qua loi mang - nguoi dung bam lai sau */
    } finally {
      setDangXuLy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={bam}
      disabled={dangXuLy}
      title={coDangNhap ? (daThamGia ? "Rời khỏi mã này" : "Tham gia theo dõi mã này") : "Đăng ký/Đăng nhập để tham gia"}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors"
      style={{
        background: daThamGia ? "rgba(108,92,231,0.18)" : "rgba(255,255,255,0.06)",
        color: daThamGia ? PRIMARY : MUTED,
        opacity: dangXuLy ? 0.6 : 1,
      }}
    >
      <UserPlus size={11} />
      {soNguoiThamGia ?? 0}
    </button>
  );
}
