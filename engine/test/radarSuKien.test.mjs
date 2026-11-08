// Test tay cho lib/radarSuKien.js. Chay: node engine/test/radarSuKien.test.mjs
import { dungSuKienRadar, chonLuoiMa, LOAI_RADAR, SO_SU_KIEN_TOI_DA } from "../../lib/radarSuKien.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const r = (ma, o = {}) => ({ ma, tin: "TRUNG LAP", doi: 0, gia: 10, dinh_52t: 20, atr_pct: 2, gtgd_tb20: 10, diem: 0, ...o });

const tatCa = [
  r("AAA", { doi: 5.4, atr_pct: 2.2 }), // gia tang 5,4% = 2,45 lan ATR -> bat thuong
  r("BBB", { doi: -2.5, atr_pct: 2.0 }), // giam 2,5% = 1,25 lan ATR -> KHONG
  r("CCC", { doi: 2.1, atr_pct: 0.8 }), // 2,6 lan ATR -> co
  r("DDD", { doi: 4.2, atr_pct: null }), // thieu ATR: >= 4% -> co
  r("EEE", { doi: 3, atr_pct: null }), // thieu ATR, 3% -> khong
  r("FFF", { gia: 20, dinh_52t: 20, doi: 0.5 }), // dinh 52 tuan
  r("III", { mat_than: true, doi: -1 }),
  r("III2", { mat_than: true, doi: -4, atr_pct: 5 }), // giam manh hon -> len truoc
];
// coHoi (dungCoHoiHomNay): chi viec xay ra TRONG PHIEN
const coHoi = {
  mua: [{ ma: "GGG", diem: 1.8 }, { ma: "LLL", diem: 1.4 }],
  muaMoi: [{ ma: "QQQ" }],
  ban: [{ ma: "HHH", lyDo: "Cắt lỗ", ketQuaPct: -3 }, { ma: "HH2", lyDo: "Bán theo tín hiệu", ketQuaPct: 5 }],
  banBot: [{ ma: "JJJ", loai: "chot", tp: "TP2", laiPct: 8 }, { ma: "RRR", loai: "canhBao", laiPct: -2 }],
};
// LLL vua MUA vua gia manh: phai giu loai quan trong hon (mua)
tatCa.push(r("LLL", { doi: 6, atr_pct: 2 }));
const muaPhucHoi = [{ ma: "MMM", cach: 0, giam: 24, klDay: 2.5 }, { ma: "NNN", cach: 1, giam: 21, klDay: 1 }];
const batDay = [{ ma: "OOO", diem: 4 }, { ma: "PPP", diem: 6 }];

// --- Khach: chi loai thi truong ---
const khach = dungSuKienRadar({ tatCa, coHoi, muaPhucHoi, batDay, xemTinHieu: false });
const loaiKhach = new Set(khach.suKien.map((s) => s.loai));
ok("khach chi thay gia + dinh", [...loaiKhach].every((l) => !LOAI_RADAR[l].thanhVien), [...loaiKhach].join());
ok("khach KHONG thay mua/ban/chot loi/giam bot/mat than/diem B/bat day", ["mua", "mua_moi", "ban", "ban_bot", "chot_loi", "mat_than", "diem_b", "bat_day"].every((l) => !loaiKhach.has(l)));
ok("khach: AAA, CCC, DDD, LLL gia bat thuong; BBB, EEE thi khong", ["AAA", "CCC", "DDD", "LLL"].every((m) => khach.suKien.some((s) => s.ma === m && s.loai === "gia")) && !khach.suKien.some((s) => s.ma === "BBB" || s.ma === "EEE"));
ok("khach: dem gia = 4, dinh = 1", khach.dem.gia === 4 && khach.dem.dinh === 1, JSON.stringify(khach.dem));
ok("khach: dem cac loai thanh vien = 0", Object.keys(LOAI_RADAR).filter((l) => LOAI_RADAR[l].thanhVien).every((l) => khach.dem[l] === 0), JSON.stringify(khach.dem));
ok("mo ta gia co 'gap ... lan bien do'", /gấp 2,5 lần biên độ/.test(khach.suKien.find((s) => s.ma === "AAA").moTa), khach.suKien.find((s) => s.ma === "AAA").moTa);
ok("mo ta ma thieu ATR khong co 'gap'", !/gấp/.test(khach.suKien.find((s) => s.ma === "DDD").moTa));

