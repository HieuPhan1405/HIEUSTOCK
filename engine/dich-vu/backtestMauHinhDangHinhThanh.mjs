// BACKTEST MAU HINH DANG HINH THANH (chua pha vo): khi thay mau hinh dang hinh thanh (lib/mauHinh.js nhanDienDangHinhThanh), trong 20 nen sau do bao nhieu % thuc su pha vo dung huong
// (dong cua vuot muc pha vo) truoc khi cham cat lo; bao nhieu % hong (cham cat lo truoc) / chua ra ket qua; va gia sau 10 phien thay doi bao nhieu theo huong ky vong (doi chieu: thi truong ~ +0,71%/10 phien).
// Moi 5 nen lay 1 diem, cua so 320 nen cuoi, moi mau hinh moi ma toi da 1 lan / 15 nen. Chi DOC cache nen_dai.json. CACH CHAY: node engine/dich-vu/backtestMauHinhDangHinhThanh.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { nhanDienDangHinhThanh, MAU_HINH } from "../../lib/mauHinh.js";

const cache = JSON.parse(readFileSync(fileURLToPath(new URL("../output/nen_dai.json", import.meta.url)), "utf-8"));
const KQ = {};
const TOI_DA = 20;
let diem = 0;
const t0 = Date.now();
for (const [ma, bars] of Object.entries(cache)) {
  const n = bars.length;
  if (n < 400) continue;
  const ult = {};
  for (let t = 330; t < n - TOI_DA - 11; t += 5) {
    const cs = bars.slice(t - 320, t + 1);
    let gt = 0;
    for (let j = cs.length - 20; j < cs.length; j++) gt += (cs[j].c * cs[j].v) / 1e6;
    if (gt / 20 < 5) continue;
    diem++;
    for (const m of nhanDienDangHinhThanh(cs)) {
      if (ult[m.khoa] != null && t - ult[m.khoa] < 15) continue;
      ult[m.khoa] = t;
      // ket qua 20 nen sau
      let kq = "chua", scen = null;
      for (let j = t + 1; j <= t + TOI_DA && kq === "chua"; j++) {
        for (let q = 0; q < m.kichBan.length; q++) {
          const k = m.kichBan[q];
          const pha = k.huong > 0 ? bars[j].c > k.mucPhaVo : bars[j].c < k.mucPhaVo;
          const hong = k.huong > 0 ? bars[j].l <= k.catLo : bars[j].h >= k.catLo;
          if (pha) { kq = "pha"; scen = k; break; }
          if (hong && m.kichBan.length === 1) { kq = "hong"; break; }
        }
      }
      const E = bars[t].c;
      const r10 = (bars[t + 10].c / E - 1) * 100;
      const huongKyVong = m.kichBan.length === 1 ? m.kichBan[0].huong : 0;
      (KQ[m.khoa] ||= []).push({ kq, huongPha: scen ? scen.huong : 0, r10, huongKyVong, ky: bars[t].t < "2019-01-01" ? 0 : bars[t].t < "2022-05-01" ? 1 : 2, cach: m.cachPhaVoPct });
    }
  }
}
console.log(`${diem} diem xet (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
console.log(`${"Mau hinh DANG HINH THANH".padEnd(34)} ${"n".padStart(5)} | pha vo 20 nen: ${"cung huong".padStart(10)} ${"nguoc huong".padStart(11)} | ${"hong".padStart(5)} ${"chua".padStart(5)} | gia sau 10 phien (theo huong ky vong / thi truong +0,7)`);
const TEN_KB = (m, hai) => (hai ? "[2 HUONG] " : m.huong > 0 ? "[TANG] " : "[GIAM] ") + m.ten;
for (const m of MAU_HINH) {
  for (const hai of [false, true]) {
    const a = (KQ[m.khoa] || []).filter((x) => (x.huongKyVong === 0) === hai);
    if (a.length < 30) continue;
    const pct = (arr, f_) => (arr.length ? (arr.filter(f_).length / arr.length) * 100 : NaN);
    if (!hai) {
      console.log(`${TEN_KB(m, hai)}`.padEnd(34) + ` ${String(a.length).padStart(5)} | ${"".padStart(15)}${f(pct(a, (x) => x.kq === "pha")).padStart(10)}% ${"-".padStart(10)} | ${f(pct(a, (x) => x.kq === "hong")).padStart(4)}% ${f(pct(a, (x) => x.kq === "chua")).padStart(4)}% | ${f(tb(a.map((x) => x.r10 * x.huongKyVong)), 2)}%`);
    } else {
      const len = a.filter((x) => x.kq === "pha" && x.huongPha > 0), xuong = a.filter((x) => x.kq === "pha" && x.huongPha < 0);
      console.log(`${TEN_KB(m, hai)}`.padEnd(34) + ` ${String(a.length).padStart(5)} | len ${f((len.length / a.length) * 100)}% xuong ${f((xuong.length / a.length) * 100)}% | ${"-".padStart(5)} ${f(pct(a, (x) => x.kq === "chua")).padStart(4)}% | gia TB ${f(tb(a.map((x) => x.r10)), 2)}%; sau pha len ${f(tb(len.map((x) => x.r10)), 2)}%, sau pha xuong ${f(tb(xuong.map((x) => x.r10)), 2)}%`);
    }
  }
}
