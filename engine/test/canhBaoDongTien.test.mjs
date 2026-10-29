// Test tay: node engine/test/canhBaoDongTien.test.mjs
import { canhBaoDongTien, gopCanhBao } from "../../lib/canhBaoDongTien.js";

let loi = 0;
const dat = (ten, dk, them = "") => {
  if (dk) console.log("ok:", ten);
  else { console.log("SAI:", ten, them); loi++; }
};
const k = (o) => canhBaoDongTien(o).map((c) => c.khoa);
const NGAY = "2026-10-29";

// ban chu dong ap dao (don vi trieu dong): ban 14.000 = 14 ty, mua 6.000 = 6 ty -> ban 70%
const ban = canhBaoDongTien({ tomTat: { mua: 6000, ban: 14000, nn: { mua: 1000, ban: 1200 } }, ngayDuLieu: NGAY, ngayPhien: NGAY, giu: true });
dat("ban chu dong ap dao -> canh bao nang khi dang giu", ban.length === 1 && ban[0].khoa === "ban_chu_dong" && ban[0].muc === 0, JSON.stringify(ban));
dat("cau chu de hieu, co so lieu", ban[0].nhan === "Bán chủ động đang áp đảo: bán 14 tỷ, mua 6 tỷ (bán chiếm 70%) — lực bán mạnh, cần chú ý", ban[0].nhan);
dat("khong giu -> muc 1", canhBaoDongTien({ tomTat: { mua: 6000, ban: 14000 }, ngayDuLieu: NGAY, ngayPhien: NGAY })[0].muc === 1);
dat("mua chu dong chiem uu the -> tich cuc", canhBaoDongTien({ tomTat: { mua: 14000, ban: 6000 }, ngayDuLieu: NGAY, ngayPhien: NGAY })[0].khoa === "mua_chu_dong");
dat("can bang (55 / 45) -> khong canh bao", k({ tomTat: { mua: 11000, ban: 9000 }, ngayDuLieu: NGAY, ngayPhien: NGAY }).length === 0);
dat("qua it (tong < 3 ty) -> bo qua", k({ tomTat: { mua: 500, ban: 2000 }, ngayDuLieu: NGAY, ngayPhien: NGAY }).length === 0);
dat("so lieu cua phien cu -> bo qua", k({ tomTat: { mua: 6000, ban: 14000 }, ngayDuLieu: "2026-10-28", ngayPhien: NGAY }).length === 0);

// khoi ngoai trong phien: mua 2.000 trieu, ban 9.000 trieu -> ban rong 7 ty, ban chiem 82%
const nn = canhBaoDongTien({ tomTat: { mua: 100, ban: 100, nn: { mua: 2000, ban: 9000 } }, ngayDuLieu: NGAY, ngayPhien: NGAY, giu: true });
dat("khoi ngoai ban rong 7 ty trong phien", nn.some((c) => c.khoa === "ngoai_ban_phien" && c.nhan === "Khối ngoại đang bán ròng 7 tỷ trong phiên — nên chú ý" && c.muc === 0), JSON.stringify(nn));
dat("khoi ngoai ban rong nho (3 ty) -> khong", !k({ tomTat: { nn: { mua: 1000, ban: 4000 } }, ngayDuLieu: NGAY, ngayPhien: NGAY }).includes("ngoai_ban_phien"));
dat("khoi ngoai mua rong lon -> tich cuc", k({ tomTat: { nn: { mua: 9000, ban: 2000 } }, ngayDuLieu: NGAY, ngayPhien: NGAY }).includes("ngoai_mua_phien"));

// nhieu phien lien tiep
const ls = [{ ngay: "a", rongTy: 30 }, { ngay: "b", rongTy: -20 }, { ngay: "c", rongTy: -40 }, { ngay: "d", rongTy: -35 }, { ngay: "e", rongTy: -25 }];
const lt = canhBaoDongTien({ nnLichSu: ls, giu: true });
dat("khoi ngoai ban rong 4 phien lien tiep tong 120 ty", lt.length === 1 && lt[0].khoa === "ngoai_ban_lien_tiep" && lt[0].nhan === "Khối ngoại bán ròng 4 phiên liên tiếp, tổng 120 tỷ — áp lực bán kéo dài", lt[0]?.nhan);
dat("chi 2 phien -> khong", k({ nnLichSu: [{ rongTy: 10 }, { rongTy: -20 }, { rongTy: -30 }] }).length === 0);
dat("3 phien nhung tong < 10 ty -> khong", k({ nnLichSu: [{ rongTy: -2 }, { rongTy: -3 }, { rongTy: -4 }] }).length === 0);
dat("mua rong lien tiep -> tich cuc", k({ nnLichSu: [{ rongTy: 10 }, { rongTy: 20 }, { rongTy: 5 }] }).includes("ngoai_mua_lien_tiep"));

// khoi luong
dat("kl gap 2,4 lan kem gia giam 3%", k({ klTyLe: 2.4, doiPhienPct: -3 }).includes("kl_giam"));
dat("kl gap 2,4 lan kem gia tang 3%", k({ klTyLe: 2.4, doiPhienPct: 3 }).includes("kl_tang"));
dat("kl cao nhung gia di ngang -> khong", k({ klTyLe: 2.4, doiPhienPct: 0.2 }).length === 0);
dat("kl binh thuong -> khong", k({ klTyLe: 1.0, doiPhienPct: -3 }).length === 0);

// RSI
dat("RSI 80 -> nong, RSI 20 -> qua ban, RSI 50 -> khong", k({ rsi: 80 }).includes("rsi_nong") && k({ rsi: 20 }).includes("rsi_qua_ban") && k({ rsi: 50 }).length === 0);

// khong du lieu gi -> rong, khong loi
dat("rong -> rong", canhBaoDongTien().length === 0 && canhBaoDongTien({ tomTat: null, nnLichSu: null }).length === 0);

// gop
const g = gopCanhBao([{ khoa: "a", muc: 2 }, { khoa: "b", muc: 0 }], [{ khoa: "c", muc: 1 }, { khoa: "d", muc: 0 }], 3);
dat("gop: nang truoc, cat 3, con lai 1", g.cacCanhBao.map((x) => x.khoa).join() === "b,d,c" && g.them === 1, JSON.stringify(g));

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
