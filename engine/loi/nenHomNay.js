import { capNhatNenMoiNhat } from "./quetToanBo.js";

// NEN NGAY HOM NAY TU NEN PHUT (DNSE chart-api, cung nguon voi web lib/lichSuGia.js). Lich su ngay cua engine chi den het phien truoc; nen hom nay chi den tu WebSocket khi co khop lenh moi,
// nen engine khoi dong GIUA phien / luc nghi trua (vd 11h46) khong co nen hom nay -> tin hieu MUA cua hom qua nam lai den khi ma do co lenh khop ke tiep (30/10/2026 DPR).
// Goi 1 lan sau khi tai lich su: gop cac nen phut hom nay thanh 1 nen ngay roi ghi de / them vao cuoi mang. Loi 1 ma thi bo qua ma do (WebSocket van cap nhat sau).
const DNSE_STOCK = "https://services.entrade.com.vn/chart-api/v2/ohlcs/stock";
const DNSE_INDEX = "https://services.entrade.com.vn/chart-api/v2/ohlcs/index";
const ngayIso = (giay) => new Date(giay * 1000).toISOString().slice(0, 10);
const hopLe = (b) => [b.o, b.h, b.l, b.c].every((x) => Number.isFinite(x) && x > 0) && b.h >= b.l;

export function gopNenPhutThanhNgay(j, homNay) {
  if (!Array.isArray(j?.t) || !j.t.length) return null;
  const ds = j.t
    .map((t, i) => ({ t, o: j.o[i], h: j.h[i], l: j.l[i], c: j.c[i], v: j.v?.[i] ?? 0 }))
    .filter((b) => hopLe(b) && ngayIso(b.t) === homNay)
    .sort((a, b) => a.t - b.t);
  if (!ds.length) return null;
  return { t: homNay, o: ds[0].o, h: Math.max(...ds.map((b) => b.h)), l: Math.min(...ds.map((b) => b.l)), c: ds.at(-1).c, v: ds.reduce((s, b) => s + b.v, 0) };
}

async function layNenNgay(ma, laChiSo, den) {
  const r = await fetch(`${laChiSo ? DNSE_INDEX : DNSE_STOCK}?symbol=${ma}&resolution=1&from=${den - 3600 * 20}&to=${den}`, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return gopNenPhutThanhNgay(await r.json(), ngayIso(den));
}

// nenTheoMa: Map ma -> mang nen; vniNen: mang nen VNINDEX. Tra ve { ghep, loi }.
export async function ghepNenHomNay(nenTheoMa, vniNen, { song = 8 } = {}) {
  const den = Math.floor(Date.now() / 1000);
  const viec = [["VNINDEX", vniNen, true], ...[...nenTheoMa.entries()].map(([ma, nen]) => [ma, nen, false])];
  let i = 0, ghep = 0, loi = 0;
  const chay = async () => {
    while (i < viec.length) {
      const [ma, nen, laChiSo] = viec[i++];
      try {
        const n = await layNenNgay(ma, laChiSo, den);
        if (n) {
          capNhatNenMoiNhat(nen, n);
          ghep++;
        }
      } catch {
        loi++;
      }
    }
  };
  await Promise.all(Array.from({ length: song }, chay));
  return { ghep, loi };
}
