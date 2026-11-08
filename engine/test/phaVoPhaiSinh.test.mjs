// Test tay cho lib/phaVoPhaiSinh.js. Chay: node engine/test/phaVoPhaiSinh.test.mjs
import { viTriPhut, gioCuaPhut, tachPhien, bienDoPhien, tinhBienDong, DIEM_CAT_LO_TOI_THIEU, catLoBanDau, DIEM_KICH_KHOA_LAI, DIEM_KHOA_LAI, thuNamTuanBa, laPhienDauHopDong, phiVong, vungGiaTriPhien, viTriVungGiaTri, K_CUOI, K_HET_GIO_VAO, SO_LENH_TOI_DA_NGAY } from "../../lib/phaVoPhaiSinh.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => a != null && b != null && Math.abs(a - b) < e;
const giay = (ngay, gio) => Math.floor(Date.parse(`${ngay}T${gio}:00+07:00`) / 1000);

// 1. Luoi thoi gian
ok("9:00 -> phut 0", viTriPhut(giay("2026-10-13", "09:00")).k === 0 && viTriPhut(giay("2026-10-13", "09:00")).ngay === "2026-10-13");
ok("11:30 -> phut 150", viTriPhut(giay("2026-10-13", "11:30")).k === 150);
ok("12:00 (nghi trua) -> ngoai phien", viTriPhut(giay("2026-10-13", "12:00")).k === -1);
ok("13:00 -> phut 151, 14:29 -> phut 240", viTriPhut(giay("2026-10-13", "13:00")).k === 151 && viTriPhut(giay("2026-10-13", "14:29")).k === 240);
ok("14:45 -> ATC (-2), 14:35 -> ngoai phien", viTriPhut(giay("2026-10-13", "14:45")).k === -2 && viTriPhut(giay("2026-10-13", "14:35")).k === -1);
ok("gioCuaPhut", gioCuaPhut(0) === "09:00" && gioCuaPhut(150) === "11:30" && gioCuaPhut(151) === "13:00" && gioCuaPhut(180) === "13:29" && gioCuaPhut(240) === "14:29");
ok("het gio vao = 13:30 (phut cuoi duoc vao la 13:28... chi so 179)", gioCuaPhut(K_HET_GIO_VAO - 1) === "13:28");

// Dung 1 phien gia: mang gia dong cua theo phut; cao = thap = dong cua tru khi chi dinh
function phien(ngay, gia, tuyChinh = {}) {
  const nen = [];
  for (let k = 0; k < gia.length; k++) {
    if (gia[k] == null) continue;
    const ph = k <= 150 ? 540 + k : 780 + k - 151;
    const t = giay(ngay, `${String(Math.floor(ph / 60)).padStart(2, "0")}:${String(ph % 60).padStart(2, "0")}`);
    const x = tuyChinh[k] || {};
    const o = x.o ?? (k > 0 && gia[k - 1] != null ? gia[k - 1] : gia[k]);
    nen.push([t, o, x.h ?? Math.max(o, gia[k]), x.l ?? Math.min(o, gia[k]), gia[k], 100]);
  }
  return nen;
}
const phang = (n, g) => new Array(n).fill(g);

// 2. tachPhien: lap phut trong, ATC rieng
{
  const g = phang(241, 1000); g[5] = null; g[6] = null; g[7] = 1003;
  const nen = phien("2026-10-13", g); nen.push([giay("2026-10-13", "14:45"), 1001, 1001, 1001, 1001, 500]);
  const p = tachPhien(nen).get("2026-10-13");
  ok("phut trong duoc lap bang gia dong cua truoc", p.c[5] === 1000 && p.c[6] === 1000 && p.h[6] === 1000 && p.c[7] === 1003);
  ok("kCuoi = 240, ATC luu rieng", p.kCuoi === 240 && p.atc === 1001);
  const b = bienDoPhien(p); ok("bien do phien = cao - thap (khong tinh ATC)", gan(b.cao, 1003) && gan(b.thap, 1000) && gan(b.bienDo, 3));
}

