import Link from "next/link";
import { thongKeLenhDaDong } from "@/lib/thongKeLenh";
import { fmt, pct } from "@/components/dungChung";
import { TY_LE_CHOT, TY_LE_CHOT_CU, TY_LE_CHOT_KET_THUC } from "@/lib/tyLeChot";
import { tenCongTy } from "@/lib/tenMa";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const XANH = "#22C55E";
const DO = "#EF4444";

// yyyy-mm-dd -> dd/mm/yyyy
const ngayVN = (s) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : "—");

// Dong cua LENH MUA THEM GIUA CHUNG (vong 4: vi the phu gan voi lenh goc, co gia mua/Stop-loss/ngay mua rieng). Lenh MOI SAU TP3 (vong 2) la lenh binh thuong (TP/SL moi) nen
// hien nhu moi lenh khac, khong gan nhan "mua them".
const MUA_THEM = {
  4: { nhan: "Mua thêm giữa chừng", mau: "#A78BFA" },
};

// Cot "Ket thuc": ly do dong + ghi chu phan vi the. Lenh mua them dong theo Stop-loss RIENG hoac dong THEO lenh goc (lenh goc bi ban / ket thuc o TP3), khong co
// TP1/TP2 rieng nen khong ghi "da cham TP" / "phan con lai" cua lenh goc.
function nhanKetThuc(x) {
  const pc = Number(x.phan_chot_pct);
  if (MUA_THEM[x.vong]) {
    if (x.ly_do === "CAT_LO") return "Cắt lỗ riêng (chạm Stop-loss của lệnh mua thêm)";
    if (x.ly_do === "BAN") return "Đóng theo lệnh gốc (lệnh gốc có tín hiệu BÁN)";
    return "Đóng theo lệnh gốc";
  }
  let chinh;
  if (x.ly_do === "TP1" || x.ly_do === "TP2") chinh = `Chốt lời ${x.ly_do} (${x.phan_chot_pct}% vị thế)`;
  else if (x.ly_do === "TP3" || x.ly_do === "CHOT_TP3") {
    // Cach 2 TP + giu den BAN khong ghi dong TP3. Dong TP3 chi co o: lenh CU (30/30/25: dong 25% hoac gop 85%, con 15% chay) va cach "ket thuc o TP3" (40% hoac gop 100%, khi AFL bat KetThucTaiTP3).
    if (pc === TY_LE_CHOT_KET_THUC.tp3 || pc >= 100 || x.ly_do === "CHOT_TP3") chinh = `Chạm TP3 (chốt ${x.phan_chot_pct ?? 100}% vị thế) · kết thúc lệnh`;
    else chinh = `Chốt TP3 (${x.phan_chot_pct}% vị thế) · lệnh cũ, còn ${TY_LE_CHOT_CU.giu}% giữ chạy`;
  } else if (x.ly_do === "THOAT_KIJUN") chinh = "Thoát theo Kijun (đóng cửa dưới Kijun sau TP2)";
  else if (x.ly_do === "CAT_LO") chinh = "Cắt lỗ (Stop-loss)";
  else if (x.ly_do === "BAO_VE_LAI") chinh = "Bảo vệ lãi (dời SL lên cao hơn)";
  else if (x.ly_do === "BAN") chinh = "Tín hiệu BÁN";
  else chinh = "Đã thoát";
  const laDongTP = /^(CHOT_)?TP[123]$/.test(x.ly_do ?? "");
  if (!laDongTP && x.vong !== 3 && x.da_cham_tp) chinh += ` · đã chạm ${x.da_cham_tp}`;
  if (x.vong === 1 && !laDongTP && x.phan_chot_pct != null && pc < 100) chinh += ` · phần còn lại ${x.phan_chot_pct}%`;
  if (x.vong === 3) chinh += ` · phần còn lại ${TY_LE_CHOT_CU.giu}% sau TP3 (lệnh cũ)`;
  return chinh;
}

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
// nhung = true: dung nhu 1 phan cua trang khac (vd Danh muc theo doi) - tieu de h2, khong boc khung trang.
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
            Kết quả các lệnh đã bán, đã thoát vị thế hoặc đã chốt lời từng phần (TP1 / TP2 / TP3) kể từ khi web bắt đầu ghi nhận. Lệnh đang giữ xem ở{" "}
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
        <The
          so={tk.soLenh}
          nhan="Lệnh đã đóng"
          phu={
            tk.soLenh || tk.soDangChotTungPhan
              ? `${tk.soThang} thắng · ${tk.soThua} thua${tk.soDangChotTungPhan ? ` · ${tk.soDangChotTungPhan} lệnh mới chốt một phần (còn giữ)` : ""}`
              : undefined
          }
        />
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
        Ngày bán và giá bán lấy theo lần cập nhật dữ liệu khi lệnh chuyển sang BÁN / thoát (xấp xỉ giá đóng cửa phiên đó, không phải giá khớp thật). Với
        lệnh mới, mỗi lần giá chạm mốc chốt lời được ghi thành một dòng ngay lúc chạm theo tỷ lệ chốt: TP1 chốt {TY_LE_CHOT.tp1}%, TP2 chốt {TY_LE_CHOT.tp2}%, {TY_LE_CHOT.giu}% còn lại giữ đến khi hệ thống báo BÁN (TP3 chỉ là mốc tham khảo, không ghi dòng riêng) — lãi/lỗ của mỗi dòng là tỷ lệ giá của đúng phần đó (giá chốt so với giá mua), và khi lệnh đóng thật
        sự thì chỉ ghi phần còn lại. Các thẻ thống kê ở trên tính THEO TỪNG LỆNH: các dòng TP1/TP2/TP3/phần còn lại của cùng một lệnh được gộp lại và chỉ tính một lần khi lệnh đã đóng hẳn,
        kết quả = tổng các phần theo tỷ trọng (ví dụ chốt 30% ở +10%, 30% ở +20%, 40% ở +40% thì lệnh lãi 25%). Lệnh mới chốt TP1/TP2 mà còn giữ chưa được tính vào thống kê; lệnh cũ (30/30/25) đã chốt tới TP3 tính là đã kết thúc theo phần đã chốt (bỏ qua 15% còn chạy). Dòng có nhãn <b style={{ color: "#A78BFA" }}>➕ Mua thêm giữa chừng</b> là lệnh mua thêm riêng của cùng mã (giá mua và Stop-loss riêng, ngày mua khác lệnh gốc): đóng khi
        chạm Stop-loss riêng hoặc khi lệnh gốc kết thúc. Lệnh mới sau khi lệnh gốc chạm TP3 (nếu có) là một lệnh bình thường nên cũng hiện như mọi lệnh khác. Lệnh cũ (trước 26/09/2026) chốt theo cách 30/30/25
        nên dòng TP3 hiện {TY_LE_CHOT_CU.tp3}% (hoặc gộp {100 - TY_LE_CHOT_CU.giu}%). Kết quả chỉ mang tính tham khảo, không phải khuyến nghị đầu tư.
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
                <tr key={`${x.ma}-${x.ngay_mua}-${x.vong}`} className={i > 0 ? "border-t" : ""} style={{ borderColor: "#1D1D26" }}>
                  <td className="py-2.5 px-3">
                    <Link href={`/ma/${x.ma}`} className="hover:underline" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                      {x.ma}
                    </Link>
                    {MUA_THEM[x.vong] && (
                      <span className="block text-[10px] font-bold tracking-wide leading-tight mt-0.5" style={{ color: MUA_THEM[x.vong].mau, fontFamily: "'Inter', sans-serif" }}>
                        ➕ {MUA_THEM[x.vong].nhan}
                      </span>
                    )}
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
                    {nhanKetThuc(x)}
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
