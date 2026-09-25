import { ngayChuoi } from "./muaThemTinhToan.js";

const dangGiu = (t) => t === "MUA" || t === "NAM GIU";

// HIEU QUA DAU TU (ty suat sinh loi theo thoi gian - TWR) cua danh sach "lat cat" lenh so voi VN-Index - ham THUAN (khong dung DB/mang, import
// tuong doi) de test tay bang node (engine/test/tinhHieuQua.test.mjs) va dung o lib/hieuQuaDauTu.js.
//
// Moi "lat cat" (slice) la 1 phan vi the co gia vao/ra rieng: { ma, ngayVao, giaVao, ngayRa | null (dang giu), giaRa | null, trongSo (1 = 1 lenh day du) }.
// Moi ngay, ty suat sinh loi cua danh muc = TRUNG BINH CO TRONG SO ty suat trong ngay cua cac lat cat dang giu (danh muc can bang lai deu moi ngay, tien
// nhan roi lai 0%) - roi noi cac ngay lai thanh duong luy ke. Cach nay khong phu thuoc so lenh dang mo nhieu hay it nen so sanh duoc voi VN-Index.
//   - Ngay vao lenh: dong cua hom do / gia vao - 1.
//   - Cac ngay giua: gia dong cua DIEU CHINH (adClose) hom nay / hom truoc - 1 (tranh nhay gia gia tao khi chia co tuc/thuong).
//   - Ngay ra lenh: gia ra / gia dong hom truoc - 1 (vao va ra cung ngay: gia ra / gia vao - 1).

// ngay: mang ngay giao dich tang dan ["yyyy-mm-dd", ...], ngay[0] la MOC GOC (luy ke = 0%).
// giaTheoNgay: mang song song voi ngay, moi phan tu la Map(ma -> { close, adClose }) (co the thieu ma = khong co gia hom do).
// vn: mang gia dong VN-Index song song voi ngay.
// Tra ve { ngay, tssl: [% luy ke], vn: [% luy ke], soHoatDong: [so lat cat dang giu moi ngay] }.
export function tinhHieuQua({ slices, ngay, giaTheoNgay, vn }) {
  const N = ngay.length;
  const tssl = new Array(N).fill(0);
  const soHoatDong = new Array(N).fill(0);
  const gia = (k, ma) => giaTheoNgay[k]?.get(ma) ?? null;

  // Chi so ngay dau tien >= d (hoac N neu khong co) va ngay cuoi cung <= d (hoac -1 neu khong co).
  const dauTu = (d) => {
    for (let i = 0; i < N; i++) if (ngay[i] >= d) return i;
    return N;
  };
  const cuoiDen = (d) => {
    for (let i = N - 1; i >= 0; i--) if (ngay[i] <= d) return i;
    return -1;
  };

  const chuan = slices
    .filter((s) => s.trongSo > 0 && s.giaVao > 0 && s.ngayVao)
    .map((s) => {
      const dong = s.ngayRa != null && s.giaRa > 0;
      return { ...s, iVao: dauTu(s.ngayVao), iRa: dong ? cuoiDen(s.ngayRa) : N - 1, dong };
    })
    .filter((s) => s.iVao < N && s.iRa >= 0 && s.iRa >= s.iVao);

  let luyKe = 1;
  for (let k = 1; k < N; k++) {
    let tuSo = 0;
    let mauSo = 0;
    for (const s of chuan) {
      if (k < Math.max(s.iVao, 1) || k > s.iRa) continue;
      const giaK = gia(k, s.ma);
      const laNgayVao = k === s.iVao && s.ngayVao >= ngay[0]; // vao lenh trong cua so (lenh cu hon cua so bat dau tu ngay 1 bang ty le gia)
      const laNgayRa = s.dong && k === s.iRa;
      let r = 0;
      if (laNgayVao && laNgayRa) r = s.giaRa / s.giaVao - 1;
      else if (laNgayVao) r = giaK?.close > 0 ? giaK.close / s.giaVao - 1 : 0;
      else if (laNgayRa) {
        const truoc = gia(k - 1, s.ma);
        r = truoc?.close > 0 ? s.giaRa / truoc.close - 1 : 0;
      } else {
        const truoc = gia(k - 1, s.ma);
        r = giaK?.adClose > 0 && truoc?.adClose > 0 ? giaK.adClose / truoc.adClose - 1 : 0;
      }
      tuSo += s.trongSo * r;
      mauSo += s.trongSo;
      soHoatDong[k]++;
    }
    luyKe *= 1 + (mauSo > 0 ? tuSo / mauSo : 0);
    tssl[k] = (luyKe - 1) * 100;
  }

  return { ngay, tssl, vn: vn.map((v) => (vn[0] > 0 && v > 0 ? (v / vn[0] - 1) * 100 : 0)), soHoatDong };
}

