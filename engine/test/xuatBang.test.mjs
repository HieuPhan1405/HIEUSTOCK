// Test tay: node engine/test/xuatBang.test.mjs [duong-dan-ghi-file.xlsx]
import { writeFileSync } from "node:fs";
import { crc32, chuanHoaO, xmlSheet, taoXlsx, htmlIn } from "../../lib/xuatBang.js";
let loi = 0;
const dat = (ten, dk, them = "") => { if (dk) console.log("ok:", ten); else { console.log("SAI:", ten, them); loi++; } };
dat("crc32('123456789') = cbf43926", crc32(new TextEncoder().encode("123456789")) === 0xcbf43926);
dat("chuanHoaO", chuanHoaO(1.5) === 1.5 && chuanHoaO(NaN) === "" && chuanHoaO(null) === "" && chuanHoaO(true) === "Có" && chuanHoaO(["a", 2]) === "a, 2" && chuanHoaO({ a: 1 }) === "" && chuanHoaO("x") === "x");
const x = xmlSheet(["Mã", "Giá"], [["VCB", 57.2], ["A&B<", ""]]);
dat("xml: so that khong co inlineStr, chuoi duoc escape, o rong bo qua", x.includes('<c r="B2"><v>57.2</v></c>') && x.includes("A&amp;B&lt;") && !x.includes('r="B3"'), x);
const b = taoXlsx(["Mã", "Giá"], [["VCB", 57.2]], "Bo loc");
const buf = Buffer.from(await b.arrayBuffer());
dat("chu ky zip dau 0x04034b50 va cuoi 0x06054b50, 5 muc", buf.readUInt32LE(0) === 0x04034b50 && buf.readUInt32LE(buf.length - 22) === 0x06054b50 && buf.readUInt16LE(buf.length - 12) === 5);
writeFileSync(process.argv[2] || "xuat_bang_thu.xlsx", buf);
const h = htmlIn("T <1>", "p", ["Mã", "Giá"], [["VCB", 1234.567]]);
dat("html: escape + so dinh dang vi-VN + thead", h.includes("T &lt;1&gt;") && h.includes('<td class="so">1.234,57</td>') && h.includes("<thead>"), h.slice(-200));
console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
