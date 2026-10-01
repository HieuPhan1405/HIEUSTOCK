// BACKTEST "NOI CONG" (2026-10-01): thu nới luật MUA cho truong hop nhu BFC - diem da cao (>= 1,25) nhung PHIEN DAU khong du khoi luong, phien sau gia da roi khoi vung FVG nen khong mua duoc.
// Cac bien the (tinh bang tham so engine, mac dinh engine KHONG doi):
//   base   : luat hien tai (cheDoFVG "Thong minh").
//   fvgTat : tat han cong vung FVG (cheDoFVG "Luon TAT") - phien dau van phai du khoi luong.
//   b225 / b300 / b350 : tu PHIEN THU HAI cua dot tren nguong, diem >= 2,25 / 3,0 / 3,5 thi bo qua cong FVG + khoi luong (thamSo.diemBoCongFVGPhienSau).
// Moi lenh do voi 2 cach mua THUC TE (ATC = gia dong cua phien tin hieu; mo cua = mo cua phien sau), chot 30% TP1 + 30% TP2 + 40% giu den BAN / cat lo / hoa von sau TP2, chi phi 0,4%, T+2.
// (Khong dung gia "o moc" vi gia do chi dat duoc neu mua dung luc gia vuot moc - xem backtestVaoThucTe.mjs.) Cache ~11 nam nen_dai.json (387 ma dang niem yet: co thien lech song sot).
// CACH CHAY:  node engine/dich-vu/backtestNoiCong.mjs chay base   (tung bien the, ghi engine/output/noi_cong_<ten>.json; co the chay SONG SONG nhieu cua so)
//             node engine/dich-vu/backtestNoiCong.mjs sosanh      (doc cac file da chay, in bang so sanh voi base)
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { docJson, chayEngine, moPhongThucTe, thongKe, tb, f, kyOf, TEN_KY } from "./backtestChung.mjs";

const BIEN_THE = {
  base: {},
  fvgTat: { cheDoFVG: "Luon TAT" },
  b225: { diemBoCongFVGPhienSau: 2.25 },
  b300: { diemBoCongFVGPhienSau: 3.0 },
  b350: { diemBoCongFVGPhienSau: 3.5 },
};
const duongDan = (ten) => fileURLToPath(new URL(`../output/noi_cong_${ten}.json`, import.meta.url));
const [lenhCon, ten] = process.argv.slice(2);

if (lenhCon === "chay") {
  if (!BIEN_THE[ten]) throw new Error(`Bien the khong co: ${ten} (co: ${Object.keys(BIEN_THE).join(", ")})`);
  const cache = docJson("nen_dai.json");
  const vni = docJson("vnindex_dai.json");
  const { lenh, soMa } = chayEngine({ cache, vni, thamSoThem: BIEN_THE[ten] });
  const kq = lenh.map((t) => ({
    ma: t.ma,
    ngay: t.ngay,
    loai: t.loai,
    atc: moPhongThucTe(t, { E: t.close[t.iv], vao: t.iv, banTu: t.iv + 2 }),
    moCua: t.iv + 1 < t.n ? moPhongThucTe(t, { E: t.open[t.iv + 1], vao: t.iv + 1, banTu: t.iv + 3 }) : null,
  }));
  writeFileSync(duongDan(ten), JSON.stringify({ ten, thamSo: BIEN_THE[ten], soMa, lenh: kq }));
  console.log(`${ten}: ${soMa} ma, ${kq.length} lenh`);
} else if (lenhCon === "sosanh") {
  const doc = (t) => (existsSync(duongDan(t)) ? JSON.parse(readFileSync(duongDan(t), "utf-8")) : null);
  const base = doc("base");
  if (!base) throw new Error("Chua chay 'base'");
  const khoa = (x) => `${x.ma}|${x.ngay}`;
  const tapBase = new Set(base.lenh.map(khoa));
  const DAU = `${"".padEnd(34)} ${"n".padStart(5)} ${"laiTB".padStart(6)} ${"trungVi".padStart(7)} ${"thang%".padStart(6)} ${"PF".padStart(5)} ${"tong%".padStart(7)} | ${TEN_KY.map((k) => k.padStart(13)).join(" ")}`;
  function dong(nhan, ds, cach) {
    const kq = ds.map((x) => ({ x, r: x[cach] })).filter((a) => a.r != null && Number.isFinite(a.r));
    const k = thongKe(kq.map((a) => ({ ret: a.r, phien: 1 })));
    const ky = [0, 1, 2].map((j) => {
      const a = kq.filter((q) => kyOf(q.x.ngay) === j).map((q) => q.r);
      return a.length ? `${f(tb(a))} (${a.length})` : "-";
    });
    const tong = kq.reduce((s, a) => s + a.r, 0);
    console.log(`${nhan.padEnd(34)} ${String(k.n).padStart(5)} ${f(k.tb).padStart(6)} ${f(k.trungVi).padStart(7)} ${f(k.thang, 1).padStart(6)} ${f(k.pf).padStart(5)} ${f(tong, 0).padStart(7)} | ${ky.map((v) => v.padStart(13)).join(" ")}`);
  }
  for (const [cach, tenCach] of [["atc", "MUA ATC (gia dong cua phien tin hieu)"], ["moCua", "MUA MO CUA PHIEN SAU"]]) {
    console.log(`\n================ ${tenCach} - lai/lo % moi lenh da tru phi 0,4% ================\n${DAU}`);
    for (const t of Object.keys(BIEN_THE)) {
      const d = doc(t);
      if (!d) continue;
      dong(`${t} (tat ca lenh)`, d.lenh, cach);
    }
  }
  for (const t of Object.keys(BIEN_THE).filter((x) => x !== "base")) {
    const d = doc(t);
    if (!d) continue;
    const tapV = new Set(d.lenh.map(khoa));
    const them = d.lenh.filter((x) => !tapBase.has(khoa(x)));
    const mat = base.lenh.filter((x) => !tapV.has(khoa(x)));
    console.log(`\n---- ${t}: ${them.length} lenh MOI them so voi base, ${mat.length} lenh cua base khong con ----`);
    for (const [cach, tenCach] of [["atc", "ATC"], ["moCua", "mo cua"]]) {
      console.log(DAU);
      dong(`  lenh MOI them (mua ${tenCach})`, them, cach);
      dong(`  lenh base bi mat (mua ${tenCach})`, mat, cach);
    }
  }
} else {
  console.log("Cach dung: node engine/dich-vu/backtestNoiCong.mjs chay <" + Object.keys(BIEN_THE).join("|") + ">   |   sosanh");
}
