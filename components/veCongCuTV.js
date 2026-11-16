// BO CONG CU VE KIEU TRADINGVIEW (16/11/2026): moi cong cu = 1 ham HINH HOC thuan: (h, P, D, u) => danh sach "nguyen thuy" (doan / da giac / elip / chu / cham) de lop ve (veBieuDoLop.js) ve va bat chuot.
//   h = hinh luu (h.ds = cac diem du lieu { i: chi so nen logic, p: gia }, h.mau, h.chu), P = cac diem da doi sang toa do man hinh { x, y }, D = h.ds,
//   u = { W, H, nen, xI(i), yP(p), soVN, pctVN } (W, H = kich thuoc vung gia; nen = mang nen { t, o, h, l, c, v }).
// Nguyen thuy: { t: "doan", a, b, keo: "phai" | "hai" } | { t: "da", pts, dong, to } | { t: "elip", cx, cy, rx, ry, rot, to } | { t: "chu", x, y, chu, canh, co, nen, dam } | { t: "cham", x, y, r };
//   chung: mau (mac dinh = mau net ve), dam, net ("dut" | "cham"), alpha, vien (false = khong ve vien da giac).
// Tat ca chi la cong cu ve THAM KHAO, khong phai tin hieu (cac kiem dinh Fibonacci 16/11/2026: khong du doan duoc dinh / day).
import { soVN, pctVN } from "@/lib/soVN";

// Mau tung muc Fibonacci giong TradingView (rieng Fibonacci KHONG theo mau net ve)
export const MAU_MUC_FIB = { 0: "#787B86", 0.236: "#F23645", 0.382: "#FF9800", 0.5: "#4CAF50", 0.618: "#089981", 0.786: "#00BCD4", 1: "#787B86", 1.272: "#81C784", 1.618: "#2962FF", 2: "#F23645", 2.618: "#F23645", 3.618: "#9C27B0", 4.236: "#E91E63" };
const PHI = 1.618033988749895;
const MUC_KENH_FIB = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.618, 2.618, 3.618, 4.236];
const DAY_FIB_THOI_GIAN = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
const MAU_QUAT = { 0.236: "#F23645", 0.25: "#F23645", 0.382: "#FF9800", 0.5: "#4CAF50", 0.618: "#089981", 0.75: "#00BCD4", 0.786: "#00BCD4", 1: "#787B86" };
const XANH = "#22C55E";
const DO = "#EF4444";

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const cong = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const tru = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const nhan = (a, k) => ({ x: a.x * k, y: a.y * k });
const L = (a, b, o) => ({ t: "doan", a, b, ...o });
const DA = (pts, o) => ({ t: "da", pts, ...o });
const CH = (x, y, chu, o) => ({ t: "chu", x, y, chu, ...o });
const CHAM = (x, y, o) => ({ t: "cham", x, y, ...o });
const ELIP = (cx, cy, rx, ry, o) => ({ t: "elip", cx, cy, rx, ry, ...o });
const gia = (v) => soVN(v, 2, true);
const phanTram = (a, b) => (a ? (b / a - 1) * 100 : 0);
const tiSo = (a, b) => (b ? soVN(Math.abs(a) / Math.abs(b), 3) : "–");
const mui = (a, b, c = 11) => {
  // dau mui ten tai b (cung huong a -> b)
  const g = Math.atan2(b.y - a.y, b.x - a.x);
  return DA([b, { x: b.x - c * Math.cos(g - 0.42), y: b.y - c * Math.sin(g - 0.42) }, { x: b.x - c * Math.cos(g + 0.42), y: b.y - c * Math.sin(g + 0.42) }], { dong: true, to: 1, vien: false });
};
function cungTron(cx, cy, r, a0, a1, so = 40) {
  const pts = [];
  for (let k = 0; k <= so; k++) {
    const a = a0 + ((a1 - a0) * k) / so;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
}
const dauChu = (P, k, ngang) => {
  // dat nhan "tren" neu diem k la dinh cuc bo (cao hon hang xom), "duoi" neu la day
  const truoc = P[k - 1] ?? P[k + 1], sau = P[k + 1] ?? P[k - 1];
  const tren = P[k].y <= Math.min(truoc.y, sau.y) + 0.5;
  return { y: P[k].y + (tren ? -13 : 13), x: P[k].x, canh: ngang ?? "giua" };
};

export const CONG_CU_MOI = {};
function dang(khoa, ten, n, hinh, o = {}) {
  CONG_CU_MOI[khoa] = { nhan: ten, n, hinh, ...o };
}

// ---------------------------------------------------------------- DUONG ----------
dang("thongTinDuong", "Đường thông tin", 2, (h, P, D) => {
  const dp = D[1].p - D[0].p, nen = Math.round(D[1].i - D[0].i);
  const m = mid(P[0], P[1]);
  return [L(P[0], P[1]), CH(m.x, m.y - 14, `${dp >= 0 ? "+" : ""}${gia(dp)} (${pctVN(phanTram(D[0].p, D[1].p), 2)}) · ${Math.abs(nen)} nến`, { canh: "giua", nen: true })];
}, { goiY: "bấm 2 điểm: đường kèm chênh lệch giá, % và số nến" });
dang("duongKeoDai", "Đường mở rộng", 2, (h, P) => [L(P[0], P[1], { keo: "hai" })], { goiY: "bấm 2 điểm: đường kéo dài về hai phía" });
dang("gocXuHuong", "Góc xu hướng", 2, (h, P) => {
  const g = Math.atan2(P[0].y - P[1].y, P[1].x - P[0].x), r = 34;
  const cung = [];
  for (let k = 0; k <= 16; k++) {
    const a = (g * k) / 16;
    cung.push({ x: P[0].x + r * Math.cos(a), y: P[0].y - r * Math.sin(a) });
  }
  return [L(P[0], P[1]), L(P[0], { x: P[0].x + Math.max(70, Math.abs(P[1].x - P[0].x)), y: P[0].y }, { net: "dut" }), DA(cung, { vien: true }), CH(P[0].x + r + 8, P[0].y - (g >= 0 ? 8 : -8), `${soVN((g * 180) / Math.PI, 1)}°`, { nen: true })];
}, { goiY: "bấm 2 điểm: đường kèm góc so với phương ngang" });
dang("tiaNgang", "Tia ngang", 1, (h, P) => [L(P[0], { x: P[0].x + 10, y: P[0].y }, { keo: "phai" }), CHAM(P[0].x, P[0].y, { r: 3 })], { goiY: "bấm 1 điểm: tia ngang kéo về bên phải" });
dang("duongCat", "Đường chéo thập (cross)", 1, (h, P, D, u) => [L({ x: 0, y: P[0].y }, { x: u.W, y: P[0].y }), L({ x: P[0].x, y: 0 }, { x: P[0].x, y: u.H })], { goiY: "bấm 1 điểm: một đường ngang và một đường dọc cắt nhau" });
dang("hoiQuy", "Xu hướng hồi quy", 2, (h, P, D, u) => {
  const i1 = Math.max(0, Math.round(Math.min(D[0].i, D[1].i))), i2 = Math.min(u.nen.length - 1, Math.round(Math.max(D[0].i, D[1].i)));
  if (i2 - i1 < 2) return [L(P[0], P[1])];
  const n = i2 - i1 + 1;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = i1; i <= i2; i++) { const x = i - i1, y = u.nen[i].c; sx += x; sy += y; sxx += x * x; sxy += x * y; }
  const b = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy - b * sx) / n;
  let ss = 0;
  for (let i = i1; i <= i2; i++) ss += (u.nen[i].c - (a + b * (i - i1))) ** 2;
  const sd = Math.sqrt(ss / n), x1 = u.xI(i1), x2 = u.xI(i2);
  const dg = (k) => [{ x: x1, y: u.yP(a + k * sd) }, { x: x2, y: u.yP(a + b * (i2 - i1) + k * sd) }];
  const [t1, t2] = dg(2), [d1, d2] = dg(-2), [g1, g2] = dg(0);
  if ([t1.y, t2.y, d1.y, d2.y].some((v) => v == null)) return [];
  return [DA([t1, t2, d2, d1], { dong: true, to: 0.1, vien: false }), L(g1, g2), L(t1, t2, { net: "dut" }), L(d1, d2, { net: "dut" })];
}, { goiY: "bấm 2 điểm đầu / cuối: đường hồi quy tuyến tính của giá đóng cửa và dải ±2 độ lệch chuẩn" });
dang("dinhDayPhang", "Đỉnh / đáy phẳng", 3, (h, P) => [L(P[0], P[1]), L({ x: P[0].x, y: P[2].y }, { x: P[1].x, y: P[2].y }), DA([P[0], P[1], { x: P[1].x, y: P[2].y }, { x: P[0].x, y: P[2].y }], { dong: true, to: 0.1, vien: false })], { goiY: "bấm 3 điểm: đường xu hướng + đường ngang phẳng (điểm 3) và vùng tô giữa" });
dang("kenhRoi", "Kênh rời", 4, (h, P) => [L(P[0], P[1]), L(P[2], P[3]), DA([P[0], P[1], P[3], P[2]], { dong: true, to: 0.1, vien: false })], { goiY: "bấm 4 điểm: hai đường độc lập tạo thành kênh" });

