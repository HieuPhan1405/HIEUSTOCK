"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, Check, KeyRound, LogOut, Pencil, ShieldCheck, Wallet, X as DongIcon } from "lucide-react";
import DoiMatKhau from "@/components/DoiMatKhau";
import { NHOM_THONG_BAO, KHOA_NHOM, PHAM_VI } from "@/lib/thongBao";
import { hoTroDay, laIOSChuaCaiDat, quyenHienTai, layDangKyHienTai, batDay, tatDay, dongBoDay, guiThu } from "@/lib/dayTrinhDuyet";

// TRANG CA NHAN /tai-khoan (bam vao ten tai khoan o thanh dau): thong tin tai khoan, doi ten, doi mat khau, dang xuat, va CHON LOAI THONG BAO ve may (tich loai nao gui loai do, luu ngay khi tich).
// Du lieu: /api/tai-khoan (GET / POST). Doi ten: /api/doi-ten. Doi mat khau: /api/doi-mat-khau (hop thoai DoiMatKhau).
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const PRIMARY = "#6C5CE7";
const XANH = "var(--xanh)";
const VANG = "var(--vang)";
const DO = "var(--do)";
const sans = { fontFamily: "var(--font-chu)" };

const ngayHien = (s) => (s ? s.split("-").reverse().join("/") : "");

