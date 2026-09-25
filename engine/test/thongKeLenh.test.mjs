// Test tay cho lib/thongKeLenh.js (thong ke lenh da dong THEO TUNG LENH, khong dem tung dong chot loi). Chay: node engine/test/thongKeLenh.test.mjs
import { gomTheoLenh, thongKeLenhDaDong } from "../../lib/thongKeLenh.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

const d = (o) => ({ ma: "AAA", ngay_mua: "2026-09-01", gia_mua: 20, ngay_ban: "2026-09-20", gia_ban: 22, lai_lo_pct: 10, so_phien: 12, ly_do: "BAN", da_cham_tp: null, phan_chot_pct: 100, vong: 1, ...o });

// 1. Lenh cach moi ket thuc o TP3: 3 dong TP1/TP2/TP3 = 1 lenh, ket qua 0,3x10 + 0,3x20 + 0,4x40 = 25%
let ds = [
  d({ ly_do: "TP1", vong: 5, phan_chot_pct: 30, lai_lo_pct: 10, so_phien: 3 }),
  d({ ly_do: "TP2", vong: 6, phan_chot_pct: 30, lai_lo_pct: 20, so_phien: 6 }),
  d({ ly_do: "TP3", vong: 1, phan_chot_pct: 40, lai_lo_pct: 40, so_phien: 12 }),
];
let tk = thongKeLenhDaDong(ds);
ok("lenh ket thuc o TP3: dem 1 lenh (khong phai 3)", tk.soLenh === 1 && tk.soThang === 1 && tk.soDong === 3, JSON.stringify(tk));
ok("ket qua lenh = tong theo ty trong = 25%", gan(tk.laiTB, 25), String(tk.laiTB));
ok("so phien = phien lon nhat cua lenh", tk.phienTB === 12);
ok("khong con lenh dang chot tung phan", tk.soDangChotTungPhan === 0);

// 2. Moi chot TP1 (lenh con giu): chua tinh la lenh da dong
tk = thongKeLenhDaDong([d({ ly_do: "TP1", vong: 5, phan_chot_pct: 30, lai_lo_pct: 10 })]);
ok("moi chot TP1: chua tinh lenh da dong, dem lenh dang chot tung phan", tk.soLenh === 0 && tk.soDangChotTungPhan === 1 && tk.tyLeThang === null);

// 3. Chot TP1 roi cat lo phan con lai 70% o -5%: ket qua 0,3x10 + 0,7x(-5) = -0,5% -> lenh THUA (du co 1 dong chot loi)
ds = [d({ ly_do: "TP1", vong: 5, phan_chot_pct: 30, lai_lo_pct: 10 }), d({ ly_do: "CAT_LO", vong: 1, phan_chot_pct: 70, lai_lo_pct: -5, da_cham_tp: "TP1" })];
tk = thongKeLenhDaDong(ds);
ok("TP1 roi cat lo: 1 lenh, ket qua -0,5% (thua)", tk.soLenh === 1 && tk.soThua === 1 && gan(tk.laiTB, -0.5), JSON.stringify(tk));

// 4. Thoat Kijun sau TP2: 0,3x10 + 0,3x20 + 0,4x15 = 15%
ds = [
  d({ ly_do: "TP1", vong: 5, phan_chot_pct: 30, lai_lo_pct: 10 }),
  d({ ly_do: "TP2", vong: 6, phan_chot_pct: 30, lai_lo_pct: 20 }),
  d({ ly_do: "THOAT_KIJUN", vong: 1, phan_chot_pct: 40, lai_lo_pct: 15, da_cham_tp: "TP2" }),
];
tk = thongKeLenhDaDong(ds);
ok("thoat Kijun sau TP2: 1 lenh, 15%", tk.soLenh === 1 && gan(tk.laiTB, 15));

// 5. Lenh cu: dong TP3 gop 85% (lai tinh tren toan vi the) + phan con lai 15% dong o +50% => 19 + 0,15x50 = 26,5%
ds = [d({ ly_do: "TP3", vong: 1, phan_chot_pct: 85, lai_lo_pct: 19, da_cham_tp: "TP3" }), d({ ly_do: "BAN", vong: 3, phan_chot_pct: 15, lai_lo_pct: 50, da_cham_tp: "TP3" })];
tk = thongKeLenhDaDong(ds);
ok("lenh cu 85% + 15%: 1 lenh, 26,5%", tk.soLenh === 1 && gan(tk.laiTB, 26.5), String(tk.laiTB));
// ...luc moi cham TP3 (chua co phan 15%): van con giu chay -> chua dong
tk = thongKeLenhDaDong([ds[0]]);
ok("lenh cu moi cham TP3 (con 15% chay): chua tinh la lenh da dong", tk.soLenh === 0 && tk.soDangChotTungPhan === 1);

// 6. Lenh kieu cu chua co dong TP rieng (dong lenh 1 dong, lai da tinh co trong so): giu nguyen
tk = thongKeLenhDaDong([d({ ly_do: "BAN", lai_lo_pct: 12.5, phan_chot_pct: null })]);
ok("dong lenh kieu cu (khong co phan_chot_pct): ket qua = lai/lo da ghi", tk.soLenh === 1 && gan(tk.laiTB, 12.5));

// 7. 2 lenh cung ma khac ngay mua + lenh mua them cung ma: 3 lenh rieng
ds = [
  d({ lai_lo_pct: 8 }),
  d({ ngay_mua: "2026-08-01", lai_lo_pct: -4 }),
  d({ ngay_mua: "2026-09-10", vong: 4, lai_lo_pct: 3, ly_do: "BAN" }),
];
tk = thongKeLenhDaDong(ds);
ok("3 lenh rieng (goc, goc khac ngay, mua them giua chung)", tk.soLenh === 3 && tk.soThang === 2 && tk.soThua === 1 && gan(tk.tyLeThang, 200 / 3), JSON.stringify(tk));
ok("lai TB thang / lo TB thua", gan(tk.laiTBThang, 5.5) && gan(tk.loTBThua, -4));
// mua them cung ngay mua voi lenh goc van la lenh rieng
tk = thongKeLenhDaDong([d({ lai_lo_pct: 8 }), d({ vong: 4, lai_lo_pct: -2 })]);
ok("mua them cung ngay mua voi lenh goc: van 2 lenh", tk.soLenh === 2);

// 8. Nguoi xem chi tinh tu ngay tham gia (mat dong TP1): ket qua = lai/lo cua phan ho tham gia (chuan hoa theo trong so)
tk = thongKeLenhDaDong([d({ ly_do: "CAT_LO", vong: 1, phan_chot_pct: 70, lai_lo_pct: -5, da_cham_tp: "TP1" })]);
ok("thieu dong TP1: ket qua = lai/lo phan con lai (-5%)", tk.soLenh === 1 && gan(tk.laiTB, -5));

// 9. Rong
tk = thongKeLenhDaDong([]);
ok("rong: 0 lenh, cac so trung binh null", tk.soLenh === 0 && tk.tyLeThang === null && tk.laiTB === null && tk.phienTB === null);
ok("gomTheoLenh: khoa theo ma|ngay mua|loai", gomTheoLenh([d({}), d({ vong: 2 })]).map((n) => n.khoa).join() === "AAA|2026-09-01|goc,AAA|2026-09-01|moi");

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
