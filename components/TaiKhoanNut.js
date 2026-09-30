"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { UserRound, Pencil, Check, X as HuyIcon, ChevronDown, LogOut, Wallet, ShieldCheck } from "lucide-react";
import ModalTaiKhoan from "@/components/ModalTaiKhoan";
import { tatDay } from "@/lib/dayTrinhDuyet";

const PRIMARY = "#6C5CE7";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const XANH = "var(--xanh)";
const VANG = "var(--vang)";
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";

// Form doi ten hien thi (dung o ca kieu thuong va menu tai khoan tren thanh dau).
function FormDoiTen({ tenMoi, setTenMoi, dangLuu, onLuu, onHuy, rong = 140 }) {
  return (
    <form onSubmit={onLuu} className="flex items-center gap-1">
      <input
        autoFocus
        value={tenMoi}
        onChange={(e) => setTenMoi(e.target.value)}
        maxLength={200}
        placeholder="Tên hiển thị"
        className="px-2 py-1 text-xs rounded outline-none min-w-0"
        style={{ background: "var(--nen)", border: `1px solid ${PRIMARY}`, color: TEXT, width: rong }}
      />
      <button type="submit" disabled={dangLuu} style={{ color: XANH }} aria-label="Lưu tên">
        <Check size={14} strokeWidth={2.5} />
      </button>
      <button type="button" onClick={onHuy} style={{ color: MUTED }} aria-label="Huỷ đổi tên">
        <HuyIcon size={14} strokeWidth={2.5} />
      </button>
    </form>
  );
}

const TheNho = ({ mau, children, title }) => (
  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded" style={{ background: mau, color: "var(--nen)" }} title={title}>
    {children}
  </span>
);

