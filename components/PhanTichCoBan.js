"use client";

import { useState } from "react";
import { soVN } from "@/lib/soVN";

// PHAN TICH CO BAN 1 MA tren /ma/[ma]: Danh gia 360 (radar 5 tru cot), dinh gia so voi nganh, diem Z/F, DuPont theo quy 2026.
// Du lieu: lib/phanTichCoBanDb.js (engine/dich-vu/taoDuLieuPhanTichWeb.mjs). Diem 360 la THU HANG so voi cac ma cung loai, khong phai nguong tuyet doi.
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const sans = { fontFamily: "var(--font-chu)" };
const TRU = [
  ["dinhGia", "Định giá", "Rẻ hay đắt so với các mã cùng loại: P/E và P/B càng thấp điểm càng cao."],
  ["tangTruong", "Tăng trưởng", "Tăng lợi nhuận 4 quý, doanh thu 4 quý và lợi nhuận quý gần nhất so với cùng kỳ."],
  ["hieuQua", "Hiệu quả", "ROE, ROA và biên lợi nhuận ròng."],
  ["sucKhoe", "Sức khoẻ tài chính", "Điểm Z″ và điểm F (doanh nghiệp thường); ngân hàng/chứng khoán/bảo hiểm dùng điểm sinh lời và ROA."],
  ["coTuc", "Cổ tức", "Tỷ suất cổ tức tiền mặt 4 quý gần nhất / vốn hoá."],
];
// "2026-09-30" -> "Quý 3/2026"
const tenQuy = (q) => (/^\d{4}-\d{2}-\d{2}$/.test(q) ? `Quý ${Math.ceil(Number(q.slice(5, 7)) / 3)}/${q.slice(0, 4)}` : q);
const TIEU_CHI_F = ["ROA > 0", "Dòng tiền kinh doanh > 0", "ROA tăng", "Dòng tiền kinh doanh > lợi nhuận", "Đòn bẩy giảm", "Thanh toán hiện hành tăng", "Không phát hành thêm cổ phiếu", "Biên lãi gộp tăng", "Vòng quay tài sản tăng"];

const f = (x, d = 1) => (x == null || !Number.isFinite(x) ? "—" : soVN(x, d, true));
const pc = (x) => (x == null ? "—" : `${x > 0 ? "+" : ""}${soVN(x, 0)}%`);
const mauDiem = (v) => (v == null ? MUTED : v >= 6.5 ? XANH : v >= 5 ? "var(--chu)" : v >= 3.5 ? VANG : DO);
const mauXepLoai = { Tốt: XANH, Khá: "#5BA8FF", "Trung bình": VANG, Yếu: DO };
const mauVung = (v) => (v === "an toàn" ? XANH : v === "xám" ? VANG : DO);
const mauTang = (v) => (v == null ? MUTED : v > 0 ? XANH : DO);

function Radar({ d360 }) {
  const R = 92;
  const C = 128;
  const diem = (i, v) => {
    const g = (-90 + i * 72) * (Math.PI / 180);
    return [C + Math.cos(g) * R * v, C + Math.sin(g) * R * v];
  };
  const vong = [0.25, 0.5, 0.75, 1];
  const da = TRU.map(([k], i) => diem(i, (d360[k] ?? 0) / 10));
  return (
    <svg viewBox="-34 0 324 256" style={{ width: "100%", maxWidth: 320 }} role="img" aria-label="Biểu đồ đánh giá 360">
      {vong.map((v) => (
        <polygon key={v} points={TRU.map((_, i) => diem(i, v).join(",")).join(" ")} fill="none" stroke="var(--vien)" strokeWidth="1" />
      ))}
      {TRU.map(([k], i) => {
        const [x, y] = diem(i, 1);
        return <line key={k} x1={C} y1={C} x2={x} y2={y} stroke="var(--vien)" />;
      })}
      <polygon points={da.map((p) => p.join(",")).join(" ")} fill="var(--tim-nhat)" fillOpacity="0.28" stroke="var(--tim-nhat)" strokeWidth="2" />
      {da.map((p, i) => (d360[TRU[i][0]] == null ? null : <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="var(--tim-nhat)" />))}
      {TRU.map(([k, ten], i) => {
        const [x, y] = diem(i, 1.2);
        return (
          <text key={k} x={x} y={y + 3} textAnchor={Math.abs(x - C) < 6 ? "middle" : x > C ? "start" : "end"} fontSize="10.5" fill="var(--chu)" style={sans}>
            {ten.replace("Sức khoẻ tài chính", "Sức khoẻ TC")}
          </text>
        );
      })}
    </svg>
  );
}

function Dong({ ten, children, mau }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 border-b text-sm" style={{ borderColor: "var(--vien-nhe)" }}>
      <span style={{ color: MUTED }}>{ten}</span>
      <span style={{ color: mau, fontWeight: 600, textAlign: "right" }}>{children}</span>
    </div>
  );
}