// ---------------------------------------------------------------- CAY CHIA (PITCHFORK) ----------
const cayChia = (kieu) => (h, P, D, u) => {
  const [a, b, c] = P;
  const s = kieu === "schiff" ? { x: a.x, y: (a.y + b.y) / 2 } : kieu === "schiffSua" ? mid(a, b) : a;
  const m = mid(b, c), d = tru(m, s);
  const k = d.x > 0 ? Math.max(1, (u.W + 80 - m.x) / d.x) : 3;
  const xa = (p) => cong(p, nhan(d, k));
  return [
    DA([b, xa(b), xa(m), m], { dong: true, to: 0.08, vien: false, mau: "#F23645" }),
    DA([c, xa(c), xa(m), m], { dong: true, to: 0.08, vien: false, mau: "#089981" }),
    L(s, m, { keo: "phai" }),
    L(b, cong(b, d), { keo: "phai", mau: "#F23645" }),
    L(c, cong(c, d), { keo: "phai", mau: "#089981" }),
    L(b, c, { net: "dut" }),
    L(a, b, { net: "dut", mau: "#787B86" }),
  ];
};
dang("cayChia", "Cây chĩa (Pitchfork)", 3, cayChia("chia"), { goiY: "bấm 3 điểm: đường trung tuyến và hai nhánh song song" });
dang("cayChiaSchiff", "Cây chĩa Schiff", 3, cayChia("schiff"), { goiY: "bấm 3 điểm: như cây chĩa nhưng điểm xuất phát dời đến trung điểm giá của hai điểm đầu" });
dang("cayChiaSchiffSua", "Cây chĩa Schiff cải tiến", 3, cayChia("schiffSua"), { goiY: "bấm 3 điểm: điểm xuất phát dời đến trung điểm (cả thời gian và giá) của hai điểm đầu" });
dang("quatCayChia", "Quạt cây chĩa (Pitchfan)", 3, (h, P) => {
  const o = [L(P[1], P[2], { net: "dut" })];
  for (const r of [0.236, 0.382, 0.5, 0.618, 0.786, 1]) o.push(L(P[0], cong(P[1], nhan(tru(P[2], P[1]), r)), { keo: "phai", mau: MAU_QUAT[r] }));
  return o;
}, { goiY: "bấm 3 điểm: các tia từ điểm 1 qua các tỷ lệ Fibonacci của đoạn điểm 2 - điểm 3" });

