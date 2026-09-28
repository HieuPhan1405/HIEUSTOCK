"use client";

import { useTrongKhungVaoLenh } from "@/components/KhungGioContext";
import { KHUNG_VAO_LENH, nhanKhungKeTiep } from "@/lib/khungGioVaoLenh";

const hh = (phut) => `${String(Math.floor(phut / 60)).padStart(2, "0")}:${String(phut % 60).padStart(2, "0")}`;
const CHU_KHUNG = KHUNG_VAO_LENH.map((k) => `${hh(k.tu)}–${hh(k.den)}`).join(" / ");

// Nhan THEO DOI nho (dung trong o "Top co hoi" va cac bang lenh): loai "mua" -> chi hien NGOAI khung gio vao lenh (xanh); loai "ban" -> lenh ban / cat lo dang cho chot (do),
// tu = luc lenh ban duoc ghi (tinh khung chot ke tiep). Xem lib/khungGioVaoLenh.js.
export default function NhanTheoDoi({ loai, tu = null }) {
  const trongKhung = useTrongKhungVaoLenh();
  if (loai === "mua" && trongKhung) return null;
  const mua = loai === "mua";
  const mau = mua ? "#22C55E" : "#EF4444";
  const khung = !mua && tu ? nhanKhungKeTiep(tu) : "";
  return (
    <span
      data-may={mua ? "tin-THEO DOI MUA" : "tin-THEO DOI BAN"}
      className="inline-block mt-0.5 px-1.5 py-px rounded-sm text-[10px] font-bold whitespace-nowrap"
      style={{ color: mau, border: `1px dashed ${mau}`, background: mua ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", fontFamily: "'JetBrains Mono', monospace" }}
      title={
        mua
          ? `Ngoài khung giờ vào lệnh — theo dõi, chỉ mua trong khung ${CHU_KHUNG}`
          : `Tín hiệu bán / cắt lỗ ngoài khung giờ — chốt bán ở khung ${khung || "kế tiếp"} nếu tín hiệu vẫn còn`
      }
    >
      THEO DÕI{khung ? ` · chờ ${khung}` : ""}
    </span>
  );
}
