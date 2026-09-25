// Test tay cho engine/loi/mayTrangThai.js - phan RUI RO NHAT cua toan bo engine. Moi kich ban la
// 1 chuoi nen ngan, tinh tay tung buoc theo dung thu tu AFL truoc khi doi chieu voi ket qua JS.
import { chayMayTrangThai } from "../loi/mayTrangThai.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

// Khung du lieu day du "toan mac dinh vo hai" (khong tin hieu nao xay ra) de tung kich ban chi
// can ghi de dung nhung o can thiet.
function khungRong(n) {
  return {
    close: new Array(n).fill(100),
    open: new Array(n).fill(100),
    high: new Array(n).fill(100),
    low: new Array(n).fill(100),
    atr: new Array(n).fill(5),
    totalScore: new Array(n).fill(2),
    buyTho: new Array(n).fill(false),
    sellTinHieu: new Array(n).fill(false),
    rsvniOk: new Array(n).fill(true),
    giaVaoBar: new Array(n).fill(0),
    stopVaoBar: new Array(n).fill(0),
    tp1Vong: new Array(n).fill(9999),
    tp2Vong: new Array(n).fill(9999),
    tp3Vong: new Array(n).fill(9999),
    stopMuaLaiBar: new Array(n).fill(0),
    muaLaiTinHieu: new Array(n).fill(false),
    stopMuaMoiBar: new Array(n).fill(0),
    muaMoiTinHieu: new Array(n).fill(false),
    dotKetThucBoLo: new Array(n).fill(false),
    muaMuonTinHieu: new Array(n).fill(false),
    stopMuaMuonBar: new Array(n).fill(0),
    muaThemGiuaChungTinHieu: new Array(n).fill(false),
    stopMuaThemGiuaChungBar: new Array(n).fill(0),
  };
}

// ---- A: Mua binh thuong -> giu -> Ban theo tin hieu diem (khong cham TP/SL) ----
{
  const d = khungRong(5);
  d.buyTho[1] = true;
  d.giaVaoBar[1] = 100;
  d.stopVaoBar[1] = 90;
  d.low.fill(95); // luon tren stop 90
  d.sellTinHieu[3] = true;
  d.close[3] = 105;
  const kq = chayMayTrangThai(d);
  ok("A: buy[1] = true (ngay vao lenh)", kq.buy[1] === true);
  ok("A: giuTrongVongLap 1,2 = 1 (dang giu)", kq.giuTrongVongLap[1] === 1 && kq.giuTrongVongLap[2] === 1);
  ok("A: gia vao = 100, stop vao = 90", kq.giaVaoTrongVongLap[1] === 100 && kq.stopVaoTrongVongLap[1] === 90);
  ok("A: ban dung phien 3, ly do = 1 (tin hieu)", kq.sell[3] === true && kq.lyDoBanBar[3] === 1);
  ok("A: het giu sau khi ban", kq.giuTrongVongLap[3] === 0 && kq.giuTrongVongLap[4] === 0);
}

// ---- B: Cham Stop-loss (SLChamLaCat mac dinh = Bat) -> cat ngay du diem con duong ----
{
  const d = khungRong(4);
  d.buyTho[1] = true;
  d.giaVaoBar[1] = 100;
  d.stopVaoBar[1] = 90;
  d.low[2] = 85; // thap hon Stop-loss
  d.totalScore[2] = 5; // diem VAN DUONG - van phai cat vi SLChamLaCat=true mac dinh
  const kq = chayMayTrangThai(d);
  ok("B: ban dung phien cham Stop-loss (2), ly do = 2", kq.sell[2] === true && kq.lyDoBanBar[2] === 2);
  ok("B: het giu ngay sau do", kq.giuTrongVongLap[2] === 0);
}

