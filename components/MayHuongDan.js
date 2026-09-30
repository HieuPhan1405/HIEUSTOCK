"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { layGioiThieu, layGiaiThich, duocChao, chonLoiChao, CHAO } from "@/lib/noiDungMay";

const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const TIM = "var(--tim-nhat)";

// Hinh "Mây" (tam thoi ve bang SVG theo logo dam may - co hinh Mây that cua kenh TikTok thi thay vao day). Mat chop, nguoi nhun nhe (CSS trong globals.css, tat khi
// nguoi dung chon giam chuyen dong).
function HinhMay() {
  return (
    <svg viewBox="0 0 120 92" className="block w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id="mayNen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9D1FF" />
          <stop offset="1" stopColor="#8B7CF6" />
        </linearGradient>
      </defs>
      <g fill="url(#mayNen)">
        <circle cx="36" cy="52" r="24" />
        <circle cx="62" cy="36" r="29" />
        <circle cx="89" cy="54" r="22" />
        <rect x="28" y="52" width="72" height="28" rx="14" />
      </g>
      <ellipse className="may-mat" cx="52" cy="52" rx="4.6" ry="6.2" fill="#1B1640" />
      <ellipse className="may-mat" cx="74" cy="52" rx="4.6" ry="6.2" fill="#1B1640" />
      <circle cx="53.6" cy="49.6" r="1.6" fill="#FFFFFF" />
      <circle cx="75.6" cy="49.6" r="1.6" fill="#FFFFFF" />
      <circle cx="44" cy="62" r="4.2" fill="#FF8FB1" opacity="0.55" />
      <circle cx="82" cy="62" r="4.2" fill="#FF8FB1" opacity="0.55" />
      <path d="M56 63 Q63 70 70 63" stroke="#1B1640" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// Gio / thu / ngay theo gio Viet Nam (thu 0 = Chu nhat) - de chon loi chao theo buoi va dem so lan tat trong ngay.
function thoiGianVN() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "numeric", minute: "numeric", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value])
  );
  return { gio: Number(p.hour) + Number(p.minute) / 60, thu: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), homNay: `${p.year}-${p.month}-${p.day}` };
}
// Trang thai loi chao nho trong trinh duyet (loi o day - vd che do rieng tu chan localStorage - thi coi nhu chua chao, khong lam hong trang).
const KHOA_LUU = "may-chao";
function docLuu() {
  try {
    return JSON.parse(window.localStorage.getItem(KHOA_LUU) || "null");
  } catch {
    return null;
  }
}
function ghiLuu(v) {
  try {
    window.localStorage.setItem(KHOA_LUU, JSON.stringify(v));
  } catch {
    // bo qua
  }
}