// ---------------------------------------------------------------- FIBONACCI + GANN ----------
dang("kenhFib", "Kênh Fibonacci", 3, (h, P) => {
  const dx = P[1].x - P[0].x || 1, yCoSo = P[0].y + ((P[1].y - P[0].y) * (P[2].x - P[0].x)) / dx, dy = P[2].y - yCoSo;
  const o = [];
  let truoc = null;
  for (const r of MUC_KENH_FIB) {
    const off = r * dy, a = { x: P[0].x, y: P[0].y + off }, b = { x: P[1].x, y: P[1].y + off }, mau = MAU_MUC_FIB[r];
    if (truoc) o.push(DA([truoc.a, truoc.b, b, a], { dong: true, to: 0.1, vien: false, mau }));
    truoc = { a, b };
    o.push(L(a, b, { mau, dam: 1 }), CH(a.x - 6, a.y, String(r), { canh: "phai", mau }));
  }
  o.push(L(P[0], P[1], { net: "dut", mau: "#787B86", dam: 1 }));
  return o;
}, { goiY: "bấm 3 điểm: đường cơ sở (điểm 1-2) và độ rộng (điểm 3), các đường song song theo tỷ lệ Fibonacci" });
dang("vungThoiGianFib", "Vùng thời gian Fibonacci", 2, (h, P, D, u) => {
  const d = P[1].x - P[0].x, o = [];
  if (Math.abs(d) < 2) return [L(P[0], P[1])];
  let truoc = null;
  for (const f of DAY_FIB_THOI_GIAN) {
    const x = P[0].x + f * d;
    if (x < -20 || x > u.W + 20) { truoc = null; continue; }
    if (truoc != null && f > 0) o.push(DA([{ x: truoc, y: 0 }, { x, y: 0 }, { x, y: u.H }, { x: truoc, y: u.H }], { dong: true, to: 0.04, vien: false, mau: "#2962FF" }));
    truoc = x;
    o.push(L({ x, y: 0 }, { x, y: u.H }, { mau: f === 0 || f === 1 ? "#787B86" : "#2962FF", dam: 1 }), CH(x + 3, 12, String(f), { mau: "#2962FF" }));
  }
  return o;
}, { goiY: "bấm 2 điểm: các vạch dọc tại dãy Fibonacci 0 1 2 3 5 8 13 21 34 55 89 × khoảng cách" });
dang("quatFib", "Quạt tốc độ kháng cự Fibonacci", 2, (h, P) => {
  const o = [L(P[0], P[1], { net: "dut", mau: "#787B86" })], dx = P[1].x - P[0].x, dy = P[1].y - P[0].y;
  for (const r of [0.25, 0.382, 0.5, 0.618, 0.75, 1]) {
    o.push(L(P[0], { x: P[1].x, y: P[0].y + dy * r }, { keo: "phai", mau: MAU_QUAT[r], dam: 1 }));
    o.push(L(P[0], { x: P[0].x + dx * r, y: P[1].y }, { keo: "phai", mau: MAU_QUAT[r], dam: 1 }));
  }
  return o;
}, { goiY: "bấm 2 điểm: các tia từ điểm 1 theo tỷ lệ 0.25 0.382 0.5 0.618 0.75 1 của khung giá - thời gian" });
dang("thoiGianFibXuHuong", "Thời gian Fibonacci theo xu hướng", 3, (h, P, D, u) => {
  const d = P[1].x - P[0].x, o = [L(P[0], P[1], { net: "dut", mau: "#787B86" }), L(P[1], P[2], { net: "dut", mau: "#787B86" })];
  if (Math.abs(d) < 2) return o;
  for (const f of DAY_FIB_THOI_GIAN) {
    const x = P[2].x + f * d;
    if (x < -20 || x > u.W + 20) continue;
    o.push(L({ x, y: 0 }, { x, y: u.H }, { mau: f === 0 || f === 1 ? "#787B86" : "#2962FF", dam: 1 }), CH(x + 3, 12, String(f), { mau: "#2962FF" }));
  }
  return o;
}, { goiY: "bấm 3 điểm: khoảng cách thời gian điểm 1-2, các vạch dọc Fibonacci tính từ điểm 3" });
dang("vongFib", "Vòng tròn Fibonacci", 2, (h, P) => {
  const c = mid(P[0], P[1]), R = Math.hypot(P[1].x - P[0].x, P[1].y - P[0].y) / 2, o = [L(P[0], P[1], { net: "dut", mau: "#787B86" })];
  for (const r of [0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.618]) o.push(ELIP(c.x, c.y, R * r, R * r, { mau: MAU_MUC_FIB[r] ?? "#787B86", dam: 1 }));
  return o;
}, { goiY: "bấm 2 điểm: các vòng tròn đồng tâm theo tỷ lệ Fibonacci" });
dang("xoanOcFib", "Xoắn ốc Fibonacci", 2, (h, P) => {
  const v = tru(P[1], P[0]), R = Math.hypot(v.x, v.y), a0 = Math.atan2(v.y, v.x), pts = [];
  for (let k = 0; k <= 180; k++) {
    const th = (k / 180) * 6 * Math.PI, r = R * Math.pow(PHI, (-2 * th) / Math.PI);
    pts.push({ x: P[0].x + r * Math.cos(a0 + th), y: P[0].y + r * Math.sin(a0 + th) });
  }
  return [L(P[0], P[1], { net: "dut", mau: "#787B86", dam: 1 }), DA(pts, {})];
}, { goiY: "bấm 2 điểm: tâm và bán kính ngoài, xoắn ốc vàng (mỗi 1/4 vòng giảm theo tỷ lệ 1,618)" });
dang("cungFib", "Cung tốc độ kháng cự Fibonacci", 2, (h, P) => {
  const d = Math.hypot(P[0].x - P[1].x, P[0].y - P[1].y), a0 = Math.atan2(P[0].y - P[1].y, P[0].x - P[1].x), o = [L(P[0], P[1], { net: "dut", mau: "#787B86", dam: 1 })];
  for (const r of [0.382, 0.5, 0.618, 1, 1.618]) {
    const mau = MAU_MUC_FIB[r] ?? "#787B86";
    o.push(DA(cungTron(P[1].x, P[1].y, r * d, a0 - Math.PI / 2, a0 + Math.PI / 2), { mau, dam: 1 }));
    const e = { x: P[1].x + r * d * Math.cos(a0), y: P[1].y + r * d * Math.sin(a0) };
    o.push(CH(e.x, e.y - 8, String(r), { mau, canh: "giua" }));
  }
  return o;
}, { goiY: "bấm 2 điểm: các cung tròn tâm tại điểm 2, bán kính theo tỷ lệ Fibonacci của đoạn 1-2" });
dang("hopGann", "Hộp Gann", 2, (h, P) => {
  const [a, b] = P, c1 = { x: b.x, y: a.y }, c2 = { x: a.x, y: b.y }, o = [DA([a, c1, b, c2], { dong: true, to: 0.05 })];
  for (const r of [0.25, 0.382, 0.5, 0.618, 0.75]) {
    o.push(L({ x: a.x + (b.x - a.x) * r, y: a.y }, { x: a.x + (b.x - a.x) * r, y: b.y }, { net: "dut", dam: 1 }), L({ x: a.x, y: a.y + (b.y - a.y) * r }, { x: b.x, y: a.y + (b.y - a.y) * r }, { net: "dut", dam: 1 }));
  }
  o.push(L(a, b, { dam: 1 }), L(c1, c2, { dam: 1 }));
  return o;
}, { goiY: "bấm 2 điểm: hộp Gann chia các tỷ lệ 0.25 0.382 0.5 0.618 0.75 kèm hai đường chéo" });
dang("oVuongGann", "Ô vuông Gann", 2, (h, P) => {
  const [a, b] = P, N = 8, o = [DA([a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }], { dong: true, to: 0.05 })];
  for (let k = 1; k < N; k++) {
    o.push(L({ x: a.x + ((b.x - a.x) * k) / N, y: a.y }, { x: a.x + ((b.x - a.x) * k) / N, y: b.y }, { dam: 0.8, alpha: 0.6 }), L({ x: a.x, y: a.y + ((b.y - a.y) * k) / N }, { x: b.x, y: a.y + ((b.y - a.y) * k) / N }, { dam: 0.8, alpha: 0.6 }));
  }
  o.push(L(a, b, { dam: 1.2 }), L({ x: b.x, y: a.y }, { x: a.x, y: b.y }, { dam: 1.2 }));
  return o;
}, { goiY: "bấm 2 điểm: lưới ô vuông 8 × 8 kèm hai đường chéo (Gann)" });
dang("quatGann", "Quạt Gann", 2, (h, P) => {
  const dx = P[1].x - P[0].x, dy = P[1].y - P[0].y, o = [];
  for (const [ten, s] of [["1x8", 1 / 8], ["1x4", 1 / 4], ["1x3", 1 / 3], ["1x2", 1 / 2], ["1x1", 1], ["2x1", 2], ["3x1", 3], ["4x1", 4], ["8x1", 8]]) {
    const t = { x: P[0].x + dx, y: P[0].y + dy * s }, mau = s === 1 ? "#F6C544" : "#787B86";
    o.push(L(P[0], t, { keo: "phai", mau, dam: s === 1 ? 1.6 : 1 }), CH(t.x + 4, t.y, ten, { mau }));
  }
  return o;
}, { goiY: "bấm 2 điểm: điểm 2 xác định đường 1×1, các đường Gann 1×8 … 8×1 tỏa từ điểm 1" });

