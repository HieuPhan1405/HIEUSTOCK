import { nhanViTri120 } from "@/lib/nhanTinHieu";

const BIEU_TUONG = { vung_cao: "★", nua_duoi: "▾" };

// NHAN RIENG TUNG MA "Gia o vung cao / nua duoi bien do 6 thang" (chi gan cho tin hieu MUA, xem lib/nhanTinHieu.js). Chi de THAM KHAO - khong an, khong doi tin hieu. Tra ve null neu khong co nhan.
export default function NhanViTri120({ row, className = "text-[11px] font-bold tracking-wide", style = null }) {
  const n = nhanViTri120(row);
  if (!n) return null;
  return (
    <span className={className} style={{ color: n.mau, ...style }} title={n.moTa} data-may="nhan-vi-tri-120">
      {BIEU_TUONG[n.khoa]} {n.nhan}
    </span>
  );
}
