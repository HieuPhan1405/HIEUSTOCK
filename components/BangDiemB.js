"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { fmt, pct, nhe } from "@/components/dungChung";
import { soVN } from "@/lib/soVN";
import { ganDacTrungNganh, locDiemB, ketQuaDiemB, thongKeDiemB, laiHienTai, trangThaiLenh, danhSachNganh, laKhuyenNghi, DAI_GIAM, KHOANG_PHIEN, LOC_MAC_DINH, LOC_KHUYEN_NGHI } from "@/lib/locDiemB";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const PRIMARY = "#6C5CE7";
const sans = { fontFamily: "var(--font-chu)" };
const mono = { fontFamily: "var(--font-chu)" };
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
  { khoa: "gia_hien_tai", nhan: "Lãi hiện tại", canPhai: true, lay: (r) => laiHienTai(r) },
  { khoa: "pct_sau_5", nhan: "+5 phiên", canPhai: true, lay: (r) => r.pct_sau_5 },
  { khoa: "vni", nhan: "Thị trường", lay: (r) => (r.vni_yeu === true ? 1 : 0) },
  { khoa: "ket_qua", nhan: "Kết quả", lay: (r) => ({ tot: 2, xau: 1, cho: 0 })[ketQuaDiemB(r).loai] },
];

