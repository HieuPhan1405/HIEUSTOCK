"use client";

import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { KHUNG_VAO_LENH } from "@/lib/khungGioVaoLenh";

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

// DONG HO TREN THANH DAU CO DINH (moi trang): gio Viet Nam chay tung giay + trang thai khung vao lenh,
// bam vao de xem chi tiet (dem nguoc, cac khung gio). Truoc day la 1 the lon rieng o tung trang.
export default function DongHoGiaoDich({ className = "" }) {
  const [bayGio, setBayGio] = useState(null);
  const [mo, setMo] = useState(false);
  const goc = useRef(null);

  useEffect(() => {
    // Khoi tao sau khi mount (tranh lech gio giua server va trinh duyet), khong setState dong bo trong effect.
    const t0 = setTimeout(() => setBayGio(new Date()), 0);
    const t = setInterval(() => setBayGio(new Date()), 1000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (!mo) return;
    const dong = (e) => {
      if (e.type === "keydown" ? e.key === "Escape" : goc.current && !goc.current.contains(e.target)) setMo(false);
    };
    document.addEventListener("mousedown", dong);
    document.addEventListener("keydown", dong);
    return () => {
      document.removeEventListener("mousedown", dong);
      document.removeEventListener("keydown", dong);
    };
  }, [mo]);

  if (!bayGio) {
    return <div className={`rounded-lg border ${className}`} style={{ borderColor: VIEN, background: NEN_CARD, width: 96, height: 36 }} />;
  }

  const tt = tinhTrangThai(bayGio);
  const gioChuoi = `${String(tt.gio).padStart(2, "0")}:${String(tt.phut).padStart(2, "0")}:${String(tt.giay).padStart(2, "0")}`;

  return (
    <div ref={goc} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setMo((v) => !v)}
        aria-expanded={mo}
        aria-label={`Giờ Việt Nam ${gioChuoi} — ${tt.nhan}`}
        className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
        style={{ borderColor: tt.trongKhung ? XANH : VIEN, background: NEN_CARD }}
      >
        <Clock size={15} color={tt.mau} strokeWidth={2} aria-hidden="true" />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "13px", color: TEXT, lineHeight: 1 }}>{gioChuoi}</span>
        <span className="hidden lg:inline text-[11px]" style={{ color: tt.mau, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
          {tt.nhan}
        </span>
      </button>
      {mo && (
        <div
          className="absolute right-0 top-full mt-2 w-[320px] max-w-[calc(100vw-24px)] rounded-2xl border p-4 shadow-xl"
          style={{ borderColor: tt.trongKhung ? XANH : VIEN, background: NEN_CARD, zIndex: 40 }}
        >
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "22px", color: TEXT, lineHeight: 1 }}>{gioChuoi}</p>
          <p className="text-[11px] mt-1" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
            Giờ Việt Nam · {TEN_THU[tt.thu] || ""}
          </p>
          <p className="text-sm mt-3" style={{ color: tt.mau, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
            {tt.nhan}
          </p>
          <p className="text-xs" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
            {tt.chiTiet}
          </p>
          <p className="text-[11px] mt-3" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
            Chỉ vào lệnh MUA trong khung <b style={{ color: TEXT }}>{KHUNG_VAO_LENH.map((k) => `${dinhDangGio(k.tu)}–${dinhDangGio(k.den)}`).join(" · ")}</b>. Ngoài khung: theo dõi, chưa đặt lệnh.
          </p>
        </div>
      )}
    </div>
  );
}
