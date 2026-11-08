"use client";

import Link from "next/link";
import { Lock, NotebookPen } from "lucide-react";
import { DIEU_KIEN } from "@/lib/goiYMua";
import { fmt } from "@/components/dungChung";
import TaiKhoanNut from "@/components/TaiKhoanNut";
import { Khoi, VIEN, NEN_CARD, TEXT, MUTED, PRIMARY, XANH, DO, VANG, sans, soVN, p1, dau, tien } from "@/components/DanhGiaChung";

const dk = DIEU_KIEN;
const ngayGio = (v) => (v ? new Date(v).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "");

// Ket qua kiem chung bo dieu kien (tom tat tu engine/dich-vu/nghienCuuDieuKienMua.mjs)
function KiemChung() {
  return (
    <details className="mt-4 text-[11px]" style={{ color: MUTED }}>
      <summary className="cursor-pointer select-none" style={{ fontWeight: 700 }}>Kiểm chứng bộ điều kiện này (2014–10/2026)</summary>
      <div className="mt-1.5 grid gap-1 leading-relaxed">
        <p>Danh mục tối đa 6 mã, chia đều, vào ở giá mốc +0,6% (giá thật lúc tín hiệu hiện trên web), cắt lỗ ≤ 6%, chốt 30% TP1 + 30% TP2, phần còn lại giữ tới khi hệ thống báo BÁN, đã tính phí. Tích lũy ×3,61 so với VN-Index ×3,45 (gần ngang về lãi).</p>
        <p>Theo năm: 2022 −7,7% (VN-Index −32,8%), 2021 +63,3% (+35,7%), 2024 +21,4% (+12,1%), 2025 +27,7% (+40,9%), 2017 +17,3% (+48,0%), 2018 −22,8% (−9,3%). Mạnh ở năm thị trường xấu, thua ở năm tăng mạnh; 2018 là năm kém nhất.</p>
        <p>Ngưỡng được chọn sau khi xem dữ liệu đến 2023 — chỉ 2024–2026 là kiểm tra thật. Các tiêu chí mua đuổi (tăng mạnh 20 phiên, RSI cao, xa SMA50) cho kết quả kém hơn, nên bị loại. Chỉ để tham khảo, không phải khuyến nghị đầu tư.</p>
      </div>
    </details>
  );
}