// 3. Pha vo bien dong: bien do truoc 20, he so 0,3 -> muc mua = mo + 6, muc ban = mo - 6
{
  // gia tang dan cham 1006 o phut 10 roi giu den cuoi phien o 1010
  const g = phang(241, 1000); for (let k = 5; k <= 240; k++) g[k] = Math.min(1010, 1000 + (k - 4) * 1);
  const p = tachPhien(phien("2026-10-13", g)).get("2026-10-13");
  const r = tinhBienDong(p, 20);
  ok("muc mua / ban / cat lo du kien (mo cua, nhung cach muc vao >= 7 diem)", gan(r.mucMua, 1006) && gan(r.mucBan, 994) && gan(r.giaMoCua, 1000) && gan(r.catLoMua, 999) && gan(r.catLoBan, 1001));
  ok("cat lo cua lenh = cat lo du kien", gan(r.catLo, 999));
  ok("mua khi CHAM muc mua, khop dung tai muc", r.phia === 1 && gan(r.vao.gia, 1006) && r.vao.k === 10, JSON.stringify(r.vao));
  ok("khong bi cat lo -> dong cuoi phien 14:29 tai gia dong cua", r.trangThai === "cuoiPhien" && r.ra.k === K_CUOI && gan(r.ra.gia, 1010) && gan(r.diem, 4));
  ok("diem sau phi = diem - phi vong", gan(r.diemSauPhi, 4 - phiVong(1006)));
  // xem giua chung: moi co du lieu den phut 50
  const r2 = tinhBienDong(p, 20, { kDen: 50 });
  ok("giua phien: dang giu, lai tam tinh theo gia hien tai", r2.trangThai === "dangGiu" && r2.ra === null && gan(r2.diem, 1010 - 1006));
  const r3 = tinhBienDong(p, 20, { kDen: 8 });
  ok("chua cham muc: trang thai cho", r3.trangThai === "cho" && r3.phia === undefined);
}
{
  // ban khong roi bi cat lo: giam cham 994 o phut 20, sau do hoi len 1000 o phut 60
  const g = phang(241, 1000); for (let k = 15; k <= 20; k++) g[k] = 1000 - (k - 14); for (let k = 21; k <= 59; k++) g[k] = 995; for (let k = 60; k <= 240; k++) g[k] = 1001;
  const p = tachPhien(phien("2026-10-13", g)).get("2026-10-13");
  const r = tinhBienDong(p, 20);
  ok("ban khong khi cham muc ban", r.phia === -1 && gan(r.vao.gia, 994) && r.vao.k === 20);
  ok("cat lo: ban khong 994, cat lo = max(mo cua 1000, vao + 7 = 1001) = 1001", r.trangThai === "catLo" && r.ra.k === 60 && gan(r.catLo, 1001) && gan(r.ra.gia, 1001) && gan(r.diem, -7), JSON.stringify(r.ra));
}
{
  // nhay qua muc: phut 30 mo cua 1009 (cao hon muc mua 1006) -> khop tai gia mo cua phut do
  const g = phang(241, 1000); for (let k = 30; k <= 240; k++) g[k] = 1012;
  const p = tachPhien(phien("2026-10-13", g, { 30: { o: 1009, h: 1012, l: 1009 } })).get("2026-10-13");
  const r = tinhBienDong(p, 20);
  ok("gia nhay qua muc -> khop tai gia mo cua cua phut do", r.phia === 1 && gan(r.vao.gia, 1009));
}
{
  // cham muc SAU 13:30 -> khong vao
  const g = phang(241, 1000); for (let k = 185; k <= 240; k++) g[k] = 1010;
  const p = tachPhien(phien("2026-10-13", g)).get("2026-10-13");
  const r = tinhBienDong(p, 20);
  ok("cham muc sau 13:30 -> khong khop", r.trangThai === "khongKhop" && r.phia === undefined);
  ok("chua mo cua / thieu bien do truoc", tinhBienDong(null, 20).trangThai === "chuaMoCua" && tinhBienDong(p, 0).trangThai === "chuaMoCua");
}

