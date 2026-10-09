// KICH BAN MUA CHO TAT CA CAC MA: voi moi ma chua co lenh (TRUNG LAP / BAN) tinh
//  A. gia dong cua HOM NAY (trong bien do +-7%) nao ra tin hieu MUA (khoang gia).
//  B. neu khong co lenh hom nay: sau bao nhieu phien se ra MUA theo 3 kich ban gia: GIU GIA, TANG 1%/phien, GIAM 1%/phien (khoi luong moi phien = TB20 x --kl).
//     Ghi ro "doi phien sau" (da du diem nhung cho xac nhan) va diem thanh phan luc do (xu huong / dong luong / dong tien) so voi hien tai de biet dieu kien nao thay doi.
// Nen (da dieu chinh) tu VNDirect finfo, VN-Index tu dchart. Khong co breadth nganh nen co the lech nhe so voi web; CHI de tham khao, khong phai khuyen nghi.
// Chay: node engine/dich-vu/kichBanMua.mjs [--phien=10] [--kl=1.0] [--ra=duong/dan/ra.csv] [--ma=ANV,SHB]
import fs from "node:fs";
import { tinhTinHieuChoMa } from "../tinhTinHieuChoMa.js";
import { layNenDieuChinh } from "../loi/nenDieuChinh.js";

const args = process.argv.slice(2);
const opt = (ten, mac) => {
  const a = args.find((x) => x.startsWith(`--${ten}=`));
  return a ? a.slice(ten.length + 3) : mac;
};
const SO_PHIEN = Number(opt("phien", 10));
const KL = Number(opt("kl", 1.0));
const RA = opt("ra", "kich-ban-mua.csv");
const CHI_MA = opt("ma", "") ? opt("ma", "").toUpperCase().split(",") : null;
const SO_NEN = 500;

const den = Math.floor(Date.now() / 1000);
const ngayVN = (giay) => new Date(giay * 1000 + 7 * 3600e3).toISOString().slice(0, 10);
const dv = await (await fetch(`https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol=VNINDEX&from=${den - 5 * 365 * 86400}&to=${den}`)).json();
const vni = new Map(dv.t.map((t, i) => [ngayVN(t), dv.c[i]]));
const vniCuoi = [...vni.values()].at(-1);

const ds = (await (await fetch("https://www.cloudstock.id.vn/api/signals")).json()).tinHieu;
const dsMa = ds.filter((r) => (CHI_MA ? CHI_MA.includes(r.ma) : r.tin === "TRUNG LAP" || r.tin === "BAN")).map((r) => r.ma);
console.log(`${dsMa.length} ma can tinh (chua co lenh)...`);

const tick = (g) => (g < 10 ? 0.01 : g < 50 ? 0.05 : 0.1);
const lam = (g) => Number((Math.round(g / tick(g)) * tick(g)).toFixed(2));
const tinhVoi = (ma, nen) =>
  tinhTinHieuChoMa({ ma, nen, vniClose: nen.map((b) => vni.get(b.t) ?? vniCuoi), san: "HOSE", ketQuaBreadth: { theoNganh: new Map(), trungBinh: 50 } });
const nhan = (r) => (r.tin === "MUA" ? "MUA" : r.tin === "TRUNG LAP" && r.cho_phien_sau ? "DOI PHIEN SAU" : r.tin);

function phienKeTiep(ngay) {
  const d = new Date(ngay + "T00:00:00Z");
  do d.setUTCDate(d.getUTCDate() + 1);
  while ([0, 6].includes(d.getUTCDay()));
  return d.toISOString().slice(0, 10);
}

