// Test tay cho lib/tinhDinhGia.js (PE/PB ca thi truong = tong von hoa / tong loi nhuan). Chay: node engine/test/tinhDinhGia.test.mjs
import { gopTySo, thongKeMang } from "../../lib/tinhDinhGia.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

// 2 ma: A von hoa 100 PE 10 (loi nhuan 10), B von hoa 300 PE 30 (loi nhuan 10) => PE nhom = 400 / 20 = 20 (khong phai trung binh 20 = (10+30)/2 vi trong so von hoa)
let r = gopTySo({ A: 100, B: 300 }, { A: 10, B: 30 });
ok("PE nhom = tong von hoa / tong loi nhuan", gan(r.giaTri, 20) && r.soMa === 2 && gan(r.phuVonHoaPct, 100), JSON.stringify(r));

// Ma lo (PE am) va thieu PE bi loai khoi CA tu so lan mau so
r = gopTySo({ A: 100, B: 300, C: 50, D: 50 }, { A: 10, B: 30, C: -5 });
ok("loai ma PE am/thieu khoi tu va mau", gan(r.giaTri, 20) && r.soMa === 2, JSON.stringify(r));
ok("phu von hoa = 400/500 = 80%", gan(r.phuVonHoaPct, 80) && gan(r.tongVonHoa, 500));

// Theo nhom (tapMa)
r = gopTySo({ A: 100, B: 300, C: 50 }, { A: 10, B: 30, C: 5 }, new Set(["A", "C"]));
ok("theo nhom: A + C", gan(r.giaTri, 150 / (10 + 10)) && r.soMa === 2 && gan(r.tongVonHoa, 150), JSON.stringify(r));

// Nhom rong / khong co ty so hop le -> giaTri null
ok("khong ma hop le -> null", gopTySo({ A: 100 }, { A: -1 }).giaTri === null);
ok("nhom rong -> null", gopTySo({ A: 100 }, { A: 10 }, new Set(["Z"])).giaTri === null);
ok("von hoa 0 bi bo", gopTySo({ A: 0, B: 100 }, { A: 10, B: 20 }).soMa === 1);

// Thong ke mang
let t = thongKeMang([2, 4, 4, 4, 5, 5, 7, 9]);
ok("thongKeMang tb = 5, do lech chuan tong the = 2", gan(t.tb, 5) && gan(t.doLech, 2) && t.n === 8, JSON.stringify(t));
t = thongKeMang([1, NaN, 3, null, undefined]);
ok("thongKeMang bo gia tri khong hop le", t.n === 2 && gan(t.tb, 2), JSON.stringify(t));
ok("thongKeMang rong", thongKeMang([]).tb === null);

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
