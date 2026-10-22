// Loc / thong ke LICH SU DIEM MUA PHUC HOI (trang /mua-phuc-hoi). Ham THUAN (khong import "@/") de test tay: engine/test/locDiemB.test.mjs.
const coSo = (v) => typeof v === "number" && Number.isFinite(v);
const boDau = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase();

export const DAI_GIAM = [
  { k: "tat_ca", nhan: "Mọi mức giảm" },
  { k: "20_30", nhan: "Giảm 20–30% (khuyến nghị)" },
  { k: "tu_20", nhan: "Giảm từ 20%" },
  { k: "15_20", nhan: "Giảm 15–20% (yếu)" },
];
export const KHOANG_PHIEN = [
  { k: "hom_nay", nhan: "Phiên mới nhất", phien: 1 },
  { k: "3", nhan: "3 phiên", phien: 3 },
  { k: "10", nhan: "10 phiên", phien: 10 },
  { k: "30", nhan: "30 phiên", phien: 30 },
  { k: "nam", nhan: "Từ đầu 2026", phien: Infinity },
];

// Ket qua cua 1 diem B: dua tren lai 10 phien sau khi vao (mo cua phien ke tiep) - chua du 10 phien = dang theo doi.
export function ketQuaDiemB(row) {
  if (!coSo(row?.pct_sau_10)) return { nhan: "Đang theo dõi", loai: "cho" };
  return row.pct_sau_10 > 0 ? { nhan: "Thành công", loai: "tot" } : { nhan: "Thất bại", loai: "xau" };
}

// Ngay (chuoi YYYY-MM-DD) cua phien thu `phien` ke tu moi nhat (1 = moi nhat), dua tren cac ngay co trong du lieu.
export function ngayBatDauKhoang(ds, phien) {
  if (!Number.isFinite(phien)) return null;
  const ngay = [...new Set(ds.map((r) => String(r.ngay).slice(0, 10)))].sort().reverse();
  return ngay[Math.min(phien, ngay.length) - 1] ?? null;
}

// DAC TRUNG NGANH (nghienCuuDiemBTheoNganh.mjs, 21/10/2026): "ca nganh cung hoi" = so ma KHAC cung nganh co diem B trong 7 NGAY LICH (~5 phien) truoc / dung ngay B (ng_so_ma); "manh nganh" = ma giam nhieu hon trung vi cac diem B cung nganh trong cung cua so (>= 3 diem, trung vi >= 10%).
// Lich su: cang nhieu ma cung nganh co diem B thi ket qua cang tot (>= 1 ma: +0,4% / 10 phien tu 2022.5 so voi -0,9%; >= 2 ma: +0,6% / -0,7%; >= 3 ma: +0,7% / -0,5%; trong bo loc khuyen nghi >= 1 ma +5,3% so voi +2,1%). Nam 2026 chua phan biet duoc. Chi tinh tren du lieu diem B dang co (cac ma GTGD >= 3 ty).
export const nganhGop = (nganh) => {
  const n = boDau(nganh);
  return n.includes("khu cong nghiep") ? "bat dong san" : n;
};
const SO_NGAY_NGANH = 7;
const soNgay = (iso) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 86400000;
export function ganDacTrungNganh(ds) {
  const theoNganh = new Map(); // nganh -> mang { ma, d (so ngay), giam }
  for (const r of ds) {
    const ng = nganhGop(r.nganh);
    if (!ng) continue;
    (theoNganh.get(ng) ?? theoNganh.set(ng, []).get(ng)).push({ ma: r.ma, d: soNgay(String(r.ngay).slice(0, 10)), giam: r.giam });
  }
  return ds.map((r) => {
    const ng = nganhGop(r.nganh);
    const d = soNgay(String(r.ngay).slice(0, 10));
    const cungCuaSo = (theoNganh.get(ng) ?? []).filter((x) => x.d >= d - SO_NGAY_NGANH && x.d <= d);
    const khac = new Set(cungCuaSo.filter((x) => x.ma !== r.ma).map((x) => x.ma));
    const g = cungCuaSo.map((x) => x.giam).filter(coSo).sort((a, b) => a - b);
    const trungVi = g.length ? g[Math.floor(g.length / 2)] : null;
    return { ...r, ng_so_ma: khac.size, ng_manh: g.length >= 3 && trungVi >= 10 && coSo(r.giam) && r.giam > trungVi };
  });
}

