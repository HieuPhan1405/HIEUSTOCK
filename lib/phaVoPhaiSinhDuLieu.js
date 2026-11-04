// Ghep du lieu cho trang /phai-sinh: lay nen 1 phut VN30F1M roi tinh trang thai 2 kieu pha vo (lib/phaVoPhaiSinh.js). Chi dung o may chu.
import { layNenPhutPhaiSinh } from "@/lib/lichSuGia";
import lichSuTinh from "@/lib/phaiSinhLichSuTinh.json";
import { tachPhien, bienDoPhien, tinhBienDong, tinhKhoangMoCua, laPhienDauHopDong, vungGiaTriPhien, viTriVungGiaTri, K_CUOI } from "@/lib/phaVoPhaiSinh";

const ngayVN = (ms) => new Date(ms + 7 * 3600e3).toISOString().slice(0, 10);

// Thoi diem hien tai nam o dau trong phien cua ngay dang xem -> { pha, kXong (phut cuoi cung DA dong cua xong) }
function viTriHienTai(ngayXem, bayGioMs) {
  const homNay = ngayVN(bayGioMs);
  if (ngayXem < homNay) return { pha: "ngayCu", kXong: K_CUOI };
  if (ngayXem > homNay) return { pha: "truocPhien", kXong: -1 };
  const d = new Date(bayGioMs + 7 * 3600e3);
  const ph = d.getUTCHours() * 60 + d.getUTCMinutes();
  if (ph < 540) return { pha: "truocPhien", kXong: -1 };
  if (ph <= 690) return { pha: "trongPhien", kXong: ph - 540 - 1 };
  if (ph < 780) return { pha: "nghiTrua", kXong: 150 };
  if (ph <= 869) return { pha: "trongPhien", kXong: 151 + ph - 780 - 1 };
  return { pha: "sauPhien", kXong: K_CUOI };
}

// Trang thai cua 1 ngay (mac dinh: phien moi nhat co du lieu, hoac hom nay neu chua mo cua).
export async function layTrangThaiPhaVo({ ngay = null, bayGioMs = Date.now() } = {}) {
  const homNay = ngayVN(bayGioMs);
  const xemLai = !!ngay && ngay < homNay;
  const denGiay = xemLai ? Math.floor(Date.parse(`${ngay}T15:00:00+07:00`) / 1000) : null;
  const nen = await layNenPhutPhaiSinh({ soNgay: 7, denGiay });
  const P = tachPhien(nen);
  const dsNgay = [...P.keys()].sort();
  if (!dsNgay.length) throw new Error("Chưa lấy được dữ liệu hợp đồng tương lai.");
  // ngay dang xem: ngay duoc yeu cau; khong thi hom nay neu la ngay trong tuan, con lai la phien gan nhat
  const thu = new Date(Date.parse(`${homNay}T00:00:00Z`)).getUTCDay();
  const ngayXem = xemLai ? ngay : P.has(homNay) || (thu >= 1 && thu <= 5 && viTriHienTai(homNay, bayGioMs).pha === "truocPhien") ? homNay : dsNgay[dsNgay.length - 1];
  const truoc = dsNgay.filter((d) => d < ngayXem);
  const ngayTruoc = truoc.length ? truoc[truoc.length - 1] : null;
  const bdTruoc = ngayTruoc ? bienDoPhien(P.get(ngayTruoc)) : null;
  const p = P.get(ngayXem) || null;
  const { pha, kXong } = viTriHienTai(ngayXem, bayGioMs);
  const dauHD = laPhienDauHopDong(ngayTruoc, ngayXem);
  const bienDong = bdTruoc ? tinhBienDong(p, bdTruoc.bienDo) : { trangThai: "chuaMoCua" };
  const khoangMoCua = tinhKhoangMoCua(p, { kXong: pha === "ngayCu" ? null : kXong });
  // Vung gia tri phien truoc (chi de theo doi; phien dau hop dong moi thi bo vi la gia cua hop dong cu)
  const vung = ngayTruoc && !dauHD ? vungGiaTriPhien(P.get(ngayTruoc)) : null;
  if (vung) {
    if (bienDong.mucMua != null) Object.assign(bienDong, { viTriMua: viTriVungGiaTri(bienDong.mucMua, 1, vung), viTriBan: viTriVungGiaTri(bienDong.mucBan, -1, vung) });
    for (const x of [bienDong, khoangMoCua]) if (x.phia) x.viTriVao = viTriVungGiaTri(x.vao.gia, x.phia, vung);
  }
  const nenHomNay = [];
  if (p) for (let k = 0; k <= p.kCuoi; k++) nenHomNay.push([k, p.o[k], p.h[k], p.l[k], p.c[k], p.v[k]]);
  return {
    ngay: ngayXem,
    homNay,
    pha,
    ngayTruoc,
    phienTruoc: bdTruoc,
    phienDauHopDong: dauHD,
    vungGiaTriTruoc: vung,
    giaHienTai: p ? p.c[p.kCuoi] : null,
    kCuoi: p ? p.kCuoi : -1,
    atc: p ? p.atc : null,
    bienDong,
    khoangMoCua,
    nen: nenHomNay,
    capNhatLuc: new Date(bayGioMs).toISOString(),
  };
}

