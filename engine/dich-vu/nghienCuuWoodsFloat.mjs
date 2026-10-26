// KIEM CHUNG PHUONG PHAP "FLOAT ANALYSIS" CUA STEVE WOODS (Hieu 27/10/2026):
// cong NGUOC khoi luong tu phien hien tai cho den khi bang dung 1 vong free float -> do la "doan" (cua so W phien); dinh/day doan = hai duong kich hoat.
// Gia dong cua vuot dinh doan (lan dau) -> MUA tai mo cua phien sau, do lai sau 10/20/40 phien.
// Sau do tach nhom TICH LUY (mua chu dong > ban) va PHAN PHOI trong doan. Khong co du lieu khop lenh (mua/ban chu dong) trong qua khu -> dung 2 thuoc do thay the:
//   (1) CLV: tong KL x ((dong - thap) - (cao - dong)) / (cao - thap) / tong KL trong doan (>0 = dong cua nghieng ve phia cao = mua chu dong nhieu hon)
//   (2) KL phien tang / KL phien giam trong doan.
// Free float: engine/output/free_float_chuan.json (DNSE, % lam tron 5%, CHI CO GIA TRI HIEN TAI) x so co phieu luu hanh theo quy (VNDirect, free_float.json) - gia dinh ty le khong doi.
// Doi chung: pha dinh 60 phien co dinh (khong dung float) -> xem float co them gi khong.
// Chay: node engine/dich-vu/nghienCuuWoodsFloat.mjs
import { readFileSync } from "node:fs";

const doc = (f) => JSON.parse(readFileSync(new URL(`../output/${f}`, import.meta.url), "utf8"));
const nen = doc("nen_dai.json");
const sh = doc("free_float.json");
const ffc = doc("free_float_chuan.json");
const TU = "2023-02-01";
const HOR = [10, 20, 40];
const WMIN = 15, WMAX = 250;

function coPhieuTai(ma, ngay) {
  let kq = null;
  for (const x of sh[ma] ?? []) {
    if (x.d <= ngay) kq = x;
    else break;
  }
  kq ??= (sh[ma] ?? [])[0];
  return kq && Number(kq.sh) > 0 ? Number(kq.sh) : null;
}
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const tv = (a) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const p = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");

// lai TB cua TOAN BO ma theo ngay vao lenh va ky han (de tru thi truong chung)
const tt = {};
for (const h of HOR) tt[h] = new Map();
for (const ds of Object.values(nen)) {
  for (let i = 0; i < ds.length - 41; i++) {
    if (ds[i].t < TU || !(ds[i].o > 0)) continue;
    for (const h of HOR) {
      const a = tt[h].get(ds[i].t) ?? [0, 0];
      a[0] += (ds[i + h - 1].c / ds[i].o - 1) * 100; // vao mo cua ngay i, thoat dong cua phien thu h (tinh ca ngay vao)
      a[1]++;
      tt[h].set(ds[i].t, a);
    }
  }
}