// ---- C: Theo doi da cham TP1/TP2 - dung KHOP dinh cua NGAY HOM QUA, khong dung dinh nen vao
// lenh (i-1 > vi tri vao) va khong dung dinh CHINH nen dang xet. ----
{
  const d = khungRong(6);
  d.buyTho[1] = true;
  d.giaVaoBar[1] = 100;
  d.stopVaoBar[1] = 50;
  d.tp1Vong[1] = 110;
  d.tp2Vong[1] = 120;
  d.low.fill(95); // khong bao gio cham stop
  d.high[1] = 200; // dinh nen VAO LENH - KHONG duoc tinh (dat rat cao de lo ngay neu co bug)
  d.high[2] = 105; // dinh nen dau tien SAU khi vao - chi duoc dung LAM hPrev tu phien 3 tro di
  d.high[3] = 115; // >= TP1(110), dung lam hPrev cho phien 4
  d.high[4] = 125; // >= TP2(120), dung lam hPrev cho phien 5
  const kq = chayMayTrangThai(d);
  ok("C: phien 2 (ngay sau vao lenh) hPrev=0 -> chua cham TP nao du dinh nen vao la 200", kq.daTP1Vong[2] === 0);
  ok("C: phien 3 dung dinh phien 2 (105) lam hPrev -> chua du 110 -> chua cham TP1", kq.daTP1Vong[3] === 0);
  ok("C: phien 4 dung dinh phien 3 (115) lam hPrev -> cham TP1", kq.daTP1Vong[4] === 1);
  ok("C: phien 4 chua cham TP2 (115 < 120)", kq.daTP2Vong[4] === 0);
  ok("C: phien 5 dung dinh phien 4 (125) lam hPrev -> cham ca TP1 va TP2", kq.daTP1Vong[5] === 1 && kq.daTP2Vong[5] === 1);
}

// ---- D: Bao ve lai - "Hoa von sau TP2": sau khi cham TP2, SL noi bo doi ve dung gia mua ----
{
  const d = khungRong(6);
  d.buyTho[1] = true;
  d.giaVaoBar[1] = 100;
  d.stopVaoBar[1] = 80; // SL that xa, khong dinh lien quan toi kich ban nay
  d.tp1Vong[1] = 110;
  d.tp2Vong[1] = 120;
  d.low.fill(105); // mac dinh an toan, se ghi de rieng phien 5
  d.high[2] = 105;
  d.high[3] = 125; // hPrev cho phien 4: cham ca TP1 va TP2 cung luc
  d.open[5] = 98;
  d.low[5] = 95; // duoi muc bao ve lai (100) nhung van tren SL that (80)
  const kq = chayMayTrangThai(d, {});
  const ketQuaD = chayMayTrangThai({ ...d, thamSo: { bvHoaVon: true } });
  ok("D: phien 4 da cham TP2 -> kich hoat bao ve lai", ketQuaD.daTP2Vong[4] === 1);
  ok("D: phien 5 cham muc bao ve lai (SL that 80 KHONG cham) -> ban, ly do = 3", ketQuaD.sell[5] === true && ketQuaD.lyDoBanBar[5] === 3);
  ok("D: gia ban bao ve = min(gia mo cua 98, muc bao ve 100) = 98", ketQuaD.giaBanBaoVe[5] === 98);
  ok("D (doi chung, KHONG bat bao ve lai): phien 5 khong ban vi SL that (80) khong cham", kq.sell[5] !== true);
}

// ---- E: Mua lai sau khi ban khong lo, trong han phien, gia khong duoi qua muc cho phep ----
{
  const d = khungRong(6);
  d.buyTho[1] = true;
  d.giaVaoBar[1] = 100;
  d.stopVaoBar[1] = 90;
  d.tp1Vong[1] = 500;
  d.tp2Vong[1] = 510;
  d.tp3Vong[1] = 520;
  d.low.fill(95);
  d.sellTinHieu[2] = true;
  d.close[2] = 105; // ban co lai (105 >= 100)
  d.muaLaiTinHieu[3] = true;
  d.close[3] = 104; // <= gia ban truoc (105) -> dung dieu kien "khong duoi gia" mac dinh
  d.stopMuaLaiBar[3] = 95;
  const kq = chayMayTrangThai(d);
  ok("E: ban phien 2 co lai", kq.sell[2] === true);
  ok("E: mua lai phien 3 (loai vao lenh = 2)", kq.buy[3] === true && kq.loaiVaoLenh[3] === 2);
  ok("E: gia vao/SL cua lenh mua lai dung nhu du kien", kq.giaVaoTrongVongLap[3] === 104 && kq.stopVaoTrongVongLap[3] === 95);
}

