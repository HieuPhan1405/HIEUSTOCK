// KIEM TRA NGOAI MAU: cach ra HT (30% TP1 + 30% TP2 + con lai theo BAN) KEM LOC d5 VN-Index (Hieu 27/10/2026: "test kiem tra ngoai mau cho HT kem loc d5"). Lenh Mua thuong cua engine, quy uoc THUC TE (mua mo cua phien sau, ban tu chieu T+2), phi 0,4%.
// d5 = % VN-Index 5 phien den dong cua ngay tin hieu (da biet 0,97 tuong quan voi d5 truc tiep trong phien). Bon phan:
//  (1) THEO NAM: quy tac DAT TRUOC d5 > 1% (nguong tim ra khi nhin toan bo du lieu) - tung nam 2018..2026: lai TB cua lenh giu vs tat ca, so nam loc tot hon.
//  (2) TACH MOC: chon nguong CHI bang du lieu < 2022-05-01 (luoi nguong, toi da lai/lenh voi >= 40% lenh con lai) roi do tren >= 2022-05 va 2026: khong dieu chinh gi sau do. Khoang tin cay bootstrap theo NGAY (khoi) cho chenh lech lai TB, p-value hoan vi (so voi bo loc ngau nhien cung ty le), DM K=10 / K=20.
//  (3) WALK-FORWARD MO RONG: moi nam Y tu 2020 chon nguong bang toan bo du lieu truoc 1/1/Y, ap cho nam Y; ghep cac nam -> ket qua ngoai mau, so voi khong loc.
//  (4) Bien the d5 TRUOC PHIEN (dong cua T-1 so voi T-6): biet tu toi hom truoc, khong can bo do trong ngay.
// Chay: node engine/dich-vu/kiemTraNgoaiMauD5HT.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const DANG_MO = !process.env.KHONG_DANG_MO; // mac dinh TINH ca lenh engine chua dong o cuoi du lieu (theo gia dong cua cuoi); KHONG_DANG_MO=1 de bo nhu truoc 27/10
const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa } = chayEngine({ cache, vni, giuLenhDangMo: DANG_MO });
const lenhGoc = tatCa.filter((t) => t.loai === 1);
const chiSo = new Map(vni.map((b, i) => [b.t, i]));
const vc = vni.map((b) => b.c);
const HT = { moc: HAI_TP, baoVe: true, theoSell: true };
const D = [];
for (const t of lenhGoc) {
  const i = chiSo.get(t.ngay);
  if (i == null || i < 6) continue;
  const r = mp(t, { ...HT, danhGiaCuoi: DANG_MO, vao: t.iv + 1, banTu: t.iv + 3 });
  if (!r) continue;
  D.push({ t, ret: r.ret, ngay: t.ngay, nam: t.ngay.slice(0, 4), d5: (vc[i] / vc[i - 5] - 1) * 100, d5pre: (vc[i - 1] / vc[i - 6] - 1) * 100 });
}
console.log(`${D.length} lenh Mua thuong (HT thuc te), ${D[0].ngay} -> ${D[D.length - 1].ngay}`);
const tbR = (a) => tb(a.map((x) => x.ret));
const rng = (() => { let s = 12345; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; })();

