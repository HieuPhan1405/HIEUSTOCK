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

// muc tham chieu: chi Kijun, can bang dai han, dinh 52 tuan (khong MA, khong Tenkan)
const m = cacMucThamChieu({ gia: 11, cach_tenkan_pct: -10, kijun: 10.5, cach_ma50_pct: 5, gg_top: 12, gg_bot: 9, dinh_52t: 15 });
dat("4 duong cua he thong, khong co MA / Tenkan", m.map((x) => x.ten).join() === "Kijun,cân bằng dài hạn,cân bằng dài hạn,đỉnh 52 tuần");
dat("khong co gia -> rong", cacMucThamChieu({ kijun: 10 }).length === 0 && ghiChuTuDong({ kijun: 10 }).length === 0);

// ghi chu day du
const g = { tin: "NAM GIU", gia: 13.7, kijun: 13.0, cach_kijun_pct: 5.4, cach_tenkan_pct: -1.5, gia_so_may: 1, cach_ma20_pct: 3, cach_ma50_pct: 6, cach_ma200_pct: -4, gg_top: 14.5, gg_bot: 12.0, dinh_52t: 20, stop_loss: 12.3 };
const k = khoa(g);
dat("co chip Duoi Tenkan truoc tien", k[0] === "duoi_tenkan");
dat("tren may -> Tren may, khong phai Duoi kijun", k.includes("tren_may") && !k.includes("duoi_kijun"));
const kc = ghiChuTuDong(g).find((c) => c.khoa === "khang_cu");
dat("KC gan nhat phia tren la can bang dai han 14,50 (+5,8%), khong dung Tenkan / MA", kc && kc.nhan.startsWith("KC 14,50") && kc.nhan.includes("cân bằng dài hạn") && kc.nhan.includes("+5,8%"));
dat("KC cach 5,8% khong in dam", kc && kc.manh === false);
const ht = ghiChuTuDong(g).find((c) => c.khoa === "ho_tro");
dat("HT gan nhat phia duoi la Kijun 13,00 (−5,1%)", ht && ht.nhan.startsWith("HT 13,00") && ht.nhan.includes("Kijun") && ht.nhan.includes("−5,1%"));
dat("KC cach 2,9% in dam", (() => { const x = ghiChuTuDong({ ...g, gg_top: 14.1 }).find((c) => c.khoa === "khang_cu"); return x && x.manh === true; })());
dat("sat cat lo: gia 13,7 > 12,3 x 1,03 -> khong chip", !k.includes("gan_cat_lo"));
dat("sat cat lo khi gia 12,5", khoa({ ...g, gia: 12.5, cach_tenkan_pct: -1 }).includes("gan_cat_lo"));
dat("KC xa hon 10% khong ghi", !khoa({ tin: "NAM GIU", gia: 10, dinh_52t: 20 }).includes("khang_cu"));
dat("ma khong giu van co KC/HT, khong co chip cat lo", !khoa({ tin: "TRUNG LAP", gia: 12.5, stop_loss: 12.3, kijun: 12 }).includes("gan_cat_lo"));
dat("duoi may / trong may", khoa({ gia: 10, gia_so_may: -1 }).includes("duoi_may") && khoa({ gia: 10, gia_so_may: 0 }).includes("trong_may"));

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