// ---- E2: Gioi han so lan Mua lai lien tiep (soLanMuaLaiToiDa) ----
{
  const d = khungRong(8);
  d.buyTho[1] = true;
  d.giaVaoBar[1] = 100;
  d.stopVaoBar[1] = 90;
  d.tp1Vong[1] = 500;
  d.tp2Vong[1] = 510;
  d.tp3Vong[1] = 520;
  d.low.fill(95);
  d.sellTinHieu[2] = true;
  d.close[2] = 105;
  d.muaLaiTinHieu[3] = true;
  d.close[3] = 104;
  d.stopMuaLaiBar[3] = 95;
  d.sellTinHieu[4] = true;
  d.close[4] = 108;
  d.muaLaiTinHieu[5] = true;
  d.close[5] = 107;
  d.stopMuaLaiBar[5] = 100;
  const kq = chayMayTrangThai(d, {});
  const ketQuaCap1 = chayMayTrangThai({ ...d, thamSo: { soLanMuaLaiToiDa: 1 } });
  ok("E2 (mac dinh toi da 2): lan mua lai thu 2 (phien 5) van duoc phep", kq.buy[5] === true && kq.loaiVaoLenh[5] === 2);
  ok("E2 (gioi han con 1): lan mua lai thu 2 (phien 5) BI CHAN", ketQuaCap1.giuTrongVongLap[5] === 0);
}

// ---- F: Mua them sau khi cham du TP3 (vong 2), co Stop-loss rieng ----
{
  const d = khungRong(6);
  d.buyTho[1] = true;
  d.giaVaoBar[1] = 100;
  d.stopVaoBar[1] = 50;
  d.tp1Vong[1] = 105;
  d.tp2Vong[1] = 108;
  d.tp3Vong[1] = 110;
  d.low.fill(95);
  d.high[2] = 115; // hPrev cho phien 3 -> cham ca TP1/TP2/TP3 cung luc
  d.muaMoiTinHieu[3] = true;
  d.close[3] = 107;
  d.stopMuaMoiBar[3] = 100;
  d.low[4] = 102; // tren Stop-loss rieng (100) -> chua cat
  d.low[5] = 90; // duoi Stop-loss rieng -> cat lenh mua them
  const kq = chayMayTrangThai(d);
  ok("F: phien 3 cham du TP3", kq.daTP3Vong[3] === 1);
  ok("F: mua them kich hoat dung phien 3", kq.mua2SuKien[3] === true && kq.mua2Giu[3] === true);
  ok("F: gia mua them = gia dong cua (107), SL rieng = 100", kq.mua2Gia[3] === 107 && kq.mua2Stop[3] === 100);
  ok("F: phien 4 van giu lenh mua them", kq.mua2Giu[4] === true);
  ok("F: phien 5 cham Stop-loss rieng -> cat (Mua2Cat=1), het giu", kq.mua2Cat[5] === 1 && kq.mua2Giu[5] === false);
}