function suKien(kieu) {
  // kieu: "woods" (cua so = 1 vong float) | "co60" (dinh 60 phien co dinh - doi chung)
  const ev = [];
  for (const [ma, ds] of Object.entries(nen)) {
    const F = ffc[ma];
    if (!(F > 0)) continue;
    const n = ds.length;
    const cum = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) cum[i + 1] = cum[i] + ds[i].v;
    let lanCuoi = -99;
    let truocTren = false; // hom truoc da o tren dinh doan chua
    for (let i = 61; i < n - 42; i++) {
      const co = coPhieuTai(ma, ds[i].t);
      if (!co) continue;
      let W;
      if (kieu === "woods") {
        const troi = (F / 100) * co;
        // doan = cac phien i-1 lui ve truoc co tong KL >= troi (khong tinh phien hien tai)
        let a = i - 1;
        while (a >= 0 && cum[i] - cum[a] < troi) a--;
        if (a < 0) { truocTren = false; continue; }
        W = i - a;
        if (W < WMIN || W > WMAX) { truocTren = false; continue; }
      } else W = 60;
      let H = -Infinity, L = Infinity;
      for (let j = i - W; j <= i - 1; j++) { if (ds[j].h > H) H = ds[j].h; if (ds[j].l < L) L = ds[j].l; }
      const tren = ds[i].c > H;
      const moi = tren && !truocTren;
      truocTren = tren;
      if (!moi || i - lanCuoi < 10 || ds[i].t < TU) continue;
      let tb20 = 0;
      for (let j = i - 19; j <= i; j++) tb20 += ds[j].v;
      if (tb20 / 20 < 100000 || ds[i].c < 10) continue;
      const vao = ds[i + 1].o;
      if (!(vao > 0)) continue;
      // tich luy / phan phoi trong doan [i-W, i-1]
      let sv = 0, sclv = 0, vTang = 0, vGiam = 0;
      for (let j = i - W; j <= i - 1; j++) {
        const { h, l, c, v } = ds[j];
        sv += v;
        if (h > l) sclv += (v * (c - l - (h - c))) / (h - l);
        if (j > 0) { if (c > ds[j - 1].c) vTang += v; else if (c < ds[j - 1].c) vGiam += v; }
      }
      // vi tri doan: so voi bien 250 phien
      let h250 = -Infinity, l250 = Infinity;
      for (let j = Math.max(0, i - 250); j <= i - 1; j++) { if (ds[j].h > h250) h250 = ds[j].h; if (ds[j].l < l250) l250 = ds[j].l; }
      const r = {};
      const vuot = {};
      for (const h of HOR) {
        r[h] = (ds[i + h].c / vao - 1) * 100;
        const m = tt[h].get(ds[i + 1].t);
        vuot[h] = m ? r[h] - m[0] / m[1] : NaN;
      }
      ev.push({ ma, ngay: ds[i].t, W, bien: (H / L - 1) * 100, clv: sv ? sclv / sv : 0, ud: vGiam ? vTang / vGiam : 9, viTri: (ds[i].c - l250) / (h250 - l250 || 1), r, vuot });
      lanCuoi = i;
    }
  }
  return ev;
}

function dong(ten, a) {
  if (a.length < 20) return console.log(ten.padEnd(38), String(a.length).padStart(5), "(it mau)");
  const cot = [];
  for (const h of HOR) {
    cot.push("|", p(tb(a.map((x) => x.r[h]))).padStart(6), p(tb(a.filter((x) => Number.isFinite(x.vuot[h])).map((x) => x.vuot[h]))).padStart(6), (p((a.filter((x) => x.r[h] > 0).length / a.length) * 100, 0) + "%").padStart(5));
  }
  console.log(ten.padEnd(38), String(a.length).padStart(5), ...cot);
}
function tieuDe(t) {
  console.log(`\n${t}`);
  console.log("".padEnd(38), "n".padStart(5), "|   10p: lai vuot thang |   20p: lai vuot thang |   40p: lai vuot thang");
}
// t-stat theo thang (tranh nhieu mau cung ngay): TB vuot TT tung thang roi t
function tThang(a, h) {
  const m = new Map();
  for (const x of a) if (Number.isFinite(x.vuot[h])) { const k = x.ngay.slice(0, 7); (m.get(k) ?? m.set(k, []).get(k)).push(x.vuot[h]); }
  const v = [...m.values()].map(tb);
  if (v.length < 6) return NaN;
  const mu = tb(v), sd = Math.sqrt(v.reduce((s, x) => s + (x - mu) ** 2, 0) / (v.length - 1));
  return mu / (sd / Math.sqrt(v.length));
}
const chia3 = (s) => { const n = s.length; return [s.slice(0, Math.floor(n / 3)), s.slice(Math.floor(n / 3), Math.floor((2 * n) / 3)), s.slice(Math.floor((2 * n) / 3))]; };

