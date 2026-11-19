// Cac "primitive" ve them len bieu do lightweight-charts (thu vien khong co san) - DaiMay, DaiGia va VachNgay (vach chia phien, xem ben duoi):
//   DaiMay - to mau vung giua 2 duong (may Ichimoku, vung can bang dai han), doi mau khi 2 duong cat nhau.
//   DaiGia - dai gia nam ngang toan bo bieu do (vung mua / cat lo / chot loi), hoac 1 duong neu tu == den.
// Ca hai ve o lop duoi cung (nen nen phai o duoi) va chi ve lai khi bieu do yeu cau.

class LopVe {
  constructor(veFn) {
    this._veFn = veFn;
  }
  draw(target) {
    target.useMediaCoordinateSpace((scope) => this._veFn(scope.context, scope.mediaSize));
  }
}

class KhungNhin {
  constructor(veFn, lop = "bottom") {
    this._lop = new LopVe(veFn);
    this._z = lop;
  }
  zOrder() {
    return this._z;
  }
  renderer() {
    return this._lop;
  }
}

export class DaiMay {
  // diem: [{ time, a, b }] - a, b la gia 2 duong tai time (da loc bo diem thieu du lieu).
  constructor({ mauTren = "rgba(34,197,94,0.16)", mauDuoi = "rgba(239,68,68,0.16)" } = {}) {
    this._diem = [];
    this._mauTren = mauTren;
    this._mauDuoi = mauDuoi;
    this._hien = true;
    this._khung = new KhungNhin((ctx) => this._ve(ctx));
  }
  attached({ chart, series, requestUpdate }) {
    this._chart = chart;
    this._series = series;
    this._yeuCauVe = requestUpdate;
  }
  detached() {
    this._chart = null;
    this._series = null;
    this._yeuCauVe = null;
  }
  datDuLieu(diem) {
    this._diem = diem;
    this._yeuCauVe?.();
  }
  datHien(hien) {
    this._hien = hien;
    this._yeuCauVe?.();
  }
  updateAllViews() {}
  paneViews() {
    return [this._khung];
  }
  _ve(ctx) {
    if (!this._hien || !this._chart || !this._series || this._diem.length < 2) return;
    const truc = this._chart.timeScale();
    const p = [];
    for (const d of this._diem) {
      const x = truc.timeToCoordinate(d.time);
      const ya = this._series.priceToCoordinate(d.a);
      const yb = this._series.priceToCoordinate(d.b);
      if (x == null || ya == null || yb == null) continue;
      p.push({ x, ya, yb, hieu: d.a - d.b });
    }
    const tamGiac = (pts, mau) => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = mau;
      ctx.fill();
    };
    for (let i = 1; i < p.length; i++) {
      const p0 = p[i - 1];
      const p1 = p[i];
      if (p0.hieu * p1.hieu >= 0) {
        tamGiac([[p0.x, p0.ya], [p1.x, p1.ya], [p1.x, p1.yb], [p0.x, p0.yb]], p0.hieu + p1.hieu >= 0 ? this._mauTren : this._mauDuoi);
      } else {
        // 2 duong cat nhau giua 2 nen: tach thanh 2 tam giac de doi mau dung cho giao diem.
        const s = p0.hieu / (p0.hieu - p1.hieu);
        const xc = p0.x + (p1.x - p0.x) * s;
        const yc = p0.ya + (p1.ya - p0.ya) * s;
        tamGiac([[p0.x, p0.ya], [xc, yc], [p0.x, p0.yb]], p0.hieu >= 0 ? this._mauTren : this._mauDuoi);
        tamGiac([[xc, yc], [p1.x, p1.ya], [p1.x, p1.yb]], p1.hieu >= 0 ? this._mauTren : this._mauDuoi);
      }
    }
  }
}

