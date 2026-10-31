// Khoi ngoai mua / ban rong theo PHIEN cua tung ma (VNDirect finfo /v4/foreigns, du lieu cong khai, co ca phien dang chay trong ngay).
// netVol = KL mua rong (co phieu, gom ca thoa thuan), netVal = gia tri mua rong (dong). Tra mang TANG dan theo ngay, toi da `soPhien` phien gan nhat.
import { fetchThuLai } from "./fetchThuLai.js";

export const MA_NN_HOP_LE = /^[A-Z0-9]{2,12}$/;

export async function layKhoiNgoaiMa(ma, soPhien = 10) {
  const url = `https://api-finfo.vndirect.com.vn/v4/foreigns?q=code:${ma}&sort=tradingDate:desc&size=${soPhien}&fields=tradingDate,buyVol,sellVol,netVol,buyVal,sellVal,netVal`;
  const res = await fetchThuLai(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Nguồn khối ngoại trả về lỗi (HTTP ${res.status}).`);
  const j = await res.json();
  const so = (v) => (Number.isFinite(v) ? v : 0);
  return (j.data ?? [])
    .map((d) => ({
      ngay: d.tradingDate,
      mua: so(d.buyVol),
      ban: so(d.sellVol),
      rongKL: Number.isFinite(d.netVol) ? d.netVol : so(d.buyVol) - so(d.sellVol),
      rongTy: so(d.netVal) / 1e9,
    }))
    .sort((a, b) => (a.ngay < b.ngay ? -1 : 1));
}
