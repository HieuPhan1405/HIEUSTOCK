// Test tay cho lib/mauHinh.js: du lieu tong hop (day doi, dinh doi) va du lieu that (so mau hinh hop ly, hinh hoc hop le).
import { nhanDienMauHinh, cachMauHinhGanNhat, KHOA_MAU_HINH, COT_MAU_HINH_NGAY, COT_MAU_HINH_TUAN } from "../../lib/mauHinh.js";
import { khopChiBao, taoBoLocChiBao } from "../../lib/boLocChiBao.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

let loi = 0;
const ok = (ten, dk, them = "") => { if (!dk) { loi++; console.log("SAI:", ten, them); } else console.log("ok:", ten); };

// chuoi do thi theo cac diem noi tuyen tinh -> nen (h/l +-0,1)
function dung(diem, truoc = 45) {
  const c = [];
  for (let i = 0; i < truoc; i++) c.push(14 + Math.sin(i / 3) * 0.2);
  let cur = c[c.length - 1];
  for (const [muc, so] of diem) { for (let k = 1; k <= so; k++) c.push(cur + ((muc - cur) * k) / so); cur = muc; }
  return c.map((x, i) => ({ t: `2024-01-${String((i % 28) + 1).padStart(2, "0")}-${i}`, o: x, h: x + 0.02, l: x - 0.02, c: x, v: 1e6 }));
}
const W = nhanDienMauHinh(dung([[10, 15], [12.5, 12], [10.1, 12], [13.6, 14]]));
const w = W.find((m) => m.khoa === "day_doi");
ok("day doi tong hop duoc nhan dien", !!w, JSON.stringify(W.map((m) => m.khoa)));
ok("day doi: huong tang, muc tieu > gia, cat lo < gia", w && w.huong === 1 && w.mucTieu > w.gia && w.catLo < w.gia);
ok("day doi: 3 diem chinh + 1 duong co", w && w.diem.length === 3 && w.duong.length === 1 && w.duong[0].loai === "co");
ok("day doi: nen pha vo la nen dong cua dau tien tren dinh giua", w && w.gia > 12.5 && w.gia < 13.2, w && w.gia);
const M = nhanDienMauHinh(dung([[18, 15], [15.5, 12], [17.9, 12], [13.8, 14]]));
ok("dinh doi tong hop duoc nhan dien", M.some((m) => m.khoa === "dinh_doi" && m.huong === -1 && m.mucTieu < m.gia && m.catLo > m.gia), JSON.stringify(M.map((m) => m.khoa)));
ok("khong du du lieu -> mang rong", nhanDienMauHinh(dung([[14, 5]], 3)).length === 0);
ok("cachMauHinhGanNhat tra du khoa", KHOA_MAU_HINH.every((k) => k in cachMauHinhGanNhat(dung([[10, 15], [12.5, 12], [10.1, 12], [13.6, 14]]), { tuoiToiDa: 30 })));
ok("ten cot ngay / tuan khong trung nhau", new Set([...COT_MAU_HINH_NGAY, ...COT_MAU_HINH_TUAN]).size === 2 * KHOA_MAU_HINH.length);

// bo loc mau hinh (lib/boLocChiBao.js)
const locDay = taoBoLocChiBao("mau_hinh_ngay", "day_doi");
ok("bo loc mau hinh ngay: day doi cach 2 phien khop", khopChiBao({ mh_day_doi: 2 }, locDay) === true);
ok("bo loc mau hinh ngay: day doi cach 5 phien (ngoai 5 phien) khong khop", khopChiBao({ mh_day_doi: 5 }, locDay) === false);
ok("bo loc mau hinh ngay: khong co mau hinh -> khong khop", khopChiBao({ mh_day_doi: null }, locDay) === false);
ok("bo loc mau hinh GIAM bat ky (tuan) khop dinh doi tuan nay", khopChiBao({ mh_dinh_doi_tuan: 0 }, taoBoLocChiBao("mau_hinh_tuan", "giam_bat_ky")) === true);
ok("bo loc mau hinh TANG bat ky (ngay) khong khop mau hinh giam", khopChiBao({ mh_dinh_doi: 1 }, taoBoLocChiBao("mau_hinh_ngay", "tang_bat_ky")) === false);

// du lieu that
const cache = JSON.parse(readFileSync(fileURLToPath(new URL("../output/nen_dai.json", import.meta.url)), "utf-8"));
const dem = Object.fromEntries(KHOA_MAU_HINH.map((k) => [k, 0]));
let hinhSai = 0, tong = 0, maXet = 0;
for (const [ma, bars] of Object.entries(cache).slice(0, 60)) {
  maXet++;
  for (const m of nhanDienMauHinh(bars)) {
    tong++; dem[m.khoa]++;
    if (!(m.i >= 0 && m.i < bars.length && m.cach === bars.length - 1 - m.i)) hinhSai++;
    if (m.huong > 0 ? !(m.mucTieu > m.gia && m.catLo < m.gia) : !(m.mucTieu < m.gia && m.catLo > m.gia)) hinhSai++;
    for (const d of m.diem) if (!(d.i >= 0 && d.i < bars.length) || !(d.gia > 0)) hinhSai++;
    for (const d of m.duong) if (!(d.i1 >= 0 && d.i2 < bars.length && d.i2 >= d.i1) || !(d.g1 > 0 && d.g2 > 0)) hinhSai++;
  }
}
console.log(`  60 ma that: ${tong} mau hinh;`, JSON.stringify(dem));
ok("du lieu that: co mau hinh va hinh hoc hop le", tong > 50 && hinhSai === 0, `hinhSai=${hinhSai}`);
console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
