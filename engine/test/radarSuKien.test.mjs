// Test tay cho lib/radarSuKien.js. Chay: node engine/test/radarSuKien.test.mjs
import { dungSuKienRadar, LOAI_RADAR, MOI_LOAI_TOI_DA, SO_NOI_BAT_TOI_DA } from "../../lib/radarSuKien.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const r = (ma, o = {}) => ({ ma, tin: "TRUNG LAP", doi: 0, gia: 10, dinh_52t: 20, atr_pct: 2, gtgd_tb20: 50, diem: 0, ...o });

const tatCa = [
  r("AAA", { doi: 5.4, atr_pct: 2.2 }), // tang 5,4% = 2,45 lan ATR -> tang manh
  r("BBB", { doi: -2.5, atr_pct: 2.0 }), // giam 2,5% = 1,25 lan ATR -> KHONG
  r("CCC", { doi: -2.1, atr_pct: 0.8 }), // giam, 2,6 lan ATR -> giam manh
  r("DDD", { doi: 4.2, atr_pct: null }), // thieu ATR: >= 4% -> tang manh
  r("EEE", { doi: 3, atr_pct: null }), // thieu ATR, 3% -> khong
  r("FFF", { gia: 20, dinh_52t: 20, doi: 0.5 }), // vuot dinh 52 tuan
  r("GGG", { doi: 2.5, atr_pct: 1 }), // tang manh + dong tien vao (xem chiBao) + ngoai mua
  r("HHH", { doi: -1.5 }), // tien ra
  r("III", { mat_than: true, doi: -1 }),
  r("III2", { mat_than: true, doi: -4, atr_pct: 5 }), // giam manh hon -> len truoc
  r("NHO", { doi: 3, atr_pct: 1, gtgd_tb20: 1 }), // it thanh khoan: khong tinh dong tien / khoi ngoai
  r("LLL", { doi: 6, atr_pct: 2 }), // vua MUA vua tang manh
];
const chiBao = [
  { ma: "GGG", kl_ty_le: 3.2, cach_day_52t_pct: 40 },
  { ma: "HHH", kl_ty_le: 2.4, cach_day_52t_pct: 0.3 }, // sat day + tien ra
  { ma: "AAA", kl_ty_le: 1.5, cach_day_52t_pct: 0 }, // kl chua du; dung day
  { ma: "BBB", kl_ty_le: 2.5, cach_day_52t_pct: 5 }, // kl du nhung gia chi -2,5% (>= 1% -> co); khong sat day
  { ma: "NHO", kl_ty_le: 5, cach_day_52t_pct: 50 },
  { ma: "EEE", kl_ty_le: 2.5, cach_day_52t_pct: 3 }, // doi +3% -> tien vao
];
const khoiNgoai = { theoMa: { GGG: 12, HHH: -30, EEE: 3, NHO: 50, FFF: 6, AAA: -40, CCC: -4 } };
const coHoi = {
  mua: [{ ma: "LLL", diem: 1.4 }, { ma: "MUA2", diem: 1.8 }, { ma: "MUA3", diem: -0.5 }],
  muaMoi: [{ ma: "QQQ" }],
  ban: [{ ma: "BAN1", lyDo: "Cắt lỗ", ketQuaPct: -3 }, { ma: "BAN2", lyDo: "Bán theo tín hiệu", ketQuaPct: 5 }],
  banBot: [{ ma: "JJJ", loai: "chot", tp: "TP2", laiPct: 8 }, { ma: "RRR", loai: "canhBao", laiPct: -2 }],
};
const muaPhucHoi = [{ ma: "MMM", cach: 0, giam: 24, klDay: 2.5 }, { ma: "NNN", cach: 1, giam: 21, klDay: 1 }];
const batDay = [{ ma: "OOO", diem: 4 }, { ma: "PPP", diem: 6 }];

