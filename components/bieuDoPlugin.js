// Hai "primitive" ve them len bieu do lightweight-charts (thu vien khong co san):
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
  constructor(veFn) {
    this._lop = new LopVe(veFn);
  }
  zOrder() {
    return "bottom";
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
    ctx.font = "600 11px Inter, sans-serif";
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