// ---- G: Lenh mua them DONG THEO khi lenh goc bi Ban (Mua2Cat = 2), khong phai tu cham SL rieng ----
{
  const d = khungRong(6);
  d.buyTho[1] = true;
  d.giaVaoBar[1] = 100;
  d.stopVaoBar[1] = 50;
  d.tp1Vong[1] = 105;
  d.tp2Vong[1] = 108;
  d.tp3Vong[1] = 110;
  d.low.fill(95);
  d.high[2] = 115;
  d.muaMoiTinHieu[3] = true;
  d.close[3] = 107;
  d.stopMuaMoiBar[3] = 90; // xa, se KHONG bi cat rieng o phien 4
  d.low[4] = 92; // tren Stop-loss rieng (90) -> lenh mua them KHONG tu cat
  d.sellTinHieu[4] = true; // nhung lenh GOC nhan tin hieu Ban
  const kq = chayMayTrangThai(d);
  ok("G: lenh goc ban dung phien 4", kq.sell[4] === true);
  ok("G: lenh mua them dong THEO lenh goc (Mua2Cat=2), khong phai tu cham SL rieng", kq.mua2Cat[4] === 2 && kq.mua2Giu[4] === false);
}

// ---- H: MUA MUON - kich hoat dung han, bi chan lap lai cung 1 lan bo lo, reset khi co lan bo lo MOI ----
{
  const d = khungRong(10);
  d.low.fill(95);
  d.dotKetThucBoLo[2] = true; // 1 dot tren nguong bo lo, ket thuc phien 2
  d.muaMuonTinHieu[4] = true;
  d.close[4] = 100;
  d.stopMuaMuonBar[4] = 90;
  d.low[5] = 85; // duoi Stop-loss cua lenh Mua muon -> cat ngay
  d.muaMuonTinHieu[6] = true; // thu bat lai NGAY trong cung vung bo lo do -> phai bi chan
  d.close[6] = 101;
  d.stopMuaMuonBar[6] = 91;
  d.dotKetThucBoLo[7] = true; // 1 lan bo lo MOI hoan toan -> reset co chan
  d.muaMuonTinHieu[8] = true;
  d.close[8] = 105;
  d.stopMuaMuonBar[8] = 95;
  const kq = chayMayTrangThai(d);
  ok("H: Mua muon kich hoat dung phien 4 (loai vao lenh = 3)", kq.buy[4] === true && kq.loaiVaoLenh[4] === 3);
  ok("H: gia vao/SL dung nhu du kien", kq.giaVaoTrongVongLap[4] === 100 && kq.stopVaoTrongVongLap[4] === 90);
  ok("H: cham SL rieng phien 5 -> ban", kq.sell[5] === true && kq.giuTrongVongLap[5] === 0);
  ok("H: thu bat lai cung 1 lan bo lo (phien 6) -> BI CHAN, khong mua", kq.buy[6] !== true && kq.giuTrongVongLap[6] === 0);
  ok("H: co lan bo lo MOI (phien 7) roi bat lai (phien 8) -> DUOC PHEP", kq.buy[8] === true && kq.loaiVaoLenh[8] === 3);
}

// ---- I: MUA THEM GIUA CHUNG - mo TRUOC khi cham TP3, co Stop-loss rieng doc lap voi vong 2 ----
{
  const d = khungRong(6);
  d.buyTho[1] = true;
  d.giaVaoBar[1] = 100;
  d.stopVaoBar[1] = 50;
  d.tp1Vong[1] = 200;
  d.tp2Vong[1] = 210;
  d.tp3Vong[1] = 220; // rat cao - KHONG cham TP3 trong suot kich ban nay
  d.low.fill(95);
  d.muaThemGiuaChungTinHieu[3] = true;
  d.close[3] = 107;
  d.stopMuaThemGiuaChungBar[3] = 100;
  d.low[4] = 102; // tren Stop-loss rieng (100) -> chua cat
  d.low[5] = 90; // duoi Stop-loss rieng -> cat lenh mua giua chung
  const kq = chayMayTrangThai(d);
  ok("I: chua tung cham TP3 trong suot kich ban", kq.daTP3Vong[3] === 0 && kq.daTP3Vong[5] === 0);
  ok("I: mua giua chung kich hoat dung phien 3", kq.muaGiuaSuKien[3] === true && kq.muaGiuaGiu[3] === true);
  ok("I: gia mua = gia dong cua (107), SL rieng = 100", kq.muaGiuaGia[3] === 107 && kq.muaGiuaStop[3] === 100);
  ok("I: phien 4 van giu", kq.muaGiuaGiu[4] === true);
  ok("I: phien 5 cham Stop-loss rieng -> cat (Cat=1), het giu", kq.muaGiuaCat[5] === 1 && kq.muaGiuaGiu[5] === false);
}