function xuLy(ma, nenFull) {
  const nen = nenFull.slice(-SO_NEN);
  const cuoi = nen.at(-1);
  const truoc = nen.at(-2);
  const tb20 = nen.slice(-21, -1).reduce((s, b) => s + b.v, 0) / 20;
  const kl = Math.round(KL * tb20);
  const hienTai = tinhVoi(ma, nen);
  const out = { ma, gia: cuoi.c, tin: hienTai.tin, diem: hienTai.diem, trend: hienTai.trend, mom: hienTai.mom, dt: hienTai.dt, bandMua: "" };

  // A. quet gia dong cua hom nay
  const thuHomNay = (g) => nen.map((b, i) => (i === nen.length - 1 ? { ...b, c: g, h: Math.max(b.h, g), l: Math.min(b.l, g), v: Math.max(b.v, kl) } : b));
  const san = lam(truoc.c * 0.93);
  const tran = lam(truoc.c * 1.07);
  let lo = null;
  let hi = null;
  for (let g = san; g <= tran + 1e-9; g = lam(g + tick(g))) {
    if (nhan(tinhVoi(ma, thuHomNay(g))) === "MUA") {
      if (lo == null) lo = g;
      hi = g;
    }
  }
  if (lo != null) out.bandMua = lo === hi ? `${lo}` : `${lo}-${hi}`;

  // B. 3 kich ban gia cac phien sau
  const duong = { giu: 0, tang: 0.01, giam: -0.01 };
  for (const [ten, buoc] of Object.entries(duong)) {
    let thu = nen.map((b, i) => (i === nen.length - 1 ? { ...b, v: Math.max(b.v, kl) } : b));
    let g = cuoi.c;
    let ngay = cuoi.t;
    let doi = null;
    let mua = null;
    for (let k = 1; k <= SO_PHIEN; k++) {
      g = lam(g * (1 + buoc));
      ngay = phienKeTiep(ngay);
      const prev = thu.at(-1).c;
      thu = [...thu, { t: ngay, o: prev, h: Math.max(prev, g), l: Math.min(prev, g), c: g, v: kl }];
      const r = tinhVoi(ma, thu);
      const nh = nhan(r);
      if (nh === "DOI PHIEN SAU" && !doi) doi = { k, ngay };
      if (nh === "MUA") {
        mua = { k, ngay, gia: g, diem: r.diem, trend: r.trend, mom: r.mom, dt: r.dt };
        break;
      }
    }
    out[`${ten}_phien`] = mua ? mua.k : "";
    out[`${ten}_ngay`] = mua ? mua.ngay : "";
    out[`${ten}_gia`] = mua ? mua.gia : "";
    out[`${ten}_doi`] = doi ? doi.k : "";
    out[`${ten}_thayDoi`] = mua ? `xu huong ${out.trend}->${mua.trend}; dong luong ${out.mom}->${mua.mom}; dong tien ${out.dt}->${mua.dt}; diem ${Number(out.diem).toFixed(2)}->${Number(mua.diem).toFixed(2)}` : "";
  }
  return out;
}

const kq = [];
const loi = [];
let i = 0;
const HANG = 6;
async function tho() {
  while (i < dsMa.length) {
    const ma = dsMa[i++];
    try {
      const nen = await layNenDieuChinh(ma, SO_NEN + 30).catch(() => layNenDieuChinh(ma, SO_NEN + 30));
      if (nen.length < 300) throw new Error("it nen");
      kq.push(xuLy(ma, nen));
    } catch (e) {
      loi.push(`${ma}: ${e.message}`);
    }
    if ((kq.length + loi.length) % 40 === 0) console.log(`  ${kq.length + loi.length}/${dsMa.length}`);
  }
}
await Promise.all(Array.from({ length: HANG }, tho));

const COT = ["ma", "gia", "tin", "diem", "trend", "mom", "dt", "bandMua", "giu_phien", "giu_ngay", "giu_doi", "giu_thayDoi", "tang_phien", "tang_ngay", "tang_gia", "tang_thayDoi", "giam_phien", "giam_ngay", "giam_gia", "giam_thayDoi"];
const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
kq.sort((a, b) => (a.giu_phien || 99) - (b.giu_phien || 99) || (a.tang_phien || 99) - (b.tang_phien || 99));
fs.writeFileSync(RA, "﻿" + COT.join(",") + "\n" + kq.map((r) => COT.map((c) => esc(r[c])).join(",")).join("\n"));
fs.writeFileSync(RA.replace(/\.csv$/, ".json"), JSON.stringify(kq, null, 1));
console.log(`Xong ${kq.length} ma (${loi.length} loi) -> ${RA}`);
if (loi.length) console.log(loi.slice(0, 10).join("\n"));
const dem = (k) => kq.filter((r) => r[k] !== "").length;
console.log(`Co MUA trong hom nay (trong bien +-7%): ${kq.filter((r) => r.bandMua).length} | giu gia <= ${SO_PHIEN} phien: ${dem("giu_phien")} | tang 1%/phien: ${dem("tang_phien")} | giam 1%/phien: ${dem("giam_phien")}`);
process.exit(0);
