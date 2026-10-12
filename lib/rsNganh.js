// XEP HANG SUC MANH NGANH (RS NGANH) tu du lieu quet ~390 ma (ham THUAN, import tuong doi de test tay: engine/test/rsNganh.test.mjs).
// RS20 cua nganh = TRUNG VI cua rs_vni cac ma trong nganh (rs_vni = chenh lech loi suat 20 phien cua ma so voi VN-Index, diem phan tram).
// RS60 = nhu RS20 nhung 60 phien (cot rs_vni_60). `cacMa` = cac ma trong nganh xep theo RS20 (de bang hien "ma manh nhat trong nganh") - chi gom gia/RS/thanh khoan, khong co tin hieu.
import { NGANH_NHAN } from "./nganh.js";

const SO_MA_TOI_THIEU = 3;
const hopLe = (x) => x != null && Number.isFinite(Number(x));
const trungBinh = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
function trungVi(a) {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const g = s.length >> 1;
  return s.length % 2 ? s[g] : (s[g - 1] + s[g]) / 2;
}
const tyLe = (ds, dieuKien, mau) => {
  const co = ds.filter(mau);
  return co.length ? (co.filter(dieuKien).length / co.length) * 100 : null;
};

// ds: cac dong tin hieu da chuan hoa (khong gom VNINDEX). Tra ve mang da xep theo RS20 giam dan, kem `hang` (1 = manh nhat).
export function tinhRSNganh(ds) {
  const theoNganh = {};
  for (const r of ds) if (r.nganh) (theoNganh[r.nganh] ||= []).push(r);
  const hang = Object.entries(theoNganh)
    .filter(([, v]) => v.length >= SO_MA_TOI_THIEU)
    .map(([khoa, v]) => {
      const doi = v.map((r) => r.doi).filter(hopLe).map(Number);
      const rs = v.map((r) => r.rs_vni).filter(hopLe).map(Number);
      const rs60 = v.map((r) => r.rs_vni_60).filter(hopLe).map(Number);
      const cacMa = v
        .map((r) => ({ ma: r.ma, rs20: hopLe(r.rs_vni) ? Number(r.rs_vni) : null, rs60: hopLe(r.rs_vni_60) ? Number(r.rs_vni_60) : null, doi: hopLe(r.doi) ? Number(r.doi) : null, gtgd: hopLe(r.gtgd_tb20) ? Number(r.gtgd_tb20) : null }))
        .sort((a, b) => (b.rs20 ?? -1e9) - (a.rs20 ?? -1e9));
      const ma50 = v.map((r) => r.breadth_nganh).filter(hopLe).map(Number);
      return {
        khoa,
        nhan: NGANH_NHAN[khoa] || khoa,
        soMa: v.length,
        doiTB: trungBinh(doi),
        tyTang: doi.length ? (doi.filter((x) => x > 0).length / doi.length) * 100 : null,
        rs20: trungVi(rs),
        rs60: trungVi(rs60),
        cacMa,
        trenKijun: tyLe(v, (r) => r.gia > r.kijun, (r) => r.kijun > 0 && r.gia > 0),
        trenCanBang: tyLe(v, (r) => r.gia > r.gg_top, (r) => r.gg_top > 0 && r.gia > 0),
        trenMa50: trungBinh(ma50), // breadth_nganh la % ma trong nganh co gia > MA50 (engine tinh san, moi ma trong nganh cung 1 gia tri)
        gtgd: v.reduce((s, r) => s + (hopLe(r.gtgd_tb20) ? Number(r.gtgd_tb20) : 0), 0),
      };
    })
    .sort((a, b) => (b.rs20 ?? -1e9) - (a.rs20 ?? -1e9));
  hang.forEach((h, i) => (h.hang = i + 1));
  return hang;
}
