"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { fmt, pct, nhe } from "@/components/dungChung";
import { soVN } from "@/lib/soVN";
import { locDiemB, ketQuaDiemB, thongKeDiemB, danhSachNganh, DAI_GIAM, KHOANG_PHIEN, LOC_MAC_DINH } from "@/lib/locDiemB";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const PRIMARY = "#6C5CE7";
const sans = { fontFamily: "'Inter', sans-serif" };
const mono = { fontFamily: "'JetBrains Mono', monospace" };
const MAU_KQ = { tot: XANH, xau: DO, cho: VANG };

const ngayVN = (s) => String(s).slice(0, 10).split("-").reverse().join("/");
const mauPct = (v) => (v == null ? MUTED : v >= 0 ? XANH : DO);

const COT = [
  { khoa: "ma", nhan: "Mã", lay: (r) => r.ma },
  { khoa: "ngay", nhan: "Ngày B", lay: (r) => r.ngay },
  { khoa: "gia_vao", nhan: "Giá vào", canPhai: true, lay: (r) => r.gia_vao },
  { khoa: "giam", nhan: "Giảm", canPhai: true, lay: (r) => r.giam },
  { khoa: "kl_day", nhan: "KL đáy", canPhai: true, lay: (r) => r.kl_day },
  { khoa: "sl", nhan: "Cắt lỗ", canPhai: true, lay: (r) => r.sl },
  { khoa: "tp", nhan: "TP1 / TP2", canPhai: true, lay: (r) => r.tp1 },
  { khoa: "gia_hien_tai", nhan: "Hiện tại", canPhai: true, lay: (r) => (r.gia_vao > 0 && r.gia_hien_tai != null ? (r.gia_hien_tai / r.gia_vao - 1) * 100 : null) },
  { khoa: "pct_sau_5", nhan: "+5 phiên", canPhai: true, lay: (r) => r.pct_sau_5 },
  { khoa: "pct_sau_10", nhan: "+10 phiên", canPhai: true, lay: (r) => r.pct_sau_10 },
  { khoa: "pct_sau_20", nhan: "+20 phiên", canPhai: true, lay: (r) => r.pct_sau_20 },
  { khoa: "vni", nhan: "Thị trường", lay: (r) => (r.vni_yeu === true ? 1 : 0) },
  { khoa: "ket_qua", nhan: "Kết quả", lay: (r) => ({ tot: 2, xau: 1, cho: 0 })[ketQuaDiemB(r).loai] },
];

function The({ nhan, giaTri, phu, mau }) {
  return (
    <div className="rounded-2xl border p-3 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-xl" style={{ ...mono, fontWeight: 700, color: mau || TEXT }}>{giaTri}</p>
      <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{nhan}</p>
      {phu && <p className="text-[10px]" style={{ color: MUTED }}>{phu}</p>}
    </div>
  );
}

function Ck({ loc, dat, k, nhan, tieuDe }) {
  return (
    <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: MUTED }} title={tieuDe}>
      <input type="checkbox" checked={loc[k]} onChange={(e) => dat(k, e.target.checked)} />
      {nhan}
    </label>
  );
}
function Sel({ loc, dat, k, ds, tatCa }) {
  return (
    <select value={loc[k]} onChange={(e) => dat(k, e.target.value)} className="text-xs rounded-lg px-2 py-2 outline-none" style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT }}>
      {tatCa && <option value="">{tatCa}</option>}
      {ds.map((x) => (typeof x === "string" ? <option key={x} value={x}>{x}</option> : <option key={x.k} value={x.k}>{x.nhan}</option>))}
    </select>
  );
}

