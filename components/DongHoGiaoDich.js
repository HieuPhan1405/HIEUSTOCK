"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const XANH = "#22C55E";
const VANG = "#FBBF24";

// KHUNG GIO VAO LENH (gio Viet Nam) - chi vao lenh MUA trong cac khung nay,
// tranh dat lenh o phien sang som/bien dong manh dau phien va giai doan cuoi
// phien. Doi gio o day neu muon chinh khung khac. LUU Y: chua tinh ngay le,
// ngay nghi Tet - nhung ngay do dong ho van tinh nhu ngay thuong.
const PHIEN_MO = 9 * 60; // 09:00 - moc "reset": phien moi bat dau, tin hieu ngay moi
const KHUNG_VAO_LENH = [
  { tu: 10 * 60 + 30, den: 11 * 60 + 30 },
  { tu: 14 * 60, den: 14 * 60 + 45 },
];
const TEN_THU = { Mon: "thứ Hai", Tue: "thứ Ba", Wed: "thứ Tư", Thu: "thứ Năm", Fri: "thứ Sáu", Sat: "thứ Bảy", Sun: "Chủ nhật" };

const dinhDangGio = (phut) => `${String(Math.floor(phut / 60)).padStart(2, "0")}:${String(phut % 60).padStart(2, "0")}`;

function conLai(giay) {
  const g = Math.max(0, Math.floor(giay));
  const h = Math.floor(g / 3600);
  const p = Math.floor((g % 3600) / 60);
  const s = g % 60;
  if (h > 0) return `${h}g ${String(p).padStart(2, "0")}p`;
  return `${p}p ${String(s).padStart(2, "0")}s`;
}

// Lay gio Viet Nam (khong phu thuoc mui gio may nguoi xem).
function layGioVN(d) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const lay = (loai) => parts.find((p) => p.type === loai)?.value;
  const gio = Number(lay("hour")) % 24;
  return { thu: lay("weekday"), gio, phut: Number(lay("minute")), giay: Number(lay("second")) };
}

function tinhTrangThai(d) {
  const { thu, gio, phut, giay } = layGioVN(d);
  const giayTrongNgay = gio * 3600 + phut * 60 + giay;
  const p = gio * 60 + phut;
  const cuoiTuan = thu === "Sat" || thu === "Sun";

  // Ngay giao dich ke tiep (de bao "reset" luc nao).
  const soNgayToi = thu === "Fri" ? 3 : thu === "Sat" ? 2 : 1;
  const ngayResetSauCung = thu === "Fri" || thu === "Sat" || thu === "Sun" ? "thứ Hai" : "ngày mai";

  if (cuoiTuan) {
    const toiThuHai = (thu === "Sat" ? 2 : 1) * 86400 - giayTrongNgay + PHIEN_MO * 60;
    return { mau: MUTED, nhan: "Thị trường nghỉ", chiTiet: `Phiên mới (reset) 09:00 thứ Hai — còn ${conLai(toiThuHai)}`, trongKhung: false, thu, gio, phut, giay };
  }
  if (p < PHIEN_MO) {
    return { mau: MUTED, nhan: "Chưa mở phiên", chiTiet: `Phiên mới (reset) lúc 09:00 — còn ${conLai(PHIEN_MO * 60 - giayTrongNgay)}`, trongKhung: false, thu, gio, phut, giay };
  }
  for (const k of KHUNG_VAO_LENH) {
    if (p >= k.tu && p < k.den) {
      return { mau: XANH, nhan: "ĐANG TRONG KHUNG VÀO LỆNH", chiTiet: `Còn ${conLai(k.den * 60 - giayTrongNgay)} (đến ${dinhDangGio(k.den)})`, trongKhung: true, thu, gio, phut, giay };
    }
  }
  const khungSau = KHUNG_VAO_LENH.find((k) => p < k.tu);
  if (khungSau) {
    return { mau: VANG, nhan: "Ngoài khung vào lệnh", chiTiet: `Khung tiếp theo ${dinhDangGio(khungSau.tu)} — còn ${conLai(khungSau.tu * 60 - giayTrongNgay)}`, trongKhung: false, thu, gio, phut, giay };
  }
  const toiReset = soNgayToi * 86400 - giayTrongNgay + PHIEN_MO * 60;
  return { mau: MUTED, nhan: "Hết khung vào lệnh hôm nay", chiTiet: `Phiên mới (reset) 09:00 ${ngayResetSauCung} — còn ${conLai(toiReset)}`, trongKhung: false, thu, gio, phut, giay };
}

export default function DongHoGiaoDich({ className = "" }) {
  const [bayGio, setBayGio] = useState(null);

  useEffect(() => {
    setBayGio(new Date());
    const t = setInterval(() => setBayGio(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!bayGio) {
    return <div className={`rounded-2xl border ${className}`} style={{ borderColor: VIEN, background: NEN_CARD, minHeight: 74 }} />;
  }

  const tt = tinhTrangThai(bayGio);
  const gioChuoi = `${String(tt.gio).padStart(2, "0")}:${String(tt.phut).padStart(2, "0")}:${String(tt.giay).padStart(2, "0")}`;

  return (
    <div className={`rounded-2xl border p-4 flex flex-wrap items-center gap-x-6 gap-y-2 ${className}`} style={{ borderColor: tt.trongKhung ? XANH : VIEN, background: NEN_CARD }}>
      <div className="flex items-center gap-3">
        <Clock size={20} color={tt.mau} strokeWidth={2} aria-hidden="true" />
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "22px", color: TEXT, lineHeight: 1 }}>{gioChuoi}</p>
          <p className="text-[11px] mt-1" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
            Giờ Việt Nam · {TEN_THU[tt.thu] || ""}
          </p>
        </div>
      </div>
      <div className="min-w-[200px] flex-1">
        <p className="text-sm" style={{ color: tt.mau, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
          {tt.nhan}
        </p>
        <p className="text-xs" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
          {tt.chiTiet}
        </p>
      </div>
      <p className="text-[11px] max-w-xs" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
        Chỉ vào lệnh MUA trong khung <b style={{ color: TEXT }}>{KHUNG_VAO_LENH.map((k) => `${dinhDangGio(k.tu)}–${dinhDangGio(k.den)}`).join(" · ")}</b>. Ngoài khung: theo dõi, chưa đặt lệnh.
      </p>
    </div>
  );
}