function The({ nhan, giaTri, phu, mau }) {
  return (
    <div className="rounded-2xl border p-3 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-xl" style={{ ...mono, fontWeight: 700, color: mau || TEXT }}>{giaTri}</p>
      <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{nhan}</p>
      {phu && <p className="text-[11px]" style={{ color: MUTED }}>{phu}</p>}
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

export default function BangDiemB({ duLieu: duLieuTho }) {
  const duLieu = useMemo(() => ganDacTrungNganh(duLieuTho), [duLieuTho]);
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
  const dangKhuyenNghi = loc.dai === "tu_20" && loc.klDay && loc.vniYeu;
  const soKhuyenNghi = useMemo(() => duLieu.filter(laKhuyenNghi).length, [duLieu]);
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <The nhan="Đang giữ / đã cắt lỗ" giaTri={`${tk.nGiu} / ${tk.nCat}`} phu={`${tk.n} điểm B hiển thị (${duLieu.length} từ đầu 2026)${tk.nCho ? `, ${tk.nCho} chờ vào lệnh` : ""}`} />
        <The nhan="Lãi hiện tại TB (đang giữ)" giaTri={tk.tbLai == null ? "—" : pct(tk.tbLai, 2)} mau={tk.tbLai == null ? MUTED : mauPct(tk.tbLai)} phu="giá hiện tại so với giá vào, chỉ lệnh chưa cắt lỗ" />
        <The nhan="Tỷ lệ đang lãi" giaTri={tk.tyLeLai == null ? "—" : `${tk.tyLeLai.toFixed(0)}%`} mau={tk.tyLeLai == null ? MUTED : tk.tyLeLai >= 50 ? XANH : DO} phu={`${tk.nGia} điểm có giá`} />
        <The nhan="Lãi/lỗ TB gồm cả lệnh đã cắt lỗ" giaTri={tk.tbTatCa == null ? "—" : pct(tk.tbTatCa, 2)} mau={tk.tbTatCa == null ? MUTED : mauPct(tk.tbTatCa)} phu="cắt lỗ tính tại mốc SL — số thực tế hơn (bỏ lệnh cắt lỗ thì lãi cao ảo)" />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <button
          onClick={() => setLoc(dangKhuyenNghi ? LOC_MAC_DINH : LOC_KHUYEN_NGHI)}
          className="px-3 py-1.5 text-xs rounded-full border font-bold"
          style={{ borderColor: XANH, background: dangKhuyenNghi ? XANH : nhe(XANH, 13), color: dangKhuyenNghi ? "#fff" : XANH, ...sans }}
          title="Giảm từ 20% + KL đáy ≥ 2× + thị trường yếu lúc đó. Lịch sử từ đầu 2026: 19 điểm, lãi TB sau 10 phiên khoảng +6% (thắng 69%) — mẫu nhỏ, chỉ tham khảo."
        >
          ⭐ Bộ lọc khuyến nghị ({soKhuyenNghi})
        </button>
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
        <select value={loc.cungNganh} onChange={(e) => dat("cungNganh", Number(e.target.value))} className="text-xs rounded-lg px-2 py-2 outline-none" style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT }} title="Số mã KHÁC cùng ngành cũng có điểm B trong 7 ngày (~5 phiên). Càng nhiều mã cùng hồi, kết quả lịch sử càng tốt (≥ 1 mã: +0,4% so với −0,9% sau 10 phiên từ 2022.5; ≥ 3 mã: +0,7% so với −0,5%).">
          <option value={0}>Ngành cùng hồi: không lọc</option>
          <option value={1}>Ngành cùng hồi: ≥ 1 mã khác</option>
          <option value={2}>Ngành cùng hồi: ≥ 2 mã khác</option>
          <option value={3}>Ngành cùng hồi: ≥ 3 mã khác</option>
        </select>
        <Ck loc={loc} dat={dat} k="manhNganh" nhan="Giảm mạnh hơn trung vị ngành" tieuDe="Mã giảm nhiều hơn trung vị các điểm B cùng ngành trong 5 phiên: lịch sử +7,0% so với +3,5% (trong bộ lọc khuyến nghị)." />
        <Ck loc={loc} dat={dat} k="vniYeu" nhan="Thị trường yếu" tieuDe="VN-Index thấp hơn đỉnh 60 phiên từ 7% lúc điểm B xuất hiện" />
        <Ck loc={loc} dat={dat} k="chuaMuaThuong" nhan="Chưa có lệnh MUA thường trước" tieuDe="Loại mã mà web đã ghi nhận lệnh MUA của hệ thống trong 60 ngày trước điểm B: nhóm này có kết quả lịch sử kém hơn" />
        <Ck loc={loc} dat={dat} k="ganGiaB" nhan="Còn gần giá vào (≤ +5%)" tieuDe="Giá hiện tại không cao hơn giá vào quá 5% và chưa thủng cắt lỗ" />
        <Ck loc={loc} dat={dat} k="chiDangGiu" nhan="Chỉ lệnh đang giữ (bỏ lệnh đã cắt lỗ)" tieuDe="Bỏ các điểm B mà từ khi vào lệnh giá đã chạm mốc cắt lỗ (giá vào − 2,5×ATR). Bỏ chọn để xem cả lệnh đã cắt lỗ." />
        <Ck loc={loc} dat={dat} k="chiThanhCong" nhan="Chỉ đang lãi" />
        {dangLoc && (
          <button onClick={() => setLoc(LOC_MAC_DINH)} className="text-xs underline" style={{ color: PRIMARY }}>
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-x-auto bang-cuon">
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
                const hien = laiHienTai(r);
                const catLo = trangThaiLenh(r) === "cat_lo";
                const klCao = r.kl_day != null && r.kl_day >= 2;
                return (
                  <tr key={`${r.ma}-${r.ngay}`} className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--vien-nhe)" }}>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Link href={`/ma/${r.ma}`} className="hover:underline" style={{ ...sans, fontWeight: 700 }}>{r.ma}</Link>
                      {r.ng_so_ma >= 1 && (
                        <span className="ml-1.5 px-1 text-[11px] rounded-sm" style={{ background: nhe(PRIMARY, 13), color: PRIMARY, ...sans }} title={`${r.ng_so_ma} mã khác cùng ngành cũng có điểm B trong 7 ngày (~5 phiên) — càng nhiều mã càng là cả ngành cùng hồi`}>
                          ngành hồi ({r.ng_so_ma})
                        </span>
                      )}
                      {laKhuyenNghi(r) && (
                        <span className="ml-1.5 px-1 text-[11px] rounded-sm" style={{ background: nhe(XANH, 13), color: XANH, ...sans }} title="Giảm từ 20% + KL đáy ≥ 2× + thị trường yếu lúc đó">
                          ⭐ khuyến nghị
                        </span>
                      )}
                      {r.co_mua_thuong_truoc && (
                        <span className="ml-1.5 px-1 text-[11px] rounded-sm" style={{ background: nhe(DO, 13), color: DO, ...sans }} title="Web đã ghi nhận lệnh MUA của hệ thống trong 60 ngày trước điểm B — nhóm này có kết quả lịch sử kém hơn">
                          đã có lệnh MUA
                        </span>
                      )}
                      {r.nganh && <span className="block text-[11px]" style={{ color: MUTED, ...sans }}>{r.nganh}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: MUTED }}>{ngayVN(r.ngay)}</td>
                    <td className="py-2.5 px-3 text-right">{fmt(r.gia_vao)}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: r.giam >= 20 && r.giam < 30 ? TEXT : MUTED }}>{r.giam != null ? `${soVN(r.giam, 1, true)}%` : "—"}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: klCao ? XANH : MUTED, fontWeight: klCao ? 700 : 400 }}>{r.kl_day != null ? `${soVN(r.kl_day, 1, true)}×` : "—"}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: DO }}>{fmt(r.sl)}</td>
                    <td className="py-2.5 px-3 text-right text-xs" style={{ color: XANH }}>{fmt(r.tp1)} / {fmt(r.tp2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold whitespace-nowrap" style={{ color: catLo ? MUTED : mauPct(hien) }} title={catLo ? `Đã chạm cắt lỗ ngày ${ngayVN(r.ngay_cat_lo)} — lỗ ước tính tại mốc cắt lỗ` : undefined}>
                      {hien == null ? "—" : pct(hien, 1)}
                      {catLo && <span className="block text-[11px] font-normal" style={{ color: MUTED, ...sans }}>cắt lỗ {ngayVN(r.ngay_cat_lo).slice(0, 5)}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right" style={{ color: mauPct(r.pct_sau_5) }}>{r.pct_sau_5 == null ? "—" : pct(r.pct_sau_5, 1)}</td>
                    <td className="py-2.5 px-3 text-xs whitespace-nowrap" style={{ color: r.vni_yeu ? VANG : MUTED, ...sans }}>{r.vni_yeu === true ? "yếu" : r.vni_yeu === false ? "bình thường" : "—"}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 text-xs font-bold rounded-sm whitespace-nowrap" style={{ background: nhe(MAU_KQ[kq.loai], 13), color: MAU_KQ[kq.loai], ...sans }}>{kq.nhan}</span>
                      {r.tp_cham >= 1 && !catLo && <span className="ml-1 text-[11px]" style={{ color: XANH, ...sans }} title="Giá đã chạm mốc chốt lời kể từ khi vào lệnh">TP{r.tp_cham}</span>}
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
