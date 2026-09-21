import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { layTinTucThiTruong } from "@/lib/tinTuc";
import { layTatCaTinHieu, layChiSoVNIndex } from "@/lib/tinHieu";
import { tinhTongQuanThiTruong, layDongTienNuocNgoai, nhanTamLy } from "@/lib/thiTruong";
import { tenCongTy } from "@/lib/tenMa";
import { fmt, pct, capNhatMoiNhat } from "@/components/dungChung";
import NhanCapNhat from "@/components/NhanCapNhat";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Thị trường",
  description: "Rà soát nhanh thị trường: độ rộng, top tăng giảm, ngành, khối ngoại, tâm lý và tín hiệu của hệ thống, kèm tin tức mới nhất.",
};

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const NEN_TRONG = "#1B1B26";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";
const XANH = "#22C55E";
const DO = "#EF4444";
const VANG = "#FBBF24";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const sans = { fontFamily: "'Inter', sans-serif" };

function thoiGianTuongDoi(ngayISO) {
  if (!ngayISO) return "";
  const phut = Math.max(0, Math.round((Date.now() - new Date(ngayISO).getTime()) / 60000));
  if (phut < 60) return `${phut} phút trước`;
  const gio = Math.round(phut / 60);
  if (gio < 24) return `${gio} giờ trước`;
  return `${Math.round(gio / 24)} ngày trước`;
}

// ---------- Khoi giao dien nho ----------

function The({ tieuDe, phu, children }) {
  return (
    <div className="rounded-2xl border p-5 flex flex-col" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-xs uppercase tracking-wide" style={{ color: MUTED, ...mono }}>
        {tieuDe}
      </p>
      <div className="flex-1 flex flex-col justify-center py-3">{children}</div>
      {phu && (
        <p className="text-[11px] leading-snug" style={{ color: MUTED }}>
          {phu}
        </p>
      )}
    </div>
  );
}

// Dong ho do tam ly 0-100: cung tron chia 5 doan do -> xanh, kim chi theo gia tri.
function DongHoTamLy({ diem }) {
  const goc = diem == null ? -90 : -90 + (Math.max(0, Math.min(100, diem)) / 100) * 180;
  const cx = 100;
  const cy = 100;
  const r = 78;
  const diemTrenCung = (phanTram) => {
    const a = Math.PI * (1 - phanTram / 100);
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  };
  const cacDoan = ["#EF4444", "#F97316", "#FBBF24", "#84CC16", "#22C55E"].map((mau, i) => {
    const [x1, y1] = diemTrenCung(i * 20 + 0.8);
    const [x2, y2] = diemTrenCung((i + 1) * 20 - 0.8);
    return <path key={mau} d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} stroke={mau} strokeWidth="14" fill="none" strokeLinecap="butt" />;
  });
  return (
    <svg viewBox="0 0 200 118" className="w-full max-w-[230px] mx-auto" role="img" aria-label={`Thang tâm lý thị trường: ${diem ?? "chưa có"} trên 100`}>
      {cacDoan}
      <g transform={`rotate(${goc} ${cx} ${cy})`}>
        <line x1={cx} y1={cy} x2={cx} y2={cy - 66} stroke="#F5F5F7" strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx={cx} cy={cy} r="7" fill="#F5F5F7" />
      <text x="16" y="116" fill={MUTED} fontSize="9" style={mono}>
        0
      </text>
      <text x="176" y="116" fill={MUTED} fontSize="9" style={mono}>
        100
      </text>
    </svg>
  );
}

function DanhSachMa({ ds, mau, hienThi }) {
  if (!ds.length) return <span className="text-sm" style={{ color: MUTED }}>Không có mã nào</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {ds.map((r) => {
        const t = tenCongTy(r.ma);
        return (
          <Link
            key={r.ma}
            href={`/ma/${r.ma}`}
            title={t?.ten}
            className="inline-flex items-baseline gap-1.5 px-2 py-1 rounded-md text-xs hover:brightness-125 transition"
            style={{ background: mau + "1F", color: mau, border: `1px solid ${mau}33` }}
          >
            <b style={{ ...mono, fontWeight: 700 }}>{r.ma}</b>
            {hienThi && <span style={{ ...mono, opacity: 0.85, fontSize: 10 }}>{hienThi(r)}</span>}
          </Link>
        );
      })}
    </div>
  );
}