// ---------------------------------------------------------------- MAU HINH ----------
const xabcd = (ten) => (h, P, D) => {
  const [X, A, B, C, Dd] = P;
  return [
    DA([X, A, B], { dong: true, to: 0.1, vien: false }), DA([B, C, Dd], { dong: true, to: 0.1, vien: false }),
    DA(P, {}),
    L(X, B, { net: "dut", dam: 1 }), L(B, Dd, { net: "dut", dam: 1 }), L(A, C, { net: "dut", dam: 1 }), L(X, Dd, { net: "dut", dam: 1 }),
    CH(mid(X, B).x, mid(X, B).y, tiSo(D[2].p - D[1].p, D[1].p - D[0].p), { canh: "giua", nen: true, co: 10 }),
    CH(mid(A, C).x, mid(A, C).y, tiSo(D[3].p - D[2].p, D[2].p - D[1].p), { canh: "giua", nen: true, co: 10 }),
    CH(mid(B, Dd).x, mid(B, Dd).y, tiSo(D[4].p - D[3].p, D[3].p - D[2].p), { canh: "giua", nen: true, co: 10 }),
    CH(mid(X, Dd).x, mid(X, Dd).y, tiSo(D[4].p - D[1].p, D[1].p - D[0].p), { canh: "giua", nen: true, co: 10 }),
    ...["X", "A", "B", "C", "D"].map((t, k) => CH(P[k].x, dauChu(P, k).y, t, { canh: "giua", dam: true, co: 13 })),
    CH(X.x, Math.min(...P.map((p) => p.y)) - 26, ten, { canh: "giua", dam: true, co: 12 }),
  ];
};
dang("xabcd", "Mẫu hình XABCD", 5, xabcd("XABCD"), { goiY: "bấm 5 điểm X A B C D: tự ghi các tỷ lệ AB/XA, BC/AB, CD/BC, AD/XA" });
dang("cypher", "Mẫu hình Cypher", 5, xabcd("Cypher"), { goiY: "bấm 5 điểm X A B C D (mẫu hình Cypher)" });
dang("abcd", "Mẫu hình ABCD", 4, (h, P, D) => [
  DA(P, {}), L(P[0], P[2], { net: "dut", dam: 1 }), L(P[1], P[3], { net: "dut", dam: 1 }),
  CH(mid(P[0], P[2]).x, mid(P[0], P[2]).y, tiSo(D[2].p - D[1].p, D[1].p - D[0].p), { canh: "giua", nen: true, co: 10 }),
  CH(mid(P[1], P[3]).x, mid(P[1], P[3]).y, tiSo(D[3].p - D[2].p, D[2].p - D[1].p), { canh: "giua", nen: true, co: 10 }),
  ...["A", "B", "C", "D"].map((t, k) => CH(P[k].x, dauChu(P, k).y, t, { canh: "giua", dam: true, co: 13 })),
], { goiY: "bấm 4 điểm A B C D: tự ghi tỷ lệ BC/AB và CD/BC" });
dang("tamGiacMH", "Mẫu hình tam giác", 4, (h, P) => [DA(P, { dong: true, to: 0.07, vien: false }), L(P[0], P[2], { keo: "phai" }), L(P[1], P[3], { keo: "phai" }), DA(P, {}), ...P.map((p, k) => CH(p.x, dauChu(P, k).y, String(k + 1), { canh: "giua", dam: true }))], { goiY: "bấm 4 điểm: hai đường biên hội tụ (1-3 và 2-4) tạo mẫu hình tam giác" });
dang("baLucDay", "Ba lực đẩy (Three Drives)", 7, (h, P) => [DA(P, {}), ...P.map((p, k) => CH(p.x, dauChu(P, k).y, String(k), { canh: "giua", dam: true }))], { goiY: "bấm 7 điểm: mẫu hình ba lực đẩy" });
dang("vaiDauVai", "Đầu và hai vai", 7, (h, P) => [
  DA([P[2], P[3], P[4]], { dong: true, to: 0.1, vien: false }), DA(P, {}), L(P[2], P[4], { keo: "phai", net: "dut", mau: "#F23645" }),
  CH(P[1].x, dauChu(P, 1).y, "Vai trái", { canh: "giua", dam: true }), CH(P[3].x, dauChu(P, 3).y, "Đầu", { canh: "giua", dam: true }), CH(P[5].x, dauChu(P, 5).y, "Vai phải", { canh: "giua", dam: true }),
], { goiY: "bấm 7 điểm: bắt đầu, vai trái, đáy 1, đầu, đáy 2, vai phải, kết thúc; đường cổ nối hai đáy" });
const songElliott = (nhanDiem) => (h, P) => [DA(P, { dam: 2 }), ...P.map((p, k) => CH(p.x, dauChu(P, k).y, nhanDiem[k], { canh: "giua", dam: true, co: 13 }))];
dang("elliottXungLuc", "Sóng xung lực Elliott (12345)", 6, songElliott(["0", "(1)", "(2)", "(3)", "(4)", "(5)"]), { goiY: "bấm 6 điểm: sóng xung lực 1-2-3-4-5" });
dang("elliottDieuChinh", "Sóng điều chỉnh Elliott (ABC)", 4, songElliott(["0", "(A)", "(B)", "(C)"]), { goiY: "bấm 4 điểm: sóng điều chỉnh A-B-C" });
dang("elliottTamGiac", "Sóng tam giác Elliott (ABCDE)", 6, songElliott(["0", "(A)", "(B)", "(C)", "(D)", "(E)"]), { goiY: "bấm 6 điểm: sóng tam giác A-B-C-D-E" });
dang("elliottKepDoi", "Sóng kết hợp kép Elliott (WXY)", 4, songElliott(["0", "(W)", "(X)", "(Y)"]), { goiY: "bấm 4 điểm: sóng kết hợp kép W-X-Y" });
dang("elliottBaPhuc", "Sóng kết hợp ba Elliott (WXYXZ)", 6, songElliott(["0", "(W)", "(X)", "(Y)", "(X)", "(Z)"]), { goiY: "bấm 6 điểm: sóng kết hợp ba W-X-Y-X-Z" });
dang("chuKy", "Đường chu kỳ", 2, (h, P, D, u) => {
  const d = Math.abs(P[1].x - P[0].x);
  if (d < 3) return [L(P[0], P[1])];
  const o = [], k1 = -Math.min(120, Math.ceil(P[0].x / d)), k2 = Math.min(120, Math.ceil((u.W - P[0].x) / d));
  for (let k = k1; k <= k2; k++) o.push(L({ x: P[0].x + k * d, y: 0 }, { x: P[0].x + k * d, y: u.H }, { net: k === 0 ? undefined : "dut", dam: 1 }));
  return o;
}, { goiY: "bấm 2 điểm: các vạch dọc lặp lại theo khoảng cách hai điểm" });
dang("chuKyThoiGian", "Chu kỳ thời gian", 2, (h, P, D, u) => {
  const d = Math.abs(P[1].x - P[0].x), amp = Math.max(18, Math.abs(P[1].y - P[0].y));
  if (d < 3) return [L(P[0], P[1])];
  const o = [], k1 = -Math.min(120, Math.ceil(P[0].x / d)), k2 = Math.min(120, Math.ceil((u.W - P[0].x) / d));
  for (let k = k1; k < k2; k++) o.push(DA(cungTron(P[0].x + (k + 0.5) * d, P[0].y, d / 2, Math.PI, 2 * Math.PI, 24).map((q) => ({ x: q.x, y: P[0].y + (q.y - P[0].y) * (amp / (d / 2)) })), { dam: 1.2 }));
  return o;
}, { goiY: "bấm 2 điểm: các cung chu kỳ lặp lại (khoảng cách ngang = một chu kỳ, độ cao theo điểm 2)" });
dang("duongSin", "Đường sin", 2, (h, P, D, u) => {
  const d = P[1].x - P[0].x;
  if (Math.abs(d) < 4) return [L(P[0], P[1])];
  const ym = (P[0].y + P[1].y) / 2, A = (P[0].y - P[1].y) / 2, pts = [];
  for (let x = 0; x <= u.W; x += 3) pts.push({ x, y: ym + A * Math.cos((Math.PI * (x - P[0].x)) / d) });
  return [DA(pts, {})];
}, { goiY: "bấm 2 điểm (đỉnh - đáy liên tiếp): sóng sin lặp lại về hai phía" });