// MA GOI Y MUA (trang Danh gia danh muc): du = ket qua /api/goi-y-mua, goiY = goiYTheoDanhMuc (lib/goiYMua.js) theo danh muc khach.
export default function DanhGiaGoiYMua({ du, dangTai, loi, goiY, laThanhVien, phongCach, onGhiNhatKy }) {
  const vni20 = du?.vni20;
  const thiTruongDat = vni20 != null && vni20 <= dk.vni20ToiDa;
  const phu = `Bộ điều kiện đã kiểm chứng: hệ thống báo MUA, giá còn trong vùng mua (≤ mốc +${dk.vungMuaPct}%), giá không cao hơn SMA50 quá ${dk.sma50ToiDa}%, RSI14 ≤ ${dk.rsiToiDa} và VN-Index 20 phiên tăng ≤ ${dk.vni20ToiDa}% (chỉ báo lấy ở phiên trước tín hiệu). Tối đa ${dk.soMaToiDa} mã, mỗi mã 1/${dk.soMaToiDa} tài sản, cắt lỗ ≤ ${dk.catLoToiDaPct}%.`;
  if (dangTai && !du) return <Khoi tieuDe="Mã gợi ý mua" phu={phu}><p className="text-sm" style={{ color: MUTED }}>Đang lọc mã theo bộ điều kiện…</p></Khoi>;
  if (loi) return <Khoi tieuDe="Mã gợi ý mua" phu={phu}><p className="text-sm" style={{ color: DO }}>Chưa tải được: {loi}</p></Khoi>;
  if (!du) return null;

  if (!laThanhVien || du.khoa) {
    return (
      <Khoi tieuDe="Mã gợi ý mua" phu={phu}>
        <div className="rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: PRIMARY, background: "color-mix(in srgb, #8B5CF6 10%, var(--card))" }}>
          <div className="max-w-xl text-sm" style={sans}>
            <p style={{ fontWeight: 800 }} className="mb-1">
              <Lock size={14} className="inline -mt-0.5 mr-1" />
              Hôm nay: {du.soDat ?? 0} mã đạt đủ điều kiện, {du.soCho ?? 0} mã đang chờ điểm mua
            </p>
            <p style={{ color: MUTED }}>Thành viên (miễn phí) xem từng mã, vùng mua, mức cắt lỗ và số lượng nên mua tính theo chính danh mục và tiền mặt của bạn (bỏ mã đã cầm, tránh trùng ngành, tối đa 6 mã).</p>
          </div>
          <TaiKhoanNut nhan="Đăng ký miễn phí" />
        </div>
        <KiemChung />
      </Khoi>
    );
  }

  const dat = goiY?.goiY ?? [];
  const chuaDat = (du.mua ?? []).filter((x) => !x.dat);
  const maGoiY = new Set(dat.map((x) => x.ma));
  const cho = (du.cho ?? []).filter((x) => !maGoiY.has(x.ma));
  return (
    <Khoi tieuDe="Mã gợi ý mua" phu={phu} phai={<span className="text-[11px]" style={{ color: MUTED }}>Tín hiệu {ngayGio(du.capNhat)}</span>}>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm mb-3" style={sans}>
        <span>
          VN-Index 20 phiên: <b>{dau(vni20)}</b>{" "}
          <span style={{ color: thiTruongDat ? XANH : DO, fontWeight: 700 }}>{vni20 == null ? "" : thiTruongDat ? "· đạt" : "· thị trường đã tăng nóng, không mua mới"}</span>
        </span>
        {goiY && (
          <span>
            Danh mục: <b>{goiY.soMaHienCo}</b> mã → còn <b>{goiY.conCho}</b> chỗ{goiY.moiMa ? <> · mỗi mã ~<b>{tien(goiY.moiMa)}</b> (1/{dk.soMaToiDa} tài sản)</> : null}
          </span>
        )}
      </div>
      {goiY?.ghiChu?.length > 0 && (
        <ul className="mb-3 grid gap-1 text-xs" style={{ color: VANG }}>
          {goiY.ghiChu.map((g, i) => <li key={i}>• {g}</li>)}
        </ul>
      )}
      {phongCach === "dai_han" && (
        <p className="text-xs mb-3" style={{ color: MUTED }}>Bộ điều kiện dựa trên tín hiệu kỹ thuật đã kiểm chứng. Với phong cách dài hạn, nên xem thêm BCTC của mã (trang mã → Cơ bản) và danh sách ở trang Dài hạn trước khi mua.</p>
      )}

      {dat.length === 0 ? (
        <p className="text-sm mb-2" style={{ ...sans, fontWeight: 600 }}>
          {(du.mua ?? []).length === 0 ? "Hôm nay hệ thống chưa có tín hiệu MUA mới." : "Hôm nay không có mã nào (ngoài các mã đang cầm) đạt đủ điều kiện."} Kế hoạch: giữ tiền mặt, chờ điểm mua — không mua đuổi.
        </p>
      ) : (
        <div className="rounded-xl border overflow-hidden mb-3" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <div className="overflow-x-auto bang-cuon">
            <table className="w-full text-sm" style={sans}>
              <thead>
                <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED }}>
                  {["Mã", "Ngành", "Giá", "Vùng mua", "Cắt lỗ", "TP1", "RSI14", "So SMA50", "Số lượng", "Tiền", "Nếu cắt lỗ", ""].map((t, i) => (
                    <th key={i} className={`py-2.5 px-3 font-normal whitespace-nowrap ${i >= 2 && i <= 10 ? "text-right" : ""}`}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dat.map((x, i) => (
                  <tr key={x.ma} className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--vien-nhe)", opacity: x.trongCho ? 1 : 0.6 }}>
                    <td className="py-2 px-3 font-bold"><Link href={`/ma/${x.ma}`} className="hover:underline">{x.ma}</Link></td>
                    <td className="py-2 px-3 text-xs">
                      {x.nganh}
                      {x.trungNganh && <div style={{ color: VANG }}>trùng ngành {x.trungNganh.join(", ")}</div>}
                    </td>
                    <td className="py-2 px-3 text-right">{fmt(x.gia)}</td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">{fmt(x.moc)}–{fmt(x.moc * (1 + dk.vungMuaPct / 100))}</td>
                    <td className="py-2 px-3 text-right whitespace-nowrap" style={{ color: DO }}>{fmt(x.catLo)} <span className="text-xs">(−{p1(x.catLoPct)}%)</span></td>
                    <td className="py-2 px-3 text-right">{x.tp1 ? fmt(x.tp1) : "—"}</td>
                    <td className="py-2 px-3 text-right">{p1(x.rsi14)}</td>
                    <td className="py-2 px-3 text-right">{dau(x.sma50Pct)}</td>
                    <td className="py-2 px-3 text-right" style={{ fontWeight: 700 }}>{x.trongCho ? (x.kl ? soVN(x.kl) : "—") : "ngoài số chỗ"}</td>
                    <td className="py-2 px-3 text-right">{x.kl ? tien(x.tien) : "—"}</td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">{x.kl ? <>−{tien(x.ruiRo)}{x.ruiRoPctNav != null ? <span className="text-xs" style={{ color: MUTED }}> ({p1(x.ruiRoPctNav)}% TS)</span> : null}</> : "—"}</td>
                    <td className="py-2 px-3">
                      {x.kl > 0 && onGhiNhatKy && (
                        <button type="button" onClick={() => onGhiNhatKy({ ma: x.ma, loai: "mua", kl: x.kl, gia: Math.round(x.giaVao * 100) / 100 })} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border font-semibold whitespace-nowrap" style={{ borderColor: VIEN, color: TEXT }} title="Đã mua: ghi vào nhật ký và thêm vào danh mục">
                          <NotebookPen size={11} /> Đã mua
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] px-3 py-2 border-t" style={{ borderColor: "var(--vien-nhe)", color: MUTED }}>
            Mua trong vùng mua, không đuổi khi giá đã vượt mốc +{dk.vungMuaPct}%. Thứ tự: mã khác ngành với danh mục trước, rồi mã gần mốc hơn — không phải xếp hạng chất lượng (kiểm chứng cho thấy chưa có tiêu chí xếp hạng nào đáng tin). Chốt 30% ở TP1, 30% ở TP2, phần còn lại giữ tới khi hệ thống báo BÁN.
          </p>
        </div>
      )}

      {chuaDat.length > 0 && (
        <details className="mb-3 text-xs">
          <summary className="cursor-pointer select-none" style={{ ...sans, fontWeight: 700 }}>Mã báo MUA nhưng chưa đạt điều kiện ({chuaDat.length})</summary>
          <ul className="mt-1.5 grid gap-1" style={{ color: MUTED }}>
            {chuaDat.map((x) => (
              <li key={x.ma}>
                <b style={{ color: TEXT }}>{x.ma}</b>: {x.cac.filter((c) => !c.dat).map((c) => `${c.ten}${c.giaTri != null ? ` (hiện ${p1(c.giaTri)})` : ""}`).join("; ")}
              </li>
            ))}
          </ul>
        </details>
      )}

      {cho.length > 0 && (
        <>
          <h3 className="text-sm mt-2 mb-1.5" style={{ ...sans, fontWeight: 700 }}>Đang chờ điểm mua ({cho.length})</h3>
          <p className="text-xs mb-2" style={{ color: MUTED }}>Chưa có tín hiệu, nhưng kịch bản cho thấy nếu đóng cửa trong vùng dưới đây hệ thống sẽ báo MUA, và mã đang đạt các điều kiện còn lại. Chỉ mua khi hệ thống thật sự báo MUA.</p>
          <div className="overflow-x-auto bang-cuon">
            <table className="w-full text-sm" style={sans}>
              <thead>
                <tr className="text-left" style={{ color: MUTED }}>
                  {["Mã", "Ngành", "Giá", "Ra MUA nếu đóng cửa", "Cần tăng", "RSI14", "So SMA50"].map((t, i) => (
                    <th key={t} className={`py-1.5 px-3 font-normal whitespace-nowrap ${i >= 2 ? "text-right" : ""}`}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cho.map((x) => (
                  <tr key={x.ma} className="border-t" style={{ borderColor: "var(--vien-nhe)" }}>
                    <td className="py-1.5 px-3 font-bold"><Link href={`/ma/${x.ma}`} className="hover:underline">{x.ma}</Link></td>
                    <td className="py-1.5 px-3 text-xs">{x.nganh}</td>
                    <td className="py-1.5 px-3 text-right">{fmt(x.gia)}</td>
                    <td className="py-1.5 px-3 text-right whitespace-nowrap">{fmt(x.muaTu)}–{fmt(x.muaDen)}</td>
                    <td className="py-1.5 px-3 text-right">{dau(x.khoangCach)}</td>
                    <td className="py-1.5 px-3 text-right">{p1(x.rsi14)}</td>
                    <td className="py-1.5 px-3 text-right">{dau(x.sma50Pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <KiemChung />
    </Khoi>
  );
}
