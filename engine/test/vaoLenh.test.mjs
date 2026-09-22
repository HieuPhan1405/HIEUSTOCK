// Test tay cho engine/loi/vaoLenh.js - CheDoMoc (gia vao tai moc chuyen mua + SL cau truc, 2
// chieu kep gioi han toi thieu/toi da), 3 muc TP dung chung, va dieu kien MUA LAI/MUA THEM.
import { tinhCheDoMocVaoLenh, tinhBaMocChotLoi, tinhMuaLai, tinhMuaMoiSauTP3 } from "../loi/vaoLenh.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-6) => a != null && b != null && Math.abs(a - b) < e;

// ---- CheDoMoc: vuot may (khong vuot duong can bang) -> loaiMoc=1, SL bi keo LEN boi HardStopPct
// (raw SL cau truc qua xa entry) ----
{
  const n = 3;
  const close = [90, 105, 106];
  const open = [0, 102, 0];
  const high = [0, 106, 0];
  const low = [0, 100, 0];
  const atr = [0, 5, 0];
  const cloudTop = [95, 95, 95];
  const cbTop = [200, 200, 200];
  const cbBot = [0, 0, 0];
  const kijun = [0, 0, 0];
  const vuaVaoVungMua = [false, true, false];
  const kq = tinhCheDoMocVaoLenh({ close, open, high, low, atr, cloudTop, cbTop, cbBot, kijun, vuaVaoVungMua });
  ok("vuot may dung tai phien chuyen mua", kq.vuotMayBar[1] === true && kq.vuotCBBar[1] === false);
  ok("loaiMocBar = 1 (chi vuot may)", kq.loaiMocBar[1] === 1);
  ok("GiaKichHoatBar = max(moc=95, min(mo cua 102, dong cua 105)=102) = 102", gan(kq.giaKichHoatBar[1], 102));
  ok("GiaVaoBar dung dung GiaKichHoatBar tai phien chuyen mua", gan(kq.giaVaoBar[1], 102));
  // SL cau truc tho = 95 - 0.3*5 = 93.5; toi thieu 2% = 102*0.98=99.96 -> Min(93.5,99.96)=93.5;
  // toi da 6% = 102*0.94=95.88 -> Max(93.5,95.88)=95.88 (bi keo LEN vi qua xa).
  ok("Stop-loss bi gioi han boi HardStopPct (95.88), khong con 93.5 tho", gan(kq.stopVaoBar[1], 95.88));
}

// ---- CheDoMoc: SL cau truc tho qua GAN entry -> bi day RA XA hon boi SLToiThieuPct ----
{
  const n = 2;
  const close = [0, 102];
  const open = [0, 100];
  const high = [0, 102];
  const low = [0, 100];
  const atr = [0, 0]; // demSLtheoATR*atr = 0 -> SL tho = baseSL nguyen ven
  const cloudTop = [200, 200]; // khong vuot may/CB -> baseSL dung Kijun
  const cbTop = [200, 200];
  const cbBot = [0, 0];
  const kijun = [0, 101.5]; // rat gan gia vao (102) -> can bi day ra xa hon toi thieu 2%
  const vuaVaoVungMua = [false, false]; // khong phai phien chuyen mua -> GiaVaoBar = Close = 102
  const kq = tinhCheDoMocVaoLenh({ close, open, high, low, atr, cloudTop, cbTop, cbBot, kijun, vuaVaoVungMua }, { slKieuMoc: false });
  // baseSL=Kijun=101.5 (hop le: >0 va <102). SLCauTruc tho=Min(101.5,102*0.98=99.96)=99.96 (day ra xa).
  // Max(99.96, 102*0.94=95.88)=99.96 (khong doi, van trong khoang toi da).
  ok("Stop-loss bi day RA XA hon boi SLToiThieuPct (99.96), khong con 101.5 qua gan", gan(kq.stopVaoBar[1], 99.96), kq.stopVaoBar[1]);
}

// ---- 3 muc TP dung chung ----
{
  const n = 1;
  const high = [1000]; // HHV(60)/HHV(252) se ra null (chua du du lieu) - chi con san % ap dung
  const giaVaoBar = [100];
  const cloudTop = [90];
  const cbTop = [95];
  const { tp1Vong, tp2Vong, tp3Vong } = tinhBaMocChotLoi({ high, giaVaoBar, cloudTop, cbTop });
  // NGan=max(null,105)=105; NGiua=max(max(95,90),110)=110; NXa=max(null,115)=115.
  ok("TP1 (gan nhat) = 105", gan(tp1Vong[0], 105));
  ok("TP2 (giua) = 110", gan(tp2Vong[0], 110));
  ok("TP3 (xa nhat) = 115", gan(tp3Vong[0], 115));
}

// ---- MUA LAI: du dieu kien -> tin hieu dung, SL rieng duoi ho tro ----
// (dung mang 2 phan tu [_, gia_tri] de co Ref(-1) hop le tai chi so 1, chi kiem tra ket qua o do)
{
  const kq = tinhMuaLai(
    { close: [0, 110], open: [0, 108], high: [0, 111], low: [0, 104], atr: [0, 3], totalScore: [0, 1.0], cloudTop: [0, 100], kijun: [0, 105], cbBot: [0, 90] },
    {}
  );
  ok("MUA LAI: dieu kien dat -> tin hieu dung", kq.muaLaiTinHieu[1] === true);
  ok("MUA LAI: co Stop-loss rieng < gia dong cua", kq.stopMuaLaiBar[1] < 110 && kq.stopMuaLaiBar[1] > 0);
}
{
  // Diem qua thap -> KHONG du dieu kien.
  const kq = tinhMuaLai(
    { close: [0, 110], open: [0, 108], high: [0, 111], low: [0, 104], atr: [0, 3], totalScore: [0, 0.1], cloudTop: [0, 100], kijun: [0, 105], cbBot: [0, 90] },
    {}
  );
  ok("MUA LAI: diem qua thap -> tin hieu SAI", kq.muaLaiTinHieu[1] === false);
}

// ---- MUA THEM SAU TP3: co them dieu kien gia KHONG duoc cao qua ho tro (tranh duoi gia) ----
{
  const nen = { close: [0, 110], open: [0, 108], high: [0, 111], low: [0, 104], atr: [0, 3], totalScore: [0, 1.5], cloudTop: [0, 100], kijun: [0, 105], cbBot: [0, 90] };
  const okKq = tinhMuaMoiSauTP3(nen, {});
  ok("MUA THEM: du dieu kien (gia cach ho tro ~4.7%, trong nguong 4% mac dinh?)", okKq.muaMoiTinHieu[1] === false, okKq.muaMoiTinHieu[1]);
  // 110 cach ho tro 105 la (110/105-1)*100 = 4.76% > 4% mac dinh -> phai SAI, xac nhan dung dieu
  // kien "duoi gia" hoat dong (khac voi Mua Lai KHONG co dieu kien nay).
  const ganHonKq = tinhMuaMoiSauTP3({ ...nen, close: [0, 107], open: [0, 106], high: [0, 108] }, {});
  ok("MUA THEM: gia gan ho tro hon (107, cach 1.9%) -> du dieu kien", ganHonKq.muaMoiTinHieu[1] === true, ganHonKq.muaMoiTinHieu[1]);
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