const W = suKien("woods");
const C = suKien("co60");
console.log(`Ma co free float chuan: ${Object.keys(ffc).filter((k) => nen[k]).length}. Cua so Woods ${WMIN}-${WMAX} phien, tu ${TU}, KL TB20>=100k, gia>=10, 1 tin hieu/10 phien/ma`);
console.log("Cot: lai TB (%), lai VUOT thi truong cung ngay (%), ty le thang. Vao mo cua phien sau tin hieu; N phien tinh tu ngay vao lenh.");

tieuDe("1) TAT CA tin hieu Woods (dong cua vuot dinh doan = 1 vong float)");
dong("Woods", W);
dong("Doi chung: pha dinh 60 phien co dinh", C);
console.log(`   t-stat (theo thang) vuot TT 10/20/40: Woods ${HOR.map((h) => p(tThang(W, h), 1)).join(" / ")} | co dinh 60p ${HOR.map((h) => p(tThang(C, h), 1)).join(" / ")}`);
console.log(`   Do dai doan W: trung vi ${tv(W.map((x) => x.W))} phien; bien do doan trung vi ${p(tv(W.map((x) => x.bien)), 0)}%`);

tieuDe("2) Theo do dai doan (so phien de quay het 1 vong float)");
for (const [a, b] of [[15, 30], [30, 60], [60, 120], [120, 251]]) dong(`W ${a}-${b - 1} phien`, W.filter((x) => x.W >= a && x.W < b));

tieuDe("3) Theo nam");
for (const nam of ["2023", "2024", "2025", "2026"]) dong(`Woods ${nam}`, W.filter((x) => x.ngay.startsWith(nam)));

tieuDe("4) TICH LUY vs PHAN PHOI - thuoc do CLV trong doan, 3 nhom bang nhau");
{
  const g = chia3([...W].sort((x, y) => x.clv - y.clv));
  ["PHAN PHOI (CLV thap)", "Giua", "TICH LUY (CLV cao)"].forEach((t, k) => dong(`${t} [${p(g[k][0].clv, 2)}..${p(g[k].at(-1).clv, 2)}]`, g[k]));
  console.log(`   t-stat vuot TT 20p: phan phoi ${p(tThang(g[0], 20), 1)} | tich luy ${p(tThang(g[2], 20), 1)}`);
}
tieuDe("5) TICH LUY vs PHAN PHOI - KL phien tang / KL phien giam, 3 nhom");
{
  const g = chia3([...W].sort((x, y) => x.ud - y.ud));
  ["PHAN PHOI (tang/giam thap)", "Giua", "TICH LUY (tang/giam cao)"].forEach((t, k) => dong(`${t} [${p(g[k][0].ud, 2)}..${p(g[k].at(-1).ud, 2)}]`, g[k]));
}
tieuDe("6) Theo vi tri trong bien 250 phien (day = tich luy kieu Wyckoff, dinh = phan phoi)");
dong("1/3 DUOI bien 250p", W.filter((x) => x.viTri < 0.33));
dong("Giua", W.filter((x) => x.viTri >= 0.33 && x.viTri < 0.67));
dong("1/3 TREN bien 250p", W.filter((x) => x.viTri >= 0.67));
tieuDe("7) To hop CLV x vi tri");
{
  const med = tv(W.map((x) => x.clv));
  dong("CLV cao + 1/2 duoi bien", W.filter((x) => x.clv > med && x.viTri < 0.5));
  dong("CLV cao + 1/2 tren bien", W.filter((x) => x.clv > med && x.viTri >= 0.5));
  dong("CLV thap + 1/2 duoi bien", W.filter((x) => x.clv <= med && x.viTri < 0.5));
  dong("CLV thap + 1/2 tren bien", W.filter((x) => x.clv <= med && x.viTri >= 0.5));
}
