import Link from "next/link";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import SignalPill from "@/components/SignalPill";
import { fmt, pct } from "@/components/dungChung";

export const dynamic = "force-dynamic";

// Phan loai xu huong tung ma theo TrendScore (da tinh san trong AFL) - dung
// de dung "do rong thi truong" giong kieu Xanh/Sideway/Do o trang tham khao.
function phanLoaiXuHuong(row) {
  if (row.trend === null || row.trend === undefined) return "sideway";
  if (row.trend > 0.5) return "xanh";
  if (row.trend < -0.5) return "do";
  return "sideway";
}

function sinhKetLuan(pctXanh, pctDo, tong) {
  if (tong === 0) return "Chưa có dữ liệu — đang chờ AmiBroker đẩy CSV lên.";
  if (pctXanh - pctDo > 15) return "Nghiêng tích cực — số mã xu hướng tăng đang áp đảo.";
  if (pctDo - pctXanh > 15) return "Nghiêng tiêu cực — số mã xu hướng giảm đang áp đảo.";
  return "Sideway — thị trường chưa có xu hướng rõ ràng.";
}

export default async function TrangTongQuan() {
  let tatCa = [];
  let loi = null;
  try {
    tatCa = await layTatCaTinHieu();
  } catch (e) {
    loi = String(e?.message || e);
  }

  const tong = tatCa.length;
  const soXanh = tatCa.filter((r) => phanLoaiXuHuong(r) === "xanh").length;
  const soDo = tatCa.filter((r) => phanLoaiXuHuong(r) === "do").length;
  const soSideway = tong - soXanh - soDo;
  const pctXanh = tong ? (soXanh / tong) * 100 : 0;
  const pctDo = tong ? (soDo / tong) * 100 : 0;
  const pctSideway = tong ? (soSideway / tong) * 100 : 0;

  // tatCa da ORDER BY diem DESC tu lib/tinHieu.js - lay 10 ma dau la top diem.
  const topCoHoi = tatCa.slice(0, 10);

  return (
    <div style={{ color: "#EDE7DD" }}>
      {/* HERO */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: "#2A2620" }}>
        <div className="max-w-5xl mx-auto px-6 pt-14 pb-10">
          <p
            className="text-xs tracking-[0.25em] uppercase mb-3"
            style={{ color: "#E8873A", fontFamily: "'JetBrains Mono', monospace" }}
          >
            Confluence signal · Ichimoku 9-17-33 · Giao Găm 65-129
          </p>
          <h1
            className="text-4xl sm:text-5xl leading-[1.05] mb-4"
            style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600 }}
          >
            Tổng quan thị trường,<br />đọc trong 5 giây.
          </h1>
          <p className="max-w-xl" style={{ color: "#A8A296", fontFamily: "'Be Vietnam Pro', sans-serif" }}>
            Điểm hợp lưu Trend · Động lượng · Dòng tiền, kiểm chứng backtest 12
            năm trên VN100. Không phải khuyến nghị đầu tư — chỉ là công cụ đọc
            biểu đồ nhanh hơn.
          </p>
        </div>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "-5%",
            top: 0,
            bottom: 0,
            width: "3px",
            background: "#E8873A",
            transform: "skewX(-12deg)",
            opacity: 0.85,
          }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {loi && (
          <p className="text-sm mb-6" style={{ color: "#E86A6A" }}>
            Lỗi tải dữ liệu: {loi}
          </p>
        )}

        {/* KET LUAN THI TRUONG */}
        <div className="border p-6 mb-10" style={{ borderColor: "#2A2620" }}>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#6F6C64" }}>
            Kết luận thị trường
          </p>
          <p className="text-lg" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600 }}>
            {sinhKetLuan(pctXanh, pctDo, tong)}
          </p>
          <p className="text-xs mt-1" style={{ color: "#6F6C64" }}>
            {tong} mã đang theo dõi
          </p>
        </div>

        {/* DO RONG THI TRUONG */}
        <h2 className="text-lg mb-4" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600 }}>
          Độ rộng thị trường
        </h2>
        <div className="mb-10">
          {[
            ["Xanh (xu hướng tăng)", soXanh, pctXanh, "#5FCF8A"],
            ["Sideway", soSideway, pctSideway, "#E8C873"],
            ["Đỏ (xu hướng giảm)", soDo, pctDo, "#E86A6A"],
          ].map(([nhan, soLuong, phanTram, mau]) => (
            <div key={nhan} className="mb-3">
              <div className="flex justify-between text-xs mb-1" style={{ color: "#A8A296" }}>
                <span>{nhan}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {soLuong} mã ({phanTram.toFixed(1)}%)
                </span>
              </div>
              <div className="h-1.5" style={{ background: "#211F1A" }}>
                <div className="h-full" style={{ width: `${phanTram}%`, background: mau }} />
              </div>
            </div>
          ))}
        </div>

        {/* TOP CO HOI */}
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600 }}>
            Top cơ hội đáng chú ý
          </h2>
          <Link href="/lenh-mo" className="text-xs" style={{ color: "#E8873A", fontFamily: "'JetBrains Mono', monospace" }}>
            xem lệnh đang mở →
          </Link>
        </div>

        <div className="border-t" style={{ borderColor: "#2A2620" }}>
          {topCoHoi.length === 0 && (
            <p className="py-6 text-sm" style={{ color: "#6F6C64" }}>
              Chưa có dữ liệu.
            </p>
          )}
          {topCoHoi.map((row) => (
            <Link
              key={row.ma}
              href={`/ma/${row.ma}`}
              className="w-full text-left grid grid-cols-[64px_1fr_auto_auto] sm:grid-cols-[64px_90px_1fr_100px_90px] items-center gap-3 py-3 border-b hover:bg-white/[0.03] transition-colors"
              style={{ borderColor: "#211F1A" }}
            >
              <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: "17px" }}>{row.ma}</span>
              <SignalPill tin={row.tin} />
              <span
                className="hidden sm:block text-xs"
                style={{ color: "#6F6C64", fontFamily: "'JetBrains Mono', monospace" }}
              >
                điểm {row.diem?.toFixed(2) ?? "—"}
              </span>
              <span className="text-right sm:text-left" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>
                {fmt(row.gia)}
              </span>
              <span
                className="text-right"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: row.doi >= 0 ? "#5FCF8A" : "#E86A6A" }}
              >
                {pct(row.doi, 2)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
