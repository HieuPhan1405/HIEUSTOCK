// VIN GIAM -> TRU KHAC KEO? (Hieu 2026-10-23: "co nguoi biet vin giam thi co phieu tru khac nhu BSR GAS keo"). Kiem tra bang so lieu:
// ngay VIC GIAM >= 2% (hoac VIC va VHM cung giam): cac ma tru khac (VN30, tru Vin) tang / giam bao nhieu SO VOI NGAY BINH THUONG cua chinh no, va VN-Index chiu anh huong the nao.
// Do: lai TB cua ma trong nhung ngay do, ngay thuong, chenh lech, ty le ngay xanh; rieng BSR, GAS, va ca nhom. Giai doan 2023+ (BSR niem yet 2022). CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuVinGiamTruKeo.mjs
import { docJson } from "./backtestChung.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const TU = "2023-01-01";
const rets = (nen) => { const m = new Map(); for (let i = 1; i < nen.length; i++) if (nen[i].t >= TU && nen[i - 1].c > 0) m.set(nen[i].t, (nen[i].c / nen[i - 1].c - 1) * 100); return m; };
const R = {}; for (const ma of ["VIC", "VHM", "VRE", "VPL", "BSR", "GAS", "PLX", "PVD", "PVS", "OIL", "FPT", "HPG", "VCB", "BID", "CTG", "MBB", "TCB", "VPB", "ACB", "STB", "SSI", "VNM", "MWG", "MSN", "SAB", "GVR", "VJC", "BCM", "VIB", "SHB", "HDB", "TPB", "LPB", "SSB", "VGC"]) if (cache[ma]) R[ma] = rets(cache[ma]);
const vr = (() => { const m = new Map(); for (let i = 1; i < vni.length; i++) if (vni[i].t >= TU) m.set(vni[i].t, (vni[i].c / vni[i - 1].c - 1) * 100); return m; })();
const ngay = [...vr.keys()].filter((d) => R.VIC?.has(d));
const vinGiam = (d, x) => R.VIC.get(d) <= -x;
console.log(`${ngay.length} phien tu ${TU}; VIC co ${R.VIC ? "co du lieu" : "thieu"}\n`);
for (const x of [2, 3]) {
  const nd = ngay.filter((d) => vinGiam(d, x)), thuong = ngay.filter((d) => !vinGiam(d, x));
  console.log(`######## VIC giam >= ${x}%: ${nd.length} ngay ########`);
  console.log(`   VN-Index: ${f(tb(nd.map((d) => vr.get(d))))}% (ngay thuong ${f(tb(thuong.map((d) => vr.get(d))))}%)`);
  console.log(`   VHM cung ngay: ${f(tb(nd.filter((d) => R.VHM.has(d)).map((d) => R.VHM.get(d))))}%`);
  const hang = [];
  for (const [ma, m] of Object.entries(R)) {
    if (["VIC", "VHM", "VRE", "VPL"].includes(ma)) continue;
    const a = nd.filter((d) => m.has(d)).map((d) => m.get(d)), b = thuong.filter((d) => m.has(d)).map((d) => m.get(d));
    if (a.length < 8) continue;
    hang.push({ ma, ngayVin: tb(a), ngayThuong: tb(b), chenh: tb(a) - tb(b), xanh: (a.filter((v) => v > 0).length / a.length) * 100 });
  }
  hang.sort((p, q) => q.chenh - p.chenh);
  console.log("   ma         | lai ngay VIC giam | ngay thuong | chenh | % ngay xanh | hang");
  hang.forEach((h, i) => { if (["BSR", "GAS", "PLX", "PVD", "PVS", "OIL"].includes(h.ma) || i < 5 || i >= hang.length - 3) console.log(`   ${h.ma.padEnd(10)} | ${f(h.ngayVin).padStart(17)} | ${f(h.ngayThuong).padStart(11)} | ${f(h.chenh).padStart(5)} | ${f(h.xanh, 0).padStart(10)}% | ${i + 1}/${hang.length}`); });
  const dau = hang.filter((h) => ["BSR", "GAS"].includes(h.ma));
  const nhomNgan = hang.filter((h) => ["VCB", "BID", "CTG", "MBB", "TCB", "VPB", "ACB", "STB", "HDB", "TPB", "VIB", "LPB", "SSB", "SHB"].includes(h.ma));
  console.log(`   TB nhom dau khi (BSR, GAS): chenh ${f(tb(dau.map((h) => h.chenh)))}; TB nhom ngan hang: chenh ${f(tb(nhomNgan.map((h) => h.chenh)))}; TB toan bo ma: chenh ${f(tb(hang.map((h) => h.chenh)))}\n`);
}
// ngay hom sau
const nd = ngay.filter((d) => vinGiam(d, 2));
const kt = (ma) => { const m = R[ma]; if (!m) return NaN; const t = [...vr.keys()]; const ds = []; for (const d of nd) { const i = t.indexOf(d); const n = t[i + 1]; if (n && m.has(n)) ds.push(m.get(n)); } return tb(ds); };
console.log(`Phien KE TIEP sau ngay VIC giam >= 2% (lai TB): BSR ${f(kt("BSR"))}%, GAS ${f(kt("GAS"))}%, VN-Index ${f(tb(nd.map((d) => { const t = [...vr.keys()]; const n = t[t.indexOf(d) + 1]; return n ? vr.get(n) : NaN; }).filter(Number.isFinite)))}%`);
