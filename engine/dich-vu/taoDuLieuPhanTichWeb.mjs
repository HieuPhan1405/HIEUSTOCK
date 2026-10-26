// Tao du lieu PHAN TICH CO BAN cho web: RRG nganh + moi ma (Z/F/DuPont theo quy 2026, dinh gia, "Danh gia 360") tu rrg_nganh.json + phan_tich_co_ban.json + nen_dai.json
// -> engine/output/phan_tich_web.json { ngay, rrg: {...}, ma: { HPG: {...} } }. Day len web: node engine/dich-vu/dayPhanTichCoBan.mjs (can CS_UPLOAD_API_KEY).
// "Danh gia 360" (kieu Simplize) gom 5 tru cot, moi tru 0-10 = THU HANG PHAN TRAM so voi cac ma cung loai (phi tai chinh / ngan hang-CK-BH), KHONG phai nguong tuyet doi:
//   Dinh gia   = TB(1 - hang P/E, 1 - hang P/B) (loi nhuan am = 0 diem P/E)         Tang truong = TB(hang tang LNST 4 quy, tang doanh thu 4 quy, tang LN quy)
//   Hieu qua   = TB(hang ROE, ROA, bien LNST - bien chi voi phi tai chinh)          Suc khoe    = phi tai chinh: TB(F/9, hang Z2) | tai chinh: TB(diem sinh loi/5, hang ROA)
//   Co tuc     = hang ty suat co tuc tien mat 4 quy (co tuc + LN da tra o LCTT / von hoa; 0 neu khong tra; bo qua voi ngan hang/CK/BH)
// Xep loai theo diem TB: >=6,5 Tot, >=5 Kha, >=3,5 Trung binh, con lai Yeu.
import { readFileSync, writeFileSync } from "node:fs";
import { NGANH_NHAN } from "../../lib/nganh.js";

const doc = (f) => JSON.parse(readFileSync(new URL(`../output/${f}`, import.meta.url), "utf8"));
const rrg = doc("rrg_nganh.json");
const pt = doc("phan_tich_co_ban.json");
const nen = doc("nen_dai.json");
const QUY = ["2026-03-31", "2026-06-30", "2026-09-30"];
const r1 = (x) => (Number.isFinite(x) ? +x.toFixed(1) : null);

// moi ma: quy moi nhat + gia
const ds = [];
for (const [ma, o] of Object.entries(pt)) {
  const qs = QUY.filter((q) => o.q[q]);
  if (!qs.length) continue;
  const q = qs.at(-1);
  const x = o.q[q];
  const n = nen[ma];
  const gia = n?.at(-1)?.c ?? null; // nghin dong
  const vonHoa = gia && x.coPhieu ? (gia * 1000 * x.coPhieu) / 1e9 : null; // ty dong
  const pe = vonHoa && x.lnTTM > 0 ? vonHoa / x.lnTTM : null;
  const pb = vonHoa && x.vcsh > 0 ? vonHoa / x.vcsh : null;
  const tyLeCoTuc = o.loai === "pi" && vonHoa ? (x.coTucTTM / vonHoa) * 100 : null;
  ds.push({ ma, o, qs, q, x, gia, vonHoa, pe, pb, tyLeCoTuc, nhom: o.loai === "pi" ? "pi" : "tc" });
}

// hang phan tram (0..1) trong nhom
function hang(nhom, lay) {
  const mang = ds.filter((d) => d.nhom === nhom).map((d) => [d, lay(d)]).filter(([, v]) => Number.isFinite(v));
  mang.sort((a, b) => a[1] - b[1]);
  const m = new Map();
  mang.forEach(([d], i) => m.set(d, mang.length > 1 ? i / (mang.length - 1) : 0.5));
  return m;
}
const tb = (a) => {
  const v = a.filter((x) => Number.isFinite(x));
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};
const H = {};
for (const nhom of ["pi", "tc"]) {
  H[nhom] = {
    pe: hang(nhom, (d) => (d.pe > 0 ? d.pe : NaN)),
    pb: hang(nhom, (d) => (d.pb > 0 ? d.pb : NaN)),
    ln: hang(nhom, (d) => d.x.lnTTMYoY),
    dt: hang(nhom, (d) => d.x.dtTTMYoY),
    lq: hang(nhom, (d) => d.x.lnQuyYoY),
    roe: hang(nhom, (d) => d.x.roe),
    roa: hang(nhom, (d) => d.x.roa),
    bien: hang(nhom, (d) => d.x.bienLN),
    z: hang(nhom, (d) => d.x.z2),
    ct: hang(nhom, (d) => d.tyLeCoTuc),
  };
}
// trung vi P/E, P/B theo nganh (chi ma co gia tri hop le)
const trungVi = (a) => {
  const s = a.filter((x) => Number.isFinite(x)).sort((x, y) => x - y);
  return s.length >= 3 ? s[s.length >> 1] : null;
};
const theoNganh = {};
for (const d of ds) (theoNganh[d.o.nganh] ??= []).push(d);

