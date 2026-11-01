"use client";

import Link from "next/link";
import { coTucVuotLoiNhuan } from "@/lib/coBanDanhMuc";
import { Khoi, The, VIEN, NEN_CARD, TEXT, MUTED, DO, VANG, sans, p1, p0, dau } from "@/components/DanhGiaChung";

const quyVN = (q) => (q ? `Q${{ "03": 1, "06": 2, "09": 3, 12: 4 }[q.slice(5, 7)] ?? "?"}/${q.slice(0, 4)}` : "—");
const mauZ = { "an toàn": TEXT, xám: VANG, "nguy cơ": DO };

// SUC KHOE DOANH NGHIEP cua danh muc (BCTC quy) - cong khai. kq = danhGiaToanBo, coBan = { MA: dong layBangCoBan }
export default function DanhGiaDoanhNghiep({ kq, coBan = {}, thiTruong = null }) {
  const dn = kq?.dn;
  if (!dn) return <p className="text-sm mb-6" style={{ color: MUTED }}>Đang tải BCTC của các mã…</p>;
  const tt = thiTruong ?? {};
  const ds = kq.hangMa.filter((h) => h.tyTrong > 0).sort((a, b) => b.tyTrong - a.tyTrong);
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <The nhan="P/E danh mục" phu={tt.pe ? `Trung vị thị trường ${p1(tt.pe)}` : "Gộp như 1 công ty"}>{dn.pe ? p1(dn.pe.v) : "—"}</The>
        <The nhan="P/B danh mục" phu={tt.pb ? `Thị trường ${p1(tt.pb)}` : undefined}>{dn.pb ? p1(dn.pb.v) : "—"}</The>
        <The nhan="ROE bình quân" phu={tt.roe != null ? `Thị trường ${p1(tt.roe)}%` : undefined}>{dn.roe ? `${p1(dn.roe.v)}%` : "—"}</The>
        <The nhan="Lợi nhuận 4 quý" phu="So với cùng kỳ, bình quân theo tỷ trọng" mau={dn.lnYoY && dn.lnYoY.v < 0 ? DO : TEXT}>{dn.lnYoY ? dau(dn.lnYoY.v, 0) : "—"}</The>
        <The nhan="Tỷ suất cổ tức" phu="Tiền mặt 4 quý / vốn hóa">{dn.coTuc ? `${p1(dn.coTuc.v)}%` : "—"}</The>
        <The nhan={`Điểm doanh nghiệp (${kq.phongCach.ngan})`} phu={`BCTC phủ ${p0(dn.phuGiaTri * 100)}% giá trị`}>{dn.diem != null ? `${p0(dn.diem * 100)}/100` : "—"}</The>
      </div>

      {dn.coDo.length > 0 && (
        <Khoi tieuDe="Cờ đỏ trong BCTC" phu={`${p0(dn.tyLeCoDo * 100)}% giá trị danh mục nằm ở các mã dưới đây.`}>
          <ul className="grid gap-1.5 text-sm" style={sans}>
            {dn.coDo.map((x) => (
              <li key={x.ma} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-1.5 shrink-0 rounded-full" style={{ width: 9, height: 9, background: x.cacCo.some((c) => /nguy cơ|lỗ 4 quý/.test(c)) ? DO : VANG }} />
                <span>
                  <b>{x.ma}</b> ({p1(x.tyTrong * 100)}% danh mục): {x.cacCo.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </Khoi>
      )}

      <div className="rounded-2xl border overflow-hidden mb-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-x-auto bang-cuon">
          <table className="w-full text-sm" style={sans}>
            <thead>
              <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED }}>
                {["Mã", "Tỷ trọng", "Quý", "P/E (ngành)", "P/B (ngành)", "ROE", "LN 4 quý", "DT 4 quý", "Điểm Z", "F / sinh lời", "Cổ tức", "Đánh giá 360", "Điểm theo phong cách"].map((t, i) => (
                  <th key={t} className={`py-3 px-3 font-normal whitespace-nowrap ${i > 0 && i !== 2 ? "text-right" : ""}`}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ds.map((h, i) => {
                const c = coBan[h.ma];
                const d = dn.ma[h.ma]?.diem;
                const tc = c?.loai && c.loai !== "pi";
                return (
                  <tr key={h.ma} className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--vien-nhe)" }}>
                    <td className="py-2.5 px-3 font-bold"><Link href={`/ma/${h.ma}`} className="hover:underline">{h.ma}</Link></td>
                    <td className="py-2.5 px-3 text-right">{p1(h.tyTrong * 100)}%</td>
                    {!c ? (
                      <td colSpan={11} className="py-2.5 px-3 text-xs" style={{ color: MUTED }}>Chưa có BCTC trong hệ thống</td>
                    ) : (
                      <>
                        <td className="py-2.5 px-3">{quyVN(c.quy)}</td>
                        <td className="py-2.5 px-3 text-right">{c.pe != null ? p1(c.pe) : c.lnTTM <= 0 ? "lỗ" : "—"}<span className="text-xs" style={{ color: MUTED }}>{c.peNganh != null ? ` (${p1(c.peNganh)})` : ""}</span></td>
                        <td className="py-2.5 px-3 text-right">{c.pb != null ? p1(c.pb) : "—"}<span className="text-xs" style={{ color: MUTED }}>{c.pbNganh != null ? ` (${p1(c.pbNganh)})` : ""}</span></td>
                        <td className="py-2.5 px-3 text-right">{c.roe != null ? `${p1(c.roe)}%` : "—"}</td>
                        <td className="py-2.5 px-3 text-right" style={{ color: c.lnYoY < 0 ? DO : TEXT }}>{dau(c.lnYoY, 0)}</td>
                        <td className="py-2.5 px-3 text-right">{dau(c.dtYoY, 0)}</td>
                        <td className="py-2.5 px-3 text-right" style={{ color: mauZ[c.vungZ2] ?? MUTED }}>{tc ? "—" : c.vungZ2 ?? "—"}</td>
                        <td className="py-2.5 px-3 text-right">{tc ? (c.sinhLoi != null ? `${c.sinhLoi}/5` : "—") : c.f != null ? `${c.f}/9` : "—"}</td>
                        <td className="py-2.5 px-3 text-right" title={coTucVuotLoiNhuan(c) ? `Chi trả 4 quý gấp ${p1((c.coTuc * c.pe) / 100)} lần lợi nhuận — có thể là khoản trả một lần; bình quân danh mục chỉ tính tối đa ${p1(100 / c.pe)}% (= 1/P/E)` : undefined}>
                          {tc ? "—" : c.coTuc != null ? `${p1(c.coTuc)}%${coTucVuotLoiNhuan(c) ? "*" : ""}` : "0%"}
                        </td>
                        <td className="py-2.5 px-3 text-right">{c.d360 != null ? `${p1(c.d360)} · ${c.xepLoai}` : "—"}</td>
                        <td className="py-2.5 px-3 text-right" style={{ fontWeight: 700 }}>{d != null ? p0(d * 100) : "—"}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[11px] mb-6" style={{ color: MUTED }}>
        BCTC quý mới nhất (VNDirect). Điểm Z (Altman Z&apos;&apos;) và điểm F (Piotroski) chỉ cho doanh nghiệp phi tài chính; ngân hàng / chứng khoán / bảo hiểm dùng điểm sinh lời. Đánh giá 360 và “Điểm theo phong cách” là thứ hạng so với các mã
        cùng loại (0–10 / 0–100), không phải ngưỡng tuyệt đối. Cổ tức có dấu * = chi trả 4 quý lớn hơn lợi nhuận (thường là khoản trả một lần) — tỷ suất bình quân danh mục chỉ tính tối đa bằng 1/P/E. Chi tiết từng mã ở trang <Link href="/co-ban" className="underline">Cơ bản</Link>. Nghiên cứu nội bộ: điểm F ≥ 6 chỉ vượt trội nhẹ trên mẫu nhỏ — dùng để loại doanh nghiệp yếu, không phải để dự báo giá.
      </p>
    </>
  );
}