function HangRaSoat({ so, nhan, nhan2, children, children2 }) {
  return (
    <div className="grid md:grid-cols-[250px_1fr] gap-x-6 gap-y-2 py-4 border-b last:border-b-0" style={{ borderColor: "#1D1D26" }}>
      <div className="flex gap-3">
        <span className="shrink-0 w-6 h-6 rounded-md text-[11px] flex items-center justify-center" style={{ background: "rgba(108,92,231,0.2)", color: "#B7A4FF", fontWeight: 700, ...mono }}>
          {so}
        </span>
        <div className="text-sm leading-snug" style={{ ...sans, fontWeight: 600 }}>
          <p style={{ color: XANH }}>{nhan}</p>
          {nhan2 && <p className="mt-2.5" style={{ color: DO }}>{nhan2}</p>}
        </div>
      </div>
      <div className="min-w-0 space-y-2.5">
        <div>{children}</div>
        {children2 && <div>{children2}</div>}
      </div>
    </div>
  );
}

function ThanhTyLe({ ty, mau }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#262631" }}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, ty))}%`, background: mau }} />
    </div>
  );
}

function DongTyLe({ nhan, ty, mau }) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="flex justify-between text-xs mb-1" style={{ color: MUTED }}>
        <span>{nhan}</span>
        <b style={{ color: TEXT, ...mono }}>{ty == null ? "—" : `${ty.toFixed(0)}%`}</b>
      </div>
      <ThanhTyLe ty={ty ?? 0} mau={mau} />
    </div>
  );
}

// ---------- Tin tuc ----------

function TheTin({ tin }) {
  return (
    <a
      href={tin.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 py-4 border-b hover:bg-white/[0.03] transition-colors -mx-2 px-2 rounded-lg"
      style={{ borderColor: "#1D1D26" }}
    >
      {tin.anh && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tin.anh} alt="" className="w-24 h-16 object-cover rounded-lg shrink-0" style={{ background: "#1D1D26" }} />
      )}
      <div className="min-w-0">
        <p className="text-sm leading-snug mb-1" style={{ ...sans, fontWeight: 600, color: TEXT }}>
          {tin.tieuDe}
        </p>
        {tin.moTa && (
          <p className="text-xs leading-relaxed mb-1 line-clamp-2" style={{ color: MUTED }}>
            {tin.moTa}
          </p>
        )}
        <p className="text-[11px]" style={{ color: "#6B6B78", ...mono }}>
          {thoiGianTuongDoi(tin.ngayISO)} · CafeF
        </p>
      </div>
    </a>
  );
}

function CotDanhMuc({ nhan, danhSach }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-xs uppercase tracking-wide mb-1 pb-3 border-b" style={{ color: PRIMARY, borderColor: VIEN, ...mono }}>
        {nhan}
      </p>
      {danhSach.length === 0 ? (
        <p className="py-6 text-sm" style={{ color: MUTED }}>
          Chưa tải được tin từ nguồn này.
        </p>
      ) : (
        danhSach.map((tin, i) => <TheTin key={tin.link + i} tin={tin} />)
      )}
    </div>
  );
}

// ---------- Trang ----------

