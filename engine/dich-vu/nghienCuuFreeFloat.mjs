// NGHIEN CUU "VONG QUAY CO PHIEU TROI NOI TRONG VUNG DI NGANG" (Hieu 26/10/2026): trong 1 nen gia di ngang (bien do hep), tong khoi luong giao dich / so co phieu tu do chuyen nhuong (free float)
// = F. F cang lon = luong co phieu tu do da DOI TAY nhieu lan -> gia thuyet: lai da gom xong (vung day) hoac da phan phoi xong (vung dinh), de bat dau chay.
// Du lieu: engine/output/nen_dai.json (nen ngay 391 ma) + engine/output/free_float.json (taiFreeFloat.mjs: ty le free float va so co phieu luu hanh theo quy, tu 2022-12 -> chi xet tu 2023).
// Vao lenh = MO CUA phien ke tiep sau ngay tin hieu (tranh chenh lech vao tai moc). Chay: node engine/dich-vu/nghienCuuFreeFloat.mjs
import { readFileSync } from "node:fs";

const nen = JSON.parse(readFileSync(new URL("../output/nen_dai.json", import.meta.url), "utf8"));
const ff = JSON.parse(readFileSync(new URL("../output/free_float.json", import.meta.url), "utf8"));
const TU_NGAY = "2023-02-01";
const CUA_SO = [40, 60, 90];
const BIEN = [20, 30];
const KHOANG_F = [[0, 0.3], [0.3, 0.6], [0.6, 1], [1, 2], [2, 1e9]];
const NHAN_F = ["<0,3", "0,3-0,6", "0,6-1", "1-2", ">=2"];

function ffTai(ma, ngay) {
  const ds = ff[ma];
  if (!ds) return null;
  let kq = null;
  for (const x of ds) {
    if (x.d <= ngay) kq = x;
    else break;
  }
  if (!kq) kq = ds[0];
  const f = Math.min(1, Math.max(0.03, Number(kq.ff)));
  const sh = Number(kq.sh);
  if (!(sh > 0) || !Number.isFinite(f)) return null;
  return { f, sh, troi: f * sh };
}

const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const trungVi = (a) => {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  return s[s.length >> 1];
};
const p = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");

// ---- sinh su kien
function sinhSuKien(W, bienPct) {
  const ev = [];
  for (const [ma, ds] of Object.entries(nen)) {
    const n = ds.length;
    let lanCuoi = -99;
    for (let i = W + 20; i < n - 41; i++) {
      if (ds[i].t < TU_NGAY) continue;
      if (i - lanCuoi < 10) continue;
      let hh = -Infinity, ll = Infinity, tv = 0;
      for (let j = i - W + 1; j <= i; j++) {
        if (ds[j].h > hh) hh = ds[j].h;
        if (ds[j].l < ll) ll = ds[j].l;
        tv += ds[j].v;
      }
      if (!(ll > 0) || (hh / ll - 1) * 100 > bienPct) continue;
      let tb20 = 0;
      for (let j = i - 19; j <= i; j++) tb20 += ds[j].v;
      tb20 /= 20;
      if (tb20 < 100000) continue; // thanh khoan toi thieu nhu he thong
      const t = ffTai(ma, ds[i].t);
      if (!t) continue;
      const F = tv / t.troi;
      // vi tri so voi dinh / day 120 phien
      let hh120 = -Infinity, ll120 = Infinity;
      for (let j = Math.max(0, i - 119); j <= i; j++) {
        if (ds[j].h > hh120) hh120 = ds[j].h;
        if (ds[j].l < ll120) ll120 = ds[j].l;
      }
      const viTri = (ds[i].c - ll120) / (hh120 - ll120 || 1); // 0 = day, 1 = dinh
      const vao = ds[i + 1].o;
      if (!(vao > 0)) continue;
      const kq = {};
      for (const h of [10, 20, 40]) kq[h] = (ds[i + 1 + h].c / vao - 1) * 100;
      // vuot khoi vung trong 20 phien: dong cua > dinh vung (len) / < day vung (xuong)
      let len = false, xuong = false;
      for (let j = i + 1; j <= i + 20; j++) {
        if (ds[j].c > hh) len = true;
        if (ds[j].c < ll) xuong = true;
      }
      ev.push({ ma, ngay: ds[i].t, F, viTri, ...kq, len, xuong, f: t.f });
      lanCuoi = i;
    }
  }
  return ev;
}

function bang(ev, tieuDe, phanNhom, nhan) {
  console.log(`\n${tieuDe}`);
  console.log("nhom".padEnd(14), "n".padStart(6), "TB10".padStart(7), "TB20".padStart(7), "TV20".padStart(7), "TB40".padStart(7), "thang20".padStart(8), "len20%".padStart(7), "xuong20%".padStart(9));
  phanNhom.forEach((dk, k) => {
    const a = ev.filter(dk);
    if (a.length < 30) return console.log(String(nhan[k]).padEnd(14), String(a.length).padStart(6), "(it mau)");
    console.log(
      String(nhan[k]).padEnd(14),
      String(a.length).padStart(6),
      p(tb(a.map((x) => x[10]))).padStart(7),
      p(tb(a.map((x) => x[20]))).padStart(7),
      p(trungVi(a.map((x) => x[20]))).padStart(7),
      p(tb(a.map((x) => x[40]))).padStart(7),
      p((a.filter((x) => x[20] > 0).length / a.length) * 100, 1).padStart(8),
      p((a.filter((x) => x.len).length / a.length) * 100, 1).padStart(7),
      p((a.filter((x) => x.xuong).length / a.length) * 100, 1).padStart(9)
    );
  });
}

