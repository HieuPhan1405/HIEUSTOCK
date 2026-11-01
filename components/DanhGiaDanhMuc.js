"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ClipboardPaste } from "lucide-react";
import { danhGiaDanhMuc, docDanDanhMuc } from "@/lib/danhGiaDanhMuc";
import { fmt, pct } from "@/components/dungChung";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const PRIMARY = "#6C5CE7";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const sans = { fontFamily: "var(--font-chu)" };
const KHOA_LUU = "cs_danh_gia_danh_muc_v1";
const MAU_MUC = [DO, VANG, XANH];
const MAU_TIN = { MUA: XANH, "NAM GIU": "#5BA8FF", BAN: DO, "TRUNG LAP": MUTED };
const NHAN_TIN = { MUA: "Mua", "NAM GIU": "Nắm giữ", BAN: "Bán", "TRUNG LAP": "Trung lập" };

const soVN = (n, d = 0) => (Number.isFinite(n) ? n.toLocaleString("vi-VN", { maximumFractionDigits: d }) : "—");
function tien(v) {
  if (v == null || !Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a >= 1e9) return `${soVN(v / 1e9, 2)} tỷ`;
  if (a >= 1e6) return `${soVN(v / 1e6, 1)} triệu`;
  return `${soVN(v)} đ`;
}
const mauLai = (v) => (v == null ? MUTED : v > 0 ? XANH : v < 0 ? DO : TEXT);
const so = (s) => {
  const x = Number(String(s ?? "").replace(/\./g, (m, i, str) => (/,/.test(str) ? "" : m)).replace(",", "."));
  return Number.isFinite(x) ? x : null;
};
let dem = 0;
const moi = (o = {}) => ({ id: `h${Date.now()}${dem++}`, ma: "", kl: "", giaVon: "", ...o });

function The({ nhan, children, phu, mau }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="text-xs mb-1" style={{ color: MUTED }}>{nhan}</div>
      <div className="text-2xl" style={{ ...sans, fontWeight: 800, color: mau ?? TEXT }}>{children}</div>
      {phu && <div className="text-[11px] mt-1" style={{ color: MUTED }}>{phu}</div>}
    </div>
  );
}