// --- Khach: chi loai thi truong ---
const khach = dungSuKienRadar({ tatCa, coHoi, muaPhucHoi, batDay, chiBao, khoiNgoai, xemTinHieu: false });
const co = (kq, ma, loai) => kq.suKien.some((s) => s.ma === ma && s.loai === loai);
ok("khach chi thay loai thi truong", khach.suKien.every((s) => !LOAI_RADAR[s.loai].thanhVien), [...new Set(khach.suKien.map((s) => s.loai))].join());
ok("khach: dem cac loai thanh vien = 0", Object.keys(LOAI_RADAR).filter((l) => LOAI_RADAR[l].thanhVien).every((l) => khach.dem[l] === 0), JSON.stringify(khach.dem));
ok("tang manh: AAA, DDD, GGG, LLL, NHO; khong BBB / EEE", ["AAA", "DDD", "GGG", "LLL", "NHO"].every((m) => co(khach, m, "tang_manh")) && !co(khach, "BBB", "tang_manh") && !co(khach, "EEE", "tang_manh"));
ok("giam manh: CCC; BBB (1,25 lan ATR) va III2 (0,8 lan ATR) thi khong", co(khach, "CCC", "giam_manh") && !co(khach, "III2", "giam_manh") && !co(khach, "BBB", "giam_manh"));
ok("vuot dinh: FFF", co(khach, "FFF", "dinh") && khach.dem.dinh === 1);
ok("pha day: HHH (cach 0,3%), AAA (0%); GGG khong", co(khach, "HHH", "day") && co(khach, "AAA", "day") && !co(khach, "GGG", "day") && khach.dem.day === 2);
ok("tien vao: GGG (kl 3,2x, +2,5%), EEE (kl 2,5x, +3%)", co(khach, "GGG", "tien_vao") && co(khach, "EEE", "tien_vao") && khach.dem.tien_vao === 2, JSON.stringify(khach.dem));
ok("tien ra: HHH (kl 2,4x, -1,5%) va BBB (kl 2,5x, -2,5%)", co(khach, "HHH", "tien_ra") && co(khach, "BBB", "tien_ra") && khach.dem.tien_ra === 2);
ok("AAA kl 1,5x khong phai dong tien", !co(khach, "AAA", "tien_vao") && !co(khach, "AAA", "tien_ra"));
ok("NHO (GTGD 1 ty) khong co dong tien / khoi ngoai du kl 5x, ngoai 50 ty", !co(khach, "NHO", "tien_vao") && !co(khach, "NHO", "ngoai_mua"));
ok("ngoai mua: GGG 12 ty (>= 10 ty va >= 10% x 50); EEE 3 ty / FFF 6 ty khong du 10 ty", co(khach, "GGG", "ngoai_mua") && !co(khach, "EEE", "ngoai_mua") && !co(khach, "FFF", "ngoai_mua"));
ok("ngoai ban: HHH -30, AAA -40; CCC -4 khong", co(khach, "HHH", "ngoai_ban") && co(khach, "AAA", "ngoai_ban") && !co(khach, "CCC", "ngoai_ban"));
ok("mo ta gap bien do / gap TB20 / ngoai", /gấp 2,5 lần biên độ/.test(khach.suKien.find((s) => s.ma === "AAA" && s.loai === "tang_manh").moTa) && /gấp 3,2 lần TB20, giá tăng 2,5%/.test(khach.suKien.find((s) => s.ma === "GGG" && s.loai === "tien_vao").moTa) && /ngoại mua ròng 12,0 tỷ, bằng 24% GTGD/.test(khach.suKien.find((s) => s.ma === "GGG" && s.loai === "ngoai_mua").moTa), khach.suKien.find((s) => s.ma === "GGG" && s.loai === "ngoai_mua").moTa);
ok("mo ta ma thieu ATR khong co 'gap bien do'", !/biên độ/.test(khach.suKien.find((s) => s.ma === "DDD").moTa));
ok("moi (ma, loai) chi 1 dong", new Set(khach.suKien.map((s) => `${s.loai}:${s.ma}`)).size === khach.suKien.length);
ok("dem theo ma that", khach.dem.tang_manh === 5, JSON.stringify(khach.dem));

// --- Noi bat (top) ---
const topKhach = khach.suKien.filter((s) => s.top);
ok("moi ma toi da 1 o noi bat", new Set(topKhach.map((s) => s.ma)).size === topKhach.length);
ok("GGG noi bat o loai quan trong nhat (ngoai mua, thu tu 9) chu khong phai tang manh", topKhach.find((s) => s.ma === "GGG")?.loai === "ngoai_mua", JSON.stringify(topKhach.find((s) => s.ma === "GGG")));
ok("AAA noi bat la ngoai ban (quan trong hon day, tang manh)", topKhach.find((s) => s.ma === "AAA")?.loai === "ngoai_ban");
ok("moi loai noi bat toi da MOI_LOAI_TOI_DA", Object.keys(LOAI_RADAR).every((l) => topKhach.filter((s) => s.loai === l).length <= MOI_LOAI_TOI_DA));

