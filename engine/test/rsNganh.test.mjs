// Test tay cho lib/rsNganh.js. Chay: node engine/test/rsNganh.test.mjs
import { tinhRSNganh } from "../../lib/rsNganh.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => a != null && b != null && Math.abs(a - b) < e;
const r = (ma, nganh, o = {}) => ({ ma, nganh, doi: 0, rs_vni: 0, gia: 10, kijun: 9, gg_top: 11, breadth_nganh: 50, gtgd_tb20: 10, ...o });

const ds = [
  r("A1", "Ngan hang", { doi: 2, rs_vni: 5, gia: 10, kijun: 9, gg_top: 9, breadth_nganh: 60, gtgd_tb20: 100 }),
  r("A2", "Ngan hang", { doi: -1, rs_vni: 1, gia: 10, kijun: 11, gg_top: 9, breadth_nganh: 60, gtgd_tb20: 50 }),
  r("A3", "Ngan hang", { doi: 3, rs_vni: 3, gia: 10, kijun: 9, gg_top: 12, breadth_nganh: 60, gtgd_tb20: 10 }),
  r("B1", "Thep", { doi: -2, rs_vni: -4 }),
  r("B2", "Thep", { doi: -3, rs_vni: -6 }),
  r("B3", "Thep", { doi: 1, rs_vni: -2 }),
  r("B4", "Thep", { doi: 0, rs_vni: null }),
  r("C1", "Bao hiem", { doi: 5, rs_vni: 9 }),
  r("C2", "Bao hiem", { doi: 5, rs_vni: 9 }),
  r("X", null, { doi: 9, rs_vni: 9 }),
];
const kq = tinhRSNganh(ds);
ok("nganh it hon 3 ma (Bao hiem) bi bo, ma khong nganh bi bo", kq.length === 2, kq.map((x) => x.khoa).join());
ok("xep theo RS20 giam dan, Ngan hang hang 1", kq[0].khoa === "Ngan hang" && kq[0].hang === 1 && kq[1].khoa === "Thep" && kq[1].hang === 2);
const nh = kq[0];
ok("so ma = 3", nh.soMa === 3);
ok("RS20 = trung vi (5,1,3) = 3", gan(nh.rs20, 3));
ok("doi TB = (2-1+3)/3", gan(nh.doiTB, 4 / 3));
ok("ty le tang = 2/3", gan(nh.tyTang, (2 / 3) * 100));
ok("tren Kijun: 2/3 (A1, A3 tren; A2 duoi)", gan(nh.trenKijun, (2 / 3) * 100));
ok("tren can bang dai han: 2/3 (A1, A2 gia 10 > 9; A3 gg_top 12 o tren)", gan(nh.trenCanBang, (2 / 3) * 100));
ok("tren MA50 = breadth_nganh = 60", gan(nh.trenMa50, 60));
ok("GTGD tong = 160", gan(nh.gtgd, 160));
const th = kq[1];
ok("RS20 bo qua gia tri null: trung vi (-4,-6,-2) = -4", gan(th.rs20, -4));
ok("nhan tieng Viet co dau", nh.nhan === "Ngân hàng" && th.nhan === "Thép");
ok("danh sach rong -> mang rong", tinhRSNganh([]).length === 0);

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
