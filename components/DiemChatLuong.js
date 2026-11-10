import GiaiNghia from "@/components/GiaiNghia";
import { diemChatLuongCho } from "@/lib/diemChatLuong";

// DIEM CHAT LUONG /100 cua tin hieu MUA moi (chi de THAM KHAO, khong doi tin hieu - xem lib/diemChatLuong.js). Tra ve null neu khong phai tin MUA / thieu so lieu.
// kieu "chip": nho gon (bang, the, hang cho); kieu "day": co chu "Diem chat luong" co giai nghia + thanh 0-100 (trang chi tiet ma).
export default function DiemChatLuong({ row, kieu = "chip", className = "", style = null }) {
  const x = diemChatLuongCho(row);
  if (!x) return null;
  const { diem, bac, moTa } = x;
  const thanh = (rong) => (
    <span aria-hidden="true" className="inline-block rounded-full overflow-hidden align-middle" style={{ width: rong, height: 6, background: "var(--vien)" }}>
      <span className="block h-full rounded-full" style={{ width: `${diem}%`, background: bac.mau }} />
    </span>
  );
  if (kieu === "day") {
    return (
      <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold ${className}`} style={style} data-may="diem-chat-luong">
        {/* nowrap: o hep (o Co hoi 2 cot) truoc day nhan bi be thanh 3 dong "Diem / chat / luong". */}
        <span className="whitespace-nowrap">
          <GiaiNghia khoa="diem-chat-luong">Điểm chất lượng</GiaiNghia>
        </span>
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          {thanh(64)}
          <b style={{ color: bac.mau, fontFamily: "var(--font-chu)" }}>{diem}/100</b>
          <span style={{ color: bac.mau }}>{bac.nhan}</span>
        </span>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap ${className}`} style={style} title={moTa} data-may="diem-chat-luong">
      {thanh(34)}
      <span style={{ color: bac.mau, fontFamily: "var(--font-chu)" }}>{diem}</span>
    </span>
  );
}
