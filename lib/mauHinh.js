// NHAN DIEN MAU HINH GIA NOI TIENG (ham THUAN, khong import "@/" - dung chung cho engine real-time (cot bo loc), trang Bieu do (tu ve len hinh) va test tay: engine/test/mauHinh.test.mjs).
// Nhan qua: dinh / day = pivot `np` nen moi ben, chi dung SAU khi xac nhan; mau hinh "hoan thanh" tai nen DONG CUA pha vo duong co (neckline / bien) dau tien.
// Logic va nguong khop engine/dich-vu/backtestMauHinh.mjs (ty le thanh cong lich su o THONG_KE_MAU_HINH ben duoi lay tu backtest do - chi tham khao, khong phai du bao).
// Dau vao: bars = [{ t, o, h, l, c, v }] tang dan thoi gian (nen ngay hoac nen tuan). Dau ra: danh sach mau hinh da pha vo, moi cai co hinh hoc de ve:
//   { khoa, ten, huong (+1 tang / -1 giam), i (nen pha vo), cach (so nen tu nen pha vo den nen cuoi), t, gia, mucTieu, catLo,
//     diem: [{ i, gia, nhan }], duong: [{ i1, g1, i2, g2, loai }] }   (loai: "co" = duong co / bien chinh, "phu" = duong phu, "tren" / "duoi" = canh tam giac / nem)

export const MAU_HINH = [
  { khoa: "day_doi", ten: "Đáy đôi (W)", huong: 1 },
  { khoa: "dinh_doi", ten: "Đỉnh đôi (M)", huong: -1 },
  { khoa: "vai_dau_vai_nguoc", ten: "Vai-đầu-vai ngược", huong: 1 },
  { khoa: "vai_dau_vai", ten: "Vai-đầu-vai", huong: -1 },
  { khoa: "tam_giac_tang", ten: "Tam giác tăng", huong: 1 },
  { khoa: "tam_giac_giam", ten: "Tam giác giảm", huong: -1 },
  { khoa: "tam_giac_can_len", ten: "Tam giác cân – phá lên", huong: 1 },
  { khoa: "tam_giac_can_xuong", ten: "Tam giác cân – phá xuống", huong: -1 },
  { khoa: "nem_giam", ten: "Nêm giảm – phá lên", huong: 1 },
  { khoa: "nem_tang", ten: "Nêm tăng – phá xuống", huong: -1 },
  { khoa: "co_tang", ten: "Cờ tăng", huong: 1 },
  { khoa: "coc_tay_cam", ten: "Cốc và tay cầm", huong: 1 },
  { khoa: "hop_len", ten: "Hộp đi ngang – phá lên", huong: 1 },
  { khoa: "hop_xuong", ten: "Hộp đi ngang – phá xuống", huong: -1 },
];
export const KHOA_MAU_HINH = MAU_HINH.map((m) => m.khoa);
const TEN = Object.fromEntries(MAU_HINH.map((m) => [m.khoa, m.ten]));

// Thong ke lich su (backtest 11 nam ~390 ma nen ngay, xem engine/dich-vu/backtestMauHinh.mjs): tc = % cham muc tieu truoc cat lo trong 60 nen, nn = % cua duong ngau nhien cung cat lo / muc tieu,
// r10 = lai TB 10 phien sau pha vo THEO HUONG mau hinh (%, mau hinh GIAM: duong = gia giam), thi truong chung ~ +0,71% / 10 phien. Chi mang tinh tham khao.
export const THONG_KE_MAU_HINH = {
  day_doi: { n: 401, tc: 57.6, nn: 60.1, r10: 1.19 },
  dinh_doi: { n: 407, tc: 56.0, nn: 60.0, r10: 1.74 },
  vai_dau_vai_nguoc: { n: 211, tc: 41.7, nn: 45.3, r10: 0.1 },
  vai_dau_vai: { n: 232, tc: 30.6, nn: 43.7, r10: 1.06 },
  tam_giac_tang: { n: 644, tc: 44.7, nn: 45.1, r10: 0.36 },
  tam_giac_giam: { n: 453, tc: 39.7, nn: 43.7, r10: 1.87 },
  tam_giac_can_len: { n: 792, tc: 22.7, nn: 21.1, r10: 0.93 },
  tam_giac_can_xuong: { n: 783, tc: 15.3, nn: 21.3, r10: 0.51 },
  nem_giam: { n: 1107, tc: 30.1, nn: 31.7, r10: 1.15 },
  nem_tang: { n: 1440, tc: 14.9, nn: 24.2, r10: 0.03 },
  co_tang: { n: 2503, tc: 33.7, nn: 31.6, r10: 0.58 },
  coc_tay_cam: { n: 318, tc: 32.1, nn: 35.2, r10: 0.8 },
  hop_len: { n: 590, tc: 57.1, nn: 59.7, r10: 0.61 },
  hop_xuong: { n: 520, tc: 56.2, nn: 58.6, r10: 0.7 },
};

