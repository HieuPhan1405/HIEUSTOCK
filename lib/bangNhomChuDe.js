// CHI SO NHOM CHU DE (lib/nhomChuDe.js) de ve RRG o trang Nganh - ham THUAN, test tay: engine/test/bangNhomChuDe.test.mjs.
// trung binh DEU loi suat ngay cua cac ma trong nhom (cach cua chi so nganh, engine/dich-vu/tinhRRG.mjs), thang theo mang ngay cua RRG (`ngay`, tang dan).
// Ngay dau chuoi = 100; ngay nao nhom khong ma nao co gia hom do va hom truoc thi giu nguyen chi so. Tra ve mang cung do dai `ngay`, hoac null neu nhom khong co ma nao co gia.
export function chiSoNhomTheoNgay(ngay, dsMa, barsTheoMa) {
  const gia = [];
  for (const ma of dsMa) {
    const b = barsTheoMa?.[ma];
    if (Array.isArray(b) && b.length) gia.push(new Map(b.map((x) => [x.t, x.c])));
  }
  if (!gia.length || !ngay.length) return null;
  let idx = 100;
  return ngay.map((t, i) => {
    if (i > 0) {
      const r = [];
      for (const g of gia) {
        const a = g.get(ngay[i - 1]);
        const c = g.get(t);
        if (a > 0 && c > 0) r.push(c / a - 1);
      }
      if (r.length) idx *= 1 + r.reduce((s, x) => s + x, 0) / r.length;
    }
    return +idx.toFixed(3);
  });
}