// ---- J: MUA THEM GIUA CHUNG dong THEO lenh goc khi lenh goc bi Ban (doc lap voi vong 2) ----
{
  const d = khungRong(6);
  d.buyTho[1] = true;
  d.giaVaoBar[1] = 100;
  d.stopVaoBar[1] = 50;
  d.tp1Vong[1] = 200;
  d.tp2Vong[1] = 210;
  d.tp3Vong[1] = 220;
  d.low.fill(95);
  d.muaThemGiuaChungTinHieu[3] = true;
  d.close[3] = 107;
  d.stopMuaThemGiuaChungBar[3] = 90; // xa, se KHONG tu cat o phien 4
  d.low[4] = 92; // tren Stop-loss rieng -> khong tu cat
  d.sellTinHieu[4] = true; // nhung lenh GOC nhan tin hieu Ban
  const kq = chayMayTrangThai(d);
  ok("J: lenh goc ban dung phien 4", kq.sell[4] === true);
  ok("J: mua giua chung dong THEO lenh goc (Cat=2), khong phai tu cham SL rieng", kq.muaGiuaCat[4] === 2 && kq.muaGiuaGiu[4] === false);
}

// ---- K: Mua Giua Chung (mo TRUOC TP3) VAN CON GIU khi lenh goc cham du TP3 va vong 2 mo THEM -
// xac nhan co the giu DONG THOI ca 3 vi the (goc + giua chung + vong 2). ----
{
  const d = khungRong(7);
  d.buyTho[1] = true;
  d.giaVaoBar[1] = 100;
  d.stopVaoBar[1] = 50;
  d.tp1Vong[1] = 105;
  d.tp2Vong[1] = 108;
  d.tp3Vong[1] = 110;
  d.low.fill(95);
  d.muaThemGiuaChungTinHieu[2] = true; // mo TRUOC khi TP3 bi cham (daTP3Vong[2]=0 luc nay)
  d.close[2] = 102;
  d.stopMuaThemGiuaChungBar[2] = 90;
  d.high[2] = 115; // hPrev cho phien 3 -> cham du ca TP1/TP2/TP3 dung phien 3
  d.muaMoiTinHieu[3] = true; // vong 2 (Mua them sau TP3) mo dung luc TP3 vua cham
  d.close[3] = 107;
  d.stopMuaMoiBar[3] = 100;
  const kq = chayMayTrangThai(d);
  ok("K: mua giua chung mo dung phien 2 (truoc khi cham TP3)", kq.muaGiuaSuKien[2] === true && kq.daTP3Vong[2] === 0);
  ok("K: phien 3 TP3 vua cham, vong 2 (mua them sau TP3) mo them", kq.daTP3Vong[3] === 1 && kq.mua2SuKien[3] === true);
  ok("K: mua giua chung VAN CON GIU dong thoi voi vong 2 tai phien 3 (3 vi the cung luc)", kq.muaGiuaGiu[3] === true && kq.mua2Giu[3] === true);
}

