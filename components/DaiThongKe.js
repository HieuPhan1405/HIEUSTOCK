// DAI THONG KE gon (kieu TradingView / Simplize): cac o so lieu dung sat nhau, cach nhau 1px tren nen vien = duong ke luoi; thay cho hang the to rieng le.
// Dung chung cho cac trang Bat day (Lenh dang mo / Lenh da dong / Danh sach theo doi co ban sao rieng).
export function OThongKe({ so, nhan, phu, mau, may }) {
  return (
    <div className="px-4 py-3 min-w-0" style={{ background: "var(--card)" }}>
      <p className="text-xs" style={{ color: "var(--mo)" }} data-may={may}>
        {nhan}
      </p>
      <p className="text-xl leading-tight" style={{ fontFamily: "var(--font-chu)", fontWeight: 700, color: mau }}>
        {so}
      </p>
      {phu && (
        <p className="text-xs" style={{ color: "var(--mo)" }}>
          {phu}
        </p>
      )}
    </div>
  );
}

// cot: so cot tren may tinh (2 cot tren dien thoai)
export default function DaiThongKe({ cot = 4, className = "mb-5", children }) {
  const lop = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[cot] ?? "sm:grid-cols-4";
  return (
    <div className={`rounded-2xl border grid grid-cols-2 ${lop} gap-px overflow-hidden ${className}`} style={{ borderColor: "var(--vien)", background: "var(--vien-nhe)" }}>
      {children}
    </div>
  );
}
