"use client";

import { useEffect, useMemo, useState } from "react";
import { MUA_VU } from "@/lib/muaVuDuLieu";
import { Khoi, TEXT, MUTED, VIEN, PRIMARY, XANH, DO, VANG, sans } from "@/components/DanhGiaChung";

const THANG = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
const p1 = (x) => (x == null ? "" : x.toFixed(1).replace(".", ","));
// mau o: xanh = tang, do = giam; dam theo do lon (chan o |v| = tran) - luon kem chu so, khong dua vao mau
const nen = (v, tran = 12) => (v == null ? "transparent" : `color-mix(in srgb, ${v >= 0 ? XANH : DO} ${Math.round(Math.min(1, Math.abs(v) / tran) ** 0.75 * 70)}%, var(--card))`);
const tbMang = (bang, loc = () => true) =>
  Array.from({ length: 12 }, (_, m) => {
    const a = Object.entries(bang).filter(([y]) => loc(y)).map(([, v]) => v[m]).filter((x) => x != null);
    return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  });
const demDuong = (bang, m) => {
  const a = Object.values(bang).map((v) => v[m]).filter((x) => x != null);
  return { duong: a.filter((x) => x > 0).length, n: a.length };
};
function docOnDinh(r) {
  if (r == null) return { nhan: "chưa đủ dữ liệu", mau: MUTED };
  if (r >= 0.5) return { nhan: "khá ổn định giữa hai giai đoạn (nhưng 22 ngành thử, một vài ngành có thể ngẫu nhiên)", mau: VANG };
  if (r >= 0.2) return { nhan: "ổn định yếu", mau: VANG };
  return { nhan: "không ổn định — tháng đẹp của giai đoạn đầu không lặp lại ở giai đoạn sau", mau: DO };
}

