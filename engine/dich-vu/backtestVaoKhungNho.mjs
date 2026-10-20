// BACKTEST VAO LENH TREN KHUNG NHO (Hieu 2026-10-21: "test thu dieu kien tren khung nho hon de vao lenh" - nhieu ma mua muon / qua diem mua / tran roi).
// Lenh Mua thuong cua engine (tin hieu ngay D, gia vao he thong = moc E, cat lo S, TP1/TP2) duoc vao theo cac cach tren NEN 1 GIO (nen_1h.json, 10/2023 - 10/2026, 387 ma; chi co dong cua / cao / thap / KL, khong co mo cua),
// so voi vao ATC cua ngay tin hieu va mo cua / ATC phien sau. Moi cach: cung cach quan ly lenh (30% TP1 + 30% TP2 + 40% giu den BAN / cat lo / hoa von sau TP2, chi duoc ban tu T+2 ke tu ngay vao), phi 0,4%.
// Gia nen 1 gio duoc co ve theo gia dong cua ngay (nen_dai.json da dieu chinh co tuc) nen khong lech khi chia co phieu. CHI DOC cache.
// CACH CHAY: node engine/dich-vu/backtestVaoKhungNho.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { docJson, chayEngine, moPhongThucTe, thongKe, tb, f } from "./backtestChung.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const h1 = JSON.parse(readFileSync(fileURLToPath(new URL("../output/nen_1h.json", import.meta.url)), "utf-8"));
const ngayVN = (t) => new Date((t + 7 * 3600) * 1000).toISOString().slice(0, 10);
const { lenh: tatCa } = chayEngine({ cache, vni });
const ds0 = tatCa.filter((t) => t.loai === 1 && t.ngay >= "2023-10-18" && t.ngay <= "2026-10-08");

// Nen 1 gio theo ngay cua tung ma, quy ve cung thang gia voi nen ngay (nhan he so = dong cua ngay / dong cua nen 1 gio cuoi ngay)
const NGAY = new Map();
function nen1h(ma) {
  if (NGAY.has(ma)) return NGAY.get(ma);
  const x = h1[ma], m = new Map();
  if (x) {
    const daily = new Map(cache[ma].map((b) => [b.t, b]));
    const theoNgay = new Map();
    for (let i = 0; i < x.t.length; i++) {
      const d = ngayVN(x.t[i]);
      if (!theoNgay.has(d)) theoNgay.set(d, []);
      theoNgay.get(d).push({ t: x.t[i], h: x.h[i], l: x.l[i], c: x.c[i], v: x.v[i] });
    }
    for (const [d, bars] of theoNgay) {
      const dl = daily.get(d);
      if (!dl) continue;
      const k = dl.c / bars[bars.length - 1].c;
      if (!(k > 0.85 && k < 1.18)) continue; // lech qua lon (nen thieu / gia chua dieu chinh khac) -> bo ngay do
      m.set(d, bars.map((b) => ({ ...b, h: b.h * k, l: b.l * k, c: b.c * k })));
    }
  }
  NGAY.set(ma, m);
  return m;
}
const ds = ds0.filter((t) => {
  const m = nen1h(t.ma);
  return m.has(t.ngayArr[t.iv]) && t.iv + 3 < t.n && m.has(t.ngayArr[t.iv + 1]);
});
console.log(`Lenh Mua thuong 18/10/2023 - 08/10/2026: ${ds0.length}, co du nen 1 gio ngay tin hieu va ngay sau: ${ds.length}\n`);

