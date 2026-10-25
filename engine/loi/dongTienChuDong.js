// DONG TIEN THOI GIAN THUC TU DNSE (Hieu 2026-10-25): gom tung lenh khop (kenh tick_extra, co CHIEU khop) thanh dong tien CHU DONG mua / ban theo tung ma + theo co lenh (nho / vua / lon),
// volume profile trong ngay, khoi ngoai (kenh foreign), do rong thi truong (kenh market_index). Ham THUAN, khong ket noi mang - test tay: engine/test/dongTienChuDong.test.mjs; noi mang: engine/dich-vu/dongTienRealTime.mjs.
//
// QUY UOC (kiem chung bang du lieu REST lich su, xem engine/dich-vu/chayThuDnseTrades2.mjs):
//  - chi tinh bang G1 (lo chan), don vi tien = TRIEU DONG (gia nghin dong x KL / 1000);
//  - CHIEU khop (side BUY / SELL) chi co nghia trong phien KHOP LENH LIEN TUC (09:15-14:30). ATO va ATC la khop dinh ky: chieu bi gan theo ben dat lenh cuoi (vd moi ban ghi ATC deu "BUY") -> vo nghia -> khong tinh vao dong tien chu dong,
//    chi ghi rieng KL ATO / ATC va dua vao volume profile (phan "khac");
//  - CO LENH: nhieu lan khop cua CUNG 1 lenh chu dong (cung chieu, cach nhau <= 3 ms) duoc gop thanh 1 lenh; lon >= 500 trieu, vua 100 - 500 trieu, nho < 100 trieu. Day la UOC LUONG theo co lenh, khong phai so lieu "to chuc / ca nhan" that.
export const NGUONG_VUA_TRIEU = 100;
export const NGUONG_LON_TRIEU = 500;
export const GOP_LENH_MS = 3;
export const SO_MUC_GIA_TOI_DA = 60;

// "BUY" | "SELL" | 1 | 2 | "B" | "S" | "M"(mua) | "1" | "2" -> "m" (mua chu dong) | "b" (ban chu dong) | null
export function chuanHoaChieu(side) {
  if (side === "BUY" || side === "B" || side === 1 || side === "1") return "m";
  if (side === "SELL" || side === "S" || side === 2 || side === "2") return "b";
  return null;
}

// "2026-10-23 14:45:05.817" -> { ngay, gio, phut, ms } (ms = so mili-giay ke tu 00:00)
export function phanTichThoiGian(s) {
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?/.exec(String(s ?? ""));
  if (!m) return null;
  const [, ngay, hh, mm, ss, f] = m;
  const ms = ((Number(hh) * 60 + Number(mm)) * 60 + Number(ss)) * 1000 + (f ? Number(f.padEnd(3, "0")) : 0);
  return { ngay, gio: `${hh}:${mm}:${ss}`, phut: `${hh}:${mm}`, ms };
}

// ATO (truoc 09:15) / LT (khop lien tuc 09:15 - 14:30) / ATC (tu 14:30: ket qua khop ATC duoc GHI LUC ~14:45:05 nen tinh ca moc sau 14:45).
// LUU Y: ket qua khop ATO cung duoc ghi o ~09:15:00-09:15:02 (xem nhanTick: nhan dien theo cum dau tien trong ngay, cung gia).
export function phaGiaoDich(gio) {
  if (gio < "09:15:00") return "ATO";
  if (gio < "14:30:00") return "LT";
  return "ATC";
}
const ATO_TRE_NHAT_GIO = "09:15:10"; // cum khop ATO chi xet truoc moc nay
const ATO_CUM_MS = 1500; // cac lan khop cung gia trong 1,5 giay ke tu lan khop dau tien = cung 1 dot khop ATO

const lam = (v, d = 1) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const phanNhom = (gtTrieu) => (gtTrieu >= NGUONG_LON_TRIEU ? "lon" : gtTrieu >= NGUONG_VUA_TRIEU ? "vua" : "nho");
const moiMa = () => ({
  kl: 0, gia: null, gioCuoi: null, mua: 0, ban: 0, soKhopLT: 0,
  nhom: { lon: { m: 0, b: 0, n: 0 }, vua: { m: 0, b: 0, n: 0 }, nho: { m: 0, b: 0, n: 0 } },
  lenhDang: null, ato: 0, atc: 0, profile: new Map(), phut: new Map(), nn: null,
});

