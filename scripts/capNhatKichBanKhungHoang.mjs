// SINH lib/kichBanKhungHoangDuLieu.js: KIEM TRA SUC CHIU DUNG THEO CAC DOT KHUNG HOANG THAT cua VN-Index (trang /danh-gia-danh-muc, tab Rui ro).
// Moi dot: tu ngay DINH den ngay DAY cua VN-Index (gia dong cua). Moi ma: % thay doi gia (da dieu chinh co tuc) giua dung 2 ngay do - danh muc hien tai neu dot do lap lai.
// Ma chua niem yet / chua co gia o ngay dinh -> null (web uoc theo beta x VN-Index va ghi ro). Nguon: engine/output/nen_dai.json + vnindex_dai.json (ma web dang quet).
// Chay lai sau khi tai lai nen (engine/dich-vu/taiDuLieuDai.mjs) hoac khi them dot moi:  node scripts/capNhatKichBanKhungHoang.mjs
import { readFileSync, writeFileSync } from "node:fs";

const doc = (f) => JSON.parse(readFileSync(new URL(`../engine/output/${f}`, import.meta.url), "utf8"));
const nen = doc("nen_dai.json");
const vni = doc("vnindex_dai.json");

// [id, ten, tim dinh tu, tim day den] - dinh = gia dong cao nhat truoc ngay day trong khoang; day = gia dong thap nhat trong khoang
const DOT = [
  ["2015", "Phá giá nhân dân tệ 2015", "2015-06-01", "2015-08-31"],
  ["2018", "Điều chỉnh sau đỉnh 2018", "2018-04-01", "2018-07-31"],
  ["2020", "Đại dịch Covid-19 2020", "2020-01-01", "2020-03-31"],
  ["2022", "Khủng hoảng trái phiếu 2022", "2022-01-01", "2022-11-30"],
  ["2025", "Cú sốc thuế quan 4/2025", "2025-03-01", "2025-04-30"],
  ["2026", "Điều chỉnh đầu 2026", "2026-01-01", "2026-03-31"],
];

const trong = (a, b) => vni.filter((x) => x.t >= a && x.t <= b);
const dot = DOT.map(([id, ten, a, b]) => {
  const k = trong(a, b);
  const day = k.reduce((m, x) => (x.c < m.c ? x : m), k[0]);
  const dinh = k.filter((x) => x.t <= day.t).reduce((m, x) => (x.c > m.c ? x : m), k[0]);
  return { id, ten, tu: dinh.t, den: day.t, vni: Math.round((day.c / dinh.c - 1) * 1000) / 10 };
});

const giaNgay = (bars, t) => { // gia dong cua ngay t (hoac phien gan nhat truoc do, toi da 5 phien)
  let lo = 0, hi = bars.length - 1, kq = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (bars[m].t <= t) { kq = m; lo = m + 1; } else hi = m - 1; }
  if (kq < 0) return null;
  const cach = (new Date(t) - new Date(bars[kq].t)) / 864e5;
  return cach <= 7 && bars[kq].c > 0 ? bars[kq].c : null;
};
const MA = {};
for (const [ma, bars] of Object.entries(nen)) {
  const v = dot.map((d) => {
    const a = giaNgay(bars, d.tu), b = giaNgay(bars, d.den);
    return a && b ? Math.round((b / a - 1) * 1000) / 10 : null;
  });
  if (v.some((x) => x != null)) MA[ma] = v;
}

const out = `// TU DONG SINH boi scripts/capNhatKichBanKhungHoang.mjs - KHONG sua tay. Du lieu den ${vni.at(-1).t}.
// DOT: cac dot giam manh that cua VN-Index (dinh -> day, gia dong cua); MA: % thay doi gia tung ma giua dung 2 ngay do (cung thu tu DOT), null = chua co gia.
export const DOT_KHUNG_HOANG = ${JSON.stringify(dot)};
export const KHUNG_HOANG_THEO_MA = ${JSON.stringify(MA)};
`;
writeFileSync(new URL("../lib/kichBanKhungHoangDuLieu.js", import.meta.url), out);
console.log(dot.map((d) => `${d.ten}: ${d.tu} -> ${d.den} VNI ${d.vni}%`).join("\n"));
console.log(`${Object.keys(MA).length} ma, ${(out.length / 1024).toFixed(0)}KB`);
