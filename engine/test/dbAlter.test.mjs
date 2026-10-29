// Test tay: node engine/test/dbAlter.test.mjs - nhan dien cau ALTER TABLE ... ADD COLUMN IF NOT EXISTS de bo qua khi cot da co (lib/db.js, chong nghen khoa bang)
import { readFileSync } from "node:fs";
let loi = 0;
const dat = (ten, dk, them = "") => {
  if (dk) console.log("ok:", ten);
  else { console.log("SAI:", ten, them); loi++; }
};
// lib/db.js import "@/lib/cotChiBaoKyThuat" nen khong import truc tiep duoc: lay ham bang cach cat doan ma nguon.
const nguon = readFileSync(new URL("../../lib/db.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const bat = nguon.indexOf("const RE_ALTER_THEM_COT");
const ket = nguon.indexOf("function boCauAlterThua");
const mod = "data:text/javascript," + encodeURIComponent(nguon.slice(bat, ket));
const { cacCotCuaCauAlter } = await import(mod);

const tinHieu = `\n    ALTER TABLE tin_hieu\n      ADD COLUMN IF NOT EXISTS kijun DOUBLE PRECISION,\n      ADD COLUMN IF NOT EXISTS gg_top DOUBLE PRECISION,\n      ADD COLUMN IF NOT EXISTS mat_than BOOLEAN;\n  `;
let r = cacCotCuaCauAlter(tinHieu);
dat("tin_hieu: bang + 3 cot", r && r.bang === "tin_hieu" && r.cot.join() === "kijun,gg_top,mat_than", JSON.stringify(r));
r = cacCotCuaCauAlter("ALTER TABLE lenh_da_dong ADD COLUMN IF NOT EXISTS phan_chot_pct DOUBLE PRECISION NOT NULL DEFAULT 100");
dat("co DEFAULT trong dinh nghia cot van nhan (khong phai SET DEFAULT)", r && r.bang === "lenh_da_dong" && r.cot.join() === "phan_chot_pct");
r = cacCotCuaCauAlter("ALTER TABLE nguoi_dung ADD COLUMN IF NOT EXISTS a TEXT, ADD COLUMN IF NOT EXISTS b TIMESTAMPTZ");
dat("nhieu cot cach dong", r && r.cot.join() === "a,b");
dat("ALTER ... DROP CONSTRAINT -> khong bo qua (null)", cacCotCuaCauAlter("ALTER TABLE x DROP CONSTRAINT y") === null);
dat("ALTER COLUMN -> null", cacCotCuaCauAlter("ALTER TABLE x ADD COLUMN IF NOT EXISTS a INT, ALTER COLUMN b SET DEFAULT 1") === null);
dat("CREATE TABLE -> null", cacCotCuaCauAlter("CREATE TABLE IF NOT EXISTS t (id int)") === null);
dat("SELECT -> null, khong phai chuoi -> null", cacCotCuaCauAlter("SELECT 1") === null && cacCotCuaCauAlter(null) === null && cacCotCuaCauAlter({ text: "x" }) === null);
// moi cau ALTER ... ADD COLUMN trong lib/db.js deu duoc nhan dien (tru nhung cau co thanh phan khac)
const tatCa = [...nguon.matchAll(/ALTER TABLE\s+[a-z_]+\s+ADD COLUMN IF NOT EXISTS/g)].length;
dat("lib/db.js co cau ALTER ADD COLUMN de bo qua", tatCa >= 10, String(tatCa));
console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
