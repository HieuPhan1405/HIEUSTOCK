"use client";

import { useMemo, useState } from "react";
import { soVN } from "@/lib/soVN";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";

// ĐỘ RỘNG NGÀNH: bao nhiêu % mã trong từng ngành đang khỏe. Ba thước đo (cùng 1 hàng, đổi bằng nút): tăng giá trong phiên, trên đường cân bằng (Kijun), trên MA50.
// hang: kết quả tinhRSNganh(tatCa) (lib/rsNganh.js) - mỗi hàng có nhan, soMa, tyTang, trenKijun, trenMa50. Ngành ít hơn 3 mã đã bị loại sẵn.
const THUOC_DO = [
  { khoa: "trenMa50", nhan: "Trên MA50", ngan: "MA50", mota: "% mã trong ngành có giá trên đường trung bình 50 phiên" },
  { khoa: "trenKijun", nhan: "Trên đường cân bằng", ngan: "Cân bằng", mota: "% mã trong ngành có giá trên Kijun (đường cân bằng 26 phiên)" },
  { khoa: "tyTang", nhan: "Tăng hôm nay", ngan: "Tăng", mota: "% mã trong ngành tăng giá trong phiên" },
];

const mauThanh = (v) => (v >= 60 ? "var(--xanh)" : v >= 40 ? "var(--vang)" : "var(--do)");
const pc = (v) => (v == null ? "—" : `${soVN(v, 0)}%`);

export default function DoRongNganh({ hang, tieuDe = "Độ rộng ngành", haiCot = false }) {
  const [khoa, setKhoa] = useState("trenMa50");
  const thuoc = THUOC_DO.find((t) => t.khoa === khoa) ?? THUOC_DO[0];
  const ds = useMemo(() => [...hang].filter((h) => h[khoa] != null).sort((a, b) => b[khoa] - a[khoa]), [hang, khoa]);
  if (!hang.length) return null;

  const tot = ds.slice(0, 3).filter((h) => h[khoa] >= 60);
  const yeu = ds.slice(-3).reverse().filter((h) => h[khoa] < 40);
  const ten = (arr) => arr.map((h) => h.nhan).join(", ");
  // kết luận lên đầu: ngành khỏe nhất / yếu nhất theo thước đo đang chọn
  const ketLuan =
    tot.length || yeu.length
      ? [tot.length ? `Khỏe nhất: ${ten(tot)}` : null, yeu.length ? `Yếu nhất: ${ten(yeu)}` : null].filter(Boolean).join(" · ")
      : "Chưa ngành nào nổi bật: độ rộng các ngành xấp xỉ nhau.";

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-xs mb-1" style={{ color: MUTED, fontFamily: "var(--font-chu)" }}>
        {tieuDe}
      </p>
      <p className="text-[15px] mb-3" style={{ fontFamily: "var(--font-chu)", fontWeight: 600 }}>
        {ketLuan}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3" role="group" aria-label="Thước đo độ rộng">
        {THUOC_DO.map((t) => (
          <button key={t.khoa} type="button" onClick={() => setKhoa(t.khoa)} aria-pressed={t.khoa === khoa} title={t.mota} className="cs-radar-chip" style={{ "--c": "var(--tim-nhat)", padding: "3px 10px" }}>
            {t.nhan}
          </button>
        ))}
      </div>
      <ul className={haiCot ? "md:columns-2 md:gap-8" : ""}>
        {ds.map((h) => (
          <li key={h.khoa} className="py-1.5 break-inside-avoid">
            <div className="flex items-baseline justify-between gap-2 text-[13px]">
              <span className="truncate" style={{ color: "var(--chu-2)" }}>
                {h.nhan} <span style={{ color: MUTED }}>({h.soMa})</span>
              </span>
              <b style={{ fontFamily: "var(--font-chu)", color: mauThanh(h[khoa]) }}>{pc(h[khoa])}</b>
            </div>
            <div className="h-2 rounded-full overflow-hidden mt-1" style={{ background: "var(--vien-nhe)" }} role="img" aria-label={`${h.nhan}: ${pc(h[khoa])} mã ${thuoc.ngan}`}>
              <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, h[khoa]))}%`, background: mauThanh(h[khoa]) }} />
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
              {THUOC_DO.filter((t) => t.khoa !== khoa)
                .map((t) => `${t.ngan} ${pc(h[t.khoa])}`)
                .join(" · ")}
            </p>
          </li>
        ))}
      </ul>
      <p className="text-[11px] mt-3" style={{ color: MUTED }}>
        {thuoc.mota}. Xanh từ 60% trở lên, vàng 40–60%, đỏ dưới 40%. Số trong ngoặc là số mã của ngành.
      </p>
    </div>
  );
}
