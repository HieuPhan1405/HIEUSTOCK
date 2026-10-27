// VI SAO CO LENH LO > 6% DU CAT LO TOI DA 6%? (Hieu 27/10/2026). Lenh Mua thuong, HT thuc te (mua mo cua phien sau T+1, ban duoc tu chieu T+2 = chi so iv+3), phi 0,4%. Phan loai lenh lo that (ret < -6,5%, tuc vuot cat lo 6% + phi):
//  (a) KHOA T+2,5: lenh bi cham cat lo / co tin hieu BAN trong luc chua duoc ban (thoat tai gia MO CUA phien ban duoc dau tien = iv+3);
//  (b) GAP XUONG QUA CAT LO: thoat sau do o gia mo cua < cat lo;  (c) GIA VAO CAO HON MOC: mo cua phien mua cao hon gia moc E cua engine (cat lo S tinh tu E, khoang cach thuc lon hon 6%);  (d) khac (cham cat lo dung, tru phi...).
// Chay: node engine/dich-vu/phanTichLoVuotCatLo.mjs  (TU=ngay bat dau, mac dinh toan ky)
import { docJson, chayEngine, tb, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";
const TU = process.env.TU ?? "2018-01-01";
const { lenh } = chayEngine({ cache: docJson("nen_dai.json"), vni: docJson("vnindex_dai.json") });
const HT = { moc: HAI_TP, baoVe: true, theoSell: true };
const D = [];
for (const t of lenh.filter((x) => x.loai === 1 && x.ngay >= TU)) {
  const vao = t.iv + 1, banTu = t.iv + 3;
  const r = mp(t, { ...HT, vao, banTu });
  if (!r) continue;
  const E = t.open[vao];
  const cl = (t.E - t.S) / t.E * 100, clThuc = (E - t.S) / E * 100;
  D.push({ t, ret: r.ret, j: r.jThoat, banTu, E, S: t.S, cl, clThuc, gapVao: (E / t.E - 1) * 100 });
}
const tong = D.length, lo = D.filter((x) => x.ret < -6.5);
console.log(`Tu ${TU}: ${tong} lenh | lo > 6,5%: ${lo.length} (${f(100 * lo.length / tong, 1)}%) | lo > 10%: ${D.filter((x) => x.ret < -10).length} | lo > 15%: ${D.filter((x) => x.ret < -15).length}`);
console.log(`Cat lo engine (E-S)/E: TB ${f(tb(D.map((x) => x.cl)))}%, lon nhat ${f(Math.max(...D.map((x) => x.cl)))}% | khoang cach THUC tu gia vao thuc te: TB ${f(tb(D.map((x) => x.clThuc)))}%, lon nhat ${f(Math.max(...D.map((x) => x.clThuc)))}%; so lenh khoang cach thuc > 6%: ${D.filter((x) => x.clThuc > 6).length}`);
const nhom = { khoa: [], gap: [], giaVao: [], khac: [] };
for (const x of lo) {
  const { t } = x;
  const phienThoat = x.j;
  const giaThoatMo = t.open[phienThoat];
  if (phienThoat === x.banTu && (t.low.slice(t.iv + 1, x.banTu).some((v) => v <= x.S) || t.sell.slice(t.iv + 1, x.banTu).some(Boolean))) nhom.khoa.push(x);
  else if (giaThoatMo < x.S * 0.995 && phienThoat >= x.banTu) nhom.gap.push(x);
  else if (x.clThuc > 6.5) nhom.giaVao.push(x);
  else nhom.khac.push(x);
}
console.log("\nPhan loai lenh lo > 6,5%:");
for (const [k, ten] of [["khoa", "(a) bi khoa T+2,5 (cham cat lo / BAN truoc khi duoc ban, thoat o gia mo cua iv+3)"], ["gap", "(b) gap xuong qua cat lo sau khi duoc ban"], ["giaVao", "(c) gia vao thuc cao hon moc -> cat lo thuc > 6%"], ["khac", "(d) khac"]]) {
  const a = nhom[k];
  console.log(`  ${ten}: ${a.length} lenh (${f(100 * a.length / Math.max(lo.length, 1), 0)}%), lo TB ${f(tb(a.map((x) => x.ret)))}%`);
}
console.log("\nVi du lenh lo nang nhat:");
for (const x of [...lo].sort((a, b) => a.ret - b.ret).slice(0, 12)) {
  const { t } = x;
  console.log(`  ${t.ngay} ${t.ma.padEnd(4)} lo ${f(x.ret).padStart(6)}% | cat lo engine ${f(x.cl)}% | gia vao thuc ${f(x.gapVao)}% so voi moc | thoat phien iv+${x.j - t.iv} (ban duoc tu iv+3) tai mo cua ${f((t.open[x.j] / x.E - 1) * 100)}% so voi gia vao`);
}
