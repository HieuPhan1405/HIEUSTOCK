"use client";

import Link from "next/link";

// Next 16: prop de thu lai la `retry` (khong phai `reset`).
export default function LoiTrang({ retry }) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-24 text-center" style={{ color: "#F5F5F7" }}>
      <h1 className="text-xl mb-2" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Trang gặp lỗi khi tải
      </h1>
      <p className="text-sm mb-6" style={{ color: "#8B8B99" }}>
        Có thể do kết nối dữ liệu tạm thời gián đoạn. Bạn thử tải lại, nếu vẫn lỗi hãy quay lại sau ít phút.
      </p>
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        <button type="button" onClick={() => retry()} className="px-4 py-2 rounded-lg cursor-pointer" style={{ background: "#6C5CE7", color: "#FFFFFF" }}>
          Thử lại
        </button>
        <Link href="/" className="px-4 py-2 rounded-lg border" style={{ borderColor: "#26262F", color: "#F5F5F7" }}>
          Về tổng quan
        </Link>
      </div>
    </div>
  );
}