for (const W of CUA_SO) {
  for (const bien of BIEN) {
    const ev = sinhSuKien(W, bien);
    console.log(`\n================ Vung di ngang ${W} phien, bien do <= ${bien}% : ${ev.length} su kien (tu ${TU_NGAY}) ================`);
    bang(ev, "Theo F = tong KL trong vung / co phieu tu do", KHOANG_F.map(([a, b]) => (x) => x.F >= a && x.F < b), NHAN_F);
    // vi tri vung: day (<=0.35) / giua / dinh (>=0.75)
    const VT = [["Vung THAP (day 120p)", (x) => x.viTri <= 0.35], ["Vung GIUA", (x) => x.viTri > 0.35 && x.viTri < 0.75], ["Vung CAO (dinh 120p)", (x) => x.viTri >= 0.75]];
    for (const [ten, dkVT] of VT) {
      const con = ev.filter(dkVT);
      bang(con, `${ten}: theo F (${con.length} su kien)`, KHOANG_F.map(([a, b]) => (x) => x.F >= a && x.F < b), NHAN_F);
    }
  }
}

// ---- KIEM CHUNG: loai anh huong thi truong chung va thoi ky (60 phien, bien <= 30%)
{
  // lai 20 phien TB cua TAT CA ma theo tung ngay vao lenh (de tru: hieu qua so voi thi truong chung)
  const theoNgay = new Map();
  for (const ds of Object.values(nen)) {
    for (let i = 1; i < ds.length - 21; i++) {
      if (ds[i].t < TU_NGAY || !(ds[i].o > 0)) continue;
      const r = (ds[i + 20].c / ds[i].o - 1) * 100;
      const a = theoNgay.get(ds[i].t) ?? [0, 0];
      a[0] += r;
      a[1]++;
      theoNgay.set(ds[i].t, a);
    }
  }
  const ev = sinhSuKien(60, 30).map((e) => {
    const ds = nen[e.ma];
    const i = ds.findIndex((x) => x.t === e.ngay);
    const m = theoNgay.get(ds[i + 1]?.t);
    return { ...e, vuot: m ? e[20] - m[0] / m[1] : NaN };
  }).filter((e) => Number.isFinite(e.vuot));
  console.log(`\n================ KIEM CHUNG (60 phien, bien <= 30%): lai 20 phien TRU lai TB thi truong cung ngay ================`);
  const rank = (a) => { const idx = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = new Array(a.length); idx.forEach(([, i], k) => (r[i] = k)); return r; };
  const spearman = (x, y) => { const rx = rank(x), ry = rank(y), n = x.length, mx = tb(rx), my = tb(ry); let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += (rx[i] - mx) * (ry[i] - my); sxx += (rx[i] - mx) ** 2; syy += (ry[i] - my) ** 2; } return sxy / Math.sqrt(sxx * syy); };
  const nhomVT = [["Tat ca", () => true], ["Vung THAP", (x) => x.viTri <= 0.35], ["Vung GIUA", (x) => x.viTri > 0.35 && x.viTri < 0.75], ["Vung CAO", (x) => x.viTri >= 0.75]];
  console.log("nhom".padEnd(12), "n".padStart(6), "TB vuot TT".padStart(11), "tuong quan hang F~vuot".padStart(24), "| F<0,3 vuot", "F 1-2 vuot".padStart(12), "F>=2 vuot".padStart(11));
  for (const [ten, dk] of nhomVT) {
    const a = ev.filter(dk);
    const sub = (lo, hi) => tb(a.filter((x) => x.F >= lo && x.F < hi).map((x) => x.vuot));
    console.log(ten.padEnd(12), String(a.length).padStart(6), p(tb(a.map((x) => x.vuot))).padStart(11), p(spearman(a.map((x) => x.F), a.map((x) => x.vuot)), 3).padStart(24), "|", p(sub(0, 0.3)).padStart(11), p(sub(1, 2)).padStart(12), p(sub(2, 1e9)).padStart(11));
  }
  console.log("\nTheo nam (tat ca vung): tuong quan hang F ~ lai vuot thi truong");
  for (const nam of ["2023", "2024", "2025", "2026"]) {
    const a = ev.filter((x) => x.ngay.startsWith(nam));
    if (a.length > 100) console.log(nam, `n=${a.length}`, "tuong quan", p(spearman(a.map((x) => x.F), a.map((x) => x.vuot)), 3), "| F>=1 vuot", p(tb(a.filter((x) => x.F >= 1).map((x) => x.vuot))), "| F<0,3 vuot", p(tb(a.filter((x) => x.F < 0.3).map((x) => x.vuot))));
  }
}
