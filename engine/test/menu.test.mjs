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
ok("/dashboard, /nganh, /thi-truong thuoc Thi truong", mucDangMo("/dashboard")?.href === "/" && mucDangMo("/nganh")?.href === "/" && mucDangMo("/thi-truong")?.href === "/");
ok("/lenh-da-dong thuoc So lenh", mucDangMo("/lenh-da-dong")?.href === "/lenh-mo");
ok("/lenh-mo khong nham voi /lenh-da-dong", tabCuaTrang("/lenh-mo")?.dangChon === "/lenh-mo" && tabCuaTrang("/lenh-da-dong")?.dangChon === "/lenh-da-dong");
ok("/bo-loc va /kich-ban-mua chung muc Bo loc (co tab)", mucDangMo("/bo-loc")?.nhan === "Bộ lọc cổ phiếu" && mucDangMo("/kich-ban-mua")?.nhan === "Bộ lọc cổ phiếu" && tabCuaTrang("/kich-ban-mua")?.dangChon === "/kich-ban-mua" && tabCuaTrang("/bo-loc")?.tab.length === 2);
ok("/ma/VPB, /lien-he khong thuoc menu", mucDangMo("/ma/VPB") === null && mucDangMo("/lien-he") === null);
ok("tab trang dau: 4 tab (Tong quan, Dashboard, Nganh, Tin tuc), dang chon Tong quan", tabCuaTrang("/")?.tab.length === 4 && tabCuaTrang("/")?.dangChon === "/");
ok("/bat-day va /hoi-giam-dai chung muc Bat day (co tab)", mucDangMo("/hoi-giam-dai")?.href === "/bat-day" && tabCuaTrang("/hoi-giam-dai")?.dangChon === "/hoi-giam-dai" && tabCuaTrang("/bat-day")?.tab.length === 3 && mucDangMo("/mua-phuc-hoi")?.href === "/bat-day");
ok("/danh-muc va /danh-muc-goi-y chung muc Danh muc (khong nham duong dan)", mucDangMo("/danh-muc-goi-y")?.href === "/danh-muc" && tabCuaTrang("/danh-muc-goi-y")?.dangChon === "/danh-muc-goi-y" && tabCuaTrang("/danh-muc")?.dangChon === "/danh-muc");
ok("moi muc co nhan ngan", MENU.every((m) => m.nhanNgan && m.nhanNgan.length <= 10));

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
