// PHIEN GIAO DICH theo gio Viet Nam (ham THUAN, import tuong doi de test tay: engine/test/phienGiaoDich.test.mjs). Chua tinh ngay le (Tet, 30/4...) - ngay le se bi coi la
// ngay giao dich binh thuong.
const GIO_DONG_CUA = 15; // sau 15:00 coi nhu phien hom nay da dong (ATC 14:30-14:45, du lieu thuong day len sau do)

// Date -> { ngay: "yyyy-mm-dd", thu (0 = Chu nhat), gio (so thap phan) } theo gio Viet Nam.
function phanVN(d) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "numeric", minute: "numeric", hourCycle: "h23" })
      .formatToParts(d)
      .map((x) => [x.type, x.value])
  );
  return { ngay: `${p.year}-${p.month}-${p.day}`, thu: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), gio: Number(p.hour) + Number(p.minute) / 60 };
}

const cuoiTuan = (thu) => thu === 0 || thu === 6;
// "yyyy-mm-dd" lui ve ngay lam viec gan nhat TRUOC do (bo T7, CN).
function luiNgayLamViec(ngay) {
  const d = new Date(`${ngay}T00:00:00Z`);
  do d.setUTCDate(d.getUTCDate() - 1);
  while (cuoiTuan(d.getUTCDay()));
  return d.toISOString().slice(0, 10);
}

// Phien giao dich cua 1 thoi diem cap nhat du lieu: day len vao T7 / CN thi tinh la phien thu 6 truoc do.
export function phienCuaThoiDiem(luc) {
  const p = phanVN(new Date(luc));
  return cuoiTuan(p.thu) ? luiNgayLamViec(p.ngay) : p.ngay;
}

// Phien GAN NHAT DA DONG CUA tai thoi diem bayGio: ngay lam viec hom nay neu da qua GIO_DONG_CUA, khong thi ngay lam viec truoc do.
export function phienGanNhatDaDong(bayGio = new Date()) {
  const p = phanVN(bayGio);
  if (!cuoiTuan(p.thu) && p.gio >= GIO_DONG_CUA) return p.ngay;
  return luiNgayLamViec(p.ngay);
}

// Du lieu co "cu" khong: chua co du lieu cua phien gan nhat da dong cua. Tra ve { cu, phienMongDoi } (phienMongDoi = "yyyy-mm-dd").
export function kiemTraDuLieuCu(luc, bayGio = new Date()) {
  const t = new Date(luc);
  if (Number.isNaN(t.getTime())) return { cu: false, phienMongDoi: null };
  const phienMongDoi = phienGanNhatDaDong(bayGio);
  return { cu: phienCuaThoiDiem(t) < phienMongDoi, phienMongDoi };
}
