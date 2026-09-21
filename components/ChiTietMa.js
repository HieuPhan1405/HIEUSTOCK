import Link from "next/link";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import SignalPill from "@/components/SignalPill";
import BieuDoKyThuat from "@/components/BieuDoKyThuat";
import {
  fmt,
  fmtTy,
  pct,
  soAn,
  chamTPCaoNhat,
  chuoiKhoiLuong,
  nhanGiaiNgan,
  nhanLoaiVao,
  kiemTraChuanUuTien,
  gioGhiNhan,
  mocKichHoat,
  tinhVungLenh,
  chuoiVung,
  VUNG,
  TREND_MAX,
  MOM_MAX,
  DT_MAX,
  RS_MAX,
} from "@/components/dungChung";

// Lich su giao dich + thong ke hieu suat tung ma: TAM THOI BO KHOI WEB theo
// yeu cau - file xuat tu AmiBroker (dan qua Excel) bi loi lam trong so thap
// phan (Price/Ex.Price bi Excel dinh lien thanh so nguyen khong dung duoc).
// Se lam lai khi co file xuat dung (dan qua Notepad thay vi Excel).

// Mau border/nen dung chung cho tat ca "card" trong trang - de mo phong bo
// cuc khoi vuong cua trang tham khao thay vi chi la dai phan cach nhu truoc.
const VIEN = "#26262F";
const NEN_CARD = "#15151F";

