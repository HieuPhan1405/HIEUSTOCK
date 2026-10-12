"use client";

import { useMemo, useState } from "react";
import { pctVN, soVN } from "@/lib/soVN";

// Bang XEP HANG SUC MANH NGANH (RS ngành) tren Dashboard. `hang` da tinh o server bang lib/rsNganh.js (chi gom so lieu tong hop theo nganh,
// khong chua tin hieu tung ma). Bam tieu de cot de sap xep.
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const mono = { fontFamily: "'JetBrains Mono', monospace" };
const sans = { fontFamily: "'Inter', sans-serif" };

const CAC_COT = [
  { khoa: "rs20", nhan: "RS 20 phiên", phu: "so với VN-Index, điểm %", kieu: "rs" },
  { khoa: "doiTB", nhan: "Giá hôm nay", phu: "TB các mã", kieu: "pct" },
  { khoa: "tyTang", nhan: "Mã tăng", phu: "% số mã", kieu: "ty" },
  { khoa: "trenKijun", nhan: "Trên Kijun", phu: "% số mã", kieu: "ty" },
  { khoa: "trenCanBang", nhan: "Trên cân bằng dài hạn", phu: "% số mã", kieu: "ty" },
  { khoa: "trenMa50", nhan: "Trên MA50", phu: "% số mã", kieu: "ty" },
  { khoa: "gtgd", nhan: "GTGD TB20", phu: "tổng, tỷ đồng/phiên", kieu: "so" },
];

const mauRS = (v) => (v == null ? MUTED : v > 0.5 ? XANH : v < -0.5 ? DO : "var(--chu)");
const mauTy = (v) => (v == null ? MUTED : v >= 60 ? XANH : v < 30 ? DO : "var(--chu)");

function Cell({ cot, h }) {
  const v = h[cot.khoa];
  if (cot.kieu === "rs") {
    const bar = v == null ? 0 : Math.min(100, (Math.abs(v) / 10) * 100);
    return (
      <div className="flex items-center gap-2 justify-end">
        <span className="hidden sm:inline-block h-1.5 rounded-full" style={{ width: 44, background: "var(--vien-nhe)" }}>
          <span className="block h-full rounded-full" style={{ width: `${bar}%`, background: v >= 0 ? XANH : DO, marginLeft: v >= 0 ? 0 : "auto" }} />
        </span>
        <span style={{ color: mauRS(v), ...mono, fontWeight: 600 }}>{v == null ? "—" : `${v > 0 ? "+" : ""}${soVN(v, 1, true)}`}</span>
      </div>
    );
  }
  if (cot.kieu === "pct") return <span style={{ color: mauRS(v), ...mono }}>{pctVN(v, 2)}</span>;
  if (cot.kieu === "ty") return <span style={{ color: mauTy(v), ...mono }}>{v == null ? "—" : `${soVN(v, 0)}%`}</span>;
  return <span style={mono}>{soVN(v, 0)}</span>;
}

export default function BangRSNganh({ hang }) {
  const [sapXep, setSapXep] = useState({ khoa: "rs20", chieu: -1 });
  const ds = useMemo(() => {
    const a = [...hang];
    a.sort((x, y) => {
      const vx = x[sapXep.khoa] ?? -1e12;
      const vy = y[sapXep.khoa] ?? -1e12;
      return (vx - vy) * sapXep.chieu;
    });
    return a;
  }, [hang, sapXep]);

  if (!hang.length) return null;
  const bam = (khoa) => setSapXep((s) => (s.khoa === khoa ? { khoa, chieu: -s.chieu } : { khoa, chieu: -1 }));
  const mui = (khoa) => (sapXep.khoa === khoa ? (sapXep.chieu < 0 ? " ▼" : " ▲") : "");

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-xs uppercase tracking-wide" style={{ color: MUTED, ...sans }}>
          Xếp hạng sức mạnh ngành (RS)
        </p>
        <p className="text-[11px]" style={{ color: MUTED }}>
          {hang.length} ngành · bấm tiêu đề cột để sắp xếp
        </p>
      </div>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full text-sm" style={{ minWidth: 760, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: MUTED }}>
              <th className="text-left font-normal text-[11px] pb-2 pr-3 sticky left-0" style={{ ...sans, background: NEN_CARD }}>
                Ngành
              </th>
              <th className="text-right font-normal text-[11px] pb-2 px-2 cursor-pointer select-none" style={sans} onClick={() => bam("soMa")}>
                Số mã{mui("soMa")}
              </th>
              {CAC_COT.map((c) => (
                <th key={c.khoa} className="text-right font-normal text-[11px] pb-2 px-2 cursor-pointer select-none" style={sans} onClick={() => bam(c.khoa)} title={c.phu}>
                  <span style={{ color: sapXep.khoa === c.khoa ? "var(--chu)" : MUTED }}>
                    {c.nhan}
                    {mui(c.khoa)}
                  </span>
                  <span className="block text-[10px] opacity-70">{c.phu}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ds.map((h, i) => (
              <tr key={h.khoa} style={{ borderTop: `1px solid ${VIEN}` }}>
                <td className="py-2 pr-3 font-medium sticky left-0" style={{ ...sans, background: NEN_CARD }}>
                  <span className="inline-block w-5 text-xs" style={{ color: MUTED, ...mono }}>
                    {sapXep.khoa === "rs20" && sapXep.chieu < 0 ? i + 1 : h.hang}
                  </span>
                  {h.nhan}
                </td>
                <td className="py-2 px-2 text-right" style={mono}>
                  {h.soMa}
                </td>
                {CAC_COT.map((c) => (
                  <td key={c.khoa} className="py-2 px-2 text-right">
                    <Cell cot={c} h={h} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] leading-snug mt-3" style={{ color: MUTED }}>
        RS 20 phiên = chênh lệch lợi suất 20 phiên so với VN-Index của mã ở giữa ngành (trung vị, điểm %). Các cột &quot;Trên …&quot; là tỷ lệ mã trong ngành có giá nằm trên đường tương ứng. Chỉ tính trên các mã hệ thống đang theo dõi.
        Thông tin tham khảo, không phải khuyến nghị đầu tư.
      </p>
    </div>
  );
}
