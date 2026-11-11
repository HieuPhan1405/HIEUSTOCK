"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Khoi, TEXT, MUTED, VIEN, PRIMARY, CAM, sans } from "@/components/DanhGiaChung";

// BANG BETA TUNG MA (trang /tuong-quan). hang = [{ ma, ten, nganh, vh (von hoa ty), betaVni, betaGiam, tqVni, vol, beta3n, betaTT, tqTT }]. Nhom beta theo BETA SO VOI THI TRUONG CHUNG (trung binh cong moi ma, trung vi ~1):
// Cao >= 1,2 · Trung binh 0,8 - 1,2 · Thap < 0,8. Day la thong ke qua khu 250 phien, khong phai khuyen nghi.
const so2 = (x) => (x == null ? "—" : x.toFixed(2).replace(".", ","));
const nhomCua = (b) => (b == null ? "" : b >= 1.2 ? "cao" : b >= 0.8 ? "tb" : "thap");
const NHOM = [
  { khoa: "", nhan: "Tất cả" },
  { khoa: "cao", nhan: "Beta cao (≥ 1,2)" },
  { khoa: "tb", nhan: "Trung bình (0,8 – 1,2)" },
  { khoa: "thap", nhan: "Thấp (< 0,8)" },
];
const NHAN_NHOM = { cao: { nhan: "Cao", mau: CAM }, tb: { nhan: "Trung bình", mau: MUTED }, thap: { nhan: "Thấp", mau: "var(--cyan)" } };
const COT = [
  { khoa: "ma", nhan: "Mã", trai: true },
  { khoa: "nganh", nhan: "Ngành", trai: true },
  { khoa: "vh", nhan: "Vốn hoá (tỷ)" },
  { khoa: "betaTT", nhan: "Beta so với thị trường chung", ngan: "Beta TT" },
  { khoa: "betaVni", nhan: "Beta so với VN-Index", ngan: "Beta VN-Index" },
  { khoa: "betaGiam", nhan: "Beta khi VN-Index giảm", ngan: "Beta khi giảm" },
  { khoa: "tqVni", nhan: "Tương quan với VN-Index", ngan: "Tương quan" },
  { khoa: "vol", nhan: "Biến động năm (%)", ngan: "Biến động" },
];
const SO_DONG = 60;