// ---------------------------------------------------------------- DU BAO + DO LUONG ----------
const viThe = (h, P, D) => {
  const e = D[0].p, t = D[1].p, s = D[2].p, x1 = Math.min(P[0].x, P[1].x), x2 = Math.max(P[0].x, P[1].x, x1 + 90);
  const yE = P[0].y, yT = P[1].y, yS = P[2].y, rr = Math.abs(e - s) > 0 ? Math.abs(t - e) / Math.abs(e - s) : 0;
  return [
    DA([{ x: x1, y: yE }, { x: x2, y: yE }, { x: x2, y: yT }, { x: x1, y: yT }], { dong: true, to: 0.18, mau: XANH, vien: false }),
    DA([{ x: x1, y: yE }, { x: x2, y: yE }, { x: x2, y: yS }, { x: x1, y: yS }], { dong: true, to: 0.18, mau: DO, vien: false }),
    L({ x: x1, y: yT }, { x: x2, y: yT }, { mau: XANH, dam: 1 }), L({ x: x1, y: yS }, { x: x2, y: yS }, { mau: DO, dam: 1 }), L({ x: x1, y: yE }, { x: x2, y: yE }, { mau: "#B2B5BE", dam: 1 }),
    CH((x1 + x2) / 2, yT + (yT < yE ? -10 : 10), `Mục tiêu: ${t >= e ? "+" : ""}${soVN(phanTram(e, t), 2)}% (${gia(t)})`, { canh: "giua", nen: XANH, mauChu: "#06240F", co: 11 }),
    CH((x1 + x2) / 2, yS + (yS < yE ? -10 : 10), `Cắt lỗ: ${s >= e ? "+" : ""}${soVN(phanTram(e, s), 2)}% (${gia(s)})`, { canh: "giua", nen: DO, mauChu: "#fff", co: 11 }),
    CH((x1 + x2) / 2, yE, `R:R = ${soVN(rr, 2)}  ·  vào ${gia(e)}`, { canh: "giua", nen: true, co: 11, dam: true }),
  ];
};
dang("viTheMua", "Vị thế mua (Long)", 3, viThe, { goiY: "bấm 3 điểm: điểm vào lệnh, điểm mục tiêu, điểm cắt lỗ; tự tính % và tỷ lệ R:R" });
dang("viTheBan", "Vị thế bán (Short)", 3, viThe, { goiY: "bấm 3 điểm: điểm vào lệnh, điểm mục tiêu, điểm cắt lỗ; tự tính % và tỷ lệ R:R" });
dang("duBao", "Dự báo", 2, (h, P, D) => {
  const dp = D[1].p - D[0].p;
  return [L(P[0], P[1], { dam: 2 }), mui(P[0], P[1], 13), CHAM(P[0].x, P[0].y, { r: 3 }), CH(P[1].x + 8, P[1].y, `${dp >= 0 ? "+" : ""}${gia(dp)} (${pctVN(phanTram(D[0].p, D[1].p), 2)})`, { nen: true })];
}, { goiY: "bấm 2 điểm: mũi tên dự báo kèm chênh lệch giá" });
dang("mauThanhNen", "Mẫu thanh nến (sao chép)", 3, (h, P, D, u) => {
  const i1 = Math.max(0, Math.round(Math.min(D[0].i, D[1].i))), i2 = Math.min(u.nen.length - 1, Math.round(Math.max(D[0].i, D[1].i)));
  if (i2 - i1 < 1 || !(u.nen[i1]?.c > 0)) return [L(P[0], P[1])];
  const pts = [];
  for (let j = i1; j <= i2; j++) {
    const x = u.xI(D[2].i + (j - i1)), y = u.yP((D[2].p * u.nen[j].c) / u.nen[i1].c);
    if (x != null && y != null) pts.push({ x, y });
  }
  return [DA([{ x: u.xI(i1), y: 0 }, { x: u.xI(i2), y: 0 }, { x: u.xI(i2), y: u.H }, { x: u.xI(i1), y: u.H }], { dong: true, to: 0.06, net: "dut", dam: 1 }), DA(pts, { dam: 2 }), CHAM(P[2].x, P[2].y, { r: 3 })];
}, { goiY: "bấm 3 điểm: nến đầu, nến cuối của đoạn cần sao chép, rồi điểm đặt; vẽ lại đường giá đóng cửa của đoạn đó tại vị trí mới" });
dang("phepChieu", "Phép chiếu", 3, (h, P) => {
  const v = tru(P[1], P[0]), e = cong(P[2], v);
  return [L(P[0], P[1], { dam: 2 }), mui(P[0], P[1], 11), L(P[2], e, { net: "dut", dam: 2 }), mui(P[2], e, 11), L(P[1], P[2], { net: "dut", dam: 1, alpha: 0.6 })];
}, { goiY: "bấm 3 điểm: nhịp ban đầu (1-2), rồi điểm bắt đầu của nhịp được chiếu lặp lại" });
dang("vwapNeo", "VWAP neo", 1, (h, P, D, u) => {
  const i0 = Math.max(0, Math.round(D[0].i)), pts = [];
  let spv = 0, sv = 0;
  for (let j = i0; j < u.nen.length; j++) {
    const b = u.nen[j], v = b.v > 0 ? b.v : 0;
    spv += ((b.h + b.l + b.c) / 3) * v;
    sv += v;
    if (sv > 0) {
      const x = u.xI(j), y = u.yP(spv / sv);
      if (x != null && y != null) pts.push({ x, y });
    }
  }
  return [CHAM(P[0].x, P[0].y, { r: 4 }), CH(P[0].x + 8, P[0].y - 12, "VWAP neo", { nen: true }), ...(pts.length > 1 ? [DA(pts, { dam: 2 })] : [])];
}, { goiY: "bấm 1 điểm: đường VWAP tính từ nến được chọn trở đi" });
const hcn = (a, b) => [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }];
dang("vungGia", "Vùng giá", 2, (h, P, D) => {
  const dp = D[1].p - D[0].p, m = mid(P[0], P[1]);
  return [DA(hcn(P[0], P[1]), { dong: true, to: 0.14 }), L(m, { x: m.x, y: P[1].y }, { dam: 1 }), CH(m.x, P[1].y + (dp >= 0 ? -12 : 12), `${dp >= 0 ? "+" : ""}${gia(dp)} (${pctVN(phanTram(D[0].p, D[1].p), 2)})`, { canh: "giua", nen: true })];
}, { goiY: "bấm 2 điểm: vùng giá kèm chênh lệch và %" });
dang("vungNgay", "Vùng ngày", 2, (h, P, D, u) => {
  const n = Math.abs(Math.round(D[1].i - D[0].i)), m = (P[0].x + P[1].x) / 2;
  return [DA([{ x: P[0].x, y: 0 }, { x: P[1].x, y: 0 }, { x: P[1].x, y: u.H }, { x: P[0].x, y: u.H }], { dong: true, to: 0.1 }), CH(m, P[0].y, `${n} nến`, { canh: "giua", nen: true })];
}, { goiY: "bấm 2 điểm: vùng thời gian kèm số nến" });
dang("vungGiaNgay", "Vùng giá và ngày", 2, (h, P, D) => {
  const dp = D[1].p - D[0].p, n = Math.abs(Math.round(D[1].i - D[0].i)), m = mid(P[0], P[1]);
  return [DA(hcn(P[0], P[1]), { dong: true, to: 0.14 }), CH(m.x, m.y, `${dp >= 0 ? "+" : ""}${gia(dp)} (${pctVN(phanTram(D[0].p, D[1].p), 2)}) · ${n} nến`, { canh: "giua", nen: true })];
}, { goiY: "bấm 2 điểm: hình chữ nhật kèm chênh lệch giá, % và số nến" });

