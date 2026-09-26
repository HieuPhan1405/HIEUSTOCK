// Test tay cho lib/menu.js (menu 7 muc + thanh tab nhom). Chay: node engine/test/menu.test.mjs
import { MENU, mucDangMo, tabCuaTrang } from "../../lib/menu.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

ok("menu 7 muc", MENU.length === 7);
ok("trang dau -> Thi truong", mucDangMo("/")?.nhan === "Thị trường");
ok("/dashboard, /thi-truong thuoc Thi truong", mucDangMo("/dashboard")?.href === "/" && mucDangMo("/thi-truong")?.href === "/");
ok("/lenh-da-dong thuoc So lenh", mucDangMo("/lenh-da-dong")?.href === "/lenh-mo");
ok("/lenh-mo khong nham voi /lenh-da-dong", tabCuaTrang("/lenh-mo")?.dangChon === "/lenh-mo" && tabCuaTrang("/lenh-da-dong")?.dangChon === "/lenh-da-dong");
ok("/bo-loc khong co tab", mucDangMo("/bo-loc")?.nhan === "Bộ lọc cổ phiếu" && tabCuaTrang("/bo-loc") === null);
ok("/ma/VPB, /lien-he khong thuoc menu", mucDangMo("/ma/VPB") === null && mucDangMo("/lien-he") === null);
ok("tab trang dau: 3 tab, dang chon Tong quan", tabCuaTrang("/")?.tab.length === 3 && tabCuaTrang("/")?.dangChon === "/");
ok("moi muc co nhan ngan", MENU.every((m) => m.nhanNgan && m.nhanNgan.length <= 10));

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
