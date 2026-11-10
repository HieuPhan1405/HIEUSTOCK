import GiaiNghia from "@/components/GiaiNghia";
import { MAU_TANG, moTaTang } from "@/lib/tangLenh";

// TANG LENH A / A+ / A++ (chi de THAM KHAO - xem lib/tangLenh.js). Du lieu: row.tang_lenh (gan o may chu, chi thanh vien). Khong co tang -> null.
// kieu "chip": o bang / the; kieu "day": co chu "Tang lenh" co giai nghia (trang chi tiet ma, o co hoi).
export default function TangLenh({ row, kieu = "chip", className = "", style = null }) {
  const x = row?.tang_lenh;
  if (!x?.tang) return null;
  const mau = MAU_TANG[x.tang];
  const cho = x.trangThai === "cho";
  const chip = (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-bold whitespace-nowrap"
      style={{ color: mau, border: `1px solid ${mau}`, background: "color-mix(in srgb, " + mau + " 12%, transparent)", fontFamily: "var(--font-chu)" }}
    >
      {x.tang}
    </span>
  );
  const ghiChu = cho ? "chờ phiên sau xác nhận" : "phiên sau đã xác nhận";
  if (kieu === "day") {
    return (
      <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold ${className}`} style={style} title={moTaTang(x)} data-may="tang-lenh">
        {/* nowrap: o hep (o Co hoi 2 cot) truoc day nhan bi be thanh 2 dong "Tang / lenh". */}
        <span className="whitespace-nowrap">
          <GiaiNghia khoa="tang-lenh">Tầng lệnh</GiaiNghia>
        </span>
        {chip}
        <span className="whitespace-nowrap" style={{ color: "var(--mo)" }}>{ghiChu}</span>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} style={style} title={moTaTang(x)} data-may="tang-lenh">
      {chip}
      {cho && <span className="text-[10px]" style={{ color: "var(--mo)" }}>chờ</span>}
    </span>
  );
}
