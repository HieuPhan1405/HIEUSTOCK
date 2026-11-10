import Link from "next/link";
import { soVN, pctVN } from "@/lib/soVN";

// DAI CHI SO dau Dashboard (10/11/2026, kieu FireAnt): moi o 1 chi so - ten, gia, thay doi (diem, %), duong gia 30 phien. Bam vao -> bieu do ky thuat cua chi so.
// ds: ket qua lib/chiSoThiTruong.js layDaiChiSo(). Chi so nao thieu (nguon loi) thi khong co o.
function DuongGia({ chuoi, mau }) {
  const gia = chuoi.map((x) => x[1]);
  if (gia.length < 2) return null;
  const min = Math.min(...gia);
  const max = Math.max(...gia);
  const W = 96;
  const H = 32;
  const y = (v) => (max === min ? H / 2 : H - 2 - ((v - min) / (max - min)) * (H - 4));
  const d = gia.map((v, i) => `${i ? "L" : "M"}${((i / (gia.length - 1)) * W).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true" className="shrink-0">
      <path d={`${d} L${W},${H} L0,${H} Z`} fill={mau} opacity="0.12" />
      <path d={d} fill="none" stroke={mau} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function DaiChiSo({ ds }) {
  if (!ds?.length) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" role="list" aria-label="Các chỉ số thị trường">
      {ds.map((c) => {
        const mau = c.doi > 0 ? "var(--xanh)" : c.doi < 0 ? "var(--do)" : "var(--vang)";
        return (
          <Link
            key={c.ma}
            role="listitem"
            href={`/bieu-do?ma=${c.ma}`}
            className="rounded-xl border px-3.5 py-3 flex items-center justify-between gap-2 hover:border-[color:var(--vien-dam)] transition-colors min-w-0"
            style={{ borderColor: "var(--vien)", background: "var(--card)" }}
          >
            <span className="min-w-0">
              <span className="block text-xs" style={{ color: "var(--mo)", fontFamily: "var(--font-chu)" }}>
                {c.ten}
              </span>
              <span className="block text-lg leading-tight" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
                {soVN(c.gia, 2, true)}
              </span>
              <span className="block text-xs whitespace-nowrap" style={{ color: mau, fontFamily: "var(--font-chu)", fontWeight: 600 }}>
                {c.doiDiem > 0 ? "+" : ""}
                {soVN(c.doiDiem, 2, true)} ({pctVN(c.doi, 2)})
              </span>
            </span>
            <span className="hidden sm:block">
              <DuongGia chuoi={c.chuoi} mau={mau} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
