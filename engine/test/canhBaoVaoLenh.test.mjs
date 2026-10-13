// Test tay cho lib/canhBaoVaoLenh.js. Chay: node engine/test/canhBaoVaoLenh.test.mjs
import { canhBaoVaoLenh } from "../../lib/canhBaoVaoLenh.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const khoa = (r) => canhBaoVaoLenh(r).map((x) => x.khoa).join(",");

ok("khong co du lieu -> khong canh bao", khoa(null) === "" && khoa({}) === "");
ok("cat lo cach 3% -> Vao sat cat lo", khoa({ gia_mua: 100, stop_loss: 97 }) === "cat_lo_sat");
ok("cat lo cach dung 4% -> khong canh bao (nguong la < 4%)", khoa({ gia_mua: 100, stop_loss: 96 }) === "");
ok("cat lo cach 6% -> khong canh bao", khoa({ gia_mua: 100, stop_loss: 94 }) === "");
ok("ATR/gia 5% -> Bien dong manh", khoa({ gia_mua: 100, stop_loss: 94, atr_pct: 5 }) === "bien_dong_manh");
ok("ATR/gia 4,9% -> khong canh bao", khoa({ gia_mua: 100, stop_loss: 94, atr_pct: 4.9 }) === "");
ok("ca hai canh bao", khoa({ gia_mua: 100, stop_loss: 98, atr_pct: 6 }) === "cat_lo_sat,bien_dong_manh");
ok("uu tien gia + cat lo LUC VAO (da dong bang): gia_vao_web / vao_stop_loss", khoa({ gia_mua: 100, stop_loss: 99.5, gia_vao_web: 100, vao_stop_loss: 94 }) === "");
ok("da cham TP2 (cat lo keo ve gia vao) -> bo canh bao cat lo sat", khoa({ gia_mua: 100, stop_loss: 100, tp_da_cham: "TP2" }) === "");
ok("cat lo cao hon gia vao (du lieu loi) -> bo qua", khoa({ gia_mua: 100, stop_loss: 101 }) === "");
ok("chuoi so tu CSV/DB van doc duoc", khoa({ gia_mua: "100", stop_loss: "97.5", atr_pct: "5.2" }) === "cat_lo_sat,bien_dong_manh");
ok("canh bao co mo ta, khong chua so nguong", canhBaoVaoLenh({ gia_mua: 100, stop_loss: 97 })[0].moTa.length > 20 && !/\d/.test(canhBaoVaoLenh({ gia_mua: 100, stop_loss: 97 })[0].moTa));

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
