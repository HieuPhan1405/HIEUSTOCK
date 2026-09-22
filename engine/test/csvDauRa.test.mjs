import { CAC_COT, xayDungCSV } from "../loi/csvDauRa.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

{
  const csv = xayDungCSV([
    { ma: "VJC", tin: "MUA", diem: 1.5, mat_than: true, fvg_ok: false, ngay_mua: "23/9/2026", kumo_twist: "", gia_mua: null, stop_bao_ve: 0 },
  ]);
  const dong = csv.split("\n");
  ok("dong dau la header dung CAC_COT", dong[0] === CAC_COT.join(","), dong[0]);
  ok("co dung 2 dong (header + 1 hang)", dong.length === 2);

  const hang = {};
  CAC_COT.forEach((c, i) => (hang[c] = dong[1].split(",")[i]));
  ok("ma giu nguyen chuoi", hang.ma === "VJC");
  ok("boolean true -> '1'", hang.mat_than === "1");
  ok("boolean false -> '0'", hang.fvg_ok === "0");
  ok("chuoi ngay giu nguyen", hang.ngay_mua === "23/9/2026");
  ok("chuoi rong giu nguyen (khac null)", hang.kumo_twist === "");
  ok("null -> chuoi rong", hang.gia_mua === "");
  ok("so 0 khong bi doi thanh rong", hang.stop_bao_ve === "0");
  ok("truong khong khai bao -> chuoi rong (undefined)", hang.trend === "");
}

{
  const csv = xayDungCSV([]);
  ok("khong co hang van co dong header", csv === CAC_COT.join(","));
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