export class BoGopDongTien {
  constructor({ vn30 = new Set() } = {}) {
    this.vn30 = vn30;
    this.ngay = null;
    this.ma = new Map();
    this.chiSo = new Map();
    this.demChieuLa = 0; // so tick LT co chieu khong nhan ra (kiem tra truong "side" that: xem log o dich vu)
    this.soTick = 0;
  }

  datLai() {
    this.ma = new Map();
    this.chiSo = new Map();
    this.demChieuLa = 0;
    this.soTick = 0;
  }

  // ngay cua ban tin moi: cu hon ngay dang gom -> bo (false); moi hon -> dat lai toan bo roi chuyen sang ngay moi; null (khong co thoi gian) -> chap nhan
  kiemTraNgay(ngay) {
    if (!ngay) return true;
    if (this.ngay && ngay < this.ngay) return false;
    if (this.ngay && ngay > this.ngay) this.datLai();
    this.ngay = ngay;
    return true;
  }

  trangThaiMa(sym) {
    let s = this.ma.get(sym);
    if (!s) {
      s = moiMa();
      this.ma.set(sym, s);
    }
    return s;
  }

  // tick_extra: { symbol, boardId, matchPrice, matchQtty, side, time }
  nhanTick(m) {
    if (!m?.symbol || (m.boardId && m.boardId !== "G1")) return false;
    const gia = Number(m.matchPrice), q = Number(m.matchQtty);
    const tp = phanTichThoiGian(m.time);
    if (!tp || !(gia > 0) || !(q > 0)) return false;
    if (!this.kiemTraNgay(tp.ngay)) return false; // ban tin cu cua ngay truoc
    this.soTick++;
    const s = this.trangThaiMa(m.symbol);
    const gt = (gia * q) / 1000;
    let pha = phaGiaoDich(tp.gio);
    // cum khop ATO ghi ngay sau 09:15:00: lan khop DAU TIEN trong ngay (truoc 09:15:10) + cac lan cung gia trong ATO_CUM_MS
    if (pha === "LT" && tp.gio < ATO_TRE_NHAT_GIO) {
      if (s.kl === 0) {
        s.atoMs = tp.ms;
        s.atoGia = gia;
        pha = "ATO";
      } else if (s.atoMs != null && gia === s.atoGia && tp.ms - s.atoMs >= 0 && tp.ms - s.atoMs <= ATO_CUM_MS) pha = "ATO";
    }
    s.kl += q;
    s.gia = gia;
    s.gioCuoi = tp.gio;
    const mucGia = s.profile.get(gia) ?? { m: 0, b: 0, k: 0 };
    s.profile.set(gia, mucGia);
    if (pha === "ATO") {
      s.ato += q;
      mucGia.k += q;
      return true;
    }
    if (pha === "ATC") {
      s.atc += q;
      mucGia.k += q;
      return true;
    }
    const chieu = chuanHoaChieu(m.side);
    if (!chieu) {
      this.demChieuLa++;
      mucGia.k += q;
      return true;
    }
    s.soKhopLT++;
    mucGia[chieu] += q;
    if (chieu === "m") s.mua += gt;
    else s.ban += gt;
    const phutS = s.phut.get(tp.phut) ?? { m: 0, b: 0, gia };
    phutS[chieu] += gt;
    phutS.gia = gia;
    s.phut.set(tp.phut, phutS);
    const cur = s.lenhDang;
    if (cur && cur.chieu === chieu && tp.ms - cur.msCuoi >= 0 && tp.ms - cur.msCuoi <= GOP_LENH_MS) {
      cur.gt += gt;
      cur.msCuoi = tp.ms;
    } else {
      this.chotLenh(s);
      s.lenhDang = { chieu, gt, msCuoi: tp.ms };
    }
    return true;
  }

  chotLenh(s) {
    const l = s.lenhDang;
    if (!l) return;
    const nhom = s.nhom[phanNhom(l.gt)];
    nhom[l.chieu] += l.gt;
    nhom.n++;
    s.lenhDang = null;
  }

