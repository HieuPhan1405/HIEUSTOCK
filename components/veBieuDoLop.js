// LOP VE (cong cu ke ve) tren bieu do ky thuat (2026-10-13): canvas phu len bieu do lightweight-charts, luu hinh theo (chi so nen logic, gia) nen khong lech khi keo / thu phong.
// Khong phai React: BieuDoKyThuat tao 1 doi tuong LopVe sau khi tao chart, chi goi cac ham datXxx; moi thay doi (them / sua / xoa) goi onThayDoi(danhSach) de React luu localStorage.
// Cong cu: xuHuong (doan thang), tia (keo dai sang phai), ngang, doc, chuNhat, fib (Fibonacci hoi quy), thuoc (do % va so nen).
// Khong dung cong cu: bieu do keo / thu phong binh thuong; bam vao hinh ve de chon, keo diem dau mut de sua, Delete de xoa. Co cong cu: moi cu bam / keo tren bieu do la ve (Esc huy).
import { soVN, pctVN } from "@/lib/soVN";

export const CONG_CU_2_DIEM = ["xuHuong", "tia", "chuNhat", "fib", "thuoc"];
export const MUC_FIB = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const KHOANG_CHON = 8; // px
const KHOANG_HIT_GIA = 14; // px: hit nam cham gia O/H/L/C

let boDem = 0;
const taoId = () => `v${Date.now().toString(36)}${(boDem++).toString(36)}`;