// 4. Doi cat lo khi lai 7 diem (05/11/2026): cat lo ban dau o gia mo cua; lai >= 7 diem thi cat lo len gia vao + 2
{
  ok("hang so: kich 7 diem, khoa +2 diem", DIEM_KICH_KHOA_LAI === 7 && DIEM_KHOA_LAI === 2);
  // MUA 1006 (bien do truoc 20); gia len 1014 (lai +8) o phut 30 roi ve 1000 o phut 60 -> thoat o 1008 (vao + 2), khong phai 1000
  const g = phang(241, 1000); for (let k = 5; k <= 10; k++) g[k] = 1000 + (k - 4); for (let k = 11; k <= 29; k++) g[k] = 1006; g[30] = 1014; for (let k = 31; k <= 59; k++) g[k] = 1012; for (let k = 60; k <= 240; k++) g[k] = 1000;
  const p = tachPhien(phien("2026-10-13", g)).get("2026-10-13");
  const r = tinhBienDong(p, 20);
  ok("lai +8 -> thoat tai gia vao + 2 (khoaLai), +2 diem truoc phi", r.trangThai === "khoaLai" && gan(r.ra.gia, 1008) && r.ra.k === 60 && gan(r.diem, 2), JSON.stringify(r.ra));
  ok("diem sau phi = +2 tru phi vong", gan(r.diemSauPhi, 2 - phiVong(1006)));
  ok("co muc kich (vao + 7) va muc khoa (vao + 2)", gan(r.mucKich, 1013) && gan(r.mucKhoa, 1008) && r.daKhoa === true && gan(r.catLoHienTai, 1008));
  // dang giu giua phien (den phut 45): cat lo da doi, lai tam tinh
  const r2 = tinhBienDong(p, 20, { kDen: 45 });
  ok("giua phien: dang giu, cat lo hien tai = 1008", r2.trangThai === "dangGiu" && r2.daKhoa === true && gan(r2.catLoHienTai, 1008) && r2.ra === null);
  // chi lai +6 (chua du 7) roi quay ve 998 -> thoat o cat lo ban dau 999 (vao - 7), -7 diem
  const h = phang(241, 1000); for (let k = 5; k <= 10; k++) h[k] = 1000 + (k - 4); for (let k = 11; k <= 29; k++) h[k] = 1006; h[30] = 1012; for (let k = 31; k <= 59; k++) h[k] = 1010; for (let k = 60; k <= 240; k++) h[k] = 998;
  const r3 = tinhBienDong(tachPhien(phien("2026-10-13", h)).get("2026-10-13"), 20);
  ok("chi lai +6 roi quay ve -> cat lo ban dau 999, -7 diem", r3.trangThai === "catLo" && gan(r3.ra.gia, 999) && gan(r3.diem, -7) && r3.daKhoa === false, JSON.stringify(r3.ra));
  // BAN KHONG 994; gia xuong 986 (lai +8) roi hoi len 1000 -> thoat o 996 (vao - 2)
  const b = phang(241, 1000); for (let k = 5; k <= 10; k++) b[k] = 1000 - (k - 4); for (let k = 11; k <= 29; k++) b[k] = 994; b[30] = 986; for (let k = 31; k <= 59; k++) b[k] = 988; for (let k = 60; k <= 240; k++) b[k] = 1000;
  const r4 = tinhBienDong(tachPhien(phien("2026-10-13", b)).get("2026-10-13"), 20);
  ok("ban khong: lai +8 -> cat lo doi xuong gia vao - 2 = 992, thoat +2 diem", r4.phia === -1 && r4.trangThai === "khoaLai" && gan(r4.ra.gia, 992) && gan(r4.diem, 2), JSON.stringify(r4.ra));
}

