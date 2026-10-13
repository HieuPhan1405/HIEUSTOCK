// NGHIEN CUU (2026-10-13): ket hop KHUNG 15 PHUT de vao lenh - tren 15 phut co "Mat Than", "khach san phang hut gia xuong", "cham khang cu" luc vao lenh thi sao?
// Du lieu 15 phut: VNDirect dchart (~6,5 thang, tu 31/03/2026) -> taiDuLieu15p.mjs. Tin hieu ngay: engine (nen_dai.json den 24/09/2026), vao lenh phien sau (nhu he thong).
// Dinh nghia (causal: chi dung nen 15 phut DA CO truoc thoi diem vao lenh):
//  - MAT THAN 15p: dung chinh engine/loi/matThan.js tren chuoi 15 phut cat tai nen cuoi (canh bao tai nen cuoi).
//  - KHACH SAN PHANG (xu huong tang): Kijun15 khong doi 5 nen + Tenkan15 di len (so voi 3 nen truoc) + gia > Kijun va cach Tenkan >= 0,3%. "Hut gia xuong" = gia cham Kijun trong phien (low <= Kijun luc quyet dinh).
//  - CHAM KHANG CU: dinh cao nhat 52 nen truoc do (tru 4 nen cuoi) = khang cu R; cham = cao nhat 4 nen cuoi trong [0,995R, 1,003R] va dong cua < R.
// Chay: node engine/dich-vu/nghienCuuKhung15p.mjs <m15.json>
import { readFileSync } from "node:fs";
import { taiLenh, mo, tb, f, boot } from "./nghienCuuLenh.mjs";
import { tinhIchimoku } from "../loi/ichimoku.js";
import { tinhMatThan } from "../loi/matThan.js";
import { hhv, llv } from "../loi/mang.js";

const m15 = JSON.parse(readFileSync(process.argv[2], "utf-8"));
const ngayVN = (t) => new Date((t + 7 * 3600) * 1000).toISOString().slice(0, 10);

// Chuan bi chuoi 15 phut tung ma
const D15 = {};
for (const [ma, x] of Object.entries(m15)) {
  const n = x.t.length; if (n < 200) continue;
  const ngay = x.t.map(ngayVN);
  const ich = tinhIchimoku({ high: x.h, low: x.l });
  const k5h = hhv(ich.kijun, 5), k5l = llv(ich.kijun, 5);
  D15[ma] = { ...x, n, ngay, ich, kPhang: ich.kijun.map((v, i) => v != null && k5h[i] != null && k5l[i] != null && k5h[i] - k5l[i] === 0), dau: new Map() };
  ngay.forEach((d, i) => { if (!D15[ma].dau.has(d)) D15[ma].dau.set(d, i); });
}
console.log("ma co nen 15p:", Object.keys(D15).length);

// Co o nen b (nen CUOI cung duoc phep nhin thay luc quyet dinh)
function co(d, b) {
  const { ich, c, h, l } = d;
  const kk = ich.kijun[b], tk = ich.tenkan[b], tk3 = ich.tenkan[b - 3];
  const khachSan = d.kPhang[b] && kk != null && tk != null && tk3 != null && tk > tk3 && c[b] > kk && c[b] / tk - 1 >= 0.003;
  // mat than: chay lai tren chuoi cat tai b
  const e = b + 1;
  const mt = tinhMatThan({ high: h.slice(0, e), low: l.slice(0, e), close: c.slice(0, e), cloudTop: ich.cloudTop.slice(0, e), cloudBot: ich.cloudBot.slice(0, e), tenkan: ich.tenkan.slice(0, e) })[b] === true;
  let R = -Infinity; for (let k = b - 55; k <= b - 4; k++) if (k >= 0) R = Math.max(R, h[k]);
  let hc = -Infinity; for (let k = b - 3; k <= b; k++) hc = Math.max(hc, h[k]);
  const chamKC = R > 0 && hc >= R * 0.995 && hc <= R * 1.003 && c[b] < R;
  return { khachSan, mt, chamKC, kijun: kk };
}

