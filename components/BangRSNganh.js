"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { pctVN, soVN } from "@/lib/soVN";

// Bang XEP HANG SUC MANH NGANH (RS ngành) tren Dashboard. `hang` da tinh o server bang lib/rsNganh.js (chi gom so lieu tong hop theo nganh va gia/RS/thanh khoan tung ma,
// khong chua tin hieu MUA/BAN). Bam tieu de cot de sap xep; bam 1 nganh de xem XEP HANG CAC MA trong nganh (theo RS 20 hoac 60 phien).
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const mono = { fontFamily: "var(--font-chu)" };
const sans = { fontFamily: "var(--font-chu)" };

const CAC_COT = [
  { khoa: "rs20", nhan: "RS 20 phiên", phu: "so với VN-Index, điểm %", kieu: "rs" },
  { khoa: "rs60", nhan: "RS 60 phiên", phu: "so với VN-Index, điểm %", kieu: "rs" },
  { khoa: "doiTB", nhan: "Giá hôm nay", phu: "TB các mã", kieu: "pct" },
  { khoa: "tyTang", nhan: "Mã tăng", phu: "% số mã", kieu: "ty" },
  { khoa: "trenKijun", nhan: "Trên Kijun", phu: "% số mã", kieu: "ty" },
  { khoa: "trenCanBang", nhan: "Trên cân bằng dài hạn", phu: "% số mã", kieu: "ty" },
  { khoa: "trenMa50", nhan: "Trên MA50", phu: "% số mã", kieu: "ty" },
  { khoa: "gtgd", nhan: "GTGD TB20", phu: "tổng, tỷ đồng/phiên", kieu: "so" },
];
const SO_COT = CAC_COT.length + 2;

const mauRS = (v) => (v == null ? MUTED : v > 0.5 ? XANH : v < -0.5 ? DO : "var(--chu)");
const mauTy = (v) => (v == null ? MUTED : v >= 60 ? XANH : v < 30 ? DO : "var(--chu)");
const chuRS = (v) => (v == null ? "—" : `${v > 0 ? "+" : ""}${soVN(v, 1, true)}`);

function Cell({ cot, h }) {
  const v = h[cot.khoa];
  if (cot.kieu === "rs") {
    const bar = v == null ? 0 : Math.min(100, (Math.abs(v) / 10) * 100);
    return (
      <div className="flex items-center gap-2 justify-end">
        <span className="hidden sm:inline-block h-1.5 rounded-full" style={{ width: 44, background: "var(--vien-nhe)" }}>
          <span className="block h-full rounded-full" style={{ width: `${bar}%`, background: v >= 0 ? XANH : DO, marginLeft: v >= 0 ? 0 : "auto" }} />
        </span>
        <span style={{ color: mauRS(v), ...mono, fontWeight: 600 }}>{chuRS(v)}</span>
      </div>
    );
  }
  if (cot.kieu === "pct") return <span style={{ color: mauRS(v), ...mono }}>{pctVN(v, 2)}</span>;
  if (cot.kieu === "ty") return <span style={{ color: mauTy(v), ...mono }}>{v == null ? "—" : `${soVN(v, 0)}%`}</span>;
  return <span style={mono}>{soVN(v, 0)}</span>;
}

