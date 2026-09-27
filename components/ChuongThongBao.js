"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellRing, BellOff, Check } from "lucide-react";
import ModalTaiKhoan from "@/components/ModalTaiKhoan";
import { LOAI_THONG_BAO, PHAM_VI, demChuaXem } from "@/lib/thongBao";
import { hoTroDay, laIOSChuaCaiDat, quyenHienTai, layDangKyHienTai, batDay, tatDay, dongBoDay, guiThu } from "@/lib/dayTrinhDuyet";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";
const DO = "#EF4444";
const XANH = "#22C55E";
const VANG = "#FBBF24";
const sans = { fontFamily: "'Inter', sans-serif" };

const CHU_KY_MS = 3 * 60 * 1000;
const KHOA_XEM_KHACH = "cs_tb_xem_luc";

const docLS = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const ghiLS = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* trinh duyet chan luu tru */
  }
};

const ngayVN = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
const gioVN = (d) => new Date(d).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" });
function nhanNgay(ngay) {
  const homNay = ngayVN(new Date());
  const homQua = ngayVN(new Date(Date.now() - 86400e3));
  if (ngay === homNay) return "Hôm nay";
  if (ngay === homQua) return "Hôm qua";
  return ngay.slice(8, 10) + "/" + ngay.slice(5, 7);
}

