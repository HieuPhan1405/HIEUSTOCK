// DO TUNG PHIEN 1 MA: chay lai engine voi du lieu cat den tung ngay (nhu real-time thay vao cuoi ngay do) va in trang thai lenh moi ngay - de tim ngay engine bat dau
// lech AmiBroker (vd GMD 28/09/2026: AmiBroker NAM GIU lenh 10/08, engine da dong). Nen ngay tu VNDirect (gia da dieu chinh, giong DNSE), VN-Index tu dchart.
// Chay: node engine/dich-vu/doTungPhien.mjs GMD 2026-08-05
import { tinhTinHieuChoMa } from "../tinhTinHieuChoMa.js";
import { layNenDieuChinh } from "../loi/nenDieuChinh.js";

// Them "--gon" o cuoi: chi in cac phien trang thai lenh thay doi (mua / ban / dong).
const [ma = "GMD", tuNgay = "2026-08-01"] = process.argv.slice(2).filter((x) => x !== "--gon");
const gon = process.argv.includes("--gon");
let truoc = null;
const ngayVN = (giay) => new Date(giay * 1000 + 7 * 3600e3).toISOString().slice(0, 10);
const den = Math.floor(Date.now() / 1000);
const d = await (await fetch(`https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol=VNINDEX&from=${den - 5 * 365 * 86400}&to=${den}`)).json();
const vni = new Map(d.t.map((t, i) => [ngayVN(t), d.c[i]]));
// VNDirect cham / loi thi lay DNSE chart-api cong khai (cung gia dieu chinh, cung khoi luong - kiem 28/09/2026).
async function layNenDnse(sym) {
  const r = await (await fetch(`https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=${den - 5 * 365 * 86400}&to=${den}&symbol=${sym}&resolution=1D`)).json();
  return r.t.map((t, i) => ({ t: new Date(t * 1000).toISOString().slice(0, 10), o: r.o[i], h: r.h[i], l: r.l[i], c: r.c[i], v: r.v[i] }));
}
const nen = await layNenDieuChinh(ma).catch(() => layNenDnse(ma));

for (let k = nen.findIndex((b) => b.t >= tuNgay); k >= 0 && k < nen.length; k++) {
  const cat = nen.slice(0, k + 1);
  const r = tinhTinHieuChoMa({ ma, nen: cat, vniClose: cat.map((b) => vni.get(b.t) ?? null), san: "HOSE", ketQuaBreadth: { theoNganh: new Map(), trungBinh: 50 } });
  const b = cat[k];
  const trangThai = `${r.tin}|${r.ngay_mua}`;
  if (gon && trangThai === truoc && r.tin !== "BAN" && r.tin !== "MUA") continue;
  truoc = trangThai;
  console.log(
    `${b.t} O ${b.o} H ${b.h} L ${b.l} C ${b.c} | ${String(r.tin).padEnd(9)} diem ${String(r.diem).padEnd(5)} mua ${r.ngay_mua} @${r.gia_mua} SL ${Number(r.stop_loss).toFixed(2)} TP1 ${Number(r.tp1).toFixed(2)} TP2 ${Number(r.tp2).toFixed(2)} cham ${r.tp_da_cham ?? "-"} ly_do_ban ${r.ly_do_ban ?? "-"} bao_ve ${r.dang_bao_ve_lai ?? "-"} stop_bv ${r.stop_bao_ve ?? "-"}`
  );
}
