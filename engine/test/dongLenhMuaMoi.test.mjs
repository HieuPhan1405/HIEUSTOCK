// Test tay cho lib/dongLenhMuaMoi.js (lenh MUA MOI chot 30% TP1 / 30% TP2, phan con lai dong theo cat lo rieng / hoa von / lenh dau). Chay: node engine/test/dongLenhMuaMoi.test.mjs
import { phatHienChotLoiMuaMoi, phatHienDongMuaThem } from "../../lib/dongLenhMuaMoi.js";
import { thongKeLenhDaDong, gomTheoLenh } from "../../lib/thongKeLenh.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => a != null && Math.abs(a - b) <= e;
const NGAY = "2026-09-28";
const cuGiu = { tin: "NAM GIU", dang_giu_giua: true, ngay_mua_giua_txt: "2026-09-10", gia_mua_giua: 20, stop_giua: 19, tp1_giua: 21, tp2_giua: 22, tp_da_cham_giua: null };

// ---- Chot tung phan
let r = phatHienChotLoiMuaMoi({
  dsMoi: [{ ma: "AAA", dang_giu_giua: true, ngay_mua_giua: "2026-09-10", gia_mua_giua: 20, tp1_giua: 21, tp2_giua: 22, tp_da_cham_giua: "TP1" }],
  banGhiCuTheoMa: { AAA: cuGiu },
  ngayBan: NGAY,
});
ok("cham TP1: 1 dong vong 7, 30%, gia ban = TP1, lai 5%", r.length === 1 && r[0].vong === 7 && r[0].phan_chot_pct === 30 && r[0].gia_ban === 21 && gan(r[0].lai_lo_pct, 5) && r[0].ly_do === "TP1");
r = phatHienChotLoiMuaMoi({
  dsMoi: [{ ma: "AAA", dang_giu_giua: true, ngay_mua_giua: "2026-09-10", gia_mua_giua: 20, tp1_giua: 21, tp2_giua: 22, tp_da_cham_giua: "TP3" }],
  banGhiCuTheoMa: { AAA: { ...cuGiu, tp_da_cham_giua: "TP1" } },
  ngayBan: NGAY,
});
ok("cham TP3 (tinh nhu TP2): dong TP1 + TP2 (ghi lai an toan nho UNIQUE)", r.length === 2 && r.map((x) => x.vong).join() === "7,8" && r[1].gia_ban === 22 && gan(r[1].lai_lo_pct, 10));
ok("chua cham TP: khong ghi", phatHienChotLoiMuaMoi({ dsMoi: [{ ma: "AAA", dang_giu_giua: true, ngay_mua_giua: "2026-09-10", gia_mua_giua: 20, tp1_giua: 21, tp2_giua: 22, tp_da_cham_giua: "" }], banGhiCuTheoMa: {}, ngayBan: NGAY }).length === 0);
// Lenh vua dong hom nay: lay thong tin tu dong cu
r = phatHienChotLoiMuaMoi({
  dsMoi: [{ ma: "AAA", dang_giu_giua: false, ngay_mua_giua: null, gia_mua_giua: null, tp_da_cham_giua: "TP2" }],
  banGhiCuTheoMa: { AAA: { ...cuGiu, tp_da_cham_giua: "TP1" } },
  ngayBan: NGAY,
});
ok("vua dong hom nay: van ghi TP2 theo gia/TP da dong bang cua lenh cu", r.length === 2 && r[1].ngay_mua === "2026-09-10" && r[1].gia_ban === 22);
ok("TP khong cao hon gia mua -> bo", phatHienChotLoiMuaMoi({ dsMoi: [{ ma: "B", dang_giu_giua: true, ngay_mua_giua: "2026-09-10", gia_mua_giua: 20, tp1_giua: 19, tp2_giua: 22, tp_da_cham_giua: "TP1" }], banGhiCuTheoMa: {}, ngayBan: NGAY }).length === 0);
ok("lenh mua moi KHAC (ngay mua khac) khong lay muc TP cua lenh cu", phatHienChotLoiMuaMoi({ dsMoi: [{ ma: "AAA", dang_giu_giua: true, ngay_mua_giua: "2026-09-25", gia_mua_giua: 20, tp1_giua: 21, tp2_giua: 22, tp_da_cham_giua: "" }], banGhiCuTheoMa: { AAA: { ...cuGiu, tp_da_cham_giua: "TP2" } }, ngayBan: NGAY }).length === 0);

