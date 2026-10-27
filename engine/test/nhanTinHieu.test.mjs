// Test tay: node engine/test/nhanTinHieu.test.mjs
import { tinhD5, nhanThiTruong5Phien, nhanViTri120, NGUONG_D5_UNG_HO_PCT, NGUONG_VI_TRI_CAO, NGUONG_VI_TRI_THAP } from "../../lib/nhanTinHieu.js";

let loi = 0;
const dat = (ten, dk) => {
  if (dk) console.log("ok:", ten);
  else { console.log("SAI:", ten); loi++; }
};

// tinhD5: dong cua hien tai so voi dong cua 5 phien truoc (nen thu n-6)
const nen = [100, 101, 102, 103, 104, 105, 106].map((c, i) => ({ t: `2026-10-0${i + 1}`, c }));
dat("d5 = 106 / 101 - 1 = 4,95%", Math.abs(tinhD5(nen) - (106 / 101 - 1) * 100) < 1e-9);
dat("it hon 6 nen -> null", tinhD5(nen.slice(0, 5)) === null);
dat("nen rong / sai kieu -> null", tinhD5([]) === null && tinhD5(null) === null && tinhD5([{ c: 0 }, 1, 2, 3, 4, { c: 5 }]) === null);

// nhanThiTruong5Phien
dat("d5 > nguong -> ung ho", nhanThiTruong5Phien(NGUONG_D5_UNG_HO_PCT + 0.01).ungHo === true);
dat("d5 = nguong -> chua ung ho (phai LON HON)", nhanThiTruong5Phien(NGUONG_D5_UNG_HO_PCT).ungHo === false);
dat("d5 am -> chua ung ho", nhanThiTruong5Phien(-2.5).khoa === "chua_ung_ho");
dat("d5 null / NaN -> null", nhanThiTruong5Phien(null) === null && nhanThiTruong5Phien(undefined) === null && nhanThiTruong5Phien(NaN) === null);
dat("d5 chuoi so van doc duoc", nhanThiTruong5Phien("2.2").ungHo === true);
for (const x of [nhanThiTruong5Phien(3), nhanThiTruong5Phien(0)]) {
  dat(`mo ta khong lo con so nguong (${x.khoa})`, !/\b[01],?\d?\s*%/.test(x.moTa.replace(/\d+\s*phiên/g, "")) && x.moTa.includes("không phải khuyến nghị"));
}

// nhanViTri120
const mua = (v, tin = "MUA") => ({ tin, vi_tri_120: v });
dat("pos >= nguong cao -> vung cao", nhanViTri120(mua(NGUONG_VI_TRI_CAO)).khoa === "vung_cao");
dat("pos = 1 -> vung cao", nhanViTri120(mua(1)).khoa === "vung_cao");
dat("pos < nguong thap -> nua duoi", nhanViTri120(mua(NGUONG_VI_TRI_THAP - 0.01)).khoa === "nua_duoi");
dat("pos = nguong thap -> khong nhan (vung giua)", nhanViTri120(mua(NGUONG_VI_TRI_THAP)) === null);
dat("pos 0,65 -> khong nhan", nhanViTri120(mua(0.65)) === null);
dat("chi gan cho tin hieu MUA: NAM GIU / TRUNG LAP / BAN -> null", ["NAM GIU", "TRUNG LAP", "BAN"].every((t) => nhanViTri120(mua(0.95, t)) === null));
dat("thieu pos -> null", nhanViTri120(mua(null)) === null && nhanViTri120(mua("")) === null && nhanViTri120(mua(undefined)) === null && nhanViTri120(null) === null);
dat("pos la chuoi (CSV/DB) van doc", nhanViTri120(mua("0.9")).khoa === "vung_cao");
for (const v of [0.9, 0.2]) {
  const n = nhanViTri120(mua(v));
  dat(`mo ta khong lo nguong (${n.khoa})`, !/0[,.][58]/.test(n.moTa) && n.moTa.includes("không phải khuyến nghị"));
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