// BANG NHIET MUA VU (loi suat thang x nam): VN-Index + tung nganh. nganhDanhMuc = [{ ten, tyTrong }] de danh dau nganh dang cam.
export default function BangNhietMuaVu({ nganhDanhMuc = [] }) {
  const [chon, setChon] = useState("VN-Index");
  const bang = chon === "VN-Index" ? MUA_VU.vni : MUA_VU.nganh[chon];
  const cuaToi = useMemo(() => new Map(nganhDanhMuc.filter((g) => g.ten !== "Khác").map((g) => [g.ten, g.tyTrong])), [nganhDanhMuc]);
  const [thangNay, datThangNay] = useState(-1); // thang hien tai (gio VN) - doc sau khi hien o may nguoi dung de khong lech voi may chu
  useEffect(() => {
    const t = setTimeout(() => datThangNay(new Date(Date.now() + 7 * 3600e3).getUTCMonth()), 0);
    return () => clearTimeout(t);
  }, []);
  const tb = tbMang(bang);
  const ds = tbMang(bang, (y) => y <= "2019");
  const ds2 = tbMang(bang, (y) => y >= "2020");
  const dsNganh = Object.keys(MUA_VU.nganh);
  const namSapXep = Object.keys(bang).sort();
  const od = docOnDinh(MUA_VU.onDinh[chon]);
  const cungDau = tb.map((_, m) => ds[m] != null && ds2[m] != null && Math.sign(ds[m]) === Math.sign(ds2[m])).filter(Boolean).length;
  const o = "text-center py-1 rounded-[3px] text-[11px] tabular-nums";
  const ghiChuCuoi = MUA_VU.thangCuoiChuaDu ? ` Tháng ${+MUA_VU.thangCuoi.slice(5)}/${MUA_VU.thangCuoi.slice(0, 4)} mới tính đến ${MUA_VU.capNhat.split("-").reverse().join("/")}.` : "";

  return (
    <Khoi
      tieuDe="Mùa vụ: lợi suất theo tháng"
      phu={`Lợi suất từng tháng của ${chon === "VN-Index" ? "VN-Index (chỉ số giá)" : `ngành ${chon} (trung bình cộng các mã trong ngành, ${MUA_VU.soMa[chon]} mã đang niêm yết)`} từ 2013. Xanh là tháng tăng, đỏ là tháng giảm; khung tím là tháng hiện tại.${ghiChuCuoi}`}
      phai={
        <label className="text-xs inline-flex items-center gap-2" style={{ color: MUTED, ...sans }}>
          Xem
          <select value={chon} onChange={(e) => setChon(e.target.value)} className="px-2 py-1 rounded-lg text-sm border" style={{ borderColor: VIEN, background: "var(--card)", color: TEXT, fontWeight: 700 }}>
            <option value="VN-Index">VN-Index</option>
            {dsNganh.map((g) => (
              <option key={g} value={g}>
                {g}
                {cuaToi.has(g) ? " (đang cầm)" : ""}
              </option>
            ))}
          </select>
        </label>
      }
    >
      <div className="overflow-x-auto bang-cuon">
        <div className="min-w-[560px]" role="table" aria-label={`Bảng nhiệt lợi suất tháng ${chon}`} style={sans}>
          <div className="grid gap-[2px] mb-[2px]" style={{ gridTemplateColumns: "38px repeat(12, minmax(0, 1fr)) 46px", color: MUTED }} role="row">
            <span />
            {THANG.map((t, m) => (
              <span key={t} className="text-center text-[11px] rounded-[3px]" style={m === thangNay ? { outline: `1.5px solid ${PRIMARY}`, color: TEXT, fontWeight: 700 } : undefined}>
                {t}
              </span>
            ))}
            <span className="text-center text-[11px]">Cả năm</span>
          </div>
          {namSapXep.map((y) => (
            <div key={y} className="grid gap-[2px] mb-[2px]" style={{ gridTemplateColumns: "38px repeat(12, minmax(0, 1fr)) 46px" }} role="row">
              <span className="text-[11px] self-center" style={{ color: MUTED }}>{y}</span>
              {bang[y].slice(0, 12).map((v, m) => (
                <span key={m} className={o} style={{ background: nen(v), color: TEXT }} title={v == null ? `${y} T${m + 1}: chưa có` : `${y} T${m + 1}: ${v > 0 ? "+" : ""}${p1(v)}%`} role="cell">
                  {p1(v)}
                </span>
              ))}
              <span className={`${o} font-bold`} style={{ color: bang[y][12] == null ? MUTED : bang[y][12] >= 0 ? XANH : DO }} role="cell">
                {bang[y][12] == null ? "" : `${bang[y][12] > 0 ? "+" : ""}${p1(bang[y][12])}`}
              </span>
            </div>
          ))}
          <div className="grid gap-[2px] mt-1.5 pt-1.5 border-t" style={{ gridTemplateColumns: "38px repeat(12, minmax(0, 1fr)) 46px", borderColor: VIEN }} role="row">
            <span className="text-[11px] self-center font-bold">TB</span>
            {tb.map((v, m) => (
              <span key={m} className={`${o} font-bold`} style={{ background: nen(v, 5), color: TEXT }} role="cell">{p1(v)}</span>
            ))}
            <span />
          </div>
          <div className="grid gap-[2px] mt-[2px]" style={{ gridTemplateColumns: "38px repeat(12, minmax(0, 1fr)) 46px", color: MUTED }} role="row">
            <span className="text-[10px] self-center">% tăng</span>
            {tb.map((_, m) => {
              const d = demDuong(bang, m);
              return <span key={m} className="text-center text-[10px]" role="cell">{d.n ? `${d.duong}/${d.n}` : ""}</span>;
            })}
            <span />
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border p-3 text-xs" style={{ borderColor: VIEN, ...sans }}>
        <p className="mb-1">
          <b>Độ ổn định của mùa vụ {chon}:</b> tương quan giữa trung bình tháng 2013–2019 và 2020–2026 ={" "}
          <b style={{ color: od.mau }}>{MUA_VU.onDinh[chon] == null ? "—" : String(MUA_VU.onDinh[chon]).replace(".", ",")}</b> — <span style={{ color: od.mau }}>{od.nhan}</span>. Cùng dấu ở {cungDau}/12 tháng.
        </p>
        <p style={{ color: MUTED }}>
          Kiểm chứng của web trên VN-Index: chọn 6 tháng đẹp nhất của giai đoạn đầu rồi chỉ nằm trong 6 tháng đó, giai đoạn sau nhân vốn ×0,72, trong khi nằm cả năm ×1,81. Với từng mã, tháng vào lệnh cũng không dự đoán được lãi/lỗ. Vì vậy bảng này chỉ để tham khảo tâm lý
          (ví dụ tháng 4 và tháng 9–10 từng hay có cú giảm), không dùng làm điều kiện mua bán.
        </p>
      </div>

      <h3 className="text-sm mt-5 mb-1.5" style={{ ...sans, fontWeight: 700 }}>Trung bình theo ngành (bấm vào tên ngành để xem chi tiết)</h3>
      <div className="overflow-x-auto bang-cuon">
        <div className="min-w-[620px]" style={sans}>
          <div className="grid gap-[2px] mb-[2px]" style={{ gridTemplateColumns: "150px repeat(12, minmax(0, 1fr)) 44px", color: MUTED }}>
            <span />
            {THANG.map((t, m) => (
              <span key={t} className="text-center text-[11px] rounded-[3px]" style={m === thangNay ? { outline: `1.5px solid ${PRIMARY}`, color: TEXT, fontWeight: 700 } : undefined}>{t}</span>
            ))}
            <span className="text-center text-[11px]" title="Tương quan nửa đầu – nửa sau">Ổn định</span>
          </div>
          {[["VN-Index", MUA_VU.vni], ...dsNganh.map((g) => [g, MUA_VU.nganh[g]])].map(([g, b]) => {
            const t = tbMang(b);
            const dangCam = cuaToi.has(g);
            return (
              <div key={g} className="grid gap-[2px] mb-[2px]" style={{ gridTemplateColumns: "150px repeat(12, minmax(0, 1fr)) 44px" }}>
                <button type="button" onClick={() => setChon(g)} className="text-left text-[11px] truncate self-center pr-1" style={{ color: TEXT, fontWeight: g === chon || dangCam ? 700 : 400, textDecoration: g === chon ? "underline" : "none" }} title={dangCam ? `${g} — đang chiếm ${Math.round(cuaToi.get(g) * 100)}% danh mục` : g}>
                  {dangCam ? "● " : ""}
                  {g}
                </button>
                {t.map((v, m) => (
                  <span key={m} className={o} style={{ background: nen(v, 4), color: TEXT }} title={`${g} T${m + 1}: trung bình ${v > 0 ? "+" : ""}${p1(v)}%`}>{p1(v)}</span>
                ))}
                <span className="text-center text-[11px] self-center" style={{ color: MUA_VU.onDinh[g] >= 0.5 ? VANG : MUTED }}>{MUA_VU.onDinh[g] == null ? "" : String(MUA_VU.onDinh[g]).replace(".", ",")}</span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-[11px] mt-2" style={{ color: MUTED }}>
        ● = ngành đang có trong danh mục. Cột “Ổn định” là tương quan tháng giữa 2013–2019 và 2020–2026 (1 = mùa vụ lặp lại, 0 = ngẫu nhiên, âm = ngược lại); thử 22 ngành nên vài ngành có số cao chỉ do tình cờ. Lịch sử ngành chỉ gồm các mã đang niêm yết (bỏ sót mã đã hủy niêm yết) nên có
        thiên lệch người sống sót; mỗi tháng chỉ có 13–14 năm quan sát. Dữ liệu cập nhật bằng <code>node scripts/capNhatMuaVu.mjs</code>.
      </p>
    </Khoi>
  );
}
