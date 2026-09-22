// Test tay cho engine/loi/breadth.js - dung dung 10 ma that cua nhom "Bao hiem" (nho nhat trong
// 15 nhom, de kiem soat toan bo), cac nhom khac khong co du lieu (breadth = 0% moi nhom).
import { tinhTatCaBreadth, breadthCuaMa } from "../loi/breadth.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => a != null && b != null && Math.abs(a - b) < e;

// Bao hiem (10 ma): BIC,BMI,BVH,MIG,PGI,ABI,VNR,PVI,PRE,PTI - 3/10 tren MA50 = 30%.
const tren50 = new Set(["BIC", "BMI", "BVH"]);
const baoHiem = new Set(["BIC", "BMI", "BVH", "MIG", "PGI", "ABI", "VNR", "PVI", "PRE", "PTI"]);
function layDuLieu(ma) {
  if (!baoHiem.has(ma)) return undefined; // 14 nhom khac hoan toan khong co du lieu
  return { gia: tren50.has(ma) ? 20 : 10, ma50: 15 };
}

const ketQua = tinhTatCaBreadth(layDuLieu);
ok("Breadth nhom Bao hiem = 3/10*100 = 30%", gan(ketQua.theoNganh.get("Bao hiem"), 30), ketQua.theoNganh.get("Bao hiem"));
ok("14 nhom con lai khong co du lieu -> 0% moi nhom", [...ketQua.theoNganh].filter(([t]) => t !== "Bao hiem").every(([, v]) => v === 0));
ok("Trung binh 15 nhom = (30 + 0*14)/15 = 2.0", gan(ketQua.trungBinh, 2.0), ketQua.trungBinh);

ok("breadthCuaMa('BIC') = breadth nhom Bao hiem = 30", gan(breadthCuaMa("BIC", ketQua), 30));
ok("breadthCuaMa('ZZZZ' - khong thuoc nganh nao) = trung binh = 2.0", gan(breadthCuaMa("ZZZZ", ketQua), 2.0));

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