function Thanh({ ten, v, mau = PRIMARY }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1" style={{ ...sans }}>
        <span>{ten}</span>
        <span style={{ color: MUTED }}>{(v * 100).toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--vien-nhe)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, v * 100)}%`, background: mau }} />
      </div>
    </div>
  );
}

// duLieu: { MA: { ma, ten_ngan, gia, doi, tin, diem, kijun, gg_bot, stop_loss, tp1, ban_bot, nganh, von_hoa } } (chi nguoi da duoc duyet moi vao duoc trang)
export default function DanhGiaDanhMuc({ duLieu, ngay = "", gocNganh = {} }) {
  const [ds, setDs] = useState([moi()]);
  const [san, setSan] = useState(false);
  const [dan, setDan] = useState(false);
  const [vanBan, setVanBan] = useState("");
  const [thongBao, setThongBao] = useState("");
  // von & margin (nhap theo TRIEU DONG; ty le ky quy theo %): tien mat con lai, du no margin, lai suat %/nam (tuy chon), nguong canh bao / xu ly cua CTCK
  const [von, setVon] = useState({ tienMat: "", no: "", laiSuat: "", canhBao: "35", giaiChap: "30" });

  // doc danh muc da luu tren MAY nay (khong gui len may chu)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const j = JSON.parse(localStorage.getItem(KHOA_LUU) || "null");
        const dsLuu = Array.isArray(j) ? j : j?.ds;
        if (Array.isArray(dsLuu) && dsLuu.length) setDs(dsLuu.map((x) => moi(x)));
        if (j && !Array.isArray(j) && j.von) setVon((v) => ({ ...v, ...j.von }));
      } catch {}
      setSan(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!san) return;
    try {
      localStorage.setItem(KHOA_LUU, JSON.stringify({ ds: ds.filter((x) => x.ma || x.kl || x.giaVon).map(({ ma, kl, giaVon }) => ({ ma, kl, giaVon })), von }));
    } catch {}
  }, [ds, von, san]);

  const vitri = useMemo(
    () =>
      ds
        .map((x) => ({ ma: x.ma.trim().toUpperCase(), kl: so(x.kl), giaVon: so(x.giaVon) }))
        .filter((x) => /^[A-Z0-9]{2,12}$/.test(x.ma) && x.kl > 0)
        .map((x) => ({ ...x, giaVon: x.giaVon > 0 ? x.giaVon : null })),
    [ds]
  );
  const trieu = (x) => (so(x) > 0 ? so(x) * 1e6 : 0);
  const kq = useMemo(
    () => (vitri.length ? danhGiaDanhMuc(vitri, duLieu, { tienMat: trieu(von.tienMat), no: trieu(von.no), laiSuat: so(von.laiSuat), nguong: { canhBao: so(von.canhBao), giaiChap: so(von.giaiChap) }, gocNganh }) : null),
    [vitri, duLieu, von, gocNganh]
  );
  const dsMa = useMemo(() => Object.keys(duLieu).sort(), [duLieu]);

  const sua = (id, k, v) => setDs((c) => c.map((x) => (x.id === id ? { ...x, [k]: v } : x)));
  const nhapDan = () => {
    const { ds: moiDs, boQua } = docDanDanhMuc(vanBan);
    if (!moiDs.length) {
      setThongBao("Không đọc được dòng nào. Mỗi dòng dạng: HPG 1000 25,5 (mã, số lượng, giá vốn).");
      return;
    }
    setDs((c) => {
      const co = c.filter((x) => x.ma || x.kl || x.giaVon);
      const theoMa = new Map(co.map((x) => [x.ma.toUpperCase(), x]));
      for (const x of moiDs) theoMa.set(x.ma, moi({ ma: x.ma, kl: String(x.kl), giaVon: x.giaVon != null ? String(x.giaVon).replace(".", ",") : "" }));
      return [...theoMa.values()];
    });
    setThongBao(`Đã nhập ${moiDs.length} mã${boQua.length ? `, bỏ qua ${boQua.length} dòng không đọc được` : ""}.`);
    setVanBan("");
    setDan(false);
  };

  const o = "px-2.5 py-1.5 rounded-lg text-sm border w-full";
  const oStyle = { borderColor: VIEN, background: "transparent", color: TEXT, ...sans };

  return (
    <div>
      {/* NHAP */}
      <section className="rounded-2xl border p-4 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }} aria-label="Nhập danh mục">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h2 className="text-lg" style={{ ...sans, fontWeight: 700 }}>Danh mục của bạn</h2>
          <span className="text-[11px]" style={{ color: MUTED }}>Lưu ngay trên máy bạn (trình duyệt), không gửi lên máy chủ</span>
        </div>
        <datalist id="ds-ma-danh-gia">{dsMa.map((m) => <option key={m} value={m} />)}</datalist>
        <div className="grid grid-cols-[minmax(70px,1fr)_minmax(90px,1.2fr)_minmax(90px,1.2fr)_32px] gap-2 text-[11px] mb-1" style={{ color: MUTED }}>
          <span>Mã</span>
          <span>Số lượng (cp)</span>
          <span title="Giá mua bình quân, đơn vị nghìn đồng như giá trên web (vd 25,5 = 25.500đ)">Giá vốn (nghìn đồng)</span>
          <span />
        </div>
        {ds.map((x) => (
          <div key={x.id} className="grid grid-cols-[minmax(70px,1fr)_minmax(90px,1.2fr)_minmax(90px,1.2fr)_32px] gap-2 mb-2 items-center">
            <input list="ds-ma-danh-gia" value={x.ma} onChange={(e) => sua(x.id, "ma", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12))} placeholder="HPG" className={o} style={{ ...oStyle, fontWeight: 700 }} aria-label="Mã cổ phiếu" />
            <input value={x.kl} onChange={(e) => sua(x.id, "kl", e.target.value.replace(/[^0-9.,]/g, ""))} inputMode="numeric" placeholder="1.000" className={o} style={oStyle} aria-label="Số lượng" />
            <input value={x.giaVon} onChange={(e) => sua(x.id, "giaVon", e.target.value.replace(/[^0-9.,]/g, ""))} inputMode="decimal" placeholder="25,5" className={o} style={oStyle} aria-label="Giá vốn" />
            <button type="button" onClick={() => setDs((c) => (c.length > 1 ? c.filter((y) => y.id !== x.id) : [moi()]))} aria-label="Xóa dòng" style={{ color: MUTED }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <button type="button" onClick={() => setDs((c) => [...c, moi()])} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold" style={{ borderColor: VIEN, color: TEXT, ...sans }}>
            <Plus size={13} /> Thêm mã
          </button>
          <button type="button" onClick={() => setDan((v) => !v)} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold" style={{ borderColor: VIEN, color: TEXT, ...sans }}>
            <ClipboardPaste size={13} /> Dán nhiều dòng
          </button>
          <button type="button" onClick={() => { setDs([moi()]); setThongBao(""); }} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: MUTED, ...sans }}>Xóa hết</button>
          {thongBao && <span className="text-xs" style={{ color: MUTED }}>{thongBao}</span>}
        </div>
        {dan && (
          <div className="mt-3">
            <textarea value={vanBan} onChange={(e) => setVanBan(e.target.value)} rows={5} placeholder={"HPG 1000 25,5\nVCB 500 57,2\nSSI 2.000 19"} className={`${o} font-mono`} style={oStyle} aria-label="Dán danh mục" />
            <button type="button" onClick={nhapDan} className="mt-2 text-sm px-4 py-2 rounded-lg font-semibold" style={{ background: PRIMARY, color: "#fff", ...sans }}>Nhập vào danh mục</button>
            <p className="text-[11px] mt-1" style={{ color: MUTED }}>Mỗi dòng: mã, số lượng, giá vốn (cách nhau bằng dấu cách hoặc phẩy). Giá vốn có thể bỏ trống nếu chỉ muốn xem phân bổ.</p>
          </div>
        )}
      </section>

      {/* VON & MARGIN */}
      <section className="rounded-2xl border p-4 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }} aria-label="Vốn và margin">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h2 className="text-lg" style={{ ...sans, fontWeight: 700 }}>Vốn & margin</h2>
          <span className="text-[11px]" style={{ color: MUTED }}>Tùy chọn — nhập theo triệu đồng; không dùng margin thì để trống ô nợ</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            ["tienMat", "Tiền mặt còn lại (triệu đồng)", "50"],
            ["no", "Dư nợ margin (triệu đồng)", "0"],
            ["laiSuat", "Lãi suất margin (%/năm)", "12"],
            ["canhBao", "Ngưỡng cảnh báo ký quỹ (%)", "35"],
            ["giaiChap", "Ngưỡng xử lý / giải chấp (%)", "30"],
          ].map(([k, nhan, ph]) => (
            <label key={k} className="block text-[11px]" style={{ color: MUTED }}>
              {nhan}
              <input value={von[k]} onChange={(e) => setVon((v) => ({ ...v, [k]: e.target.value.replace(/[^0-9.,]/g, "") }))} inputMode="decimal" placeholder={ph} className={`${o} mt-1`} style={oStyle} />
            </label>
          ))}
        </div>
        <p className="text-[11px] mt-2" style={{ color: MUTED }}>Tỷ lệ ký quỹ = (tài sản − nợ) / tài sản. Ngưỡng cảnh báo và xử lý mỗi công ty chứng khoán một kiểu (thường 30–40%) — bạn tự sửa theo CTCK của mình; web coi toàn bộ cổ phiếu trong danh mục đều được vay.</p>
      </section>

      {!kq && <p className="text-sm mb-6" style={{ color: MUTED }}>Nhập ít nhất một mã và số lượng để xem đánh giá.</p>}

      {kq && (
        <>
          {/* TONG QUAN */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <The nhan="Tổng giá trị" phu={`${kq.soMaCoGia}/${kq.soMa} mã có giá${ngay ? ` · ${ngay}` : ""}`}>{tien(kq.tongGiaTri)}</The>
            <The nhan="Lãi / lỗ so với giá vốn" mau={mauLai(kq.laiLo)} phu={kq.laiLo != null ? tien(kq.laiLo) : "Chưa nhập giá vốn"}>{kq.laiLoPct != null ? pct(kq.laiLoPct, 1) : "—"}</The>
            <The nhan="Điểm đánh giá" mau={kq.diem == null ? MUTED : kq.diem >= 75 ? XANH : kq.diem >= 45 ? VANG : DO} phu={kq.diem != null ? `Đa dạng ${kq.chiTietDiem.daDang}/40 · Kỹ thuật ${kq.chiTietDiem.kyThuat}/40 · Rủi ro ${kq.chiTietDiem.ruiRo}/20` : undefined}>
              {kq.diem != null ? `${kq.diem}/100 · ${kq.xepLoai}` : "—"}
            </The>
            <The nhan="Tập trung" phu={kq.tyTrong.maTop1 ? `Lớn nhất: ${kq.tyTrong.maTop1}` : undefined}>{kq.tyTrong.maTop1 ? `${(kq.tyTrong.top1 * 100).toFixed(0)}% · top 3: ${(kq.tyTrong.top3 * 100).toFixed(0)}%` : "—"}</The>
          </div>

          {/* VON & DON BAY */}
          <div className={`grid grid-cols-2 ${kq.margin ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4 mb-6`}>
            <The nhan="Tài sản ròng (NAV)" phu={`Cổ phiếu ${tien(kq.taiSan.coPhieu)}${kq.taiSan.no > 0 ? ` − nợ ${tien(kq.taiSan.no)}` : ""}`}>{tien(kq.taiSan.nav)}</The>
            <The nhan="Tiền mặt" phu={kq.taiSan.tongTaiSan > 0 ? `${(kq.taiSan.tyLeTienMat * 100).toFixed(0)}% tổng tài sản` : undefined}>{tien(kq.taiSan.tienMat)}</The>
            {kq.margin ? (
              <>
                <The nhan="Đòn bẩy margin" mau={kq.margin.donBay > 1.5 ? DO : kq.margin.donBay > 1.2 ? VANG : TEXT} phu={`Tỷ lệ ký quỹ ${kq.margin.tyLeKyQuy != null ? kq.margin.tyLeKyQuy.toFixed(0) : "—"}%${kq.margin.laiMoiThang != null ? ` · lãi vay ~${tien(kq.margin.laiMoiThang)}/tháng` : ""}`}>{kq.margin.donBay != null ? `${kq.margin.donBay.toFixed(2).replace(".", ",")}x` : "—"}</The>
                <The nhan={`Giảm bao nhiêu thì chạm ${kq.nguong.canhBao}%`} mau={kq.margin.giamDenCanhBao == null ? MUTED : kq.margin.giamDenCanhBao <= 10 ? DO : kq.margin.giamDenCanhBao <= 20 ? VANG : XANH} phu={kq.margin.giamDenGiaiChap != null ? `Giảm ~${kq.margin.giamDenGiaiChap.toFixed(0)}% thì tới ngưỡng xử lý ${kq.nguong.giaiChap}%` : undefined}>{kq.margin.giamDenCanhBao != null ? `−${kq.margin.giamDenCanhBao.toFixed(0)}% giá trị cổ phiếu` : "—"}</The>
              </>
            ) : (
              <The nhan="Margin" phu="Chưa nhập dư nợ">Không dùng</The>
            )}
          </div>

          {/* PHAN TICH */}
          <section className="rounded-2xl border p-4 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }} aria-label="Phân tích danh mục">
            <h2 className="text-lg mb-3" style={{ ...sans, fontWeight: 700 }}>Phân tích</h2>
            {kq.nhanXet.length === 0 ? (
              <p className="text-sm" style={{ color: MUTED }}>Chưa có điểm nào đáng chú ý.</p>
            ) : (
              <ul className="grid gap-2">
                {kq.nhanXet.map((x, i) => (
                  <li key={i} className="flex gap-2 text-sm" style={sans}>
                    <span aria-hidden="true" className="mt-1.5 shrink-0 rounded-full" style={{ width: 8, height: 8, background: MAU_MUC[x.muc] }} />
                    <span>{x.nhan}</span>
                  </li>
                ))}
              </ul>
            )}
            {kq.thieu.length > 0 && <p className="text-xs mt-3" style={{ color: VANG }}>Chưa có dữ liệu giá cho: {kq.thieu.join(", ")} — các mã này không được tính vào tỷ trọng.</p>}
          </section>

          {/* PHAN BO */}
          <div className="grid gap-4 lg:grid-cols-2 mb-6">
            <section className="rounded-2xl border p-4" style={{ borderColor: VIEN, background: NEN_CARD }} aria-label="Phân bổ theo ngành">
              <h2 className="text-base mb-3" style={{ ...sans, fontWeight: 700 }}>Theo ngành</h2>
              {kq.nganh.map((n) => <Thanh key={n.ten} ten={n.ten} v={n.tyTrong} mau={n.tyTrong > 0.5 ? DO : PRIMARY} />)}
            </section>
            <section className="rounded-2xl border p-4" style={{ borderColor: VIEN, background: NEN_CARD }} aria-label="Phân bổ theo mã">
              <h2 className="text-base mb-3" style={{ ...sans, fontWeight: 700 }}>Theo mã</h2>
              {[...kq.hang].filter((h) => h.tyTrong != null).sort((a, b) => b.tyTrong - a.tyTrong).map((h) => <Thanh key={h.ma} ten={h.ma} v={h.tyTrong} mau={h.tyTrong > 0.45 ? DO : h.tyTrong > 0.3 ? VANG : PRIMARY} />)}
            </section>
          </div>

          {/* CHI TIET */}
          <div className="rounded-2xl border overflow-hidden mb-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
            <div className="overflow-x-auto bang-cuon">
              <table className="w-full text-sm" style={sans}>
                <thead>
                  <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED }}>
                    {["Mã", "Số lượng", "Giá vốn", "Giá", "Lãi/lỗ", "Giá trị", "Tỷ trọng", "Tín hiệu", "Nhận xét"].map((t, i) => (
                      <th key={t} className={`py-3 px-3 font-normal whitespace-nowrap ${i > 0 && i < 7 ? "text-right" : ""}`}>{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kq.hang.map((h, i) => (
                    <tr key={h.ma} className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--vien-nhe)" }}>
                      <td className="py-2.5 px-3 font-bold"><Link href={`/ma/${h.ma}`} className="hover:underline">{h.ma}</Link></td>
                      <td className="py-2.5 px-3 text-right">{soVN(h.kl)}</td>
                      <td className="py-2.5 px-3 text-right">{h.giaVon != null ? fmt(h.giaVon) : "—"}</td>
                      <td className="py-2.5 px-3 text-right">{h.gia != null ? fmt(h.gia) : "—"}</td>
                      <td className="py-2.5 px-3 text-right" style={{ color: mauLai(h.laiLoPct) }}>{h.laiLoPct != null ? pct(h.laiLoPct, 1) : "—"}</td>
                      <td className="py-2.5 px-3 text-right">{tien(h.giaTri)}</td>
                      <td className="py-2.5 px-3 text-right">{h.tyTrong != null ? `${(h.tyTrong * 100).toFixed(1).replace(".", ",")}%` : "—"}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: MAU_TIN[h.tin] ?? MUTED, fontWeight: 700 }}>{NHAN_TIN[h.tin] ?? "—"}</td>
                      <td className="py-2.5 px-3 min-w-[260px]">
                        <div className="flex flex-col gap-1">
                          {h.nhanXet.length === 0 ? <span style={{ color: MUTED }}>—</span> : h.nhanXet.map((x, j) => (
                            <span key={j} className="text-xs" style={{ color: MAU_MUC[x.muc] }}>{x.nhan}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <p className="text-[11px]" style={{ color: MUTED }}>
        Điểm và các nhận xét dựa trên tín hiệu của hệ thống (giá so với Kijun / đường cân bằng dài hạn, mốc cắt lỗ - chốt lời, tín hiệu BÁN) và mức tập trung của danh mục. Thang điểm là cách chấm tự đặt của web, chưa được kiểm chứng bằng backtest; lãi/lỗ chưa trừ phí và thuế. Chỉ để tham khảo, không phải khuyến nghị đầu tư.
      </p>
    </div>
  );
}