// ---------------------------------------------------------------- HINH VE ----------
dang("co", "Cọ vẽ", "tuDo", (h, P) => (P.length > 1 ? [DA(P, { dam: 2 })] : []), { tuDo: true, goiY: "nhấn giữ chuột và kéo để vẽ tự do" });
dang("butDanhDau", "Bút đánh dấu", "tuDo", (h, P) => (P.length > 1 ? [DA(P, { dam: 14, alpha: 0.32 })] : []), { tuDo: true, goiY: "nhấn giữ chuột và kéo để tô nổi bật" });
dang("chuNhatXoay", "Hình chữ nhật xoay", 3, (h, P) => {
  const v = tru(P[1], P[0]), len = Math.hypot(v.x, v.y) || 1, n = { x: -v.y / len, y: v.x / len }, w = (P[2].x - P[0].x) * n.x + (P[2].y - P[0].y) * n.y;
  return [DA([P[0], P[1], cong(P[1], nhan(n, w)), cong(P[0], nhan(n, w))], { dong: true, to: 0.14 })];
}, { goiY: "bấm 3 điểm: hai điểm của một cạnh, rồi điểm xác định độ rộng" });
dang("tronTron", "Hình tròn", 2, (h, P) => { const r = Math.hypot(P[1].x - P[0].x, P[1].y - P[0].y); return [ELIP(P[0].x, P[0].y, r, r, { to: 0.12 }), L(P[0], P[1], { net: "dut", dam: 1 })]; }, { goiY: "bấm 2 điểm: tâm và một điểm trên đường tròn" });
dang("elip", "Hình elip", 2, (h, P) => { const m = mid(P[0], P[1]); return [ELIP(m.x, m.y, Math.abs(P[1].x - P[0].x) / 2, Math.abs(P[1].y - P[0].y) / 2, { to: 0.12 })]; }, { goiY: "bấm 2 điểm: hai góc đối diện của khung chứa elip" });
dang("tamGiacHinh", "Hình tam giác", 3, (h, P) => [DA(P, { dong: true, to: 0.12 })], { goiY: "bấm 3 điểm: ba đỉnh" });
dang("daGiac", "Đa giác", "nhieu", (h, P) => (P.length > 1 ? [DA(P, { dong: P.length > 2, to: 0.12 })] : []), { dong: true, goiY: "bấm từng đỉnh, bấm chuột phải / bấm đúp / Enter để khép kín" });
dang("cung", "Cung", 3, (h, P) => {
  const [a, b, c] = P, d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-6) return [L(a, c)];
  const ux = ((a.x ** 2 + a.y ** 2) * (b.y - c.y) + (b.x ** 2 + b.y ** 2) * (c.y - a.y) + (c.x ** 2 + c.y ** 2) * (a.y - b.y)) / d, uy = ((a.x ** 2 + a.y ** 2) * (c.x - b.x) + (b.x ** 2 + b.y ** 2) * (a.x - c.x) + (c.x ** 2 + c.y ** 2) * (b.x - a.x)) / d;
  const r = Math.hypot(a.x - ux, a.y - uy), A0 = Math.atan2(a.y - uy, a.x - ux), A1 = Math.atan2(b.y - uy, b.x - ux), A2 = Math.atan2(c.y - uy, c.x - ux);
  const nor = (v) => ((v % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), d1 = nor(A1 - A0), d2 = nor(A2 - A0), tang = d1 <= d2;
  return [DA(cungTron(ux, uy, r, A0, tang ? A0 + d2 : A0 - (2 * Math.PI - d2), 60), {})];
}, { goiY: "bấm 3 điểm: điểm đầu, một điểm trên cung, điểm cuối" });
dang("duongCong", "Đường cong", 2, (h, P) => {
  const m = mid(P[0], P[1]), v = tru(P[1], P[0]), len = Math.hypot(v.x, v.y) || 1, c = { x: m.x - (v.y / len) * len * 0.3, y: m.y + (v.x / len) * len * 0.3 }, pts = [];
  for (let k = 0; k <= 40; k++) { const t = k / 40; pts.push({ x: (1 - t) ** 2 * P[0].x + 2 * (1 - t) * t * c.x + t * t * P[1].x, y: (1 - t) ** 2 * P[0].y + 2 * (1 - t) * t * c.y + t * t * P[1].y }); }
  return [DA(pts, {})];
}, { goiY: "bấm 2 điểm: đường cong bậc hai" });
dang("duongCongKep", "Đường cong kép", 2, (h, P) => {
  const dx = P[1].x - P[0].x, c1 = { x: P[0].x + dx / 2, y: P[0].y }, c2 = { x: P[1].x - dx / 2, y: P[1].y }, pts = [];
  for (let k = 0; k <= 40; k++) { const t = k / 40, a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, c = 3 * (1 - t) * t * t, d = t ** 3; pts.push({ x: a * P[0].x + b * c1.x + c * c2.x + d * P[1].x, y: a * P[0].y + b * c1.y + c * c2.y + d * P[1].y }); }
  return [DA(pts, {})];
}, { goiY: "bấm 2 điểm: đường cong hình chữ S" });

