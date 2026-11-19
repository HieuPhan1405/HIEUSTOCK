// FOOTPRINT (20/11/2026, Hieu: "footprint, them vao chi bao moi"): khoi luong khop MUA CHU DONG / BAN CHU DONG theo TUNG MUC GIA trong moi nen.
// Nguon: tick that DNSE cua hop dong VN30F1M (engine/dich-vu/taiTickPhaiSinh.mjs -> engine/output/tick_phaisinh/YYYY-MM-DD.json,
// dang cot { t: [ms trong ngay, gio VN], p: [gia], q: [KL], s: [+1 mua chu dong | -1 ban chu dong | 0 khong ro (ATO / ATC)] }).
// Luu tru (bang footprint_ngay): moi ngay 1 dong, du_lieu = [[tGiay, [[gia*10, mua, ban, khac], ...]], ...] - nen 1 PHUT, gia la so nguyen (phan muoi diem)
// de khong lech so thuc. tGiay = giay Unix CONG 7 GIO (giong thoi gian nen trong ngay cua bieu do).
// gopFootprint gop nen 1 phut thanh khung 5p / 15p / 30p / 1 gio va gop muc gia theo buoc (vd 0,5 diem) truoc khi gui ve trinh duyet.

export const KHUNG_FOOTPRINT = { M1: 60, M5: 300, M15: 900, M30: 1800, H: 3600 };
// Buoc gia gui ve (phan muoi diem) va so ngay toi da theo khung: khung lon -> buoc tho + nhieu ngay hon, giu goi tin nho.
export const CAU_HINH_KHUNG = { M1: { buoc: 1, ngay: 3 }, M5: { buoc: 1, ngay: 8 }, M15: { buoc: 2, ngay: 15 }, M30: { buoc: 5, ngay: 25 }, H: { buoc: 5, ngay: 40 } };

// tick (dang cot) cua 1 ngay -> nen 1 phut co footprint
export function tickThanhM1(tick, ngay) {
  const goc = Date.UTC(Number(ngay.slice(0, 4)), Number(ngay.slice(5, 7)) - 1, Number(ngay.slice(8, 10))) / 1000;
  const phut = new Map();
  const n = Math.min(tick?.t?.length ?? 0, tick?.p?.length ?? 0, tick?.q?.length ?? 0);
  for (let i = 0; i < n; i++) {
    const q = tick.q[i];
    if (!(q > 0) || !(tick.p[i] > 0)) continue;
    const ph = Math.floor(tick.t[i] / 60000);
    let m = phut.get(ph);
    if (!m) phut.set(ph, (m = new Map()));
    const g = Math.round(tick.p[i] * 10);
    let o = m.get(g);
    if (!o) m.set(g, (o = [g, 0, 0, 0]));
    const s = tick.s?.[i] ?? 0;
    o[s > 0 ? 1 : s < 0 ? 2 : 3] += q;
  }
  return [...phut.entries()].sort((a, b) => a[0] - b[0]).map(([ph, m]) => [goc + ph * 60, [...m.values()].sort((a, b) => a[0] - b[0])]);
}

// nhieu ngay nen 1 phut (mang noi tiep) -> nen khung kt. Tra ve { kt, buoc (diem), nen: [{ t, muc: [[gia, mua, ban, khac]], mua, ban, khac, poc }] }
export function gopFootprint(m1, kt = "M5", buoc10 = null) {
  const giay = KHUNG_FOOTPRINT[kt] ?? 300;
  const b = buoc10 ?? CAU_HINH_KHUNG[kt]?.buoc ?? 1;
  const nen = new Map();
  for (const [t, muc] of m1) {
    const tk = Math.floor(t / giay) * giay; // giay da cong 7 gio va moc ngay chia het cho khung -> 9:00, 9:05 ... / 9:00, 10:00 ...
    let e = nen.get(tk);
    if (!e) nen.set(tk, (e = new Map()));
    for (const [g, mua, ban, khac] of muc) {
      const gb = Math.floor(g / b) * b;
      let o = e.get(gb);
      if (!o) e.set(gb, (o = [gb, 0, 0, 0]));
      o[1] += mua;
      o[2] += ban;
      o[3] += khac;
    }
  }
  const ra = [];
  for (const [t, e] of [...nen.entries()].sort((a, b2) => a[0] - b2[0])) {
    const muc = [...e.values()].sort((a, b2) => a[0] - b2[0]);
    let mua = 0, ban = 0, khac = 0, poc = null, max = -1;
    for (const o of muc) {
      mua += o[1];
      ban += o[2];
      khac += o[3];
      const tong = o[1] + o[2] + o[3];
      if (tong > max) { max = tong; poc = o[0]; }
    }
    ra.push({ t, muc: muc.map((o) => [o[0] / 10, o[1], o[2], o[3]]), mua, ban, khac, poc: poc / 10 });
  }
  return { kt, buoc: b / 10, nen: ra };
}
