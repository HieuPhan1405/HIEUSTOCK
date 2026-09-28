// NGUON DU PHONG lich su gia ngay (2026-09-28) - VNDirect finfo adOpen/adHigh/adLow/adClose + nmVolume, CUNG nguon bieu do tren web (lib/lichSuGia.js).
// Dung khi DNSE OpenAPI loi luc tai lich su (quetToanBo.js): 28/09/2026 engine khoi dong lai mat 37/387 ma vi loi tai. Gia da dieu chinh co tuc / thuong va khoi luong khop lenh
// GIONG DNSE (kiem 28/09: VPB 23/09 close 22,06 / nmVolume 26.013.600 ca 2 nguon) nen dung lan duoc voi nen cap nhat qua WebSocket DNSE.
// Tra ve [{ t: "yyyy-mm-dd", o, h, l, c, v }] tu cu den moi (cung dang nen cua dnse/openApiClient.js layNenOHLC).
const FINFO = "https://api-finfo.vndirect.com.vn/v4/stock_prices";

export async function layNenDieuChinh(ma, soNen = 1200) {
  const r = await fetch(`${FINFO}?sort=date:desc&q=code:${encodeURIComponent(ma)}&size=${soNen}&fields=date,adOpen,adHigh,adLow,adClose,nmVolume`, {
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`VNDirect HTTP ${r.status}`);
  const d = await r.json();
  if (!Array.isArray(d?.data)) throw new Error("VNDirect tra ve du lieu khong co mang data");
  return d.data
    .filter((x) => x.adClose > 0 && x.adHigh > 0 && x.adLow > 0)
    .map((x) => ({ t: String(x.date).slice(0, 10), o: x.adOpen > 0 ? x.adOpen : x.adClose, h: x.adHigh, l: x.adLow, c: x.adClose, v: x.nmVolume ?? 0 }))
    .reverse();
}
