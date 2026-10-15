// RSI PHAN KY (2026-10-16) - ham THUAN, dung chung cho bieu do web va nghien cuu (engine/dich-vu/nghienCuuPhanKyRSI.mjs).
// Phan ky TANG (canh dao chieu bat day): hai day gia lien tiep, day sau THAP HON day truoc nhung RSI day sau CAO HON RSI day truoc, va RSI o day truoc da o vung thap.
// Phan ky GIAM (canh dinh): doi xung. Day / dinh la pivot +-k nen (nen o giua la thap nhat / cao nhat trong 2k+1 nen), chi XAC NHAN sau k nen => tin hieu o nen i2+k, KHONG nhin truoc.
// nen: [{ h, l, c }] tang dan theo thoi gian; rsiArr: mang RSI cung do dai (null khi chua du nen).
// Tra ve [{ loai: "tang" | "giam", i1, i2, xacNhan, gia1, gia2, rsi1, rsi2 }].
export function phanKyRSI(nen, rsiArr, { k = 3, toiDa = 60, toiThieu = 5, rsiDay = 40, rsiDinh = 60, chenhRSI = 2, chenhGiaPct = 0.5 } = {}) {
  const n = nen.length;
  const kq = [];
  const laDay = (i) => {
    if (i < k || i + k >= n) return false;
    for (let j = i - k; j <= i + k; j++) if (j !== i && nen[j].l < nen[i].l) return false;
    for (let j = i - k; j < i; j++) if (nen[j].l === nen[i].l) return false; // bang nhau thi lay nen dau lam day
    return true;
  };
  const laDinh = (i) => {
    if (i < k || i + k >= n) return false;
    for (let j = i - k; j <= i + k; j++) if (j !== i && nen[j].h > nen[i].h) return false;
    for (let j = i - k; j < i; j++) if (nen[j].h === nen[i].h) return false;
    return true;
  };
  let dayTruoc = null;
  let dinhTruoc = null;
  for (let i = k; i + k < n; i++) {
    if (laDay(i) && rsiArr[i] != null) {
      const t = dayTruoc;
      if (t && i - t.i >= toiThieu && i - t.i <= toiDa && nen[i].l < nen[t.i].l * (1 - chenhGiaPct / 100) && rsiArr[i] >= rsiArr[t.i] + chenhRSI && rsiArr[t.i] <= rsiDay) {
        kq.push({ loai: "tang", i1: t.i, i2: i, xacNhan: i + k, gia1: nen[t.i].l, gia2: nen[i].l, rsi1: rsiArr[t.i], rsi2: rsiArr[i] });
      }
      dayTruoc = { i };
    }
    if (laDinh(i) && rsiArr[i] != null) {
      const t = dinhTruoc;
      if (t && i - t.i >= toiThieu && i - t.i <= toiDa && nen[i].h > nen[t.i].h * (1 + chenhGiaPct / 100) && rsiArr[i] <= rsiArr[t.i] - chenhRSI && rsiArr[t.i] >= rsiDinh) {
        kq.push({ loai: "giam", i1: t.i, i2: i, xacNhan: i + k, gia1: nen[t.i].h, gia2: nen[i].h, rsi1: rsiArr[t.i], rsi2: rsiArr[i] });
      }
      dinhTruoc = { i };
    }
  }
  return kq;
}

// Gop nen ngay thanh nen tuan (tuan ISO, thu hai la dau tuan): { t: ngay cuoi tuan, o, h, l, c, v }.
export function gopNenTuan(nenNgay) {
  const kq = [];
  let khoa = null;
  for (const b of nenNgay) {
    const d = new Date(b.t + "T00:00:00Z");
    const thu = (d.getUTCDay() + 6) % 7; // 0 = thu hai
    const dauTuan = new Date(d.getTime() - thu * 86400000).toISOString().slice(0, 10);
    if (dauTuan !== khoa) {
      kq.push({ t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v || 0 });
      khoa = dauTuan;
    } else {
      const w = kq[kq.length - 1];
      w.t = b.t;
      w.h = Math.max(w.h, b.h);
      w.l = Math.min(w.l, b.l);
      w.c = b.c;
      w.v += b.v || 0;
    }
  }
  return kq;
}
