// LOP VE (cong cu ke ve) tren bieu do ky thuat (2026-10-13, nang cap cung ngay): canvas phu len bieu do lightweight-charts, luu hinh theo (chi so nen logic, gia) nen khong lech khi keo / thu phong.
// Khong phai React: BieuDoKyThuat tao 1 doi tuong LopVe sau khi tao chart, chi goi cac ham datXxx; moi thay doi (them / sua / xoa) goi onThayDoi(danhSach) de React luu localStorage.
// Cong cu: xuHuong, tia, ngang, doc, chuNhat, fib, thuoc, mui (mui ten), chu (ghi chu), kenh (kenh song song, 3 diem), frvp (Volume Profile cua vung chon: 2 diem = 2 mep thoi gian), gapKhuc (duong dan: bam trai them tung doan, chuot phai / bam dup / Enter ket thuc).
// Cach ve: bam 2 lan, HOAC bam - keo - tha (nhu TradingView). Giu Space (hoac chuot giua) de keo bieu do khi dang chon cong cu. Esc thoat.
// Chinh sua: bam vao hinh de chon, keo than / dau mut; thanh nho hien canh hinh (do day / nhan ban / xoa); Delete xoa; chuot phai chon; Ctrl+Z hoan tac, Ctrl+Y / Ctrl+Shift+Z lam lai.
import { soVN, pctVN } from "@/lib/soVN";

export const MUC_FIB = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const LOAI_1_DIEM = ["ngang", "doc", "chu"];
const KHOANG_CHON = 10; // px (chuot); cam ung dung 18
const KHOANG_HIT_GIA = 14; // px: hit nam cham gia O/H/L/C
const NGUONG_KEO = 6; // px: keo xa hon muc nay thi tinh la "bam - keo - tha"
const TOI_DA_LICH_SU = 100;

let boDem = 0;
const taoId = () => `v${Date.now().toString(36)}${(boDem++).toString(36)}`;
const sao = (v) => JSON.parse(JSON.stringify(v));

