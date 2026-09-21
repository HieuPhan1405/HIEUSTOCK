import Link from "next/link";
import { thongKeLenhDaDong } from "@/lib/lenhDaDong";
import { fmt, pct } from "@/components/dungChung";
import { TY_LE_CHOT, CHUOI_TY_LE_CHOT } from "@/lib/tyLeChot";
import { tenCongTy } from "@/lib/tenMa";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const XANH = "#22C55E";
const DO = "#EF4444";

// yyyy-mm-dd -> dd/mm/yyyy
const ngayVN = (s) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : "—");

function The({ so, nhan, phu, mau }) {
  return (
    <div className="rounded-2xl border p-4 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: mau }}>
        {so}
      </p>
      <p className="text-xs mt-1" style={{ color: MUTED }}>
        {nhan}
      </p>
      {phu && (
        <p className="text-[11px]" style={{ color: MUTED }}>
          {phu}
        </p>
      )}
    </div>
  );
}

// Phan hien thi trang Lenh da dong (tach khoi page.js de trang chi lo cong dang nhap + lay du lieu).
// nhung = true: dung nhu 1 phan cua trang khac (vd Danh muc ca nhan) - tieu de h2, khong boc khung trang.
export default function LenhDaDongView({ ds, loi, tieuDe = "Lệnh đã đóng", moTa, nhung = false }) {
  const tk = thongKeLenhDaDong(ds);
  const mauLai = (v) => (v == null ? MUTED : v >= 0 ? XANH : DO);
  const TieuDeTag = nhung ? "h2" : "h1";

  return (
    <div className={nhung ? "" : "max-w-6xl mx-auto px-6 py-10"} style={{ color: TEXT }}>
      <TieuDeTag className={nhung ? "text-lg mb-1" : "text-2xl mb-1"} style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        {tieuDe}
      </TieuDeTag>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        {moTa ?? (
          <>
            Kết quả các lệnh đã bán, đã thoát vị thế hoặc đã chốt đủ TP3 kể từ khi web bắt đầu ghi nhận. Lệnh đang giữ xem ở{" "}
            <Link href="/lenh-mo" className="underline" style={{ color: "#6C5CE7" }}>
              Sổ lệnh đang mở
            </Link>
            .
          </>
        )}
      </p>

      {loi && (
        <p className="text-sm mb-6" style={{ color: DO }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
        <The so={tk.soLenh} nhan="Lệnh đã đóng" phu={tk.soLenh ? `${tk.soThang} thắng · ${tk.soThua} thua` : undefined} />
        <The
          so={tk.tyLeThang == null ? "—" : `${tk.tyLeThang.toFixed(0)}%`}
          nhan="Tỷ lệ thắng"
          mau={tk.tyLeThang == null ? MUTED : tk.tyLeThang >= 50 ? XANH : DO}
        />
        <The so={tk.laiTB == null ? "—" : pct(tk.laiTB, 2)} nhan="Lãi/lỗ trung bình mỗi lệnh" mau={mauLai(tk.laiTB)} />
        <The so={tk.phienTB == null ? "—" : `${tk.phienTB.toFixed(0)} phiên`} nhan="Thời gian giữ trung bình" />
      </div>
      {tk.soLenh > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-3">
          <The so={tk.laiTBThang == null ? "—" : pct(tk.laiTBThang, 2)} nhan="Lãi trung bình lệnh thắng" mau={XANH} />
          <The so={tk.loTBThua == null ? "—" : pct(tk.loTBThua, 2)} nhan="Lỗ trung bình lệnh thua" mau={DO} />
        </div>
      )}

      <p className="text-[11px] mb-6" style={{ color: MUTED }}>
        Ngày bán và giá bán lấy theo lần cập nhật dữ liệu khi lệnh chuyển sang BÁN / thoát (xấp xỉ giá đóng cửa phiên đó, không phải giá khớp thật). Lệnh
        &quot;Chốt đủ TP3&quot; tính theo tỷ lệ chốt {CHUOI_TY_LE_CHOT} tại đúng mức TP1/TP2/TP3: lãi/lỗ là phần đã chốt ({100 - TY_LE_CHOT.giu}% vị thế), {TY_LE_CHOT.giu}% cuối
        giữ chạy nên chưa tính. Kết quả chỉ mang tính tham khảo, không phải khuyến nghị đầu tư.
      </p>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <thead>
              <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                <th className="py-3 px-3 font-normal">Mã</th>
                <th className="py-3 px-3 font-normal">Ngày mua</th>
                <th className="py-3 px-3 font-normal text-right">Giá mua</th>
                <th className="py-3 px-3 font-normal">Ngày bán</th>
                <th className="py-3 px-3 font-normal text-right">Giá bán</th>
                <th className="py-3 px-3 font-normal text-right">Lãi/Lỗ</th>
                <th className="py-3 px-3 font-normal text-right">Số phiên</th>
                <th className="py-3 px-3 font-normal text-right">Kết thúc</th>
              </tr>
            </thead>
            <tbody>
              {ds.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 px-4 text-center text-sm" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                    Chưa có lệnh nào đóng kể từ khi web bắt đầu ghi nhận. Khi một mã đang NẮM GIỮ chuyển sang BÁN, kết quả sẽ tự xuất hiện ở đây.
                  </td>
                </tr>
              )}
              {ds.map((x, i) => (
                <tr key={`${x.ma}-${x.ngay_mua}`} className={i > 0 ? "border-t" : ""} style={{ borderColor: "#1D1D26" }}>
                  <td className="py-2.5 px-3">
                    <Link href={`/ma/${x.ma}`} className="hover:underline" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                      {x.ma}
                    </Link>
                    {tenCongTy(x.ma) && (
                      <span className="block max-w-[190px] truncate text-[10px] leading-tight" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }} title={tenCongTy(x.ma).ten}>
                        {tenCongTy(x.ma).ngan}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3" style={{ color: MUTED }}>
                    {ngayVN(x.ngay_mua)}
                  </td>
                  <td className="py-2.5 px-3 text-right">{fmt(x.gia_mua)}</td>
                  <td className="py-2.5 px-3" style={{ color: MUTED }}>
                    {ngayVN(x.ngay_ban)}
                  </td>
                  <td className="py-2.5 px-3 text-right">{fmt(x.gia_ban)}</td>
                  <td className="py-2.5 px-3 text-right font-bold" style={{ color: mauLai(x.lai_lo_pct) }}>
                    {pct(x.lai_lo_pct, 2)}
                  </td>
                  <td className="py-2.5 px-3 text-right" style={{ color: MUTED }}>
                    {x.so_phien ?? "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right text-xs" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                    {x.ly_do === "TP3"
                      ? `Chốt đủ TP3 (${x.phan_chot_pct ?? 100 - TY_LE_CHOT.giu}%) · giữ ${TY_LE_CHOT.giu}% chạy`
                      : x.ly_do === "BAN"
                        ? "Tín hiệu BÁN"
                        : "Đã thoát"}
                    {x.ly_do !== "TP3" && x.da_cham_tp ? ` · đã chạm ${x.da_cham_tp}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