// ---------- PHAN A: tai cac diem VAO LENH cua he thong ----------
const { lenh } = taiLenh();
const dong = [];
for (const t of lenh) {
  const d = D15[t.ma]; if (!d) continue;
  const ngayVao = t.ngayArr[t.iv + 1]; if (!ngayVao || ngayVao < "2026-04-02" || t.iv + 8 >= t.n) continue;
  const s = d.dau.get(ngayVao); if (s == null || s < 60) continue;
  let cuoi = s; while (cuoi + 1 < d.n && d.ngay[cuoi + 1] === ngayVao) cuoi++;
  const mocs = [["mo cua phien", s], ["10h (sau 4 nen)", s + 4], ["13h (sau 8 nen)", s + 8]];
  for (const [ten, m] of mocs) {
    if (m > cuoi - 1) continue;
    const b = m - 1; const cf = co(d, b); const E15 = d.o[m];
    const rD = d.c[cuoi] / E15 - 1; let mn = Infinity; for (let k = m; k <= cuoi; k++) mn = Math.min(mn, d.l[k]);
    const mae = mn / E15 - 1;
    const tamK = cf.kijun != null && d.l.slice(m, cuoi + 1).some((x) => x <= cf.kijun); // gia cham Kijun15 trong phien
    const Eadj = t.open[t.iv + 1] * (E15 / d.o[s]);
    const r = mo(t, { E: Eadj, vao: t.iv + 1, banTu: t.iv + 3, S: t.S });
    dong.push({ ten, ma: t.ma, ngay: ngayVao, ...cf, rD: rD * 100, mae: mae * 100, tamK, ret: r ? r.ret : null, rdau: ten === "mo cua phien" ? null : (E15 / d.o[s] - 1) * 100 });
  }
}
const nSignal = new Set(dong.map((x) => x.ma + x.ngay)).size;
console.log("\n=== PHAN A: " + nSignal + " tin hieu MUA cua he thong (31/03 -> 23/09/2026) co du nen 15 phut ===");
const kq = (g) => ({ n: g.length, rD: tb(g.map((x) => x.rD)), mae: tb(g.map((x) => x.mae)), ret: tb(g.filter((x) => x.ret != null).map((x) => x.ret)), thang: g.filter((x) => x.ret != null).length ? (g.filter((x) => x.ret > 0).length / g.filter((x) => x.ret != null).length) * 100 : NaN, giam: (g.filter((x) => x.rD < -1).length / (g.length || 1)) * 100 });
const dong2 = (ten, g) => { const k = kq(g); console.log(`   ${ten.padEnd(34)} n=${String(k.n).padStart(3)} | den dong cua phien: TB ${f(k.rD).padStart(6)}% (giam >1%: ${f(k.giam, 0)}%) | day trong phien TB ${f(k.mae).padStart(6)}% | ket qua he thong TB ${f(k.ret).padStart(6)}% thang ${f(k.thang, 0)}%`); };
for (const mc of ["mo cua phien", "10h (sau 4 nen)", "13h (sau 8 nen)"]) {
  const g = dong.filter((x) => x.ten === mc);
  console.log(`\n-- Thoi diem quyet dinh: ${mc} (n=${g.length}) --`);
  dong2("TAT CA", g);
  for (const [k, ten] of [["mt", "Mat Than 15p"], ["khachSan", "Khach san phang 15p"], ["chamKC", "Cham khang cu 15p"]]) {
    dong2(`${ten}: CO`, g.filter((x) => x[k])); dong2(`${ten}: KHONG`, g.filter((x) => !x[k]));
  }
  const bat = g.filter((x) => x.mt || x.khachSan || x.chamKC); dong2("CO IT NHAT 1 trong 3", bat); dong2("KHONG co cai nao", g.filter((x) => !(x.mt || x.khachSan || x.chamKC)));
}
const ks = dong.filter((x) => x.ten === "mo cua phien" && x.khachSan); console.log(`\n   Khach san phang luc mo cua (n=${ks.length}): gia CHAM Kijun15 trong phien: ${f((ks.filter((x) => x.tamK).length / (ks.length || 1)) * 100, 0)}%`);
// Chien luoc cho: neu co co luc mo cua -> doi toi 10h (hoac 13h) roi vao
const theoNgay = new Map(); for (const x of dong) { const k = x.ma + "|" + x.ngay; (theoNgay.get(k) || theoNgay.set(k, {}).get(k))[x.ten] = x; }
const cLuoc = (ten, chon) => { const r = []; for (const g of theoNgay.values()) { const x = chon(g); if (x && x.ret != null) r.push(x.ret); } console.log(`   ${ten.padEnd(60)} n=${String(r.length).padStart(3)} | ket qua TB ${f(tb(r)).padStart(6)}% | thang ${f((r.filter((v) => v > 0).length / (r.length || 1)) * 100, 0)}%`); };
console.log("\n-- So sanh chien luoc vao lenh (ket qua = lai/lo theo luat thoat cua he thong, da tru phi) --");
cLuoc("Mua o MO CUA (cach hien tai)", (g) => g["mo cua phien"]);
cLuoc("Neu co BAT KY co luc mo cua -> doi toi 10h roi mua; khong thi mo cua", (g) => { const o = g["mo cua phien"]; return o && (o.mt || o.khachSan || o.chamKC) ? g["10h (sau 4 nen)"] ?? o : o; });
cLuoc("Neu co BAT KY co luc mo cua -> BO lenh", (g) => { const o = g["mo cua phien"]; return o && (o.mt || o.khachSan || o.chamKC) ? null : o; });
cLuoc("Chi mua khi KHONG co co o ca 3 moc (mo cua, 10h, 13h): lay moc dau tien sach co", (g) => ["mo cua phien", "10h (sau 4 nen)", "13h (sau 8 nen)"].map((k) => g[k]).find((x) => x && !(x.mt || x.khachSan || x.chamKC)) ?? null);

