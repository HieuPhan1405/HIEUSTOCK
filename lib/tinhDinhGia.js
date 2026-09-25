// Ham THUAN (khong dung DB/mang, import tuong doi) tinh PE/PB cua ca nhom ma tu von hoa + ty so tung ma - dung chung cho lib/thiTruongHOSE.js
// (server) va scripts/capNhatLichSuDinhGia.mjs (node thuan) de 2 noi ra cung 1 con so.

// mc: { ma: von hoa (VND) }; tySo: { ma: PE hoac PB }; tapMa: Set ma can gop (null = tat ca ma trong mc).
// PE/PB nhom = TONG von hoa / TONG (von hoa / ty so) - tuc tong von hoa chia tong loi nhuan (hoac von chu so huu). Loai ma co ty so <= 0 hoac thieu
// (lo/khong co so lieu) khoi CA tu so lan mau so. Tra { giaTri, soMa, phuVonHoaPct, tongVonHoa }.
export function gopTySo(mc, tySo, tapMa = null) {
  let tu = 0;
  let mau = 0;
  let n = 0;
  let tongMC = 0;
  for (const [ma, v] of Object.entries(mc)) {
    if (tapMa && !tapMa.has(ma)) continue;
    if (!(v > 0)) continue;
    tongMC += v;
    const r = tySo[ma];
    if (r > 0) {
      tu += v;
      mau += v / r;
      n++;
    }
  }
  return { giaTri: mau > 0 ? tu / mau : null, soMa: n, phuVonHoaPct: tongMC > 0 ? (tu / tongMC) * 100 : 0, tongVonHoa: tongMC };
}

// Trung binh + do lech chuan (tong the) cua 1 mang so hop le.
export function thongKeMang(mang) {
  const a = mang.filter((x) => Number.isFinite(x));
  if (!a.length) return { tb: null, doLech: null, n: 0 };
  const tb = a.reduce((s, x) => s + x, 0) / a.length;
  const doLech = Math.sqrt(a.reduce((s, x) => s + (x - tb) ** 2, 0) / a.length);
  return { tb, doLech, n: a.length };
}