// VachNgay - vach DOC net dut chia cac PHIEN (khung trong ngay), dat giua nen cuoi phien truoc va nen dau phien moi, kem nhan ngay nho o dinh.
// moc: [{ time (nen dau phien), truoc (time nen cuoi phien truoc | null), nhan }]
export class VachNgay {
  constructor({ mau = "rgba(148,163,184,0.45)", mauChu = "rgba(148,163,184,0.9)" } = {}) {
    this._moc = [];
    this._hien = true;
    this._mau = mau;
    this._mauChu = mauChu;
    this._khung = new KhungNhin((ctx, kichThuoc) => this._ve(ctx, kichThuoc));
  }
  attached({ chart, requestUpdate }) {
    this._chart = chart;
    this._yeuCauVe = requestUpdate;
  }
  detached() {
    this._chart = null;
    this._yeuCauVe = null;
  }
  datDuLieu(moc) {
    this._moc = moc;
    this._yeuCauVe?.();
  }
  datHien(hien) {
    this._hien = hien;
    this._yeuCauVe?.();
  }
  updateAllViews() {}
  paneViews() {
    return [this._khung];
  }
  _ve(ctx, { width, height }) {
    if (!this._hien || !this._chart || !this._moc.length) return;
    const truc = this._chart.timeScale();
    ctx.save();
    ctx.font = "600 10px 'Open Sans', sans-serif";
    ctx.textBaseline = "top";
    let xCuoiNhan = -Infinity;
    for (const m of this._moc) {
      const x1 = truc.timeToCoordinate(m.time);
      if (x1 == null || x1 < 0 || x1 > width) continue;
      const x0 = m.truoc != null ? truc.timeToCoordinate(m.truoc) : null;
      const x = Math.round(x0 != null ? (x0 + x1) / 2 : x1) + 0.5;
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = this._mau;
      ctx.lineWidth = 1;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      // nhan ngay: bo qua neu de len nhan truoc (khi thu nho bieu do nhieu ngay)
      const rong = ctx.measureText(m.nhan).width;
      if (x + 4 > xCuoiNhan + 6 && x + 4 + rong < width) {
        ctx.fillStyle = this._mauChu;
        ctx.fillText(m.nhan, x + 4, 4);
        xCuoiNhan = x + 4 + rong;
      }
    }
    ctx.setLineDash([]);
    ctx.restore();
  }
}

export class DaiGia {
  // dai: [{ tu, den, mau, nhan, netDut }] - mau la chuoi "r,g,b".
  constructor() {
    this._dai = [];
    this._hien = true;
    this._khung = new KhungNhin((ctx, kichThuoc) => this._ve(ctx, kichThuoc));
  }
  attached({ series, requestUpdate }) {
    this._series = series;
    this._yeuCauVe = requestUpdate;
  }
  detached() {
    this._series = null;
    this._yeuCauVe = null;
  }
  // giaHienTai: chi de bo qua cac dai qua xa (> 30%) khi tu dong gian thang gia, tranh be nen ra qua nho.
  datDuLieu(dai, giaHienTai = null) {
    this._dai = dai;
    this._giaHienTai = giaHienTai;
    this._yeuCauVe?.();
  }
  datHien(hien) {
    this._hien = hien;
    this._yeuCauVe?.();
  }
  updateAllViews() {}
  paneViews() {
    return [this._khung];
  }
  autoscaleInfo() {
    if (!this._hien) return null;
    const g = this._giaHienTai;
    const gan = this._dai.filter((d) => !g || (Math.abs(d.tu / g - 1) <= 0.3 && Math.abs(d.den / g - 1) <= 0.3));
    if (!gan.length) return null;
    return {
      priceRange: {
        minValue: Math.min(...gan.map((d) => Math.min(d.tu, d.den))),
        maxValue: Math.max(...gan.map((d) => Math.max(d.tu, d.den))),
      },
    };
  }
  _ve(ctx, { width }) {
    if (!this._hien || !this._series) return;
    ctx.font = "600 11px 'Open Sans', sans-serif";
    ctx.textBaseline = "top";
    for (const d of this._dai) {
      const y1 = this._series.priceToCoordinate(d.den);
      const y2 = this._series.priceToCoordinate(d.tu);
      if (y1 == null || y2 == null) continue;
      const tren = Math.min(y1, y2);
      const cao = Math.max(Math.abs(y2 - y1), 1);
      const laDuong = cao <= 2;
      if (laDuong) {
        ctx.beginPath();
        ctx.setLineDash(d.netDut ? [5, 4] : []);
        ctx.strokeStyle = `rgba(${d.mau},0.85)`;
        ctx.lineWidth = 1;
        ctx.moveTo(0, tren);
        ctx.lineTo(width, tren);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = `rgba(${d.mau},0.14)`;
        ctx.fillRect(0, tren, width, cao);
        ctx.fillStyle = `rgba(${d.mau},0.7)`;
        ctx.fillRect(0, tren, width, 1);
        ctx.fillRect(0, tren + cao - 1, width, 1);
      }
      if (d.nhan) {
        const rong = ctx.measureText(d.nhan).width;
        ctx.fillStyle = `rgba(${d.mau},1)`;
        ctx.fillText(d.nhan, Math.max(4, width - rong - 8), laDuong ? tren - 13 : tren + 3);
      }
    }
  }
}

