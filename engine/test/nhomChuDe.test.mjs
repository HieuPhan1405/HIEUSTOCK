// Test tay: node engine/test/nhomChuDe.test.mjs
import { NHOM_CHU_DE, chuDeCuaMa, DS_CHU_DE } from "../../lib/nhomChuDe.js";
let loi = 0;
const dat = (ten, dk, them = "") => { if (dk) console.log("ok:", ten); else { console.log("SAI:", ten, them); loi++; } };
dat("HHV, CII, C4G thuoc dau tu cong; HPG khong (theo mau tham khao)", chuDeCuaMa("HHV").includes("dau_tu_cong") && chuDeCuaMa("cii").includes("dau_tu_cong") && chuDeCuaMa("C4G").includes("dau_tu_cong") && chuDeCuaMa("HPG").length === 0);
dat("22 ma theo mau", NHOM_CHU_DE.dau_tu_cong.ma.length === 22);
dat("VCB khong thuoc nhom nao", chuDeCuaMa("VCB").length === 0);
dat("khong trung ma trong 1 nhom", DS_CHU_DE.every((k) => new Set(NHOM_CHU_DE[k].ma).size === NHOM_CHU_DE[k].ma.length));
dat("ma viet hoa 2-5 ky tu", DS_CHU_DE.every((k) => NHOM_CHU_DE[k].ma.every((m) => /^[A-Z0-9]{2,5}$/.test(m))));
console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
