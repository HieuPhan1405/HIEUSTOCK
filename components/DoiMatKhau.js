"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const PRIMARY = "#6C5CE7";
const sans = { fontFamily: "var(--font-chu)" };

// Nut + hop thoai DOI MAT KHAU cho nguoi dung dang dang nhap (dat trong menu Tai khoan o thanh dau).
export default function DoiMatKhau({ mo, onDong }) {
  const [cu, setCu] = useState("");
  const [moi, setMoi] = useState("");
  const [lai, setLai] = useState("");
  const [dang, setDang] = useState(false);
  const [thongBao, setThongBao] = useState(null); // { ok, noiDung }

  const dong = () => {
    onDong?.();
    setCu("");
    setMoi("");
    setLai("");
    setThongBao(null);
  };

  async function gui(e) {
    e.preventDefault();
    if (moi !== lai) return setThongBao({ ok: false, noiDung: "Mật khẩu nhập lại chưa khớp." });
    setDang(true);
    setThongBao(null);
    try {
      const res = await fetch("/api/doi-mat-khau", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cu, moi }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setThongBao({ ok: true, noiDung: "Đã đổi mật khẩu. Lần sau đăng nhập bằng mật khẩu mới." });
        setCu("");
        setMoi("");
        setLai("");
      } else setThongBao({ ok: false, noiDung: d.loi || "Không đổi được mật khẩu." });
    } catch {
      setThongBao({ ok: false, noiDung: "Không kết nối được máy chủ." });
    } finally {
      setDang(false);
    }
  }

  const o = "w-full px-3 py-2 rounded-lg outline-none text-sm";
  const kieuO = { background: "var(--nen)", border: "1px solid var(--vien)", color: "var(--chu)", ...sans };

  return (
    <>
      {mo &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={dong}>
            <form onSubmit={gui} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Đổi mật khẩu" className="rounded-2xl border p-5 w-full max-w-sm" style={{ background: "var(--card)", borderColor: "var(--vien)", color: "var(--chu)", ...sans }}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold">Đổi mật khẩu</p>
                <button type="button" onClick={dong} aria-label="Đóng" style={{ color: "var(--mo)" }}>
                  <X size={18} />
                </button>
              </div>
              <label className="block text-xs mb-1" style={{ color: "var(--mo)" }}>Mật khẩu hiện tại (hoặc mật khẩu tạm được cấp)</label>
              <input type="password" autoComplete="current-password" value={cu} onChange={(e) => setCu(e.target.value)} className={`${o} mb-3`} style={kieuO} required />
              <label className="block text-xs mb-1" style={{ color: "var(--mo)" }}>Mật khẩu mới (ít nhất 8 ký tự, có chữ và số)</label>
              <input type="password" autoComplete="new-password" value={moi} onChange={(e) => setMoi(e.target.value)} className={`${o} mb-3`} style={kieuO} required />
              <label className="block text-xs mb-1" style={{ color: "var(--mo)" }}>Nhập lại mật khẩu mới</label>
              <input type="password" autoComplete="new-password" value={lai} onChange={(e) => setLai(e.target.value)} className={`${o} mb-3`} style={kieuO} required />
              {thongBao && (
                <p className="text-xs mb-3" style={{ color: thongBao.ok ? "var(--xanh)" : "var(--do)" }}>
                  {thongBao.noiDung}
                </p>
              )}
              <button type="submit" disabled={dang} className="w-full py-2.5 rounded-lg font-semibold text-sm" style={{ background: PRIMARY, color: "#fff", opacity: dang ? 0.6 : 1 }}>
                {dang ? "Đang lưu…" : "Lưu mật khẩu mới"}
              </button>
            </form>
          </div>,
          document.body
        )}
    </>
  );
}
