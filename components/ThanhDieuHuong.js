"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MUC = [
  { href: "/", nhan: "Tổng quan thị trường" },
  { href: "/lenh-mo", nhan: "Lệnh đang mở" },
];

export default function ThanhDieuHuong() {
  const pathname = usePathname();
  return (
    <div style={{ background: "#08080B", borderBottom: "1px solid #26262F" }}>
      <div className="max-w-5xl mx-auto px-6 flex items-center gap-6">
        {MUC.map((m) => {
          const active = pathname === m.href;
          return (
            <Link
              key={m.href}
              href={m.href}
              className="text-xs py-3 border-b-2 transition-colors"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                borderColor: active ? "#6C5CE7" : "transparent",
                color: active ? "#F5F5F7" : "#8B8B99",
              }}
            >
              {m.nhan}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
