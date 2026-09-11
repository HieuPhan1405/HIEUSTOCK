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
          {gt === null ? "—" : `${gt > 0 ? "+" : ""}${soAn(gt)}`}
        </span>
      </div>
      <div className="relative h-1.5" style={{ background: "#211F1A" }}>
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
        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{gt === null ? "—" : soAn(gt, 1) + hauTo}</span>
      </div>
      <div className="h-1.5" style={{ background: "#211F1A" }}>
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

  return `${cauMo} — điểm hợp lưu ${soAn(row.diem)}, cổ phiếu đang ${xuHuong}, ${dongTien}.`;
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

  return (
    <div className="max-w-5xl mx-auto px-6 pt-8 pb-16" style={{ color: "#EDE7DD" }}>
      <Link
        href="/lenh-mo"
        className="inline-flex items-center gap-1 text-xs mb-6"
        style={{ color: "#A8A296", fontFamily: "'JetBrains Mono', monospace" }}
      >
        <ArrowLeft size={13} /> quay lại lệnh đang mở
      </Link>

      <div className="flex items-baseline gap-3 mb-1">
        <h1 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700 }} className="text-3xl">
          {row.ma}
        </h1>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#5FCF8A" }} className="text-lg">
          {fmt(row.gia)}
        </span>
        <span
          style={{ fontFamily: "'JetBrains Mono', monospace", color: row.doi >= 0 ? "#5FCF8A" : "#E86A6A" }}
          className="text-sm"
        >
          {pct(row.doi, 2)}
        </span>
      </div>
      <p className="text-sm mb-8" style={{ color: "#6F6C64" }}>
        {row.cap_nhat_luc ? `cập nhật lúc ${new Date(row.cap_nhat_luc).toLocaleString("vi-VN")}` : "dữ liệu mẫu"}
      </p>

      {/* DIEM HOP LUU + BREAKDOWN */}
      <div className="grid sm:grid-cols-[140px_1fr_1fr] gap-6 border-y py-6 mb-10" style={{ borderColor: "#2A2620" }}>
        <div>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              color: row.diem >= 0 ? "#5FCF8A" : "#E86A6A",
              fontSize: "40px",
              lineHeight: 1,
            }}
          >
            {soAn(row.diem)}
          </p>
          <p className="text-xs mt-1" style={{ color: "#6F6C64" }}>
            điểm hợp lưu
          </p>
          <div className="mt-2">
            <SignalPill tin={row.tin} />
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#6F6C64" }}>
            Kết luận
          </p>
          <p className="text-sm leading-relaxed">{ketLuanTuDong(row)}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#6F6C64" }}>
            Vì sao {row.diem >= 0 ? "được" : "bị trừ"} {soAn(row.diem)} điểm?
          </p>
          <ThanhDiem nhan="Trend (x1.5)" giaTri={row.trend} mucMax={TREND_MAX} />
          <ThanhDiem nhan="Momentum (x1.0)" giaTri={row.mom} mucMax={MOM_MAX} />
          <ThanhDiem nhan="Dòng tiền (x1.2)" giaTri={row.dt} mucMax={DT_MAX} />
          <ThanhMotChieu nhan="ADX (sức mạnh xu hướng)" giaTri={row.adx} mucMax={60} />
          <ThanhDiem nhan="RS so với VNI (20 phiên, %)" giaTri={row.rs_vni} mucMax={RS_MAX} />
          <ThanhMotChieu nhan="Breadth ngành (%)" giaTri={row.breadth_nganh} mucMax={100} hauTo="%" />
        </div>
      </div>

      {/* VUNG GIA QUAN TRONG */}
      <h2 className="text-lg mb-4" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600 }}>
        Vùng giá quan trọng
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 border-y mb-10" style={{ borderColor: "#2A2620" }}>
        {[
          ["Hỗ trợ 2", vungGia.hoTro2],
          ["Hỗ trợ 1", vungGia.hoTro1],
          ["Giá hiện tại", row.gia],
          ["Kháng cự 1", vungGia.khangCu1],
          ["Kháng cự 2", vungGia.khangCu2],
        ].map(([label, val], i) => (
          <div key={label} className="p-4" style={{ borderLeft: i === 0 ? "none" : "1px solid #2A2620" }}>
            <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "#6F6C64" }}>
              {label}
            </p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }} className="text-lg">
              {fmt(val)}
            </p>
            {label !== "Giá hiện tại" && val !== null && (
              <p className="text-[11px] mt-0.5" style={{ color: "#6F6C64" }}>
                {pct(khoangCach(val), 2)}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* THONG KE HIEU SUAT - du lieu minh hoa, chua noi backtest that theo tung ma */}
      <p className="text-xs mb-3" style={{ color: "#6F6C64" }}>
        Dữ liệu minh hoạ bên dưới — chưa nối lịch sử backtest thật theo từng mã.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-6 border-y mb-10" style={{ borderColor: "#2A2620" }}>
        {[
          ["Tổng giao dịch", statMau.tongGiaoDich, ""],
          ["Đang mở", statMau.dangMo, ""],
          ["Lãi/lỗ TB lệnh mở", pct(statMau.laiLoTBMo), ""],
          ["Tỷ lệ lãi", statMau.tyLeLai + "%", "#5FCF8A"],
          ["Lãi/lỗ TB mỗi lệnh", pct(statMau.laiLoTBLenh), "#5FCF8A"],
          ["Lợi nhuận lũy kế", pct(statMau.luyKe), "#E8873A"],
        ].map(([label, val, color], i) => (
          <div key={label} className="p-4" style={{ borderLeft: i === 0 ? "none" : "1px solid #2A2620" }}>
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
            <tr className="text-left border-b" style={{ borderColor: "#2A2620", color: "#6F6C64" }}>
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
