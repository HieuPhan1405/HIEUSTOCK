// CHAN DOAN (CHI DOC): "phat lai" 1 phien that cua 1 ma tu REST trades lich su qua BoGopDongTien de kiem tra bo gom dong tien chu dong.
// REST /trades tra moi nhat truoc, toi da 1000 ban ghi / lan, nextPageToken KHONG tien (tra lai chinh trang do) -> di LUI theo thoi gian: 'den' = giay cua ban ghi cu nhat roi lap, bo trung.
// CACH CHAY: node --env-file=.env.dnse.local engine/dich-vu/chayThuDnseReplay.mjs [MA] [yyyy-mm-dd]
import { taoMarketData } from "../dnse/marketDataRest.js";
import { BoGopDongTien, phanTichThoiGian } from "../loi/dongTienChuDong.js";

const md = taoMarketData({ apiKey: process.env.DNSE_API_KEY, apiSecret: process.env.DNSE_API_SECRET });
const ma = (process.argv[2] || "VPB").toUpperCase();
const ngay = process.argv[3] || "2026-10-23";
const gio = (iso) => Math.floor(new Date(iso).getTime() / 1000);
const tu = gio(`${ngay}T08:55:00+07:00`);
let den = gio(`${ngay}T15:05:00+07:00`);
const duy = new Map();
let goi = 0, khongTienTrien = 0;
const t0 = Date.now();
while (den > tu && goi < 600) {
  const r = await md.trades(ma, tu, den, { limit: 1000 });
  goi++;
  if (r.status !== 200) { console.log("loi", r.status, String(r.text).slice(0, 150)); break; }
  const ds = r.json.trades ?? [];
  if (!ds.length) break;
  const truoc = duy.size;
  for (const x of ds) duy.set(`${x.time}|${x.matchPrice}|${x.matchQtty}|${x.totalVolumeTraded}`, x);
  const cuNhat = ds[ds.length - 1].time;
  const tp = phanTichThoiGian(cuNhat);
  const giay = gio(`${tp.ngay}T${tp.gio}+07:00`);
  if (duy.size === truoc) { khongTienTrien++; den = giay - 1; if (khongTienTrien > 3) break; continue; }
  khongTienTrien = 0;
  // neu 1 giay co > 1000 ban ghi thi 'den' = giay do se lap lai -> lui 1 giay (chap nhan mat ban ghi cuc hiem cua giay do)
  den = giay === den ? giay - 1 : giay;
}
const ds = [...duy.values()].sort((a, b) => (a.totalVolumeTraded - b.totalVolumeTraded) || (a.time < b.time ? -1 : 1));
console.log(`${ma} ${ngay}: ${ds.length} ban ghi duy nhat qua ${goi} lan goi, ${Date.now() - t0}ms; tu ${ds[0]?.time} den ${ds[ds.length - 1]?.time}`);
const tongKL = ds.reduce((s, x) => s + x.matchQtty, 0), klCuoi = Math.max(...ds.map((x) => x.totalVolumeTraded));
console.log(`tong matchQtty=${tongKL} | totalVolumeTraded cuoi=${klCuoi} | chenh=${tongKL - klCuoi} (${(((tongKL - klCuoi) / klCuoi) * 100).toFixed(2)}%)`);

const b = new BoGopDongTien();
for (const x of ds) b.nhanTick(x);
const a = b.chupAnh({ chiTiet: true });
const v = a.ma[ma];
console.log("\nTOM TAT:", JSON.stringify({ ...v, chiTiet: undefined }));
const ct = v.chiTiet;
console.log(`so phut co khop: ${ct.phut.length}; so muc gia: ${ct.profile.length}`);
const poc = ct.profile.reduce((m, r) => (r[1] + r[2] + r[3] > m[1] + m[2] + m[3] ? r : m));
console.log("POC (muc gia nhieu KL nhat):", JSON.stringify(poc));
let lk = 0; console.log("Delta tich luy (mua - ban) moi 30 phut:", ct.phut.filter((_, i) => i % 30 === 0).map((r) => { return r[0]; }).join(","));
const dau = ct.phut.map((r) => { lk += r[1] - r[2]; return [r[0], Math.round(lk)]; }).filter((_, i) => i % 40 === 0);
console.log(JSON.stringify(dau));
console.log("khop chieu la:", b.demChieuLa, "| so tick:", b.soTick);