export default async function TrangThiTruong() {
  let tatCa = [];
  let vnindex = null;
  let loiDuLieu = null;
  try {
    [tatCa, vnindex] = await Promise.all([layTatCaTinHieu(), layChiSoVNIndex()]);
  } catch (e) {
    loiDuLieu = String(e?.message || e);
  }
  const [ngoai, tin] = await Promise.all([
    layDongTienNuocNgoai().catch(() => null),
    layTinTucThiTruong().catch(() => ({ theoDanhMuc: {}, danhSachDanhMuc: [] })),
  ]);

  const tq = tatCa.length ? tinhTongQuanThiTruong(tatCa, vnindex) : null;
  const capNhat = capNhatMoiNhat(tatCa);
  const ngayHienThi = capNhat
    ? new Date(capNhat).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "numeric", month: "numeric", year: "numeric" })
    : "";
  const tamLy = tq ? nhanTamLy(tq.tamLy) : null;
  const mauDoi = (v) => (v > 0 ? XANH : v < 0 ? DO : VANG);
  const chuoiDoi = (r) => pct(r.doi, 1);
  const tyDong = (v) => `${v > 0 ? "+" : ""}${Math.round(v).toLocaleString("vi-VN")} tỷ`;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <div className="flex flex-wrap items-end justify-between gap-2 mb-1">
        <h1 className="text-2xl" style={{ ...sans, fontWeight: 700 }}>
          Thị trường
        </h1>
        {ngayHienThi && (
          <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: MUTED, ...mono }}>
            <CalendarDays size={13} aria-hidden="true" /> {ngayHienThi}
          </span>
        )}
      </div>
      <p className="text-sm mb-2" style={{ color: MUTED }}>
        Rà soát nhanh thị trường từ dữ liệu quét của hệ thống, kèm tin tức mới nhất. Không phải khuyến nghị đầu tư.
      </p>
      <NhanCapNhat luc={capNhat} className="mb-6" />

      {loiDuLieu && (
        <p className="text-sm mb-6" style={{ color: DO }}>
          Lỗi tải dữ liệu: {loiDuLieu}
        </p>
      )}

      {tq && (
        <>
          {/* 3 THE TONG HOP */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <The tieuDe="Xu hướng thị trường" phu="Theo điểm Trend của chính VN-Index (Ichimoku + đường cân bằng dài hạn).">
              {vnindex ? (
                <div className="text-center">
                  <span className="inline-block px-4 py-1.5 rounded-full text-sm mb-3" style={{ background: tq.xuHuong.mau + "22", color: tq.xuHuong.mau, border: `1px solid ${tq.xuHuong.mau}55`, fontWeight: 700 }}>
                    {tq.xuHuong.nhan}
                  </span>
                  <p className="text-3xl" style={{ ...mono, fontWeight: 700 }}>
                    {fmt(vnindex.gia)}
                  </p>
                  <p className="text-sm" style={{ color: mauDoi(vnindex.doi), ...mono }}>
                    {pct(vnindex.doi, 2)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-center" style={{ color: MUTED }}>
                  Chưa có dữ liệu VN-Index.
                </p>
              )}
            </The>

            <The tieuDe="Tâm lý thị trường" phu="Trung bình 4 tỷ lệ: mã tăng giá, mã trên Kijun, mã trên đường cân bằng dài hạn, mã đạt điểm MUA (tự tính, không phải chỉ báo chuẩn).">
              <DongHoTamLy diem={tq.tamLy} />
              <p className="text-center -mt-1">
                <span className="text-2xl" style={{ ...mono, fontWeight: 700 }}>
                  {tq.tamLy ?? "—"}
                </span>{" "}
                <span className="text-sm" style={{ color: tamLy.mau, fontWeight: 600 }}>
                  {tamLy.nhan}
                </span>
              </p>
            </The>

            <The tieuDe="Mức giữ lệnh của hệ thống" phu="Số mã đang MUA hoặc NẮM GIỮ trên tổng số mã hệ thống theo dõi. Chỉ là thống kê, không phải khuyến nghị tỷ trọng.">
              <p className="text-center text-4xl mb-1" style={{ ...mono, fontWeight: 700, color: PRIMARY }}>
                {tq.tyLeDangGiu == null ? "—" : `${tq.tyLeDangGiu.toFixed(0)}%`}
              </p>
              <p className="text-center text-xs mb-4" style={{ color: MUTED }}>
                {tq.dangGiu}/{tq.tong} mã đang giữ lệnh
              </p>
              <ThanhTyLe ty={tq.tyLeDangGiu ?? 0} mau={PRIMARY} />
              <div className="flex justify-between text-[10px] mt-1" style={{ color: MUTED, ...mono }}>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </The>
          </div>

          {/* RA SOAT NHANH */}
          <section className="rounded-2xl border mb-10" style={{ borderColor: VIEN, background: NEN_CARD }}>
            <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: VIEN }}>
              <h2 className="text-lg" style={{ ...sans, fontWeight: 700 }}>
                Rà soát nhanh thị trường
                {ngayHienThi && <span style={{ color: MUTED, fontWeight: 400 }}> · {ngayHienThi}</span>}
              </h2>
              <p className="text-xs mt-1" style={{ color: MUTED }}>
                Tính trên {tq.tong} mã hệ thống đang theo dõi (HOSE, HNX, UPCOM), không phải toàn thị trường. Top tăng/giảm chỉ xét mã có giá trị giao dịch trung bình 20 phiên từ 5 tỷ đồng.
              </p>
            </div>
            <div className="px-5">
              <HangRaSoat so="1" nhan="Độ rộng thị trường">
                <p className="text-sm mb-2.5" style={{ ...sans }}>
                  <b style={{ color: XANH }}>{tq.doRong.tang} mã tăng</b> / <b style={{ color: DO }}>{tq.doRong.giam} mã giảm</b>
                  {tq.doRong.dung > 0 && <span style={{ color: VANG }}> / {tq.doRong.dung} đứng giá</span>}
                  <span style={{ color: MUTED }}>
                    {" "}
                    (tăng mạnh &gt;3%: {tq.doRong.tangManh} · tăng nhẹ: {tq.doRong.tangNhe} · giảm nhẹ: {tq.doRong.giamNhe} · giảm mạnh &lt;−3%: {tq.doRong.giamManh})
                  </span>
                </p>
                <div className="flex h-2.5 rounded-full overflow-hidden" style={{ background: "#262631" }} aria-hidden="true">
                  {[
                    [tq.doRong.tangManh, "#16A34A"],
                    [tq.doRong.tangNhe, "#4ADE80"],
                    [tq.doRong.dung, VANG],
                    [tq.doRong.giamNhe, "#F87171"],
                    [tq.doRong.giamManh, "#B91C1C"],
                  ].map(([n, mau]) => (
                    <div key={mau} style={{ width: `${(n / Math.max(tq.doRong.tong, 1)) * 100}%`, background: mau }} />
                  ))}
                </div>
              </HangRaSoat>

              <HangRaSoat so="2" nhan="Top tăng giá" nhan2="Top giảm giá" children2={<DanhSachMa ds={tq.topGiam} mau={DO} hienThi={chuoiDoi} />}>
                <DanhSachMa ds={tq.topTang} mau={XANH} hienThi={chuoiDoi} />
              </HangRaSoat>

              <HangRaSoat so="3" nhan="Tín hiệu MUA hôm nay" nhan2="Tín hiệu BÁN hôm nay" children2={<DanhSachMa ds={tq.ban} mau={DO} hienThi={(r) => pct(r.lai_lo_pct, 1)} />}>
                <DanhSachMa ds={tq.mua} mau={XANH} hienThi={(r) => `điểm ${fmt(r.diem)}`} />
              </HangRaSoat>

              <HangRaSoat so="4" nhan="Đạt điểm, đang chờ phiên sau">
                <DanhSachMa ds={tq.choPhienSau} mau={VANG} hienThi={(r) => `điểm ${fmt(r.diem)}`} />
              </HangRaSoat>

              <HangRaSoat so="5" nhan="Mã vượt đỉnh 52 tuần" nhan2={null}>
                <p className="text-xs mb-2" style={{ color: MUTED }}>
                  {tq.soVuotDinh} mã đang ở hoặc trên đỉnh 52 tuần (hiện 10 mã thanh khoản lớn nhất).
                </p>
                <DanhSachMa ds={tq.vuotDinh} mau={XANH} hienThi={chuoiDoi} />
              </HangRaSoat>

              <HangRaSoat
                so="6"
                nhan="Top ngành tích cực"
                nhan2="Top ngành tiêu cực"
                children2={<DanhSachNganh ds={tq.nganhXau} mau={DO} />}
              >
                <DanhSachNganh ds={tq.nganhTot} mau={XANH} />
              </HangRaSoat>

              <HangRaSoat
                so="7"
                nhan="Khối ngoại mua ròng"
                nhan2="Khối ngoại bán ròng"
                children2={ngoai ? <DanhSachMa ds={ngoai.topBan.map((x) => ({ ma: x.ma, tyDong: x.tyDong }))} mau={DO} hienThi={(r) => tyDong(r.tyDong)} /> : null}
              >
                {ngoai ? (
                  <>
                    <p className="text-xs mb-2" style={{ color: MUTED }}>
                      Ngày {ngoai.ngay.split("-").reverse().join("/")} · khối ngoại HOSE ròng{" "}
                      <b style={{ color: ngoai.rongHose >= 0 ? XANH : DO, ...mono }}>{tyDong(ngoai.rongHose)}</b> (toàn bộ mã niêm yết, nguồn VNDirect).
                    </p>
                    <DanhSachMa ds={ngoai.topMua.map((x) => ({ ma: x.ma, tyDong: x.tyDong }))} mau={XANH} hienThi={(r) => tyDong(r.tyDong)} />
                  </>
                ) : (
                  <span className="text-sm" style={{ color: MUTED }}>
                    Chưa tải được dữ liệu khối ngoại.
                  </span>
                )}
              </HangRaSoat>

              <HangRaSoat so="8" nhan="Đã chốt đủ TP3 (đang tìm điểm mua mới)">
                <DanhSachMa ds={tq.daChotTP3} mau={PRIMARY} hienThi={(r) => pct(r.lai_lo_pct, 1)} />
              </HangRaSoat>

              <HangRaSoat so="9" nhan="Thống kê mã so với đường trung bình của hệ thống">
                <DongTyLe nhan="Mã có giá trên Kijun (17 phiên)" ty={tq.tren.kijun} mau="#3B9EFF" />
                <DongTyLe nhan="Mã có giá trên đường cân bằng dài hạn" ty={tq.tren.canBang} mau="#A78BFA" />
                <DongTyLe nhan="Mã đạt điểm MUA (từ 1,25 điểm)" ty={tq.tren.datDiem} mau={XANH} />
              </HangRaSoat>
            </div>
          </section>
        </>
      )}

      {/* TIN TUC */}
      <h2 className="text-lg mb-1" style={{ ...sans, fontWeight: 700 }}>
        Tin tức thị trường
      </h2>
      <p className="text-xs mb-4" style={{ color: MUTED }}>
        Vĩ mô trong nước, quốc tế và doanh nghiệp, tổng hợp tự động từ CafeF, cập nhật mỗi 10 phút.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {tin.danhSachDanhMuc.map((dm) => (
          <CotDanhMuc key={dm.khoa} nhan={dm.nhan} danhSach={tin.theoDanhMuc[dm.khoa] || []} />
        ))}
      </div>
    </div>
  );
}

function DanhSachNganh({ ds, mau }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ds.map((n) => (
        <span key={n.khoa} className="inline-flex items-baseline gap-1.5 px-2 py-1 rounded-md text-xs" style={{ background: mau + "1F", color: mau, border: `1px solid ${mau}33` }}>
          <b style={{ ...sans, fontWeight: 600 }}>{n.nhan}</b>
          <span style={{ ...mono, opacity: 0.85, fontSize: 10 }}>{pct(n.tb, 2)}</span>
        </span>
      ))}
    </div>
  );
}