function The({ tieuDe, moTa, children }) {
  return (
    <section className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <h2 className="text-base font-bold" style={{ color: TEXT, ...sans }}>
        {tieuDe}
      </h2>
      {moTa && (
        <p className="text-xs mt-0.5 mb-3" style={{ color: MUTED }}>
          {moTa}
        </p>
      )}
      <div className={moTa ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

function Dong({ nhan, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b last:border-b-0 text-sm" style={{ borderColor: "var(--vien-nhe)" }}>
      <span style={{ color: MUTED }}>{nhan}</span>
      <span className="text-right min-w-0 break-words" style={{ color: TEXT, ...sans }}>
        {children}
      </span>
    </div>
  );
}

const Nhan = ({ mau, children }) => (
  <span className="px-1.5 py-0.5 text-[11px] font-bold rounded" style={{ background: mau, color: "var(--nen)" }}>
    {children}
  </span>
);

export default function TrangCaNhan() {
  const [hoSo, setHoSo] = useState(null);
  const [khoaDay, setKhoaDay] = useState("");
  const [loi, setLoi] = useState("");
  const [day, setDay] = useState({ hoTro: false, ios: false, quyen: "default", dangBat: false });
  const [dangLam, setDangLam] = useState(false);
  const [baoDay, setBaoDay] = useState({ loi: "", ok: "" });
  const [baoLuu, setBaoLuu] = useState({ loi: "", ok: "" });
  const [suaTen, setSuaTen] = useState(false);
  const [tenMoi, setTenMoi] = useState("");
  const [moDoiMk, setMoDoiMk] = useState(false);

  const tai = useCallback(async () => {
    try {
      const res = await fetch("/api/tai-khoan", { cache: "no-store" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return setLoi(d.loi || "Không tải được thông tin tài khoản.");
      setHoSo(d.hoSo);
      setKhoaDay(d.khoaDay || "");
      setLoi("");
    } catch {
      setLoi("Không kết nối được máy chủ. Kiểm tra mạng rồi tải lại trang.");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(tai, 0);
    return () => clearTimeout(t);
  }, [tai]);

  // Trang thai thong bao ve may cua trinh duyet nay (da bat tu truoc thi gan lai cho tai khoan dang dang nhap)
  useEffect(() => {
    if (!hoSo) return;
    let huy = false;
    (async () => {
      const hoTro = hoTroDay();
      const sub = hoTro ? await dongBoDay().catch(() => null) : null;
      if (!huy) setDay({ hoTro, ios: laIOSChuaCaiDat(), quyen: quyenHienTai(), dangBat: !!sub });
    })();
    return () => {
      huy = true;
    };
  }, [hoSo?.sdt]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- thong tin
  async function luuTen(e) {
    e.preventDefault();
    const sach = tenMoi.trim();
    if (!sach) return;
    const res = await fetch("/api/doi-ten", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ten: sach }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setHoSo((c) => ({ ...c, ten: d.nguoiDung?.ten ?? sach }));
      setSuaTen(false);
    } else setBaoLuu({ loi: d.loi || "Chưa đổi được tên.", ok: "" });
  }
  async function dangXuat() {
    await tatDay().catch(() => {});
    await fetch("/api/dang-xuat", { method: "POST" }).catch(() => {});
    window.location.assign(`${window.location.origin}/`); // tai lai TOAN trang de xoa trang thai dang nhap phia trinh duyet
  }

  // ---- thong bao ve may cua thiet bi nay
  const lam = async (viec, okChu = "") => {
    setDangLam(true);
    setBaoDay({ loi: "", ok: "" });
    try {
      await viec();
      if (okChu) setBaoDay({ loi: "", ok: okChu });
    } catch (e) {
      setBaoDay({ loi: String(e?.message || e), ok: "" });
    } finally {
      setDay((c) => ({ ...c, quyen: quyenHienTai() }));
      setDangLam(false);
    }
  };
  const batMay = () =>
    lam(async () => {
      await batDay(khoaDay);
      setDay((c) => ({ ...c, dangBat: true }));
      setHoSo((c) => ({ ...c, soMay: (c.soMay ?? 0) + 1 }));
    }, "Đã bật. Bấm “Gửi thử” để xem thông báo hiện ra thế nào.");
  const tatMay = () =>
    lam(async () => {
      await tatDay();
      setDay((c) => ({ ...c, dangBat: false }));
      setHoSo((c) => ({ ...c, soMay: Math.max(0, (c.soMay ?? 1) - 1) }));
    });
  const thuMay = () => lam(() => guiThu(), "Đã gửi — thông báo sẽ hiện trong vài giây.");

  // ---- cai dat loai thong bao (luu ngay khi tich)
  const nhomHienCo = NHOM_THONG_BAO.filter((n) => !n.chiAdmin || hoSo?.laAdmin);
  const khoaHienCo = nhomHienCo.map((n) => n.khoa);
  const dangChon = hoSo?.nhom ?? KHOA_NHOM; // chua chon bao gio = nhan het
  async function luuNhom(nhomMoi) {
    const cu = hoSo.nhom;
    setHoSo((c) => ({ ...c, nhom: nhomMoi }));
    setBaoLuu({ loi: "", ok: "" });
    try {
      const res = await fetch("/api/tai-khoan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hanhDong: "nhom", nhom: nhomMoi }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.loi || "Chưa lưu được, thử lại.");
      setBaoLuu({ loi: "", ok: "Đã lưu" });
    } catch (e) {
      setHoSo((c) => ({ ...c, nhom: cu }));
      setBaoLuu({ loi: String(e?.message || e), ok: "" });
    }
  }
  const tich = (khoa) => luuNhom(dangChon.includes(khoa) ? dangChon.filter((k) => k !== khoa) : [...dangChon, khoa]);
  const chonHet = () => luuNhom([...new Set([...dangChon, ...khoaHienCo])]);
  const boHet = () => luuNhom(dangChon.filter((k) => !khoaHienCo.includes(k)));
  async function doiPhamVi(phamVi) {
    const cu = hoSo.phamVi;
    setHoSo((c) => ({ ...c, phamVi }));
    setBaoLuu({ loi: "", ok: "" });
    try {
      const res = await fetch("/api/tai-khoan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hanhDong: "pham_vi", phamVi }) });
      if (!res.ok) throw new Error("Chưa lưu được, thử lại.");
      setBaoLuu({ loi: "", ok: "Đã lưu" });
    } catch (e) {
      setHoSo((c) => ({ ...c, phamVi: cu }));
      setBaoLuu({ loi: String(e?.message || e), ok: "" });
    }
  }

  if (loi && !hoSo) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10" style={{ color: TEXT }}>
        <p className="text-sm" style={{ color: DO }}>
          {loi}
        </p>
      </div>
    );
  }
  if (!hoSo) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-sm" style={{ color: MUTED }}>
        Đang tải…
      </div>
    );
  }

  const ten = hoSo.ten || hoSo.sdt;
  const tinHieuTat = hoSo.phamVi === "khong";
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 grid gap-4" style={{ color: TEXT }}>
      <DoiMatKhau mo={moDoiMk} onDong={() => setMoDoiMk(false)} />

      {/* THONG TIN */}
      <section className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0" style={{ background: "rgba(108,92,231,0.22)", color: "var(--tim-chu)" }}>
            {String(ten).trim().charAt(0).toUpperCase() || "?"}
          </span>
          <div className="min-w-0 flex-1">
            {suaTen ? (
              <form onSubmit={luuTen} className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={tenMoi}
                  onChange={(e) => setTenMoi(e.target.value)}
                  maxLength={200}
                  placeholder="Tên hiển thị"
                  className="px-2 py-1.5 text-sm rounded outline-none min-w-0 flex-1"
                  style={{ background: "var(--nen)", border: `1px solid ${PRIMARY}`, color: TEXT }}
                />
                <button type="submit" style={{ color: XANH }} aria-label="Lưu tên">
                  <Check size={16} strokeWidth={2.5} />
                </button>
                <button type="button" onClick={() => setSuaTen(false)} style={{ color: MUTED }} aria-label="Huỷ đổi tên">
                  <DongIcon size={16} strokeWidth={2.5} />
                </button>
              </form>
            ) : (
              <h1 className="text-xl flex items-center gap-2 min-w-0" style={{ fontWeight: 700, ...sans }}>
                <span className="truncate">{ten}</span>
                <button
                  type="button"
                  onClick={() => {
                    setTenMoi(hoSo.ten || "");
                    setSuaTen(true);
                  }}
                  style={{ color: MUTED }}
                  aria-label="Đổi tên hiển thị"
                  title="Đổi tên hiển thị"
                >
                  <Pencil size={14} strokeWidth={2.5} />
                </button>
              </h1>
            )}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {hoSo.laAdmin && <Nhan mau={XANH}>ADMIN</Nhan>}
              {hoSo.daDuyet ? <Nhan mau={XANH}>ĐÃ DUYỆT</Nhan> : <Nhan mau={VANG}>CHỜ DUYỆT</Nhan>}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Dong nhan="Số điện thoại">{hoSo.sdt}</Dong>
          <Dong nhan="Email">{hoSo.email || "Chưa có"}</Dong>
          <Dong nhan="Tham gia từ">{ngayHien(hoSo.taoLuc)}</Dong>
          <Dong nhan="Trạng thái">{hoSo.daDuyet ? "Đã được duyệt, xem được nội dung dành cho thành viên" : "Đang chờ quản trị viên duyệt"}</Dong>
          <Dong nhan="Mã đang theo dõi">
            {hoSo.soMa} mã ·{" "}
            <Link href="/danh-muc" style={{ color: PRIMARY }}>
              Danh mục theo dõi
            </Link>
          </Dong>
        </div>
      </section>

      {/* BAO MAT */}
      <The tieuDe="Bảo mật" moTa="Đổi mật khẩu sẽ đăng xuất các thiết bị khác, thiết bị này giữ nguyên.">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setMoDoiMk(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: VIEN, color: TEXT }}>
            <KeyRound size={15} color="var(--mo)" aria-hidden="true" /> Đổi mật khẩu
          </button>
          {hoSo.laAdmin && (
            <Link href="/quan-tri" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: VIEN, color: TEXT }}>
              <ShieldCheck size={15} color="var(--mo)" aria-hidden="true" /> Trang quản trị
            </Link>
          )}
          <Link href="/danh-muc" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: VIEN, color: TEXT }}>
            <Wallet size={15} color="var(--mo)" aria-hidden="true" /> Danh mục theo dõi
          </Link>
          <button type="button" onClick={dangXuat} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold" style={{ color: PRIMARY, border: `1px solid ${PRIMARY}` }}>
            <LogOut size={15} aria-hidden="true" /> Đăng xuất
          </button>
        </div>
      </The>

      {/* THONG BAO */}
      <The tieuDe="Thông báo" moTa="Tích loại nào thì web gửi loại đó về máy bạn; bỏ tích là không gửi. Lưu ngay khi tích.">
        <div className="rounded-xl p-3 mb-4 text-sm" style={{ border: `1px solid ${VIEN}` }}>
          <p className="text-xs mb-1.5" style={{ color: MUTED }}>
            Thiết bị này ({hoSo.soMay} thiết bị đang nhận thông báo trên tài khoản)
          </p>
          {day.ios ? (
            <p className="text-xs" style={{ color: MUTED }}>
              <b style={{ color: TEXT }}>Trên iPhone / iPad:</b> bấm nút Chia sẻ → <b style={{ color: TEXT }}>“Thêm vào MH chính”</b>, mở CloudStock từ biểu tượng đó rồi quay lại đây để bật.
            </p>
          ) : !day.hoTro ? (
            <p className="text-xs" style={{ color: MUTED }}>
              Trình duyệt này chưa hỗ trợ thông báo về máy — dùng Chrome, Edge, Firefox hoặc Safari bản mới.
            </p>
          ) : day.quyen === "denied" && !day.dangBat ? (
            <p className="text-xs" style={{ color: MUTED }}>
              Bạn đã chặn thông báo của web này. Bấm biểu tượng ổ khóa cạnh địa chỉ web → cho phép <b style={{ color: TEXT }}>Thông báo</b>, rồi tải lại trang.
            </p>
          ) : day.dangBat ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 font-semibold text-sm" style={{ color: XANH }}>
                <Check size={14} strokeWidth={2.5} aria-hidden="true" /> Đang bật trên thiết bị này
              </span>
              <span className="ml-auto flex gap-1.5 text-xs">
                <button type="button" disabled={dangLam} onClick={thuMay} className="px-2.5 py-1 rounded-md border" style={{ borderColor: VIEN, color: TEXT }}>
                  Gửi thử
                </button>
                <button type="button" disabled={dangLam} onClick={tatMay} className="px-2.5 py-1 rounded-md border" style={{ borderColor: VIEN, color: MUTED }}>
                  Tắt
                </button>
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs" style={{ color: MUTED }}>
                Thiết bị này chưa nhận thông báo (nhận được cả khi đã đóng web).
              </span>
              <button type="button" disabled={dangLam} onClick={batMay} className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: PRIMARY, color: "#FFFFFF" }}>
                {dangLam ? "Đang bật…" : "Bật thông báo"}
              </button>
            </div>
          )}
          {baoDay.loi && (
            <p className="mt-2 text-xs" style={{ color: DO }}>
              {baoDay.loi}
            </p>
          )}
          {baoDay.ok && (
            <p className="mt-2 text-xs" style={{ color: XANH }}>
              {baoDay.ok}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-sm font-semibold" style={sans}>
            <BellRing size={15} className="inline -mt-0.5 mr-1.5" color="var(--mo)" aria-hidden="true" />
            Loại thông báo cần nhận
          </p>
          <span className="flex items-center gap-2 text-xs">
            <button type="button" onClick={chonHet} style={{ color: PRIMARY }}>
              Chọn tất cả
            </button>
            <span style={{ color: MUTED }}>·</span>
            <button type="button" onClick={boHet} style={{ color: PRIMARY }}>
              Bỏ chọn tất cả
            </button>
          </span>
        </div>
        <div className="grid gap-1.5" role="group" aria-label="Loại thông báo cần nhận">
          {nhomHienCo.map((n) => {
            const bat = dangChon.includes(n.khoa);
            return (
              <label key={n.khoa} className="flex items-start gap-3 rounded-xl px-3 py-2.5 cursor-pointer" style={{ border: `1px solid ${bat ? PRIMARY : VIEN}`, background: bat ? "rgba(108,92,231,0.10)" : "transparent" }}>
                <input type="checkbox" checked={bat} onChange={() => tich(n.khoa)} className="mt-1 w-4 h-4 shrink-0" style={{ accentColor: PRIMARY }} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold" style={{ color: TEXT, ...sans }}>
                    {n.nhan}
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: MUTED }}>
                    {n.moTa}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <div className="min-h-[18px] mt-2 text-xs">
          {baoLuu.ok && (
            <span style={{ color: XANH }}>
              <Check size={12} className="inline -mt-0.5 mr-1" aria-hidden="true" />
              {baoLuu.ok}
            </span>
          )}
          {baoLuu.loi && <span style={{ color: DO }}>{baoLuu.loi}</span>}
        </div>

        <div className="mt-3 rounded-xl p-3" style={{ border: `1px solid ${VIEN}` }}>
          <p className="text-sm font-semibold mb-1.5" style={sans}>
            Tín hiệu của mã nào
          </p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Phạm vi nhận tín hiệu">
            {Object.entries(PHAM_VI).map(([k, nhan]) => {
              const chon = hoSo.phamVi === k;
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={chon}
                  onClick={() => !chon && doiPhamVi(k)}
                  className="px-2.5 py-1 rounded-full border text-xs"
                  style={{ borderColor: chon ? PRIMARY : VIEN, background: chon ? "rgba(108,92,231,0.16)" : "transparent", color: chon ? TEXT : MUTED, fontWeight: chon ? 600 : 500 }}
                >
                  {nhan}
                </button>
              );
            })}
          </div>
          {tinHieuTat && (
            <p className="text-xs mt-1.5" style={{ color: VANG }}>
              Đang chọn “Không nhận tín hiệu” nên sẽ không có thông báo tín hiệu nào được gửi, dù các ô trên đã tích.
            </p>
          )}
          {hoSo.phamVi === "danh_muc" && (
            <p className="text-xs mt-1.5" style={{ color: MUTED }}>
              Chỉ các mã bạn bấm “Tham gia” ({hoSo.soMa} mã) —{" "}
              <Link href="/danh-muc" style={{ color: PRIMARY }}>
                xem Danh mục theo dõi
              </Link>
              .
            </p>
          )}
        </div>
        {!hoSo.daDuyet && !hoSo.laAdmin && (
          <p className="text-xs mt-3" style={{ color: VANG }}>
            Tài khoản đang chờ duyệt — thông báo tín hiệu về máy bắt đầu khi được duyệt.
          </p>
        )}
        <p className="text-[11px] mt-3" style={{ color: MUTED }}>
          Thông báo phái sinh gửi trong giờ giao dịch khi hệ thống đang chạy (hoặc có người mở trang{" "}
          <Link href="/phai-sinh" style={{ color: PRIMARY }}>
            Phái sinh
          </Link>
          ); trang đó còn có tiếng bíp riêng khi bạn đang mở. “Dấu hiệu hồi phục” và “Dấu hiệu tạo đáy” chỉ là nhắc theo dõi, không phải điểm mua chính. Tín hiệu chỉ để tham khảo, không phải khuyến nghị đầu tư.
        </p>
      </The>
    </div>
  );
}
