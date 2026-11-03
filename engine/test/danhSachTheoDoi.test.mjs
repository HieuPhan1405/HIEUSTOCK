// Test tay cho lib/danhSachTheoDoiThuan.js (nhieu danh sach theo doi). Chay: node engine/test/danhSachTheoDoi.test.mjs
import { chuanHoaMa, chuanHoaTen, chuanHoaId, dsChuaMa, tenGoiY, GIOI_HAN, ID_CHINH } from "../../lib/danhSachTheoDoiThuan.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

ok("chuan hoa ma: chu hoa, bo trung, bo ma sai", chuanHoaMa([" fpt", "FPT", "hpg", "", null, "VN-INDEX", "a", "VCB"]).join() === "FPT,HPG,VCB");
ok("chuan hoa ma: nhan 1 chuoi", chuanHoaMa("ssi").join() === "SSI");
ok("ten: bo khoang trang thua", chuanHoaTen("  Ngân   hàng  ") === "Ngân hàng");
ok("ten rong -> null", chuanHoaTen("   ") === null && chuanHoaTen(null) === null);
ok("ten cat toi da", chuanHoaTen("x".repeat(100)).length === GIOI_HAN.doDaiTen);
ok("id: chinh / so / chuoi so / sai", chuanHoaId(ID_CHINH) === ID_CHINH && chuanHoaId(5) === 5 && chuanHoaId("12") === 12 && chuanHoaId("abc") === null && chuanHoaId(0) === null && chuanHoaId(-3) === null && chuanHoaId(1.5) === null);
const ds = [
  { id: "chinh", ma: [{ ma: "FPT" }, { ma: "HPG" }] },
  { id: 3, ma: [{ ma: "FPT" }] },
  { id: 4, ma: [] },
];
ok("danh sach chua ma", dsChuaMa(ds, "FPT").join() === "chinh,3" && dsChuaMa(ds, "VCB").length === 0 && dsChuaMa(null, "FPT").length === 0);
ok("ten goi y khong trung", tenGoiY(["Lọc 04/11", "lọc 04/11 (2)"], "Lọc 04/11") === "Lọc 04/11 (3)" && tenGoiY([], "Lọc 04/11") === "Lọc 04/11");

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