// Xep hang cac ma trong 1 nganh theo RS 20 hoac 60 phien (mac dinh 20).
function XepHangMa({ cacMa }) {
  const [theo, setTheo] = useState("rs20");
  const ds = useMemo(() => [...cacMa].sort((a, b) => (b[theo] ?? -1e9) - (a[theo] ?? -1e9)), [cacMa, theo]);
  const nut = (khoa, nhan) => (
    <button
      type="button"
      onClick={() => setTheo(khoa)}
      className="px-2.5 py-1 rounded-full text-[11px] border"
      style={{ borderColor: VIEN, color: theo === khoa ? "var(--chu)" : MUTED, background: theo === khoa ? "var(--vien-nhe)" : "transparent", ...sans }}
    >
      {nhan}
    </button>
  );
  return (
    <div className="py-3 pl-2 sticky left-0" style={{ maxWidth: "min(100%, calc(100vw - 4.5rem))" }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px]" style={{ color: MUTED }}>
          Xếp hạng {ds.length} mã trong ngành theo
        </span>
        {nut("rs20", "RS 20 phiên")}
        {nut("rs60", "RS 60 phiên")}
      </div>
      <div className="grid gap-x-6 gap-y-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {ds.map((m, i) => (
          <Link key={m.ma} href={`/ma/${m.ma}`} className="flex items-center gap-2 text-xs rounded px-1.5 py-1 hover:opacity-80" style={{ background: i < 3 ? "var(--vien-nhe)" : "transparent" }}>
            <span className="w-5 text-right" style={{ color: MUTED, ...mono }}>
              {i + 1}
            </span>
            <span className="w-11 font-semibold" style={mono}>
              {m.ma}
            </span>
            <span className="w-14 text-right" style={{ color: mauRS(m.doi), ...mono }}>
              {pctVN(m.doi, 2)}
            </span>
            <span className="w-14 text-right" style={{ color: mauRS(m.rs20), ...mono, fontWeight: theo === "rs20" ? 700 : 400 }}>
              {chuRS(m.rs20)}
            </span>
            <span className="w-14 text-right" style={{ color: mauRS(m.rs60), ...mono, fontWeight: theo === "rs60" ? 700 : 400 }}>
              {chuRS(m.rs60)}
            </span>
          </Link>
        ))}
      </div>
      <p className="text-[11px] mt-2" style={{ color: MUTED }}>
        Mỗi dòng: hạng · mã · giá hôm nay · RS 20 phiên · RS 60 phiên (so với VN-Index, điểm %).
      </p>
    </div>
  );
}

export default function BangRSNganh({ hang }) {
  const [sapXep, setSapXep] = useState({ khoa: "rs20", chieu: -1 });
  const [mo, setMo] = useState(null);
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
        <p className="text-xs" style={{ color: MUTED, ...sans }} data-may="rs-nganh">
          Xếp hạng sức mạnh ngành (RS)
        </p>
        <p className="text-[11px]" style={{ color: MUTED }}>
          {hang.length} ngành · bấm tiêu đề cột để sắp xếp · bấm tên ngành để xem xếp hạng các mã
        </p>
      </div>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full text-sm" style={{ minWidth: 860, borderCollapse: "collapse" }}>
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
                  <span className="block text-[11px] opacity-70">{c.phu}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ds.map((h, i) => {
              const dangMo = mo === h.khoa;
              const dan = h.cacMa.filter((m) => m.rs20 != null).slice(0, 3);
              return (
                <Fragment key={h.khoa}>
                  <tr style={{ borderTop: `1px solid ${VIEN}`, cursor: "pointer" }} onClick={() => setMo(dangMo ? null : h.khoa)} aria-expanded={dangMo}>
                    <td className="py-2 pr-3 font-medium sticky left-0" style={{ ...sans, background: NEN_CARD }}>
                      <span className="inline-block w-5 text-xs" style={{ color: MUTED, ...mono }}>
                        {sapXep.khoa === "rs20" && sapXep.chieu < 0 ? i + 1 : h.hang}
                      </span>
                      {h.nhan}
                      <span className="ml-1 text-[11px]" style={{ color: MUTED }}>
                        {dangMo ? "▲" : "▼"}
                      </span>
                      {dan.length > 0 && (
                        <span className="block text-[11px] font-normal pl-5" style={{ color: MUTED, ...mono }}>
                          Mạnh nhất: {dan.map((m) => m.ma).join(", ")}
                        </span>
                      )}
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
                  {dangMo && (
                    <tr>
                      <td colSpan={SO_COT} style={{ background: "var(--card)" }}>
                        <XepHangMa cacMa={h.cacMa} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] leading-snug mt-3" style={{ color: MUTED }}>
        RS 20/60 phiên = chênh lệch lợi suất 20/60 phiên so với VN-Index của mã ở giữa ngành (trung vị, điểm %). Các cột &quot;Trên …&quot; là tỷ lệ mã trong ngành có giá nằm trên đường tương ứng. Chỉ tính trên các mã hệ thống
        đang theo dõi. Thông tin tham khảo, không phải khuyến nghị đầu tư.
      </p>
    </div>
  );
}