// ---- L: Mua Giua Chung BI CHAN neu da cham du TP3 (chi mo duoc TRUOC TP3, khac vong 2) ----
{
  const d = khungRong(6);
  d.buyTho[1] = true;
  d.giaVaoBar[1] = 100;
  d.stopVaoBar[1] = 50;
  d.tp1Vong[1] = 105;
  d.tp2Vong[1] = 108;
  d.tp3Vong[1] = 110;
  d.low.fill(95);
  d.high[2] = 115; // hPrev cho phien 3 -> cham du TP3 dung phien 3
  d.muaThemGiuaChungTinHieu[4] = true; // thu mo SAU KHI da cham du TP3 -> phai bi chan
  d.close[4] = 107;
  d.stopMuaThemGiuaChungBar[4] = 95;
  const kq = chayMayTrangThai(d);
  ok("L: da cham du TP3 truoc phien 4", kq.daTP3Vong[4] === 1);
  ok("L: mua giua chung KHONG duoc mo vi da qua TP3", kq.muaGiuaGiu[4] !== true && kq.muaGiuaSuKien[4] !== true);
}

// ================= KET THUC LENH O TP3 + THOAT KIJUN SAU TP2 (2026-09-25) =================
// Khung: vao lenh phien 1 gia 100, SL 90, TP1/TP2/TP3 = 110/120/130.
function khungTP(n) {
  const d = khungRong(n);
  d.buyTho[1] = true;
  d.giaVaoBar[1] = 100;
  d.stopVaoBar[1] = 90;
  d.tp1Vong[1] = 110;
  d.tp2Vong[1] = 120;
  d.tp3Vong[1] = 130;
  d.low.fill(105); // tren SL 90 va tren gia vao
  d.high.fill(108); // duoi TP1 tru khi ghi de
  return d;
}

// ---- M: Cham TP3 -> DONG LENH (ly do 5) khi ketThucTaiTP3, khong dong khi tat ----
{
  const d = khungTP(6);
  d.high[3] = 131; // cham TP3 ngay phien 3
  const bat = chayMayTrangThai({ ...d, thamSo: { ketThucTaiTP3: true } });
  const tat = chayMayTrangThai(d);
  ok("M: bat -> ban dung phien 3, ly do = 5 (chot du TP3)", bat.sell[3] === true && bat.lyDoBanBar[3] === 5);
  ok("M: bat -> het giu tu phien 3", bat.giuTrongVongLap[2] === 1 && bat.giuTrongVongLap[3] === 0 && bat.giuTrongVongLap[4] === 0);
  ok("M: tat (mac dinh) -> van giu sau khi cham TP3 (hanh vi cu)", tat.sell[3] !== true && tat.giuTrongVongLap[3] === 1 && tat.giuTrongVongLap[5] === 1);
}

// ---- M2: Uu tien - cung nen vua cham stop vua cham TP3 -> cham stop truoc (ly do 2) ----
{
  const d = khungTP(5);
  d.high[3] = 131;
  d.low[3] = 89; // cham stop 90
  const kq = chayMayTrangThai({ ...d, thamSo: { ketThucTaiTP3: true } });
  ok("M2: vua stop vua TP3 cung nen -> ly do = 2 (stop truoc)", kq.sell[3] === true && kq.lyDoBanBar[3] === 2);
}

// ---- M3: Sau khi dong o TP3, co the vao lai binh thuong (Buy thuong moi) - va vong 2 (mua moi sau TP3) khong mo ----
{
  const d = khungTP(9);
  d.high[3] = 131;
  d.muaMoiTinHieu.fill(true); // neu con giu lenh thi vong 2 co the mo - nhung lenh da dong o TP3
  d.stopMuaMoiBar.fill(95);
  d.buyTho[6] = true; // tin hieu MUA moi sau do
  d.giaVaoBar[6] = 112;
  d.stopVaoBar[6] = 104;
  d.tp1Vong[6] = 120;
  d.tp2Vong[6] = 130;
  d.tp3Vong[6] = 140;
  const kq = chayMayTrangThai({ ...d, thamSo: { ketThucTaiTP3: true } });
  ok("M3: dong o TP3 phien 3 roi khong giu phien 4-5", kq.giuTrongVongLap[3] === 0 && kq.giuTrongVongLap[4] === 0 && kq.giuTrongVongLap[5] === 0);
  ok("M3: vong 2 (mua moi sau TP3) KHONG bao gio mo", kq.mua2SuKien.every((v) => v !== true) && kq.mua2Giu.every((v) => v !== true));
  ok("M3: vao lenh moi phien 6 (Buy thuong) gia 112", kq.buy[6] === true && kq.giaVaoLuc[6] === 112 && kq.loaiVaoLenh[6] === 1);
}

