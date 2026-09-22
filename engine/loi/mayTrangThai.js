// Port AFL dong 667-845: MAY TRANG THAI CHINH - giu lenh/thoat lenh/TP1-3 da cham/Bao ve lai/
// Mua lai/Mua them sau TP3. Day la phan RUI RO NHAT trong toan bo engine (nhieu dieu kien long
// nhau, thu tu if/else quyet dinh dung/sai) nen dich SAT TUNG DONG AFL nhat co the, KHONG toi uu
// hay "don gian hoa" logic - moi thay doi phai doi chieu lai voi file AFL goc.
//
// Phan biet 2 loai bien AFL (xem memory "AFL pitfalls"):
//  - Mang THAT (broadcast Var=0 truoc vong lap, gan Var[i]=... trong vong lap): giu nguyen la
//    mang trong ham nay (vd giuTrongVongLap, tp1VaoVong...).
//  - Bien VO HUONG THUAN (tinh lai moi lan lap, KHONG nho gia tri cu): khai bao BEN TRONG vong
//    lap moi lan (stopBaoVe, chamBaoVe, hPrev, stopGiaThucTe_vonglap, chamStopThuong,
//    giaBanLoop/giaVaoLoop/stopVaoLoop).
//  - Bien VO HUONG THAT SU BEN VUNG qua cac lan lap (khai bao 1 LAN truoc vong lap, KHONG reset
//    moi lan): banGanNhatViTri/banGanNhatCoLai/banGanNhatGia/soLanMuaLaiLienTiep - day la 4 bien
//    DUY NHAT thuc su "nho" qua tung nen, khac voi nhom dau.
export function chayMayTrangThai(dauVao) {
  const {
    close,
    open,
    high,
    low,
    atr,
    totalScore,
    buyTho, // "Buy" TRUOC vong lap (TurnedGreen + cac gate) - AFL dong 526.
    sellTinHieu,
    rsvniOk,
    giaVaoBar,
    stopVaoBar,
    tp1Vong,
    tp2Vong,
    tp3Vong,
    stopMuaLaiBar,
    muaLaiTinHieu,
    stopMuaMoiBar,
    muaMoiTinHieu,
  } = dauVao;
  const {
    slChamLaCat = true,
    bvHoaVon = false,
    bvRong = false,
    baoVeRongPct = 20,
    hanBoSungPhien = 5,
    entryTh = 1.25,
    hanMuaLaiPhien = 60,
    muaLaiCaoToiDaPct = 0,
    soLanMuaLaiToiDa = 2,
  } = dauVao.thamSo || {};

  const n = close.length;
  const A = () => new Array(n).fill(0);
  const giuTrongVongLap = A();
  const giaVaoTrongVongLap = A();
  const atrVaoTrongVongLap = A();
  const stopVaoTrongVongLap = A();
  const loaiVaoLenh = A(); // 0 = khong, 1 = Buy thuong, 2 = Mua lai
  const giaVaoLuc = A();
  const stopVaoLuc = A();
  const tp1VaoVong = A();
  const tp2VaoVong = A();
  const daTP1Vong = A();
  const daTP2Vong = A();
  const dinhSauVaoVong = A();
  const thamDoTrongVongLap = A();
  const viTriVaoTrongVongLap = A();
  const boSungSuKien = A();
  const tp3VaoVong = A();
  const daTP3Vong = A();
  const lyDoBanBar = A();
  const mua2Giu = new Array(n).fill(false);
  const mua2Gia = A();
  const mua2Stop = A();
  const mua2TP1 = A();
  const mua2TP2 = A();
  const mua2TP3 = A();
  const mua2Vi = A();
  const mua2SuKien = new Array(n).fill(false);
  const mua2Cat = A();
  const mua2DaTung = new Array(n).fill(false);
  const sell = new Array(n).fill(false);
  const giaBanBaoVe = A();
  const stopBaoVeMoiNen = A(); // gia tri stopBaoVe cua CHINH nen do (0 = khong bao ve/chua tinh)

  // 4 bien vo huong BEN VUNG qua ca vong lap (khong duoc reset moi nen) - xem chu thich dau file.
  let banGanNhatViTri = -999999;
  let banGanNhatCoLai = false;
  let banGanNhatGia = 0;
  let soLanMuaLaiLienTiep = 0;

  for (let i = 1; i < n; i++) {
    if (giuTrongVongLap[i - 1] === 1) {
      giaVaoTrongVongLap[i] = giaVaoTrongVongLap[i - 1];
      atrVaoTrongVongLap[i] = atrVaoTrongVongLap[i - 1];
      viTriVaoTrongVongLap[i] = viTriVaoTrongVongLap[i - 1];
      stopVaoTrongVongLap[i] = stopVaoTrongVongLap[i - 1];
      tp3VaoVong[i] = tp3VaoVong[i - 1];
      mua2DaTung[i] = mua2DaTung[i - 1];
      mua2Giu[i] = mua2Giu[i - 1];
      mua2Gia[i] = mua2Gia[i - 1];
      mua2Stop[i] = mua2Stop[i - 1];
      mua2TP1[i] = mua2TP1[i - 1];
      mua2TP2[i] = mua2TP2[i - 1];
      mua2TP3[i] = mua2TP3[i - 1];
      mua2Vi[i] = mua2Vi[i - 1];
      const stopGiaThucTe_vonglap = stopVaoTrongVongLap[i];

      tp1VaoVong[i] = tp1VaoVong[i - 1];
      tp2VaoVong[i] = tp2VaoVong[i - 1];
      let hPrev = 0;
      if (i - 1 > viTriVaoTrongVongLap[i]) hPrev = high[i - 1];
      dinhSauVaoVong[i] = Math.max(dinhSauVaoVong[i - 1], hPrev);
      daTP1Vong[i] = daTP1Vong[i - 1] === 1 || hPrev >= tp1VaoVong[i] ? 1 : 0;
      daTP2Vong[i] = daTP2Vong[i - 1] === 1 || hPrev >= tp2VaoVong[i] ? 1 : 0;
      daTP3Vong[i] = daTP3Vong[i - 1] === 1 || hPrev >= tp3VaoVong[i] ? 1 : 0;

      let stopBaoVe = 0;
      if (bvHoaVon && daTP2Vong[i] === 1) stopBaoVe = giaVaoTrongVongLap[i];
      if (bvRong && daTP1Vong[i] === 1) stopBaoVe = dinhSauVaoVong[i] * (1 - baoVeRongPct / 100);
      stopBaoVeMoiNen[i] = stopBaoVe;
      const chamBaoVe = stopBaoVe > 0 && low[i] <= stopBaoVe;

      // Cham Stop-loss: mac dinh (slChamLaCat=true) ban ngay khi gia thap nhat <= Stop-loss.
      const chamStopThuong = low[i] <= stopGiaThucTe_vonglap && (slChamLaCat || totalScore[i] < 0);

      if (sellTinHieu[i] === true || chamStopThuong || chamBaoVe) {
        sell[i] = true;
        lyDoBanBar[i] = chamStopThuong ? 2 : chamBaoVe && !sellTinHieu[i] ? 3 : 1;
        giuTrongVongLap[i] = 0;
        thamDoTrongVongLap[i] = 0;
        if (mua2Giu[i - 1] === true) {
          mua2Giu[i] = false;
          mua2Cat[i] = 2;
        }
        let giaBanLoop = close[i];
        if (chamBaoVe && !sellTinHieu[i] && !chamStopThuong) {
          giaBanLoop = Math.min(open[i], stopBaoVe);
          giaBanBaoVe[i] = giaBanLoop;
        }
        banGanNhatViTri = i;
        banGanNhatGia = giaBanLoop;
        banGanNhatCoLai = giaBanLoop >= giaVaoTrongVongLap[i];
      } else {
        sell[i] = false;
        giuTrongVongLap[i] = 1;

        // BO SUNG phan con lai (giai ngan 1 phan).
        if (
          thamDoTrongVongLap[i - 1] === 1 &&
          i - viTriVaoTrongVongLap[i] <= hanBoSungPhien &&
          rsvniOk[i] &&
          close[i] > giaVaoTrongVongLap[i] &&
          totalScore[i] >= entryTh
        ) {
          thamDoTrongVongLap[i] = 0;
          boSungSuKien[i] = 1;
        } else {
          thamDoTrongVongLap[i] = thamDoTrongVongLap[i - 1];
        }

        // MUA MOI SAU TP3 (vong 2).
        if (mua2Giu[i - 1] === true) {
          if (low[i] <= mua2Stop[i] && (slChamLaCat || totalScore[i] < 0)) {
            mua2Giu[i] = false;
            mua2Cat[i] = 1;
          }
        } else if (daTP3Vong[i] === 1 && mua2DaTung[i] === false && muaMoiTinHieu[i]) {
          mua2Giu[i] = true;
          mua2DaTung[i] = true;
          mua2SuKien[i] = true;
          mua2Gia[i] = close[i];
          mua2Stop[i] = stopMuaMoiBar[i];
          mua2TP1[i] = tp1Vong[i];
          mua2TP2[i] = tp2Vong[i];
          mua2TP3[i] = tp3Vong[i];
          mua2Vi[i] = i;
        }
      }
    } else if (
      buyTho[i] ||
      (muaLaiTinHieu[i] &&
        banGanNhatCoLai === true &&
        i - banGanNhatViTri <= hanMuaLaiPhien &&
        close[i] <= banGanNhatGia * (1 + muaLaiCaoToiDaPct / 100) &&
        soLanMuaLaiLienTiep < soLanMuaLaiToiDa)
    ) {
      let giaVaoLoop, stopVaoLoop;
      if (buyTho[i]) {
        giaVaoLoop = giaVaoBar[i];
        stopVaoLoop = stopVaoBar[i];
        loaiVaoLenh[i] = 1;
        soLanMuaLaiLienTiep = 0;
      } else {
        giaVaoLoop = close[i];
        stopVaoLoop = stopMuaLaiBar[i];
        loaiVaoLenh[i] = 2;
        soLanMuaLaiLienTiep = soLanMuaLaiLienTiep + 1;
      }
      giuTrongVongLap[i] = 1;
      giaVaoTrongVongLap[i] = giaVaoLoop;
      atrVaoTrongVongLap[i] = atr[i];
      stopVaoTrongVongLap[i] = stopVaoLoop;
      giaVaoLuc[i] = giaVaoLoop;
      stopVaoLuc[i] = stopVaoLoop;
      tp1VaoVong[i] = tp1Vong[i];
      tp2VaoVong[i] = tp2Vong[i];
      tp3VaoVong[i] = tp3Vong[i];
      dinhSauVaoVong[i] = giaVaoLoop;
      viTriVaoTrongVongLap[i] = i;
      thamDoTrongVongLap[i] = rsvniOk[i] ? 0 : 1;
    } else {
      giuTrongVongLap[i] = 0;
    }
  }

  // Buy "that" (danh dau dung ngay vao lenh) - AFL dong 844, tinh SAU vong lap.
  const buy = new Array(n).fill(false);
  for (let i = 0; i < n; i++) buy[i] = giuTrongVongLap[i] === 1 && giuTrongVongLap[i - 1] !== 1;
  // Sell = ExRem(Sell, Buy): bo cac tin hieu Sell "mo coi" khong co Buy truoc do trong cung 1
  // chuoi giu lenh - vi giuTrongVongLap/sell trong vong lap tren da tu nhat quan (Sell chi bao
  // gio xay ra ngay sau 1 chuoi giuTrongVongLap lien tuc bat dau bang dung 1 Buy), ExRem khong
  // thay doi gi them trong truong hop nay nen KHONG can port rieng.

  return {
    giuTrongVongLap,
    buy,
    sell,
    lyDoBanBar,
    giaVaoTrongVongLap,
    stopVaoTrongVongLap,
    tp1VaoVong,
    tp2VaoVong,
    tp3VaoVong,
    daTP1Vong,
    daTP2Vong,
    daTP3Vong,
    dinhSauVaoVong,
    viTriVaoTrongVongLap,
    thamDoTrongVongLap,
    boSungSuKien,
    loaiVaoLenh,
    giaVaoLuc,
    stopVaoLuc,
    giaBanBaoVe,
    mua2Giu,
    mua2Gia,
    mua2Stop,
    mua2TP1,
    mua2TP2,
    mua2TP3,
    mua2Vi,
    mua2SuKien,
    mua2Cat,
    mua2DaTung,
    stopBaoVeMoiNen,
  };
}
