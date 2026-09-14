"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";
const XANH = "#22C55E";
const DO = "#EF4444";

export default function TrangLienHe() {
  const [hoTen, setHoTen] = useState("");
  const [lienLac, setLienLac] = useState("");
  const [noiDung, setNoiDung] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [ketQua, setKetQua] = useState(null); // { ok: true|false, thongBao }

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
        body: JSON.stringify({ hoTen: hoTen.trim(), lienLac: lienLac.trim(), noiDung: noiDung.trim() }),
      });
      const d = await res.json();
      if (res.ok) {
        setKetQua({ ok: true, thongBao: "Đã gửi thành công! Cảm ơn bạn, chúng tôi sẽ phản hồi sớm nhất có thể." });
        setHoTen("");
        setLienLac("");
        setNoiDung("");
      } else {
        setKetQua({ ok: false, thongBao: d.loi || "Có lỗi xảy ra, thử lại sau." });
      }
    } catch (e) {
      setKetQua({ ok: false, thongBao: "Lỗi kết nối: " + String(e?.message || e) });
    } finally {
      setDangGui(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <div className="flex items-center gap-2 mb-1">
        <Mail size={20} color={PRIMARY} strokeWidth={2} aria-hidden="true" />
        <h1 className="text-2xl" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
          Liên hệ
        </h1>
      </div>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        Góp ý, báo lỗi, hay có câu hỏi về hệ thống? Điền form bên dưới, chúng tôi sẽ phản hồi sớm nhất.
      </p>

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
    </div>
  );
}
