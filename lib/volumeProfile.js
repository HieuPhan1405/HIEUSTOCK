// VOLUME PROFILE (khoi luong theo muc gia) cho bieu do ky thuat - ham thuan, dung duoc ca o trinh duyet lan Node.
// Du lieu khong co tung lenh khop nen KL moi nen duoc CHIA DEU tren khoang [thap, cao] cua nen do. Nen cang nho (1 gio) thi cang sat that; da doi chieu 2026-10-14
// (engine/dich-vu/nghienCuuVP1H.mjs): ban tu nen ngay lech POC / VAH / VAL so voi ban nen 1 gio trung vi ~0,4%, 90% so truong hop lech duoi 1,4 - 2,6%.
// Thuat ngu: POC = muc gia co khoi luong nhieu nhat; vung gia tri (VA) = dai gia quanh POC chua tyLeGiaTri (70%) tong khoi luong; VAH / VAL = bien tren / duoi cua vung do.

const hopLe = (b) => b && b.v > 0 && b.l > 0 && b.h >= b.l;

// nen: [{ o, h, l, c, v }] (khung thoi gian bat ky). Tra ve null neu khong du du lieu.
export function tinhHoSoKhoiLuong(nen, { soHang = 70, tyLeGiaTri = 0.7 } = {}) {
  let thap = Infinity, cao = -Infinity, tong = 0;
  for (const b of nen || []) {
    if (!hopLe(b)) continue;
    if (b.l < thap) thap = b.l;
    if (b.h > cao) cao = b.h;
    tong += b.v;
  }
  if (!(tong > 0) || !(cao > thap)) return null;
  const n = Math.max(4, Math.floor(soHang));
  const buoc = (cao - thap) / n;
  const tang = new Array(n).fill(0);
  const giam = new Array(n).fill(0);
  for (const b of nen) {
    if (!hopLe(b)) continue;
    const mang = b.c >= b.o ? tang : giam;
    const x1 = (b.l - thap) / buoc;
    const x2 = (b.h - thap) / buoc;
    if (x2 - x1 < 1e-9) {
      mang[Math.min(n - 1, Math.floor(x1))] += b.v;
      continue;
    }
    for (let k = Math.floor(x1); k <= Math.min(n - 1, Math.floor(x2)); k++) {
      const phu = Math.min(x2, k + 1) - Math.max(x1, k);
      if (phu > 0) mang[k] += (b.v * phu) / (x2 - x1);
    }
  }
  const hang = tang.map((t, k) => ({ tu: thap + k * buoc, den: thap + (k + 1) * buoc, kl: t + giam[k], tang: t, giam: giam[k] }));
  let iPoc = 0;
  for (let k = 1; k < n; k++) if (hang[k].kl > hang[iPoc].kl) iPoc = k;
  // Vung gia tri: mo rong tu POC ve phia co khoi luong lon hon cho toi khi du tyLeGiaTri tong khoi luong.
  let iVal = iPoc, iVah = iPoc, s = hang[iPoc].kl;
  while (s < tyLeGiaTri * tong && (iVal > 0 || iVah < n - 1)) {
    const duoi = iVal > 0 ? hang[iVal - 1].kl : -1;
    const tren = iVah < n - 1 ? hang[iVah + 1].kl : -1;
    if (duoi >= tren) {
      iVal--;
      s += hang[iVal].kl;
    } else {
      iVah++;
      s += hang[iVah].kl;
    }
  }
  return { giaThap: thap, giaCao: cao, buoc, hang, tong, klLonNhat: hang[iPoc].kl, iPoc, iVal, iVah, poc: thap + (iPoc + 0.5) * buoc, vah: hang[iVah].den, val: hang[iVal].tu };
}

const ngayVN = (giay) => new Date((giay + 7 * 3600) * 1000).toISOString().slice(0, 10);
const congNgay = (ngay, k) => new Date(Date.parse(`${ngay}T00:00:00Z`) + k * 86400e3).toISOString().slice(0, 10);

// Chuan bi nen 1 gio lay tu /api/gia-gio ([[t, o, h, l, c, v], ...], t = giay Unix) thanh [{ ngay, o, h, l, c, v }] tang dan.
export function chuanBiNenGio(mang) {
  if (!Array.isArray(mang)) return [];
  return mang
    .map((r) => ({ ngay: ngayVN(r[0]), t: r[0], o: r[1], h: r[2], l: r[3], c: r[4], v: r[5] }))
    .filter((b) => hopLe(b) && Number.isFinite(b.o) && Number.isFinite(b.c))
    .sort((a, b) => a.t - b.t);
}

// Chon nen de dung ho so cho khoang ngay [tuNgay, denNgay] (yyyy-mm-dd, tinh ca 2 dau):
//   - phan nam trong vung co nen 1 gio  -> dung nen 1 gio (sat that hon)
//   - phan con lai (truoc khi co nen gio) -> dung nen cua bieu do (ngay / tuan)
// nenBieuDo: [{ t: "yyyy-mm-dd", o, h, l, c, v }]; soNgayMoiNen: 1 (khung ngay) hoac 7 (khung tuan, t = ngay dau tuan).
// Khung ngay: gia nen gio duoc chuan hoa theo gia dong cua nen ngay cung ngay khi lech > 0,3% (phong khi 2 nguon dieu chinh co tuc khac thoi diem).
export function chonNenChoHoSo({ nenBieuDo, nenGio, tuNgay, denNgay, soNgayMoiNen = 1 }) {
  const ra = [];
  let soGio = 0, soBieuDo = 0;
  const coGio = Array.isArray(nenGio) && nenGio.length > 0;
  const ngayDauGio = coGio ? nenGio[0].ngay : null;
  for (const b of nenBieuDo || []) {
    const cuoi = soNgayMoiNen > 1 ? congNgay(b.t, soNgayMoiNen - 1) : b.t;
    if (cuoi < tuNgay || b.t > denNgay) continue;
    if (coGio && cuoi >= ngayDauGio) continue; // phan nay lay tu nen gio
    ra.push(b);
    soBieuDo++;
  }
  if (coGio && denNgay >= ngayDauGio) {
    const dongNgay = soNgayMoiNen === 1 ? new Map((nenBieuDo || []).map((b) => [b.t, b.c])) : null;
    const tu = tuNgay > ngayDauGio ? tuNgay : ngayDauGio;
    const dongGio = new Map();
    if (dongNgay) for (const b of nenGio) if (b.ngay >= tu && b.ngay <= denNgay) dongGio.set(b.ngay, b.c);
    for (const b of nenGio) {
      if (b.ngay < tu || b.ngay > denNgay) continue;
      let k = 1;
      if (dongNgay) {
        const d = dongNgay.get(b.ngay), g = dongGio.get(b.ngay);
        if (d > 0 && g > 0 && Math.abs(d / g - 1) > 0.003) k = d / g;
      }
      ra.push(k === 1 ? b : { ...b, o: b.o * k, h: b.h * k, l: b.l * k, c: b.c * k });
      soGio++;
    }
  }
  return { nen: ra, soGio, soBieuDo, nguon: soGio > 0 && soBieuDo === 0 ? "gio" : soGio > 0 ? "ghep" : "bieuDo" };
}
