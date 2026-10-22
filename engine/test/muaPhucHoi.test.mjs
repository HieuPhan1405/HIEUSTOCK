// Test tay cho lib/muaPhucHoi.js (o "Mua phuc hoi (diem B)" o trang dau). Chay: node engine/test/muaPhucHoi.test.mjs
import { dungMuaPhucHoi } from "../../lib/muaPhucHoi.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

const hang = [
  { ma: "AAA", pb_cach: 0, pb_gia: 10, pb_day: 8.8, pb_sl: 9.4, pb_tp1: 10.8, pb_tp2: 11.5, pb_tp3: 13 },
  { ma: "BBB", pb_cach: 2, pb_gia: 20, pb_day: 17, pb_sl: 18.6, pb_tp1: 21.5, pb_tp2: 23, pb_tp3: 26 },
  { ma: "CCC", pb_cach: 3, pb_gia: 10, pb_day: 9, pb_sl: 9.4, pb_tp1: 11, pb_tp2: 12, pb_tp3: 13 }, // qua han 3 phien
  { ma: "DDD", pb_cach: 0, pb_gia: 10, pb_day: 9, pb_sl: 9.4, pb_tp1: 11, pb_tp2: 12, pb_tp3: 13 }, // he thong dang giu
  { ma: "EEE", pb_cach: 1, pb_gia: 10, pb_day: 9, pb_sl: 9.4, pb_tp1: 11, pb_tp2: 12, pb_tp3: 13 }, // thung SL
  { ma: "FFF", pb_cach: 1, pb_gia: 10, pb_day: 9, pb_sl: 9.4, pb_tp1: 11, pb_tp2: 12, pb_tp3: 13 }, // gia chay qua xa B
  { ma: "GGG", pb_cach: null, pb_gia: null, pb_day: null, pb_sl: null, pb_tp1: null, pb_tp2: null, pb_tp3: null },
  { ma: "HHH", pb_cach: 0, pb_gia: 10, pb_day: 9, pb_sl: 9.4, pb_tp1: 11, pb_tp2: 12, pb_tp3: 13 }, // khong co trong tin_hieu
];
const tatCa = [
  { ma: "AAA", tin: "TRUNG LAP", gia: 10.1, doi: 1 },
  { ma: "BBB", tin: "TRUNG LAP", gia: 20.2, doi: -0.5 },
  { ma: "CCC", tin: "TRUNG LAP", gia: 10, doi: 0 },
  { ma: "DDD", tin: "NAM GIU", gia: 10, doi: 0 },
  { ma: "EEE", tin: "TRUNG LAP", gia: 9.3, doi: -3 },
  { ma: "FFF", tin: "TRUNG LAP", gia: 11, doi: 5 },
  { ma: "GGG", tin: "TRUNG LAP", gia: 5, doi: 0 },
];

const ds = dungMuaPhucHoi({ hang, tatCa });
ok("chi giu AAA va BBB", ds.map((x) => x.ma).join(",") === "AAA,BBB", ds.map((x) => x.ma).join(","));
ok("diem B hom nay len truoc", ds[0].ma === "AAA" && ds[0].cach === 0);
ok("SL / TP lay tu cot pb_*", ds[0].sl === 9.4 && ds[0].tp1 === 10.8 && ds[0].tp2 === 11.5);
ok("gia B cach day tinh %", Math.abs(ds[0].bDayPct - (10 / 8.8 - 1) * 100) < 1e-9);
{
  const r = dungMuaPhucHoi({ hang: [{ ...hang[0], ma: "KL1", pb_cach: 2, pb_kl_day: 2.5 }, { ...hang[0], ma: "KL0", pb_cach: 0, pb_kl_day: 1.2 }], tatCa: [{ ma: "KL1", tin: "TRUNG LAP", gia: 10, doi: 0 }, { ma: "KL0", tin: "TRUNG LAP", gia: 10, doi: 0 }] });
  ok("ma ban thao co KL (>= 2x) xep truoc du diem B cu hon", r.map((x) => x.ma).join(",") === "KL1,KL0" && r[0].klDay === 2.5, r.map((x) => x.ma).join(","));
}
{
  // lenh da cat lo (pb_cat = 1) bi an; laiPct = gia hien tai so voi gia vao (pb_vao), thieu pb_vao thi so voi gia B
  const r = dungMuaPhucHoi({
    hang: [{ ...hang[0], ma: "OK1", pb_cach: 1, pb_vao: 9.5, pb_cat: 0 }, { ...hang[0], ma: "CUT", pb_cach: 1, pb_cat: 1 }, { ...hang[0], ma: "NOV", pb_cach: 0 }],
    tatCa: [{ ma: "OK1", tin: "TRUNG LAP", gia: 10.45, doi: 0 }, { ma: "CUT", tin: "TRUNG LAP", gia: 10, doi: 0 }, { ma: "NOV", tin: "TRUNG LAP", gia: 10.3, doi: 0 }],
  });
  ok("an lenh da cat lo (pb_cat = 1)", !r.some((x) => x.ma === "CUT"), r.map((x) => x.ma).join(","));
  const ok1 = r.find((x) => x.ma === "OK1"), nov = r.find((x) => x.ma === "NOV");
  ok("laiPct so voi gia vao (10,45 / 9,5 - 1 = +10%); thieu pb_vao so voi gia B (10,3 / 10 - 1 = +3%)", ok1 && Math.abs(ok1.laiPct - 10) < 1e-9 && ok1.giaVao === 9.5 && nov && Math.abs(nov.laiPct - 3) < 1e-9 && nov.giaVao === 10, JSON.stringify([ok1?.laiPct, nov?.laiPct]));
}
ok("khong co du lieu: mang rong", dungMuaPhucHoi({}).length === 0);

if (loi) {
  console.log(`\n${loi} loi`);
  process.exit(1);
}
console.log("\nTat ca dat");
