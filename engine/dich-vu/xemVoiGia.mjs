// XEM 1 MA voi GIA GIA DINH cho nen HOM NAY: tinh lai tin hieu de biet vi sao ma co / mat tin hieu MUA khi gia doi trong phien (real-time tinh lai moi 10 giay).
// Nen ngay (da dieu chinh, gom ca nen trong phien hom nay) tu VNDirect finfo, VN-Index tu dchart - cung nguon voi bieu do tren web (lib/lichSuGia.js). Chi de so sanh cac muc gia
// trong cung 1 lan chay, khong thay the AmiBroker / engine real-time (khong co breadth nganh).
// Chay: node engine/dich-vu/xemVoiGia.mjs GMD 78.2 77.8
import { tinhTinHieuChoMa } from "../tinhTinHieuChoMa.js";

const [ma = "GMD", ...cacGia] = process.argv.slice(2);
const ngayVN = (giay) => new Date(giay * 1000 + 7 * 3600e3).toISOString().slice(0, 10);

async function layNenMa(sym) {
  const r = await fetch(`https://api-finfo.vndirect.com.vn/v4/stock_prices?sort=date:desc&q=code:${sym}&size=800&fields=date,adOpen,adHigh,adLow,adClose,nmVolume`);
  const d = await r.json();
  return d.data.map((x) => ({ t: x.date, o: x.adOpen, h: x.adHigh, l: x.adLow, c: x.adClose, v: x.nmVolume })).reverse();
}
async function layVni() {
  const den = Math.floor(Date.now() / 1000);
  const r = await fetch(`https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol=VNINDEX&from=${den - 4 * 365 * 86400}&to=${den}`);
  const d = await r.json();
  return new Map(d.t.map((t, i) => [ngayVN(t), d.c[i]]));
}

const nen = await layNenMa(ma);
const vni = await layVni();
const cuoi = nen[nen.length - 1];
console.log(`${ma}: ${nen.length} nen, nen cuoi ${cuoi.t} O ${cuoi.o} H ${cuoi.h} L ${cuoi.l} C ${cuoi.c} V ${cuoi.v} | VNINDEX hom do ${vni.get(cuoi.t) ?? "chua co"}`);
const vniClose = nen.map((b) => vni.get(b.t) ?? null);

for (const g of cacGia.length ? cacGia.map(Number) : [cuoi.c]) {
  const thu = nen.map((b, i) => (i === nen.length - 1 ? { ...b, c: g, h: Math.max(b.h, g), l: Math.min(b.l, g) } : b));
  const r = tinhTinHieuChoMa({ ma, nen: thu, vniClose, san: "HOSE", ketQuaBreadth: { theoNganh: new Map(), trungBinh: 50 } });
  console.log(
    `Gia ${g}: tin=${r.tin} diem=${r.diem} trend=${r.trend} mom=${r.mom} dt=${r.dt} adx=${Number(r.adx).toFixed(1)} rs_vni=${Number(r.rs_vni).toFixed(2)} gia_mua=${r.gia_mua} ngay_mua=${r.ngay_mua} moc=${r.gia_kich_hoat} ${r.moc_kich_hoat} cho_phien_sau=${r.cho_phien_sau}`
  );
}
