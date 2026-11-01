"use client";

import { useMemo, useState } from "react";
import { Trash2, FileSpreadsheet } from "lucide-react";
import { thongKeNhatKy, THUE_BAN_PCT } from "@/lib/nhatKyGiaoDich";
import { soNguyenNhap, soNhap } from "@/lib/danhGiaDanhMuc";
import { taoXlsx } from "@/lib/xuatBang";
import { taiXuong } from "@/lib/xuatAnh";
import { fmt } from "@/components/dungChung";
import { Khoi, The, VIEN, NEN_CARD, TEXT, MUTED, PRIMARY, DO, sans, soVN, p0, dau, tien, mauLai, ngayVN } from "@/components/DanhGiaChung";

export const homNayVN = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

// NHAT KY GIAO DICH: ghi lenh mua / ban -> cap nhat vi the (so luong, gia von) o muc 1 + thong ke lai da chot. nhatKy luu cung danh muc (may / tai khoan).
// O "Ma" dung chung datalist #ds-ma-danh-gia cua muc 1.
export default function DanhGiaNhatKy({ nhatKy = [], phiPct = 0, catLo = null, giaTheoMa = {}, onThem, onXoa, tenDanhMuc = "" }) {
  const [f, setF] = useState({ ngay: homNayVN(), ma: "", loai: "mua", kl: "", gia: "", ghiChu: "" });
  const [tb, setTb] = useState("");
  const tk = useMemo(() => thongKeNhatKy(nhatKy, { catLo }), [nhatKy, catLo]);
  const ds = useMemo(() => [...nhatKy].sort((a, b) => String(b.ngay).localeCompare(String(a.ngay))), [nhatKy]);
  const ghi = () => {
    const loi = onThem({ ...f, kl: soNguyenNhap(f.kl), gia: soNhap(f.gia) ?? giaTheoMa[f.ma] ?? null });
    if (loi) setTb(loi);
    else {
      setTb(`Đã ghi lệnh ${f.loai === "mua" ? "mua" : "bán"} ${f.ma} và cập nhật danh mục.`);
      setF((c) => ({ ...c, ma: "", kl: "", gia: "", ghiChu: "" }));
    }
  };
  const xuatExcel = () => {
    const cot = ["Ngày", "Mã", "Lệnh", "Số lượng", "Giá (nghìn đ)", "Giá vốn trước lệnh", "Lãi/lỗ đã chốt (đ)", "Lãi/lỗ %", "Ghi chú"];
    const hang = ds.map((g) => [ngayVN(g.ngay), g.ma, g.loai === "mua" ? "Mua" : "Bán", g.kl, g.gia, g.giaVonTruoc != null ? +g.giaVonTruoc.toFixed(3) : "", g.laiChot != null ? Math.round(g.laiChot) : "", g.laiChotPct != null ? +g.laiChotPct.toFixed(2) : "", g.ghiChu ?? ""]);
    taiXuong(taoXlsx(cot, hang, "Nhật ký"), `CloudStock-nhat-ky${tenDanhMuc ? `-${tenDanhMuc.replace(/[^\p{L}\p{N}]+/gu, "-")}` : ""}-${homNayVN()}.xlsx`);
  };
  const o = "px-2.5 py-1.5 rounded-lg text-sm border w-full";
  const oS = { borderColor: VIEN, background: "transparent", color: TEXT, ...sans };
  return (
    <>
      <Khoi tieuDe="Ghi lệnh mua / bán" phu={`Ghi lệnh sẽ cập nhật số lượng và giá vốn ở mục 1 (giá vốn bình quân, bán không đổi giá vốn). Lãi đã chốt trừ thuế bán ${String(THUE_BAN_PCT).replace(".", ",")}% và phí giao dịch ${String(phiPct || 0).replace(".", ",")}% (sửa phí ở “Vốn & margin”).`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 items-end">
          <label className="text-[11px]" style={{ color: MUTED }}>
            Ngày
            <input type="date" value={f.ngay} onChange={(e) => setF((c) => ({ ...c, ngay: e.target.value }))} className={`${o} mt-1`} style={oS} />
          </label>
          <label className="text-[11px]" style={{ color: MUTED }}>
            Mã
            <input list="ds-ma-danh-gia" value={f.ma} onChange={(e) => setF((c) => ({ ...c, ma: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) }))} placeholder="HPG" className={`${o} mt-1`} style={{ ...oS, fontWeight: 700 }} />
          </label>
          <div className="text-[11px]" style={{ color: MUTED }}>
            Lệnh
            <div className="flex mt-1 rounded-lg border overflow-hidden" style={{ borderColor: VIEN }}>
              {[
                ["mua", "Mua"],
                ["ban", "Bán"],
              ].map(([k, t]) => (
                <button key={k} type="button" onClick={() => setF((c) => ({ ...c, loai: k }))} className="flex-1 py-1.5 text-sm" style={{ ...sans, fontWeight: 700, background: f.loai === k ? (k === "mua" ? PRIMARY : DO) : "transparent", color: f.loai === k ? "#fff" : TEXT }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <label className="text-[11px]" style={{ color: MUTED }}>
            Số lượng
            <input value={f.kl} onChange={(e) => setF((c) => ({ ...c, kl: e.target.value.replace(/[^0-9.,]/g, "") }))} inputMode="numeric" placeholder="1.000" className={`${o} mt-1`} style={oS} />
          </label>
          <label className="text-[11px]" style={{ color: MUTED }}>
            Giá khớp (nghìn đ)
            <input value={f.gia} onChange={(e) => setF((c) => ({ ...c, gia: e.target.value.replace(/[^0-9.,]/g, "") }))} inputMode="decimal" placeholder={giaTheoMa[f.ma] != null ? fmt(giaTheoMa[f.ma]) : "25,5"} className={`${o} mt-1`} style={oS} />
          </label>
          <label className="text-[11px] col-span-2 sm:col-span-1" style={{ color: MUTED }}>
            Ghi chú
            <input value={f.ghiChu} onChange={(e) => setF((c) => ({ ...c, ghiChu: e.target.value.slice(0, 120) }))} placeholder="Lý do vào / ra" className={`${o} mt-1`} style={oS} />
          </label>
          <button type="button" onClick={ghi} disabled={!f.ma || !f.kl} className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: PRIMARY, color: "#fff", ...sans }}>
            Ghi lệnh
          </button>
        </div>
        {tb && <p className="text-xs mt-2" style={{ color: MUTED }}>{tb}</p>}
      </Khoi>

      {tk.soLenhBan > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <The nhan="Lãi / lỗ đã chốt" mau={mauLai(tk.laiDaChot)} phu={`${tk.soLenhBan} lệnh bán`}>{tien(tk.laiDaChot)}</The>
          <The nhan="Tỷ lệ lệnh bán có lãi" phu={`${tk.soThang} lãi · ${tk.soThua} lỗ`}>{tk.tyLeThang != null ? `${p0(tk.tyLeThang * 100)}%` : "—"}</The>
          <The nhan="Lãi TB lệnh lãi" mau={mauLai(tk.laiTBThangPct)}>{dau(tk.laiTBThangPct)}</The>
          <The nhan="Lỗ TB lệnh lỗ" mau={mauLai(tk.loTBThuaPct)} phu={tk.loLonNhat ? `Lớn nhất ${tk.loLonNhat.ma} ${dau(tk.loLonNhat.laiChotPct)}` : undefined}>{dau(tk.loTBThuaPct)}</The>
          <The nhan="Lệnh lỗ quá mức cắt lỗ" mau={tk.viPhamCatLo > 0 ? DO : TEXT} phu={catLo != null ? `Theo phong cách: ${catLo}%` : "Phong cách này không cắt lỗ theo giá"}>{tk.viPhamCatLo ?? "—"}</The>
        </div>
      )}

      <div className="rounded-2xl border overflow-hidden mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b" style={{ borderColor: VIEN }}>
          <h2 className="text-base" style={{ ...sans, fontWeight: 700 }}>Nhật ký ({nhatKy.length} lệnh)</h2>
          {nhatKy.length > 0 && (
            <button type="button" onClick={xuatExcel} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold" style={{ borderColor: VIEN, color: TEXT, ...sans }}>
              <FileSpreadsheet size={13} /> Xuất Excel
            </button>
          )}
        </div>
        {nhatKy.length === 0 ? (
          <p className="text-sm p-4" style={{ color: MUTED }}>Chưa có lệnh nào. Ghi lệnh ở trên, hoặc bấm “Đã làm” ở kế hoạch xử lý.</p>
        ) : (
          <div className="overflow-x-auto bang-cuon">
            <table className="w-full text-sm" style={sans}>
              <thead>
                <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED }}>
                  {["Ngày", "Mã", "Lệnh", "Số lượng", "Giá", "Giá vốn trước", "Lãi/lỗ đã chốt", "Ghi chú", ""].map((t, i) => (
                    <th key={i} className={`py-2.5 px-3 font-normal whitespace-nowrap ${i >= 3 && i <= 6 ? "text-right" : ""}`}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ds.map((g, i) => (
                  <tr key={g.id} className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--vien-nhe)" }}>
                    <td className="py-2 px-3 whitespace-nowrap">{ngayVN(g.ngay)}</td>
                    <td className="py-2 px-3 font-bold">{g.ma}</td>
                    <td className="py-2 px-3" style={{ color: g.loai === "mua" ? "var(--xanh)" : DO, fontWeight: 700 }}>{g.loai === "mua" ? "Mua" : "Bán"}</td>
                    <td className="py-2 px-3 text-right">{soVN(g.kl)}</td>
                    <td className="py-2 px-3 text-right">{g.gia != null ? fmt(g.gia) : "—"}</td>
                    <td className="py-2 px-3 text-right">{g.giaVonTruoc != null ? fmt(g.giaVonTruoc) : "—"}</td>
                    <td className="py-2 px-3 text-right" style={{ color: mauLai(g.laiChot) }}>{g.laiChot != null ? `${tien(g.laiChot)} (${dau(g.laiChotPct)})` : "—"}</td>
                    <td className="py-2 px-3 text-xs" style={{ color: MUTED }}>{g.ghiChu ?? ""}</td>
                    <td className="py-2 px-3">
                      <button type="button" onClick={() => onXoa(g.id)} aria-label="Xóa dòng nhật ký" title="Xóa dòng nhật ký (không sửa số lượng đang giữ)" style={{ color: MUTED }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {tk.theoMa.length > 0 && (
        <p className="text-xs mb-6" style={{ color: MUTED }}>
          Lãi đã chốt theo mã: {tk.theoMa.map((x) => `${x.ma} ${tien(x.lai)}`).join(" · ")}. Xóa dòng nhật ký không sửa lại số lượng đang giữ.
        </p>
      )}
    </>
  );
}
