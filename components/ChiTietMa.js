"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import SignalPill from "@/components/SignalPill";
import BieuDoKyThuat from "@/components/BieuDoKyThuat";
import NhatKyGiaoDich from "@/components/NhatKyGiaoDich";
import XuatAnh from "@/components/XuatAnh";
import TheChiaSeMa from "@/components/TheChiaSeMa";
import DongTienMa from "@/components/DongTienMa";
import KhoiNgoaiMa from "@/components/KhoiNgoaiMa";
import PhanTichCoBan from "@/components/PhanTichCoBan";
import ThanhMucTrang from "@/components/ThanhMucTrang";
import NhanViTri120 from "@/components/NhanViTri120";
import GiaiNghia from "@/components/GiaiNghia";
import GiaiThichThem from "@/components/GiaiThichThem";
import { useTrongKhungVaoLenh } from "@/components/KhungGioContext";
import { KHUNG_VAO_LENH, muaDangTheoDoi } from "@/lib/khungGioVaoLenh";
import { lenhDangMo, ngayChuoi } from "@/lib/muaThemTinhToan";
import {
  fmt,
  fmtTy,
  pct,
  soAn,
  chamTPCaoNhat,
  chuoiKhoiLuong,
  nhanGiaiNgan,
  nhanLoaiVao,
  nhanMuaMoi,
  nhanBaoVeLai,
  nhanLyDoBan,
  laChoPhienSau,
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
  nhe,
  lyDoChuaCoDiemMua,
  NGUONG_DIEM_MUA,
} from "@/components/dungChung";

// Lich su giao dich + thong ke hieu suat tung ma: TAM THOI BO KHOI WEB theo
// yeu cau - file xuat tu AmiBroker (dan qua Excel) bi loi lam trong so thap
// phan (Price/Ex.Price bi Excel dinh lien thanh so nguyen khong dung duoc).
// Se lam lai khi co file xuat dung (dan qua Notepad thay vi Excel).

// Mau border/nen dung chung cho tat ca "card" trong trang - de mo phong bo
// cuc khoi vuong cua trang tham khao thay vi chi la dai phan cach nhu truoc.
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";

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

// Mau badge khuyen nghi - doan chu tu do (nhap tay o /quan-tri, moi CTCK goi khac nhau: "Mua",
// "Kha quan", "Tich luy"... hay "Ban", "Giam ty trong"...) nen chi doan theo tu khoa, khong ep 1
// danh sach co dinh. Khong doan duoc (rong/trung lap) -> mau trung tinh, van hien nguyen chu.
function mauKhuyenNghi(khuyenNghi) {
  const s = (khuyenNghi || "").toLowerCase();
  if (/mua|khả quan|kha quan|tích lũy|tich luy|tăng|tang/.test(s)) return "var(--xanh)";
  if (/bán|ban|giảm|giam|tiêu cực|tieu cuc/.test(s)) return "var(--do)";
  return "var(--mo)";
}

