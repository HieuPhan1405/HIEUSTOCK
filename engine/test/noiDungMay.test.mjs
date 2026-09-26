// Test tay cho lib/noiDungMay.js (noi dung chi dan cua nhan vat Mây). Chay: node engine/test/noiDungMay.test.mjs
import { layGioiThieu, layGiaiThich, GIAI_THICH, GIOI_THIEU_TRANG } from "../../lib/noiDungMay.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

ok("trang dau khop chinh xac '/'", layGioiThieu("/").ten === "Tổng quan thị trường");
ok("'/lenh-mo' -> So lenh", layGioiThieu("/lenh-mo").ten === "Sổ lệnh đang mở");
ok("'/lenh-mo?tab=x' khong co trong pathname, '/lenh-mo/abc' van khop", layGioiThieu("/lenh-mo/abc").ten === "Sổ lệnh đang mở");
ok("'/ma/VPB' -> Chi tiet ma", layGioiThieu("/ma/VPB").ten === "Chi tiết mã");
ok("'/lenh-da-dong' khong bi nham thanh '/lenh-mo'", layGioiThieu("/lenh-da-dong").ten === "Lệnh đã đóng");
ok("trang la -> mac dinh", layGioiThieu("/quan-tri").ten === "CloudStock" && layGioiThieu(null).ten === "Tổng quan thị trường");
ok("giai thich truc tiep", layGiaiThich("mua-moi")?.ten === "Mua mới");
ok("bi danh cot bang", layGiaiThich("cot-vung_sl")?.ten === "Cắt lỗ" && layGiaiThich("cot-lai_lo_pct")?.ten === "Lãi/lỗ");
ok("khoa la -> null", layGiaiThich("khong-co") === null && layGiaiThich("") === null);
ok("moi giai thich co ten + noi dung", Object.values(GIAI_THICH).every((g) => g.ten && g.noiDung && g.noiDung.length > 20));
ok("moi trang co ten + gioi thieu", GIOI_THIEU_TRANG.every((t) => t.ten && t.gioiThieu && Array.isArray(t.meo)));
ok("khong dung tu cam 'Giao Găm'", !JSON.stringify({ GIAI_THICH, GIOI_THIEU_TRANG }).includes("Găm"));

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
