"use client";

import { useState } from "react";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";
const XANH = "#22C55E";
const DO = "#EF4444";

export default function FormGuiTinNhan() {
  const [hoTen, setHoTen] = useState("");
  const [lienLac, setLienLac] = useState("");
  const [noiDung, setNoiDung] = useState("");
  const [website, setWebsite] = useState(""); // o bay chong bot: nguoi that khong thay / khong dien
  const [dangGui, setDangGui] = useState(false);
  const [ketQua, setKetQua] = useState(null);

  async function guiForm(e) {
    e.preventDefault();
    if (!hoTen.trim() || !lienLac.trim() || !noiDung.trim()) {
      setKetQua({ ok: false, thongBao: "Vui lòng nhập đủ Họ tên, Liên lạc và Nội dung." });
      return;
    }
    setDangGui(true);
    setKetQua(null);
    try {
      const res = await fetch("/api/lien-he", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoTen: hoTen.trim(), lienLac: lienLac.trim(), noiDung: noiDung.trim(), website }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setKetQua({ ok: true, thongBao: "Đã gửi thành công! Cảm ơn bạn, sẽ phản hồi sớm nhất có thể." });
        setHoTen("");
        setLienLac("");
        setNoiDung("");
      } else {
        setKetQua({ ok: false, thongBao: d.loi || "Có lỗi xảy ra, thử lại sau." });
      }
    } catch {
      setKetQua({ ok: false, thongBao: "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại." });
    } finally {
      setDangGui(false);
    }
  }

  return (
    <form onSubmit={guiForm} className="rounded-2xl border p-6 flex flex-col gap-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div>
        <label className="text-xs uppercase tracking-wide block mb-1.5" style={{ color: MUTED }}>
          Họ tên
        </label>
        <input
          value={hoTen}
          onChange={(e) => setHoTen(e.target.value)}
          placeholder="Nguyễn Văn A"
          className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
          style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "'Inter', sans-serif" }}
        />
      </div>

      <div>
        <label className="text-xs uppercase tracking-wide block mb-1.5" style={{ color: MUTED }}>
          Email hoặc số điện thoại
        </label>
        <input
          value={lienLac}
          onChange={(e) => setLienLac(e.target.value)}
          placeholder="ban@email.com hoặc 09xx xxx xxx"
          className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
          style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "'JetBrains Mono', monospace" }}
        />
      </div>

      <div>
        <label className="text-xs uppercase tracking-wide block mb-1.5" style={{ color: MUTED }}>
          Nội dung
        </label>
        <textarea
          value={noiDung}
          onChange={(e) => setNoiDung(e.target.value)}
          placeholder="Bạn muốn góp ý hay hỏi điều gì?"
          rows={5}
          className="w-full px-3 py-2.5 text-sm rounded-lg outline-none resize-none"
          style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "'Inter', sans-serif" }}
        />
      </div>

      <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />

      {ketQua && (
        <p className="text-sm" style={{ color: ketQua.ok ? XANH : DO }}>
          {ketQua.thongBao}
        </p>
      )}

      <button
        type="submit"
        disabled={dangGui}
        className="px-4 py-2.5 text-sm rounded-lg"
        style={{ background: PRIMARY, color: "#FFFFFF", fontWeight: 600, opacity: dangGui ? 0.6 : 1 }}
      >
        {dangGui ? "Đang gửi..." : "Gửi liên hệ"}
      </button>
    </form>
  );
}
