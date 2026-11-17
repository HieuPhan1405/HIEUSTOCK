// VUNG CUNG CAU (Hieu 18/11/2026, tu video "vung cung cau" cua VT Markets) - chi la cong cu ve THAM KHAO, chua kiem dinh loi the.
// Quy tac theo video (vung CAU; vung CUNG lam nguoc lai):
//   1) Nen goc = nen GIAM cuoi cung ngay truoc mot nhip TANG manh, dut khoat ("lui mot nen"). Vung = tu diem cao nhat toi diem thap nhat cua nen goc.
//   2) Nhip tang phai MANH (>= heSoXung x ATR14 trong vai nen) va PHA CAU TRUC: dong cua vuot dinh pivot gan nhat truoc nen goc. Khong pha cau truc -> khong phai vung.
//   3) FVG (khoang trong gia - 3 nen lien tiep, thap nen 3 > cao nen 1) nam sat nen goc = dau hieu tien lon (vung dep hon).
//   4) Cang cham nhieu vung cang YEU: lan 1 manh, 2-3 yeu, > soChamToiDa thi bo; dong cua xuyen thung vung thi het hieu luc.
// Tra ve [{ loai: "cau" | "cung", i (nen goc), ij (nen pha cau truc - luc vung xuat hien), top, bot, fvg, soCham, hetHan (chi so nen xuyen thung | null) }]
function atr14(h, l, c, len = 14) {
  const n = h.length;
  const kq = new Array(n).fill(0);
  let rma = 0;
  for (let i = 0; i < n; i++) {
    const tr = i === 0 ? h[0] - l[0] : Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]));
    rma = i < len ? (rma * i + tr) / (i + 1) : (rma * (len - 1) + tr) / len;
    kq[i] = rma;
  }
  return kq;
}

export function vungCungCau(o, h, l, c, { heSoXung = 2, soNenXung = 4, doManh = 3 } = {}) {
  const n = c.length;
  if (n < 30) return [];
  const atr = atr14(h, l, c);
  // pivot gan nhat DA XAC NHAN (doManh nen moi ben) tai moi chi so
  const dinhGan = new Array(n).fill(null);
  const dayGan = new Array(n).fill(null);
  let dH = null, dL = null;
  for (let i = 0; i < n; i++) {
    const p = i - doManh;
    if (p >= doManh) {
      let la = true, lb = true;
      for (let q = p - doManh; q <= p + doManh; q++) {
        if (h[q] > h[p]) la = false;
        if (l[q] < l[p]) lb = false;
      }
      if (la) dH = h[p];
      if (lb) dL = l[p];
    }
    dinhGan[i] = dH;
    dayGan[i] = dL;
  }
  const zones = [];
  const lamVung = (loai, i, j, top, bot, fvg) => {
    const z = { loai, i, ij: j, top, bot, fvg, soCham: 0, hetHan: null };
    let dangCham = false;
    for (let m = j + 1; m < n; m++) {
      if (loai === "cau") {
        if (c[m] < bot) { z.hetHan = m; break; }
        const cham = l[m] <= top;
        if (cham && !dangCham) z.soCham++;
        dangCham = cham;
      } else {
        if (c[m] > top) { z.hetHan = m; break; }
        const cham = h[m] >= bot;
        if (cham && !dangCham) z.soCham++;
        dangCham = cham;
      }
    }
    zones.push(z);
  };
  // VUNG CAU
  for (let i = 15; i < n - 2; i++) {
    if (!(c[i] < o[i]) || !(c[i + 1] > o[i + 1]) || !(atr[i] > 0) || dinhGan[i] == null) continue;
    let cao = -Infinity, j = -1;
    for (let k = i + 1; k <= Math.min(n - 1, i + soNenXung + 2); k++) {
      cao = Math.max(cao, h[k]);
      if (c[k] > dinhGan[i] && cao - l[i] >= heSoXung * atr[i]) { j = k; break; }
    }
    if (j < 0) continue;
    let fvg = false;
    for (let t = i + 1; t <= Math.min(j, n - 2); t++) if (l[t + 1] > h[t - 1]) { fvg = true; break; }
    lamVung("cau", i, j, h[i], l[i], fvg);
    i = j; // nhip tang nay da dung - nen goc ke tiep phai nam sau no
  }
  // VUNG CUNG
  for (let i = 15; i < n - 2; i++) {
    if (!(c[i] > o[i]) || !(c[i + 1] < o[i + 1]) || !(atr[i] > 0) || dayGan[i] == null) continue;
    let thap = Infinity, j = -1;
    for (let k = i + 1; k <= Math.min(n - 1, i + soNenXung + 2); k++) {
      thap = Math.min(thap, l[k]);
      if (c[k] < dayGan[i] && h[i] - thap >= heSoXung * atr[i]) { j = k; break; }
    }
    if (j < 0) continue;
    let fvg = false;
    for (let t = i + 1; t <= Math.min(j, n - 2); t++) if (h[t + 1] < l[t - 1]) { fvg = true; break; }
    lamVung("cung", i, j, h[i], l[i], fvg);
    i = j;
  }
  return zones;
}

// Chon vung de VE: con hieu luc, cham <= soChamToiDa lan, moi loai toi da `toiDa` vung gan day nhat.
export function chonVungDeVe(zones, { soChamToiDa = 3, toiDa = 3 } = {}) {
  const kq = [];
  for (const loai of ["cau", "cung"]) {
    kq.push(
      ...zones
        .filter((z) => z.loai === loai && z.hetHan == null && z.soCham <= soChamToiDa)
        .sort((a, b) => b.i - a.i)
        .slice(0, toiDa)
    );
  }
  return kq;
}