export const LOC_MAC_DINH = { cungNganh: 0, manhNganh: false, tuKhoa: "", nganh: "", dai: "tat_ca", klDay: false, vniYeu: false, chuaMuaThuong: false, ganGiaB: false, khoang: "nam", chiThanhCong: false };

// BO LOC KHUYEN NGHI (Hieu 2026-10-21): giam tu 20% + KL day >= 2x + thi truong yeu luc do. Lich su tu dau 2026: 19 diem, lai TB 10 phien +5,98% (thang 69%), 20 phien +4,57%; cac nhom con lai gan nhu hoa / am. Mau nho - chi tham khao.
export const LOC_KHUYEN_NGHI = { ...LOC_MAC_DINH, dai: "tu_20", klDay: true, vniYeu: true };
export const laKhuyenNghi = (r) => coSo(r?.giam) && r.giam >= 20 && coSo(r.kl_day) && r.kl_day >= 2 && r.vni_yeu === true;

export function locDiemB(ds, loc = LOC_MAC_DINH) {
  const l = { ...LOC_MAC_DINH, ...loc };
  const tuKhoa = l.tuKhoa.trim().toUpperCase();
  const tu = ngayBatDauKhoang(ds, (KHOANG_PHIEN.find((x) => x.k === l.khoang) ?? KHOANG_PHIEN[4]).phien);
  return ds.filter((r) => {
    if (tuKhoa && !String(r.ma).includes(tuKhoa)) return false;
    if (l.nganh && boDau(r.nganh) !== boDau(l.nganh)) return false;
    if (tu && String(r.ngay).slice(0, 10) < tu) return false;
    const g = r.giam;
    if (l.dai === "20_30" && !(coSo(g) && g >= 20 && g < 30)) return false;
    if (l.dai === "tu_20" && !(coSo(g) && g >= 20)) return false;
    if (l.dai === "15_20" && !(coSo(g) && g >= 15 && g < 20)) return false;
    if (l.klDay && !(coSo(r.kl_day) && r.kl_day >= 2)) return false;
    if (l.cungNganh > 0 && !(r.ng_so_ma >= l.cungNganh)) return false;
    if (l.manhNganh && r.ng_manh !== true) return false;
    if (l.vniYeu && r.vni_yeu !== true) return false;
    if (l.chuaMuaThuong && r.co_mua_thuong_truoc === true) return false;
    // con gan gia B: gia hien tai khong cao hon gia vao qua 5% va chua thung cat lo
    if (l.ganGiaB && !(coSo(r.gia_hien_tai) && coSo(r.gia_vao) && r.gia_hien_tai <= r.gia_vao * 1.05 && (!coSo(r.sl) || r.gia_hien_tai > r.sl))) return false;
    if (l.chiThanhCong && ketQuaDiemB(r).loai !== "tot") return false;
    return true;
  });
}

const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
export function thongKeDiemB(ds) {
  const k10 = ds.map((r) => r.pct_sau_10).filter(coSo), k20 = ds.map((r) => r.pct_sau_20).filter(coSo);
  return {
    n: ds.length,
    n10: k10.length, tb10: tb(k10), thang10: k10.length ? (k10.filter((x) => x > 0).length / k10.length) * 100 : null,
    n20: k20.length, tb20: tb(k20), thang20: k20.length ? (k20.filter((x) => x > 0).length / k20.length) * 100 : null,
  };
}

export function danhSachNganh(ds) {
  return [...new Set(ds.map((r) => r.nganh).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
}