// ---------------------------------------------------------------- VAN BAN + GHI CHU ----------
dang("chuNeo", "Chữ neo", 1, (h, P) => [CHAM(P[0].x, P[0].y, { r: 3 }), CH(P[0].x + 8, P[0].y, h.chu || "", { nen: true, co: 13, dam: true })], { hoiChu: "Nội dung chữ:", goiY: "bấm 1 điểm rồi nhập nội dung: chữ có nền, neo tại điểm đó" });
dang("ghiChu", "Ghi chú (note)", 1, (h, P) => [L(P[0], { x: P[0].x, y: P[0].y - 22 }, { dam: 1 }), CHAM(P[0].x, P[0].y, { r: 3 }), CH(P[0].x, P[0].y - 34, h.chu || "", { canh: "giua", nen: "#FFEB3B", mauChu: "#1F2937", co: 12 })], { hoiChu: "Nội dung ghi chú:", goiY: "bấm 1 điểm rồi nhập nội dung: tờ ghi chú vàng" });
dang("ghiChuGia", "Ghi chú giá", 1, (h, P, D) => [L(P[0], { x: P[0].x + 10, y: P[0].y }, { dam: 1 }), CHAM(P[0].x, P[0].y, { r: 3 }), CH(P[0].x + 12, P[0].y, `${gia(D[0].p)}${h.chu ? " · " + h.chu : ""}`, { nen: true, co: 12 })], { hoiChu: "Nội dung (có thể để trống):", chuTuyChon: true, goiY: "bấm 1 điểm: nhãn ghi giá tại điểm đó (có thể thêm chữ)" });
dang("ghim", "Ghim", 1, (h, P) => [L(P[0], { x: P[0].x, y: P[0].y - 22 }, { dam: 1.5 }), CHAM(P[0].x, P[0].y - 26, { r: 7 }), ...(h.chu ? [CH(P[0].x + 12, P[0].y - 26, h.chu, { nen: true })] : [])], { hoiChu: "Nội dung (có thể để trống):", chuTuyChon: true, goiY: "bấm 1 điểm: ghim đánh dấu (có thể kèm chữ)" });
dang("chuThichBong", "Chú thích (callout)", 2, (h, P) => [L(P[0], P[1], { dam: 1 }), CHAM(P[0].x, P[0].y, { r: 3 }), CH(P[1].x, P[1].y, h.chu || "", { canh: "giua", nen: true, co: 12 })], { hoiChu: "Nội dung chú thích:", hoiChu2: true, goiY: "bấm 2 điểm: điểm cần chú thích, rồi vị trí của khung chữ" });
dang("binhLuan", "Bình luận", 1, (h, P) => [L(P[0], { x: P[0].x, y: P[0].y - 10 }, { dam: 1 }), CH(P[0].x, P[0].y - 22, `💬 ${h.chu || ""}`, { canh: "giua", nen: true, co: 12 })], { hoiChu: "Nội dung bình luận:", goiY: "bấm 1 điểm rồi nhập nội dung" });
dang("nhanGia", "Nhãn giá", 1, (h, P, D) => [CHAM(P[0].x, P[0].y, { r: 3 }), CH(P[0].x + 8, P[0].y, gia(D[0].p), { nen: true, co: 12, dam: true })], { goiY: "bấm 1 điểm: nhãn ghi đúng mức giá tại điểm đó" });
dang("bienBao", "Biển báo", 1, (h, P) => [L(P[0], { x: P[0].x, y: P[0].y - 34 }, { dam: 1.5 }), CH(P[0].x, P[0].y - 46, h.chu || "", { canh: "giua", nen: true, co: 12, dam: true })], { hoiChu: "Nội dung biển báo:", goiY: "bấm 1 điểm rồi nhập nội dung" });
dang("coHieu", "Cờ đánh dấu", 1, (h, P) => [L(P[0], { x: P[0].x, y: P[0].y - 32 }, { dam: 1.5 }), DA([{ x: P[0].x, y: P[0].y - 32 }, { x: P[0].x + 20, y: P[0].y - 25 }, { x: P[0].x, y: P[0].y - 18 }], { dong: true, to: 0.9 }), ...(h.chu ? [CH(P[0].x + 24, P[0].y - 25, h.chu, { nen: true })] : [])], { hoiChu: "Nội dung (có thể để trống):", chuTuyChon: true, goiY: "bấm 1 điểm: lá cờ đánh dấu (có thể kèm chữ)" });
dang("muiKhoi", "Mũi tên khối", 2, (h, P) => {
  const v = tru(P[1], P[0]), len = Math.hypot(v.x, v.y) || 1, u1 = nhan(v, 1 / len), n = { x: -u1.y, y: u1.x }, w = 4, hw = 11, hl = Math.min(22, len * 0.5);
  const base = cong(P[1], nhan(u1, -hl));
  return [DA([cong(P[0], nhan(n, w)), cong(base, nhan(n, w)), cong(base, nhan(n, hw)), P[1], cong(base, nhan(n, -hw)), cong(base, nhan(n, -w)), cong(P[0], nhan(n, -w))], { dong: true, to: 0.85 })];
}, { goiY: "bấm 2 điểm: mũi tên khối" });
dang("muiLenCT", "Mũi tên lên", 1, (h, P) => [DA([{ x: P[0].x, y: P[0].y }, { x: P[0].x + 9, y: P[0].y + 13 }, { x: P[0].x + 3.5, y: P[0].y + 13 }, { x: P[0].x + 3.5, y: P[0].y + 30 }, { x: P[0].x - 3.5, y: P[0].y + 30 }, { x: P[0].x - 3.5, y: P[0].y + 13 }, { x: P[0].x - 9, y: P[0].y + 13 }], { dong: true, to: 1, mau: XANH })], { goiY: "bấm 1 điểm: mũi tên lên (đánh dấu điểm mua)" });
dang("muiXuongCT", "Mũi tên xuống", 1, (h, P) => [DA([{ x: P[0].x, y: P[0].y }, { x: P[0].x + 9, y: P[0].y - 13 }, { x: P[0].x + 3.5, y: P[0].y - 13 }, { x: P[0].x + 3.5, y: P[0].y - 30 }, { x: P[0].x - 3.5, y: P[0].y - 30 }, { x: P[0].x - 3.5, y: P[0].y - 13 }, { x: P[0].x - 9, y: P[0].y - 13 }], { dong: true, to: 1, mau: DO })], { goiY: "bấm 1 điểm: mũi tên xuống (đánh dấu điểm bán)" });

