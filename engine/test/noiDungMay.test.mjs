// Test tay cho lib/noiDungMay.js (noi dung chi dan cua nhan vat Mây). Chay: node engine/test/noiDungMay.test.mjs
import { layGioiThieu, layGiaiThich, GIAI_THICH, GIOI_THIEU_TRANG, duocChao, chonLoiChao, CHAO } from "../../lib/noiDungMay.js";

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

// ---- Loi chao
const T = Date.UTC(2026, 8, 28, 3, 0, 0);
ok("chua chao lan nao -> duoc chao", duocChao(null, T, "2026-09-28"));
ok("vua chao 5 phut truoc -> chua", !duocChao({ lan: T - 5 * 60e3 }, T, "2026-09-28"));
ok("chao 11 phut truoc -> duoc", duocChao({ lan: T - 11 * 60e3 }, T, "2026-09-28") && CHAO.cachNhauMs === 10 * 60e3);
ok("da tat ca ngay hom nay -> khong", !duocChao({ tatNgay: "2026-09-28" }, T, "2026-09-28"));
ok("tat tu hom qua -> hom nay lai duoc", duocChao({ tatNgay: "2026-09-27" }, T, "2026-09-28"));
ok("cuoi tuan", chonLoiChao({ duongDan: "/bieu-do", gio: 10, thu: 0 }).includes("Cuối tuần"));
ok("phien sang", chonLoiChao({ duongDan: "/bieu-do", gio: 10, thu: 2 }).includes("Phiên sáng"));
ok("phien chieu", chonLoiChao({ duongDan: "/bieu-do", gio: 14, thu: 3 }).includes("Phiên chiều"));
ok("theo trang (So lenh)", chonLoiChao({ duongDan: "/lenh-mo", gio: 14, thu: 3, ngauNhien: 0.1 }).includes("cột"));
ok("theo trang (trang ma)", chonLoiChao({ duongDan: "/ma/VPB", gio: 20, thu: 3, ngauNhien: 0.2 }).includes("mã này"));
ok("trang dau: Top co hoi hoac theo gio", chonLoiChao({ duongDan: "/", gio: 10, thu: 1, ngauNhien: 0.1 }).includes("Top cơ hội") && chonLoiChao({ duongDan: "/", gio: 10, thu: 1, ngauNhien: 0.9 }).includes("Phiên sáng"));
ok("moi loi chao deu hoi / moi giup", [0, 6, 8, 10, 12, 14, 20].every((g) => chonLoiChao({ duongDan: "/x", gio: g, thu: g === 0 || g === 6 ? g : 2 }).length > 10));

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