export default function BangDiemB({ duLieu }) {
  const [loc, setLoc] = useState(LOC_MAC_DINH);
  const [sapXep, setSapXep] = useState({ khoa: "ngay", chieu: "desc" });
  const dat = (k, v) => setLoc((l) => ({ ...l, [k]: v }));
  const nganhs = useMemo(() => danhSachNganh(duLieu), [duLieu]);

  const daLoc = useMemo(() => {
    const ds = locDiemB(duLieu, loc);
    const cot = COT.find((c) => c.khoa === sapXep.khoa);
    return [...ds].sort((a, b) => {
      const va = cot.lay(a), vb = cot.lay(b);
      const so = typeof va === "string" || typeof vb === "string" ? String(va ?? "").localeCompare(String(vb ?? "")) : (va ?? -Infinity) - (vb ?? -Infinity);
      return sapXep.chieu === "asc" ? so : -so;
    });
  }, [duLieu, loc, sapXep]);
  const tk = useMemo(() => thongKeDiemB(daLoc), [daLoc]);
  const doiSapXep = (khoa) => setSapXep((s) => (s.khoa === khoa ? { khoa, chieu: s.chieu === "desc" ? "asc" : "desc" } : { khoa, chieu: "desc" }));
  const dangLoc = JSON.stringify(loc) !== JSON.stringify(LOC_MAC_DINH);
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <The nhan="Điểm B đang hiển thị" giaTri={tk.n} phu={`/ ${duLieu.length} từ đầu 2026`} />
        <The nhan="Lãi TB sau 10 phiên" giaTri={tk.tb10 == null ? "—" : pct(tk.tb10, 2)} mau={tk.tb10 == null ? MUTED : mauPct(tk.tb10)} phu={`${tk.n10} điểm đủ 10 phiên (chưa trừ phí)`} />
        <The nhan="Tỷ lệ dương sau 10 phiên" giaTri={tk.thang10 == null ? "—" : `${tk.thang10.toFixed(0)}%`} mau={tk.thang10 == null ? MUTED : tk.thang10 >= 50 ? XANH : DO} />
        <The nhan="Lãi TB sau 20 phiên" giaTri={tk.tb20 == null ? "—" : pct(tk.tb20, 2)} mau={tk.tb20 == null ? MUTED : mauPct(tk.tb20)} phu={`${tk.n20} điểm đủ 20 phiên`} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        {KHOANG_PHIEN.map((x) => (
          <button key={x.k} onClick={() => dat("khoang", x.k)} className="px-3 py-1.5 text-xs rounded-full border" style={{ borderColor: loc.khoang === x.k ? PRIMARY : VIEN, background: loc.khoang === x.k ? nhe(PRIMARY, 13) : "transparent", color: loc.khoang === x.k ? PRIMARY : MUTED, ...sans }}>
            {x.nhan}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative max-w-xs flex-1 min-w-[160px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={MUTED} />
          <input value={loc.tuKhoa} onChange={(e) => dat("tuKhoa", e.target.value)} placeholder="Tìm mã..." className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none" style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, ...mono }} />
        </div>
        <Sel loc={loc} dat={dat} k="dai" ds={DAI_GIAM} />
        <Sel loc={loc} dat={dat} k="nganh" ds={nganhs} tatCa="Mọi ngành" />
        <Ck loc={loc} dat={dat} k="klDay" nhan="KL đáy ≥ 2×" tieuDe="KL lớn nhất 5 phiên quanh đáy ≥ 2 lần KL trung bình 20 phiên trước đáy (bán tháo có khối lượng) — yếu tố kiểm chứng tốt nhất" />
        <Ck loc={loc} dat={dat} k="vniYeu" nhan="Thị trường yếu" tieuDe="VN-Index thấp hơn đỉnh 60 phiên từ 7% lúc điểm B xuất hiện" />
        <Ck loc={loc} dat={dat} k="chuaMuaThuong" nhan="Chưa có lệnh MUA thường trước" tieuDe="Loại mã mà web đã ghi nhận lệnh MUA của hệ thống trong 60 ngày trước điểm B: nhóm này có kết quả lịch sử kém hơn" />
        <Ck loc={loc} dat={dat} k="ganGiaB" nhan="Còn gần giá vào (≤ +5%)" tieuDe="Giá hiện tại không cao hơn giá vào quá 5% và chưa thủng cắt lỗ" />
        <Ck loc={loc} dat={dat} k="chiThanhCong" nhan="Chỉ thành công (+10 phiên > 0)" />
        {dangLoc && (
          <button onClick={() => setLoc(LOC_MAC_DINH)} className="text-xs underline" style={{ color: PRIMARY }}>
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={mono}>
            <thead>
              <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, ...sans }}>
                {COT.map((c) => (
                  <th key={c.khoa} className={`py-3 px-3 font-normal cursor-pointer select-none whitespace-nowrap ${c.canPhai ? "text-right" : "text-left"}`} onClick={() => doiSapXep(c.khoa)}>
                    <span className="inline-flex items-center gap-1">
                      {c.nhan}
                      {sapXep.khoa === c.khoa ? sapXep.chieu === "desc" ? <ArrowDown size={12} color={PRIMARY} /> : <ArrowUp size={12} color={PRIMARY} /> : <ArrowUpDown size={12} opacity={0.4} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daLoc.map((r, i) => {
                const kq = ketQuaDiemB(r);
                const hien = r.gia_vao > 0 && r.gia_hien_tai != null ? (r.gia_hien_tai / r.gia_vao - 1) * 100 : null;
                const klCao = r.kl_day != null && r.kl_day >= 2;
                return (
                  <tr key={`${r.ma}-${r.ngay}`} className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--vien-nhe)" }}>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Link href={`/ma/${r.ma}`} className="hover:underline" style={{ ...sans, fontWeight: 700 }}>{r.ma}</Link>
                      {r.co_mua_thuong_truoc && (
                        <span className="ml-1.5 px-1 text-[9px] rounded-sm" style={{ background: nhe(DO, 13), color: DO, ...sans }} title="Web đã ghi nhận lệnh MUA của hệ thống trong 60 ngày trước điểm B — nhóm này có kết quả lịch sử kém hơn">
                          đã có lệnh MUA
                        </span>
                      )}
                      {r.nganh && <span className="block text-[10px]" style={{ color: MUTED, ...sans }}>{r.nganh}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: MUTED }}>{ngayVN(r.ngay)}</td>
                    <td className="py-2.5 px-3 text-right">{fmt(r.gia_vao)}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: r.giam >= 20 && r.giam < 30 ? TEXT : MUTED }}>{r.giam != null ? `${soVN(r.giam, 1, true)}%` : "—"}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: klCao ? XANH : MUTED, fontWeight: klCao ? 700 : 400 }}>{r.kl_day != null ? `${soVN(r.kl_day, 1, true)}×` : "—"}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: DO }}>{fmt(r.sl)}</td>
                    <td className="py-2.5 px-3 text-right text-xs" style={{ color: XANH }}>{fmt(r.tp1)} / {fmt(r.tp2)}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: mauPct(hien) }}>{hien == null ? "—" : pct(hien, 1)}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: mauPct(r.pct_sau_5) }}>{r.pct_sau_5 == null ? "—" : pct(r.pct_sau_5, 1)}</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: mauPct(r.pct_sau_10) }}>{r.pct_sau_10 == null ? "—" : pct(r.pct_sau_10, 1)}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: mauPct(r.pct_sau_20) }}>{r.pct_sau_20 == null ? "—" : pct(r.pct_sau_20, 1)}</td>
                    <td className="py-2.5 px-3 text-xs whitespace-nowrap" style={{ color: r.vni_yeu ? VANG : MUTED, ...sans }}>{r.vni_yeu === true ? "yếu" : r.vni_yeu === false ? "bình thường" : "—"}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 text-xs font-bold rounded-sm whitespace-nowrap" style={{ background: nhe(MAU_KQ[kq.loai], 13), color: MAU_KQ[kq.loai], ...sans }}>{kq.nhan}</span>
                    </td>
                  </tr>
                );
              })}
              {daLoc.length === 0 && (
                <tr><td colSpan={COT.length} className="py-6 text-center text-sm" style={{ color: MUTED, ...sans }}>Không có điểm B nào khớp bộ lọc.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
