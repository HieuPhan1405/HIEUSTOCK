"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Eye, EyeOff, Check, Mail, Phone, User, Lock, ShieldCheck } from "lucide-react";
import { kiemTraTen, kiemTraEmail, kiemTraMatKhau, doManhMatKhau, MK_TOI_THIEU } from "@/lib/kiemTraDangKy";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const NEN_O = "var(--nen)";
const PRIMARY = "#6C5CE7";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const DO = "var(--do)";
const XANH = "var(--xanh)";

function OTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
      style={{
        background: active ? "rgba(108,92,231,0.16)" : "transparent",
        color: active ? PRIMARY : MUTED,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {children}
    </button>
  );
}

// 1 o nhap co nhan, bieu tuong, thong bao loi ngay duoi o (chi hien sau khi nguoi dung roi khoi o hoac bam gui).
function Truong({ nhan, icon: Icon, loi, children, phu }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-xs mb-1" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
        <span>{nhan}</span>
        {phu}
      </span>
      <span className="flex items-center gap-2 px-3 rounded-lg" style={{ background: NEN_O, border: `1px solid ${loi ? DO : VIEN}` }}>
        {Icon && <Icon size={15} color={MUTED} aria-hidden="true" />}
        {children}
      </span>
      {loi && (
        <span className="block text-[11px] mt-1" style={{ color: DO, fontFamily: "'Inter', sans-serif" }} role="alert">
          {loi}
        </span>
      )}
    </label>
  );
}

const cssO = { background: "transparent", color: TEXT, fontFamily: "'Inter', sans-serif", minWidth: 0 };
const NHAN_MANH = ["", "Yếu", "Trung bình", "Khá", "Mạnh"];
const MAU_MANH = ["var(--vien)", DO, "var(--vang-2)", "var(--chanh)", XANH];

