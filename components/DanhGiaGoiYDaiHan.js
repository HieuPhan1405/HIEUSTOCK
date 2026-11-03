"use client";

import Link from "next/link";
import { NotebookPen } from "lucide-react";
import { DAI_HAN_GOI_Y } from "@/lib/goiYDaiHan";
import { nhanDinhGia } from "@/lib/phuongPhapDaiHan";
import { fmt } from "@/components/dungChung";
import { Khoi, VIEN, NEN_CARD, TEXT, MUTED, XANH, DO, VANG, sans, soVN, p1, tien } from "@/components/DanhGiaChung";

const MAU_DINH_GIA = { xanh: XANH, chu: TEXT, vang: VANG, do: DO, mo: MUTED };

// GOI Y MUA THEO PHONG CACH DAI HAN: danh sach doanh nghiep tu trang /dai-han (BCTC), khong dung tin hieu MUA / BAN. goiY = goiYDaiHan (lib/goiYDaiHan.js) theo danh muc khach.
export default function DanhGiaGoiYDaiHan({ goiY, onGhiNhatKy }) {
  const phu = `Doanh nghiệp được chọn theo tiêu chí Buffett, Cổ tức, Graham và Ít biến động (trang Đầu tư dài hạn), chỉ gợi ý khi giá không quá ${Math.round((DAI_HAN_GOI_Y.nguongDat - 1) * 100)}% trên giá trị hợp lý. Không dùng tín hiệu mua bán ngắn hạn.`;
  if (!goiY) return <Khoi tieuDe="Mã gợi ý mua dài hạn" phu={phu}><p className="text-sm" style={{ color: MUTED }}>Chưa có dữ liệu danh sách dài hạn.</p></Khoi>;
  const mua = goiY.mua;
  return (
    <Khoi tieuDe="Mã gợi ý mua dài hạn" phu={phu}>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm mb-3" style={sans}>
        <span>
          Danh mục: <b>{goiY.soMaHienCo}</b> mã → còn <b>{goiY.conCho}</b> chỗ (mục tiêu tối đa {DAI_HAN_GOI_Y.soMaMucTieu} mã)
          {goiY.moiMa ? <> · mỗi mã ~<b>{tien(goiY.moiMa)}</b>, chia 5 đợt</> : null}
        </span>
      </div>
      {goiY.ghiChu.length > 0 && (
        <ul className="mb-3 grid gap-1 text-xs" style={{ color: VANG }}>
          {goiY.ghiChu.map((g, i) => <li key={i}>• {g}</li>)}
        </ul>
      )}
      {mua.length === 0 ? (
        <p className="text-sm mb-2" style={{ ...sans, fontWeight: 600 }}>Hiện chưa có doanh nghiệp nào trong danh sách dài hạn (ngoài các mã đang cầm) có giá trong vùng hợp lý. Kế hoạch: giữ tiền mặt, chờ giá về vùng giải ngân bên dưới.</p>
      ) : (
        <div className="rounded-xl border overflow-hidden mb-3" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <div className="overflow-x-auto bang-cuon">
            <table className="w-full text-sm" style={sans}>
              <thead>
                <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED }}>
                  {["Mã", "Chọn bởi", "Giá", "Giá hợp lý", "Định giá", "Đợt 1 (mua ngay)", "Đợt 2 · SMA50", "Đợt 3 · −10%", "Số lượng đợt 1", ""].map((t, i) => (
                    <th key={i} className={`py-2.5 px-3 font-normal whitespace-nowrap ${i >= 2 && i <= 8 ? "text-right" : ""}`}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mua.map((x, i) => {
                  const dg = nhanDinhGia(x.r);
                  return (
                    <tr key={x.ma} className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--vien-nhe)", opacity: x.trongCho ? 1 : 0.6 }}>
                      <td className="py-2 px-3 font-bold">
                        <Link href={`/ma/${x.ma}`} className="hover:underline">{x.ma}</Link>
                        <div className="text-[11px] font-normal" style={{ color: MUTED }}>{x.nganh}</div>
                        {x.trungNganh && <div className="text-[11px] font-normal" style={{ color: VANG }}>trùng ngành {x.trungNganh.join(", ")}</div>}
                      </td>
                      <td className="py-2 px-3 text-xs">{x.phuongPhap.map((p) => p.ten).join(", ")}</td>
                      <td className="py-2 px-3 text-right">{fmt(x.gia)}</td>
                      <td className="py-2 px-3 text-right">{fmt(x.giaHopLy)}</td>
                      <td className="py-2 px-3 text-right whitespace-nowrap" style={{ color: MAU_DINH_GIA[dg.mau] }}>{dg.nhan} <span className="text-xs" style={{ color: MUTED }}>({p1(x.r * 100)}%)</span></td>
                      <td className="py-2 px-3 text-right">{fmt(x.lich.dot[0]?.gia)}</td>
                      <td className="py-2 px-3 text-right">{fmt(x.lich.dot[1]?.gia)}</td>
                      <td className="py-2 px-3 text-right">{fmt(x.lich.dot[2]?.gia)}</td>
                      <td className="py-2 px-3 text-right" style={{ fontWeight: 700 }}>{x.trongCho ? (x.kl ? `${soVN(x.kl)} cp · ${tien(x.tien)}` : "—") : "ngoài số chỗ"}</td>
                      <td className="py-2 px-3">
                        {x.kl > 0 && onGhiNhatKy && (
                          <button type="button" onClick={() => onGhiNhatKy({ ma: x.ma, loai: "mua", kl: x.kl, gia: Math.round(x.giaMua * 100) / 100 })} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border font-semibold whitespace-nowrap" style={{ borderColor: VIEN, color: TEXT }} title="Đã mua đợt 1: ghi vào nhật ký và thêm vào danh mục">
                            <NotebookPen size={11} /> Đã mua
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] px-3 py-2 border-t" style={{ borderColor: "var(--vien-nhe)", color: MUTED }}>
            Thứ tự: mã khác ngành với danh mục trước; mã “rất rẻ — kiểm tra” (giá dưới nửa giá trị hợp lý, thường do lợi nhuận bất thường) xếp sau; rồi mã được nhiều phương pháp cùng chọn, rồi mã rẻ hơn so với giá trị hợp lý. Đây không phải xếp hạng đã kiểm chứng.{goiY.soMaDat > mua.length ? ` Còn ${goiY.soMaDat - mua.length} mã khác cũng trong vùng hợp lý, xem ở trang Đầu tư dài hạn.` : ""} Chia vốn thành 5 đợt theo vùng giá (đợt 4: về SMA200 hoặc −15%, đợt 5: −20%); chờ giá không tăng lợi nhuận nhưng giúp giá vốn đều hơn. Không cắt lỗ theo giá — lý do bán là doanh nghiệp xấu đi (xem trang Đầu tư dài hạn).
          </p>
        </div>
      )}

      {goiY.cho.length > 0 && (
        <details className="mb-3 text-xs">
          <summary className="cursor-pointer select-none" style={{ ...sans, fontWeight: 700 }}>Doanh nghiệp tốt nhưng giá đang đắt, chờ giá về ({goiY.cho.length})</summary>
          <div className="overflow-x-auto bang-cuon mt-1.5">
            <table className="w-full" style={sans}>
              <thead>
                <tr className="text-left" style={{ color: MUTED }}>
                  {["Mã", "Chọn bởi", "Giá", "Giá hợp lý", "Chờ giá về", "Cần giảm"].map((t, i) => (
                    <th key={t} className={`py-1.5 px-3 font-normal whitespace-nowrap ${i >= 2 ? "text-right" : ""}`}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {goiY.cho.map((x) => (
                  <tr key={x.ma} className="border-t" style={{ borderColor: "var(--vien-nhe)" }}>
                    <td className="py-1.5 px-3 font-bold"><Link href={`/ma/${x.ma}`} className="hover:underline">{x.ma}</Link></td>
                    <td className="py-1.5 px-3">{x.phuongPhap.map((p) => p.ten).join(", ")}</td>
                    <td className="py-1.5 px-3 text-right">{fmt(x.gia)}</td>
                    <td className="py-1.5 px-3 text-right">{fmt(x.giaHopLy)}</td>
                    <td className="py-1.5 px-3 text-right">≤ {fmt(x.giaCan)}</td>
                    <td className="py-1.5 px-3 text-right">{p1(Math.abs(x.canGiam))}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <details className="mt-4 text-[11px]" style={{ color: MUTED }}>
        <summary className="cursor-pointer select-none" style={{ fontWeight: 700 }}>Kiểm chứng và giới hạn</summary>
        <div className="mt-1.5 grid gap-1 leading-relaxed">
          <p>Các danh sách Buffett, Cổ tức, Graham, Ít biến động đã được kiểm tra trên dữ liệu 2022–2026 (kết quả ở trang Đầu tư dài hạn): lợi thế chủ yếu đến từ nhóm ngân hàng, và các danh sách thiên về phòng thủ, không phải cách tăng lợi nhuận mạnh.</p>
          <p>Giá trị hợp lý là trung vị 4 cách định giá, chỉ để tham khảo. Rủi ro pháp lý hay tin xấu không tự phát hiện được — mã đang bị gắn cờ rủi ro đã bị loại khỏi danh sách. Số mã mục tiêu ({DAI_HAN_GOI_Y.soMaMucTieu}) và tỷ trọng tối đa ({Math.round(DAI_HAN_GOI_Y.tranTyTrong * 100)}%/mã) do web tự đặt, chưa backtest. Chỉ để tham khảo, không phải khuyến nghị đầu tư.</p>
        </div>
      </details>
    </Khoi>
  );
}
