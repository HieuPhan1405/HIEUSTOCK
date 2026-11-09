"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import ModalTaiKhoan from "@/components/ModalTaiKhoan";
import { LOAI_RADAR } from "@/lib/radarSuKien";
import { NGANH_NHAN } from "@/lib/nganh";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";

// RADAR TIN HIEU (trang chu): TAT CA ma dang theo doi, xep theo NGANH (nhu bang dien); vach quet chay ngang, ma nao co su kien trong phien thi sang len khi vach quet qua; ben phai la danh sach "Vua phat hien".
// Mac dinh chi sang cac ma NOI BAT (moi loai vai ma quan trong nhat); chon 1 loai (chip) thi sang TAT CA ma cua loai do va danh sach liet ke het.
// Du lieu: server dung tu du lieu web da co (lib/radarSuKien.js) - khach chua dang nhap chi nhan loai thi truong, loai con lai bi khoa.
// cacMa: [[ma, nganh]]; suKien: [{ma, loai, moTa, top}]; dem: {loai: so ma that}; khoa: true neu la khach (hien nut mo khoa).
export default function RadarTinHieu({ cacMa, suKien, dem, ngay, gio, khoa }) {
  const [loc, setLoc] = useState(null);
  // Dien thoai: mac dinh chi hien ma co su kien (luoi day du dai > 2000px); may tinh: hien tat ca. Bam nut de doi.
  const nho = useSyncExternalStore(
    (dangKy) => {
      const m = window.matchMedia("(max-width: 639px)");
      m.addEventListener("change", dangKy);
      return () => m.removeEventListener("change", dangKy);
    },
    () => window.matchMedia("(max-width: 639px)").matches,
    () => false
  );
  const [che, setChe] = useState(null);
  const gon = (che ?? (nho ? "gon" : "day")) === "gon";
  const [moDangNhap, setMoDangNhap] = useState(false);
  const luoiRef = useRef(null);

  // Su kien hien thi tren luoi: mac dinh = o noi bat (moi ma 1 su kien); co loc = moi ma cua loai do.
  const theoMa = useMemo(() => {
    const m = new Map();
    for (const s of suKien) if (loc ? s.loai === loc : s.top) m.set(s.ma, s);
    return m;
  }, [suKien, loc]);
  const hienThi = useMemo(() => (loc ? suKien.filter((s) => s.loai === loc) : suKien.filter((s) => s.top)), [suKien, loc]);
  const loaiHien = Object.keys(LOAI_RADAR).filter((l) => (khoa ? !LOAI_RADAR[l].thanhVien : true) && (dem[l] ?? 0) > 0);

  // Nhom theo nganh: nganh nhieu ma truoc, "Khac" / khong ro nganh cuoi; trong nganh xep A-Z.
  const nhom = useMemo(() => {
    const theoNganh = new Map();
    for (const [ma, nganh] of cacMa) {
      const k = nganh && nganh !== "Khac" ? nganh : "Khac";
      if (!theoNganh.has(k)) theoNganh.set(k, []);
      theoNganh.get(k).push(ma);
    }
    return [...theoNganh.entries()]
      .map(([k, ds]) => ({ khoa: k, ten: NGANH_NHAN[k] || k, cacMa: ds.sort() }))
      .sort((a, b) => (a.khoa === "Khac") - (b.khoa === "Khac") || b.cacMa.length - a.cacMa.length || a.ten.localeCompare(b.ten));
  }, [cacMa]);

  // Do vi tri ngang cua tung o dang sang (0..1) -> bien --p: o sang dung luc vach quet di qua (CSS animation-delay). Do lai khi doi cua so / bo loc.
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
  }, [nhom, theoMa, gon]);

  return (
    <section className="rounded-2xl border mb-6 overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }} aria-label="Radar tín hiệu">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 pt-4">
        <p className="text-xs" style={{ color: MUTED, fontFamily: "var(--font-chu)", letterSpacing: "0.04em" }} data-may="radar">
          RADAR · {cacMa.length} MÃ THEO NGÀNH
        </p>
        <p className="flex items-center gap-2 text-[11px]" style={{ color: MUTED }}>
          <span className="cs-radar-diem" aria-hidden="true" />
          {ngay ? `Phiên ${ngay}` : "Phiên gần nhất"}
          {gio ? ` · cập nhật ${gio}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 pt-3" role="group" aria-label="Lọc loại sự kiện">
        {loaiHien.map((l) => {
          const dang = loc === l;
          return (
            <button key={l} type="button" onClick={() => setLoc(dang ? null : l)} aria-pressed={dang} className="cs-radar-chip" style={{ "--c": LOAI_RADAR[l].mau }}>
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
        <button type="button" onClick={() => setChe(gon ? "day" : "gon")} className="cs-radar-chip ml-auto" style={{ "--c": "var(--tim-nhat)" }}>
          {gon ? "Hiện tất cả mã" : "Chỉ hiện mã có sự kiện"}
        </button>
      </div>

      <div className="mt-3">
        <div className="px-4 sm:px-5 pb-4">
          <div ref={luoiRef} className="cs-radar-luoi" role="list">
            <span className="cs-radar-quet" aria-hidden="true" />
            {nhom.map((n) => {
              const ds = gon ? n.cacMa.filter((ma) => theoMa.has(ma)) : n.cacMa;
              if (!ds.length) return null;
              return (
                <div key={n.khoa} className="cs-radar-nhom" role="group" aria-label={n.ten}>
                  <p className="cs-radar-nhom-ten">
                    {n.ten} <span>{n.cacMa.length}</span>
                  </p>
                  <div className="cs-radar-o-luoi">
                    {ds.map((ma) => {
                      const s = theoMa.get(ma);
                      return (
                        <Link
                          key={ma}
                          href={`/ma/${ma}`}
                          role="listitem"
                          className={`cs-radar-o${s ? " cs-radar-o--sang" : ""}`}
                          style={s ? { "--c": LOAI_RADAR[s.loai].mau } : undefined}
                          {...(s ? { "data-sang": "", "aria-label": `${ma}: ${LOAI_RADAR[s.loai].nhan}, ${s.moTa}` } : {})}
                        >
                          {ma}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t px-4 sm:px-5 py-4" style={{ borderColor: VIEN }}>
          <p className="text-[11px] mb-2" style={{ color: MUTED, letterSpacing: "0.04em" }}>
            {loc ? `${LOAI_RADAR[loc].nhan.toUpperCase()} · ${hienThi.length} MÃ` : "VỪA PHÁT HIỆN"}
          </p>
          <ul className="cs-radar-dong grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 max-h-[360px] overflow-y-auto pr-1">
            {hienThi.map((s) => (
              <li key={`${s.loai}:${s.ma}`}>
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
            {loc ? "Bấm lại chip để về danh sách nổi bật. " : "Mỗi loại hiện vài mã nổi bật nhất; bấm một loại để xem hết. "}Dấu hiệu để theo dõi, không phải lời khuyên mua bán. Giá và dòng tiền so với biên độ, thanh khoản thường ngày của chính mã đó.
          </p>
        </div>
      </div>
      {khoa && <ModalTaiKhoan open={moDangNhap} onClose={() => setMoDangNhap(false)} onThanhCong={() => window.location.reload()} tieuDeGoiY="Đăng ký hoặc đăng nhập miễn phí để xem tín hiệu mua, dấu hiệu hồi phục và tạo đáy." />}
    </section>
  );
}
