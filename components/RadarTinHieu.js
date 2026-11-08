"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import ModalTaiKhoan from "@/components/ModalTaiKhoan";
import { LOAI_RADAR } from "@/lib/radarSuKien";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";

// RADAR TIN HIEU (trang chu): luoi cac ma, vach quet chay ngang, ma nao co su kien trong phien thi sang len khi vach quet qua; ben phai la danh sach "Vua phat hien".
// Du lieu: server dung tu du lieu web da co (lib/radarSuKien.js) - khach chua dang nhap chi nhan loai thi truong, loai con lai bi khoa.
// cacMa: mang ma xep A-Z; suKien: [{ma, loai, moTa}]; dem: {loai: so ma that}; khoa: true neu la khach (hien nut mo khoa).
export default function RadarTinHieu({ cacMa, suKien, dem, ngay, gio, khoa }) {
  const [loc, setLoc] = useState(null);
  const [moDangNhap, setMoDangNhap] = useState(false);
  const luoiRef = useRef(null);
  const theoMa = useMemo(() => new Map(suKien.map((s) => [s.ma, s])), [suKien]);
  const hienThi = useMemo(() => (loc ? suKien.filter((s) => s.loai === loc) : suKien), [suKien, loc]);
  const loaiHien = Object.keys(LOAI_RADAR).filter((l) => (khoa ? !LOAI_RADAR[l].thanhVien : true) && (dem[l] ?? 0) > 0);

  // Do vi tri ngang cua tung o dang sang (0..1) -> bien --p: o sang dung luc vach quet di qua (CSS animation-delay). Do lai khi doi cua so.
  useEffect(() => {
    const luoi = luoiRef.current;
    if (!luoi) return;
    const do_ = () => {
      const rong = luoi.clientWidth || 1;
      for (const o of luoi.querySelectorAll("[data-sang]")) o.style.setProperty("--p", ((o.offsetLeft + o.offsetWidth / 2) / rong).toFixed(3));
    };
    do_();
    const quanSat = new ResizeObserver(do_);
    quanSat.observe(luoi);
    return () => quanSat.disconnect();
  }, [cacMa, suKien]);

  return (
    <section className="rounded-2xl border mb-6 overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }} aria-label="Radar tín hiệu">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 pt-4">
        <p className="text-xs" style={{ color: MUTED, fontFamily: "var(--font-chu)", letterSpacing: "0.04em" }} data-may="radar">
          RADAR · {cacMa.length} MÃ
        </p>
        <p className="flex items-center gap-2 text-[11px]" style={{ color: MUTED }}>
          <span className="cs-radar-diem" aria-hidden="true" />
          {ngay ? `Phiên ${ngay}` : "Phiên gần nhất"}
          {gio ? ` · cập nhật ${gio}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 px-4 sm:px-5 pt-3" role="group" aria-label="Lọc loại sự kiện">
        {loaiHien.map((l) => {
          const dang = loc === l;
          return (
            <button
              key={l}
              type="button"
              onClick={() => setLoc(dang ? null : l)}
              aria-pressed={dang}
              className="cs-radar-chip"
              style={{ "--c": LOAI_RADAR[l].mau }}
            >
              <span className="cs-radar-chip-cham" aria-hidden="true" />
              {LOAI_RADAR[l].nhan}
              <b>{dem[l]}</b>
            </button>
          );
        })}
        {khoa && (
          <button type="button" className="cs-radar-chip cs-radar-chip--khoa" onClick={() => setMoDangNhap(true)}>
            <Lock size={12} aria-hidden="true" /> Tín hiệu mua · Hồi phục · Tạo đáy: đăng nhập để xem
          </button>
        )}
        {loaiHien.length === 0 && !khoa && (
          <span className="text-xs" style={{ color: MUTED }}>
            Phiên này chưa có sự kiện nào đáng chú ý.
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_330px] gap-0 mt-3">
        <div className="px-4 sm:px-5 pb-4">
          <div ref={luoiRef} className="cs-radar-luoi" role="list">
            <span className="cs-radar-quet" aria-hidden="true" />
            {cacMa.map((ma) => {
              const s = theoMa.get(ma);
              const sang = s && (!loc || loc === s.loai);
              return (
                <Link
                  key={ma}
                  href={`/ma/${ma}`}
                  role="listitem"
                  className={`cs-radar-o${sang ? " cs-radar-o--sang" : ""}`}
                  style={sang ? { "--c": LOAI_RADAR[s.loai].mau } : undefined}
                  {...(sang ? { "data-sang": "", "aria-label": `${ma}: ${LOAI_RADAR[s.loai].nhan}, ${s.moTa}` } : {})}
                >
                  {ma}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="lg:border-l border-t lg:border-t-0 px-4 sm:px-5 py-4" style={{ borderColor: VIEN }}>
          <p className="text-[11px] mb-2" style={{ color: MUTED, letterSpacing: "0.04em" }}>
            VỪA PHÁT HIỆN
          </p>
          <ul className="cs-radar-dong max-h-[340px] overflow-y-auto pr-1">
            {hienThi.map((s) => (
              <li key={s.ma}>
                <Link href={`/ma/${s.ma}`} className="block py-2.5 border-b" style={{ borderColor: "var(--vien-nhe)" }}>
                  <span className="flex items-center gap-2">
                    <b className="text-[15px]" style={{ fontFamily: "var(--font-chu)" }}>
                      {s.ma}
                    </b>
                    <span className="cs-radar-the" style={{ "--c": LOAI_RADAR[s.loai].mau }}>
                      {LOAI_RADAR[s.loai].nhan}
                    </span>
                  </span>
                  <span className="block text-[13px] mt-0.5" style={{ color: "var(--mo-2)" }}>
                    {s.moTa}
                  </span>
                </Link>
              </li>
            ))}
            {hienThi.length === 0 && (
              <li className="py-6 text-sm" style={{ color: MUTED }}>
                Chưa có sự kiện nào trong phiên này.
              </li>
            )}
          </ul>
          <p className="text-[11px] mt-3" style={{ color: MUTED }}>
            Dấu hiệu để theo dõi, không phải lời khuyên mua bán. Giá so với biên độ thường ngày của chính mã đó.
          </p>
        </div>
      </div>
      {khoa && <ModalTaiKhoan open={moDangNhap} onClose={() => setMoDangNhap(false)} onThanhCong={() => window.location.reload()} tieuDeGoiY="Đăng ký hoặc đăng nhập miễn phí để xem tín hiệu mua, dấu hiệu hồi phục và tạo đáy." />}
    </section>
  );
}
