// Test tay cho lib/coHoiHomNay.js (4 o lenh cua phien hom nay o trang dau). Chay: node engine/test/coHoiHomNay.test.mjs
import { dungCoHoiHomNay } from "../../lib/coHoiHomNay.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => a != null && Math.abs(a - b) <= e;

const NGAY = "2026-09-25";
const tatCa = [
  { ma: "AAA", tin: "MUA", diem: 3.1, gia: 20, ngay_mua: NGAY },
  { ma: "BBB", tin: "MUA", diem: 4.7, gia: 12.4, ngay_mua: NGAY },
  { ma: "CCC", tin: "BAN", diem: -2, gia: 30, lai_lo_pct: -4, ly_do_ban: 2 }, // chua co dong nhat ky -> lay tu tin hieu
  { ma: "DDD", tin: "BAN", diem: -1.8, gia: 50 }, // co dong nhat ky phien nay
  { ma: "EEE", tin: "NAM GIU", diem: -1.6, ban_bot: true, lai_lo_pct: 3.2, gia: 10, gia_mua: 9.7, ngay_mua: "2026-09-01" },
  { ma: "FFF", tin: "NAM GIU", diem: 2, gia: 24, gia_mua: 20, ngay_mua: "2026-09-01", lai_lo_pct: 20, dang_giu_giua: true, mua_giua: true, gia_mua_giua: 23.5, ngay_mua_giua: NGAY, stop_giua: 22, tp1_giua: 25, tp2_giua: 26.5 },
  { ma: "GGG", tin: "NAM GIU", diem: 2, gia: 24, gia_mua: 20, ngay_mua: "2026-09-01", dang_giu_giua: true, mua_giua: false, gia_mua_giua: 21, ngay_mua_giua: "2026-09-15" }, // mua moi tu truoc -> khong hien
  { ma: "HHH", tin: "TRUNG LAP", diem: 0.2, ban_bot: true }, // khong giu -> khong canh bao
];
const d = (o) => ({ ma: "DDD", ngay_mua: "2026-09-02", gia_mua: 40, ngay_ban: NGAY, gia_ban: 50, lai_lo_pct: 25, so_phien: 17, ly_do: "BAN", phan_chot_pct: 40, vong: 1, ...o });
const dongLenh = [
  d({ ly_do: "TP1", vong: 5, phan_chot_pct: 30, lai_lo_pct: 10, ngay_ban: "2026-09-10" }), // chot tu truoc (cung lenh) -> tinh vao ket qua, khong hien ban bot
  d({ ly_do: "TP2", vong: 6, phan_chot_pct: 30, lai_lo_pct: 20, ngay_ban: "2026-09-15" }),
  d({}), // DDD dong 40% hom nay +25%
  { ma: "III", ngay_mua: "2026-09-05", gia_mua: 10, ngay_ban: NGAY, gia_ban: 10.8, lai_lo_pct: 8, ly_do: "TP1", phan_chot_pct: 30, vong: 5 }, // chot TP1 hom nay
  { ma: "JJJ", ngay_mua: "2026-09-12", gia_mua: 30, ngay_ban: NGAY, gia_ban: 33.3, lai_lo_pct: 11, ly_do: "TP2", phan_chot_pct: 30, vong: 8 }, // mua moi chot TP2 hom nay
  { ma: "KKK", ngay_mua: "2026-09-18", gia_mua: 15, ngay_ban: NGAY, gia_ban: 14.1, lai_lo_pct: -6, ly_do: "CAT_LO", phan_chot_pct: 100, vong: 4 }, // mua moi cat lo hom nay
  { ma: "LLL", ngay_mua: "2026-09-01", gia_mua: 10, ngay_ban: "2026-09-24", gia_ban: 11, lai_lo_pct: 10, ly_do: "TP1", phan_chot_pct: 30, vong: 5 }, // hom qua -> khong hien
];
const kq = dungCoHoiHomNay({ tatCa, dongLenh, ngay: NGAY });