// NHAN VAT HUONG DAN "MÂY": nap o mep phai man hinh (lap lo), BAM VAO moi mo khung chi dan - khong tu bat len. Khi mo:
//  - khung chi dan gioi thieu trang dang xem + meo (lib/noiDungMay.js);
//  - cac cho danh dau data-may="<khoa>" hien vien cham tim; dua chuot / focus / cham vao cho nao thi Mây giai thich cho do (cham = khong mo lien ket, de doc giai thich);
//  - Esc hoac nut X de dong, Mây nap lai.
//  - Thinh thoang (lib/noiDungMay.js CHAO) Mây tho ra chao + hoi can giup gi khong: bong bong nho, tu an; bam vao bong bong = mo khung chi dan; tat 2 lan trong ngay = im den het ngay.
export default function MayHuongDan() {
  const duongDan = usePathname();
  const [mo, setMo] = useState(false);
  const [dangXem, setDangXem] = useState(null); // { khoa, ten, noiDung, duongDan }
  const [loiChao, setLoiChao] = useState(null); // { noiDung, duongDan }
  const khungRef = useRef(null);
  const gioiThieu = layGioiThieu(duongDan);
  // Giai thich chi con dung o trang da chon - sang trang khac thi quay ve loi gioi thieu trang.
  const xem = dangXem && dangXem.duongDan === duongDan ? dangXem : null;

  // Hen gio chao: sau CHAO.choLanDauMs o trang (khi khung chi dan dang dong), neu duoc chao (khong qua day, chua bi tat trong ngay) thi hien bong bong, tu an sau CHAO.hienMs.
  useEffect(() => {
    if (mo) return undefined;
    let hen = null;
    const cho = setTimeout(() => {
      const t = thoiGianVN();
      const luu = docLuu();
      if (!duocChao(luu, Date.now(), t.homNay)) return;
      ghiLuu({ ...(luu || {}), lan: Date.now() });
      setLoiChao({ noiDung: chonLoiChao({ duongDan, gio: t.gio, thu: t.thu, ngauNhien: Math.random() }), duongDan });
      hen = setTimeout(() => setLoiChao(null), CHAO.hienMs);
    }, CHAO.choLanDauMs);
    return () => {
      clearTimeout(cho);
      clearTimeout(hen);
    };
  }, [duongDan, mo]);
  const chaoHienTai = !mo && loiChao && loiChao.duongDan === duongDan ? loiChao : null;
  const tatChao = () => {
    setLoiChao(null);
    const t = thoiGianVN();
    const luu = docLuu() || {};
    const soLanDong = luu.ngayDong === t.homNay ? (luu.soLanDong || 0) + 1 : 1;
    ghiLuu({ ...luu, ngayDong: t.homNay, soLanDong, ...(soLanDong >= CHAO.tatSauSoLanDong ? { tatNgay: t.homNay } : {}) });
  };
  const moKhung = () => {
    setLoiChao(null);
    setMo(true);
  };

  useEffect(() => {
    if (!mo) return undefined;
    let phanTu = null;
    const danhDau = (el) => {
      if (phanTu && phanTu !== el) phanTu.classList.remove("may-dang-xem");
      if (el) el.classList.add("may-dang-xem");
      phanTu = el;
    };
    const tim = (dich) => {
      const el = dich?.closest?.("[data-may]");
      if (!el || khungRef.current?.contains(el)) return null;
      const khoa = el.getAttribute("data-may");
      const g = layGiaiThich(khoa);
      return g ? { el, khoa, g } : null;
    };
    const hienGiaiThich = (e) => {
      const r = tim(e.target);
      if (!r) return false;
      danhDau(r.el);
      setDangXem((cu) => (cu?.khoa === r.khoa && cu.duongDan === window.location.pathname ? cu : { khoa: r.khoa, ...r.g, duongDan: window.location.pathname }));
      return true;
    };
    // Cham / bam vao cho co giai thich: chi giai thich, khong mo lien ket / khong bam nut (chay truoc moi xu ly khac vi dang ky o window, pha capture).
    const bam = (e) => {
      if (hienGiaiThich(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const phim = (e) => {
      if (e.key === "Escape") setMo(false);
    };
    document.body.classList.add("may-mo");
    document.addEventListener("mouseover", hienGiaiThich);
    document.addEventListener("focusin", hienGiaiThich);
    window.addEventListener("click", bam, true);
    document.addEventListener("keydown", phim);
    return () => {
      document.body.classList.remove("may-mo");
      document.removeEventListener("mouseover", hienGiaiThich);
      document.removeEventListener("focusin", hienGiaiThich);
      window.removeEventListener("click", bam, true);
      document.removeEventListener("keydown", phim);
      danhDau(null);
    };
  }, [mo]);

  return (
    <>
      <button
        type="button"
        onClick={() => (mo ? setMo(false) : moKhung())}
        aria-expanded={mo}
        aria-label={mo ? "Đóng Mây hướng dẫn" : "Mở Mây hướng dẫn"}
        title={mo ? "Đóng Mây" : "Bấm để Mây hướng dẫn"}
        className={`may-nut fixed z-[60] ${mo ? "may-nut-mo" : chaoHienTai ? "may-nut-chao" : ""}`}
      >
        <span className="may-nhun block">
          <HinhMay />
        </span>
      </button>

      {chaoHienTai && (
        <div
          className="may-bong-chao fixed z-[60] flex items-start gap-1 rounded-2xl border pl-3 pr-1 py-2 shadow-xl"
          style={{ background: "var(--panel-tim)", borderColor: "rgba(167,139,250,0.55)", color: TEXT, fontFamily: "'Inter', sans-serif" }}
          role="status"
          aria-live="polite"
        >
          <button type="button" onClick={moKhung} className="text-left text-[13px] leading-snug" title="Bấm để Mây hướng dẫn">
            {chaoHienTai.noiDung}
          </button>
          <button type="button" onClick={tatChao} aria-label="Tắt lời chào" className="p-1 rounded hover:bg-[color:var(--hover-dam)] shrink-0">
            <X size={13} color={MUTED} />
          </button>
        </div>
      )}

      {mo && (
        <div
          ref={khungRef}
          role="dialog"
          aria-label="Mây hướng dẫn"
          className="may-khung fixed z-[60] rounded-2xl border p-4 shadow-2xl"
          style={{ background: "var(--card)", borderColor: "rgba(167,139,250,0.45)", color: TEXT, fontFamily: "'Inter', sans-serif" }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide" style={{ color: TIM, fontFamily: "'JetBrains Mono', monospace" }}>
                Mây hướng dẫn
              </p>
              <p className="text-base font-bold">{gioiThieu.ten}</p>
            </div>
            <button type="button" onClick={() => setMo(false)} aria-label="Đóng Mây hướng dẫn" className="p-1 rounded hover:bg-[color:var(--hover-dam)]">
              <X size={16} color={MUTED} />
            </button>
          </div>

          {xem && (
            <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.4)" }} aria-live="polite">
              <p className="text-xs font-bold" style={{ color: "var(--tim-chu)" }}>
                {xem.ten}
              </p>
              <p className="text-sm leading-relaxed mt-1">{xem.noiDung}</p>
            </div>
          )}

          <p className="text-sm leading-relaxed" style={{ color: "var(--chu-2)" }}>
            {gioiThieu.gioiThieu}
          </p>
          {gioiThieu.meo.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {gioiThieu.meo.map((m) => (
                <li key={m} className="text-xs leading-relaxed flex gap-1.5" style={{ color: "var(--chu-3)" }}>
                  <span style={{ color: TIM }}>•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          )}

          <p className="text-[11px] mt-4 leading-relaxed" style={{ color: MUTED }}>
            Đưa chuột (hoặc chạm) vào chữ có <span style={{ outline: `1px dashed ${TIM}`, outlineOffset: 2, borderRadius: 3 }}>viền chấm tím</span> để Mây giải thích. Bấm ✕ hoặc
            Esc để Mây nấp lại.
          </p>
          <Link href="/huong-dan" className="inline-block text-xs mt-2 underline" style={{ color: TIM }}>
            Xem Hướng dẫn đầy đủ →
          </Link>
        </div>
      )}
    </>
  );
}