// ---------- PHAN B: kiem tra khong dieu kien (nhieu mau) - moi 8 nen mot lan, moi ma ----------
console.log("\n=== PHAN B: MOI MA, MOI 8 NEN 15 PHUT (khong can tin hieu ngay) - co nay co bao truoc gia di xuong trong 16 nen (~1 phien) toi khong? ===");
const ev = [];
for (const d of Object.values(D15)) {
  for (let b = 80; b + 17 < d.n; b += 8) {
    if (d.ngay[b + 1] !== d.ngay[b]) continue; // thoi diem quyet dinh o giua phien
    const cf = co(d, b); const E = d.o[b + 1]; let mn = Infinity; for (let k = b + 1; k <= b + 16; k++) mn = Math.min(mn, d.l[k]);
    ev.push({ ...cf, r16: (d.c[b + 16] / E - 1) * 100, r4: (d.c[b + 4] / E - 1) * 100, mae: (mn / E - 1) * 100, kijunTouch: cf.kijun != null && mn <= cf.kijun, nam: d.ngay[b].slice(0, 7) });
  }
}
console.log("   so su kien:", ev.length);
const tB = (ten, g) => console.log(`   ${ten.padEnd(30)} n=${String(g.length).padStart(6)} | +4 nen TB ${f(tb(g.map((x) => x.r4)), 3).padStart(7)}% | +16 nen TB ${f(tb(g.map((x) => x.r16)), 3).padStart(7)}% | giam >2% trong 16 nen: ${f((g.filter((x) => x.mae < -2).length / (g.length || 1)) * 100, 1)}% | cham Kijun15: ${f((g.filter((x) => x.kijunTouch).length / (g.length || 1)) * 100, 0)}%`);
tB("TAT CA", ev);
for (const [k, ten] of [["mt", "Mat Than 15p"], ["khachSan", "Khach san phang 15p"], ["chamKC", "Cham khang cu 15p"]]) { const a = ev.filter((x) => x[k]), b = ev.filter((x) => !x[k]); tB(ten + ": CO", a); tB(ten + ": KHONG", b); const [lo, hi] = boot(a.map((x) => x.r16), b.map((x) => x.r16)); console.log(`      chenh +16 nen (CO - KHONG) = ${f(tb(a.map((x) => x.r16)) - tb(b.map((x) => x.r16)), 3)} [95% CI ${f(lo, 3)} .. ${f(hi, 3)}]`); }
process.exit(0);
