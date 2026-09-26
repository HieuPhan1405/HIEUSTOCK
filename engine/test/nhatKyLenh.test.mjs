// Test tay cho lib/nhatKyLenh.js + lib/soPhienGiu.js (nhat ky giao dich THEO TUNG LENH, so phien giu cua lenh mua moi). Chay: node engine/test/nhatKyLenh.test.mjs
import { dungNhatKyLenh } from "../../lib/nhatKyLenh.js";
import { demSoPhien, boSungSoPhienDong } from "../../lib/soPhienGiu.js";
import { lenhDangMo } from "../../lib/muaThemTinhToan.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

// ---- Lich phien + dem so phien
const lich = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-07", "2026-09-08", "2026-09-09"]; // 05-06/09 la T7/CN
ok("dem: ngay mua = 0 phien cua chinh ngay do", demSoPhien(lich, "2026-09-09") === 0);
ok("dem: qua cuoi tuan chi tinh ngay giao dich", demSoPhien(lich, "2026-09-04") === 3, String(demSoPhien(lich, "2026-09-04")));
ok("dem: den ngay dong", demSoPhien(lich, "2026-09-01", "2026-09-04") === 3);
ok("dem: ngay mua truoc lich -> null (khong doan)", demSoPhien(lich, "2026-08-20") === null);
ok("dem: khong co lich -> null", demSoPhien([], "2026-09-01") === null && demSoPhien(null, "2026-09-01") === null);
ok("dem: ngay mua sau phien cuoi (lich tre) -> 0", demSoPhien(lich, "2026-09-10") === 0);
const rows0 = [
  { ngay_mua: "2026-09-01", ngay_ban: "2026-09-04", so_phien: null, vong: 4 },
  { ngay_mua: "2026-09-01", ngay_ban: "2026-09-04", so_phien: 7, vong: 1 },
];
const bs = boSungSoPhienDong(rows0, lich);
ok("bo sung so phien dong: chi dong thieu", bs[0].so_phien === 3 && bs[1].so_phien === 7 && rows0[0].so_phien === null);
ok("bo sung: khong co lich -> giu nguyen", boSungSoPhienDong(rows0, []) === rows0);

// ---- Lenh mua moi co so phien giu (giong lenh thuong)
const goc = { ma: "AAA", tin: "NAM GIU", gia: 24, gia_mua: 20, ngay_mua: "2026-09-01", so_phien_giu: 6, stop_loss: 18, tp1: 22, tp2: 25, tp3: 29, tp_da_cham: null, lai_lo_pct: 20 };
const coLot = { ...goc, dang_giu_giua: true, gia_mua_giua: 21, stop_giua: 19, tp1_giua: 23, tp2_giua: 26, tp3_giua: 30, ngay_mua_giua: "2026-09-04" };
const mo = lenhDangMo([coLot], lich);
ok("lenh dau giu so_phien_giu cua AFL, lenh mua moi dem tu lich", mo[0].so_phien_giu === 6 && mo[1].so_phien_giu === 3, JSON.stringify(mo.map((x) => x.so_phien_giu)));
ok("khong co lich -> lenh mua moi so_phien_giu null", lenhDangMo([coLot])[1].so_phien_giu === null);