const bo = (t, E, vao) => moPhongThucTe(t, { E, vao, banTu: vao + 2 });
const quaMoc = (t, E) => (E / t.E - 1) * 100;
const CACH = {
  "A. ATC ngay tin hieu (co so)": (t) => ({ E: t.close[t.iv], vao: t.iv }),
  "B. Mo cua phien sau": (t) => ({ E: t.open[t.iv + 1], vao: t.iv + 1 }),
  "C. ATC phien sau": (t) => ({ E: t.close[t.iv + 1], vao: t.iv + 1 }),
  "D. Gio dau phien sau: dong cua >= dong cua tin hieu thi mua (khong thi bo)": (t) => {
    const b = nen1h(t.ma).get(t.ngayArr[t.iv + 1])[0];
    return b && b.c >= t.close[t.iv] ? { E: b.c, vao: t.iv + 1 } : null;
  },
  "E. Khong duoi: ATC ngay tin hieu neu <= moc +1%, khong thi bo": (t) => (t.close[t.iv] <= t.E * 1.01 ? { E: t.close[t.iv], vao: t.iv } : null),
  "F. Khong duoi: ATC neu <= moc +1%; khong thi cho nen 1 gio phien sau dong cua <= moc +1%": (t) => {
    if (t.close[t.iv] <= t.E * 1.01) return { E: t.close[t.iv], vao: t.iv };
    for (const b of nen1h(t.ma).get(t.ngayArr[t.iv + 1])) if (b.c <= t.E * 1.01) return { E: b.c, vao: t.iv + 1 };
    return null;
  },
  "G. Lenh cho gia moc +1%, hieu luc 3 phien (khop khi nen 1 gio cham)": (t) => {
    const gia = t.E * 1.01;
    for (let j = t.iv + 1; j <= t.iv + 3 && j < t.n; j++) {
      const m = nen1h(t.ma).get(t.ngayArr[j]);
      if (!m) continue;
      for (const b of m) if (b.l <= gia) return { E: Math.min(gia, b.h), vao: j };
    }
    return null;
  },
  "H. Phien sau: mua o nen 1 gio dau tien dong cua > TB 4 nen truoc va <= moc +2%": (t) => {
    const m = nen1h(t.ma).get(t.ngayArr[t.iv + 1]);
    const truoc = nen1h(t.ma).get(t.ngayArr[t.iv]);
    const chuoi = [...truoc.slice(-4), ...m];
    for (let i = 4; i < chuoi.length; i++) {
      const tbn = (chuoi[i - 1].c + chuoi[i - 2].c + chuoi[i - 3].c + chuoi[i - 4].c) / 4;
      if (chuoi[i].c > tbn && chuoi[i].c <= t.E * 1.02) return { E: chuoi[i].c, vao: t.iv + 1 };
    }
    return null;
  },
  "I. Hoi ve: phien sau nen 1 gio cham xuong <= dong cua tin hieu, mua khi nen sau dong cua tren nen do": (t) => {
    const m = nen1h(t.ma).get(t.ngayArr[t.iv + 1]);
    for (let i = 0; i < m.length - 1; i++) if (m[i].l <= t.close[t.iv] && m[i + 1].c > m[i].c) return { E: m[i + 1].c, vao: t.iv + 1 };
    return null;
  },
};

const DAU = `${"Cach vao".padEnd(96)} ${"n".padStart(5)} ${"giu%".padStart(5)} ${"laiTB".padStart(6)} ${"thang%".padStart(6)} ${"PF".padStart(5)} ${"vs moc%".padStart(8)} | 2023.10-2024 | 2025 | 2026`;
console.log(DAU);
const nam = (t) => t.ngay.slice(0, 4);
const KQ_CACH = {};
for (const [ten, fn] of Object.entries(CACH)) {
  const kq = [];
  KQ_CACH[ten] = new Map();
  for (let i = 0; i < ds.length; i++) {
    const t = ds[i];
    const v = fn(t);
    if (!v) continue;
    const r = bo(t, v.E, v.vao);
    if (r != null && Number.isFinite(r)) { kq.push({ t, r, qm: quaMoc(t, v.E) }); KQ_CACH[ten].set(i, r); }
  }
  const k = thongKe(kq.map((x) => ({ ret: x.r, phien: 1 })));
  const py = (a, b) => {
    const x = kq.filter((q) => nam(q.t) >= a && nam(q.t) <= b).map((q) => q.r);
    return x.length ? `${f(tb(x))} (${x.length})` : "-";
  };
  console.log(`${ten.padEnd(96)} ${String(k.n).padStart(5)} ${((kq.length / ds.length) * 100).toFixed(0).padStart(5)} ${f(k.tb).padStart(6)} ${f(k.thang, 1).padStart(6)} ${f(k.pf).padStart(5)} ${f(tb(kq.map((q) => q.qm))).padStart(8)} | ${py("2023", "2024").padStart(12)} | ${py("2025", "2025").padStart(10)} | ${py("2026", "2026").padStart(10)}`);
}

// ---------- SO SANH CAP voi co so A tren CUNG cac lenh cach do mua duoc (trung binh chenh lech, khoang tin cay 95% bang bootstrap theo lenh) ----------
console.log("\nSO SANH CAP voi A (cung cac lenh cach do mua; chenh lech lai TB % / lenh, khoang tin cay 95%):");
const A = KQ_CACH["A. ATC ngay tin hieu (co so)"];
const rnd = (() => { let x = 12345; return () => ((x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296); })();
for (const [ten, m] of Object.entries(KQ_CACH)) {
  if (ten.startsWith("A.")) continue;
  const d = [];
  for (const [i, r] of m) if (A.has(i)) d.push(r - A.get(i));
  if (d.length < 30) { console.log(`  ${ten.slice(0, 2)} n=${d.length} (it)`); continue; }
  const bs = [];
  for (let b = 0; b < 2000; b++) { let s = 0; for (let k = 0; k < d.length; k++) s += d[Math.floor(rnd() * d.length)]; bs.push(s / d.length); }
  bs.sort((a, b) => a - b);
  console.log(`  ${ten.slice(0, 2)} n=${String(d.length).padStart(5)}  chenh TB ${f(tb(d)).padStart(6)}  [${f(bs[50]).padStart(6)}; ${f(bs[1950]).padStart(6)}]`);
}
