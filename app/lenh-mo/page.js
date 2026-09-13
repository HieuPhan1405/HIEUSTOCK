import Link from "next/link";
import { TrendingUp, TrendingDown, TriangleAlert } from "lucide-react";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import SignalPill from "@/components/SignalPill";
import TraCuuMa from "@/components/TraCuuMa";
import { fmt, pct, so1So } from "@/components/dungChung";

export const dynamic = "force-dynamic";

export default async function TrangLenhMo() {
  let tatCa = [];
  let loi = null;
  try {
    tatCa = await layTatCaTinHieu();
  } catch (e) {
    loi = String(e?.message || e);
  }

  // "Dang mo" = ma vua phat tin hieu MUA hoac dang giu vi the (NAM GIU).
  // Uu tien hien CANH BAO MAT THAN len dau (rui ro dao chieu, can chu y truoc).
  const dangMo = tatCa
    .filter((r) => r.tin === "MUA" || r.tin === "NAM GIU")
    .sort((a, b) => (b.mat_than ? 1 : 0) - (a.mat_than ? 1 : 0));
  const soCanhBao = dangMo.filter((r) => r.mat_than).length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10" style={{ color: "#F5F5F7" }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
        Lệnh đang mở
      </h1>
      <p className="text-sm mb-1" style={{ color: "#8B8B99" }}>
        {loi ? "—" : `${dangMo.length} mã đang MUA hoặc NẮM GIỮ / tổng ${tatCa.length} mã theo dõi.`}
      </p>
      {soCanhBao > 0 && (
        <p className="text-sm mb-6 flex items-center gap-1.5" style={{ color: "#EF4444" }}>
          <TriangleAlert size={14} strokeWidth={2} aria-hidden="true" />
          {soCanhBao} mã đang cảnh báo Mắt Thần — nên xem lại ngay.
        </p>
      )}
      {soCanhBao === 0 && <div className="mb-6" />}

      <div className="mb-10 max-w-md rounded-2xl border p-4" style={{ borderColor: "#26262F", background: "#15151F" }}>
        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#8B8B99" }}>
          Tra cứu mã khác
        </p>
        <TraCuuMa />
      </div>

      {loi && (
        <p className="text-sm mb-6" style={{ color: "#EF4444" }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#26262F", background: "#15151F" }}>
        {!loi && dangMo.length === 0 && (
          <p className="py-6 px-4 text-sm" style={{ color: "#8B8B99" }}>
            Chưa có mã nào đang MUA/NẮM GIỮ trong lần quét gần nhất.
          </p>
        )}
        {dangMo.map((row, i) => (
          <Link
            key={row.ma}
            href={`/ma/${row.ma}`}
            className={`w-full text-left grid grid-cols-[64px_1fr_auto_auto] sm:grid-cols-[64px_90px_1fr_100px_90px] items-center gap-3 py-3 px-4 hover:bg-white/[0.04] transition-colors ${i > 0 ? "border-t" : ""}`}
            style={{ borderColor: row.mat_than ? "#4A2230" : "#1D1D26", background: row.mat_than ? "#241419" : "transparent" }}
          >
            <span className="flex items-center gap-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "17px" }}>
              {row.mat_than && <TriangleAlert size={14} color="#EF4444" strokeWidth={2} aria-hidden="true" className="shrink-0" />}
              {row.ma}
            </span>
            <SignalPill tin={row.tin} />
            <span className="hidden sm:block text-xs" style={{ color: "#8B8B99", fontFamily: "'JetBrains Mono', monospace" }}>
              T={so1So(row.trend)} M={so1So(row.mom)} ADX={so1So(row.adx)}
            </span>
            <span className="text-right sm:text-left" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>
              {fmt(row.gia)}
            </span>
            <span
              className="text-right flex items-center justify-end gap-1"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: row.doi >= 0 ? "#22C55E" : "#EF4444" }}
            >
              {row.doi >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {pct(row.doi, 2)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
