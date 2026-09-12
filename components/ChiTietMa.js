import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SignalPill from "@/components/SignalPill";
import { fmt, pct, soAn, TREND_MAX, MOM_MAX, DT_MAX, RS_MAX } from "@/components/dungChung";

// Du lieu minh hoa - CHUA noi backtest that theo tung ma (can dataset rieng
// tu AmiBroker moi lam duoc, xem ghi chu trong README.md).
const tradeHistoryMau = [
  { ngayMua: "24/03/2026", giaMua: 58071, ngayBan: "02/06/2026", giaBan: 61694, phien: 51, laiLo: 6.24, trangThai: "DA_DONG" },
  { ngayMua: "11/02/2026", giaMua: 64573, ngayBan: "03/03/2026", giaBan: 62091, phien: 15, laiLo: -3.84, trangThai: "DA_DONG" },
  { ngayMua: "07/01/2026", giaMua: 58269, ngayBan: "23/01/2026", giaBan: 69238, phien: 13, laiLo: 18.82, trangThai: "DA_DONG" },
  { ngayMua: "06/10/2025", giaMua: 62935, ngayBan: "17/10/2025", giaBan: 61892, phien: 10, laiLo: -1.66, trangThai: "DA_DONG" },
  { ngayMua: "01/07/2025", giaMua: 57154, ngayBan: "20/08/2025", giaBan: 62529, phien: 37, laiLo: 9.40, trangThai: "DA_DONG" },
];
const statMau = { tongGiaoDich: 23, dangMo: 0, laiLoTBMo: 0.0, tyLeLai: 69.6, laiLoTBLenh: 4.3, luyKe: 98.94 };

// Mau border/nen dung chung cho tat ca "card" trong trang - de mo phong bo
// cuc khoi vuong cua trang tham khao thay vi chi la dai phan cach nhu truoc.
const VIEN = "#2A2620";
const NEN_CARD = "#1B1913";

function Card({ children, className = "", ...rest }) {
  return (
    <div
      className={`rounded-lg border p-5 ${className}`}
      style={{ borderColor: VIEN, background: NEN_CARD }}
      {...rest}
    >
      {children}
    </div>
  );
}

function CardDangCapNhat({ tieuDe }) {
  return (
    <div className="rounded-lg border border-dashed p-5" style={{ borderColor: VIEN }}>
      <p className="text-xs uppercase tracking-wide mb-4" style={{ color: "#8A6FD9" }}>
        {tieuDe}
      </p>
      <div className="flex items-center justify-center h-20 text-sm" style={{ color: "#5A564C" }}>
        Đang cập nhật...
      </div>
    </div>
  );
}