// Ty suat "buoc cua so": bat dau tu chi so s, ve 0% tai s (noi luy ke: (1 + x_k) / (1 + x_s) - 1) - dung cho cac tab 1M/3M/6M/1Y/YTD.
export function cuaSoLuyKe(luyKePct, s) {
  const goc = 1 + (luyKePct[s] ?? 0) / 100;
  return luyKePct.map((x, k) => (k < s ? null : ((1 + x / 100) / goc - 1) * 100));
}

// Chi so bat dau cua tung tab, tinh tren mang ngay giao dich tang dan: 1M ~ 21 phien, 3M ~ 63, 6M ~ 126, 1Y ~ 252, YTD = ngay dau tien cua nam cua ngay cuoi.
export function chiSoBatDauCuaSo(ngay, tab) {
  const cuoi = ngay.length - 1;
  if (cuoi < 1) return 0;
  const soPhien = { "1M": 21, "3M": 63, "6M": 126, "1Y": 252 }[tab];
  if (soPhien) return Math.max(0, cuoi - soPhien);
  if (tab === "YTD") {
    const nam = ngay[cuoi].slice(0, 4);
    const i = ngay.findIndex((d) => d.startsWith(nam));
    return i > 0 ? i - 1 : 0; // lay phien cuoi nam truoc lam moc (neu co) de ngay dau nam cung tinh
  }
  return 0;
}

const laDongChotLoi = (x) => /^TP[123]$/.test(x.ly_do ?? "");
const trongSoDong = (x) => (Number(x.phan_chot_pct) > 0 ? Number(x.phan_chot_pct) : 100) / 100;

// Cac "lat cat" (phan vi the co gia vao/ra rieng) tu lenh da dong + lenh dang mo. dongDa: rows lenh_da_dong; dangMo: rows tin_hieu (chuan hoa).
// - Moi dong da dong la 1 lat cat co trong so = phan_chot_pct / 100. Ty suat cua lat cat lay tu lai_lo_pct (dong TP3 kieu cu gop 85% ghi lai/lo tren
//   TOAN vi the nen chia lai cho trong so) - qui ve GIA RA HIEU DUNG = gia vao x (1 + ty suat), de lenh cu tinh gop TP1/TP2 van ra dung tong lai.
// - Lenh dang mo: phan CON LAI = 100% tru cac dong chot loi (TP1/TP2/TP3) da ghi cho dung lenh do; them cac lo "Mua them" dang giu (moi lo 1 don vi).
export function cacLatCat(dongDa, dangMo) {
  const slices = [];
  for (const x of dongDa) {
    const giaVao = Number(x.gia_mua);
    if (!(giaVao > 0) || !x.ngay_mua || !x.ngay_ban) continue;
    const w = trongSoDong(x);
    let ty = Number(x.lai_lo_pct);
    if (!Number.isFinite(ty)) ty = (Number(x.gia_ban) / giaVao - 1) * 100;
    else if (x.ly_do === "TP3" && w >= 0.5) ty /= w;
    const giaRa = giaVao * (1 + ty / 100);
    if (!(giaRa > 0)) continue;
    slices.push({ ma: x.ma, ngayVao: x.ngay_mua, giaVao, ngayRa: x.ngay_ban, giaRa, trongSo: w });
  }

  const daChot = new Map(); // "MA|ngay_mua" -> tong % da chot theo chot loi tung phan cua lenh goc
  for (const x of dongDa) {
    if (!laDongChotLoi(x) || ![1, 5, 6].includes(Number(x.vong ?? 1))) continue;
    const k = `${x.ma}|${x.ngay_mua}`;
    daChot.set(k, (daChot.get(k) ?? 0) + (Number(x.phan_chot_pct) > 0 ? Number(x.phan_chot_pct) : 0));
  }

  for (const r of dangMo) {
    if (!dangGiu(r.tin)) continue;
    const ngayVao = ngayChuoi(r.ngay_mua);
    const giaVao = Number(r.gia_mua);
    const w = Math.max(0, 1 - (daChot.get(`${r.ma}|${ngayVao}`) ?? 0) / 100);
    if (giaVao > 0 && ngayVao && w > 0) slices.push({ ma: r.ma, ngayVao, giaVao, ngayRa: null, giaRa: null, trongSo: w });
    for (const vong of ["moi", "giua"]) {
      const giaLo = Number(r[`gia_mua_${vong}`]);
      const ngayLo = ngayChuoi(r[`ngay_mua_${vong}`]);
      if (r[`dang_giu_${vong}`] === true && giaLo > 0 && ngayLo) slices.push({ ma: r.ma, ngayVao: ngayLo, giaVao: giaLo, ngayRa: null, giaRa: null, trongSo: 1 });
    }
  }
  return slices;
}

