import { tinhChiTrongNamGanNhat, tinhThanhKhoanOk, tinhGiaToiThieuOk, tinhRSGateOk, tinhRSVoiVNIndex } from "../loi/cong.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => a != null && b != null && Math.abs(a - b) < e;

ok("soNamGanNhat <= 0 -> luon True", tinhChiTrongNamGanNhat(5, { soNamGanNhat: 0 }).every((v) => v === true));
{
  const kq = tinhChiTrongNamGanNhat(3010, { soNamGanNhat: 12 }); // 12*250=3000 phien
  ok("chi True trong 3000 phien GAN CUOI, False truoc do", kq[0] === false && kq[3009 - 3000] === true);
}

{
  const volume = new Array(25).fill(50000); // duoi nguong mac dinh 100.000
  const kq1 = tinhThanhKhoanOk(volume);
  ok("khoi luong duoi nguong -> khong dat", kq1[24] === false);
  const kq2 = tinhThanhKhoanOk(new Array(25).fill(200000));
  ok("khoi luong tren nguong -> dat", kq2[24] === true);
}

ok("gia duoi 10 (nghin dong) -> khong dat", tinhGiaToiThieuOk([9.9])[0] === false);
ok("gia tren 10 -> dat", tinhGiaToiThieuOk([10.1])[0] === true);

ok("ChoPhepMuaKhiRSAm mac dinh Bat -> luon True bat ke RS am", tinhRSGateOk([false, false], {}).every((v) => v === true));
ok("Tat ChoPhepMuaKhiRSAm -> tra ve dung RSVNI_OK", tinhRSGateOk([false, true], { choPhepMuaKhiRSAm: false })[1] === true);

{
  const close = new Array(21).fill(100);
  close[20] = 110; // tang 10% trong 20 phien
  const vni = new Array(21).fill(1000);
  vni[20] = 1030; // VNIndex chi tang 3%
  const rs = tinhRSVoiVNIndex(close, vni);
  ok("RS so voi VNI = (10% - 3%)*100 = 7.0 (diem phan tram)", gan(rs[20], 7.0), rs[20]);
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
