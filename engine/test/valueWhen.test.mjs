import { valueWhen } from "../loi/mang.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

const dieuKien = [false, true, false, false, true, false];
const mang = [1, 2, 3, 4, 5, 6];
const kq1 = valueWhen(dieuKien, mang, 1);
ok("chua co lan dung -> null", kq1[0] === null);
ok("dung ngay tai i -> lay gia tri CHINH nen do", kq1[1] === 2);
ok("giu nguyen gia tri cho toi lan dung tiep theo", kq1[2] === 2 && kq1[3] === 2);
ok("lan dung thu 2 cap nhat gia tri moi", kq1[4] === 5 && kq1[5] === 5);

const kq2 = valueWhen(dieuKien, mang, 2);
ok("n=2: chua du 2 lan dung -> null", kq2[3] === null);
ok("n=2: tai lan dung thu 2, gia tri GAN NHAT THU 2 la lan dau tien (2)", kq2[4] === 2 && kq2[5] === 2);

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
