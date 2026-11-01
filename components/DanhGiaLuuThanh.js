"use client";

import { useState } from "react";
import { Save, FilePlus2, Trash2, Cloud } from "lucide-react";
import TaiKhoanNut from "@/components/TaiKhoanNut";
import { VIEN, NEN_CARD, TEXT, MUTED, PRIMARY, sans } from "@/components/DanhGiaChung";

// THANH DANH MUC DA LUU (tai khoan): chon / tao / doi ten / xoa; danh muc dang chon tu luu khi sua. Khach: chi luu tren may + moi dang nhap.
export default function DanhGiaLuuThanh({ dangNhap, dsLuu = [], dmId, ten, trangThai, onChon, onLuuMoi, onDoiTen, onXoa, onMoi }) {
  const [tenMoi, setTenMoi] = useState("");
  const [dangDat, setDangDat] = useState(false);
  const nut = "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold";
  if (!dangNhap) {
    return (
      <div className="rounded-2xl border px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: VIEN, background: NEN_CARD, ...sans }}>
        <p className="text-sm" style={{ color: MUTED }}>
          <Cloud size={14} className="inline -mt-0.5 mr-1" />
          Danh mục đang lưu trên máy này. <b style={{ color: TEXT }}>Đăng nhập</b> để lưu nhiều danh mục (ví dụ mỗi khách hàng một danh mục), mở trên mọi thiết bị và nhận cảnh báo khi mã cần xử lý.
        </p>
        <TaiKhoanNut nhan="Đăng nhập / đăng ký" />
      </div>
    );
  }
  return (
    <div className="rounded-2xl border px-4 py-3 mb-4 flex flex-wrap items-center gap-2" style={{ borderColor: VIEN, background: NEN_CARD, ...sans }}>
      <label className="text-xs inline-flex items-center gap-2" style={{ color: MUTED }}>
        Danh mục
        <select value={dmId ?? ""} onChange={(e) => onChon(e.target.value ? Number(e.target.value) : null)} className="px-2.5 py-1.5 rounded-lg text-sm border max-w-[220px]" style={{ borderColor: VIEN, background: "var(--card)", color: TEXT, fontWeight: 700 }}>
          <option value="">— Chưa lưu (trên máy này) —</option>
          {dsLuu.map((d) => (
            <option key={d.id} value={d.id}>
              {d.ten}
            </option>
          ))}
        </select>
      </label>
      {dmId ? (
        <input key={dmId} defaultValue={ten} onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== ten && onDoiTen(e.target.value.trim())} className="px-2.5 py-1.5 rounded-lg text-sm border w-44" style={{ borderColor: VIEN, background: "transparent", color: TEXT }} aria-label="Tên danh mục" title="Sửa tên rồi bấm ra ngoài để lưu" />
      ) : dangDat ? (
        <span className="inline-flex items-center gap-2">
          <input autoFocus value={tenMoi} onChange={(e) => setTenMoi(e.target.value.slice(0, 80))} onKeyDown={(e) => e.key === "Enter" && tenMoi.trim() && (onLuuMoi(tenMoi.trim()), setDangDat(false), setTenMoi(""))} placeholder="Tên, vd: Anh Nam – dài hạn" className="px-2.5 py-1.5 rounded-lg text-sm border w-52" style={{ borderColor: VIEN, background: "transparent", color: TEXT }} />
          <button type="button" disabled={!tenMoi.trim()} onClick={() => (onLuuMoi(tenMoi.trim()), setDangDat(false), setTenMoi(""))} className={`${nut} disabled:opacity-50`} style={{ borderColor: PRIMARY, background: PRIMARY, color: "#fff" }}>
            <Save size={13} /> Lưu
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setDangDat(true)} className={nut} style={{ borderColor: PRIMARY, color: PRIMARY }}>
          <Save size={13} /> Lưu vào tài khoản
        </button>
      )}
      <button type="button" onClick={onMoi} className={nut} style={{ borderColor: VIEN, color: TEXT }} title="Bắt đầu một danh mục trống (danh mục đang chọn vẫn được giữ trong tài khoản)">
        <FilePlus2 size={13} /> Danh mục mới
      </button>
      {dmId && (
        <button type="button" onClick={() => window.confirm(`Xóa danh mục “${ten}” khỏi tài khoản? Dữ liệu vẫn còn trên màn hình này.`) && onXoa()} className={nut} style={{ borderColor: VIEN, color: MUTED }}>
          <Trash2 size={13} /> Xóa
        </button>
      )}
      {trangThai && <span className="text-[11px] ml-auto" style={{ color: MUTED }}>{trangThai}</span>}
    </div>
  );
}