function Card({ children, className = "", ...rest }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${className}`}
      style={{ borderColor: VIEN, background: NEN_CARD }}
      {...rest}
    >
      {children}
    </div>
  );
}

function CardDinhGia({ dinhGia, gia }) {
  const trungBinh = dinhGia.length
    ? dinhGia.reduce((tong, d) => tong + Number(d.gia_muc_tieu), 0) / dinhGia.length
    : null;
  const upside = trungBinh !== null && gia ? ((trungBinh / gia - 1) * 100) : null;
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "#8B8B99" }}>
        Định giá tham khảo
      </p>
      <table className="w-full text-sm mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <thead>
          <tr className="text-left" style={{ color: "#8B8B99" }}>
            <th className="font-normal pb-1">Công ty CK</th>
            <th className="font-normal pb-1">Ngày</th>
            <th className="font-normal pb-1 text-right">Giá mục tiêu</th>
          </tr>
        </thead>
        <tbody>
          {dinhGia.map((d) => (
            <tr key={d.id} className="border-t" style={{ borderColor: "#1D1D26" }}>
              <td className="py-1.5">{d.cong_ty_ck}</td>
              <td className="py-1.5" style={{ color: "#8B8B99" }}>
                {d.ngay_dinh_gia ? new Date(d.ngay_dinh_gia).toLocaleDateString("vi-VN") : "—"}
              </td>
              <td className="py-1.5 text-right" style={{ color: "#22C55E", fontWeight: 700 }}>
                {fmt(d.gia_muc_tieu)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {trungBinh !== null && (
        <div className="rounded p-3 text-center" style={{ background: "#0B0B10" }}>
          <p className="text-[11px]" style={{ color: "#8B8B99" }}>
            Giá mục tiêu trung bình {dinhGia.length} nguồn
          </p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: upside >= 0 ? "#22C55E" : "#EF4444" }} className="text-lg">
            {fmt(trungBinh)} <span className="text-sm">({pct(upside, 1)})</span>
          </p>
        </div>
      )}
    </Card>
  );
}

function CardCauChuyen({ cauChuyen }) {
  const nhomTheoLoai = { dong_luc: [], theo_doi: [], rui_ro: [] };
  cauChuyen.forEach((c) => nhomTheoLoai[c.loai]?.push(c));
  const nhan = { dong_luc: { chu: "Động lực", mau: "#22C55E" }, theo_doi: { chu: "Theo dõi", mau: "#FBBF24" }, rui_ro: { chu: "Rủi ro", mau: "#EF4444" } };
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "#8B8B99" }}>
        Câu chuyện kỳ vọng
      </p>
      {["dong_luc", "theo_doi", "rui_ro"].map(
        (loai) =>
          nhomTheoLoai[loai].length > 0 && (
            <div key={loai} className="mb-3">
              <p className="text-xs font-bold mb-1" style={{ color: nhan[loai].mau }}>
                {nhan[loai].chu.toUpperCase()}
              </p>
              {nhomTheoLoai[loai].map((c) => (
                <p key={c.id} className="text-sm mb-1" style={{ color: "#A6A6B3" }}>
                  {c.noi_dung}
                  {c.ngay && (
                    <span className="text-[11px]" style={{ color: "#8B8B99" }}>
                      {" "}
                      ({new Date(c.ngay).toLocaleDateString("vi-VN")})
                    </span>
                  )}
                </p>
              ))}
            </div>
          )
      )}
    </Card>
  );
}

function CardDangCapNhat({ tieuDe }) {
  return (
    <div className="rounded-2xl border border-dashed p-5" style={{ borderColor: VIEN }}>
      <p className="text-xs uppercase tracking-wide mb-4" style={{ color: "#9D8CF0" }}>
        {tieuDe}
      </p>
      <div className="flex items-center justify-center h-20 text-sm" style={{ color: "#5B5B66" }}>
        Đang cập nhật...
      </div>
    </div>
  );
}

function BannerMatThan() {
  return (
    <div
      className="rounded-2xl border p-4 mb-4 flex items-center gap-3"
      style={{ borderColor: "#EF4444", background: "#2C1420" }}
    >
      <TriangleAlert size={22} color="#EF4444" strokeWidth={2} aria-hidden="true" className="shrink-0" />
      <div>
        <p style={{ fontWeight: 700, color: "#EF4444" }} className="text-sm">
          Cảnh báo Mắt Thần
        </p>
        <p className="text-xs" style={{ color: "#E3AFAF" }}>
          Giá đã phá đỉnh trên mây nhưng quay lại kiểm định mà không bật lên được qua đường xu hướng ngắn hạn — rủi ro đảo chiều, cân nhắc bán ngay.
        </p>
      </div>
    </div>
  );
}


function TagInfo({ nhan, giaTri, mau }) {
  return (
    <span
      className="px-2.5 py-1 text-xs rounded-full border"
      style={{ borderColor: mau || VIEN, color: mau || "#A6A6B3", fontFamily: "'JetBrains Mono', monospace" }}
    >
      {nhan}: <strong>{giaTri}</strong>
    </span>
  );
}

// Thanh diem 2 chieu (am/duong quanh 0) - dung cho Trend/Momentum/Dong tien/RS
function ThanhDiem({ nhan, giaTri, mucMax }) {
  const gt = giaTri === null || giaTri === undefined ? null : Number(giaTri);
  const duong = gt !== null && gt >= 0;
  const rongNua = gt === null ? 0 : Math.min(50, (Math.abs(gt) / mucMax) * 50);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1" style={{ color: "#A6A6B3" }}>
        <span>{nhan}</span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: gt === null ? "#8B8B99" : duong ? "#22C55E" : "#EF4444",
          }}
        >
          {gt === null ? "—" : `${gt > 0 ? "+" : ""}${soAn(gt)} / ${soAn(mucMax, 1)}`}
        </span>
      </div>
      <div className="relative h-1.5 rounded-sm overflow-hidden" style={{ background: "#1D1D26" }}>
        <div className="absolute top-0 bottom-0" style={{ left: "50%", width: "1px", background: "#2E2E38" }} />
        {gt !== null && (
          <div
            className="absolute top-0 bottom-0"
            style={{
              background: duong ? "#22C55E" : "#EF4444",
              left: duong ? "50%" : `${50 - rongNua}%`,
              width: `${rongNua}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}

// Thanh 1 chieu (0 -> mucMax) - dung cho ADX, Breadth nganh
function ThanhMotChieu({ nhan, giaTri, mucMax, hauTo = "" }) {
  const gt = giaTri === null || giaTri === undefined ? null : Number(giaTri);
  const rong = gt === null ? 0 : Math.min(100, Math.max(0, (gt / mucMax) * 100));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1" style={{ color: "#A6A6B3" }}>
        <span>{nhan}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {gt === null ? "—" : `${soAn(gt, 1)}${hauTo} / ${soAn(mucMax, 0)}${hauTo}`}
        </span>
      </div>
      <div className="h-1.5 rounded-sm overflow-hidden" style={{ background: "#1D1D26" }}>
        <div className="h-full" style={{ width: `${rong}%`, background: "#6C5CE7" }} />
      </div>
    </div>
  );
}

