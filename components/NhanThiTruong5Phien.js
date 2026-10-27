import { layLichSuGia } from "@/lib/lichSuGia";
import { tinhD5, nhanThiTruong5Phien } from "@/lib/nhanTinHieu";

const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const VANG = "var(--vang)";

// NHAN TONG "Thi truong 5 phien gan day": VN-Index 5 phien den hien tai (nen hom nay dang chay duoc ghep trong layLichSuGia) -> ung ho / chua ung ho tin hieu MUA.
// Chi de THAM KHAO, khong an/khong doi tin hieu (xem lib/nhanTinHieu.js). Loi nguon gia -> khong hien gi, khong lam hong trang. Dat trong <Suspense fallback={null}> o noi goi.
export default async function NhanThiTruong5Phien({ className = "" }) {
  let d5 = null;
  try {
    d5 = tinhD5(await layLichSuGia("VNINDEX", 50));
  } catch {
    d5 = null;
  }
  const n = nhanThiTruong5Phien(d5);
  if (!n) return null;
  const mau = n.ungHo ? XANH : VANG;
  const chuoi = `${n.d5 >= 0 ? "+" : ""}${n.d5.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] ${className}`} style={{ color: MUTED, fontFamily: "var(--font-chu)" }} title={n.moTa} data-may="nhan-thi-truong-5-phien">
      <span aria-hidden="true" className="inline-block rounded-full" style={{ width: 8, height: 8, background: mau }} />
      <b style={{ color: mau }}>{n.nhan}</b>
      <span>
        · VN-Index 5 phiên <b style={{ color: mau }}>{chuoi}</b>
      </span>
      <span className="text-[11px]">· chỉ để tham khảo, bạn tự chọn lệnh</span>
    </p>
  );
}
