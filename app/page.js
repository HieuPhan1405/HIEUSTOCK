"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, ArrowLeft, Mail } from "lucide-react";

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Be+Vietnam+Pro:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
`;

// Du lieu mau - chi dung khi CHUA co du lieu that tu API (/api/signals),
// vi du lan dau vao web truoc khi AmiBroker day CSV len.
const watchlistMau = [
  { ma: "MWG", diem: 3.74, tin: "MUA", trend: 2.0, mom: 0.5, dt: 0.2, adx: 35.2, gia: 73100, doi: 1.2 },
  { ma: "PGC", diem: 2.85, tin: "MUA", trend: 1.5, mom: 0.5, dt: 0.9, adx: 28.1, gia: 13250, doi: -0.4 },
  { ma: "SBT", diem: 2.1, tin: "MUA", trend: 1.5, mom: -0.5, dt: 0.9, adx: 21.0, gia: 21400, doi: 0.8 },
  { ma: "PVT", diem: -0.4, tin: "TRUNG LAP", trend: 0.5, mom: -0.5, dt: 0.2, adx: 18.5, gia: 19850, doi: -1.1 },
  { ma: "VCB", diem: -1.65, tin: "BAN", trend: -1.5, mom: -0.5, dt: 0.1, adx: 22.4, gia: 57400, doi: -1.03 },
];

const tradeHistory = [
  { ma: "VCB", ngayMua: "24/03/2026", giaMua: 58071, ngayBan: "02/06/2026", giaBan: 61694, phien: 51, laiLo: 6.24, trangThai: "DA_DONG" },
  { ma: "VCB", ngayMua: "11/02/2026", giaMua: 64573, ngayBan: "03/03/2026", giaBan: 62091, phien: 15, laiLo: -3.84, trangThai: "DA_DONG" },
  { ma: "VCB", ngayMua: "07/01/2026", giaMua: 58269, ngayBan: "23/01/2026", giaBan: 69238, phien: 13, laiLo: 18.82, trangThai: "DA_DONG" },
  { ma: "VCB", ngayMua: "06/10/2025", giaMua: 62935, ngayBan: "17/10/2025", giaBan: 61892, phien: 10, laiLo: -1.66, trangThai: "DA_DONG" },
  { ma: "VCB", ngayMua: "01/07/2025", giaMua: 57154, ngayBan: "20/08/2025", giaBan: 62529, phien: 37, laiLo: 9.40, trangThai: "DA_DONG" },
];

const stat = { tongGiaoDich: 23, dangMo: 0, laiLoTBMo: 0.0, tyLeLai: 69.6, laiLoTBLenh: 4.3, luyKe: 98.94 };

// Du lieu that tu AmiBroker co the thieu (ma moi len san, chua du du lieu
// lich su de tinh chi bao) - cac ham nay phai an toan voi null/undefined/NaN
// thay vi lam sap trang.
function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("vi-VN").format(Math.round(n));
}

function pct(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  const v = Number(Number(n).toFixed(digits));
  return `${v > 0 ? "+" : ""}${v}%`;
}

function so1So(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(1);
}

function SignalPill({ tin }) {
  const map = {
    MUA: { bg: "#1F3D2E", text: "#5FCF8A", label: "MUA" },
    BAN: { bg: "#3D1F1F", text: "#E86A6A", label: "BAN" },
    "NAM GIU": { bg: "#332B14", text: "#E8C873", label: "NẮM GIỮ" },
    "TRUNG LAP": { bg: "#2A2620", text: "#A8A296", label: "TRUNG LẬP" },
  };
  const s = map[tin] || map["TRUNG LAP"];
  return (
    <span
      style={{ background: s.bg, color: s.text, fontFamily: "'JetBrains Mono', monospace" }}
      className="px-2 py-0.5 text-xs font-bold tracking-wide rounded-sm"
    >
      {s.label}
    </span>
  );
}

function Dashboard({ onSelect, watchlist, dangTai, capNhatLanCuoi }) {
  return (
    <div className="min-h-screen" style={{ background: "#14120F", color: "#EDE7DD" }}>
      <style>{FONT_IMPORT}</style>

      {/* HERO */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: "#2A2620" }}>
        <div className="max-w-5xl mx-auto px-6 pt-14 pb-10">
          <p
            className="text-xs tracking-[0.25em] uppercase mb-3"
            style={{ color: "#E8873A", fontFamily: "'JetBrains Mono', monospace" }}
          >
            Confluence signal · Ichimoku 9-17-33 · Giao Găm 65-129
          </p>
          <h1
            className="text-4xl sm:text-5xl leading-[1.05] mb-4"
            style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600 }}
          >
            Tín hiệu Dao Găm,<br />đọc trong 5 giây.
          </h1>
          <p className="max-w-xl" style={{ color: "#A8A296", fontFamily: "'Be Vietnam Pro', sans-serif" }}>
            Điểm hợp lưu Trend · Động lượng · Dòng tiền, kiểm chứng backtest 12
            năm trên VN100. Không phải khuyến nghị đầu tư — chỉ là công cụ đọc
            biểu đồ nhanh hơn.
          </p>
        </div>
        {/* signature blade divider */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "-5%",
            top: 0,
            bottom: 0,
            width: "3px",
            background: "#E8873A",
            transform: "skewX(-12deg)",
            opacity: 0.85,
          }}
        />
      </div>

      {/* WATCHLIST */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600 }}>
            Tín hiệu vừa khớp
          </h2>
          <span className="text-xs" style={{ color: "#6F6C64", fontFamily: "'JetBrains Mono', monospace" }}>
            {dangTai
              ? "đang tải..."
              : capNhatLanCuoi
              ? `cập nhật lúc ${new Date(capNhatLanCuoi).toLocaleString("vi-VN")}`
              : "dữ liệu mẫu (chưa nhận CSV từ AmiBroker)"}
          </span>
        </div>

        <div className="border-t" style={{ borderColor: "#2A2620" }}>
          {watchlist.map((row) => (
            <button
              key={row.ma}
              onClick={() => onSelect(row.ma)}
              className="w-full text-left grid grid-cols-[64px_1fr_auto_auto] sm:grid-cols-[64px_90px_1fr_100px_90px] items-center gap-3 py-3 border-b hover:bg-white/[0.03] transition-colors"
              style={{ borderColor: "#211F1A" }}
            >
              <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: "17px" }}>
                {row.ma}
              </span>
              <SignalPill tin={row.tin} />
              <span
                className="hidden sm:block text-xs"
                style={{ color: "#6F6C64", fontFamily: "'JetBrains Mono', monospace" }}
              >
                T={so1So(row.trend)} M={so1So(row.mom)} ADX={so1So(row.adx)}
              </span>
              <span
                className="text-right sm:text-left"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}
              >
                {fmt(row.gia)}
              </span>
              <span
                className="text-right flex items-center justify-end gap-1"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "13px",
                  color: row.doi >= 0 ? "#5FCF8A" : "#E86A6A",
                }}
              >
                {row.doi >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {pct(row.doi, 2)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* EMAIL CAPTURE */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between" style={{ borderColor: "#2A2620" }}>
          <div>
            <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600 }} className="mb-1">
              Nhận tín hiệu mỗi sáng
            </p>
            <p className="text-sm" style={{ color: "#A8A296" }}>
              5 mã đang khớp điều kiện Dao Găm, gửi qua email trước giờ mở cửa.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              placeholder="email@cuaban.com"
              className="px-3 py-2 text-sm flex-1 sm:w-56 outline-none"
              style={{ background: "#1B1913", border: "1px solid #2A2620", color: "#EDE7DD" }}
            />
            <button
              className="px-4 py-2 text-sm font-medium flex items-center gap-2"
              style={{ background: "#E8873A", color: "#241505", fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 600 }}
            >
              <Mail size={15} /> Đăng ký
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StockDetail({ ma, onBack }) {
  return (
    <div className="min-h-screen" style={{ background: "#14120F", color: "#EDE7DD" }}>
      <style>{FONT_IMPORT}</style>

      <div className="max-w-5xl mx-auto px-6 pt-8 pb-16">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs mb-6"
          style={{ color: "#A8A296", fontFamily: "'JetBrains Mono', monospace" }}
        >
          <ArrowLeft size={13} /> quay lại danh sách
        </button>

        <div className="flex items-baseline gap-3 mb-1">
          <h1 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700 }} className="text-3xl">
            {ma}
          </h1>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#5FCF8A" }} className="text-lg">
            57.400
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#E86A6A" }} className="text-sm">
            -1.03%
          </span>
        </div>
        <p className="text-sm mb-8" style={{ color: "#6F6C64" }}>
          Ngân hàng TMCP Ngoại thương Việt Nam · HOSE
        </p>

        {/* THONG KE HIEU SUAT */}
        <div className="grid grid-cols-2 sm:grid-cols-6 border-y mb-10" style={{ borderColor: "#2A2620" }}>
          {[
            ["Tổng giao dịch", stat.tongGiaoDich, ""],
            ["Đang mở", stat.dangMo, ""],
            ["Lãi/lỗ TB lệnh mở", pct(stat.laiLoTBMo), ""],
            ["Tỷ lệ lãi", stat.tyLeLai + "%", "#5FCF8A"],
            ["Lãi/lỗ TB mỗi lệnh", pct(stat.laiLoTBLenh), "#5FCF8A"],
            ["Lợi nhuận lũy kế", pct(stat.luyKe), "#E8873A"],
          ].map(([label, val, color], i) => (
            <div key={label} className="p-4" style={{ borderLeft: i === 0 ? "none" : "1px solid #2A2620" }}>
              <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "#6F6C64" }}>
                {label}
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: color || "#EDE7DD" }} className="text-lg">
                {val}
              </p>
            </div>
          ))}
        </div>

        {/* LICH SU GIAO DICH */}
        <h2 className="text-lg mb-4" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600 }}>
          Lịch sử giao dịch ({tradeHistory.length} lệnh)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "#2A2620", color: "#6F6C64" }}>
                <th className="py-2 pr-4 font-normal">Ngày mua</th>
                <th className="py-2 pr-4 font-normal">Giá mua</th>
                <th className="py-2 pr-4 font-normal">Ngày bán</th>
                <th className="py-2 pr-4 font-normal">Giá bán</th>
                <th className="py-2 pr-4 font-normal">Phiên</th>
                <th className="py-2 pr-4 font-normal text-right">Lãi/Lỗ</th>
                <th className="py-2 font-normal text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {tradeHistory.map((t, i) => (
                <tr key={i} className="border-b" style={{ borderColor: "#211F1A" }}>
                  <td className="py-2.5 pr-4">{t.ngayMua}</td>
                  <td className="py-2.5 pr-4">{fmt(t.giaMua)}</td>
                  <td className="py-2.5 pr-4">{t.ngayBan}</td>
                  <td className="py-2.5 pr-4">{fmt(t.giaBan)}</td>
                  <td className="py-2.5 pr-4">{t.phien}</td>
                  <td
                    className="py-2.5 pr-4 text-right font-bold"
                    style={{ color: t.laiLo >= 0 ? "#5FCF8A" : "#E86A6A" }}
                  >
                    {pct(t.laiLo)}
                  </td>
                  <td className="py-2.5 text-right">
                    <span
                      className="text-xs px-2 py-0.5"
                      style={{ background: "#211F1A", color: "#A8A296" }}
                    >
                      {t.trangThai === "DA_DONG" ? "Đã đóng" : "Đang mở"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function GalaxyApp() {
  const [selected, setSelected] = useState(null);
  const [watchlist, setWatchlist] = useState(watchlistMau);
  const [dangTai, setDangTai] = useState(true);
  const [capNhatLanCuoi, setCapNhatLanCuoi] = useState(null);

  useEffect(() => {
    let huy = false;
    fetch("/api/signals")
      .then((res) => res.json())
      .then((data) => {
        if (huy) return;
        if (data?.trangThai === "ok" && Array.isArray(data.tinHieu) && data.tinHieu.length > 0) {
          setWatchlist(data.tinHieu);
          setCapNhatLanCuoi(data.capNhatLanCuoi);
        }
        // Neu chua co du lieu that (bang rong), giu nguyen watchlistMau lam vi du.
      })
      .catch(() => {
        // Loi mang/API - giu watchlistMau, khong chan giao dien.
      })
      .finally(() => {
        if (!huy) setDangTai(false);
      });
    return () => {
      huy = true;
    };
  }, []);

  return selected ? (
    <StockDetail ma={selected} onBack={() => setSelected(null)} />
  ) : (
    <Dashboard onSelect={setSelected} watchlist={watchlist} dangTai={dangTai} capNhatLanCuoi={capNhatLanCuoi} />
  );
}
