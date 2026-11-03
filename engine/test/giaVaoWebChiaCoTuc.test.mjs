// Test tay cho tinhGiaMuaThemWeb: gia da dong bang bi tho sau ngay chia co tuc/thuong CP (HDB 09/10/2026). Chay: node engine/test/giaVaoWebChiaCoTuc.test.mjs
import { tinhGiaMuaThemWeb, tinhGiaVaoWeb } from "../../lib/giaVaoWeb.js";

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

// Lenh goc: TCB chia 100:50 (29/10/2026), lenh mua 26/08 gia vao dong bang 32,1 - AFL/engine gia_mua da ve 21,4.
const cuTCB = { tin: "NAM GIU", gia_mua: 32.1, gia_vao_web: 32.1, thoi_diem_vao_web: "2026-08-26T03:00:00Z", vao_stop_loss: 30.2, vao_tp1: 33.9, vao_tp2: 35.7, vao_tp3: 37.5, ngay_mua_txt: "2026-08-26" };
const goi = (o) => tinhGiaVaoWeb({ tinMoi: "NAM GIU", giaTriMoi: { gia: 21.35 }, ngayMuaMoi: "2026-08-26", cu: cuTCB, bayGio: "x", cheDoVao: "CU", homNay: "2026-11-03", ...o });
const g1 = goi({ giaMuaMoi: 21.4 });
ok("lenh goc sau chia quyen: nhan he so (32,1 -> 21,4)", Math.abs(g1.gia - 21.4) < 0.011 && Math.abs(g1.stop_loss - 20.13) < 0.011 && Math.abs(g1.tp3 - 25) < 0.011 && g1.luc === cuTCB.thoi_diem_vao_web);
const g2 = goi({ giaMuaMoi: 32.1 });
ok("gia mua AFL khong doi: giu nguyen ban dong bang", g2.gia === 32.1 && g2.stop_loss === 30.2);
const g3 = goi({ giaMuaMoi: 21.4, homNay: undefined });
ok("khong truyen homNay: giu hanh vi cu", g3.gia === 32.1);
const g4 = goi({ giaMuaMoi: 21.4, homNay: "2026-08-26", ngayMuaMoi: "2026-08-26" });
ok("ngay vao lenh: khong dieu chinh", g4.gia === 32.1);
const g5 = goi({ giaMuaMoi: null });
ok("thieu gia mua moi: giu nguyen", g5.gia === 32.1);
const g6 = goi({ giaMuaMoi: 32.1 * 1.015 });
ok("lech nho (<2%): giu nguyen", g6.gia === 32.1);
const g7 = goi({ giaMuaMoi: 29.2 }); // FPT chia 10%: 32,1 -> 29,2
ok("co tuc 10%: van nhan he so", Math.abs(g7.gia - 29.2) < 0.011);

console.log(loi ? `${loi} LOI` : "TAT CA OK");
process.exit(loi ? 1 : 0);
