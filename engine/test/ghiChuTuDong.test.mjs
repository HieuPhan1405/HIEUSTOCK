// Test tay: node engine/test/ghiChuTuDong.test.mjs
import { ghiChuTuDong, duoiTenkanDangGiu, coCanhBaoBanBot, cacMucThamChieu } from "../../lib/ghiChuTuDong.js";

let loi = 0;
const dat = (ten, dk) => {
  if (dk) console.log("ok:", ten);
  else { console.log("SAI:", ten); loi++; }
};
const khoa = (r) => ghiChuTuDong(r).map((c) => c.khoa);

// canh bao Ban bot
dat("dang giu + duoi Tenkan -> canh bao", duoiTenkanDangGiu({ tin: "NAM GIU", cach_tenkan_pct: -0.4 }) === true);
dat("MUA moi + duoi Tenkan -> canh bao", duoiTenkanDangGiu({ tin: "MUA", cach_tenkan_pct: -2 }) === true);
dat("tren Tenkan -> khong canh bao", duoiTenkanDangGiu({ tin: "NAM GIU", cach_tenkan_pct: 1.2 }) === false);
dat("dung Tenkan (0) -> khong canh bao", duoiTenkanDangGiu({ tin: "NAM GIU", cach_tenkan_pct: 0 }) === false);
dat("TRUNG LAP duoi Tenkan -> khong canh bao (khong giu)", duoiTenkanDangGiu({ tin: "TRUNG LAP", cach_tenkan_pct: -3 }) === false);
dat("thieu cot -> khong canh bao", duoiTenkanDangGiu({ tin: "NAM GIU" }) === false && duoiTenkanDangGiu({ tin: "NAM GIU", cach_tenkan_pct: "" }) === false);
dat("ban_bot san co van tinh", coCanhBaoBanBot({ tin: "NAM GIU", ban_bot: true, cach_tenkan_pct: 2 }) === true);
dat("khong giu (TRUNG LAP) co ban_bot -> khong canh bao", coCanhBaoBanBot({ tin: "TRUNG LAP", ban_bot: true }) === false);
dat("khong ban_bot, tren Tenkan -> khong", coCanhBaoBanBot({ tin: "NAM GIU", ban_bot: false, cach_tenkan_pct: 2 }) === false);

// muc tham chieu: Tenkan tu cach_tenkan_pct (gia 11, cach -10% -> Tenkan ~12,22)
const m = cacMucThamChieu({ gia: 11, cach_tenkan_pct: -10, kijun: 10.5, cach_ma50_pct: 5 });
dat("Tenkan = gia / (1 + cach)", Math.abs(m.find((x) => x.ten === "Tenkan").gia - 11 / 0.9) < 1e-9);
dat("MA50 = gia / 1,05", Math.abs(m.find((x) => x.ten === "MA50").gia - 11 / 1.05) < 1e-9);
dat("khong co gia -> rong", cacMucThamChieu({ kijun: 10 }).length === 0 && ghiChuTuDong({ kijun: 10 }).length === 0);

// ghi chu day du
const g = { tin: "NAM GIU", gia: 13.7, kijun: 13.0, cach_kijun_pct: 5.4, cach_tenkan_pct: -1.5, gia_so_may: 1, cach_ma20_pct: 3, cach_ma50_pct: 6, cach_ma200_pct: -4, gg_top: 14.5, gg_bot: 12.0, dinh_52t: 20, stop_loss: 12.3 };
const k = khoa(g);
dat("co chip Duoi Tenkan truoc tien", k[0] === "duoi_tenkan");
dat("tren may -> Tren may, khong phai Duoi kijun", k.includes("tren_may") && !k.includes("duoi_kijun"));
const kc = ghiChuTuDong(g).find((c) => c.khoa === "khang_cu");
dat("KC gan nhat phia tren la Tenkan 13,91 (cach +1,5%) vi gia dang duoi Tenkan", kc && kc.nhan.startsWith("KC 13,91") && kc.nhan.includes("Tenkan") && kc.nhan.includes("+1,5%"));
dat("KC cach 1,5% (<= 3%) in dam", kc && kc.manh === true);
dat("KC cach 5,8% (can bang dai han 14,5, khi bo Tenkan) khong in dam", (() => { const x = ghiChuTuDong({ ...g, cach_tenkan_pct: 2, cach_ma200_pct: null }).find((c) => c.khoa === "khang_cu"); return x && x.nhan.startsWith("KC 14,50") && x.nhan.includes("+5,8%") && x.manh === false; })());
const ht = ghiChuTuDong(g).find((c) => c.khoa === "ho_tro");
dat("HT gan nhat phia duoi la MA20 (13,30) , khong phai Kijun 13,0", ht && ht.nhan.includes("MA20") && ht.nhan.includes("−2,9%"));
dat("sat cat lo: gia 13,7 > 12,3 x 1,03 -> khong chip", !k.includes("gan_cat_lo"));
dat("sat cat lo khi gia 12,5", khoa({ ...g, gia: 12.5, cach_tenkan_pct: -1 }).includes("gan_cat_lo"));
dat("KC xa hon 10% khong ghi", !khoa({ tin: "NAM GIU", gia: 10, dinh_52t: 20 }).includes("khang_cu"));
dat("ma khong giu van co KC/HT, khong co chip cat lo", !khoa({ tin: "TRUNG LAP", gia: 12.5, stop_loss: 12.3, kijun: 12 }).includes("gan_cat_lo"));
dat("duoi may / trong may", khoa({ gia: 10, gia_so_may: -1 }).includes("duoi_may") && khoa({ gia: 10, gia_so_may: 0 }).includes("trong_may"));

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
