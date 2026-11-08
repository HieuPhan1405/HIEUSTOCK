"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, Check, Plus } from "lucide-react";
import { thaoTacDanhSach } from "@/lib/danhSachTheoDoiClient";
import { GIOI_HAN } from "@/lib/danhSachTheoDoiThuan";

const VIEN = "var(--vien)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const PRIMARY = "#8B5CF6";
const RONG = 272;
const LE = 12;

// Vi tri hop noi (fixed, cat trong man hinh): duoi nut neu du cho, khong thi phia tren. Dung chung cho hop chon danh sach 1 ma va hop luu ket qua bo loc.
export function viTriHop(nut, cao = 320) {
  const r = nut.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = Math.max(LE, Math.min(r.left, vw - RONG - LE));
  return vh - r.bottom >= Math.min(cao, 220) || r.top < vh - r.bottom ? { left, top: r.bottom + 6 } : { left, bottom: vh - r.top + 6 };
}

// Dong hop khi bam ra ngoai, Esc, cuon (ke ca cuon trong bang) hoac doi kich thuoc cua so.
export function useDongHop(mo, dong, refs) {
  useEffect(() => {
    if (!mo) return;
    const ngoai = (e) => {
      if (!refs.some((r) => r.current?.contains(e.target))) dong();
    };
    const phim = (e) => e.key === "Escape" && dong();
    const cuon = (e) => {
      if (!refs.some((r) => r.current?.contains(e.target))) dong();
    };
    document.addEventListener("pointerdown", ngoai);
    document.addEventListener("keydown", phim);
    window.addEventListener("scroll", cuon, true);
    window.addEventListener("resize", dong);
    return () => {
      document.removeEventListener("pointerdown", ngoai);
      document.removeEventListener("keydown", phim);
      window.removeEventListener("scroll", cuon, true);
      window.removeEventListener("resize", dong);
    };
    // refs la mang ref co dinh cua component goi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mo, dong]);
}

export function KhungHop({ viTri, hopRef, children, nhan }) {
  return createPortal(
    <div
      ref={hopRef}
      role="dialog"
      aria-label={nhan}
      className="cs-hop-noi rounded-xl border p-2 shadow-2xl"
      style={{ position: "fixed", ...viTri, width: RONG, zIndex: 95, background: "var(--card)", borderColor: VIEN, color: TEXT, fontFamily: "var(--font-chu)", fontSize: 14, lineHeight: 1.4 }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

// O tao danh sach moi (ten + nut Tao). onTao(ten) tra Promise.
export function OTaoDanhSach({ goiY = "", onTao, nhanNut = "Tạo" }) {
  const [mo, setMo] = useState(false);
  const [ten, setTen] = useState(goiY);
  const [dang, setDang] = useState(false);
  if (!mo)
    return (
      <button type="button" onClick={() => setMo(true)} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-[color:var(--hover-nhe)]" style={{ color: "var(--tim-chu)" }}>
        <Plus size={15} /> Tạo danh sách mới
      </button>
    );
  return (
    <form
      className="flex items-center gap-1.5 px-1 py-1"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!ten.trim() || dang) return;
        setDang(true);
        try {
          await onTao(ten.trim());
          setMo(false);
          setTen("");
        } finally {
          setDang(false);
        }
      }}
    >
      <input
        autoFocus
        value={ten}
        onChange={(e) => setTen(e.target.value)}
        maxLength={GIOI_HAN.doDaiTen}
        placeholder="Tên, vd: Ngân hàng"
        aria-label="Tên danh sách mới"
        className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-sm outline-none"
        style={{ background: "var(--nen-phu)", border: `1px solid ${VIEN}`, color: TEXT }}
      />
      <button type="submit" disabled={dang || !ten.trim()} className="px-2.5 py-1.5 rounded-lg text-sm font-semibold" style={{ background: PRIMARY, color: "#fff", opacity: dang || !ten.trim() ? 0.6 : 1 }}>
        {nhanNut}
      </button>
    </form>
  );
}

// HOP CHON DANH SACH cho 1 ma (kieu nut "Add to watchlist" cua TradingView / Simplize): tick de them / bo ma khoi tung danh sach, tao danh sach moi ngay tai cho.
// danhSach: tu kho chung (lib/danhSachTheoDoiClient.js); onDoiChinh(daCo, soNguoi): bao cho bang cha khi danh sach CHINH doi (de cap nhat so nguoi theo doi).
export default function HopChonDanhSach({ ma, nutRef, danhSach, daThamGiaChinh, onDoiChinh, onDong }) {
  const hopRef = useRef(null);
  const [viTri, setViTri] = useState(null);
  const [dangLuu, setDangLuu] = useState(null);
  const [loi, setLoi] = useState(null);
  useLayoutEffect(() => {
    if (nutRef.current) setViTri(viTriHop(nutRef.current));
  }, [nutRef]);
  useDongHop(true, onDong, [hopRef, nutRef]);

  const ds = danhSach ?? [{ id: "chinh", ten: "Danh sách chính", chinh: true, ma: daThamGiaChinh ? [{ ma }] : [] }];

  async function doi(d) {
    const co = d.ma.some((x) => x.ma === ma);
    setDangLuu(d.id);
    setLoi(null);
    try {
      const kq = await thaoTacDanhSach({ loai: co ? "bo" : "them", id: d.id, ma: [ma] });
      if (d.chinh) onDoiChinh?.(!co, kq.demThamGia?.[ma] ?? 0);
    } catch (e) {
      setLoi(e.message);
    } finally {
      setDangLuu(null);
    }
  }

  if (!viTri) return null;
  return (
    <KhungHop viTri={viTri} hopRef={hopRef} nhan={`Theo dõi ${ma}`}>
      <p className="px-2 pt-1 pb-2 text-xs" style={{ color: MUTED }}>
        Thêm <b style={{ color: TEXT }}>{ma}</b> vào danh sách
      </p>
      <div className="max-h-[50vh] overflow-y-auto">
        {ds.map((d) => {
          const co = d.ma.some((x) => x.ma === ma);
          return (
            <button
              key={d.id}
              type="button"
              role="menuitemcheckbox"
              aria-checked={co}
              disabled={dangLuu != null}
              onClick={() => doi(d)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-left hover:bg-[color:var(--hover-nhe)]"
              style={{ opacity: dangLuu != null && dangLuu !== d.id ? 0.6 : 1 }}
            >
              <span className="w-[18px] h-[18px] shrink-0 rounded-[5px] border flex items-center justify-center" style={{ borderColor: co ? PRIMARY : VIEN, background: co ? PRIMARY : "transparent" }}>
                {co && <Check size={13} color="#fff" strokeWidth={3} />}
              </span>
              <span className="flex-1 min-w-0 truncate" style={{ fontWeight: co ? 600 : 500 }}>
                {d.ten}
              </span>
              {d.chinh && <Bell size={13} color={MUTED} aria-label="Dùng cho thông báo" />}
              <span className="text-xs" style={{ color: MUTED }}>
                {dangLuu === d.id ? "…" : d.ma.length}
              </span>
            </button>
          );
        })}
      </div>
      {danhSach && (
        <div className="border-t mt-1 pt-1" style={{ borderColor: "var(--vien-nhe)" }}>
          <OTaoDanhSach
            onTao={async (ten) => {
              setLoi(null);
              try {
                await thaoTacDanhSach({ loai: "tao", ten, ma: [ma] });
              } catch (e) {
                setLoi(e.message);
              }
            }}
          />
        </div>
      )}
      {loi && (
        <p className="px-2 py-1 text-xs" style={{ color: "var(--do)" }}>
          {loi}
        </p>
      )}
      <Link href="/danh-muc" className="block px-2 pt-1.5 pb-1 text-xs hover:underline" style={{ color: "var(--tim-chu)" }}>
        Mở danh sách theo dõi →
      </Link>
    </KhungHop>
  );
}
