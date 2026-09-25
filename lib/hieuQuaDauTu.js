// HIEU QUA DAU TU CUA HE THONG: ty suat sinh loi theo thoi gian cua cac lenh (da dong + dang mo) so voi VN-Index, tu ngay web BAT DAU ghi nhan lenh da dong.
// Ghep du lieu, lay gia theo ngay (VNDirect, 1 lan goi/ngay cho CA thi truong nen so lan goi khong phu thuoc so ma) roi giao cho lib/tinhHieuQua.js tinh.
import { layLichSuGia } from "@/lib/lichSuGia";
import { layLenhDaDong, layNgayBatDauGhiNhan } from "@/lib/lenhDaDong";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import { tinhHieuQua, cacLatCat } from "@/lib/tinhHieuQua";
import { ngayVNHomNay } from "@/lib/thiTruongHOSE";

const FINFO = "https://api-finfo.vndirect.com.vn/v4";
const SO_PHIEN_TOI_DA = 261; // 1 nam giao dich + moc goc (tab lon nhat la 1Y)
const dangGiu = (t) => t === "MUA" || t === "NAM GIU";

// Gia dong cua + gia dong DIEU CHINH cua cac ma can thiet trong 1 ngay (Map ma -> { close, adClose }). 1 lan goi cho ca thi truong, ngay cu cache 1 ngay.
async function layGiaNgay(ngayISO, tapMa) {
  const giay = ngayISO === ngayVNHomNay() ? 30 : 86400;
  const res = await fetch(`${FINFO}/stock_prices?q=date:${ngayISO}&size=5000&fields=code,close,adClose`, { next: { revalidate: giay }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`VNDirect trả lỗi HTTP ${res.status}.`);
  const j = await res.json();
  const kq = new Map();
  for (const x of j.data || []) if (tapMa.has(x.code) && x.close > 0) kq.set(x.code, { close: x.close, adClose: x.adClose > 0 ? x.adClose : x.close });
  return kq;
}

// Chay tuan tu toi da soSong tac vu cung luc, giu nguyen thu tu ket qua.
async function chayHangLoat(ds, soSong, tacVu) {
  const kq = new Array(ds.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(soSong, ds.length) }, async () => {
      while (i < ds.length) {
        const k = i++;
        kq[k] = await tacVu(ds[k]);
      }
    })
  );
  return kq;
}

export async function layHieuQuaHeThong() {
  const batDau = await layNgayBatDauGhiNhan();
  if (!batDau) return { coDuLieu: false, lyDo: "Web chưa ghi nhận lệnh đã đóng nào để tính hiệu quả." };

  const [dongDa, tatCa, nen] = await Promise.all([layLenhDaDong(), layTatCaTinHieu(), layLichSuGia("VNINDEX", 400)]);
  const slices = cacLatCat(dongDa, tatCa.filter((r) => dangGiu(r.tin)));
  if (!slices.length || nen.length < 3) return { coDuLieu: false, lyDo: "Chưa có lệnh nào để tính hiệu quả." };

  // Moc goc = phien ngay TRUOC ngay bat dau ghi nhan (de ngay dau tien cung co ty suat), toi da 1 nam.
  let i0 = -1;
  for (let i = 0; i < nen.length; i++) if (nen[i].t < batDau) i0 = i;
  const tu = Math.max(i0 < 0 ? 0 : i0, nen.length - SO_PHIEN_TOI_DA);
  const phien = nen.slice(tu);
  if (phien.length < 2) return { coDuLieu: false, lyDo: "Chưa đủ số phiên để tính hiệu quả." };

  const tapMa = new Set(slices.map((s) => s.ma));
  const ngay = phien.map((b) => b.t);
  const giaTheoNgay = await chayHangLoat(ngay, 6, (d) => layGiaNgay(d, tapMa).catch(() => new Map()));
  const kq = tinhHieuQua({ slices, ngay, giaTheoNgay, vn: phien.map((b) => b.c) });
  return { coDuLieu: true, batDau, ngay: kq.ngay, tssl: kq.tssl, vn: kq.vn, soHoatDong: kq.soHoatDong, soLatCat: slices.length, capNhat: new Date().toISOString() };
}