// thanhDau: kieu gon cho THANH DAU trang - da dang nhap thi 1 nut (chu cai dau + ten) mo menu tai khoan; chua dang nhap thi nut Dang ky (dien thoai chi hien bieu tuong).
export default function TaiKhoanNut({ compact, nhan, thanhDau }) {
  const [nguoiDung, setNguoiDung] = useState(undefined); // undefined = dang tai, null = chua dang nhap
  const [moModal, setMoModal] = useState(false);
  const [dangSuaTen, setDangSuaTen] = useState(false);
  const [tenMoi, setTenMoi] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const [moMenu, setMoMenu] = useState(false);
  const goc = useRef(null);

  const taiPhien = useCallback(() => {
    fetch("/api/nguoi-dung-hien-tai")
      .then((r) => r.json())
      .then((d) => setNguoiDung(d.nguoiDung || null))
      .catch(() => setNguoiDung(null));
  }, []);

  useEffect(() => {
    taiPhien();
  }, [taiPhien]);

  useEffect(() => {
    if (!moMenu) return;
    const dong = (e) => {
      if (e.type === "keydown" ? e.key === "Escape" : goc.current && !goc.current.contains(e.target)) {
        setMoMenu(false);
        setDangSuaTen(false);
      }
    };
    document.addEventListener("mousedown", dong);
    document.addEventListener("keydown", dong);
    return () => {
      document.removeEventListener("mousedown", dong);
      document.removeEventListener("keydown", dong);
    };
  }, [moMenu]);

  // Dang xuat: tat thong bao ve may cua trinh duyet nay truoc (thong bao gan voi tai khoan - nguoi sau dung chung may khong nhan nham), roi tai lai trang de moi phan ve trang thai khach.
  async function dangXuat() {
    await tatDay().catch(() => {});
    await fetch("/api/dang-xuat", { method: "POST" });
    setNguoiDung(null);
    window.location.reload();
  }

  function moSuaTen() {
    setTenMoi(nguoiDung?.ten || "");
    setDangSuaTen(true);
  }

  async function luuTen(e) {
    e.preventDefault();
    const sach = tenMoi.trim();
    if (!sach || dangLuu) return;
    setDangLuu(true);
    try {
      const res = await fetch("/api/doi-ten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ten: sach }),
      });
      const d = await res.json();
      if (res.ok) {
        setNguoiDung((cu) => ({ ...cu, ten: d.nguoiDung?.ten ?? sach }));
        setDangSuaTen(false);
      }
    } finally {
      setDangLuu(false);
    }
  }

  if (nguoiDung === undefined) return thanhDau ? <div className="w-9 h-9" aria-hidden="true" /> : null;

  if (nguoiDung && thanhDau) {
    const ten = nguoiDung.ten || nguoiDung.sdt;
    return (
      <div ref={goc} className="relative" style={{ fontFamily: "'Inter', sans-serif" }}>
        <button
          type="button"
          onClick={() => setMoMenu((v) => !v)}
          aria-expanded={moMenu}
          aria-label={`Tài khoản: ${ten}`}
          className="flex items-center gap-2 h-9 pl-1 pr-1 sm:pr-2 rounded-lg border transition-colors hover:bg-[color:var(--hover-nhe)]"
          style={{ borderColor: moMenu ? PRIMARY : VIEN, background: NEN_CARD }}
        >
          <span className="relative w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: "rgba(108,92,231,0.22)", color: "var(--tim-chu)" }}>
            {String(ten).trim().charAt(0).toUpperCase() || "?"}
            {!nguoiDung.da_duyet && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: VANG, border: "2px solid var(--nen)" }} aria-hidden="true" />}
          </span>
          <span className="hidden sm:block max-w-[120px] truncate text-xs" style={{ color: TEXT }}>
            {ten}
          </span>
          <ChevronDown size={14} className="hidden sm:block" color={MUTED} aria-hidden="true" />
        </button>

        {moMenu && (
          <div className="absolute right-0 top-full mt-2 w-[260px] max-w-[calc(100vw-16px)] rounded-2xl border shadow-2xl p-2 text-sm" style={{ borderColor: VIEN, background: NEN_CARD, zIndex: 45 }}>
            <div className="px-2.5 py-2">
              {dangSuaTen ? (
                <FormDoiTen tenMoi={tenMoi} setTenMoi={setTenMoi} dangLuu={dangLuu} onLuu={luuTen} onHuy={() => setDangSuaTen(false)} rong={180} />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate" style={{ color: TEXT }}>
                    {ten}
                  </span>
                  <button type="button" onClick={moSuaTen} style={{ color: MUTED }} aria-label="Đổi tên hiển thị" title="Đổi tên hiển thị">
                    <Pencil size={12} strokeWidth={2.5} />
                  </button>
                </div>
              )}
              <p className="text-[11px] mt-0.5" style={{ color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>
                {nguoiDung.sdt}
              </p>
              {(nguoiDung.la_admin || !nguoiDung.da_duyet) && (
                <div className="flex gap-1.5 mt-2">
                  {nguoiDung.la_admin && <TheNho mau={XANH}>ADMIN</TheNho>}
                  {!nguoiDung.da_duyet && (
                    <TheNho mau={VANG} title="Tài khoản đang chờ quản trị viên duyệt">
                      CHỜ DUYỆT
                    </TheNho>
                  )}
                </div>
              )}
            </div>
            <div className="border-t my-1" style={{ borderColor: VIEN }} />
            <Link href="/danh-muc" onClick={() => setMoMenu(false)} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[color:var(--hover-nhe)]" style={{ color: TEXT }}>
              <Wallet size={15} color={MUTED} aria-hidden="true" /> Danh mục theo dõi
            </Link>
            {nguoiDung.la_admin && (
              <Link href="/quan-tri" onClick={() => setMoMenu(false)} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[color:var(--hover-nhe)]" style={{ color: TEXT }}>
                <ShieldCheck size={15} color={MUTED} aria-hidden="true" /> Trang quản trị
              </Link>
            )}
            <button type="button" onClick={dangXuat} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[color:var(--hover-nhe)] text-left" style={{ color: PRIMARY }}>
              <LogOut size={15} aria-hidden="true" /> Đăng xuất
            </button>
          </div>
        )}
      </div>
    );
  }

  if (nguoiDung) {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
        {dangSuaTen ? (
          <FormDoiTen tenMoi={tenMoi} setTenMoi={setTenMoi} dangLuu={dangLuu} onLuu={luuTen} onHuy={() => setDangSuaTen(false)} />
        ) : (
          <span style={{ color: MUTED }} className={`items-center gap-1 ${compact ? "hidden sm:flex" : "flex"}`}>
            Xin chào, {nguoiDung.ten || nguoiDung.sdt}
            <button type="button" onClick={moSuaTen} style={{ color: MUTED }} aria-label="Đổi tên hiển thị" title="Đổi tên hiển thị">
              <Pencil size={11} strokeWidth={2.5} />
            </button>
          </span>
        )}
        {nguoiDung.la_admin && <TheNho mau={XANH}>ADMIN</TheNho>}
        {!nguoiDung.da_duyet && (
          <TheNho mau={VANG} title="Tài khoản đang chờ quản trị viên duyệt">
            CHỜ DUYỆT
          </TheNho>
        )}
        <button onClick={dangXuat} style={{ color: PRIMARY }} className="font-medium">
          Đăng xuất
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setMoModal(true)}
        aria-label={thanhDau ? "Đăng ký / Đăng nhập" : undefined}
        className={`flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${thanhDau ? "h-9 w-9 sm:w-auto sm:px-3" : "px-3 py-2"} ${compact || thanhDau ? "" : "w-full"}`}
        style={{ background: PRIMARY, color: "#FFFFFF", fontFamily: "'Inter', sans-serif" }}
      >
        <UserRound size={14} strokeWidth={2.5} />
        {thanhDau ? (
          <span className="hidden sm:inline">Đăng ký nhận tư vấn</span>
        ) : compact && !nhan ? (
          <>
            <span className="hidden sm:inline">Đăng ký nhận tư vấn</span>
            <span className="sm:hidden">Đăng ký</span>
          </>
        ) : (
          nhan || "Đăng ký nhận tư vấn"
        )}
      </button>
      <ModalTaiKhoan open={moModal} onClose={() => setMoModal(false)} onThanhCong={thanhDau ? () => window.location.reload() : setNguoiDung} />
    </>
  );
}
