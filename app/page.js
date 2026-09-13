import Link from "next/link";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import { pct } from "@/components/dungChung";

export const dynamic = "force-dynamic";

// Phan loai xu huong tung ma theo TrendScore (da tinh san trong AFL) - dung
// de dung "do rong thi truong" giong kieu Xanh/Sideway/Do o trang tham khao.
function phanLoaiXuHuong(row) {
  if (row.trend === null || row.trend === undefined) return "sideway";
  if (row.trend > 0.5) return "xanh";
  if (row.trend < -0.5) return "do";
  return "sideway";
}

// Do rong rieng cho 1 nhom von hoa (VN30/Midcap/Smallcap) - dung field
// von_hoa da co san trong tin_hieu (gan tu AFL: InVN30/InVNMidCap/InVNSmallCap).
function tinhDoRongNhom(tatCa, nhom) {
  const ds = tatCa.filter((r) => r.von_hoa === nhom);
  const tong = ds.length;
  const xanh = ds.filter((r) => phanLoaiXuHuong(r) === "xanh").length;
  return { tong, xanh, pctXanh: tong ? (xanh / tong) * 100 : 0 };
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

  // tatCa da ORDER BY diem DESC tu lib/tinHieu.js. Tach rieng tin hieu MUA
  // (diem cao nhat truoc) va tin hieu BAN (diem thap nhat/am nhieu nhat
  // truoc, vi day la ben "dang chu y" cua phe ban) thanh 2 cot rieng.
  const tinHieuMua = tatCa.filter((r) => r.tin === "MUA").slice(0, 10);
  const tinHieuBan = tatCa
    .filter((r) => r.tin === "BAN")
    .sort((a, b) => (a.diem ?? 0) - (b.diem ?? 0))
    .slice(0, 10);

  const doRongVonHoa = [
    ["VN30", tinhDoRongNhom(tatCa, "VN30")],
    ["Midcap", tinhDoRongNhom(tatCa, "Midcap")],
    ["Smallcap", tinhDoRongNhom(tatCa, "Smallcap")],
  ];

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

        {/* DO RONG THEO VON HOA - dong tien tap trung o nhom nao */}
        <h2 className="text-lg mb-4" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600 }}>
          Độ rộng theo vốn hoá
        </h2>
        <div className="mb-10">
          {doRongVonHoa.map(([nhan, { tong, xanh, pctXanh }]) => (
            <div key={nhan} className="mb-3">
              <div className="flex justify-between text-xs mb-1" style={{ color: "#A8A296" }}>
                <span>{nhan}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {tong === 0 ? "chưa có dữ liệu" : `${xanh}/${tong} mã xanh (${pctXanh.toFixed(1)}%)`}
                </span>
              </div>
              <div className="h-1.5" style={{ background: "#211F1A" }}>
                <div className="h-full" style={{ width: `${pctXanh}%`, background: "#5FCF8A" }} />
              </div>
            </div>
          ))}
          <p className="text-[11px] mt-2" style={{ color: "#6F6C64" }}>
            % mã có xu hướng tăng (Trend &gt; 0.5) trong từng nhóm — bluechip dẫn dắt thường thấy VN30 dẫn trước Midcap/Smallcap.
          </p>
        </div>

        {/* TOP CO HOI - CHIA 2 COT MUA / BAN */}
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600 }}>
            Top cơ hội đáng chú ý
          </h2>
          <Link href="/lenh-mo" className="text-xs" style={{ color: "#E8873A", fontFamily: "'JetBrains Mono', monospace" }}>
            xem lệnh đang mở →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-8">
          <CotTinHieu tieuDe="Tín hiệu MUA" mau="#5FCF8A" danhSach={tinHieuMua} />
          <CotTinHieu tieuDe="Tín hiệu BÁN" mau="#E86A6A" danhSach={tinHieuBan} />
        </div>
      </div>
    </div>
  );
}

function CotTinHieu({ tieuDe, mau, danhSach }) {
  return (
    <div>
      <p
        className="text-xs uppercase tracking-wide mb-2 pb-2 border-b"
        style={{ color: mau, borderColor: "#2A2620", fontFamily: "'JetBrains Mono', monospace" }}
      >
        {tieuDe} ({danhSach.length})
      </p>
      {danhSach.length === 0 && (
        <p className="py-6 text-sm" style={{ color: "#6F6C64" }}>
          Chưa có mã nào.
        </p>
      )}
      {danhSach.map((row) => (
        <Link
          key={row.ma}
          href={`/ma/${row.ma}`}
          className="w-full text-left grid grid-cols-[64px_1fr_auto] items-center gap-3 py-3 border-b hover:bg-white/[0.03] transition-colors"
          style={{ borderColor: "#211F1A" }}
        >
          <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: "17px" }}>{row.ma}</span>
          <span className="text-xs" style={{ color: "#6F6C64", fontFamily: "'JetBrains Mono', monospace" }}>
            điểm {row.diem?.toFixed(2) ?? "—"}
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
  );
}