function TagInfo({ nhan, giaTri, mau }) {
  return (
    <span
      className="px-2.5 py-1 text-xs rounded-full border"
      style={{ borderColor: mau || VIEN, color: mau || "#A8A296", fontFamily: "'JetBrains Mono', monospace" }}
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
      <div className="flex justify-between text-xs mb-1" style={{ color: "#A8A296" }}>
        <span>{nhan}</span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: gt === null ? "#6F6C64" : duong ? "#5FCF8A" : "#E86A6A",
          }}
        >
          {gt === null ? "—" : `${gt > 0 ? "+" : ""}${soAn(gt)} / ${soAn(mucMax, 1)}`}
        </span>
      </div>
      <div className="relative h-1.5 rounded-sm overflow-hidden" style={{ background: "#211F1A" }}>
        <div className="absolute top-0 bottom-0" style={{ left: "50%", width: "1px", background: "#3A362C" }} />
        {gt !== null && (
          <div
            className="absolute top-0 bottom-0"
            style={{
              background: duong ? "#5FCF8A" : "#E86A6A",
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
      <div className="flex justify-between text-xs mb-1" style={{ color: "#A8A296" }}>
        <span>{nhan}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {gt === null ? "—" : `${soAn(gt, 1)}${hauTo} / ${soAn(mucMax, 0)}${hauTo}`}
        </span>
      </div>
      <div className="h-1.5 rounded-sm overflow-hidden" style={{ background: "#211F1A" }}>
        <div className="h-full" style={{ width: `${rong}%`, background: "#E8873A" }} />
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
      ? { nhan: "Xanh", mau: "#5FCF8A" }
      : row.gg_bot !== null && row.gia < row.gg_bot
      ? { nhan: "Đỏ", mau: "#E86A6A" }
      : { nhan: "Trung tính", mau: "#A8A296" };

  const xuHuong =
    row.trend > 0.5
      ? { nhan: "Tăng", mau: "#5FCF8A" }
      : row.trend < -0.5
      ? { nhan: "Giảm", mau: "#E86A6A" }
      : { nhan: "Sideway", mau: "#E8C873" };

  const dongTien =
    row.dt > 0.2
      ? { nhan: "Ủng hộ", mau: "#5FCF8A" }
      : row.dt < -0.2
      ? { nhan: "Rút ra", mau: "#E86A6A" }
      : { nhan: "Trung tính", mau: "#A8A296" };

  const adxSucManh =
    row.adx === null ? { nhan: "—", mau: "#6F6C64" } : row.adx >= 40 ? { nhan: "Mạnh", mau: "#5FCF8A" } : row.adx >= 20 ? { nhan: "Trung bình", mau: "#E8C873" } : { nhan: "Yếu", mau: "#A8A296" };

  return { vung, xuHuong, dongTien, adxSucManh };
}

// Tim 2 muc ho tro gan nhat (duoi gia) va 2 muc khang cu gan nhat (tren gia)
// tu 4 duong tham chieu da tinh trong AFL (Kijun, may Giao Gam, dinh 52 tuan).
function tinhVungGia(row) {
  const gia = Number(row.gia);
  const cacMuc = [row.kijun, row.gg_top, row.gg_bot, row.dinh_52t]
    .map((v) => (v === null || v === undefined ? null : Number(v)))
    .filter((v) => v !== null && Number.isFinite(v));
  const khangCu = cacMuc.filter((v) => v > gia).sort((a, b) => a - b);
  const hoTro = cacMuc.filter((v) => v <= gia).sort((a, b) => b - a);
  return { hoTro1: hoTro[0] ?? null, hoTro2: hoTro[1] ?? null, khangCu1: khangCu[0] ?? null, khangCu2: khangCu[1] ?? null };
}

export default function ChiTietMa({ row }) {
  const vungGia = tinhVungGia(row);
  const khoangCach = (muc) => (muc === null || !row.gia ? null : ((muc - row.gia) / row.gia) * 100);
  const tag = tinhCacTag(row);
  const mauDiem = row.diem >= 0 ? "#5FCF8A" : "#E86A6A";

  return (
    <div className="max-w-5xl mx-auto px-6 pt-8 pb-16" style={{ color: "#EDE7DD" }}>
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/lenh-mo"
          className="inline-flex items-center gap-1 text-xs"
          style={{ color: "#A8A296", fontFamily: "'JetBrains Mono', monospace" }}
        >
          <ArrowLeft size={13} /> quay lại lệnh đang mở
        </Link>
        <span className="text-xs" style={{ color: "#6F6C64", fontFamily: "'JetBrains Mono', monospace" }}>
          {row.cap_nhat_luc ? `cập nhật lúc ${new Date(row.cap_nhat_luc).toLocaleString("vi-VN")}` : "dữ liệu mẫu"}
        </span>
      </div>

      {/* 3 CARD CHINH: DIEM - KET LUAN - BREAKDOWN */}
      <div className="grid sm:grid-cols-[180px_1fr_1fr] gap-4 mb-4">
        <Card className="flex flex-col items-start">
          <div
            className="border rounded px-3 py-1.5 mb-4"
            style={{ borderColor: VIEN, fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "20px", color: "#EDE7DD" }}
          >
            {row.ma}
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: mauDiem, fontSize: "40px", lineHeight: 1 }}>
            {soAn(row.diem)}
          </p>
          <p className="text-xs mt-1 mb-3" style={{ color: "#6F6C64" }}>
            điểm hợp lưu
          </p>
          <SignalPill tin={row.tin} />
          <div className="mt-4 pt-4 border-t w-full" style={{ borderColor: VIEN }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", color: "#5FCF8A" }} className="text-base">
              {fmt(row.gia)}
            </p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", color: row.doi >= 0 ? "#5FCF8A" : "#E86A6A" }} className="text-xs">
              {pct(row.doi, 2)}
            </p>
          </div>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#E8873A" }}>
            ★ Kết luận {row.ma}
          </p>
          <p className="text-base font-semibold leading-snug mb-2" style={{ color: mauDiem }}>
            Có điểm hợp lưu {soAn(row.diem)}
            {row.diem >= TREND_MAX ? ", mức mạnh" : row.diem <= -TREND_MAX ? ", mức yếu" : ", mức trung bình"}.
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "#A8A296" }}>
            {ketLuanTuDong(row)}
          </p>
          <div className="flex flex-wrap gap-2">
            <TagInfo nhan="Vùng" giaTri={tag.vung.nhan} mau={tag.vung.mau} />
            <TagInfo nhan="Xu hướng" giaTri={tag.xuHuong.nhan} mau={tag.xuHuong.mau} />
            <TagInfo nhan="Dòng tiền" giaTri={tag.dongTien.nhan} mau={tag.dongTien.mau} />
            <TagInfo nhan="Sức mạnh ADX" giaTri={tag.adxSucManh.nhan} mau={tag.adxSucManh.mau} />
          </div>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "#6F6C64" }}>
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

      {/* VUNG GIA - DINH GIA - CAU CHUYEN, 3 CARD NGANG GIONG MAU */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <Card>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "#6F6C64" }}>
            Vùng giá quan trọng
          </p>
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="rounded p-2" style={{ background: "#14120F" }}>
              <p className="text-[10px] uppercase mb-1" style={{ color: "#6F6C64" }}>
                Hỗ trợ
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }} className="text-sm">
                {fmt(vungGia.hoTro1)}
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#6F6C64" }} className="text-xs">
                {fmt(vungGia.hoTro2)}
              </p>
            </div>
            <div className="rounded p-2" style={{ background: "#14120F" }}>
              <p className="text-[10px] uppercase mb-1" style={{ color: "#6F6C64" }}>
                Giá hiện tại
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#5FCF8A" }} className="text-sm">
                {fmt(row.gia)}
              </p>
            </div>
            <div className="rounded p-2" style={{ background: "#14120F" }}>
              <p className="text-[10px] uppercase mb-1" style={{ color: "#6F6C64" }}>
                Kháng cự
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }} className="text-sm">
                {fmt(vungGia.khangCu1)}
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", color: "#6F6C64" }} className="text-xs">
                {fmt(vungGia.khangCu2)}
              </p>
            </div>
          </div>
          <p className="text-[11px]" style={{ color: "#6F6C64" }}>
            Khoảng cách tới hỗ trợ 1: <strong style={{ color: "#EDE7DD" }}>{pct(khoangCach(vungGia.hoTro1), 2)}</strong>
            {"  ·  "}
            tới kháng cự 1: <strong style={{ color: "#EDE7DD" }}>{pct(khoangCach(vungGia.khangCu1), 2)}</strong>
          </p>
        </Card>

        <CardDangCapNhat tieuDe="Định giá tham khảo" />
        <CardDangCapNhat tieuDe="Câu chuyện kỳ vọng" />
      </div>

      {/* THONG KE HIEU SUAT - du lieu minh hoa, chua noi backtest that theo tung ma */}
      <p className="text-xs mb-3" style={{ color: "#6F6C64" }}>
        Dữ liệu minh hoạ bên dưới — chưa nối lịch sử backtest thật theo từng mã.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-6 border-y mb-10" style={{ borderColor: VIEN }}>
        {[
          ["Tổng giao dịch", statMau.tongGiaoDich, ""],
          ["Đang mở", statMau.dangMo, ""],
          ["Lãi/lỗ TB lệnh mở", pct(statMau.laiLoTBMo), ""],
          ["Tỷ lệ lãi", statMau.tyLeLai + "%", "#5FCF8A"],
          ["Lãi/lỗ TB mỗi lệnh", pct(statMau.laiLoTBLenh), "#5FCF8A"],
          ["Lợi nhuận lũy kế", pct(statMau.luyKe), "#E8873A"],
        ].map(([label, val, color], i) => (
          <div key={label} className="p-4" style={{ borderLeft: i === 0 ? "none" : `1px solid ${VIEN}` }}>
            <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "#6F6C64" }}>
              {label}
            </p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: color || "#EDE7DD" }} className="text-lg">
              {val}
            </p>
          </div>
        ))}
      </div>

      {/* LICH SU GIAO DICH */}
      <h2 className="text-lg mb-4" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600 }}>
        Lịch sử giao dịch ({tradeHistoryMau.length} lệnh)
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <thead>
            <tr className="text-left border-b" style={{ borderColor: VIEN, color: "#6F6C64" }}>
              <th className="py-2 pr-4 font-normal">Ngày mua</th>
              <th className="py-2 pr-4 font-normal">Giá mua</th>
              <th className="py-2 pr-4 font-normal">Ngày bán</th>
              <th className="py-2 pr-4 font-normal">Giá bán</th>
              <th className="py-2 pr-4 font-normal">Phiên</th>
              <th className="py-2 pr-4 font-normal text-right">Lãi/Lỗ</th>
              <th className="py-2 font-normal text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {tradeHistoryMau.map((t, i) => (
              <tr key={i} className="border-b" style={{ borderColor: "#211F1A" }}>
                <td className="py-2.5 pr-4">{t.ngayMua}</td>
                <td className="py-2.5 pr-4">{fmt(t.giaMua)}</td>
                <td className="py-2.5 pr-4">{t.ngayBan}</td>
                <td className="py-2.5 pr-4">{fmt(t.giaBan)}</td>
                <td className="py-2.5 pr-4">{t.phien}</td>
                <td className="py-2.5 pr-4 text-right font-bold" style={{ color: t.laiLo >= 0 ? "#5FCF8A" : "#E86A6A" }}>
                  {pct(t.laiLo)}
                </td>
                <td className="py-2.5 text-right">
                  <span className="text-xs px-2 py-0.5" style={{ background: "#211F1A", color: "#A8A296" }}>
                    {t.trangThai === "DA_DONG" ? "Đã đóng" : "Đang mở"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