export default function PhanTichCoBan({ du, ma }) {
  const cacQuy = Object.keys(du?.q ?? {}).sort();
  const [quy, datQuy] = useState(du?.quyMoi ?? cacQuy.at(-1));
  if (!du || !cacQuy.length) return null;
  const x = du.q[quy] ?? du.q[cacQuy.at(-1)];
  const pi = du.loai === "pi";
  const dg = du.dinhGia;
  const d = du.d360;
  const ngayCap = du.capNhat ? new Date(du.capNhat).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "";
  return (
    <section className="rounded-2xl border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD, color: "var(--chu)" }} aria-label={`Phân tích cơ bản ${ma}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-lg" style={{ ...sans, fontWeight: 700 }} data-may="ptcb-tong">
          Phân tích cơ bản {ma}
        </h2>
        <span className="text-xs" style={{ color: MUTED }}>
          Báo cáo hợp nhất theo quý (VNDirect){ngayCap ? ` · cập nhật ${ngayCap}` : ""} · ngành {du.nhanNganh}
        </span>
      </div>

      {/* 360 + dinh gia */}
      <div className="grid gap-5 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] items-center my-4">
        <div className="mx-auto w-full flex flex-col items-center" data-may="ptcb-360">
          <Radar d360={d} />
          <div className="text-center -mt-2">
            <div className="text-2xl" style={{ ...sans, fontWeight: 800, color: mauXepLoai[d.xepLoai] ?? MUTED }}>
              {d.xepLoai ?? "—"}
            </div>
            <div className="text-xs" style={{ color: MUTED }}>
              Đánh giá 360 · {f(d.tong)}/10
            </div>
          </div>
        </div>
        <div>
          {TRU.map(([k, ten, giaiThich]) => (
            <div key={k} className="mb-2.5" title={giaiThich}>
              <div className="flex items-baseline justify-between text-sm">
                <span>{ten}</span>
                <b style={{ color: mauDiem(d[k]) }}>{d[k] == null ? "không áp dụng" : `${f(d[k])}/10`}</b>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ background: VIEN }}>
                <div style={{ width: `${(d[k] ?? 0) * 10}%`, height: "100%", background: mauDiem(d[k]) === MUTED ? VIEN : mauDiem(d[k]) }} />
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{giaiThich}</p>
            </div>
          ))}
          <p className="text-[11px]" style={{ color: MUTED }}>
            Điểm là thứ hạng so với {pi ? "các doanh nghiệp phi tài chính" : "ngân hàng, chứng khoán, bảo hiểm"} khác trên sàn (10 = tốt nhất nhóm), không phải ngưỡng tuyệt đối.
          </p>
        </div>
      </div>

      <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2 mb-4" data-may="ptcb-dinh-gia">
        <div>
          <Dong ten="Vốn hoá">{dg.vonHoa == null ? "—" : `${soVN(dg.vonHoa, 0)} tỷ`}</Dong>
          <Dong ten={`P/E (4 quý)${dg.peNganh ? ` · trung vị ngành ${f(dg.peNganh)}` : ""}`} mau={dg.pe && dg.peNganh ? (dg.pe <= dg.peNganh ? XANH : DO) : undefined}>
            {dg.pe == null ? "lỗ / không có" : f(dg.pe)}
          </Dong>
          <Dong ten={`P/B${dg.pbNganh ? ` · trung vị ngành ${f(dg.pbNganh)}` : ""}`} mau={dg.pb && dg.pbNganh ? (dg.pb <= dg.pbNganh ? XANH : DO) : undefined}>
            {dg.pb == null ? "—" : f(dg.pb)}
          </Dong>
        </div>
        <div>
          {pi && <Dong ten="Tỷ suất cổ tức tiền mặt (4 quý)">{dg.tyLeCoTuc == null ? "—" : `${f(dg.tyLeCoTuc)}%`}</Dong>}
          <Dong ten="Lợi nhuận 4 quý so với cùng kỳ" mau={mauTang(x.lnTTMYoY)}>{pc(x.lnTTMYoY)}</Dong>
          <Dong ten="Doanh thu 4 quý so với cùng kỳ" mau={mauTang(x.dtTTMYoY)}>{pc(x.dtTTMYoY)}</Dong>
        </div>
      </div>

      {/* theo quy */}
      <h3 className="text-sm mb-2" style={{ ...sans, fontWeight: 700 }}>
        Từng quý 2026 — {pi ? "điểm Z″, F, DuPont" : "DuPont và điểm sinh lời"}
      </h3>
      <div className="overflow-x-auto mb-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-right" style={{ color: MUTED }}>
              <th className="py-1.5 pr-3 font-normal text-left">Chỉ tiêu (4 quý gần nhất)</th>
              {cacQuy.map((q) => (
                <th key={q} className="py-1.5 px-2 font-normal">
                  <button type="button" onClick={() => datQuy(q)} className="px-2 py-0.5 rounded-full border" style={{ borderColor: q === quy ? "var(--tim-nhat)" : VIEN, color: q === quy ? "var(--chu)" : MUTED, background: q === quy ? "var(--vien-nhe)" : "transparent" }}>
                    {tenQuy(q)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              pi && ["Điểm Z″ (Altman)", (q) => `${f(q.z2)} · ${q.vungZ2}`, (q) => mauVung(q.vungZ2), "ptcb-z"],
              pi && ["Điểm F (Piotroski, 0–9)", (q) => `${q.f}/9`, (q) => (q.f >= 7 ? XANH : q.f <= 3 ? DO : VANG), "ptcb-f"],
              !pi && ["Điểm sinh lời (0–5)", (q) => `${q.sinhLoi}/5`, (q) => (q.sinhLoi >= 4 ? XANH : q.sinhLoi <= 2 ? DO : VANG)],
              ["ROE", (q) => `${f(q.roe)}%`, () => "var(--chu)", "ptcb-dupont"],
              ["  = Biên lợi nhuận ròng", (q) => `${f(q.bienLN)}%`],
              ["  × Vòng quay tài sản", (q) => f(q.vongQuay, 2)],
              ["  × Đòn bẩy vốn", (q) => f(q.donBay, 2)],
              ["Lợi nhuận quý (tỷ)", (q) => (q.lnQuy == null ? "—" : soVN(q.lnQuy, 0)), () => "var(--chu)"],
              ["Lợi nhuận quý so với cùng kỳ", (q) => pc(q.lnQuyYoY), (q) => mauTang(q.lnQuyYoY)],
              ["Doanh thu quý so với cùng kỳ", (q) => pc(q.dtQuyYoY), (q) => mauTang(q.dtQuyYoY)],
            ]
              .filter(Boolean)
              .map(([ten, gt, mau, may]) => (
                <tr key={ten} className="border-t" style={{ borderColor: "var(--vien-nhe)" }}>
                  <td className="py-1.5 pr-3" style={{ color: ten.startsWith("  ") ? MUTED : undefined, whiteSpace: "pre" }} data-may={may}>
                    {ten}
                  </td>
                  {cacQuy.map((k) => (
                    <td key={k} className="py-1.5 px-2 text-right" style={{ color: mau ? mau(du.q[k]) : MUTED, fontWeight: mau ? 600 : 400 }}>
                      {gt(du.q[k])}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border p-3 text-sm" style={{ borderColor: VIEN, background: "var(--vien-nhe)" }}>
        <div className="mb-2" style={{ fontWeight: 700, ...sans }}>
          Chi tiết {tenQuy(quy)}
        </div>
        <p className="mb-1.5">
          <b>DuPont:</b> ROE {f(x.roe)}% (cùng kỳ năm trước {f(x.roe0)}%){x.chuDao ? <> — thay đổi chủ yếu do <b>{x.chuDao}</b></> : ""}.
          {pi && (
            <span style={{ color: MUTED }}>
              {" "}
              5 bước: gánh nặng thuế {f(x.gachThue, 2)} × gánh nặng lãi vay {f(x.gachLai, 2)} × biên EBIT {f(x.bienEBIT)}% × vòng quay {f(x.vongQuay, 2)} × đòn bẩy {f(x.donBay, 2)}.
            </span>
          )}
        </p>
        {pi && x.fChiTiet && (
          <>
            <p className="mb-1" style={{ color: MUTED }}>
              Z″ = 6,56·X1 + 3,26·X2 + 6,72·X3 + 1,05·X4 + 3,25 với X1 vốn lưu động/TS = {f(x.x.x1, 2)}, X2 lợi nhuận giữ lại/TS = {f(x.x.x2, 2)}, X3 EBIT/TS = {f(x.x.x3, 2)}, X4 vốn chủ/nợ = {f(x.x.x4, 2)}. Trên 5,85 an toàn · 4,15–5,85 vùng xám · dưới 4,15 nguy cơ.
            </p>
            <p className="mb-1.5" style={{ color: MUTED }}>
              Dòng tiền kinh doanh / lợi nhuận: {x.cfoLNST == null ? "—" : `${f(x.cfoLNST, 2)}×`}
            </p>
            <div className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-3">
              {x.fChiTiet.map((c, i) => (
                <span key={i} className="text-[13px]" style={{ color: c === true ? XANH : c === false ? DO : MUTED }}>
                  {c === true ? "✓" : c === false ? "✗" : "?"} {TIEU_CHI_F[i]}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
      <p className="text-[11px] mt-3" style={{ color: MUTED }}>
        Số liệu tính trên 4 quý gần nhất, so với cùng kỳ năm trước; Z và F chỉ có nghĩa với doanh nghiệp phi tài chính. Mã tái cơ cấu / thoái vốn công ty con có thể cho điểm nhiễu. Đây là công cụ tham khảo, không phải khuyến nghị đầu tư.
      </p>
    </section>
  );
}
