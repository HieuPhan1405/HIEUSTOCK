"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function TraCuuMa() {
  const [ma, setMa] = useState("");
  const router = useRouter();

  function guiDi(e) {
    e.preventDefault();
    const sach = ma.trim().toUpperCase();
    if (sach) router.push(`/ma/${sach}`);
  }

  return (
    <form onSubmit={guiDi} className="flex gap-2">
      <input
        value={ma}
        onChange={(e) => setMa(e.target.value)}
        placeholder="Nhập mã cổ phiếu khác (ví dụ: MBB)"
        className="px-3 py-2 text-sm flex-1 outline-none"
        style={{
          background: "#1B1913",
          border: "1px solid #2A2620",
          color: "#EDE7DD",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      />
      <button
        type="submit"
        className="px-4 py-2 text-sm font-medium flex items-center gap-2 shrink-0"
        style={{ background: "#E8873A", color: "#241505", fontWeight: 600 }}
      >
        <Search size={15} /> Tra cứu
      </button>
    </form>
  );
}
