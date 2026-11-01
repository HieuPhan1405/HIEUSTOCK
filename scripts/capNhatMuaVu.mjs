// SINH lib/muaVuDuLieu.js: loi suat THANG cua VN-Index + chi so tung nganh (TB cong loi suat thang cac ma cung nganh, moi thang can >= 3 ma co gia ca 2 dau thang) tu 2013, cho bang nhiet
// "Mua vu" o tab Boi canh trang Danh gia danh muc. Lich su gan nhu khong doi nen luu TINH trong repo; chay lai sau moi thang hoac khi them ma / nganh:
//   node scripts/capNhatMuaVu.mjs      (can engine/output/nen_dai.json, vnindex_dai.json, nganh_map.json)
// Luu y: chi gom cac ma DANG niem yet (nen_dai) nen lich su nganh co thien lech nguoi song sot (ma da huy niem yet / ma kem bi loai khong co mat).
import { readFileSync, writeFileSync } from "node:fs";
import { NGANH_NHAN } from "../lib/nganh.js";

const doc = (f) => JSON.parse(readFileSync(new URL(`../engine/output/${f}`, import.meta.url), "utf8"));
const nenDai = doc("nen_dai.json");
const vni = doc("vnindex_dai.json");
const nganhMap = doc("nganh_map.json");
const r1 = (x) => (Number.isFinite(x) ? +x.toFixed(1) : null);

// dong cua cuoi thang cua 1 chuoi nen
const cuoiThang = (bars) => {
  const m = new Map();
  for (const b of bars) m.set(b.t.slice(0, 7), b.c);
  return m;
};
const thangVni = cuoiThang(vni);
const dsThang = [...thangVni.keys()].sort();
const thangCuoi = dsThang.at(-1);
const ngayCuoi = vni.at(-1).t;
const khoaNam = (k) => k.slice(0, 4);
const nam = [...new Set(dsThang.map(khoaNam))];

const baNgayCuoiThang = (k) => { const [y, m] = k.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
const thangChuaDu = +ngayCuoi.slice(8, 10) < baNgayCuoiThang(thangCuoi) - 4; // thang cuoi con dang chay (chua gan het thang)

// mang 12 thang theo nam: loiSuat(k) -> % | null
function bangNam(loiSuat) {
  const kq = {};
  for (const y of nam) {
    const a = Array.from({ length: 12 }, (_, m) => r1(loiSuat(`${y}-${String(m + 1).padStart(2, "0")}`)));
    if (a.every((x) => x == null)) continue;
    // ca nam = nhan cac thang co du lieu (bo qua o trong)
    let v = 1, co = false;
    for (const x of a) if (x != null) { v *= 1 + x / 100; co = true; }
    kq[y] = [...a, co ? r1((v - 1) * 100) : null];
  }
  return kq;
}
const truoc = (k) => { const [y, m] = k.split("-").map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`; };

const vniBang = bangNam((k) => (thangVni.has(k) && thangVni.has(truoc(k)) ? (thangVni.get(k) / thangVni.get(truoc(k)) - 1) * 100 : null));

// ---- nganh
const theoNganh = new Map();
for (const [ma, bars] of Object.entries(nenDai)) {
  const g = nganhMap[ma];
  if (!g || !NGANH_NHAN[g]) continue;
  if (!theoNganh.has(g)) theoNganh.set(g, []);
  theoNganh.get(g).push(cuoiThang(bars));
}
const nganhBang = {};
const soMa = {};
for (const [g, maps] of [...theoNganh].sort()) {
  const nhan = NGANH_NHAN[g];
  soMa[nhan] = maps.length;
  nganhBang[nhan] = bangNam((k) => {
    const p = truoc(k);
    let s = 0, n = 0;
    for (const m of maps) { const a = m.get(p), b = m.get(k); if (a > 0 && b > 0) { s += b / a - 1; n++; } }
    return n >= 3 ? (s / n) * 100 : null;
  });
}

// ---- do on dinh: tuong quan TB thang nua dau (<= 2019) vs nua sau (>= 2020) cua cac thang (1 = mua vu on dinh, 0 = ngau nhien)
const tbThang = (bang, loc) => Array.from({ length: 12 }, (_, m) => {
  const a = Object.entries(bang).filter(([y]) => loc(y)).map(([, v]) => v[m]).filter((x) => x != null);
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
});
const tuongQuan = (bang) => {
  const x = tbThang(bang, (y) => y <= "2019"), y = tbThang(bang, (yy) => yy >= "2020");
  const ok = x.map((v, i) => v != null && y[i] != null);
  const X = x.filter((_, i) => ok[i]), Y = y.filter((_, i) => ok[i]);
  if (X.length < 8) return null;
  const mx = X.reduce((s, v) => s + v, 0) / X.length, my = Y.reduce((s, v) => s + v, 0) / Y.length;
  const c = X.reduce((s, v, i) => s + (v - mx) * (Y[i] - my), 0);
  const d = Math.sqrt(X.reduce((s, v) => s + (v - mx) ** 2, 0) * Y.reduce((s, v) => s + (v - my) ** 2, 0));
  return d > 0 ? +(c / d).toFixed(2) : null;
};
const onDinh = { "VN-Index": tuongQuan(vniBang), ...Object.fromEntries(Object.entries(nganhBang).map(([g, b]) => [g, tuongQuan(b)])) };

const du = { capNhat: ngayCuoi, thangCuoi, thangCuoiChuaDu: thangChuaDu, vni: vniBang, nganh: nganhBang, soMa, onDinh };
const noiDung = `// DU LIEU MUA VU (bang nhiet o tab Boi canh, trang Danh gia danh muc) - SINH TU DONG bang scripts/capNhatMuaVu.mjs, KHONG sua tay.
// Moi nam: 12 loi suat thang (%) + loi suat ca nam (phan tu thu 13); null = chua co du lieu. Nganh = TB cong loi suat thang cac ma cung nganh (>= 3 ma / thang).
// onDinh = tuong quan TB thang cua nua dau (<= 2019) va nua sau (>= 2020): ~0 hoac am = mua vu KHONG on dinh.
export const MUA_VU = ${JSON.stringify(du)};
`;
writeFileSync(new URL("../lib/muaVuDuLieu.js", import.meta.url), noiDung);
console.log(`Da ghi lib/muaVuDuLieu.js (${Math.round(noiDung.length / 1024)} KB): VN-Index ${Object.keys(vniBang).length} nam, ${Object.keys(nganhBang).length} nganh, du lieu den ${ngayCuoi}${thangChuaDu ? " (thang cuoi chua du)" : ""}`);
console.log("on dinh (tuong quan nua dau vs nua sau):", JSON.stringify(onDinh));