// NhanSo - chu nho tai (time, gia) tren bieu do (vd so 1 / 2 / 3 cua ML Adaptive SuperTrend). diem: [{ time, gia, text, mau }].
// Chi ve khi nen du rong (>= 6px) de khong roi; ve tren nen.
export class NhanSo {
  constructor() {
    this._diem = [];
    this._hien = true;
    this._khung = new KhungNhin((ctx, kichThuoc) => this._ve(ctx, kichThuoc), "top");
  }
  attached({ chart, series, requestUpdate }) {
    this._chart = chart;
    this._series = series;
    this._yeuCauVe = requestUpdate;
  }
  detached() {
    this._chart = null;
    this._series = null;
    this._yeuCauVe = null;
  }
  datDuLieu(diem) {
    this._diem = diem;
    this._yeuCauVe?.();
  }
  datHien(hien) {
    this._hien = hien;
    this._yeuCauVe?.();
  }
  updateAllViews() {}
  paneViews() {
    return [this._khung];
  }
  _ve(ctx, { width }) {
    if (!this._hien || !this._chart || !this._series || !this._diem.length) return;
    const truc = this._chart.timeScale();
    const rongNen = truc.options().barSpacing;
    if (!(rongNen >= 6)) return;
    ctx.save();
    ctx.font = `600 ${rongNen >= 10 ? 10 : 9}px 'Open Sans', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const d of this._diem) {
      const x = truc.timeToCoordinate(d.time);
      if (x == null || x < -10 || x > width + 10) continue;
      const y = this._series.priceToCoordinate(d.gia);
      if (y == null) continue;
      ctx.fillStyle = d.mau;
      ctx.fillText(d.text, x, y);
    }
    ctx.restore();
  }
}

// FOOTPRINT (lib/footprint.js, /api/footprint): moi nen ve tung muc gia - BEN TRAI la KL ban chu dong (do), BEN PHAI la KL mua chu dong (xanh),
// xam = khop khong ro chieu (ATO / ATC). Muc gia tu gop lai khi phong nho (moi hang >= 3 px; co so khi nen rong >= 50 px - luc do moi hang >= 11 px).
// Vien vang = muc gia khop nhieu nhat cua nen (POC). Muc dam mau = lech 1 ben >= 3 lan. Duoi nen: chenh lech mua - ban (delta).
const BUOC_DEP = [1, 2, 5, 10, 20, 50, 100, 200, 500];
const soGon = (v) => (v >= 10000 ? `${Math.round(v / 1000)}k` : v >= 1000 ? `${(v / 1000).toFixed(1).replace(".", ",")}k` : String(v));
export class Footprint {
  constructor() {
    this._du = null;
    this._hien = false;
    this._thongBao = "";
    this._mauChu = "#E5E7EB";
    this._khung = new KhungNhin((ctx, kichThuoc) => this._ve(ctx, kichThuoc), "top");
  }
  attached({ chart, series, requestUpdate }) {
    this._chart = chart;
    this._series = series;
    this._yeuCauVe = requestUpdate;
  }
  detached() {
    this._chart = null;
    this._series = null;
    this._yeuCauVe = null;
  }
  // du: { buoc, nen: [{ t, muc: [[gia, mua, ban, khac]], mua, ban, khac, poc }] } hoac null
  datDuLieu(du, thongBao = "") {
    this._du = du;
    this._thongBao = thongBao;
    this._yeuCauVe?.();
  }
  datHien(hien) {
    this._hien = hien;
    this._yeuCauVe?.();
  }
  datMauChu(mau) {
    if (mau) this._mauChu = mau;
    this._yeuCauVe?.();
  }
  updateAllViews() {}
  paneViews() {
    return [this._khung];
  }
  _ve(ctx, { width, height }) {
    if (!this._hien || !this._chart || !this._series) return;
    ctx.save();
    ctx.font = "600 11px 'Open Sans', sans-serif";
    const truc = this._chart.timeScale();
    const rongNen = truc.options().barSpacing;
    const thongBao = this._thongBao || (!this._du?.nen?.length ? "Footprint: đang tải…" : rongNen < 10 ? "Footprint: phóng to biểu đồ để xem (lăn chuột)" : "");
    if (thongBao) {
      ctx.fillStyle = this._mauChu;
      ctx.globalAlpha = 0.75;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(thongBao, width / 2, 8);
      ctx.globalAlpha = 1;
    }
    if (!this._du?.nen?.length || rongNen < 10) return ctx.restore();
    const goc = this._du.buoc || 0.1;
    const y0 = this._series.priceToCoordinate(1000), y1 = this._series.priceToCoordinate(1000 + goc);
    const pxMoiBuoc = y0 != null && y1 != null ? Math.abs(y0 - y1) : 0;
    if (!(pxMoiBuoc > 0)) return ctx.restore();
    const coSo = rongNen >= 50;
    const canHang = coSo ? 11 : 3;
    const k = BUOC_DEP.find((b) => b * pxMoiBuoc >= canHang) ?? BUOC_DEP.at(-1);
    const B = Math.round(goc * k * 1000) / 1000; // buoc hien thi (diem)
    const caoHang = k * pxMoiBuoc;
    const nua = rongNen * 0.46;
    const tick = goc; // gia thap nhat trong 1 o goc (o goc chua [g, g + goc))
    for (const b of this._du.nen) {
      const x = truc.timeToCoordinate(b.t);
      if (x == null || x < -rongNen || x > width + rongNen) continue;
      // gop muc theo buoc hien thi
      const gop = new Map();
      for (const [g, mua, ban, khac] of b.muc) {
        const key = Math.floor(g / B + 1e-6);
        let o = gop.get(key);
        if (!o) gop.set(key, (o = [key * B, 0, 0, 0]));
        o[1] += mua;
        o[2] += ban;
        o[3] += khac;
      }
      const hang = [...gop.values()];
      let max = 0, poc = null, maxTong = -1, giaThap = Infinity;
      for (const o of hang) {
        max = Math.max(max, o[1] + o[3] / 2, o[2] + o[3] / 2);
        const tong = o[1] + o[2] + o[3];
        if (tong > maxTong) { maxTong = tong; poc = o; }
        giaThap = Math.min(giaThap, o[0]);
      }
      if (!(max > 0)) continue;
      for (const o of hang) {
        const giua = o[0] + (B - tick) / 2;
        const yc = this._series.priceToCoordinate(giua);
        if (yc == null || yc < -caoHang || yc > height + caoHang) continue;
        const top = yc - caoHang / 2 + (caoHang > 4 ? 0.5 : 0);
        const h = Math.max(1, caoHang - (caoHang > 4 ? 1 : 0));
        const [, mua, ban, khac] = o;
        const wM = (nua * mua) / max, wB = (nua * ban) / max, wK = (nua * khac) / 2 / max;
        if (wK > 0) {
          ctx.fillStyle = "rgba(148,163,184,0.45)";
          ctx.fillRect(x - wB - wK, top, wK, h);
          ctx.fillRect(x + wM, top, wK, h);
        }
        const lechMua = mua >= 3 * Math.max(ban, 1) && mua >= 5, lechBan = ban >= 3 * Math.max(mua, 1) && ban >= 5;
        ctx.fillStyle = lechBan ? "rgba(239,68,68,0.9)" : "rgba(239,68,68,0.5)";
        ctx.fillRect(x - wB, top, wB, h);
        ctx.fillStyle = lechMua ? "rgba(34,197,94,0.9)" : "rgba(34,197,94,0.5)";
        ctx.fillRect(x, top, wM, h);
        if (o === poc && caoHang >= 3) {
          ctx.strokeStyle = "#F6C544";
          ctx.lineWidth = 1;
          ctx.strokeRect(x - nua + 0.5, top + 0.5, nua * 2 - 1, h - 1);
        }
        if (coSo && caoHang >= 11) {
          ctx.font = `600 ${caoHang >= 14 ? 10 : 9}px 'Open Sans', sans-serif`;
          ctx.textBaseline = "middle";
          ctx.fillStyle = this._mauChu;
          ctx.textAlign = "right";
          ctx.fillText(soGon(ban + Math.round(khac / 2)), x - 3, yc);
          ctx.textAlign = "left";
          ctx.fillText(soGon(mua + Math.round(khac / 2)), x + 3, yc);
        }
      }
      // vach giua + delta duoi nen
      ctx.fillStyle = "rgba(148,163,184,0.6)";
      const yTren = this._series.priceToCoordinate(hang.reduce((m, o) => Math.max(m, o[0]), -Infinity) + (B - tick) / 2);
      const yDuoi = this._series.priceToCoordinate(giaThap + (B - tick) / 2);
      if (yTren != null && yDuoi != null) ctx.fillRect(x - 0.5, yTren - caoHang / 2, 1, yDuoi - yTren + caoHang);
      if (rongNen >= 26 && yDuoi != null) {
        const d = b.mua - b.ban;
        ctx.font = `700 ${rongNen >= 50 ? 11 : 9}px 'Open Sans', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = d >= 0 ? "#22C55E" : "#EF4444";
        ctx.fillText((d > 0 ? "+" : d < 0 ? "−" : "") + soGon(Math.abs(d)), x, yDuoi + caoHang / 2 + 3);
      }
    }
    ctx.restore();
  }
}
