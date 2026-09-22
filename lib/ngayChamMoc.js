// Ham THUAN, KHONG dung DB - dung duoc ca o server (lib/lenhDaDong.js) va client (components/NhatKyGiaoDich.js).

// Nen dau tien SAU ngay mua co dinh >= muc TP (nen tang dan theo ngay: [{ t: "yyyy-mm-dd", h }]) -> { ngay, soPhien } hoac null.
export function ngayChamTP(nen, ngayMua, tp) {
  let soPhien = 0;
  for (const b of nen) {
    if (b.t <= ngayMua) continue;
    soPhien++;
    if (b.h >= tp) return { ngay: b.t, soPhien };
  }
  return null;
}
