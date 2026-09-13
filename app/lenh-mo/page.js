import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import SignalPill from "@/components/SignalPill";
import TraCuuMa from "@/components/TraCuuMa";
import { fmt, pct } from "@/components/dungChung";

export const dynamic = "force-dynamic";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const DO = "#EF4444";
const XANH = "#22C55E";

function formatNgay(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("vi-VN");
}

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
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Sổ lệnh đang mở
      </h1>
      <p className="text-sm mb-1" style={{ color: MUTED }}>
        {loi ? "—" : `${dangMo.length} mã đang MUA hoặc NẮM GIỮ / tổng ${tatCa.length} mã theo dõi.`}
      </p>
      {soCanhBao > 0 && (
        <p className="text-sm mb-6 flex items-center gap-1.5" style={{ color: DO }}>
          <TriangleAlert size={14} strokeWidth={2} aria-hidden="true" />
          {soCanhBao} mã đang cảnh báo Mắt Thần — nên xem lại ngay.
        </p>
      )}
      {soCanhBao === 0 && <div className="mb-6" />}

      <div className="mb-8 max-w-md rounded-2xl border p-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: MUTED }}>
          Tra cứu mã khác
        </p>
        <TraCuuMa />
      </div>

      {loi && (
        <p className="text-sm mb-6" style={{ color: DO }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        {!loi && dangMo.length === 0 ? (
          <p className="py-6 px-4 text-sm" style={{ color: MUTED }}>
            Chưa có mã nào đang MUA/NẮM GIỮ trong lần quét gần nhất.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <thead>
                <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                  <th className="py-3 pl-4 pr-3 font-normal">Mã CP</th>
                  <th className="py-3 px-3 font-normal text-right">Giá hiện tại</th>
                  <th className="py-3 px-3 font-normal text-right">%Hôm nay</th>
                  <th className="py-3 px-3 font-normal">Ngày mua</th>
                  <th className="py-3 px-3 font-normal text-right">Giá mua</th>
                  <th className="py-3 px-3 font-normal">Ngày bán</th>
                  <th className="py-3 px-3 font-normal text-right">Giá bán</th>
                  <th className="py-3 px-3 font-normal text-right">Số phiên</th>
                  <th className="py-3 px-3 font-normal text-right">Lãi/Lỗ</th>
                  <th className="py-3 pr-4 pl-3 font-normal text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {dangMo.map((row, i) => (
                  <tr
                    key={row.ma}
                    className={i > 0 ? "border-t" : ""}
                    style={{ borderColor: row.mat_than ? "#4A2230" : "#1D1D26", background: row.mat_than ? "#241419" : "transparent" }}
                  >
                    <td className="py-3 pl-4 pr-3">
                      <Link href={`/ma/${row.ma}`} className="flex items-center gap-1 hover:underline" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                        {row.mat_than && <TriangleAlert size={13} color={DO} strokeWidth={2} aria-hidden="true" className="shrink-0" />}
                        {row.ma}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-right">{fmt(row.gia)}</td>
                    <td className="py-3 px-3 text-right" style={{ color: row.doi >= 0 ? XANH : DO }}>
                      {pct(row.doi, 2)}
                    </td>
                    <td className="py-3 px-3" style={{ color: MUTED }}>
                      {formatNgay(row.ngay_mua)}
                    </td>
                    <td className="py-3 px-3 text-right">{fmt(row.gia_mua)}</td>
                    <td className="py-3 px-3" style={{ color: MUTED }}>
                      —
                    </td>
                    <td className="py-3 px-3 text-right" style={{ color: MUTED }}>
                      —
                    </td>
                    <td className="py-3 px-3 text-right">{row.so_phien_giu ?? "—"} phiên</td>
                    <td className="py-3 px-3 text-right font-bold" style={{ color: row.lai_lo_pct >= 0 ? XANH : DO }}>
                      {pct(row.lai_lo_pct, 2)}
                    </td>
                    <td className="py-3 pr-4 pl-3 text-right">
                      <SignalPill tin={row.tin} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-[11px] mt-3" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
        Ngày mua/Giá mua lấy đúng thời điểm phát tín hiệu MUA thật trên AmiBroker (không ước tính). Ngày bán/Giá bán luôn trống vì đây là các lệnh còn đang mở.
      </p>
    </div>
  );
}
