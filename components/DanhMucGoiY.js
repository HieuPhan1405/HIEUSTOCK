"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { fmt, pct } from "@/components/dungChung";
import { goiYDanhMuc } from "@/lib/danhMucGoiY";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const PRIMARY = "#6C5CE7";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const CAM = "var(--cam)";
const sans = { fontFamily: "var(--font-chu)" };
const mono = { fontFamily: "var(--font-chu)" };
const KHOA = "cloudstock.danhMucGoiY.v1";

const NHAN = {
  giu: ["Giữ", XANH],
  theo_doi: ["Giữ, không mua thêm", VANG],
  giam: ["Cân nhắc giảm", CAM],
  du: ["Cân nhắc giảm (vượt số mã)", CAM],
  ban: ["Bán", DO],
  cat_lo: ["Cắt lỗ", DO],
  khong_du_lieu: ["Chưa đánh giá", MUTED],
};
const mauLai = (v) => (v == null ? MUTED : v >= 0 ? XANH : DO);
const phanTram = (v) => `${(v * 100).toFixed(1).replace(".", ",")}%`;
const tien = (v) => (v == null ? "—" : `${Math.round(v / 1e6).toLocaleString("vi-VN")} tr`);

const oNhap = { background: "transparent", border: `1px solid ${VIEN}`, borderRadius: 8, padding: "6px 10px", color: TEXT, fontSize: 14, ...mono, minWidth: 0 };

function The({ nhan, children }) {
  return (
    <label className="flex flex-col gap-1 text-[11px]" style={{ color: MUTED, ...sans }}>
      {nhan}
      {children}
    </label>
  );
}

const MAC_DINH = { soMa: 8, von: "", hang: [{ ma: "", giaVon: "" }], nganh: [] };
function docDaLuu() {
  try {
    const s = JSON.parse(localStorage.getItem(KHOA) || "null");
    if (!s) return MAC_DINH;
    return {
      soMa: Number.isFinite(s.soMa) ? Math.max(1, Math.min(20, s.soMa)) : MAC_DINH.soMa,
      von: typeof s.von === "string" ? s.von : "",
      nganh: Array.isArray(s.nganh) ? s.nganh.filter((x) => typeof x === "string").slice(0, 40) : [],
      hang: Array.isArray(s.hang) && s.hang.length ? s.hang.slice(0, 40).map((h) => ({ ma: String(h.ma ?? ""), giaVon: String(h.giaVon ?? "") })) : MAC_DINH.hang,
    };
  } catch {
    return MAC_DINH;
  }
}

// Chi dung o trinh duyet (de doc duoc du lieu da luu ma khong lech HTML may chu): may chu / lan render dau tra ve khung rong.
export default function DanhMucGoiY(props) {
  const daVaoTrinhDuyet = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  return daVaoTrinhDuyet ? <NoiDung {...props} /> : <div style={{ minHeight: 240 }} aria-busy="true" />;
}