// CHUONG THONG BAO tren thanh dau (moi trang): tin hieu Mua / Ban / Mua moi / Ban bot cua cac phien gan day (giong "Top co hoi" trang dau), quan tri thay them nguoi dang ky moi.
// Trong khung: bat / tat THONG BAO VE MAY (nhan ca khi da dong web - lib/dayTrinhDuyet.js), chon pham vi tin hieu. Du lieu: /api/thong-bao.
export default function ChuongThongBao() {
  const [du, setDu] = useState(null);
  const [mo, setMo] = useState(false);
  const [xemTruoc, setXemTruoc] = useState(null); // moc "da xem" luc vua mo khung - to dam cac thong bao moi hon moc nay
  const [chuaXemKhach, setChuaXemKhach] = useState(0);
  const [day, setDay] = useState({ hoTro: false, ios: false, quyen: "default", dangBat: false });
  const [dangLam, setDangLam] = useState(false);
  const [loiDay, setLoiDay] = useState("");
  const [baoDay, setBaoDay] = useState("");
  const [moDangNhap, setMoDangNhap] = useState(false);
  const goc = useRef(null);

  const tai = useCallback(async () => {
    try {
      const res = await fetch("/api/thong-bao", { cache: "no-store" });
      if (!res.ok) return setDu((c) => c ?? { ds: [], loi: true });
      const d = await res.json();
      setDu(d);
      // Khach: moc da xem luu o trinh duyet; chua mo lan nao -> chi tinh 24 gio qua (giong tai khoan).
      if (!d.nguoiDung) setChuaXemKhach(demChuaXem(d.ds, docLS(KHOA_XEM_KHACH) ?? new Date(Date.now() - 86400e3)));
    } catch {
      setDu((c) => c ?? { ds: [], loi: true }); // mat mang - giu du lieu cu neu da co
    }
  }, []);

  // Tai lan dau + moi 3 phut khi tab dang hien; quay lai tab thi tai ngay.
  useEffect(() => {
    const t0 = setTimeout(tai, 0);
    const nhip = () => document.visibilityState === "visible" && tai();
    const t = setInterval(nhip, CHU_KY_MS);
    document.addEventListener("visibilitychange", nhip);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
      document.removeEventListener("visibilitychange", nhip);
    };
  }, [tai]);

  // Trang thai thong bao ve may cua trinh duyet nay; da bat tu truoc thi gan lai cho tai khoan dang dang nhap.
  const daDangNhap = !!du?.nguoiDung;
  useEffect(() => {
    let huy = false;
    (async () => {
      const hoTro = hoTroDay();
      const sub = hoTro ? await (daDangNhap ? dongBoDay() : layDangKyHienTai()).catch(() => null) : null;
      if (!huy) setDay({ hoTro, ios: laIOSChuaCaiDat(), quyen: quyenHienTai(), dangBat: !!sub });
    })();
    return () => {
      huy = true;
    };
  }, [daDangNhap]);

  // Bam ra ngoai / Esc thi dong. Dang mo thi an Mây (dien thoai: khung rong het chieu ngang, Mây nap o mep phai de len - xem globals.css .thanh-dau-mo).
  useEffect(() => {
    document.body.classList.toggle("thanh-dau-mo", mo);
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

  const chuaXem = du?.nguoiDung ? (du.chuaXem ?? 0) : chuaXemKhach;

  function batTat() {
    if (mo) return setMo(false);
    setMo(true);
    setLoiDay("");
    setBaoDay("");
    const bayGio = new Date().toISOString();
    const macDinh = new Date(Date.now() - 86400e3).toISOString(); // chua mo lan nao: to dam thong bao 24 gio qua
    if (du?.nguoiDung) {
      setXemTruoc(du.xemLuc ?? macDinh);
      if (du.chuaXem || !du.xemLuc) {
        fetch("/api/thong-bao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hanhDong: "da_xem" }) }).catch(() => {});
        setDu((c) => ({ ...c, chuaXem: 0, xemLuc: bayGio }));
      }
    } else {
      setXemTruoc(docLS(KHOA_XEM_KHACH) ?? macDinh);
      ghiLS(KHOA_XEM_KHACH, bayGio);
      setChuaXemKhach(0);
    }
  }

  async function lam(viec) {
    setDangLam(true);
    setLoiDay("");
    setBaoDay("");
    try {
      await viec();
    } catch (e) {
      setLoiDay(String(e?.message || e));
    } finally {
      setDay((c) => ({ ...c, quyen: quyenHienTai() }));
      setDangLam(false);
    }
  }

  const bat = () =>
    lam(async () => {
      await batDay(du.khoaDay);
      setDay((c) => ({ ...c, dangBat: true }));
      setBaoDay("Đã bật. Bấm “Gửi thử” để xem thông báo hiện ra thế nào.");
    });
  const tat = () =>
    lam(async () => {
      await tatDay();
      setDay((c) => ({ ...c, dangBat: false }));
    });
  const thu = () =>
    lam(async () => {
      await guiThu();
      setBaoDay("Đã gửi — thông báo sẽ hiện trong vài giây.");
    });
  const doiPhamVi = (phamVi) =>
    lam(async () => {
      const res = await fetch("/api/thong-bao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hanhDong: "pham_vi", phamVi }) });
      if (!res.ok) throw new Error("Chưa lưu được, thử lại.");
      setDu((c) => ({ ...c, nguoiDung: { ...c.nguoiDung, phamVi } }));
    });

  // Nhom theo PHIEN cua su kien (dang ky moi: ngay dang ky, gio Viet Nam).
  const nhom = [];
  for (const t of du?.ds ?? []) {
    const ngay = t.ngay ?? ngayVN(t.tao_luc);
    if (!nhom.length || nhom[nhom.length - 1].ngay !== ngay) nhom.push({ ngay, ds: [] });
    nhom[nhom.length - 1].ds.push(t);
  }
  const moc = xemTruoc ? new Date(xemTruoc).getTime() : 0;
  const nd = du?.nguoiDung;

  return (
    <div ref={goc} className="relative" data-may="thong-bao">
      <button
        type="button"
        onClick={batTat}
        aria-expanded={mo}
        aria-label={chuaXem ? `Thông báo — ${chuaXem} chưa xem` : "Thông báo"}
        className="relative w-9 h-9 rounded-lg border flex items-center justify-center transition-colors hover:bg-white/[0.04]"
        style={{ borderColor: mo ? PRIMARY : VIEN, background: NEN_CARD, color: chuaXem ? TEXT : MUTED }}
      >
        {chuaXem ? <BellRing size={17} strokeWidth={2} aria-hidden="true" /> : <Bell size={17} strokeWidth={2} aria-hidden="true" />}
        {chuaXem > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: DO, color: "#FFFFFF", ...sans, border: "2px solid #0B0B10" }}
          >
            {chuaXem > 9 ? "9+" : chuaXem}
          </span>
        )}
      </button>

      {mo && (
        <div
          role="dialog"
          aria-label="Thông báo"
          className="fixed left-2 right-2 top-[60px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px] rounded-2xl border shadow-2xl flex flex-col max-h-[calc(100vh-76px)] sm:max-h-[min(640px,calc(100vh-90px))]"
          style={{ borderColor: VIEN, background: NEN_CARD, zIndex: 45, ...sans }}
        >
          <div className="px-4 pt-3.5 pb-3 border-b" style={{ borderColor: VIEN }}>
            <p className="text-sm font-bold" style={{ color: TEXT }}>
              Thông báo
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
              Tín hiệu Mua · Bán · Mua mới · Bán bớt của các phiên gần đây{nd?.laAdmin ? " · người mới đăng ký" : ""}.
            </p>
          </div>

          {/* THONG BAO VE MAY */}
          <div className="px-4 py-3 border-b text-xs" style={{ borderColor: VIEN, color: MUTED }}>
            {!nd ? (
              <div className="flex items-center justify-between gap-3">
                <span>Đăng ký hoặc đăng nhập để nhận thông báo về máy — cả khi đã đóng web.</span>
                <button type="button" onClick={() => setMoDangNhap(true)} className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: PRIMARY, color: "#FFFFFF" }}>
                  Đăng ký
                </button>
              </div>
            ) : day.ios ? (
              <p>
                <b style={{ color: TEXT }}>Trên iPhone / iPad:</b> bấm nút Chia sẻ <span aria-hidden="true">⎋</span> → <b style={{ color: TEXT }}>“Thêm vào MH chính”</b>, mở CloudStock từ biểu tượng
                đó rồi bật thông báo ở đây.
              </p>
            ) : !day.hoTro ? (
              <p>Trình duyệt này chưa hỗ trợ thông báo về máy — dùng Chrome, Edge, Firefox hoặc Safari bản mới.</p>
            ) : day.quyen === "denied" && !day.dangBat ? (
              <p>
                <BellOff size={13} className="inline -mt-0.5 mr-1" color={VANG} aria-hidden="true" />
                Bạn đã chặn thông báo của web này. Bấm biểu tượng ổ khóa cạnh địa chỉ web → cho phép <b style={{ color: TEXT }}>Thông báo</b>, rồi tải lại trang.
              </p>
            ) : day.dangBat ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 font-semibold" style={{ color: XANH }}>
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" /> Đang bật trên máy này
                </span>
                <span className="ml-auto flex gap-1.5">
                  <button type="button" disabled={dangLam} onClick={thu} className="px-2.5 py-1 rounded-md border" style={{ borderColor: VIEN, color: TEXT }}>
                    Gửi thử
                  </button>
                  <button type="button" disabled={dangLam} onClick={tat} className="px-2.5 py-1 rounded-md border" style={{ borderColor: VIEN, color: MUTED }}>
                    Tắt
                  </button>
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span>Nhận thông báo về máy ngay khi có tín hiệu — cả khi đã đóng web.</span>
                <button type="button" disabled={dangLam} onClick={bat} className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: PRIMARY, color: "#FFFFFF" }}>
                  {dangLam ? "Đang bật…" : "Bật thông báo"}
                </button>
              </div>
            )}

            {nd && (
              <div className="mt-2.5">
                <p className="mb-1.5">Nhận tín hiệu của:</p>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Phạm vi nhận tín hiệu">
                  {Object.entries(PHAM_VI).map(([k, nhan]) => {
                    const chon = (nd.phamVi ?? "tat_ca") === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        role="radio"
                        aria-checked={chon}
                        disabled={dangLam}
                        onClick={() => !chon && doiPhamVi(k)}
                        className="px-2.5 py-1 rounded-full border text-[11px]"
                        style={{ borderColor: chon ? PRIMARY : VIEN, background: chon ? "rgba(108,92,231,0.16)" : "transparent", color: chon ? TEXT : MUTED, fontWeight: chon ? 600 : 500 }}
                      >
                        {nhan}
                      </button>
                    );
                  })}
                </div>
                {(nd.phamVi ?? "tat_ca") === "danh_muc" && (
                  <p className="mt-1.5 text-[11px]">
                    Mã bạn bấm “Tham gia” —{" "}
                    <Link href="/danh-muc" onClick={() => setMo(false)} style={{ color: PRIMARY }}>
                      xem Danh mục theo dõi
                    </Link>
                    .
                  </p>
                )}
                {!nd.daDuyet && !nd.laAdmin && (
                  <p className="mt-1.5 text-[11px]" style={{ color: VANG }}>
                    Tài khoản đang chờ duyệt — thông báo tín hiệu về máy bắt đầu khi được duyệt.
                  </p>
                )}
                {nd.laAdmin && <p className="mt-1.5 text-[11px]">Quản trị: nhận thêm thông báo khi có người đăng ký mới.</p>}
              </div>
            )}
            {loiDay && (
              <p className="mt-2 text-[11px]" style={{ color: DO }}>
                {loiDay}
              </p>
            )}
            {baoDay && (
              <p className="mt-2 text-[11px]" style={{ color: XANH }}>
                {baoDay}
              </p>
            )}
          </div>

          {/* DANH SACH */}
          <div className="overflow-y-auto flex-1 py-1">
            {!du ? (
              <p className="px-4 py-6 text-xs" style={{ color: MUTED }}>
                Đang tải…
              </p>
            ) : nhom.length === 0 ? (
              <p className="px-4 py-6 text-xs" style={{ color: MUTED }}>
                {du.loi ? "Chưa tải được thông báo — thử lại sau ít phút." : "Chưa có thông báo nào trong 7 ngày qua."}
              </p>
            ) : (
              nhom.map((n) => (
                <div key={n.ngay}>
                  <p className="px-4 pt-2.5 pb-1 text-[10px] uppercase tracking-wide font-semibold" style={{ color: MUTED }}>
                    {nhanNgay(n.ngay)}
                  </p>
                  {n.ds.map((t) => {
                    const loai = LOAI_THONG_BAO[t.loai] ?? { nhan: t.loai, mau: MUTED };
                    const moi = new Date(t.tao_luc).getTime() > moc;
                    return (
                      <Link
                        key={t.id}
                        href={t.duong_dan || "/"}
                        onClick={() => setMo(false)}
                        className="flex gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.04]"
                        style={{ background: moi ? "rgba(108,92,231,0.08)" : undefined }}
                      >
                        <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: loai.mau }} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-2">
                            <span className="text-[13px] font-semibold truncate" style={{ color: TEXT }}>
                              {t.tieu_de}
                            </span>
                            {/* Gio web thay su kien - chi hien khi cung ngay voi phien (nap lai sau phien thi an, tranh nham gio). */}
                            {ngayVN(t.tao_luc) === n.ngay && (
                              <span className="ml-auto text-[10px] shrink-0" style={{ color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>
                                {gioVN(t.tao_luc)}
                              </span>
                            )}
                          </span>
                          {t.noi_dung && (
                            <span className="block text-[11px] leading-snug mt-0.5" style={{ color: MUTED }}>
                              {t.noi_dung}
                            </span>
                          )}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <p className="px-4 py-2 border-t text-[10px]" style={{ borderColor: VIEN, color: MUTED }}>
            Tín hiệu chỉ để tham khảo, không phải khuyến nghị đầu tư. Tín hiệu trong phiên có thể đổi trước khi đóng cửa.
          </p>
        </div>
      )}
      <ModalTaiKhoan open={moDangNhap} onClose={() => setMoDangNhap(false)} onThanhCong={() => window.location.reload()} />
    </div>
  );
}