// 4b. Cat lo toi thieu 7 diem (06/11/2026)
{
  ok("hang so cat lo toi thieu 7 diem", DIEM_CAT_LO_TOI_THIEU === 7);
  ok("catLoBanDau: mua = min(mo cua, vao - 7), ban khong = max(mo cua, vao + 7)", gan(catLoBanDau(1000, 1, 1003), 996) && gan(catLoBanDau(1000, 1, 1012), 1000) && gan(catLoBanDau(1000, -1, 997), 1004) && gan(catLoBanDau(1000, -1, 988), 1000));
  // Bien do truoc 10 -> khoang cach 3: MUA 1003, cat lo moi 996 (cu: 1000). Gia dip xuong 998 roi len lai 1010 cuoi phien -> KHONG bi quet nhu cach cu
  const g = phang(241, 1000); for (let k = 5; k <= 10; k++) g[k] = 1000 + (k - 4) * 0.5; for (let k = 11; k <= 40; k++) g[k] = 1004; for (let k = 41; k <= 45; k++) g[k] = 998; for (let k = 46; k <= 240; k++) g[k] = 1006;
  const r = tinhBienDong(tachPhien(phien("2026-10-13", g)).get("2026-10-13"), 10);
  ok("bien do nho: mua 1003, cat lo 996 (khong phai 1000)", r.phia === 1 && gan(r.vao.gia, 1003) && gan(r.catLo, 996) && gan(r.catLoMua, 996), JSON.stringify([r.vao, r.catLo]));
  ok("dip xuong 998 (duoi mo cua) khong bi quet, dong 14:29", r.trangThai === "cuoiPhien" && gan(r.ra.gia, 1006) && gan(r.diem, 3), JSON.stringify(r.ra));
  // nhay qua muc: vao 1009 (bien do truoc 20, muc 1006) -> cat lo = min(1000, 1002) = 1000 (mo cua van xa hon)
  const h = phang(241, 1000); for (let k = 30; k <= 240; k++) h[k] = 1012;
  const r2 = tinhBienDong(tachPhien(phien("2026-10-13", h, { 30: { o: 1009, h: 1012, l: 1009 } })).get("2026-10-13"), 20);
  ok("vao nhay qua muc: cat lo van o mo cua 1000 neu xa hon vao - 7", gan(r2.vao.gia, 1009) && gan(r2.catLo, 1000));
}

