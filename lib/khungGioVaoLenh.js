// Ham THUAN, KHONG dung DB - dung chung giua components/DongHoGiaoDich.js (dong ho chi tiet,
// co dem nguoc) va components/KhungGioContext.js (chi can 1 gia tri boolean cho SignalPill mo/sang).
// Doi khung gio: sua o day la ap dung ca 2 noi.
export const KHUNG_VAO_LENH = [
  { tu: 10 * 60 + 30, den: 11 * 60 + 30 },
  { tu: 14 * 60, den: 14 * 60 + 45 },
];

function layPhutVN(d) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const lay = (loai) => parts.find((p) => p.type === loai)?.value;
  return { thu: lay("weekday"), phut: (Number(lay("hour")) % 24) * 60 + Number(lay("minute")) };
}

// Dang o trong 1 trong cac khung gio duoc phep vao lenh MUA (T2-T6, gio Viet Nam) hay khong.
export function dangTrongKhungVaoLenh(d = new Date()) {
  const { thu, phut } = layPhutVN(d);
  if (thu === "Sat" || thu === "Sun") return false;
  return KHUNG_VAO_LENH.some((k) => phut >= k.tu && phut < k.den);
}
