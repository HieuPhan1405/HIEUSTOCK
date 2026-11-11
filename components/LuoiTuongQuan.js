"use client";

import { TEXT, MUTED, PRIMARY, VANG, sans } from "@/components/DanhGiaChung";

// LUOI (HEATMAP) TUONG QUAN dung chung cho ma tran NGANH va ma tran MA. nhan = ten hang / cot, gt(i, j) = he so tuong quan (-1..1) hoac null.
// Mau: tim dam = di cung chieu manh, vang = nguoc chieu; moi o luon ghi so (x100) nen khong dua vao mau.
const nenO = (v) => (v == null ? "transparent" : v >= 0 ? `color-mix(in srgb, ${PRIMARY} ${Math.round(6 + 74 * v ** 1.2)}%, var(--card))` : `color-mix(in srgb, ${VANG} ${Math.round(Math.min(1, -v) * 70)}%, var(--card))`);

export default function LuoiTuongQuan({ nhan, nhanNgan, gt, rongO = 34, cao = 28, ghiChu }) {
  const ngan = nhanNgan ?? nhan;
  return (
    <div>
      <div className="overflow-auto rounded-xl border p-2" style={{ borderColor: "var(--vien)", maxHeight: "75vh" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 2, ...sans }} aria-label="Ma trận tương quan">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-[3]" style={{ background: "var(--card)", minWidth: 120 }} />
              {ngan.map((c, j) => (
                <th key={j} className="sticky top-0 z-[2] font-normal text-[11px] align-bottom pb-1" style={{ background: "var(--card)", color: MUTED, width: rongO, minWidth: rongO, height: 96 }}>
                  <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", display: "inline-block", whiteSpace: "nowrap" }}>{c}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nhan.map((hang, i) => (
              <tr key={i}>
                <th scope="row" className="sticky left-0 z-[1] text-right pr-2 text-[11px] font-normal whitespace-nowrap" style={{ background: "var(--card)", color: TEXT, minWidth: 120 }}>
                  {hang}
                </th>
                {nhan.map((_, j) => {
                  const v = gt(i, j);
                  return (
                    <td key={j} title={`${hang} – ${nhan[j]}: ${v == null ? "thiếu dữ liệu" : v.toFixed(2).replace(".", ",")}`} className="text-center text-[11px] tabular-nums rounded-[3px]" style={{ width: rongO, minWidth: rongO, height: cao, background: nenO(v), color: v != null && v > 0.55 ? "#fff" : TEXT, fontWeight: i === j ? 700 : 400, opacity: i === j ? 0.55 : 1 }}>
                      {v == null ? "·" : i === j ? "" : Math.round(v * 100)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px]" style={{ color: MUTED }}>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-12 h-2.5 rounded" style={{ background: `linear-gradient(90deg, ${VANG}, var(--card), ${PRIMARY})` }} aria-hidden="true" />
          ngược chiều (−100) → không liên quan (0) → cùng chiều (100)
        </span>
        {ghiChu}
      </div>
    </div>
  );
}
