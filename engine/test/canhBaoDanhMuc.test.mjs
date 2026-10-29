// Test tay: node engine/test/canhBaoDanhMuc.test.mjs
import { canhBaoDangCo } from "../../lib/canhBaoDanhMuc.js";

let loi = 0;
const dat = (ten, dk, them = "") => {
  if (dk) console.log("ok:", ten);
  else { console.log("SAI:", ten, them); loi++; }
};
const k = (r) => canhBaoDangCo(r).cacCanhBao.map((c) => c.khoa);
const nhan = (r, khoa) => canhBaoDangCo(r).cacCanhBao.find((c) => c.khoa === khoa)?.nhan;

const giu = { tin: "NAM GIU", gia: 13.7, kijun: 13.0, cach_kijun_pct: 5.4, cach_tenkan_pct: 1, gia_so_may: 1, gg_top: 14.5, gg_bot: 12, dinh_52t: 20, stop_loss: 12.3, tp1: 14.0, tp2: 15, tp3: 17, tp_da_cham: "" };

dat("khong gia -> rong", canhBaoDangCo({}).cacCanhBao.length === 0);
// sap toi moc chot loi: TP1 14,0 cach 2,2%
dat("sap toi moc chot loi TP1 (cach 2,2%)", nhan(giu, "sap_tp") === "Sắp tới mốc chốt lời TP1 14,00 — còn cách 2,2%", nhan(giu, "sap_tp"));
dat("da cham TP1 -> canh bao TP2 (15,0 cach 9,5% > 3%) khong co", !k({ ...giu, tp_da_cham: "TP1" }).includes("sap_tp"));
dat("da cham TP1, gia 14,7 sap TP2 15 (+2%) -> canh bao TP2", nhan({ ...giu, gia: 14.7, tp_da_cham: "TP1", gg_top: 18, kijun: 13 }, "sap_tp")?.startsWith("Sắp tới mốc chốt lời TP2"));
dat("khong giu thi khong co moc chot loi", !k({ ...giu, tin: "TRUNG LAP" }).includes("sap_tp"));
// vung can: gia 13,7, can gan nhat tren = 14,5 (cach 5,8%) -> khong canh bao (xa hon 3%); gia 14,2 -> 14,5 cach 2,1%
dat("vung can xa 5,8% khong canh bao", !k(giu).includes("sap_can"));
dat("sap toi vung can 14,50 (cach 2,1%)", nhan({ ...giu, gia: 14.2, tp1: 20, tp2: 21, tp3: 22 }, "sap_can") === "Giá sắp tới vùng cản 14,50 (đường cân bằng dài hạn) — còn cách 2,1%, dễ bị chững lại", nhan({ ...giu, gia: 14.2, tp1: 20, tp2: 21, tp3: 22 }, "sap_can"));
dat("sat vung do Kijun 13,0 khi gia 13,2", nhan({ ...giu, gia: 13.2, cach_kijun_pct: 1.5, tp1: 20 }, "sat_do")?.startsWith("Giá đang sát vùng đỡ 13,00 (Kijun)"));
// duoi Tenkan / Kijun / may
dat("dang giu duoi Tenkan -> goi y can nhac ban bot", nhan({ ...giu, cach_tenkan_pct: -1.2 }, "duoi_tk")?.includes("cân nhắc bán bớt"));
dat("duoi ca Tenkan va Kijun -> 1 canh bao gop, do", (() => { const c = canhBaoDangCo({ ...giu, cach_tenkan_pct: -1, cach_kijun_pct: -2 }).cacCanhBao.find((x) => x.khoa === "duoi_tk_kj"); return c && c.muc === 0 && !canhBaoDangCo({ ...giu, cach_tenkan_pct: -1, cach_kijun_pct: -2 }).cacCanhBao.some((x) => x.khoa === "duoi_tk" || x.khoa === "duoi_kj"); })());
dat("khong giu duoi Kijun -> khong noi 'ban bot'", !nhan({ ...giu, tin: "TRUNG LAP", cach_kijun_pct: -2 }, "duoi_kj")?.includes("bán bớt"));
dat("duoi may / trong may", k({ ...giu, gia_so_may: -1 }).includes("duoi_may") && k({ ...giu, gia_so_may: 0 }).includes("trong_may"));
// cat lo
dat("sap cat lo: gia 12,5 > SL 12,3 (cach 1,6%)", nhan({ ...giu, gia: 12.5, cach_tenkan_pct: 1, cach_kijun_pct: 1 }, "sap_cat_lo")?.includes("còn cách 1,6%"));
dat("da xuong muc cat lo", k({ ...giu, gia: 12.2 }).includes("cat_lo"));
// he thong
dat("Mat Than va Ban bot (dang giu) co canh bao", k({ ...giu, mat_than: true, ban_bot: true }).includes("mat_than") && k({ ...giu, mat_than: true, ban_bot: true }).includes("ban_bot"));
dat("Ban bot khi khong giu -> khong", !k({ ...giu, tin: "TRUNG LAP", ban_bot: true }).includes("ban_bot"));
// sap xep: nang truoc, tich cuc sau; cat bot toi da 4
{
  const r = canhBaoDangCo({ ...giu, gia: 13.95, mat_than: true, ban_bot: true, cach_tenkan_pct: -1, cach_kijun_pct: -2, gia_so_may: 0, stop_loss: 13.8 }, 4);
  dat("toi da 4 canh bao, con lai vao 'them'", r.cacCanhBao.length === 4 && r.them >= 1, JSON.stringify(r.cacCanhBao.map((c) => c.khoa)));
  dat("canh bao nang (muc 0) len truoc", r.cacCanhBao[0].muc === 0 && r.cacCanhBao.every((c, i, a) => i === 0 || a[i - 1].muc <= c.muc));
  dat("co vung can / do gan nhat de hien phu", r.canGanNhat.tren || r.canGanNhat.duoi);
}
dat("khong co gi dang chu y -> rong", canhBaoDangCo({ tin: "TRUNG LAP", gia: 10, kijun: 5, cach_kijun_pct: 100, cach_tenkan_pct: 50, gia_so_may: 1 }).cacCanhBao.length === 0);

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