// ---- Dong phan con lai
const dong = (m, cu = cuGiu) => phatHienDongMuaThem({ dsMoi: [{ ma: "AAA", tin: "NAM GIU", gia: 20.5, ...m }], banGhiCuTheoMa: { AAA: cu }, ngayBan: NGAY, vong: 4, cotTienTo: "giua" });
r = dong({ dang_giu_giua: false, cat_giua: 1, tp_da_cham_giua: "" });
ok("cat lo rieng, chua cham TP: 100%, khop tai SL", r.length === 1 && r[0].ly_do === "CAT_LO" && r[0].phan_chot_pct === 100 && r[0].gia_ban === 19);
r = dong({ dang_giu_giua: false, cat_giua: 1, tp_da_cham_giua: "TP1" });
ok("cat lo sau TP1: phan con lai 70%", r[0].phan_chot_pct === 70 && r[0].da_cham_tp === "TP1");
r = dong({ gia: 19.8, dang_giu_giua: false, cat_giua: 3, tp_da_cham_giua: "TP2" });
ok("hoa von sau TP2: con 40%, ly do BAO_VE_LAI, gia = min(gia mua, gia hien tai)", r[0].ly_do === "BAO_VE_LAI" && r[0].phan_chot_pct === 40 && r[0].gia_ban === 19.8);
r = dong({ gia: 21.5, dang_giu_giua: false, cat_giua: 3, tp_da_cham_giua: "" }, { ...cuGiu, tp_da_cham_giua: "TP2" });
ok("hoa von: gia da hoi len tren gia mua -> khop o gia mua; muc TP lay tu dong cu", r[0].gia_ban === 20 && r[0].phan_chot_pct === 40);
r = dong({ tin: "BAN", gia: 23, dang_giu_giua: false, cat_giua: 2, tp_da_cham_giua: "TP2" });
ok("dong cung lenh dau (BAN) sau TP2: 40% o gia hien tai", r[0].ly_do === "BAN" && r[0].phan_chot_pct === 40 && r[0].gia_ban === 23 && gan(r[0].lai_lo_pct, 15));
ok("van giu: khong dong", dong({ dang_giu_giua: true, tp_da_cham_giua: "TP2" }).length === 0);
// Mua moi sau TP3 (vong 2) khong co cot muc TP -> dong 100% nhu cu
r = phatHienDongMuaThem({
  dsMoi: [{ ma: "C", tin: "NAM GIU", gia: 20.5, dang_giu_moi: false, cat_moi: 1 }],
  banGhiCuTheoMa: { C: { tin: "NAM GIU", dang_giu_moi: true, ngay_mua_moi_txt: "2026-09-10", gia_mua_moi: 20, stop_moi: 19 } },
  ngayBan: NGAY,
  vong: 2,
  cotTienTo: "moi",
});
ok("vong 2: van 100%", r.length === 1 && r[0].phan_chot_pct === 100);

// ---- Thong ke theo lenh: TP1 30% (+5%) + TP2 30% (+10%) + con lai 40% hoa von (0%) = 0.3*5 + 0.3*10 = 4.5%
const ds = [
  { ma: "AAA", ngay_mua: "2026-09-10", gia_mua: 20, ly_do: "TP1", lai_lo_pct: 5, phan_chot_pct: 30, vong: 7, so_phien: 3 },
  { ma: "AAA", ngay_mua: "2026-09-10", gia_mua: 20, ly_do: "TP2", lai_lo_pct: 10, phan_chot_pct: 30, vong: 8, so_phien: 6 },
  { ma: "AAA", ngay_mua: "2026-09-10", gia_mua: 20, ly_do: "BAO_VE_LAI", lai_lo_pct: 0, phan_chot_pct: 40, vong: 4, so_phien: 9 },
];
const nhom = gomTheoLenh(ds);
ok("3 dong gom thanh 1 lenh mua moi (giua), da dong", nhom.length === 1 && nhom[0].loai === "giua" && nhom[0].daDong === true);
ok("ket qua ca lenh 4.5%", gan(nhom[0].ketQuaPct, 4.5, 1e-9), String(nhom[0].ketQuaPct));
ok("thong ke: 1 lenh thang", thongKeLenhDaDong(ds).soLenh === 1 && thongKeLenhDaDong(ds).soThang === 1);
ok("chi co dong TP1 (chua dong): chua tinh la da dong", gomTheoLenh([ds[0]])[0].daDong === false);

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