  // foreign: { symbol, boardId, totalBuyTradedAmount (VND), totalSellTradedAmount, totalBuyVolume, totalSellVolume, foreignerBuyPossibleQuantity, foreignerOrderLimitQuantity, transactTime }
  nhanNuocNgoai(f) {
    if (!f?.symbol || (f.boardId && f.boardId !== "G1")) return false;
    const mua = Number(f.totalBuyTradedAmount), ban = Number(f.totalSellTradedAmount);
    if (!Number.isFinite(mua) || !Number.isFinite(ban)) return false;
    if (!this.kiemTraNgay(phanTichThoiGian(f.transactTime)?.ngay)) return false;
    const s = this.trangThaiMa(f.symbol);
    s.nn = { mua: mua / 1e6, ban: ban / 1e6, klMua: Number(f.totalBuyVolume) || 0, klBan: Number(f.totalSellVolume) || 0, conRoom: Number.isFinite(Number(f.foreignerBuyPossibleQuantity)) ? Number(f.foreignerBuyPossibleQuantity) : null, t: f.transactTime ?? null };
    return true;
  }

  // market_index: { indexName, valueIndexes, changedValue, changedRatio, totalVolumeTraded, grossTradeAmount, fluctuation*IssueCount, fluctuation*IssueVolume, ... }
  nhanChiSo(mi) {
    if (!mi?.indexName) return false;
    if (!this.kiemTraNgay(phanTichThoiGian(mi.transactTime)?.ngay)) return false;
    const so = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
    this.chiSo.set(mi.indexName, {
      gt: so(mi.valueIndexes), doi: so(mi.changedValue), doiPct: so(mi.changedRatio), thamChieu: so(mi.priorValueIndexes), cao: so(mi.highestValueIndexes), thap: so(mi.lowestValueIndexes),
      kl: so(mi.totalVolumeTraded), gtGd: so(mi.grossTradeAmount),
      tang: so(mi.fluctuationUpIssueCount), giam: so(mi.fluctuationDownIssueCount), dung: so(mi.fluctuationSteadinessIssueCount), tran: so(mi.fluctuationUpperLimitIssueCount), san: so(mi.fluctuationLowerLimitIssueCount),
      klTang: so(mi.fluctuationUpIssueVolume), klGiam: so(mi.fluctuationDownIssueVolume), klDung: so(mi.fluctuationSteadinessIssueVolume),
      thoaThuanKl: so(mi.blkTrdAccTrdVol), thoaThuanGt: so(mi.blkTrdAccTrdVal), t: mi.transactTime ?? null,
    });
    return true;
  }

  // tom tat 1 ma (khong sua trang thai: lenh dang gop duoc tinh vao nhom tren ban sao)
  tomTat(s) {
    const nhom = { lon: { ...s.nhom.lon }, vua: { ...s.nhom.vua }, nho: { ...s.nhom.nho } };
    if (s.lenhDang) {
      const k = nhom[phanNhom(s.lenhDang.gt)];
      k[s.lenhDang.chieu] += s.lenhDang.gt;
      k.n++;
    }
    const cap = (k) => ({ mua: lam(k.m), ban: lam(k.b), soLenh: k.n });
    return {
      gia: s.gia, kl: s.kl, mua: lam(s.mua), ban: lam(s.ban), rong: lam(s.mua - s.ban), lon: cap(nhom.lon), vua: cap(nhom.vua), nho: cap(nhom.nho),
      ato: s.ato, atc: s.atc, soKhop: s.soKhopLT, gio: s.gioCuoi,
      nn: s.nn ? { mua: lam(s.nn.mua), ban: lam(s.nn.ban), rong: lam(s.nn.mua - s.nn.ban), klMua: s.nn.klMua, klBan: s.nn.klBan, conRoom: s.nn.conRoom } : null,
    };
  }

  // chi tiet 1 ma: chuoi theo phut + volume profile (gop ve toi da SO_MUC_GIA_TOI_DA muc)
  chiTiet(s) {
    const phut = [...s.phut.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([k, v]) => [k, lam(v.m), lam(v.b), v.gia]);
    const muc = [...s.profile.entries()].sort((a, b) => a[0] - b[0]);
    let profile;
    if (muc.length <= SO_MUC_GIA_TOI_DA) profile = muc.map(([g, v]) => [g, v.m, v.b, v.k]);
    else {
      const thap = muc[0][0], cao = muc[muc.length - 1][0], buoc = (cao - thap) / (SO_MUC_GIA_TOI_DA - 1);
      const ngan = new Map();
      for (const [g, v] of muc) {
        const i = Math.min(SO_MUC_GIA_TOI_DA - 1, Math.round((g - thap) / buoc));
        const x = ngan.get(i) ?? { w: 0, gw: 0, m: 0, b: 0, k: 0 };
        const t = v.m + v.b + v.k;
        x.w += t;
        x.gw += g * t;
        x.m += v.m;
        x.b += v.b;
        x.k += v.k;
        ngan.set(i, x);
      }
      profile = [...ngan.entries()].sort((a, b) => a[0] - b[0]).map(([, x]) => [lam(x.gw / (x.w || 1), 2), x.m, x.b, x.k]);
    }
    return { phut, profile };
  }

