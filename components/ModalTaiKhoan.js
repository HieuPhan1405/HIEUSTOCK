"use client";

import { useState } from "react";
import { X } from "lucide-react";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const PRIMARY = "#6C5CE7";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const DO = "#EF4444";

function OTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
      style={{
        background: active ? "rgba(108,92,231,0.16)" : "transparent",
        color: active ? PRIMARY : MUTED,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {children}
    </button>
  );
}

// Dung chung cho moi noi can hoi "Dang ky/Dang nhap" (nut o Sidebar, cot Tin
// hieu bi khoa o Bo loc, cac trang khoa hoan toan...) - chi lo phan FORM,
// noi goi quyet dinh KHI NAO mo/dong (open/onClose) va lam gi sau khi thanh
// cong (onThanhCong nhan ve {sdt, ten}).
export default function ModalTaiKhoan({ open, onClose, onThanhCong, tieuDeGoiY }) {
  const [tab, setTab] = useState("dangKy");
  const [sdt, setSdt] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [ten, setTen] = useState("");
  const [dangXuLy, setDangXuLy] = useState(false);
  const [loi, setLoi] = useState("");

  if (!open) return null;

  function dong() {
    setLoi("");
    setMatKhau("");
    onClose?.();
  }

  async function guiForm(e) {
    e.preventDefault();
    setLoi("");
    setDangXuLy(true);
    try {
      const res = await fetch(tab === "dangKy" ? "/api/dang-ky" : "/api/dang-nhap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdt, matKhau, ten }),
      });
      const d = await res.json();
      if (!res.ok) {
        setLoi(d.loi || "Có lỗi xảy ra, thử lại sau.");
        return;
      }
      setSdt("");
      setTen("");
      setMatKhau("");
      onThanhCong?.(d.nguoiDung);
      onClose?.();
    } catch (e) {
      setLoi(String(e?.message || e));
    } finally {
      setDangXuLy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={dong}>
      <div className="w-full max-w-sm rounded-2xl border p-5" style={{ borderColor: VIEN, background: NEN_CARD }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p style={{ color: TEXT, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>Tài khoản CloudStock</p>
          <button onClick={dong} aria-label="Đóng">
            <X size={18} color={MUTED} />
          </button>
        </div>

        {tieuDeGoiY && (
          <p className="text-xs mb-4" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
            {tieuDeGoiY}
          </p>
        )}

        <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ background: "#0B0B10" }}>
          <OTab active={tab === "dangKy"} onClick={() => setTab("dangKy")}>
            Đăng ký
          </OTab>
          <OTab active={tab === "dangNhap"} onClick={() => setTab("dangNhap")}>
            Đăng nhập
          </OTab>
        </div>

        <form onSubmit={guiForm} className="flex flex-col gap-2.5">
          {tab === "dangKy" && (
            <input
              value={ten}
              onChange={(e) => setTen(e.target.value)}
              placeholder="Họ tên (không bắt buộc)"
              className="px-3 py-2 text-sm rounded-lg outline-none"
              style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "'Inter', sans-serif" }}
            />
          )}
          <input
            value={sdt}
            onChange={(e) => setSdt(e.target.value)}
            placeholder="Số điện thoại"
            inputMode="tel"
            className="px-3 py-2 text-sm rounded-lg outline-none"
            style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "'JetBrains Mono', monospace" }}
          />
          <input
            type="password"
            value={matKhau}
            onChange={(e) => setMatKhau(e.target.value)}
            placeholder="Mật khẩu (ít nhất 6 ký tự)"
            className="px-3 py-2 text-sm rounded-lg outline-none"
            style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "'Inter', sans-serif" }}
          />
          {loi && (
            <p className="text-xs" style={{ color: DO }}>
              {loi}
            </p>
          )}
          <button
            type="submit"
            disabled={dangXuLy || !sdt || !matKhau}
            className="px-3 py-2.5 text-sm font-semibold rounded-lg mt-1"
            style={{ background: PRIMARY, color: "#FFFFFF", opacity: dangXuLy || !sdt || !matKhau ? 0.6 : 1 }}
          >
            {dangXuLy ? "Đang xử lý..." : tab === "dangKy" ? "Đăng ký" : "Đăng nhập"}
          </button>
        </form>
        <p className="text-[11px] mt-3" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
          Đăng ký để đội ngũ CloudStock chủ động liên hệ tư vấn khi cần.
        </p>
      </div>
    </div>
  );
}
