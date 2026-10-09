// Test tay cho tinhGiaMuaThemWeb: gia da dong bang bi tho sau ngay chia co tuc/thuong CP (HDB 09/10/2026). Chay: node engine/test/giaVaoWebChiaCoTuc.test.mjs
import { tinhGiaMuaThemWeb } from "../../lib/giaVaoWeb.js";

let loi = 0;
const ok = (ten, dk) => {
  if (!dk) { loi++; console.log("SAI:", ten); } else console.log("ok:", ten);
};

const cu = { dangGiu: true, gia: 27.6, stop: 26.32, tp1: 28.98, tp2: 30.36, tp3: 31.74, ngayMuaTxt: "2026-09-17" };
const moi = { gia: 21.23, stop: 20.2, tp1: 22.3, tp2: 23.4, tp3: 24.4 };

const a = tinhGiaMuaThemWeb({ dangGiuMoi: true, ngayMuaMoi: "2026-09-17", giaTriMoi: moi, cu, homNay: "2026-10-09" });
ok("sau chia quyen: lay lai gia da dieu chinh", a.gia === 21.23 && a.stop === 20.2 && a.tp3 === 24.4);

const b = tinhGiaMuaThemWeb({ dangGiuMoi: true, ngayMuaMoi: "2026-09-17", giaTriMoi: { ...moi, gia: 27.62 }, cu, homNay: "2026-10-09" });
ok("lech nho (<3%): giu nguyen ban dong bang", b.gia === 27.6 && b.stop === 26.32);

const c = tinhGiaMuaThemWeb({ dangGiuMoi: true, ngayMuaMoi: "2026-10-09", giaTriMoi: { ...moi, gia: 27.0 }, cu: { ...cu, ngayMuaTxt: "2026-10-09" }, homNay: "2026-10-09" });
ok("vao lenh ngay hom nay: khong dieu chinh (gia con dang bien dong)", c.gia === 27.6);

const d = tinhGiaMuaThemWeb({ dangGiuMoi: true, ngayMuaMoi: "2026-09-17", giaTriMoi: moi, cu });
ok("khong truyen homNay: giu hanh vi cu", d.gia === 27.6);

const e = tinhGiaMuaThemWeb({ dangGiuMoi: false, ngayMuaMoi: null, giaTriMoi: moi, cu, homNay: "2026-10-09" });
ok("khong giu: tat ca null", e.gia === null && e.stop === null);

console.log(loi ? `${loi} LOI` : "TAT CA OK");
process.exit(loi ? 1 : 0);