function khoangCachDoan(px, py, x1, y1, x2, y2, keoDai = false) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d2 = dx * dx + dy * dy;
  let t = d2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / d2;
  t = keoDai ? Math.max(0, t) : Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export class LopVe {
  constructor({ khung, goc, chart, series, onThayDoi, onCongCu, onChon, onLichSu }) {
    this.khung = khung; // div chua bieu do (position: relative)
    this.goc = goc || khung; // phan tu goc cua ca khoi bieu do: bam trong do thi phim tat (Ctrl+Z, Delete...) moi co hieu luc
    this.chart = chart;
    this.series = series; // series nen (dung cho truc gia)
    this.onThayDoi = onThayDoi || (() => {});
    this.onCongCu = onCongCu || (() => {}); // goi khi ve xong -> React doi ve con tro
    this.onChon = onChon || (() => {});
    this.onLichSu = onLichSu || (() => {});
    this.hinh = [];
    this.congCu = null; // null = con tro
    this.giu = false; // true: ve xong van giu cong cu de ve tiep
    this.mau = "#F6C544";
    this.nen = [];
    this.hitGia = false; // mac dinh TAT (nam cham gia chi bat khi nguoi dung chon)
    this.chon = null;
    this.dangVe = null; // { loai, p1, p2, p3, buoc }
    this.xuongTai = null; // vi tri bam dau tien (de nhan ra "keo")
    this.keo = null;
    this.space = false;
    this.hoat = false;
    this.tol = KHOANG_CHON;
    this.mauChu = "#9ca3af";
    this.mauNen = "#111827";
    this.sig = "";
    this.huy = false;
    this.ls = [JSON.stringify([])];
    this.vt = 0;
    // VOLUME PROFILE: hoSo = ho so cua vung dang xem (React tinh roi dua vao); nguonHoSo(i1, i2) = ham tinh ho so cho hinh "frvp" (vung chon)
    this.hoSo = null;
    this.ff = []; // lich su free float theo quy [{ d, ff, sh }] (app/api/free-float) - cho nhan "vong quay co phieu troi noi" cua hinh chu nhat
    this.nguonHoSo = null;
    this.pbHoSo = 0;
    this.boNhoHoSo = new Map();
    this.canvas = document.createElement("canvas");
    Object.assign(this.canvas.style, { position: "absolute", inset: "0", pointerEvents: "none", zIndex: "5" });
    khung.appendChild(this.canvas);
    this._taoThanh();
    this.xuLyXuong = (e) => this._xuong(e);
    this.xuLyDiChuyen = (e) => this._diChuyen(e);
    this.xuLyLen = (e) => this._len(e);
    this.xuLyPhim = (e) => this._phim(e);
    this.xuLyNha = (e) => this._nhaPhim(e);
    this.xuLyToanCuc = (e) => {
      this.hoat = this.goc.contains(e.target);
    };
    this.xuLyMenu = (e) => this._menu(e);
    this.xuLyMat = () => {
      this.space = false;
    };
    khung.addEventListener("pointerdown", this.xuLyXuong, true);
    khung.addEventListener("pointermove", this.xuLyDiChuyen, true);
    khung.addEventListener("contextmenu", this.xuLyMenu, true);
    window.addEventListener("pointerdown", this.xuLyToanCuc, true);
    window.addEventListener("pointerup", this.xuLyLen, true);
    window.addEventListener("keydown", this.xuLyPhim);
    window.addEventListener("keyup", this.xuLyNha);
    window.addEventListener("blur", this.xuLyMat);
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
    this.dangVe = null;
    this.ls = [JSON.stringify(this.hinh)];
    this.vt = 0;
    this._baoLichSu();
    this._ve(true);
  }
  datNen(nen) {
    this.nen = nen || [];
  }
  // Ho so khoi luong cua vung dang xem (null = tat). Ve o mep phai cua so gia.
  datHoSo(hs) {
    this.hoSo = hs || null;
    this._ve(true);
  }
  // Ham (i1, i2) => ho so khoi luong cho khoang nen [i1, i2] - dung cho hinh "frvp". Goi lai moi khi du lieu doi de xoa bo nho dem.
  datNguonHoSo(fn) {
    this.nguonHoSo = fn || null;
    this.pbHoSo++;
    this.boNhoHoSo.clear();
    this._ve(true);
  }
  datFreeFloat(ds) {
    this.ff = Array.isArray(ds) ? ds : [];
    this._ve(true);
  }
  // Thong ke cua hinh chu nhat: khoi luong trong vung (khoi luong moi nen chia deu theo khoang low-high, chi tinh phan roi vao khoang gia) / so co phieu tu do chuyen nhuong.
  _thongKeVung(h) {
    const n = this.nen.length;
    if (!n || !h.p1 || !h.p2) return null;
    const i1 = Math.max(0, Math.round(Math.min(h.p1.i, h.p2.i)));
    const i2 = Math.min(n - 1, Math.round(Math.max(h.p1.i, h.p2.i)));
    const lo = Math.min(h.p1.p, h.p2.p);
    const hi = Math.max(h.p1.p, h.p2.p);
    if (i2 < i1 || !(hi > lo)) return null;
    let kl = 0;
    for (let j = i1; j <= i2; j++) {
      const b = this.nen[j];
      if (!b || !(b.v > 0) || b.h <= lo || b.l >= hi) continue;
      kl += b.h === b.l ? b.v : (b.v * (Math.min(b.h, hi) - Math.max(b.l, lo))) / (b.h - b.l);
    }
    const t = this.nen[i2]?.t;
    let rec = null;
    if (typeof t === "string" && this.ff.length) {
      for (const x of this.ff) {
        if (x.d <= t) rec = x;
        else break;
      }
      rec ??= this.ff[0];
    }
    const troi = rec ? rec.ff * rec.sh : null;
    return { kl, nen: i2 - i1 + 1, ff: rec?.ff ?? null, troi, F: troi ? kl / troi : null };
  }
  datCongCu(c) {
    this.congCu = c || null;
    this.dangVe = null;
    this._capNhatCon();
    this._ve(true);
  }
  datGiu(v) {
    this.giu = !!v;
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
    this._kieuThanh();
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
    if (!this.hinh.length) return;
    this.hinh = [];
    this.chon = null;
    this.onChon(null);
    this._xong();
  }
  nhanBan() {
    const h = this.hinh.find((x) => x.id === this.chon);
    if (!h) return;
    const b = sao(h);
    b.id = taoId();
    b.p1.i += 3;
    if (b.p2) b.p2.i += 3;
    if (b.p3) b.p3.i += 3;
    if (b.ds) {
      for (const q of b.ds) q.i += 3;
      b.p1 = b.ds[0];
    }
    this.hinh.push(b);
    this.chon = b.id;
    this.onChon(b.id);
    this._xong();
  }
  doiDam() {
    const h = this.hinh.find((x) => x.id === this.chon);
    if (!h) return;
    const cur = h.dam || 1.5;
    h.dam = cur < 1.6 ? 2.5 : cur < 2.6 ? 4 : 1.5;
    this._xong();
  }
  hoanTac() {
    if (this.vt <= 0) return false;
    this.vt--;
    this._ap(this.ls[this.vt]);
    return true;
  }
  lamLai() {
    if (this.vt >= this.ls.length - 1) return false;
    this.vt++;
    this._ap(this.ls[this.vt]);
    return true;
  }
  huyLop() {
    this.huy = true;
    cancelAnimationFrame(this.raf);
    this.khung.removeEventListener("pointerdown", this.xuLyXuong, true);
    this.khung.removeEventListener("pointermove", this.xuLyDiChuyen, true);
    this.khung.removeEventListener("contextmenu", this.xuLyMenu, true);
    window.removeEventListener("pointerdown", this.xuLyToanCuc, true);
    window.removeEventListener("pointerup", this.xuLyLen, true);
    window.removeEventListener("keydown", this.xuLyPhim);
    window.removeEventListener("keyup", this.xuLyNha);
    window.removeEventListener("blur", this.xuLyMat);
    this.ro.disconnect();
    this.canvas.remove();
    this.thanh.remove();
    this.khung.style.touchAction = "";
  }

  // ---------- noi bo ----------
  _ap(chuoi) {
    this.hinh = JSON.parse(chuoi);
    if (!this.hinh.some((h) => h.id === this.chon)) {
      this.chon = null;
      this.onChon(null);
    }
    this.dangVe = null;
    this.onThayDoi(this.hinh.map((h) => ({ ...h })));
    this._baoLichSu();
    this._ve(true);
  }
  _baoLichSu() {
    this.onLichSu({ coHoanTac: this.vt > 0, coLamLai: this.vt < this.ls.length - 1 });
  }
  // Ghi nhan 1 thay doi da hoan tat: luu lich su (neu co doi that su), bao React luu localStorage.
  _xong() {
    const s = JSON.stringify(this.hinh);
    if (s !== this.ls[this.vt]) {
      this.ls = this.ls.slice(0, this.vt + 1);
      this.ls.push(s);
      if (this.ls.length > TOI_DA_LICH_SU) this.ls.shift();
      this.vt = this.ls.length - 1;
    }
    this.onThayDoi(this.hinh.map((h) => ({ ...h })));
    this._baoLichSu();
    this._ve(true);
  }
  _capNhatCon() {
    this.khung.style.cursor = this.congCu ? (this.space ? "grab" : "crosshair") : "";
    // cam ung: dang ve / dang chon hinh thi khong de trinh duyet cuon trang
    this.khung.style.touchAction = this.congCu || this.chon ? "none" : "";
  }
  _doiKichThuoc() {
    const r = this.khung.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.rong = r.width;
    this.cao = r.height;
    // Kich thuoc CSS PHAI dat ro (canvas la phan tu thay the, "inset: 0" khong keo gian no): neu khong, man hinh phong to 125% / 150% se ve lech hinh so voi con tro.
    this.canvas.style.width = `${r.width}px`;
    this.canvas.style.height = `${r.height}px`;
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
    if (!pt) return null;
    const x = this._x(pt.i);
    const y = this._y(pt.p);
    return x == null || y == null ? null : { x, y };
  }
  _chuKhungVe() {
    const k = this.chart.paneSize ? this.chart.paneSize(0) : null;
    return { W: k?.width ?? this.rong, H: k?.height ?? this.cao };
  }
  _rongChu(h) {
    const ctx = this.canvas.getContext("2d");
    ctx.font = "600 13px 'Open Sans', sans-serif";
    return ctx.measureText(h.chu || "").width;
  }
  // doan song song thu 2 cua kenh: tra ve { a2, b2 } theo px
  _kenh2(h, a, b) {
    const c = this._diemPx(h.p3);
    if (!c) return null;
    const m = b.x === a.x ? 0 : (b.y - a.y) / (b.x - a.x);
    const dy = c.y - (a.y + m * (c.x - a.x));
    return { a2: { x: a.x, y: a.y + dy }, b2: { x: b.x, y: b.y + dy }, c };
  }

  // hit test mot hinh: tra ve { cham: 'p1'|'p2'|'p3'|'than' } hoac null
  _hit(h, x, y) {
    if (h.loai === "frvp") {
      const k = this._khungFrvp(h);
      if (!k) return null;
      if (Math.hypot(x - k.a.x, y - k.yGiua) <= this.tol + 2) return { cham: "p1" };
      if (Math.hypot(x - k.b.x, y - k.yGiua) <= this.tol + 2) return { cham: "p2" };
      return x >= k.x1 - this.tol && x <= k.x2 + this.tol && y >= k.yTren - this.tol && y <= k.yDuoi + this.tol ? { cham: "than" } : null;
    }
    if (h.loai === "gapKhuc") {
      const px = (h.ds || []).map((p) => this._diemPx(p));
      for (let k = 0; k < px.length; k++) if (px[k] && Math.hypot(x - px[k].x, y - px[k].y) <= this.tol + 2) return { cham: `d${k}` };
      for (let k = 1; k < px.length; k++) if (px[k - 1] && px[k] && khoangCachDoan(x, y, px[k - 1].x, px[k - 1].y, px[k].x, px[k].y) <= this.tol) return { cham: "than" };
      return null;
    }
    const a = this._diemPx(h.p1);
    if (!a) return null;
    const T = this.tol;
    if (Math.hypot(x - a.x, y - a.y) <= T + 2) return { cham: "p1" };
    const { W } = this._chuKhungVe();
    if (h.loai === "ngang") return Math.abs(y - a.y) <= T ? { cham: "than" } : null;
    if (h.loai === "doc") return Math.abs(x - a.x) <= T ? { cham: "than" } : null;
    if (h.loai === "chu") {
      const w = this._rongChu(h);
      return x >= a.x - 4 && x <= a.x + w + 6 && Math.abs(y - a.y) <= 11 ? { cham: "than" } : null;
    }
    const b = h.p2 ? this._diemPx(h.p2) : null;
    if (!b) return null;
    if (Math.hypot(x - b.x, y - b.y) <= T + 2) return { cham: "p2" };
    if (h.loai === "xuHuong" || h.loai === "thuoc" || h.loai === "mui") return khoangCachDoan(x, y, a.x, a.y, b.x, b.y) <= T ? { cham: "than" } : null;
    if (h.loai === "tia") return khoangCachDoan(x, y, a.x, a.y, b.x, b.y, true) <= T ? { cham: "than" } : null;
    if (h.loai === "kenh") {
      const k = this._kenh2(h, a, b);
      if (!k) return khoangCachDoan(x, y, a.x, a.y, b.x, b.y) <= T ? { cham: "than" } : null;
      if (Math.hypot(x - k.c.x, y - k.c.y) <= T + 2) return { cham: "p3" };
      if (khoangCachDoan(x, y, a.x, a.y, b.x, b.y) <= T || khoangCachDoan(x, y, k.a2.x, k.a2.y, k.b2.x, k.b2.y) <= T) return { cham: "than" };
      return null;
    }
    if (h.loai === "chuNhat") {
      const x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x), y1 = Math.min(a.y, b.y), y2 = Math.max(a.y, b.y);
      const trong = x >= x1 - T && x <= x2 + T && y >= y1 - T && y <= y2 + T;
      // chon duoc ca khi bam vao BEN TRONG hinh (de tim hon la chi canh vien)
      return trong ? { cham: "than" } : null;
    }
    if (h.loai === "fib") {
      const x1 = Math.min(a.x, b.x);
      for (const m of MUC_FIB) {
        const yy = this._y(h.p1.p + (h.p2.p - h.p1.p) * m);
        if (yy != null && x >= x1 - T && x <= W && Math.abs(y - yy) <= T) return { cham: "than" };
      }
      if (khoangCachDoan(x, y, a.x, a.y, b.x, b.y) <= T) return { cham: "than" };
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
  _chonHinh(id) {
    this.chon = id;
    this.onChon(id);
    this._capNhatCon();
  }
  _hoanTat(h) {
    this.hinh.push(h);
    this.dangVe = null;
    this._chonHinh(h.id);
    if (!this.giu) {
      this.congCu = null;
      this.onCongCu(null);
    }
    this._capNhatCon();
    this._xong();
  }
  _hinhMoi(loai, p1, p2, p3) {
    const h = { id: taoId(), loai, p1, mau: this.mau, dam: 1.5 };
    if (p2) h.p2 = p2;
    if (p3) h.p3 = p3;
    return h;
  }

  _xuong(e) {
    if (this.huy || e.button !== 0) return;
    if (this.thanh.contains(e.target)) return; // bam vao thanh nho: de nut xu ly
    const { x, y } = this._toaDo(e);
    const { W, H } = this._chuKhungVe();
    if (x > W + 2) return; // vung truc gia: de bieu do xu ly
    this.tol = e.pointerType === "touch" ? 18 : KHOANG_CHON;
    if (this.congCu) {
      if (this.space || y > H) return; // giu Space: keo bieu do; o cua so chi bao phu: khong ve
      e.stopPropagation();
      e.preventDefault();
      const pt = this._chiDiem(x, y);
      if (!pt) return;
      const c = this.congCu;
      if (LOAI_1_DIEM.includes(c)) {
        const h = this._hinhMoi(c, pt);
        if (c === "chu") {
          const t = window.prompt("Nội dung ghi chú:", "");
          if (!t || !t.trim()) {
            this.dangVe = null;
            this._ve(true);
            return;
          }
          h.chu = t.trim().slice(0, 80);
        }
        this._hoanTat(h);
        return;
      }
      if (c === "gapKhuc") {
        // duong dan: moi lan bam trai them 1 diem (1 doan); chuot phai / bam dup / Enter moi dung
        if (!this.dangVe) {
          this.dangVe = { loai: c, p1: pt, p2: pt, ds: [pt], cur: pt, buoc: 3 };
        } else {
          const cuoi = this._diemPx(this.dangVe.ds[this.dangVe.ds.length - 1]);
          if (cuoi && Math.hypot(x - cuoi.x, y - cuoi.y) < 4) this._ketThucGapKhuc(); // bam dup tai diem cuoi = ket thuc
          else this.dangVe.ds.push(pt);
        }
        this._ve(true);
        return;
      }
      if (!this.dangVe) {
        this.dangVe = { loai: c, p1: pt, p2: pt, p3: null, buoc: 1 };
        this.xuongTai = { x, y };
      } else if (this.dangVe.buoc === 1) {
        const a = this._diemPx(this.dangVe.p1);
        if (a && Math.hypot(x - a.x, y - a.y) < 3) return; // bam trung diem dau: bo qua
        this._datDiem2(pt);
      } else {
        this.dangVe.p3 = pt;
        const d = this.dangVe;
        this._hoanTat(this._hinhMoi(d.loai, d.p1, d.p2, d.p3));
        return;
      }
      this._ve(true);
      return;
    }
    // khong co cong cu: chon / keo hinh co san
    const k = y <= H ? this._timHinh(x, y) : null;
    if (k) {
      e.stopPropagation();
      e.preventDefault();
      this._chonHinh(k.h.id);
      if (k.cham === "p1" || k.cham === "p2" || k.cham === "p3" || /^d\d+$/.test(k.cham)) this.keo = { id: k.h.id, diem: k.cham, loai: "diem" };
      else this.keo = { id: k.h.id, diem: "than", loai: "than", x0: x, y0: y, goc: sao(k.h) };
      this._ve(true);
    } else if (this.chon) {
      this._chonHinh(null);
      this._ve(true);
    }
  }
  _ketThucGapKhuc() {
    const d = this.dangVe;
    if (!d || d.loai !== "gapKhuc") return false;
    if (d.ds.length < 2) {
      this.dangVe = null;
      this._ve(true);
      return false;
    }
    const h = { id: taoId(), loai: "gapKhuc", p1: d.ds[0], ds: d.ds, mau: this.mau, dam: 1.5 };
    this._hoanTat(h);
    return true;
  }
  // dat diem thu 2: kenh song song can them diem thu 3, cac hinh con lai hoan tat
  _datDiem2(pt) {
    const d = this.dangVe;
    d.p2 = pt;
    if (d.loai === "kenh") {
      d.buoc = 2;
      d.p3 = pt;
      this.xuongTai = null;
      return;
    }
    this._hoanTat(this._hinhMoi(d.loai, d.p1, d.p2));
  }
  _diChuyen(e) {
    if (this.huy) return;
    const { x, y } = this._toaDo(e);
    this.tol = e.pointerType === "touch" ? 18 : KHOANG_CHON;
    if (this.congCu && this.dangVe) {
      const pt = this._chiDiem(x, y);
      if (this.dangVe.loai === "gapKhuc") {
        if (pt) this.dangVe.cur = pt;
        this._ve(true);
        return;
      }
      if (pt) {
        if (this.dangVe.buoc === 2) this.dangVe.p3 = pt;
        else this.dangVe.p2 = pt;
      }
      this._ve(true);
      return;
    }
    if (this.keo) {
      e.stopPropagation();
      const h = this.hinh.find((v) => v.id === this.keo.id);
      if (!h) return;
      if (this.keo.loai === "diem") {
        const pt = this._chiDiem(x, y);
        if (pt) {
          if (/^d\d+$/.test(this.keo.diem) && h.ds) {
            h.ds[Number(this.keo.diem.slice(1))] = pt;
            h.p1 = h.ds[0];
          } else h[this.keo.diem] = pt;
        }
      } else {
        const l0 = this.chart.timeScale().coordinateToLogical(this.keo.x0);
        const l1 = this.chart.timeScale().coordinateToLogical(x);
        const p0 = this.series.coordinateToPrice(this.keo.y0);
        const p1 = this.series.coordinateToPrice(y);
        if (l0 != null && l1 != null && p0 != null && p1 != null) {
          const di = l1 - l0;
          const dp = p1 - p0;
          for (const k of ["p1", "p2", "p3"]) if (this.keo.goc[k]) h[k] = { i: this.keo.goc[k].i + di, p: this.keo.goc[k].p + dp };
          if (this.keo.goc.ds) {
            h.ds = this.keo.goc.ds.map((q) => ({ i: q.i + di, p: q.p + dp }));
            h.p1 = h.ds[0];
          }
        }
      }
      this._ve(true);
      return;
    }
    if (!this.congCu) {
      const { W, H } = this._chuKhungVe();
      const k = x <= W && y <= H ? this._timHinh(x, y) : null;
      this.khung.style.cursor = k ? (k.cham === "than" ? "move" : "grab") : "";
    }
  }
  _len(e) {
    if (this.keo) {
      this.keo = null;
      this._xong();
    }
    // bam - keo - tha: tha chuot xa diem bam dau thi chot diem 2
    if (this.xuongTai && this.dangVe && this.dangVe.buoc === 1 && this.congCu) {
      const { x, y } = this._toaDo(e);
      if (Math.hypot(x - this.xuongTai.x, y - this.xuongTai.y) > NGUONG_KEO) {
        const pt = this._chiDiem(x, y);
        if (pt) this._datDiem2(pt);
      }
    }
    this.xuongTai = null;
  }
  _menu(e) {
    // chuot phai len hinh: chon hinh + hien thanh nho, khong mo menu cua trinh duyet
    const { x, y } = this._toaDo(e);
    const { W, H } = this._chuKhungVe();
    if (this.congCu) {
      // dang ve: chuot phai khong mo menu trinh duyet; voi duong dan thi la lenh KET THUC
      if (x <= W && y <= H) {
        e.preventDefault();
        e.stopPropagation();
        if (this.dangVe?.loai === "gapKhuc") this._ketThucGapKhuc();
      }
      return;
    }
    if (x > W || y > H) return;
    const k = this._timHinh(x, y);
    if (k) {
      e.preventDefault();
      e.stopPropagation();
      this._chonHinh(k.h.id);
      this._ve(true);
    }
  }
  _trongONhap() {
    const t = document.activeElement?.tagName;
    return t === "INPUT" || t === "TEXTAREA" || t === "SELECT";
  }
  _phim(e) {
    if (this.huy) return;
    const trongONhap = this._trongONhap();
    if (e.code === "Space" && this.hoat && this.congCu && !trongONhap) {
      e.preventDefault(); // khong cuon trang
      if (!this.space) {
        this.space = true;
        this._capNhatCon();
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && !trongONhap && this.hoat) {
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        this.hoanTac();
        return;
      }
      if (k === "y" || (k === "z" && e.shiftKey)) {
        e.preventDefault();
        this.lamLai();
        return;
      }
    }
    if (e.key === "Enter" && this.dangVe?.loai === "gapKhuc" && !trongONhap) {
      e.preventDefault();
      this._ketThucGapKhuc();
      return;
    }
    if (e.key === "Escape") {
      if (this.dangVe?.loai === "gapKhuc" && this.dangVe.ds.length >= 2 && this._ketThucGapKhuc()) return; // Esc chot duong dan dang ve
      if (this.dangVe || this.congCu) {
        this.dangVe = null;
        this.congCu = null;
        this._capNhatCon();
        this.onCongCu(null);
        this._ve(true);
      } else if (this.chon) {
        this._chonHinh(null);
        this._ve(true);
      }
      return;
    }
    if ((e.key === "Delete" || e.key === "Backspace") && this.chon && !trongONhap && (this.hoat || this.chon)) {
      e.preventDefault();
      this.xoaChon();
    }
  }
  _nhaPhim(e) {
    if (e.code === "Space" && this.space) {
      e.preventDefault(); // nut dang duoc focus khong bi "bam" bang phim Space
      this.space = false;
      this._capNhatCon();
    }
  }

  // thanh nho canh hinh dang chon
  _taoThanh() {
    const t = document.createElement("div");
    Object.assign(t.style, { position: "absolute", zIndex: "6", display: "none", gap: "2px", padding: "3px", borderRadius: "8px", font: "600 11px 'Open Sans', sans-serif", userSelect: "none", boxShadow: "0 4px 14px rgba(0,0,0,0.35)" });
    const nut = (nhan, tieuDe, fn, doNguyHiem) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = nhan;
      b.title = tieuDe;
      Object.assign(b.style, { padding: "3px 8px", borderRadius: "6px", border: "0", cursor: "pointer", background: "transparent", font: "inherit", color: doNguyHiem ? "#EF4444" : "inherit" });
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        fn();
      });
      t.appendChild(b);
    };
    nut("Dày nét", "Đổi độ dày nét", () => this.doiDam());
    nut("Nhân bản", "Sao chép hình này", () => this.nhanBan());
    nut("Xóa", "Xóa hình (phím Delete)", () => this.xoaChon(), true);
    this.thanh = t;
    this._kieuThanh();
    this.khung.appendChild(t);
  }
  _kieuThanh() {
    if (!this.thanh) return;
    Object.assign(this.thanh.style, { background: this.mauNen, border: `1px solid ${this.mauChu}`, color: this.mauChu === "#9ca3af" ? "#e5e7eb" : this.mauChu });
  }
  _datThanh(W, H, ds) {
    const h = this.chon && !this.keo && !this.dangVe ? ds.find((v) => v.id === this.chon) : null;
    const a = h ? this._diemPx(h.p1) : null;
    if (!h || !a) {
      this.thanh.style.display = "none";
      return;
    }
    let ax = a.x, ay = a.y;
    if (h.loai === "ngang") ax = W / 2;
    if (h.loai === "doc") ay = 30;
    if (h.p2) {
      const b = this._diemPx(h.p2);
      if (b && b.y < ay) {
        ax = b.x;
        ay = b.y;
      }
    }
    this.thanh.style.display = "flex";
    const w = this.thanh.offsetWidth || 190;
    const left = Math.max(4, Math.min(ax - w / 2, W - w - 4));
    const top = ay - 40 < 4 ? ay + 14 : ay - 40;
    this.thanh.style.left = `${left}px`;
    this.thanh.style.top = `${Math.max(4, Math.min(top, H - 34))}px`;
  }

  // ---------- volume profile ----------
  _hoSoHinh(h) {
    if (!this.nguonHoSo || !h.p2) return null;
    const i1 = Math.round(Math.min(h.p1.i, h.p2.i)), i2 = Math.round(Math.max(h.p1.i, h.p2.i));
    const khoa = `${i1}|${i2}|${this.pbHoSo}`;
    if (this.boNhoHoSo.has(khoa)) return this.boNhoHoSo.get(khoa);
    let hs = null;
    try {
      hs = this.nguonHoSo(i1, i2);
    } catch {
      hs = null;
    }
    if (this.boNhoHoSo.size > 60) this.boNhoHoSo.clear();
    this.boNhoHoSo.set(khoa, hs);
    return hs;
  }
  // Khung hinh hoc cua hinh "frvp": 2 mep doc + dai gia cua ho so (de ve va de bat chuot)
  _khungFrvp(h) {
    const a = this._diemPx(h.p1), b = h.p2 ? this._diemPx(h.p2) : null;
    if (!a || !b) return null;
    const hs = this._hoSoHinh(h);
    let yTren = Math.min(a.y, b.y), yDuoi = Math.max(a.y, b.y);
    if (hs) {
      const y1 = this._y(hs.giaCao), y2 = this._y(hs.giaThap);
      if (y1 != null && y2 != null) {
        yTren = y1;
        yDuoi = y2;
      }
    }
    return { a, b, hs, x1: Math.min(a.x, b.x), x2: Math.max(a.x, b.x), yTren, yDuoi, yGiua: (yTren + yDuoi) / 2 };
  }
  // Ve 1 ho so: cac thanh ngang (xanh = KL nen tang, do = KL nen giam; trong vung gia tri dam hon), duong POC, VAH, VAL.
  //   neoPhai = true : thanh moc tu xGoc keo sang TRAI (ho so vung dang xem, mep phai cua so gia), duong POC / VAH / VAL chay het be ngang [xDuong1, xDuong2]
  //   neoPhai = false: thanh moc tu xGoc keo sang PHAI (ho so vung chon)
  _veHoSo(ctx, hs, { xGoc, rongToiDa, neoPhai, xDuong1, xDuong2, nhanTrai }) {
    if (!hs || !(hs.klLonNhat > 0)) return;
    for (let k = 0; k < hs.hang.length; k++) {
      const r = hs.hang[k];
      if (!(r.kl > 0)) continue;
      const y1 = this._y(r.den), y2 = this._y(r.tu);
      if (y1 == null || y2 == null) continue;
      const cao = Math.max(1, y2 - y1 - (y2 - y1 > 3 ? 1 : 0));
      const trongVA = k >= hs.iVal && k <= hs.iVah;
      const alpha = k === hs.iPoc ? 0.85 : trongVA ? 0.5 : 0.22;
      const wT = (r.tang / hs.klLonNhat) * rongToiDa, wG = (r.giam / hs.klLonNhat) * rongToiDa;
      ctx.fillStyle = `rgba(38,166,154,${alpha})`;
      ctx.fillRect(neoPhai ? xGoc - wT : xGoc, y1, wT, cao);
      ctx.fillStyle = `rgba(239,83,80,${alpha})`;
      ctx.fillRect(neoPhai ? xGoc - wT - wG : xGoc + wT, y1, wG, cao);
    }
    const duong = (gia, mau, net, nhan) => {
      const y = this._y(gia);
      if (y == null) return;
      ctx.strokeStyle = mau;
      ctx.lineWidth = nhan === "POC" ? 1.5 : 1;
      ctx.setLineDash(net);
      ctx.beginPath();
      ctx.moveTo(xDuong1, y);
      ctx.lineTo(xDuong2, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "10px 'Open Sans', sans-serif";
      ctx.textBaseline = "middle";
      const chu = `${nhan} ${soVN(gia, 2, true)}`;
      const w = ctx.measureText(chu).width;
      const x = nhanTrai != null ? nhanTrai : xGoc - rongToiDa - w - 8;
      ctx.fillStyle = this.mauNen;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(x - 2, y - 13, w + 4, 12);
      ctx.globalAlpha = 1;
      ctx.fillStyle = mau;
      ctx.fillText(chu, x, y - 7);
    };
    duong(hs.vah, this.mauChu, [3, 3], "VAH");
    duong(hs.val, this.mauChu, [3, 3], "VAL");
    duong(hs.poc, "#F6C544", [], "POC");
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
    if (this.hoSo) {
      const rongToiDa = Math.min(W * 0.28, 260);
      this._veHoSo(ctx, this.hoSo, { xGoc: W, rongToiDa, neoPhai: true, xDuong1: 0, xDuong2: W });
      // ghi nguon du lieu (trung thuc: day la uoc luong, khong phai du lieu khop lenh tung muc gia)
      const chu = this.hoSo.nguon === "gio" ? "KL theo giá · nến 1 giờ" : this.hoSo.nguon === "ghep" ? "KL theo giá · nến 1 giờ + nến biểu đồ" : "KL theo giá · ước lượng từ nến biểu đồ";
      ctx.font = "10px 'Open Sans', sans-serif";
      ctx.textBaseline = "middle";
      const w = ctx.measureText(chu).width;
      ctx.fillStyle = this.mauNen;
      ctx.globalAlpha = 0.75;
      // dat o goc duoi phai cua so gia (goc tren da co dong chu thich gia cua bieu do)
      ctx.fillRect(W - w - 10, H - 18, w + 8, 14);
      ctx.globalAlpha = 1;
      ctx.fillStyle = this.mauChu;
      ctx.fillText(chu, W - w - 6, H - 11);
    }
    const ds = this.dangVe ? [...this.hinh, { id: "_tam", ...this.dangVe, mau: this.mau, tam: true }] : this.hinh;
    for (const h of ds) this._veHinh(ctx, h, W, H);
    ctx.restore();
    if (this.hoSo) this._nhanGia(ctx, { p1: { p: this.hoSo.poc }, mau: "#F6C544" }, W);
    // nhan gia o truc phai cho duong ngang
    for (const h of ds) if (h.loai === "ngang") this._nhanGia(ctx, h, W);
    this._datThanh(W, H, ds);
  }
  _nhanGia(ctx, h, W) {
    const y = this._y(h.p1.p);
    if (y == null) return;
    const chu = soVN(h.p1.p, 2, true);
    ctx.font = "11px 'Open Sans', sans-serif";
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
    const dam = h.dam || 1.5;
    ctx.lineWidth = chon ? dam + 0.6 : dam;
    ctx.strokeStyle = h.mau;
    ctx.fillStyle = h.mau;
    ctx.setLineDash([]);
    ctx.textBaseline = "middle";
    ctx.font = "11px 'Open Sans', sans-serif";
    const diem = (p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = this.mauNen;
      ctx.fill();
      ctx.strokeStyle = h.mau;
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    const dauCham = (...ps) => {
      if (chon || h.tam) for (const p of ps) if (p) diem(p);
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
    if (h.loai === "chu") {
      ctx.font = "600 13px 'Open Sans', sans-serif";
      ctx.fillStyle = h.mau;
      ctx.fillText(h.chu || "", a.x, a.y);
      if (chon) {
        const w = ctx.measureText(h.chu || "").width;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(a.x - 4, a.y - 11, w + 8, 22);
        ctx.setLineDash([]);
        diem(a);
      }
      return;
    }
    if (h.loai === "frvp") {
      const k = this._khungFrvp(h);
      if (!k) return;
      const rong = k.x2 - k.x1;
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = h.mau;
      ctx.fillRect(k.x1, k.yTren, rong, k.yDuoi - k.yTren);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = h.mau;
      ctx.lineWidth = chon ? 1.5 : 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(k.x1, k.yTren);
      ctx.lineTo(k.x1, k.yDuoi);
      ctx.moveTo(k.x2, k.yTren);
      ctx.lineTo(k.x2, k.yDuoi);
      ctx.stroke();
      ctx.setLineDash([]);
      if (k.hs) this._veHoSo(ctx, k.hs, { xGoc: k.x1, rongToiDa: Math.max(30, rong * 0.85), neoPhai: false, xDuong1: k.x1, xDuong2: Math.max(k.x2, k.x1 + 30), nhanTrai: k.x1 + 4 });
      else if (!h.tam) {
        ctx.fillStyle = this.mauChu;
        ctx.font = "11px 'Open Sans', sans-serif";
        ctx.fillText("Không đủ dữ liệu khối lượng", k.x1 + 6, k.yGiua);
      }
      if (chon || h.tam) {
        diem({ x: k.a.x, y: k.yGiua });
        diem({ x: k.b.x, y: k.yGiua });
      }
      return;
    }
    if (h.loai === "gapKhuc") {
      const px = (h.ds || []).map((q) => this._diemPx(q)).filter(Boolean);
      if (h.tam && h.cur) {
        const c = this._diemPx(h.cur);
        if (c) px.push(c);
      }
      if (px.length < 2) {
        dauCham(...px);
        return;
      }
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(px[0].x, px[0].y);
      for (let k = 1; k < px.length; k++) ctx.lineTo(px[k].x, px[k].y);
      ctx.stroke();
      ctx.lineJoin = "miter";
      dauCham(...(h.tam ? px.slice(0, -1) : px));
      return;
    }
    const b = h.p2 ? this._diemPx(h.p2) : null;
    if (!b) return;
    if (h.loai === "xuHuong" || h.loai === "thuoc" || h.loai === "tia" || h.loai === "mui") {
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
      if (h.loai === "mui" && (b.x !== a.x || b.y !== a.y)) {
        const g = Math.atan2(b.y - a.y, b.x - a.x);
        const L = 12 + dam * 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - L * Math.cos(g - 0.45), b.y - L * Math.sin(g - 0.45));
        ctx.lineTo(b.x - L * Math.cos(g + 0.45), b.y - L * Math.sin(g + 0.45));
        ctx.closePath();
        ctx.fillStyle = h.mau;
        ctx.fill();
      }
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
      dauCham(a, b);
      return;
    }
    if (h.loai === "kenh") {
      const k = h.p3 ? this._kenh2(h, a, b) : null;
      if (k) {
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = h.mau;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(k.b2.x, k.b2.y);
        ctx.lineTo(k.a2.x, k.a2.y);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(k.a2.x, k.a2.y);
        ctx.lineTo(k.b2.x, k.b2.y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      dauCham(a, b, k?.c);
      return;
    }
    if (h.loai === "chuNhat") {
      const x1 = Math.min(a.x, b.x), y1 = Math.min(a.y, b.y), w = Math.abs(b.x - a.x), hh = Math.abs(b.y - a.y);
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = h.mau;
      ctx.fillRect(x1, y1, w, hh);
      ctx.globalAlpha = 1;
      ctx.strokeRect(x1, y1, w, hh);
      // NHAN VONG QUAY CO PHIEU TROI NOI: khoi luong da giao dich trong vung / so co phieu tu do chuyen nhuong (chi mo ta, khong phai tin hieu - nghien cuu 26/10/2026 khong co loi the)
      const tk = this._thongKeVung(h);
      if (tk && tk.kl > 0 && w > 70 && hh > 24) {
        const tr = (v) => `${soVN(v / 1e6, v >= 1e8 ? 0 : 1)} tr cp`;
        const dong = [`KL trong vùng: ${tr(tk.kl)} · ${tk.nen} nến`];
        let mau = h.mau;
        if (tk.F != null) {
          dong.push(`Free float ${soVN(tk.ff * 100, 0)}% = ${tr(tk.troi)} → đã quay ${soVN(tk.F, 2)} lần`);
          mau = tk.F >= 1 ? "#22C55E" : tk.F >= 0.5 ? "#F6C544" : "#9CA3AF";
          dong.push(tk.F >= 1 ? "Đã quay hết lượng trôi nổi" : tk.F >= 0.5 ? "Gần quay hết lượng trôi nổi" : "Chưa quay hết lượng trôi nổi");
        }
        ctx.save();
        ctx.font = "600 11px 'Open Sans', sans-serif";
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        const rong = Math.max(...dong.map((t) => ctx.measureText(t).width)) + 12;
        const cao = dong.length * 15 + 6;
        let bx = x1 + 6;
        if (bx + rong > W - 4) bx = Math.max(4, W - rong - 4);
        const by = hh >= cao + 12 ? y1 + 6 : Math.max(4, y1 - cao - 4);
        ctx.fillStyle = this.mauNen;
        ctx.globalAlpha = 0.86;
        ctx.fillRect(bx, by, rong, cao);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = mau;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + 0.5, by + 0.5, rong - 1, cao - 1);
        dong.forEach((t, k) => {
          ctx.fillStyle = k === dong.length - 1 && tk.F != null ? mau : this.mauChu;
          ctx.fillText(t, bx + 6, by + 3 + k * 15 + 7.5);
        });
        ctx.restore();
      }
      dauCham(a, b);
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
        ctx.lineWidth = m === 0 || m === 1 ? dam : Math.max(1, dam - 0.5);
        ctx.setLineDash(m === 0 || m === 1 ? [] : [4, 3]);
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(W, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = h.mau;
        ctx.fillText(`${soVN(m * 100, 1)}%  ${soVN(gia, 2, true)}`, x1 + 6, y - 8);
      }
      ctx.strokeStyle = h.mau;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
      dauCham(a, b);
    }
  }
}
