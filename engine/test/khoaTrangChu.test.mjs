// Test tay cho lib/khoaTrangChu.js. Chay: node engine/test/khoaTrangChu.test.mjs
import { quyenTrangChu, locCauNhanDinh } from "../../lib/khoaTrangChu.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

ok("chua dang nhap -> khoa, khong phai cho duyet", JSON.stringify(quyenTrangChu(null)) === JSON.stringify({ xemTinHieu: false, choDuyet: false }));
ok("undefined -> khoa", quyenTrangChu(undefined).xemTinHieu === false);
ok("da dang nhap nhung chua duyet -> khoa + cho duyet", JSON.stringify(quyenTrangChu({ id: 1, da_duyet: false })) === JSON.stringify({ xemTinHieu: false, choDuyet: true }));
ok("da duyet -> duoc xem", JSON.stringify(quyenTrangChu({ id: 1, da_duyet: true })) === JSON.stringify({ xemTinHieu: true, choDuyet: false }));
ok("da_duyet dang chuoi 'true'/khac boolean khong lam mo khoa nham", quyenTrangChu({ da_duyet: 0 }).xemTinHieu === false);

const cac = [{ cau: "Thi truong nghieng tich cuc", tinHieu: false }, { cau: "Co 3 ma canh bao Mat Than", tinHieu: true }, { cau: "Tin hieu moi: 2 ma MUA", tinHieu: true }, { cau: "Co 5 ma vuot dinh", tinHieu: false }];
ok("khach: bo cac cau ve tin hieu", JSON.stringify(locCauNhanDinh(cac, false)) === JSON.stringify(["Thi truong nghieng tich cuc", "Co 5 ma vuot dinh"]));
ok("thanh vien: giu du", locCauNhanDinh(cac, true).length === 4);

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
