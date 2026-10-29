// Test tay: node engine/test/bangNhomChuDe.test.mjs
import { tinhBangNhom, mauNenTheoDoi, dinhDangKL, chiSoNhomTheoNgay } from "../../lib/bangNhomChuDe.js";
let loi = 0;
const dat = (ten, dk, them = "") => { if (dk) console.log("ok:", ten); else { console.log("SAI:", ten, them); loi++; } };
const gan = (a, b, e = 1e-9) => Math.abs(a - b) <= e;
const bars = {
  AAA: [{ t: "2026-10-28", c: 10, v: 100 }, { t: "2026-10-29", c: 10.5, v: 3300 }], // +5%
  BBB: [{ t: "2026-10-28", c: 20, v: 1 }, { t: "2026-10-29", c: 19, v: 2_000_000 }], // -5%
  CCC: [{ t: "2026-10-15", c: 1.7, v: 19800 }, { t: "2026-10-16", c: 1.7, v: 5 }], // khong giao dich phien gan nhat
};
const r = tinhBangNhom(["AAA", "BBB", "CCC", "DDD"], bars);
dat("phien gan nhat = 29/10", r.ngayPhien === "2026-10-29");
const h = Object.fromEntries(r.hang.map((x) => [x.ma, x]));
dat("AAA +5%, KL 3300", gan(h.AAA.doiPct, 5) && h.AAA.kl === 3300 && h.AAA.gia === 10.5);
dat("BBB -5%", gan(h.BBB.doiPct, -5));
dat("CCC nen cu hon phien: 0% va KL 0, giu gia cu 1,7", h.CCC.doiPct === 0 && h.CCC.kl === 0 && h.CCC.gia === 1.7);
dat("DDD khong co du lieu: coDuLieu false, bo qua khi tinh trung binh", h.DDD.coDuLieu === false && h.DDD.gia === null);
dat("trung binh deu 3 ma co du lieu (+5, -5, 0) = 0", gan(r.trungBinhPct, 0), r.trungBinhPct);
dat("khong co ma nao -> trungBinh null", tinhBangNhom(["X"], {}).trungBinhPct === null);
// kiem tra theo mau: trung binh 22 ma cua mau tham khao ~ -0,64
{
  const doi = [0, 0, 0, 2.22, 2.63, 0.18, -0.56, 0, -1.14, -2.08, -0.86, 5.45, -0.92, -1.2, -0.18, -2.42, -2.92, -0.36, -4.85, -2.86, -1.97, -2.18];
  const b = Object.fromEntries(doi.map((d, i) => [`M${i}`, [{ t: "a", c: 100, v: 1 }, { t: "b", c: 100 * (1 + d / 100), v: 1 }]]));
  const rr = tinhBangNhom(Object.keys(b), b);
  dat("22 ma cua mau tham khao -> trung binh -0,64%", gan(Math.round(rr.trungBinhPct * 100) / 100, -0.64), rr.trungBinhPct);
}
dat("mau: 0% vang, +5% xanh, -5% do, null trong suot", mauNenTheoDoi(0).startsWith("rgba(234,179,8") && mauNenTheoDoi(5).startsWith("rgba(34,197,94") && mauNenTheoDoi(-5).startsWith("rgba(239,68,68") && mauNenTheoDoi(null) === "transparent");
dat("mau dam hon khi bien dong lon hon", Number(mauNenTheoDoi(6.9).split(",")[3].replace(")", "")) > Number(mauNenTheoDoi(1).split(",")[3].replace(")", "")));
dat("dinh dang KL: 3300 -> 3,3k; 2.000.000 -> 2m; 100 -> 100; 6.445.100 -> 6,4m", dinhDangKL(3300) === "3,3k" && dinhDangKL(2_000_000) === "2m" && dinhDangKL(100) === "100" && dinhDangKL(6_445_100) === "6,4m" && dinhDangKL(0) === "0");
// chi so nhom theo ngay
{
  const ngay = ["d1", "d2", "d3", "d4"];
  const b = {
    A: [{ t: "d1", c: 10 }, { t: "d2", c: 11 }, { t: "d3", c: 11 }, { t: "d4", c: 12.1 }], // +10%, 0, +10%
    B: [{ t: "d2", c: 20 }, { t: "d3", c: 18 }, { t: "d4", c: 18 }], // khong co d1: d2 chi co A; d3 -10%; d4 0
  };
  const ci = chiSoNhomTheoNgay(ngay, ["A", "B", "ZZ"], b);
  dat("chi so nhom: do dai bang so ngay, d1 = 100", ci.length === 4 && ci[0] === 100);
  dat("d2: chi A co du 2 ngay -> +10% = 110", gan(ci[1], 110, 1e-6), ci[1]);
  dat("d3: A 0%, B -10% -> trung binh -5% -> 104,5", gan(ci[2], 104.5, 1e-6), ci[2]);
  dat("d4: A +10%, B 0% -> +5% -> 109,725", gan(ci[3], 109.725, 1e-3), ci[3]);
  dat("khong ma nao co gia -> null", chiSoNhomTheoNgay(ngay, ["X"], {}) === null);
}
console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