// ---------------------------------------------------------------- BIEU TUONG CAM XUC ----------
export const DS_BIEU_TUONG = [["emojiTang", "🚀", "Tên lửa"], ["emojiLua", "🔥", "Lửa"], ["emojiTien", "💰", "Túi tiền"], ["emojiCanhBao", "⚠️", "Cảnh báo"], ["emojiDung", "✅", "Đúng"], ["emojiSai", "❌", "Sai"], ["emojiLike", "👍", "Thích"], ["emojiDislike", "👎", "Không thích"], ["emojiCuoi", "😀", "Cười"], ["emojiBuon", "😢", "Buồn"], ["emojiNgac", "😮", "Ngạc nhiên"], ["emojiMat", "👀", "Để mắt"]];
for (const [khoa, ky, ten] of DS_BIEU_TUONG) dang(khoa, `${ky} ${ten}`, 1, (h, P) => [CH(P[0].x, P[0].y, ky, { canh: "giua", co: 26 })], { goiY: `bấm 1 điểm: đặt biểu tượng ${ky}` });

// ---------------------------------------------------------------- CACH BO TRI NHOM (thanh ben trai) ----------
// Chuoi bat dau bang "#" = tieu de tieu muc trong danh sach xo xuong. Cong cu cu (xuHuong, tia, ngang, doc, kenh, fib, fibMoRong, chuNhat, gapKhuc, thuoc, frvp, mui, chu) van do veBieuDoLop xu ly rieng.
export const NHOM_CONG_CU = [
  { khoa: "duong", nhan: "Đường xu hướng", ds: ["#Đường", "xuHuong", "tia", "thongTinDuong", "duongKeoDai", "gocXuHuong", "ngang", "tiaNgang", "doc", "duongCat", "#Kênh", "kenh", "hoiQuy", "dinhDayPhang", "kenhRoi", "#Cây chĩa", "cayChia", "cayChiaSchiff", "cayChiaSchiffSua", "quatCayChia"] },
  { khoa: "fib", nhan: "Fibonacci và Gann", ds: ["#Fibonacci", "fib", "fibMoRong", "kenhFib", "vungThoiGianFib", "quatFib", "thoiGianFibXuHuong", "vongFib", "xoanOcFib", "cungFib", "#Gann", "hopGann", "oVuongGann", "quatGann"] },
  { khoa: "mauhinh", nhan: "Mẫu hình", ds: ["#Mẫu hình", "xabcd", "cypher", "abcd", "tamGiacMH", "baLucDay", "vaiDauVai", "#Sóng Elliott", "elliottXungLuc", "elliottDieuChinh", "elliottTamGiac", "elliottKepDoi", "elliottBaPhuc", "#Chu kỳ", "chuKy", "chuKyThoiGian", "duongSin"] },
  { khoa: "dubao", nhan: "Dự báo và đo lường", ds: ["#Dự báo", "viTheMua", "viTheBan", "duBao", "mauThanhNen", "phepChieu", "vwapNeo", "frvp", "#Đo lường", "thuoc", "vungGia", "vungNgay", "vungGiaNgay"] },
  { khoa: "hinh", nhan: "Hình vẽ", ds: ["#Bút", "co", "butDanhDau", "#Hình", "chuNhat", "chuNhatXoay", "tronTron", "elip", "tamGiacHinh", "daGiac", "gapKhuc", "#Đường cong", "cung", "duongCong", "duongCongKep"] },
  { khoa: "vanban", nhan: "Văn bản và ghi chú", ds: ["#Văn bản", "chu", "chuNeo", "ghiChu", "ghiChuGia", "ghim", "chuThichBong", "binhLuan", "nhanGia", "bienBao", "coHieu", "#Mũi tên", "mui", "muiKhoi", "muiLenCT", "muiXuongCT"] },
  { khoa: "bieutuong", nhan: "Biểu tượng cảm xúc", ds: DS_BIEU_TUONG.map(([k]) => k) },
];