function ketLuanTuDong(row) {
  const cauMo = {
    MUA: "Đang phát tín hiệu MUA",
    BAN: "Đang phát tín hiệu BÁN",
    "NAM GIU": "Đang nắm giữ vị thế mở",
  }[row.tin] || "Chưa đủ điều kiện vào lệnh, đang trung lập";

  const xuHuong = row.trend > 0.5 ? "xu hướng tăng" : row.trend < -0.5 ? "xu hướng giảm" : "đi ngang";
  const dongTien = row.dt > 0.2 ? "dòng tiền đang ủng hộ" : row.dt < -0.2 ? "dòng tiền đang rút ra" : "dòng tiền trung tính";

  return `${cauMo}, cổ phiếu đang ${xuHuong}, ${dongTien}.`;
}

// Cac tag tom tat nhanh - mo phong hang the mau cua trang tham khao
// ("Vùng: Xanh", "Xu hướng: Sideway"...), tinh tu du lieu da co san.
function tinhCacTag(row) {
  const vung =
    row.gg_top !== null && row.gia > row.gg_top
      ? { nhan: "Xanh", mau: "#22C55E" }
      : row.gg_bot !== null && row.gia < row.gg_bot
      ? { nhan: "Đỏ", mau: "#EF4444" }
      : { nhan: "Trung tính", mau: "#A6A6B3" };

  const xuHuong =
    row.trend > 0.5
      ? { nhan: "Tăng", mau: "#22C55E" }
      : row.trend < -0.5
      ? { nhan: "Giảm", mau: "#EF4444" }
      : { nhan: "Sideway", mau: "#FBBF24" };

  const dongTien =
    row.dt > 0.2
      ? { nhan: "Ủng hộ", mau: "#22C55E" }
      : row.dt < -0.2
      ? { nhan: "Rút ra", mau: "#EF4444" }
      : { nhan: "Trung tính", mau: "#A6A6B3" };

  const adxSucManh =
    row.adx === null ? { nhan: "—", mau: "#8B8B99" } : row.adx >= 40 ? { nhan: "Mạnh", mau: "#22C55E" } : row.adx >= 20 ? { nhan: "Trung bình", mau: "#FBBF24" } : { nhan: "Yếu", mau: "#A6A6B3" };

  return { vung, xuHuong, dongTien, adxSucManh };
}

// Tim 2 muc ho tro gan nhat (duoi gia) va 2 muc khang cu gan nhat (tren gia)
// tu 4 duong tham chieu da tinh trong AFL (Kijun, duong can bang dai han, dinh 52 tuan).
function tinhVungGia(row) {
  const gia = Number(row.gia);
  const cacMuc = [row.kijun, row.gg_top, row.gg_bot, row.dinh_52t]
    .map((v) => (v === null || v === undefined ? null : Number(v)))
    .filter((v) => v !== null && Number.isFinite(v));
  const khangCu = cacMuc.filter((v) => v > gia).sort((a, b) => a - b);
  const hoTro = cacMuc.filter((v) => v <= gia).sort((a, b) => b - a);
  return { hoTro1: hoTro[0] ?? null, hoTro2: hoTro[1] ?? null, khangCu1: khangCu[0] ?? null, khangCu2: khangCu[1] ?? null };
}

