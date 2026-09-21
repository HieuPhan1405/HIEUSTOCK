"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";

const CHI_SO = new Set(["VNINDEX", "VN30", "HNXINDEX", "UPCOMINDEX"]);

// Dau thanh tach roi sau khi normalize("NFD") (U+0300-U+036F).
const DAU_KET_HOP = new RegExp("[" + String.fromCharCode(0x300) + "-" + String.fromCharCode(0x36f) + "]", "g");

// Bo dau + thuong hoa: "Ngân hàng Ngoại thương" -> "ngan hang ngoai thuong"
const chuanHoa = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(DAU_KET_HOP, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();

// Bo con tro khoi o tim (khong doc ref trong luc render).
const boTieuDiem = () => {
  if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) document.activeElement.blur();
};

const diDen = (ma) => (CHI_SO.has(ma) ? `/bieu-do?ma=${ma}` : `/ma/${ma}`);

// Thanh tim kiem ma co phieu o dau moi trang: go ma HOAC ten cong ty (khong dau cung duoc), mui ten len/xuong + Enter, phim "/" de nhay vao o tim.
// Danh sach ma + ten day du (~1.500 ma) chi tai khi nguoi dung bam vao o tim (tach goi rieng, khong lam nang cac trang).
export default function TimMaToanCuc({ className = "" }) {
  const router = useRouter();
  const oRef = useRef(null);
  const khungRef = useRef(null);
  const [du, setDu] = useState(null);
  const [q, setQ] = useState("");
  const [mo, setMo] = useState(false);
  const [chon, setChon] = useState(0);

  // Phim tat "/" (khi khong dang go trong o nhap nao khac).
  useEffect(() => {
    function khiBam(e) {
      const the = document.activeElement?.tagName;
      if (e.key === "/" && the !== "INPUT" && the !== "TEXTAREA" && the !== "SELECT" && !document.activeElement?.isContentEditable) {
        e.preventDefault();
        oRef.current?.focus();
      }
    }
    window.addEventListener("keydown", khiBam);
    return () => window.removeEventListener("keydown", khiBam);
  }, []);

  // Bam ra ngoai thi dong danh sach goi y.
  useEffect(() => {
    function khiBamNgoai(e) {
      if (khungRef.current && !khungRef.current.contains(e.target)) setMo(false);
    }
    document.addEventListener("mousedown", khiBamNgoai);
    return () => document.removeEventListener("mousedown", khiBamNgoai);
  }, []);

  function taiDuLieu() {
    if (du) return;
    import("@/lib/tenCongTy").then((m) => setDu(m.TEN_CONG_TY));
  }

  const chiMuc = useMemo(
    () =>
      du
        ? Object.entries(du).map(([ma, [ten, ngan, san]]) => ({ ma, ten, ngan, san, kMa: ma.toLowerCase(), kTen: chuanHoa(ten), kNgan: chuanHoa(ngan) }))
        : [],
    [du]
  );

  const goiY = useMemo(() => {
    const k = chuanHoa(q).trim();
    if (!k) return [];
    const kq = [];
    for (const x of chiMuc) {
      let diem = null;
      if (x.kMa === k) diem = 0;
      else if (x.kMa.startsWith(k)) diem = 1;
      else if (x.kNgan.startsWith(k) || x.kTen.split(" ").some((t) => t.startsWith(k))) diem = 2;
      else if (k.length >= 2 && (x.kTen.includes(k) || x.kNgan.includes(k))) diem = 3;
      if (diem !== null) kq.push({ ...x, diem });
    }
    kq.sort((a, b) => a.diem - b.diem || a.ma.length - b.ma.length || a.ma.localeCompare(b.ma));
    return kq.slice(0, 8);
  }, [q, chiMuc]);

  function den(ma) {
    setMo(false);
    setQ("");
    boTieuDiem();
    router.push(diDen(ma));
  }

  function khiGui(e) {
    e.preventDefault();
    const chonRoi = goiY[chon];
    if (chonRoi) return den(chonRoi.ma);
    const t = q.trim().toUpperCase();
    if (/^[A-Z0-9]{2,12}$/.test(t)) den(t);
  }

  function khiBamPhim(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMo(true);
      setChon((c) => Math.min(c + 1, Math.max(goiY.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setChon((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      khiGui(e);
    } else if (e.key === "Escape") {
      setMo(false);
      boTieuDiem();
    }
  }

  const coGoiY = mo && q.trim() !== "";

  return (
    <div ref={khungRef} className={`relative ${className}`}>
      <form onSubmit={khiGui} role="search" className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" color={MUTED} aria-hidden="true" />
        <input
          ref={oRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setMo(true);
            setChon(0);
          }}
          onFocus={() => {
            taiDuLieu();
            setMo(true);
          }}
          onKeyDown={khiBamPhim}
          type="search"
          autoComplete="off"
          spellCheck={false}
          maxLength={40}
          role="combobox"
          aria-expanded={coGoiY}
          aria-controls="danh-sach-goi-y-ma"
          aria-label="Tìm mã cổ phiếu hoặc tên công ty"
          placeholder="Tìm mã hoặc tên công ty…"
          className="w-full pl-9 pr-9 py-2 text-sm outline-none rounded-lg truncate"
          style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "'Inter', sans-serif" }}
        />
        <kbd
          className="hidden md:block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded pointer-events-none"
          style={{ border: `1px solid ${VIEN}`, color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}
        >
          /
        </kbd>
      </form>

      {coGoiY && (
        <ul
          id="danh-sach-goi-y-ma"
          role="listbox"
          className="absolute left-0 right-0 mt-1.5 rounded-xl overflow-hidden shadow-2xl z-40"
          style={{ background: NEN_CARD, border: `1px solid ${VIEN}` }}
        >
          {goiY.length === 0 ? (
            <li className="px-3 py-3 text-xs" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
              {du ? `Không thấy mã hay công ty nào khớp "${q.trim()}".` : "Đang tải danh sách mã…"}
            </li>
          ) : (
            goiY.map((x, i) => (
              <li key={x.ma} role="option" aria-selected={i === chon}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => den(x.ma)}
                  onMouseEnter={() => setChon(i)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left cursor-pointer"
                  style={{ background: i === chon ? "rgba(108,92,231,0.16)" : "transparent" }}
                >
                  <span className="shrink-0 w-[68px] text-sm" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: i === chon ? "#FFFFFF" : TEXT }}>
                    {x.ma}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                    {x.ten}
                  </span>
                  <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded" style={{ color: PRIMARY, background: "rgba(108,92,231,0.14)", fontFamily: "'Inter', sans-serif" }}>
                    {x.san}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