// 4c. VAO LAI SAU CAT LO (08/11/2026)
{
  ok("hang so: toi da 2 lenh / ngay", SO_LENH_TOI_DA_NGAY === 2);
  // bien do truoc 20: muc mua 1006, muc ban 994, mo cua 1000. MUA 1006 o phut 10 (cat lo = min(1000, 999) = 999); phut 30 giam 998 -> bi cat lo o 999 (-7);
  // phut 40 giam 993 (cham muc ban 994) -> lenh 2 BAN KHONG 994, cat lo = max(1000, 1001) = 1001, giam tiep 985 -> dong 14:29 tai 985 (+9)
  const g = phang(241, 1000); for (let k = 5; k <= 10; k++) g[k] = 1000 + (k - 4); for (let k = 11; k <= 29; k++) g[k] = 1006; for (let k = 30; k <= 39; k++) g[k] = 998; for (let k = 40; k <= 59; k++) g[k] = 993; for (let k = 60; k <= 240; k++) g[k] = 985;
  const p = tachPhien(phien("2026-10-13", g)).get("2026-10-13");
  const r = tinhBienDong(p, 20);
  ok("lenh dau bi cat lo o 999 (-7)", r.phia === 1 && r.trangThai === "catLo" && gan(r.ra.gia, 999) && r.ra.k === 30 && gan(r.diem, -7), JSON.stringify(r.ra));
  const h = r.lenhHai;
  ok("co lenh vao lai: BAN KHONG khi cham muc ban 994", !!h && h.phia === -1 && gan(h.vao.gia, 994) && h.vao.k === 40, JSON.stringify(h && h.vao));
  ok("lenh 2 cat lo = max(mo cua, vao + 7) = 1001, muc kich / khoa theo gia vao 994", gan(h.catLo, 1001) && gan(h.mucKich, 987) && gan(h.mucKhoa, 992));
  ok("lenh 2: lai 9 diem (>= 7 nen da doi cat lo xuong 992), dong 14:29 tai 985", h.trangThai === "cuoiPhien" && h.daKhoa === true && gan(h.ra.gia, 985) && gan(h.diem, 9), JSON.stringify(h.ra));
  ok("tong diem sau phi ca ngay = lenh 1 + lenh 2", gan(r.tongDiemSauPhi, r.diemSauPhi + h.diemSauPhi) && gan(r.diemSauPhi, -7 - phiVong(1006)) && gan(h.diemSauPhi, 9 - phiVong(994)));
  ok("trang thai ca ngay = trang thai lenh 2", r.trangThaiNgay === "cuoiPhien" && r.vaoLai === undefined);
  // giua phien (den phut 35): lenh dau da cat lo, chua cham muc nao nua -> cho vao lai
  const r2 = tinhBienDong(p, 20, { kDen: 35 });
  ok("giua phien: da cat lo, dang cho vao lai", r2.trangThai === "catLo" && r2.lenhHai === undefined && r2.vaoLai === "cho" && r2.trangThaiNgay === "choVaoLai" && gan(r2.tongDiemSauPhi, r2.diemSauPhi));
  // den phut 45: lenh 2 dang giu (chua doi cat lo vi lai moi 1 diem)
  const r3 = tinhBienDong(p, 20, { kDen: 45 });
  ok("lenh 2 dang giu, tam tinh theo gia hien tai", r3.lenhHai.trangThai === "dangGiu" && r3.lenhHai.ra === null && r3.trangThaiNgay === "dangGiu" && gan(r3.lenhHai.diem, 994 - 993));
}
{
  // Lenh dau thoat sau khi DA DOI cat lo (khoaLai) -> KHONG vao lai du gia cham muc ban sau do
  const g = phang(241, 1000); for (let k = 5; k <= 10; k++) g[k] = 1000 + (k - 4); for (let k = 11; k <= 29; k++) g[k] = 1006; g[30] = 1014; for (let k = 31; k <= 59; k++) g[k] = 1012; for (let k = 60; k <= 79; k++) g[k] = 1000; for (let k = 80; k <= 240; k++) g[k] = 990;
  const r = tinhBienDong(tachPhien(phien("2026-10-13", g)).get("2026-10-13"), 20);
  ok("thoat khoa lai thi khong vao lai", r.trangThai === "khoaLai" && r.lenhHai === undefined && r.vaoLai === undefined && r.trangThaiNgay === "khoaLai" && gan(r.tongDiemSauPhi, r.diemSauPhi));
}
{
  // Cat lo roi gia cham lai CUNG muc mua (cung chieu) -> vao lai MUA lan nua; lenh 2 cung bi cat lo -> KHONG co lenh 3
  // mua 1006 phut 10, cat lo 999 o phut 20; hoi len 1007 o phut 30 (cham muc mua 1006: vao 1006), cat lo 999 o phut 50; phut 60 len 1010, khong con lenh
  const g = phang(241, 1000); for (let k = 5; k <= 10; k++) g[k] = 1000 + (k - 4); for (let k = 11; k <= 19; k++) g[k] = 1006; for (let k = 20; k <= 29; k++) g[k] = 998; for (let k = 30; k <= 49; k++) g[k] = 1007; for (let k = 50; k <= 59; k++) g[k] = 998; for (let k = 60; k <= 240; k++) g[k] = 1010;
  const r = tinhBienDong(tachPhien(phien("2026-10-13", g)).get("2026-10-13"), 20);
  ok("cat lo roi cham lai muc mua: vao lai cung chieu", r.trangThai === "catLo" && r.lenhHai && r.lenhHai.phia === 1 && gan(r.lenhHai.vao.gia, 1006) && r.lenhHai.vao.k === 30, JSON.stringify(r.lenhHai && r.lenhHai.vao));
  ok("lenh 2 cung cat lo; khong co lenh thu 3 (toi da 2 lenh / ngay)", r.lenhHai.trangThai === "catLo" && r.lenhHai.lenhHai === undefined && r.lenhBa === undefined && r.vaoLai === undefined);
}
{
  // Cat lo SAU 13:29 (khong con gio vao): khong vao lai. MUA 1006 o phut 10, giu den phut 185 roi sap xuong 990
  const g = phang(241, 1000); for (let k = 5; k <= 10; k++) g[k] = 1000 + (k - 4); for (let k = 11; k <= 184; k++) g[k] = 1006; for (let k = 185; k <= 240; k++) g[k] = 990;
  const r = tinhBienDong(tachPhien(phien("2026-10-13", g)).get("2026-10-13"), 20);
  ok("cat lo sau 13:30 thi khong vao lai", r.trangThai === "catLo" && r.ra.k >= K_HET_GIO_VAO && r.lenhHai === undefined && r.vaoLai === "khongKhop" && r.trangThaiNgay === "catLo", JSON.stringify([r.ra, r.vaoLai]));
  // Cat lo luc 13:20 (phut 200?) tuong tu: cat lo o phut 170 (con gio vao) nhung het gio khong cham -> khongKhop
  const h = phang(241, 1000); for (let k = 5; k <= 10; k++) h[k] = 1000 + (k - 4); for (let k = 11; k <= 169; k++) h[k] = 1006; for (let k = 170; k <= 240; k++) h[k] = 998;
  const r2 = tinhBienDong(tachPhien(phien("2026-10-13", h)).get("2026-10-13"), 20);
  ok("cat lo luc phut 170 nhung khong cham muc nao truoc 13:30 -> vaoLai khongKhop", r2.trangThai === "catLo" && r2.ra.k === 170 && r2.lenhHai === undefined && r2.vaoLai === "khongKhop", JSON.stringify([r2.ra, r2.vaoLai]));
}