ok("Mua: 2 ma MUA, diem cao truoc", kq.mua.map((r) => r.ma).join() === "BBB,AAA");
ok("Mua moi: chi lenh mo HOM NAY (FFF), khong GGG", kq.muaMoi.length === 1 && kq.muaMoi[0].ma === "FFF" && kq.muaMoi[0].gia_mua === 23.5);
const ban = Object.fromEntries(kq.ban.map((b) => [b.ma, b]));
ok("Ban: DDD tu nhat ky, KKK mua moi cat lo, CCC tu tin hieu", kq.ban.length === 3 && ban.DDD && ban.KKK && ban.CCC, kq.ban.map((b) => b.ma).join());
ok("Ban DDD: ket qua ca lenh = 0.3*10 + 0.3*20 + 0.4*25 = 19, con lai 40%", gan(ban.DDD.ketQuaPct, 19) && ban.DDD.phanConLaiPct === 40 && ban.DDD.lyDo === "Bán theo tín hiệu", JSON.stringify(ban.DDD));
ok("Ban KKK: la mua moi, cat lo, -6%", ban.KKK.laMuaMoi && ban.KKK.lyDo === "Cắt lỗ" && gan(ban.KKK.ketQuaPct, -6));
ok("Ban CCC: ly do tu AFL (2 = cat lo), lai lo tu tin hieu", ban.CCC.lyDo === "Cắt lỗ" && ban.CCC.ketQuaPct === -4);
ok("Ban: lo nhieu nhat truoc", kq.ban[0].ma === "KKK");
const chot = kq.banBot.filter((b) => b.loai === "chot");
ok("Ban bot: chi chot TP trong phien (JJJ TP2 mua moi, III TP1), khong LLL / TP cu cua DDD", chot.map((b) => b.ma).join() === "JJJ,III", chot.map((b) => b.ma).join());
ok("Ban bot JJJ: mua moi, TP2 30% +11%", chot[0].laMuaMoi && chot[0].tp === "TP2" && chot[0].phanPct === 30 && chot[0].laiPct === 11);
const canhBao = kq.banBot.filter((b) => b.loai === "canhBao");
ok("Canh bao giam bot: chi ma dang giu (EEE), sau cac lan chot", canhBao.length === 1 && canhBao[0].ma === "EEE" && kq.banBot[kq.banBot.length - 1].loai === "canhBao");
ok("khong co ngay -> khong su kien nhat ky", dungCoHoiHomNay({ tatCa, dongLenh, ngay: null }).banBot.filter((b) => b.loai === "chot").length === 0);
// Cung 1 lenh cham TP1 + TP2 trong phien -> 1 dong, chot 60%, lai TB theo ty trong
{
  const r = dungCoHoiHomNay({
    ngay: NGAY,
    dongLenh: [
      { ma: "HAH", ngay_mua: "2026-09-01", gia_mua: 47, ngay_ban: NGAY, gia_ban: 50.82, lai_lo_pct: 8, ly_do: "TP1", phan_chot_pct: 30, vong: 5 },
      { ma: "HAH", ngay_mua: "2026-09-01", gia_mua: 47, ngay_ban: NGAY, gia_ban: 51.63, lai_lo_pct: 10, ly_do: "TP2", phan_chot_pct: 30, vong: 6 },
    ],
  });
  ok("gop TP1 + TP2 cung phien: 1 dong, 60%, lai 9%", r.banBot.length === 1 && r.banBot[0].tp === "TP1 + TP2" && r.banBot[0].phanPct === 60 && gan(r.banBot[0].laiPct, 9) && r.banBot[0].moc.length === 2);
}
ok("rong -> rong", (() => { const r = dungCoHoiHomNay({ ngay: NGAY }); return !r.mua.length && !r.ban.length && !r.muaMoi.length && !r.banBot.length; })());

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