// bootstrap theo ngay: chenh lech lai TB (giu) - (tat ca)
function bootstrapChenh(all, giuSet, B = 2000) {
  const theoNgay = new Map();
  for (const x of all) { if (!theoNgay.has(x.ngay)) theoNgay.set(x.ngay, []); theoNgay.get(x.ngay).push(x); }
  const ngay = [...theoNgay.keys()];
  const res = [];
  for (let b = 0; b < B; b++) {
    let sA = 0, nA = 0, sG = 0, nG = 0;
    for (let k = 0; k < ngay.length; k++) {
      for (const x of theoNgay.get(ngay[Math.floor(rng() * ngay.length)])) { sA += x.ret; nA++; if (giuSet.has(x)) { sG += x.ret; nG++; } }
    }
    if (nG) res.push(sG / nG - sA / nA);
  }
  res.sort((a, b) => a - b);
  return [res[Math.floor(0.025 * res.length)], res[Math.floor(0.975 * res.length)], res.filter((v) => v <= 0).length / res.length];
}
// p-value hoan vi: giu ngau nhien cung so lenh
function hoanVi(all, nGiu, quanSat, B = 2000) {
  let dem = 0;
  const mA = tbR(all);
  for (let b = 0; b < B; b++) {
    const idx = new Set();
    while (idx.size < nGiu) idx.add(Math.floor(rng() * all.length));
    let s = 0;
    for (const i of idx) s += all[i].ret;
    if (s / nGiu - mA >= quanSat) dem++;
  }
  return dem / B;
}
const dm = (arr) => { const kq = arr.map((x) => ({ ret: x.ret, phien: 0 })); void kq; };
void dm;
function danhMucTu(arr) {
  const ds = arr.map((x) => x.t);
  const r = arr.map((x) => mp(x.t, { ...HT, danhGiaCuoi: DANG_MO, vao: x.t.iv + 1, banTu: x.t.iv + 3 }));
  return [10, 20].map((K) => danhMucNhieuLan(r, ds, K, 20, {}));
}

// ---------- (1) theo nam, quy tac dat truoc ----------
for (const [tenD, key] of [["d5 dong cua T", "d5"], ["d5 TRUOC PHIEN", "d5pre"]]) {
  console.log(`\n===== (1) THEO NAM: quy tac ${tenD} > 1% (dat truoc) =====`);
  console.log("Nam".padEnd(6), "n tat ca".padStart(9), "lai TB".padStart(8), "| n giu".padStart(8), "lai TB giu".padStart(11), "| lai TB loai".padStart(14), "| giu - tat ca");
  let tot = 0, tuKhoan = 0;
  for (let y = 2018; y <= 2026; y++) {
    const A = D.filter((x) => +x.nam === y);
    if (A.length < 20) continue;
    const G = A.filter((x) => x[key] > 1), L = A.filter((x) => x[key] <= 1);
    const dd = tbR(G) - tbR(A);
    tot++; if (dd > 0) tuKhoan++;
    console.log(String(y).padEnd(6), String(A.length).padStart(9), f(tbR(A)).padStart(8), "|", String(G.length).padStart(6), f(tbR(G)).padStart(11), "|", f(tbR(L)).padStart(12), "|", f(dd).padStart(9));
  }
  console.log(`  => loc tot hon khong loc o ${tuKhoan}/${tot} nam`);
}