// ---- N: Thoat Kijun sau TP2: sau khi TP2 da ghi nhan (phien truoc), dong cua < Kijun -> ban (ly do 4) ----
{
  const d = khungTP(8);
  d.high[2] = 121; // cham TP2 phien 2 -> DaTP2Vong[3] = 1 (dung dinh phien truoc)
  d.kijun = new Array(8).fill(104);
  d.close.fill(107);
  d.close[4] = 103; // dong cua duoi Kijun 104 phien 4
  const kq = chayMayTrangThai({ ...d, thamSo: { thoatKijunSauTP2: true } });
  ok("N: phien 3 da ghi nhan TP2 (dong cua 107 > Kijun 104 nen chua thoat)", kq.daTP2Vong[3] === 1 && kq.sell[3] !== true);
  ok("N: phien 4 dong cua 103 < Kijun 104 -> ban, ly do = 4", kq.sell[4] === true && kq.lyDoBanBar[4] === 4);
  const tat = chayMayTrangThai({ ...d, thamSo: {} });
  ok("N (doi chung, tat): khong thoat theo Kijun", tat.sell[4] !== true);
}

// ---- N2: Chua cham TP2 thi dong cua duoi Kijun KHONG kich hoat thoat ----
{
  const d = khungTP(6);
  d.kijun = new Array(6).fill(104);
  d.close.fill(107);
  d.close[3] = 103;
  const kq = chayMayTrangThai({ ...d, thamSo: { thoatKijunSauTP2: true } });
  ok("N2: chua tung cham TP2 -> khong thoat theo Kijun", kq.sell[3] !== true && kq.giuTrongVongLap[3] === 1);
}

// ---- N3: Uu tien ly do - tin hieu diem (1) > Kijun (4) > bao ve hoa von (3) ----
{
  const d = khungTP(8);
  d.high[2] = 121; // TP2 ghi nhan tu phien 3
  d.kijun = new Array(8).fill(104);
  d.close.fill(107);
  d.close[4] = 103; // duoi Kijun
  d.low[4] = 99; // cham muc bao ve hoa von (gia vao 100)? 99 <= 100 -> cham bao ve; SL 90 khong cham
  d.open[4] = 106;
  let kq = chayMayTrangThai({ ...d, thamSo: { thoatKijunSauTP2: true, bvHoaVon: true } });
  ok("N3: Kijun + bao ve cung nen -> ly do = 4 (Kijun truoc bao ve), gia ban = dong cua (khong phai muc bao ve)", kq.lyDoBanBar[4] === 4 && kq.giaBanBaoVe[4] === 0);
  d.sellTinHieu[4] = true;
  kq = chayMayTrangThai({ ...d, thamSo: { thoatKijunSauTP2: true, bvHoaVon: true } });
  ok("N3: them tin hieu diem -> ly do = 1 (tin hieu truoc Kijun)", kq.lyDoBanBar[4] === 1);
}

// ---- P: Ban khi cham TP3 la co LAI -> cho phep Mua lai (banGanNhatCoLai) nhu cac lan ban co lai khac ----
{
  const d = khungTP(10);
  d.high[3] = 131;
  d.close.fill(115);
  d.muaLaiTinHieu[5] = true;
  d.stopMuaLaiBar[5] = 108;
  d.close[5] = 125; // <= gia ban (TP3 130 vi open 100 < 130) => duoc mua lai
  const kq = chayMayTrangThai({ ...d, thamSo: { ketThucTaiTP3: true } });
  ok("P: sau chot TP3 co lai -> mua lai phien 5 (LoaiVaoLenh = 2)", kq.buy[5] === true && kq.loaiVaoLenh[5] === 2);
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