  // Anh chup de gui len web: { ngay, ma: { SYM: { ...tomTat, [chiTiet] } }, thiTruong: { tong, vn30, chiSo } }
  chupAnh({ chiTiet = false } = {}) {
    const ma = {};
    const tong = { mua: 0, ban: 0, lon: { mua: 0, ban: 0 }, nnMua: 0, nnBan: 0, soMa: 0 };
    const v30 = { mua: 0, ban: 0, lon: { mua: 0, ban: 0 }, nnMua: 0, nnBan: 0, soMa: 0 };
    for (const [sym, s] of this.ma) {
      const t = this.tomTat(s);
      ma[sym] = chiTiet ? { ...t, chiTiet: this.chiTiet(s) } : t;
      for (const g of this.vn30.has(sym) ? [tong, v30] : [tong]) {
        g.mua += t.mua;
        g.ban += t.ban;
        g.lon.mua += t.lon.mua;
        g.lon.ban += t.lon.ban;
        g.nnMua += t.nn?.mua ?? 0;
        g.nnBan += t.nn?.ban ?? 0;
        g.soMa++;
      }
    }
    const chot = (g) => ({ soMa: g.soMa, mua: lam(g.mua), ban: lam(g.ban), rong: lam(g.mua - g.ban), lon: { mua: lam(g.lon.mua), ban: lam(g.lon.ban), rong: lam(g.lon.mua - g.lon.ban) }, nn: { mua: lam(g.nnMua), ban: lam(g.nnBan), rong: lam(g.nnMua - g.nnBan) } });
    return { ngay: this.ngay, nguong: { vuaTrieu: NGUONG_VUA_TRIEU, lonTrieu: NGUONG_LON_TRIEU }, ma, thiTruong: { tong: chot(tong), vn30: chot(v30), chiSo: Object.fromEntries(this.chiSo) } };
  }
}

// TONG HOP CHO TRANG TONG QUAN (tu anh chup chupAnh()): top ma mua / ban rong nhieu nhat, top lenh LON, dong tien theo NGANH.
// nganhCuaMa: ma -> ten nganh | null. Chi xet ma co dong tien chu dong (mua + ban > 0).
export function tongHopThiTruong(anh, { nganhCuaMa = () => null, soTop = 10 } = {}) {
  const ds = Object.entries(anh.ma).map(([ma, t]) => ({ ma, gia: t.gia, mua: t.mua, ban: t.ban, rong: t.rong, lonRong: lam(t.lon.mua - t.lon.ban), nnRong: t.nn?.rong ?? null, kl: t.kl })).filter((x) => x.mua + x.ban > 0);
  const nganh = new Map();
  for (const [ma, t] of Object.entries(anh.ma)) {
    const ten = nganhCuaMa(ma);
    if (!ten || !(t.mua + t.ban > 0)) continue;
    const g = nganh.get(ten) ?? { ten, mua: 0, ban: 0, lonRong: 0, nnRong: 0, soMa: 0 };
    g.mua += t.mua;
    g.ban += t.ban;
    g.lonRong += t.lon.mua - t.lon.ban;
    g.nnRong += t.nn?.rong ?? 0;
    g.soMa++;
    nganh.set(ten, g);
  }
  return {
    // chi giu ma dung chieu (mua ron > 0 / ban ron < 0) de danh sach khong lan so 0 / so trai dau
    topMua: ds.filter((x) => x.rong > 0).sort((a, b) => b.rong - a.rong).slice(0, soTop),
    topBan: ds.filter((x) => x.rong < 0).sort((a, b) => a.rong - b.rong).slice(0, soTop),
    topLonMua: ds.filter((x) => x.lonRong > 0).sort((a, b) => b.lonRong - a.lonRong).slice(0, soTop),
    topLonBan: ds.filter((x) => x.lonRong < 0).sort((a, b) => a.lonRong - b.lonRong).slice(0, soTop),
    nganh: [...nganh.values()].map((g) => ({ ten: g.ten, soMa: g.soMa, mua: lam(g.mua), ban: lam(g.ban), rong: lam(g.mua - g.ban), lonRong: lam(g.lonRong), nnRong: lam(g.nnRong) })).sort((a, b) => b.rong - a.rong),
  };
}
