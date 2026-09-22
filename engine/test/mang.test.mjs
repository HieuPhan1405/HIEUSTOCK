import { barsSince, highestSince } from "../loi/mang.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

{
  const dk = [false, true, false, false, true, false];
  const kq = barsSince(dk);
  ok("chua tung dung -> Infinity", kq[0] === Infinity);
  ok("dung ngay tai nen -> 0", kq[1] === 0);
  ok("dem tang dan sau do", kq[2] === 1 && kq[3] === 2);
  ok("dung lai lan nua -> reset ve 0", kq[4] === 0);
}

{
  const dk = [false, true, false, false, true, false];
  const mang = [5, 10, 8, 15, 3, 20];
  const kq = highestSince(dk, mang);
  ok("chua tung dung -> null", kq[0] === null);
  ok("dung ngay tai nen -> lay CHINH gia tri do (10)", kq[1] === 10);
  ok("giu cao nhat tu do (max(10,8)=10, roi max(10,15)=15)", kq[2] === 10 && kq[3] === 15);
  ok("dung lai -> reset ve gia tri CHINH nen do (3), du 3 < max cu", kq[4] === 3);
  ok("sau do lai lay cao nhat tiep (max(3,20)=20)", kq[5] === 20);
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
