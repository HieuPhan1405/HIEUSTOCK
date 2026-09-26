// THONG KE LENH DA DONG THEO TUNG LENH (ham THUAN, khong dung DB - import tuong doi de test tay bang node: engine/test/thongKeLenh.test.mjs).
//
// Bang lenh_da_dong ghi theo TUNG PHAN: 1 lenh chot 30/30/40 co toi 3 dong (TP1, TP2, TP3), lenh cat lo sau khi chot TP1 co 2 dong (TP1 + phan con lai)...
// Neu dem moi dong la 1 lenh thi ty le thang bi keo len rat cao (moi lan chot loi la 1 "lenh thang"). O day gom cac dong CUNG 1 LENH lai (ma + ngay mua + loai lenh:
// lenh goc / mua them sau TP3 / mua them giua chung) va chi tinh MOT LAN khi lenh DA DONG HAN, voi ket qua = tong cac phan theo ty trong.
const laDongTP = (ly) => /^TP[123]$/.test(ly ?? "");
export const trongSo = (x) => (Number(x.phan_chot_pct) > 0 ? Number(x.phan_chot_pct) : 100) / 100;
// Loai lenh cua 1 dong: vong 2 = mua them sau TP3, vong 4 = mua them giua chung, con lai (1, 3, 5, 6) = lenh goc (TP1/TP2/TP3/phan con lai cung 1 lenh).
export const loaiLenh = (x) => (x.vong === 2 ? "moi" : x.vong === 4 ? "giua" : "goc");

// Phan DONG GOP cua 1 dong vao ket qua CA VI THE (don vi %): dong chot tung phan ghi lai/lo cua RIENG phan do (gia chot so voi gia mua) nen nhan trong so;
// dong TP3 kieu gop (85% cach cu hoac 100% vi the cu da cham TP1/TP2 truoc) va dong dong lenh kieu cu (khong co phan_chot_pct) da ghi san lai/lo tinh tren
// TOAN vi the nen giu nguyen (xem tinhChotTP3 trong lenhDaDong.js, giong lib/tinhHieuQua.js).
export function dongGop(x) {
  const lai = Number(x.lai_lo_pct);
  if (!Number.isFinite(lai)) return null;
  const w = trongSo(x);
  return x.ly_do === "TP3" && w >= 0.5 ? lai : lai * w;
}

// Dong nay co KET THUC lenh khong? Dong dong that su (BAN / cat lo / thoat / thoat Kijun / chot du TP3 du phong) luon ket thuc. Dong TP3 chi co o lenh CU (30/30/25: da chot 85%,
// con 15% chay - coi nhu ket thuc o TP3, ket qua tinh tren phan da chot, chuan hoa theo trong so) va cach "ket thuc o TP3" (40% / gop 100%). Chi dong TP1, TP2 (lenh con phan
// giu den tin hieu BAN) moi chua ket thuc.
function ketThucLenh(x) {
  return !laDongTP(x.ly_do) || x.ly_do === "TP3";
}

// Gom cac dong thanh tung lenh: [{ khoa, ma, loai, ngayMua, soDong, daDong, ketQuaPct, soPhien }]. ketQuaPct = tong dong gop / tong trong so (= lai/lo cua ca vi the khi du 100%;
// khi thieu 1 phan - vd nguoi xem chi tinh tu ngay tham gia - la lai/lo cua phan ho tham gia).
export function gomTheoLenh(ds) {
  const nhom = new Map();
  for (const x of ds) {
    const khoa = `${x.ma}|${x.ngay_mua}|${loaiLenh(x)}`;
    if (!nhom.has(khoa)) nhom.set(khoa, { khoa, ma: x.ma, loai: loaiLenh(x), ngayMua: x.ngay_mua, soDong: 0, daDong: false, tongGop: 0, tongW: 0, soPhien: null });
    const n = nhom.get(khoa);
    n.soDong++;
    if (ketThucLenh(x)) n.daDong = true;
    const g = dongGop(x);
    if (g != null) {
      n.tongGop += g;
      n.tongW += trongSo(x);
    }
    if (x.so_phien != null && Number.isFinite(Number(x.so_phien))) n.soPhien = Math.max(n.soPhien ?? 0, Number(x.so_phien));
  }
  return [...nhom.values()].map((n) => ({ ...n, ketQuaPct: n.tongW > 0 ? n.tongGop / n.tongW : null }));
}

// Thong ke tong hop cho trang Lenh da dong: chi tinh cac lenh DA DONG HAN (moi lenh 1 lan). Cac lenh moi chot 1 phan (moi cham TP1/TP2, van con giu) dem rieng o
// soDangChotTungPhan.
export function thongKeLenhDaDong(ds) {
  const nhom = gomTheoLenh(ds);
  const dong = nhom.filter((n) => n.daDong && n.ketQuaPct != null);
  const thang = dong.filter((n) => n.ketQuaPct > 0);
  const thua = dong.filter((n) => n.ketQuaPct < 0);
  const tb = (a, f) => (a.length ? a.reduce((s, x) => s + f(x), 0) / a.length : null);
  return {
    soLenh: dong.length,
    soThang: thang.length,
    soThua: thua.length,
    tyLeThang: dong.length ? (thang.length / dong.length) * 100 : null,
    laiTB: tb(dong, (n) => n.ketQuaPct),
    laiTBThang: tb(thang, (n) => n.ketQuaPct),
    loTBThua: tb(thua, (n) => n.ketQuaPct),
    phienTB: tb(
      dong.filter((n) => n.soPhien != null),
      (n) => n.soPhien
    ),
    soDangChotTungPhan: nhom.filter((n) => !n.daDong).length,
    soDong: ds.length,
  };
}
