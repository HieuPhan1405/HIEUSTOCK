import Link from "next/link";
import { layTatCaTinHieu, layChiSoVNIndex } from "@/lib/tinHieu";
import { fmt, pct, phanLoaiXuHuong, chamTPCaoNhat } from "@/components/dungChung";
import SignalPill from "@/components/SignalPill";

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

// "NHAN DINH THI TRUONG" - doan van tu dong sinh tu chinh du lieu ~390 ma
// VN30/Midcap/Smallcap dang theo doi, gom ca HOSE lan HNX/UPCOM tu khi mo
// rong (KHONG phai toan bo thi truong nen khong dung so lieu "do rong ca
// thi truong" tuyet doi, chi noi ro pham vi dang co).
function sinhNhanDinh(tatCa) {
  const tong = tatCa.length;
  if (!tong) return null;

  const soTang = tatCa.filter((r) => r.doi > 0).length;
  const soGiam = tatCa.filter((r) => r.doi < 0).length;
  const soDung = tong - soTang - soGiam;
  const soGiamManh = tatCa.filter((r) => r.doi <= -3).length;
  const pctGiam = (soGiam / tong) * 100;
  const pctTang = (soTang / tong) * 100;
  const pctGiamManh = (soGiamManh / tong) * 100;
  const soMua = tatCa.filter((r) => r.tin === "MUA").length;
  const soBan = tatCa.filter((r) => r.tin === "BAN").length;
  const soMatThan = tatCa.filter((r) => r.mat_than).length;
  const soVuotDinh = tatCa.filter((r) => r.dinh_52t != null && r.gia >= r.dinh_52t).length;

  let sacThai = "GIẰNG CO", mau = VANG;
  if (pctGiam - pctTang > 30) { sacThai = "TIÊU CỰC"; mau = DO; }
  else if (pctTang - pctGiam > 30) { sacThai = "TÍCH CỰC"; mau = XANH; }

  const cau = [
    `Thị trường nghiêng ${sacThai.toLowerCase()} với ${pctGiam.toFixed(1)}% mã giảm điểm / ${pctTang.toFixed(1)}% mã tăng điểm trong ${tong} mã VN30-Midcap-Smallcap đang theo dõi (HOSE, HNX, UPCOM), trong đó ${soGiamManh} mã (${pctGiamManh.toFixed(1)}%) giảm mạnh trên 3%.`,
  ];
  if (soMatThan > 0) {
    cau.push(`Có ${soMatThan} mã đang cảnh báo Mắt Thần — rủi ro đảo chiều cần theo dõi sát trong các phiên tới.`);
  }
  if (soVuotDinh > 0) {
    cau.push(`Vẫn có ${soVuotDinh} mã vượt đỉnh 52 tuần, cho thấy dòng tiền chưa rút hoàn toàn mà đang chọn lọc theo từng nhóm ngành.`);
  }
  cau.push(`Tín hiệu mới phát sinh hôm nay: ${soMua} mã MUA, ${soBan} mã BÁN.`);

  return { sacThai, mau, doanVan: cau.join(" "), soTang, soGiam, soDung };
}

// PTKT VNINDEX - dung dung cong thuc Ichimoku/Giao Gam/diem so nhu tung ma,
// chi khac o cho ap dung cho chinh chi so (xem AFL: LaVNIndex).
function phanLoaiTrend(trend) {
  if (trend === null || trend === undefined) return { nhan: "Sideway", mau: VANG };
  if (trend > 0.5) return { nhan: "Tăng", mau: XANH };
  if (trend < -0.5) return { nhan: "Giảm", mau: DO };
  return { nhan: "Sideway", mau: VANG };
}

