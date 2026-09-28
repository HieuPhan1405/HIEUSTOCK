"use client";

import { useTrongKhungVaoLenh } from "@/components/KhungGioContext";
import { KHUNG_VAO_LENH, nhanKhungKeTiep } from "@/lib/khungGioVaoLenh";

const hh = (phut) => `${String(Math.floor(phut / 60)).padStart(2, "0")}:${String(phut % 60).padStart(2, "0")}`;
const CHU_KHUNG = KHUNG_VAO_LENH.map((k) => `${hh(k.tu)}–${hh(k.den)}`).join(" / ");

// Nhan trang thai tin hieu. NGOAI khung gio vao lenh (lib/khungGioVaoLenh.js) hien THEO DOI: xanh = tin hieu MUA (chi mua trong khung), do = lenh BAN / cat lo dang cho chot
// (banTheoDoiTu: luc lenh ban duoc ghi ngoai khung - cot ban_theo_doi_tu cua lib/tinHieu.js; lenh ban da chot trong khung thi hien BAN binh thuong).
// minhHoa (chi trang Huong dan): "co-dinh" = hien dung nhan goc bat ke gio; "theo-doi" = luon hien THEO DOI (MUA xanh / BAN do) de minh hoa.
export default function SignalPill({ tin, banTheoDoiTu = null, minhHoa = null }) {
  const map = {
    MUA: { bg: "#123423", text: "#22C55E", label: "MUA" },
    BAN: { bg: "#3A1620", text: "#EF4444", label: "BÁN" },
    "NAM GIU": { bg: "#332413", text: "#FBBF24", label: "NẮM GIỮ" },
    "TRUNG LAP": { bg: "#26262F", text: "#A6A6B3", label: "TRUNG LẬP" },
  };
  const trongKhung = useTrongKhungVaoLenh();
  const theoDoiMua = minhHoa === "theo-doi" ? tin === "MUA" : minhHoa !== "co-dinh" && tin === "MUA" && !trongKhung;
  const theoDoiBan = minhHoa === "theo-doi" ? tin === "BAN" : minhHoa !== "co-dinh" && banTheoDoiTu != null && (tin === "BAN" || tin === "TRUNG LAP");
  const s = theoDoiBan ? map.BAN : map[tin] || map["TRUNG LAP"];
  const khoaMay = theoDoiMua ? "tin-THEO DOI MUA" : theoDoiBan ? "tin-THEO DOI BAN" : `tin-${map[tin] ? tin : "TRUNG LAP"}`;
  const title = theoDoiMua
    ? `Tín hiệu MUA ngoài khung giờ vào lệnh — theo dõi, chỉ mua trong khung ${CHU_KHUNG}`
    : theoDoiBan
      ? `Tín hiệu bán / cắt lỗ ngoài khung giờ — chốt bán ở khung ${banTheoDoiTu ? nhanKhungKeTiep(banTheoDoiTu) : "kế tiếp"} nếu tín hiệu vẫn còn`
      : undefined;
  return (
    <span
      data-may={khoaMay}
      style={{ background: s.bg, color: s.text, fontFamily: "'JetBrains Mono', monospace", border: theoDoiMua || theoDoiBan ? `1px dashed ${s.text}` : undefined }}
      className="px-2 py-0.5 text-xs font-bold tracking-wide rounded-sm whitespace-nowrap"
      title={title}
    >
      {theoDoiMua || theoDoiBan ? "THEO DÕI" : s.label}
    </span>
  );
}
