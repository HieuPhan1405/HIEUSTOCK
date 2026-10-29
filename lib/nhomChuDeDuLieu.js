import { cache } from "react";
import { layLichSuGia } from "@/lib/lichSuGia";

// Nen ngay cua cac ma trong 1 nhom chu de (lib/nhomChuDe.js), dung chung cho bang nhom va RRG o trang Nganh (cache trong 1 luot render nen chi goi nguon 1 lan).
// Gia lay RIENG tung ma tu DNSE (co ca ma ngoai danh sach web quet), toi da 6 ma cung luc, moi ma han 4 giay (qua han -> null, ma do hien "—").
export const layNenNhom = cache(async (khoaNhom, dsMa) => {
  const kq = {};
  let i = 0;
  const chay = async () => {
    while (i < dsMa.length) {
      const ma = dsMa[i++];
      kq[ma] = await Promise.race([layLichSuGia(ma, 400).catch(() => null), new Promise((r) => setTimeout(() => r(null), 4000))]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(6, dsMa.length) }, chay));
  return kq;
});
