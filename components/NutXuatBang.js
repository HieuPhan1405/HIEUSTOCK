"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { taoXlsx, htmlIn, chuanHoaO } from "@/lib/xuatBang";
import { taiXuong } from "@/lib/xuatAnh";

const VIEN = "var(--vien)";
const TEXT = "var(--chu)";
const sans = { fontFamily: "var(--font-chu)" };

// XUAT KET QUA BO LOC: Excel (.xlsx) hoac PDF (hop thoai in -> "Luu thanh PDF"). Xuat TOAN BO cac ma dang loc (khong chi so dong dang hien), dung cac cot DANG HIEN theo cach sap xep hien tai.
// cot: [{ khoa, nhan, lay }]; hang: cac dong da loc + sap xep; ctx: doi so thu 2 cua lay(); tenFile khong co duoi.
export default function NutXuatBang({ cot, hang, ctx, tieuDe = "Bộ lọc cổ phiếu CloudStock", mota = "", tenFile = "cloudstock-bo-loc" }) {
  const [loi, setLoi] = useState("");
  const dung = () => {
    const tieuDeCot = cot.map((c) => c.nhan);
    const dong = hang.map((r) => cot.map((c) => chuanHoaO(typeof c.lay === "function" ? c.lay(r, ctx) : "")));
    return { tieuDeCot, dong };
  };
  const phu = () => `${mota ? `${mota} · ` : ""}${hang.length} mã · ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} · cloudstock.id.vn · Không phải khuyến nghị đầu tư`;
  const ngay = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

  const excel = () => {
    try {
      setLoi("");
      const { tieuDeCot, dong } = dung();
      taiXuong(taoXlsx(tieuDeCot, dong, "Bộ lọc"), `${tenFile}-${ngay()}.xlsx`);
    } catch {
      setLoi("Không xuất được file Excel.");
    }
  };
  const pdf = () => {
    try {
      setLoi("");
      const { tieuDeCot, dong } = dung();
      const f = document.createElement("iframe");
      f.setAttribute("aria-hidden", "true");
      f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
      document.body.appendChild(f);
      const d = f.contentWindow.document;
      d.open();
      d.write(htmlIn(`${tieuDe} — ${ngay()}`, phu(), tieuDeCot, dong));
      d.close();
      setTimeout(() => {
        f.contentWindow.focus();
        f.contentWindow.print(); // chon "Lưu thành PDF" trong hộp thoại in
        setTimeout(() => f.remove(), 60000);
      }, 400);
    } catch {
      setLoi("Không mở được hộp thoại in.");
    }
  };
  const cls = "inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-semibold";
  return (
    <span className="inline-flex items-center gap-2" data-khong-chup>
      <button type="button" onClick={excel} disabled={hang.length === 0} className={cls} style={{ borderColor: VIEN, color: TEXT, opacity: hang.length ? 1 : 0.5, ...sans }} title="Tải toàn bộ mã đang lọc ra file Excel (.xlsx)" data-may="xuat-excel">
        <FileSpreadsheet size={13} aria-hidden="true" /> Excel
      </button>
      <button type="button" onClick={pdf} disabled={hang.length === 0} className={cls} style={{ borderColor: VIEN, color: TEXT, opacity: hang.length ? 1 : 0.5, ...sans }} title="Mở hộp thoại in, chọn “Lưu thành PDF”" data-may="xuat-pdf">
        <FileText size={13} aria-hidden="true" /> PDF
      </button>
      {loi && <span className="text-xs" style={{ color: "var(--do)" }}>{loi}</span>}
    </span>
  );
}