const nhanDiem = (t) => (t >= 6.5 ? "Tốt" : t >= 5 ? "Khá" : t >= 3.5 ? "Trung bình" : "Yếu");
const ma = {};
for (const d of ds) {
  const h = H[d.nhom];
  const get = (k) => h[k].get(d);
  const peDiem = d.pe > 0 ? 1 - get("pe") : d.x.lnTTM <= 0 ? 0 : null;
  const sc = (v) => (Number.isFinite(v) ? r1(v * 10) : null);
  const tru = {
    dinhGia: sc(tb([peDiem, d.pb > 0 ? 1 - get("pb") : null])),
    tangTruong: sc(tb([get("ln"), get("dt"), get("lq")])),
    hieuQua: sc(tb(d.nhom === "pi" ? [get("roe"), get("roa"), get("bien")] : [get("roe"), get("roa")])),
    sucKhoe: sc(d.nhom === "pi" ? tb([d.x.f / 9, get("z")]) : tb([d.x.sinhLoi / 5, get("roa")])),
    coTuc: d.nhom === "pi" ? sc(d.tyLeCoTuc > 0 ? get("ct") : 0) : null,
  };
  const tong = tb(Object.values(tru).filter((x) => x != null));
  const cungNganh = theoNganh[d.o.nganh] ?? [];
  const q = {};
  for (const k of d.qs) {
    const { coPhieu, ...con } = d.o.q[k];
    if (con.fChiTiet) con.fChiTiet = con.fChiTiet.map((c) => c[1]); // [true/false/null x 9] theo thu tu 9 tieu chi
    q[k] = con;
  }
  ma[d.ma] = {
    nganh: d.o.nganh,
    nhanNganh: NGANH_NHAN[d.o.nganh] || d.o.nganh,
    loai: d.o.loai,
    quyMoi: d.q,
    q,
    gia: d.gia,
    dinhGia: {
      vonHoa: d.vonHoa == null ? null : Math.round(d.vonHoa),
      pe: r1(d.pe),
      pb: r1(d.pb),
      peNganh: r1(trungVi(cungNganh.map((c) => c.pe))),
      pbNganh: r1(trungVi(cungNganh.map((c) => c.pb))),
      tyLeCoTuc: r1(d.tyLeCoTuc),
      soMaNganh: cungNganh.length,
    },
    d360: { ...tru, tong: r1(tong), xepLoai: tong == null ? null : nhanDiem(tong) },
  };
}
const du = {
  ngay: rrg.ngay,
  rrg: { ngay: rrg.ngay, tuanCuoi: rrg.tuanCuoi, chuoi: rrg.chuoi, ketQua: rrg.ketQua.map((k) => ({ ...k, nhan: NGANH_NHAN[k.nganh] || k.nganh })) },
  ma,
};
writeFileSync(new URL("../output/phan_tich_web.json", import.meta.url), JSON.stringify(du));
const kb = Math.round(JSON.stringify(du).length / 1024);
console.log(`Da ghi phan_tich_web.json: ${Object.keys(ma).length} ma, ${kb} KB`);
for (const m of ["HPG", "FPT", "VCB", "DGC"]) console.log(m, JSON.stringify({ ...ma[m].dinhGia, ...ma[m].d360 }));
const xl = {};
for (const x of Object.values(ma)) xl[x.d360.xepLoai] = (xl[x.d360.xepLoai] ?? 0) + 1;
console.log("xep loai:", xl);
