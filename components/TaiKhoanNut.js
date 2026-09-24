"use client";

import { useState, useEffect, useCallback } from "react";
import { UserRound, Pencil, Check, X as HuyIcon } from "lucide-react";
import ModalTaiKhoan from "@/components/ModalTaiKhoan";

const PRIMARY = "#6C5CE7";
const MUTED = "#8B8B99";
const TEXT = "#F5F5F7";
const XANH = "#22C55E";
const VANG = "#FBBF24";

export default function TaiKhoanNut({ compact, nhan }) {
  const [nguoiDung, setNguoiDung] = useState(undefined); // undefined = dang tai, null = chua dang nhap
  const [moModal, setMoModal] = useState(false);
  const [dangSuaTen, setDangSuaTen] = useState(false);
  const [tenMoi, setTenMoi] = useState("");
  const [dangLuu, setDangLuu] = useState(false);

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

  function moSuaTen() {
    setTenMoi(nguoiDung?.ten || "");
    setDangSuaTen(true);
  }

  async function luuTen(e) {
    e.preventDefault();
    const sach = tenMoi.trim();
    if (!sach || dangLuu) return;
    setDangLuu(true);
    try {
      const res = await fetch("/api/doi-ten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ten: sach }),
      });
      const d = await res.json();
      if (res.ok) {
        setNguoiDung((cu) => ({ ...cu, ten: d.nguoiDung?.ten ?? sach }));
        setDangSuaTen(false);
      }
    } finally {
      setDangLuu(false);
    }
  }

  if (nguoiDung === undefined) return null;

  if (nguoiDung) {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
        {dangSuaTen ? (
          <form onSubmit={luuTen} className="flex items-center gap-1">
            <input
              autoFocus
              value={tenMoi}
              onChange={(e) => setTenMoi(e.target.value)}
              maxLength={200}
              placeholder="Tên hiển thị"
              className="px-2 py-1 text-xs rounded outline-none"
              style={{ background: "#0B0B10", border: `1px solid ${PRIMARY}`, color: TEXT, width: 140 }}
            />
            <button type="submit" disabled={dangLuu} style={{ color: XANH }} aria-label="Lưu tên">
              <Check size={14} strokeWidth={2.5} />
            </button>
            <button type="button" onClick={() => setDangSuaTen(false)} style={{ color: MUTED }} aria-label="Huỷ đổi tên">
              <HuyIcon size={14} strokeWidth={2.5} />
            </button>
          </form>
        ) : (
          <span style={{ color: MUTED }} className={`items-center gap-1 ${compact ? "hidden sm:flex" : "flex"}`}>
            Xin chào, {nguoiDung.ten || nguoiDung.sdt}
            <button type="button" onClick={moSuaTen} style={{ color: MUTED }} aria-label="Đổi tên hiển thị" title="Đổi tên hiển thị">
              <Pencil size={11} strokeWidth={2.5} />
            </button>
          </span>
        )}
        {nguoiDung.la_admin && (
          <span
            className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ background: "#22C55E", color: "#0B0B10" }}
          >
            ADMIN
          </span>
        )}
        {!nguoiDung.da_duyet && (
          <span
            className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ background: VANG, color: "#0B0B10" }}
            title="Tài khoản đang chờ quản trị viên duyệt"
          >
            CHỜ DUYỆT
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