export default function ChiTietMa({ row, dinhGia = [], cauChuyen = [] }) {
  const vungGia = tinhVungGia(row);
  const vungLenh = tinhVungLenh(row); // null neu khong dang giu
  const khoangCach = (muc) => (muc === null || !row.gia ? null : ((muc - row.gia) / row.gia) * 100);
  const tag = tinhCacTag(row);
  const mauDiem = row.diem >= 0 ? "#22C55E" : "#EF4444";

  return (
    <div className="max-w-5xl mx-auto px-6 pt-8 pb-16" style={{ color: "#F5F5F7" }}>
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/lenh-mo"
          className="inline-flex items-center gap-1 text-xs"
          style={{ color: "#A6A6B3", fontFamily: "'JetBrains Mono', monospace" }}
        >
          <ArrowLeft size={13} /> quay lại lệnh đang mở
        </Link>
        <span className="text-xs" style={{ color: "#8B8B99", fontFamily: "'JetBrains Mono', monospace" }}>
          {row.cap_nhat_luc ? `cập nhật lúc ${new Date(row.cap_nhat_luc).toLocaleString("vi-VN")}` : "dữ liệu mẫu"}
        </span>
      </div>

      {row.mat_than && <BannerMatThan />}

      {/* 3 CARD CHINH: DIEM - KET LUAN - BREAKDOWN */}
      <div className="grid sm:grid-cols-[180px_1fr_1fr] gap-4 mb-4">
        <Card className="flex flex-col items-start">
          <div
            className="border rounded px-3 py-1.5 mb-4"
            style={{ borderColor: VIEN, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "20px", color: "#F5F5F7" }}
          >
            {row.ma}
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: mauDiem, fontSize: "40px", lineHeight: 1 }}>
            {soAn(row.diem)}
          </p>
          <p className="text-xs mt-1 mb-3" style={{ color: "#8B8B99" }}>
            điểm hợp lưu
          </p>
          <SignalPill tin={row.tin} />
          {nhanGiaiNgan(row) && (
            <span className="mt-2 text-[11px] font-bold" style={{ color: nhanGiaiNgan(row).mau }}>
              ◐ {nhanGiaiNgan(row).nhan}
            </span>
          )}
          {nhanLoaiVao(row) && (
            <span className="mt-2 text-[11px] font-bold" style={{ color: nhanLoaiVao(row).mau }} title={nhanLoaiVao(row).moTa}>
              ↺ {nhanLoaiVao(row).nhan}
            </span>
          )}
          <div className="mt-4 pt-4 border-t w-full" style={{ borderColor: VIEN }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", color: "#22C55E" }} className="text-base">
              {fmt(row.gia)}
            </p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", color: row.doi >= 0 ? "#22C55E" : "#EF4444" }} className="text-xs">
              {pct(row.doi, 2)}
            </p>
            <p className="text-[11px] mt-1" style={{ color: "#8B8B99" }}>
              KL TB20: {chuoiKhoiLuong(row.khoi_luong_tb20)}
            </p>
            {row.gtgd_tb20 != null && (
              <p className="text-[11px]" style={{ color: "#8B8B99" }}>
                GTGD TB20: {fmtTy(row.gtgd_tb20)} tỷ
              </p>
            )}
            {row.von_hoa_ty != null && (
              <p className="text-[11px]" style={{ color: "#8B8B99" }}>
                Vốn hoá: {fmtTy(row.von_hoa_ty)} tỷ
              </p>
            )}
          </div>
          {(row.tin === "MUA" || row.tin === "NAM GIU") && (
            <div className="mt-3 pt-3 border-t w-full" style={{ borderColor: VIEN }}>
              <p className="text-[11px]" style={{ color: "#8B8B99" }}>
                Đang giữ {row.so_phien_giu ?? "—"} phiên
              </p>
              <p
                className="text-sm font-bold"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: row.lai_lo_pct >= 0 ? "#22C55E" : "#EF4444" }}
              >
                {pct(row.lai_lo_pct, 2)}
              </p>
              {row.gia_mua_ghi_nhan && (
                <p className="text-[10px] leading-snug mt-1" style={{ color: "#8B8B99" }}>
                  Giá mua {fmt(row.gia_mua)} ghi nhận lúc {gioGhiNhan(row)}, lãi/lỗ tính từ giá này.
                  {row.sl_tp_ghi_nhan && " Stop-loss và TP cũng giữ theo lúc đó."}
                </p>
              )}
              {row.che_do_vao === "MOI" && (
                <p className="text-[10px] leading-snug mt-1" style={{ color: "#8B8B99" }}>
                  Vào lệnh tại mốc chuyển mua, Stop-loss đặt theo cấu trúc giá (dưới mây / đường cân bằng dài hạn / đáy nến / Kijun).
                </p>
              )}
              {vungLenh && (
                <div className="mt-2">
                  <p className="text-[11px]" style={{ color: "#8B8B99" }}>
                    Vùng mua: <strong style={{ color: "#F5F5F7" }}>{chuoiVung(vungLenh.mua.tu, vungLenh.mua.den)}</strong>
                  </p>
                  <p className="text-[10px] leading-snug" style={{ color: "#8B8B99" }}>
                    {vungLenh.mua.trangThai === "trong"
                      ? "Giá hiện tại đang trong vùng mua"
                      : vungLenh.mua.trangThai === "tren"
                        ? "Giá đã vượt vùng mua — không đuổi giá"
                        : "Giá đang dưới vùng mua"}
                  </p>
                </div>
              )}
              {mocKichHoat(row) && (
                <div className="mt-2" title="Giá mua trên hệ thống là giá đóng cửa phiên có tín hiệu; mốc chuyển mua là mức giá chính vừa bị vượt ở phiên điểm chuyển sang vùng mua.">
                  <p className="text-[11px]" style={{ color: "#8B8B99" }}>
                    Mốc chuyển mua: {fmt(mocKichHoat(row).gia)}
                  </p>
                  <p className="text-[10px] leading-snug" style={{ color: "#8B8B99" }}>
                    {mocKichHoat(row).nhan}
                    {mocKichHoat(row).chenhPct != null &&
                      ` · giá mua ${mocKichHoat(row).chenhPct >= 0 ? "cao" : "thấp"} hơn mốc ${soAn(Math.abs(mocKichHoat(row).chenhPct), 1)}%`}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#6C5CE7" }}>
            ★ Kết luận {row.ma}
          </p>
          <p className="text-base font-semibold leading-snug mb-2" style={{ color: mauDiem }}>
            Có điểm hợp lưu {soAn(row.diem)}
            {row.diem >= TREND_MAX ? ", mức mạnh" : row.diem <= -TREND_MAX ? ", mức yếu" : ", mức trung bình"}.
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "#A6A6B3" }}>
            {ketLuanTuDong(row)}
          </p>
          {nhanGiaiNgan(row) && (
            <p
              className="text-xs leading-relaxed mb-4 rounded-lg p-3"
              style={{ color: nhanGiaiNgan(row).mau, background: "rgba(255,255,255,0.04)", border: `1px solid ${nhanGiaiNgan(row).mau}55` }}
            >
              <b>{nhanGiaiNgan(row).nhan}:</b> {nhanGiaiNgan(row).moTa}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <TagInfo nhan="Vùng" giaTri={tag.vung.nhan} mau={tag.vung.mau} />
            <TagInfo nhan="Xu hướng" giaTri={tag.xuHuong.nhan} mau={tag.xuHuong.mau} />
            <TagInfo nhan="Dòng tiền" giaTri={tag.dongTien.nhan} mau={tag.dongTien.mau} />
            <TagInfo nhan="Sức mạnh ADX" giaTri={tag.adxSucManh.nhan} mau={tag.adxSucManh.mau} />
            {row.von_hoa && <TagInfo nhan="Vốn hoá" giaTri={row.von_hoa} mau="#22C55E" />}
            {(() => {
              const chuan = kiemTraChuanUuTien(row);
              return (
                <TagInfo
                  nhan="Chuẩn ưu tiên"
                  giaTri={chuan.dat ? "Đạt 4/4" : `${chuan.tieuChi.filter((t) => t.dat).length}/4`}
                  mau={chuan.dat ? "#22C55E" : "#A6A6B3"}
                />
              );
            })()}
            {row.sanyaku !== null && row.sanyaku !== undefined && (
              <TagInfo nhan="Độ tin cậy" giaTri={`${row.sanyaku}/3`} mau={row.sanyaku >= 2 ? "#22C55E" : "#A6A6B3"} />
            )}
            {row.diem_rank !== null && row.diem_rank !== undefined && (
              <TagInfo
                nhan="Rank (chất lượng setup)"
                giaTri={`${soAn(row.diem_rank, 0)}/100`}
                mau={row.diem_rank >= 70 ? "#22C55E" : row.diem_rank >= 40 ? "#FBBF24" : "#A6A6B3"}
              />
            )}
            {row.diem_confidence !== null && row.diem_confidence !== undefined && (
              <TagInfo
                nhan="Confidence (độ tự tin)"
                giaTri={`${soAn(row.diem_confidence, 0)}/100`}
                mau={row.diem_confidence >= 70 ? "#22C55E" : row.diem_confidence >= 40 ? "#FBBF24" : "#A6A6B3"}
              />
            )}
            {row.kumo_twist && (
              <TagInfo
                nhan="Mây tương lai"
                giaTri={row.kumo_twist === "TANG" ? "Sắp đổi chiều tăng" : "Sắp đổi chiều giảm"}
                mau={row.kumo_twist === "TANG" ? "#22C55E" : "#EF4444"}
              />
            )}
            {row.ngay_bien_doi && <TagInfo nhan="Time Theory" giaTri="Ngày biến đổi" mau="#A78BFA" />}
          </div>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "#8B8B99" }}>
            Vì sao {row.ma} {row.diem >= 0 ? "được" : "bị trừ"} {soAn(row.diem)} điểm?
          </p>
          <ThanhDiem nhan="Trend (x1.5)" giaTri={row.trend} mucMax={TREND_MAX} />
          <ThanhDiem nhan="Momentum (x1.0)" giaTri={row.mom} mucMax={MOM_MAX} />
          <ThanhDiem nhan="Dòng tiền (x1.2)" giaTri={row.dt} mucMax={DT_MAX} />
          <ThanhMotChieu nhan="ADX (sức mạnh xu hướng)" giaTri={row.adx} mucMax={60} />
          <ThanhDiem nhan="RS so với VNI (20 phiên, %)" giaTri={row.rs_vni} mucMax={RS_MAX} />
          <ThanhMotChieu nhan="Breadth ngành (%)" giaTri={row.breadth_nganh} mucMax={100} hauTo="%" />
        </Card>
      </div>

      {/* BIEU DO KY THUAT */}
      <div className="mb-4">
        <BieuDoKyThuat ma={row.ma} vung={vungLenh} ngayMua={row.ngay_mua} />
      </div>

      {/* VUNG GIA + STOP-LOSS - 3 MOC CHOT LOI */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Card>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "#8B8B99" }}>
            Vùng giá quan trọng
          </p>
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="rounded p-2" style={{ background: "#0B0B10" }}>
              <p className="text-[10px] uppercase mb-1" style={{ color: "#8B8B99" }}>
                Hỗ trợ
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }} className="text-sm">
                {fmt(vungGia.hoTro1)}
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#8B8B99" }} className="text-xs">
                {fmt(vungGia.hoTro2)}
              </p>
            </div>
            <div className="rounded p-2" style={{ background: "#0B0B10" }}>
              <p className="text-[10px] uppercase mb-1" style={{ color: "#8B8B99" }}>
                Giá hiện tại
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#22C55E" }} className="text-sm">
                {fmt(row.gia)}
              </p>
            </div>
            <div className="rounded p-2" style={{ background: "#0B0B10" }}>
              <p className="text-[10px] uppercase mb-1" style={{ color: "#8B8B99" }}>
                Kháng cự
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }} className="text-sm">
                {fmt(vungGia.khangCu1)}
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", color: "#8B8B99" }} className="text-xs">
                {fmt(vungGia.khangCu2)}
              </p>
            </div>
          </div>
          <p className="text-[11px] mb-3" style={{ color: "#8B8B99" }}>
            Khoảng cách tới hỗ trợ 1: <strong style={{ color: "#F5F5F7" }}>{pct(khoangCach(vungGia.hoTro1), 2)}</strong>
            {"  ·  "}
            tới kháng cự 1: <strong style={{ color: "#F5F5F7" }}>{pct(khoangCach(vungGia.khangCu1), 2)}</strong>
          </p>
          {row.stop_loss !== null && row.stop_loss !== undefined && (
            <div className="rounded p-2" style={{ background: "#2C1420", border: "1px solid #4A2230" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "#F1A9A9" }}>
                  {vungLenh?.sl ? (vungLenh.sl.xa ? "Vùng cắt lỗ lúc mua (tham khảo)" : "Vùng cắt lỗ") : "Stop-loss (nếu đang giữ)"}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#EF4444" }} className="text-sm">
                  {vungLenh?.sl ? chuoiVung(vungLenh.sl.tu, vungLenh.sl.den) : fmt(row.stop_loss)}
                  <span className="text-[11px] ml-1" style={{ color: "#C08A8A" }}>
                    ({pct(khoangCach(row.stop_loss), 2)})
                  </span>
                </span>
              </div>
              {vungLenh?.sl && (
                <p className="text-[10px] leading-snug mt-1" style={{ color: "#C08A8A" }}>
                  {vungLenh.sl.xa
                    ? "Mức này đã cách giá hiện tại rất xa nên chỉ còn mang tính tham khảo — thoát lệnh thật theo tín hiệu BÁN của hệ thống."
                    : `Đáy vùng ${fmt(vungLenh.sl.tu)} là mức cắt dứt khoát; đỉnh vùng là đường hỗ trợ gần nhất phía trên — giá rơi vào vùng này là lúc cần theo dõi sát.`}
                </p>
              )}
              {vungLenh?.hoaVon && (
                <p className="text-[10px] leading-snug mt-1 font-bold" style={{ color: "#FBBF24" }}>
                  Đã chạm TP2 → nên dời Stop-loss của phần còn lại về giá mua ({fmt(vungLenh.hoaVon)}) để không còn rủi ro lỗ.
                </p>
              )}
              {vungLenh?.sl?.xa && vungLenh.sl.canhBao != null && (
                <p className="text-[10px] leading-snug mt-1" style={{ color: "#C08A8A" }}>
                  Mức cảnh báo bảo vệ lãi (chỉ để theo dõi, không phải lệnh cắt): Kijun {fmt(vungLenh.sl.canhBao)} ({pct(khoangCach(vungLenh.sl.canhBao), 2)}).
                </p>
              )}
            </div>
          )}
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "#8B8B99" }}>
            3 mốc chốt lời từng phần
          </p>
          {vungLenh?.tp && (
            <div className="mb-3 rounded p-2" style={{ background: "#0B0B10" }}>
              <p className="text-xs" style={{ color: "#A6A6B3" }}>
                Vùng chốt lời gần (TP1–TP2):{" "}
                <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: "#22C55E" }}>{chuoiVung(vungLenh.tp.gan.tu, vungLenh.tp.gan.den)}</strong>
              </p>
              <p className="text-xs" style={{ color: "#A6A6B3" }}>
                Mốc xa (TP3):{" "}
                <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: "#22C55E" }}>{fmt(vungLenh.tp.xa)}</strong>
              </p>
              <p className="text-[10px] leading-snug mt-1" style={{ color: "#8B8B99" }}>
                Tỷ lệ chốt {VUNG.tyLeChot.tp1}/{VUNG.tyLeChot.tp2}/{VUNG.tyLeChot.tp3}/{VUNG.tyLeChot.giu}: {VUNG.tyLeChot.tp1}% ở TP1, {VUNG.tyLeChot.tp2}% ở TP2, {VUNG.tyLeChot.tp3}% ở TP3; {VUNG.tyLeChot.giu}% cuối nếu giá còn tăng thì nắm giữ lấy vị thế, thoát theo tín hiệu BÁN.
              </p>
            </div>
          )}
          {(() => {
            const mucDaCham = chamTPCaoNhat(row); // "TP1"|"TP2"|"TP3"|null - da cham hay chua TUNG LUC NAO trong qua trinh giu
            const thuTu = { TP1: 1, TP2: 2, TP3: 3 };
            return [
              ["TP1", "TP1 (gần, ngắn hạn)", row.tp1],
              ["TP2", "TP2 (giữa, trung hạn)", row.tp2],
              ["TP3", "TP3 (xa, 52 tuần)", row.tp3],
            ].map(([ma, nhan, gia]) => {
              const daCham = mucDaCham != null && thuTu[ma] <= thuTu[mucDaCham];
              return (
                <div key={ma} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: "#1D1D26" }}>
                  <span className="text-xs flex items-center gap-1.5" style={{ color: "#A6A6B3" }}>
                    {nhan}
                    {daCham && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded" style={{ background: "#22C55E22", color: "#22C55E" }}>
                        ✓ Đã chạm
                      </span>
                    )}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }} className="text-sm">
                    {fmt(gia)}
                    {gia !== null && gia !== undefined && (
                      <span className="text-[11px] ml-1" style={{ color: "#8B8B99" }}>
                        ({pct(khoangCach(gia), 2)})
                      </span>
                    )}
                  </span>
                </div>
              );
            });
          })()}
          <p className="text-[11px] mt-3" style={{ color: "#8B8B99" }}>
            &quot;Đã chạm&quot; nghĩa là giá đã TỪNG lên tới mốc đó vào một thời điểm nào trong quá trình đang giữ mã này (kể cả nếu
            sau đó giá đã tụt xuống lại) — không chỉ so với giá hiện tại.
          </p>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {dinhGia.length > 0 ? <CardDinhGia dinhGia={dinhGia} gia={row.gia} /> : <CardDangCapNhat tieuDe="Định giá tham khảo" />}
        {cauChuyen.length > 0 ? <CardCauChuyen cauChuyen={cauChuyen} /> : <CardDangCapNhat tieuDe="Câu chuyện kỳ vọng" />}
      </div>
    </div>
  );
}