function khoangCachDoan(px, py, x1, y1, x2, y2, keoDai = false) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d2 = dx * dx + dy * dy;
  let t = d2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / d2;
  t = keoDai ? Math.max(0, t) : Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export class LopVe {
  constructor({ khung, chart, series, onThayDoi, onCongCu, onChon }) {
    this.khung = khung; // div chua bieu do (position: relative)
    this.chart = chart;
    this.series = series; // series nen (dung cho truc gia)
    this.onThayDoi = onThayDoi || (() => {});
    this.onCongCu = onCongCu || (() => {}); // goi khi ve xong -> React doi ve con tro
    this.onChon = onChon || (() => {});
    this.hinh = [];
    this.congCu = null; // null = con tro
    this.mau = "#F6C544";
    this.nen = [];
    this.hitGia = true;
    this.chon = null;
    this.dangVe = null; // { loai, p1, p2 }
    this.keo = null; // { id, diem: 'p1'|'p2' }
    this.bat = true;
    this.mauChu = "#9ca3af";
    this.mauNen = "#111827";
    this.sig = "";
    this.huy = false;
    this.canvas = document.createElement("canvas");
    Object.assign(this.canvas.style, { position: "absolute", inset: "0", pointerEvents: "none", zIndex: "5" });
    khung.appendChild(this.canvas);
    this.xuLyXuong = (e) => this._xuong(e);
    this.xuLyDiChuyen = (e) => this._diChuyen(e);
    this.xuLyLen = (e) => this._len(e);
    this.xuLyPhim = (e) => this._phim(e);
    khung.addEventListener("pointerdown", this.xuLyXuong, true);
    khung.addEventListener("pointermove", this.xuLyDiChuyen, true);
    window.addEventListener("pointerup", this.xuLyLen, true);
    window.addEventListener("keydown", this.xuLyPhim);
    this.ro = new ResizeObserver(() => this._doiKichThuoc());
    this.ro.observe(khung);
    this._doiKichThuoc();
    const vong = () => {
      if (this.huy) return;
      this._ve(false);
      this.raf = requestAnimationFrame(vong);
    };
    this.raf = requestAnimationFrame(vong);
  }

  // ---------- API cho React ----------
  datHinh(ds) {
    this.hinh = Array.isArray(ds) ? ds : [];
    if (!this.hinh.some((h) => h.id === this.chon)) this.chon = null;
    this._ve(true);
  }
  datNen(nen) {
    this.nen = nen || [];
  }
  datCongCu(c) {
    this.congCu = c || null;
    this.dangVe = null;
    this.khung.style.cursor = this.congCu ? "crosshair" : "";
    this._ve(true);
  }
  datMau(m) {
    this.mau = m;
    if (this.chon) {
      const h = this.hinh.find((x) => x.id === this.chon);
      if (h) {
        h.mau = m;
        this._xong();
      }
    }
  }
  datHitGia(v) {
    this.hitGia = !!v;
  }
  datMauGiaoDien({ mo, nen }) {
    this.mauChu = mo || this.mauChu;
    this.mauNen = nen || this.mauNen;
    this._ve(true);
  }
  xoaChon() {
    if (!this.chon) return false;
    this.hinh = this.hinh.filter((h) => h.id !== this.chon);
    this.chon = null;
    this.onChon(null);
    this._xong();
    return true;
  }
  xoaHet() {
    this.hinh = [];
    this.chon = null;
    this.onChon(null);
    this._xong();
  }
  huyLop() {
    this.huy = true;
    cancelAnimationFrame(this.raf);
    this.khung.removeEventListener("pointerdown", this.xuLyXuong, true);
    this.khung.removeEventListener("pointermove", this.xuLyDiChuyen, true);
    window.removeEventListener("pointerup", this.xuLyLen, true);
    window.removeEventListener("keydown", this.xuLyPhim);
    this.ro.disconnect();
    this.canvas.remove();
  }

  // ---------- noi bo ----------
  _xong() {
    this.onThayDoi(this.hinh.map((h) => ({ ...h })));
    this._ve(true);
  }
  _doiKichThuoc() {
    const r = this.khung.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.rong = r.width;
    this.cao = r.height;
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
    this.dpr = dpr;
    this._ve(true);
  }
  _x(i) {
    const x = this.chart.timeScale().logicalToCoordinate(i);
    return x == null ? null : x;
  }
  _y(p) {
    const y = this.series.priceToCoordinate(p);
    return y == null ? null : y;
  }
  _toaDo(e) {
    const r = this.khung.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  _chiDiem(x, y, hit = true) {
    const l = this.chart.timeScale().coordinateToLogical(x);
    const p = this.series.coordinateToPrice(y);
    if (l == null || p == null) return null;
    if (hit && this.hitGia) {
      const idx = Math.round(l);
      const b = this.nen[idx];
      if (b) {
        let tot = null;
        for (const gia of [b.o, b.h, b.l, b.c]) {
          const yy = this._y(gia);
          if (yy != null) {
            const d = Math.abs(yy - y);
            if (d < KHOANG_HIT_GIA && (tot == null || d < tot.d)) tot = { d, gia };
          }
        }
        if (tot) return { i: idx, p: tot.gia };
      }
    }
    return { i: l, p };
  }
  _diemPx(pt) {
    const x = this._x(pt.i);
    const y = this._y(pt.p);
    return x == null || y == null ? null : { x, y };
  }
  _chuKhungVe() {
    const k = this.chart.paneSize ? this.chart.paneSize(0) : null;
    return { W: k?.width ?? this.rong, H: k?.height ?? this.cao };
  }

  // hit test mot hinh: tra ve { cham: 'p1'|'p2'|'than' } hoac null
  _hit(h, x, y) {
    const a = this._diemPx(h.p1);
    if (!a) return null;
    if (Math.hypot(x - a.x, y - a.y) <= KHOANG_CHON + 2) return { cham: "p1" };
    const { W } = this._chuKhungVe();
    if (h.loai === "ngang") return Math.abs(y - a.y) <= KHOANG_CHON ? { cham: "than" } : null;
    if (h.loai === "doc") return Math.abs(x - a.x) <= KHOANG_CHON ? { cham: "than" } : null;
    const b = h.p2 ? this._diemPx(h.p2) : null;
    if (!b) return null;
    if (Math.hypot(x - b.x, y - b.y) <= KHOANG_CHON + 2) return { cham: "p2" };
    if (h.loai === "xuHuong" || h.loai === "thuoc") return khoangCachDoan(x, y, a.x, a.y, b.x, b.y) <= KHOANG_CHON ? { cham: "than" } : null;
    if (h.loai === "tia") return khoangCachDoan(x, y, a.x, a.y, b.x, b.y, true) <= KHOANG_CHON ? { cham: "than" } : null;
    if (h.loai === "chuNhat") {
      const x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x), y1 = Math.min(a.y, b.y), y2 = Math.max(a.y, b.y);
      const trong = x >= x1 - KHOANG_CHON && x <= x2 + KHOANG_CHON && y >= y1 - KHOANG_CHON && y <= y2 + KHOANG_CHON;
      const trongHan = x > x1 + KHOANG_CHON && x < x2 - KHOANG_CHON && y > y1 + KHOANG_CHON && y < y2 - KHOANG_CHON;
      return trong && !trongHan ? { cham: "than" } : null;
    }
    if (h.loai === "fib") {
      const x1 = Math.min(a.x, b.x);
      for (const m of MUC_FIB) {
        const yy = this._y(h.p1.p + (h.p2.p - h.p1.p) * m);
        if (yy != null && x >= x1 - KHOANG_CHON && x <= W && Math.abs(y - yy) <= KHOANG_CHON) return { cham: "than" };
      }
    }
    return null;
  }
  _timHinh(x, y) {
    // uu tien hinh dang chon, roi tu tren xuong (hinh moi nhat truoc)
    const ds = [...this.hinh].reverse();
    if (this.chon) ds.sort((a, b) => (a.id === this.chon ? -1 : b.id === this.chon ? 1 : 0));
    for (const h of ds) {
      const k = this._hit(h, x, y);
      if (k) return { h, ...k };
    }
    return null;
  }

  _xuong(e) {
    if (this.huy || e.button !== 0) return;
    const { x, y } = this._toaDo(e);
    const { W } = this._chuKhungVe();
    if (x > W + 2) return; // vung truc gia: de bieu do xu ly
    if (this.congCu) {
      e.stopPropagation();
      e.preventDefault();
      const pt = this._chiDiem(x, y);
      if (!pt) return;
      const c = this.congCu;
      if (c === "ngang" || c === "doc") {
        const h = { id: taoId(), loai: c, p1: pt, mau: this.mau };
        this.hinh.push(h);
        this.chon = h.id;
        this.onChon(h.id);
        this.onCongCu(null);
        this.congCu = null;
        this.khung.style.cursor = "";
        this._xong();
        return;
      }
      if (!this.dangVe) this.dangVe = { loai: c, p1: pt, p2: pt };
      else {
        const h = { id: taoId(), loai: c, p1: this.dangVe.p1, p2: pt, mau: this.mau };
        this.dangVe = null;
        this.hinh.push(h);
        this.chon = h.id;
        this.onChon(h.id);
        this.onCongCu(null);
        this.congCu = null;
        this.khung.style.cursor = "";
        this._xong();
      }
      this._ve(true);
      return;
    }
    // khong co cong cu: chon / keo hinh co san
    const k = this._timHinh(x, y);
    if (k) {
      e.stopPropagation();
      e.preventDefault();
      this.chon = k.h.id;
      this.onChon(k.h.id);
      if (k.cham === "p1" || k.cham === "p2") this.keo = { id: k.h.id, diem: k.cham, loai: "diem" };
      else this.keo = { id: k.h.id, diem: "than", loai: "than", x0: x, y0: y, goc: JSON.parse(JSON.stringify(k.h)) };
      this._ve(true);
    } else if (this.chon) {
      this.chon = null;
      this.onChon(null);
      this._ve(true);
    }
  }
  _diChuyen(e) {
    if (this.huy) return;
    const { x, y } = this._toaDo(e);
    if (this.congCu && this.dangVe) {
      const pt = this._chiDiem(x, y);
      if (pt) this.dangVe.p2 = pt;
      this._ve(true);
      return;
    }
    if (this.keo) {
      e.stopPropagation();
      const h = this.hinh.find((v) => v.id === this.keo.id);
      if (!h) return;
      if (this.keo.loai === "diem") {
        const pt = this._chiDiem(x, y);
        if (pt) h[this.keo.diem] = pt;
      } else {
        const l0 = this.chart.timeScale().coordinateToLogical(this.keo.x0);
        const l1 = this.chart.timeScale().coordinateToLogical(x);
        const p0 = this.series.coordinateToPrice(this.keo.y0);
        const p1 = this.series.coordinateToPrice(y);
        if (l0 != null && l1 != null && p0 != null && p1 != null) {
          const di = l1 - l0;
          const dp = p1 - p0;
          h.p1 = { i: this.keo.goc.p1.i + di, p: this.keo.goc.p1.p + dp };
          if (this.keo.goc.p2) h.p2 = { i: this.keo.goc.p2.i + di, p: this.keo.goc.p2.p + dp };
        }
      }
      this._ve(true);
      return;
    }
    if (!this.congCu) {
      const { W } = this._chuKhungVe();
      const k = x <= W ? this._timHinh(x, y) : null;
      this.khung.style.cursor = k ? (k.cham === "than" ? "move" : "grab") : "";
    }
  }
  _len() {
    if (this.keo) {
      this.keo = null;
      this._xong();
    }
  }
  _phim(e) {
    if (e.key === "Escape") {
      if (this.dangVe || this.congCu) {
        this.dangVe = null;
        this.congCu = null;
        this.khung.style.cursor = "";
        this.onCongCu(null);
        this._ve(true);
      } else if (this.chon) {
        this.chon = null;
        this.onChon(null);
        this._ve(true);
      }
      return;
    }
    if ((e.key === "Delete" || e.key === "Backspace") && this.chon) {
      const t = document.activeElement?.tagName;
      if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return;
      e.preventDefault();
      this.xoaChon();
    }
  }

  // ---------- ve ----------
  _ve(ep) {
    if (this.huy || !this.rong) return;
    // Chi ve lai khi co thay doi (hinh / truc toa do): chu ky = vi tri 2 diem tham chieu + so hinh.
    const sig = `${this.hinh.length}|${this.chon}|${!!this.dangVe}|${this._x(0)}|${this._x(100)}|${this.series.priceToCoordinate(1)}|${this.series.priceToCoordinate(100)}|${this.rong}|${this.cao}`;
    if (!ep && sig === this.sig) return;
    this.sig = sig;
    const ctx = this.canvas.getContext("2d");
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.rong, this.cao);
    const { W, H } = this._chuKhungVe();
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    const ds = this.dangVe ? [...this.hinh, { id: "_tam", ...this.dangVe, mau: this.mau, tam: true }] : this.hinh;
    for (const h of ds) this._veHinh(ctx, h, W, H);
    ctx.restore();
    // nhan gia o truc phai cho duong ngang
    for (const h of ds) if (h.loai === "ngang") this._nhanGia(ctx, h, W);
  }
  _nhanGia(ctx, h, W) {
    const y = this._y(h.p1.p);
    if (y == null) return;
    const chu = soVN(h.p1.p, 2, true);
    ctx.font = "11px 'JetBrains Mono', monospace";
    const w = ctx.measureText(chu).width + 10;
    ctx.fillStyle = h.mau;
    ctx.fillRect(W + 1, y - 9, Math.min(w, this.rong - W - 1), 18);
    ctx.fillStyle = "#111827";
    ctx.textBaseline = "middle";
    ctx.fillText(chu, W + 6, y);
  }
  _veHinh(ctx, h, W, H) {
    const a = this._diemPx(h.p1);
    if (!a) return;
    const chon = h.id === this.chon;
    ctx.lineWidth = chon ? 2 : 1.5;
    ctx.strokeStyle = h.mau;
    ctx.fillStyle = h.mau;
    ctx.setLineDash([]);
    ctx.textBaseline = "middle";
    ctx.font = "11px 'JetBrains Mono', monospace";
    const diem = (p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = this.mauNen;
      ctx.fill();
      ctx.strokeStyle = h.mau;
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    if (h.loai === "ngang") {
      ctx.beginPath();
      ctx.moveTo(0, a.y);
      ctx.lineTo(W, a.y);
      ctx.stroke();
      if (chon) diem({ x: Math.min(Math.max(a.x, 10), W - 10), y: a.y });
      return;
    }
    if (h.loai === "doc") {
      ctx.beginPath();
      ctx.moveTo(a.x, 0);
      ctx.lineTo(a.x, H);
      ctx.stroke();
      if (chon) diem({ x: a.x, y: Math.min(Math.max(a.y, 10), H - 10) });
      return;
    }
    const b = h.p2 ? this._diemPx(h.p2) : null;
    if (!b) return;
    if (h.loai === "xuHuong" || h.loai === "thuoc" || h.loai === "tia") {
      let x2 = b.x, y2 = b.y;
      if (h.loai === "tia" && b.x !== a.x) {
        const t = (W + 50 - a.x) / (b.x - a.x);
        if (t > 1 && b.x > a.x) { x2 = a.x + (b.x - a.x) * t; y2 = a.y + (b.y - a.y) * t; }
        else if (b.x < a.x) { const t2 = (-50 - a.x) / (b.x - a.x); x2 = a.x + (b.x - a.x) * t2; y2 = a.y + (b.y - a.y) * t2; }
      }
      if (h.loai === "thuoc") ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (h.loai === "thuoc") {
        const dp = h.p2.p - h.p1.p;
        const pc = h.p1.p ? (dp / h.p1.p) * 100 : 0;
        const nen = Math.round(h.p2.i - h.p1.i);
        const chu = `${pctVN(pc, 2)} (${dp >= 0 ? "+" : ""}${soVN(dp, 2, true)}) · ${Math.abs(nen)} nến`;
        const w = ctx.measureText(chu).width + 12;
        const bx = (a.x + b.x) / 2 - w / 2;
        const by = Math.min(a.y, b.y) - 24 < 4 ? Math.max(a.y, b.y) + 8 : Math.min(a.y, b.y) - 24;
        ctx.fillStyle = dp >= 0 ? "rgba(34,197,94,0.92)" : "rgba(239,68,68,0.92)";
        ctx.fillRect(bx, by, w, 18);
        ctx.fillStyle = "#fff";
        ctx.fillText(chu, bx + 6, by + 9);
      }
      if (chon || h.tam) {
        diem(a);
        diem(b);
      }
      return;
    }
    if (h.loai === "chuNhat") {
      const x1 = Math.min(a.x, b.x), y1 = Math.min(a.y, b.y), w = Math.abs(b.x - a.x), hh = Math.abs(b.y - a.y);
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = h.mau;
      ctx.fillRect(x1, y1, w, hh);
      ctx.globalAlpha = 1;
      ctx.strokeRect(x1, y1, w, hh);
      if (chon || h.tam) {
        diem(a);
        diem(b);
      }
      return;
    }
    if (h.loai === "fib") {
      const x1 = Math.min(a.x, b.x);
      const dp = h.p2.p - h.p1.p;
      let truoc = null;
      for (const m of MUC_FIB) {
        const gia = h.p1.p + dp * m;
        const y = this._y(gia);
        if (y == null) continue;
        if (truoc != null) {
          ctx.globalAlpha = 0.06;
          ctx.fillStyle = h.mau;
          ctx.fillRect(x1, Math.min(y, truoc), W - x1, Math.abs(y - truoc));
          ctx.globalAlpha = 1;
        }
        truoc = y;
        ctx.strokeStyle = h.mau;
        ctx.lineWidth = m === 0 || m === 1 ? 1.5 : 1;
        ctx.setLineDash(m === 0 || m === 1 ? [] : [4, 3]);
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(W, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = h.mau;
        ctx.fillText(`${soVN(m * 100, m === 0.236 || m === 0.786 ? 1 : 1)}%  ${soVN(gia, 2, true)}`, x1 + 6, y - 8);
      }
      ctx.strokeStyle = h.mau;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (chon || h.tam) {
        diem(a);
        diem(b);
      }
    }
  }
}
