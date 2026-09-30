import Link from "next/link";

export const metadata = { title: "Không tìm thấy trang" };

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-24 text-center" style={{ color: "var(--chu)" }}>
      <p className="text-5xl mb-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#6C5CE7" }}>
        404
      </p>
      <h1 className="text-xl mb-2" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Không tìm thấy trang này
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--mo)" }}>
        Đường dẫn có thể đã đổi hoặc không tồn tại.
      </p>
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        <Link href="/" className="px-4 py-2 rounded-lg" style={{ background: "#6C5CE7", color: "#FFFFFF" }}>
          Về tổng quan
        </Link>
        <Link href="/bo-loc" className="px-4 py-2 rounded-lg border" style={{ borderColor: "var(--vien)", color: "var(--chu)" }}>
          Bộ lọc cổ phiếu
        </Link>
      </div>
    </div>
  );
}