function NoiDung({ tatCa = [], muaPhucHoi = [] }) {
  const [daLuu] = useState(docDaLuu);
  const [soMa, setSoMa] = useState(daLuu.soMa);
  const [von, setVon] = useState(daLuu.von);
  const [hang, setHang] = useState(daLuu.hang);
  const [nganhChon, setNganhChon] = useState(daLuu.nganh);

  // luu lan nhap (tren trinh duyet cua rieng ban, khong gui len may chu)
  useEffect(() => {
    try {
      localStorage.setItem(KHOA, JSON.stringify({ soMa, von, hang, nganh: nganhChon }));
    } catch {
      // trinh duyet chan luu tru: van dung binh thuong
    }
  }, [soMa, von, hang, nganhChon]);

  const dsMa = useMemo(() => tatCa.map((r) => r.ma).sort(), [tatCa]);
  // moi nganh + so ma dang co tin hieu MUA (de biet nganh nao dang co co hoi)
  const dsNganh = useMemo(() => {
    const m = new Map();
    for (const r of tatCa) if (r.nganh) m.set(r.nganh, (m.get(r.nganh) ?? 0) + (r.tin === "MUA" ? 1 : 0));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "vi"));
  }, [tatCa]);
  const doiNganh = (ten) => setNganhChon((x) => (x.includes(ten) ? x.filter((n) => n !== ten) : [...x, ten]));
  const kq = useMemo(
    () =>
      goiYDanhMuc({
        soMa,
        dangCam: hang.filter((h) => h.ma.trim()).map((h) => ({ ma: h.ma, giaVon: Number(String(h.giaVon).replace(",", ".")) })),
        tatCa,
        muaPhucHoi,
        vonTrieu: Number(String(von).replace(",", ".")) || null,
        nganhChon,
      }),
    [soMa, hang, von, tatCa, muaPhucHoi, nganhChon]
  );

  const capNhatHang = (i, k, v) => setHang((h) => h.map((x, j) => (j === i ? { ...x, [k]: k === "ma" ? v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) : v } : x)));
  const coVon = kq.conLai.some((x) => x.soTien != null);

  return (
    <div style={{ color: TEXT }}>
      <div className="rounded-2xl border p-4 mb-5" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <The nhan="Số mã muốn nắm trong danh mục">
            <input type="number" min={1} max={20} value={soMa} onChange={(e) => setSoMa(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} style={oNhap} aria-label="Số mã muốn nắm" />
          </The>
          <The nhan="Tổng vốn (triệu đồng) — không bắt buộc, để tính số tiền và số cổ phiếu">
            <input inputMode="decimal" placeholder="vd 500" value={von} onChange={(e) => setVon(e.target.value)} style={oNhap} aria-label="Tổng vốn triệu đồng" />
          </The>
        </div>

        <div className="mb-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <span className="text-[11px]" style={{ color: MUTED, ...sans }}>
              Ngành muốn đầu tư — chỉ áp dụng cho mã gợi ý thêm (số trong ngoặc: mã đang có tín hiệu MUA). Không chọn = mọi ngành.
            </span>
            {nganhChon.length > 0 && (
              <button type="button" onClick={() => setNganhChon([])} className="text-[11px] underline" style={{ color: PRIMARY }}>
                Bỏ chọn ({nganhChon.length})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ngành muốn đầu tư">
            {dsNganh.map(([ten, soMua]) => {
              const bat = nganhChon.includes(ten);
              return (
                <button
                  key={ten}
                  type="button"
                  aria-pressed={bat}
                  onClick={() => doiNganh(ten)}
                  className="text-xs px-2.5 py-1 rounded-full border"
                  style={{ ...sans, borderColor: bat ? PRIMARY : VIEN, background: bat ? PRIMARY : "transparent", color: bat ? "#fff" : TEXT, fontWeight: bat ? 700 : 400 }}
                >
                  {ten} <span style={{ opacity: 0.7 }}>({soMua})</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs mb-2" style={{ color: MUTED, ...sans }}>
          Mã bạn đang cầm và giá vốn (nghìn đồng, cùng đơn vị với giá trên web — ví dụ 25,3 là 25.300đ). Để trống nếu bạn chưa cầm mã nào.
        </p>
        <datalist id="ds-ma-goi-y">
          {dsMa.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <div className="flex flex-col gap-2">
          {hang.map((h, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <input list="ds-ma-goi-y" placeholder="Mã (vd VPB)" value={h.ma} onChange={(e) => capNhatHang(i, "ma", e.target.value)} style={oNhap} aria-label={`Mã đang cầm ${i + 1}`} />
              <input inputMode="decimal" placeholder="Giá vốn" value={h.giaVon} onChange={(e) => capNhatHang(i, "giaVon", e.target.value)} style={oNhap} aria-label={`Giá vốn ${i + 1}`} />
              <button type="button" onClick={() => setHang((x) => (x.length > 1 ? x.filter((_, j) => j !== i) : [{ ma: "", giaVon: "" }]))} className="text-xs px-2 py-1 rounded-lg border" style={{ borderColor: VIEN, color: MUTED }} aria-label="Xóa dòng">
                Xóa
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={() => setHang((x) => (x.length < 40 ? [...x, { ma: "", giaVon: "" }] : x))} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "#6C5CE7", color: "#fff", ...sans, fontWeight: 600 }}>
            + Thêm mã
          </button>
          <button type="button" onClick={() => { setHang([{ ma: "", giaVon: "" }]); setNganhChon([]); }} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: VIEN, color: MUTED, ...sans }}>
            Xóa hết
          </button>
        </div>
        <p className="text-[11px] mt-2" style={{ color: MUTED, ...sans }}>
          Dữ liệu bạn nhập chỉ lưu trên trình duyệt của bạn, không gửi lên máy chủ.
        </p>
      </div>

      {kq.dangCam.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg mb-2" style={{ ...sans, fontWeight: 700 }}>
            Mã bạn đang cầm
          </h2>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
            {kq.dangCam.map((x) => {
              const [nhan, mau] = NHAN[x.loai] ?? NHAN.khong_du_lieu;
              return (
                <Link key={x.ma} href={`/ma/${x.ma}`} className="grid grid-cols-[64px_1fr_auto] gap-3 px-3 py-3 border-b last:border-b-0 items-start" style={{ borderColor: "var(--vien-nhe)" }}>
                  <span style={{ ...sans, fontWeight: 700, fontSize: 15 }}>{x.ma}</span>
                  <span className="text-xs leading-relaxed min-w-0" style={{ color: MUTED }}>
                    <b style={{ color: mau, ...sans }}>{nhan}</b> — {x.lyDo}{x.ngoaiNganh && <span style={{ color: VANG }}> Ngoài ngành bạn chọn{x.nganh ? ` (${x.nganh})` : ""}: nếu muốn tập trung vào ngành đã chọn, đây là mã có thể giảm.</span>}
                    {x.tyTrong != null && x.tyTrong > 0 && <span> Tỷ trọng gợi ý {phanTram(x.tyTrong)}{x.soCp != null && ` (${tien(x.soTien)}, ~${x.soCp.toLocaleString("vi-VN")} cp)`}.</span>}
                    {x.sl != null && <span> Cắt lỗ hệ thống {fmt(x.sl)}.</span>}
                  </span>
                  <span className="text-right" style={{ ...mono, fontSize: 13 }}>
                    {x.gia != null ? fmt(x.gia) : "—"}
                    <span className="block text-[11px]" style={{ color: mauLai(x.laiVonPct) }}>
                      {x.laiVonPct != null ? pct(x.laiVonPct, 1) : "—"}
                    </span>
                    <span className="block text-[11px]" style={{ color: MUTED, ...sans }}>
                      so với giá vốn {x.giaVon != null ? fmt(x.giaVon) : "?"}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-6">
        <h2 className="text-lg mb-1" style={{ ...sans, fontWeight: 700 }}>
          Nên thêm vào danh mục
        </h2>
        <p className="text-xs mb-2" style={{ color: MUTED }}>
          {kq.them.length > 0
            ? `${kq.them.length} mã lấp chỗ trống (tối đa ${kq.soMa - kq.conLai.length}), chọn từ tín hiệu MUA mới / mã còn trong vùng mua / điểm B, tối đa 2 mã mỗi ngành, bỏ mã thanh khoản thấp và mã giá đã chạy khỏi vùng mua.`
            : kq.soMa - kq.conLai.length <= 0
              ? "Danh mục đã đủ số mã bạn muốn nắm."
              : kq.nganhChon.length > 0
                ? "Các ngành bạn chọn hiện chưa có mã nào đủ điều kiện để thêm."
                : "Hiện không có mã nào đủ điều kiện để thêm."}
          {kq.boQuaViNganh > 0 && ` ${kq.boQuaViNganh} mã đủ điều kiện nhưng nằm ngoài ngành bạn chọn.`}
          {kq.thieuMa > 0 && kq.them.length > 0 && ` Còn thiếu ${kq.thieuMa} mã: phần vốn tương ứng giữ tiền mặt đến khi có cơ hội.`}
        </p>
        {kq.them.length > 0 && (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
            {kq.them.map((t) => (
              <Link key={t.ma} href={`/ma/${t.ma}`} className="grid grid-cols-[64px_1fr_auto] gap-3 px-3 py-3 border-b last:border-b-0 items-start" style={{ borderColor: "var(--vien-nhe)" }}>
                <span>
                  <span className="block" style={{ ...sans, fontWeight: 700, fontSize: 15 }}>{t.ma}</span>
                  <span className="block text-[11px] font-bold" style={{ color: t.loai === "B" ? VANG : XANH, ...sans }}>
                    {t.loai === "B" ? "Điểm B" : "MUA"}
                  </span>
                </span>
                <span className="text-xs leading-relaxed min-w-0" style={{ color: MUTED, ...mono }}>
                  {t.ghiChu}{t.nganh ? ` · ${t.nganh}` : ""}
                  <br />
                  {t.loai === "B" ? "Giá chờ" : "Giá vào"} <b style={{ color: TEXT }}>{fmt(t.giaVao)}</b> · Cắt lỗ <b style={{ color: DO }}>{fmt(t.sl)}</b>
                  {t.tp1 != null && t.tp2 != null && <span> · TP1/TP2 <b style={{ color: XANH }}>{fmt(t.tp1)} / {fmt(t.tp2)}</b></span>}
                </span>
                <span className="text-right" style={{ ...mono, fontSize: 13 }}>
                  {phanTram(t.tyTrong)}
                  <span className="block text-[11px]" style={{ color: MUTED, ...sans }}>tỷ trọng</span>
                  {t.soCp != null && (
                    <span className="block text-[11px]" style={{ color: MUTED, ...sans }}>
                      {tien(t.soTien)} · ~{t.soCp.toLocaleString("vi-VN")} cp
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-lg mb-2" style={{ ...sans, fontWeight: 700 }}>
          Danh mục mục tiêu
        </h2>
        <div className="rounded-2xl border p-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
          {kq.conLai.length + kq.them.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>Chưa có mã nào phù hợp — giữ tiền mặt.</p>
          ) : (
            <>
              <div className="flex h-5 rounded-full overflow-hidden mb-3" role="img" aria-label="Tỷ trọng danh mục mục tiêu">
                {[...kq.conLai, ...kq.them].map((x, i) => (
                  <div key={x.ma} title={`${x.ma} ${phanTram(x.tyTrong)}`} style={{ width: `${x.tyTrong * 100}%`, background: `hsl(${(i * 47) % 360} 60% 52%)` }} />
                ))}
                <div title={`Tiền mặt ${phanTram(kq.tienMat)}`} style={{ width: `${kq.tienMat * 100}%`, background: "var(--vien)" }} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={mono}>
                {[...kq.conLai, ...kq.them].map((x, i) => (
                  <span key={x.ma}>
                    <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 3, marginRight: 4, background: `hsl(${(i * 47) % 360} 60% 52%)` }} />
                    {x.ma} {phanTram(x.tyTrong)}
                  </span>
                ))}
                <span style={{ color: MUTED }}>Tiền mặt {phanTram(kq.tienMat)}</span>
              </div>
              {!coVon && <p className="text-[11px] mt-2" style={{ color: MUTED, ...sans }}>Nhập tổng vốn ở trên để xem số tiền và số cổ phiếu cho từng mã.</p>}
            </>
          )}
        </div>
      </section>

      <p className="text-[11px]" style={{ color: MUTED, ...sans }}>
        Cách chia: tỷ trọng tỷ lệ nghịch với khoảng cách tới mức cắt lỗ (cắt lỗ càng gần thì mua nhiều hơn, để mỗi mã chịu mức mất tương đương nhau nếu chạm cắt lỗ), trần 2/số mã cho mỗi mã, điểm B chỉ giải ngân 1/2 phần. Kết quả chỉ là bản mô phỏng theo quy tắc cố định của hệ thống, không xét mục tiêu, khẩu vị rủi ro hay tình hình tài chính riêng của bạn, và không phải khuyến nghị đầu tư. Quyết định mua bán là của bạn.
      </p>
    </div>
  );
}
