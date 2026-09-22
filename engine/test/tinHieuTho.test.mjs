// Test tay cho engine/loi/tinHieuTho.js - trong tam may trang thai DaMuaDotNay (chi bao MUA 1
// lan moi dot tren nguong, du con giu tren nguong nhieu phien sau) va TurnedPink (xac nhan 3
// phien lien tuc trong vung Ban, chi bao 1 lan dau tien).
import { tinhTinHieuTho } from "../loi/tinHieuTho.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

// ---- TurnedGreen: 2 dot tren nguong, cach nhau boi 2 phien duoi nguong ----
{
  const n = 8;
  const totalScore = [0, 2, 2, 2, 0.5, 0.5, 2, 2];
  const dauVao = {
    totalScore,
    adx: new Array(n).fill(30),
    inFVGZone: new Array(n).fill(false),
    fvgDuLon: new Array(n).fill(false),
    volumeGateNgayDau: new Array(n).fill(true),
  };
  const { turnedGreen, vuaVaoVungMua } = tinhTinHieuTho(dauVao, { cheDoFVG: "Luon TAT" });
  ok("vua vao vung mua dung 2 lan (i=1 va i=6)", vuaVaoVungMua[1] === true && vuaVaoVungMua[6] === true);
  ok("khong vua vao vung mua o cac phien con lai trong cung dot (i=2,3)", vuaVaoVungMua[2] === false && vuaVaoVungMua[3] === false);
  ok("TurnedGreen CHI bao dung 1 lan moi dot (i=1)", turnedGreen[1] === true);
  ok("khong bao lap lai trong cung 1 dot (i=2,3)", turnedGreen[2] === false && turnedGreen[3] === false);
  ok("het dot (duoi nguong) khong bao", turnedGreen[4] === false && turnedGreen[5] === false);
  ok("dot MOI (i=6) bao lai tu dau", turnedGreen[6] === true);
  ok("van khong lap lai trong dot moi (i=7)", turnedGreen[7] === false);
}

// ---- TurnedPink: xac nhan 3 phien lien tuc trong vung Ban, chi bao 1 lan dau ----
{
  const n = 5;
  const totalScore = [0, -2, -2, -2, -2];
  const dauVao = {
    totalScore,
    adx: new Array(n).fill(30),
    inFVGZone: new Array(n).fill(false),
    fvgDuLon: new Array(n).fill(false),
    volumeGateNgayDau: new Array(n).fill(true),
  };
  const { turnedPink } = tinhTinHieuTho(dauVao, { cheDoFVG: "Luon TAT", soPhienBanXacNhan: 3 });
  ok("chua du 3 phien lien tuc -> chua xac nhan (i=0,1,2)", turnedPink[0] === false && turnedPink[1] === false && turnedPink[2] === false);
  ok("du 3 phien lien tuc lan dau (i=3) -> TurnedPink", turnedPink[3] === true);
  ok("van con trong vung Ban o phien sau -> KHONG bao lap lai (i=4)", turnedPink[4] === false);
}

// ---- Cong ADX: diem manh (|TotalScore| >= nguong) bo qua duoc cong ADX du ADX yeu ----
{
  const n = 3;
  const totalScore = [0, 3.0, 3.0]; // >= boQuaADXNeuDiemManh mac dinh 2.0
  const dauVao = {
    totalScore,
    adx: new Array(n).fill(5), // duoi nguong 18
    inFVGZone: new Array(n).fill(false),
    fvgDuLon: new Array(n).fill(false),
    volumeGateNgayDau: new Array(n).fill(true),
  };
  const { adxGateOk } = tinhTinHieuTho(dauVao, { cheDoFVG: "Luon TAT" });
  ok("ADX yeu nhung diem qua manh -> van bo qua cong ADX", adxGateOk[1] === true);
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
