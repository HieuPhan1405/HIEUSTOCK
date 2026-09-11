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
    <div style={{ background: "#0F0D0A", borderBottom: "1px solid #2A2620" }}>
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
                borderColor: active ? "#E8873A" : "transparent",
                color: active ? "#EDE7DD" : "#6F6C64",
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
