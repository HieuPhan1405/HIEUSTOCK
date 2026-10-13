// Test tay cho lib/phaVoPhaiSinh.js. Chay: node engine/test/phaVoPhaiSinh.test.mjs
import { viTriPhut, gioCuaPhut, tachPhien, bienDoPhien, tinhBienDong, tinhKhoangMoCua, thuNamTuanBa, laPhienDauHopDong, phiVong, vungGiaTriPhien, viTriVungGiaTri, K_CUOI, K_HET_GIO_VAO } from "../../lib/phaVoPhaiSinh.js";

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
  ok("muc mua / ban / cat lo", gan(r.mucMua, 1006) && gan(r.mucBan, 994) && gan(r.catLo, 1000));
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
  ok("cat lo tai gia mo cua", r.trangThai === "catLo" && r.ra.k === 60 && gan(r.ra.gia, 1000) && gan(r.diem, -6), JSON.stringify(r.ra));
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

// 4. Khoang mo cua 15 phut
{
  // 15 phut dau dao dong 998..1002; phut 20 dong cua 1003 (> dinh 1002) -> mua tai 1003; sau do ve 998 (cham day) o phut 100 -> cat lo tai 998
  const g = phang(241, 1000); g[3] = 1002; g[4] = 1000; g[8] = 998; g[9] = 1000; g[20] = 1003; for (let k = 21; k <= 99; k++) g[k] = 1004; for (let k = 100; k <= 240; k++) g[k] = 997;
  const p = tachPhien(phien("2026-10-13", g)).get("2026-10-13");
  const r = tinhKhoangMoCua(p);
  ok("dinh / day 15 phut dau", gan(r.dinh, 1002) && gan(r.day, 998));
  ok("mua khi nen 1 phut DONG CUA vuot dinh, khop tai gia dong cua", r.phia === 1 && r.vao.k === 20 && gan(r.vao.gia, 1003));
  ok("cat lo o bien doi dien (day)", r.trangThai === "catLo" && gan(r.catLo, 998) && gan(r.ra.gia, 998) && r.ra.k === 100, JSON.stringify(r.ra));
  ok("trong 15 phut dau: dang do, chua co tin hieu", tinhKhoangMoCua(p, { kXong: 10 }).trangThai === "dangDo");
  // nen dang chay (chua dong cua xong) khong duoc tinh: du lieu den phut 20 nhung phut 20 chua xong
  const r2 = tinhKhoangMoCua(p, { kXong: 19, kDen: 20 });
  ok("nen dang chay vuot dinh nhung chua dong cua -> van cho", r2.trangThai === "cho");
  const r3 = tinhKhoangMoCua(p, { kXong: 20, kDen: 20 });
  ok("nen vua dong cua xong -> co tin hieu, dang giu", r3.trangThai === "dangGiu" && r3.phia === 1);
}
{
  // cham bien trong phut (cao vuot dinh) nhung DONG CUA khong vuot -> khong vao
  const g = phang(241, 1000); g[3] = 1002; g[4] = 1000;
  const p = tachPhien(phien("2026-10-13", g, { 40: { h: 1005 } })).get("2026-10-13");
  ok("rau nen vuot dinh nhung dong cua khong vuot -> khong vao", tinhKhoangMoCua(p).trangThai === "khongKhop");
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
