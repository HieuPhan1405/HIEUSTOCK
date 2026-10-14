// KIEM TRA LUAT T+2,5 (2026-10-14): co phieu mua phien T ve tai khoan CHIEU T+2 -> chi ban duoc tu phien chieu T+2. He thong / web hien tai co ghi BAN, CAT LO hay CHOT TP
// truoc thoi diem do khong, bao nhieu lan, va neu ton trong dung T+2,5 thi ket qua lenh doi ra sao.
// Lenh: lenh MUA goc cua engine (taiLenh), mua phien T (iv) o gia vao cua he thong (E), cat lo S, TP1-3. Luat thoat mo phong giong web: 30% TP1, 30% TP2, 40% con lai den TP3
// (ket thuc lenh), sau TP2 cat lo doi ve gia mua, cham cat lo la ban, tin hieu ban (da co dieu kien T+2 tinh tu Buy tho) ban o gia dong cua. Phi 0,4% / vong.
//   A "nhu hien tai": moi su kien thuc hien ngay phien no xay ra, ke ca T+1 (web ghi TP / cat lo bat ky luc nao).
//   B "T+2,5 chat":  T va T+1 khong ban duoc gi; su kien da xay ra den het T+2 (cham cat lo, tin hieu ban, cham TP) chi thuc hien o gia DONG CUA T+2 (thay cho phien chieu);
//                    TP chi tinh neu gia dong cua T+2 van >= TP. Tu T+3 nhu A.
//   C "ban sang T+2": nhu B nhung thuc hien o gia MO CUA T+2 (cach cac backtest truoc day dang lam - som hon nua phien so voi luat that).
// Chay: node engine/dich-vu/kiemTraT25.mjs
import { taiLenh, tb, f } from "./nghienCuuLenh.mjs";

const PHI = 0.4;
const { lenh } = taiLenh();

function moPhong(t, kieu) {
  const { open, high, low, close, sell, n, iv, E, tp } = t;
  let S = t.S, conLai = 1, thu = 0, daTP = [false, false, false], choStop = false, choBan = false, dinhCho = -Infinity, suKien = { stopSom: false, tpSom: false, banSom: false };
  const W = [0.3, 0.3, 0.4];
  const ban = (w, g) => { thu += w * (g / E); conLai -= w; };
  const ket = (j, ly) => ({ ret: (thu - 1) * 100 - PHI, j, ly, phien: j - iv, ...suKien });
  for (let i = iv + 1; i < n; i++) {
    const t2 = iv + 2;
    if (kieu !== "A" && i < t2) { // T+1: chua co hang
      if (low[i] <= S) { choStop = true; suKien.stopSom = true; }
      if (sell[i]) { choBan = true; suKien.banSom = true; }
      dinhCho = Math.max(dinhCho, high[i]);
      if (high[i] >= tp[0]) suKien.tpSom = true;
      continue;
    }
    if (kieu === "A" && i < t2) { if (low[i] <= S) suKien.stopSom = true; if (high[i] >= tp[0]) suKien.tpSom = true; if (sell[i]) suKien.banSom = true; }
    if (kieu !== "A" && i === t2) {
      const g = kieu === "B" ? close[i] : open[i];
      if (choStop || choBan || low[i] <= S || sell[i]) {
        // co su kien ban den het T+2: B ban o dong cua T+2; C ban o mo cua T+2 (neu chi cham cat lo TRONG T+2 thi C ban tai min(mo cua, cat lo))
        const gia = kieu === "C" && !choStop && !choBan && !sell[i] ? Math.min(open[i], S) : g;
        ban(conLai, gia); return ket(i, choStop || low[i] <= S ? "CAT_LO" : "BAN");
      }
      // TP: B chi tinh khi dong cua T+2 van >= TP; C tinh theo dinh truoc do va dinh T+2 (ban o gia TP, hoac mo cua neu mo cua da vuot)
      for (let k = 0; k < 3; k++) {
        if (daTP[k]) continue;
        const dat = kieu === "B" ? close[i] >= tp[k] : Math.max(dinhCho, high[i]) >= tp[k];
        if (!dat) break;
        ban(W[k], kieu === "B" ? close[i] : Math.max(open[i], Math.min(tp[k], Math.max(dinhCho, high[i])))); daTP[k] = true;
      }
      if (daTP[1]) S = Math.max(S, E);
      if (daTP[2] || conLai <= 1e-9) return ket(i, "TP3");
      continue;
    }
    // phien binh thuong
    if (low[i] <= S) { ban(conLai, Math.min(open[i], S)); return ket(i, daTP[1] ? "HOA_VON" : "CAT_LO"); }
    for (let k = 0; k < 3; k++) {
      if (daTP[k]) continue;
      if (high[i] < tp[k]) break;
      ban(W[k], Math.max(open[i], tp[k])); daTP[k] = true;
    }
    if (daTP[2] || conLai <= 1e-9) return ket(i, "TP3");
    if (daTP[1]) S = Math.max(S, E);
    if (sell[i]) { ban(conLai, close[i]); return ket(i, "BAN"); }
  }
  return null;
}