// Cau hinh theo khung: "ngay" (mac dinh) va "tuan" (nguong khoang cach nen thu nho ~ 0,4-0,5 lan).
const CAU_HINH = {
  ngay: { np: 4, distMin: 10, distMax: 60, tuoiToiDa: 40, tamGiacCuaSo: 50, tamGiacTuoi: 25, tamGiacCachMin: 6, coCot: 15, coMin: 5, coMax: 20, coBuoc: 5, cupMin: 30, cupMax: 130, cupTay: [5, 25], cupTuoi: [40, 140], hopNen: 25, trung: 15, vaiToiDa: 90 },
  tuan: { np: 3, distMin: 6, distMax: 40, tuoiToiDa: 24, tamGiacCuaSo: 30, tamGiacTuoi: 12, tamGiacCachMin: 4, coCot: 8, coMin: 3, coMax: 10, coBuoc: 2, cupMin: 15, cupMax: 65, cupTay: [3, 12], cupTuoi: [20, 70], hopNen: 12, trung: 8, vaiToiDa: 45 },
};

// nhanDienMauHinh(bars, { khung: "ngay" | "tuan", tuoiToiDa: chi giu mau hinh pha vo trong N nen cuoi (mac dinh het) })
export function nhanDienMauHinh(bars, { khung = "ngay", tuoiToiDa = null } = {}) {
  const n = bars?.length ?? 0;
  const C = CAU_HINH[khung] ?? CAU_HINH.ngay;
  if (n < C.np * 2 + 20) return [];
  const h = bars.map((b) => b.h), l = bars.map((b) => b.l), c = bars.map((b) => b.c);
  const NP = C.np;
  // pivot (xac nhan sau NP nen)
  const pH = [], pL = [];
  for (let p = NP; p < n - NP; p++) {
    let hh = true, ll = true;
    for (let k = 1; k <= NP; k++) {
      if (!(h[p] > h[p - k] && h[p] >= h[p + k])) hh = false;
      if (!(l[p] < l[p - k] && l[p] <= l[p + k])) ll = false;
    }
    if (hh) pH.push({ p, v: h[p], conf: p + NP });
    if (ll) pL.push({ p, v: l[p], conf: p + NP });
  }
  const maxH = (a, b) => { let m = 0; for (let i = a; i <= b; i++) if (h[i] > m) m = h[i]; return m; };
  const minL = (a, b) => { let m = Infinity; for (let i = a; i <= b; i++) if (l[i] < m) m = l[i]; return m; };
  const idxMaxH = (a, b) => { let k = a; for (let i = a; i <= b; i++) if (h[i] > h[k]) k = i; return k; };
  const idxMinL = (a, b) => { let k = a; for (let i = a; i <= b; i++) if (l[i] < l[k]) k = i; return k; };
  const ra = [];
  const ult = {};
  const nhan = (khoa, t, catLo, mucTieu, diem, duong) => {
    const huong = MAU_HINH.find((m) => m.khoa === khoa).huong;
    if (ult[khoa] != null && t - ult[khoa] < C.trung) return;
    const E = c[t];
    if (!(catLo > 0) || !(mucTieu > 0)) return;
    const rs = huong > 0 ? (E - catLo) / E : (catLo - E) / E;
    const rg = huong > 0 ? (mucTieu - E) / E : (E - mucTieu) / E;
    if (rs <= 0.005 || rg <= 0.005 || rs > 0.25) return;
    ult[khoa] = t;
    ra.push({ khoa, ten: TEN[khoa], huong, i: t, cach: n - 1 - t, t: bars[t].t, gia: E, mucTieu, catLo, diem, duong });
  };
  let ih = 0, il = 0;
  const HH = [], LL = [];
  for (let t = Math.max(60 / (khung === "tuan" ? 2 : 1), 25); t < n; t++) {
    while (ih < pH.length && pH[ih].conf <= t) HH.push(pH[ih++]);
    while (il < pL.length && pL[il].conf <= t) LL.push(pL[il++]);
    const nH = HH.length, nL = LL.length;
    if (nH < 3 || nL < 3) continue;
    const H1 = HH[nH - 1], H2 = HH[nH - 2], H3 = HH[nH - 3];
    const L1 = LL[nL - 1], L2 = LL[nL - 2], L3 = LL[nL - 3];

    // Day doi (W)
    {
      const a = L2, b = L1, dist = b.p - a.p;
      if (dist >= C.distMin && dist <= C.distMax && Math.abs(a.v - b.v) / a.v <= 0.03 && t - b.p <= C.tuoiToiDa) {
        const N = maxH(a.p, b.p), low = Math.min(a.v, b.v), ip = idxMaxH(a.p, b.p);
        if (N >= 1.08 * Math.max(a.v, b.v) && c[t] > N && c[t - 1] <= N && maxH(b.p, t - 1) <= N * 1.0001)
          nhan("day_doi", t, low * 0.99, N + (N - low), [{ i: a.p, gia: a.v, nhan: "1" }, { i: ip, gia: N, nhan: "Đỉnh giữa" }, { i: b.p, gia: b.v, nhan: "2" }], [{ i1: ip, g1: N, i2: t, g2: N, loai: "co" }]);
      }
    }
    // Dinh doi (M)
    {
      const a = H2, b = H1, dist = b.p - a.p;
      if (dist >= C.distMin && dist <= C.distMax && Math.abs(a.v - b.v) / a.v <= 0.03 && t - b.p <= C.tuoiToiDa) {
        const Vv = minL(a.p, b.p), top = Math.max(a.v, b.v), iv = idxMinL(a.p, b.p);
        if (Vv <= top / 1.08 && c[t] < Vv && c[t - 1] >= Vv && minL(b.p, t - 1) >= Vv * 0.9999)
          nhan("dinh_doi", t, top * 1.01, Vv - (top - Vv), [{ i: a.p, gia: a.v, nhan: "1" }, { i: iv, gia: Vv, nhan: "Đáy giữa" }, { i: b.p, gia: b.v, nhan: "2" }], [{ i1: iv, g1: Vv, i2: t, g2: Vv, loai: "co" }]);
      }
    }
    // Vai dau vai (nguoc)
    {
      if (L2.v < L3.v * 0.97 && L2.v < L1.v * 0.97 && Math.abs(L3.v - L1.v) / ((L3.v + L1.v) / 2) <= 0.08 && L1.p - L3.p <= C.vaiToiDa && t - L1.p <= C.tuoiToiDa) {
        const p1 = maxH(L3.p, L2.p), p2 = maxH(L2.p, L1.p), neck = (p1 + p2) / 2;
        if (Math.abs(p1 - p2) / neck <= 0.06 && c[t] > neck && c[t - 1] <= neck && maxH(L1.p, t - 1) <= neck * 1.001)
          nhan("vai_dau_vai_nguoc", t, L1.v * 0.99, neck + (neck - L2.v), [{ i: L3.p, gia: L3.v, nhan: "Vai trái" }, { i: L2.p, gia: L2.v, nhan: "Đầu" }, { i: L1.p, gia: L1.v, nhan: "Vai phải" }], [{ i1: idxMaxH(L3.p, L2.p), g1: neck, i2: t, g2: neck, loai: "co" }]);
      }
      if (H2.v > H3.v * 1.03 && H2.v > H1.v * 1.03 && Math.abs(H3.v - H1.v) / ((H3.v + H1.v) / 2) <= 0.08 && H1.p - H3.p <= C.vaiToiDa && t - H1.p <= C.tuoiToiDa) {
        const v1 = minL(H3.p, H2.p), v2 = minL(H2.p, H1.p), neck = (v1 + v2) / 2;
        if (Math.abs(v1 - v2) / neck <= 0.06 && c[t] < neck && c[t - 1] >= neck && minL(H1.p, t - 1) >= neck * 0.999)
          nhan("vai_dau_vai", t, H1.v * 1.01, neck - (H2.v - neck), [{ i: H3.p, gia: H3.v, nhan: "Vai trái" }, { i: H2.p, gia: H2.v, nhan: "Đầu" }, { i: H1.p, gia: H1.v, nhan: "Vai phải" }], [{ i1: idxMinL(H3.p, H2.p), g1: neck, i2: t, g2: neck, loai: "co" }]);
      }
    }
    // Tam giac, nem (2 dinh + 2 day gan nhat)
    {
      const a = H2, b = H1, x = L2, y = L1;
      if (b.p - a.p >= C.tamGiacCachMin && y.p - x.p >= C.tamGiacCachMin && Math.min(a.p, x.p) >= t - C.tamGiacCuaSo && t - Math.max(b.p, y.p) <= C.tamGiacTuoi) {
        const hgt = Math.max(a.v, b.v) - Math.min(x.v, y.v);
        const phang = (p, q) => Math.abs(p - q) / p <= 0.015;
        const up = (tt) => a.v + ((b.v - a.v) * (tt - a.p)) / (b.p - a.p);
        const lo = (tt) => x.v + ((y.v - x.v) * (tt - x.p)) / (y.p - x.p);
        const i0 = Math.min(a.p, x.p);
        const dm = [{ i: a.p, gia: a.v, nhan: "" }, { i: b.p, gia: b.v, nhan: "" }, { i: x.p, gia: x.v, nhan: "" }, { i: y.p, gia: y.v, nhan: "" }];
        if (phang(a.v, b.v) && y.v > x.v * 1.03) {
          const top = Math.max(a.v, b.v);
          if (c[t] > top && c[t - 1] <= top) nhan("tam_giac_tang", t, y.v * 0.99, top + hgt, dm, [{ i1: a.p, g1: top, i2: t, g2: top, loai: "co" }, { i1: x.p, g1: lo(x.p), i2: t, g2: lo(t), loai: "duoi" }]);
        } else if (phang(x.v, y.v) && b.v < a.v * 0.97) {
          const sup = Math.min(x.v, y.v);
          if (c[t] < sup && c[t - 1] >= sup) nhan("tam_giac_giam", t, b.v * 1.01, sup - hgt, dm, [{ i1: x.p, g1: sup, i2: t, g2: sup, loai: "co" }, { i1: a.p, g1: up(a.p), i2: t, g2: up(t), loai: "tren" }]);
        } else if (b.v < a.v * 0.98 && y.v > x.v * 1.02 && up(t) > lo(t)) {
          const dd = [{ i1: a.p, g1: up(a.p), i2: t, g2: up(t), loai: "tren" }, { i1: x.p, g1: lo(x.p), i2: t, g2: lo(t), loai: "duoi" }];
          if (c[t] > up(t) && c[t - 1] <= up(t - 1)) nhan("tam_giac_can_len", t, lo(t) * 0.99, c[t] + hgt, dm, dd);
          if (c[t] < lo(t) && c[t - 1] >= lo(t - 1)) nhan("tam_giac_can_xuong", t, up(t) * 1.01, c[t] - hgt, dm, dd);
        }
        if (b.v < a.v * 0.97 && y.v < x.v * 0.97 && (a.v - b.v) / (b.p - a.p) > (x.v - y.v) / (y.p - x.p) && c[t] > up(t) && c[t - 1] <= up(t - 1))
          nhan("nem_giam", t, y.v * 0.99, c[t] + (a.v - x.v), dm, [{ i1: a.p, g1: up(a.p), i2: t, g2: up(t), loai: "tren" }, { i1: x.p, g1: lo(x.p), i2: t, g2: lo(t), loai: "duoi" }]);
        if (b.v > a.v * 1.03 && y.v > x.v * 1.03 && (y.v - x.v) / (y.p - x.p) > (b.v - a.v) / (b.p - a.p) && c[t] < lo(t) && c[t - 1] >= lo(t - 1))
          nhan("nem_tang", t, b.v * 1.01, c[t] - (b.v - x.v), dm, [{ i1: a.p, g1: up(a.p), i2: t, g2: up(t), loai: "tren" }, { i1: x.p, g1: lo(x.p), i2: t, g2: lo(t), loai: "duoi" }]);
        void i0;
      }
    }
    // Co tang (cot buom + nen chinh ngan)
    for (let fl = C.coMin; fl <= C.coMax; fl += C.coBuoc) {
      const s = t - fl;
      if (s < C.coCot + 1) break;
      const fh = maxH(s + 1, t - 1), fl_ = minL(s + 1, t - 1);
      const ip = idxMinL(s - C.coCot, s - 1), poleLo = l[ip];
      const pole = c[s] - poleLo, polePct = pole / poleLo;
      if (polePct >= 0.15 && fh - fl_ <= 0.4 * pole && fl_ >= c[s] - 0.5 * pole && fh <= c[s] * 1.06 && c[t] > fh && c[t - 1] <= fh) {
        nhan("co_tang", t, fl_ * 0.99, c[t] + pole, [{ i: ip, gia: poleLo, nhan: "Cán cờ" }, { i: s, gia: c[s], nhan: "" }], [{ i1: ip, g1: poleLo, i2: s, g2: c[s], loai: "phu" }, { i1: s, g1: fh, i2: t, g2: fh, loai: "co" }, { i1: s, g1: fl_, i2: t, g2: fl_, loai: "duoi" }]);
        break;
      }
    }
    // Coc va tay cam
    {
      const R1 = HH.slice(-6).find((q) => t - q.p >= C.cupTuoi[0] && t - q.p <= C.cupTuoi[1]);
      const R2 = HH[nH - 1];
      if (R1 && R2.p > R1.p + C.cupMin && R2.p - R1.p <= C.cupMax && R2.v >= R1.v * 0.95 && R2.v <= R1.v * 1.05) {
        const bot = minL(R1.p, R2.p), pb = idxMinL(R1.p, R2.p);
        const depth = (R1.v - bot) / R1.v, sym = (pb - R1.p) / (R2.p - R1.p);
        if (depth >= 0.12 && depth <= 0.35 && sym >= 0.3 && sym <= 0.7 && t - R2.p >= C.cupTay[0] && t - R2.p <= C.cupTay[1]) {
          const handle = minL(R2.p + 1, t - 1), ihd = idxMinL(R2.p + 1, t - 1);
          if (handle >= R2.v * 0.88 && handle <= R2.v * 0.97 && c[t] > R2.v && c[t - 1] <= R2.v && maxH(R2.p + 1, t - 1) <= R2.v * 1.002) {
            // duong cong coc: noi cac day cua ~8 doan
            const duong = [{ i1: R1.p, g1: R2.v, i2: t, g2: R2.v, loai: "co" }];
            const k = 8, buoc = (R2.p - R1.p) / k;
            let prev = { i: R1.p, g: R1.v };
            for (let q = 1; q <= k; q++) {
              const ia = Math.round(R1.p + buoc * (q - 1)), ib = Math.min(R2.p, Math.round(R1.p + buoc * q));
              const im = q === k ? R2.p : idxMinL(Math.min(ia, ib), Math.max(ia, ib));
              const cur = q === k ? { i: R2.p, g: R2.v } : { i: im, g: l[im] };
              if (cur.i > prev.i) duong.push({ i1: prev.i, g1: prev.g, i2: cur.i, g2: cur.g, loai: "phu" });
              prev = cur.i > prev.i ? cur : prev;
            }
            nhan("coc_tay_cam", t, handle * 0.99, R2.v + (R1.v - bot), [{ i: R1.p, gia: R1.v, nhan: "Vành trái" }, { i: pb, gia: bot, nhan: "Đáy cốc" }, { i: R2.p, gia: R2.v, nhan: "Vành phải" }, { i: ihd, gia: handle, nhan: "Tay cầm" }], duong);
          }
        }
      }
    }
    // Hop di ngang (Darvas)
    {
      const a = t - C.hopNen;
      if (a >= 0) {
        const top = maxH(a, t - 1), bot = minL(a, t - 1);
        if ((top - bot) / bot <= 0.08) {
          let tt = 0, tb = 0;
          for (let i = a; i < t; i++) { if (h[i] >= top * 0.985) tt++; if (l[i] <= bot * 1.015) tb++; }
          if (tt >= 2 && tb >= 2) {
            const hd = [{ i1: a, g1: top, i2: t, g2: top, loai: "co" }, { i1: a, g1: bot, i2: t, g2: bot, loai: "co" }];
            if (c[t] > top * 1.005 && c[t - 1] <= top * 1.005) nhan("hop_len", t, bot * 0.99, c[t] + (top - bot), [], hd);
            if (c[t] < bot * 0.995 && c[t - 1] >= bot * 0.995) nhan("hop_xuong", t, top * 1.01, c[t] - (top - bot), [], hd);
          }
        }
      }
    }
  }
  const kq = tuoiToiDa == null ? ra : ra.filter((m) => m.cach < tuoiToiDa);
  return kq.sort((p, q) => q.i - p.i);
}