function CardDinhGia({ dinhGia }) {
  return (
    <Card>
      <p className="text-xs  mb-3" style={{ color: "var(--mo)" }} data-may="khuyen-nghi-ck">
        Khuyến nghị công ty chứng khoán
      </p>
      <table className="w-full text-sm" style={{ fontFamily: "var(--font-chu)" }}>
        <thead>
          <tr className="text-left" style={{ color: "var(--mo)" }}>
            <th className="font-normal pb-1">Công ty CK</th>
            <th className="font-normal pb-1">Ngày</th>
            <th className="font-normal pb-1">Khuyến nghị</th>
            <th className="font-normal pb-1 text-right">Giá mục tiêu</th>
          </tr>
        </thead>
        <tbody>
          {dinhGia.map((d) => (
            <tr key={d.id} className="border-t" style={{ borderColor: "var(--vien-nhe)" }}>
              <td className="py-1.5">{d.cong_ty_ck}</td>
              <td className="py-1.5" style={{ color: "var(--mo)" }}>
                {d.ngay_dinh_gia ? new Date(d.ngay_dinh_gia).toLocaleDateString("vi-VN") : "—"}
              </td>
              <td className="py-1.5 font-bold" style={{ color: mauKhuyenNghi(d.khuyen_nghi) }}>
                {d.khuyen_nghi || "—"}
              </td>
              <td className="py-1.5 text-right" style={{ fontWeight: 700 }}>
                {fmt(d.gia_muc_tieu)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] mt-3" style={{ color: "var(--mo-3)" }}>
        Báo cáo mới nhất của mỗi công ty chứng khoán — không phải khuyến nghị của CloudStock.
      </p>
    </Card>
  );
}

function CardCauChuyen({ cauChuyen }) {
  const nhomTheoLoai = { dong_luc: [], theo_doi: [], rui_ro: [] };
  cauChuyen.forEach((c) => nhomTheoLoai[c.loai]?.push(c));
  const nhan = { dong_luc: { chu: "Động lực", mau: "var(--xanh)" }, theo_doi: { chu: "Theo dõi", mau: "var(--vang)" }, rui_ro: { chu: "Rủi ro", mau: "var(--do)" } };
  return (
    <Card>
      <p className="text-xs  mb-3" style={{ color: "var(--mo)" }} data-may="cau-chuyen">
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
                <p key={c.id} className="text-sm mb-1" style={{ color: "var(--mo-2)" }}>
                  {c.noi_dung}
                  {c.ngay && (
                    <span className="text-[11px]" style={{ color: "var(--mo)" }}>
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


function BannerMatThan() {
  return (
    <div
      className="rounded-2xl border p-4 mb-4 flex items-center gap-3"
      style={{ borderColor: "var(--do)", background: "var(--do-nen)" }}
    >
      <TriangleAlert size={22} color="var(--do)" strokeWidth={2} aria-hidden="true" className="shrink-0" />
      <div>
        <p style={{ fontWeight: 700, color: "var(--do)" }} className="text-sm">
          Cảnh báo Mắt Thần
        </p>
        <p className="text-xs" style={{ color: "var(--do-chu)" }}>
          Giá đã phá đỉnh trên mây nhưng quay lại kiểm định mà không bật lên được qua đường xu hướng ngắn hạn — rủi ro đảo chiều, cân nhắc bán ngay.
        </p>
      </div>
    </div>
  );
}


function TagInfo({ nhan, giaTri, mau }) {
  return (
    <span
      data-may={`tag-${nhan}`}
      className="px-2.5 py-1 text-xs rounded-full border"
      style={{ borderColor: mau || VIEN, color: mau || "var(--mo-2)", fontFamily: "var(--font-chu)" }}
    >
      <GiaiNghia khoa={`tag-${nhan}`}>{nhan}</GiaiNghia>: <strong>{giaTri}</strong>
    </span>
  );
}

// Thanh diem 2 chieu (am/duong quanh 0) - dung cho Trend/Momentum/Dong tien/RS
const MAY_THANH = { "Xu hướng (Trend)": "bd-trend", "Động lượng (Momentum)": "bd-mom", "Dòng tiền": "bd-dt", "ADX (sức mạnh xu hướng)": "bd-adx", "Breadth ngành (%)": "bd-breadth" };
const mayThanh = (nhan) => MAY_THANH[nhan] ?? (nhan.startsWith("RS so với VNI") ? "rs" : undefined);

function ThanhDiem({ nhan, hien, khoa, giaTri, mucMax }) {
  const gt = giaTri === null || giaTri === undefined ? null : Number(giaTri);
  const duong = gt !== null && gt >= 0;
  const rongNua = gt === null ? 0 : Math.min(50, (Math.abs(gt) / mucMax) * 50);
  return (
    <div className="mb-3" data-may={mayThanh(nhan)}>
      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--mo-2)" }}>
        <span>{khoa ? <GiaiNghia khoa={khoa}>{hien ?? nhan}</GiaiNghia> : hien ?? nhan}</span>
        <span
          style={{
            fontFamily: "var(--font-chu)",
            color: gt === null ? "var(--mo)" : duong ? "var(--xanh)" : "var(--do)",
          }}
        >
          {gt === null ? "—" : `${gt > 0 ? "+" : ""}${soAn(gt)} / ${soAn(mucMax, 1)}`}
        </span>
      </div>
      <div className="relative h-1.5 rounded-sm overflow-hidden" style={{ background: "var(--vien-nhe)" }}>
        <div className="absolute top-0 bottom-0" style={{ left: "50%", width: "1px", background: "var(--vien)" }} />
        {gt !== null && (
          <div
            className="absolute top-0 bottom-0"
            style={{
              background: duong ? "var(--xanh)" : "var(--do)",
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
function ThanhMotChieu({ nhan, hien, khoa, giaTri, mucMax, hauTo = "" }) {
  const gt = giaTri === null || giaTri === undefined ? null : Number(giaTri);
  const rong = gt === null ? 0 : Math.min(100, Math.max(0, (gt / mucMax) * 100));
  return (
    <div className="mb-3" data-may={mayThanh(nhan)}>
      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--mo-2)" }}>
        <span>{khoa ? <GiaiNghia khoa={khoa}>{hien ?? nhan}</GiaiNghia> : hien ?? nhan}</span>
        <span style={{ fontFamily: "var(--font-chu)" }}>
          {gt === null ? "—" : `${soAn(gt, 1)}${hauTo} / ${soAn(mucMax, 0)}${hauTo}`}
        </span>
      </div>
      <div className="h-1.5 rounded-sm overflow-hidden" style={{ background: "var(--vien-nhe)" }}>
        <div className="h-full" style={{ width: `${rong}%`, background: "#6C5CE7" }} />
      </div>
    </div>
  );
}

function ketLuanTuDong(row) {
  const lyDoBan = nhanLyDoBan(row);
  const cauMo = {
    MUA: "Đang phát tín hiệu MUA",
    BAN: lyDoBan ? `Lệnh vừa kết thúc (${lyDoBan.nhan.toLowerCase()})` : "Đang phát tín hiệu BÁN",
    "TRUNG LAP": row.ket_thuc_tp3 ? "Lệnh trước đã chốt lời đủ mục tiêu và kết thúc, không còn nắm vị thế (trung lập)" : "Chưa đủ điều kiện vào lệnh, đang trung lập",
    "NAM GIU": "Đang nắm giữ vị thế mở",
  }[row.tin] || "Chưa đủ điều kiện vào lệnh, đang trung lập";
  // Lenh web giu (da mua trong khung, tin hieu mat, chua cham cat lo trong khung) - van dang nam giu du he thong bao trung lap / ban.
  const coLenhWeb = Array.isArray(row.lenh_web) && row.lenh_web.length > 0 && row.tin !== "MUA" && row.tin !== "NAM GIU";
  const cauMoCuoi = coLenhWeb ? "Đang nắm giữ lệnh web giữ (hệ thống đã thoát nhưng giá chưa chạm cắt lỗ trong khung giờ)" : cauMo;

  const xuHuong = row.trend > 0.5 ? "xu hướng tăng" : row.trend < -0.5 ? "xu hướng giảm" : "đi ngang";
  const dongTien = row.dt > 0.2 ? "dòng tiền đang ủng hộ" : row.dt < -0.2 ? "dòng tiền đang rút ra" : "dòng tiền trung tính";

  return `${cauMoCuoi}, cổ phiếu đang ${xuHuong}, ${dongTien}.`;
}

// Cac tag tom tat nhanh - mo phong hang the mau cua trang tham khao
// ("Vùng: Xanh", "Xu hướng: Sideway"...), tinh tu du lieu da co san.
function tinhCacTag(row) {
  const vung =
    row.gg_top !== null && row.gia > row.gg_top
      ? { nhan: "Xanh", mau: "var(--xanh)" }
      : row.gg_bot !== null && row.gia < row.gg_bot
      ? { nhan: "Đỏ", mau: "var(--do)" }
      : { nhan: "Trung tính", mau: "var(--mo-2)" };

  const xuHuong =
    row.trend > 0.5
      ? { nhan: "Tăng", mau: "var(--xanh)" }
      : row.trend < -0.5
      ? { nhan: "Giảm", mau: "var(--do)" }
      : { nhan: "Sideway", mau: "var(--vang)" };

  const dongTien =
    row.dt > 0.2
      ? { nhan: "Ủng hộ", mau: "var(--xanh)" }
      : row.dt < -0.2
      ? { nhan: "Rút ra", mau: "var(--do)" }
      : { nhan: "Trung tính", mau: "var(--mo-2)" };

  const adxSucManh =
    row.adx === null ? { nhan: "—", mau: "var(--mo)" } : row.adx >= 40 ? { nhan: "Mạnh", mau: "var(--xanh)" } : row.adx >= 20 ? { nhan: "Trung bình", mau: "var(--vang)" } : { nhan: "Yếu", mau: "var(--mo-2)" };

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

const ngayNgan = (v) => {
  const n = ngayChuoi(v);
  return n ? `${n.slice(8, 10)}/${n.slice(5, 7)}` : "—";
};

// THANH NGANG cac LENH DANG MO cua ma (moi lenh 1 dong rieng, danh so (1), (2)...): chon 1 lenh de xem/tinh gia mua, Stop-loss, TP, lai/lo, bieu do... theo dung lenh do. Chi hien khi ma co tu 2 lenh.
function ThanhChonLenh({ cacLenh, chon, datChon }) {
  if (cacLenh.length < 2) return null;
  return (
    <div className="mb-4 rounded-2xl border p-3" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-xs  mb-2" style={{ color: "var(--mo)" }} data-may="chon-lenh">
        Các lệnh đang mở của mã · chọn 1 lệnh để xem giá mua, cắt lỗ, chốt lời và lãi/lỗ theo đúng lệnh đó
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Chọn lệnh của mã">
        {cacLenh.map((l, i) => {
          const dangChon = i === chon;
          return (
            <button
              key={l.khoa_lenh}
              type="button"
              role="tab"
              aria-selected={dangChon}
              onClick={() => datChon(i)}
              className="shrink-0 text-left rounded-xl border px-3 py-2"
              style={dangChon ? { borderColor: "#6C5CE7", background: "rgba(108,92,231,0.15)" } : { borderColor: VIEN, background: "transparent" }}
            >
              <span className="block text-sm font-bold" style={{ fontFamily: "var(--font-chu)" }}>
                {l.ten_lenh}
                {l.la_lenh_moi ? <span style={{ color: "var(--cyan)" }}> · Mua mới</span> : ""}
                {l.lenh_web === true ? <span style={{ color: "var(--vang)" }}> · Web giữ</span> : ""}
              </span>
              <span className="block text-[11px]" style={{ color: "var(--mo)", fontFamily: "var(--font-chu)" }}>
                mua {ngayNgan(l.ngay_mua)} · giá {fmt(l.gia_mua)}
              </span>
              <span className="block text-xs font-bold" style={{ fontFamily: "var(--font-chu)", color: l.lai_lo_pct >= 0 ? "var(--xanh)" : "var(--do)" }}>
                {pct(l.lai_lo_pct, 2)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// NEN LAM GI: 1 cau tra loi ngan theo tin hieu hien tai cua he thong (row + lenh dang xem). Chi la cach DOC tin hieu, khong them quy tac moi.
// Thu tu: MUA -> dang giu (NAM GIU / web giu) -> BAN -> con lenh Mua moi -> cho phien sau -> da xong TP3 -> dung ngoai.
function nenLamGi(row, lenh, vungLenh) {
  const webGiu = Array.isArray(row.lenh_web) && row.lenh_web.length > 0 && row.tin !== "MUA" && row.tin !== "NAM GIU";
  if (row.tin === "MUA") {
    const tt = vungLenh?.mua?.trangThai;
    if (tt === "tren") return { cau: "Có tín hiệu MUA nhưng giá đã vượt vùng mua — chờ giá hồi về, không đuổi giá", mau: "var(--vang)" };
    return { cau: tt === "trong" ? "Có tín hiệu MUA — giá đang trong vùng mua" : "Có tín hiệu MUA", mau: "var(--xanh)" };
  }
  if (row.tin === "NAM GIU" || webGiu) {
    if (vungLenh?.sl?.trangThai === "cham") return { cau: "Giá đang chạm mức cắt lỗ — chuẩn bị bán theo kỷ luật cắt lỗ", mau: "var(--do)" };
    return { cau: "Đang nắm giữ — giữ tiếp, bán khi chạm cắt lỗ hoặc có tín hiệu BÁN", mau: "var(--vang)" };
  }
  if (row.tin === "BAN") return { cau: "Tín hiệu BÁN — thoát lệnh nếu đang giữ", mau: "var(--do)" };
  if (lenh) return { cau: "Đang có lệnh Mua mới — giữ theo mức cắt lỗ và chốt lời của lệnh", mau: "var(--vang)" };
  if (laChoPhienSau(row)) return { cau: "Đã đạt điểm MUA, chờ phiên sau xác nhận khối lượng", mau: "var(--vang)" };
  if (row.ket_thuc_tp3) return { cau: "Lệnh trước đã chạm TP3 và kết thúc — đứng ngoài, chờ tín hiệu MUA mới", mau: "var(--chu)" };
  return { cau: "Chưa mua — đứng ngoài, chờ hệ thống báo MUA", mau: "var(--chu)" };
}

// Boi canh 1 cau (khong lap lai trang thai lenh - da noi o "Nen lam gi").
function boiCanhNgan(row) {
  const xuHuong = row.trend > 0.5 ? "xu hướng tăng" : row.trend < -0.5 ? "xu hướng giảm" : "đi ngang";
  const dongTien = row.dt > 0.2 ? "dòng tiền đang vào" : row.dt < -0.2 ? "dòng tiền đang rút ra" : "dòng tiền trung tính";
  return `Cổ phiếu đang ${xuHuong}, ${dongTien}.`;
}

const hh = (phut) => `${String(Math.floor(phut / 60)).padStart(2, "0")}:${String(phut % 60).padStart(2, "0")}`;
const CHU_KHUNG = KHUNG_VAO_LENH.map((k) => `${hh(k.tu)}–${hh(k.den)}`).join(", ");

// O so lieu chinh cua lenh (gia mua / lai lo / cat lo / chot loi tiep)
function OSo({ nhan, khoa, may, giaTri, phu, mau }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "var(--nen)" }} data-may={may}>
      <p className="text-xs mb-1" style={{ color: "var(--mo)" }}>
        {khoa ? <GiaiNghia khoa={khoa}>{nhan}</GiaiNghia> : nhan}
      </p>
      <p className="text-base font-bold leading-tight" style={{ fontFamily: "var(--font-chu)", color: mau ?? "var(--chu)" }}>
        {giaTri}
      </p>
      {phu && (
        <p className="text-xs mt-1" style={{ color: "var(--mo)" }}>
          {phu}
        </p>
      )}
    </div>
  );
}

// Dong thong tin co phieu (nhan co giai nghia ben trai, gia tri ben phai)
function DongThongTin({ nhan, khoa, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0 text-sm" style={{ borderColor: "var(--vien-nhe)" }}>
      <span style={{ color: "var(--mo-2)" }}>{khoa ? <GiaiNghia khoa={khoa}>{nhan}</GiaiNghia> : nhan}</span>
      <span className="text-right" style={{ fontFamily: "var(--font-chu)", fontWeight: 600 }}>
        {children}
      </span>
    </div>
  );
}

// cac khoi cua trang ma theo thu tu doc: vung gia/cat lo/chot loi -> bieu do -> dong tien -> nhat ky -> co ban -> khuyen nghi CTCK
const MUC_TRANG = [
  { id: "muc-vung-gia", nhan: "Vùng giá" },
  { id: "muc-bieu-do", nhan: "Biểu đồ" },
  { id: "muc-dong-tien", nhan: "Dòng tiền" },
  { id: "muc-nhat-ky", nhan: "Nhật ký lệnh" },
  { id: "muc-co-ban", nhan: "Phân tích cơ bản" },
  { id: "muc-khuyen-nghi", nhan: "Khuyến nghị" },
];

// THU TU DOC (04/11/2026, cho nguoi moi): ten + gia -> "Nen lam gi" (1 cau + so lieu lenh neu dang giu) -> diem hop luu va ly do | thong tin co phieu -> vung gia
// (cat lo / chot loi CHI hien khi dang co lenh: ma trung lap khong con hien muc cat lo / TP cu cua lenh da dong) -> bieu do -> ...
export default function ChiTietMa({ row, dinhGia = [], cauChuyen = [], lichSuDaDong = [], lichPhien = [], phanTich = null }) {
  // Cac LENH DANG MO cua ma: moi lenh 1 dong rieng (gia mua, Stop-loss, TP, lai/lo rieng), danh so (1), (2) neu co nhieu lenh - xem lenhDangMo. Chon 1 lenh o thanh ngang de xem
  // moi thu theo lenh do. vt = lenh dang xem (hoac chinh dong tin hieu khi ma khong giu lenh nao); row van la du lieu chung cua ma (diem, xu huong, trang thai...).
  const cacLenh = useMemo(() => lenhDangMo([row], lichPhien), [row, lichPhien]);
  const [chon, setChon] = useState(0);
  // Nen ngay cho BIEU DO trong anh chia se (components/TheChiaSeMa.js): tai 1 lan khi mo trang (cung nguon /api/gia-lich-su voi bieu do, co cache); loi thi anh chi thieu bieu do.
  const [nenAnh, setNenAnh] = useState(null);
  useEffect(() => {
    let huy = false;
    fetch(`/api/gia-lich-su?ma=${encodeURIComponent(row.ma)}&kt=D`)
      .then((r) => r.json())
      .then((d) => !huy && Array.isArray(d.nen) && setNenAnh(d.nen.slice(-80)))
      .catch(() => {});
    return () => {
      huy = true;
    };
  }, [row.ma]);
  const router = useRouter();
  const trongKhung = useTrongKhungVaoLenh();
  const lenh = cacLenh.length ? cacLenh[Math.min(chon, cacLenh.length - 1)] : null;
  const vt = lenh ?? row;
  const dangGiu = lenh != null;
  const vungGia = tinhVungGia(row);
  const vungLenh = tinhVungLenh(vt); // null neu khong dang giu
  const khoangCach = (muc) => (muc === null || muc === undefined || !row.gia ? null : ((muc - row.gia) / row.gia) * 100);
  const tag = tinhCacTag(row);
  const mauDiem = row.diem >= 0 ? "var(--xanh)" : "var(--do)";
  const nlg = nenLamGi(row, lenh, vungLenh);
  const webGiu = Array.isArray(row.lenh_web) && row.lenh_web.length > 0;
  const theoDoiMua = !webGiu && muaDangTheoDoi({ tin: row.tin, muaTheoDoiTu: row.mua_theo_doi_tu ?? null, daChotMua: row.da_chot_mua === true, trongKhung });
  const lyDoChua = lyDoChuaCoDiemMua(row);
  const mucDaCham = chamTPCaoNhat(vt); // "TP1"|"TP2"|"TP3"|null - da cham hay chua TUNG LUC NAO trong qua trinh giu
  const tpTiep = !mucDaCham ? ["TP1", vt.tp1] : mucDaCham === "TP1" ? ["TP2", vt.tp2] : mucDaCham === "TP2" ? ["TP3", vt.tp3] : null;
  const nhanPhu = [nhanLyDoBan(row), nhanMuaMoi(row), nhanBaoVeLai(row), nhanLoaiVao(row)].filter(Boolean);
  const coChiTietLenh = dangGiu && (vt.gia_mua_ghi_nhan || vt.che_do_vao === "MOI" || mocKichHoat(vt));
  const quayLai = () => (window.history.length > 1 ? router.back() : router.push("/bo-loc"));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-16" style={{ color: "var(--chu)" }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <button type="button" onClick={quayLai} className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--mo-2)", fontFamily: "var(--font-chu)" }}>
          <ArrowLeft size={15} /> Quay lại
        </button>
        {/* XUAT THONG TIN: tao anh day du thong tin cua ma (gia, tin hieu, lenh dang mo + lai/lo, diem mua - ban da qua, chi bao) de gui cho khach */}
        <XuatAnh
          nhan="Xuất ảnh"
          kieu="nho"
          tenFile={`CloudStock-${row.ma}-${new Date().toISOString().slice(0, 10)}.png`}
          tieuDe={`${row.ma} · CloudStock`}
          the={<TheChiaSeMa row={row} cacLenh={cacLenh} lichSuDaDong={lichSuDaDong} ketLuan={ketLuanTuDong(row)} vungGia={vungGia} tag={tag} nen={nenAnh} />}
        />
      </div>

      {/* TEN + GIA */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 mb-5">
        <div className="min-w-0">
          <h1 className="text-2xl leading-snug" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
            {row.ma}
            {row.ten_cong_ty && <span className="text-lg" style={{ fontWeight: 400, color: "var(--mo-2)" }}> — {row.ten_cong_ty}</span>}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--mo)" }}>
            {[row.san && `Sàn ${row.san}`, row.cap_nhat_luc ? `cập nhật ${new Date(row.cap_nhat_luc).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}` : "dữ liệu mẫu"].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
            {fmt(row.gia)}
          </span>
          <span className="text-base font-semibold" style={{ fontFamily: "var(--font-chu)", color: row.doi >= 0 ? "var(--xanh)" : "var(--do)" }}>
            {pct(row.doi, 2)}
          </span>
        </div>
      </div>

      {row.mat_than && <BannerMatThan />}

      {/* NEN LAM GI: cau tra loi ngan + so lieu lenh dang giu */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-sm" style={{ color: "var(--mo)" }} data-may="nen-lam-gi">
            <GiaiNghia khoa="nen-lam-gi">Nên làm gì với {row.ma}</GiaiNghia>
          </span>
          <SignalPill tin={row.tin} banTheoDoiTu={row.ban_theo_doi ? row.ban_theo_doi_tu : null} webGiu={webGiu} muaTheoDoiTu={row.mua_theo_doi_tu ?? null} daChotMua={row.da_chot_mua === true} />
          {nhanPhu.map((n) => (
            <span key={n.nhan} className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ color: n.mau, background: nhe(n.mau, 13) }} title={n.moTa}>
              {n.nhan}
            </span>
          ))}
          <NhanViTri120 row={row} className="text-xs font-semibold" />
        </div>
        <p className="text-lg sm:text-xl font-bold leading-snug mb-1.5" style={{ color: nlg.mau, fontFamily: "var(--font-chu)" }} data-may="ket-luan">
          {nlg.cau}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--chu-2)" }}>
          {boiCanhNgan(row)}
          {row.tin === "TRUNG LAP" && !dangGiu && !lyDoChua && row.diem != null && Number(row.diem) < NGUONG_DIEM_MUA && (
            <>
              {" "}
              Điểm hiện tại {soAn(row.diem)}; cần từ {soAn(NGUONG_DIEM_MUA)} trở lên <GiaiNghia khoa="dieu-kien-mua">cùng vài điều kiện khác</GiaiNghia> mới có tín hiệu MUA.
            </>
          )}
        </p>
        {theoDoiMua && (
          <p className="text-sm mt-2" style={{ color: "var(--vang)" }}>
            Đang ngoài khung giờ vào lệnh ({CHU_KHUNG}) — chỉ theo dõi; vào khung mà tín hiệu vẫn còn và giá trong vùng mua thì mới mua.
          </p>
        )}

        {dangGiu && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            {row.tin === "MUA" && vungLenh ? (
              <OSo
                nhan="Vùng mua"
                khoa="vung-mua"
                may="vung-mua"
                giaTri={chuoiVung(vungLenh.mua.tu, vungLenh.mua.den)}
                phu={vungLenh.mua.trangThai === "trong" ? "giá đang trong vùng" : vungLenh.mua.trangThai === "tren" ? "giá đã vượt vùng" : "giá đang dưới vùng"}
              />
            ) : (
              <OSo nhan="Giá mua" khoa="gia-mua" may="gia-mua" giaTri={fmt(vt.gia_mua)} phu={`${ngayNgan(vt.ngay_mua) !== "—" ? `mua ${ngayNgan(vt.ngay_mua)} · ` : ""}${vt.so_phien_giu === 0 ? "mua hôm nay" : `giữ ${vt.so_phien_giu ?? "—"} phiên`}`} />
            )}
            <OSo nhan="Lãi/lỗ" khoa="lai-lo" may="lai-lo" giaTri={pct(vt.lai_lo_pct, 2)} mau={vt.lai_lo_pct >= 0 ? "var(--xanh)" : "var(--do)"} phu={cacLenh.length > 1 ? `đang xem ${vt.ten_lenh}` : "chưa trừ phí"} />
            <OSo
              nhan="Cắt lỗ"
              khoa="cat-lo"
              may="cat-lo"
              giaTri={vungLenh?.sl ? chuoiVung(vungLenh.sl.tu, vungLenh.sl.den) : fmt(vt.stop_loss)}
              mau="var(--do)"
              phu={`${pct(khoangCach(vungLenh?.sl?.tu ?? vt.stop_loss), 1)} so với giá${vungLenh?.sl?.xa ? " · chỉ tham khảo" : ""}`}
            />
            <OSo
              nhan={tpTiep ? `Chốt lời tiếp (${tpTiep[0]})` : "Chốt lời"}
              khoa="tp"
              may="tp"
              giaTri={tpTiep ? fmt(tpTiep[1]) : "Đã chạm TP3"}
              mau="var(--xanh)"
              phu={tpTiep ? `${pct(khoangCach(tpTiep[1]), 1)} so với giá` : "giữ phần còn lại đến tín hiệu BÁN"}
            />
          </div>
        )}

        {nhanGiaiNgan(row) && (
          <p className="text-sm leading-relaxed mt-4 rounded-lg p-3" data-may="giai-ngan" style={{ color: nhanGiaiNgan(row).mau, background: "var(--phu)", border: `1px solid ${nhe(nhanGiaiNgan(row).mau, 33)}` }}>
            <b>{nhanGiaiNgan(row).nhan}:</b> {nhanGiaiNgan(row).moTa}
          </p>
        )}
        {lyDoChua && (
          <div className="text-sm leading-relaxed mt-4 rounded-lg p-3" data-may="chua-co-diem-mua" style={{ background: "var(--vang-nen)", border: "1px solid var(--vang-vien)", color: "var(--chu-2)" }}>
            <p className="font-bold mb-1" style={{ color: "var(--vang)" }}>
              {lyDoChua.nhan} (điểm {soAn(row.diem)} ≥ ngưỡng {soAn(NGUONG_DIEM_MUA)})
            </p>
            <ul className="list-disc pl-4 space-y-1">
              {lyDoChua.lyDo.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}
        {coChiTietLenh && (
          <GiaiThichThem tomTat="Cách tính giá mua và cắt lỗ của lệnh" className="mt-3">
            <div className="grid gap-1.5 text-xs" style={{ color: "var(--mo-2)" }}>
              {vt.gia_mua_ghi_nhan && (
                <p>
                  Giá mua {fmt(vt.gia_mua)} ghi nhận lúc {gioGhiNhan(vt)}, lãi/lỗ tính từ giá này.
                  {vt.sl_tp_ghi_nhan && " Mức cắt lỗ và chốt lời cũng giữ theo lúc đó."}
                </p>
              )}
              {vt.che_do_vao === "MOI" && <p>Vào lệnh tại mốc chuyển mua, mức cắt lỗ đặt theo cấu trúc giá (dưới mây / đường cân bằng dài hạn / đáy nến / Kijun).</p>}
              {mocKichHoat(vt) && (
                <p>
                  Mốc chuyển mua {fmt(mocKichHoat(vt).gia)}: {mocKichHoat(vt).nhan}
                  {mocKichHoat(vt).chenhPct != null && ` · giá mua ${mocKichHoat(vt).chenhPct >= 0 ? "cao" : "thấp"} hơn mốc ${soAn(Math.abs(mocKichHoat(vt).chenhPct), 1)}%`}. Giá mua của hệ thống lấy tại mốc này — chỉ đạt được nếu mua đúng lúc giá vượt mốc; mua sau thì so với vùng mua (tối đa +1%).
                </p>
              )}
            </div>
          </GiaiThichThem>
        )}
      </Card>

      {/* DIEM HOP LUU + LY DO  |  THONG TIN CO PHIEU */}
      <div className="grid md:grid-cols-[1.35fr_1fr] gap-4 mb-4">
        <Card>
          <p className="text-sm mb-1" style={{ color: "var(--mo)" }} data-may="diem">
            <GiaiNghia khoa="diem">Điểm hợp lưu</GiaiNghia>
          </p>
          <div className="flex items-baseline gap-2 mb-4">
            <span style={{ fontFamily: "var(--font-chu)", fontWeight: 700, color: mauDiem, fontSize: "36px", lineHeight: 1 }}>{soAn(row.diem)}</span>
            <span className="text-sm" style={{ color: "var(--mo-2)" }}>
              {row.diem >= TREND_MAX ? "mức mạnh" : row.diem <= -TREND_MAX ? "mức yếu" : "mức trung bình"} · ngưỡng MUA {soAn(NGUONG_DIEM_MUA)}
            </span>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--mo)" }} data-may="vi-sao-diem">
            Vì sao {row.ma} {row.diem >= 0 ? "được" : "bị trừ"} {soAn(row.diem)} điểm
          </p>
          <ThanhDiem nhan="Xu hướng (Trend)" hien="Xu hướng" khoa="bd-trend" giaTri={row.trend} mucMax={TREND_MAX} />
          <ThanhDiem nhan="Động lượng (Momentum)" hien="Động lượng" khoa="bd-mom" giaTri={row.mom} mucMax={MOM_MAX} />
          <ThanhDiem nhan="Dòng tiền" hien="Dòng tiền" khoa="bd-dt" giaTri={row.dt} mucMax={DT_MAX} />
          <ThanhMotChieu nhan="ADX (sức mạnh xu hướng)" hien="Sức mạnh xu hướng (ADX)" khoa="bd-adx" giaTri={row.adx} mucMax={60} />
          <ThanhDiem nhan="RS so với VNI (20 phiên, %)" hien="So với VN-Index 20 phiên (%)" khoa="rs" giaTri={row.rs_vni} mucMax={RS_MAX} />
          <ThanhMotChieu nhan="Breadth ngành (%)" hien="Độ khoẻ của ngành (%)" khoa="bd-breadth" giaTri={row.breadth_nganh} mucMax={100} hauTo="%" />
          {/* Diem phu: khong dung de ra lenh, backtest khong thay phan biet ro lenh tot / xau -> thu gon, bam moi mo. */}
          <details className="group mt-1">
            <summary data-may="xem-diem-phu" className="cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden text-xs underline decoration-dotted underline-offset-2" style={{ color: "var(--mo-2)" }}>
              <span className="group-open:hidden">Xem điểm phụ (tham khảo)</span>
              <span className="hidden group-open:inline">Thu gọn điểm phụ</span>
            </summary>
            <div className="flex flex-wrap gap-2 mt-2">
              {(() => {
                const chuan = kiemTraChuanUuTien(row);
                return <TagInfo nhan="Chuẩn ưu tiên" giaTri={chuan.dat ? "Đạt 4/4" : `${chuan.tieuChi.filter((t) => t.dat).length}/4`} mau={chuan.dat ? "var(--xanh)" : "var(--mo-2)"} />;
              })()}
              {row.sanyaku !== null && row.sanyaku !== undefined && <TagInfo nhan="Độ tin cậy" giaTri={`${row.sanyaku}/3`} mau={row.sanyaku >= 2 ? "var(--xanh)" : "var(--mo-2)"} />}
              {row.diem_rank !== null && row.diem_rank !== undefined && <TagInfo nhan="Rank" giaTri={`${soAn(row.diem_rank, 0)}/100`} mau="var(--mo-2)" />}
              {row.diem_confidence !== null && row.diem_confidence !== undefined && <TagInfo nhan="Confidence" giaTri={`${soAn(row.diem_confidence, 0)}/100`} mau="var(--mo-2)" />}
            </div>
            <p className="text-xs mt-2 leading-snug" style={{ color: "var(--mo-3)" }}>
              Các điểm phụ không dùng để ra lệnh. Backtest 11 năm cho thấy chúng không phân biệt rõ lệnh tốt và lệnh xấu, nên chỉ để tham khảo.
            </p>
          </details>
        </Card>

        <Card>
          <p className="text-sm mb-2" style={{ color: "var(--mo)" }}>
            Thông tin cổ phiếu
          </p>
          <DongThongTin nhan="Vùng giá" khoa="tag-Vùng">
            <span style={{ color: tag.vung.mau }}>{tag.vung.nhan}</span>
          </DongThongTin>
          <DongThongTin nhan="Sức mạnh xu hướng" khoa="tag-Sức mạnh ADX">
            {/* ADX chi do do manh, khong cho biet chieu -> khong to xanh / do, ghi kem chieu xu huong */}
            {tag.adxSucManh.nhan}
            {row.trend > 0.5 ? " · chiều tăng" : row.trend < -0.5 ? " · chiều giảm" : ""}
          </DongThongTin>
          <DongThongTin nhan="Khối lượng TB20" khoa="kl-tb20">
            {chuoiKhoiLuong(row.khoi_luong_tb20)}
          </DongThongTin>
          {row.gtgd_tb20 != null && (
            <DongThongTin nhan="Giá trị GD TB20" khoa="thanh-khoan">
              {fmtTy(row.gtgd_tb20)} tỷ/phiên
            </DongThongTin>
          )}
          {row.von_hoa_ty != null && (
            <DongThongTin nhan="Vốn hoá" khoa="von-hoa">
              {fmtTy(row.von_hoa_ty)} tỷ{row.von_hoa ? ` · ${row.von_hoa}` : ""}
            </DongThongTin>
          )}
          {row.free_float != null && (
            <DongThongTin nhan="Free float" khoa="free-float">
              {row.free_float}%{row.von_hoa_tu_do_ty != null ? ` (≈ ${fmtTy(row.von_hoa_tu_do_ty)} tỷ)` : ""}
            </DongThongTin>
          )}
          {(row.kumo_twist || row.ngay_bien_doi || (Array.isArray(row.chu_de) && row.chu_de.includes("dau_tu_cong"))) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {Array.isArray(row.chu_de) && row.chu_de.includes("dau_tu_cong") && <TagInfo nhan="Chủ đề" giaTri="Đầu tư công" mau="var(--cyan)" />}
              {row.kumo_twist && <TagInfo nhan="Mây tương lai" giaTri={row.kumo_twist === "TANG" ? "Sắp đổi chiều tăng" : "Sắp đổi chiều giảm"} mau={row.kumo_twist === "TANG" ? "var(--xanh)" : "var(--do)"} />}
              {row.ngay_bien_doi && <TagInfo nhan="Time Theory" giaTri="Ngày biến đổi" mau="var(--tim-nhat)" />}
            </div>
          )}
        </Card>
      </div>

      <ThanhMucTrang muc={MUC_TRANG} />

      {/* THANH CHON LENH: ma co nhieu lenh dang mo (lenh dau + cac lenh Mua moi) thi chon lenh de xem gia mua / SL / TP / lai lo / bieu do theo dung lenh do */}
      <ThanhChonLenh cacLenh={cacLenh} chon={Math.min(chon, Math.max(cacLenh.length - 1, 0))} datChon={setChon} />

      {/* VUNG GIA (+ CAT LO / 3 MOC CHOT LOI khi dang co lenh) */}
      <div id="muc-vung-gia" className={`grid gap-4 mb-4 scroll-mt-28 ${dangGiu ? "sm:grid-cols-2" : ""}`}>
        <Card>
          <p className="text-sm mb-3" style={{ color: "var(--mo)" }} data-may="vung-gia-qt">
            Vùng giá quan trọng
          </p>
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="rounded-lg p-2" style={{ background: "var(--nen)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--mo)" }}>
                <GiaiNghia khoa="ho-tro">Hỗ trợ</GiaiNghia>
              </p>
              <p style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }} className="text-sm">
                {fmt(vungGia.hoTro1)}
              </p>
              <p style={{ fontFamily: "var(--font-chu)", color: "var(--mo)" }} className="text-xs">
                {fmt(vungGia.hoTro2)}
              </p>
            </div>
            <div className="rounded-lg p-2" style={{ background: "var(--nen)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--mo)" }}>
                Giá hiện tại
              </p>
              <p style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }} className="text-sm">
                {fmt(row.gia)}
              </p>
            </div>
            <div className="rounded-lg p-2" style={{ background: "var(--nen)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--mo)" }}>
                <GiaiNghia khoa="khang-cu">
                  Kháng cự
                </GiaiNghia>
              </p>
              <p style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }} className="text-sm">
                {fmt(vungGia.khangCu1)}
              </p>
              <p style={{ fontFamily: "var(--font-chu)", color: "var(--mo)" }} className="text-xs">
                {fmt(vungGia.khangCu2)}
              </p>
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--mo)" }}>
            {vungGia.khangCu1 != null ? (
              <>
                Còn <strong style={{ color: "var(--chu)" }}>{pct(khoangCach(vungGia.khangCu1), 1)}</strong> tới kháng cự gần nhất.{" "}
              </>
            ) : (
              "Giá đang trên mọi mốc kháng cự tham chiếu. "
            )}
            {vungGia.hoTro1 != null ? (
              <>
                Hỗ trợ gần nhất cách <strong style={{ color: "var(--chu)" }}>{pct(khoangCach(vungGia.hoTro1), 1)}</strong>.
              </>
            ) : (
              "Giá đang dưới mọi mốc hỗ trợ tham chiếu (Kijun, đường cân bằng dài hạn) — chưa có hỗ trợ gần."
            )}
          </p>
          {!dangGiu && (
            <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--mo)" }}>
              Mã chưa có lệnh đang mở nên chưa có mức cắt lỗ và chốt lời — các mốc này hiện khi hệ thống báo MUA.
            </p>
          )}
          {dangGiu && vt.stop_loss !== null && vt.stop_loss !== undefined && (
            <div className="rounded-lg p-2.5 mt-3" style={{ background: "var(--do-nen)", border: "1px solid var(--do-vien)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--do-chu)" }} data-may="cat-lo">
                  {vungLenh?.sl ? (vungLenh.sl.xa ? "Vùng cắt lỗ lúc mua (tham khảo)" : "Vùng cắt lỗ") : "Mức cắt lỗ"}
                </span>
                <span style={{ fontFamily: "var(--font-chu)", fontWeight: 700, color: "var(--do)" }} className="text-sm">
                  {vungLenh?.sl ? chuoiVung(vungLenh.sl.tu, vungLenh.sl.den) : fmt(vt.stop_loss)}
                  <span className="text-xs ml-1" style={{ color: "var(--do-chu-2)" }}>
                    ({pct(khoangCach(vt.stop_loss), 2)})
                  </span>
                </span>
              </div>
              {vungLenh?.sl && (
                <p className="text-xs leading-snug mt-1" style={{ color: "var(--do-chu-2)" }}>
                  {vungLenh.sl.xa
                    ? "Mức này đã cách giá hiện tại rất xa nên chỉ còn mang tính tham khảo — thoát lệnh thật theo tín hiệu BÁN của hệ thống."
                    : `Đáy vùng ${fmt(vungLenh.sl.tu)} là mức cắt dứt khoát; đỉnh vùng là đường hỗ trợ gần nhất phía trên — giá rơi vào vùng này là lúc cần theo dõi sát.`}
                </p>
              )}
              {vungLenh?.hoaVon && (
                <p className="text-xs leading-snug mt-1 font-bold" style={{ color: "var(--vang)" }}>
                  Đã chạm TP2 → nên dời mức cắt lỗ của phần còn lại về giá mua ({fmt(vungLenh.hoaVon)}) để không còn rủi ro lỗ.
                </p>
              )}
              {vungLenh?.sl?.xa && vungLenh.sl.canhBao != null && (
                <p className="text-xs leading-snug mt-1" style={{ color: "var(--do-chu-2)" }}>
                  Mức cảnh báo bảo vệ lãi (chỉ để theo dõi, không phải lệnh cắt): Kijun {fmt(vungLenh.sl.canhBao)} ({pct(khoangCach(vungLenh.sl.canhBao), 2)}).
                </p>
              )}
            </div>
          )}
        </Card>

        {dangGiu && (
          <Card>
            <p className="text-sm mb-3" style={{ color: "var(--mo)" }} data-may="tp">
              3 mốc chốt lời từng phần
            </p>
            {[
              ["TP1", "TP1 (gần)", vt.tp1],
              ["TP2", "TP2 (giữa)", vt.tp2],
              ["TP3", "TP3 (xa, tham khảo)", vt.tp3],
            ].map(([ma, nhan, gia]) => {
              const thuTu = { TP1: 1, TP2: 2, TP3: 3 };
              const daCham = mucDaCham != null && thuTu[ma] <= thuTu[mucDaCham];
              return (
                <div key={ma} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--vien-nhe)" }}>
                  <span className="text-sm flex items-center gap-1.5" style={{ color: "var(--mo-2)" }}>
                    {nhan}
                    {daCham && (
                      <span className="px-1.5 py-0.5 text-xs font-bold rounded" style={{ background: nhe("var(--xanh)", 13), color: "var(--xanh)" }}>
                        <GiaiNghia khoa="da-cham-tp">Đã chạm</GiaiNghia>
                      </span>
                    )}
                  </span>
                  <span style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }} className="text-sm">
                    {fmt(gia)}
                    {gia !== null && gia !== undefined && (
                      <span className="text-xs ml-1" style={{ color: "var(--mo)" }}>
                        ({pct(khoangCach(gia), 1)})
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
            {vungLenh?.tp && (
              <p className="text-xs leading-relaxed mt-3" style={{ color: "var(--mo)" }}>
                Chốt {VUNG.tyLeChot.tp1}% ở TP1, {VUNG.tyLeChot.tp2}% ở TP2, {VUNG.tyLeChot.giu}% còn lại giữ đến khi hệ thống báo BÁN. Sau TP2, cắt lỗ phần còn lại dời về giá mua.
              </p>
            )}
          </Card>
        )}
      </div>

      {/* BIEU DO KY THUAT */}
      <div id="muc-bieu-do" className="mb-4 scroll-mt-28">
        <BieuDoKyThuat ma={row.ma} vung={vungLenh} ngayMua={vt.ngay_mua} />
      </div>

      {/* KHOI NGOAI mua / ban rong 10 phien (VNDirect, cong khai) */}
      <div id="muc-khoi-ngoai" className="scroll-mt-28">
        <KhoiNgoaiMa ma={row.ma} />
      </div>

      {/* DONG TIEN TRONG PHIEN (DNSE): mua / ban chu dong, co lenh, khoi ngoai, delta theo phut, volume profile */}
      <div id="muc-dong-tien" className="scroll-mt-28">
        <DongTienMa ma={row.ma} />
      </div>

      {/* NHAT KY GIAO DICH */}
      <div id="muc-nhat-ky" className="mb-4 scroll-mt-28">
        <NhatKyGiaoDich ma={row.ma} lichSuDaDong={lichSuDaDong} cacLenh={cacLenh} />
      </div>

      {/* PHAN TICH CO BAN: Danh gia 360, dinh gia, diem Z/F, DuPont theo quy (lib/phanTichCoBanDb.js) */}
      {phanTich && (
        <div id="muc-co-ban" className="scroll-mt-28">
          <PhanTichCoBan du={phanTich} ma={row.ma} />
        </div>
      )}

      {/* Khuyen nghi CTCK / cau chuyen ky vong: chi hien khi co du lieu (khong de o "Dang cap nhat..." trong). */}
      {(dinhGia.length > 0 || cauChuyen.length > 0) && (
        <div id="muc-khuyen-nghi" className={`scroll-mt-28 grid gap-4 mb-10 ${dinhGia.length > 0 && cauChuyen.length > 0 ? "sm:grid-cols-2" : ""}`}>
          {dinhGia.length > 0 && <CardDinhGia dinhGia={dinhGia} />}
          {cauChuyen.length > 0 && <CardCauChuyen cauChuyen={cauChuyen} />}
        </div>
      )}
    </div>
  );
}