// --- Thanh vien ---
const tv = dungSuKienRadar({ tatCa, coHoi, muaPhucHoi, batDay, xemTinHieu: true });
const loaiTv = (ma) => tv.suKien.find((s) => s.ma === ma)?.loai;
ok("GGG = mua, QQQ = mua moi, HHH = ban, JJJ = chot loi, RRR = giam bot", loaiTv("GGG") === "mua" && loaiTv("QQQ") === "mua_moi" && loaiTv("HHH") === "ban" && loaiTv("JJJ") === "chot_loi" && loaiTv("RRR") === "ban_bot");
ok("Mat Than: III, III2", loaiTv("III") === "mat_than" && loaiTv("III2") === "mat_than");
ok("Mat Than: ma giam manh hon (III2) len truoc III", tv.suKien.findIndex((s) => s.ma === "III2") < tv.suKien.findIndex((s) => s.ma === "III"));
ok("LLL vua MUA vua gia manh -> giu loai quan trong hon (mua), moi ma 1 o", loaiTv("LLL") === "mua" && tv.suKien.filter((s) => s.ma === "LLL").length === 1);
ok("diem B / bat day: MMM, NNN, OOO, PPP", loaiTv("MMM") === "diem_b" && loaiTv("NNN") === "diem_b" && loaiTv("OOO") === "bat_day" && loaiTv("PPP") === "bat_day");
ok("dem MUA = 2 (GGG, LLL)", tv.dem.mua === 2, JSON.stringify(tv.dem));
ok("dem gia van tinh LLL du no hien o loai mua = 4", tv.dem.gia === 4);
ok("ma co mat than + gia khong bi nhan doi: dem mat_than = 2", tv.dem.mat_than === 2);
ok("mo ta ban lay ly do (viet thuong dau): 'cắt lỗ'", tv.suKien.find((s) => s.ma === "HHH").moTa === "cắt lỗ", tv.suKien.find((s) => s.ma === "HHH").moTa);
ok("mo ta chot loi co moc TP", /TP2/.test(tv.suKien.find((s) => s.ma === "JJJ").moTa));
ok("mo ta diem B / bat day trung tinh (khong co 'diem mua')", !/điểm mua/i.test(tv.suKien.find((s) => s.ma === "MMM").moTa + tv.suKien.find((s) => s.ma === "OOO").moTa), tv.suKien.find((s) => s.ma === "MMM").moTa);
ok("diem B 'MMM' giam 24%", /giảm 24,0%/.test(tv.suKien.find((s) => s.ma === "MMM").moTa), tv.suKien.find((s) => s.ma === "MMM").moTa);
ok("xep theo thu tu loai", tv.suKien.map((s) => LOAI_RADAR[s.loai].thuTu).join() === [...tv.suKien.map((s) => LOAI_RADAR[s.loai].thuTu)].sort((a, b) => a - b).join());
ok("mua: GGG (1,8) truoc LLL (1,4)", tv.suKien.findIndex((s) => s.ma === "GGG") < tv.suKien.findIndex((s) => s.ma === "LLL"));
ok("bat day: PPP (diem 6) truoc OOO (diem 4)", tv.suKien.findIndex((s) => s.ma === "PPP") < tv.suKien.findIndex((s) => s.ma === "OOO"));
ok("diem B: MMM (KL day 2,5x) truoc NNN", tv.suKien.findIndex((s) => s.ma === "MMM") < tv.suKien.findIndex((s) => s.ma === "NNN"));
ok("ban: cat lo lo nhieu nhat (HHH -3%) truoc HH2 (+5%)", tv.suKien.findIndex((s) => s.ma === "HHH") < tv.suKien.findIndex((s) => s.ma === "HH2"));
ok("thanh vien nhung chua co lenh nao: khong loi", dungSuKienRadar({ tatCa, xemTinHieu: true }).dem.mua === 0);

// --- Gioi han ---
const nhieu = Array.from({ length: 40 }, (_, i) => r("M" + String(i).padStart(2, "0")));
const gh = dungSuKienRadar({ tatCa: nhieu, coHoi: { mua: nhieu.map((x, i) => ({ ma: x.ma, diem: i })) }, xemTinHieu: true });
ok("moi loai toi da 6 o sang", gh.suKien.length === 6 && gh.dem.mua === 40, `${gh.suKien.length}/${gh.dem.mua}`);
ok("diem cao nhat len truoc", gh.suKien[0].ma === "M39");
const nhieuLoai = dungSuKienRadar({ tatCa: [...nhieu, ...Array.from({ length: 30 }, (_, i) => r("G" + i, { doi: 5, atr_pct: 1 }))], coHoi: { mua: nhieu.map((x, i) => ({ ma: x.ma, diem: i })), ban: Array.from({ length: 30 }, (_, i) => ({ ma: "B" + i, lyDo: "Cắt lỗ", ketQuaPct: -i })) }, xemTinHieu: true });
ok("tong khong qua SO_SU_KIEN_TOI_DA", nhieuLoai.suKien.length <= SO_SU_KIEN_TOI_DA, String(nhieuLoai.suKien.length));
ok("du lieu rong khong loi", dungSuKienRadar().suKien.length === 0 && dungSuKienRadar({ tatCa: [null, {}] }).suKien.length === 0);

// --- Luoi ma ---
const lon = Array.from({ length: 300 }, (_, i) => ({ ma: "X" + String(i).padStart(3, "0"), gtgd_tb20: i }));
const luoi = chonLuoiMa(lon, [{ ma: "X000" }], 120);
ok("luoi dung 120 o", luoi.length === 120, String(luoi.length));
ok("luoi co ma co su kien du thanh khoan thap (X000)", luoi.includes("X000"));
ok("luoi gom ma thanh khoan cao nhat (X299) va khong gom X100", luoi.includes("X299") && !luoi.includes("X100"));
ok("luoi xep A-Z", luoi.join() === [...luoi].sort().join());
ok("it ma hon so o: lay het", chonLuoiMa([{ ma: "B" }, { ma: "A" }], [], 120).join() === "A,B");

console.log(loi ? `\n${loi} LOI` : "\nTat ca dat");
process.exit(loi ? 1 : 0);