// MAU HINH DANG HINH THANH (chua pha vo) tai nen CUOI: cung dieu kien hinh dang voi nhanDienMauHinh nhung gia con o trong mau hinh / chua dong cua vuot duong co.
// Moi mau hinh co `kichBan`: danh sach { huong, mucPhaVo, mucTieu, catLo } - 1 kich ban (tam giac tang / giam, nem, cac mau hinh dao chieu, co, coc tay cam) hoac 2 (tam giac can, hop di ngang: chua biet phia nao).
// `cachPhaVoPct` = % khoang cach tu gia hien tai den muc pha vo gan nhat. Dau ra nhu nhanDienMauHinh (diem, duong) + { trangThai: "dang_hinh_thanh", t, gia, kichBan, ghiChu }; duong ve toi nen cuoi.
export function nhanDienDangHinhThanh(bars, { khung = "ngay" } = {}) {
  const n = bars?.length ?? 0;
  const C = CAU_HINH[khung] ?? CAU_HINH.ngay;
  if (n < C.np * 2 + 25) return [];
  const t = n - 1;
  const h = bars.map((b) => b.h), l = bars.map((b) => b.l), c = bars.map((b) => b.c);
  const NP = C.np;
  const HH = [], LL = [];
  for (let p = NP; p <= n - 1 - NP; p++) {
    let hh = true, ll = true;
    for (let k = 1; k <= NP; k++) {
      if (!(h[p] > h[p - k] && h[p] >= h[p + k])) hh = false;
      if (!(l[p] < l[p - k] && l[p] <= l[p + k])) ll = false;
    }
    if (hh) HH.push({ p, v: h[p] });
    if (ll) LL.push({ p, v: l[p] });
  }
  if (HH.length < 3 || LL.length < 3) return [];
  const maxH = (a, b) => { let m = 0; for (let i = a; i <= b; i++) if (h[i] > m) m = h[i]; return m; };
  const minL = (a, b) => { let m = Infinity; for (let i = a; i <= b; i++) if (l[i] < m) m = l[i]; return m; };
  const maxC = (a, b) => { let m = 0; for (let i = a; i <= b; i++) if (c[i] > m) m = c[i]; return m; };
  const minC = (a, b) => { let m = Infinity; for (let i = a; i <= b; i++) if (c[i] < m) m = c[i]; return m; };
  const idxMaxH = (a, b) => { let k = a; for (let i = a; i <= b; i++) if (h[i] > h[k]) k = i; return k; };
  const idxMinL = (a, b) => { let k = a; for (let i = a; i <= b; i++) if (l[i] < l[k]) k = i; return k; };
  const E = c[t];
  const ra = [];
  const them = (khoa, kichBan, diem, duong, ghiChu) => {
    const kb = kichBan.filter((k) => {
      const rs = k.huong > 0 ? (E - k.catLo) / E : (k.catLo - E) / E;
      const rg = k.huong > 0 ? (k.mucTieu - E) / E : (E - k.mucTieu) / E;
      return k.catLo > 0 && k.mucTieu > 0 && rs > 0 && rs <= 0.3 && rg > 0.005;
    });
    if (!kb.length || ra.some((m) => m.khoa === khoa)) return;
    const cachPhaVoPct = Math.min(...kb.map((k) => Math.abs(k.mucPhaVo / E - 1) * 100));
    ra.push({ khoa, ten: TEN[khoa], huong: kb.length === 1 ? kb[0].huong : 0, trangThai: "dang_hinh_thanh", i: t, cach: 0, t: bars[t].t, gia: E, kichBan: kb, cachPhaVoPct, diem, duong, ghiChu });
  };
  const H1 = HH[HH.length - 1], H2 = HH[HH.length - 2], H3 = HH[HH.length - 3];
  const L1 = LL[LL.length - 1], L2 = LL[LL.length - 2], L3 = LL[LL.length - 3];
  // Day doi / dinh doi
  {
    const a = L2, b = L1, dist = b.p - a.p;
    if (dist >= C.distMin && dist <= C.distMax && Math.abs(a.v - b.v) / a.v <= 0.03 && t - b.p <= C.tuoiToiDa) {
      const N = maxH(a.p, b.p), low = Math.min(a.v, b.v), ip = idxMaxH(a.p, b.p);
      if (N >= 1.08 * Math.max(a.v, b.v) && maxC(b.p, t) <= N && E >= low + 0.4 * (N - low) && minL(b.p, t) >= b.v * 0.999)
        them("day_doi", [{ huong: 1, mucPhaVo: N, mucTieu: N + (N - low), catLo: low * 0.99 }], [{ i: a.p, gia: a.v, nhan: "1" }, { i: ip, gia: N, nhan: "Đỉnh giữa" }, { i: b.p, gia: b.v, nhan: "2" }], [{ i1: ip, g1: N, i2: t, g2: N, loai: "co" }], "Hai đáy gần bằng nhau, giá đã hồi lên gần đường cổ — chờ đóng cửa trên đỉnh giữa");
    }
    const a2 = H2, b2 = H1, dist2 = b2.p - a2.p;
    if (dist2 >= C.distMin && dist2 <= C.distMax && Math.abs(a2.v - b2.v) / a2.v <= 0.03 && t - b2.p <= C.tuoiToiDa) {
      const Vv = minL(a2.p, b2.p), top = Math.max(a2.v, b2.v), iv = idxMinL(a2.p, b2.p);
      if (Vv <= top / 1.08 && minC(b2.p, t) >= Vv && E <= top - 0.4 * (top - Vv) && maxH(b2.p, t) <= b2.v * 1.001)
        them("dinh_doi", [{ huong: -1, mucPhaVo: Vv, mucTieu: Vv - (top - Vv), catLo: top * 1.01 }], [{ i: a2.p, gia: a2.v, nhan: "1" }, { i: iv, gia: Vv, nhan: "Đáy giữa" }, { i: b2.p, gia: b2.v, nhan: "2" }], [{ i1: iv, g1: Vv, i2: t, g2: Vv, loai: "co" }], "Hai đỉnh gần bằng nhau, giá đã giảm về gần đường cổ — chờ đóng cửa dưới đáy giữa");
    }
  }
  // Vai dau vai (nguoc)
  {
    if (L2.v < L3.v * 0.97 && L2.v < L1.v * 0.97 && Math.abs(L3.v - L1.v) / ((L3.v + L1.v) / 2) <= 0.08 && L1.p - L3.p <= C.vaiToiDa && t - L1.p <= C.tuoiToiDa) {
      const p1 = maxH(L3.p, L2.p), p2 = maxH(L2.p, L1.p), neck = (p1 + p2) / 2;
      if (Math.abs(p1 - p2) / neck <= 0.06 && maxC(L1.p, t) <= neck && E >= neck * 0.9 && minL(L1.p, t) >= L1.v * 0.999)
        them("vai_dau_vai_nguoc", [{ huong: 1, mucPhaVo: neck, mucTieu: neck + (neck - L2.v), catLo: L1.v * 0.99 }], [{ i: L3.p, gia: L3.v, nhan: "Vai trái" }, { i: L2.p, gia: L2.v, nhan: "Đầu" }, { i: L1.p, gia: L1.v, nhan: "Vai phải" }], [{ i1: idxMaxH(L3.p, L2.p), g1: neck, i2: t, g2: neck, loai: "co" }], "Đã có vai phải, giá đang hồi về đường cổ — chờ đóng cửa trên đường cổ");
    }
    if (H2.v > H3.v * 1.03 && H2.v > H1.v * 1.03 && Math.abs(H3.v - H1.v) / ((H3.v + H1.v) / 2) <= 0.08 && H1.p - H3.p <= C.vaiToiDa && t - H1.p <= C.tuoiToiDa) {
      const v1 = minL(H3.p, H2.p), v2 = minL(H2.p, H1.p), neck = (v1 + v2) / 2;
      if (Math.abs(v1 - v2) / neck <= 0.06 && minC(H1.p, t) >= neck && E <= neck * 1.1 && maxH(H1.p, t) <= H1.v * 1.001)
        them("vai_dau_vai", [{ huong: -1, mucPhaVo: neck, mucTieu: neck - (H2.v - neck), catLo: H1.v * 1.01 }], [{ i: H3.p, gia: H3.v, nhan: "Vai trái" }, { i: H2.p, gia: H2.v, nhan: "Đầu" }, { i: H1.p, gia: H1.v, nhan: "Vai phải" }], [{ i1: idxMinL(H3.p, H2.p), g1: neck, i2: t, g2: neck, loai: "co" }], "Đã có vai phải, giá đang giảm về đường cổ — chờ đóng cửa dưới đường cổ");
    }
  }
  // Tam giac / nem
  {
    const a = H2, b = H1, x = L2, y = L1;
    if (b.p - a.p >= C.tamGiacCachMin && y.p - x.p >= C.tamGiacCachMin && Math.min(a.p, x.p) >= t - C.tamGiacCuaSo && t - Math.max(b.p, y.p) <= C.tamGiacTuoi) {
      const hgt = Math.max(a.v, b.v) - Math.min(x.v, y.v);
      const phang = (p, q) => Math.abs(p - q) / p <= 0.015;
      const up = (tt) => a.v + ((b.v - a.v) * (tt - a.p)) / (b.p - a.p);
      const lo = (tt) => x.v + ((y.v - x.v) * (tt - x.p)) / (y.p - x.p);
      const dm = [{ i: a.p, gia: a.v, nhan: "" }, { i: b.p, gia: b.v, nhan: "" }, { i: x.p, gia: x.v, nhan: "" }, { i: y.p, gia: y.v, nhan: "" }];
      const dTren = { i1: a.p, g1: up(a.p), i2: t, g2: up(t), loai: "tren" };
      const dDuoi = { i1: x.p, g1: lo(x.p), i2: t, g2: lo(t), loai: "duoi" };
      const trong = (top, bot) => E < top && E > bot && maxC(Math.max(b.p, y.p), t) < top && minC(Math.max(b.p, y.p), t) > bot;
      if (phang(a.v, b.v) && y.v > x.v * 1.03) {
        const top = Math.max(a.v, b.v);
        if (trong(top, lo(t))) them("tam_giac_tang", [{ huong: 1, mucPhaVo: top, mucTieu: top + hgt, catLo: lo(t) * 0.99 }], dm, [{ i1: a.p, g1: top, i2: t, g2: top, loai: "co" }, dDuoi], "Đỉnh đi ngang, đáy nâng dần — chờ đóng cửa trên đường kháng cự");
      } else if (phang(x.v, y.v) && b.v < a.v * 0.97) {
        const sup = Math.min(x.v, y.v);
        if (trong(up(t), sup)) them("tam_giac_giam", [{ huong: -1, mucPhaVo: sup, mucTieu: sup - hgt, catLo: up(t) * 1.01 }], dm, [{ i1: x.p, g1: sup, i2: t, g2: sup, loai: "co" }, dTren], "Đáy đi ngang, đỉnh hạ dần — chờ đóng cửa dưới đường hỗ trợ");
      } else if (b.v < a.v * 0.98 && y.v > x.v * 1.02 && up(t) > lo(t) && trong(up(t), lo(t))) {
        them("tam_giac_can_len", [{ huong: 1, mucPhaVo: up(t), mucTieu: E + hgt, catLo: lo(t) * 0.99 }, { huong: -1, mucPhaVo: lo(t), mucTieu: E - hgt, catLo: up(t) * 1.01 }], dm, [dTren, dDuoi], "Tam giác cân thu hẹp — chưa rõ hướng, chờ phá vỡ lên hoặc xuống");
      }
      if (b.v < a.v * 0.97 && y.v < x.v * 0.97 && (a.v - b.v) / (b.p - a.p) > (x.v - y.v) / (y.p - x.p) && up(t) > lo(t) && trong(up(t), lo(t)))
        them("nem_giam", [{ huong: 1, mucPhaVo: up(t), mucTieu: E + (a.v - x.v), catLo: lo(t) * 0.99 }], dm, [dTren, dDuoi], "Nêm giảm (hai cạnh cùng dốc xuống và hội tụ) — thường phá vỡ lên, chờ đóng cửa trên cạnh trên");
      if (b.v > a.v * 1.03 && y.v > x.v * 1.03 && (y.v - x.v) / (y.p - x.p) > (b.v - a.v) / (b.p - a.p) && up(t) > lo(t) && trong(up(t), lo(t)))
        them("nem_tang", [{ huong: -1, mucPhaVo: lo(t), mucTieu: E - (b.v - x.v), catLo: up(t) * 1.01 }], dm, [dTren, dDuoi], "Nêm tăng (hai cạnh cùng dốc lên và hội tụ) — thường phá vỡ xuống, chờ đóng cửa dưới cạnh dưới");
    }
  }
  // Co tang
  for (let fl = C.coMin; fl <= C.coMax; fl += C.coBuoc) {
    const s0 = t - fl;
    if (s0 < C.coCot + 1) break;
    const fh = maxH(s0 + 1, t), fl_ = minL(s0 + 1, t);
    const ip = idxMinL(s0 - C.coCot, s0 - 1), poleLo = l[ip];
    const pole = c[s0] - poleLo, polePct = pole / poleLo;
    if (polePct >= 0.15 && fh - fl_ <= 0.4 * pole && fl_ >= c[s0] - 0.5 * pole && fh <= c[s0] * 1.06 && E <= fh && E >= fl_) {
      them("co_tang", [{ huong: 1, mucPhaVo: fh, mucTieu: fh + pole, catLo: fl_ * 0.99 }], [{ i: ip, gia: poleLo, nhan: "Cán cờ" }, { i: s0, gia: c[s0], nhan: "" }], [{ i1: ip, g1: poleLo, i2: s0, g2: c[s0], loai: "phu" }, { i1: s0, g1: fh, i2: t, g2: fh, loai: "co" }, { i1: s0, g1: fl_, i2: t, g2: fl_, loai: "duoi" }], "Cán cờ mạnh rồi nghỉ ngắn — chờ đóng cửa trên đỉnh lá cờ");
      break;
    }
  }
  // Coc va tay cam
  {
    const R1 = HH.slice(-6).find((q) => t - q.p >= C.cupTuoi[0] && t - q.p <= C.cupTuoi[1]);
    const R2 = H1;
    if (R1 && R2.p > R1.p + C.cupMin && R2.p - R1.p <= C.cupMax && R2.v >= R1.v * 0.95 && R2.v <= R1.v * 1.05) {
      const bot = minL(R1.p, R2.p), pb = idxMinL(R1.p, R2.p);
      const depth = (R1.v - bot) / R1.v, sym = (pb - R1.p) / (R2.p - R1.p);
      if (depth >= 0.12 && depth <= 0.35 && sym >= 0.3 && sym <= 0.7 && t - R2.p >= 2 && t - R2.p <= C.cupTay[1]) {
        const handle = minL(R2.p + 1, t), ihd = idxMinL(R2.p + 1, t);
        if (handle >= R2.v * 0.88 && handle <= R2.v * 0.995 && maxC(R2.p + 1, t) <= R2.v * 1.002 && E <= R2.v) {
          const duong = [{ i1: R1.p, g1: R2.v, i2: t, g2: R2.v, loai: "co" }];
          const k = 8, buoc = (R2.p - R1.p) / k;
          let prev = { i: R1.p, g: R1.v };
          for (let q = 1; q <= k; q++) {
            const ia = Math.round(R1.p + buoc * (q - 1)), ib = Math.min(R2.p, Math.round(R1.p + buoc * q));
            const im = q === k ? R2.p : idxMinL(Math.min(ia, ib), Math.max(ia, ib));
            const cur = q === k ? { i: R2.p, g: R2.v } : { i: im, g: l[im] };
            if (cur.i > prev.i) duong.push({ i1: prev.i, g1: prev.g, i2: cur.i, g2: cur.g, loai: "phu" });
            prev = cur.i > prev.i ? cur : prev;
          }
          them("coc_tay_cam", [{ huong: 1, mucPhaVo: R2.v, mucTieu: R2.v + (R1.v - bot), catLo: handle * 0.99 }], [{ i: R1.p, gia: R1.v, nhan: "Vành trái" }, { i: pb, gia: bot, nhan: "Đáy cốc" }, { i: R2.p, gia: R2.v, nhan: "Vành phải" }, { i: ihd, gia: handle, nhan: "Tay cầm" }], duong, "Cốc đã hình thành, đang tạo tay cầm — chờ đóng cửa trên vành");
        }
      }
    }
  }
  // Hop di ngang
  {
    const a = t - C.hopNen + 1;
    if (a >= 0) {
      const top = maxH(a, t), bot = minL(a, t);
      if ((top - bot) / bot <= 0.08 && E > bot * 0.995 && E < top * 1.005) {
        let tt = 0, tb = 0;
        for (let i = a; i <= t; i++) { if (h[i] >= top * 0.985) tt++; if (l[i] <= bot * 1.015) tb++; }
        if (tt >= 2 && tb >= 2) {
          const gt = top - bot;
          them("hop_len", [{ huong: 1, mucPhaVo: top * 1.005, mucTieu: E + gt, catLo: bot * 0.99 }, { huong: -1, mucPhaVo: bot * 0.995, mucTieu: E - gt, catLo: top * 1.01 }], [], [{ i1: a, g1: top, i2: t, g2: top, loai: "co" }, { i1: a, g1: bot, i2: t, g2: bot, loai: "co" }], "Giá đi ngang trong hộp hẹp — chưa rõ hướng, chờ phá vỡ lên hoặc xuống");
        }
      }
    }
  }
  return ra.sort((p, q) => p.cachPhaVoPct - q.cachPhaVoPct);
}

// Cho bo loc: voi moi mau hinh, so nen tu nen pha vo GAN NHAT den nen cuoi (0 = nen cuoi), hoac null neu khong co trong `tuoiToiDa` nen. { khoa: cach | null }
export function cachMauHinhGanNhat(bars, { khung = "ngay", tuoiToiDa = 10 } = {}) {
  const kq = Object.fromEntries(KHOA_MAU_HINH.map((k) => [k, null]));
  for (const m of nhanDienMauHinh(bars, { khung, tuoiToiDa })) if (kq[m.khoa] == null || m.cach < kq[m.khoa]) kq[m.khoa] = m.cach;
  return kq;
}

// Ten cot bang chi_bao_ky_thuat: ngay = mh_<khoa>, tuan = mh_<khoa>_tuan (gia tri = so nen tu nen pha vo, 0 = hom nay / tuan nay).
export const COT_MAU_HINH_NGAY = KHOA_MAU_HINH.map((k) => `mh_${k}`);
export const COT_MAU_HINH_TUAN = KHOA_MAU_HINH.map((k) => `mh_${k}_tuan`);
export const SO_NEN_MAU_HINH_NGAY = 10;
export const SO_NEN_MAU_HINH_TUAN = 6;
