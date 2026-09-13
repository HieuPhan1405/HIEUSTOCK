import Link from "next/link";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import { pct } from "@/components/dungChung";

export const dynamic = "force-dynamic";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const NEN_INSET = "#1D1D26";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";
const XANH = "#22C55E";
const VANG = "#FBBF24";
const DO = "#EF4444";

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

// The KPI - card so lieu nhanh, co quang mau mo phia sau de tao diem nhan
// (mo phong hieu ung "glow" cua dashboard fintech hien dai).
function TheKPI({ nhan, giaTri, phu, mau }) {
  return (
    <div className="rounded-2xl border p-5 relative overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div
        aria-hidden="true"
        className="absolute -right-8 -top-8 w-28 h-28 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: mau || PRIMARY }}
      />
      <p className="text-xs uppercase tracking-wide mb-2 relative" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
        {nhan}
      </p>
      <p className="text-3xl relative" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: mau || TEXT }}>
        {giaTri}
      </p>
      {phu && (
        <p className="text-[11px] mt-1 relative" style={{ color: MUTED }}>
          {phu}
        </p>
      )}
    </div>
  );
}

// Bieu do tron (donut) that ve bang SVG - the hien ty le Xanh/Sideway/Do,
// khong can thu vien ngoai.
function BieuDoTronDoRong({ soXanh, soSideway, soDo, tong }) {
  const kichThuoc = 148;
  const tam = kichThuoc / 2;
  const doDayVanh = 20;
  const banKinh = tam - doDayVanh / 2;
  const chuVi = 2 * Math.PI * banKinh;
  const cacPhan = [
    { gia: soXanh, mau: XANH },
    { gia: soSideway, mau: VANG },
    { gia: soDo, mau: DO },
  ];
  let daVe = 0;

  return (
    <svg viewBox={`0 0 ${kichThuoc} ${kichThuoc}`} width={kichThuoc} height={kichThuoc} role="img" aria-label="Biểu đồ tròn độ rộng thị trường">
      <circle cx={tam} cy={tam} r={banKinh} fill="none" stroke={NEN_INSET} strokeWidth={doDayVanh} />
      {tong > 0 &&
        cacPhan.map((p, i) => {
          if (p.gia === 0) return null;
          const doDai = (p.gia / tong) * chuVi;
          const el = (
            <circle
              key={i}
              cx={tam}
              cy={tam}
              r={banKinh}
              fill="none"
              stroke={p.mau}
              strokeWidth={doDayVanh}
              strokeDasharray={`${doDai} ${chuVi - doDai}`}
              strokeDashoffset={-daVe}
              transform={`rotate(-90 ${tam} ${tam})`}
            />
          );
          daVe += doDai;
          return el;
        })}
      <text x={tam} y={tam - 3} textAnchor="middle" fontSize="26" fontWeight="700" fill={TEXT} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {tong ? Math.round((soXanh / tong) * 100) : 0}%
      </text>
      <text x={tam} y={tam + 16} textAnchor="middle" fontSize="10" fill={MUTED} style={{ fontFamily: "'Inter', sans-serif" }}>
        mã xanh
      </text>
    </svg>
  );
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
  const soMua = tatCa.filter((r) => r.tin === "MUA").length;
  const soMatThan = tatCa.filter((r) => r.mat_than).length;

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
    <div style={{ color: TEXT }}>
      {/* HERO */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: VIEN }}>
        <div className="max-w-6xl mx-auto px-6 pt-14 pb-10">
          <p
            className="text-xs tracking-[0.25em] uppercase mb-3"
            style={{ color: PRIMARY, fontFamily: "'JetBrains Mono', monospace" }}
          >
            Confluence signal · Ichimoku 9-17-33 · Giao Găm 65-129
          </p>
          <h1
            className="text-4xl sm:text-5xl leading-[1.05] mb-4"
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
          >
            Tổng quan thị trường,<br />đọc trong 5 giây.
          </h1>
          <p className="max-w-xl" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
            Điểm hợp lưu Trend · Động lượng · Dòng tiền, kiểm chứng backtest 12
            năm trên VN100. Không phải khuyến nghị đầu tư — chỉ là công cụ đọc
            biểu đồ nhanh hơn.
          </p>
        </div>
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: PRIMARY }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {loi && (
          <p className="text-sm mb-6" style={{ color: DO }}>
            Lỗi tải dữ liệu: {loi}
          </p>
        )}

        {/* HANG KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <TheKPI nhan="Mã đang theo dõi" giaTri={tong} mau={TEXT} />
          <TheKPI nhan="Xu hướng tăng" giaTri={`${pctXanh.toFixed(0)}%`} phu={`${soXanh} mã`} mau={XANH} />
          <TheKPI nhan="Tín hiệu MUA" giaTri={soMua} phu="hôm nay" mau={PRIMARY} />
          <TheKPI nhan="Cảnh báo Mắt Thần" giaTri={soMatThan} phu="rủi ro đảo chiều" mau={soMatThan > 0 ? DO : MUTED} />
        </div>

        {/* KET LUAN + BIEU DO TRON  ·  DO RONG THEO VON HOA */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div className="rounded-2xl border p-6 flex items-center gap-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
            <BieuDoTronDoRong soXanh={soXanh} soSideway={soSideway} soDo={soDo} tong={tong} />
            <div>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: MUTED }}>
                Kết luận thị trường
              </p>
              <p className="text-base mb-3" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                {sinhKetLuan(pctXanh, pctDo, tong)}
              </p>
              <div className="flex flex-col gap-1 text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ color: XANH }}>● Xanh {soXanh} mã</span>
                <span style={{ color: VANG }}>● Sideway {soSideway} mã</span>
                <span style={{ color: DO }}>● Đỏ {soDo} mã</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
            <p className="text-xs uppercase tracking-wide mb-4" style={{ color: MUTED }}>
              Độ rộng theo vốn hoá
            </p>
            {doRongVonHoa.map(([nhan, { tong: tongNhom, xanh, pctXanh: pctXanhNhom }]) => (
              <div key={nhan} className="mb-3 last:mb-0">
                <div className="flex justify-between text-xs mb-1" style={{ color: "#A6A6B3" }}>
                  <span>{nhan}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {tongNhom === 0 ? "chưa có dữ liệu" : `${xanh}/${tongNhom} mã xanh (${pctXanhNhom.toFixed(1)}%)`}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: NEN_INSET }}>
                  <div className="h-full rounded-full" style={{ width: `${pctXanhNhom}%`, background: XANH }} />
                </div>
              </div>
            ))}
            <p className="text-[11px] mt-3" style={{ color: MUTED }}>
              % mã có xu hướng tăng trong từng nhóm — bluechip dẫn dắt thường thấy VN30 dẫn trước Midcap/Smallcap.
            </p>
          </div>
        </div>

        {/* TOP CO HOI - CHIA 2 COT MUA / BAN */}
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
            Top cơ hội đáng chú ý
          </h2>
          <Link href="/lenh-mo" className="text-xs" style={{ color: PRIMARY, fontFamily: "'JetBrains Mono', monospace" }}>
            xem lệnh đang mở →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <CotTinHieu tieuDe="Tín hiệu MUA" mau={XANH} danhSach={tinHieuMua} />
          <CotTinHieu tieuDe="Tín hiệu BÁN" mau={DO} danhSach={tinHieuBan} />
        </div>
      </div>
    </div>
  );
}

function CotTinHieu({ tieuDe, mau, danhSach }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p
        className="text-xs uppercase tracking-wide mb-1 pb-3 border-b"
        style={{ color: mau, borderColor: VIEN, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {tieuDe} ({danhSach.length})
      </p>
      {danhSach.length === 0 && (
        <p className="py-6 text-sm" style={{ color: MUTED }}>
          Chưa có mã nào.
        </p>
      )}
      {danhSach.map((row) => (
        <Link
          key={row.ma}
          href={`/ma/${row.ma}`}
          className="w-full text-left grid grid-cols-[64px_1fr_auto] items-center gap-3 py-3 border-b hover:bg-white/[0.04] rounded-lg px-2 -mx-2 transition-colors"
          style={{ borderColor: "#1D1D26" }}
        >
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "16px" }}>{row.ma}</span>
          <span className="text-xs" style={{ color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>
            điểm {row.diem?.toFixed(2) ?? "—"}
          </span>
          <span
            className="text-right"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: row.doi >= 0 ? XANH : DO }}
          >
            {pct(row.doi, 2)}
          </span>
        </Link>
      ))}
    </div>
  );
}