// ---- Nhat ky: 1 lenh dau da dong (TP1, TP2, con lai) + 1 lenh dau dang giu da chot TP1 + lenh mua moi dang giu + lenh mua moi da dong
const d = (o) => ({ ma: "AAA", ngay_mua: "2026-06-01", gia_mua: 20, ngay_ban: "2026-06-20", gia_ban: 22, lai_lo_pct: 10, so_phien: 12, ly_do: "BAN", da_cham_tp: null, phan_chot_pct: 100, vong: 1, ...o });
const lichSu = [
  // lenh 01/06 (da dong hoan toan): TP1 30% (+10%), TP2 30% (+20%), phan con lai 40% ban (+5%)
  d({ ly_do: "TP1", vong: 5, phan_chot_pct: 30, lai_lo_pct: 10, ngay_ban: "2026-06-10", so_phien: 6, gia_ban: 22 }),
  d({ ly_do: "TP2", vong: 6, phan_chot_pct: 30, lai_lo_pct: 20, ngay_ban: "2026-06-15", so_phien: 10, gia_ban: 24 }),
  d({ ly_do: "BAN", vong: 1, phan_chot_pct: 40, lai_lo_pct: 5, ngay_ban: "2026-06-25", so_phien: 17, gia_ban: 21 }),
  // lenh 01/09 (dang giu): da chot TP1 30% (+10%) roi
  d({ ngay_mua: "2026-09-01", ly_do: "TP1", vong: 5, phan_chot_pct: 30, lai_lo_pct: 10, ngay_ban: "2026-09-03", so_phien: 2, gia_ban: 22 }),
  // lenh mua moi 15/07 (da dong, cat lo rieng)
  d({ ngay_mua: "2026-07-15", gia_mua: 25, vong: 4, ly_do: "CAT_LO", gia_ban: 23, lai_lo_pct: -8, ngay_ban: "2026-07-20", so_phien: 3 }),
];
const nen = [
  { t: "2026-09-02", h: 21 },
  { t: "2026-09-03", h: 22.5 },
  { t: "2026-09-04", h: 23 },
  { t: "2026-09-07", h: 23.5 }, // TP2 = 25 chua cham
  { t: "2026-09-08", h: 24 },
  { t: "2026-09-09", h: 24 },
];
const goc2 = { ...goc, tp_da_cham: "TP1", ngay_mua: "2026-09-01", tp1: 22, tp2: 25, tp3: 29, lai_lo_pct: 20, gia: 24 };
const cacLenhMo = lenhDangMo([{ ...goc2, dang_giu_giua: true, gia_mua_giua: 21, stop_giua: 19, tp1_giua: 22.5, tp2_giua: 26, tp3_giua: 30, ngay_mua_giua: "2026-09-04" }], lich);
const nk = dungNhatKyLenh({ lichSuDaDong: lichSu, cacLenhMo, nen });
ok("4 lenh, theo ngay mua tang dan", nk.lenh.map((x) => x.khoa).join() === "2026-06-01|goc,2026-07-15|giua,2026-09-01|goc,2026-09-04|giua", nk.lenh.map((x) => x.khoa).join());

const [l1, l2, l3, l4] = nk.lenh;
ok("lenh 1: da dong, gia mua 20", !l1.dangGiu && l1.giaMua === 20 && l1.tenLenh === null);
ok("lenh 1: ket qua = 0.3*10 + 0.3*20 + 0.4*5 = 11", l1.ketQuaPct !== null && gan(l1.ketQuaPct, 11), String(l1.ketQuaPct));
ok("lenh 1: cac su kien Mua, TP1, TP2, BAN (theo thu tu ngay)", l1.suKien.map((s) => s.kieu).join() === "mua,chot_tp,chot_tp,dong", l1.suKien.map((s) => s.kieu).join());
ok("lenh 1: phan von tung dong 30/30/40 va gia tri", l1.suKien[1].phanVon === 30 && gan(l1.suKien[1].giaTriPhan, 33) && gan(l1.suKien[3].giaTriPhan, 40 * 1.05), JSON.stringify(l1.suKien[1]));
ok("lenh 1: tong gia tri cac phan = 100 + ket qua", gan(l1.suKien.filter((s) => s.giaTriPhan != null).reduce((t, s) => t + s.giaTriPhan, 0), 111));
ok("lenh 1: so phien = max cac dong (17)", l1.soPhien === 17);

ok("lenh 2 (mua moi 15/07): da dong, la mua moi, cat lo", !l2.dangGiu && l2.laMuaMoi && l2.suKien[0].kieu === "mua_moi" && l2.suKien[1].kieu === "cat_lo" && gan(l2.ketQuaPct, -8));
ok("lenh 2: mua moi da dong co so phien", l2.soPhien === 3 && l2.suKien[1].soPhien === 3);

ok("lenh 3 (01/09): dang giu 70%, da chot 30%", l3.dangGiu && gan(l3.conLaiPct, 70) && gan(l3.daChotPct, 30), `${l3.conLaiPct} ${l3.daChotPct}`);
ok("lenh 3: tam tinh = 0.3*10 + 0.7*20 = 17", gan(l3.ketQuaPct, 17) && l3.tamTinh, String(l3.ketQuaPct));
ok("lenh 3: khong lap Cham TP1 (da co dong TP1 rieng)", !l3.suKien.some((s) => s.kieu === "cham_tp" && s.chinh.includes("TP1")), l3.suKien.map((s) => s.chinh).join("|"));
ok("lenh 3: khong bao Cham TP2 (AFL chua bao cham)", !l3.suKien.some((s) => s.kieu === "cham_tp"));
ok("lenh 3: Dang giu 70% o cuoi, phan von 70", l3.suKien[l3.suKien.length - 1].kieu === "dang_giu" && l3.suKien[l3.suKien.length - 1].phanVon === 70 && l3.suKien[l3.suKien.length - 1].chinh.includes("70%"));
ok("lenh 3: so phien giu = 6 (AFL), ten (1) vi ma co 2 lenh mo", l3.soPhien === 6 && l3.tenLenh === "AAA (1)", `${l3.soPhien} ${l3.tenLenh}`);