// Dung chung cho moi noi can hoi "Dang ky/Dang nhap" (nut o Sidebar, cot Tin hieu bi khoa o Bo loc, cac trang khoa hoan toan...) - chi lo phan FORM,
// noi goi quyet dinh KHI NAO mo/dong (open/onClose) va lam gi sau khi thanh cong (onThanhCong nhan ve {sdt, ten}).
// Dang ky can: ho ten, so dien thoai, Gmail, mat khau + nhap lai mat khau (luat mat khau + chuan hoa email dung chung voi may chu: lib/kiemTraDangKy.js).
export default function ModalTaiKhoan({ open, onClose, onThanhCong, tieuDeGoiY }) {
  const [tab, setTab] = useState("dangKy");
  const [ten, setTen] = useState("");
  const [sdt, setSdt] = useState("");
  const [email, setEmail] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [matKhau2, setMatKhau2] = useState("");
  const [hienMk, setHienMk] = useState(false);
  const [website, setWebsite] = useState(""); // o bay: nguoi that khong thay / khong dien
  const [daCham, setDaCham] = useState({}); // o nao nguoi dung da roi khoi (de chi bao loi khi da nhap xong)
  const [dangXuLy, setDangXuLy] = useState(false);
  const [loi, setLoi] = useState("");

  if (!open) return null;

  const laDangKy = tab === "dangKy";
  const sdtSo = sdt.replace(/[^\d+]/g, "");
  const loiSdt = !/^(\+84|84|0)\d{9}$/.test(sdtSo) ? "Số điện thoại không hợp lệ (10 số, ví dụ 0912345678)." : null;
  const loiCuaTruong = laDangKy
    ? {
        ten: kiemTraTen(ten),
        sdt: loiSdt,
        email: kiemTraEmail(email),
        matKhau: kiemTraMatKhau(matKhau, { sdt: sdtSo, email }),
        matKhau2: matKhau2 !== matKhau ? "Mật khẩu nhập lại chưa khớp." : !matKhau2 ? "Vui lòng nhập lại mật khẩu." : null,
      }
    : { sdt: loiSdt, matKhau: matKhau ? null : "Vui lòng nhập mật khẩu." };
  const coLoi = Object.values(loiCuaTruong).some(Boolean);
  const hien = (k) => (daCham[k] || daCham.tatCa ? loiCuaTruong[k] : null);
  const cham = (k) => () => setDaCham((d) => ({ ...d, [k]: true }));
  const manh = doManhMatKhau(matKhau);
  const khopMk = matKhau2 && matKhau === matKhau2;

  function doiTab(t) {
    setTab(t);
    setLoi("");
    setDaCham({});
    setMatKhau("");
    setMatKhau2("");
  }

  function dong() {
    setLoi("");
    setMatKhau("");
    setMatKhau2("");
    setDaCham({});
    onClose?.();
  }

  async function guiForm(e) {
    e.preventDefault();
    setLoi("");
    if (coLoi) {
      setDaCham({ tatCa: true });
      return;
    }
    setDangXuLy(true);
    try {
      const res = await fetch(laDangKy ? "/api/dang-ky" : "/api/dang-nhap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(laDangKy ? { ten, sdt, email, matKhau, matKhau2, website } : { sdt, matKhau }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoi(d.loi || "Có lỗi xảy ra, thử lại sau.");
        return;
      }
      setSdt("");
      setTen("");
      setEmail("");
      setMatKhau("");
      setMatKhau2("");
      setDaCham({});
      onThanhCong?.(d.nguoiDung);
      onClose?.();
    } catch {
      setLoi("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
    } finally {
      setDangXuLy(false);
    }
  }

  const nutMat = (
    <button type="button" onClick={() => setHienMk((v) => !v)} aria-label={hienMk ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="shrink-0 p-1">
      {hienMk ? <EyeOff size={15} color={MUTED} /> : <Eye size={15} color={MUTED} />}
    </button>
  );

  // Ve THANG vao <body> (createPortal): thanh dau trang co backdrop-blur nen moi phan tu "fixed" ben trong no bi nhot trong khung 56px cua thanh do (form bi cat mat phan tren).
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.65)" }} onClick={dong}>
      <div className="w-full max-w-sm rounded-2xl border p-5 my-auto" style={{ borderColor: VIEN, background: NEN_CARD }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <div>
            <p style={{ color: TEXT, fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>{laDangKy ? "Tạo tài khoản CloudStock" : "Đăng nhập CloudStock"}</p>
            <p className="text-xs mt-0.5" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
              {laDangKy ? "Miễn phí, chỉ mất khoảng 1 phút." : "Chào mừng bạn quay lại."}
            </p>
          </div>
          <button onClick={dong} aria-label="Đóng" className="p-1">
            <X size={18} color={MUTED} />
          </button>
        </div>

        {tieuDeGoiY && (
          <p className="text-xs my-3 px-3 py-2 rounded-lg" style={{ color: "var(--tim-chu)", background: "rgba(108,92,231,0.12)", fontFamily: "'Inter', sans-serif" }}>
            {tieuDeGoiY}
          </p>
        )}

        <div className="flex gap-1 my-4 p-1 rounded-lg" style={{ background: NEN_O }}>
          <OTab active={laDangKy} onClick={() => doiTab("dangKy")}>
            Đăng ký
          </OTab>
          <OTab active={!laDangKy} onClick={() => doiTab("dangNhap")}>
            Đăng nhập
          </OTab>
        </div>

        <form onSubmit={guiForm} className="flex flex-col gap-3" noValidate>
          {laDangKy && (
            <Truong nhan="Họ và tên" icon={User} loi={hien("ten")}>
              <input
                value={ten}
                onChange={(e) => setTen(e.target.value)}
                onBlur={cham("ten")}
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                maxLength={100}
                className="flex-1 py-2.5 text-sm outline-none"
                style={cssO}
              />
            </Truong>
          )}
          <Truong nhan="Số điện thoại" icon={Phone} loi={hien("sdt")}>
            <input
              value={sdt}
              onChange={(e) => setSdt(e.target.value)}
              onBlur={cham("sdt")}
              placeholder="0912 345 678"
              inputMode="tel"
              autoComplete="tel"
              maxLength={16}
              className="flex-1 py-2.5 text-sm outline-none"
              style={{ ...cssO, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </Truong>
          {laDangKy && (
            <Truong nhan="Gmail" icon={Mail} loi={hien("email")}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={cham("email")}
                placeholder="ten@gmail.com"
                autoComplete="email"
                maxLength={254}
                className="flex-1 py-2.5 text-sm outline-none"
                style={cssO}
              />
            </Truong>
          )}
          <Truong nhan="Mật khẩu" icon={Lock} loi={hien("matKhau")}>
            <input
              type={hienMk ? "text" : "password"}
              value={matKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              onBlur={cham("matKhau")}
              placeholder={laDangKy ? `Ít nhất ${MK_TOI_THIEU} ký tự, gồm chữ và số` : "Mật khẩu"}
              autoComplete={laDangKy ? "new-password" : "current-password"}
              maxLength={72}
              className="flex-1 py-2.5 text-sm outline-none"
              style={cssO}
            />
            {nutMat}
          </Truong>
          {laDangKy && matKhau && (
            <div className="-mt-1.5" aria-live="polite">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= manh ? MAU_MANH[manh] : VIEN }} />
                ))}
              </div>
              <p className="text-[11px] mt-1" style={{ color: MAU_MANH[manh] === VIEN ? MUTED : MAU_MANH[manh], fontFamily: "'Inter', sans-serif" }}>
                Độ mạnh: {NHAN_MANH[manh]}
              </p>
            </div>
          )}
          {laDangKy && (
            <Truong
              nhan="Nhập lại mật khẩu"
              icon={ShieldCheck}
              loi={hien("matKhau2")}
              phu={khopMk ? <span className="flex items-center gap-1" style={{ color: XANH }}><Check size={12} /> Khớp</span> : null}
            >
              <input
                type={hienMk ? "text" : "password"}
                value={matKhau2}
                onChange={(e) => setMatKhau2(e.target.value)}
                onBlur={cham("matKhau2")}
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
                maxLength={72}
                className="flex-1 py-2.5 text-sm outline-none"
                style={cssO}
              />
            </Truong>
          )}
          {/* O bay chong bot: nguoi that khong thay (ra ngoai man hinh, bo khoi thu tu Tab), bot thuong dien het moi o. */}
          {laDangKy && (
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
            />
          )}

          {loi && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ color: DO, background: "rgba(239,68,68,0.10)", fontFamily: "'Inter', sans-serif" }} role="alert">
              {loi}
            </p>
          )}
          <button
            type="submit"
            disabled={dangXuLy}
            className="px-3 py-3 text-sm font-semibold rounded-lg mt-1 transition-opacity"
            style={{ background: PRIMARY, color: "#FFFFFF", opacity: dangXuLy ? 0.6 : 1, cursor: dangXuLy ? "wait" : "pointer" }}
          >
            {dangXuLy ? "Đang xử lý..." : laDangKy ? "Tạo tài khoản" : "Đăng nhập"}
          </button>
        </form>

        <p className="text-[11px] mt-3 leading-relaxed" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
          {laDangKy
            ? "Bằng việc tạo tài khoản, bạn đồng ý để CloudStock liên hệ tư vấn qua số điện thoại hoặc Gmail bạn cung cấp. Tài khoản mới cần được duyệt trước khi xem nội dung dành cho thành viên. Thông tin trên web chỉ mang tính tham khảo, không phải khuyến nghị đầu tư."
            : "Quên mật khẩu? Nhắn cho CloudStock qua Zalo trong mục Liên hệ để được hỗ trợ."}
        </p>
      </div>
    </div>,
    document.body
  );
}