// ---------- (2) tach moc ----------
const MOC = "2022-05-01";
const NGUONG = [-2, -1, -0.5, 0, 0.5, 1, 1.5, 2, 3];
for (const [tenD, key] of [["d5 dong cua T", "d5"], ["d5 TRUOC PHIEN", "d5pre"]]) {
  const train = D.filter((x) => x.ngay < MOC), test = D.filter((x) => x.ngay >= MOC);
  console.log(`\n===== (2) TACH MOC ${MOC} | ${tenD} | luoi nguong tren TRAIN (n ${train.length}, lai TB ${f(tbR(train))}) =====`);
  let best = null;
  for (const th of NGUONG) {
    const G = train.filter((x) => x[key] > th);
    const m = tbR(G);
    console.log(`  d5 > ${String(th).padStart(4)}%: giu ${String(G.length).padStart(4)} (${f(100 * G.length / train.length, 0)}%), lai TB ${f(m).padStart(6)}`);
    if (G.length >= 0.4 * train.length && (best == null || m > best.m)) best = { th, m };
  }
  console.log(`  -> nguong chon tu TRAIN: d5 > ${best.th}%`);
  for (const [ten, tap] of [[`TEST >= ${MOC}`, test], ["TEST rieng 2026", test.filter((x) => x.ngay >= "2026-01-01")]]) {
    const G = tap.filter((x) => x[key] > best.th), L = tap.filter((x) => x[key] <= best.th);
    const giuSet = new Set(G);
    const chenh = tbR(G) - tbR(tap);
    const [lo, hi, pBoot] = bootstrapChenh(tap, giuSet);
    const pHv = hoanVi(tap, G.length, chenh);
    const dmA = danhMucTu(tap), dmG = danhMucTu(G);
    console.log(`  ${ten}: n ${tap.length}, lai TB tat ca ${f(tbR(tap))} | giu ${G.length}: ${f(tbR(G))} (thang ${f(100 * G.filter((x) => x.ret > 0).length / G.length, 0)}%) | loai ${L.length}: ${f(tbR(L))} | chenh ${f(chenh)} [CI95 ${f(lo)}..${f(hi)}; P(chenh<=0) boot ${f(pBoot, 3)}; hoan vi p ${f(pHv, 3)}]`);
    console.log(`     DM K=10: khong loc ${f(dmA[0].cagr, 1)}%/${f(dmA[0].sut, 0)}% -> loc ${f(dmG[0].cagr, 1)}%/${f(dmG[0].sut, 0)}% | K=20: ${f(dmA[1].cagr, 1)}%/${f(dmA[1].sut, 0)}% -> ${f(dmG[1].cagr, 1)}%/${f(dmG[1].sut, 0)}%`);
  }
}

// ---------- (3) walk-forward mo rong ----------
for (const [tenD, key] of [["d5 dong cua T", "d5"], ["d5 TRUOC PHIEN", "d5pre"]]) {
  console.log(`\n===== (3) WALK-FORWARD MO RONG | ${tenD} | moi nam chon nguong bang du lieu truoc 1/1 nam do =====`);
  const oos = [], oosGiu = [];
  for (let y = 2020; y <= 2026; y++) {
    const dau = `${y}-01-01`, cuoi = `${y + 1}-01-01`;
    const train = D.filter((x) => x.ngay < dau), nam = D.filter((x) => x.ngay >= dau && x.ngay < cuoi);
    if (!nam.length) continue;
    let best = null;
    for (const th of NGUONG) {
      const G = train.filter((x) => x[key] > th);
      if (G.length < 0.4 * train.length) continue;
      const m = tbR(G);
      if (best == null || m > best.m) best = { th, m };
    }
    const G = nam.filter((x) => x[key] > best.th);
    oos.push(...nam); oosGiu.push(...G);
    console.log(`  ${y}: nguong chon d5 > ${String(best.th).padStart(4)}% | tat ca ${String(nam.length).padStart(4)} lai ${f(tbR(nam)).padStart(6)} | giu ${String(G.length).padStart(4)} lai ${f(tbR(G)).padStart(6)}`);
  }
  const giuSet = new Set(oosGiu);
  const chenh = tbR(oosGiu) - tbR(oos);
  const [lo, hi, pBoot] = bootstrapChenh(oos, giuSet);
  const dmA = danhMucTu(oos), dmG = danhMucTu(oosGiu);
  console.log(`  GHEP 2020-2026 (ngoai mau): tat ca n ${oos.length} lai ${f(tbR(oos))} | giu n ${oosGiu.length} lai ${f(tbR(oosGiu))} | chenh ${f(chenh)} [CI95 ${f(lo)}..${f(hi)}; P(chenh<=0) ${f(pBoot, 3)}; hoan vi p ${f(hoanVi(oos, oosGiu.length, chenh), 3)}]`);
  console.log(`     DM K=10: ${f(dmA[0].cagr, 1)}%/${f(dmA[0].sut, 0)}% -> ${f(dmG[0].cagr, 1)}%/${f(dmG[0].sut, 0)}% | K=20: ${f(dmA[1].cagr, 1)}%/${f(dmA[1].sut, 0)}% -> ${f(dmG[1].cagr, 1)}%/${f(dmG[1].sut, 0)}%`);
}