export default function BangBetaMa({ hang, capNhat, soPhien }) {
  const [tim, setTim] = useState("");
  const [nhom, setNhom] = useState("");
  const [nganh, setNganh] = useState("");
  const [sx, setSx] = useState({ khoa: "betaTT", chieu: "desc" });
  const [soHien, setSoHien] = useState(SO_DONG);
  const dsNganh = useMemo(() => [...new Set(hang.map((h) => h.nganh).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi")), [hang]);
  const dem = useMemo(() => ({ cao: hang.filter((h) => nhomCua(h.betaTT) === "cao").length, tb: hang.filter((h) => nhomCua(h.betaTT) === "tb").length, thap: hang.filter((h) => nhomCua(h.betaTT) === "thap").length }), [hang]);
  const ds = useMemo(() => {
    const t = tim.trim().toUpperCase();
    const loc = hang.filter((h) => (!t || h.ma.includes(t) || (h.ten ?? "").toUpperCase().includes(t)) && (!nhom || nhomCua(h.betaTT) === nhom) && (!nganh || h.nganh === nganh));
    return [...loc].sort((a, b) => {
      const va = a[sx.khoa], vb = b[sx.khoa];
      const so = typeof va === "string" || typeof vb === "string" ? String(va ?? "").localeCompare(String(vb ?? ""), "vi") : (va ?? -Infinity) - (vb ?? -Infinity);
      return sx.chieu === "asc" ? so : -so;
    });
  }, [hang, tim, nhom, nganh, sx]);
  const doiSx = (khoa) => {
    setSx((s) => (s.khoa === khoa ? { khoa, chieu: s.chieu === "desc" ? "asc" : "desc" } : { khoa, chieu: khoa === "ma" || khoa === "nganh" ? "asc" : "desc" }));
    setSoHien(SO_DONG);
  };
  const o = "px-3 py-2";

  return (
    <Khoi tieuDe="Beta từng mã" phu={`Độ nhạy của từng mã với thị trường trong ${soPhien} phiên gần nhất (đến ${capNhat.split("-").reverse().join("/")}). Bấm tiêu đề cột để sắp xếp, bấm mã để xem chi tiết.`}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={MUTED} aria-hidden="true" />
          <input value={tim} onChange={(e) => { setTim(e.target.value); setSoHien(SO_DONG); }} placeholder="Tìm mã hoặc tên công ty…" aria-label="Tìm mã" className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none" style={{ background: "var(--card)", border: `1px solid ${VIEN}`, color: TEXT, ...sans }} />
        </div>
        <select value={nganh} onChange={(e) => { setNganh(e.target.value); setSoHien(SO_DONG); }} aria-label="Lọc theo ngành" className="px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "var(--card)", border: `1px solid ${VIEN}`, color: TEXT, ...sans }}>
          <option value="">Tất cả ngành</option>
          {dsNganh.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3" role="group" aria-label="Nhóm beta">
        {NHOM.map((n) => {
          const dang = nhom === n.khoa;
          return (
            <button key={n.khoa} type="button" aria-pressed={dang} onClick={() => { setNhom(n.khoa); setSoHien(SO_DONG); }} className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: dang ? PRIMARY : VIEN, background: dang ? "rgba(108,92,231,0.16)" : "transparent", color: dang ? "var(--tim-chu)" : TEXT, fontWeight: dang ? 700 : 500, ...sans }}>
              {n.nhan}
              {n.khoa && <span style={{ color: MUTED, fontWeight: 400 }}> · {dem[n.khoa]}</span>}
            </button>
          );
        })}
      </div>
      <div className="overflow-auto rounded-xl border max-h-[70vh]" style={{ borderColor: VIEN }}>
        <table className="w-full text-sm min-w-[820px]" style={sans}>
          <thead>
            <tr className="text-left" style={{ color: MUTED }}>
              {COT.map((c) => (
                <th key={c.khoa} scope="col" className={`sticky top-0 ${o} font-normal whitespace-nowrap select-none cursor-pointer border-b ${c.trai ? "text-left" : "text-right"} ${c.khoa === "ma" ? "left-0 z-[3]" : "z-[2]"}`} style={{ background: "var(--card)", borderColor: VIEN }} onClick={() => doiSx(c.khoa)} title={c.nhan}>
                  <span className="inline-flex items-center gap-1">
                    {c.ngan ?? c.nhan}
                    {sx.khoa === c.khoa ? sx.chieu === "desc" ? <ArrowDown size={12} color={PRIMARY} aria-hidden="true" /> : <ArrowUp size={12} color={PRIMARY} aria-hidden="true" /> : <ArrowUpDown size={12} opacity={0.35} aria-hidden="true" />}
                  </span>
                </th>
              ))}
              <th scope="col" className={`sticky top-0 ${o} font-normal text-right border-b z-[2]`} style={{ background: "var(--card)", borderColor: VIEN }}>
                Nhóm
              </th>
            </tr>
          </thead>
          <tbody>
            {ds.slice(0, soHien).map((h, i) => {
              const n = NHAN_NHOM[nhomCua(h.betaTT)];
              return (
                <tr key={h.ma} className={`hover:bg-[color:var(--hover-nhe)] ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--vien-nhe)" }}>
                  <td className={`${o} sticky left-0 z-[1]`} style={{ background: "var(--card)" }}>
                    <Link href={`/ma/${h.ma}`} className="hover:underline font-bold">
                      {h.ma}
                    </Link>
                    {h.ten && (
                      <span className="block max-w-[150px] truncate text-[11px] font-normal" style={{ color: MUTED }} title={h.ten}>
                        {h.ten}
                      </span>
                    )}
                  </td>
                  <td className={`${o} whitespace-nowrap`} style={{ color: MUTED }}>
                    {h.nganh ?? "—"}
                  </td>
                  <td className={`${o} text-right tabular-nums`}>{h.vh != null ? Math.round(h.vh).toLocaleString("vi-VN") : "—"}</td>
                  <td className={`${o} text-right tabular-nums font-bold`}>{so2(h.betaTT)}</td>
                  <td className={`${o} text-right tabular-nums`}>{so2(h.betaVni)}</td>
                  <td className={`${o} text-right tabular-nums`}>{so2(h.betaGiam)}</td>
                  <td className={`${o} text-right tabular-nums`}>{so2(h.tqVni)}</td>
                  <td className={`${o} text-right tabular-nums`}>{h.vol != null ? h.vol.toFixed(1).replace(".", ",") : "—"}</td>
                  <td className={`${o} text-right whitespace-nowrap`}>{n && <span style={{ color: n.mau, fontWeight: 700 }}>{n.nhan}</span>}</td>
                </tr>
              );
            })}
            {ds.length === 0 && (
              <tr>
                <td colSpan={COT.length + 1} className="py-6 text-center text-sm" style={{ color: MUTED }}>
                  Không có mã nào khớp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
        <p className="text-xs" style={{ color: MUTED }}>
          Hiển thị {Math.min(soHien, ds.length)} / {ds.length} mã
        </p>
        {ds.length > soHien && (
          <button type="button" onClick={() => setSoHien((n) => n + SO_DONG)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: VIEN, color: PRIMARY, ...sans }}>
            Hiện thêm {Math.min(SO_DONG, ds.length - soHien)} mã
          </button>
        )}
      </div>
    </Khoi>
  );
}