// --- Thanh vien ---
const tv = dungSuKienRadar({ tatCa, coHoi, muaPhucHoi, batDay, chiBao, khoiNgoai, xemTinHieu: true });
ok("QQQ = mua moi, BAN1 = ban, JJJ = chot loi, RRR = giam bot", co(tv, "QQQ", "mua_moi") && co(tv, "BAN1", "ban") && co(tv, "JJJ", "chot_loi") && co(tv, "RRR", "ban_bot"));
ok("Mat Than: III, III2; III2 (giam manh hon) len truoc", co(tv, "III", "mat_than") && co(tv, "III2", "mat_than") && tv.suKien.findIndex((s) => s.ma === "III2" && s.loai === "mat_than") < tv.suKien.findIndex((s) => s.ma === "III" && s.loai === "mat_than"));
ok("LLL vua MUA vua tang manh -> o noi bat la mua", topKhach.every((s) => s.ma !== "LLL" || true) && tv.suKien.find((s) => s.ma === "LLL" && s.top)?.loai === "mua");
ok("diem B / bat day: MMM, NNN, OOO, PPP", co(tv, "MMM", "diem_b") && co(tv, "NNN", "diem_b") && co(tv, "OOO", "bat_day") && co(tv, "PPP", "bat_day"));
ok("dem MUA = 3", tv.dem.mua === 3, JSON.stringify(tv.dem));
ok("mo ta MUA diem <= 0 khong ghi diem", tv.suKien.find((s) => s.ma === "MUA3").moTa === "có tín hiệu MUA" && /2,4|1,8/.test(tv.suKien.find((s) => s.ma === "MUA2").moTa));
ok("mo ta ban lay ly do (viet thuong dau): 'cat lo'", tv.suKien.find((s) => s.ma === "BAN1").moTa === "cắt lỗ");
ok("mo ta diem B / bat day trung tinh (khong co 'diem mua')", !/điểm mua/i.test(tv.suKien.find((s) => s.ma === "MMM").moTa + tv.suKien.find((s) => s.ma === "OOO").moTa));
ok("diem B 'MMM' giam 24%", /giảm 24,0%/.test(tv.suKien.find((s) => s.ma === "MMM").moTa));
ok("xep theo thu tu loai", tv.suKien.map((s) => LOAI_RADAR[s.loai].thuTu).join() === [...tv.suKien.map((s) => LOAI_RADAR[s.loai].thuTu)].sort((a, b) => a - b).join());
ok("bat day: PPP (diem 6) truoc OOO (diem 4); diem B: MMM (KL day 2,5x) truoc NNN", tv.suKien.findIndex((s) => s.ma === "PPP") < tv.suKien.findIndex((s) => s.ma === "OOO") && tv.suKien.findIndex((s) => s.ma === "MMM") < tv.suKien.findIndex((s) => s.ma === "NNN"));
ok("ban: cat lo lo nhieu nhat (BAN1) truoc BAN2", tv.suKien.findIndex((s) => s.ma === "BAN1") < tv.suKien.findIndex((s) => s.ma === "BAN2"));
ok("thanh vien nhung chua co lenh nao / thieu chi bao / ngoai: khong loi", dungSuKienRadar({ tatCa, xemTinHieu: true }).dem.mua === 0);

// --- Gioi han noi bat ---
const nhieu = Array.from({ length: 40 }, (_, i) => r("M" + String(i).padStart(2, "0")));
const gh = dungSuKienRadar({ tatCa: nhieu, coHoi: { mua: nhieu.map((x, i) => ({ ma: x.ma, diem: i })) }, xemTinHieu: true });
ok("moi loai toi da 6 o noi bat nhung van giu du 40 su kien + dem that", gh.suKien.length === 40 && gh.suKien.filter((s) => s.top).length === MOI_LOAI_TOI_DA && gh.dem.mua === 40);
ok("diem cao nhat noi bat truoc", gh.suKien[0].ma === "M39" && gh.suKien[0].top === true && gh.suKien[6].top === undefined);
const nhieuLoai = dungSuKienRadar({
  tatCa: [...nhieu, ...Array.from({ length: 30 }, (_, i) => r("G" + i, { doi: 5, atr_pct: 1 })), ...Array.from({ length: 30 }, (_, i) => r("D" + i, { doi: -5, atr_pct: 1 }))],
  coHoi: { mua: nhieu.map((x, i) => ({ ma: x.ma, diem: i })), ban: Array.from({ length: 30 }, (_, i) => ({ ma: "B" + i, lyDo: "Cắt lỗ", ketQuaPct: -i })) },
  xemTinHieu: true,
});
ok("tong noi bat khong qua SO_NOI_BAT_TOI_DA", nhieuLoai.suKien.filter((s) => s.top).length <= SO_NOI_BAT_TOI_DA, String(nhieuLoai.suKien.filter((s) => s.top).length));
ok("du lieu rong khong loi", dungSuKienRadar().suKien.length === 0 && dungSuKienRadar({ tatCa: [null, {}] }).suKien.length === 0);

console.log(loi ? `\n${loi} LOI` : "\nTat ca dat");
process.exit(loi ? 1 : 0);
