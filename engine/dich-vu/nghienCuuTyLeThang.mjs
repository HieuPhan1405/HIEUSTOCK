// NGHIEN CUU (2026-10-14): ty le thang cua he thong co so thap (~38%) - vi sao, co nang len duoc khong, va nang len thi lai / lenh doi ra sao?
// Cung mau lenh nhu nghienCuuVwapPoc.mjs (lenh MUA goc cua he thong, mua mo cua phien sau, phi 0,4% / vong). Chi doi CACH THOAT de xem danh doi.
// "Gan dinh" = gia dong cua phien tin hieu nam o 20% tren cung cua bien do 120 phien (xem nghienCuuVwapPoc.mjs phan 6-7).
// Chay: node engine/dich-vu/nghienCuuTyLeThang.mjs
import { taiLenh, mo, tb, f } from "./nghienCuuLenh.mjs";

const { lenh } = taiLenh();
const ds = [];
for (const t of lenh) {
  const iv = t.iv, E = t.open[iv + 1];
  if (!(E > 0) || iv < 260 || !(t.S < E)) continue;
  let hh = -Infinity, ll = Infinity;
  for (let j = iv - 119; j <= iv; j++) { hh = Math.max(hh, t.high[j]); ll = Math.min(ll, t.low[j]); }
  ds.push({ t, E, ngay: t.ngayArr[iv], kc: t.ngayArr[iv] >= "2022-05-01", ganDinh: (t.close[iv] - ll) / (hh - ll) >= 0.8 });
}
ds.sort((a, b) => (a.ngay < b.ngay ? -1 : 1));

function danhGia(ten, tuyChon, tap = ds) {
  const r = [];
  for (const x of tap) {
    const o = typeof tuyChon === "function" ? tuyChon(x) : tuyChon;
    const k = mo(x.t, { E: x.E, vao: x.t.iv + 1, banTu: x.t.iv + 3, S: x.t.S, ...o });
    if (k) r.push({ ...k, kc: x.kc });
  }
  const R = r.map((y) => y.ret), w = R.filter((v) => v > 0), l = R.filter((v) => v <= 0);
  let chuoi = 0, dai = 0; for (const v of R) { chuoi = v <= 0 ? chuoi + 1 : 0; dai = Math.max(dai, chuoi); }
  const lw = tb(w), ll_ = tb(l);
  console.log(`   ${ten.padEnd(52)} n=${String(r.length).padStart(4)} | thang ${f((w.length / R.length) * 100, 0).padStart(2)}% | lai TB khi thang ${f(lw).padStart(5)}% | lo TB khi thua ${f(ll_).padStart(6)}% | ty le lai/lo ${f(lw / -ll_).padStart(4)} | KY VONG ${f(tb(R)).padStart(5)}%/lenh (truoc 05/2022 ${f(tb(r.filter((y) => !y.kc).map((y) => y.ret))).padStart(5)} | tu 05/2022 ${f(tb(r.filter((y) => y.kc).map((y) => y.ret))).padStart(5)}) | giu TB ${f(tb(r.map((y) => y.phien)), 0).padStart(2)} phien`);
  return r;
}

for (const [nhan, tap] of [["TAT CA LENH", ds], ["CHI LENH GAN DINH (vi tri >= 0,8)", ds.filter((x) => x.ganDinh)], ["CAC LENH CON LAI", ds.filter((x) => !x.ganDinh)]]) {
  console.log(`\n=== ${nhan} ===`);
  const goc = danhGia("GOC: luat he thong (30% TP1, 30% TP2, phan con lai giu)", {}, tap);
  // giai phau lenh goc
  const ly = {}; for (const y of goc) { const k = y.ly.replace("_T2", ""); ly[k] = (ly[k] || 0) + 1; }
  console.log(`      ly do thoat: ${Object.entries(ly).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${f((v / goc.length) * 100, 0)}%`).join(" | ")}`);
  const thua = goc.filter((y) => y.ret <= 0);
  console.log(`      trong cac lenh THUA: tung lai >= +3% roi quay dau ${f((thua.filter((y) => y.mfe >= 3).length / thua.length) * 100, 0)}% | tung lai >= +5% ${f((thua.filter((y) => y.mfe >= 5).length / thua.length) * 100, 0)}% | chua bao gio lai qua +1% ${f((thua.filter((y) => y.mfe < 1).length / thua.length) * 100, 0)}% | khoang cach cat lo TB ${f(tb(goc.map((y) => y.rSize)))}%`);
  console.log("   -- Cach thoat khac (muc mua, cat lo, tin hieu ban giu nguyen) --");
  danhGia("Doi cat lo ve gia mua sau khi cham TP1", { beSauTP1: true }, tap);
  danhGia("Ban 50% o TP1, phan con lai doi cat lo ve gia mua", { moc: [{ w: 0.5, i: 0 }], beSauTP1: true }, tap);
  danhGia("Ban HET o TP1", { moc: [{ w: 1, i: 0 }] }, tap);
  danhGia("Chot het khi lai +3%", (x) => ({ tp: [x.E * 1.03, x.E * 1.06, x.E * 1.09], moc: [{ w: 1, i: 0 }] }), tap);
  danhGia("Chot het khi lai +5%", (x) => ({ tp: [x.E * 1.05, x.E * 1.1, x.E * 1.15], moc: [{ w: 1, i: 0 }] }), tap);
  danhGia("Chot het khi lai +8%", (x) => ({ tp: [x.E * 1.08, x.E * 1.16, x.E * 1.24], moc: [{ w: 1, i: 0 }] }), tap);
  danhGia("Thoat sau 10 phien neu chua ban", { thoiGian: 10 }, tap);
  danhGia("Cat lo RONG gap ruoi", (x) => ({ S: x.E - 1.5 * (x.E - x.t.S) }), tap);
  danhGia("Cat lo HEP mot nua", (x) => ({ S: x.E - 0.5 * (x.E - x.t.S) }), tap);
}
process.exit(0);
