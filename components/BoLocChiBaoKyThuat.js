"use client";

import { useState, useMemo } from "react";
import { Plus, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { DS_CHI_BAO_LOC, CHI_BAO_LOC, NHOM_CHI_BAO_LOC, GOI_Y_NHANH, KHOANG, taoBoLocChiBao, khopChiBao, locTheoChiBao } from "@/lib/boLocChiBao";
import { kiemTraDuLieuCu } from "@/lib/phienGiaoDich";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const NEN_O = "#0F0F17";
const MUTED = "#8B8B99";
const TEXT = "#F5F5F7";
const PRIMARY = "#6C5CE7";
const XANH = "#22C55E";
const VANG = "#FBBF24";

const kieuO = { background: NEN_O, border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "'Inter', sans-serif" };

// Khung BO LOC CHI BAO KY THUAT rieng (kieu TradingView): bam "Them bo loc" -> chon chi bao -> chon dieu kien co san hoac nhap khoang tu - den. Nhieu bo loc xep chong (AND).
// dsLoc: [{ id, chiBao, dieuKien, tu, den }] (state o BangBoLoc). duLieu: toan bo ma (de dem so ma khop tung bo loc). luc: lan cap nhat chi bao gan nhat.
export default function BoLocChiBaoKyThuat({ dsLoc, datDsLoc, duLieu, luc }) {
  const [mo, setMo] = useState(dsLoc.length > 0);

  const soCoChiBao = useMemo(() => duLieu.filter((r) => typeof r.rsi14 === "number").length, [duLieu]);
  const soMoiBoLoc = useMemo(() => dsLoc.map((l) => duLieu.filter((r) => khopChiBao(r, l)).length), [duLieu, dsLoc]);
  const soKhopTatCa = useMemo(() => locTheoChiBao(duLieu, dsLoc).length, [duLieu, dsLoc]);

  const them = (khoa, dieuKien) => {
    const b = taoBoLocChiBao(khoa, dieuKien);
    if (!b) return;
    datDsLoc((cu) => [...cu, b]);
    setMo(true);
  };
  const sua = (id, phan) => datDsLoc((cu) => cu.map((l) => (l.id === id ? { ...l, ...phan } : l)));
  const bo = (id) => datDsLoc((cu) => cu.filter((l) => l.id !== id));

  const cu = luc ? kiemTraDuLieuCu(luc).cu : false;
  const nhanLuc = luc
    ? new Date(luc).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })
    : null;

  return (
    <section className="rounded-2xl border mb-4" style={{ borderColor: dsLoc.length > 0 ? PRIMARY : VIEN, background: NEN_CARD }} aria-label="Bộ lọc chỉ báo kỹ thuật">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <button type="button" onClick={() => setMo((v) => !v)} className="flex items-center gap-2 text-sm font-bold" style={{ color: TEXT, fontFamily: "'Inter', sans-serif" }} aria-expanded={mo}>
          <SlidersHorizontal size={15} color={PRIMARY} aria-hidden="true" />
          Bộ lọc chỉ báo kỹ thuật
          {dsLoc.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(108,92,231,0.18)", color: "#A79BFF" }}>
              {dsLoc.length} bộ lọc · {soKhopTatCa} mã
            </span>
          )}
          <ChevronDown size={14} color={MUTED} style={{ transform: mo ? "rotate(180deg)" : undefined, transition: "transform .15s" }} aria-hidden="true" />
        </button>
        {!mo && dsLoc.length === 0 && (
          <span className="text-[11px] hidden sm:inline" style={{ color: MUTED }}>
            RSI, MACD, Stochastic, Bollinger, MA, mây Ichimoku, khối lượng...
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {dsLoc.length > 0 && (
            <button type="button" onClick={() => datDsLoc([])} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: MUTED, border: `1px solid ${VIEN}` }}>
              Xoá chỉ báo
            </button>
          )}
          <button
            type="button"
            onClick={() => them("rsi")}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ background: PRIMARY, color: "#fff", fontFamily: "'Inter', sans-serif" }}
          >
            <Plus size={13} aria-hidden="true" />
            Thêm bộ lọc
          </button>
        </div>
      </div>

      {mo && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: VIEN }}>
          {soCoChiBao === 0 && (
            <p className="text-xs mt-3" style={{ color: VANG }}>
              Chưa có dữ liệu chỉ báo kỹ thuật. Hệ thống cần được cập nhật để tính RSI, MACD... (tự có sau lần cập nhật kế tiếp).
            </p>
          )}

          {dsLoc.length > 0 && (
            <div className="flex flex-col gap-2 mt-3">
              {dsLoc.map((l, i) => {
                const d = CHI_BAO_LOC[l.chiBao];
                if (!d) return null;
                return (
                  <div key={l.id} className="flex flex-wrap items-center gap-2">
                    <select
                      value={l.chiBao}
                      onChange={(e) => {
                        const moi = taoBoLocChiBao(e.target.value);
                        if (moi) sua(l.id, { chiBao: moi.chiBao, dieuKien: moi.dieuKien, tu: "", den: "" });
                      }}
                      aria-label="Chỉ báo"
                      className="px-3 py-2 text-sm rounded-lg outline-none flex-1 min-w-[150px] sm:flex-none sm:w-56"
                      style={kieuO}
                    >
                      {NHOM_CHI_BAO_LOC.map((nhom) => (
                        <optgroup key={nhom} label={nhom}>
                          {DS_CHI_BAO_LOC.filter((x) => x.nhom === nhom).map((x) => (
                            <option key={x.khoa} value={x.khoa}>
                              {x.nhan}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <select
                      value={l.dieuKien}
                      onChange={(e) => sua(l.id, { dieuKien: e.target.value })}
                      aria-label="Điều kiện"
                      className="px-3 py-2 text-sm rounded-lg outline-none flex-1 min-w-[180px] sm:flex-none sm:w-80"
                      style={kieuO}
                    >
                      {d.dieuKien.map((c) => (
                        <option key={c.khoa} value={c.khoa}>
                          {c.nhan}
                        </option>
                      ))}
                      {d.truong && <option value={KHOANG}>Trong khoảng (tự nhập)…</option>}
                    </select>
                    {l.dieuKien === KHOANG && (
                      <div className="flex items-center gap-1.5" title={d.goiYKhoang}>
                        <input
                          value={l.tu}
                          onChange={(e) => sua(l.id, { tu: e.target.value })}
                          inputMode="decimal"
                          placeholder="Từ"
                          aria-label="Từ"
                          className="w-20 px-2 py-2 text-sm rounded-lg outline-none text-right"
                          style={{ ...kieuO, fontFamily: "'JetBrains Mono', monospace" }}
                        />
                        <span className="text-xs" style={{ color: MUTED }}>
                          –
                        </span>
                        <input
                          value={l.den}
                          onChange={(e) => sua(l.id, { den: e.target.value })}
                          inputMode="decimal"
                          placeholder="Đến"
                          aria-label="Đến"
                          className="w-20 px-2 py-2 text-sm rounded-lg outline-none text-right"
                          style={{ ...kieuO, fontFamily: "'JetBrains Mono', monospace" }}
                        />
                        {d.donVi && (
                          <span className="text-xs" style={{ color: MUTED }}>
                            {d.donVi}
                          </span>
                        )}
                      </div>
                    )}
                    <span className="text-[11px] whitespace-nowrap" style={{ color: soMoiBoLoc[i] > 0 ? XANH : MUTED }} title="Số mã khớp riêng bộ lọc này (chưa tính các bộ lọc khác)">
                      {soMoiBoLoc[i]} mã
                    </span>
                    <button type="button" onClick={() => bo(l.id)} className="p-1.5 rounded-lg" style={{ color: MUTED }} aria-label="Bỏ bộ lọc này" title="Bỏ bộ lọc này">
                      <X size={15} aria-hidden="true" />
                    </button>
                    {dsLoc.length > 1 && i < dsLoc.length - 1 && (
                      <span className="text-[10px] uppercase tracking-wide w-full sm:w-auto" style={{ color: MUTED }}>
                        và
                      </span>
                    )}
                  </div>
                );
              })}
              {dsLoc.length > 1 && (
                <p className="text-[11px]" style={{ color: MUTED }}>
                  Mã phải khớp <b style={{ color: TEXT }}>tất cả</b> các bộ lọc trên: <b style={{ color: soKhopTatCa > 0 ? XANH : VANG }}>{soKhopTatCa} mã</b>
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="text-[11px] mr-1" style={{ color: MUTED }}>
              Gợi ý nhanh:
            </span>
            {GOI_Y_NHANH.map((g) => (
              <button
                key={g.nhan}
                type="button"
                onClick={() => them(g.chiBao, g.dieuKien)}
                className="text-[11px] px-2.5 py-1 rounded-full"
                style={{ border: `1px solid ${VIEN}`, color: TEXT, background: NEN_O }}
              >
                + {g.nhan}
              </button>
            ))}
          </div>

          <p className="text-[11px] mt-3" style={{ color: MUTED }}>
            Chỉ báo tính từ giá ngày theo tham số mặc định như TradingView (RSI 14, MACD 12-26-9, Stochastic 14-1-3, Bollinger 20×2...). Giữa phiên dùng nến hôm nay đang chạy nên giá trị đổi theo giá.
            {nhanLuc && (
              <span style={{ color: cu ? VANG : MUTED }}>
                {" "}
                Cập nhật lúc <b>{nhanLuc}</b>
                {cu ? " — chưa có dữ liệu phiên mới nhất." : "."}
              </span>
            )}{" "}
            Chỉ để tham khảo, không phải khuyến nghị đầu tư.
          </p>
        </div>
      )}
    </section>
  );
}
