// Tao lai lib/lichSuDinhGiaThiTruong.js: PE/PB cua ca thi truong HOSE vao CUOI MOI THANG (tu 2018), tinh cung cach voi so hien tai o
// lib/thiTruongHOSE.js (tong von hoa / tong loi nhuan, xem lib/tinhDinhGia.js). Nguon VNDirect finfo cong khai. Chi DOC mang, GHI 1 file trong repo.
// Danh sach ma HOSE lay theo HIEN TAI (ma da huy niem yet khong co trong tap nay nen so lich su hoi lech nhe - "thien lech nguoi song sot").
// Thang dang chay khong ghi (web tu them diem hien tai). Chay lai moi vai thang de them cac thang moi.
// CACH CHAY: node scripts/capNhatLichSuDinhGia.mjs [namBatDau=2018]
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { gopTySo } from "../lib/tinhDinhGia.js";

const FINFO = "https://api-finfo.vndirect.com.vn/v4";
const namBatDau = Number(process.argv[2]) || 2018;
const cho = (ms) => new Promise((r) => setTimeout(r, ms));

async function layJson(url) {
  let loiCuoi;
  for (let lan = 1; lan <= 3; lan++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      loiCuoi = e;
      await cho(800 * lan);
    }
  }
  throw loiCuoi;
}

const homNay = new Date();
const chuoiNgay = (d) => d.toISOString().slice(0, 10);

// Ngay lam viec gan nhat (T2-T6) khong sau ngayISO.
function lamViecTruoc(d) {
  const x = new Date(d);
  while (x.getUTCDay() === 0 || x.getUTCDay() === 6) x.setUTCDate(x.getUTCDate() - 1);
  return x;
}

// Danh sach ma HOSE hien tai (co phieu): phien gan nhat co bang gia.
let hose = null;
for (let lui = 0; lui < 10 && !hose; lui++) {
  const d = lamViecTruoc(new Date(homNay.getTime() - lui * 86400e3));
  const j = await layJson(`${FINFO}/stock_prices?q=date:${chuoiNgay(d)}~floor:HOSE&size=1000&fields=code,type`);
  const ds = (j.data || []).filter((x) => x.type === "STOCK");
  if (ds.length >= 200) hose = new Set(ds.map((x) => x.code));
}
if (!hose) throw new Error("Khong lay duoc danh sach ma HOSE");
console.log("Ma HOSE hien tai:", hose.size);

const layTySo = async (ngay, rc) => {
  const j = await layJson(`${FINFO}/ratios?q=ratioCode:${rc}~reportDate:${ngay}&size=3000`);
  const kq = {};
  for (const x of j.data || []) if (hose.has(x.code) && Number.isFinite(Number(x.value))) kq[x.code] = Number(x.value);
  return kq;
};

// Cac thang can lay: cuoi moi thang tu namBatDau den thang TRUOC thang hien tai.
const cacThang = [];
for (let y = namBatDau, m = 0; ; ) {
  const cuoiThang = new Date(Date.UTC(y, m + 1, 0));
  if (cuoiThang >= new Date(Date.UTC(homNay.getUTCFullYear(), homNay.getUTCMonth(), 1))) break;
  cacThang.push(cuoiThang);
  m++;
  if (m > 11) {
    m = 0;
    y++;
  }
}

const ketQua = new Map();
async function layThang(cuoiThang) {
  let d = lamViecTruoc(cuoiThang);
  for (let thu = 0; thu < 6; thu++) {
    const ngay = chuoiNgay(d);
    const mc = await layTySo(ngay, "MARKETCAP");
    if (Object.keys(mc).length >= 200) {
      const [pe, pb] = await Promise.all([layTySo(ngay, "PRICE_TO_EARNINGS"), layTySo(ngay, "PRICE_TO_BOOK")]);
      const a = gopTySo(mc, pe);
      const b = gopTySo(mc, pb);
      return { ngay, pe: Math.round(a.giaTri * 100) / 100, pb: Math.round(b.giaTri * 100) / 100 };
    }
    d = lamViecTruoc(new Date(d.getTime() - 86400e3)); // ngay le/khong co du lieu: lui 1 ngay lam viec
  }
  return null;
}

const hangDoi = [...cacThang];
let xong = 0;
async function tho() {
  while (hangDoi.length) {
    const t = hangDoi.shift();
    try {
      const r = await layThang(t);
      if (r) ketQua.set(chuoiNgay(t), r);
    } catch (e) {
      console.log("Loi thang", chuoiNgay(t), String(e.message || e).slice(0, 60));
    }
    xong++;
    if (xong % 12 === 0 || xong === cacThang.length) console.log(`${xong}/${cacThang.length} thang`);
  }
}
await Promise.all(Array.from({ length: 4 }, tho));

const ds = [...ketQua.values()].sort((a, b) => (a.ngay < b.ngay ? -1 : 1));
const noiDung = `// FILE DUOC TAO TU DONG boi scripts/capNhatLichSuDinhGia.mjs (khong sua tay). PE/PB ca thi truong HOSE cuoi moi thang, tinh tu von hoa + PE/PB tung ma
// (VNDirect), danh sach ma theo HIEN TAI. Cap nhat lan cuoi: ${chuoiNgay(homNay)}.
export const LICH_SU_DINH_GIA = ${JSON.stringify(ds)};
`;
writeFileSync(fileURLToPath(new URL("../lib/lichSuDinhGiaThiTruong.js", import.meta.url)), noiDung, "utf-8");
console.log(`Da ghi ${ds.length} diem (${ds[0]?.ngay} -> ${ds[ds.length - 1]?.ngay}).`);