const KQ = { A: [], B: [], C: [] };
for (const t of lenh) {
  if (!(t.E > 0) || !(t.S < t.E) || t.iv + 3 >= t.n) continue;
  const r = { A: moPhong(t, "A"), B: moPhong(t, "B"), C: moPhong(t, "C") };
  if (!r.A || !r.B || !r.C) continue;
  for (const k of ["A", "B", "C"]) KQ[k].push({ ...r[k], ngay: t.ngay, ma: t.ma, loai: t.loai, tpNgayMua: t.high[t.iv] >= t.tp[0] });
}
const n = KQ.A.length;
const pct = (g, fn) => f((g.filter(fn).length / g.length) * 100, 1);
console.log(`So lenh: ${n} (lenh MUA goc cua engine, mua o gia vao cua he thong phien T)\n`);
console.log("=== 1. Bao nhieu lenh gap su kien TRUOC khi co hang (trong phien T+1) ===");
const A = KQ.A;
console.log(`   Cham cat lo trong T+1 (web hien tai ghi CAT LO ngay T+1): ${pct(A, (x) => x.stopSom)}% so lenh`);
console.log(`   Cham TP1 trong T+1 (web ghi chot 30% o TP1 ngay T+1): ${pct(A, (x) => x.tpSom)}% so lenh`);
console.log(`   Dinh CHINH phien mua (T) da >= TP1: ${pct(A, (x) => x.tpNgayMua)}% so lenh (web tinh "da cham TP" tu dinh cao nhat KE CA phien mua -> co the ghi TP1 ngay phien T)`);
console.log(`   Co tin hieu BAN trong T+1: ${pct(A, (x) => x.banSom)}% so lenh (luat T+2 cua tin hieu ban tinh tu Buy tho, nen lenh Mua lai / Mua muon co the lot)`);
for (const lo of [1, 2, 3]) { const g = A.filter((x) => x.loai === lo); if (g.length) console.log(`      loai ${lo === 1 ? "Mua thuong" : lo === 2 ? "Mua lai" : "Mua muon"}: n=${g.length}, tin hieu ban trong T+1 ${pct(g, (x) => x.banSom)}%, cat lo T+1 ${pct(g, (x) => x.stopSom)}%`); }
console.log(`   Lenh A DONG HAN trong T+1 (ra truoc khi co hang): ${pct(A, (x) => x.phien <= 1)}%`);

console.log("\n=== 2. Ket qua lenh theo 3 cach (TB % moi lenh sau phi, ty le thang) ===");
for (const [k, ten] of [["A", "A. Nhu hien tai (ban / TP ngay ca T+1)"], ["C", "C. Doi den sang T+2 (cach backtest cu)"], ["B", "B. Dung T+2,5 (ban chieu T+2, lay gia dong cua)"]]) {
  const g = KQ[k]; const kp = g.filter((x) => x.ngay < "2022-05-01"), kc = g.filter((x) => x.ngay >= "2022-05-01");
  console.log(`   ${ten.padEnd(52)} TB ${f(tb(g.map((x) => x.ret))).padStart(6)}% | thang ${pct(g, (x) => x.ret > 0).padStart(5)}% | truoc 05/2022 ${f(tb(kp.map((x) => x.ret))).padStart(6)}% | tu 05/2022 ${f(tb(kc.map((x) => x.ret))).padStart(6)}%`);
}
console.log("\n=== 3. Rieng cac lenh co su kien trong T+1 (noi luat T+2,5 tao khac biet) ===");
for (const [ten, fn] of [["cham cat lo trong T+1", (i) => A[i].stopSom], ["cham TP1 trong T+1", (i) => A[i].tpSom], ["tin hieu ban trong T+1", (i) => A[i].banSom]]) {
  const idx = A.map((_, i) => i).filter(fn); if (!idx.length) continue;
  const m = (k) => f(tb(idx.map((i) => KQ[k][i].ret)));
  const th = (k) => f((idx.filter((i) => KQ[k][i].ret > 0).length / idx.length) * 100, 0);
  console.log(`   ${ten.padEnd(26)} n=${String(idx.length).padStart(4)} | A ${m("A").padStart(6)}% (thang ${th("A")}%) | sang T+2 ${m("C").padStart(6)}% | T+2,5 ${m("B").padStart(6)}% (thang ${th("B")}%)`);
}
process.exit(0);
