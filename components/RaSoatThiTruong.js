import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { tinhTongQuanThiTruong, nhanTamLy } from "@/lib/thiTruong";
import { tenCongTy } from "@/lib/tenMa";
import { fmt, pct, capNhatMoiNhat } from "@/components/dungChung";

// Khoi "Ra soat thi truong" dung o trang Tong quan thi truong: 3 the tong hop (xu huong, tam ly, muc giu lenh), muc LENH MUA - BAN
// (mua, mua them, ban, ban bot, chot loi) va RA SOAT NHANH (do rong, top tang/giam, nganh, khoi ngoai...). Tinh tren cac ma he thong
// dang theo doi, khong phai toan thi truong.

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";
const XANH = "#22C55E";
const DO = "#EF4444";
const VANG = "#FBBF24";
const NGOC = "#22D3EE";
const CAM = "#F97316";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const sans = { fontFamily: "'Inter', sans-serif" };

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

function DanhSachMa({ ds, mau, hienThi, trong = "Không có mã nào" }) {
  if (!ds.length) return <span className="text-sm" style={{ color: MUTED }}>{trong}</span>;
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

// nhan / nhan2: 2 nhan (xanh, do) ben trai; children / children2: noi dung tuong ung ben phai.
function HangRaSoat({ so, nhan, mauNhan = XANH, nhan2, mauNhan2 = DO, children, children2 }) {
  return (
    <div className="grid md:grid-cols-[250px_1fr] gap-x-6 gap-y-2 py-4 border-b last:border-b-0" style={{ borderColor: "#1D1D26" }}>
      <div className="flex gap-3">
        <span className="shrink-0 w-6 h-6 rounded-md text-[11px] flex items-center justify-center" style={{ background: "rgba(108,92,231,0.2)", color: "#B7A4FF", fontWeight: 700, ...mono }}>
          {so}
        </span>
        <div className="text-sm leading-snug" style={{ ...sans, fontWeight: 600 }}>
          <p style={{ color: mauNhan }}>{nhan}</p>
          {nhan2 && (
            <p className="mt-2.5" style={{ color: mauNhan2 }}>
              {nhan2}
            </p>
          )}
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

function TieuDeKhoi({ children, phu, ngay }) {
  return (
    <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: VIEN }}>
      <h2 className="text-lg" style={{ ...sans, fontWeight: 700 }}>
        {children}
        {ngay && <span style={{ color: MUTED, fontWeight: 400 }}> · {ngay}</span>}
      </h2>
      {phu && (
        <p className="text-xs mt-1" style={{ color: MUTED }}>
          {phu}
        </p>
      )}
    </div>
  );
}

export default function RaSoatThiTruong({ tatCa, vnindex, ngoai }) {
  if (!tatCa?.length) return null;
  const tq = tinhTongQuanThiTruong(tatCa, vnindex);
  const capNhat = capNhatMoiNhat(tatCa);
  const ngayHienThi = capNhat
    ? new Date(capNhat).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "numeric", month: "numeric", year: "numeric" })
    : "";
  const tamLy = nhanTamLy(tq.tamLy);
  const mauDoi = (v) => (v > 0 ? XANH : v < 0 ? DO : VANG);
  const chuoiDoi = (r) => pct(r.doi, 1);
  const tyDong = (v) => `${v > 0 ? "+" : ""}${Math.round(v).toLocaleString("vi-VN")} tỷ`;
  const l = tq.lenh;

  return (
    <section aria-label="Rà soát thị trường" className="mb-8">
      {ngayHienThi && (
        <p className="flex items-center gap-1.5 text-xs mb-3" style={{ color: MUTED, ...mono }}>
          <CalendarDays size={13} aria-hidden="true" /> Số liệu ngày {ngayHienThi}
        </p>
      )}

      {/* 3 THE TONG HOP */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
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

      {/* LENH MUA - BAN */}
      <div className="rounded-2xl border mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <TieuDeKhoi phu="Các lệnh của hệ thống ở lần cập nhật gần nhất: mua, mua thêm (sau khi chốt đủ TP3), bán, bán bớt và các mã đã chạm chốt lời.">
          Lệnh mua – bán
        </TieuDeKhoi>
        <div className="px-5">
          <HangRaSoat so="1" nhan="Mua" nhan2="Bán / cắt lỗ" children2={<DanhSachMa ds={l.ban} mau={DO} hienThi={(r) => pct(r.lai_lo_pct, 1)} trong="Không có mã BÁN" />}>
            <DanhSachMa ds={l.mua} mau={XANH} hienThi={(r) => `điểm ${fmt(r.diem)}`} trong="Không có mã MUA mới" />
          </HangRaSoat>

          <HangRaSoat so="2" nhan="Mua thêm (mới vào hôm nay)" mauNhan={NGOC} nhan2="Đang giữ lệnh mua thêm" mauNhan2={NGOC} children2={<DanhSachMa ds={l.dangMuaThem} mau={NGOC} hienThi={(r) => pct((r.gia / r.gia_mua_moi - 1) * 100, 1)} trong="Chưa có lệnh mua thêm nào đang giữ" />}>
            {l.coDuLieuMuaThem ? (
              <DanhSachMa ds={l.muaThemHomNay} mau={NGOC} hienThi={(r) => fmt(r.gia_mua_moi)} trong="Chưa có tín hiệu mua thêm hôm nay" />
            ) : (
              <span className="text-sm" style={{ color: MUTED }}>
                Chưa có dữ liệu mua thêm (cần Explore file AFL 7 mới rồi đẩy dữ liệu).
              </span>
            )}
          </HangRaSoat>

          <HangRaSoat so="3" nhan="Bán bớt (cảnh báo)" mauNhan={CAM}>
            <DanhSachMa ds={l.banBot} mau={CAM} hienThi={(r) => pct(r.lai_lo_pct, 1)} trong="Không có cảnh báo bán bớt" />
          </HangRaSoat>

          <HangRaSoat so="4" nhan="Chốt lời: đã chạm TP3 (đã chốt 85%, tìm điểm mua mới)" mauNhan={PRIMARY}>
            <DanhSachMa ds={l.chotTP3} mau={PRIMARY} hienThi={(r) => pct(r.lai_lo_pct, 1)} trong="Chưa có mã nào chạm TP3" />
          </HangRaSoat>

          <HangRaSoat so="5" nhan="Chốt lời: đã chạm TP2" nhan2="Chốt lời: đã chạm TP1" mauNhan2={XANH} children2={<DanhSachMa ds={l.chotTP1} mau={XANH} hienThi={(r) => pct(r.lai_lo_pct, 1)} trong="Không có mã nào" />}>
            <DanhSachMa ds={l.chotTP2} mau={XANH} hienThi={(r) => pct(r.lai_lo_pct, 1)} trong="Không có mã nào" />
          </HangRaSoat>
        </div>
      </div>

      {/* RA SOAT NHANH */}
      <div className="rounded-2xl border" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <TieuDeKhoi
          ngay={ngayHienThi}
          phu={`Tính trên ${tq.tong} mã hệ thống đang theo dõi (HOSE, HNX, UPCOM), không phải toàn thị trường. Top tăng/giảm chỉ xét mã có giá trị giao dịch trung bình 20 phiên từ 5 tỷ đồng.`}
        >
          Rà soát nhanh thị trường
        </TieuDeKhoi>
        <div className="px-5">
          <HangRaSoat so="1" nhan="Độ rộng thị trường">
            <p className="text-sm mb-2.5" style={sans}>
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

          <HangRaSoat so="3" nhan="Đạt điểm, đang chờ phiên sau" mauNhan={VANG}>
            <DanhSachMa ds={tq.choPhienSau} mau={VANG} hienThi={(r) => `điểm ${fmt(r.diem)}`} />
          </HangRaSoat>

          <HangRaSoat so="4" nhan="Mã vượt đỉnh 52 tuần">
            <p className="text-xs mb-2" style={{ color: MUTED }}>
              {tq.soVuotDinh} mã đang ở hoặc trên đỉnh 52 tuần (hiện 10 mã thanh khoản lớn nhất).
            </p>
            <DanhSachMa ds={tq.vuotDinh} mau={XANH} hienThi={chuoiDoi} />
          </HangRaSoat>

          <HangRaSoat so="5" nhan="Top ngành tích cực" nhan2="Top ngành tiêu cực" children2={<DanhSachNganh ds={tq.nganhXau} mau={DO} />}>
            <DanhSachNganh ds={tq.nganhTot} mau={XANH} />
          </HangRaSoat>

          <HangRaSoat
            so="6"
            nhan="Khối ngoại mua ròng"
            nhan2="Khối ngoại bán ròng"
            children2={ngoai ? <DanhSachMa ds={ngoai.topBan} mau={DO} hienThi={(r) => tyDong(r.tyDong)} /> : null}
          >
            {ngoai ? (
              <>
                <p className="text-xs mb-2" style={{ color: MUTED }}>
                  Ngày {ngoai.ngay.split("-").reverse().join("/")} · khối ngoại HOSE ròng{" "}
                  <b style={{ color: ngoai.rongHose >= 0 ? XANH : DO, ...mono }}>{tyDong(ngoai.rongHose)}</b> (toàn bộ mã niêm yết, nguồn VNDirect).
                </p>
                <DanhSachMa ds={ngoai.topMua} mau={XANH} hienThi={(r) => tyDong(r.tyDong)} />
              </>
            ) : (
              <span className="text-sm" style={{ color: MUTED }}>
                Chưa tải được dữ liệu khối ngoại.
              </span>
            )}
          </HangRaSoat>

          <HangRaSoat so="7" nhan="Thống kê mã so với đường trung bình của hệ thống">
            <DongTyLe nhan="Mã có giá trên Kijun (17 phiên)" ty={tq.tren.kijun} mau="#3B9EFF" />
            <DongTyLe nhan="Mã có giá trên đường cân bằng dài hạn" ty={tq.tren.canBang} mau="#A78BFA" />
            <DongTyLe nhan="Mã đạt điểm MUA (từ 1,25 điểm)" ty={tq.tren.datDiem} mau={XANH} />
          </HangRaSoat>
        </div>
      </div>
    </section>
  );
}
