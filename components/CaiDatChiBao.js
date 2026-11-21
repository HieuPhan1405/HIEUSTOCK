"use client";

// HOP "CAI DAT CHI BAO" kieu TradingView (21/11/2026): tab "Thông số" (so / lua chon) va "Kiểu dáng" (hien / an, mau, do day tung net). Bam "Đồng ý" moi luu (lib/caiDatChiBao.js: chi luu cac gia tri khac mac dinh).
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { DINH_NGHIA, thamSo, kieuNet, datThamSo, datKieu, macDinhLai, lamSachThamSo } from "@/lib/caiDatChiBao";

const VIEN = "var(--vien)";
const NEN = "var(--card)";
const CHU = "var(--chu)";
const MO = "var(--mo)";

export default function CaiDatChiBao({ khoa, cd, nhan, onLuu, onDong }) {
  const dn = DINH_NGHIA[khoa];
  const gocTS = useMemo(() => thamSo(cd, khoa), [cd, khoa]);
  const gocKieu = useMemo(() => Object.fromEntries((dn?.kieu ?? []).map((n) => [n.k, kieuNet(cd, khoa, n.k)])), [cd, khoa, dn]);
  const [nhap, setNhap] = useState(() => Object.fromEntries(Object.entries(gocTS).map(([k, v]) => [k, String(v).replace(".", ",")])));
  const [kieu, setKieu] = useState(() => Object.fromEntries(Object.entries(gocKieu).map(([k, v]) => [k, { mau: v.mau, day: v.day, hien: v.hien }])));
  const coTS = (dn?.thamSo.length ?? 0) > 0, coKieu = (dn?.kieu.length ?? 0) > 0;
  const [tab, setTab] = useState(coTS ? "ts" : "kieu");

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onDong();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onDong]);

  if (!dn || typeof document === "undefined") return null;

  const macDinh = () => {
    setNhap(Object.fromEntries(dn.thamSo.map((d) => [d.k, String(d.mac).replace(".", ",")])));
    setKieu(Object.fromEntries(dn.kieu.map((n) => [n.k, { mau: n.mau, day: n.day, hien: true }])));
  };
  const dongY = () => {
    let moi = macDinhLai(cd, khoa);
    for (const d of dn.thamSo) {
      const v = lamSachThamSo(d, nhap[d.k]);
      if (v !== d.mac) moi = datThamSo(moi, khoa, d.k, v);
    }
    for (const n of dn.kieu) {
      const x = kieu[n.k], g = gocKieu[n.k], o = {};
      if (x.mau !== n.mau && (x.mau !== g.mau || g.daSua)) o.mau = x.mau;
      if (x.day !== n.day) o.day = x.day;
      if (!x.hien) o.hien = false;
      if (Object.keys(o).length) moi = datKieu(moi, khoa, n.k, o);
    }
    onLuu(moi);
    onDong();
  };

  const oInput = { background: "transparent", color: CHU, borderColor: VIEN };
  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,0.5)" }} onMouseDown={(e) => e.target === e.currentTarget && onDong()}>
      <div role="dialog" aria-modal="true" aria-label={`Cài đặt ${nhan}`} className="w-full max-w-[420px] rounded-2xl border shadow-2xl flex flex-col max-h-[88vh]" style={{ background: NEN, borderColor: VIEN, color: CHU, fontFamily: "'Open Sans', sans-serif" }}>
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-[17px] font-semibold">{nhan}</h2>
          <button type="button" onClick={onDong} aria-label="Đóng" className="cursor-pointer p-1 rounded hover:bg-[color:var(--hover-nhe)]">
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-1 px-5 pt-3 border-b" style={{ borderColor: VIEN }} role="tablist">
          {[coTS && ["ts", "Thông số"], coKieu && ["kieu", "Kiểu dáng"]].filter(Boolean).map(([k, ten]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className="px-3 py-2 text-[13px] font-semibold cursor-pointer" style={{ color: tab === k ? CHU : MO, borderBottom: tab === k ? `2px solid ${CHU}` : "2px solid transparent" }}>
              {ten}
            </button>
          ))}
        </div>
        <div className="px-5 py-4 overflow-y-auto flex flex-col gap-3">
          {tab === "ts" &&
            dn.thamSo.map((d) => (
              <label key={d.k} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="flex flex-col">
                  {d.nhan}
                  {d.ghiChu && <span className="text-[11px]" style={{ color: MO }}>{d.ghiChu}</span>}
                </span>
                {d.loai === "chon" ? (
                  <select value={nhap[d.k]} onChange={(e) => setNhap((a) => ({ ...a, [d.k]: e.target.value }))} className="rounded-lg border px-2 h-9 text-[13px] w-[150px] cursor-pointer" style={oInput}>
                    {d.ds.map((x) => (
                      <option key={x} value={x} style={{ color: "#111" }}>{x}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" inputMode="decimal" value={nhap[d.k]} onChange={(e) => setNhap((a) => ({ ...a, [d.k]: e.target.value }))} onBlur={() => setNhap((a) => ({ ...a, [d.k]: String(lamSachThamSo(d, a[d.k])).replace(".", ",") }))} aria-label={d.nhan} className="rounded-lg border px-3 h-9 text-[13px] w-[110px] text-right" style={oInput} />
                )}
              </label>
            ))}
          {tab === "kieu" &&
            dn.kieu.map((n) => (
              <div key={n.k} className="flex items-center gap-3 text-[13px]">
                <input type="checkbox" checked={kieu[n.k].hien} onChange={(e) => setKieu((a) => ({ ...a, [n.k]: { ...a[n.k], hien: e.target.checked } }))} aria-label={`Hiện ${n.nhan}`} className="w-4 h-4 cursor-pointer" />
                <span className="flex-1">{n.nhan}</span>
                <input type="color" value={kieu[n.k].mau} onChange={(e) => setKieu((a) => ({ ...a, [n.k]: { ...a[n.k], mau: e.target.value } }))} aria-label={`Màu ${n.nhan}`} className="w-10 h-8 rounded border cursor-pointer p-0.5" style={{ borderColor: VIEN, background: "transparent" }} />
                <select value={kieu[n.k].day} onChange={(e) => setKieu((a) => ({ ...a, [n.k]: { ...a[n.k], day: Number(e.target.value) } }))} aria-label={`Độ dày ${n.nhan}`} className="rounded-lg border px-2 h-8 text-[12px] cursor-pointer" style={oInput}>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <option key={d} value={d} style={{ color: "#111" }}>{d}px</option>
                  ))}
                </select>
              </div>
            ))}
        </div>
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t" style={{ borderColor: VIEN }}>
          <button type="button" onClick={macDinh} className="rounded-lg border px-3 h-9 text-[13px] cursor-pointer" style={{ borderColor: VIEN, color: CHU }}>
            Mặc định
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onDong} className="rounded-lg border px-4 h-9 text-[13px] cursor-pointer" style={{ borderColor: VIEN, color: CHU }}>
              Hủy
            </button>
            <button type="button" onClick={dongY} className="rounded-lg px-4 h-9 text-[13px] font-semibold cursor-pointer" style={{ background: "#6C5CE7", color: "#fff" }}>
              Đồng ý
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