// The KPI - card so lieu nhanh, co quang mau mo phia sau de tao diem nhan
// (mo phong hieu ung "glow" cua dashboard fintech hien dai).
// href tuy chon - neu co, ca the tro thanh 1 link bam duoc dan sang Bo loc
// co phieu voi dung bo loc tuong ung (vd Xu huong tang -> ?xuhuong=xanh).
function TheKPI({ nhan, giaTri, phu, mau, href }) {
  const noiDung = (
    <>
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
    </>
  );

  const className = "rounded-2xl border p-5 relative overflow-hidden block";
  const style = { borderColor: VIEN, background: NEN_CARD };

  if (href) {
    return (
      <Link href={href} className={`${className} hover:border-[#3A3A46] transition-colors`} style={style}>
        {noiDung}
      </Link>
    );
  }
  return (
    <div className={className} style={style}>
      {noiDung}
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
  let chiSoVNIndex = null;
  let loi = null;
  try {
    [tatCa, chiSoVNIndex] = await Promise.all([layTatCaTinHieu(), layChiSoVNIndex()]);
  } catch (e) {
    loi = String(e?.message || e);
  }

  const nhanDinh = sinhNhanDinh(tatCa);

  const tong = tatCa.length;
  const soXanh = tatCa.filter((r) => phanLoaiXuHuong(r) === "xanh").length;
  const soDo = tatCa.filter((r) => phanLoaiXuHuong(r) === "do").length;
  const soSideway = tong - soXanh - soDo;
  const pctXanh = tong ? (soXanh / tong) * 100 : 0;
  const pctDo = tong ? (soDo / tong) * 100 : 0;
  const soMua = tatCa.filter((r) => r.tin === "MUA").length;
  const soMatThan = tatCa.filter((r) => r.mat_than).length;
  // 2 the KPI rieng, KHONG tinh vao Tin hieu MUA/BAN (2 cot do chi danh cho
  // dung tin hieu MUA/BAN moi phat sinh hom nay) - Chot loi va Ban bot la
  // trang thai cua vi the DANG giu, khac ban chat.
  const soChotLoi = tatCa.filter((r) => r.tin === "NAM GIU" && chamTPCaoNhat(r)).length;
  const soBanBot = tatCa.filter((r) => r.ban_bot).length;

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
            Hệ thống hỗ trợ đầu tư · Quét toàn bộ thị trường
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

        {/* NHAN DINH THI TRUONG - doan van tu dong sinh, khong phai khuyen nghi dau tu */}
        {nhanDinh && (
          <div
            className="rounded-2xl border p-6 mb-6 relative overflow-hidden"
            style={{ borderColor: VIEN, background: NEN_CARD }}
          >
            <div
              aria-hidden="true"
              className="absolute -left-10 -bottom-16 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ background: nhanDinh.mau }}
            />
            <div className="flex items-center gap-2 mb-3 relative">
              <span className="text-xs uppercase tracking-wide" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                Nhận định nhanh
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-sm"
                style={{ color: nhanDinh.mau, background: `${nhanDinh.mau}22`, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {nhanDinh.sacThai}
              </span>
            </div>
            <p className="text-sm leading-relaxed relative" style={{ fontFamily: "'Inter', sans-serif", color: "#D8D8E0" }}>
              {nhanDinh.doanVan}
            </p>
            <p className="text-[11px] mt-3 relative" style={{ color: MUTED }}>
              Tự động tổng hợp từ {tatCa.length} mã đang theo dõi — không phải khuyến nghị đầu tư.
            </p>
          </div>
        )}

        {/* PTKT VNINDEX - dung chung cong thuc Dao Gam, ap dung cho chinh chi so */}
        {chiSoVNIndex ? (
          <div className="rounded-2xl border p-6 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                  PTKT VNINDEX
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                    {fmt(chiSoVNIndex.gia)}
                  </span>
                  <span
                    className="text-sm"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: chiSoVNIndex.doi >= 0 ? XANH : DO }}
                  >
                    {pct(chiSoVNIndex.doi, 2)}
                  </span>
                </div>
              </div>
              <SignalPill tin={chiSoVNIndex.tin} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] mb-1" style={{ color: MUTED }}>Điểm tổng hợp</p>
                <p
                  className="text-lg"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: chiSoVNIndex.diem >= 0 ? XANH : DO }}
                >
                  {chiSoVNIndex.diem?.toFixed(2) ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] mb-1" style={{ color: MUTED }}>Xu hướng</p>
                <p className="text-lg" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: phanLoaiTrend(chiSoVNIndex.trend).mau }}>
                  {phanLoaiTrend(chiSoVNIndex.trend).nhan}
                </p>
              </div>
              <div>
                <p className="text-[11px] mb-1" style={{ color: MUTED }}>Đường cân bằng</p>
                <p className="text-lg" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                  {fmt(chiSoVNIndex.kijun)}
                </p>
              </div>
              <div>
                <p className="text-[11px] mb-1" style={{ color: MUTED }}>Mây tương lai</p>
                <p className="text-lg" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                  {chiSoVNIndex.kumo_twist === "TANG" ? "Tăng" : chiSoVNIndex.kumo_twist === "GIAM" ? "Giảm" : "—"}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-5 pt-5 border-t" style={{ borderColor: VIEN }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: MUTED }}>Vùng cân bằng trung hạn</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmt(chiSoVNIndex.gg_bot)} – {fmt(chiSoVNIndex.gg_top)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: MUTED }}>Đỉnh 52 tuần</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(chiSoVNIndex.dinh_52t)}</span>
              </div>
            </div>

            <p className="text-[11px] mt-4" style={{ color: MUTED }}>
              Áp dụng cùng hệ thống chỉ báo như từng mã cổ phiếu, tính trực tiếp trên chỉ số VNINDEX.
            </p>
          </div>
        ) : (
          !loi && (
            <div className="rounded-2xl border p-6 mb-6 text-sm" style={{ borderColor: VIEN, background: NEN_CARD, color: MUTED }}>
              Chưa có dữ liệu PTKT VNINDEX — cần chạy lại Explore + upload sau khi cập nhật công thức AFL mới nhất.
            </div>
          )
        )}

        {/* HANG KPI */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <TheKPI nhan="Mã đang theo dõi" giaTri={tong} mau={TEXT} href="/bo-loc" />
          <TheKPI nhan="Xu hướng tăng" giaTri={`${pctXanh.toFixed(0)}%`} phu={`${soXanh} mã`} mau={XANH} href="/bo-loc?xuhuong=xanh" />
          <TheKPI nhan="Tín hiệu MUA" giaTri={soMua} phu="hôm nay" mau={PRIMARY} href="/bo-loc?tin=MUA" />
          <TheKPI nhan="Cảnh báo Mắt Thần" giaTri={soMatThan} phu="rủi ro đảo chiều" mau={soMatThan > 0 ? DO : MUTED} href="/bo-loc?matthan=1" />
          <TheKPI nhan="Cơ hội chốt lời" giaTri={soChotLoi} phu="đã chạm TP" mau={soChotLoi > 0 ? "#FBBF24" : MUTED} href="/bo-loc?chotloi=1" />
          <TheKPI nhan="Cảnh báo bán bớt" giaTri={soBanBot} phu="điểm dưới ngưỡng" mau={soBanBot > 0 ? "#F97316" : MUTED} href="/bo-loc?banbot=1" />
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