// LICH SU DAI cua cach PHA VO BIEN DONG 0,3 (tu 2024): ban chup lib/phaiSinhLichSuTinh.json (engine/dich-vu/taoLichSuPhaiSinhWeb.mjs, cung logic) ghep voi ~30 phien gan nhat lay truc tiep tu DNSE.
// Tra ve { tu, capNhatTinh, thieu: { tu, den } | null (khoang chua co du lieu neu ban chup da cu), hang: [{ ngay, dauHD?, dangChay?, phia?, vao, gioVao, ra, gioRa, lyDo, diemSauPhi, viTri }] } (cu -> moi).
export async function layLichSuDai({ bayGioMs = Date.now() } = {}) {
  let live = [];
  try {
    live = (await layLichSuPhaVo({ soPhien: 40, bayGioMs })).reverse();
  } catch {
    live = [];
  }
  const gon = (r) => {
    const x = r.bienDong;
    const ra = { ngay: r.ngay };
    if (r.phienDauHopDong) ra.dauHD = 1;
    if (r.dangChay) ra.dangChay = 1;
    if (x && x.phia) Object.assign(ra, { phia: x.phia, vao: x.vao, gioVao: x.gioVao, ra: x.ra, gioRa: x.gioRa, lyDo: x.lyDo, diemSauPhi: Math.round(x.diemSauPhi * 100) / 100, viTri: x.viTri });
    return ra;
  };
  const dauLive = live.length ? live[0].ngay : null;
  const tinh = lichSuTinh.hang.filter((r) => !dauLive || r.ngay < dauLive);
  const cuoiTinh = tinh.length ? tinh[tinh.length - 1].ngay : null;
  // ho: ban chup ket thuc truoc phien dau cua nguon truc tiep hon 5 ngay lich (>1 tuan nghi + cuoi tuan) -> bao thieu
  let thieu = null;
  if (dauLive && cuoiTinh) {
    const kc = (Date.parse(dauLive) - Date.parse(cuoiTinh)) / 86400e3;
    if (kc > 5) thieu = { tu: cuoiTinh, den: dauLive };
  }
  return { tu: lichSuTinh.tu, capNhatTinh: lichSuTinh.den, thieu, hang: [...tinh, ...live.map(gon)] };
}

// Ket qua 2 kieu cua soPhien phien gan nhat (ca phien dang chay neu co) - de doi chieu khi chay thu.
export async function layLichSuPhaVo({ soPhien = 20, bayGioMs = Date.now() } = {}) {
  const nen = await layNenPhutPhaiSinh({ soNgay: 45 });
  const P = tachPhien(nen);
  const ds = [...P.keys()].sort();
  const homNay = ngayVN(bayGioMs);
  const ra = [];
  for (let i = Math.max(1, ds.length - soPhien); i < ds.length; i++) {
    const p = P.get(ds[i]);
    const bd = bienDoPhien(P.get(ds[i - 1]));
    const dangChay = ds[i] === homNay && viTriHienTai(homNay, bayGioMs).pha !== "sauPhien";
    const dauHD = laPhienDauHopDong(ds[i - 1], ds[i]);
    const vung = dauHD ? null : vungGiaTriPhien(P.get(ds[i - 1]));
    const gon = (x) => (x && x.phia ? { phia: x.phia, vao: x.vao.gia, gioVao: x.vao.gio, ra: x.ra ? x.ra.gia : null, gioRa: x.ra ? x.ra.gio : null, lyDo: x.trangThai, diem: x.diem, diemSauPhi: x.diemSauPhi, viTri: viTriVungGiaTri(x.vao.gia, x.phia, vung) } : { phia: 0, lyDo: x ? x.trangThai : "chuaMoCua" });
    ra.push({ ngay: ds[i], dangChay, phienDauHopDong: dauHD, bienDoTruoc: bd ? bd.bienDo : null, bienDong: gon(bd ? tinhBienDong(p, bd.bienDo) : null), khoangMoCua: gon(tinhKhoangMoCua(p)) });
  }
  return ra.reverse();
}