ok("lenh 4 (mua moi 04/09): dang giu 100%, ten (2), CO so phien giu", l4.dangGiu && l4.laMuaMoi && l4.conLaiPct === 100 && l4.tenLenh === "AAA (2)" && l4.soPhien === 3, `${l4.soPhien} ${l4.tenLenh}`);
ok("lenh 4: dong Dang giu mang so phien", l4.suKien[l4.suKien.length - 1].soPhien === 3);
ok("lenh 4: ket qua tam tinh = lai/lo hien tai (24/21-1)", gan(l4.ketQuaPct, (24 / 21 - 1) * 100));
// nen chi co phien SAU ngay mua 04/09: 07/09 (h 23.5 >= 22.5) la phien dau tien -> cham TP1 rieng sau 1 phien
const cham4 = l4.suKien.find((x) => x.kieu === "cham_tp");
ok("lenh 4: TP1 rieng 22.5 cham 07/09 (phien thu 1 sau khi mua)", cham4 && cham4.ngay === "2026-09-07" && cham4.soPhien === 1 && cham4.chinh === "Giá chạm TP1", JSON.stringify(cham4));

// Tat ca su kien xep theo thoi gian, "Dang giu" (khong ngay) o cuoi
const ngayTatCa = nk.tatCa.filter((s) => s.ngay).map((s) => s.ngay);
ok("tat ca: su kien co ngay xep tang dan", ngayTatCa.every((v, i) => i === 0 || ngayTatCa[i - 1] <= v));
ok("tat ca: Dang giu o cuoi, kem khoaLenh", nk.tatCa.slice(-2).every((s) => s.kieu === "dang_giu") && nk.tatCa.every((s) => s.khoaLenh));

// ---- Truong hop bien
ok("khong co gi -> rong", dungNhatKyLenh({}).lenh.length === 0 && dungNhatKyLenh({}).tatCa.length === 0);
const chiMo = dungNhatKyLenh({ cacLenhMo: lenhDangMo([goc]), nen: null });
ok("chi lenh mo (chua co lich su, chua tai nen): Mua + Dang giu, ket qua = lai/lo", chiMo.lenh.length === 1 && chiMo.lenh[0].suKien.map((s) => s.kieu).join() === "mua,dang_giu" && gan(chiMo.lenh[0].ketQuaPct, 20) && chiMo.lenh[0].tenLenh === null);
// Lenh cu (TP3 gop 85%): con 15% giu chay
const cu = dungNhatKyLenh({
  lichSuDaDong: [d({ ngay_mua: "2026-09-01", ly_do: "TP3", vong: 1, phan_chot_pct: 85, lai_lo_pct: 12, ngay_ban: "2026-09-05" })],
  cacLenhMo: lenhDangMo([{ ...goc, tp_da_cham: "TP3", lai_lo_pct: 30 }]),
});
ok("lenh cu (TP3 gop 85%): dang giu 15% chay, tam tinh = 12 + 0.15*30 = 16.5", cu.lenh[0].dangGiu && gan(cu.lenh[0].conLaiPct, 15) && gan(cu.lenh[0].ketQuaPct, 16.5), `${cu.lenh[0].conLaiPct} ${cu.lenh[0].ketQuaPct}`);
// Chi lich su, lenh cu chot TP3 gop 100% -> da dong
const ketThuc = dungNhatKyLenh({ lichSuDaDong: [d({ ly_do: "TP3", vong: 1, phan_chot_pct: 100, lai_lo_pct: 15 })] });
ok("chot TP3 gop 100%: da dong, ket qua 15, nhan ket thuc lenh", !ketThuc.lenh[0].dangGiu && gan(ketThuc.lenh[0].ketQuaPct, 15) && ketThuc.lenh[0].suKien[1].chinh.includes("kết thúc lệnh"));

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
