// KHUNG CHO hien NGAY khi chuyen trang (trong luc may chu dang tai du lieu cua trang moi) - de bam menu la thay phan hoi tuc thi, khong cam giac "treo". Ap dung cho moi trang.
export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10" aria-busy="true" aria-label="Đang tải trang">
      <div className="h-7 w-56 rounded-lg mb-3 animate-pulse" style={{ background: "var(--card)" }} />
      <div className="h-4 w-80 max-w-full rounded mb-8 animate-pulse" style={{ background: "var(--card)" }} />
      <div className="grid gap-4 md:grid-cols-2 mb-4">
        <div className="h-40 rounded-2xl border animate-pulse" style={{ borderColor: "var(--vien)", background: "var(--card)" }} />
        <div className="h-40 rounded-2xl border animate-pulse" style={{ borderColor: "var(--vien)", background: "var(--card)" }} />
      </div>
      <div className="h-72 rounded-2xl border animate-pulse" style={{ borderColor: "var(--vien)", background: "var(--card)" }} />
    </div>
  );
}
