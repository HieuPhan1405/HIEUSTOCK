// Test tay cho lib/soVN.js (dinh dang so kieu Viet Nam). Chay: node engine/test/soVN.test.mjs
import { soVN, pctVN, tyVN, khoiLuongVN } from "../../lib/soVN.js";

let loi = 0;
const ok = (ten, thuc, mong) => {
  if (thuc !== mong) {
    loi++;
    console.log("SAI:", ten, "->", JSON.stringify(thuc), "mong", JSON.stringify(mong));
  } else console.log("ok:", ten);
};

ok("chi so 1785.11", soVN(1785.11), "1.785,11");
ok("gia 25.5", soVN(25.5), "25,5");
ok("gia nguyen 243", soVN(243), "243");
ok("co dinh 2 so", soVN(1785.1, 2, true), "1.785,10");
ok("null -> gach", soVN(null), "—");
ok("NaN -> gach", soVN("abc"), "—");
ok("so am rat nho khong ra -0", soVN(-0.001, 2), "0");
ok("pct duong co dau +", pctVN(1.256, 2), "+1,26%");
ok("pct am", pctVN(-0.4, 1), "-0,4%");
ok("pct 0", pctVN(0), "0%");
ok("pct khong dau", pctVN(51.23, 1, false), "51,2%");
ok("ty lon", tyVN(26769.4), "26.769");
ok("ty nho", tyVN(10.44), "10,4");
ok("kl trieu", khoiLuongVN(1478900), "1,48 triệu cp");
ok("kl nghin", khoiLuongVN(850400), "850 nghìn cp");
ok("kl nho", khoiLuongVN(620), "620 cp");

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
