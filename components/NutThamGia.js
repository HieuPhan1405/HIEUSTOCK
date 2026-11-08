"use client";

import { useRef, useState } from "react";
import { BookmarkPlus, BookmarkCheck } from "lucide-react";
import HopChonDanhSach from "@/components/HopChonDanhSach";
import { useDanhSachTheoDoi } from "@/lib/danhSachTheoDoiClient";

const MUTED = "var(--mo)";
const PRIMARY = "#6C5CE7";

// Nut THEO DOI 1 ma - dung chung cho Bo loc (cong khai, co the CHUA dang nhap -> moChuaDangNhap bat modal dang ky), Lenh dang mo, Danh sach theo doi.
// 04/11/2026: bam mo hop chon DANH SACH (danh sach chinh + cac danh sach tu tao, xem lib/danhSachTheoDoi.js) thay vi bat/tat thang 1 danh sach. So canh bieu tuong
// = so nguoi dang de ma o danh sach chinh. Nut sang mau khi ma nam trong it nhat 1 danh sach cua ban.
export default function NutThamGia({ ma, soNguoiThamGia, daThamGia, coDangNhap = true, moChuaDangNhap, onDoiTrangThai }) {
  const nutRef = useRef(null);
  const [mo, setMo] = useState(false);
  const { danhSach } = useDanhSachTheoDoi({ tuTai: coDangNhap });
  const coTrongDs = danhSach ? danhSach.some((d) => d.ma.some((x) => x.ma === ma)) : !!daThamGia;

  function bam(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!coDangNhap) {
      moChuaDangNhap?.();
      return;
    }
    setMo((v) => !v);
  }

  const Icon = coTrongDs ? BookmarkCheck : BookmarkPlus;
  return (
    <>
      <button
        ref={nutRef}
        type="button"
        onClick={bam}
        data-may="tham-gia"
        aria-haspopup="dialog"
        aria-expanded={mo}
        title={coDangNhap ? (coTrongDs ? "Đang theo dõi — bấm để chọn danh sách" : "Thêm vào danh sách theo dõi") : "Đăng ký/Đăng nhập để theo dõi mã"}
        aria-label={`Theo dõi ${ma}${soNguoiThamGia > 0 ? ` (${soNguoiThamGia} người theo dõi)` : ""}`}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors"
        style={{ background: coTrongDs ? "rgba(108,92,231,0.18)" : "var(--phu)", color: coTrongDs ? PRIMARY : MUTED }}
      >
        <Icon size={12} />
        {/* 0 nguoi thi chi hien bieu tuong (bot so 0 lap lai tren moi dong bang) */}
        {soNguoiThamGia > 0 ? soNguoiThamGia : null}
      </button>
      {mo && (
        <HopChonDanhSach
          ma={ma}
          nutRef={nutRef}
          danhSach={danhSach}
          daThamGiaChinh={!!daThamGia}
          onDoiChinh={(co, soNguoi) => onDoiTrangThai?.(ma, { daThamGia: co, soNguoiThamGia: soNguoi })}
          onDong={() => setMo(false)}
        />
      )}
    </>
  );
}