// 5. Dao han
ok("thu Nam tuan 3 cua 10/2026 la 15/10", thuNamTuanBa("2026-10-13") === "2026-10-15");
ok("thu Nam tuan 3 cua 09/2026 la 17/09", thuNamTuanBa("2026-09-01") === "2026-09-17");
ok("phien sau ngay dao han la phien dau hop dong moi", laPhienDauHopDong("2026-10-15", "2026-10-16") === true);
ok("dao han som 1 ngay do nghi le: phien truoc 14/10, hom nay 16/10", laPhienDauHopDong("2026-10-14", "2026-10-16") === true);
ok("ngay thuong khong phai", laPhienDauHopDong("2026-10-12", "2026-10-13") === false && laPhienDauHopDong("2026-10-16", "2026-10-19") === false);
ok("qua thang: 30/09 -> 01/10 khong phai", laPhienDauHopDong("2026-09-30", "2026-10-01") === false);
ok("phi vong o 1.867,5 ~ 0,482 diem", Math.abs(phiVong(1867.5) - 0.4825) < 0.001, phiVong(1867.5));

// 6. Vung gia tri phien truoc (chi de theo doi)
{
  // 100 phut o 1000 (KL 100 / phut), 100 phut o 1002, 41 phut o 1010 -> POC o bac 1000..1000,5 hoac 1002 (bang nhau -> lay bac thap), vung 70% phai chua 1000 va 1002, khong chua 1010
  const g = phang(241, 1000); for (let k = 100; k < 200; k++) g[k] = 1002; for (let k = 200; k <= 240; k++) g[k] = 1010;
  const p = tachPhien(phien("2026-10-12", g, { 100: { o: 1002, h: 1002, l: 1002 }, 200: { o: 1010, h: 1010, l: 1010 } })).get("2026-10-12");
  const v = vungGiaTriPhien(p);
  ok("POC nam o bac gia nhieu khoi luong nhat", gan(v.poc, 1000.25), JSON.stringify(v));
  ok("vung gia tri 70% chua 1000 va 1002, khong chua 1010", v.val <= 1000 && v.vah >= 1002 && v.vah < 1010, JSON.stringify(v));
  ok("vi tri: trong vung", viTriVungGiaTri(1001, 1, v) === "trong" && viTriVungGiaTri(1001, -1, v) === "trong");
  ok("vi tri: mua tren VAH / ban duoi VAL = da ra khoi vung", viTriVungGiaTri(1008, 1, v) === "ra" && viTriVungGiaTri(995, -1, v) === "ra");
  ok("vi tri: ban tren VAH / mua duoi VAL = huong vao vung", viTriVungGiaTri(1008, -1, v) === "vao" && viTriVungGiaTri(995, 1, v) === "vao");
  ok("khong co vung / khong co lenh -> null", viTriVungGiaTri(1000, 1, null) === null && viTriVungGiaTri(1000, 0, v) === null && vungGiaTriPhien(null) === null);
}

console.log(loi ? `\n${loi} LOI` : "\nTat ca dat.");
process.exit(loi ? 1 : 0);
