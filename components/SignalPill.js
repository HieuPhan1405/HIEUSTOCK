"use client";

import { useTrongKhungVaoLenh } from "@/components/KhungGioContext";

export default function SignalPill({ tin }) {
  const map = {
    MUA: { bg: "#123423", text: "#22C55E", label: "MUA" },
    BAN: { bg: "#3A1620", text: "#EF4444", label: "BAN" },
    "NAM GIU": { bg: "#332413", text: "#FBBF24", label: "NẮM GIỮ" },
    "TRUNG LAP": { bg: "#26262F", text: "#A6A6B3", label: "TRUNG LẬP" },
  };
  const s = map[tin] || map["TRUNG LAP"];
  const trongKhung = useTrongKhungVaoLenh();
  // Chi lam mo nhan MUA ngoai khung gio vao lenh (xem lib/khungGioVaoLenh.js) - BAN/cat lo van
  // giu nguyen do sang, vi thoat lenh can ro rang ngay bat ke gio nao, khong nen trong "mo".
  const mo = tin === "MUA" && !trongKhung;
  return (
    <span
      style={{ background: s.bg, color: s.text, fontFamily: "'JetBrains Mono', monospace", opacity: mo ? 0.4 : 1 }}
      className="px-2 py-0.5 text-xs font-bold tracking-wide rounded-sm"
      title={mo ? "Ngoài khung giờ vào lệnh (xem Đồng hồ giao dịch) — chỉ để theo dõi" : undefined}
    >
      {s.label}
    </span>
  );
}
